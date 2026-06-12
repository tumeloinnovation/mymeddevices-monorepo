# MyMedDevices Monorepo

## Quick start

```sh
pnpm install                          # install everything
pnpm dev:backend                      # Python FastAPI (uvicorn, :8000)
pnpm dev:customer                     # Next.js (:3000)
pnpm dev:admin                        # Next.js (:3001)
pnpm dev:vendor                       # Next.js (:3002)
pnpm dev                              # all turbo tasks
pnpm build                            # all apps
pnpm --filter=<app> exec tsc --noEmit # type-check one app
```

## Structure

```
apps/
  admin/          Next.js 16 — admin portal
  vendor/         Next.js 16 — vendor portal
  customer/       Next.js 16 — customer portal
  backend/        Python 3.12 FastAPI + asyncpg + SQLAlchemy
packages/
  shared-core/    Zustand stores, auth, API client (@mymeddevices/shared-core)
  shared-ui/      Reusable components, tailwind config (@mymeddevices/shared-ui)
  assets/         Logos (logo-landscape.png 751×251)
```

## Framework quirks

- **Next.js 16.2.9** (not latest). It has breaking changes — read `node_modules/next/dist/docs/` before writing code. Heed deprecation notices.
- **zod v4** (not v3). `z.infer`, `z.object`, etc. work identically, but `_def` structure differs. Never import `zodResolver` from `@hookform/resolvers/zod` — the types are incompatible. Use `standardSchemaResolver` from `@hookform/resolvers/standard-schema` instead.
- **Tailwind CSS v4** with `@tailwindcss/postcss`. Uses `@import "tailwindcss"` (not `@tailwind` directives). PostCSS config is `postcss.config.mjs`.
- **Tailwind class convention**: Prefer `flex flex-col gap-*` over `space-y-*`.
- **shadcn**: Only the **vendor** app has `shadcn` and `tw-animate-css` installed (globals.css uses RHEA preset imports). Admin and customer use simpler CSS variable setups. Don't `pnpm add shadcn` to other apps — it breaks `@hookform/resolvers` resolution.
- **framer-motion**: Available in all three frontend apps (v12).

## Key dev commands

| Command | Effect |
|---|---|
| `pnpm dev:backend` | `uv run uvicorn app.main:app --reload` (from `apps/backend`) |
| `pnpm --filter=customer dev` | Single app dev server |
| `turbo build --filter=admin --filter=vendor` | Build subset |
| `uv run alembic upgrade head` | Run DB migrations (from `apps/backend`) |
| `pnpm --filter=vendor exec tsc --noEmit` | TypeScript check single app |
| `cd apps/backend && uv run pytest` | Backend tests |

Backend CORS allows `localhost:3000` (customer), `:3001` (admin), `:3002` (vendor).

## Conventions

- **Auth**: Zustand store in `@mymeddevices/shared-core` provides `login`, `logout`, `forgotPassword`, `register`, `registerVendor`. Each app calls it with role string: `login(data, "admin")`.
- **Forms**: `react-hook-form` + `standardSchemaResolver`. Import from `@hookform/resolvers/standard-schema`. Never use `zodResolver`.
- **Logo**: Source at `packages/assets/logos/logo-landscape.png`. Copied into each app's `public/logo.png`. Reference as `<img src="/logo.png">`.

## Skills

13 installed skills in `.agents/skills/`. Notable: `shadcn`, `turborepo`, `pnpm`, `vercel-composition-patterns`, `vercel-react-best-practices`, `frontend-design`, `morphing-icons`.
