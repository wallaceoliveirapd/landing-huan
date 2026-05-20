import { PublicProviders } from "@/components/providers/PublicProviders";
import { RouteTransition } from "@/components/atoms/RouteTransition";

export default function InternalLayout({ children }: { children: React.ReactNode }) {
  return (
    <PublicProviders>
      <RouteTransition>{children}</RouteTransition>
    </PublicProviders>
  );
}
