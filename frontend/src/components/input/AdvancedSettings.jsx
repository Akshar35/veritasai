import { useState } from "react"

export default function AdvancedSettings({ settings, setSettings }) {
  const [open, setOpen] = useState(false)

  const update = (key, value) => setSettings(prev => ({ ...prev, [key]: value }))

  return (
    <div style={{ borderTop: "1px solid var(--border)", paddingTop: 16 }}>
      <button
        onClick={() => setOpen(!open)}
        style={{
          width: "100%",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          background: "transparent",
          border: "none",
          cursor: "pointer",
          padding: "4px 0"
        }}
      >
        <span style={{
          fontSize: 14,
          fontWeight: 700,
          letterSpacing: 1,
          color: "var(--text-dim)",
          fontFamily: "'DM Sans', sans-serif"
        }}>ADVANCED SETTINGS</span>
        <span style={{
          fontSize: 14,
          color: "var(--text-muted)",
          transform: open ? "rotate(180deg)" : "rotate(0deg)",
          transition: "transform 0.2s"
        }}>▼</span>
      </button>

      {open && (
        <div style={{
          marginTop: 16,
          display: "flex",
          flexDirection: "column",
          gap: 16,
          animation: "fadeIn 0.2s ease"
        }}>

          {/* Model selectors */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            {[
              { label: "EXTRACTOR MODEL", key: "extractor_model", options: ["gemini", "groq"] },
              { label: "VERIFIER MODEL", key: "verifier_model", options: ["groq", "gemini"] }
            ].map(({ label, key, options }) => (
              <div key={key}>
                <p style={{ fontSize: 13, color: "var(--text-muted)", letterSpacing: 1, marginBottom: 6, fontWeight: 700 }}>{label}</p>
                <select
                  value={settings[key]}
                  onChange={e => update(key, e.target.value)}
                  style={{
                    width: "100%",
                    padding: "10px 12px",
                    border: "1px solid var(--border)",
                    background: "var(--bg)",
                    fontSize: 14,
                    color: "var(--text)",
                    fontFamily: "'DM Sans', sans-serif",
                    cursor: "pointer"
                  }}
                >
                  {options.map(o => (
                    <option key={o} value={o}>{o === "gemini" ? "Gemini 2.5 Flash" : "Groq LLaMA 3.3 70B"}</option>
                  ))}
                </select>
              </div>
            ))}
          </div>

          {/* Depth */}
          <div>
            <p style={{ fontSize: 13, color: "var(--text-muted)", letterSpacing: 1, marginBottom: 8, fontWeight: 700 }}>VERIFICATION DEPTH</p>
            <div style={{ display: "flex", gap: 0 }}>
              {["quick", "standard", "deep"].map(d => (
                <button
                  key={d}
                  onClick={() => update("depth", d)}
                  style={{
                    flex: 1,
                    padding: "8px",
                    border: "1px solid var(--border)",
                    borderRight: d !== "deep" ? "none" : "1px solid var(--border)",
                    background: settings.depth === d ? "var(--navy)" : "var(--bg)",
                    color: settings.depth === d ? "white" : "var(--text-dim)",
                    fontSize: 13,
                    fontWeight: 700,
                    letterSpacing: 0.5,
                    cursor: "pointer",
                    fontFamily: "'DM Sans', sans-serif",
                    textTransform: "uppercase",
                    transition: "all 0.15s"
                  }}
                >{d}</button>
              ))}
            </div>
          </div>

          {/* Sliders */}
          {[
            { label: "MAX CLAIMS", key: "max_claims", min: 3, max: 10 },
            { label: "SOURCES PER CLAIM", key: "sources_per_claim", min: 2, max: 6 }
          ].map(({ label, key, min, max }) => (
            <div key={key}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                <p style={{ fontSize: 13, color: "var(--text-muted)", letterSpacing: 1, fontWeight: 700 }}>{label}</p>
                <p style={{ fontSize: 14, color: "var(--navy)", fontFamily: "'JetBrains Mono', monospace", fontWeight: 700 }}>{settings[key]}</p>
              </div>
              <input
                type="range"
                min={min}
                max={max}
                value={settings[key]}
                onChange={e => update(key, parseInt(e.target.value))}
                style={{ width: "100%", accentColor: "var(--navy)" }}
              />
            </div>
          ))}

          {/* Min source tier */}
          <div>
            <p style={{ fontSize: 13, color: "var(--text-muted)", letterSpacing: 1, marginBottom: 8, fontWeight: 700 }}>MINIMUM SOURCE QUALITY</p>
            <div style={{ display: "flex", gap: 0 }}>
              {[
                { label: "ALL SOURCES", value: 4 },
                { label: "TIER 1-2 ONLY", value: 2 },
                { label: "TIER 1 ONLY", value: 1 }
              ].map(({ label, value }) => (
                <button
                  key={value}
                  onClick={() => update("min_source_tier", value)}
                  style={{
                    flex: 1,
                    padding: "8px 4px",
                    border: "1px solid var(--border)",
                    borderRight: value !== 1 ? "none" : "1px solid var(--border)",
                    background: settings.min_source_tier === value ? "var(--navy)" : "var(--bg)",
                    color: settings.min_source_tier === value ? "white" : "var(--text-dim)",
                    fontSize: 12,
                    fontWeight: 700,
                    letterSpacing: 0.5,
                    cursor: "pointer",
                    fontFamily: "'DM Sans', sans-serif",
                    textTransform: "uppercase",
                    transition: "all 0.15s"
                  }}
                >{label}</button>
              ))}
            </div>
          </div>

        </div>
      )}
    </div>
  )
}