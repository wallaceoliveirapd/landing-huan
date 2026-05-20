/**
 * Web Worker that runs ffmpeg.wasm / canvas compression off the main thread.
 * The main thread enqueues files via postMessage; the worker streams progress
 * updates back and posts the final compressed Blob when done.
 *
 * Message protocol (main → worker):
 *   { type: "compress", id: string, file: File, targetBytes?: number }
 *
 * Message protocol (worker → main):
 *   { type: "progress", id, phase, attempt?, ratio? }
 *   { type: "done", id, blob, name, mime }
 *   { type: "error", id, message }
 */

/// <reference lib="webworker" />
import { compressStoryFile, type CompressProgress } from "./storyCompress";

type CompressMsg = {
  type: "compress";
  id: string;
  file: File;
  targetBytes?: number;
};

type InboundMsg = CompressMsg;

self.addEventListener("message", (ev: MessageEvent<InboundMsg>) => {
  const msg = ev.data;
  if (msg.type !== "compress") return;
  const { id, file, targetBytes } = msg;
  void (async () => {
    try {
      const onProgress = (p: CompressProgress) => {
        (self as unknown as Worker).postMessage({ type: "progress", id, ...p });
      };
      const out = await compressStoryFile(file, onProgress, targetBytes);
      const buf = await out.arrayBuffer();
      (self as unknown as Worker).postMessage(
        { type: "done", id, buffer: buf, name: out.name, mime: out.type },
        [buf],
      );
    } catch (err) {
      (self as unknown as Worker).postMessage({
        type: "error",
        id,
        message: err instanceof Error ? err.message : "Falha ao comprimir",
      });
    }
  })();
});
