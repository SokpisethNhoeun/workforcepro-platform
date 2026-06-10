"use client"

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "grid",
          placeItems: "center",
          fontFamily: "system-ui, sans-serif",
          background: "#0b1220",
          color: "#f8fafc",
          padding: "1.5rem",
        }}
      >
        <div
          style={{
            maxWidth: 420,
            width: "100%",
            background: "#111827",
            border: "1px solid #1f2937",
            borderRadius: 12,
            padding: "2rem",
            textAlign: "center",
          }}
        >
          <p style={{ margin: 0, fontSize: 12, letterSpacing: "0.08em", color: "#94a3b8", textTransform: "uppercase" }}>
            WorkforcePro
          </p>
          <h1 style={{ margin: "0.5rem 0 0", fontSize: 22 }}>The application crashed</h1>
          <p style={{ marginTop: 8, fontSize: 14, color: "#cbd5e1" }}>
            A fatal error prevented the page from rendering. Please reload to try again.
          </p>
          {error.digest ? (
            <p style={{ marginTop: 12, fontFamily: "monospace", fontSize: 12, color: "#94a3b8" }}>
              ref: {error.digest}
            </p>
          ) : null}
          <button
            onClick={() => reset()}
            style={{
              marginTop: 20,
              padding: "0.625rem 1rem",
              background: "#06b6d4",
              color: "#0b1220",
              border: 0,
              borderRadius: 8,
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Reload
          </button>
        </div>
      </body>
    </html>
  )
}
