export default function Footer() {
  return (
    <footer style={{
      borderTop: "1px solid var(--border)",
      padding: "24px 40px",
      display: "flex",
      justifyContent: "space-between",
      alignItems: "flex-start",
      background: "var(--bg)"
    }}>
      <div>
        <div style={{
          fontFamily: "'Playfair Display', serif",
          fontWeight: 700,
          fontSize: 18,
          marginBottom: 6
        }}>VeritasAI</div>
        <div style={{ fontSize: 13, color: "var(--text-muted)", maxWidth: 280, lineHeight: 1.5, fontWeight: 500 }}>
          © 2025 VeritasAI. The Digital Broadsheet. All claims verified with academic precision.
        </div>
      </div>
      <nav style={{ display: "flex", gap: 24, flexWrap: "wrap", justifyContent: "flex-end" }}>
        {["PRIVACY POLICY", "TERMS OF SERVICE", "FACT-CHECK STANDARDS", "CONTACT EDITORIAL"].map(item => (
          <span key={item} style={{
            fontSize: 13,
            color: "var(--text-muted)",
            letterSpacing: 0.8,
            cursor: "pointer",
            fontWeight: 600
          }}>{item}</span>
        ))}
      </nav>
    </footer>
  )
}