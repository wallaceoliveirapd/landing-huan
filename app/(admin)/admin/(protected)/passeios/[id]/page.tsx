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

export default function EditPasseioPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const item = useQuery(api.tours.getById, { id: id as Id<"tours"> });
  if (item === undefined) return <Loading />;
  if (item === null) return <div className="p-8 text-center text-[var(--color-neutral-600)]">Passeio não encontrado.</div>;
  return (
    <AdminItemPage
      title="Editar Passeio"
      icon="lucide:map-pin"
      fields={FIELDS}
      createMutation={api.tours.create}
      updateMutation={api.tours.update}
      backPath="/admin/passeios"
      initialValues={item as never}
      itemId={id}
      civitatis
    />
  );
}
