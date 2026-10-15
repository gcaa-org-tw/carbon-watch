<template>
  <section class="page-section">
    <div class="section-head">
      <h2>六項指標分級標準</h2>
    </div>
    <GradingRuleGrid />
  </section>
</template>

<style scoped>
.page-section {
  padding: 56px 64px;
  border-top: 1px solid var(--color-bg-border);
}

.section-head {
  margin-bottom: 22px;
}

.section-head h2 {
  font-size: 22px;
  font-weight: 700;
  color: var(--color-text-primary);
  letter-spacing: -0.015em;
}


@media (max-width: 900px) {
  .page-section {
    padding: 40px 24px;
  }
}
</style>
