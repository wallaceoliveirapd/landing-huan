"use client";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { AdminListPage } from "@/components/organisms/admin/AdminListPage";

export default function DicasPage() {
  const items = useQuery(api.dicas.list, { activeOnly: false });
  return (
    <AdminListPage
      title="Dicas"
      icon="lucide:lightbulb"
      items={items as never}
      basePath="/admin/dicas"
      deleteMutation={api.dicas.remove}
      rowLabel={(item) => String(item.title ?? item._id)}
      rowImage={(item) => String(item.cover ?? "")}
    />
  );
}
