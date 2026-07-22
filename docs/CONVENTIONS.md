# MyMedDevices Engineering Conventions & Code Standards

This document establishes mandatory development patterns, coding rules, and conventions for all AI subagents and human contributors working across the **MyMedDevices** monorepo.

---

## 1. Backend Engineering Patterns (FastAPI / SQLAlchemy)

### Domain Organization Template
Every backend feature domain under `apps/backend/app/domains/<domain>/` must adhere to this file structure:
```
apps/backend/app/domains/<domain>/
├── models.py       # Async SQLAlchemy 2.0 ORM models
├── schemas.py      # Pydantic v2 validation schemas
├── service.py      # Business logic & database operations class
├── routes.py       # FastAPI APIRouter endpoint definitions
└── tests/          # Pytest unit & integration tests for domain
```

### SQLAlchemy Async 2.0 Rules
- **Always** use `select()`, `update()`, and `delete()` constructs (never legacy 1.x `query()` API).
- **Always** use `await db.execute(...)` or `await db.scalars(...)`.
- **Always** inherit standard mixins from `app.domains.shared.models.base`:
  - `IDMixin`: Provides UUID string `id`.
  - `AuditMixin`: Provides `created_at` and `updated_at`.
  - `SoftDeleteMixin`: Provides `is_deleted` and `deleted_at`.

```python
# Example Model Pattern
from app.domains.shared.models.base import Base, IDMixin, AuditMixin, SoftDeleteMixin
from sqlalchemy import String, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship

class ProductReview(Base, IDMixin, AuditMixin, SoftDeleteMixin):
    __tablename__ = "product_reviews"

    product_id: Mapped[str] = mapped_column(ForeignKey("products.id"), index=True)
    user_id: Mapped[str] = mapped_column(ForeignKey("users.id"), index=True)
    rating: Mapped[int] = mapped_column(default=5)
    comment: Mapped[str | None] = mapped_column(String(1000), nullable=True)
```

### Dependency Injection & Roles
- Access database sessions using `db: AsyncSession = Depends(get_db)`.
- Enforce authentication and RBAC using `require_role(*roles)` dependency:
  ```python
  @router.post("/products")
  async def create_product(
      payload: ProductCreateSchema,
      current_user: User = Depends(require_role("vendor", "admin")),
      db: AsyncSession = Depends(get_db)
  ):
      ...
  ```

---

## 2. Frontend Engineering Patterns (Next.js / React)

### Form Validation Pattern (Zod v4 + React Hook Form)
- **CRITICAL**: Never import `zodResolver` from `@hookform/resolvers/zod`.
- **MUST**: Import `standardSchemaResolver` from `@hookform/resolvers/standard-schema`.

```tsx
// Correct Form Implementation Pattern
import { useForm } from "react-hook-form";
import { standardSchemaResolver } from "@hookform/resolvers/standard-schema";
import { z } from "zod";

const formSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

type FormValues = z.infer<typeof formSchema>;

export function LoginForm() {
  const form = useForm<FormValues>({
    resolver: standardSchemaResolver(formSchema),
    defaultValues: { email: "", password: "" },
  });

  const onSubmit = (data: FormValues) => {
    // Submit form logic
  };

  return <form onSubmit={form.handleSubmit(onSubmit)}>{/* Form inputs */}</form>;
}
```

### State Management Guidelines
- **Global Auth & Cart State**: Use Zustand stores exported from `@mymeddevices/shared-core` (`useAuthStore`, `useCartStore`).
- **Server Data Fetching & Caching**: Use `@tanstack/react-query` (`useQuery`, `useMutation`).
- **URL State & Pagination**: Use `nuqs` (`useQueryState`) for filter queries, page numbers, and search parameters.
- **Component Local State**: Use React `useState` / `useReducer` for transient UI states (toggles, modals, accordion state).

### Styling Rules & Tailwind CSS v4
- **CSS Import**: Rely on `@import "tailwindcss";` in `app/globals.css`.
- **Layout Spacing**: Prefer `flex flex-col gap-4` over `space-y-4` to prevent margin collapse issues.
- **Theme Variables**: Use CSS HSL variables (`bg-background`, `text-foreground`, `bg-primary`) rather than hardcoding hex colors.
- **Micro-Animations**: Use `framer-motion` for transitions (`motion.div`, `AnimatePresence`).
- **Toast Notifications**: Use `sonner` (`toast.success()`, `toast.error()`).

---

## 3. Monorepo Import & Package Standards

### Package Import Conventions
- Import core logic from `@mymeddevices/shared-core`:
  ```tsx
  import { useAuthStore, apiClient, Product } from "@mymeddevices/shared-core";
  ```
- Import shared UI primitives from `@mymeddevices/shared-ui`:
  ```tsx
  import { Button, Dialog, Input } from "@mymeddevices/shared-ui";
  ```
- Import back-office admin layouts from `@mymeddevices/shared-admin`:
  ```tsx
  import { DashboardLayout } from "@mymeddevices/shared-admin";
  ```

---

## 4. Testing & Quality Assurance

- **Backend Pytest**:
  - Tests located in `apps/backend/tests/`.
  - Run via `cd apps/backend && uv run pytest`.
  - Always use `pytest-asyncio` markers (`@pytest.mark.asyncio`).
- **Frontend Type Checking**:
  - Run type checks per app via `pnpm --filter=<app> exec tsc --noEmit`.
- **Pre-deployment Verification**:
  - Run full monorepo build before committing major features: `pnpm build`.
