"use client";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { AdminListPage } from "@/components/organisms/admin/AdminListPage";

export default function CuponsPage() {
  const items = useQuery(api.coupons.list, { activeOnly: false });
  return (
    <AdminListPage
      title="Cupons"
      icon="lucide:ticket-percent"
      items={items as never}
      basePath="/admin/cupons"
      deleteMutation={api.coupons.remove}
      rowLabel={(item) => `${String(item.code ?? "")}, ${String(item.title ?? item._id)}`}
      rowImage={(item) => String(item.image ?? "")}
      subtitle="Cupons de desconto exibidos no carrossel da home"
    />
  );
}
