"use client";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { api } from "@/convex/_generated/api";
import { AdminItemPage } from "@/components/organisms/admin/AdminItemPage";
import { FIELDS } from "../_fields";

function NovoRestauranteInner() {
  const sp = useSearchParams();

  // Pre-fill from TripAdvisor importer query params
  const prefill: Record<string, unknown> = {};
  const numericKeys = new Set(["rating", "reviewCount"]);
  const keys = ["name","slug","description","address","phone","rating","reviewCount","cuisine","priceRange","website","tripAdvisorUrl","shortDesc"];
  for (const k of keys) {
    const v = sp.get(k);
    if (v) {
      if (numericKeys.has(k)) {
        const n = parseFloat(v);
        if (!isNaN(n)) prefill[k] = n;
      } else {
        prefill[k] = v;
      }
    }
  }

  return (
    <AdminItemPage
      title="Novo Restaurante"
      icon="lucide:utensils"
      fields={FIELDS}
      createMutation={api.restaurants.create}
      updateMutation={api.restaurants.update}
      backPath="/admin/restaurantes"
      initialValues={Object.keys(prefill).length > 0 ? prefill : undefined}
    />
  );
}

export default function NovoRestaurantePage() {
  return (
    <Suspense>
      <NovoRestauranteInner />
    </Suspense>
  );
}
