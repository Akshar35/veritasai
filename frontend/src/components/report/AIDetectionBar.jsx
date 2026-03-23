export default function AIDetectionBar({ report }) {
  return (
    <div style={{
      background: "var(--white)",
      border: "1px solid var(--border)",
      borderLeft: "3px solid var(--navy)",
      padding: "16px 20px",
      marginBottom: 24,
      display: "flex",
      gap: 32,
      alignItems: "center",
      flexWrap: "wrap"
    }}>
      <div>
        <p style={{ fontSize: 13, color: "var(--text-muted)", letterSpacing: 1, marginBottom: 4, fontWeight: 700 }}>🤖 AI TEXT PROBABILITY</p>
        <p style={{
          fontSize: 24,
          fontFamily: "'JetBrains Mono', monospace",
          fontWeight: 700,
          color: report.ai_text_probability > 0.7 ? "var(--red)"
            : report.ai_text_probability > 0.4 ? "var(--amber)" : "var(--green)"
        }}>
          {report.ai_text_probability != null
            ? `${Math.round(report.ai_text_probability * 100)}%`
            : "N/A"}
        </p>
      </div>

      {report.ai_image_results?.map((img, i) => (
        <div key={i}>
          <p style={{ fontSize: 13, color: "var(--text-muted)", letterSpacing: 1, marginBottom: 4, fontWeight: 700 }}>
            🖼 IMAGE {i + 1} AI PROBABILITY
          </p>
          <p style={{
            fontSize: 24,
            fontFamily: "'JetBrains Mono', monospace",
            fontWeight: 700,
            color: img.ai_probability > 0.7 ? "var(--red)"
              : img.ai_probability > 0.4 ? "var(--amber)" : "var(--green)"
          }}>
            {img.ai_probability != null ? `${Math.round(img.ai_probability * 100)}%` : "N/A"}
          </p>
        </div>
      ))}
    </div>
  )
}