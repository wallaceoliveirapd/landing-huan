"use client";

import { api } from "@/convex/_generated/api";
import { AdminItemPage } from "@/components/organisms/admin/AdminItemPage";
import { FIELDS } from "../_fields";

export default function NovoRoteiroPage() {
  return (
    <AdminItemPage
      title="Novo Roteiro"
      icon="lucide:route"
      fields={FIELDS}
      createMutation={api.itineraries.create}
      updateMutation={api.itineraries.update}
      backPath="/admin/roteiros"
    />
  );
}
