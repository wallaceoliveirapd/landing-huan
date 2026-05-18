import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/admin/", "/minha-viagem/", "/perfil/", "/esqueci-senha"],
      },
    ],
    sitemap: "https://huanfalcao.com.br/sitemap.xml",
  };
}
