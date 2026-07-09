# MyMedDevices

A modern medical device marketplace platform built as a monorepo using **pnpm workspaces** and **Turborepo** for task orchestration.

## 🏥 Platform Overview

MyMedDevices connects medical device vendors with healthcare providers through a comprehensive B2B marketplace. The platform enables vendors to list, manage, and sell medical equipment while providing healthcare providers with an easy way to discover and purchase essential medical devices.

## 🤖 Meet Medix

**Medix** is our AI-powered assistant that helps vendors create professional product listings. Medix leverages advanced language models to generate:

- **Product Descriptions** - Clinical narratives that highlight device features and benefits
- **Technical Specifications** - Structured technical specifications in JSON format
- **SEO Content** - Meta titles and descriptions for better search visibility
- **Product Tags** - Relevant tags for categorization and discovery
- **Short Descriptions** - Concise summaries for quick scanning

Vendors can access Medix through the product creation wizard in the vendor portal.

## 🚀 Quick Start

```sh
# Install dependencies
pnpm install

# Run all apps in development mode
pnpm dev

# Run specific apps
pnpm dev:backend      # Backend on port 8000
pnpm dev:customer    # Customer portal on port 3000
pnpm dev:admin       # Admin portal on port 3001
pnpm dev:vendor      # Vendor portal on port 3002

# Build all apps
pnpm build

# Run tests
pnpm test
```

## 📁 Monorepo Structure

```
apps/
  admin/          Next.js 16 — Admin dashboard for platform management
  vendor/         Next.js 16 — Vendor portal for product management
  customer/       Next.js 16 — Customer-facing storefront
  backend/        Python 3.12 FastAPI + asyncpg + SQLAlchemy
packages/
  shared-core/    Zustand stores, auth, API client (@mymeddevices/shared-core)
  shared-ui/      Reusable components, tailwind config (@mymeddevices/shared-ui)
  assets/         Logos and shared assets
```

## 🔧 Tech Stack

### Frontend (Next.js 16)
- **React 19** with TypeScript
- **Tailwind CSS v4** for styling
- **shadcn/ui** component library
- **TanStack Query** for data fetching
- **Zustand** for state management
- **Zod** for form validation

### Backend (Python)
- **FastAPI** with async support
- **SQLAlchemy 2.0** with async
- **PostgreSQL** in production, SQLite in development
- **Alembic** for database migrations
- **Pydantic** for data validation

## 📋 Key Features

### Vendor Portal
- **Product Wizard** - Guided product creation with Medix AI assistance
- **Media Management** - Image upload and gallery management
- **Inventory Tracking** - Stock levels and low stock alerts
- **Order Management** - View and manage incoming orders
- **Analytics Dashboard** - Sales performance and product metrics

### Admin Portal
- **Product Management** - Review, approve, and manage vendor products
- **User Administration** - Manage vendors and customers
- **Category Management** - Organize product categories
- **Brand Management** - Manage medical device brands
- **System Monitoring** - Platform health and metrics

### Customer Portal
- **Product Discovery** - Browse and search medical devices
- **Vendor Profiles** - View vendor information and credentials
- **Shopping Cart** - Add to cart and checkout
- **Order Tracking** - View order history and status

## 🔐 Security & Compliance

- **KMPDB Registration** - Track Kenya Medical Practitioners and Dentists Board registration
- **PPB Classification** - Pharmacy and Poisons Board device classification (Class A-D)
- **CE/FDA Clearance** - Track regulatory clearance information
- **Vendor Verification** - Multi-step vendor approval process
- **Product Review** - Admin approval before products go live

## 📄 License

Proprietary - All rights reserved

## 🤝 Support

For support inquiries, please contact the platform administrator.
