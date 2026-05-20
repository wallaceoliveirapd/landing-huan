/**
 * Internal endpoint called by Convex actions to delete an R2 object.
 * Protected by `R2_DELETE_SECRET` header so external callers can't
 * trigger destructive operations.
 */
import { NextRequest, NextResponse } from "next/server";
import { S3Client, DeleteObjectCommand } from "@aws-sdk/client-s3";

const r2 = new S3Client({
  region: "auto",
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID ?? "",
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY ?? "",
  },
});

export async function POST(req: NextRequest) {
  const secret = req.headers.get("x-purge-secret");
  const expected = process.env.R2_DELETE_SECRET;
  if (!expected || secret !== expected) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const bucket = process.env.R2_BUCKET;
  if (!bucket) {
    return NextResponse.json({ error: "R2 not configured" }, { status: 503 });
  }
  const body = (await req.json().catch(() => null)) as { key?: string } | null;
  const key = body?.key?.trim();
  if (!key) {
    return NextResponse.json({ error: "Missing key" }, { status: 400 });
  }
  try {
    await r2.send(new DeleteObjectCommand({ Bucket: bucket, Key: key }));
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[r2-delete] failed:", err);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
