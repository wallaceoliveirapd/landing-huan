import { NextRequest, NextResponse } from "next/server";
import { convexAuthNextjsToken } from "@convex-dev/auth/nextjs/server";
import { fetchQuery } from "convex/nextjs";
import { api } from "@/convex/_generated/api";

const MAX_BYTES = 20 * 1024 * 1024; // 20 MB
const ALLOWED_MIME = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/avif",
  "image/gif",
]);

/**
 * GET /api/proxy-image?url=... Authenticated. Fetches a remote image from
 * any origin server-side so the admin drag-and-drop flow can accept images
 * dragged from other browser tabs (Google Images, etc.) without hitting
 * CORS. Returns the raw image bytes with the original content-type.
 */
export async function GET(req: NextRequest) {
  const token = await convexAuthNextjsToken();
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const viewer = await fetchQuery(api.users.viewer, {}, { token });
    if (!viewer) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = req.nextUrl.searchParams.get("url");
  if (!url) return NextResponse.json({ error: "Missing url" }, { status: 400 });

  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return NextResponse.json({ error: "Invalid url" }, { status: 400 });
  }
  if (parsed.protocol !== "https:" && parsed.protocol !== "http:") {
    return NextResponse.json({ error: "Invalid protocol" }, { status: 400 });
  }

  try {
    const res = await fetch(parsed.toString(), {
      headers: {
        // Some hosts block default fetch agents; pretend to be a browser.
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 14_0) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15",
        Accept: "image/*",
      },
    });
    if (!res.ok) {
      return NextResponse.json(
        { error: `Origin returned ${res.status}` },
        { status: 502 },
      );
    }
    const contentType = (res.headers.get("content-type") ?? "")
      .split(";")[0]
      .trim()
      .toLowerCase();
    if (!ALLOWED_MIME.has(contentType)) {
      return NextResponse.json(
        { error: `Tipo não suportado: ${contentType || "desconhecido"}` },
        { status: 415 },
      );
    }
    const buffer = Buffer.from(await res.arrayBuffer());
    if (buffer.length > MAX_BYTES) {
      return NextResponse.json({ error: "Imagem grande demais." }, { status: 413 });
    }
    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "private, max-age=60",
      },
    });
  } catch (err) {
    console.error("[proxy-image] fetch failed", err);
    return NextResponse.json(
      { error: "Falha ao baixar imagem. Tente novamente." },
      { status: 500 },
    );
  }
}
