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
const isPhone = ref(false)

// Check if device is mobile
onMounted(() => {
  const checkViewport = () => {
    isPhone.value = window.innerWidth < 768
  }
  
  checkViewport()
  window.addEventListener('resize', checkViewport)
  
  return () => {
    window.removeEventListener('resize', checkViewport)
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
  
  // Scroll to card
  const cardElement = document.querySelector(`[data-region-index="${regionIndex}"]`)
  if (cardElement) {
    cardElement.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
  }
}

// Handle card hover on desktop
const handleCardHover = (regionName: string | null) => {
  if (!isPhone.value) {
    highlightedRegion.value = regionName
  }
}
</script>

<template>
  <section class="region-emission-section">
    <ContentContainer>
      <h2 class="section-title">排碳縣市分佈</h2>
      
      <!-- Mobile Layout -->
      <div v-if="isPhone" class="mobile-layout">
        <div class="map-container">
          <TaiwanMap 
            :focused-region="focusedRegion"
            :allow-zoom="true"
          />
        </div>
        
        <div 
          ref="carouselRef"
          class="carousel"
          @scroll="handleScroll"
        >
          <div
            v-for="(region, index) in regions"
            :key="region.縣市"
            :data-region-index="index"
            class="carousel-item"
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
      <div v-else class="desktop-layout">
        <div class="map-container">
          <TaiwanMap 
            :highlighted-region="highlightedRegion"
            :allow-zoom="false"
            @region-click="handleMapClick"
          />
        </div>
        
        <div class="cards-container">
          <div
            v-for="(region, index) in regions"
            :key="region.縣市"
            :data-region-index="index"
            class="card-wrapper"
            @click="handleCardClick(region.縣市)"
            @mouseenter="handleCardHover(region.縣市)"
            @mouseleave="handleCardHover(null)"
          >
            <RegionEmissionCard
              :縣市="region.縣市"
              :總排放量="region.總排放量"
              :總排放量佔比="region.總排放量佔比"
              :企業數="region.企業數"
            />
          </div>
        </div>
      </div>
    </ContentContainer>
  </section>
</template>

<style scoped>
.region-emission-section {
  background: var(--color-surface-warm, #f5f5dc);
  padding: 2rem 0;
  min-height: 90vh;
}

.section-title {
  font-size: 2.25rem;
  font-weight: 700;
  color: var(--color-green-deep, #1a472a);
  margin: 0 0 2rem 0;
  text-align: center;
}

/* Mobile Layout */
.mobile-layout {
  display: flex;
  flex-direction: column;
  height: calc(90vh - 6rem); /* Account for title and padding */
  gap: 1rem;
}

.mobile-layout .map-container {
  flex: 1;
  min-height: 0;
}

.carousel {
  flex-shrink: 0;
  display: flex;
  gap: 1rem;
  overflow-x: auto;
  scroll-snap-type: x mandatory;
  scroll-behavior: smooth;
  padding: 0.5rem 0 1rem 0;
  -webkit-overflow-scrolling: touch;
}

.carousel::-webkit-scrollbar {
  height: 4px;
}

.carousel::-webkit-scrollbar-track {
  background: rgba(0, 0, 0, 0.1);
  border-radius: 2px;
}

.carousel::-webkit-scrollbar-thumb {
  background: var(--color-earth-brown, #8B4513);
  border-radius: 2px;
}

.carousel-item {
  flex: 0 0 70vw;
  scroll-snap-align: start;
}

/* Desktop/Tablet Layout */
.desktop-layout {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 2rem;
  height: calc(90vh - 6rem); /* Account for title and padding */
}

.desktop-layout .map-container {
  height: 100%;
}

.cards-container {
  overflow-y: auto;
  padding-right: 0.5rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.cards-container::-webkit-scrollbar {
  width: 6px;
}

.cards-container::-webkit-scrollbar-track {
  background: rgba(0, 0, 0, 0.05);
  border-radius: 3px;
}

.cards-container::-webkit-scrollbar-thumb {
  background: var(--color-earth-brown, #8B4513);
  border-radius: 3px;
}

.card-wrapper {
  flex-shrink: 0;
}

.map-container {
  background: var(--color-surface-warm, #f5f5dc);
  border-radius: 12px;
  overflow: hidden;
}

/* Responsive adjustments */
@media (min-width: 768px) and (max-width: 1024px) {
  .desktop-layout {
    grid-template-columns: 1.2fr 1fr;
  }
}

@media (max-width: 767px) {
  .section-title {
    font-size: 1.75rem;
    margin-bottom: 1rem;
  }
  
  .region-emission-section {
    padding: 1rem 0;
  }
}
</style>
