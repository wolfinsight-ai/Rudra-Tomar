import json
import os
import re
import requests
from bs4 import BeautifulSoup
from google import genai
from supabase import create_client

SUPABASE_URL = os.environ["SUPABASE_URL"]
SUPABASE_KEY = os.environ["SUPABASE_SERVICE_ROLE_KEY"]
GEMINI_API_KEY = os.environ["GEMINI_API_KEY"]

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36"
}

supabase = create_client(SUPABASE_URL, SUPABASE_KEY)
ai_client = genai.Client(api_key=GEMINI_API_KEY)


def clean_text(text: str) -> str:
    return re.sub(r"\s+", " ", (text or "")).strip()


def fetch_existing_titles() -> set[str]:
    res = supabase.table("policies").select("title").execute()
    return {clean_text(row.get("title", "")).lower() for row in (res.data or []) if row.get("title")}


def scrape_renewable_energy() -> list[dict]:
    items = []
    sources = [
        ("https://www.seci.co.in/latest-news", "SECI", "Tenders & Notifications"),
        ("https://mnre.gov.in/", "MNRE", "Government Notifications"),
    ]
    keywords = ("solar", "wind", "hybrid", "bess", "storage", "green", "tariff", "rfs", "mnre", "seci", "policy", "guideline", "order")

    for url, authority, default_sector in sources:
        try:
            resp = requests.get(url, headers=HEADERS, timeout=25)
            resp.raise_for_status()
            soup = BeautifulSoup(resp.text, "html.parser")
            seen_local = set()

            for a in soup.find_all("a", href=True):
                title = clean_text(a.get_text())
                if len(title) < 25 or len(title) > 240:
                    continue
                if not any(k in title.lower() for k in keywords):
                    continue
                if title.lower() in seen_local:
                    continue
                seen_local.add(title.lower())

                href = a["href"].strip()
                if not href.startswith("http"):
                    base = "https://www.seci.co.in" if "seci.co.in" in url else "https://mnre.gov.in"
                    href = f"{base}/{href.lstrip('/')}"

                items.append({
                    "title": title,
                    "authority": authority,
                    "sector": default_sector,
                    "state": "All India",
                    "status": "Active",
                    "source_url": href,
                    "domain": "renewable_energy",
                })
        except Exception as exc:
            print(f"[Renewable] Warning scraping {url}: {exc}")

    return items[:12]


def scrape_plastic_recycling() -> list[dict]:
    items = []
    urls = [
        "https://cpcb.nic.in/plastic-waste/",
        "https://epr.cpcb.gov.in/",
    ]
    keywords = ("epr", "plastic", "pwm", "pibo", "pwp", "recycler", "waste", "notification", "guideline", "circular")

    for url in urls:
        try:
            resp = requests.get(url, headers=HEADERS, timeout=25)
            resp.raise_for_status()
            soup = BeautifulSoup(resp.text, "html.parser")
            seen_local = set()

            for a in soup.find_all("a", href=True):
                title = clean_text(a.get_text())
                if len(title) < 22 or len(title) > 240:
                    continue
                if not any(k in title.lower() for k in keywords):
                    continue
                if title.lower() in seen_local:
                    continue
                seen_local.add(title.lower())

                href = a["href"].strip()
                if not href.startswith("http"):
                    base = "https://cpcb.nic.in" if "cpcb.nic.in" in url else "https://epr.cpcb.gov.in"
                    href = f"{base}/{href.lstrip('/')}"

                sector = "EPR Regulations" if "epr" in title.lower() else "Government Notifications"
                items.append({
                    "title": title,
                    "authority": "CPCB",
                    "sector": sector,
                    "state": "All India",
                    "status": "Active",
                    "source_url": href,
                    "domain": "plastic_recycling",
                })
        except Exception as exc:
            print(f"[Plastic] Warning scraping {url}: {exc}")

    return items[:12]


def summarize_policy(item: dict) -> tuple[str, str]:
    prompt = f"""
You are a B2B regulatory intelligence analyst for Indian enterprises.
Analyze this policy item:
Domain: {item['domain']}
Authority: {item['authority']}
Title: {item['title']}
Source URL: {item['source_url']}

Return ONLY valid JSON with two keys:
- "summary": 2 concise sentences explaining what this notification/rule covers in plain English.
- "market_impact": 2 concise sentences explaining operational, compliance, or commercial impact for businesses (for renewable_energy: developers, IPPs, EPCs, utilities; for plastic_recycling: PIBOs, recyclers/PWPs, packaging manufacturers).
"""
    try:
        response = ai_client.models.generate_content(
            model="gemini-2.5-flash",
            contents=prompt,
        )
        raw = (response.text or "").strip()
        raw = re.sub(r"^```(?:json)?\s*|\s*```$", "", raw, flags=re.DOTALL).strip()
        parsed = json.loads(raw)
        summary = clean_text(parsed.get("summary", "")) or item["title"]
        market_impact = clean_text(parsed.get("market_impact", "")) or "Review official circular for compliance requirements and timelines."
        return summary, market_impact
    except Exception as exc:
        print(f"[Gemini] Fallback summary for '{item['title']}': {exc}")
        return (
            f"Official update issued by {item['authority']} regarding {item['title']}.",
            "Check official notification details to assess compliance deadlines and operational impact.",
        )


def run():
    existing_titles = fetch_existing_titles()
    candidates = scrape_renewable_energy() + scrape_plastic_recycling()
    inserted = 0

    for item in candidates:
        key = clean_text(item["title"]).lower()
        if key in existing_titles:
            continue

        summary, market_impact = summarize_policy(item)
        row = {
            **item,
            "summary": summary,
            "market_impact": market_impact,
        }
        supabase.table("policies").insert(row).execute()
        existing_titles.add(key)
        inserted += 1
        print(f"Inserted [{item['domain']}]: {item['title']}")

    print(f"Sync complete. New policies inserted: {inserted}")


if __name__ == "__main__":
    run()
