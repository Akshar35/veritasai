export default function Footer() {
  return (
    <footer style={{
      borderTop: "1px solid var(--border)",
      padding: "20px 32px",
      display: "flex",
      justifyContent: "space-between",
      alignItems: "flex-start",
      background: "var(--bg)"
    }}>
      <div>
        <div style={{
          fontFamily: "'Playfair Display', serif",
          fontWeight: 700,
          fontSize: 22,
          marginBottom: 3
        }}>VeritasAI</div>
        <div style={{ fontSize: 14, color: "var(--text-muted)", maxWidth: 280, lineHeight: 1, fontWeight: 500 }}>
        </div>
      </div>
      <nav style={{ display: "flex", gap: 24, flexWrap: "wrap", justifyContent: "flex-end", marginTop: 2 }}>
        {["PRIVACY POLICY", "TERMS OF SERVICE", "FACT-CHECK STANDARDS", "CONTACT EDITORIAL"].map(item => (
          <span key={item} style={{
            fontSize: 14,
            color: "var(--text-muted)",
            letterSpacing: 0.8,
            cursor: "pointer",
            fontWeight: 700
          }}>{item}</span>
        ))}
      </nav>
    </footer>
  )
}