<script setup lang="ts">
import topCompanyData from '~/assets/data/top-company-region-emissions.json'

interface FactoryEmission {
  名稱: string
  範疇一: number
  範疇二: number
  總排放: number
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
const mousePos = ref<{ x: number; y: number }>({ x: 0, y: 0 })

const highlightedCounties = computed(() => companies[selectedIndex.value]?.排放縣市 ?? [])

const leftCards = computed(() => companies.slice(0, 5))
const rightCards = computed(() => companies.slice(5, 10))

const carouselRef = ref<HTMLDivElement | null>(null)

const selectedCompany = computed(() => companies[selectedIndex.value])

const tooltipFactories = computed<FactoryEmission[] | null>(() => {
  if (!hoveredCounty.value) return null
  const list = selectedCompany.value?.縣市工廠?.[hoveredCounty.value]
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

const tooltipStyle = computed(() => {
  let x = mousePos.value.x + TOOLTIP_OFFSET
  let y = mousePos.value.y + TOOLTIP_OFFSET
  if (typeof window !== 'undefined') {
    if (x + TOOLTIP_MAX_WIDTH > window.innerWidth) {
      x = Math.max(8, mousePos.value.x - TOOLTIP_MAX_WIDTH - TOOLTIP_OFFSET)
    }
    if (y + TOOLTIP_MAX_HEIGHT > window.innerHeight) {
      y = Math.max(8, mousePos.value.y - TOOLTIP_MAX_HEIGHT - TOOLTIP_OFFSET)
    }
  }
  return { left: `${x}px`, top: `${y}px` }
})

const formatTonnes = (n: number) => n.toLocaleString('en-US')

const scrollCarouselToIndex = (index: number) => {
  const container = carouselRef.value
  if (!container || container.offsetParent === null) return
  // card width 180px + gap 12px (gap-3)
  const CARD_WIDTH = 180
  const GAP = 12
  const cardCenter = index * (CARD_WIDTH + GAP) + CARD_WIDTH / 2
  container.scrollTo({ left: cardCenter - container.clientWidth / 2, behavior: 'smooth' })
}

const startRotation = () => {
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

const handleCardClick = (index: number) => {
  selectedIndex.value = index
  startRotation()
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

watch(selectedIndex, (index) => {
  nextTick(() => scrollCarouselToIndex(index))
})

onMounted(() => startRotation())
onUnmounted(() => {
  if (timer) clearInterval(timer)
  if (leaveTimer) clearTimeout(leaveTimer)
})
</script>

<template>
  <section class="py-12 bg-surface-mint">
    <ContentContainer>
      <h2 class="text-4xl font-bold text-green-mint mb-8 text-center">
        前十大碳排企業縣市分布
      </h2>

      <!-- Desktop / Tablet layout (lg+) -->
      <div class="hidden lg:grid gap-4 items-center" style="grid-template-columns: 1fr 2fr 1fr;">
        <!-- Left: companies 1–5 -->
        <div class="flex flex-col gap-3">
          <TopCompanyCard
            v-for="(company, i) in leftCards"
            :key="company.公司全名"
            :公司全名="company.公司全名"
            :全台排放量="company.全台排放量"
            :全台佔比="company.全台佔比"
            :is-active="selectedIndex === i"
            @click="handleCardClick(i)"
          />
        </div>

        <!-- Center: Taiwan map -->
        <div class="h-[580px]">
          <TaiwanMap
            class="!bg-transparent"
            :highlighted-regions="highlightedCounties"
            :allow-zoom="false"
            @region-hover="handleRegionHover"
            @region-leave="handleRegionLeave"
          />
        </div>

        <!-- Right: companies 6–10 -->
        <div class="flex flex-col gap-3">
          <TopCompanyCard
            v-for="(company, i) in rightCards"
            :key="company.公司全名"
            :公司全名="company.公司全名"
            :全台排放量="company.全台排放量"
            :全台佔比="company.全台佔比"
            :is-active="selectedIndex === i + 5"
            @click="handleCardClick(i + 5)"
          />
        </div>
      </div>

      <!-- Mobile layout (< lg) -->
      <div class="lg:hidden flex flex-col gap-6">
        <!-- Map -->
        <div class="h-[320px]">
          <TaiwanMap
            class="!bg-transparent"
            :highlighted-regions="highlightedCounties"
            :allow-zoom="false"
            @region-hover="handleRegionHover"
            @region-leave="handleRegionLeave"
          />
        </div>

        <!-- Scrollable cards -->
        <div ref="carouselRef" class="flex gap-3 overflow-x-auto pb-3 snap-x snap-mandatory">
          <TopCompanyCard
            v-for="(company, i) in companies"
            :key="company.公司全名"
            compact
            :公司全名="company.公司全名"
            :全台排放量="company.全台排放量"
            :全台佔比="company.全台佔比"
            :is-active="selectedIndex === i"
            @click="handleCardClick(i)"
          />
        </div>
      </div>
    </ContentContainer>

    <Teleport to="body">
      <div
        v-if="tooltipDisplay && selectedCompany && hoveredCounty"
        class="fixed z-50 pointer-events-none bg-white border border-gray-300 rounded-lg shadow-xl"
        :style="{ ...tooltipStyle, maxWidth: `${TOOLTIP_MAX_WIDTH}px` }"
      >
        <div class="px-3 py-2 bg-surface-mint border-b border-gray-200 rounded-t-lg">
          <div class="font-semibold text-green-mint text-sm whitespace-nowrap">
            {{ selectedCompany.公司 }} · {{ hoveredCounty }}
          </div>
          <div class="text-xs text-gray-600 mt-0.5 whitespace-nowrap">
            {{ tooltipDisplay.factoryCount }} 廠 · 合計 {{ formatTonnes(tooltipDisplay.total.總排放) }} 公噸 CO2e
          </div>
        </div>
        <table class="w-full text-xs">
          <thead>
            <tr class="text-gray-500 bg-gray-50">
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
              class="border-t border-gray-100"
            >
              <td class="px-3 py-1 whitespace-nowrap">{{ f.名稱 }}</td>
              <td class="px-2 py-1 text-right tabular-nums whitespace-nowrap">{{ formatTonnes(f.範疇一) }}</td>
              <td class="px-2 py-1 text-right tabular-nums whitespace-nowrap">{{ formatTonnes(f.範疇二) }}</td>
              <td class="px-3 py-1 text-right tabular-nums whitespace-nowrap font-medium">{{ formatTonnes(f.總排放) }}</td>
            </tr>
            <tr
              v-if="tooltipDisplay.collapsed"
              class="border-t border-gray-200 text-gray-600 italic"
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
@media (max-width: 767px) {
  h2 {
    font-size: 1.75rem;
    margin-bottom: 2rem;
  }
}
</style>
