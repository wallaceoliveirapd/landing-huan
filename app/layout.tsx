import type { Metadata, Viewport } from "next";
import { Asap } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import { ConvexAuthNextjsServerProvider } from "@convex-dev/auth/nextjs/server";
import { AppProviders } from "@/components/providers/AppProviders";
import { DisablePinchZoom } from "@/components/atoms/DisablePinchZoom";
import { ClarityScript } from "@/components/atoms/ClarityScript";

const GTM_ID = process.env.NEXT_PUBLIC_GTM_ID;

const asap = Asap({
  variable: "--font-asap",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://huanfalcao.com.br"),
  title: {
    template: "%s | NordestAI - By Huan Falcão",
    default: "NordestAI - By Huan Falcão | Guia de viagem para o Nordeste",
  },
  description:
    "Passeios, praias, restaurantes e dicas exclusivas do Nordeste, curados por Huan Falcão. Planeje sua viagem com IA.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    title: "NordestAI",
    statusBarStyle: "black-translucent",
  },
  icons: {
    icon: "/images/icon-pwa.png",
    apple: "/images/icon-pwa.png",
  },
  openGraph: {
    siteName: "NordestAI - By Huan Falcão",
    locale: "pt_BR",
    type: "website",
    images: [{ url: "/images/meta/img-meta.png", width: 1200, height: 630, alt: "NordestAI - By Huan Falcão" }],
  },
  twitter: {
    card: "summary_large_image",
    site: "@huanfalcao",
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#ffffff" },
  ],
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  minimumScale: 1,
  userScalable: false,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR" className={`${asap.variable} h-full`}>
      <head>
        {GTM_ID && (
          <>
            {/* Consent Mode v2.
                Region-aware defaults: deny only in EEA/UK/CH (legally
                required), grant everywhere else (e.g. Brazil) so analytics
                don't show 0% consent rate. The CookieBanner still updates
                consent when the user picks their preference. */}
            <Script id="gtm-consent-defaults" strategy="beforeInteractive">
              {`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}
gtag('consent','default',{analytics_storage:'denied',ad_storage:'denied',ad_user_data:'denied',ad_personalization:'denied',wait_for_update:2000,region:['AT','BE','BG','HR','CY','CZ','DK','EE','FI','FR','DE','GR','HU','IE','IT','LV','LT','LU','MT','NL','PL','PT','RO','SK','SI','ES','SE','GB','CH','NO','IS','LI']});
gtag('consent','default',{analytics_storage:'granted',ad_storage:'granted',ad_user_data:'granted',ad_personalization:'granted'});
dataLayer.push({'gtm.start':new Date().getTime(),event:'gtm.js'});`}
            </Script>

            {/* GTM loader, fires immediately, tags wait for consent update */}
            <Script
              id="gtm-loader"
              strategy="afterInteractive"
              src={`https://www.googletagmanager.com/gtm.js?id=${GTM_ID}`}
            />
          </>
        )}
      </head>
      <body className="min-h-full flex flex-col">
        {GTM_ID && (
          <noscript>
            <iframe
              src={`https://www.googletagmanager.com/ns.html?id=${GTM_ID}`}
              height="0"
              width="0"
              style={{ display: "none", visibility: "hidden" }}
            />
          </noscript>
        )}
        <ConvexAuthNextjsServerProvider>
          <AppProviders>
            <DisablePinchZoom />
            <ClarityScript />
            <main className="flex flex-col flex-1 w-full bg-white">
              {children}
            </main>
          </AppProviders>
        </ConvexAuthNextjsServerProvider>
      </body>
    </html>
  );
}

