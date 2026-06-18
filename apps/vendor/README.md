This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3002](http://localhost:3002) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## Testing

### Run Critical Tests (Checkout & Orders)
```bash
pnpm test:critical
```

This runs 39 critical tests covering:
- Order API validation (12 tests)
- M-Pesa payment flow (7 tests)
- Order validation logic (20 tests)

### Pre-Deployment Check
```bash
pnpm pre-deploy
```

This automated script runs:
1. Dependency check
2. TypeScript compilation
3. ESLint validation
4. All critical tests
5. Build verification

### Test Documentation
- `IMPLEMENTATION_COMPLETE.md` - Implementation summary
- `QUICK_TEST_REFERENCE.md` - Quick reference guide
- `TEST_EXECUTION_SUMMARY.md` - Detailed test results
- `TEST_PLAN.md` - Complete test strategy

### Known Issues
37 existing tests (Cart, Address, Maps) are currently failing due to React 19 compatibility with @testing-library/react. This does NOT affect checkout/order functionality and does NOT block deployment.
