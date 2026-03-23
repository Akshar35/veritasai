import asyncio
from dotenv import load_dotenv
load_dotenv()

from graph import graph

async def test():
    state = {
        "raw_input": "Trump is the president of India",
        "input_type": "text",
        "article_text": "",
        "article_images": [],
        "claims": [],
        "claims_with_evidence": [],
        "verified_claims": [],
        "report": {},
        "errors": [],
        "current_step": "ingesting",
        "ai_text_probability": None,
        "ai_image_results": []
    }

    print("Starting graph...")
    async for event in graph.astream_events(state, version="v2"):
        kind = event["event"]
        name = event.get("name", "")
        print(f"EVENT: {kind} | NODE: {name}")

asyncio.run(test())

async def test():
    # ... existing code ...
    
    # After the loop, also run invoke to see final state
    result = await graph.ainvoke(state)
    print("\nCLAIMS EXTRACTED:", result.get("claims"))