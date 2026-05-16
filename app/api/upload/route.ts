import { NextRequest, NextResponse } from "next/server";
import { S3Client, PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
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

const MAX_UPLOAD_BYTES = 12 * 1024 * 1024; // 12 MB
const ALLOWED_MIME = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/avif",
  "image/gif",
]);

/**
 * Require an authenticated admin. Returns null when access is granted, or
 * a NextResponse to short-circuit when denied.
 */
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
    console.error("[upload] role check failed", err);
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return null;
}

/**
 * POST /api/upload — receive the file as FormData, upload to R2 server-side.
 * Admin-only. Validates mime + size.
 */
export async function POST(req: NextRequest) {
  const deny = await requireAdmin();
  if (deny) return deny;

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
        { error: "Arquivo maior que 12MB" },
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

    const safeFilename = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
    const rawCategory = (formData.get("category") as string | null) ?? "geral";
    const safeCategory =
      rawCategory.replace(/[^a-zA-Z0-9_-]/g, "-").toLowerCase() || "geral";
    const key = `landing-huan/${safeCategory}/${Date.now()}-${safeFilename}`;
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
    console.error("[upload] POST failed", err);
    return NextResponse.json(
      { error: "Falha no upload. Tente de novo." },
      { status: 500 },
    );
  }
}

/** DELETE /api/upload — admin-only object delete from R2 by key. */
export async function DELETE(req: NextRequest) {
  const deny = await requireAdmin();
  if (deny) return deny;

  if (!process.env.R2_BUCKET) {
    return NextResponse.json({ error: "R2 not configured" }, { status: 503 });
  }

  try {
    const { key } = await req.json();
    if (!key || typeof key !== "string") {
      return NextResponse.json({ error: "Missing key" }, { status: 400 });
    }

    await r2.send(
      new DeleteObjectCommand({ Bucket: process.env.R2_BUCKET, Key: key }),
    );
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[upload] DELETE failed", err);
    return NextResponse.json({ error: "Delete failed" }, { status: 500 });
  }
}
