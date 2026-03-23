import os
from dotenv import load_dotenv
load_dotenv()

from langgraph.graph import StateGraph, START, END
from langgraph.constants import Send

from state import FactCheckState
from nodes.ingest import ingest_node
from nodes.extractor import claim_extractor_node
from nodes.retriever import evidence_retriever_node
from nodes.verifier import claim_verifier_node
from nodes.assembler import report_assembler_node
from nodes.ai_detector import ai_detector_node
from nodes.conflict_resolver import conflict_resolver_node

# --- Fan-out: send each claim to retriever in parallel ---
def route_claims_to_search(state: FactCheckState):
    """
    Called after claim extraction.
    Returns a Send object for each claim — LangGraph runs them in parallel.
    """
    sends = []
    for claim in state["claims"]:
        sends.append(
            Send("evidence_retriever", {**state, "current_claim": claim})
        )
    return sends

# --- Build the graph ---
def build_graph():
    builder = StateGraph(FactCheckState)

    # Add all nodes
    builder.add_node("ingest", ingest_node)
    builder.add_node("claim_extractor", claim_extractor_node)
    builder.add_node("evidence_retriever", evidence_retriever_node)
    builder.add_node("claim_verifier", claim_verifier_node)
    builder.add_node("report_assembler", report_assembler_node)
    builder.add_node("ai_detector", ai_detector_node)
    builder.add_node("conflict_resolver", conflict_resolver_node)

    # Linear edges
    builder.add_edge(START, "ingest")
    builder.add_edge("ingest", "claim_extractor")

    # Fan-out: parallel search for each claim
    builder.add_conditional_edges(
        "claim_extractor",
        route_claims_to_search,
        ["evidence_retriever"]
    )

    # Fan-in: all parallel searches merge back here
    builder.add_edge("evidence_retriever", "claim_verifier")
    builder.add_edge("claim_verifier", "conflict_resolver")
    builder.add_edge("conflict_resolver", "report_assembler")
    builder.add_edge("report_assembler", "ai_detector")
    builder.add_edge("ai_detector", END)

    return builder.compile()

graph = build_graph()