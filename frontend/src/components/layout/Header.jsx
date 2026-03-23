export default function Header({ onReset, showReset }) {
  return (
    <header style={{
      borderBottom: "1px solid var(--border)",
      background: "var(--bg)",
      padding: "0 40px",
      height: 64,
      display: "flex",
      alignItems: "center",
      gap: 40,
      position: "sticky",
      top: 0,
      zIndex: 100,
      backdropFilter: "blur(8px)"
    }}>
      <span style={{
        fontFamily: "'Playfair Display', serif",
        fontWeight: 900,
        fontSize: 32,
        color: "var(--navy)",
        letterSpacing: "-0.5px"
      }}>VeritasAI</span>

      <nav style={{ display: "flex", gap: 28, flex: 1 }}>
        {["ARCHIVE", "METHODOLOGY", "SOURCES"].map(item => (
          <span key={item} style={{
            fontSize: 15,
            fontWeight: 700,
            color: "var(--text-muted)",
            letterSpacing: 1,
            cursor: "pointer",
            fontFamily: "'DM Sans', sans-serif"
          }}>{item}</span>
        ))}
      </nav>

      {showReset ? (
        <button onClick={onReset} style={{
          background: "var(--navy)",
          color: "white",
          border: "none",
          padding: "12px 24px",
          fontSize: 15,
          fontWeight: 700,
          letterSpacing: 1,
          cursor: "pointer",
          fontFamily: "'DM Sans', sans-serif"
        }}>NEW CHECK</button>
      ) : (
        <button style={{
          background: "var(--navy)",
          color: "white",
          border: "none",
          padding: "12px 24px",
          fontSize: 15,
          fontWeight: 700,
          letterSpacing: 1,
          cursor: "pointer",
          fontFamily: "'DM Sans', sans-serif"
        }}>NEW CHECK</button>
      )}
    </header>
  )
}