"use client";
import { use } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { AdminItemPage } from "@/components/organisms/admin/AdminItemPage";
import { FIELDS } from "../_fields";
import { Icon } from "@/components/atoms/Icon";

export default function EditCupomPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const item = useQuery(api.coupons.getById, { id: id as Id<"coupons"> });

  if (item === undefined) {
    return (
      <div className="flex items-center justify-center h-40 text-[var(--color-neutral-500)]">
        <Icon name="svg-spinners:ring-resize" size={22} />
      </div>
    );
  }
  if (item === null) {
    return (
      <div className="p-8 text-center text-[var(--color-neutral-600)]">
        Cupom não encontrado.
      </div>
    );
  }

  return (
    <AdminItemPage
      title="Editar Cupom"
      icon="lucide:ticket-percent"
      fields={FIELDS}
      createMutation={api.coupons.create}
      updateMutation={api.coupons.update}
      backPath="/admin/cupons"
      initialValues={item as never}
      itemId={id}
    />
  );
}
