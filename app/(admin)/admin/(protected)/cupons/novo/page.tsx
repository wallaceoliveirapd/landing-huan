"use client";
import { api } from "@/convex/_generated/api";
import { AdminItemPage } from "@/components/organisms/admin/AdminItemPage";
import { FIELDS } from "../_fields";

export default function NovoCupomPage() {
  return (
    <AdminItemPage
      title="Novo Cupom"
      icon="lucide:ticket-percent"
      fields={FIELDS}
      createMutation={api.coupons.create}
      updateMutation={api.coupons.update}
      backPath="/admin/cupons"
    />
  );
}
