/**
 * /api/img/[...key] — proxy for R2 images.
 *
 * Serves images from Cloudflare R2 via the AWS SDK so that they always
 * load in development and in production regardless of CDN/custom-domain config.
 *
 * Example:
 *   GET /api/img/uploads/1234567890-photo.webp
 *   → fetches s3://landing-joaopessoa/uploads/1234567890-photo.webp and streams it
 *
 * Cache-Control: 1 year immutable (content-addressed by timestamp in key).
 */
import { NextRequest, NextResponse } from "next/server";
import {
  S3Client,
  GetObjectCommand,
  HeadObjectCommand,
} from "@aws-sdk/client-s3";

const r2 = new S3Client({
  region: "auto",
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID ?? "",
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY ?? "",
  },
});

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ key: string[] }> }
) {
  const { key: keyParts } = await params;
  if (!keyParts?.length) {
    return NextResponse.json({ error: "No key" }, { status: 400 });
  }

  const key = keyParts.join("/");
  const bucket = process.env.R2_BUCKET;

  if (!bucket) {
    return NextResponse.json({ error: "R2 not configured" }, { status: 503 });
  }

  try {
    // HEAD first to get content-type + size cheaply
    let contentType = "image/webp";
    let contentLength: number | undefined;

    try {
      const head = await r2.send(
        new HeadObjectCommand({ Bucket: bucket, Key: key })
      );
      contentType = head.ContentType ?? contentType;
      contentLength = head.ContentLength;
    } catch {
      // continue — GET will fail with proper error if object doesn't exist
    }

    const obj = await r2.send(
      new GetObjectCommand({ Bucket: bucket, Key: key })
    );

    if (!obj.Body) {
      return NextResponse.json({ error: "Empty object" }, { status: 404 });
    }

    // Stream the body
    const body = obj.Body as ReadableStream;
    const headers = new Headers({
      "Content-Type": contentType,
      "Cache-Control": "public, max-age=31536000, immutable",
    });
    if (contentLength !== undefined) {
      headers.set("Content-Length", String(contentLength));
    }

    return new NextResponse(body, { status: 200, headers });
  } catch (err: unknown) {
    const code = (err as { Code?: string; name?: string }).Code ?? (err as { name?: string }).name ?? "";
    if (code === "NoSuchKey" || code === "NotFound") {
      return NextResponse.json({ error: "Image not found" }, { status: 404 });
    }
    console.error("R2 proxy error:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
