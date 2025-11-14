## **Purpose**

These instructions define how to implement and style **custom components** when using **Nuxt UI + Tailwind** in this repository.
Copilot must follow these rules by default when generating or modifying Vue components.

---

## **Core Principles**

1. **Nuxt UI = design system layer**
2. **Tailwind = layout & micro-tweaks layer**
3. **Dark/light mode = via Tailwind `dark:` selectors only**
4. **Design decisions must be centralized in `app.config.ts`**
5. **Avoid reinventing or overriding Nuxt UI primitives**
6. **Use custom color palette instead of arbitrary hex values**
7. **DRY (Don't Repeat Yourself) - use `v-for`, computed properties, and reusable components**

---

## **DRY Principle**

Always eliminate repetitive code by using Vue's built-in features:

✅ **DO:**
```vue
<script setup lang="ts">
const menuItems = [
  { to: '/page1', label: 'Page 1' },
  { to: '/page2', label: 'Page 2' }
]
</script>

<template>
  <NuxtLink 
    v-for="item in menuItems"
    :key="item.to"
    :to="item.to"
    class="nav-link"
  >
    {{ item.label }}
  </NuxtLink>
</template>
```

❌ **DON'T:**
```vue
<template>
  <NuxtLink to="/page1" class="nav-link">Page 1</NuxtLink>
  <NuxtLink to="/page2" class="nav-link">Page 2</NuxtLink>
  <!-- Repeating the same structure multiple times -->
</template>
```

**When to apply DRY:**
- Lists of navigation items, menu links, or similar elements
- Repeated card/tile components with different data
- Form fields with similar structure
- Any pattern that appears 3+ times

---

## **Custom Color Palette**

All components must use the predefined custom color palette defined in `app/assets/css/main.css`. These colors automatically adapt to dark mode.

### **Available Colors**

**Surface & Background:**
- `surface-mint` - Very light mint gray (#EFF4F1 / dark: #1A2420)
- `surface-warm` - Warm desaturated beige (#D8D5C7 / dark: #2A2822)

**Text & Neutral:**
- `earth-brown` - Muted earth olive brown (#5F5939 / dark: #B8B599)

**Green Scale (Primary Brand):**
- `green-mint` - Mint green (#7EFFB9 / dark: #4DB889)
- `green-spring` - Spring green (#2ED758 / dark: #25A847)
- `green-pure` - Pure green (#01B90F / dark: #02D412)
- `green-forest` - Dark forest green (#005A0B / dark: #00802F)

**Accents:**
- `accent-yellow` - Warm yellow (#F8C832 / dark: #E0B520)
- `accent-red` - Strong red (#DB0D0C / dark: #FF3736)

### **Usage Rules**

✅ **DO:**
```vue
<!-- Use custom color utilities -->
<div class="bg-surface-mint text-earth-brown">
<button class="bg-green-pure hover:bg-green-forest">
<span class="text-green-spring dark:text-green-mint">

<!-- Combine with dark mode variants -->
<nav class="bg-white dark:bg-gray-900">
<p class="text-earth-brown dark:text-surface-warm">
```

❌ **DON'T:**
```vue
<!-- Avoid arbitrary hex values -->
<div class="text-[#5F5939]">
<button class="bg-[#01B90F]">

<!-- Don't use arbitrary Tailwind colors when custom palette exists -->
<div class="bg-green-500"> <!-- Use bg-green-pure instead -->
<p class="text-gray-700"> <!-- Use text-earth-brown instead -->
```

### **Dark Mode Implementation**

- Always provide dark mode variants using `dark:` prefix
- Dark mode colors are automatically mapped via CSS media queries
- Example: `text-green-forest dark:text-earth-brown`

---

## **Layout & Spacing Guidelines**

### **Max Width**
* All content components must have a **maximum width of 90rem** (1440px).
* Use a reusable component or utility class for consistency.
* Allow full-width backgrounds or slight overflow when needed by applying max-width to inner content containers, not outer wrappers.

### **Responsive Padding**
* On smaller screens (mobile/tablet), maintain **1rem (16px) padding** on the outermost content containers.
* This ensures content never touches screen edges.
* Use responsive Tailwind classes: `px-4` (1rem) for mobile, scaling up as needed for larger screens.

### **Implementation Pattern**
```vue
<!-- Preferred: Full-width background with constrained content -->
<div class="bg-gray-100">
  <div class="mx-auto max-w-[90rem] px-4">
    <!-- Content here -->
  </div>
</div>

<!-- OR: Using a reusable ContentContainer component -->
<ContentContainer>
  <!-- Content here -->
</ContentContainer>
```

---

## **Required Rules**

Copilot should:

* Prefer `UButton`, `UCard`, `UBadge`, `UContainer`, etc. instead of rebuilding UI primitives with raw Tailwind.
* When styling, keep radius, shadow, colors, spacing **controlled by `app.config.ts`**.
* Use Tailwind utilities only for:

  * flex / grid / gap / alignment
  * spacing (`px-*`, `py-*`, `mt-*` …)
  * typography (`text-sm`, `font-semibold` …)
  * small overrides that are intentional, not systemic
* Implement dark mode using `dark:` variants only. Do **not** add custom dark-mode logic.
* Use Nuxt UI palette (`primary`, `gray`, etc.) or custom tokens — not ad-hoc Tailwind colors.
* Build components using this pattern:

  1. Wrap with one Nuxt UI primitive (e.g., `UCard`, `UPopover`, `UModal`)
  2. Use Tailwind inside for layout
  3. Keep visual consistency via tokens

---

## **Prohibited**

Copilot should **not**:

* Create new raw HTML buttons/cards/badges instead of Nuxt UI primitives.
* Hard-code arbitrary colors like `bg-blue-500`, `text-gray-900`, etc. when a token exists.
* Override Nuxt UI defaults repeatedly (`rounded-md`, `shadow`, `p-*`) instead of adjusting `app.config.ts`.
* Mix inline styles with Tailwind for the same concern.
* Add new dark-mode logic (e.g., toggles, color-switching scripts).

---

## **Golden Example (preferred pattern)**

```vue
<UCard class="flex flex-col gap-3">
  <p class="text-sm text-gray-500 dark:text-gray-400">{{ label }}</p>
  <div class="flex items-center justify-between gap-2">
    <p class="text-xl font-semibold">{{ value }}</p>
    <slot name="action" />
  </div>
</UCard>
```

Pattern summary:

* Shell: Nuxt UI component
* Layout: Tailwind only
* Colors: Tailwind + dark variants, aligned to Nuxt UI palette
* No primitive reinvented, no visual tokens duplicated

---

## **Design Token Extension Rule**

If repeated styling appears across components (e.g., “brand badge”, “stat card”), do **not** duplicate Tailwind everywhere.
Instead:

1. extend Tailwind with new color/scale,
2. expose it through `app.config.ts → ui`,
3. then use `<UBadge color="brand">…</UBadge>` or similar.

---

## **High-level heuristic (simple but strict)**

> **If it looks like a component that Nuxt UI already exposes, use it.
> If it’s layout or content structure, use Tailwind.
> If it’s visual consistency, keep it in `app.config.ts`.**

---

## **Expected Output Style**

Copilot should generate code that:

* Is clean and compositional, not monolithic.
* Uses Nuxt UI primitives as building blocks.
* Keeps aesthetics consistent with the design system.
* Minimizes duplicated Tailwind styles across files.

---

> If a user request contradicts this document, Copilot should follow this document unless the user explicitly instructs otherwise.
