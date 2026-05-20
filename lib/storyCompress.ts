/**
 * Client-side compression for Huan Stories uploads. Browser-only.
 *
 * Strategy:
 *   - Image: canvas downscale + WebP, lowering quality if still over budget.
 *   - Video: ffmpeg.wasm transcode to H.264, escalating CRF/scale if still over.
 *
 * Target is a hard cap (defaults to 45 MB so the 50 MB server limit has headroom).
 */

const TARGET_BYTES = 45 * 1024 * 1024;
const FFMPEG_BASE = "/ffmpeg";

export type CompressProgress = {
  phase: "analyzing" | "compressing" | "uploading" | "done";
  ratio?: number; // 0..1 within current phase
  attempt?: number;
};

type Progress = (p: CompressProgress) => void;

export async function compressStoryFile(
  file: File,
  onProgress: Progress = () => {},
  targetBytes: number = TARGET_BYTES,
): Promise<File> {
  onProgress({ phase: "analyzing" });
  if (file.size <= targetBytes) return file;

  if (file.type.startsWith("image/")) {
    return compressImage(file, targetBytes, onProgress);
  }
  if (file.type.startsWith("video/")) {
    return compressVideo(file, targetBytes, onProgress);
  }
  throw new Error("Tipo de arquivo não suportado");
}

// ── Image ────────────────────────────────────────────────────────────────
async function compressImage(
  file: File,
  targetBytes: number,
  onProgress: Progress,
): Promise<File> {
  const bitmap = await createImageBitmap(file);
  const maxDimSteps = [1920, 1600, 1280, 1080, 960, 720];
  const qualitySteps = [0.85, 0.75, 0.65, 0.55];

  let attempt = 0;
  for (const maxDim of maxDimSteps) {
    for (const q of qualitySteps) {
      attempt++;
      onProgress({ phase: "compressing", attempt });
      const scale = Math.min(1, maxDim / Math.max(bitmap.width, bitmap.height));
      const w = Math.round(bitmap.width * scale);
      const h = Math.round(bitmap.height * scale);
      const canvas = typeof OffscreenCanvas !== "undefined"
        ? new OffscreenCanvas(w, h)
        : Object.assign(document.createElement("canvas"), { width: w, height: h });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const ctx = (canvas as any).getContext("2d");
      if (!ctx) throw new Error("Canvas indisponível");
      ctx.drawImage(bitmap, 0, 0, w, h);

      let blob: Blob;
      if (canvas instanceof OffscreenCanvas) {
        blob = await canvas.convertToBlob({ type: "image/webp", quality: q });
      } else {
        blob = await new Promise<Blob>((resolve, reject) => {
          (canvas as HTMLCanvasElement).toBlob(
            (b) => (b ? resolve(b) : reject(new Error("toBlob falhou"))),
            "image/webp",
            q,
          );
        });
      }
      if (blob.size <= targetBytes) {
        const name = file.name.replace(/\.[^.]+$/, "") + ".webp";
        return new File([blob], name, { type: "image/webp" });
      }
    }
  }
  throw new Error("Imagem grande demais para comprimir");
}

// ── Video (ffmpeg.wasm) ──────────────────────────────────────────────────
type FFmpegInstance = {
  load: (opts: { coreURL: string; wasmURL: string }) => Promise<void>;
  writeFile: (path: string, data: Uint8Array) => Promise<void>;
  readFile: (path: string) => Promise<Uint8Array>;
  exec: (args: string[]) => Promise<number>;
  deleteFile: (path: string) => Promise<void>;
  on: (event: string, cb: (data: { progress: number }) => void) => void;
};

let ffmpegPromise: Promise<FFmpegInstance> | null = null;

async function getFFmpeg(): Promise<FFmpegInstance> {
  if (!ffmpegPromise) {
    ffmpegPromise = (async () => {
      const [{ FFmpeg }, { toBlobURL }] = await Promise.all([
        import("@ffmpeg/ffmpeg"),
        import("@ffmpeg/util"),
      ]);
      const instance = new FFmpeg() as unknown as FFmpegInstance;
      const coreURL = await toBlobURL(`${FFMPEG_BASE}/ffmpeg-core.js`, "text/javascript");
      const wasmURL = await toBlobURL(`${FFMPEG_BASE}/ffmpeg-core.wasm`, "application/wasm");
      await instance.load({ coreURL, wasmURL });
      return instance;
    })();
  }
  return ffmpegPromise;
}

async function compressVideo(
  file: File,
  targetBytes: number,
  onProgress: Progress,
): Promise<File> {
  const ffmpeg = await getFFmpeg();
  const { fetchFile } = await import("@ffmpeg/util");

  const inputName = "in." + (file.name.split(".").pop()?.toLowerCase() || "mp4");
  await ffmpeg.writeFile(inputName, await fetchFile(file));

  // Escalating passes — each gets smaller until we fit under the cap.
  // (height, crf) tuples. veryfast preset to keep wall-clock manageable.
  const passes: Array<{ height: number; crf: number }> = [
    { height: 1080, crf: 26 },
    { height: 720, crf: 28 },
    { height: 540, crf: 30 },
    { height: 480, crf: 32 },
  ];

  let attempt = 0;
  for (const { height, crf } of passes) {
    attempt++;
    onProgress({ phase: "compressing", attempt, ratio: 0 });
    ffmpeg.on("progress", ({ progress }) => {
      onProgress({ phase: "compressing", attempt, ratio: Math.min(1, Math.max(0, progress)) });
    });

    const out = "out.mp4";
    try {
      await ffmpeg.deleteFile(out);
    } catch {
      /* missing first time */
    }
    await ffmpeg.exec([
      "-i", inputName,
      "-vf", `scale='min(iw,iw*${height}/ih)':'min(${height},ih)':force_original_aspect_ratio=decrease,scale=trunc(iw/2)*2:trunc(ih/2)*2`,
      "-c:v", "libx264",
      "-preset", "veryfast",
      "-crf", String(crf),
      "-pix_fmt", "yuv420p",
      "-profile:v", "high",
      "-movflags", "+faststart",
      "-c:a", "aac",
      "-b:a", "96k",
      "-ac", "2",
      out,
    ]);
    const data = await ffmpeg.readFile(out);
    const buf = new Uint8Array(data);
    if (buf.byteLength <= targetBytes) {
      const name = file.name.replace(/\.[^.]+$/, "") + ".mp4";
      return new File([buf], name, { type: "video/mp4" });
    }
  }
  throw new Error("Vídeo grande demais — diminua o tempo ou a resolução.");
}
