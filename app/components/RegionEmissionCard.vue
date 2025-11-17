<script setup lang="ts">
interface Props {
  縣市: string
  總排放量: number
  總排放量佔比: number
  企業數: number
  isActive?: boolean
  shouldBlink?: boolean
}

const props = defineProps<Props>()

// Format large numbers with thousand separators
const formattedEmissions = computed(() => {
  return props.總排放量.toLocaleString('zh-TW')
})
</script>

<template>
  <div 
    class="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-md transition-all duration-300 cursor-pointer border-2"
    :class="[
      isActive 
        ? 'border-earth-brown dark:border-green-mint shadow-lg' 
        : 'border-transparent hover:shadow-xl hover:-translate-y-0.5',
      shouldBlink ? 'blink-animation' : ''
    ]"
  >
    <div class="flex justify-between items-center gap-4">
      <div class="flex-1 min-w-0">
        <h3 class="text-xl sm:text-xl text-lg font-semibold text-green-deep dark:text-green-mint mb-2 flex items-baseline gap-2 flex-wrap">
          {{ 縣市 }} 
          <span class="text-sm sm:text-sm text-xs font-normal text-gray-600 dark:text-gray-400">| {{ 企業數 }} 家企業</span>
        </h3>
        <p class="text-base sm:text-base text-sm text-gray-800 dark:text-gray-200 m-0">
          {{ formattedEmissions }} 公噸 CO<sub class="text-xs">2</sub>e
        </p>
      </div>
      <div class="flex-shrink-0">
        <div class="sm:text-3xl text-2xl font-bold text-earth-brown dark:text-green-mint text-right leading-none">
          {{ 總排放量佔比 }}%
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Blink animation */
@keyframes blink {
  0%, 100% {
    background-color: white;
  }
  25% {
    background-color: #f5deb3;
  }
  50% {
    background-color: white;
  }
  75% {
    background-color: #f5deb3;
  }
}

@keyframes blink-dark {
  0%, 100% {
    background-color: rgb(31, 41, 55);
  }
  25% {
    background-color: rgb(16, 56, 48);
  }
  50% {
    background-color: rgb(31, 41, 55);
  }
  75% {
    background-color: rgb(16, 56, 48);
  }
}

.blink-animation {
  animation: blink 3s ease-in-out;
}

.dark .blink-animation {
  animation: blink-dark 3s ease-in-out;
}
</style>
