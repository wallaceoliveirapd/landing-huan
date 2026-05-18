import { type NextRequest, NextResponse } from "next/server";
import { fetchMutation } from "convex/nextjs";
import { convexAuthNextjsToken } from "@convex-dev/auth/nextjs/server";
import { api } from "@/convex/_generated/api";

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const ref = searchParams.get("ref") ?? "";
  const link = searchParams.get("link") ?? "";
  const itemType = searchParams.get("type") ?? "unknown";
  const itemName = searchParams.get("name") ?? "";
  const channel = searchParams.get("channel") ?? undefined;

  if (!link || !/^https?:\/\//i.test(link)) {
    return NextResponse.redirect(new URL("/", req.url));
  }

  const token = await convexAuthNextjsToken().catch(() => null);

  // Fire-and-forget: log the click without blocking the redirect
  fetchMutation(
    api.affiliateClicks.log,
    { ref, itemType, itemName, targetUrl: link, ...(channel ? { channel } : {}) },
    token ? { token } : undefined,
  ).catch(() => {});

  return NextResponse.redirect(link, { status: 302 });
}
