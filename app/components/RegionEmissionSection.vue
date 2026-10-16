<script setup lang="ts">
import { ref, computed, onMounted, nextTick } from 'vue'
import regionEmissionList from '~/assets/data/region-emission-list.json'

interface RegionEmission {
  縣市: string
  總排放量: number
  總排放量佔比: number
  企業數: number
}

const regions = regionEmissionList as RegionEmission[]

const activeCardIndex = ref(0)
const highlightedRegion = ref<string | null>(null)
const selectedRegion = ref<string | null>(null)
const carouselRef = ref<HTMLDivElement | null>(null)
const cardsContainerRef = ref<HTMLDivElement | null>(null)
const isPhone = ref(false)
const blinkingRegion = ref<string | null>(null)
const mapLoaded = ref(false)
const hoveredRegion = ref<string | null>(null)
const hoverPos = ref({ x: 0, y: 0 })

const regionSlugMap: Record<string, string> = {
  '台北市': 'taipei',
  '新北市': 'new_taipei',
  '桃園市': 'taoyuan',
  '台中市': 'taichung',
  '台南市': 'tainan',
  '高雄市': 'kaohsiung',
  '基隆市': 'keelung_city',
  '新竹市': 'hsinchu_city',
  '嘉義市': 'chiayi_city',
  '新竹縣': 'hsinchu_county',
  '苗栗縣': 'miaoli',
  '彰化縣': 'changhua',
  '南投縣': 'nantou',
  '雲林縣': 'yunlin',
  '嘉義縣': 'chiayi_county',
  '屏東縣': 'pingtung',
  '宜蘭縣': 'yilan',
  '花蓮縣': 'hualien',
  '台東縣': 'taitung',
  '澎湖縣': 'penghu',
  '金門縣': 'kinmen',
  '連江縣': 'matsu',
}

const ALL_COUNTIES = Object.keys(regionSlugMap)

const localNetZeroUrl = computed(() => {
  if (!selectedRegion.value) return ''
  const slug = regionSlugMap[selectedRegion.value]
  return slug ? `https://localnetzero.gcaa.org.tw/r/${slug}` : ''
})

const companiesUrl = computed(() =>
  selectedRegion.value ? `/companies?region=${encodeURIComponent(selectedRegion.value)}` : ''
)

const validRegionNames = computed(() => regions.map(r => r.縣市))
const maxBars = computed(() => Math.max(...regions.map(r => r.總排放量佔比)))

const regionDataMap = Object.fromEntries(regions.map(r => [r.縣市, r]))

const mergedRegions = computed(() => {
  const withData = regions.map(r => ({ ...r, disabled: false }))
  const withoutData = ALL_COUNTIES
    .filter(name => !regionDataMap[name])
    .map(name => ({ 縣市: name, 總排放量: 0, 總排放量佔比: 0, 企業數: 0, disabled: true }))
  return [...withData, ...withoutData]
})

onMounted(() => {
  const checkViewport = () => {
    isPhone.value = window.innerWidth < 768
  }

  checkViewport()
  window.addEventListener('resize', checkViewport)

  const handleWheel = (e: WheelEvent) => {
    if (!cardsContainerRef.value) return
    const container = cardsContainerRef.value
    const isScrollingDown = e.deltaY > 0
    const isAtTop = container.scrollTop === 0
    const isAtBottom = container.scrollTop + container.clientHeight >= container.scrollHeight - 1
    if ((isScrollingDown && !isAtBottom) || (!isScrollingDown && !isAtTop)) {
      e.stopPropagation()
    }
  }

  cardsContainerRef.value?.addEventListener('wheel', handleWheel, { passive: false })

  return () => {
    window.removeEventListener('resize', checkViewport)
    cardsContainerRef.value?.removeEventListener('wheel', handleWheel)
  }
})

const hasMobileFocus = ref(false)

const focusedRegion = computed(() => {
  if (isPhone.value && hasMobileFocus.value && activeCardIndex.value >= 0) {
    return mergedRegions.value[activeCardIndex.value]?.縣市 || null
  }
  return null
})

const handleScroll = () => {
  if (!carouselRef.value || !isPhone.value) return
  const scrollLeft = carouselRef.value.scrollLeft
  const cardWidth = window.innerWidth * 0.7 + 16
  const newIndex = Math.round(scrollLeft / cardWidth)
  if (newIndex !== activeCardIndex.value) {
    hasMobileFocus.value = true
    activeCardIndex.value = newIndex
    // Keep the region actions in sync once the user has engaged with the map.
    if (selectedRegion.value) {
      selectedRegion.value = mergedRegions.value[newIndex]?.縣市 ?? null
    }
  }
}

// Mobile: surface the region actions + focus that county on the map and the
// carousel (mirrors the desktop click behaviour instead of navigating away).
const selectRegionOnMobile = async (regionName: string) => {
  selectedRegion.value = regionName
  const mergedIndex = mergedRegions.value.findIndex(r => r.縣市 === regionName)
  if (mergedIndex === -1) return
  hasMobileFocus.value = true
  activeCardIndex.value = mergedIndex
  await nextTick()
  const cardWidth = window.innerWidth * 0.7 + 16
  carouselRef.value?.scrollTo({ left: mergedIndex * cardWidth })
}

const handleCardClick = (region: string) => {
  if (isPhone.value) {
    selectRegionOnMobile(region)
    return
  }
  selectedRegion.value = region
  highlightedRegion.value = region
}

const handleMapClick = async (regionName: string) => {
  if (isPhone.value) {
    await selectRegionOnMobile(regionName)
    return
  }

  selectedRegion.value = regionName
  highlightedRegion.value = regionName

  const regionIndex = regions.findIndex(r => r.縣市 === regionName)
  if (regionIndex === -1) return

  blinkingRegion.value = regionName

  const cardElement = document.querySelector(`[data-region-index="${regionIndex}"]`) as HTMLElement | null
  const container = cardsContainerRef.value
  if (cardElement && container) {
    const containerRect = container.getBoundingClientRect()
    const cardRect = cardElement.getBoundingClientRect()
    const scrollTop = cardElement.offsetTop - container.offsetTop - (containerRect.height / 2) + (cardRect.height / 2)
    container.scrollTo({ top: Math.max(0, scrollTop), behavior: 'smooth' })
  }

  setTimeout(() => { blinkingRegion.value = null }, 3000)
}

const handleCardHover = (regionName: string | null) => {
  if (!isPhone.value) {
    highlightedRegion.value = regionName
  }
}

const scrollCardIntoView = (regionName: string) => {
  const index = mergedRegions.value.findIndex(r => r.縣市 === regionName)
  const cardElement = document.querySelector(`[data-region-index="${index}"]`) as HTMLElement | null
  const container = cardsContainerRef.value
  if (!cardElement || !container) return
  const top = cardElement.offsetTop - container.offsetTop
  const bottom = top + cardElement.offsetHeight
  if (top >= container.scrollTop && bottom <= container.scrollTop + container.clientHeight) return
  const scrollTop = top - (container.clientHeight / 2) + (cardElement.offsetHeight / 2)
  container.scrollTo({ top: Math.max(0, scrollTop), behavior: 'smooth' })
}

const handleMapHover = (regionName: string, clientX: number, clientY: number) => {
  if (isPhone.value) return
  hoverPos.value = { x: clientX, y: clientY }
  if (hoveredRegion.value === regionName) return
  hoveredRegion.value = regionName
  scrollCardIntoView(regionName)
}

const handleMapLeave = () => {
  hoveredRegion.value = null
}

const hoverShare = computed(() => {
  if (!hoveredRegion.value) return ''
  const p = regionDataMap[hoveredRegion.value]?.總排放量佔比 ?? 0
  if (p <= 0) return '無製造業排碳大戶'
  return `佔全台製造業排放 ${p < 0.1 ? '<0.1' : p.toFixed(1)}%`
})

const handleMapLoaded = () => {
  mapLoaded.value = true
  if (isPhone.value && carouselRef.value) {
    carouselRef.value.scrollLeft = 0
  }
}

const showMobileCarousel = computed(() => isPhone.value && mapLoaded.value)

const heatItems = [
  { label: '≥ 20%',           color: 'var(--color-heat-6)' },
  { label: '10–20%',          color: 'var(--color-heat-5)' },
  { label: '5–10%',           color: 'var(--color-heat-4)' },
  { label: '2–5%',            color: 'var(--color-heat-3)' },
  { label: '0.5–2%',          color: 'var(--color-heat-2)' },
  { label: '< 0.5%',          color: 'var(--color-heat-1)' },
  { label: '無製造業排碳大戶', color: 'var(--color-heat-0)' },
]
</script>

<template>
  <section class="region-section">
    <div class="section-head">
      <h2>各縣市排碳大戶排放量</h2>
    </div>

    <!-- Desktop layout -->
    <div v-if="!isPhone" class="map-layout">
      <div ref="cardsContainerRef" class="region-list">
        <div
          v-for="(region, index) in mergedRegions"
          :key="region.縣市"
          :data-region-index="index"
          v-bind="region.disabled ? {} : {
            onClick: () => handleCardClick(region.縣市),
            onMouseenter: () => handleCardHover(region.縣市),
            onMouseleave: () => handleCardHover(null),
          }"
        >
          <RegionEmissionCard
            :縣市="region.縣市"
            :總排放量="region.總排放量"
            :總排放量佔比="region.總排放量佔比"
            :企業數="region.企業數"
            :max-bars="maxBars"
            :is-active="(hoveredRegion ?? highlightedRegion) === region.縣市"
            :should-blink="blinkingRegion === region.縣市"
            :disabled="region.disabled"
          />
        </div>
      </div>
      <div class="map-container">
        <div v-if="selectedRegion" class="region-actions">
          <div class="rname">{{ selectedRegion }}</div>
          <NuxtLink :to="companiesUrl" class="btn-act">
            排碳大戶氣候績效表現
          </NuxtLink>
          <a
            v-if="localNetZeroUrl"
            :href="localNetZeroUrl"
            target="_blank"
            rel="noopener noreferrer"
            class="btn-act"
          >
            地方淨零觀測站<UIcon name="i-heroicons-arrow-top-right-on-square-20-solid" class="ext" aria-hidden="true" />
          </a>
        </div>
        <TaiwanMap
          :highlighted-region="highlightedRegion"
          :allow-zoom="false"
          :valid-regions="validRegionNames"
          @region-click="handleMapClick"
          @region-hover="handleMapHover"
          @region-leave="handleMapLeave"
          @map-loaded="handleMapLoaded"
        />
      </div>
    </div>

    <!-- Mobile layout -->
    <div v-else class="flex flex-col gap-4" style="height: calc(80vh - 6rem);">
      <div class="mobile-map" :class="showMobileCarousel ? 'flex-1 min-h-0' : 'flex-1'">
        <div v-if="selectedRegion" class="region-actions">
          <div class="rname">{{ selectedRegion }}</div>
          <NuxtLink :to="companiesUrl" class="btn-act">
            排碳大戶氣候績效表現
          </NuxtLink>
          <a
            v-if="localNetZeroUrl"
            :href="localNetZeroUrl"
            target="_blank"
            rel="noopener noreferrer"
            class="btn-act"
          >
            地方淨零觀測站<UIcon name="i-heroicons-arrow-top-right-on-square-20-solid" class="ext" aria-hidden="true" />
          </a>
        </div>
        <TaiwanMap
          :focused-region="focusedRegion"
          :allow-zoom="true"
          :valid-regions="validRegionNames"
          @region-click="handleMapClick"
          @map-loaded="handleMapLoaded"
        />
      </div>
      <div
        v-show="showMobileCarousel"
        ref="carouselRef"
        class="flex-shrink-0 flex gap-4 overflow-x-auto snap-x snap-mandatory scroll-smooth pb-4 pt-2"
        style="-webkit-overflow-scrolling: touch;"
        @scroll="handleScroll"
      >
        <div
          v-for="(region, index) in mergedRegions"
          :key="region.縣市"
          :data-region-index="index"
          class="flex-none snap-start"
          style="flex: 0 0 70vw;"
          v-bind="region.disabled ? {} : { onClick: () => handleCardClick(region.縣市) }"
        >
          <RegionEmissionCard
            :縣市="region.縣市"
            :總排放量="region.總排放量"
            :總排放量佔比="region.總排放量佔比"
            :企業數="region.企業數"
            :max-bars="maxBars"
            :is-active="index === activeCardIndex"
            :disabled="region.disabled"
          />
        </div>
      </div>
    </div>

    <!-- Heat legend — 放在地圖下方 -->
    <div class="heat-legend">
      <span class="heat-label">佔全台製造業排放</span>
      <div v-for="item in heatItems" :key="item.label" class="heat-item">
        <span class="heat-chip" :style="{ background: item.color }" />
        {{ item.label }}
      </div>
    </div>
    <p class="map-note">地圖未繪出金門縣、連江縣，兩縣皆無製造業排碳大戶。</p>

    <Teleport to="body">
      <div
        v-if="hoveredRegion"
        class="fixed z-50 pointer-events-none bg-surface-warm text-earth-brown border border-earth-brown/30 rounded-lg shadow-xl px-3 py-2"
        :style="{ left: `${hoverPos.x + 14}px`, top: `${hoverPos.y + 14}px` }"
      >
        <div class="font-semibold text-green-mint text-sm whitespace-nowrap">{{ hoveredRegion }}</div>
        <div class="text-xs text-earth-brown mt-0.5 whitespace-nowrap">{{ hoverShare }}</div>
      </div>
    </Teleport>
  </section>
</template>

<style scoped>
.region-section {
  padding: 56px 64px;
  border-top: 1px solid var(--color-bg-border);
}

.section-head {
  margin-bottom: 22px;
}

.heat-legend {
  display: flex;
  flex-wrap: wrap;
  gap: 14px;
  align-items: center;
  margin-top: 16px;
  padding: 11px 16px;
  background: var(--color-bg-elevated);
  border: 1px solid var(--color-bg-border);
  border-radius: 8px;
}

.map-note {
  margin-top: 8px;
  font-size: 11px;
  color: var(--color-text-muted);
}

.heat-label {
  font-size: 11px;
  color: var(--color-text-muted);
  margin-right: 2px;
}

.heat-item {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 11px;
  color: var(--color-text-secondary);
  font-family: 'IBM Plex Mono', monospace;
}

.heat-chip {
  width: 22px;
  height: 10px;
  border-radius: 2px;
  flex-shrink: 0;
}

.section-head h2 {
  font-size: 22px;
  font-weight: 700;
  color: var(--color-text-primary);
  letter-spacing: -0.015em;
}

.map-layout {
  display: grid;
  grid-template-columns: 360px 1fr;
  border: 1px solid var(--color-bg-border);
  border-radius: 12px;
  overflow: hidden;
}

.region-list {
  border-right: 1px solid var(--color-bg-border);
  overflow-y: auto;
  max-height: 720px;
  background: var(--color-bg-surface);
}

.region-list::-webkit-scrollbar {
  width: 4px;
}

.region-list::-webkit-scrollbar-track {
  background: transparent;
}

.region-list::-webkit-scrollbar-thumb {
  background: var(--color-bg-border);
  border-radius: 2px;
}

.map-container {
  background: var(--color-bg-surface);
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 12px;
}

.mobile-map {
  position: relative;
}

.region-actions {
  position: absolute;
  top: 20px;
  left: 24px;
  z-index: 5;
  display: flex;
  flex-direction: column;
  gap: 8px;
  align-items: flex-start;
}

.rname {
  font-size: 13px;
  font-weight: 700;
  color: var(--color-text-primary);
  margin-bottom: 2px;
}

.btn-act {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: var(--color-bg-elevated);
  color: var(--color-green-spring);
  border: 1px solid var(--color-green-forest);
  border-radius: 8px;
  padding: 8px 14px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.15s;
  white-space: nowrap;
  text-decoration: none;
}

.btn-act:hover {
  background: var(--color-bg-overlay);
  border-color: var(--color-green-pure);
}

.ext {
  width: 0.85em;
  height: 0.85em;
}

@media (max-width: 900px) {
  .region-section {
    padding: 40px 24px;
  }

  .region-actions {
    top: 12px;
    left: 14px;
  }
}
</style>
