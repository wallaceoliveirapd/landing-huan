"use client";
import { api } from "@/convex/_generated/api";
import { AdminItemPage } from "@/components/organisms/admin/AdminItemPage";
import { FIELDS } from "../_fields";

export default function NovoPasseioPage() {
  return (
    <AdminItemPage
      title="Novo Passeio"
      icon="lucide:map-pin"
      fields={FIELDS}
      createMutation={api.tours.create}
      updateMutation={api.tours.update}
      backPath="/admin/passeios"
      civitatis
    />
  );
}
