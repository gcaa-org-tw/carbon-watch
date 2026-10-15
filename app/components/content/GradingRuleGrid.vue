<script setup lang="ts">
import gradingRules from '~/assets/data/grading-rules.json'

interface GradingLevel {
  狀態: string
  等級: string
  標準: string
}

interface GradingRule {
  編號: number
  標題: string
  分級: GradingLevel[]
}

const rules = gradingRules as GradingRule[]
</script>

<template>
  <div class="rule-grid">
    <div
      v-for="rule in rules"
      :key="rule.編號"
      class="rule"
    >
      <h5>{{ rule.編號 }}. {{ rule.標題 }}</h5>
      <div
        v-for="level in rule.分級"
        :key="level.狀態"
        class="rule-r"
      >
        <span class="dot" :class="`dot-${level.狀態}`" />
        <span>{{ level.等級 }}：{{ level.標準 }}</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.rule-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
  gap: 14px;
}

.rule {
  background: var(--color-bg-surface);
  border: 1px solid var(--color-bg-border);
  border-radius: 12px;
  padding: 16px 20px;
}

.rule h5 {
  font-size: 14px;
  font-weight: 700;
  color: var(--color-text-primary);
  margin-bottom: 10px;
}

.rule-r {
  display: flex;
  gap: 9px;
  align-items: flex-start;
  padding: 4px 0;
  font-size: 13px;
  line-height: 1.7;
  color: var(--color-text-secondary);
}

.dot {
  display: inline-block;
  flex-shrink: 0;
  width: 10px;
  height: 10px;
  margin-top: 6px;
  border-radius: 50%;
}

.dot-great { background: var(--color-status-great); }
.dot-ok { background: var(--color-status-ok); }
.dot-warn { background: var(--color-status-warn); }
.dot-bad { background: var(--color-status-bad); }
</style>
