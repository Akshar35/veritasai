export default function ScoreHeader({ report }) {
  const score = report.credibility_score
  const color = score >= 70 ? "var(--green)" : score >= 40 ? "var(--amber)" : "var(--red)"

  return (
    <div style={{ minWidth: 120 }}>
      <div style={{
        fontSize: 72,
        fontFamily: "'Playfair Display', serif",
        fontWeight: 900,
        color,
        lineHeight: 1
      }}>{score}</div>
      <div style={{ fontSize: 14, color: "var(--text-muted)", letterSpacing: 0.5, marginTop: 4, fontWeight: 600 }}>
        Credibility<br />Score
      </div>
      <div style={{
        width: "100%",
        height: 3,
        background: "var(--bg3)",
        marginTop: 12,
        borderRadius: 2
      }}>
        <div style={{
          width: `${score}%`,
          height: "100%",
          background: color,
          borderRadius: 2,
          transition: "width 0.8s ease"
        }} />
      </div>
    </div>
  )
}