<script setup lang="ts">
interface Props {
  basePath: string
}

const props = defineProps<Props>()
const { setMode } = useViewMode()
const route = useRoute()

// Determine if we're on a pro page by checking the route
const isPro = computed(() => /\/pro\/?$/.test(route.path))

// Compute target links preserving query params
const regularModeLink = computed(() => ({
  path: props.basePath,
  query: route.query,
}))

const proModeLink = computed(() => ({
  path: `${props.basePath}/pro`,
  query: route.query,
}))

// Handle mode changes
const handleModeClick = (mode: 'regular' | 'pro') => {
  setMode(mode)
}
</script>

<template>
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
</template>

<style scoped>
/* 版面與 CompanyListFilter.vue 的 .ver-switch 一致 */
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
</style>
