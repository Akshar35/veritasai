from typing import TypedDict, Annotated,Optional
import operator

class FactCheckState(TypedDict):
    # Input
    raw_input: str
    input_type: str
    
    # Settings
    extractor_model: str
    verifier_model: str
    depth: str
    max_claims: int
    sources_per_claim: int
    min_source_tier: int

    # After ingestion
    article_text: str
    article_images: list[str]

    # After claim extraction
    claims: list[dict]

    # Parallel search results — operator.add merges lists from parallel nodes
    claims_with_evidence: Annotated[list[dict], operator.add]

    # After verification
    verified_claims: list[dict]

    # Final
    report: dict

    # Meta
    errors: Annotated[list[str], operator.add]
    current_step: str
    
    # AI detection
    ai_text_probability: Optional[float]
    ai_image_results: list[dict]
    
    supporting_sources: list[dict]   # add after conflicting_sources
    conflict_analysis: str           # add after supporting_sources  
    conflict_note: str               # add after conflict_analysis