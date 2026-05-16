"use client";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function push(obj: Record<string, unknown>) {
  if (typeof window === "undefined") return;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ((window as any).dataLayer = (window as any).dataLayer || []).push(obj);
}

// ── Item events ──────────────────────────────────────────────

type ItemType = "passeio" | "restaurante" | "dica" | "praia" | "nightlife" | "roteiro" | "hospedagem";

interface ItemParams {
  item_type: ItemType;
  item_id: string;
  item_name: string;
  item_city?: string | null;
  item_price?: number | null;
  item_category?: string | null;
  item_slug?: string | null;
}

export function gtmViewItem(params: ItemParams) {
  push({ event: "view_item", ...params });
}

export function gtmSelectItem(params: ItemParams & { list_name: string }) {
  push({ event: "select_item", ...params });
}

export function gtmViewItemList(list_name: string) {
  push({ event: "view_item_list", list_name });
}

export function gtmAddToWishlist(params: Omit<ItemParams, "item_price" | "item_category" | "item_slug">) {
  push({ event: "add_to_wishlist", ...params });
}

export function gtmRemoveFromWishlist(params: Pick<ItemParams, "item_type" | "item_id" | "item_name">) {
  push({ event: "remove_from_wishlist", ...params });
}

// ── Trip events ──────────────────────────────────────────────

interface TripParams {
  trip_type: string;
  trip_city: string;
  trip_duration: number;
}

export function gtmTripCreated(params: TripParams) {
  push({ event: "trip_created", ...params });
}

export function gtmTripViewed(params: TripParams) {
  push({ event: "trip_viewed", ...params });
}

// ── Auth events ──────────────────────────────────────────────

export function gtmUserSignedUp(auth_method: string) {
  push({ event: "user_signed_up", auth_method });
}

export function gtmUserLoggedIn(auth_method: string) {
  push({ event: "user_logged_in", auth_method });
}

// ── Search / filter ──────────────────────────────────────────

export function gtmSearch(search_term: string, list_name: string) {
  push({ event: "search", search_term, list_name });
}

export function gtmFilterApplied(filter_type: string, filter_value: string, list_name: string) {
  push({ event: "filter_applied", filter_type, filter_value, list_name });
}

// ── Chat events ──────────────────────────────────────────────

export function gtmChatMessageSent(turn_number: number, message_length: number) {
  push({ event: "chat_message_sent", turn_number, message_length });
}

export function gtmChatResponseReceived(turn_number: number, response_length: number) {
  push({ event: "chat_response_received", turn_number, response_length });
}
