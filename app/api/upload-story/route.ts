/**
 * Admin-only upload endpoint for stories. Accepts images and videos up to
 * 50 MB. Returns the R2 object key + public URL that the admin page then
 * passes to `stories.adminCreate`.
 */
import { NextRequest, NextResponse } from "next/server";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { convexAuthNextjsToken } from "@convex-dev/auth/nextjs/server";
import { fetchQuery } from "convex/nextjs";
import { api } from "@/convex/_generated/api";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const r2 = new S3Client({
  region: "auto",
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID ?? "",
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY ?? "",
  },
});

const MAX_BYTES = 50 * 1024 * 1024;
const IMAGE_MIME = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/avif",
]);
const VIDEO_MIME = new Set([
  "video/mp4",
  "video/webm",
  "video/quicktime",
]);

async function requireAdmin(): Promise<NextResponse | null> {
  const token = await convexAuthNextjsToken();
  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const role = await fetchQuery(api.users.myRole, {}, { token });
    if (role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  } catch (err) {
    console.error("[upload-story] role check failed", err);
    return NextResponse.json({ error: "Auth check failed" }, { status: 500 });
  }
  return null;
}

export async function POST(req: NextRequest) {
  const guard = await requireAdmin();
  if (guard) return guard;

  const bucket = process.env.R2_BUCKET;
  if (!bucket) {
    return NextResponse.json({ error: "R2 not configured" }, { status: 503 });
  }

  const form = await req.formData();
  const file = form.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Missing file" }, { status: 400 });
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: "Arquivo > 50MB" }, { status: 413 });
  }
  const isImage = IMAGE_MIME.has(file.type);
  const isVideo = VIDEO_MIME.has(file.type);
  if (!isImage && !isVideo) {
    return NextResponse.json({ error: "Tipo de arquivo não suportado" }, { status: 415 });
  }

  // Build a key like stories/2026-05-20/<timestamp>-<rand>.<ext>
  const ext = file.name.split(".").pop()?.toLowerCase() ?? (isImage ? "webp" : "mp4");
  const dateFolder = new Date().toISOString().slice(0, 10);
  const rand = Math.random().toString(36).slice(2, 10);
  const key = `stories/${dateFolder}/${Date.now()}-${rand}.${ext}`;

  const buf = Buffer.from(await file.arrayBuffer());
  try {
    await r2.send(
      new PutObjectCommand({
        Bucket: bucket,
        Key: key,
        Body: buf,
        ContentType: file.type,
        CacheControl: "public, max-age=31536000, immutable",
      }),
    );
  } catch (err) {
    console.error("[upload-story] PutObject failed", err);
    return NextResponse.json({ error: "Falha ao enviar" }, { status: 500 });
  }

  // Use the existing /api/img proxy so the URL stays origin-stable.
  const publicUrl = `/api/img/${key}`;
  return NextResponse.json({
    key,
    url: publicUrl,
    mediaType: isImage ? "image" : "video",
    size: file.size,
  });
}
