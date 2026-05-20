import { PublicProviders } from "@/components/providers/PublicProviders";

export default function ConviteLayout({ children }: { children: React.ReactNode }) {
  return <PublicProviders>{children}</PublicProviders>;
}
