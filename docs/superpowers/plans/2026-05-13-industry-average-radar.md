# Industry-Average Radar Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the hardcoded `[0,0,0,0,0,0]` industry-average polygon on company detail-page radar charts with a real per-industry average computed at build time, labeled with sample size.

**Architecture:** Augment `industry-list.json` with `scoredCount` and `avgScores` fields computed in `tools/transform-company-data.ts` from `raw-data/雷達圖_Data.csv`. `CompanyRadarSection.vue` looks up its company's industry entry and feeds the averages to `CompanyRadarChart.vue`. No runtime computation, no new files.

**Tech Stack:** TypeScript (Nuxt 4 + Vue 3), `tsx` for transform scripts, D3 for the existing radar chart. No test framework — verification is via transform script `logger` output and manual visual checks.

**Spec:** `docs/superpowers/specs/2026-05-13-industry-average-radar-design.md`

---

## File Structure

- **Modify** `tools/transform-company-data.ts` (lines 542-549 axis constant exists; insert helper near it; modify industry-list generation lines 771-794)
- **Modify** `app/components/company/CompanyRadarSection.vue` (lines 43-72: replace mock industry data + fix double-業 label)
- **Regenerate** `app/assets/data/industry-list.json` (committed artifact — produced by the transform script, not hand-edited)
- **Unchanged** `app/components/CompanyListFilter.vue` (existing consumer of `industry-list.json`; reads only `industry`, new fields are additive)
- **Unchanged** `app/components/company/CompanyRadarChart.vue` (D3 polygon already accepts decimals 0-3)

Working directory for all commands: `~/Documents/Work/Claude Tasks/thaubing/carbon_watch_repo_clone_2026-02-25/carbon-watch`.

---

## Reference values (for verification)

Computed from `raw-data/雷達圖_Data.csv` via the same logic the code will implement (whole-row exclusion of unscored companies, mean per axis, 2 decimals):

| 產業 | total | scoredCount | avgScores |
|------|------:|------------:|-----------|
| 石化業 | 74 | 39 | [1.51, 0.38, 0.74, 0.38, 0.92, 1.08] |
| 半導體業 | 49 | 34 | [1.44, 1.06, 0.56, 0.71, 0.26, 1.47] |
| 紡織業 | 29 | 10 | [1.30, 0.10, 1.20, 0.20, 1.80, 0.60] |
| 自行車業 | 1 | 1 | [1.00, 1.00, 0.00, 3.00, 0.00, 2.00] |

These four are the post-build spot-check targets.

---

## Task 1: Compute and emit per-industry averages in the transform script

**Files:**
- Modify: `tools/transform-company-data.ts:542-549` (axis constant — read only, no change)
- Modify: `tools/transform-company-data.ts:771-794` (industry-list generation block)
- Output: `app/assets/data/industry-list.json` (regenerated)

- [ ] **Step 1: Read the existing axis constant**

Open `tools/transform-company-data.ts`. Confirm `RADAR_SCORE_FIELDS` (lines 542-549) lists the 6 axes in the order:
```ts
const RADAR_SCORE_FIELDS = [
  '2030年溫室氣體絕對減量目標',
  '2030年再生能源使用率目標',
  '2030年能源效率進步目標',
  '2024年再生能源使用率',
  '2022-2024年能源效率進步率',
  '範疇三及減量策略',
];
```
This is the source of truth for axis order; we reuse it.

- [ ] **Step 2: Add the `computeIndustryAverages` helper above `transformCompanyData`**

Insert a new function just before `async function transformCompanyData()` (line 607). Place it after `applyRadarScoresFromSource` (ends line 602) so both radar helpers live next to each other.

```ts
interface IndustryAggregate {
  count: number;
  scoredCount: number;
  totals: number[];
}

/**
 * Build per-industry aggregates from 雷達圖_Data rows.
 *
 * Scoring is binary at the row level: every row either has all 6 axes filled
 * (integers 0-3) or all 6 axes blank. We exclude blank rows entirely from the
 * average, so `scoredCount` is a single per-industry number (not per-axis).
 */
function computeIndustryAverages(
  radarData: Record<string, string>[]
): Map<string, { count: number; scoredCount: number; avgScores: number[] }> {
  const agg = new Map<string, IndustryAggregate>();

  for (const row of radarData) {
    const industry = row['產業類別']?.trim();
    if (!industry) continue;

    const entry = agg.get(industry) ?? { count: 0, scoredCount: 0, totals: [0, 0, 0, 0, 0, 0] };
    entry.count += 1;

    const first = row[RADAR_SCORE_FIELDS[0]];
    const isScored = first !== undefined && first !== '' && first !== null;
    if (isScored) {
      entry.scoredCount += 1;
      RADAR_SCORE_FIELDS.forEach((field, i) => {
        const v = Number(row[field]);
        entry.totals[i] += Number.isFinite(v) ? v : 0;
      });
    }

    agg.set(industry, entry);
  }

  const out = new Map<string, { count: number; scoredCount: number; avgScores: number[] }>();
  for (const [industry, e] of agg) {
    const avgScores = e.scoredCount > 0
      ? e.totals.map(t => Math.round((t / e.scoredCount) * 100) / 100)
      : [0, 0, 0, 0, 0, 0];
    out.set(industry, { count: e.count, scoredCount: e.scoredCount, avgScores });
  }
  return out;
}
```

- [ ] **Step 3: Call the helper after radar scores are joined**

After line 700 (`companyList = applyRadarScoresFromSource(...)`), `radarData` is still in scope. Add right below:

```ts
    const industryAverages = computeIndustryAverages(radarData);
    logger.info(`Computed averages for ${industryAverages.size} industries`);
```

- [ ] **Step 4: Replace the industry-list generation block**

Find lines 771-794 (the "Step 5: Generating industry list" block) and replace the `industryList` construction with one that merges in the radar aggregates. Replace the entire block:

Before (lines 782-784):
```ts
    const industryList = Array.from(industryCount.entries())
      .sort((a, b) => b[1] - a[1]) // Sort by count descending
      .map(([industry, count]) => ({ industry, count }));
```

After:
```ts
    const industryList = Array.from(industryCount.entries())
      .sort((a, b) => b[1] - a[1]) // Sort by count descending
      .map(([industry, count]) => {
        const agg = industryAverages.get(industry);
        if (!agg) {
          logger.info(`No radar aggregate for industry: ${industry} (falling back to zeros)`);
        }
        return {
          industry,
          count,
          scoredCount: agg?.scoredCount ?? 0,
          avgScores: agg?.avgScores ?? [0, 0, 0, 0, 0, 0],
        };
      });
```

Order is preserved (count descending). `CompanyListFilter.vue` line 38 reads only `item.industry`, so the ordering and existing field stay compatible.

- [ ] **Step 5: Run the transform script**

```bash
npm run transform-company-data
```

Expected output (excerpt — line count and exact text may differ slightly):
```
[INFO] Parsed 287 records from 雷達圖_Data.csv
[SUCCESS] Radar scores joined from 雷達圖_Data: 168/287 companies
[INFO] Computed averages for 20 industries
[INFO] Step 5: Generating industry list
[INFO] Found 20 unique industries
[SUCCESS] Saved industry list to: industry-list.json
```

If the "Computed averages for 20 industries" line is missing, Step 3 didn't take effect — check the insertion point.

- [ ] **Step 6: Spot-check the JSON output against the reference table**

```bash
python3 -c "
import json
with open('app/assets/data/industry-list.json') as f:
    data = json.load(f)
targets = {'石化業', '半導體業', '紡織業', '自行車業'}
for entry in data:
    if entry['industry'] in targets:
        print(entry)
"
```

Expected output (entries may print in count-desc order: 石化, 半導體, 紡織, 自行車):
```
{'industry': '石化業', 'count': 74, 'scoredCount': 39, 'avgScores': [1.51, 0.38, 0.74, 0.38, 0.92, 1.08]}
{'industry': '半導體業', 'count': 49, 'scoredCount': 34, 'avgScores': [1.44, 1.06, 0.56, 0.71, 0.26, 1.47]}
{'industry': '紡織業', 'count': 29, 'scoredCount': 10, 'avgScores': [1.30, 0.10, 1.20, 0.20, 1.80, 0.60]}
{'industry': '自行車業', 'count': 1, 'scoredCount': 1, 'avgScores': [1.0, 1.0, 0.0, 3.0, 0.0, 2.0]}
```

(Python's JSON loader renders `1.00` as `1.0` — that's fine; the file on disk holds `1` as a JSON number, which is value-equal.)

- [ ] **Step 7: Confirm existing consumer still works**

```bash
grep -n "industry-list\|industryList" app/components/CompanyListFilter.vue
```

Expected: 2 matches (line 3 import, line 38 `.map(item => item.industry)`). Both still valid since `industry` is unchanged.

- [ ] **Step 8: Commit**

```bash
git add tools/transform-company-data.ts app/assets/data/industry-list.json
git commit -m "feat(transform): compute per-industry radar averages for industry-list"
```

---

## Task 2: Wire `CompanyRadarSection.vue` to the new data

**Files:**
- Modify: `app/components/company/CompanyRadarSection.vue:43-72`

- [ ] **Step 1: Add the JSON import at the top of the script block**

Open `app/components/company/CompanyRadarSection.vue`. The current import (line 2) is:
```ts
import type { CompanyData } from '~/types/company'
```

Add directly below it:
```ts
import industryList from '~/assets/data/industry-list.json'
```

- [ ] **Step 2: Replace the mock `industryRadarData` computed**

Find lines 63-69:
```ts
// Industry average radar data (mock data - typically around 1.5-2)
const industryRadarData = computed(() => {
  return radarAxesWithPrefix.map(axis => ({
    axis,
    value: 0
  }))
})
```

Replace with a lookup-based computed that pulls the company's industry entry once and reuses it for both `industryRadarData` and the legend label:

```ts
// Industry-average lookup (by 產業分類 string match — both data sources use the same 20 strings)
const industryEntry = computed(() =>
  industryList.find(e => e.industry === props.company.產業分類)
)

const industryRadarData = computed(() => {
  const scores = industryEntry.value?.avgScores ?? [0, 0, 0, 0, 0, 0]
  return radarAxesWithPrefix.map((axis, i) => ({
    axis,
    value: scores[i] ?? 0
  }))
})
```

- [ ] **Step 3: Fix the duplicate-業 label and add sample-size suffix**

Find line 72:
```ts
const industryName = computed(() => `${props.company.產業分類}業平均`)
```

Replace with:
```ts
const industryName = computed(() => {
  const ind = props.company.產業分類 ?? ''
  const n = industryEntry.value?.scoredCount ?? 0
  return `${ind}平均（${n} 間）`
})
```

(The literal `業` is dropped — every 產業分類 string already ends in `業`. Verified on all 20 values in `app/assets/data/company-list.json`.)

- [ ] **Step 4: Start the dev server**

```bash
npm run dev
```

Wait for the "Local:   http://localhost:3000" line. Leave it running.

- [ ] **Step 5: Visual spot-check (4 pages)**

Open each URL in the browser. For each, confirm: (a) two distinct polygons (red company + gray industry), (b) legend label matches expected, (c) industry polygon shape roughly matches the avgScores in the reference table.

1. `http://localhost:3000/companies/台塑石化股份有限公司`
   - Legend: `石化業平均（39 間）`
   - Industry axes (clockwise from top): roughly 1.5, 0.4, 0.7, 0.4, 0.9, 1.1

2. `http://localhost:3000/companies/台灣積體電路製造股份有限公司`
   - Legend: `半導體業平均（34 間）`
   - Industry axes: 1.4, 1.1, 0.6, 0.7, 0.3, 1.5

3. `http://localhost:3000/companies/三福氣體股份有限公司` (one of the 119 unscored)
   - Company polygon: collapsed to inner ring (all zeros).
   - Industry polygon: same 半導體業 shape as TSMC's page.
   - Legend: `半導體業平均（34 間）`.

4. A 自行車業 company — find one via:
     ```bash
     python3 -c "
     import json
     with open('app/assets/data/company-list.json') as f:
         d = json.load(f)
     for c in d:
         if c.get('產業分類') == '自行車業':
             print(c['公司'])
             break
     "
     ```
   Open its page. Industry and company polygons should overlap exactly. Legend: `自行車業平均（1 間）`.

- [ ] **Step 6: Stop the dev server (Ctrl-C in its terminal) and commit**

```bash
git add app/components/company/CompanyRadarSection.vue
git commit -m "feat(radar): show real per-industry average with sample size on company pages"
```

---

## Task 3: Deploy to live site

Per CLAUDE.md, frontend-only changes go through `git push` → Pages workflow. No sync-data.yml involvement (no Sheet B touch).

- [ ] **Step 1: Push**

```bash
git push
```

- [ ] **Step 2: Monitor the deploy**

```bash
gh run list --workflow=deploy.yml --repo gcaa-org-tw/carbon-watch --limit 3
```

Wait until the latest run shows `completed success`. Re-run the command every minute or so.

- [ ] **Step 3: Live verification**

Open `https://carbon-watch.gcaa.org.tw/companies/台塑石化股份有限公司` (or the production URL — confirm from `gh repo view gcaa-org-tw/carbon-watch --json url`). Confirm legend reads `石化業平均（39 間）` and industry polygon is non-degenerate.

If the live page still shows the old `[0,0,0,0,0,0]` polygon after the deploy completes, hard-refresh (Cmd-Shift-R) to bypass cached JS.

---

## Self-review notes

- **Spec coverage**: Task 1 implements the data-shape change and computation rule from spec §"Data shape" + §"Implementation outline Step 1". Task 2 implements §"Implementation outline Step 2" and the in-scope label-bug fix. Task 3 covers §"Deploy". Spec §"TypeScript (optional)" deferred — JSON imports work untyped, and `CompanyListFilter.vue` doesn't assert a shape.
- **Placeholder scan**: no TBD/TODO; all code blocks are complete; all commands have expected output or a precise outcome.
- **Type consistency**: `industryAverages` is `Map<string, { count, scoredCount, avgScores }>` in Task 1 Step 2; consumed in Task 1 Step 4 as `agg.scoredCount` / `agg.avgScores` — matches. `industryEntry` in Task 2 returns the union of `industryList[number] | undefined`; both `.value?.avgScores` and `.value?.scoredCount` are accessed — fields present on the JSON written in Task 1. No drift.
