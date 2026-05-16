"use client";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { AdminListPage } from "@/components/organisms/admin/AdminListPage";

export default function RoteirosPage() {
  const items = useQuery(api.itineraries.list, { activeOnly: false });
  return (
    <AdminListPage
      title="Roteiros"
      icon="lucide:route"
      subtitle="Itinerários de 1, 3 e 7 dias com paradas e passeios"
      items={items as never}
      basePath="/admin/roteiros"
      deleteMutation={api.itineraries.remove}
      rowLabel={(item) => `${String(item.title ?? item._id)} (${String(item.durationDays ?? "?")} dias)`}
      rowImage={(item) => String(item.cover ?? "")}
    />
  );
}
