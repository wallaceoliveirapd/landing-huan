"use client";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { AdminListPage } from "@/components/organisms/admin/AdminListPage";

export default function CategoriasPage() {
  const items = useQuery(api.categories.list, { activeOnly: false });
  return (
    <AdminListPage
      title="Categorias"
      icon="lucide:layout-grid"
      items={items as never}
      basePath="/admin/categorias"
      deleteMutation={api.categories.remove}
      rowLabel={(item) => String(item.label ?? item.key ?? item._id)}
      rowImage={(item) => String(item.mainImage ?? "")}
    />
  );
}
