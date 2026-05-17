"use client";

/**
 * Root error boundary, catches errors in the root layout itself (when
 * `app/error.tsx` couldn't render). Must render its own <html>/<body>
 * per Next.js docs.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="pt-BR">
      <body style={{ margin: 0, fontFamily: "system-ui, sans-serif" }}>
        <div
          style={{
            minHeight: "100vh",
            display: "grid",
            placeItems: "center",
            padding: "24px",
            background: "#fafafa",
          }}
        >
          <div style={{ maxWidth: 420, textAlign: "center" }}>
            <div
              style={{
                width: 64,
                height: 64,
                borderRadius: "50%",
                background: "#fee2e2",
                color: "#b91c1c",
                display: "grid",
                placeItems: "center",
                margin: "0 auto 16px",
                fontSize: 28,
                fontWeight: 700,
              }}
            >
              !
            </div>
            <h1 style={{ fontSize: 22, margin: "0 0 8px", color: "#1f2937" }}>
              Algo deu muito errado
            </h1>
            <p style={{ fontSize: 14, color: "#6b7280", margin: "0 0 16px" }}>
              A aplicação não pôde inicializar. Recarrega a página.
            </p>
            {error.digest && (
              <p
                style={{
                  fontSize: 11,
                  color: "#9ca3af",
                  fontFamily: "monospace",
                  marginBottom: 16,
                }}
              >
                ref: {error.digest}
              </p>
            )}
            <button
              onClick={reset}
              style={{
                height: 44,
                padding: "0 20px",
                borderRadius: 999,
                background: "#1f2937",
                color: "#fff",
                fontSize: 13,
                fontWeight: 500,
                border: "none",
                cursor: "pointer",
              }}
            >
              Tentar de novo
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
