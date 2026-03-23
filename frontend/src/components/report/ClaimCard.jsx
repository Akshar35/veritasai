import { useState } from "react"

const VERDICT_CONFIG = {
  TRUE:           { color: "var(--green)",  bg: "var(--green-bg)",  border: "#2d6a4f", label: "VERDICT: TRUE",     emoji: "✓" },
  FALSE:          { color: "var(--red)",    bg: "var(--red-bg)",    border: "#c0392b", label: "VERDICT: FALSE",    emoji: "✗" },
  PARTIALLY_TRUE: { color: "var(--amber)",  bg: "var(--amber-bg)",  border: "#b7650a", label: "VERDICT: PARTIAL",  emoji: "~" },
  UNVERIFIABLE:   { color: "var(--gray)",   bg: "var(--gray-bg)",   border: "#6b6455", label: "UNVERIFIABLE",     emoji: "?" },
  CONFLICTING:    { color: "var(--purple)", bg: "var(--purple-bg)", border: "#6d3b8e", label: "CONFLICTING",      emoji: "⚡" },
  OPINION:        { color: "var(--gray)",   bg: "var(--gray-bg)",   border: "#6b6455", label: "OPINION",          emoji: "◈" },
}

const TYPE_COLORS = {
  FACTUAL: "#3498db", TEMPORAL: "#e67e22",
  CAUSAL: "#9b59b6", COMPARATIVE: "#1abc9c", OPINION: "#95a5a6"
}

export default function ClaimCard({ claim, index }) {
  const [expanded, setExpanded] = useState(false)
  const config = VERDICT_CONFIG[claim.verdict] || VERDICT_CONFIG["UNVERIFIABLE"]

  return (
    <div style={{
      borderLeft: `3px solid ${config.border}`,
      background: "var(--white)",
      border: `1px solid var(--border)`,
      borderLeft: `3px solid ${config.border}`,
      marginBottom: 12,
      transition: "all 0.2s"
    }}>
      {/* Verdict badge + claim text */}
      <div style={{ padding: "16px 20px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <span style={{
              fontSize: 12,
              padding: "4px 10px",
              background: config.bg,
              color: config.color,
              fontWeight: 800,
              letterSpacing: 0.5,
              fontFamily: "'DM Sans', sans-serif"
            }}>{config.label}</span>
            <span style={{
              fontSize: 12,
              padding: "4px 10px",
              background: `${TYPE_COLORS[claim.type]}18`,
              color: TYPE_COLORS[claim.type],
              fontWeight: 800,
              letterSpacing: 0.5
            }}>{claim.type}</span>
            {claim.conflict_detected && (
              <span style={{
                fontSize: 12,
                padding: "4px 10px",
                background: "var(--purple-bg)",
                color: "var(--purple)",
                fontWeight: 800,
                letterSpacing: 0.5
              }}>⚡ CONFLICT</span>
            )}
          </div>
          <span style={{
            fontSize: 13,
            color: "var(--text-muted)",
            fontWeight: 600,
            fontFamily: "'JetBrains Mono', monospace"
          }}>{claim.confidence != null ? `${claim.confidence}%` : ""}</span>
        </div>

        <p style={{
          fontFamily: "'Playfair Display', serif",
          fontSize: 19,
          color: "var(--navy)",
          lineHeight: 1.5,
          fontWeight: 700,
          fontStyle: "italic"
        }}>"{claim.text}"</p>
      </div>

      {/* Expand button */}
      <div
        onClick={() => setExpanded(!expanded)}
        style={{
          padding: "8px 20px",
          borderTop: "1px solid var(--border)",
          display: "flex",
          alignItems: "center",
          gap: 8,
          cursor: "pointer",
          background: "var(--bg)"
        }}
      >
        <span style={{ fontSize: 13, color: "var(--text-muted)", fontWeight: 700, letterSpacing: 0.5 }}>
          {expanded ? "▲ HIDE REASONING" : "▼ EXPAND REASONING"}
        </span>
        {claim.evidence?.length > 0 && (
          <span style={{
            fontSize: 12, padding: "3px 8px",
            background: "var(--bg3)",
            color: "var(--text-muted)",
            fontWeight: 700
          }}>{claim.evidence.length} SOURCES</span>
        )}
      </div>

      {/* Expanded content */}
      {expanded && (
        <div style={{
          padding: "16px 20px",
          borderTop: "1px solid var(--border)",
          display: "flex",
          flexDirection: "column",
          gap: 14,
          animation: "fadeIn 0.2s ease"
        }}>
          {/* Confidence bar */}
          {claim.confidence != null && (
            <div>
              <div style={{ background: "var(--bg2)", height: 4, borderRadius: 2 }}>
                <div style={{
                  width: `${claim.confidence}%`,
                  height: "100%",
                  background: config.color,
                  borderRadius: 2,
                  transition: "width 0.6s ease"
                }} />
              </div>
            </div>
          )}

          {/* Reasoning */}
          {claim.reasoning && (
            <div>
              <p style={{ fontSize: 13, color: "var(--text-muted)", letterSpacing: 1, marginBottom: 6, fontWeight: 700 }}>REASONING</p>
              <p style={{ fontSize: 16, color: "var(--text-dim)", lineHeight: 1.6 }}>{claim.reasoning}</p>
            </div>
          )}

          {/* Self reflection */}
          {claim.self_reflection && claim.self_reflection !== "N/A" && (
            <div>
              <p style={{ fontSize: 13, color: "var(--text-muted)", letterSpacing: 1, marginBottom: 6, fontWeight: 700 }}>🔄 SELF-REFLECTION</p>
              <p style={{ fontSize: 15, color: "var(--text-muted)", lineHeight: 1.6, fontStyle: "italic" }}>{claim.self_reflection}</p>
            </div>
          )}

          {/* Evidence */}
          {claim.evidence?.length > 0 && (
            <div>
              <p style={{ fontSize: 13, color: "var(--text-muted)", letterSpacing: 1, marginBottom: 8, fontWeight: 700 }}>SOURCES</p>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {claim.evidence.map((e, i) => (
                  <a key={i} href={e.url} target="_blank" rel="noreferrer" style={{
                    display: "block",
                    padding: "10px 12px",
                    background: "var(--bg)",
                    border: "1px solid var(--border)",
                    textDecoration: "none",
                    transition: "border-color 0.15s"
                  }}>
                    <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 6 }}>
                      <span style={{
                        fontSize: 12, padding: "2px 8px",
                        background: e.source_tier === 1 ? "var(--green-bg)" : e.source_tier === 2 ? "#eaf0fb" : "var(--bg3)",
                        color: e.source_tier === 1 ? "var(--green)" : e.source_tier === 2 ? "#2d5be3" : "var(--text-muted)",
                        fontWeight: 800, letterSpacing: 0.5
                      }}>TIER {e.source_tier}</span>
                      <span style={{ fontSize: 15, color: "var(--navy)", fontWeight: 700 }}>{e.title}</span>
                    </div>
                    <p style={{ fontSize: 14, color: "var(--text-muted)", lineHeight: 1.5 }}>
                      {e.content?.slice(0, 150)}...
                    </p>
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}