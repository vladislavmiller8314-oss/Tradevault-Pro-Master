"use client";

export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="de">
      <body style={{ background: "#0B0C11", color: "#E8EAF0", fontFamily: "system-ui, sans-serif" }}>
        <div
          style={{
            minHeight: "100vh",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "16px",
          }}
        >
          <div style={{ textAlign: "center", maxWidth: 360 }}>
            <div style={{ fontSize: 36, marginBottom: 8 }}>⚠️</div>
            <h1 style={{ fontSize: 15, fontWeight: 600, marginBottom: 8 }}>
              TradeVault Pro konnte nicht geladen werden
            </h1>
            <p style={{ fontSize: 13, color: "#8B93A7", marginBottom: 20 }}>
              Bitte lade die Seite neu. Falls das Problem bestehen bleibt,
              prüfe die Supabase-Umgebungsvariablen.
            </p>
            <button
              onClick={reset}
              style={{
                background: "rgba(0,200,83,0.1)",
                border: "1px solid rgba(0,200,83,0.3)",
                color: "#00C853",
                borderRadius: 10,
                padding: "8px 16px",
                fontSize: 13,
                fontWeight: 500,
                cursor: "pointer",
              }}
            >
              Erneut versuchen
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
