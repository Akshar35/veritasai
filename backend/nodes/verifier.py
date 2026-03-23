import os
import json

from langchain_groq import ChatGroq
from state import FactCheckState
from langchain_google_genai import ChatGoogleGenerativeAI

llm = ChatGroq(
    model="llama-3.3-70b-versatile",
    api_key=os.getenv("GROQ_API_KEY"),
    temperature=0
)
gemini_llm = ChatGoogleGenerativeAI(
    model="gemini-2.5-flash",
    google_api_key=os.getenv("GEMINI_API_KEY"),
    temperature=0
)

VERIFY_PROMPT = """
You are a professional fact-checker. Verify the following claim using ONLY the evidence provided.
Do NOT use your training knowledge. Base verdict strictly on evidence below.

Claim: "{claim_text}"
Claim Type: {claim_type}

Evidence:
{evidence_block}

CRITICAL READING INSTRUCTIONS:
- Read the FULL content of each source, not just the first sentence
- A source may mention both past AND current roles — use the CURRENT one
- If Source 1 says "served as 45th president" BUT ALSO says "is the 47th president",
  the claim about being president is TRUE
- Numbers like "45th" vs "47th" indicate DIFFERENT terms — both can be true at different times

Think step by step:
1. Read ALL sources carefully before deciding
2. If ANY Tier 1 or Tier 2 source directly confirms the claim, that takes priority
3. For TEMPORAL claims, find the most current statement in the evidence
4. Based ONLY on this evidence, what is the verdict?

Verdicts:
- TRUE: evidence clearly supports the claim
- FALSE: evidence clearly contradicts the claim  
- PARTIALLY_TRUE: evidence is mixed or nuanced
- UNVERIFIABLE: no relevant evidence found
- CONFLICTING: sources of equal authority directly contradict each other

Return ONLY this JSON:
{{
  "verdict": "TRUE|FALSE|PARTIALLY_TRUE|UNVERIFIABLE|CONFLICTING",
  "confidence": <0-100>,
  "reasoning": "<your step by step reasoning>",
  "conflict_detected": <true|false>,
  "conflicting_sources": []
}}
"""

REFLECT_PROMPT = """
You previously verified a claim using web evidence. Review your verdict.

Claim: "{claim_text}"
Your verdict: {verdict} ({confidence}% confidence)
Your reasoning: {reasoning}

CRITICAL RULES for self-reflection:
1. The retrieved web evidence is MORE reliable than your training data
2. If evidence clearly supports a verdict, do NOT contradict it using training knowledge
3. Only lower confidence if the evidence itself was weak or ambiguous
4. Never override evidence-based verdicts with training-data assumptions

Only reconsider if:
- You relied on training data instead of evidence
- Evidence was genuinely ambiguous
- Confidence score was clearly miscalibrated

Return ONLY this JSON:
{{
  "verdict": "TRUE|FALSE|PARTIALLY_TRUE|UNVERIFIABLE|CONFLICTING",
  "confidence": <0-100>,
  "self_reflection": "<brief note on what you reconsidered, if anything>"
}}
"""

def format_evidence(evidence: list[dict], limit: int = 4) -> str:
    if not evidence:
        return "No evidence retrieved."
    lines = []
    for i, e in enumerate(evidence[:limit], 1):
        lines.append(f"Source {i} [Tier {e['source_tier']}]: {e['title']}\nURL: {e['url']}\n{e['content']}\n")
    return "\n".join(lines)

def claim_verifier_node(state: FactCheckState) -> dict:
    claims = state.get("claims_with_evidence", [])
    verifier_model = state.get("verifier_model", "groq")
    depth = state.get("depth", "standard")
    
    # Choose model
    active_llm = gemini_llm if verifier_model == "gemini" else llm

    # Depth settings
    do_self_reflection = depth in ["standard", "deep"]
    max_evidence = 6 if depth == "deep" else 4 if depth == "standard" else 2
    
    # Deduplicate by claim id — operator.add can cause duplicates
    seen_ids = set()
    unique_claims = []
    for c in claims:
        cid = c.get("id", c.get("text", ""))
        if cid not in seen_ids:
            seen_ids.add(cid)
            unique_claims.append(c)
    
    print(f"VERIFIER - unique claims after dedup: {len(unique_claims)}")
    verified = []

    for claim in unique_claims:
        if not claim.get("searchable"):
            claim["verdict"] = "OPINION"
            claim["confidence"] = 100
            claim["reasoning"] = "This is a subjective claim and cannot be objectively verified."
            claim["self_reflection"] = "N/A"
            verified.append(claim)
            continue

        evidence_block = format_evidence(claim.get("evidence", []), max_evidence)

        # --- Pass 1: Verification ---
        try:
            resp = active_llm.invoke(VERIFY_PROMPT.format(
                claim_text=claim["text"],
                claim_type=claim["type"],
                evidence_block=evidence_block
            ))
            raw = resp.content.strip().replace("```json", "").replace("```", "").strip()
            result = json.loads(raw)

            verdict = result.get("verdict", "UNVERIFIABLE")
            reasoning = result.get("reasoning", "")
            confidence = int(result.get("confidence", 0))

            claim["verdict"] = verdict
            claim["confidence"] = confidence
            claim["reasoning"] = reasoning
            claim["conflict_detected"] = result.get("conflict_detected", False)
            claim["conflicting_sources"] = result.get("conflicting_sources", [])

        except Exception as e:
            print(f"Verification failed for claim: {e}")
            claim["verdict"] = "UNVERIFIABLE"
            claim["confidence"] = 0
            claim["reasoning"] = f"Verification failed: {str(e)}"
            claim["conflict_detected"] = False
            claim["conflicting_sources"] = []

        # --- Pass 2: Self Reflection ---
        # --- Pass 2: Self Reflection (skipped in quick mode) ---
        if do_self_reflection:
            try:
                resp2 = active_llm.invoke(REFLECT_PROMPT.format(
                    claim_text=claim["text"],
                    verdict=claim["verdict"],
                    confidence=claim["confidence"],
                    reasoning=claim["reasoning"]
                ))
                raw2 = resp2.content.strip().replace("```json", "").replace("```", "").strip()
                reflection = json.loads(raw2)

                original_confidence = int(claim["confidence"])
                reflected_confidence = int(reflection.get("confidence", original_confidence))

                if original_confidence >= 70:
                    claim["self_reflection"] = reflection.get("self_reflection", "Verdict confirmed.")
                else:
                    claim["verdict"] = reflection.get("verdict", claim["verdict"])
                    claim["confidence"] = reflected_confidence
                    claim["self_reflection"] = reflection.get("self_reflection", "")

            except Exception as e:
                claim["self_reflection"] = "Self-reflection skipped."
        else:
            claim["self_reflection"] = "Quick mode — self-reflection skipped."

        verified.append(claim)
        print(f"VERIFIER - processed claim: {claim['text'][:50]} → {claim['verdict']}")

    print(f"VERIFIER RETURNING - {len(verified)} claims")
    return {
        "verified_claims": verified,
        "current_step": "assembling"
    }