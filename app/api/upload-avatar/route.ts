import { NextRequest, NextResponse } from "next/server";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { convexAuthNextjsToken } from "@convex-dev/auth/nextjs/server";
import { fetchQuery } from "convex/nextjs";
import { api } from "@/convex/_generated/api";

const r2 = new S3Client({
  region: "auto",
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID ?? "",
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY ?? "",
  },
});

const MAX_UPLOAD_BYTES = 4 * 1024 * 1024; // 4 MB
const ALLOWED_MIME = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/avif",
]);

const EXT_FROM_MIME: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/avif": "avif",
};

/**
 * POST /api/upload-avatar. Authenticated user uploads their own profile
 * image. Stored under landing-huan/avatars/{userId}.{ext} so each upload
 * overrides the previous one (no orphans). Returns the public URL to put
 * in the user record via the updateAvatar mutation.
 */
export async function POST(req: NextRequest) {
  const token = await convexAuthNextjsToken();
  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let viewer: { _id?: string } | null = null;
  try {
    viewer = (await fetchQuery(api.users.viewer, {}, { token })) as
      | { _id?: string }
      | null;
  } catch (err) {
    console.error("[upload-avatar] viewer fetch failed", err);
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!viewer?._id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!process.env.R2_BUCKET) {
    return NextResponse.json({ error: "R2 not configured" }, { status: 503 });
  }

  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }
    if (file.size > MAX_UPLOAD_BYTES) {
      return NextResponse.json(
        { error: "Imagem maior que 4MB" },
        { status: 413 },
      );
    }
    const mime = file.type || "application/octet-stream";
    if (!ALLOWED_MIME.has(mime)) {
      return NextResponse.json(
        { error: `Tipo não suportado: ${mime}` },
        { status: 415 },
      );
    }

    const ext = EXT_FROM_MIME[mime] ?? "jpg";
    // Cache-bust via timestamp suffix so the new image displays right away.
    const key = `landing-huan/avatars/${viewer._id}-${Date.now()}.${ext}`;
    const buffer = Buffer.from(await file.arrayBuffer());

    await r2.send(
      new PutObjectCommand({
        Bucket: process.env.R2_BUCKET,
        Key: key,
        Body: buffer,
        ContentType: mime,
      }),
    );

    const publicUrl = `/api/img/${key}`;
    return NextResponse.json({ publicUrl, key });
  } catch (err) {
    console.error("[upload-avatar] POST failed", err);
    return NextResponse.json(
      { error: "Falha no upload. Tente de novo." },
      { status: 500 },
    );
  }
}
