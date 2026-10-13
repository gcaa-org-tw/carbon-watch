<script setup lang="ts">
defineProps<{
  rank: number
  公司全名: string
  全台排放量: number
  全台佔比: number
  isActive: boolean
}>()

defineEmits<{ click: [] }>()
</script>

<template>
  <button class="co-card" :class="{ active: isActive }" @click="$emit('click')">
    <div class="co-rank">{{ rank }}</div>
    <div class="co-info">
      <div class="co-name">{{ 公司全名 }}</div>
      <div class="co-meta">
        <span class="co-emis">{{ formatEmissions(全台排放量) }}</span>
        <span class="co-share">佔全台製造業 {{ 全台佔比.toFixed(1) }}%</span>
      </div>
    </div>
  </button>
</template>

<style scoped>
.co-card {
  display: flex;
  gap: 12px;
  align-items: flex-start;
  width: 100%;
  text-align: left;
  padding: 14px 16px;
  border-bottom: 1px solid var(--color-bg-border);
  border-left: 3px solid transparent;
  cursor: pointer;
  transition: background 0.12s, border-color 0.12s;
  background: transparent;
}

.co-card:hover {
  background: var(--color-bg-elevated);
}

.co-card.active {
  background: var(--color-bg-elevated);
  border-left-color: var(--color-pin);
}

.co-rank {
  width: 24px;
  height: 24px;
  border-radius: 4px;
  flex-shrink: 0;
  background: var(--color-bg-overlay);
  color: var(--color-text-muted);
  font-family: 'IBM Plex Mono', monospace;
  font-size: 11px;
  font-weight: 500;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-top: 2px;
}

.co-card.active .co-rank {
  background: var(--color-pin);
  color: #fff;
}

.co-name {
  font-size: 13px;
  font-weight: 500;
  color: var(--color-text-primary);
  line-height: 1.45;
}

.co-card.active .co-name {
  color: var(--color-green-200);
}

.co-meta {
  display: flex;
  align-items: baseline;
  gap: 8px;
  margin-top: 3px;
  flex-wrap: wrap;
}

.co-emis {
  font-family: 'IBM Plex Mono', monospace;
  font-size: 14px;
  font-weight: 500;
  color: var(--color-text-primary);
}

.co-share {
  font-size: 11px;
  color: var(--color-text-muted);
}
</style>
