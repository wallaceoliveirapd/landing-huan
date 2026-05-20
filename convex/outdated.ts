import { query } from "./_generated/server";
import { requireAdmin } from "./helpers";

/**
 * Threshold: content older than 180 days (about 6 months) is flagged.
 * Uses `_creationTime` since most tables don't track an `updatedAt`.
 */
const STALE_MS = 180 * 24 * 60 * 60 * 1000;

type StaleItem = {
  _id: string;
  kind: string;
  title: string;
  slug?: string;
  city?: string;
  creationTime: number;
  daysSinceCreation: number;
};

/**
 * Returns a list of items considered outdated across all curated tables
 * (tours, restaurants, praias, nightlife, dicas, hosting, coupons,
 * itineraries). Admin-only.
 */
export const listStale = query({
  args: {},
  handler: async (ctx): Promise<StaleItem[]> => {
    await requireAdmin(ctx);
    const cutoff = Date.now() - STALE_MS;
    const stale: StaleItem[] = [];

    const push = (kind: string, doc: { _id: string; _creationTime: number; title?: string; name?: string; slug?: string; city?: string }) => {
      const t = doc._creationTime;
      if (t > cutoff) return;
      const daysSinceCreation = Math.floor((Date.now() - t) / 86_400_000);
      stale.push({
        _id: doc._id,
        kind,
        title: doc.title ?? doc.name ?? "(sem título)",
        slug: doc.slug,
        city: doc.city,
        creationTime: t,
        daysSinceCreation,
      });
    };

    const tours = await ctx.db.query("tours").collect();
    for (const x of tours) push("tour", x);

    const restaurants = await ctx.db.query("restaurants").collect();
    for (const x of restaurants) push("restaurant", x);

    const praias = await ctx.db.query("praias").collect();
    for (const x of praias) push("praia", { ...x, title: x.name });

    const nightlife = await ctx.db.query("nightlife").collect();
    for (const x of nightlife) push("nightlife", { ...x, title: x.name });

    const dicas = await ctx.db.query("dicas").collect();
    for (const x of dicas) push("dica", x);

    const hosting = await ctx.db.query("hosting").collect();
    for (const x of hosting) push("hosting", { ...x, title: x.name });

    const coupons = await ctx.db.query("coupons").collect();
    for (const x of coupons) push("coupon", x);

    // Sort oldest first
    stale.sort((a, b) => a.creationTime - b.creationTime);
    return stale;
  },
});

/**
 * Compact count summary for a dashboard badge.
 */
export const staleSummary = query({
  args: {},
  handler: async (ctx): Promise<{ total: number; byKind: Record<string, number> }> => {
    await requireAdmin(ctx);
    const cutoff = Date.now() - STALE_MS;
    const byKind: Record<string, number> = {};
    let total = 0;

    const countOld = async (table: "tours" | "restaurants" | "praias" | "nightlife" | "dicas" | "hosting" | "coupons", kind: string) => {
      const items = await ctx.db.query(table).collect();
      const old = items.filter((d) => d._creationTime <= cutoff).length;
      if (old > 0) byKind[kind] = old;
      total += old;
    };

    await countOld("tours", "tour");
    await countOld("restaurants", "restaurant");
    await countOld("praias", "praia");
    await countOld("nightlife", "nightlife");
    await countOld("dicas", "dica");
    await countOld("hosting", "hosting");
    await countOld("coupons", "coupon");

    return { total, byKind };
  },
});
