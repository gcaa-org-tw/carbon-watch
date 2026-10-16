<script setup lang="ts">
import type { CompanyData } from '~/types/company'

const props = withDefaults(defineProps<{
  rows: CompanyData[]
  // 基金頁：把燃煤使用量欄移到排放量前，並預設以燃煤用量遞減排序
  coalFirst?: boolean
}>(), {
  coalFirst: false,
})

/* ── 欄位定義 ─────────────────────────────────────────── */
// 設計稿（改設計0828）專業版：純數據表，狀態欄一律以中性文字呈現，不套用燈號／膠囊
type Kind = 'company' | 'badge' | 'status' | 'num' | 'text'

interface Col {
  key: keyof CompanyData
  label: string
  align?: 'r' | 'c'
  kind: Kind
  sortable?: boolean
}

const COAL_KEY = '燃煤使用量（公噸）' as const
const CAPACITY_KEY = '再生能源設置容量' as const
const INTENSITY_KEY = '近三年能效進步率' as const
const EMISSION_KEY = '溫室氣體排放量（公噸二氧化碳當量）' as const

const BASE_COLUMNS: Col[] = [
  { key: '公司', label: '企業名稱', kind: 'company', sortable: true },
  { key: '產業分類', label: '產業分類', kind: 'badge', sortable: true },
  { key: '溫室氣體排放量（公噸二氧化碳當量）', label: '2024 年溫室氣體排放量', align: 'r', kind: 'num', sortable: true },
  { key: '淨零目標年', label: '淨零目標年', align: 'c', kind: 'text', sortable: true },
  { key: '2030 年減量目標設定', label: '2030 年減量目標設定', align: 'c', kind: 'text', sortable: true },
  { key: 'SBTi 承諾', label: 'SBTi 承諾', align: 'c', kind: 'status', sortable: true },
  { key: '有具體減量策略', label: '有關鍵減量策略', align: 'c', kind: 'status', sortable: true },
  { key: '範疇三揭露', label: '範疇三揭露', align: 'c', kind: 'status', sortable: true },
  { key: '範疇三減量規劃', label: '範疇三減量規劃', align: 'c', kind: 'status', sortable: true },
  { key: '近三年能效進步率', label: '近三年能源密集度變化率', align: 'c', kind: 'num', sortable: true },
  { key: '節能目標設定', label: '節能目標設定', align: 'c', kind: 'num', sortable: true },
  { key: '再生能源使用率', label: '2024 年再生能源使用率', align: 'c', kind: 'num', sortable: true },
  { key: '再生能源設置容量', label: '再生能源設置容量（kW）', align: 'r', kind: 'num', sortable: true },
  { key: '是否完成用電大戶再生能源設置義務', label: '用電大戶再生能源設置義務', align: 'c', kind: 'status', sortable: true },
  { key: '中期再生能源目標設定', label: '中期再生能源目標設定', align: 'c', kind: 'num', sortable: true },
  { key: 'RE100 承諾', label: 'RE100 承諾', align: 'c', kind: 'status', sortable: true },
  { key: '燃煤使用量（公噸）', label: '燃煤使用量（公噸）', align: 'r', kind: 'num', sortable: true },
]

// coalFirst：把燃煤欄移到企業名稱／產業分類之後、排放量之前（基金頁倡議框架）
const COLUMNS = computed<Col[]>(() => {
  if (!props.coalFirst) return BASE_COLUMNS
  const coal = BASE_COLUMNS.find(c => c.key === COAL_KEY)
  if (!coal) return BASE_COLUMNS
  const rest = BASE_COLUMNS.filter(c => c.key !== COAL_KEY)
  return [...rest.slice(0, 2), coal, ...rest.slice(2)]
})

/* ── 格式化 ───────────────────────────────────────────── */
const parseNum = (raw: unknown): number => {
  if (typeof raw === 'number') return raw
  const s = String(raw ?? '').replace(/,/g, '').trim()
  if (s.endsWith('%')) {
    const n = Number.parseFloat(s.slice(0, -1))
    return Number.isNaN(n) ? NaN : n / 100
  }
  return Number.parseFloat(s)
}

const hasReport = (company: CompanyData): boolean => company['有永續報告書'] !== false

const REPORT_KEYS = new Set<keyof CompanyData>([
  '淨零目標年',
  '2030 年減量目標設定',
  '範疇三揭露',
  '範疇三減量規劃',
  '近三年能效進步率',
  '節能目標設定',
  '再生能源使用率',
  '再生能源設置容量',
  '中期再生能源目標設定',
  'RE100 承諾',
  '有具體減量策略',
])
const OBLIGATION_KEY = '是否完成用電大戶再生能源設置義務'
const RE100_KEY = 'RE100 承諾'

const placeholderFor = (company: CompanyData, col: Col): string | undefined => {
  if (!REPORT_KEYS.has(col.key)) return undefined
  const has = hasReport(company)
  const raw = company[col.key]
  return reportPlaceholder(raw as string | undefined, has)
}

const isBlank = (raw: unknown) => {
  const s = String(raw ?? '').trim()
  return s === '' || s === 'NA'
}

const formatPercent = (s: string): string => {
  const n = Number.parseFloat(s.slice(0, -1))
  return Number.isNaN(n) ? s : `${n.toFixed(1)}%`
}

const EMOJI_CHECK = String.fromCodePoint(0x2705)
const EMOJI_CROSS = String.fromCodePoint(0x274C)
const TEXT_CHECK = String.fromCodePoint(0x2713)
const TEXT_CROSS = String.fromCodePoint(0x2717)

type Cell = { kind: 'company' | 'badge' | 'num' | 'text', text: string, tone?: 'good' | 'bad', note?: string }
  | { kind: 'status', tone: 'yes' | 'no' | 'text', text: string }

const statusCell = (company: CompanyData, col: Col): Extract<Cell, { kind: 'status' }> => {
  const raw = company[col.key]
  if (REPORT_KEYS.has(col.key)) {
    const text = reportCheck(raw as string | undefined, hasReport(company), col.key === RE100_KEY)
    if (text === TEXT_CHECK) return { kind: 'status', tone: 'yes', text }
    if (text === TEXT_CROSS) return { kind: 'status', tone: 'no', text }
    return { kind: 'status', tone: 'text', text }
  }
  const s = String(raw ?? '').trim()
  if (s === EMOJI_CHECK) return { kind: 'status', tone: 'yes', text: TEXT_CHECK }
  if (col.key === OBLIGATION_KEY) return { kind: 'status', tone: 'no', text: TEXT_CROSS }
  if (s === EMOJI_CROSS) return { kind: 'status', tone: 'no', text: TEXT_CROSS }
  if (s === '') return { kind: 'status', tone: 'text', text: '—' }
  return { kind: 'status', tone: 'text', text: s }
}

const buildCell = (company: CompanyData, col: Col): Cell => {
  const raw = company[col.key]

  switch (col.kind) {
    case 'company':
      return { kind: 'company', text: String(raw ?? '') }
    case 'badge':
      return { kind: 'badge', text: String(raw ?? '') }
    case 'status':
      return statusCell(company, col)
    case 'num': {
      const placeholder = placeholderFor(company, col)
      if (placeholder) return { kind: 'num', text: placeholder }
      if (isBlank(raw)) return { kind: 'num', text: '—' }
      if (col.key === EMISSION_KEY) {
        const year = fallbackEmissionYear(company)
        return { kind: 'num', text: formatEmissions(String(raw)), note: year ? `（${year} 年）` : undefined }
      }
      if (col.key === COAL_KEY || col.key === CAPACITY_KEY) return { kind: 'num', text: formatTonnes(String(raw)) }
      const s = String(raw).trim()
      if (/^-?[\d,]+(\.\d+)?$/.test(s)) {
        const n = parseNum(s)
        return { kind: 'num', text: Number.isNaN(n) ? s : n.toLocaleString('zh-TW') }
      }
      if (s.endsWith('%')) {
        const n = parseNum(s)
        const tone = col.key === INTENSITY_KEY && !Number.isNaN(n) && n !== 0 ? (n < 0 ? 'good' : 'bad') : undefined
        return { kind: 'num', text: formatPercent(s), tone }
      }
      return { kind: 'num', text: s }
    }
    default: {
      const placeholder = placeholderFor(company, col)
      if (placeholder) return { kind: 'text', text: placeholder }
      if (isBlank(raw)) return { kind: 'text', text: '—' }
      const s = String(raw).trim()
      if (col.key === '淨零目標年' && (s === '無' || s === '無承諾')) return { kind: 'text', text: NOT_DISCLOSED }
      if (s.endsWith('%')) return { kind: 'text', text: formatPercent(s) }
      return { kind: 'text', text: s }
    }
  }
}

/* ── 排序 ─────────────────────────────────────────────── */
const defaultSortKey = (): keyof CompanyData => (props.coalFirst ? COAL_KEY : EMISSION_KEY)

const sortKey = ref<keyof CompanyData>(defaultSortKey())
const sortDir = ref<'asc' | 'desc'>('desc')

const emissionValue = (c: CompanyData): number => {
  const n = parseNum(c[EMISSION_KEY])
  return Number.isNaN(n) ? 0 : n
}

const isTextCol = (col: Col): boolean => col.kind === 'company' || col.kind === 'badge'

const setSort = (col: Col) => {
  if (!col.sortable) return
  if (sortKey.value === col.key) {
    sortDir.value = sortDir.value === 'desc' ? 'asc' : 'desc'
  } else {
    sortKey.value = col.key
    sortDir.value = isTextCol(col) ? 'asc' : 'desc'
  }
}

const arrow = (col: Col): string => {
  if (sortKey.value === col.key) return sortDir.value === 'desc' ? '↓' : '↑'
  return col.key === defaultSortKey() ? '↓' : ''
}

const sortValue = (company: CompanyData, col: Col): number | string => {
  const raw = company[col.key]
  if (isTextCol(col)) return String(raw ?? '')
  if (col.key === 'SBTi 承諾') return sbtiRank(raw)
  if (placeholderFor(company, col)) return Number.NaN
  if (col.kind === 'status') {
    const { text } = statusCell(company, col)
    if (text === TEXT_CHECK) return 2
    if (text === TEXT_CROSS) return 0
    return Number.NaN
  }
  return parseNum(raw)
}

const sortedRows = computed(() => {
  const col = COLUMNS.value.find(c => c.key === sortKey.value)
  if (!col) return props.rows
  const dir = sortDir.value === 'asc' ? 1 : -1
  return [...props.rows].sort((a, b) => {
    const av = sortValue(a, col)
    const bv = sortValue(b, col)
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
    if (cmp === 0 && sortKey.value === COAL_KEY) {
      return emissionValue(b) - emissionValue(a)
    }
    return cmp
  })
})

const tableRows = computed(() =>
  sortedRows.value.map(company => ({
    company: company['公司'],
    cells: COLUMNS.value.map(col => ({ col, cell: buildCell(company, col) })),
  }))
)
</script>

<template>
  <div class="score-table">
    <div class="table-wrap">
      <table class="tbl tbl-pro">
        <thead>
          <tr>
            <th
              v-for="col in COLUMNS"
              :key="col.key"
              :class="[
                col.align,
                {
                  sortable: col.sortable,
                  active: sortKey === col.key,
                  'col-sticky': col.kind === 'company',
                },
              ]"
              @click="setSort(col)"
            >
              {{ col.label }}<span v-if="col.sortable" class="arrow">{{ arrow(col) }}</span>
            </th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="row in tableRows" :key="row.company">
            <td
              v-for="{ col, cell } in row.cells"
              :key="col.key"
              :class="[col.align, { 'col-sticky': cell.kind === 'company' }]"
            >
              <NuxtLink
                v-if="cell.kind === 'company'"
                class="td-company"
                :to="`/companies/${encodeURIComponent(cell.text)}`"
              >
                {{ cell.text }}
              </NuxtLink>

              <span v-else-if="cell.kind === 'badge'" class="badge">{{ cell.text }}</span>

              <span
                v-else-if="cell.kind === 'num'"
                class="td-num"
                :class="cell.tone ? `td-tone-${cell.tone}` : ''"
              >{{ cell.text }}<span v-if="cell.note" class="td-year-note">{{ cell.note }}</span></span>

              <span
                v-else
                class="td-muted"
                :class="{ 'td-sbti': col.key === 'SBTi 承諾' }"
              >{{ cell.text }}</span>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <p class="table-note">無法取得資料的部分用 NA 表示</p>

    <p v-if="tableRows.length === 0" class="empty-note">
      找不到符合條件的企業
    </p>
  </div>
</template>

<style scoped>
/* 表格樣式對齊易讀版 ClimateScoreTable（設計稿 .tbl / .tbl-pro） */
.score-table {
  display: flex;
  flex-direction: column;
  gap: 12px;
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
}

.tbl-pro {
  min-width: 1500px;
}

.tbl thead th {
  background: var(--color-bg-elevated);
  color: var(--color-text-muted);
  font-size: 11px;
  font-weight: 500;
  letter-spacing: 0.07em;
  padding: 9px 10px;
  text-align: left;
  border-bottom: 1px solid var(--color-bg-border);
  white-space: nowrap;
  position: sticky;
  top: 0;
  z-index: 20;
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

.tbl tbody tr {
  transition: background 0.1s;
}

.tbl tbody td {
  padding: 9px 10px;
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

/* ── 凍結企業名稱欄 ───────────────────────────────────── */
.col-sticky {
  position: sticky;
  left: 0;
  z-index: 6;
  min-width: 120px;
  background: var(--color-bg-base);
}

.tbl thead .col-sticky {
  z-index: 30;
  background: var(--color-bg-elevated);
}

.tbl tbody tr:hover .col-sticky {
  background: var(--color-bg-elevated);
}

.col-sticky::before {
  content: '';
  position: absolute;
  top: 0;
  bottom: 0;
  right: 0;
  width: 1px;
  background: var(--color-bg-border);
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
  font-family: 'IBM Plex Mono', 'Cascadia Code', monospace;
  font-size: 13px;
  color: var(--color-text-primary);
}

.td-tone-good {
  color: var(--color-green-deep);
}

.td-tone-bad {
  color: var(--color-accent-red);
}

.td-muted {
  color: var(--color-text-muted);
}

.td-year-note {
  margin-left: 4px;
  font-size: 11px;
  color: var(--color-text-muted);
}

.td-sbti {
  font-size: 12px;
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
