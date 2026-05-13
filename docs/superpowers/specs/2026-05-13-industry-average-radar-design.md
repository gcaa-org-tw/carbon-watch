# Industry-Average Radar on Company Pages — Design

Date: 2026-05-13
Status: Draft, pending user approval
Related backlog item: 排碳大戶資料修正 04-16 / CLAUDE.md "Frontend hardcoded mock data still on the site" (d) 產業平均雷達.

## Problem

`CompanyRadarSection.vue` draws a radar with two polygons: the company's 6-axis score and
the industry average. The company polygon is real, sourced from `雷達圖_Data.csv`. The
industry polygon is hardcoded to `[0, 0, 0, 0, 0, 0]` (lines 64-69), so all 287 company
pages show a degenerate industry baseline that pins to the inner ring.

Data to compute a real average already exists: every row in `雷達圖_Data.csv` carries
`產業類別`, and every company in `company-list.json` carries `產業分類` (same vocabulary,
20 industries, no name drift).

## Scope

In scope:
- Compute per-industry average for the 6 radar axes.
- Surface the average in `industry-list.json`.
- Wire `CompanyRadarSection.vue` to read the average and label it with sample size.
- Fix the pre-existing duplicate-`業` bug in the `industryName` label (touched by the
  same edit).

Out of scope:
- Backlog item (c) 淨零路徑模擬器 hardcoded baselines — separate work.
- Adjusting the radar chart visual itself (grid, colors, polygon styling) — the existing
  `CompanyRadarChart.vue` already accepts continuous values and shapes the industry
  polygon correctly.
- Adding industry averages to non-radar surfaces (e.g., 縣市卡片).

## Data analysis

From `raw-data/雷達圖_Data.csv` (287 rows):

- **Scoring is binary at the row level**: 168 companies have all 6 axes filled with
  integers 0-3, 119 have all 6 axes blank. There are zero partial rows. This collapses
  the "per-dimension blank exclusion" rule into "whole-row exclusion of unscored
  companies": for any industry, the sample size n is single-valued, not per-axis.
- **All 20 industries have ≥1 scored company**, so no industry needs a fallback to an
  all-companies average.
- Industry size distribution (total / scored):
  - Large (≥20 total): 石化業 74/39, 半導體業 49/34, 鋼鐵業 32/18, 紡織業 29/10, 電子業 24/20
  - Mid (5-19 total): 光電業 14/11, 非金屬製品加工業 13/5, 食品業 12/6, 造紙業 11/5, 水泥業 8/6
  - Small (2-7 total): 銅製造業 6/2, 汽機車業 4/2, 鋁製造業 3/3, 電池製造業 2/1
  - Singleton industries (1 total / 1 scored): 眼鏡製造業, 碾穀、磨粉及澱粉製品製造業, 金屬加工用機械設備製造業, 造船業, 航空業, 自行車業

## Design decisions (user-approved)

1. **Score scope**: exclude unscored companies AND per-axis blanks. (Collapses to
   whole-row exclusion in practice given the binary scoring state.)
2. **Small-industry handling**: always show the industry polygon, label it with the
   sample size `(N 間)` so users can judge significance. No threshold-based hiding,
   no fallback to all-companies average.
3. **Storage choice**: augment the existing `industry-list.json` rather than introduce
   a new file or compute on the client.

## Architecture

```
raw-data/雷達圖_Data.csv   ──┐
                              ├──> transform-company-data.ts
raw-data/排碳大戶表_Data.csv ──┘    (build-time, npm run build)
                                              │
                                              ▼
                              app/assets/data/industry-list.json
                                              │
                                              ▼
              CompanyRadarSection.vue ◄── companyList[slug].產業分類
                                              │
                                              ▼
                                      CompanyRadarChart.vue
                                      (existing d3 polygon)
```

No runtime computation. Build-time pipeline already reads `雷達圖_Data.csv` for
`applyRadarScoresFromSource`; the new aggregation reuses that parse.

## Data shape

`app/assets/data/industry-list.json` changes from:

```ts
Array<{ industry: string; count: number }>
```

to:

```ts
Array<{
  industry: string;          // e.g. "石化業"
  count: number;             // total companies in industry (e.g. 74)
  scoredCount: number;       // companies with non-blank radar scores (e.g. 39)
  avgScores: [number, number, number, number, number, number];  // 2-decimal floats, 0-3 range
}>
```

Axis order matches `RADAR_SCORE_FIELDS` (existing constant, `tools/transform-company-data.ts`
lines 542-549):

```
[
  "2030年溫室氣體絕對減量目標",
  "2030年再生能源使用率目標",
  "2030年能源效率進步目標",
  "2024年再生能源使用率",
  "2022-2024年能源效率進步率",
  "範疇三及減量策略"
]
```

Same order as `radarFieldMap` in `CompanyRadarSection.vue` lines 43-50.

## Existing consumer compatibility

`industry-list.json` has one consumer today: `CompanyListFilter.vue` line 3
(`import industryList from '~/assets/data/industry-list.json'`). It only reads
`industry` and `count`; adding fields is non-breaking. No TypeScript type change is
required if it imports the JSON without an explicit type annotation. Verify before
edit.

Order remains by `count` desc (current behavior), since the filter component relies on
it.

## Implementation outline

### Step 1: transform script (`tools/transform-company-data.ts`)

After `applyRadarScoresFromSource` (line 700), reuse the already-parsed `radarData`
to build per-industry aggregates:

```ts
// Pseudo-code
const RADAR_SCORE_FIELDS = [...]  // already defined line 542

function computeIndustryAverages(radarData: Record<string, string>[]) {
  const sums = new Map<string, { count: number; scoredCount: number; totals: number[] }>();
  for (const row of radarData) {
    const industry = row['產業類別']?.trim();
    if (!industry) continue;
    const entry = sums.get(industry) ?? { count: 0, scoredCount: 0, totals: [0,0,0,0,0,0] };
    entry.count += 1;
    const first = row[RADAR_SCORE_FIELDS[0]];
    if (first !== undefined && first !== '') {
      entry.scoredCount += 1;
      RADAR_SCORE_FIELDS.forEach((f, i) => {
        entry.totals[i] += Number(row[f]) || 0;
      });
    }
    sums.set(industry, entry);
  }
  return sums;
}
```

Then in the existing industry-list generation block (lines 771-794), merge the
aggregates with the existing `industryCount` Map:

```ts
const industryList = Array.from(industryCount.entries())
  .sort((a, b) => b[1] - a[1])
  .map(([industry, count]) => {
    const agg = aggregates.get(industry);
    const scoredCount = agg?.scoredCount ?? 0;
    const avgScores = scoredCount > 0
      ? agg!.totals.map(t => Math.round((t / scoredCount) * 100) / 100) as [number, number, number, number, number, number]
      : [0, 0, 0, 0, 0, 0] as [number, number, number, number, number, number];
    return { industry, count, scoredCount, avgScores };
  });
```

Note: `industryCount` is currently keyed by `company['產業分類']` from the merged company
list (line 775). The radar aggregation is keyed by `row['產業類別']` from the radar CSV.
Confirm both maps have the same set of 20 strings (the data scan above shows they do)
and bridge by the industry-name string.

### Step 2: radar section (`app/components/company/CompanyRadarSection.vue`)

```ts
import industryList from '~/assets/data/industry-list.json';

const industryEntry = computed(() =>
  industryList.find(e => e.industry === props.company.產業分類)
);

const industryRadarData = computed(() => {
  const scores = industryEntry.value?.avgScores ?? [0, 0, 0, 0, 0, 0];
  return radarAxesWithPrefix.map((axis, i) => ({ axis, value: scores[i] ?? 0 }));
});

const industryName = computed(() => {
  const ind = props.company.產業分類;
  const n = industryEntry.value?.scoredCount ?? 0;
  return `${ind}平均（${n} 間）`;
});
```

The legend in the template (lines 96-99) reads `industryName`, so the `(N 間)` suffix
flows through with no template change.

**Pre-existing bug fix (in scope, since we touch this label):** the current
`industryName` is `\`${props.company.產業分類}業平均\`` (line 72), which appends a
literal `業` to the industry string. Every 產業分類 value already ends in `業` (verified
on the 20 distinct strings), so the live label renders as `石化業業平均`,
`半導體業業平均`, etc. The new label above drops the literal `業` and reads
`石化業平均（39 間）`.

### Step 3: TypeScript (optional)

If a typed import is desired, add `app/types/industry.ts` with:

```ts
export interface IndustryListEntry {
  industry: string;
  count: number;
  scoredCount: number;
  avgScores: [number, number, number, number, number, number];
}
```

Update `CompanyListFilter.vue` to import the type if it currently asserts a shape.
Optional — JSON imports work without explicit types.

## Edge cases

- **Unscored company viewing its own page** (e.g., 三福氣體, one of the 119): company
  polygon collapses to the inner ring (existing behavior, `parseRadarValue` returns 0
  for blank). Industry polygon renders the real average. Visual story: "you have no
  scored data; here's where your peers sit."
- **Singleton industries** (n=1): 6 industries fall in this bucket. Industry polygon
  coincides exactly with the company's. Label reads `(1 間)`. Accepted per user
  decision (transparent rather than hidden).
- **Industry name mismatch / missing**: defensive fallback to `[0, 0, 0, 0, 0, 0]` and
  `0 間` label. Should never trigger in practice; logging a console warning helps catch
  data drift early.
- **CompanyListFilter.vue** (existing consumer): unaffected — it reads `industry` and
  `count`, ignores new fields.

## Testing

Manual verification post-build:
1. 石化業 page (e.g., 台塑石化): industry polygon visibly different from company polygon,
   legend reads `石化業平均（39 間）`. Cross-check axes against the Python aggregate:
   `[1.51, 0.38, 0.74, 0.38, 0.92, 1.08]`.
2. Mid industry (紡織業, n=10): legend reads `紡織業平均（10 間）`, axes
   `[1.30, 0.10, 1.20, 0.20, 1.80, 0.60]`.
3. Singleton industry (自行車業, n=1): industry polygon overlays company exactly; label
   `自行車業平均（1 間）`.
4. Unscored company (三福氣體, 半導體業): company polygon at inner ring, industry
   polygon traces 半導體業's `[1.44, 1.06, 0.56, 0.71, 0.26, 1.47]`.
5. `industry-list.json` file size grows modestly (~800 B → ~2 KB), payload still
   trivial.
6. `CompanyListFilter` (filter dropdown on the company list page) still works — order
   and labels unchanged.

No automated tests are added; the existing project has no test harness for the
transform script.

## Deploy

Per CLAUDE.md deploy chain, after rebuild:

```bash
git add app/assets/data/industry-list.json tools/transform-company-data.ts \
        app/components/company/CompanyRadarSection.vue docs/superpowers/specs/...
git commit -m "feat: compute and display per-industry radar averages"
git push
```

Pages workflow auto-deploys. No Google Sheet / sync-data workflow involvement —
this is a frontend-only change driven by an already-synced CSV.

## Risks and trade-offs

- **Industry-name vocabulary drift**: if `產業類別` in `雷達圖_Data.csv` diverges from
  `產業分類` in `易讀版` later (typo, renaming), some companies' industry lookup will miss.
  Defensive fallback prevents crashes; a build-time assertion (warn if any company's
  `產業分類` has no matching entry) would catch it. Adding this check is cheap and
  recommended.
- **Singleton-industry semantics**: showing `(1 間)` is honest but the overlapping
  polygons may look like a rendering glitch. User has chosen transparency over hiding.
  If later judged misleading, the threshold-based hiding option remains available.
- **Score-precision rounding**: 2 decimals (e.g., `1.27`) keeps the JSON readable and
  is below visual precision of the radar at 4 grid rings. No information loss for the
  chart.
