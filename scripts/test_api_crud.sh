#!/bin/bash

# Comprehensive CRUD API Test Script
# Tests Admin, Vendor, and Customer flows

set -e

BASE_URL="http://localhost:8000/api/v1"
RESULTS_DIR="/tmp/crud_test_results"
mkdir -p "$RESULTS_DIR"

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

pass_count=0
fail_count=0

log_test() {
    local test_name="$1"
    local status="$2"
    local details="$3"

    if [ "$status" = "PASS" ]; then
        echo -e "${GREEN}✓${NC} $test_name"
        ((pass_count++))
    else
        echo -e "${RED}✗${NC} $test_name"
        echo -e "  ${RED}ERROR:${NC} $details"
        ((fail_count++))
    fi
    echo "  $details" >> "$RESULTS_DIR/results.log"
}

# Step 1: Get auth tokens
echo "=== STEP 1: Authentication ==="

# Admin login
ADMIN_RESPONSE=$(curl -s -X POST "$BASE_URL/auth/login" \
    -H "Content-Type: application/json" \
    -d '{"email":"admin@example.com","password":"Test123!"}')

ADMIN_TOKEN=$(echo "$ADMIN_RESPONSE" | jq -r '.access_token // empty')

if [ -z "$ADMIN_TOKEN" ] || [ "$ADMIN_TOKEN" = "null" ]; then
    echo -e "${RED}Failed to get admin token${NC}"
    echo "Response: $ADMIN_RESPONSE"
    exit 1
fi

echo -e "${GREEN}Admin authenticated${NC}"

# Create a test vendor user
VENDOR_RESPONSE=$(curl -s -X POST "$BASE_URL/auth/register" \
    -H "Content-Type: application/json" \
    -d '{
        "email":"crud-test-vendor@example.com",
        "password":"VendorTest123!",
        "first_name":"Test",
        "last_name":"Vendor",
        "role":"vendor"
    }')

VENDOR_TOKEN=$(echo "$VENDOR_RESPONSE" | jq -r '.access_token // empty')

if [ -z "$VENDOR_TOKEN" ] || [ "$VENDOR_TOKEN" = "null" ]; then
    # Try logging in if user exists
    VENDOR_RESPONSE=$(curl -s -X POST "$BASE_URL/auth/login" \
        -H "Content-Type: application/json" \
        -d '{"email":"crud-test-vendor@example.com","password":"VendorTest123!"}')
    VENDOR_TOKEN=$(echo "$VENDOR_RESPONSE" | jq -r '.access_token // empty')
fi

if [ -z "$VENDOR_TOKEN" ] || [ "$VENDOR_TOKEN" = "null" ]; then
    echo -e "${YELLOW}Warning: Could not authenticate vendor${NC}"
    VENDOR_TOKEN=""
else
    echo -e "${GREEN}Vendor authenticated${NC}"
fi

# Step 2: Test Admin CRUD - Categories
echo ""
echo "=== STEP 2: Admin Category CRUD ==="

# Create category
CATEGORY_RESPONSE=$(curl -s -X POST "$BASE_URL/catalog/categories" \
    -H "Authorization: Bearer $ADMIN_TOKEN" \
    -H "Content-Type: application/json" \
    -d '{
        "name":"Test Category CRUD",
        "slug":"test-category-crud",
        "description":"Test category for CRUD operations",
        "is_active":true,
        "parent_id":null
    }')

CATEGORY_ID=$(echo "$CATEGORY_RESPONSE" | jq -r '.id // empty')
CATEGORY_STATUS=$(echo "$CATEGORY_RESPONSE" | jq -r '.status // "unknown"')

if [ -n "$CATEGORY_ID" ] && [ "$CATEGORY_ID" != "null" ]; then
    log_test "Create Category" "PASS" "Created category with ID: $CATEGORY_ID"
else
    log_test "Create Category" "FAIL" "Response: $CATEGORY_RESPONSE"
fi

# Read category
if [ -n "$CATEGORY_ID" ] && [ "$CATEGORY_ID" != "null" ]; then
    READ_CATEGORY=$(curl -s "$BASE_URL/catalog/categories/$CATEGORY_ID")
    READ_NAME=$(echo "$READ_CATEGORY" | jq -r '.name // empty')

    if [ "$READ_NAME" = "Test Category CRUD" ]; then
        log_test "Read Category" "PASS" "Category name matches: $READ_NAME"
    else
        log_test "Read Category" "FAIL" "Expected 'Test Category CRUD', got: $READ_NAME"
    fi

    # Update category
    UPDATE_RESPONSE=$(curl -s -X PATCH "$BASE_URL/catalog/categories/$CATEGORY_ID" \
        -H "Authorization: Bearer $ADMIN_TOKEN" \
        -H "Content-Type: application/json" \
        -d '{"description":"Updated description for CRUD test"}')

    UPDATED_DESC=$(echo "$UPDATE_RESPONSE" | jq -r '.description // empty')

    if [ "$UPDATED_DESC" = "Updated description for CRUD test" ]; then
        log_test "Update Category" "PASS" "Description updated successfully"
    else
        log_test "Update Category" "FAIL" "Response: $UPDATE_RESPONSE"
    fi
fi

# Step 3: Test Admin CRUD - Brands
echo ""
echo "=== STEP 3: Admin Brand CRUD ==="

# Create brand
BRAND_RESPONSE=$(curl -s -X POST "$BASE_URL/catalog/brands" \
    -H "Authorization: Bearer $ADMIN_TOKEN" \
    -H "Content-Type: application/json" \
    -d '{
        "name":"Test Brand CRUD",
        "slug":"test-brand-crud",
        "description":"Test brand for CRUD operations",
        "logo_url":null,
        "is_active":true,
        "approval_status":"approved"
    }')

BRAND_ID=$(echo "$BRAND_RESPONSE" | jq -r '.id // empty')

if [ -n "$BRAND_ID" ] && [ "$BRAND_ID" != "null" ]; then
    log_test "Create Brand" "PASS" "Created brand with ID: $BRAND_ID"
else
    log_test "Create Brand" "FAIL" "Response: $BRAND_RESPONSE"
fi

# Read brand
if [ -n "$BRAND_ID" ] && [ "$BRAND_ID" != "null" ]; then
    READ_BRAND=$(curl -s "$BASE_URL/catalog/brands/$BRAND_ID")
    READ_NAME=$(echo "$READ_BRAND" | jq -r '.name // empty')

    if [ "$READ_NAME" = "Test Brand CRUD" ]; then
        log_test "Read Brand" "PASS" "Brand name matches: $READ_NAME"
    else
        log_test "Read Brand" "FAIL" "Expected 'Test Brand CRUD', got: $READ_NAME"
    fi

    # Update brand
    UPDATE_RESPONSE=$(curl -s -X PATCH "$BASE_URL/catalog/brands/$BRAND_ID" \
        -H "Authorization: Bearer $ADMIN_TOKEN" \
        -H "Content-Type: application/json" \
        -d '{"description":"Updated brand description"}')

    UPDATED_DESC=$(echo "$UPDATE_RESPONSE" | jq -r '.description // empty')

    if [ "$UPDATED_DESC" = "Updated brand description" ]; then
        log_test "Update Brand" "PASS" "Description updated successfully"
    else
        log_test "Update Brand" "FAIL" "Response: $UPDATE_RESPONSE"
    fi
fi

# Step 4: Test Admin CRUD - Tags
echo ""
echo "=== STEP 4: Admin Tag CRUD ==="

# Create tag
TAG_RESPONSE=$(curl -s -X POST "$BASE_URL/catalog/tags" \
    -H "Authorization: Bearer $ADMIN_TOKEN" \
    -H "Content-Type: application/json" \
    -d '{
        "name":"test-tag-crud",
        "slug":"test-tag-crud",
        "is_active":true
    }')

TAG_ID=$(echo "$TAG_RESPONSE" | jq -r '.id // empty')

if [ -n "$TAG_ID" ] && [ "$TAG_ID" != "null" ]; then
    log_test "Create Tag" "PASS" "Created tag with ID: $TAG_ID"
else
    log_test "Create Tag" "FAIL" "Response: $TAG_RESPONSE"
fi

# Read tag
if [ -n "$TAG_ID" ] && [ "$TAG_ID" != "null" ]; then
    READ_TAG=$(curl -s "$BASE_URL/catalog/tags/$TAG_ID")
    READ_NAME=$(echo "$READ_TAG" | jq -r '.name // empty')

    if [ "$READ_NAME" = "test-tag-crud" ]; then
        log_test "Read Tag" "PASS" "Tag name matches: $READ_NAME"
    else
        log_test "Read Tag" "FAIL" "Expected 'test-tag-crud', got: $READ_NAME"
    fi
fi

# Step 5: Test Admin Product Creation
echo ""
echo "=== STEP 5: Admin Product CRUD ==="

# Create product
PRODUCT_RESPONSE=$(curl -s -X POST "$BASE_URL/catalog/products" \
    -H "Authorization: Bearer $ADMIN_TOKEN" \
    -H "Content-Type: application/json" \
    -d "{
        \"name\":\"Test Product CRUD\",
        \"slug\":\"test-product-crud\",
        \"description\":\"Test product for CRUD operations\",
        \"short_description\":\"Test CRUD product\",
        \"price\":999.99,
        \"currency\":\"KES\",
        \"category_id\":\"$CATEGORY_ID\",
        \"brand\":\"Test Brand CRUD\",
        \"model_number\":\"CRUD-001\",
        \"stock_quantity\":50,
        \"specifications\":{
            \"Material\":\"Test Material\",
            \"Dimensions\":\"10x10x10\",
            \"Weight\":\"1.0 kg\",
            \"Power Source\":\"Test\",
            \"Sterilization\":\"Test Method\"
        },
        \"tags\":[\"test-tag-crud\"]
    }")

PRODUCT_ID=$(echo "$PRODUCT_RESPONSE" | jq -r '.id // empty')

if [ -n "$PRODUCT_ID" ] && [ "$PRODUCT_ID" != "null" ]; then
    log_test "Create Product (Admin)" "PASS" "Created product with ID: $PRODUCT_ID"
else
    log_test "Create Product (Admin)" "FAIL" "Response: $PRODUCT_RESPONSE"
fi

# Read product
if [ -n "$PRODUCT_ID" ] && [ "$PRODUCT_ID" != "null" ]; then
    READ_PRODUCT=$(curl -s "$BASE_URL/catalog/products/$PRODUCT_ID" \
        -H "Authorization: Bearer $ADMIN_TOKEN")
    READ_NAME=$(echo "$READ_PRODUCT" | jq -r '.name // empty')

    if [ "$READ_NAME" = "Test Product CRUD" ]; then
        log_test "Read Product (Admin)" "PASS" "Product name matches: $READ_NAME"
    else
        log_test "Read Product (Admin)" "FAIL" "Expected 'Test Product CRUD', got: $READ_NAME"
    fi

    # Update product
    UPDATE_RESPONSE=$(curl -s -X PATCH "$BASE_URL/catalog/products/$PRODUCT_ID" \
        -H "Authorization: Bearer $ADMIN_TOKEN" \
        -H "Content-Type: application/json" \
        -d '{"description":"Updated product description for CRUD test"}')

    UPDATED_DESC=$(echo "$UPDATE_RESPONSE" | jq -r '.description // empty')

    if [ "$UPDATED_DESC" = "Updated product description for CRUD test" ]; then
        log_test "Update Product (Admin)" "PASS" "Description updated successfully"
    else
        log_test "Update Product (Admin)" "FAIL" "Response: $UPDATE_RESPONSE"
    fi
fi

# Save IDs for cleanup and further tests
echo "$CATEGORY_ID" > "$RESULTS_DIR/category_id.txt"
echo "$BRAND_ID" > "$RESULTS_DIR/brand_id.txt"
echo "$TAG_ID" > "$RESULTS_DIR/tag_id.txt"
echo "$PRODUCT_ID" > "$RESULTS_DIR/product_id.txt"
echo "$ADMIN_TOKEN" > "$RESULTS_DIR/admin_token.txt"
echo "$VENDOR_TOKEN" > "$RESULTS_DIR/vendor_token.txt"

echo ""
echo "=== STEP 1-5 SUMMARY ==="
echo "Passed: $pass_count"
echo "Failed: $fail_count"
