"use client";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { AdminListPage } from "@/components/organisms/admin/AdminListPage";

export default function VidaNoturnaPage() {
  const items = useQuery(api.nightlife.list, { activeOnly: false });
  return (
    <AdminListPage
      title="Vida Noturna"
      icon="lucide:moon"
      items={items as never}
      basePath="/admin/vida-noturna"
      deleteMutation={api.nightlife.remove}
      rowLabel={(item) => String(item.name ?? item._id)}
      rowImage={(item) => String(item.image ?? "")}
    />
  );
}
