# Project Context
- Nuxt 4 + Vue 3 static site (GitHub Pages, nitro preset: static)
- No runtime API; all data imported at build time

Node.js 22+ required (see @.nvmrc)

---

# Architecture Rules (MUST FOLLOW)

1. No runtime API layer.
   - Do NOT introduce server routes
   - Do NOT use runtime fetch
   - All data must be static JSON imported at build time

2. Pages are data loaders and must stay thin.
   - Pages only:
     - read route params
     - load raw JSON
     - handle 404
     - set SEO metadata
   - Pages must NEVER contain data transformation logic.

3. Components are view-models and own all data processing.
   - All computed values
   - All derived metrics
   - All formatting
   - All fallback logic

4. Composables may contain logic shared across multiple components.

5. Do NOT rename data fields.
   - All schemas use Chinese field names.

---

# UI System (Always Follow)

- Nuxt UI is the only UI primitive layer.
- Do NOT recreate UI primitives with raw HTML + Tailwind.
- Tailwind is layout-only.
- Color tokens must come from design tokens.
- Do NOT use arbitrary hex values.
- Max content width: 90rem.
- Follow DRY: repeated UI pattern (3+ times) must be componentized.

Detailed UI conventions:
@.claude/skills/ui-conventions/SKILL.md

---

# Commands (Preferred Workflow)

- Local dev: `npm run dev`
- Linting: ALWAYS run  
  `npm run build && npm run lint`
- Do NOT run full data pipeline unless explicitly asked.

---

# CI Rule

- Data pipeline commits must include `[skip ci]`
