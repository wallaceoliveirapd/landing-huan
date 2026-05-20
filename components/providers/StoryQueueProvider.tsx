"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useMutation } from "convex/react";
import { toast } from "sonner";
import { api } from "@/convex/_generated/api";

type Phase =
  | "queued"
  | "analyzing"
  | "compressing"
  | "uploading"
  | "publishing"
  | "done"
  | "error";

type LinkInput = { url: string; label: string; color?: string; bg?: string };

export type StoryJob = {
  id: string;
  file: File;
  caption?: string;
  captionStyle?: { color?: string; bg?: string; align?: string };
  link?: LinkInput;
  phase: Phase;
  ratio?: number; // 0..1
  attempt?: number;
  error?: string;
  createdAt: number;
};

type Ctx = {
  jobs: StoryJob[];
  enqueue: (input: {
    file: File;
    caption?: string;
    captionStyle?: { color?: string; bg?: string; align?: string };
    link?: LinkInput;
  }) => string;
  dismiss: (id: string) => void;
  clearDone: () => void;
};

const StoryQueueContext = createContext<Ctx | null>(null);

export function useStoryQueue() {
  const ctx = useContext(StoryQueueContext);
  if (!ctx) throw new Error("useStoryQueue must be used inside <StoryQueueProvider>");
  return ctx;
}

export function StoryQueueProvider({ children }: { children: React.ReactNode }) {
  const [jobs, setJobs] = useState<StoryJob[]>([]);
  const jobsRef = useRef<StoryJob[]>([]);
  jobsRef.current = jobs;
  const workerRef = useRef<Worker | null>(null);
  const pendingRef = useRef<Map<string, (file: File) => void>>(new Map());
  const errorRef = useRef<Map<string, (msg: string) => void>>(new Map());
  const processingRef = useRef(false);
  const createStory = useMutation(api.stories.adminCreate);

  // Spin up the worker once per page lifetime.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const w = new Worker(
      new URL("../../lib/storyCompress.worker.ts", import.meta.url),
      { type: "module" },
    );
    workerRef.current = w;
    w.onmessage = (ev: MessageEvent) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const msg = ev.data as any;
      if (!msg?.id) return;
      if (msg.type === "progress") {
        update(msg.id, {
          phase: msg.phase === "analyzing" ? "analyzing" : "compressing",
          ratio: msg.ratio,
          attempt: msg.attempt,
        });
      } else if (msg.type === "done") {
        const resolve = pendingRef.current.get(msg.id);
        pendingRef.current.delete(msg.id);
        errorRef.current.delete(msg.id);
        if (resolve) {
          resolve(new File([msg.buffer], msg.name, { type: msg.mime }));
        }
      } else if (msg.type === "error") {
        const reject = errorRef.current.get(msg.id);
        pendingRef.current.delete(msg.id);
        errorRef.current.delete(msg.id);
        if (reject) reject(msg.message ?? "Falha ao comprimir");
      }
    };
    return () => {
      w.terminate();
      workerRef.current = null;
    };
  }, []);

  function update(id: string, patch: Partial<StoryJob>) {
    setJobs((prev) => prev.map((j) => (j.id === id ? { ...j, ...patch } : j)));
  }

  function compress(job: StoryJob): Promise<File> {
    const w = workerRef.current;
    if (!w) return Promise.reject(new Error("Worker indisponível"));
    return new Promise((resolve, reject) => {
      pendingRef.current.set(job.id, resolve);
      errorRef.current.set(job.id, (m) => reject(new Error(m)));
      w.postMessage({ type: "compress", id: job.id, file: job.file });
    });
  }

  async function probeVideoDuration(blobUrl: string): Promise<number | undefined> {
    return new Promise((resolve) => {
      const v = document.createElement("video");
      v.preload = "metadata";
      v.onloadedmetadata = () => {
        const ms = Math.round((v.duration || 0) * 1000);
        URL.revokeObjectURL(blobUrl);
        resolve(ms);
      };
      v.onerror = () => {
        URL.revokeObjectURL(blobUrl);
        resolve(undefined);
      };
      v.src = blobUrl;
    });
  }

  async function processOne(job: StoryJob) {
    try {
      const compressed = await compress(job);
      update(job.id, { phase: "uploading", ratio: 0 });
      const ext = (compressed.name.split(".").pop() ?? "").toLowerCase();

      async function presignOnce() {
        const presignRes = await fetch("/api/upload-story-presign", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contentType: compressed.type,
            size: compressed.size,
            ext,
          }),
        });
        if (!presignRes.ok) {
          const e = await presignRes.json().catch(() => ({}));
          throw new Error(e.error ?? "Falha ao iniciar upload");
        }
        return (await presignRes.json()) as {
          uploadUrl: string;
          key: string;
          url: string;
          mediaType: "image" | "video";
        };
      }

      function putToR2(uploadUrl: string): Promise<void> {
        return new Promise((resolve, reject) => {
          const xhr = new XMLHttpRequest();
          xhr.open("PUT", uploadUrl);
          xhr.setRequestHeader("Content-Type", compressed.type);
          xhr.upload.onprogress = (e) => {
            if (e.lengthComputable) {
              update(job.id, { phase: "uploading", ratio: e.loaded / e.total });
            }
          };
          xhr.onload = () => {
            if (xhr.status >= 200 && xhr.status < 300) resolve();
            else
              reject(
                new Error(
                  `R2 PUT ${xhr.status}${xhr.statusText ? ` ${xhr.statusText}` : ""}`,
                ),
              );
          };
          xhr.onerror = () =>
            reject(
              new Error(
                "R2 PUT erro de rede (verifique CORS do bucket ou conexão)",
              ),
            );
          xhr.ontimeout = () => reject(new Error("R2 PUT timeout"));
          xhr.timeout = 5 * 60 * 1000;
          xhr.send(compressed);
        });
      }

      // Try up to 3 times. Each attempt grabs a fresh presigned URL so we
      // never lose to URL expiry, and we recover from transient mobile
      // network blips (Wi-Fi → LTE handoff, brief radio loss, etc.).
      let presign = await presignOnce();
      let lastErr: unknown;
      for (let attempt = 1; attempt <= 3; attempt++) {
        try {
          await putToR2(presign.uploadUrl);
          lastErr = null;
          break;
        } catch (err) {
          lastErr = err;
          if (attempt >= 3) throw err;
          update(job.id, { phase: "uploading", ratio: 0, attempt: attempt + 1 });
          await new Promise((r) => setTimeout(r, 800 * attempt));
          presign = await presignOnce();
        }
      }
      if (lastErr) throw lastErr;
      const json = {
        key: presign.key,
        url: presign.url,
        mediaType: presign.mediaType,
      };
      update(job.id, { phase: "publishing" });
      let durationMs: number | undefined;
      if (json.mediaType === "video") {
        durationMs = await probeVideoDuration(URL.createObjectURL(compressed));
      }
      await createStory({
        mediaType: json.mediaType,
        r2Key: json.key,
        url: json.url,
        durationMs,
        caption: job.caption?.trim() || undefined,
        captionStyle: job.caption?.trim() ? job.captionStyle : undefined,
        link: job.link,
      });
      update(job.id, { phase: "done" });
      toast.success("Story publicado!");
      // Auto-remove finished jobs after a short delay.
      setTimeout(() => {
        setJobs((prev) => prev.filter((j) => j.id !== job.id));
      }, 4000);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Falhou";
      update(job.id, { phase: "error", error: msg });
      toast.error(`Story falhou: ${msg}`);
    }
  }

  // Serial processor: process next queued job whenever idle.
  useEffect(() => {
    if (processingRef.current) return;
    const next = jobs.find((j) => j.phase === "queued");
    if (!next) return;
    processingRef.current = true;
    update(next.id, { phase: "analyzing" });
    void (async () => {
      try {
        await processOne(jobsRef.current.find((j) => j.id === next.id) ?? next);
      } finally {
        processingRef.current = false;
        // Force re-eval to pick up the next queued job.
        setJobs((prev) => [...prev]);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [jobs]);

  const enqueue = useCallback(
    (input: {
      file: File;
      caption?: string;
      captionStyle?: { color?: string; bg?: string; align?: string };
      link?: LinkInput;
    }) => {
      const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      const job: StoryJob = {
        id,
        file: input.file,
        caption: input.caption,
        captionStyle: input.captionStyle,
        link: input.link,
        phase: "queued",
        createdAt: Date.now(),
      };
      setJobs((prev) => [...prev, job]);
      return id;
    },
    [],
  );

  const dismiss = useCallback((id: string) => {
    setJobs((prev) => prev.filter((j) => j.id !== id));
  }, []);

  const clearDone = useCallback(() => {
    setJobs((prev) => prev.filter((j) => j.phase !== "done" && j.phase !== "error"));
  }, []);

  const value = useMemo(
    () => ({ jobs, enqueue, dismiss, clearDone }),
    [jobs, enqueue, dismiss, clearDone],
  );

  return (
    <StoryQueueContext.Provider value={value}>{children}</StoryQueueContext.Provider>
  );
}
