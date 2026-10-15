<script setup lang="ts">
import type { CompanyData } from '~/types/company'
import companyGradeMap from '~/assets/data/company-grade-map.json'

const props = withDefaults(defineProps<{
  rows: CompanyData[]
  showRank?: boolean
  showLegend?: boolean
  // 基金頁：插入燃煤使用量欄並預設以燃煤用量遞減排序（排放量為次要排序）
  coalFirst?: boolean
  moreLink?: { label: string, to: string }
}>(), {
  showRank: false,
  showLegend: true,
  coalFirst: false,
  moreLink: undefined,
})

/* ── 雷達圖評級 → 燈號 ─────────────────────────────────── */
// 承諾「絕對減量目標」＋ 行動 3 項 ＋ 透明度「範疇三減量規劃」
const RADAR_FIELDS = [
  '2030年溫室氣體絕對減量目標',
  '2030年再生能源使用率目標',
  '2030年能源效率進步目標',
  '2024年再生能源使用率',
  '2022-2024年能源效率進步率',
  '範疇三及減量策略',
] as const

const GRADE_TO_DOT: Record<string, string> = {
  超乎期待: 'great',
  合乎標準: 'ok',
  有待加強: 'warn',
  遠低於期望: 'bad',
}

const 雷達圖級距 = companyGradeMap['雷達圖'] as Array<{ label: string, min: number, max?: number }>

const radarDot = (raw: string): string | null => {
  const n = Number.parseFloat(raw)
  if (Number.isNaN(n)) return null
  const grade = 雷達圖級距.find(g =>
    g.max !== undefined ? n >= g.min && n <= g.max : n >= g.min
  )
  return grade ? GRADE_TO_DOT[grade.label] ?? null : null
}

/* ── 格式化 ───────────────────────────────────────────── */
const hasReport = (company: CompanyData): boolean => company['有永續報告書'] !== false

const formatTarget = (raw: string): string => {
  if (raw.endsWith('%')) {
    const n = Number.parseFloat(raw)
    return Number.isNaN(n) ? NOT_DISCLOSED : `${n.toFixed(1)}%`
  }
  return raw
}

const targetText = (company: CompanyData): string => {
  const raw = company['2030 年減量目標設定']
  return reportPlaceholder(raw, hasReport(company)) ?? formatTarget(String(raw).trim())
}

const netZeroText = (company: CompanyData): string => {
  const raw = company['淨零目標年']
  const placeholder = reportPlaceholder(raw, hasReport(company))
  if (placeholder) return placeholder
  const s = String(raw).trim()
  return s === '無' || s === '無承諾' ? '無承諾' : s
}

// 燃煤使用量：整數公噸；空白顯示破折號，0 顯示 0（company-grade-map：≥1 即「遠低於期望」）
const formatCoal = (raw: string): string => {
  const s = String(raw ?? '').trim()
  if (s === '' || s === 'NA') return NOT_DISCLOSED
  const n = Number(s.replace(/,/g, ''))
  if (Number.isNaN(n)) return NOT_DISCLOSED
  return n.toLocaleString('zh-TW', { maximumFractionDigits: 0 })
}

const isBlankField = (raw: unknown): boolean => {
  const s = String(raw ?? '').trim()
  return s === '' || s === 'NA'
}

const isUnrated = (company: CompanyData): boolean =>
  RADAR_FIELDS.slice(0, 5).every(field => isBlankField(company[field]))

const EMOJI_CHECK = String.fromCodePoint(0x2705)
const EMOJI_CROSS = String.fromCodePoint(0x274C)
const formatSbti = (raw: string): string => {
  if (!raw) return '—'
  if (raw === EMOJI_CHECK) return String.fromCodePoint(0x2713)
  if (raw === EMOJI_CROSS) return String.fromCodePoint(0x2717)
  return raw
}

/* ── 排序 ─────────────────────────────────────────────── */
const SORT_FIELDS: Record<string, keyof CompanyData> = {
  company: '公司',
  industry: '產業分類',
  coal: '燃煤使用量（公噸）',
  emission: '溫室氣體排放量（公噸二氧化碳當量）',
  netZero: '淨零目標年',
  target2030: '2030 年減量目標設定',
  sbti: 'SBTi 承諾',
  d0: '2030年溫室氣體絕對減量目標',
  d1: '2030年再生能源使用率目標',
  d2: '2030年能源效率進步目標',
  d3: '2024年再生能源使用率',
  d4: '2022-2024年能源效率進步率',
  d5: '範疇三及減量策略',
}
const STRING_KEYS = new Set(['company', 'industry'])

const sortKey = ref<string>(props.coalFirst ? 'coal' : 'emission')
const sortDir = ref<'asc' | 'desc'>('desc')

const emissionValue = (c: CompanyData): number =>
  Number(String(c['溫室氣體排放量（公噸二氧化碳當量）'] ?? '').replace(/,/g, '')) || 0

const setSort = (key: string) => {
  if (sortKey.value === key) {
    sortDir.value = sortDir.value === 'desc' ? 'asc' : 'desc'
  } else {
    sortKey.value = key
    sortDir.value = STRING_KEYS.has(key) ? 'asc' : 'desc'
  }
}

const arrow = (key: string): string =>
  sortKey.value === key ? (sortDir.value === 'desc' ? '↓' : '↑') : ''

const sortValue = (company: CompanyData, key: string): number | string => {
  const field = SORT_FIELDS[key]
  if (key === 'netZero') return Number.parseFloat(netZeroText(company))
  if (key === 'target2030') return Number.parseFloat(targetText(company))
  if (key === 'd5' && isUnrated(company)) return Number.NaN
  const raw = field ? String(company[field] ?? '') : ''
  if (key === 'sbti') return sbtiRank(raw)
  if (STRING_KEYS.has(key)) return raw
  return Number.parseFloat(raw.replace(/[,%]/g, ''))
}

// Rank by absolute emissions, independent of the current sort.
const rankByCompany = computed(() => {
  const map = new Map<string, number>()
  ;[...props.rows]
    .sort((a, b) =>
      Number(String(b['溫室氣體排放量（公噸二氧化碳當量）'] ?? '').replace(/,/g, '')) -
      Number(String(a['溫室氣體排放量（公噸二氧化碳當量）'] ?? '').replace(/,/g, ''))
    )
    .forEach((c, i) => map.set(c['公司'], i + 1))
  return map
})

const sortedRows = computed(() => {
  const dir = sortDir.value === 'asc' ? 1 : -1
  return [...props.rows].sort((a, b) => {
    const av = sortValue(a, sortKey.value)
    const bv = sortValue(b, sortKey.value)
    let cmp: number
    if (typeof av === 'number' && typeof bv === 'number') {
      const aNaN = Number.isNaN(av)
      const bNaN = Number.isNaN(bv)
      if (aNaN && bNaN) cmp = 0
      else if (aNaN) return 1
      else if (bNaN) return -1
      else cmp = (av - bv) * dir
    }
    else {
      cmp = zhCollator.compare(String(av), String(bv)) * dir
    }
    // 燃煤優先排序：用量相同時以絕對排放量遞減為次要排序
    if (cmp === 0 && sortKey.value === 'coal') {
      return emissionValue(b) - emissionValue(a)
    }
    return cmp
  })
})

const tableRows = computed(() =>
  sortedRows.value.map(company => ({
    rank: rankByCompany.value.get(company['公司']) ?? 0,
    公司: company['公司'],
    產業分類: company['產業分類'],
    燃煤: formatCoal(company['燃煤使用量（公噸）']),
    有燃煤: Number(String(company['燃煤使用量（公噸）'] ?? '').replace(/,/g, '')) > 0,
    排放量: formatEmissions(company['溫室氣體排放量（公噸二氧化碳當量）']),
    排放年度: fallbackEmissionYear(company),
    淨零目標年: netZeroText(company),
    減量目標: targetText(company),
    SBTi: formatSbti(company['SBTi 承諾']),
    dots: RADAR_FIELDS.map((field, i) =>
      i === RADAR_FIELDS.length - 1 && isUnrated(company) ? null : radarDot(company[field])
    ),
  }))
)

const legendItems = [
  { dot: 'great', label: '超乎期待' },
  { dot: 'ok', label: '合乎標準' },
  { dot: 'warn', label: '有待加強' },
  { dot: 'bad', label: '遠低於期望' },
]
</script>

<template>
  <div class="score-table">
    <div v-if="showLegend" class="legend">
      <div v-for="item in legendItems" :key="item.dot" class="legend-item">
        <span class="dot" :class="`dot-${item.dot}`" />
        {{ item.label }}
      </div>
      <NuxtLink v-if="moreLink" :to="moreLink.to" class="legend-link">{{ moreLink.label }}</NuxtLink>
      <NuxtLink v-else to="/methodology" class="legend-link">了解分級標準 →</NuxtLink>
    </div>

    <div class="table-wrap">
      <table class="tbl" :class="{ 'has-rank': showRank }">
        <thead>
          <tr>
            <th v-if="showRank" rowspan="2" class="col-sticky col-sticky-1 col-rank">#</th>
            <th
              rowspan="2"
              class="col-sticky col-sticky-last sortable"
              :class="[showRank ? 'col-sticky-2' : 'col-sticky-1', { active: sortKey === 'company' }]"
              @click="setSort('company')"
            >
              企業名稱<span class="arrow">{{ arrow('company') }}</span>
            </th>
            <th
              rowspan="2"
              class="sortable"
              :class="{ active: sortKey === 'industry' }"
              @click="setSort('industry')"
            >
              產業分類<span class="arrow">{{ arrow('industry') }}</span>
            </th>
            <th
              v-if="coalFirst"
              rowspan="2"
              class="r sortable"
              :class="{ active: sortKey === 'coal' }"
              @click="setSort('coal')"
            >
              燃煤<br>使用量（公噸）<span class="arrow">{{ arrow('coal') || '↓' }}</span>
            </th>
            <th
              rowspan="2"
              class="r sortable"
              :class="{ active: sortKey === 'emission' }"
              @click="setSort('emission')"
            >
              2024 年溫室氣體<br>排放量<span class="arrow">{{ arrow('emission') || (coalFirst ? '' : '↓') }}</span>
            </th>
            <th
              rowspan="2"
              class="c sortable"
              :class="{ active: sortKey === 'netZero' }"
              @click="setSort('netZero')"
            >
              淨零<br>目標年<span class="arrow">{{ arrow('netZero') }}</span>
            </th>
            <th class="th-group" colspan="2">承諾</th>
            <th class="th-group" colspan="3">行動</th>
            <th class="th-group" colspan="3">透明度</th>
          </tr>
          <tr>
            <th class="c sortable" :class="{ active: sortKey === 'target2030' }" @click="setSort('target2030')">
              2030 年<br>減量目標<span class="arrow">{{ arrow('target2030') }}</span>
            </th>
            <th class="c sortable" :class="{ active: sortKey === 'sbti' }" @click="setSort('sbti')">
              SBTi<br>承諾<span class="arrow">{{ arrow('sbti') }}</span>
            </th>
            <th class="c sortable" :class="{ active: sortKey === 'd0' }" @click="setSort('d0')">
              絕對<br>減量目標<span class="arrow">{{ arrow('d0') }}</span>
            </th>
            <th class="c sortable" :class="{ active: sortKey === 'd1' }" @click="setSort('d1')">
              再生能源<br>使用率目標<span class="arrow">{{ arrow('d1') }}</span>
            </th>
            <th class="c sortable" :class="{ active: sortKey === 'd2' }" @click="setSort('d2')">
              能源效率<br>進步目標<span class="arrow">{{ arrow('d2') }}</span>
            </th>
            <th class="c sortable" :class="{ active: sortKey === 'd3' }" @click="setSort('d3')">
              2024 年<br>再生能源使用率<span class="arrow">{{ arrow('d3') }}</span>
            </th>
            <th class="c sortable" :class="{ active: sortKey === 'd4' }" @click="setSort('d4')">
              近三年<br>能源密集度變化<span class="arrow">{{ arrow('d4') }}</span>
            </th>
            <th class="c sortable" :class="{ active: sortKey === 'd5' }" @click="setSort('d5')">
              範疇三<br>減量規劃<span class="arrow">{{ arrow('d5') }}</span>
            </th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="row in tableRows" :key="row.公司">
            <td v-if="showRank" class="td-rank col-sticky col-sticky-1 col-rank">
              {{ row.rank }}
            </td>
            <td class="col-sticky col-sticky-last" :class="showRank ? 'col-sticky-2' : 'col-sticky-1'">
              <NuxtLink class="td-company" :to="`/companies/${encodeURIComponent(row.公司)}`">
                {{ row.公司 }}
              </NuxtLink>
            </td>
            <td><span class="badge">{{ row.產業分類 }}</span></td>
            <td v-if="coalFirst" class="r">
              <span :class="row.有燃煤 ? 'td-num td-coal' : row.燃煤 === '—' ? 'td-muted' : 'td-num'">{{ row.燃煤 }}</span>
            </td>
            <td class="r td-num">
              {{ row.排放量 }}<span v-if="row.排放年度" class="td-year-note">（{{ row.排放年度 }} 年）</span>
            </td>
            <td class="c td-muted">{{ row.淨零目標年 }}</td>
            <td class="c td-muted">{{ row.減量目標 }}</td>
            <td class="c td-muted td-sbti">{{ row.SBTi }}</td>
            <td v-for="(dot, di) in row.dots" :key="di" class="c">
              <span v-if="dot" class="dot" :class="`dot-${dot}`" />
              <span v-else class="dot-empty">—</span>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <p class="table-note">NA：無法取得資料</p>

    <p v-if="tableRows.length === 0" class="empty-note">找不到符合條件的企業</p>
  </div>
</template>

<style scoped>
.score-table {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.legend {
  display: flex;
  gap: 20px;
  flex-wrap: wrap;
  align-items: center;
  padding: 12px 16px;
  background: var(--color-bg-elevated);
  border: 1px solid var(--color-bg-border);
  border-radius: 8px;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: var(--color-text-secondary);
}

.legend-link {
  margin-left: auto;
  font-size: 12px;
  color: var(--color-link);
}

.legend-link:hover {
  color: var(--color-link-hover);
}

.dot {
  display: inline-block;
  width: 10px;
  height: 10px;
  border-radius: 50%;
  vertical-align: middle;
}

.dot-great { background: var(--color-status-great); }
.dot-ok { background: var(--color-status-ok); }
.dot-warn { background: var(--color-status-warn); }
.dot-bad { background: var(--color-status-bad); }

.dot-empty {
  color: var(--color-text-muted);
  font-size: 11px;
}

.table-wrap {
  border: 1px solid var(--color-bg-border);
  border-radius: 12px;
  overflow: auto;
  max-height: calc(100vh - 190px);
}

.table-wrap::-webkit-scrollbar {
  width: 4px;
  height: 4px;
}

.table-wrap::-webkit-scrollbar-track {
  background: transparent;
}

.table-wrap::-webkit-scrollbar-thumb {
  background: var(--color-bg-border);
  border-radius: 2px;
}

.tbl {
  width: 100%;
  border-collapse: separate;
  border-spacing: 0;
  font-size: 13px;
  min-width: 940px;
}

.tbl thead th {
  background: var(--color-bg-elevated);
  color: var(--color-text-muted);
  font-size: 12px;
  font-weight: 500;
  letter-spacing: 0.07em;
  padding: 11px 12px;
  text-align: left;
  border-bottom: 1px solid var(--color-bg-border);
  white-space: nowrap;
  position: sticky;
  top: 0;
  z-index: 20;
}

.tbl thead tr:nth-child(2) th {
  top: 38px;
}

.tbl thead th::after {
  content: '';
  position: absolute;
  left: 0;
  right: 0;
  bottom: -1px;
  height: 1px;
  background: var(--color-bg-border);
}

.tbl thead th.r { text-align: right; }
.tbl thead th.c { text-align: center; }

.sortable {
  cursor: pointer;
  transition: color 0.15s;
}

.sortable:hover {
  color: var(--color-text-secondary);
}

.sortable.active {
  color: var(--color-green-spring);
}

.arrow {
  display: inline-block;
  margin-left: 3px;
  font-size: 10px;
}

.th-group {
  background: var(--color-bg-overlay) !important;
  color: var(--color-green-spring) !important;
  font-size: 9px !important;
  text-align: center !important;
  border-bottom: 2px solid var(--color-green-forest) !important;
}

.tbl tbody tr {
  transition: background 0.1s;
}

.tbl tbody td {
  padding: 11px 12px;
  vertical-align: middle;
  white-space: nowrap;
  border-bottom: 1px solid var(--color-bg-border);
}

.tbl tbody tr:last-child td {
  border-bottom: none;
}

.tbl tbody tr:hover {
  background: var(--color-bg-elevated);
}

.tbl tbody td.r { text-align: right; }
.tbl tbody td.c { text-align: center; }

/* ── 凍結左側欄位（手機橫向捲動時保持可見）───────────── */
.col-sticky {
  position: sticky;
  z-index: 6;
  background: var(--color-bg-base);
}

.tbl thead .col-sticky {
  z-index: 30;
  background: var(--color-bg-elevated);
}

.col-sticky-1 { left: 0; }
.col-sticky-2 { left: 44px; }

.col-rank {
  width: 44px;
  min-width: 44px;
}

.col-sticky-last {
  min-width: 96px;
}

.tbl tbody tr:hover .col-sticky {
  background: var(--color-bg-elevated);
}

.col-sticky-last::before {
  content: '';
  position: absolute;
  top: 0;
  bottom: 0;
  right: 0;
  width: 1px;
  background: var(--color-bg-border);
}

.td-rank {
  font-family: 'IBM Plex Mono', monospace;
  font-size: 12px;
  color: var(--color-text-muted);
}

.td-company {
  font-weight: 500;
  color: var(--color-link);
  cursor: pointer;
}

.td-company:hover {
  color: var(--color-link-hover);
}

.td-num {
  font-family: 'IBM Plex Mono', monospace;
  font-size: 13.5px;
  color: var(--color-text-primary);
}

.td-muted {
  color: var(--color-text-muted);
  font-size: 13px;
}

/* 燃煤使用量有值即為「遠低於期望」（company-grade-map ≥1）→ 以警示色標示 */
.td-coal {
  color: var(--color-status-bad);
}

.td-sbti {
  font-size: 12px;
}

.td-year-note {
  margin-left: 4px;
  font-size: 11px;
  color: var(--color-text-muted);
}

.badge {
  display: inline-block;
  font-size: 12px;
  font-weight: 500;
  padding: 2px 8px;
  border-radius: 4px;
  background: var(--color-bg-overlay);
  color: var(--color-text-secondary);
  border: 1px solid var(--color-bg-border);
}

.table-note {
  font-size: 12px;
  color: var(--color-text-muted);
}

.empty-note {
  padding: 32px 0;
  text-align: center;
  font-size: 14px;
  color: var(--color-text-muted);
}
</style>
