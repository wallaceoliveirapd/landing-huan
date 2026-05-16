import type { Metadata, Viewport } from "next";
import { Asap } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import { ConvexAuthNextjsServerProvider } from "@convex-dev/auth/nextjs/server";
import { AppProviders } from "@/components/providers/AppProviders";

const GTM_ID = process.env.NEXT_PUBLIC_GTM_ID;

const asap = Asap({
  variable: "--font-asap",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "NordestAI — Sua viagem no Nordeste",
  description:
    "Passeios, restaurantes e dicas exclusivas em João Pessoa, escolhidos a dedo para a sua viagem.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    title: "NordestAI",
    statusBarStyle: "default",
  },
  icons: {
    icon: "/images/icon.png",
    apple: "/images/icon.png",
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)",  color: "#ffffff" },
  ],
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
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
            {/* Consent Mode v2 — deny everything before user decides */}
            <Script id="gtm-consent-defaults" strategy="beforeInteractive">
              {`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}
gtag('consent','default',{analytics_storage:'denied',ad_storage:'denied',ad_user_data:'denied',ad_personalization:'denied',wait_for_update:2000});
dataLayer.push({'gtm.start':new Date().getTime(),event:'gtm.js'});`}
            </Script>

            {/* GTM loader — fires immediately, tags wait for consent update */}
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
            <main className="flex flex-col flex-1 w-full bg-white">
              {children}
            </main>
          </AppProviders>
        </ConvexAuthNextjsServerProvider>
      </body>
    </html>
  );
}

