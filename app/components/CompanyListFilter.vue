<script setup lang="ts">
import regionList from '~/assets/data/region-list.json'
import industryList from '~/assets/data/industry-list.json'
import companyListData from '~/assets/data/company-list.json'
import type { CompanyData } from '~/types/company'

interface Filters {
  search: string
  region: string
  industry: string
}

interface Props {
  modelValue: Filters
  resultCount?: number
}

interface Emits {
  (e: 'update:modelValue', value: Filters): void
}

const props = withDefaults(defineProps<Props>(), {
  resultCount: 0,
})
const emit = defineEmits<Emits>()

const { setMode } = useViewMode()
const route = useRoute()

// Highlight follows the URL — the viewMode cookie can desync from the route
const isPro = computed(() => /\/pro\/?$/.test(route.path))

const patch = (part: Partial<Filters>) => {
  emit('update:modelValue', { ...props.modelValue, ...part })
}

const region = computed({
  get: () => props.modelValue.region,
  set: value => patch({ region: value }),
})

const industry = computed({
  get: () => props.modelValue.industry,
  set: value => patch({ industry: value }),
})

// Region options with ALL_REGIONS as default
const regionOptions = computed(() => [ALL_REGIONS, ...regionList])

const noCountyNames = computed(() =>
  (companyListData as CompanyData[])
    .filter(company => !company.factoryCounties?.length)
    .map(company => company['公司'])
)

// Industry options with "全部產業" as default
const industryOptions = computed(() => [
  '全部產業',
  ...industryList.map(item => item.industry),
])

// Version-switch links preserve current query params
const regularModeLink = computed(() => ({ path: '/companies', query: route.query }))
const proModeLink = computed(() => ({ path: '/companies/pro', query: route.query }))

const handleModeClick = (mode: 'regular' | 'pro') => {
  setMode(mode)
}

const clearFilters = () => {
  emit('update:modelValue', { search: '', region: '', industry: '' })
}

const selectUi = {
  base: 'filter-sel',
  content: 'bg-surface-warm border border-green-deep/40',
  item: 'text-earth-brown data-highlighted:bg-green-deep/30 data-highlighted:text-white',
}
</script>

<template>
  <div>
    <header class="co-header">
      <NuxtLink to="/" class="back-link">
        ← 回首頁
      </NuxtLink>
      <h1>排碳大戶觀測企業清單</h1>

      <div class="ver-switch">
        <NuxtLink
          :to="regularModeLink"
          class="ver-label"
          :class="{ on: !isPro }"
          @click="handleModeClick('regular')"
        >
          易讀版
        </NuxtLink>
        <NuxtLink
          :to="isPro ? regularModeLink : proModeLink"
          class="switch"
          role="switch"
          :aria-checked="isPro"
          aria-label="切換易讀版與專業版"
          @click="handleModeClick(isPro ? 'regular' : 'pro')"
        >
          <span class="knob" />
        </NuxtLink>
        <NuxtLink
          :to="proModeLink"
          class="ver-label"
          :class="{ on: isPro }"
          @click="handleModeClick('pro')"
        >
          專業版
        </NuxtLink>
      </div>
    </header>

    <div class="filter-bar">
      <div class="filter-group filter-group-search">
        <label class="filter-label" for="co-search">搜尋企業</label>
        <UInput
          id="co-search"
          :model-value="modelValue.search"
          icon="i-heroicons-magnifying-glass"
          placeholder="搜尋你關注的企業..."
          :ui="{ base: 'filter-sel', root: 'w-full' }"
          @update:model-value="patch({ search: $event })"
        />
      </div>

      <div class="filter-group">
        <label class="filter-label" for="co-region">指定縣市</label>
        <USelect
          id="co-region"
          v-model="region"
          :items="regionOptions"
          :placeholder="ALL_REGIONS"
          trailing-icon="i-heroicons-chevron-down"
          :ui="selectUi"
        />
      </div>

      <div class="filter-group">
        <label class="filter-label" for="co-industry">指定產業別</label>
        <USelect
          id="co-industry"
          v-model="industry"
          :items="industryOptions"
          placeholder="全部產業"
          trailing-icon="i-heroicons-chevron-down"
          :ui="selectUi"
        />
      </div>

      <UButton
        color="neutral"
        variant="ghost"
        class="filter-clear"
        @click="clearFilters"
      >
        清除所有篩選
      </UButton>

      <p class="result-count">
        顯示 <strong>{{ resultCount }}</strong> 家企業
      </p>

      <p v-if="noCountyNames.length" class="filter-note">
        {{ noCountyNames.join('、') }} 2024 年不在排碳大戶名單，無廠區縣市資料，不會出現在縣市篩選結果中。
      </p>
    </div>
  </div>
</template>

<style scoped>
/* ── co-header ────────────────────────────────────────── */
.co-header {
  padding-bottom: 24px;
}

.back-link {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  color: var(--color-text-secondary);
  margin-bottom: 14px;
  transition: color 0.15s;
}

.back-link:hover {
  color: var(--color-green-spring);
}

.co-header h1 {
  font-size: 24px;
  font-weight: 700;
  color: var(--color-text-primary);
  letter-spacing: -0.015em;
  margin-bottom: 18px;
}

/* ── version switch ──────────────────────────────────── */
.ver-switch {
  display: inline-flex;
  align-items: center;
  gap: 12px;
}

.ver-label {
  font-size: 13px;
  font-weight: 500;
  color: var(--color-text-muted);
  cursor: pointer;
  user-select: none;
  transition: color 0.15s;
}

.ver-label:hover {
  color: var(--color-text-secondary);
}

.ver-label.on {
  color: var(--color-text-primary);
}

.switch {
  position: relative;
  display: inline-flex;
  align-items: center;
  width: 46px;
  height: 24px;
  padding: 2px;
  border: 1px solid var(--color-bg-border);
  border-radius: 12px;
  background: var(--color-bg-overlay);
  cursor: pointer;
  transition: background 0.15s;
  flex-shrink: 0;
}

.switch:focus-visible {
  outline: 2px solid var(--color-green-pure);
  outline-offset: 2px;
}

.knob {
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: var(--color-text-secondary);
  transition: transform 0.18s, background 0.18s;
}

.switch[aria-checked='true'] {
  background: var(--color-green-forest);
}

.switch[aria-checked='true'] .knob {
  transform: translateX(22px);
  background: var(--color-green-mint);
}

/* ── filter bar ──────────────────────────────────────── */
.filter-bar {
  display: flex;
  gap: 12px;
  align-items: flex-end;
  flex-wrap: wrap;
  padding-bottom: 20px;
}

.filter-group {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.filter-group-search {
  min-width: 15rem;
  flex: 1 1 18rem;
  max-width: 22rem;
}

.filter-label {
  font-size: 11px;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--color-text-muted);
}

/* 搜尋框與下拉選單統一為設計稿的 .filter-sel 外觀
   （覆蓋 Nuxt UI 預設的淺色 ring-accented / primary focus ring）*/
.filter-bar :deep(.filter-sel) {
  min-width: 9.5rem;
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

.filter-bar :deep(.filter-clear) {
  color: var(--color-text-muted);
  border: 1px solid var(--color-bg-border);
  border-radius: 8px;
  font-size: 13px;
  padding: 8px 14px;
  transition: color 0.15s, border-color 0.15s;
}

.filter-bar :deep(.filter-clear:hover) {
  color: var(--color-green-spring);
  border-color: var(--color-green-forest);
  background: transparent;
}

.filter-note {
  flex: 0 0 100%;
  font-size: 12px;
  color: var(--color-text-muted);
}

.result-count {
  margin-left: auto;
  align-self: flex-end;
  font-size: 13px;
  color: var(--color-text-secondary);
}

.result-count strong {
  color: var(--color-green-spring);
  font-family: 'IBM Plex Mono', 'Cascadia Code', monospace;
  font-weight: 500;
}

@media (max-width: 640px) {
  .filter-group,
  .filter-group-search {
    flex: 1 1 100%;
    max-width: none;
  }

  .result-count {
    margin-left: 0;
  }
}
</style>
