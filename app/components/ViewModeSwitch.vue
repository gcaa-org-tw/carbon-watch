<script setup lang="ts">
interface Props {
  basePath: string
}

const props = defineProps<Props>()
const { setMode } = useViewMode()
const route = useRoute()

// Determine if we're on a pro page by checking the route
const isPro = computed(() => route.path.endsWith('/pro'))

// Compute target links preserving query params
const regularModeLink = computed(() => ({
  path: props.basePath,
  query: route.query
}))

const proModeLink = computed(() => ({
  path: `${props.basePath}/pro`,
  query: route.query
}))

// Handle mode changes
const handleModeClick = (mode: 'regular' | 'pro') => {
  setMode(mode)
}
</script>

<template>
  <div class="inline-flex rounded-full bg-surface-mint p-1">
    <NuxtLink
      :to="regularModeLink"
      :class="[
        'px-4 py-2 rounded-full text-sm font-medium transition-colors cursor-pointer',
        !isPro
          ? 'bg-green-pure text-white'
          : 'bg-transparent text-gray-700 hover:bg-surface-mint/50'
      ]"
      @click="handleModeClick('regular')"
    >
      易讀版
    </NuxtLink>
    <NuxtLink
      :to="proModeLink"
      :class="[
        'px-4 py-2 rounded-full text-sm font-medium transition-colors cursor-pointer',
        isPro
          ? 'bg-green-pure text-white'
          : 'bg-transparent text-gray-700 hover:bg-surface-mint/50'
      ]"
      @click="handleModeClick('pro')"
    >
      專業版
    </NuxtLink>
  </div>
</template>
