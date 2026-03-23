import { useEffect, useRef } from "react"

export default function TerminalLog({ logs }) {
  const bottomRef = useRef(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [logs])

  return (
    <div style={{
      background: "#0d0d0d",
      border: "1px solid #333",
      padding: "16px",
      fontFamily: "'JetBrains Mono', monospace",
      fontSize: 13,
      minHeight: 140,
      maxHeight: 280,
      overflowY: "auto"
    }}>
      <div style={{
        display: "flex",
        justifyContent: "space-between",
        marginBottom: 12,
        paddingBottom: 8,
        borderBottom: "1px solid #333"
      }}>
        <span style={{ color: "#666", fontSize: 11 }}>SYSTEM LOG V4.1.0</span>
        <span style={{ color: "#4caf50", fontSize: 11 }}>STATUS: RUNNING</span>
      </div>

      {logs.length === 0 && (
        <div style={{ color: "#555" }}>Initializing pipeline...</div>
      )}

      {logs.map((log, i) => (
        <div key={i} style={{
          marginBottom: 4,
          color: log.status === "OK" ? "#4caf50" : log.status === "BUSY" ? "#f5a623" : log.status === "INFO" ? "#8a8a8a" : "#e74c3c"
        }}>
          <span style={{ color: "#555", marginRight: 8 }}>[{log.status}]</span>
          {log.text}
        </div>
      ))}

      <div style={{ color: "#555", animation: "blink 1s infinite" }}>_</div>
      <div ref={bottomRef} />
    </div>
  )
}