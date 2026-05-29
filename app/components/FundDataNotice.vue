<script setup lang="ts">
// As-of notice for fund pages: holdings are 2026 Q1 (latest SITCA quarterly),
// every per-company figure is 2024 (latest annual filing). showCoalNote adds the
// footnote explaining the "*" on the 2026 燃煤使用量 column header in the pro table.
// NOTE: wording is a draft pending the user's final review.
withDefaults(defineProps<{ showCoalNote?: boolean }>(), { showCoalNote: false })
</script>

<template>
  <div class="rounded-md border border-earth-brown/30 bg-surface-mint/20 px-4 py-3 text-sm text-earth-brown">
    <p>
      本表基金持股截至 <strong>2026 Q1</strong>（SITCA 最新季報）；各企業的碳排、燃煤等數據為
      <strong>2024 全年</strong>（環境部年度申報，目前最新可得）。燃煤現況以 2024 年資料估計，假設企業尚未汰除燃煤。
    </p>
    <p v-if="showCoalNote" class="mt-1">
      *「2026 燃煤使用量（公噸）」目前沿用 2024 年數據，待實際數據釋出後更新。
    </p>
  </div>
</template>
