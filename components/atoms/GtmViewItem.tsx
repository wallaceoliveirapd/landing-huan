"use client";

import { useEffect } from "react";
import { gtmViewItem } from "@/lib/gtm";

type ItemType = "passeio" | "restaurante" | "dica" | "praia" | "nightlife" | "roteiro" | "hospedagem";

interface Props {
  item_type: ItemType;
  item_id: string;
  item_name: string;
  item_city?: string | null;
  item_price?: number | null;
  item_category?: string | null;
  item_slug?: string | null;
}

/**
 * Renders nothing, fires a GTM view_item event once on mount.
 * Use this inside server-component detail pages to add GTM tracking
 * without converting the entire page to a client component.
 */
export function GtmViewItem(props: Props) {
  useEffect(() => {
    gtmViewItem(props);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [props.item_id]);

  return null;
}
