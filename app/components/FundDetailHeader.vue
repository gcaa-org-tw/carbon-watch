<script setup lang="ts">
const props = defineProps<{
  fundKey: string
  code: string
  unifiedId?: string
  name: string
  isEsg?: boolean
  marketValue: number
  emitterCount: number
  emitterShare: number
  emitterEmissions: number
}>()

// Route slug is always the fundKey (基金統編, or 基金代號 for the code-less
// umbrella funds); the ver-switch base path must use it, not the display code.
const routeKey = computed(() => props.fundKey)

// Identifier line under the title: prefer 證券代號; fall back to 基金統編 for
// the code-less ESG funds; blank if neither (defensive — never happens).
const codeDisplay = computed(() => {
  if (props.code) return `證券代號 ${props.code}`
  if (props.unifiedId) return `基金統編 ${props.unifiedId}`
  return ''
})

const MARKET_VALUE_UNIT = 1_000_000

const stats = computed(() => [
  { label: '總市值', value: `${formatApprox(props.marketValue * MARKET_VALUE_UNIT)}元` },
  { label: '排碳大戶家數', value: `${props.emitterCount} 家` },
  { label: '排碳大戶家數佔比', value: `${props.emitterShare.toFixed(1)}%` },
  { label: '排碳大戶總碳排量', value: formatEmissions(props.emitterEmissions) },
])
</script>

<template>
  <header class="co-header">
    <NuxtLink to="/funds" class="back-link">
      ← 依基金持股查詢
    </NuxtLink>
    <h1>{{ name }}<EsgLeaf v-if="isEsg" /></h1>
    <p v-if="codeDisplay" class="fund-code">
      {{ codeDisplay }}
    </p>
    <p v-if="isEsg" class="esg-note">
      <EsgLeaf /><span>：屬於境內發行之 ESG 基金</span>
    </p>
    <dl class="fund-stats">
      <div v-for="stat in stats" :key="stat.label" class="fund-stat">
        <dt>{{ stat.label }}</dt>
        <dd>{{ stat.value }}</dd>
      </div>
    </dl>
    <ViewModeSwitch :base-path="`/funds/${routeKey}`" />
    <FundDataNote />
  </header>
</template>

<style scoped>
/* 版面與 /funds、/companies 列表頁的 .co-header 一致 */
.co-header {
  padding-bottom: 24px;
}

.back-link {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  color: var(--color-text-secondary);
  margin-bottom: 14px;
  transition: color 0.15s;
}

.back-link:hover {
  color: var(--color-green-spring);
}

.co-header h1 {
  font-size: 24px;
  font-weight: 700;
  color: var(--color-text-primary);
  letter-spacing: -0.015em;
  margin-bottom: 8px;
}

.fund-code {
  font-family: 'IBM Plex Mono', monospace;
  font-size: 13px;
  color: var(--color-text-secondary);
  margin-bottom: 18px;
}

.fund-stats {
  display: flex;
  flex-wrap: wrap;
  gap: 12px 40px;
  margin-bottom: 20px;
}

.fund-stat dt {
  font-size: 12px;
  color: var(--color-text-muted);
  margin-bottom: 2px;
}

.fund-stat dd {
  font-family: 'IBM Plex Mono', monospace;
  font-size: 16px;
  color: var(--color-text-primary);
}

.esg-note {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  color: var(--color-text-secondary);
  margin-bottom: 18px;
}
</style>
