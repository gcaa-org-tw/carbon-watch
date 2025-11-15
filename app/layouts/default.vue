<template>
  <div class="min-h-screen flex flex-col">
    <SiteNav />
    <main class="py-8 flex-1">
      <ContentContainer>
        <slot />
      </ContentContainer>
    </main>
    <SiteFooter />
  </div>
</template>
