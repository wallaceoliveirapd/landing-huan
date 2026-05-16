"use client";
import { api } from "@/convex/_generated/api";
import { AdminItemPage } from "@/components/organisms/admin/AdminItemPage";
import { FIELDS } from "../_fields";

export default function NovoVidaNoturnaPage() {
  return (
    <AdminItemPage
      title="Novo Local"
      icon="lucide:moon"
      fields={FIELDS}
      createMutation={api.nightlife.create}
      updateMutation={api.nightlife.update}
      backPath="/admin/vida-noturna"
    />
  );
}
