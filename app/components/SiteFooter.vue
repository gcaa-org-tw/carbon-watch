<template>
  <footer class="site-footer">
    <div class="footer-left">
      由
      <a href="https://gcaa.org.tw/" target="_blank" rel="noopener noreferrer">綠色公民行動聯盟</a>
      ×
      <a href="https://thaubing.gcaa.org.tw/" target="_blank" rel="noopener noreferrer">透明足跡計畫</a>
      推動<br>
      <span class="footer-fine">
        <a href="https://github.com/gcaa-org-tw/carbon-watch" target="_blank" rel="noopener noreferrer">原始碼</a>以 MIT 釋出 · 網站資料以 創用 CC
        <a href="https://creativecommons.org/licenses/by-nc/4.0/deed.zh-hant" target="_blank" rel="noopener noreferrer">姓名標示─非商業性 4.0 國際</a>
        授權條款釋出
      </span>
    </div>

    <div class="footer-right">
      <NuxtLink class="footer-link" to="/about">
        計畫緣起
      </NuxtLink>
      <NuxtLink class="footer-link" to="/data-source">
        資料來源
      </NuxtLink>
      <NuxtLink class="footer-link" to="/terms-of-service">
        免責聲明
      </NuxtLink>
    </div>
  </footer>
</template>

<style scoped>
.site-footer {
  margin-top: auto;
  background: var(--color-bg-surface);
  border-top: 1px solid var(--color-bg-border);
  padding: 28px 64px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 12px;
}

.footer-left {
  font-size: 13px;
  color: var(--color-text-muted);
  line-height: 1.8;
}

.footer-left a {
  color: var(--color-green-spring);
  font-weight: 500;
  text-decoration: none;
  transition: color 0.15s;
}

.footer-left a:hover {
  color: var(--color-green-pure);
}

.footer-fine {
  font-size: 12px;
}

.footer-right {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 20px;
}

.footer-link {
  font-size: 12px;
  color: var(--color-text-muted);
  text-decoration: none;
  transition: color 0.15s;
}

.footer-link:hover {
  color: var(--color-green-spring);
}

@media (max-width: 900px) {
  .site-footer {
    padding: 24px;
  }
}
</style>
