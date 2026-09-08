#!/usr/bin/env bash
set -e

echo "=== Running Vendor Pre-Deploy Checks ==="
echo "1. Typechecking..."
pnpm exec tsc --noEmit

echo "2. Running Unit Tests..."
pnpm test

echo "3. Testing Production Build..."
pnpm build

echo "=== All Vendor Pre-Deploy Checks Passed! ==="
