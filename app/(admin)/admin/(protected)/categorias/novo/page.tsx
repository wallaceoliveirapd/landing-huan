"use client";
import { api } from "@/convex/_generated/api";
import { CategoriaFormPage } from "../_CategoriaFormPage";

export default function NovaCategoriaPage() {
  return (
    <CategoriaFormPage
      title="Nova Categoria"
      createMutation={api.categories.create}
      updateMutation={api.categories.update}
    />
  );
}
