<script setup lang="ts">
interface Props {
  縣市: string
  總排放量?: number
  總排放量佔比?: number
  企業數?: number
  maxBars?: number
  isActive?: boolean
  shouldBlink?: boolean
  disabled?: boolean
}

const props = defineProps<Props>()

const heatColor = computed(() => {
  const p = props.總排放量佔比 ?? 0
  if (p >= 20) return 'var(--color-heat-6)'
  if (p >= 10) return 'var(--color-heat-5)'
  if (p >= 5)  return 'var(--color-heat-4)'
  if (p >= 2)  return 'var(--color-heat-3)'
  if (p >= 0.5) return 'var(--color-heat-2)'
  return 'var(--color-heat-1)'
})

const barWidth = computed(() => {
  if (!props.maxBars || !props.總排放量佔比) return '0%'
  return (props.總排放量佔比 / props.maxBars * 100).toFixed(1) + '%'
})

const formattedWanTon = computed(() => {
  const n = props.總排放量
  if (!n) return ''
  if (n >= 1_000_000) return Math.round(n / 10000).toLocaleString('zh-TW') + '萬公噸'
  if (n >= 10_000) return (n / 10000).toFixed(1) + '萬公噸'
  return n.toLocaleString('zh-TW') + '公噸'
})

const formattedPct = computed(() => {
  const p = props.總排放量佔比 ?? 0
  if (p > 0 && p < 0.1) return '<0.1%'
  return p.toFixed(1) + '%'
})
</script>

<template>
  <div
    class="region-item"
    :class="{ active: isActive && !disabled, blink: shouldBlink, disabled }"
    :style="isActive && !disabled ? { borderLeftColor: heatColor } : {}"
  >
    <div class="region-main">
      <div class="region-name">
        {{ 縣市 }}<span v-if="!disabled && 企業數">{{ 企業數 }} 家企業</span>
      </div>
      <div v-if="disabled" class="region-none">無製造業排碳大戶</div>
      <div v-else class="region-bar-wrap">
        <div class="region-bar-fill" :style="{ width: barWidth, background: heatColor }" />
      </div>
    </div>
    <div v-if="!disabled" class="region-right">
      <div class="region-pct">{{ formattedPct }}</div>
      <div class="region-ton">{{ formattedWanTon }}</div>
    </div>
  </div>
</template>

<style scoped>
.region-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 18px;
  border-bottom: 1px solid var(--color-bg-border);
  border-left: 3px solid transparent;
  cursor: pointer;
  transition: background 0.12s, border-color 0.12s;
}

.region-item:hover {
  background: var(--color-bg-elevated);
}

.region-item.active {
  background: var(--color-bg-elevated);
}

.region-item.disabled {
  cursor: default;
}

.region-item.disabled:hover {
  background: transparent;
}

.region-main {
  flex: 1;
  min-width: 0;
}

.region-name {
  font-size: 13px;
  font-weight: 500;
  color: var(--color-text-primary);
}

.region-item.disabled .region-name {
  color: var(--color-text-muted);
}

.region-name span {
  font-size: 10px;
  color: var(--color-text-muted);
  font-weight: 400;
  margin-left: 4px;
}

.region-none {
  font-size: 11px;
  color: var(--color-text-muted);
  margin-top: 2px;
}

.region-bar-wrap {
  margin-top: 5px;
  height: 4px;
  background: var(--color-bg-overlay);
  border-radius: 2px;
  width: 100%;
  overflow: hidden;
}

.region-bar-fill {
  height: 100%;
  border-radius: 2px;
  transition: width 0.3s ease;
}

.region-right {
  flex-shrink: 0;
  text-align: right;
}

.region-pct {
  font-size: 13px;
  font-family: 'IBM Plex Mono', monospace;
  font-weight: 500;
  color: var(--color-text-primary);
  line-height: 1.2;
}

.region-ton {
  font-size: 10px;
  font-family: 'IBM Plex Mono', monospace;
  color: var(--color-text-muted);
}

@keyframes blink {
  0%, 100% { background: transparent; }
  25%, 75% { background: var(--color-bg-elevated); }
}

.region-item.blink {
  animation: blink 3s ease-in-out;
}
</style>
