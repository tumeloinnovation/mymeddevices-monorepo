# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Monorepo Architecture

This is a medical device marketplace platform built as a monorepo using **pnpm workspaces** and **Turborepo** for task orchestration.

### Applications

- **Backend** (`apps/backend/`): FastAPI-based Python backend with DDD architecture, port 8000
- **Customer Portal** (`apps/customer/`): Next.js customer-facing app, port 3000
- **Admin Portal** (`apps/admin/`): Next.js admin dashboard, port 3001
- **Vendor Portal** (`apps/vendor/`): Next.js vendor management interface, port 3002

### Shared Packages

- **`packages/shared-ui/`**: Shared UI components (shadcn/ui based, Radix UI primitives)
- **`packages/shared-core/`**: Core utilities, types, and shared business logic
- **`packages/shared-admin/`**: Admin-specific components and utilities

See `package.json` files for complete dependency information and versions.

## Development Commands

### Root Level (run from monorepo root)

```bash
# Run all apps in development mode
pnpm dev

# Run specific apps
pnpm dev:backend      # Backend on port 8000
pnpm dev:customer    # Customer portal on port 3000
pnpm dev:admin       # Admin portal on port 3001
pnpm dev:vendor      # Vendor portal on port 3002
pnpm dev:frontend    # All frontend apps
```

### Backend Specific

```bash
cd apps/backend

# Install dependencies (uses uv, not pip)
uv sync

# Run development server
PYTHONPATH=. uv run uvicorn app.main:app --reload
```

### Frontend Specific

Each Next.js app has its own package.json:

```bash
# Customer app
cd apps/customer
pnpm dev          # Start dev server

# Admin app
cd apps/admin
pnpm dev          # Start dev server

# Vendor app
cd apps/vendor
pnpm dev          # Start dev server
```

For testing, database management, and email workflows, use the `/testing`, `/database`, and `/emails` skills respectively.

## Backend Architecture (Domain-Driven Design)

The backend follows DDD with domains in `apps/backend/app/domains/`:

### Core Domains

- **auth/**: Authentication, JWT, OTP, password reset
- **users/**: User profiles and management
- **vendor/**: Vendor profiles, verification, store settings
- **catalog/**: Product listings, categories, pricing, tags, brands
- **shopping/**: Cart, orders, checkout, payments, shipping, coupons
- **payments/**: M-Pesa integration, payment processing
- **admin/**: System management, user management

### Key Backend Files

- `app/main.py`: FastAPI app with route registration, middleware, exception handlers
- `app/core/config.py`: Application settings (pydantic-settings)
- `app/core/database.py`: SQLAlchemy async setup with connection pooling
- `app/core/tasks.py`: Background tasks and cleanup schedulers
- `app/core/rate_limiting.py`: Rate limiting with Redis/in-memory fallback
- `app/core/middleware.py`: Request logging, content length limits

### API Structure

All routes are versioned at `/api/v1/`:

- `/api/v1/auth/*` - Authentication endpoints
- `/api/v1/catalog/*` - Product catalog management (admin/vendor)
- `/api/v1/storefront/*` - Public catalog for customers
- `/api/v1/shopping/*` - Cart, orders, checkout, payments
- `/api/v1/admin/*` - Admin and management functions

### Database

- Uses SQLAlchemy 2.0 with async support
- PostgreSQL is used (configured via `DATABASE_URL` in `.env`)
- Connection pooling configured for production
- Health check at `/health` includes DB and Redis status

For database migrations and setup, use the `/database` skill.

## Frontend Architecture

All Next.js apps use React 19 with TypeScript, Next.js 16 with App Router, Tailwind CSS v4, shadcn/ui components, TanStack Query for data fetching, and Zustand for state management. See individual `package.json` files for complete dependency lists.

### Admin Portal Features

- Drag-and-drop with @dnd-kit/core
- Data tables with TanStack Table
- Excel export with xlsx package
- Rich text editing with Lexical
- Real-time features with socket.io-client
- Bundle analysis with `pnpm build:analyze`

### Customer/Vendor Portal Features

- Maps integration with @googlemaps/js-api-loader
- Infinite scrolling with react-infinite-scroll-component
- Comprehensive checkout flow with 39 critical tests
- Pre-deploy validation scripts

## Email System

Emails use MJML for template generation with source templates in `apps/backend/templates/emails/` and compiled output in `apps/backend/compiled_emails/`. For email build workflows and local SMTP testing with Mailpit, use the `/emails` skill.

## Testing

For testing workflows across all applications (backend pytest, frontend critical tests, pre-deploy validation), use the `/testing` skill.

## Configuration

### Environment Variables

Backend uses `.env` with pydantic-settings for configuration (DATABASE_URL, ENVIRONMENT, SECRET_KEY, REDIS_URL for rate limiting).

### Package Management

- **pnpm** with workspaces for monorepo
- **uv** for Python backend dependencies  
- **Turborepo** for task orchestration
- **Turbopack** in development for Next.js apps

## Important Notes

### Next.js Version Warning

This uses Next.js 16 which has breaking changes from your training data. The AGENTS.md file in each frontend app warns:

> "This is NOT the Next.js you know. This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code."

### Backend Middleware Stack

1. CORS (allowing localhost:3000-3002)
2. RequestLoggingMiddleware
3. ContentLengthLimitMiddleware (configurable via settings.MAX_CONTENT_LENGTH)

### CORS Origins

The backend allows requests from:
- http://localhost:3000 (Customer)
- http://localhost:3001 (Admin)
- http://localhost:3002 (Vendor)
- http://127.0.0.1:3000-3002

### Rate Limiting

- Redis-based rate limiting with in-memory fallback
- Development endpoint at `/debug/reset-rate-limits` (blocked in production)
