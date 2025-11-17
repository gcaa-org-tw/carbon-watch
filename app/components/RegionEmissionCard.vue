<script setup lang="ts">
interface Props {
  縣市: string
  總排放量: number
  總排放量佔比: number
  企業數: number
  isActive?: boolean
}

const props = defineProps<Props>()

// Format large numbers with thousand separators
const formattedEmissions = computed(() => {
  return props.總排放量.toLocaleString('zh-TW')
})
</script>

<template>
  <div 
    class="region-emission-card"
    :class="{ 'is-active': isActive }"
  >
    <div class="card-content">
      <div class="card-left">
        <h3 class="card-title">
          {{ 縣市 }} <span class="company-count">| {{ 企業數 }} 家企業</span>
        </h3>
        <p class="emissions-amount">
          {{ formattedEmissions }} 公噸 CO<sub>2</sub>e
        </p>
      </div>
      <div class="card-right">
        <div class="percentage">{{ 總排放量佔比 }}%</div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.region-emission-card {
  background: white;
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
  cursor: pointer;
  border: 2px solid transparent;
}

.region-emission-card:hover {
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
  transform: translateY(-2px);
}

.region-emission-card.is-active {
  border-color: var(--color-earth-brown, #8B4513);
  box-shadow: 0 4px 16px rgba(139, 69, 19, 0.2);
}

.card-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
}

.card-left {
  flex: 1;
  min-width: 0;
}

.card-title {
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--color-green-deep, #1a472a);
  margin: 0 0 0.5rem 0;
  display: flex;
  align-items: baseline;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.company-count {
  font-size: 0.875rem;
  font-weight: 400;
  color: var(--color-text-secondary, #666);
}

.emissions-amount {
  font-size: 1rem;
  color: var(--color-text-primary, #333);
  margin: 0;
}

.emissions-amount sub {
  font-size: 0.75em;
}

.card-right {
  flex-shrink: 0;
}

.percentage {
  font-size: 2rem;
  font-weight: 700;
  color: var(--color-earth-brown, #8B4513);
  text-align: right;
  line-height: 1;
}

@media (max-width: 640px) {
  .card-title {
    font-size: 1.125rem;
  }
  
  .percentage {
    font-size: 1.75rem;
  }
  
  .region-emission-card {
    padding: 1.25rem;
  }
}
</style>
