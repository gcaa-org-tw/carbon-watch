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
