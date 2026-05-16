"use client";
import { use } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Icon } from "@/components/atoms/Icon";
import type { Id } from "@/convex/_generated/dataModel";
import { CategoriaFormPage } from "../_CategoriaFormPage";

function Loading() {
  return (
    <div className="flex items-center justify-center py-20">
      <Icon name="svg-spinners:ring-resize" size={28} className="text-[var(--color-brand-purple)]" />
    </div>
  );
}

export default function EditCategoriaPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const item = useQuery(api.categories.getById, { id: id as Id<"categories"> });
  if (item === undefined) return <Loading />;
  if (item === null)
    return (
      <div className="p-8 text-center text-[var(--color-neutral-600)]">
        Categoria não encontrada.
      </div>
    );
  return (
    <CategoriaFormPage
      title="Editar Categoria"
      createMutation={api.categories.create}
      updateMutation={api.categories.update}
      initialValues={item}
      itemId={id}
    />
  );
}
