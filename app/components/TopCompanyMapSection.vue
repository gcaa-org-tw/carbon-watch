<script setup lang="ts">
import topCompanyData from '~/assets/data/top-company-region-emissions.json'

interface FactoryEmission {
  名稱: string
  範疇一: number
  範疇二: number
  總排放: number
  經度?: number
  緯度?: number
}

interface CompanyRegionEmission {
  公司全名: string
  公司: string
  全台排放量: number
  全台佔比: number
  縣市排放: Record<string, number>
  排放縣市: string[]
  縣市工廠: Record<string, FactoryEmission[]>
}

const companies = topCompanyData as unknown as CompanyRegionEmission[]

const ROTATION_INTERVAL_MS = 3500
const TOOLTIP_OFFSET = 14
const TOOLTIP_MAX_WIDTH = 480
const TOOLTIP_MAX_HEIGHT = 340

const selectedIndex = ref<number>(0)
let timer: ReturnType<typeof setInterval> | null = null
let leaveTimer: ReturnType<typeof setTimeout> | null = null

const hoveredCounty = ref<string | null>(null)
const pinnedCounty = ref<string | null>(null)
const mousePos = ref<{ x: number; y: number }>({ x: 0, y: 0 })
const pinnedPos = ref<{ x: number; y: number }>({ x: 0, y: 0 })
const autoplayStopped = ref(false)

const activeCounty = computed(() => hoveredCounty.value ?? pinnedCounty.value)

const highlightedCounties = computed(() => companies[selectedIndex.value]?.排放縣市 ?? [])
const selectedShare = computed(() => companies[selectedIndex.value]?.全台佔比.toFixed(1) + '%')

const selectedCompany = computed(() => companies[selectedIndex.value])

// 選中公司的廠區點位（缺座標的廠在 transform 端已警告，這裡直接略過）。
// 同址分期廠（如台積電十八廠一～六期）座標相同，去重後一址一點，
// 也讓 TaiwanMap 內以座標為 key 的 d3 data join 保持 key 唯一
const factoryMarkers = computed(() => {
  const company = selectedCompany.value
  if (!company) return []
  const seen = new Set<string>()
  return Object.values(company.縣市工廠)
    .flat()
    .filter((f): f is FactoryEmission & { 經度: number; 緯度: number } =>
      f.經度 !== undefined && f.緯度 !== undefined)
    .filter((f) => {
      const key = `${f.經度},${f.緯度}`
      if (seen.has(key)) return false
      seen.add(key)
      return true
    })
    .map(f => ({ 經度: f.經度, 緯度: f.緯度 }))
})

const tooltipFactories = computed<FactoryEmission[] | null>(() => {
  if (!activeCounty.value) return null
  const list = selectedCompany.value?.縣市工廠?.[activeCounty.value]
  return list && list.length > 0 ? list : null
})

interface TooltipTotals { 範疇一: number; 範疇二: number; 總排放: number }
interface TooltipCollapsed extends TooltipTotals { count: number }
interface TooltipDisplay {
  rows: FactoryEmission[]
  collapsed: TooltipCollapsed | null
  factoryCount: number
  total: TooltipTotals
}

const tooltipDisplay = computed<TooltipDisplay | null>(() => {
  const factories = tooltipFactories.value
  if (!factories) return null
  const total = factories.reduce<TooltipTotals>(
    (s, f) => ({
      範疇一: s.範疇一 + f.範疇一,
      範疇二: s.範疇二 + f.範疇二,
      總排放: s.總排放 + f.總排放,
    }),
    { 範疇一: 0, 範疇二: 0, 總排放: 0 },
  )
  if (factories.length <= 6) {
    return { rows: factories, collapsed: null, factoryCount: factories.length, total }
  }
  const top5 = factories.slice(0, 5)
  const rest = factories.slice(5)
  const collapsed = rest.reduce<TooltipCollapsed>(
    (s, f) => ({
      範疇一: s.範疇一 + f.範疇一,
      範疇二: s.範疇二 + f.範疇二,
      總排放: s.總排放 + f.總排放,
      count: s.count + 1,
    }),
    { 範疇一: 0, 範疇二: 0, 總排放: 0, count: 0 },
  )
  return { rows: top5, collapsed, factoryCount: factories.length, total }
})

const clampToViewport = (pos: { x: number; y: number }) => {
  let x = pos.x + TOOLTIP_OFFSET
  let y = pos.y + TOOLTIP_OFFSET
  if (typeof window !== 'undefined') {
    if (x + TOOLTIP_MAX_WIDTH > window.innerWidth) {
      x = Math.max(8, pos.x - TOOLTIP_MAX_WIDTH - TOOLTIP_OFFSET)
    }
    if (y + TOOLTIP_MAX_HEIGHT > window.innerHeight) {
      y = Math.max(8, pos.y - TOOLTIP_MAX_HEIGHT - TOOLTIP_OFFSET)
    }
  }
  return { x, y }
}

const tooltipStyle = computed(() => {
  const { x, y } = hoveredCounty.value ? clampToViewport(mousePos.value) : pinnedPos.value
  return { left: `${x}px`, top: `${y}px` }
})

const formatTonnes = (n: number) => n.toLocaleString('en-US')

const startRotation = () => {
  if (autoplayStopped.value) return
  if (timer) clearInterval(timer)
  timer = setInterval(() => {
    selectedIndex.value = (selectedIndex.value + 1) % companies.length
  }, ROTATION_INTERVAL_MS)
}

const pauseRotation = () => {
  if (timer) {
    clearInterval(timer)
    timer = null
  }
}

const stopAutoplay = () => {
  autoplayStopped.value = true
  pauseRotation()
}

const toggleAutoplay = () => {
  if (!autoplayStopped.value) {
    stopAutoplay()
    return
  }
  autoplayStopped.value = false
  pinnedCounty.value = null
  startRotation()
}

const handleCardClick = (index: number) => {
  selectedIndex.value = index
  pinnedCounty.value = null
  stopAutoplay()
}

const handleRegionClick = (county: string, clientX: number, clientY: number) => {
  if (pinnedCounty.value === county) {
    pinnedCounty.value = null
    return
  }
  pinnedCounty.value = county
  const { x, y } = clampToViewport({ x: clientX, y: clientY })
  pinnedPos.value = { x: x + window.scrollX, y: y + window.scrollY }
  stopAutoplay()
}

const handleRegionHover = (county: string, clientX: number, clientY: number) => {
  if (leaveTimer) {
    clearTimeout(leaveTimer)
    leaveTimer = null
  }
  hoveredCounty.value = county
  mousePos.value = { x: clientX, y: clientY }
  pauseRotation()
}

const handleRegionLeave = (county: string) => {
  if (leaveTimer) clearTimeout(leaveTimer)
  leaveTimer = setTimeout(() => {
    if (hoveredCounty.value === county) {
      hoveredCounty.value = null
      startRotation()
    }
  }, 80)
}

onMounted(() => startRotation())
onUnmounted(() => {
  if (timer) clearInterval(timer)
  if (leaveTimer) clearTimeout(leaveTimer)
})
</script>

<template>
  <section class="top-map-section">
    <div class="section-head">
      <h2>前十大排碳大戶縣市分布</h2>
    </div>
    <div class="hint-row">
      <p class="hint-note">點選企業查看其廠區的縣市分布，再點選縣市查看各廠排放</p>
      <UButton
        :icon="autoplayStopped ? 'i-heroicons-play-20-solid' : 'i-heroicons-pause-20-solid'"
        :aria-label="autoplayStopped ? '繼續輪播' : '暫停輪播'"
        color="neutral"
        variant="ghost"
        size="sm"
        class="rotation-toggle"
        @click="toggleAutoplay"
      />
    </div>

    <!-- Desktop layout -->
    <div class="map-layout hidden md:grid">
      <div class="co-list">
        <TopCompanyCard
          v-for="(company, i) in companies"
          :key="company.公司全名"
          :rank="i + 1"
          :公司全名="company.公司全名"
          :全台排放量="company.全台排放量"
          :全台佔比="company.全台佔比"
          :is-active="selectedIndex === i"
          @click="handleCardClick(i)"
        />
      </div>
      <div class="map-container">
        <div class="dist-figure">{{ selectedShare }}</div>
        <div class="dist-label">佔全台製造業排放</div>
        <TaiwanMap
          class="!bg-transparent"
          :highlighted-regions="highlightedCounties"
          :markers="factoryMarkers"
          :hover-highlight="false"
          :allow-zoom="false"
          @region-hover="handleRegionHover"
          @region-leave="handleRegionLeave"
          @region-click="handleRegionClick"
        />
      </div>
    </div>

    <!-- Mobile layout -->
    <div class="md:hidden flex flex-col gap-4">
      <div class="map-container" style="height: 320px;">
        <div class="dist-figure dist-figure--sm">{{ selectedShare }}</div>
        <div class="dist-label dist-label--sm">佔全台製造業排放</div>
        <TaiwanMap
          class="!bg-transparent"
          :highlighted-regions="highlightedCounties"
          :markers="factoryMarkers"
          :hover-highlight="false"
          :allow-zoom="false"
          @region-hover="handleRegionHover"
          @region-leave="handleRegionLeave"
          @region-click="handleRegionClick"
        />
      </div>
      <div class="co-list mobile-co-list">
        <TopCompanyCard
          v-for="(company, i) in companies"
          :key="company.公司全名"
          :rank="i + 1"
          :公司全名="company.公司全名"
          :全台排放量="company.全台排放量"
          :全台佔比="company.全台佔比"
          :is-active="selectedIndex === i"
          @click="handleCardClick(i)"
        />
      </div>
    </div>

    <Teleport to="body">
      <div
        v-if="tooltipDisplay && selectedCompany && activeCounty"
        class="z-50 pointer-events-none bg-surface-warm text-earth-brown border border-earth-brown/30 rounded-lg shadow-xl"
        :class="hoveredCounty ? 'fixed' : 'absolute'"
        :style="{ ...tooltipStyle, maxWidth: `${TOOLTIP_MAX_WIDTH}px` }"
      >
        <div class="px-3 py-2 bg-surface-mint border-b border-earth-brown/20 rounded-t-lg">
          <div class="font-semibold text-green-mint text-sm whitespace-nowrap">
            {{ selectedCompany.公司 }} · {{ activeCounty }}
          </div>
          <div class="text-xs text-earth-brown mt-0.5 whitespace-nowrap">
            {{ tooltipDisplay.factoryCount }} 廠 · 合計 {{ formatTonnes(tooltipDisplay.total.總排放) }} 公噸 CO₂e
          </div>
        </div>
        <table class="w-full text-xs">
          <thead>
            <tr class="text-earth-brown bg-surface-mint">
              <th class="text-left px-3 py-1 font-normal">廠區</th>
              <th class="text-right px-2 py-1 font-normal">範疇一</th>
              <th class="text-right px-2 py-1 font-normal">範疇二</th>
              <th class="text-right px-3 py-1 font-normal">總排放</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="(f, i) in tooltipDisplay.rows"
              :key="i"
              class="border-t border-earth-brown/15"
            >
              <td class="px-3 py-1 whitespace-nowrap">{{ f.名稱 }}</td>
              <td class="px-2 py-1 text-right tabular-nums whitespace-nowrap">{{ formatTonnes(f.範疇一) }}</td>
              <td class="px-2 py-1 text-right tabular-nums whitespace-nowrap">{{ formatTonnes(f.範疇二) }}</td>
              <td class="px-3 py-1 text-right tabular-nums whitespace-nowrap font-medium">{{ formatTonnes(f.總排放) }}</td>
            </tr>
            <tr
              v-if="tooltipDisplay.collapsed"
              class="border-t border-earth-brown/20 text-earth-brown/70 italic"
            >
              <td class="px-3 py-1 whitespace-nowrap">其他 {{ tooltipDisplay.collapsed.count }} 廠 合計</td>
              <td class="px-2 py-1 text-right tabular-nums whitespace-nowrap">{{ formatTonnes(tooltipDisplay.collapsed.範疇一) }}</td>
              <td class="px-2 py-1 text-right tabular-nums whitespace-nowrap">{{ formatTonnes(tooltipDisplay.collapsed.範疇二) }}</td>
              <td class="px-3 py-1 text-right tabular-nums whitespace-nowrap font-medium">{{ formatTonnes(tooltipDisplay.collapsed.總排放) }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </Teleport>
  </section>
</template>

<style scoped>
.top-map-section {
  padding: 56px 64px;
}

.section-head {
  margin-bottom: 22px;
}

.section-head h2 {
  font-size: 22px;
  font-weight: 700;
  color: var(--color-text-primary);
  letter-spacing: -0.015em;
}

.hint-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 18px;
}

.hint-note {
  font-size: 13px;
  color: var(--color-text-secondary);
}

.hint-row :deep(.rotation-toggle) {
  flex-shrink: 0;
  color: var(--color-text-muted);
  border: 1px solid var(--color-bg-border);
  border-radius: 8px;
  transition: color 0.15s, border-color 0.15s;
}

.hint-row :deep(.rotation-toggle:hover) {
  color: var(--color-green-spring);
  border-color: var(--color-green-forest);
  background: transparent;
}

.map-layout {
  grid-template-columns: 360px 1fr;
  border: 1px solid var(--color-bg-border);
  border-radius: 12px;
  overflow: hidden;
}

.co-list {
  border-right: 1px solid var(--color-bg-border);
  overflow-y: auto;
  max-height: 720px;
  background: var(--color-bg-surface);
}

.mobile-co-list {
  border-right: none;
  border: 1px solid var(--color-bg-border);
  border-radius: 12px;
  max-height: 340px;
}

.map-container {
  background: var(--color-bg-surface);
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 12px;
}

.dist-figure {
  position: absolute;
  top: 20px;
  left: 24px;
  z-index: 5;
  font-family: 'IBM Plex Mono', monospace;
  font-size: 44px;
  font-weight: 500;
  color: var(--color-pin);
  line-height: 1;
}

.dist-label {
  position: absolute;
  top: 70px;
  left: 24px;
  z-index: 5;
  font-size: 12px;
  color: var(--color-text-muted);
}

.dist-figure--sm {
  font-size: 32px;
  top: 12px;
  left: 14px;
}

.dist-label--sm {
  top: 50px;
  left: 14px;
}

@media (max-width: 900px) {
  .top-map-section {
    padding: 40px 24px;
  }
}
</style>
