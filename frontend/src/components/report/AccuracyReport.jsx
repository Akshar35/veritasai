import ScoreHeader from "./ScoreHeader"
import ClaimCard from "./ClaimCard"
import AIDetectionBar from "./AIDetectionBar"
import OriginalTextHighlight from "./OriginalTextHighlight"
import ExportReport from "./ExportReport"

export default function AccuracyReport({ report, inputText }) {
  const title = inputText?.slice(0, 80) + (inputText?.length > 80 ? "..." : "")

  return (
    <div style={{ animation: "fadeUp 0.4s ease" }}>
      {/* Audit tag */}
      <div style={{
        fontSize: 13,
        color: "var(--text-muted)",
        letterSpacing: 1,
        marginBottom: 8,
        fontWeight: 600,
        fontFamily: "'JetBrains Mono', monospace"
      }}>VERIFICATION AUDIT #{Math.random().toString(36).slice(2,8).toUpperCase()}</div>

      {/* Score + Title row */}
      <div style={{ display: "flex", gap: 40, marginBottom: 32, alignItems: "flex-start" }}>
        <ScoreHeader report={report} />
        <div style={{ flex: 1 }}>
          <h2 style={{
            fontFamily: "'Playfair Display', serif",
            fontSize: 32,
            fontWeight: 900,
            color: "var(--navy)",
            lineHeight: 1.2,
            marginBottom: 20
          }}>{title}</h2>

          {/* Stats row */}
          <div style={{ display: "flex", gap: 32, borderTop: "1px solid var(--border)", paddingTop: 16 }}>
            {[
              { label: "TRUE STATEMENTS", count: report.true_count, color: "var(--green)" },
              { label: "FALSE CLAIMS", count: report.false_count, color: "var(--red)" },
              { label: "PARTIAL/MISLEADING", count: report.partial_count, color: "var(--amber)" },
            ].map(s => (
              <div key={s.label}>
                <div style={{ fontSize: 13, color: "var(--text-muted)", letterSpacing: 1, marginBottom: 4, fontWeight: 700 }}>{s.label}</div>
                <div style={{ fontSize: 32, fontWeight: 700, color: s.color, fontFamily: "'JetBrains Mono', monospace" }}>
                  {String(s.count).padStart(2, "0")}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* AI Detection */}
      {(report.ai_text_probability != null || report.ai_image_results?.length > 0) && (
        <AIDetectionBar report={report} />
      )}

      {/* Errors */}
      {report.errors?.length > 0 && (
        <div style={{
          background: "var(--red-bg)",
          border: "1px solid var(--red)",
          borderLeft: "3px solid var(--red)",
          padding: "10px 14px",
          marginBottom: 16,
          fontSize: 14,
          color: "var(--red)"
        }}>⚠️ {report.errors.join(" | ")}</div>
      )}

      {/* Original Text with Claim Highlighting */}
      <OriginalTextHighlight inputText={inputText} claims={report.claims} />

      {/* Claims */}
      <div style={{
        borderTop: "2px solid var(--navy)",
        paddingTop: 24,
        marginTop: 8
      }}>
        <h3 style={{
          fontSize: 16,
          fontWeight: 800,
          letterSpacing: 1.5,
          color: "var(--navy)",
          marginBottom: 20
        }}>DETAILED CLAIM VERIFICATION</h3>

        {report.claims?.map((claim, i) => (
          <ClaimCard key={claim.id} claim={claim} index={i} />
        ))}
      </div>

      {/* Export Report */}
      <ExportReport report={report} inputText={inputText} />
    </div>
  )
}