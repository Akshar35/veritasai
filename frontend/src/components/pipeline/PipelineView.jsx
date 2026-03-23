import { useMemo } from "react"
import TerminalLog from "./TerminalLog"

const STAGES = [
  { key: "ingest",            label: "STAGE 01", title: "Source Authentication",      sub: "Data Extraction" },
  { key: "claim_extractor",   label: "STAGE 02", title: "Linguistic Pattern Matching", sub: "Analyzing Claim Structures" },
  { key: "evidence_retriever",label: "STAGE 03", title: "Cross-Reference Synthesis",   sub: "Retrieving Evidence" },
  { key: "claim_verifier",    label: "STAGE 04", title: "Claim Verification",          sub: "Applying Verdict Logic" },
  { key: "conflict_resolver", label: "STAGE 05", title: "Conflict Resolution",         sub: "Weighing Source Authority" },
  { key: "ai_detector",       label: "STAGE 06", title: "AI Content Detection",        sub: "Scanning for Synthetic Media" },
  { key: "report_assembler",  label: "STAGE 07", title: "Report Assembly",             sub: "Building Accuracy Report" },
]

const CASE_REF = `VA-${Math.floor(Math.random()*900+100)}-${Math.floor(Math.random()*9000+1000)}-X`

export default function PipelineView({ events }) {
  const { nodeStatus, logs } = useMemo(() => {
    const nodeStatus = {}
    const logs = []

    for (const e of events) {
      if (e.type === "node_start") {
        nodeStatus[e.node] = "running"
        logs.push({ status: "BUSY", text: e.message || `Starting ${e.node}...` })
      }
      if (e.type === "node_end") {
        nodeStatus[e.node] = "done"
        if (e.message) logs.push({ status: "OK", text: e.message })

        // Show extracted claim previews
        if (e.claims && e.claims.length > 0) {
          for (const c of e.claims) {
            logs.push({ status: "INFO", text: `   ├─ [${c.type}] "${c.text}"` })
          }
        }

        // Show search queries used
        if (e.queries && e.queries.length > 0) {
          for (const q of e.queries) {
            logs.push({ status: "INFO", text: `   ├─ Query: "${q}"` })
          }
        }

        // Show sources found
        if (e.sources && e.sources.length > 0) {
          for (const s of e.sources) {
            logs.push({ status: "INFO", text: `   └─ ${s}` })
          }
        }

        if (e.claim_count != null && !e.claims) {
          logs.push({ status: "OK", text: `Extracted ${e.claim_count} claims for verification` })
        }
      }
    }

    return { nodeStatus, logs }
  }, [events])

  const getStageStatus = (key) => {
    if (key === "evidence_retriever") {
      const running = Object.entries(nodeStatus).some(([k, v]) => k === key && v === "running")
      const done = Object.entries(nodeStatus).some(([k, v]) => k === key && v === "done")
      return running ? "running" : done ? "done" : "waiting"
    }
    return nodeStatus[key] || "waiting"
  }

  return (
    <div style={{ animation: "fadeUp 0.3s ease" }}>
      {/* Title */}
      <div style={{ textAlign: "center", marginBottom: 24 }}>
        <h2 style={{
          fontFamily: "'Playfair Display', serif",
          fontSize: 32,
          fontWeight: 900,
          color: "var(--navy)",
          marginBottom: 6
        }}>Analyzing Claims...</h2>
        <p style={{
          fontSize: 12,
          color: "var(--text-muted)",
          letterSpacing: 2,
          fontWeight: 600,
          fontFamily: "'JetBrains Mono', monospace"
        }}>CASE REFERENCE: {CASE_REF}</p>
      </div>

      {/* Two Column Layout */}
      <div style={{ 
        display: "flex", 
        gap: 24, 
        alignItems: "stretch",
        flexWrap: "wrap", /* Fallback for very small screens */
      }}>
        {/* Left: Stages (60%) */}
        <div style={{
          flex: "6 1 0%",
          minWidth: 400,
          background: "var(--white)",
          border: "1px solid var(--border)",
          padding: "24px"
        }}>
          {STAGES.map((stage, i) => {
            const status = getStageStatus(stage.key)
            return (
              <div key={stage.key} style={{
                display: "flex",
                alignItems: "center",
                gap: 16,
                marginBottom: i < STAGES.length - 1 ? 12 : 0,
                opacity: status === "waiting" ? 0.4 : 1,
                transition: "opacity 0.3s"
              }}>
                {/* Stage label */}
                <div style={{
                  width: 80,
                  fontSize: 12,
                  fontWeight: 700,
                  letterSpacing: 1,
                  color: status === "done" ? "var(--green)" : status === "running" ? "var(--navy)" : "var(--text-muted)",
                  fontFamily: "'DM Sans', sans-serif",
                  textAlign: "right",
                  flexShrink: 0
                }}>{stage.label}</div>

                {/* Icon */}
                <div style={{
                  width: 30, height: 30,
                  borderRadius: "50%",
                  border: `2px solid ${status === "done" ? "var(--green)" : status === "running" ? "var(--navy)" : "var(--border)"}`,
                  background: status === "done" ? "var(--green)" : status === "running" ? "var(--navy)" : "transparent",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  flexShrink: 0,
                  transition: "all 0.3s"
                }}>
                  {status === "done" && <span style={{ color: "white", fontSize: 13 }}>✓</span>}
                  {status === "running" && (
                    <div style={{
                      width: 8, height: 8,
                      borderRadius: "50%",
                      background: "white",
                      animation: "blink 1s infinite"
                    }} />
                  )}
                  {status === "waiting" && (
                    <div style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--border)" }} />
                  )}
                </div>

                {/* Stage card */}
                <div style={{
                  flex: 1,
                  padding: "10px 16px",
                  border: `1px solid ${status === "running" ? "var(--navy)" : "var(--border)"}`,
                  background: status === "running" ? "var(--navy)" : "var(--white)",
                  transition: "all 0.3s"
                }}>
                  <div style={{
                    fontSize: 15,
                    fontWeight: 700,
                    color: status === "running" ? "white" : "var(--text)",
                    marginBottom: 2
                  }}>{stage.title}</div>
                  <div style={{
                    fontSize: 13,
                    color: status === "running" ? "rgba(255,255,255,0.6)" : "var(--text-muted)"
                  }}>
                    {status === "running" ? stage.sub + "..." : stage.sub}
                    {status === "running" && (
                      <span style={{
                        display: "inline-block",
                        width: 32,
                        height: 2,
                        background: "rgba(255,255,255,0.4)",
                        marginLeft: 8,
                        verticalAlign: "middle"
                      }} />
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* Right: Terminal (40%) */}
        <div style={{ flex: "4 1 0%", minWidth: 300, display: "flex", flexDirection: "column" }}>
          <TerminalLog logs={logs} />
        </div>
      </div>
    </div>
  )
}