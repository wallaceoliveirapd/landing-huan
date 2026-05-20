import type { NextConfig } from "next";

const CONVEX_HOST = (() => {
  try {
    return new URL(process.env.NEXT_PUBLIC_CONVEX_URL ?? "").host || "*.convex.cloud";
  } catch {
    return "*.convex.cloud";
  }
})();

const CSP_DIRECTIVES: Record<string, string[]> = {
  "default-src": ["'self'"],
  // Next.js inline runtime + GTM + Meta Pixel
  "script-src": [
    "'self'",
    "'unsafe-inline'",
    "'unsafe-eval'",
    "blob:",
    "https://www.googletagmanager.com",
    "https://www.google-analytics.com",
    "https://connect.facebook.net",
    "https://www.clarity.ms",
    "https://*.clarity.ms",
    "https://c.bing.com",
  ],
  "style-src": [
    "'self'",
    "'unsafe-inline'",
    "https://fonts.googleapis.com",
    "https://*.clarity.ms",
  ],
  "font-src": [
    "'self'",
    "data:",
    "https://fonts.gstatic.com",
    "https://*.clarity.ms",
  ],
  "img-src": [
    "'self'",
    "blob:",
    "data:",
    "https:",
  ],
  "media-src": ["'self'", "https:", "data:", "blob:"],
  "connect-src": [
    "'self'",
    "blob:",
    `https://${CONVEX_HOST}`,
    "wss://" + CONVEX_HOST,
    "https://*.convex.cloud",
    "wss://*.convex.cloud",
    "https://www.googletagmanager.com",
    "https://www.google-analytics.com",
    "https://*.facebook.com",
    // Iconify — fetches icon JSON bundles at runtime
    "https://api.iconify.design",
    "https://api.simplesvg.com",
    "https://api.unisvg.com",
    "https://api.openstreetmap.org",
    "https://overpass-api.de",
    "https://nominatim.openstreetmap.org",
    "https://*.tile.openstreetmap.org",
    "https://api.mapbox.com",
    "https://events.mapbox.com",
    "https://*.r2.cloudflarestorage.com",
    "https://www.clarity.ms",
    "https://*.clarity.ms",
    "https://c.bing.com",
  ],
  "worker-src": ["'self'", "blob:"],
  "frame-src": ["'self'", "https://www.googletagmanager.com"],
  "frame-ancestors": ["'none'"],
  "form-action": ["'self'"],
  "base-uri": ["'self'"],
  "object-src": ["'none'"],
  "upgrade-insecure-requests": [],
};

const csp = Object.entries(CSP_DIRECTIVES)
  .map(([k, v]) => (v.length ? `${k} ${v.join(" ")}` : k))
  .join("; ");

const SECURITY_HEADERS = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(self), interest-cohort=()",
  },
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
  { key: "X-DNS-Prefetch-Control", value: "on" },
  { key: "Content-Security-Policy", value: csp },
];

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "source.unsplash.com" },
      { protocol: "https", hostname: "plus.unsplash.com" },
      { protocol: "https", hostname: "picsum.photos" },
      { protocol: "https", hostname: "fastly.picsum.photos" },
    ],
  },

  // mapbox-gl uses browser-only APIs — keep it out of the server bundle
  // (top-level in Next.js 15+; moved out of experimental)
  serverExternalPackages: ["mapbox-gl"],

  // Empty turbopack config satisfies Next 16 Turbopack default
  turbopack: {},

  // Hide framework signature
  poweredByHeader: false,

  async headers() {
    const CORS_ORIGIN = "https://huanfalcao.com.br";
    return [
      {
        // Security headers on all routes
        source: "/:path*",
        headers: SECURITY_HEADERS,
      },
      {
        // CORS headers on all /api/* routes.
        // Browsers enforce the origin check; we serve the right Allow-Origin
        // so same-origin requests work and cross-origin from the canonical
        // domain is allowed. Deep request blocking (403 for unknown origins)
        // is intentionally NOT done here because it would require middleware
        // which conflicts with convexAuthNextjsMiddleware token refresh.
        source: "/api/:path*",
        headers: [
          { key: "Access-Control-Allow-Origin", value: CORS_ORIGIN },
          {
            key: "Access-Control-Allow-Methods",
            value: "GET, POST, PUT, PATCH, DELETE, OPTIONS",
          },
          {
            key: "Access-Control-Allow-Headers",
            value: "content-type, authorization",
          },
          { key: "Access-Control-Allow-Credentials", value: "true" },
          { key: "Vary", value: "Origin" },
        ],
      },
    ];
  },
};

export default nextConfig;
