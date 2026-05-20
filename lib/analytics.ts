/**
 * Analytics helpers, GTM dataLayer + Meta Pixel
 *
 * All calls are safe to use in SSR/server components: they check for
 * window before doing anything so they never crash on the server.
 */

// ─── dataLayer push ──────────────────────────────────────────────────────────

type GTMEvent = Record<string, unknown> & { event: string };

export function pushEvent(payload: GTMEvent): void {
  if (typeof window === "undefined") return;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const w = window as any;
  w.dataLayer = w.dataLayer ?? [];
  w.dataLayer.push(payload);
}

// ─── Meta Pixel helper ───────────────────────────────────────────────────────

type FbqStandardEvent =
  | "PageView"
  | "ViewContent"
  | "Search"
  | "AddToCart"
  | "Lead"
  | "Contact"
  | "CustomizeProduct";

export function trackPixel(
  event: FbqStandardEvent | string,
  params?: Record<string, unknown>,
): void {
  if (typeof window === "undefined") return;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const fbq = (window as any).fbq;
  if (typeof fbq !== "function") return;
  if (params) {
    fbq("track", event, params);
  } else {
    fbq("track", event);
  }
}

// ─── Pre-built event helpers ─────────────────────────────────────────────────

/** User opened the NordesteAÍ chat panel */
export function trackChatOpen(): void {
  pushEvent({ event: "chat_open" });
  trackPixel("Contact");
}

/** User sent a message to NordesteAÍ */
export function trackChatMessage(messageText?: string): void {
  pushEvent({
    event: "chat_message_sent",
    message_preview: messageText?.slice(0, 60),
  });
}

/** User clicked on a card inside the chat carousel */
export function trackCardClick(kind: string, title: string): void {
  pushEvent({ event: "chat_card_click", card_kind: kind, card_title: title });
  trackPixel("ViewContent", { content_type: kind, content_name: title });
}

/** User copied a coupon code */
export function trackCouponCopy(couponTitle: string, code: string): void {
  pushEvent({ event: "coupon_copy", coupon_title: couponTitle, coupon_code: code });
  trackPixel("Lead", { content_name: couponTitle });
}

/** User clicked "Usar cupom" CTA */
export function trackCouponUse(couponTitle: string): void {
  pushEvent({ event: "coupon_use_click", coupon_title: couponTitle });
}

/** User clicked on an offer/tour card */
export function trackTourClick(title: string, url?: string): void {
  pushEvent({ event: "tour_click", tour_title: title, destination_url: url });
  trackPixel("ViewContent", { content_type: "tour", content_name: title });
}

/** User clicked on a restaurant card */
export function trackRestaurantClick(name: string, slug: string): void {
  pushEvent({ event: "restaurant_click", restaurant_name: name, slug });
  trackPixel("ViewContent", { content_type: "restaurant", content_name: name });
}

/** User opened the "Ver tudo" bottom sheet */
export function trackBottomSheetOpen(): void {
  pushEvent({ event: "bottom_sheet_open" });
}

/** User clicked a category chip */
export function trackCategoryClick(category: string): void {
  pushEvent({ event: "category_click", category });
}

/** User clicked a suggested prompt in the chat */
export function trackSuggestedPrompt(prompt: string): void {
  pushEvent({ event: "suggested_prompt_click", prompt });
}
