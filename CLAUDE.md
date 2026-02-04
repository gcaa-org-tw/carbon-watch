# Project Context
- Nuxt 4 + Vue 3 static site (GitHub Pages, nitro preset: static)
- No runtime API; all data imported at build time

# Commands (preferred)
- Use `npm run dev` for local UI changes
- For linting, ALWAYS run `npm run build && npm run lint`
- Do NOT run full data pipeline unless explicitly asked

Node.js 22+ required (see @.nvmrc).

# Architectural Constraints
- No runtime API layer; all data must be static JSON imported at build time
- Do NOT introduce server routes, API calls, or runtime fetches

# UI Conventions (MUST FOLLOW)
- UI rules: @.claude/skills/ui-conventions/SKILL.md

# Data Constraint
- Do NOT rename data fields; all schemas use Chinese field names

# CI Rules
- Data pipeline commits must include `[skip ci]`
