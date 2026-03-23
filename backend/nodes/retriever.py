import os
import json
import time
from tavily import TavilyClient
from langchain_google_genai import ChatGoogleGenerativeAI
from state import FactCheckState
from duckduckgo_search import DDGS

tavily = TavilyClient(api_key=os.getenv("TAVILY_API_KEY"))

llm = ChatGoogleGenerativeAI(
    model="gemini-2.5-flash",
    google_api_key=os.getenv("GEMINI_API_KEY"),
    temperature=0
)

QUERY_GEN_PROMPT = """
Generate 2 precise web search queries to verify this claim:
"{claim_text}"

Claim type: {claim_type}
{temporal_hint}

Today's date is 2026. Generate queries that will find the most current information.

Return ONLY a JSON array of 2 strings. No explanation.
Example: ["query one", "query two"]
"""

SOURCE_TIERS = {
    "reuters.com": 1, "bbc.com": 1, "apnews.com": 1,
    "theguardian.com": 1, "nytimes.com": 1, "bloomberg.com": 1,
    "wikipedia.org": 2, "britannica.com": 2, "nature.com": 2,
    "forbes.com": 3, "techcrunch.com": 3, "cnbc.com": 3,
}

def get_source_tier(url: str) -> int:
    for domain, tier in SOURCE_TIERS.items():
        if domain in url:
            return tier
    return 4  # unknown/blog

def search_with_retry(query: str, max_attempts: int = 3) -> list[dict]:
    """Try Tavily first, fall back to DuckDuckGo if it fails"""
    last_error = None

    for attempt in range(max_attempts):
        try:
            results = tavily.search(
                query=query,
                max_results=3,
                search_depth="advanced",
                days=180
            )
            return results.get("results", [])
        except Exception as e:
            last_error = e
            if "429" in str(e) or "rate" in str(e).lower():
                wait = 2 ** attempt
                time.sleep(wait)
            else:
                break  # Non-rate-limit error, don't retry

    # Tavily failed — try DuckDuckGo
    print(f"Tavily failed ({last_error}), trying DuckDuckGo fallback...")
    ddg_results = search_duckduckgo(query)

    if ddg_results:
        return ddg_results

    return []  # Both failed

def search_duckduckgo(query: str) -> list[dict]:
    """Fallback search using DuckDuckGo when Tavily fails"""
    try:
        with DDGS() as ddgs:
            results = list(ddgs.text(query, max_results=3))
        return [
            {
                "url": r.get("href", ""),
                "title": r.get("title", ""),
                "content": r.get("body", "")[:1000],
                "source_tier": get_source_tier(r.get("href", ""))
            }
            for r in results
        ]
    except Exception as e:
        print(f"DuckDuckGo also failed: {e}")
        return []

def evidence_retriever_node(state: FactCheckState) -> dict:
    claim = state.get("current_claim")
    sources_per_claim = state.get("sources_per_claim", 3)
    min_source_tier = state.get("min_source_tier", 4)

    if not claim or not claim.get("searchable"):
        claim["evidence"] = []
        return {"claims_with_evidence": [claim], "errors": []}

    temporal_hint = ""
    if claim["type"] == "TEMPORAL":
        temporal_hint = "CRITICAL: This is a time-sensitive claim. Include '2025' or '2026' in your search queries to get current results."

    try:
        resp = llm.invoke(QUERY_GEN_PROMPT.format(
            claim_text=claim["text"],
            claim_type=claim["type"],
            temporal_hint=temporal_hint
        ))
        raw = resp.content.strip().replace("```json", "").replace("```", "")
        queries = json.loads(raw)
    except:
        queries = [claim["text"]]

    claim["search_queries"] = queries

    all_evidence = []
    for query in queries:
        results = search_with_retry(query, max_attempts=3)
        for r in results:
            all_evidence.append({
                "url": r.get("url", ""),
                "title": r.get("title", ""),
                "content": r.get("content", "")[:1000],
                "source_tier": get_source_tier(r.get("url", ""))
            })

    # Deduplicate
    seen = set()
    unique_evidence = []
    for e in all_evidence:
        if e["url"] not in seen:
            seen.add(e["url"])
            unique_evidence.append(e)

    # Filter by minimum source tier
    if min_source_tier < 4:
        filtered = [e for e in unique_evidence if e["source_tier"] <= min_source_tier]
        unique_evidence = filtered if filtered else unique_evidence  # fallback to all if filter too strict

    # Sort by tier and limit
    unique_evidence.sort(key=lambda x: x["source_tier"])
    unique_evidence = unique_evidence[:sources_per_claim]

    claim["evidence"] = unique_evidence
    claim["search_attempts"] = len(queries)

    return {
        "claims_with_evidence": [claim],
        "errors": []
    }