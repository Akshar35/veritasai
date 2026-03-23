import { useState } from "react"

const VERDICT_CONFIG = {
  TRUE:           { color: "var(--green)",  bg: "var(--green-bg)",  label: "TRUE" },
  FALSE:          { color: "var(--red)",    bg: "var(--red-bg)",    label: "FALSE" },
  PARTIALLY_TRUE: { color: "var(--amber)",  bg: "var(--amber-bg)",  label: "PARTIAL" },
  UNVERIFIABLE:   { color: "var(--gray)",   bg: "var(--gray-bg)",   label: "UNVERIFIABLE" },
  CONFLICTING:    { color: "var(--purple)", bg: "var(--purple-bg)", label: "CONFLICTING" },
  OPINION:        { color: "var(--gray)",   bg: "var(--gray-bg)",   label: "OPINION" },
}

function highlightClaims(text, claims) {
  if (!text || !claims || claims.length === 0) return [{ text, highlight: false }]

  const segments = []
  let remaining = text

  // Sort claims by their position in the text
  const sortedClaims = [...claims]
    .map(c => ({
      ...c,
      index: text.toLowerCase().indexOf(c.text?.toLowerCase()?.slice(0, 40) || "")
    }))
    .filter(c => c.index >= 0)
    .sort((a, b) => a.index - b.index)

  let lastEnd = 0

  for (const claim of sortedClaims) {
    // Find the best match — look for the claim text or a substring of it
    const claimText = claim.text || ""
    let matchStart = -1
    let matchLength = 0

    // Try exact match first, then progressively shorter prefixes
    for (let len = Math.min(claimText.length, 80); len >= 20; len -= 5) {
      const searchStr = claimText.slice(0, len).toLowerCase()
      const idx = remaining.toLowerCase().indexOf(searchStr, lastEnd)
      if (idx >= 0) {
        matchStart = idx
        // Extend to end of sentence
        const sentenceEnd = remaining.indexOf(".", matchStart + len)
        matchLength = sentenceEnd >= 0 ? sentenceEnd - matchStart + 1 : len
        break
      }
    }

    if (matchStart >= 0 && matchStart >= lastEnd) {
      // Add non-highlighted text before this claim
      if (matchStart > lastEnd) {
        segments.push({ text: remaining.slice(lastEnd, matchStart), highlight: false })
      }
      // Add highlighted claim
      segments.push({
        text: remaining.slice(matchStart, matchStart + matchLength),
        highlight: true,
        claim
      })
      lastEnd = matchStart + matchLength
    }
  }

  // Add remaining text
  if (lastEnd < remaining.length) {
    segments.push({ text: remaining.slice(lastEnd), highlight: false })
  }

  return segments.length > 0 ? segments : [{ text, highlight: false }]
}

export default function OriginalTextHighlight({ inputText, claims }) {
  const [expanded, setExpanded] = useState(false)

  if (!inputText || inputText.length < 20) return null

  const segments = highlightClaims(inputText, claims)
  const hasHighlights = segments.some(s => s.highlight)

  return (
    <div style={{
      background: "var(--white)",
      border: "1px solid var(--border)",
      borderLeft: "3px solid var(--navy)",
      padding: "20px 24px",
      marginBottom: 24
    }}>
      <div
        onClick={() => setExpanded(!expanded)}
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          cursor: "pointer",
          marginBottom: expanded ? 16 : 0
        }}
      >
        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
          <span style={{
            fontSize: 13,
            fontWeight: 700,
            letterSpacing: 1,
            color: "var(--navy)"
          }}>📝 ORIGINAL TEXT</span>
          {hasHighlights && (
            <span style={{
              fontSize: 12,
              padding: "3px 8px",
              background: "var(--green-bg)",
              color: "var(--green)",
              fontWeight: 700
            }}>{segments.filter(s => s.highlight).length} CLAIMS MAPPED</span>
          )}
        </div>
        <span style={{
          fontSize: 13,
          color: "var(--text-muted)",
          fontWeight: 600
        }}>{expanded ? "▲" : "▼"}</span>
      </div>

      {expanded && (
        <div style={{ animation: "fadeIn 0.2s ease" }}>
          {/* Legend */}
          <div style={{
            display: "flex",
            gap: 16,
            marginBottom: 12,
            paddingBottom: 12,
            borderBottom: "1px solid var(--border)",
            flexWrap: "wrap"
          }}>
            <span style={{ fontSize: 12, color: "var(--text-muted)" }}>
              <span style={{
                display: "inline-block",
                width: 12,
                height: 12,
                background: "rgba(45, 106, 79, 0.15)",
                borderBottom: "2px solid var(--green)",
                marginRight: 6,
                verticalAlign: "middle"
              }} />
              Verified claim
            </span>
            <span style={{ fontSize: 12, color: "var(--text-muted)" }}>
              Regular text (not a claim)
            </span>
          </div>

          {/* Highlighted text */}
          <div style={{
            fontSize: 15,
            lineHeight: 1.8,
            color: "var(--text-dim)"
          }}>
            {segments.map((seg, i) => {
              if (!seg.highlight) {
                return <span key={i}>{seg.text}</span>
              }

              const config = VERDICT_CONFIG[seg.claim?.verdict] || VERDICT_CONFIG.UNVERIFIABLE

              return (
                <span
                  key={i}
                  title={`${config.label} (${seg.claim?.confidence || 0}% confidence)`}
                  style={{
                    background: `${config.bg}`,
                    borderBottom: `2px solid ${config.color}`,
                    padding: "2px 4px",
                    borderRadius: 2,
                    cursor: "help",
                    fontWeight: 600,
                    color: "var(--navy)",
                    transition: "background 0.15s"
                  }}
                >{seg.text}</span>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
