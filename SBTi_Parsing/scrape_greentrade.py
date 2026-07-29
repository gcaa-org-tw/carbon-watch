"""Scrape all pages of the greentrade 臺灣國際減碳倡議參與企業平台 table."""

import json
import time
from collections import Counter

import requests
from bs4 import BeautifulSoup

BASE = "https://www.greentrade.org.tw/content/%E8%87%BA%E7%81%A3%E5%9C%8B%E9%9A%9B%E6%B8%9B%E7%A2%B3%E5%80%A1%E8%AD%B0%E5%8F%83%E8%88%87%E4%BC%81%E6%A5%AD%E5%B9%B3%E5%8F%B0"
TABLE_ID = "ctl00_ContentPlaceHolder1_ucTaiwanSupplier_tblResult"
OUT = "/private/tmp/claude-501/-Users-jinsoon/60dece08-921d-4986-9594-c76b553e113e/scratchpad/greentrade_companies.json"
HEADERS = {"User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)"}

records = []
last_update = None
for page in range(1, 12):
    url = f"{BASE}?page={page}&q=1&sort=0&ascending=true"
    resp = requests.get(url, headers=HEADERS, timeout=30)
    resp.raise_for_status()
    soup = BeautifulSoup(resp.text, "html.parser")
    if last_update is None:
        el = soup.find(string=lambda s: s and "最後更新時間" in s)
        if el:
            last_update = el.strip()
    table = soup.find("table", id=TABLE_ID)
    rows = table.find_all("tr")
    page_count = 0
    current = None
    for r in rows[2:]:  # skip 2 header rows
        tds = r.find_all("td")
        if len(tds) >= 6:
            current = {
                "公司名稱": tds[1].get_text(strip=True),
                "產業別": tds[2].get_text(strip=True),
                "SBTi": tds[3].get_text(strip=True),
                "RE100": tds[4].get_text(strip=True),
                "EV100": tds[5].get_text(strip=True),
                "SEC": tds[6].get_text(strip=True) if len(tds) > 6 else "",
                "公司簡介": "",
                "page": page,
            }
            records.append(current)
            page_count += 1
        elif len(tds) == 1 and current is not None:
            current["公司簡介"] = tds[0].get_text(" ", strip=True)
    print(f"page {page}: {page_count} companies")
    time.sleep(0.6)

names = [r["公司名稱"] for r in records]
dupes = [n for n, c in Counter(names).items() if c > 1]
print(f"\ntotal: {len(records)} companies, dupes: {dupes or 'none'}")
print(f"last_update: {last_update}")
for col in ["SBTi", "RE100", "EV100", "SEC"]:
    print(col, dict(Counter(r[col] for r in records)))
print("產業別", dict(Counter(r["產業別"] for r in records)))

with open(OUT, "w", encoding="utf-8") as f:
    json.dump(
        {
            "last_update": last_update,
            "scraped_at": "2026-07-29",
            "source": BASE,
            "records": records,
        },
        f,
        ensure_ascii=False,
        indent=1,
    )
print(f"\nsaved -> {OUT}")
