# VeritasAI — AI-Powered Fact Verification Engine

> *Every Claim. Verified.*

VeritasAI is a production-grade, multi-agent fact-checking system that automatically extracts claims from any text or URL, retrieves real-time web evidence, and delivers a detailed accuracy report with verdicts, confidence scores, and cited sources.

**Live Demo:** https://veritasai-three.vercel.app  
**Backend API:** https://akshar35-veritasai.hf.space

---

## Features

- **Claim Extraction** — Automatically decomposes complex text into discrete, verifiable atomic statements
- **Claim Classification** — Tags each claim as FACTUAL, TEMPORAL, CAUSAL, COMPARATIVE, or OPINION
- **Parallel Evidence Retrieval** — Searches all claims simultaneously via Tavily (with DuckDuckGo fallback)
- **Chain-of-Thought Verification** — Groq LLaMA 3.3 70B verifies each claim with step-by-step reasoning
- **Self-Reflection Pass** — A second LLM call critiques and refines the initial verdict
- **Conflict Resolution** — Dedicated node detects contradicting sources and weighs authority by tier
- **Source Authority Scoring** — Tiers sources from Reuters/BBC (Tier 1) to unknown blogs (Tier 4)
- **AI Text Detection** — RoBERTa-based model scores probability of AI-generated text
- **AI Image Detection** — HuggingFace model detects AI-generated/deepfake images
- **URL Scraping** — Extracts and fact-checks full news articles from any URL
- **Configurable Pipeline** — Model selector, verification depth, max claims, source quality filters
- **Resilient Architecture** — Automatic retries, exponential backoff, multi-model fallbacks

---

## Architecture

### Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React + Vite |
| Backend | FastAPI + Python |
| Agentic Pipeline | LangGraph |
| Claim Extraction | Gemini 2.5 Flash |
| Claim Verification | Groq LLaMA 3.3 70B |
| Web Search | Tavily + DuckDuckGo fallback |
| AI Text Detection | `roberta-base-openai-detector` |
| AI Image Detection | `dima806/ai_vs_real_image_detection` |
| Frontend Deployment | Vercel |
| Backend Deployment | HuggingFace Spaces (Docker) |

---

### LangGraph Pipeline
```
Input (text / URL)
        ↓
┌───────────────┐
│  ingest_node  │  — URL scraping (newspaper3k → BeautifulSoup fallback)
└──────┬────────┘
       ↓
┌─────────────────┐
│ claim_extractor │  — Gemini 2.5 Flash: extract + classify claims
└──────┬──────────┘
       ↓
┌──────────────────────────────────────────┐
│         Parallel Fan-out (Send API)       │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ │
│  │ Search 1 │ │ Search 2 │ │ Search N │ │  — Tavily + DDG fallback
│  └──────────┘ └──────────┘ └──────────┘ │
└──────────────────┬───────────────────────┘
                   ↓ (fan-in)
┌─────────────────┐
│ claim_verifier  │  — Groq LLaMA: CoT reasoning + self-reflection
└──────┬──────────┘
       ↓
┌──────────────────┐
│conflict_resolver │  — Source authority scoring, contradiction detection
└──────┬───────────┘
       ↓
┌──────────────────┐
│report_assembler  │  — Credibility score, verdict counts, final JSON
└──────┬───────────┘
       ↓
┌──────────────┐
│ ai_detector  │  — Text + image AI detection (runs in parallel)
└──────────────┘
```

---

### LangGraph State Schema
```python
class FactCheckState(TypedDict):
    raw_input: str
    input_type: str
    extractor_model: str
    verifier_model: str
    depth: str                    # quick | standard | deep
    max_claims: int
    sources_per_claim: int
    min_source_tier: int
    article_text: str
    article_images: list[str]
    claims: list[dict]
    claims_with_evidence: Annotated[list[dict], operator.add]  # parallel merge
    verified_claims: list[dict]
    report: dict
    errors: Annotated[list[str], operator.add]
    current_step: str
    ai_text_probability: Optional[float]
    ai_image_results: list[dict]
```

---

### Claim Object Schema
```python
{
    "id": "claim_1",
    "text": "Elon Musk is the CEO of Tesla",
    "type": "TEMPORAL",           # FACTUAL | TEMPORAL | CAUSAL | COMPARATIVE | OPINION
    "searchable": True,
    "search_queries": [...],
    "evidence": [
        {
            "url": "...",
            "title": "...",
            "content": "...",
            "source_tier": 1      # 1=Reuters/BBC, 2=Wikipedia, 3=Forbes, 4=Unknown
        }
    ],
    "verdict": "TRUE",            # TRUE | FALSE | PARTIALLY_TRUE | UNVERIFIABLE | CONFLICTING | OPINION
    "confidence": 95,
    "reasoning": "...",           # Chain-of-Thought explanation
    "self_reflection": "...",     # Second-pass critique
    "conflict_detected": False,
    "conflicting_sources": []
}
```

---

### Resilience & Fallback Strategy
```
Search failure:
  Tavily → retry 3x with exponential backoff
         → DuckDuckGo fallback
         → Mark claim UNVERIFIABLE if both fail

Model failure:
  Gemini rate limit → Groq fallback for extraction
  Groq failure → Gemini fallback for verification
  Both fail → UNVERIFIABLE with error logged

URL scraping:
  newspaper3k → BeautifulSoup fallback
  Both fail → prompt user to paste text manually
```

---

### Prompt Engineering

**Chain-of-Thought Verification Prompt:**
```
Think step by step:
1. What does each source say about this claim?
2. Do sources agree or contradict each other?
3. How authoritative and recent are the sources?
4. Based ONLY on this evidence (not training data), what is the verdict?
```

**Self-Reflection Prompt:**
```
Review your verdict. Did you rely on evidence or training knowledge?
Is there another valid interpretation? Should confidence be adjusted?
CRITICAL: Retrieved web evidence is MORE reliable than training data.
```

---

## Project Structure
```
factcheck/
├── backend/
│   ├── main.py                  # FastAPI app + streaming endpoint
│   ├── graph.py                 # LangGraph pipeline definition
│   ├── state.py                 # Shared state schema (TypedDict)
│   ├── models.py                # Pydantic request/response models
│   ├── Dockerfile               # HuggingFace Spaces deployment
│   ├── requirements.txt
│   └── nodes/
│       ├── ingest.py            # URL scraping + text cleaning
│       ├── extractor.py         # Claim extraction + classification
│       ├── retriever.py         # Parallel web search + source tiering
│       ├── verifier.py          # CoT verification + self-reflection
│       ├── conflict_resolver.py # Contradiction detection + authority scoring
│       ├── assembler.py         # Report assembly + credibility scoring
│       └── ai_detector.py       # AI text + image detection
│
└── frontend/
    ├── src/
    │   ├── App.jsx
    │   ├── index.css
    │   └── components/
    │       ├── layout/
    │       │   ├── Header.jsx
    │       │   └── Footer.jsx
    │       ├── input/
    │       │   ├── InputPanel.jsx
    │       │   └── AdvancedSettings.jsx
    │       ├── pipeline/
    │       │   ├── PipelineView.jsx
    │       │   └── TerminalLog.jsx
    │       └── report/
    │           ├── AccuracyReport.jsx
    │           ├── ScoreHeader.jsx
    │           ├── ClaimCard.jsx
    │           ├── EvidenceList.jsx
    │           └── AIDetectionBar.jsx
    ├── vercel.json
    └── package.json
```

---

## Getting Started

### Prerequisites
- Python 3.11+
- Node.js 18+
- API keys: Gemini, Groq, Tavily

### Backend Setup
```bash
cd backend
python -m venv venv
venv\Scripts\activate        # Windows
pip install -r requirements.txt
```

Create `.env`:
```env
GEMINI_API_KEY=your_key
GROQ_API_KEY=your_key
TAVILY_API_KEY=your_key
```

Run:
```bash
uvicorn main:app --reload --port 8000
```

### Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

Open `http://localhost:5173`

---

## Evaluation Criteria Coverage

### Accuracy (40 pts)
- **Claim Extraction** — Gemini 2.5 Flash with structured JSON output and type classification
- **Evidence Retrieval** — Tavily `search_depth="advanced"` with recency filtering for temporal claims
- **Verification Logic** — Evidence-only CoT prompting explicitly prohibits training data usage

### Aesthetics (30 pts)
- **Explainability** — Each claim card shows verdict, confidence bar, reasoning, self-reflection, and tiered sources
- **Progress Indicator** — 7-stage pipeline view with live terminal log streaming via Server-Sent Events
- **Design** — Editorial newspaper aesthetic, warm parchment background, Playfair Display typography

### Approach & Innovation (30 pts)
- **Architecture** — LangGraph stateful graph with parallel fan-out via Send API
- **Resilience** — Tavily → DuckDuckGo fallback, Gemini → Groq fallback, exponential backoff
- **Ambiguity Handling** — TEMPORAL claims get recency-filtered search, OPINION claims skip search, CONFLICTING verdict with source authority scoring
- **Prompt Engineering** — Chain-of-Thought + Self-Reflection with evidence-priority rules

### Bonus
- **AI Text Detection (+10)** — `roberta-base-openai-detector` probability score on input text
- **AI Image Detection (+20)** — `dima806/ai_vs_real_image_detection` on extracted/uploaded images

---

## Team

Built for NCR College Hackathon Finals — 24 hours

- Akshar Jha
- Aiman
- Ankit

---

## License

MIT