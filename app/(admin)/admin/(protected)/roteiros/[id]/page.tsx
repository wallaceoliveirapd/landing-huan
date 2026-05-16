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

export default function EditRoteiroPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const item = useQuery(api.itineraries.getById, {
    id: id as Id<"itineraries">,
  });

  if (item === undefined) return <Loading />;
  if (item === null) {
    return (
      <div className="p-8 text-center text-[var(--color-neutral-600)]">
        Roteiro não encontrado.
      </div>
    );
  }

  return (
    <AdminItemPage
      title="Editar Roteiro"
      icon="lucide:route"
      fields={FIELDS}
      createMutation={api.itineraries.create}
      updateMutation={api.itineraries.update}
      backPath="/admin/roteiros"
      initialValues={item as never}
      itemId={id}
    />
  );
}
