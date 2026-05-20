/**
 * Issue a presigned PUT URL for direct-to-R2 uploads. Avoids the host's
 * request-body cap (Vercel serverless = 4.5 MB) — the browser streams the
 * compressed file straight to Cloudflare R2.
 *
 * Flow:
 *   1. Client compresses → POSTs { contentType, size } here.
 *   2. Server validates auth + size + MIME, signs a PUT URL valid for 5 min.
 *   3. Client PUTs the file body to that URL.
 *   4. Client calls stories.adminCreate with the returned key + public URL.
 */
import { NextRequest, NextResponse } from "next/server";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { convexAuthNextjsToken } from "@convex-dev/auth/nextjs/server";
import { fetchQuery } from "convex/nextjs";
import { api } from "@/convex/_generated/api";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const r2 = new S3Client({
  region: "auto",
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID ?? "",
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY ?? "",
  },
});

const MAX_BYTES = 200 * 1024 * 1024; // generous post-compression cap
const IMAGE_MIME = new Set(["image/jpeg", "image/png", "image/webp", "image/avif"]);
const VIDEO_MIME = new Set(["video/mp4", "video/webm", "video/quicktime"]);

async function requireAdmin(): Promise<NextResponse | null> {
  const token = await convexAuthNextjsToken();
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const role = await fetchQuery(api.users.myRole, {}, { token });
    if (role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  } catch (err) {
    console.error("[upload-story-presign] role check failed", err);
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

  let body: { contentType?: string; size?: number; ext?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const contentType = body.contentType ?? "";
  const size = body.size ?? 0;
  const isImage = IMAGE_MIME.has(contentType);
  const isVideo = VIDEO_MIME.has(contentType);
  if (!isImage && !isVideo) {
    return NextResponse.json({ error: "Tipo de arquivo não suportado" }, { status: 415 });
  }
  if (size <= 0 || size > MAX_BYTES) {
    return NextResponse.json({ error: "Tamanho inválido" }, { status: 413 });
  }

  const extFromMime = isImage
    ? contentType.split("/")[1]?.replace("jpeg", "jpg")
    : contentType === "video/mp4"
      ? "mp4"
      : contentType === "video/webm"
        ? "webm"
        : "mov";
  const ext = (body.ext ?? extFromMime ?? (isImage ? "webp" : "mp4")).toLowerCase();
  const dateFolder = new Date().toISOString().slice(0, 10);
  const rand = Math.random().toString(36).slice(2, 10);
  const key = `stories/${dateFolder}/${Date.now()}-${rand}.${ext}`;

  let uploadUrl: string;
  try {
    uploadUrl = await getSignedUrl(
      r2,
      new PutObjectCommand({
        Bucket: bucket,
        Key: key,
        ContentType: contentType,
        CacheControl: "public, max-age=31536000, immutable",
      }),
      { expiresIn: 300 },
    );
  } catch (err) {
    console.error("[upload-story-presign] sign failed", err);
    return NextResponse.json({ error: "Falha ao assinar URL" }, { status: 500 });
  }

  return NextResponse.json({
    uploadUrl,
    key,
    url: `/api/img/${key}`,
    mediaType: isImage ? "image" : "video",
  });
}
