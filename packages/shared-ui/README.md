# `@mymeddevices/shared-ui`

`@mymeddevices/shared-ui` contains the reusable Radix UI primitives, shared modal dialogs, design tokens, base Tailwind CSS styles, and accessibility components consumed across the MyMedDevices monorepo.

---

## Directory Structure & Component Inventory

```
packages/shared-ui/src/
├── index.ts                 # Main export point (re-exports cn, Providers, Modals)
├── lib/
│   └── utils.ts             # Class merging utility (cn helper: clsx + tailwind-merge)
├── styles/
│   └── base.css             # Shared Tailwind v4 base styles & custom data variants
├── components/
│   ├── auth/                # Shared Auth Dialog Modals
│   │   ├── LoginModal.tsx
│   │   ├── LogoutModal.tsx
│   │   ├── SessionExpiredModal.tsx
│   │   └── SetEmailModal.tsx
│   ├── common/              # Common Shared Components
│   │   ├── ConfirmationDialog.tsx
│   │   ├── ErrorBoundary.tsx
│   │   └── SectionHeader.tsx
│   ├── maps/                # Google Maps Integration Components
│   │   ├── AddressAutocomplete.tsx
│   │   ├── DeliveryAddressSheet.tsx
│   │   ├── GoogleMapView.tsx
│   │   └── useGoogleMaps.ts
│   ├── seo/                 # Structured Data JSON-LD Components
│   │   ├── BreadcrumbJsonLd.tsx
│   │   ├── OrganizationJsonLd.tsx
│   │   └── ProductJsonLd.tsx
│   └── ui/                  # 45 Radix UI / Primitive UI Components
│       ├── button.tsx, dialog.tsx, select.tsx, input.tsx, card.tsx, ...
```

---

## Design Tokens & Base CSS (`src/styles/base.css`)

- **Tailwind v4 Variants**: Defines `@custom-variant` directives for state mapping:
  - `@custom-variant data-active`
  - `@custom-variant data-open`
  - `@custom-variant data-closed`
  - `@custom-variant data-disabled`
- **Accessibility & Utility Helpers**: Includes `.hide-scrollbar`, `.sidebar-nav-active`, and prefers-reduced-motion CSS resets.

---

## Importing Components

```tsx
import { Button, Dialog, Card, Input } from "@mymeddevices/shared-ui";
import { LoginModal } from "@mymeddevices/shared-ui";
import { GoogleMapView } from "@mymeddevices/shared-ui";
import { ProductJsonLd } from "@mymeddevices/shared-ui";
```
