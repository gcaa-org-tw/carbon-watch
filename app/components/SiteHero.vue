<script setup lang="ts">
import companyList from '~/assets/data/company-list.json'

const { isPro } = useViewMode()

const companyCount = companyList.length
const risingCount = companyList.filter(company => Number(company.年度變化) > 0).length

// 「涵蓋全國 54%」與「-1.38%」為對外策展數字（非即時計算）——口徑與環境部年度申報／團隊對外說法一致
const stats = [
  { label: '追蹤製造業', value: String(companyCount), sub: '排碳大戶公司' },
  { label: '涵蓋全國', value: '54%', sub: '溫室氣體排放' },
  { label: '2024年相較2023年', value: '-1.38%', sub: '溫室氣體排放量' },
  { label: '比對發現', value: String(risingCount), sub: '家公司排放量仍在上升' },
]
</script>

<template>
  <!-- Hero -->
  <section class="hero">
    <div class="hero-eyebrow">台灣氣候績效追蹤平台</div>
    <h1>
      追蹤台灣<em>排碳大戶</em><br>
      一鍵看清氣候責任
    </h1>
    <p class="hero-sub">
      追蹤 {{ companyCount }} 家企業溫室氣體排放量、減量承諾與行動成果，以透明數據推動台灣氣候行動。
    </p>
    <div class="hero-actions">
      <UButton :to="isPro ? '/companies/pro' : '/companies'" class="btn-primary-hero">
        了解企業表現
      </UButton>
      <UButton to="/methodology" variant="outline" class="btn-secondary-hero">
        氣候績效指標方法論
      </UButton>
    </div>
  </section>

  <!-- Stat Strip -->
  <div class="stat-strip">
    <div v-for="stat in stats" :key="stat.label" class="stat-cell">
      <div class="stat-label">{{ stat.label }}</div>
      <div class="stat-val">{{ stat.value }}</div>
      <div class="stat-sub">{{ stat.sub }}</div>
    </div>
  </div>
</template>

<style scoped>
/* ── Hero ─────────────────────────────────────────────── */
.hero {
  padding: 72px 64px 56px;
  background:
    radial-gradient(ellipse 70% 60% at 10% 80%, rgba(58, 154, 92, .07) 0%, transparent 70%),
    radial-gradient(ellipse 50% 40% at 90% 10%, rgba(58, 154, 92, .05) 0%, transparent 60%);
}

.hero-eyebrow {
  font-size: 11px;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: .12em;
  color: var(--color-green-pure);
  margin-bottom: 14px;
}

.hero h1 {
  font-size: 40px;
  font-weight: 700;
  letter-spacing: -.025em;
  line-height: 1.2;
  margin-bottom: 16px;
  color: var(--color-text-primary);
}

.hero h1 em {
  color: var(--color-green-spring);
  font-style: normal;
}

.hero-sub {
  font-size: 15px;
  color: var(--color-earth-brown);
  max-width: 520px;
  margin-bottom: 36px;
  line-height: 1.75;
}

.hero-actions {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

/* Nuxt UI button overrides — :deep() from scoped parent .hero-actions */
.hero-actions :deep(.btn-primary-hero) {
  background-color: var(--color-green-pure);
  color: var(--color-text-inverted);
  border-color: var(--color-green-pure);
  font-size: 14px;
  font-weight: 500;
  padding: 10px 22px;
  border-radius: 8px;
  transition: background 0.15s, border-color 0.15s;
}

.hero-actions :deep(.btn-primary-hero:hover) {
  background-color: var(--color-green-500);
  border-color: var(--color-green-500);
}

.hero-actions :deep(.btn-secondary-hero) {
  background-color: transparent;
  color: var(--color-green-spring);
  border-color: var(--color-green-forest);
  font-size: 14px;
  font-weight: 500;
  padding: 10px 22px;
  border-radius: 8px;
  transition: background 0.15s, border-color 0.15s;
}

.hero-actions :deep(.btn-secondary-hero:hover) {
  background-color: var(--color-bg-elevated);
  border-color: var(--color-green-pure);
  color: var(--color-green-spring);
}

/* ── Stat Strip ───────────────────────────────────────── */
.stat-strip {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 1px;
  background: var(--color-bg-border);
  border-top: 1px solid var(--color-bg-border);
  border-bottom: 1px solid var(--color-bg-border);
}

.stat-cell {
  background: var(--color-bg-surface);
  padding: 22px 28px;
}

.stat-label {
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: .09em;
  color: var(--color-text-muted);
  margin-bottom: 6px;
  font-weight: 500;
}

.stat-val {
  font-size: 28px;
  font-weight: 700;
  color: var(--color-green-spring);
  font-family: 'IBM Plex Mono', 'Cascadia Code', monospace;
  letter-spacing: -.02em;
  line-height: 1;
}

.stat-sub {
  font-size: 14px;
  color: var(--color-earth-brown);
  margin-top: 4px;
}

@media (max-width: 900px) {
  .hero {
    padding: 48px 24px 40px;
  }

  .hero h1 {
    font-size: 30px;
  }

  .stat-strip {
    grid-template-columns: repeat(2, 1fr);
  }
}
</style>
