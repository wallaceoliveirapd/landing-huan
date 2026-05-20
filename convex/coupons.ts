import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { requireAdmin } from "./helpers";

export const list = query({
  args: { activeOnly: v.optional(v.boolean()) },
  handler: async (ctx, { activeOnly = true }) => {
    const items = await (activeOnly
      ? ctx.db.query("coupons").withIndex("by_active", (q) => q.eq("active", true))
      : ctx.db.query("coupons")
    ).collect();
    return items.sort((a, b) => (a.order ?? 999) - (b.order ?? 999));
  },
});

export const featured = query({
  handler: async (ctx) =>
    ctx.db.query("coupons").withIndex("by_featured", (q) => q.eq("featured", true)).collect(),
});

export const getByIds = query({
  args: { ids: v.array(v.id("coupons")) },
  handler: async (ctx, { ids }) => {
    const items = await Promise.all(ids.map((id) => ctx.db.get(id)));
    return items.filter((c): c is NonNullable<typeof c> => c !== null && c.active);
  },
});

export const getById = query({
  args: { id: v.id("coupons") },
  handler: async (ctx, { id }) => ctx.db.get(id),
});

export const create = mutation({
  args: {
    title: v.string(),
    description: v.string(),
    code: v.string(),
    image: v.string(),
    discountType: v.string(),
    discountValue: v.number(),
    partner: v.optional(v.string()),
    partnerUrl: v.optional(v.string()),
    conditions: v.optional(v.string()),
    rules: v.optional(v.string()),
    maxUses: v.optional(v.number()),
    firstPurchaseOnly: v.boolean(),
    validUntil: v.optional(v.number()),
    active: v.boolean(),
    featured: v.boolean(),
    order: v.optional(v.number()),
    appliesTours: v.optional(v.array(v.id("tours"))),
    appliesRestaurants: v.optional(v.array(v.id("restaurants"))),
    appliesHosting: v.optional(v.array(v.id("hosting"))),
    appliesNightlife: v.optional(v.array(v.id("nightlife"))),
    appliesPraias: v.optional(v.array(v.id("praias"))),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    return ctx.db.insert("coupons", args);
  },
});

export const update = mutation({
  args: {
    id: v.id("coupons"),
    title: v.optional(v.string()),
    description: v.optional(v.string()),
    code: v.optional(v.string()),
    image: v.optional(v.string()),
    discountType: v.optional(v.string()),
    discountValue: v.optional(v.number()),
    partner: v.optional(v.string()),
    partnerUrl: v.optional(v.string()),
    conditions: v.optional(v.string()),
    rules: v.optional(v.string()),
    maxUses: v.optional(v.number()),
    firstPurchaseOnly: v.optional(v.boolean()),
    validUntil: v.optional(v.number()),
    active: v.optional(v.boolean()),
    featured: v.optional(v.boolean()),
    order: v.optional(v.number()),
    appliesTours: v.optional(v.array(v.id("tours"))),
    appliesRestaurants: v.optional(v.array(v.id("restaurants"))),
    appliesHosting: v.optional(v.array(v.id("hosting"))),
    appliesNightlife: v.optional(v.array(v.id("nightlife"))),
    appliesPraias: v.optional(v.array(v.id("praias"))),
  },
  handler: async (ctx, { id, ...fields }) => {
    await requireAdmin(ctx);
    await ctx.db.patch(id, fields);
  },
});

/**
 * Returns the full list of coupon IDs that apply to a given item, merging
 * the item-side `coupons` field with reverse-linked coupons (where the
 * coupon's `applies*` field includes this item id). De-duped.
 */
type AppliesKind = "tour" | "restaurant" | "hosting" | "nightlife" | "praia";

const APPLIES_FIELD: Record<AppliesKind, string> = {
  tour: "appliesTours",
  restaurant: "appliesRestaurants",
  hosting: "appliesHosting",
  nightlife: "appliesNightlife",
  praia: "appliesPraias",
};

export async function mergedCouponIdsFor(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ctx: any,
  kind: AppliesKind,
  itemId: string,
  existing: readonly string[] | undefined,
): Promise<string[]> {
  const field = APPLIES_FIELD[kind];
  const all = await ctx.db.query("coupons").collect();
  const reverse: string[] = [];
  for (const c of all) {
    const arr = (c as Record<string, unknown>)[field] as string[] | undefined;
    if (Array.isArray(arr) && arr.includes(itemId)) reverse.push(c._id);
  }
  const set = new Set<string>([...(existing ?? []), ...reverse]);
  return [...set];
}

/**
 * Returns the merged list of items that a given coupon applies to, across
 * tours / restaurants / hosting / nightlife / praias. Combines the
 * coupon-side appliesXxx fields with the item-side `coupons` arrays so
 * both directions show up. Each entry carries the kind + minimal display
 * fields the bottom-sheet carousel needs.
 */
export const linkedItemsFor = query({
  args: { id: v.id("coupons") },
  handler: async (ctx, { id }) => {
    const coupon = await ctx.db.get(id);
    if (!coupon) return [];

    type Out = {
      kind: "tour" | "restaurant" | "hosting" | "nightlife" | "praia";
      _id: string;
      slug: string;
      name: string;
      image: string;
      price?: number;
      originalPrice?: number;
      rating?: number;
      reviewCount?: number;
      shortDesc?: string;
    };
    const out: Out[] = [];

    async function pushKind(
      table: "tours" | "restaurants" | "hosting" | "nightlife" | "praias",
      kind: Out["kind"],
      appliesField:
        | "appliesTours"
        | "appliesRestaurants"
        | "appliesHosting"
        | "appliesNightlife"
        | "appliesPraias",
    ) {
      const ids = new Set<string>(
        (((coupon as Record<string, unknown>)[appliesField] as string[]) ?? []),
      );
      // Item-side reverse: items whose coupons[] contains this coupon id.
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const rows = await (ctx.db.query(table as any) as any).collect();
      for (const r of rows) {
        const list = (r.coupons ?? []) as string[];
        if (list.includes(id)) ids.add(r._id);
      }
      for (const itemId of ids) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const it = await ctx.db.get(itemId as any);
        if (!it) continue;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const r = it as any;
        out.push({
          kind,
          _id: r._id,
          slug: r.slug,
          name: r.title ?? r.name ?? "",
          image: r.image ?? "",
          price: r.price,
          originalPrice: r.originalPrice,
          rating: r.rating,
          reviewCount: r.reviewCount,
          shortDesc: r.shortDesc,
        });
      }
    }

    await pushKind("tours", "tour", "appliesTours");
    await pushKind("restaurants", "restaurant", "appliesRestaurants");
    await pushKind("hosting", "hosting", "appliesHosting");
    await pushKind("nightlife", "nightlife", "appliesNightlife");
    await pushKind("praias", "praia", "appliesPraias");

    return out;
  },
});

export const remove = mutation({
  args: { id: v.id("coupons") },
  handler: async (ctx, { id }) => {
    await requireAdmin(ctx);
    await ctx.db.delete(id);
  },
});
