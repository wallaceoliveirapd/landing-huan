"use client";
import { use } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { AdminItemPage } from "@/components/organisms/admin/AdminItemPage";
import { Icon } from "@/components/atoms/Icon";
import type { Id } from "@/convex/_generated/dataModel";
import { FIELDS } from "../_fields";

function Loading() {
  return (
    <div className="flex items-center justify-center py-20">
      <Icon name="svg-spinners:ring-resize" size={28} className="text-[var(--color-brand-purple)]" />
    </div>
  );
}

export default function EditPraiaPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const item = useQuery(api.praias.getById, { id: id as Id<"praias"> });
  if (item === undefined) return <Loading />;
  if (item === null) return <div className="p-8 text-center">Praia não encontrada.</div>;
  return (
    <AdminItemPage
      title="Editar Praia"
      icon="lucide:waves"
      fields={FIELDS}
      createMutation={api.praias.create}
      updateMutation={api.praias.update}
      backPath="/admin/praias"
      initialValues={item as never}
      itemId={id}
    />
  );
}
