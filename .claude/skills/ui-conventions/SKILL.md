---
name: ui-conventions
description: UI and design system conventions for the Carbon Watch (排碳大戶觀測站) project
---

# UI Conventions (IMPORTANT)

These rules apply whenever you modify UI, pages, or components.

If a rule conflicts with an existing implementation, **follow the existing pattern** unless explicitly instructed otherwise.

---

## Design System

1. **Nuxt UI is the only UI primitive layer**
   - Always use `UButton`, `UCard`, `UBadge`, `UTable`, etc.
   - Do NOT recreate buttons, cards, badges, or inputs using raw HTML + Tailwind.
   - If a Nuxt UI component exists, use it.

2. **Tailwind is layout-only**
   - Allowed: `flex`, `grid`, `gap`, `px/py`, `mx-auto`, typography utilities
   - Not allowed: rebuilding visual styles (borders, shadows, colors, radii) that should come from Nuxt UI or tokens

3. **Visual consistency lives in @app.config.ts**
   - Radius, shadows, spacing, and color tokens must be defined centrally
   - Do NOT override Nuxt UI defaults repeatedly across files

---

## Color Rules

1. **Use custom color tokens only**
   - Defined in @app/assets/css/main.css
   - Never use arbitrary hex values
   - Never use standard Tailwind color names if a custom token exists

2. **Common tokens**
   - `surface-mint`, `surface-warm`
   - `earth-brown`
   - `green-mint`, `green-spring`, `green-pure`, `green-deep`, `green-forest`
   - `accent-blue`, `accent-yellow`, `accent-red`

3. **Dark mode**
   - Use `dark:` variants only
   - Do NOT implement custom dark-mode logic or scripts

---

## Layout Rules

1. **Max content width**
   - Maximum layout width is **90rem (1440px)**
   - Prefer `ContentContainer` component
   - Fallback: `mx-auto max-w-[90rem] px-4`

2. **Spacing**
   - Use consistent spacing scales
   - Avoid arbitrary margins/paddings unless matching existing patterns

---

## DRY & Componentization

1. **Avoid repetition**
   - If a UI pattern appears **3+ times**, refactor into:
     - A reusable component, or
     - A data-driven structure with `v-for`

2. **Prefer computed state**
   - Avoid duplicating derived values in templates
   - Use computed properties and composables

---

## Component Pattern (Reference)

Use this as a baseline structure for simple data cards:

```vue
<UCard class="flex flex-col gap-3">
  <p class="text-sm text-earth-brown">
    {{ label }}
  </p>

  <div class="flex items-center justify-between gap-2">
    <p class="text-xl font-semibold">
      {{ value }}
    </p>
  </div>
</UCard>
```