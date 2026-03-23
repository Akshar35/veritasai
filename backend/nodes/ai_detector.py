import os
import requests
from transformers import pipeline
from state import FactCheckState

# Load once at startup
try:
    ai_text_detector = pipeline(
        "text-classification",
        model="roberta-base-openai-detector",
        truncation=True,
        max_length=512
    )
except:
    ai_text_detector = None

try:
    ai_image_detector = pipeline(
        "image-classification",
        model="dima806/ai_vs_real_image_detection"
    )
except:
    ai_image_detector = None

def detect_ai_text(text: str) -> float:
    """Returns probability 0-1 that text is AI-generated"""
    if not ai_text_detector or not text:
        return None
    try:
        result = ai_text_detector(text[:1000])[0]
        if result["label"] == "Fake":  # model labels AI text as "Fake"
            return round(result["score"], 3)
        else:
            return round(1 - result["score"], 3)
    except:
        return None

def detect_ai_image(image_url: str) -> dict:
    """Uses a local Hugging Face model to check if image is AI-generated"""
    if not ai_image_detector:
        return {"url": image_url[:200], "ai_probability": None, "error": "AI image detection model failed to load. Check backend logs."}

    try:
        from PIL import Image
        import io
        import requests
        import base64
        import re

        # Load the image
        img = None
        if image_url.startswith("data:"):
            match = re.match(r'data:(.+);base64,(.+)', image_url)
            if match:
                b64_data = match.group(2)
                file_bytes = base64.b64decode(b64_data)
                img = Image.open(io.BytesIO(file_bytes)).convert("RGB")
        else:
            # Download the image
            headers = {"User-Agent": "Mozilla/5.0"}
            resp = requests.get(image_url, headers=headers, timeout=10)
            if resp.status_code == 200:
                img = Image.open(io.BytesIO(resp.content)).convert("RGB")

        if not img:
            return {"url": image_url[:200], "ai_probability": None, "error": "Could not read or download image data"}

        # Run inference
        results = ai_image_detector(img)
        
        # Parse the output
        # Format is usually [{'label': 'AI-generated', 'score': 0.99}, {'label': 'Real', 'score': 0.01}]
        ai_score = next((r["score"] for r in results if r["label"].lower() == "ai-generated" or r["label"].lower() == "fake"), None)
        
        # If model outputs different labels, find the highest score predicting AI
        if ai_score is None:
            # fallback if labels are different
            fake_labels = ["fake", "ai", "generated", "synthetic", "ai-generated"]
            for r in results:
                if any(lbl in r["label"].lower() for lbl in fake_labels):
                    ai_score = r["score"]
                    break
                    
        # If it only returned "Real", then AI score is 1 - Real score
        if ai_score is None:
            real_score = next((r["score"] for r in results if r["label"].lower() == "real" or r["label"].lower() == "human"), 0)
            ai_score = 1.0 - real_score

        return {
            "url": image_url[:200],
            "ai_probability": round(ai_score, 3) if ai_score is not None else None,
            "error": None
        }

    except Exception as e:
        return {"url": image_url[:200], "ai_probability": None, "error": f"Image detection failed: {str(e)}"}


def ai_detector_node(state: FactCheckState) -> dict:
    text = state.get("article_text", "")
    images = state.get("article_images", [])

    ai_text_prob = detect_ai_text(text)

    ai_image_results = []
    for img_url in images[:3]:  # max 3 images
        result = detect_ai_image(img_url)
        ai_image_results.append(result)

    return {
        "ai_text_probability": ai_text_prob,
        "ai_image_results": ai_image_results
    }