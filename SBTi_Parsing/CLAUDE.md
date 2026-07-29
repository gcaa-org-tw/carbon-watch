# SBTi_Parsing

Subproject: keep the SBTi / international carbon-initiative participation data
(source: greentrade.org.tw) flowing into the carbon-watch SSOT chain.

## What this is

The 貿易署綠色貿易資訊網 hosts a table of Taiwanese companies participating in
SBTi / RE100 / EV100 / SEC (formerly EP100):
https://www.greentrade.org.tw/content/臺灣國際減碳倡議參與企業平台#freezeTable

That table is the upstream for the「SBTi 承諾」column on the carbon-watch
homepage. The full chain (all formula-driven, single manual root):

1. greentrade page (ASP.NET WebForms, static HTML, GET pagination
   `?page=N&q=1&sort=0&ascending=true`, 20 companies/page, company row +
   intro row interleaved)
2. → scrape sheet「（爬蟲資料）臺灣加入國際減碳倡議企業動態儀表板」
   id `1Ys5JuyGXLaRH-bJwvGw4PpQiMM9Zm5-dqJO0u_Mv8P0`, tab `raw_data` A:E
   (公司名稱 / SBTi 中文 / RE100 / EV100 / EP100 as TRUE/FALSE).
   **This is the only thing you update manually.**
3. → IMPORTRANGE into「排碳大戶觀測站_raw_data」
   id `1N0bEtpU-Oh5c7rgwzhdldifSs7A7kP_cEWdqwTin2gU`, tab `raw_國際減碳倡議`
   (F:H formulas add 簡稱/股號/統編 via exact-name match on raw_上市櫃公司列表,
   fallback raw_非上市櫃列表)
4. → `排碳大戶表_Data` col O「中期目標是否取得SBT認證」(INDEX/MATCH by 統編,
   default「無」) → `I. 總表` SBTi 承諾 → public sheet → CI sync → site

Separate deliverable: qyke's snapshot xlsx「臺灣國際減碳倡議企業名單.xlsx」
Drive id `1AyCyX5zS-oBaAe102LSAchVmPPAvHN7b` — regenerated wholesale from the
same scrape (5 tabs: 企業名單 / 說明 / 統計摘要 / 2025年永續獎 /
所有排碳大戶_2024_300).

## Conventions (must follow)

- Company names: normalize 臺→台 before writing to the scrape sheet (matches
  the 上市櫃 reference list and registered names; the site displays 臺 forms).
- Status mapping EN→ZH: Aligned to 1.5°C→符合1.5°C目標 / Well-below 2°C→遠低於2°C /
  Committed to set SBT target→承諾設定科學基礎目標 / X→X.
- V/X flags → TRUE/FALSE. Keep scrape-sheet header row unchanged
  (公司名稱/SBTi/RE100/EV100/EP100).
- Sheets writes: `USER_ENTERED`, computed cells as formulas (never baked
  values), `--dry-run` before overwrites.
- Zero tolerance for hallucinated data: written values come row-by-row from
  `data/greentrade_companies.json`, never from memory.
- Python fetch of greentrade fails on TLS (cert lacks Subject Key Identifier,
  rejected by Python 3.14). Use curl to download pages, then parse locally —
  that is what `scrape_greentrade.py` documents.

## Files

- `scrape_greentrade.py` — scraper (curl'd HTML → BeautifulSoup → JSON)
- `compare_sbti.py` — diff: today's scrape vs upstream sheet vs site CSV
- `data/greentrade_companies.json` — full scrape output (source of truth for writes)
- `data/upstream_companies.json` — scrape-sheet state before update (baseline)
- `data/comparison_result.json` — diff lists incl. `site_diffs`
- `data/greentrade_snapshot.xlsx` — backup of qyke's xlsx before regeneration
- `decisions.md` — decision log (don't re-litigate)
- `progress.md` — phase progress
- `sbti-checkpoints.md` — cross-session resume prompts (checkpointing skill)
