import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Cupons e descontos para viagens no Nordeste",
  description:
    "Cupons e descontos exclusivos para viagens no Nordeste: passeios, hospedagem e experiências em João Pessoa com preço especial, selecionados por Huan Falcão.",
  alternates: { canonical: "https://huanfalcao.com.br/cupons" },
  openGraph: { url: "https://huanfalcao.com.br/cupons", type: "website" },
};

export default function CuponsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
