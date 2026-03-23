from pprint import pprint

from state import FactCheckState

TIER_WEIGHT = {1: 4, 2: 3, 3: 2, 4: 1}

def score_evidence_side(sources: list[dict]) -> float:
    """Higher tier sources = higher score"""
    if not sources:
        return 0
    return sum(TIER_WEIGHT.get(s.get("source_tier", 4), 1) for s in sources)

def detect_conflict(evidence: list[dict]) -> tuple[bool, list, list]:
    """
    Splits evidence into supporting vs contradicting groups.
    Returns: (conflict_found, supporting_sources, contradicting_sources)
    """
    if len(evidence) < 2:
        return False, evidence, []

    # Keywords that signal contradiction
    contradiction_signals = [
    "however", "but contrary", "despite the claim",
    "this is false", "debunked", "refuted", "disputed",
    "misleading", "incorrect", "no evidence"
    ]

    supporting = []
    contradicting = []

    for e in evidence:
        content_lower = e.get("content", "").lower()
        title_lower = e.get("title", "").lower()
        combined = content_lower + " " + title_lower

        contradiction_count = sum(
            1 for signal in contradiction_signals
            if signal in combined
        )

        if contradiction_count >= 2:
            contradicting.append(e)
        else:
            supporting.append(e)

    conflict_found = len(supporting) > 0 and len(contradicting) > 0
    return conflict_found, supporting, contradicting

def conflict_resolver_node(state: FactCheckState) -> dict:
    verified_claims = state["verified_claims"]
    resolved_claims = []

    for claim in verified_claims:
        # Skip non-searchable claims
        if not claim.get("searchable"):
            resolved_claims.append(claim)
            continue

        evidence = claim.get("evidence", [])
        conflict_found, supporting, contradicting = detect_conflict(evidence)

        if conflict_found:
            # Score each side by source authority
            support_score = score_evidence_side(supporting)
            contra_score = score_evidence_side(contradicting)

            claim["conflict_detected"] = True
            claim["conflicting_sources"] = contradicting
            claim["supporting_sources"] = supporting

            # Build conflict analysis
            best_support = supporting[0] if supporting else None
            best_contra = contradicting[0] if contradicting else None

            conflict_summary = []
            if best_support:
                conflict_summary.append(
                    f"Supporting [Tier {best_support['source_tier']}]: {best_support['title']}"
                )
            if best_contra:
                conflict_summary.append(
                    f"Contradicting [Tier {best_contra['source_tier']}]: {best_contra['title']}"
                )

            claim["conflict_analysis"] = " | ".join(conflict_summary)

            # Override verdict based on authority scores
            if support_score > contra_score * 1.5:
                # Supporting sources clearly more authoritative
                claim["verdict"] = "PARTIALLY_TRUE"
                claim["conflict_note"] = (
                    f"Conflicting evidence found, but higher-authority sources "
                    f"(score {support_score:.0f} vs {contra_score:.0f}) support this claim."
                )
            elif contra_score > support_score * 1.5:
                # Contradicting sources clearly more authoritative
                claim["verdict"] = "FALSE"
                claim["conflict_note"] = (
                    f"Higher-authority sources (score {contra_score:.0f} vs "
                    f"{support_score:.0f}) contradict this claim."
                )
            else:
                # Equal authority — genuine conflict
                claim["verdict"] = "CONFLICTING"
                claim["conflict_note"] = (
                    f"Sources of equal authority disagree. "
                    f"Support score: {support_score:.0f}, "
                    f"Contradiction score: {contra_score:.0f}. "
                    f"Human review recommended."
                )

            # Adjust confidence down when conflict exists
            claim["confidence"] = max(30, claim.get("confidence", 50) - 20)

        resolved_claims.append(claim)

    return {
        "verified_claims": resolved_claims,
        "current_step": "assembling"
    }