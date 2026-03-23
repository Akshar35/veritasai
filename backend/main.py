from dotenv import load_dotenv
load_dotenv()

import json
import asyncio
import tempfile
import base64
from fastapi import FastAPI, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse, JSONResponse
from models import FactCheckRequest
from graph import graph
from nodes.ai_detector import detect_ai_image, detect_ai_image_bytes

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"]
)

@app.get("/")
def root():
    return {"status": "FactCheck API running"}

@app.post("/detect-image/url")
async def detect_image_url(request: dict):
    url = request.get("url")
    if not url:
        return {"error": "No URL provided"}
    result = detect_ai_image(url)
    return {
        "ai_generated_probability": result.get("ai_probability"),
        "not_ai_probability": round(1 - (result.get("ai_probability") or 0), 3),
        "all_scores": {
            "ai_generated": result.get("ai_probability"),
            "not_ai_generated": round(1 - (result.get("ai_probability") or 0), 3)
        },
        "error": result.get("error")
    }

@app.post("/detect-image/upload")
async def detect_image_upload(file: UploadFile = File(...)):
    contents = await file.read()
    return detect_ai_image_bytes(contents)

async def run_image_detection(url=None, file=None):
    try:
        from nodes.ai_detector import detect_ai_image_hf
        if url:
            result = detect_ai_image_hf(url)
        else:
            contents = await file.read()
            result = detect_ai_image_hf(file_bytes=contents)
        return result
    except Exception as e:
        return {"error": str(e)}


@app.post("/factcheck/stream")
async def factcheck_stream(request: FactCheckRequest):
    async def event_generator():
        initial_state = {
            "raw_input": request.input,
            "input_type": request.input_type,
            # Settings
            "extractor_model": request.extractor_model,
            "verifier_model": request.verifier_model,
            "depth": request.depth,
            "max_claims": request.max_claims,
            "sources_per_claim": request.sources_per_claim,
            "min_source_tier": request.min_source_tier,
            # Pipeline state
            "article_text": "",
            "article_images": [],
            "claims": [],
            "claims_with_evidence": [],
            "verified_claims": [],
            "report": {},
            "errors": [],
            "current_step": "ingesting",
            "ai_text_probability": None,
            "ai_image_results": [],
            "supporting_sources": [],
            "conflict_analysis": "",
            "conflict_note": ""
        }

        final_state = None
        search_node_count = 0

        async for event in graph.astream_events(initial_state, version="v2"):
            kind = event["event"]
            name = event.get("name", "")
            data = event.get("data", {})

            # Node started
            if kind == "on_chain_start" and name in [
                "ingest", "claim_extractor", "evidence_retriever",
                "claim_verifier", "conflict_resolver",
                "report_assembler", "ai_detector"
            ]:
                step_map = {
                    "ingest": "📥 Ingesting content...",
                    "claim_extractor": "🔍 Extracting claims...",
                    "evidence_retriever": "🌐 Searching web for evidence...",
                    "claim_verifier": "⚖️ Verifying claims...",
                    "conflict_resolver": "⚡ Resolving conflicts...",
                    "report_assembler": "📊 Assembling report...",
                    "ai_detector": "🤖 Detecting AI content..."
                }
                msg = step_map.get(name, f"Processing {name}...")
                yield f"data: {json.dumps({'type': 'node_start', 'node': name, 'message': msg})}\n\n"

            # Node completed — send node_end with output data
            if kind == "on_chain_end" and name in [
                "ingest", "claim_extractor", "evidence_retriever",
                "claim_verifier", "conflict_resolver",
                "report_assembler", "ai_detector"
            ]:
                payload = {"type": "node_end", "node": name}

                # After ingestion, send content preview
                if name == "ingest":
                    output = data.get("output", {})
                    text = output.get("article_text", "")
                    images = output.get("article_images", [])
                    word_count = len(text.split()) if text else 0
                    payload["message"] = f"📥 Ingested {word_count} words"
                    if images:
                        payload["message"] += f", {len(images)} images detected"

                # After extraction, send claim count + previews
                if name == "claim_extractor":
                    output = data.get("output", {})
                    claims = output.get("claims", [])
                    payload["claim_count"] = len(claims)
                    payload["message"] = f"🔍 Extracted {len(claims)} claims"
                    # Send individual claim previews
                    claim_details = []
                    for c in claims:
                        claim_details.append({
                            "text": c.get("text", "")[:80],
                            "type": c.get("type", "UNKNOWN")
                        })
                    payload["claims"] = claim_details

                # After each search, send queries + sources found
                if name == "evidence_retriever":
                    search_node_count += 1
                    output = data.get("output", {})
                    claims_with_ev = output.get("claims_with_evidence", [])
                    if claims_with_ev:
                        claim = claims_with_ev[0]
                        queries = claim.get("search_queries", [])
                        evidence = claim.get("evidence", [])
                        claim_preview = claim.get("text", "")[:60]
                        sources_info = [f"Tier {e.get('source_tier', '?')}: {e.get('title', 'Unknown')[:40]}" for e in evidence[:3]]
                        payload["message"] = f"🌐 Search {search_node_count}: \"{claim_preview}...\""
                        payload["queries"] = queries
                        payload["sources"] = sources_info
                        payload["source_count"] = len(evidence)
                    else:
                        payload["message"] = f"🌐 Search {search_node_count} complete"

                # After verification, send verdict summary
                if name == "claim_verifier":
                    output = data.get("output", {})
                    verified = output.get("verified_claims", [])
                    verdicts = {}
                    for c in verified:
                        v = c.get("verdict", "UNKNOWN")
                        verdicts[v] = verdicts.get(v, 0) + 1
                    summary = " | ".join([f"{v}: {n}" for v, n in verdicts.items()])
                    payload["message"] = f"⚖️ Verification complete — {summary}"
                    payload["verdicts"] = verdicts

                # After conflict resolution
                if name == "conflict_resolver":
                    output = data.get("output", {})
                    resolved = output.get("verified_claims", [])
                    conflicts = sum(1 for c in resolved if c.get("conflict_detected"))
                    if conflicts > 0:
                        payload["message"] = f"⚡ Found {conflicts} claim(s) with conflicting evidence"
                    else:
                        payload["message"] = "⚡ No conflicts detected"

                # After AI detection
                if name == "ai_detector":
                    output = data.get("output", {})
                    ai_prob = output.get("ai_text_probability")
                    ai_images = output.get("ai_image_results", [])
                    if ai_prob is not None:
                        payload["message"] = f"🤖 AI text probability: {round(ai_prob * 100)}%"
                    else:
                        payload["message"] = "🤖 AI detection complete"
                    if ai_images:
                        payload["message"] += f", {len(ai_images)} image(s) analyzed"

                yield f"data: {json.dumps(payload)}\n\n"

            # Capture final state
            if kind == "on_chain_end" and name == "LangGraph":
                final_state = event["data"].get("output", {})

        if final_state and final_state.get("report"):
            yield f"data: {json.dumps({'type': 'report', 'data': final_state['report']})}\n\n"
        else:
            yield f"data: {json.dumps({'type': 'error', 'message': 'Pipeline completed but no report generated'})}\n\n"

        yield f"data: {json.dumps({'type': 'done'})}\n\n"

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"}
    )