import os
from datetime import datetime, timedelta, timezone
from urllib.parse import urljoin
import requests
from bs4 import BeautifulSoup
from supabase import Client, create_client

SUPABASE_URL = os.environ.get("SUPABASE_URL")
SUPABASE_SERVICE_KEY = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")

if not SUPABASE_URL or not SUPABASE_SERVICE_KEY:
    raise RuntimeError("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in GitHub Secrets.")

supabase: Client = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)

HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
        "AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/124.0.0.0 Safari/537.36"
    ),
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
}

PORTALS = [
    {
        "name": "SECI Latest News",
        "url": "https://www.seci.co.in/latest-news",
        "authority": "SECI",
        "state": "National",
        "default_sector": "Storage/BESS",
    },
    {
        "name": "MNRE Portal",
        "url": "https://mnre.gov.in/",
        "authority": "MNRE",
        "state": "National",
        "default_sector": "Solar",
    },
]

KEYWORDS = [
    "policy", "guideline", "tariff", "amendment", "notification",
    "tender", "almm", "storage", "bess", "open access",
    "solar", "wind", "hydrogen", "circular", "rpo", "rco"
]


def detect_sector(text: str, fallback: str) -> str:
    t = text.lower()
    if "bess" in t or "battery" in t or "storage" in t:
        return "Storage/BESS"
    if "hydrogen" in t:
        return "Green Hydrogen"
    if "wind" in t:
        return "Wind"
    if "tariff" in t or "open access" in t or "transmission" in t or "grid" in t:
        return "Grid/Tariff"
    if "solar" in t or "almm" in t or "rooftop" in t:
        return "Solar"
    return fallback


def detect_impact(text: str) -> str:
    t = text.lower()
    if any(k in t for k in ["amendment", "tariff", "almm", "mandatory", "deadline", "bess", "storage"]):
        return "High"
    if any(k in t for k in ["guideline", "notification", "tender", "open access"]):
        return "Medium"
    return "Low"


def scrape_portals() -> list[dict]:
    found: dict[str, dict] = {}
    scanned_links = 0

    for portal in PORTALS:
        try:
            res = requests.get(portal["url"], headers=HEADERS, timeout=25)
            print(f"[{portal['name']}] HTTP {res.status_code}")
            res.raise_for_status()

            soup = BeautifulSoup(res.text, "html.parser")
            anchors = soup.find_all("a", href=True)
            scanned_links += len(anchors)

            for a in anchors:
                title = " ".join(a.get_text().split())
                href = a["href"].strip()
                if len(title) < 12 or href.startswith("#") or href.lower().startswith("javascript:"):
                    continue

                full_url = urljoin(portal["url"], href)
                is_pdf = ".pdf" in full_url.lower()
                has_keyword = any(k in title.lower() or k in full_url.lower() for k in KEYWORDS)

                if is_pdf or has_keyword:
                    clean_title = title[:240]
                    sector = detect_sector(clean_title, portal["default_sector"])
                    found[clean_title] = {
                        "title": clean_title,
                        "authority": portal["authority"],
                        "state": portal["state"],
                        "sector": sector,
                        "impact_level": detect_impact(clean_title),
                        "executive_summary": f"Official notice published on {portal['name']}: {clean_title}.",
                        "business_impact": f"Review compliance rules, eligibility criteria, and commercial timelines in {sector}.",
                        "market_outlook": f"Potential near-term procurement, tariff, or capacity shift across {sector} developers.",
                        "source_pdf_url": full_url,
                        "deadline_date": (datetime.now(timezone.utc) + timedelta(days=21)).isoformat(),
                        "published_date": datetime.now(timezone.utc).isoformat(),
                    }
        except Exception as err:
            print(f"[{portal['name']}] Scrape warning: {err}")

    print(f"Scanned {scanned_links} links | Matched {len(found)} unique policy items.")
    return list(found.values())[:25]


def run():
    candidates = scrape_portals()
    if not candidates:
        print("No policy candidates matched in this run.")
        return

    existing = supabase.table("policies").select("title").execute()
    existing_titles = {r["title"] for r in (existing.data or []) if r.get("title")}

    inserted = 0
    for item in candidates:
        if item["title"] in existing_titles:
            continue
        try:
            supabase.table("policies").insert(item).execute()
            existing_titles.add(item["title"])
            inserted += 1
            print(f"Inserted: {item['title']}")
        except Exception as err:
            print(f"Insert error for '{item['title']}': {err}")

    print(f"Sync finished. Inserted {inserted} new policies.")


if __name__ == "__main__":
    run()
