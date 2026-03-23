import { useState } from "react"
import Header from "./components/layout/Header"
import Footer from "./components/layout/Footer"
import InputPanel from "./components/input/InputPanel"
import PipelineView from "./components/pipeline/PipelineView"
import AccuracyReport from "./components/report/AccuracyReport"

export default function App() {
  const [phase, setPhase] = useState("input")
  const [events, setEvents] = useState([])
  const [report, setReport] = useState(null)
  const [inputText, setInputText] = useState("")
  const [errorMsg, setErrorMsg] = useState("")
  const [lastSubmit, setLastSubmit] = useState(null)
  const [imageResult, setImageResult] = useState(null)
  const [settings, setSettings] = useState({
    extractor_model: "groq",
    verifier_model: "groq",
    depth: "standard",
    max_claims: 6,
    sources_per_claim: 3,
    min_source_tier: 4
  })

  const handleSubmit = async ({ input, inputType }) => {
    setInputText(input)
    setPhase("loading")
    setEvents([])
    setReport(null)
    setErrorMsg("")
    setLastSubmit({ input, inputType })

    try {
      const res = await fetch("https://akshar35-veritasai.hf.space/factcheck/stream", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          input,
          input_type: inputType,
          ...settings
        })
      })

      const reader = res.body.getReader()
      const decoder = new TextDecoder()

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const chunk = decoder.decode(value)
        const lines = chunk.split("\n").filter(l => l.startsWith("data: "))

        for (const line of lines) {
          try {
            const json = JSON.parse(line.replace("data: ", ""))
            setEvents(prev => [...prev, json])

            if (json.type === "report") {
              setReport(json.data)
              setPhase("report")
            }
            if (json.type === "error") {
              setErrorMsg(json.message || "Pipeline error occurred")
              setPhase("error")
            }
          } catch {}
        }
      }
    } catch (err) {
      setErrorMsg("Connection error. Is the backend running?")
      setPhase("error")
    }
  }

  const handleReset = () => {
    setPhase("input")
    setEvents([])
    setReport(null)
    setErrorMsg("")
  }

  const handleRetry = () => {
    if (lastSubmit) {
      handleSubmit(lastSubmit)
    } else {
      handleReset()
    }
  }

  const handleImageDetect = async ({ type, url, file }) => {
  setPhase("loading")
  setImageResult(null)
  setEvents([{ type: "node_start", node: "ai_detector", message: "🤖 Analyzing image for AI generation..." }])

  try {
    let res
    if (type === "url") {
      res = await fetch("https://akshar35-veritasai.hf.space/detect-image/url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url })
      })
    } else {
      const formData = new FormData()
      formData.append("file", file)
      res = await fetch("https://akshar35-veritasai.hf.space/detect-image/upload", {
        method: "POST",
        body: formData
      })
    }

    const data = await res.json()
    console.log("Image detection response:", data)

    setImageResult({
      ...data,
      ai_probability: data.ai_probability ?? data.ai_generated_probability ?? null,
      imagePreview: type === "url" ? url : URL.createObjectURL(file)
    })
    setPhase("imageResult")
  } catch (err) {
    setErrorMsg("Image detection failed. Is the backend running?")
    setPhase("error")
  }
}


  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", width: "100%" }}>
      <Header onReset={handleReset} showReset={phase !== "input"} />
      <main style={{ flex: 1, width: "100%", padding: "48px 24px", maxWidth: 1100, margin: "0 auto",  }}>
        {phase === "input" && (
          <InputPanel
            onSubmit={handleSubmit}
            onImageDetect={handleImageDetect}
            settings={settings}
            setSettings={setSettings}
          />
        )}
        {phase === "loading" && (
          <PipelineView events={events} />
        )}
        {phase === "report" && report && (
          <AccuracyReport report={report} inputText={inputText} />
        )}
        {phase === "imageResult" && imageResult && (
          <div style={{ animation: "fadeUp 0.4s ease" }}>
            <div style={{ textAlign: "center", marginBottom: 32 }}>
              <h2 style={{
                fontFamily: "'Playfair Display', serif",
                fontSize: 36,
                fontWeight: 900,
                color: "var(--navy)",
                marginBottom: 8
              }}>AI Image Analysis</h2>
              <p style={{
                fontSize: 13,
                color: "var(--text-muted)",
                letterSpacing: 2,
                fontWeight: 600,
                fontFamily: "'JetBrains Mono', monospace"
              }}>DETECTION REPORT — {new Date().toLocaleDateString()}</p>
            </div>

            <div style={{
              background: "var(--white)",
              border: "1px solid var(--border)",
              padding: "32px",
              maxWidth: 560,
              margin: "0 auto"
            }}>
              {/* Image preview */}
              {imageResult.imagePreview && (
                <div style={{
                  marginBottom: 24,
                  textAlign: "center",
                  border: "1px solid var(--border)",
                  padding: 8
                }}>
                  <img
                    src={imageResult.imagePreview}
                    alt="Analyzed"
                    style={{ maxWidth: "100%", maxHeight: 280, objectFit: "contain" }}
                  />
                </div>
              )}

              {/* Result */}
              {imageResult.error ? (
                <div style={{
                  padding: "16px 20px",
                  background: "var(--red-bg)",
                  border: "1px solid var(--red)",
                  color: "var(--red)",
                  fontSize: 14,
                  marginBottom: 20
                }}>⚠️ {imageResult.error}</div>
              ) : (
                <div>
                  <div style={{
                    fontSize: 13,
                    fontWeight: 700,
                    letterSpacing: 1,
                    color: "var(--text-muted)",
                    marginBottom: 12
                  }}>AI GENERATION PROBABILITY</div>

                  {/* Probability gauge */}
                  <div style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 16,
                    marginBottom: 20
                  }}>
                    <div style={{
                      fontSize: 48,
                      fontWeight: 900,
                      fontFamily: "'JetBrains Mono', monospace",
                      color: (imageResult.ai_probability || 0) > 0.5 ? "var(--red)" : "var(--green)"
                    }}>
                      {imageResult.ai_probability != null
                        ? `${Math.round(imageResult.ai_probability * 100)}%`
                        : "N/A"}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{
                        width: "100%",
                        height: 12,
                        background: "var(--bg)",
                        borderRadius: 6,
                        overflow: "hidden",
                        border: "1px solid var(--border)"
                      }}>
                        <div style={{
                          width: `${Math.round((imageResult.ai_probability || 0) * 100)}%`,
                          height: "100%",
                          background: (imageResult.ai_probability || 0) > 0.5
                            ? "linear-gradient(90deg, var(--amber), var(--red))"
                            : "linear-gradient(90deg, var(--green), var(--amber))",
                          transition: "width 0.5s ease"
                        }} />
                      </div>
                      <div style={{
                        display: "flex",
                        justifyContent: "space-between",
                        marginTop: 6,
                        fontSize: 11,
                        color: "var(--text-muted)",
                        fontWeight: 600
                      }}>
                        <span>HUMAN</span>
                        <span>AI GENERATED</span>
                      </div>
                    </div>
                  </div>

                  <div style={{
                    padding: "14px 16px",
                    background: (imageResult.ai_probability || 0) > 0.7 ? "var(--red-bg)" : (imageResult.ai_probability || 0) > 0.4 ? "var(--amber-bg)" : "var(--green-bg)",
                    border: `1px solid ${(imageResult.ai_probability || 0) > 0.7 ? "var(--red)" : (imageResult.ai_probability || 0) > 0.4 ? "var(--amber)" : "var(--green)"}`,
                    fontSize: 14,
                    fontWeight: 600,
                    color: (imageResult.ai_probability || 0) > 0.7 ? "var(--red)" : (imageResult.ai_probability || 0) > 0.4 ? "var(--amber)" : "var(--green)"
                  }}>
                    {(imageResult.ai_probability || 0) > 0.7
                      ? "🚩 High likelihood of AI generation"
                      : (imageResult.ai_probability || 0) > 0.4
                        ? "⚠️ Uncertain — possibly AI-generated"
                        : "✅ Likely authentic (human-created)"}
                  </div>
                </div>
              )}

              {/* Back button */}
              <button
                onClick={handleReset}
                style={{
                  width: "100%",
                  marginTop: 24,
                  padding: "14px",
                  background: "var(--navy)",
                  color: "white",
                  border: "none",
                  fontSize: 14,
                  fontWeight: 700,
                  letterSpacing: 1.5,
                  cursor: "pointer",
                  fontFamily: "'DM Sans', sans-serif"
                }}
              >ANALYZE ANOTHER IMAGE</button>
            </div>
          </div>
        )}
        {phase === "error" && (
          <div style={{
            animation: "fadeUp 0.4s ease",
            textAlign: "center",
            padding: "48px 24px"
          }}>
            <div style={{
              background: "var(--white)",
              border: "1px solid var(--border)",
              borderLeft: "4px solid var(--red)",
              padding: "32px 40px",
              maxWidth: 560,
              margin: "0 auto"
            }}>
              <div style={{
                fontSize: 48,
                marginBottom: 16
              }}>⚠️</div>
              <h2 style={{
                fontFamily: "'Playfair Display', serif",
                fontSize: 28,
                fontWeight: 900,
                color: "var(--navy)",
                marginBottom: 12
              }}>Verification Failed</h2>
              <p style={{
                fontSize: 15,
                color: "var(--text-dim)",
                lineHeight: 1.6,
                marginBottom: 28
              }}>{errorMsg}</p>
              <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
                <button
                  onClick={handleRetry}
                  style={{
                    padding: "14px 32px",
                    background: "var(--navy)",
                    color: "white",
                    border: "none",
                    fontSize: 14,
                    fontWeight: 700,
                    letterSpacing: 1.5,
                    cursor: "pointer",
                    fontFamily: "'DM Sans', sans-serif",
                    transition: "background 0.2s"
                  }}
                >RETRY VERIFICATION</button>
                <button
                  onClick={handleReset}
                  style={{
                    padding: "14px 32px",
                    background: "transparent",
                    color: "var(--text-dim)",
                    border: "1px solid var(--border)",
                    fontSize: 14,
                    fontWeight: 600,
                    letterSpacing: 1,
                    cursor: "pointer",
                    fontFamily: "'DM Sans', sans-serif",
                    transition: "border-color 0.2s"
                  }}
                >START OVER</button>
              </div>
            </div>
          </div>
        )}
      </main>
      <Footer />
    </div>
  )
}
