import json
import os
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_groq import ChatGroq
from state import FactCheckState

llm = ChatGoogleGenerativeAI(
    model="gemini-2.5-flash",
    google_api_key=os.getenv("GEMINI_API_KEY"),
    temperature=0
)

groq_llm = ChatGroq(
    model="llama-3.3-70b-versatile",
    api_key=os.getenv("GROQ_API_KEY"),
    temperature=0
)

def get_extract_prompt(max_claims: int) -> str:
    return f"""
You are a claim extraction expert. Given the article text below, extract all verifiable claims.

For each claim:
1. Extract the exact atomic statement (one fact per claim)
2. Classify its type:
   - FACTUAL: checkable fact (numbers, names, dates, events)
   - TEMPORAL: time-sensitive ("current CEO", "as of 2024", "latest")
   - CAUSAL: cause-effect ("X caused Y")
   - COMPARATIVE: comparisons ("X is better than Y", "largest", "fastest")
   - OPINION: subjective, not fact-checkable ("X is great", "people love Y")
3. Set searchable = false for OPINION type, true for all others

Return ONLY a JSON array. No explanation. No markdown. Example:
[
  {{
    "id": "claim_1",
    "text": "Apple was founded in 1976",
    "type": "FACTUAL",
    "searchable": true,
    "search_queries": [],
    "evidence": [],
    "search_attempts": 0,
    "verdict": null,
    "confidence": null,
    "reasoning": null,
    "self_reflection": null,
    "conflict_detected": false,
    "conflicting_sources": []
  }}
]

Article:
{{article_text}}

Extract maximum {max_claims} most important verifiable claims.
"""

def claim_extractor_node(state: FactCheckState) -> dict:
    text = state["article_text"]
    max_claims = state.get("max_claims", 6)
    extractor_model = state.get("extractor_model", "gemini")

    if not text:
        return {
            "claims": [],
            "current_step": "searching",
            "errors": ["No article text to extract claims from"]
        }

    prompt = get_extract_prompt(max_claims).replace("{article_text}", text[:6000])

    # Choose model based on setting
    active_llm = groq_llm if extractor_model == "groq" else llm

    def try_extract(active_llm):
        response = active_llm.invoke(prompt)
        raw = response.content.strip()
        if raw.startswith("```"):
            raw = raw.split("```")[1]
            if raw.startswith("json"):
                raw = raw[4:]
        return json.loads(raw.strip())

    try:
        claims = try_extract(active_llm)
        return {
            "claims": claims,
            "current_step": "searching",
            "errors": []
        }
    except Exception as e:
        # Fallback to other model
        fallback_llm = groq_llm if extractor_model == "gemini" else llm
        try:
            claims = try_extract(fallback_llm)
            return {
                "claims": claims,
                "current_step": "searching",
                "errors": [f"Primary extractor failed, used fallback model"]
            }
        except Exception as e2:
            return {
                "claims": [],
                "current_step": "searching",
                "errors": [f"Both models failed: {str(e2)}"]
            }