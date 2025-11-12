<template>
  <nav class="border-b border-gray-200 bg-white">
    <div class="container mx-auto px-4 py-4">
      <div class="flex items-center justify-between">
        <NuxtLink to="/" class="text-xl font-bold">
          排碳大戶觀測站
        </NuxtLink>
        <div class="flex gap-6">
          <NuxtLink to="/companies" class="hover:text-blue-600">
            企業觀測清單
          </NuxtLink>
          <NuxtLink to="/funds" class="hover:text-blue-600">
            基金觀測
          </NuxtLink>
          <NuxtLink to="/methodology" class="hover:text-blue-600">
            綠盟的氣候績效指標
          </NuxtLink>
        </div>
      </div>
    </div>
  </nav>
</template>
