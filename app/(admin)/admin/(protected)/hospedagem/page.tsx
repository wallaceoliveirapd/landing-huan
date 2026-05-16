"use client";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { AdminListPage } from "@/components/organisms/admin/AdminListPage";

export default function HospedagemPage() {
  const items = useQuery(api.hosting.list, { activeOnly: false });
  return (
    <AdminListPage
      title="Hospedagem"
      icon="lucide:bed"
      items={items as never}
      basePath="/admin/hospedagem"
      deleteMutation={api.hosting.remove}
      rowLabel={(item) => String(item.name ?? item._id)}
      rowImage={(item) => String(item.image ?? "")}
    />
  );
}
