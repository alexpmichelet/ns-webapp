# Project Conventions

- Naming: descriptive, type-safe, avoid abbreviations
- Types: no `any`; prefer explicit types
- Components: atomic structure in `components/atoms` and `components/molecules`
- Data: use Server Actions and TanStack Query; no direct `fetch()` in components
- Logging: structured logs in server actions; include duration and request IDs
