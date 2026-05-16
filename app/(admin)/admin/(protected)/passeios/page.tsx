"use client";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { AdminListPage } from "@/components/organisms/admin/AdminListPage";

export default function PasseiosPage() {
  const items = useQuery(api.tours.list, { activeOnly: false });
  return (
    <AdminListPage
      title="Passeios"
      icon="lucide:map-pin"
      items={items as never}
      basePath="/admin/passeios"
      deleteMutation={api.tours.remove}
      rowLabel={(item) => String(item.title ?? item._id)}
      rowImage={(item) => String(item.image ?? "")}
    />
  );
}
