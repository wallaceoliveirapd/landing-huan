import { NextResponse } from "next/server";
import { fetchQuery } from "convex/nextjs";
import { convexAuthNextjsToken } from "@convex-dev/auth/nextjs/server";
import { api } from "@/convex/_generated/api";
import JSZip from "jszip";

/**
 * GET /api/data-export
 *
 * Returns a ZIP file containing 3 CSVs (profile, trips, favorites)
 * with the authenticated user's data — LGPD compliance.
 *
 * 401 if the user isn't authenticated.
 */
export async function GET() {
  const token = await convexAuthNextjsToken();
  if (!token) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const data = await fetchQuery(api.dataExport.exportMyData, {}, { token });
  if (!data) {
    return NextResponse.json({ error: "No data" }, { status: 404 });
  }

  const zip = new JSZip();
  zip.file("profile.csv", toCsv([data.profile]));
  zip.file("trips.csv", toCsv(data.trips));
  zip.file("favorites.csv", toCsv(data.favorites));
  zip.file(
    "README.txt",
    [
      "Exportação de dados — NordestAI / HUAN",
      "",
      `Gerado em: ${new Date(data.exportedAt).toISOString()}`,
      "",
      "Arquivos:",
      "  profile.csv     — seus dados pessoais",
      "  trips.csv       — todas as viagens criadas",
      "  favorites.csv   — passeios, restaurantes e praias favoritados",
      "",
      "Dúvidas: suporte@huanfalcao.com.br",
    ].join("\n"),
  );

  const blob = await zip.generateAsync({ type: "uint8array" });
  const today = new Date().toISOString().slice(0, 10);
  return new NextResponse(
    new Blob([new Uint8Array(blob)], { type: "application/zip" }),
    {
      status: 200,
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": `attachment; filename="nordestai-meus-dados-${today}.zip"`,
        "Cache-Control": "no-store",
      },
    },
  );
}

/**
 * Convert an array of plain objects into a CSV string. Headers come from
 * the union of keys across all rows. Values are JSON-stringified if
 * they're objects, otherwise rendered as text.
 */
function toCsv(rows: Record<string, unknown>[]): string {
  if (rows.length === 0) return "";
  const headers = Array.from(
    new Set(rows.flatMap((r) => Object.keys(r))),
  );
  const escape = (v: unknown): string => {
    if (v === null || v === undefined) return "";
    const s =
      typeof v === "object" ? JSON.stringify(v) : String(v);
    if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
    return s;
  };
  const body = rows
    .map((r) => headers.map((h) => escape(r[h])).join(","))
    .join("\n");
  return headers.join(",") + "\n" + body + "\n";
}
