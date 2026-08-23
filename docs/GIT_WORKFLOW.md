# Monorepo Git & Engineering Workflow Guide

This document outlines the version control, branching, and development workflows for the **MyMedDevices** monorepo. Following these standards ensures smooth parallel development across all apps (**Customer**, **Admin**, **Vendor**, **Backend**, **Shared Packages**, and future **Mobile Apps**) without losing work, introducing breaking changes, or cluttering git history.

---

## 1. Monorepo Architecture Overview

The workspace contains independent applications that depend on shared packages and communicate with a centralized backend:

```
apps/
  ├── backend/          # FastAPI Python 3.12 Service (:8000)
  ├── customer/         # Next.js 16 Storefront (:3000)
  ├── admin/            # Next.js 16 Internal Admin Portal (:3001)
  ├── vendor/           # Next.js 16 Seller Dashboard (:3002)
  └── mobile/           # (Planned) Driver & Customer Mobile Apps (Expo / React Native)
packages/
  ├── shared-core/      # Stores, Auth, API client, Shared types
  ├── shared-ui/        # Design system & shared UI primitives
  ├── shared-admin/     # Back-office layout components
  └── assets/           # Source branding, SVGs, and media
```

---

## 2. Git Branching Strategy: Trunk-Based Development

To avoid painful multi-month merge conflicts across multiple apps, follow **Trunk-Based Development** with short-lived feature branches.

### The Rule of `master`
- `master` is the **single source of truth** and must always remain building, tested, and releasable.
- Never commit broken code or work-in-progress directly to `master`.
- Work is done in short-lived feature or bugfix branches (typically lasting a few hours to 2–3 days max).

```
master (Stable / Production-Ready)
  │
  ├── feat/backend-daraja-stk ───────────────────> Merge to master
  │
  ├── feat/customer-checkout-flow ───────────────> Merge to master
  │
  └── fix/vendor-product-wizard-drafts ──────────> Merge to master
```

### Branch Naming Convention
Prefix branches with the action type and target scope:

| Branch Pattern | Example | Purpose |
|---|---|---|
| `feat/<scope>-<feature-name>` | `feat/customer-mpesa-checkout` | New feature for a specific app |
| `feat/fullstack-<feature-name>` | `feat/fullstack-order-returns` | End-to-end feature across backend & frontends |
| `fix/<scope>-<bug-name>` | `fix/backend-jwt-refresh-race` | Bug fix |
| `refactor/<scope>-<description>` | `refactor/shared-core-cart-store` | Code cleanup or architectural change |
| `chore/<description>` | `chore/upgrade-turborepo` | Build scripts, dependencies, CI/CD |

---

## 3. Scoped Conventional Commits

In a monorepo, commits like `git commit -m "fixed styling"` or `git commit -m "updated API"` make it impossible to diagnose issues later. 

Always structure commit messages with a **scope**:

```
<type>(<scope>): <short imperative description>

[optional body with more context]
[optional footer / breaking changes]
```

### Standard Scopes

| Scope | Files Impacted | Example |
|---|---|---|
| `backend` | `apps/backend/**` | `feat(backend): add m-mpesa daraja stk query endpoint` |
| `customer` | `apps/customer/**` | `feat(customer): add delivery address selector at checkout` |
| `admin` | `apps/admin/**` | `feat(admin): add vendor application review audit log` |
| `vendor` | `apps/vendor/**` | `fix(vendor): preserve medix ai draft state on step change` |
| `shared-core` | `packages/shared-core/**` | `refactor(shared-core): streamline auth token auto-refresh` |
| `shared-ui` | `packages/shared-ui/**` | `feat(shared-ui): create accessible modal bottom sheet` |
| `mobile` | `apps/mobile/**` | `feat(mobile): add real-time driver delivery status toggle` |
| `infra` / `root` | Root config, CI/CD, Turbo | `chore(infra): optimize turborepo caching rules` |

### Commit Types
- `feat`: A new user-facing feature or API endpoint.
- `fix`: A bug fix.
- `refactor`: Code change that neither fixes a bug nor adds a feature.
- `perf`: Code change that improves performance.
- `test`: Adding missing tests or correcting existing tests.
- `docs`: Documentation updates.
- `chore`: Tooling, configs, dependency upgrades.

---

## 4. Fullstack Development Workflow (Backend + Frontends)

When a feature requires backend models/endpoints and frontend UI simultaneously:

### Step 1: Branch Creation
```bash
git checkout master
git pull origin master
git checkout -b feat/fullstack-product-reviews
```

### Step 2: Build & Commit Layer-by-Layer (Atomic Commits)
Keep each layer's commit focused and clear:

1. **Backend Database & API**:
   ```bash
   # Implement Alembic migration, model, service, and router in apps/backend
   git add apps/backend/
   git commit -m "feat(backend): add product review ratings schema and router"
   ```
2. **Shared Package Layer**:
   ```bash
   # Add TypeScript interfaces, API methods, and Zustand hooks in packages/shared-core
   git add packages/shared-core/
   git commit -m "feat(shared-core): add review submission service and react query hooks"
   ```
3. **Customer Portal UI**:
   ```bash
   # Implement review form and rating stars in apps/customer
   git add apps/customer/
   git commit -m "feat(customer): add review submission card on product detail page"
   ```
4. **Admin / Vendor Dashboard UI**:
   ```bash
   # Implement moderation table in apps/admin
   git add apps/admin/
   git commit -m "feat(admin): add product reviews moderation queue"
   ```

### Step 3: Verification Check Before Merging
```bash
# 1. Type-check all packages and frontends
pnpm build

# 2. Run backend test suite
cd apps/backend && uv run pytest
```

### Step 4: Merge to Master
```bash
git checkout master
git pull origin master
git merge --no-ff feat/fullstack-product-reviews
git push origin master
git branch -d feat/fullstack-product-reviews
```

---

## 5. Git Hygiene: Never Losing Work

### A. Context Switching with `git stash`
When working on `apps/customer` and you urgently need to switch to `apps/backend` for a quick bugfix:

```bash
# Save current unstaged and staged changes with a descriptive label
git stash push -u -m "WIP: customer checkout address step"

# Switch branches or do your quick fix
git checkout -b fix/backend-auth-cookie
# ... fix and commit ...
git checkout feat/customer-checkout

# Restore your working state
git stash list
git stash pop
```

### B. Micro-Commits with Soft Resets
If you are experimenting and want a safety checkpoint every 15 minutes:
```bash
# Commit your messy progress locally
git commit -am "wip: halfway through table refactor"

# When done, squash messy micro-commits into one clean commit
git reset --soft HEAD~3
git commit -m "feat(vendor): implement paginated order history table"
```

### C. Recovering "Lost" Commits (`git reflog`)
If you accidentally delete a branch or make a mistake with `git reset`:
```bash
git reflog
# Locate the commit SHA before the mistake
git checkout -b recovery-branch <SHA>
```

---

## 6. Managing Future Mobile Apps (Expo / React Native)

When integrating mobile applications (e.g. `apps/driver-mobile` or `apps/customer-mobile`):

1. **Leverage `@mymeddevices/shared-core`**:
   - Keep core business logic (auth tokens, API client, Zustand stores) in `packages/shared-core`.
   - Both web apps and mobile apps import from the same shared package, preventing logic duplication.

2. **Mobile Branching Pattern**:
   - Prefix mobile work with `feat/mobile-driver-*` or `feat/mobile-customer-*`.
   - Use `feat(mobile)` scope in commit messages.

3. **Isolated Testing**:
   - Run `pnpm --filter=driver-mobile exec tsc --noEmit` to verify React Native types independently without running the full monorepo build when making quick mobile tweaks.

---

## 7. Daily Cheat Sheet

| Task | Command |
|---|---|
| **Sync with upstream master** | `git checkout master && git pull origin master` |
| **Start a new feature** | `git checkout -b feat/<scope>-<description>` |
| **Check repository status** | `git status -sb` |
| **Verify type safety (single app)** | `pnpm --filter=vendor exec tsc --noEmit` |
| **Verify type safety (all apps)** | `pnpm build` |
| **Run backend unit tests** | `cd apps/backend && uv run pytest` |
| **Commit with scope** | `git commit -m "feat(customer): add order tracking timeline"` |
| **Push new branch to remote** | `git push -u origin <branch-name>` |
