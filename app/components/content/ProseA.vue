<script setup lang="ts">
const props = defineProps<{
  href?: string
  target?: string | null
  class?: string | string[] | Record<string, boolean>
}>()

const isExternal = computed(() => props.target === '_blank' || /^https?:\/\//.test(props.href ?? ''))
</script>

<template>
  <ULink
    :href="href"
    :target="target"
    :class="[
      'text-primary border-b border-transparent hover:border-primary font-medium focus-visible:outline-primary transition-colors',
      props.class,
    ]"
    raw
  >
    <slot />
    <UIcon
      v-if="isExternal"
      name="i-heroicons-arrow-top-right-on-square-20-solid"
      class="ml-0.5 inline-block size-[0.85em] align-baseline"
      aria-hidden="true"
    />
  </ULink>
</template>
