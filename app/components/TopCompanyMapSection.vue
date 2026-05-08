<script setup lang="ts">
import topCompanyData from '~/assets/data/top-company-region-emissions.json'

interface CompanyRegionEmission {
  公司全名: string
  公司: string
  全台排放量: number
  全台佔比: number
  縣市排放: Record<string, number>
  排放縣市: string[]
}

const companies = topCompanyData as unknown as CompanyRegionEmission[]

const ROTATION_INTERVAL_MS = 3500

const selectedIndex = ref<number>(0)
let timer: ReturnType<typeof setInterval> | null = null

const highlightedCounties = computed(() => companies[selectedIndex.value]?.排放縣市 ?? [])

const leftCards = computed(() => companies.slice(0, 5))
const rightCards = computed(() => companies.slice(5, 10))

const carouselRef = ref<HTMLDivElement | null>(null)

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

const handleCardClick = (index: number) => {
  selectedIndex.value = index
  startRotation()
}

watch(selectedIndex, (index) => {
  nextTick(() => scrollCarouselToIndex(index))
})

onMounted(() => startRotation())
onUnmounted(() => { if (timer) clearInterval(timer) })
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