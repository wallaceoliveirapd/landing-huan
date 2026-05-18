import type { MetadataRoute } from "next";
import { fetchQuery } from "convex/nextjs";
import { api } from "@/convex/_generated/api";

const BASE = "https://huanfalcao.com.br";
const NOW = new Date();

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [tours, restaurants, praias, nightlife, dicas, itineraries] =
    await Promise.all([
      fetchQuery(api.tours.list, {}),
      fetchQuery(api.restaurants.list, {}),
      fetchQuery(api.praias.list, {}),
      fetchQuery(api.nightlife.list, {}),
      fetchQuery(api.dicas.list, {}),
      fetchQuery(api.itineraries.list, {}),
    ]);

  const static_pages: MetadataRoute.Sitemap = [
    { url: BASE, lastModified: NOW, changeFrequency: "daily", priority: 1.0 },
    { url: `${BASE}/passeios`, lastModified: NOW, changeFrequency: "daily", priority: 0.9 },
    { url: `${BASE}/restaurantes`, lastModified: NOW, changeFrequency: "daily", priority: 0.9 },
    { url: `${BASE}/praias`, lastModified: NOW, changeFrequency: "weekly", priority: 0.9 },
    { url: `${BASE}/vida-noturna`, lastModified: NOW, changeFrequency: "weekly", priority: 0.8 },
    { url: `${BASE}/dicas`, lastModified: NOW, changeFrequency: "daily", priority: 0.9 },
    { url: `${BASE}/roteiros`, lastModified: NOW, changeFrequency: "weekly", priority: 0.8 },
    { url: `${BASE}/hospedagem`, lastModified: NOW, changeFrequency: "weekly", priority: 0.7 },
    { url: `${BASE}/cupons`, lastModified: NOW, changeFrequency: "daily", priority: 0.8 },
  ];

  const toEntries = (
    items: { slug: string }[],
    prefix: string,
    changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"],
    priority: number,
  ): MetadataRoute.Sitemap =>
    items.map((item) => ({
      url: `${BASE}/${prefix}/${item.slug}`,
      lastModified: NOW,
      changeFrequency,
      priority,
    }));

  return [
    ...static_pages,
    ...toEntries(tours, "passeios", "weekly", 0.8),
    ...toEntries(restaurants, "restaurantes", "weekly", 0.8),
    ...toEntries(praias, "praias", "monthly", 0.7),
    ...toEntries(nightlife, "vida-noturna", "monthly", 0.7),
    ...toEntries(dicas, "dicas", "weekly", 0.8),
    ...toEntries(itineraries, "roteiros", "monthly", 0.7),
  ];
}
