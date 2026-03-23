from state import FactCheckState

VERDICT_EMOJI = {
    "TRUE": "✅",
    "FALSE": "❌",
    "PARTIALLY_TRUE": "⚠️",
    "UNVERIFIABLE": "❓",
    "CONFLICTING": "⚡",
    "OPINION": "💬"
}

def report_assembler_node(state: FactCheckState) -> dict:
    print(f"ASSEMBLER - verified_claims count: {len(state.get('verified_claims', []))}")
    claims = state["verified_claims"]

    # Trim evidence content to keep SSE payload small (full text was already used during verification)
    for claim in claims:
        for ev in claim.get("evidence", []):
            if isinstance(ev.get("content"), str) and len(ev["content"]) > 300:
                ev["content"] = ev["content"][:300] + "..."

    counts = {"TRUE": 0, "FALSE": 0, "PARTIALLY_TRUE": 0,
              "UNVERIFIABLE": 0, "CONFLICTING": 0, "OPINION": 0}

    for c in claims:
        v = c.get("verdict", "UNVERIFIABLE")
        counts[v] = counts.get(v, 0) + 1

    total_checkable = len([c for c in claims if c.get("searchable")])
    true_count = counts["TRUE"]

    overall_accuracy = int((true_count / total_checkable * 100)) if total_checkable > 0 else 0

    # Credibility score — weighted
    credibility = 0
    if total_checkable > 0:
        credibility = int((
            counts["TRUE"] * 100 +
            counts["PARTIALLY_TRUE"] * 50 +
            counts["CONFLICTING"] * 30 +
            counts["FALSE"] * 0
        ) / total_checkable)

    report = {
        "overall_accuracy": overall_accuracy,
        "credibility_score": credibility,
        "total_claims": len(claims),
        "true_count": counts["TRUE"],
        "false_count": counts["FALSE"],
        "partial_count": counts["PARTIALLY_TRUE"],
        "unverifiable_count": counts["UNVERIFIABLE"],
        "conflict_count": counts["CONFLICTING"],
        "opinion_count": counts["OPINION"],
        "claims": claims,
        "verdict_emoji": VERDICT_EMOJI,
        "ai_text_probability": state.get("ai_text_probability"),
        "ai_image_results": state.get("ai_image_results", []),
        "errors": state.get("errors", [])
    }

    return {
        "report": report,
        "current_step": "done"
    }