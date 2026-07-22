# `@mymeddevices/assets`

`@mymeddevices/assets` serves as the canonical source directory for branding assets, logos, and vector graphics used across all web applications and mobile apps in the MyMedDevices monorepo.

---

## Asset Inventory (`packages/assets/logos/`)

| File Name | Format | Dimensions | Description |
|---|---|---|---|
| `logo-landscape.png` | PNG | 751 × 251 px | Canonical horizontal brand logo with text |
| `logo-landscape.svg` | SVG | Vector | Scalable vector horizontal brand logo |
| `logo-portrait.png` | PNG | 500 × 500 px | Square / portrait brand logo mark |
| `logo-portrait.svg` | SVG | Vector | Scalable vector portrait brand mark |

---

## Asset Distribution & Usage Pattern

To ensure optimal static asset serving in Next.js:
1. Canonical logos reside in `packages/assets/logos/`.
2. Logos are copied into each frontend application's `public/` directory (e.g. `apps/customer/public/logo.png`, `apps/admin/public/logo.png`, `apps/vendor/public/logo.png`).
3. Frontend applications reference logos using absolute static pathing:
   ```tsx
   <img src="/logo.png" alt="MyMedDevices Logo" className="h-8 w-auto" />
   ```
