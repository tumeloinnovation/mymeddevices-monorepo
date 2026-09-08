---
name: testing
description: Testing commands and workflows for the medical device marketplace platform
---

# Testing

This skill covers testing workflows across all applications in the monorepo.

## Backend Testing

```bash
cd apps/backend
uv run pytest
```

## Frontend Testing

### Customer App
The customer app has 39 critical tests covering order API, M-Pesa flow, and order validation.

```bash
cd apps/customer
pnpm test:critical  # Run only critical tests
pnpm test           # Run all tests
pnpm test:ui        # Run tests with UI
pnpm pre-deploy     # Full validation (TS, lint, tests, build)
```

### Admin App
```bash
cd apps/admin
pnpm test           # Vitest unit tests
```

### Vendor App
```bash
cd apps/vendor
pnpm test           # Vitest unit tests
```

## Root Level Testing

```bash
# Run tests across all packages
pnpm test

# Lint all code
pnpm lint
```
