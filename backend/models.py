from typing import Optional
from pydantic import BaseModel

class FactCheckRequest(BaseModel):
    input: str          # URL or raw text
    input_type: str     # "url" or "text"
    # Advanced settings with defaults
    extractor_model: str = "gemini"        # "gemini" | "groq"
    verifier_model: str = "groq"           # "groq" | "gemini"
    depth: str = "standard"               # "quick" | "standard" | "deep"
    max_claims: int = 6                   # 3-10
    sources_per_claim: int = 3            # 2-6
    min_source_tier: int = 4

class ClaimResult(BaseModel):
    id: str
    text: str
    type: str
    searchable: bool
    verdict: Optional[str]
    confidence: Optional[int]
    reasoning: Optional[str]
    self_reflection: Optional[str]
    conflict_detected: bool
    evidence: list[dict]
    conflicting_sources: list[dict]

class FactCheckReport(BaseModel):
    overall_accuracy: int
    credibility_score: int
    total_claims: int
    true_count: int
    false_count: int
    partial_count: int
    unverifiable_count: int
    conflict_count: int
    claims: list[ClaimResult]
    ai_text_probability: Optional[float]
    ai_image_results: list[dict]
    errors: list[str]