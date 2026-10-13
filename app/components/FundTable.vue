<script setup lang="ts">
interface FundData {
  基金代號: string
  基金名稱: string
  基金統編: string
  總市值: number
  排碳大戶家數: number
  排碳大戶佔比: number
  排碳大戶總碳排量: number
  使用燃煤家數: number
  是否ESG基金: boolean
  fundKey: string
}

const props = defineProps<{
  rows: FundData[]
}>()

const { isPro } = useViewMode()

/* ── 搜尋 ─────────────────────────────────────────────── */
const search = ref('')

const filteredRows = computed(() => {
  const query = search.value.trim().toLowerCase()
  if (!query) return props.rows
  return props.rows.filter(fund =>
    (fund.基金代號 ?? '').toLowerCase().includes(query) ||
    (fund.基金統編 ?? '').toLowerCase().includes(query) ||
    fund.基金名稱.toLowerCase().includes(query)
  )
})

/* ── 格式化 ───────────────────────────────────────────── */
const formatEmissions = (n: number): string => (n ? formatTonnes(n) : '—')

const formatMarketValue = (n: number): string => n.toLocaleString('zh-TW')

const formatShare = (n: number): string => `${n.toFixed(1)}%`

// 使用燃煤家數的燈號色階（沿用氣候績效燈號色）
const coalTone = (n: number): string => {
  if (n >= 5) return 'coal-bad'
  if (n >= 3) return 'coal-warn'
  if (n > 0) return 'coal-some'
  return 'coal-none'
}

/* ── 排序 ─────────────────────────────────────────────── */
type SortKey = 'code' | 'name' | 'coal' | 'mv' | 'cnt' | 'pct' | 'emis'

const SORT_FIELDS: Record<SortKey, keyof FundData> = {
  code: '基金代號',
  name: '基金名稱',
  coal: '使用燃煤家數',
  mv: '總市值',
  cnt: '排碳大戶家數',
  pct: '排碳大戶佔比',
  emis: '排碳大戶總碳排量',
}
const STRING_KEYS = new Set<SortKey>(['code', 'name'])

const sortKey = ref<SortKey>('coal')
const sortDir = ref<'asc' | 'desc'>('desc')

const setSort = (key: SortKey) => {
  if (sortKey.value === key) {
    sortDir.value = sortDir.value === 'desc' ? 'asc' : 'desc'
  } else {
    sortKey.value = key
    sortDir.value = STRING_KEYS.has(key) ? 'asc' : 'desc'
  }
}

const arrow = (key: SortKey): string =>
  sortKey.value === key ? (sortDir.value === 'desc' ? '↓' : '↑') : ''

const sortedRows = computed(() => {
  const key = sortKey.value
  const field = SORT_FIELDS[key]
  const dir = sortDir.value === 'asc' ? 1 : -1

  return [...filteredRows.value].sort((a, b) => {
    if (STRING_KEYS.has(key)) {
      return zhCollator.compare(String(a[field]), String(b[field])) * dir
    }
    return ((a[field] as number) - (b[field] as number)) * dir
  })
})

// Route slug is always fundKey (基金統編, or 基金代號 for the code-less umbrella
// funds); the first column may still *display* 基金代號.
const fundHref = (key: string): string =>
  `/funds/${key}${isPro.value ? '/pro' : ''}`
</script>

<template>
  <div class="fund-table">
    <!-- Filter bar -->
    <div class="filter-bar">
      <UInput
        v-model="search"
        icon="i-heroicons-magnifying-glass-20-solid"
        placeholder="搜尋基金代號或名稱..."
        :ui="{ base: 'filter-sel', root: 'w-full max-w-md' }"
      />
      <p class="result-count">
        共 <strong>{{ sortedRows.length }}</strong> 筆基金
      </p>
    </div>

    <div class="table-wrap">
      <table class="tbl tbl-funds">
        <thead>
          <tr>
            <th
              class="col-sticky col-sticky-1 sortable"
              :class="{ active: sortKey === 'code' }"
              @click="setSort('code')"
            >
              代號 / 統編<span class="arrow">{{ arrow('code') }}</span>
            </th>
            <th
              class="col-sticky col-sticky-2 col-sticky-last sortable"
              :class="{ active: sortKey === 'name' }"
              @click="setSort('name')"
            >
              基金名稱<span class="arrow">{{ arrow('name') }}</span>
            </th>
            <th
              class="c sortable"
              :class="{ active: sortKey === 'coal' }"
              @click="setSort('coal')"
            >
              使用燃煤家數<span class="arrow">{{ arrow('coal') || '↓' }}</span>
            </th>
            <th
              class="r sortable"
              :class="{ active: sortKey === 'mv' }"
              @click="setSort('mv')"
            >
              總市值（百萬新台幣）<span class="arrow">{{ arrow('mv') }}</span>
            </th>
            <th
              class="c sortable"
              :class="{ active: sortKey === 'cnt' }"
              @click="setSort('cnt')"
            >
              排碳大戶家數<span class="arrow">{{ arrow('cnt') }}</span>
            </th>
            <th
              class="r sortable"
              :class="{ active: sortKey === 'pct' }"
              @click="setSort('pct')"
            >
              排碳大戶佔比<span class="arrow">{{ arrow('pct') }}</span>
            </th>
            <th
              class="r sortable"
              :class="{ active: sortKey === 'emis' }"
              @click="setSort('emis')"
            >
              排碳大戶總碳排量（公噸 CO₂e）<span class="arrow">{{ arrow('emis') }}</span>
            </th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="fund in sortedRows" :key="fund.fundKey">
            <td class="col-sticky col-sticky-1">
              <NuxtLink class="td-code" :to="fundHref(fund.fundKey)">
                {{ fund.基金代號 || fund.基金統編 }}
              </NuxtLink>
            </td>
            <td class="td-fund col-sticky col-sticky-2 col-sticky-last">
              <NuxtLink class="td-fund-link" :to="fundHref(fund.fundKey)">
                {{ fund.基金名稱 }}<EsgLeaf v-if="fund.是否ESG基金" />
              </NuxtLink>
            </td>
            <td class="c">
              <span class="coal-tag" :class="coalTone(fund.使用燃煤家數)">
                {{ fund.使用燃煤家數 }}
              </span>
            </td>
            <td class="r td-num">{{ formatMarketValue(fund.總市值) }}</td>
            <td class="c td-num">{{ fund.排碳大戶家數 }}</td>
            <td class="r td-num">{{ formatShare(fund.排碳大戶佔比) }}</td>
            <td class="r td-num">
              <span :class="{ 'td-dash': !fund.排碳大戶總碳排量 }">
                {{ formatEmissions(fund.排碳大戶總碳排量) }}
              </span>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <p v-if="sortedRows.length === 0" class="empty-note">找不到符合條件的基金</p>

    <p class="esg-legend">
      <EsgLeaf /><span>：屬於國內發行之 ESG 基金</span>
    </p>
  </div>
</template>

<style scoped>
.fund-table {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

/* ── Filter bar ───────────────────────────────────────── */
.filter-bar {
  display: flex;
  gap: 12px;
  align-items: center;
  flex-wrap: wrap;
}

/* 搜尋框統一為設計稿的 .filter-sel 外觀，與 /companies 一致
   （覆蓋 Nuxt UI 預設的淺色 ring-accented / primary focus ring）*/
.filter-bar :deep(.filter-sel) {
  color: var(--color-text-primary);
  font-size: 13px;
  background-color: var(--color-bg-elevated);
  border-radius: 8px;
  box-shadow: inset 0 0 0 1px var(--color-bg-border);
  transition: box-shadow 0.15s;
}

.filter-bar :deep(.filter-sel:hover) {
  box-shadow: inset 0 0 0 1px var(--color-green-forest) !important;
}

.filter-bar :deep(.filter-sel:focus),
.filter-bar :deep(.filter-sel:focus-visible),
.filter-bar :deep(.filter-sel:focus-within) {
  box-shadow: inset 0 0 0 1px var(--color-green-pure) !important;
  outline: none;
}

.filter-bar :deep(.filter-sel::placeholder) {
  color: var(--color-text-muted);
}

.result-count {
  margin-left: auto;
  font-size: 13px;
  color: var(--color-text-secondary);
}

.result-count strong {
  color: var(--color-green-spring);
  font-family: 'IBM Plex Mono', monospace;
  font-weight: 500;
}

/* ── Table shell（沿用 ClimateScoreTable 版面）────────── */
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

.tbl.tbl-funds {
  min-width: 800px;
  table-layout: fixed;
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
  position: sticky;
  top: 0;
  z-index: 20;
}

.tbl-funds thead th {
  white-space: normal;
  line-height: 1.35;
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

.tbl-funds th:nth-child(1) { width: 92px; }
.tbl-funds th:nth-child(2) { width: 30%; }
.tbl-funds th:nth-child(3) { width: 11%; }
.tbl-funds th:nth-child(4) { width: 15%; }
.tbl-funds th:nth-child(5) { width: 11%; }
.tbl-funds th:nth-child(6) { width: 10%; }
.tbl-funds th:nth-child(7) { width: 13%; }

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
  padding: 10px 10px;
  vertical-align: middle;
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

/* ── 凍結左側欄位（手機橫向捲動時代號 / 基金名稱保持可見）── */
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
.col-sticky-2 { left: 92px; }

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

/* ── Cells ────────────────────────────────────────────── */
.td-code {
  font-family: 'IBM Plex Mono', monospace;
  font-size: 13px;
  color: var(--color-link);
}

.td-code:hover {
  color: var(--color-link-hover);
}

.td-fund {
  white-space: normal;
  word-break: break-word;
}

.td-fund-link {
  font-size: 13.5px;
  color: var(--color-text-primary);
  line-height: 1.5;
}

.td-fund-link:hover {
  color: var(--color-link-hover);
}

.td-num {
  font-family: 'IBM Plex Mono', monospace;
  font-size: 13.5px;
  color: var(--color-text-primary);
}

.td-dash {
  color: var(--color-text-muted);
}

.coal-tag {
  display: inline-block;
  min-width: 26px;
  padding: 1px 7px;
  border-radius: 4px;
  font-family: 'IBM Plex Mono', monospace;
  font-size: 12px;
  text-align: center;
}

.coal-tag.coal-bad {
  color: var(--color-status-bad);
  background: var(--color-bg-overlay);
}

.coal-tag.coal-warn {
  color: var(--color-status-warn);
  background: var(--color-bg-overlay);
}

.coal-tag.coal-some {
  color: var(--color-text-secondary);
  background: var(--color-bg-overlay);
}

.coal-tag.coal-none {
  color: var(--color-text-muted);
  background: transparent;
}

.empty-note {
  padding: 32px 0;
  text-align: center;
  font-size: 14px;
  color: var(--color-text-muted);
}

.esg-legend {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  color: var(--color-text-secondary);
}

/* ── 窄螢幕時收緊基金表 ──────────────────────────────── */
@media (max-width: 1100px) {
  .tbl-funds thead th {
    font-size: 11px;
    padding: 9px 7px;
  }

  .tbl-funds tbody td {
    padding: 9px 7px;
  }

  /* 窄螢幕收窄凍結的基金名稱欄，留空間捲動其他欄位 */
  .tbl-funds th:nth-child(2) { width: 160px; }

  .td-fund-link { font-size: 12.5px; }
  .td-num { font-size: 12.5px; }
  .td-code { font-size: 12px; }
}
</style>
