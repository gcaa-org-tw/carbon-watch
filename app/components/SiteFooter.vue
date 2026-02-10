<script setup lang="ts">
</script>

<template>
  <footer class="bg-surface-mint py-8 md:py-12 mt-auto">
    <ContentContainer>
      <div class="flex flex-col md:flex-row md:justify-between gap-6 text-center md:text-left">
        <!-- Left column: Main content -->
        <div class="space-y-4">
          <p class="text-earth-brown">
            由<a 
              href="http://www.gcaa.org.tw/" 
              target="_blank" 
              rel="noopener noreferrer"
              class="font-medium hover:text-green-pure transition-colors underline"
            >綠色公民行動聯盟</a> X 
            <a 
              href="https://thaubing.gcaa.org.tw/" 
              target="_blank" 
              rel="noopener noreferrer"
              class="font-medium hover:text-green-pure transition-colors underline"
            >透明足跡計畫</a>推動
          </p>
          
          <p class="text-earth-brown">
            <a 
              href="https://gcaa.neticrm.tw/civicrm/contribute/transact?reset=1&id=41&utm_source=Web&utm_content=ESG_donate&utm_campaign=TB3" 
              target="_blank" 
              rel="noopener noreferrer"
              class="font-medium hover:text-green-pure transition-colors underline"
            >捐款支持</a>
          </p>
        </div>

        <!-- Right column: License info -->
        <div class="space-y-4 md:text-right">
          <p class="text-earth-brown text-sm">
            <a
              href="https://github.com/gcaa-org-tw/carbon-watch"
              target="_blank"
              rel="noopener noreferrer"
              class="hover:text-green-pure transition-colors underline"
            >原始碼</a>以 MIT 釋出
          </p>

          <p class="text-earth-brown text-sm">
            網站資料以
            <a
              href="https://creativecommons.org/licenses/by-nc/4.0/deed.zh_TW"
              target="_blank"
              rel="noopener noreferrer"
              class="hover:text-green-pure transition-colors underline"
            >創用 CC 姓名標示-非商業性 4.0 國際</a> 授權條款釋出
          </p>

          <p class="text-earth-brown text-sm">
            <NuxtLink
              to="/terms-of-service"
              class="hover:text-green-pure transition-colors underline"
            >免責聲明</NuxtLink>
          </p>
        </div>
      </div>
    </ContentContainer>
  </footer>
</template>
