import requests
from bs4 import BeautifulSoup
from newspaper import Article
from state import FactCheckState

def ingest_node(state: FactCheckState) -> dict:
    raw = state["raw_input"]
    input_type = state["input_type"]
    errors = []
    images = []

    if input_type == "text":
        return {
            "article_text": raw.strip(),
            "article_images": [],
            "current_step": "extracting",
            "errors": []
        }

    # It's a URL — try newspaper3k first
    try:
        article = Article(raw)
        article.download()
        article.parse()
        text = article.text
        images = list(article.images)[:5]  # max 5 images

        if not text or len(text) < 100:
            raise ValueError("newspaper3k returned too little text")

    except Exception as e:
        errors.append(f"newspaper3k failed: {str(e)}, trying BeautifulSoup")

        # Fallback to BeautifulSoup
        try:
            resp = requests.get(raw, timeout=10, headers={"User-Agent": "Mozilla/5.0"})
            soup = BeautifulSoup(resp.text, "lxml")

            # Extract images
            img_tags = soup.find_all("img", src=True)
            images = [img["src"] for img in img_tags if img["src"].startswith("http")][:5]

            # Extract text
            for tag in soup(["script", "style", "nav", "footer", "header"]):
                tag.decompose()
            text = soup.get_text(separator=" ", strip=True)

            if len(text) < 100:
                raise ValueError("BeautifulSoup also returned too little text")

        except Exception as e2:
            errors.append(f"BeautifulSoup also failed: {str(e2)}")
            text = ""

    # Word Limit: Truncate extremely long articles (e.g. Wikipedia) to ~2500 words
    # This prevents JSON serialization hangs and context window issues
    words = text.split()
    if len(words) > 2500:
        text = " ".join(words[:2500]) + "..."
        errors.append("Article truncated to 2500 words for processing stability.")

    return {
        "article_text": text,
        "article_images": images,
        "current_step": "extracting",
        "errors": errors
    }