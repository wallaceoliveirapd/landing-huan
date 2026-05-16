import { PublicProviders } from "@/components/providers/PublicProviders";

export default function InternalLayout({ children }: { children: React.ReactNode }) {
  return <PublicProviders>{children}</PublicProviders>;
}
