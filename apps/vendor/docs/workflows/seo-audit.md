---
description: Perform a comprehensive technical SEO audit for the MyMedDevices e-commerce platform
---

# SEO Audit Workflow for MyMedDevices

Perform a comprehensive technical SEO audit for the MyMedDevices e-commerce web application (Next.js).

When analyzing the codebase and/or live URL, act as a Senior Technical SEO Specialist with 12+ years of experience in e-commerce SEO. Systematically audit:

## Core Web Vitals & Performance
- LCP, FID/INP, CLS metrics
- Next.js image optimization (`next/image` usage)
- Server-side rendering (SSR) vs static generation (SSG) decisions
- React Query hydration and data prefetching patterns
- Bundle size and code splitting
- Font loading strategy (Google Fonts usage)

## Crawlability & Indexation
- Meta tags in `layout.tsx` and page-level metadata
- `robots.txt` configuration
- XML sitemap generation (next-sitemap or similar)
- Canonical URLs on product, category, and offer pages
- Dynamic route handling (`/products/[slug]`, `/categories/[slug]`)

## Mobile & Responsiveness
- Tailwind responsive breakpoints (sm, md, lg, xl)
- Touch target sizes for product cards and navigation
- Mobile viewport configuration

## Security & HTTPS
- HTTPS enforcement
- Sentry error monitoring configuration
- Environment variable exposure

## Structured Data & Schema Markup
- Product schema (price, availability, reviews)
- Organization/breadcrumb schema
- FAQ schema where applicable

## Internal Linking & Architecture
- Navigation structure (header, footer, breadcrumbs)
- Category → Product linking depth
- Related products and cross-selling links
- Checkout flow internal links

## E-Commerce Specific
- Product page SEO (titles, descriptions, images)
- Category page optimization
- Pagination and infinite scroll SEO implications
- Out-of-stock product handling
- Offers/deals page indexation

## Duplicate Content
- Parameter handling (filters, sorting)
- Canonical tags implementation
- Product variants handling

## Process

1. First, ask one natural question to identify the primary goal:
   - Driving organic traffic to product pages?
   - Improving Core Web Vitals scores?
   - Preparing for a migration or major update?
   - Fixing specific indexation issues?

2. Then present findings as:
   - **Critical Issues** – Fix immediately (high SEO/revenue impact)
   - **Important Optimizations** – Fix soon (medium impact)
   - **Recommended Enhancements** – Nice to have

3. For each issue, provide:
   - What's wrong and why it matters for an e-commerce medical devices site
   - Step-by-step fix instructions (with specific file paths like `app/layout.tsx`, `next.config.ts`, etc.)
   - Expected improvement (traffic, ranking, or UX)
   - How to validate (Lighthouse, Search Console, or programmatic checks)

4. Prioritize recommendations by SEO impact × implementation difficulty, recognizing this is a medical/healthcare e-commerce site where trust signals and page experience are critical ranking factors.
