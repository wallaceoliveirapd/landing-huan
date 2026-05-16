"use client";
import { api } from "@/convex/_generated/api";
import { AdminItemPage } from "@/components/organisms/admin/AdminItemPage";
import { FIELDS } from "../_fields";

export default function NovaPraiaPage() {
  return (
    <AdminItemPage
      title="Nova Praia"
      icon="lucide:waves"
      fields={FIELDS}
      createMutation={api.praias.create}
      updateMutation={api.praias.update}
      backPath="/admin/praias"
    />
  );
}
