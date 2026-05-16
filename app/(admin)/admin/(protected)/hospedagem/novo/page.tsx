"use client";
import { api } from "@/convex/_generated/api";
import { AdminItemPage } from "@/components/organisms/admin/AdminItemPage";
import { FIELDS } from "../_fields";

export default function NovaHospedagemPage() {
  return (
    <AdminItemPage
      title="Nova Hospedagem"
      icon="lucide:bed"
      fields={FIELDS}
      createMutation={api.hosting.create}
      updateMutation={api.hosting.update}
      backPath="/admin/hospedagem"
    />
  );
}
