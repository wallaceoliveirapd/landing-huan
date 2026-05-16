"use client";
import { api } from "@/convex/_generated/api";
import { AdminItemPage } from "@/components/organisms/admin/AdminItemPage";
import { FIELDS } from "../_fields";

export default function NovaDicaPage() {
  return (
    <AdminItemPage
      title="Nova Dica"
      icon="lucide:lightbulb"
      fields={FIELDS}
      createMutation={api.dicas.create}
      updateMutation={api.dicas.update}
      backPath="/admin/dicas"
    />
  );
}
