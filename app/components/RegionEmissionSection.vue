<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
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
const carouselRef = ref<HTMLDivElement | null>(null)
const cardsContainerRef = ref<HTMLDivElement | null>(null)
const isPhone = ref(false)
const blinkingRegion = ref<string | null>(null)
const mapLoaded = ref(false)

// Get list of valid region names
const validRegionNames = computed(() => regions.map(r => r.縣市))

// Check if device is mobile
onMounted(() => {
  const checkViewport = () => {
    isPhone.value = window.innerWidth < 768
  }
  
  checkViewport()
  window.addEventListener('resize', checkViewport)
  
  // Prevent body scroll when scrolling inside cards container
  const handleWheel = (e: WheelEvent) => {
    if (!cardsContainerRef.value) return
    
    const container = cardsContainerRef.value
    const isScrollingDown = e.deltaY > 0
    const isAtTop = container.scrollTop === 0
    const isAtBottom = container.scrollTop + container.clientHeight >= container.scrollHeight - 1
    
    // Prevent body scroll if we're scrolling within bounds
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

const focusedRegion = computed(() => {
  if (isPhone.value && activeCardIndex.value >= 0) {
    return regions[activeCardIndex.value]?.縣市 || null
  }
  return null
})

// Handle carousel scroll on mobile
const handleScroll = () => {
  if (!carouselRef.value || !isPhone.value) return
  
  const scrollLeft = carouselRef.value.scrollLeft
  const cardWidth = carouselRef.value.offsetWidth * 0.7 + 16 // 70vw + gap
  const newIndex = Math.round(scrollLeft / cardWidth)
  
  if (newIndex !== activeCardIndex.value) {
    activeCardIndex.value = newIndex
  }
}

// Handle card click
const handleCardClick = (region: string) => {
  const baseUrl = '/companies'
  // Note: You can add logic here to determine if user has pro access
  // For now, just go to basic companies page with region filter
  const url = `${baseUrl}?region=${encodeURIComponent(region)}`
  navigateTo(url)
}

// Handle map region click (desktop only)
const handleMapClick = async (regionName: string) => {
  if (isPhone.value) return

  // Find the card for this region
  const regionIndex = regions.findIndex(r => r.縣市 === regionName)
  if (regionIndex === -1) return

  // Trigger blink animation
  blinkingRegion.value = regionName

  // Scroll within the cards container (not the whole page)
  const cardElement = document.querySelector(`[data-region-index="${regionIndex}"]`) as HTMLElement | null
  const container = cardsContainerRef.value
  if (cardElement && container) {
    const containerRect = container.getBoundingClientRect()
    const cardRect = cardElement.getBoundingClientRect()
    // Calculate scroll position to center the card in the container
    const scrollTop = cardElement.offsetTop - container.offsetTop - (containerRect.height / 2) + (cardRect.height / 2)
    container.scrollTo({ top: Math.max(0, scrollTop), behavior: 'smooth' })
  }

  // Remove blink animation after 3 seconds
  setTimeout(() => {
    blinkingRegion.value = null
  }, 3000)
}

// Handle card hover on desktop
const handleCardHover = (regionName: string | null) => {
  if (!isPhone.value) {
    highlightedRegion.value = regionName
  }
}

// Handle map loaded event
const handleMapLoaded = () => {
  mapLoaded.value = true
  
  // On mobile, scroll to first card (already at index 0)
  if (isPhone.value && carouselRef.value) {
    // Ensure we're at the first card
    carouselRef.value.scrollLeft = 0
  }
}

// Computed property to check if we should show mobile carousel
const showMobileCarousel = computed(() => {
  return isPhone.value && mapLoaded.value
})
</script>

<template>
  <section class="bg-surface-warm py-8 min-h-[80vh]">
    <div class="mx-auto w-full px-4" :class="isPhone ? 'max-w-[90rem]' : 'max-w-[80rem]'">
      <h2 class="text-4xl font-bold text-green-deep dark:text-green-mint mb-8 text-center">
        排碳縣市分佈
      </h2>
      
      <!-- Mobile Layout -->
      <div v-if="isPhone" class="flex flex-col gap-4" style="height: calc(80vh - 6rem);">
        <div :class="showMobileCarousel ? 'flex-1 min-h-0' : 'flex-1'">
          <TaiwanMap 
            :focused-region="focusedRegion"
            :allow-zoom="true"
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
            v-for="(region, index) in regions"
            :key="region.縣市"
            :data-region-index="index"
            class="flex-none snap-start"
            style="flex: 0 0 70vw;"
            @click="handleCardClick(region.縣市)"
          >
            <RegionEmissionCard
              :縣市="region.縣市"
              :總排放量="region.總排放量"
              :總排放量佔比="region.總排放量佔比"
              :企業數="region.企業數"
              :is-active="index === activeCardIndex"
            />
          </div>
        </div>
      </div>
      
      <!-- Desktop/Tablet Layout -->
      <div v-else class="grid grid-cols-2 gap-16" style="height: calc(80vh - 6rem);">
        <div class="h-full">
          <TaiwanMap 
            :highlighted-region="highlightedRegion"
            :allow-zoom="false"
            :valid-regions="validRegionNames"
            @region-click="handleMapClick"
          />
        </div>
        
        <div ref="cardsContainerRef" class="overflow-y-auto pr-2 flex flex-col gap-4">
          <div
            v-for="(region, index) in regions"
            :key="region.縣市"
            :data-region-index="index"
            class="flex-shrink-0"
            @click="handleCardClick(region.縣市)"
            @mouseenter="handleCardHover(region.縣市)"
            @mouseleave="handleCardHover(null)"
          >
            <RegionEmissionCard
              :縣市="region.縣市"
              :總排放量="region.總排放量"
              :總排放量佔比="region.總排放量佔比"
              :企業數="region.企業數"
              :should-blink="blinkingRegion === region.縣市"
            />
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
/* Carousel scrollbar styling */
[ref="carouselRef"]::-webkit-scrollbar {
  height: 4px;
}

[ref="carouselRef"]::-webkit-scrollbar-track {
  background: rgba(0, 0, 0, 0.1);
  border-radius: 2px;
}

[ref="carouselRef"]::-webkit-scrollbar-thumb {
  background: var(--color-earth-brown, #8B4513);
  border-radius: 2px;
}

/* Cards container scrollbar styling */
.overflow-y-auto::-webkit-scrollbar {
  width: 6px;
}

.overflow-y-auto::-webkit-scrollbar-track {
  background: rgba(0, 0, 0, 0.05);
  border-radius: 3px;
}

.overflow-y-auto::-webkit-scrollbar-thumb {
  background: var(--color-earth-brown, #8B4513);
  border-radius: 3px;
}

/* Responsive title */
@media (max-width: 767px) {
  h2 {
    font-size: 1.75rem;
    margin-bottom: 1rem;
  }
  
  section {
    padding: 1rem 0;
  }
}

/* Desktop grid adjustments for tablets */
@media (min-width: 768px) and (max-width: 1024px) {
  .grid-cols-2 {
    grid-template-columns: 1.2fr 1fr;
  }
}
</style>
