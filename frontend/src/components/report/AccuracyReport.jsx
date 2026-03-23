import ScoreHeader from "./ScoreHeader"
import ClaimCard from "./ClaimCard"
import AIDetectionBar from "./AIDetectionBar"
import OriginalTextHighlight from "./OriginalTextHighlight"
import ExportReport from "./ExportReport"

export default function AccuracyReport({ report, inputText }) {
  const title = inputText?.slice(0, 80) + (inputText?.length > 80 ? "..." : "")

  return (
    <div style={{ animation: "fadeUp 0.4s ease" }}>
      {/* Layout Split: Left 35% / Right 65% */}
      <div style={{ 
        display: "flex", 
        gap: 48, 
        alignItems: "flex-start",
        flexWrap: "wrap" 
      }}>
        
        {/* LEFT COLUMN: Metadata & Score (35% Sticky) */}
        <div style={{ 
          flex: "0 0 calc(35% - 24px)", 
          minWidth: 320, 
          position: "sticky", 
          top: 32,
          background: "var(--white)",
          border: "1px solid var(--border)",
          padding: "32px",
          maxHeight: "calc(100vh - 64px)",
          overflowY: "auto"
        }}>
          {/* Audit tag */}
          <div style={{
            fontSize: 13,
            color: "var(--text-muted)",
            letterSpacing: 1,
            marginBottom: 8,
            fontWeight: 600,
            fontFamily: "'JetBrains Mono', monospace"
          }}>VERIFICATION AUDIT #{Math.random().toString(36).slice(2,8).toUpperCase()}</div>

          {/* Score + Title row (Stacked vertically for sidebar) */}
          <div style={{ display: "flex", flexDirection: "column", gap: 24, marginBottom: 32, alignItems: "flex-start" }}>
            <ScoreHeader report={report} />
            <div style={{ width: "100%" }}>
              <h2 style={{
                fontFamily: "'Playfair Display', serif",
                fontSize: 26,
                fontWeight: 900,
                color: "var(--navy)",
                lineHeight: 1.3,
                marginBottom: 20
              }}>{title}</h2>

              {/* Stats row */}
              <div style={{ display: "flex", gap: 24, borderTop: "1px solid var(--border)", paddingTop: 16, flexWrap: "wrap" }}>
                {[
                  { label: "TRUE", count: report.true_count, color: "var(--green)" },
                  { label: "FALSE", count: report.false_count, color: "var(--red)" },
                  { label: "MIXED", count: report.partial_count, color: "var(--amber)" },
                ].map(s => (
                  <div key={s.label}>
                    <div style={{ fontSize: 11, color: "var(--text-muted)", letterSpacing: 1, marginBottom: 4, fontWeight: 700 }}>{s.label}</div>
                    <div style={{ fontSize: 28, fontWeight: 700, color: s.color, fontFamily: "'JetBrains Mono', monospace" }}>
                      {String(s.count).padStart(2, "0")}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* AI Detection */}
          {(report.ai_text_probability != null || report.ai_image_results?.length > 0) && (
            <div style={{ marginBottom: 24 }}>
              <AIDetectionBar report={report} />
            </div>
          )}

          {/* Errors */}
          {report.errors?.length > 0 && (
            <div style={{
              background: "var(--red-bg)",
              border: "1px solid var(--red)",
              borderLeft: "3px solid var(--red)",
              padding: "10px 14px",
              marginBottom: 24,
              fontSize: 14,
              color: "var(--red)"
            }}>⚠️ {report.errors.join(" | ")}</div>
          )}

          {/* Original Text with Claim Highlighting */}
          <OriginalTextHighlight inputText={inputText} claims={report.claims} />
        </div>

        {/* RIGHT COLUMN: Detailed Claims (65%) */}
        <div style={{ flex: "1 1 calc(65% - 24px)", minWidth: 400 }}>
          {/* Claims */}
          <div style={{
            borderTop: "2px solid var(--navy)",
            paddingTop: 0, /* Top border aligns with top of sticky sidebar if needed, or leave padding */
            marginTop: 0
          }}>
            <h3 style={{
              fontSize: 16,
              fontWeight: 800,
              letterSpacing: 1.5,
              color: "var(--navy)",
              marginBottom: 24,
              paddingTop: 16
            }}>DETAILED CLAIM VERIFICATION</h3>

            {report.claims?.map((claim, i) => (
              <ClaimCard key={claim.id} claim={claim} index={i} />
            ))}
          </div>

          {/* Export Report */}
          <div style={{ marginTop: 40 }}>
            <ExportReport report={report} inputText={inputText} />
          </div>
        </div>
      </div>
    </div>
  )
}