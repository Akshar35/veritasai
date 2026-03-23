import { useState, useRef } from "react"
import AdvancedSettings from "./AdvancedSettings"

const SAMPLES = [
  { label: "\"The latest economic report says...\"", value: "The US economy grew by 2.8% in 2024. Inflation has returned to the Fed's 2% target. Unemployment is at a 50-year low of 3.4%. The stock market reached all-time highs in January 2025.", type: "text" },
  { label: "\"A claim about recent climate data...\"", value: "Global temperatures in 2024 were the hottest ever recorded. Arctic sea ice reached a record low in September 2024. Carbon emissions fell for the first time in a decade.", type: "text" },
]

export default function InputPanel({ onSubmit, onImageDetect, settings, setSettings }) {
  const [input, setInput] = useState("")
  const [inputType, setInputType] = useState("text")
  const [imageUrl, setImageUrl] = useState("")
  const [imageFile, setImageFile] = useState(null)
  const [imagePreview, setImagePreview] = useState(null)
  const fileRef = useRef(null)

  return (
    
    <div style={{ maxWidth: 800, margin: "0 auto", animation: "fadeUp 0.4s ease" }}>
      <style>{`
        .verify-btn:hover { background: var(--navy-light) !important; }
        .sample-chip:hover { background: var(--bg3) !important; }
        textarea:focus { outline: none; border-color: var(--navy) !important; }
        .tab-btn:hover { color: var(--navy) !important; }
      `}</style>

      {/* Hero */}
      <div style={{ marginBottom: 32 }}>
        <h1 style={{
          fontFamily: "'Playfair Display', serif",
          fontSize: 48,
          fontWeight: 900,
          lineHeight: 1.05,
          color: "var(--navy)",
          marginBottom: 16
        }}>
          Every Claim.<br />Verified.
        </h1>
        <p style={{
          fontSize: 14,
          color: "var(--text-dim)",
          maxWidth: 480,
          lineHeight: 1.6,
          letterSpacing: 0.2
        }}>
          THE DIGITAL BROADSHEET. CROSS-REFERENCING MODERN STATEMENTS AGAINST THE ARCHIVE OF HUMAN KNOWLEDGE WITH ACADEMIC PRECISION.
        </p>
        <div style={{
          width: 48,
          height: 2,
          background: "var(--navy)",
          marginTop: 20
        }} />
      </div>

      {/* Card */}
      <div style={{
        background: "var(--white)",
        border: "1px solid var(--border)",
        padding: "24px",
      }}>
        {/* Tabs */}
        <div style={{
          display: "flex",
          gap: 0,
          marginBottom: 24,
          borderBottom: "1px solid var(--border)"
        }}>
          {["TEXT", "URL", "IMAGE"].map(t => (
            <button
              key={t}
              className="tab-btn"
              onClick={() => setInputType(t.toLowerCase())}
              style={{
                padding: "10px 24px",
                border: "none",
                background: "transparent",
                fontSize: 18,
                fontWeight: 800,
                letterSpacing: 1,
                cursor: "pointer",
                color: inputType === t.toLowerCase() ? "var(--navy)" : "var(--text-muted)",
                borderBottom: inputType === t.toLowerCase() ? "3px solid var(--navy)" : "3px solid transparent",
                marginBottom: -1,
                fontFamily: "'DM Sans', sans-serif",
                transition: "all 0.15s"
              }}
            >{t}</button>
          ))}
        </div>

        {inputType !== "image" && (
          <>
        {/* Textarea */}
        <textarea
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder={inputType === "url"
            ? "https://example.com/news-article..."
            : "Enter claims or paste a URL here..."
          }
          rows={inputType === "url" ? 2 : 3}
          style={{
            width: "100%",
            border: "1px solid var(--border)",
            background: "var(--bg)",
            padding: "16px 20px",
            fontSize: 16,
            color: "var(--text)",
            resize: "vertical",
            lineHeight: 1.6,
            fontFamily: inputType === "url" ? "'JetBrains Mono', monospace" : "'DM Sans', sans-serif",
            transition: "border-color 0.2s",
            marginBottom: 16
          }}
        />

        {/* Sample chips */}
        <div style={{ marginBottom: 20 }}>
          <p style={{
            fontSize: 15,
            color: "var(--text-muted)",
            letterSpacing: 1.5,
            marginBottom: 12,
            fontWeight: 800
          }}>TRY ASKING —</p>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            {SAMPLES.map(s => (
              <button
                key={s.label}
                className="sample-chip"
                onClick={() => { setInput(s.value); setInputType(s.type) }}
                style={{
                  padding: "10px 20px",
                  border: "1px solid var(--border)",
                  background: "var(--bg)",
                  fontSize: 15,
                  fontWeight: 600,
                  color: "var(--text-dim)",
                  cursor: "pointer",
                  fontFamily: "'DM Sans', sans-serif",
                  transition: "background 0.15s"
                }}
              >{s.label}</button>
            ))}
          </div>
        </div>

        {/* Verify button */}
        <button
          onClick={() => input.trim() && onSubmit({ input: input.trim(), inputType })}
          disabled={!input.trim()}
          className="verify-btn"
          style={{
            width: "100%",
            padding: "18px",
            background: input.trim() ? "var(--navy)" : "var(--bg3)",
            color: input.trim() ? "white" : "var(--text-muted)",
            border: "none",
            fontSize: 17,
            fontWeight: 800,
            letterSpacing: 2.5,
            cursor: input.trim() ? "pointer" : "not-allowed",
            fontFamily: "'DM Sans', sans-serif",
            transition: "background 0.2s",
            marginBottom: 24
          }}
        >VERIFY CLAIMS</button>

        {/* Advanced Settings */}
        <AdvancedSettings settings={settings} setSettings={setSettings} />
          </>
        )}

        {/* IMAGE TAB CONTENT */}
        {inputType === "image" && (
          <div>
            {/* Image URL input */}
            <div style={{ marginBottom: 16 }}>
              <label style={{
                fontSize: 13,
                fontWeight: 700,
                letterSpacing: 1,
                color: "var(--text-muted)",
                marginBottom: 8,
                display: "block"
              }}>IMAGE URL</label>
              <input
                type="text"
                value={imageUrl}
                onChange={e => { setImageUrl(e.target.value); setImageFile(null); setImagePreview(e.target.value) }}
                placeholder="https://example.com/image.jpg"
                style={{
                  width: "100%",
                  padding: "14px 16px",
                  border: "1px solid var(--border)",
                  background: "var(--bg)",
                  fontSize: 15,
                  color: "var(--text)",
                  fontFamily: "'JetBrains Mono', monospace"
                }}
              />
            </div>

            {/* OR divider */}
            <div style={{
              textAlign: "center",
              margin: "20px 0",
              color: "var(--text-muted)",
              fontSize: 15,
              fontWeight: 800,
              letterSpacing: 2
            }}>— OR —</div>

            {/* File upload zone */}
            <div
              onClick={() => fileRef.current?.click()}
              onDragOver={e => { e.preventDefault(); e.stopPropagation() }}
              onDrop={e => {
                e.preventDefault()
                const f = e.dataTransfer.files[0]
                if (f && f.type.startsWith("image/")) {
                  setImageFile(f)
                  setImageUrl("")
                  setImagePreview(URL.createObjectURL(f))
                }
              }}
              style={{
                border: "2px dashed var(--border)",
                background: "var(--bg)",
                padding: "32px",
                textAlign: "center",
                cursor: "pointer",
                transition: "border-color 0.2s",
                marginBottom: 16
              }}
            >
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                style={{ display: "none" }}
                onChange={e => {
                  const f = e.target.files[0]
                  if (f) {
                    setImageFile(f)
                    setImageUrl("")
                    setImagePreview(URL.createObjectURL(f))
                  }
                }}
              />
              <div style={{ fontSize: 40, marginBottom: 12 }}>📷</div>
              <div style={{ fontSize: 17, fontWeight: 700, color: "var(--text-dim)" }}>
                {imageFile ? imageFile.name : "Drop image here or click to upload"}
              </div>
              <div style={{ fontSize: 14, color: "var(--text-muted)", marginTop: 8, fontWeight: 500 }}>
                Supports JPG, PNG, WEBP
              </div>
            </div>

            {/* Image preview */}
            {imagePreview && (
              <div style={{
                marginBottom: 16,
                border: "1px solid var(--border)",
                padding: 8,
                textAlign: "center"
              }}>
                <img
                  src={imagePreview}
                  alt="Preview"
                  style={{ maxWidth: "100%", maxHeight: 240, objectFit: "contain" }}
                  onError={() => setImagePreview(null)}
                />
              </div>
            )}

            {/* Detect button */}
            <button
              onClick={() => {
                if (imageFile) {
                  onImageDetect({ type: "file", file: imageFile })
                } else if (imageUrl.trim()) {
                  onImageDetect({ type: "url", url: imageUrl.trim() })
                }
              }}
              disabled={!imageUrl.trim() && !imageFile}
              className="verify-btn"
              style={{
                width: "100%",
                padding: "18px",
                background: (imageUrl.trim() || imageFile) ? "var(--navy)" : "var(--bg3)",
                color: (imageUrl.trim() || imageFile) ? "white" : "var(--text-muted)",
                border: "none",
                fontSize: 17,
                fontWeight: 800,
                letterSpacing: 2.5,
                cursor: (imageUrl.trim() || imageFile) ? "pointer" : "not-allowed",
                fontFamily: "'DM Sans', sans-serif",
                transition: "background 0.2s"
              }}
            >🤖 DETECT AI IMAGE</button>
          </div>
        )}

        {/* Bottom trust indicators removed as requested */}
      </div>
    </div>
  )
}