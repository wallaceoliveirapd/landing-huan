"use client";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { AdminListPage } from "@/components/organisms/admin/AdminListPage";

export default function PraiasPage() {
  const items = useQuery(api.praias.list, { activeOnly: false });
  return (
    <AdminListPage
      title="Praias"
      icon="lucide:waves"
      items={items as never}
      basePath="/admin/praias"
      deleteMutation={api.praias.remove}
      rowLabel={(item) => String(item.name ?? item._id)}
      rowImage={(item) => String(item.image ?? "")}
    />
  );
}
