import { Header } from "@/components/organisms/Header";
import { PublicProviders } from "@/components/providers/PublicProviders";

export default function HomeLayout({ children }: { children: React.ReactNode }) {
  return (
    <PublicProviders>
      <Header />
      {children}
    </PublicProviders>
  );
}
