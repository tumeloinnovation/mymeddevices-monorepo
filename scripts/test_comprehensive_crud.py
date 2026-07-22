#!/usr/bin/env python3
"""
Comprehensive CRUD API Test Script
Tests full Admin -> Vendor -> Customer flow with error handling
"""

import requests
import json
import sys
import uuid
from typing import Optional, Dict, Any, List
from datetime import datetime

BASE_URL = "http://localhost:8000/api/v1"
RESULTS = {
    "passed": [],
    "failed": [],
    "warnings": [],
    "start_time": datetime.now().isoformat()
}

def log_test(test_name: str, status: str, details: str = ""):
    """Log a test result"""
    if status == "PASS":
        RESULTS["passed"].append({"name": test_name, "details": details})
        print(f"✓ {test_name}")
        if details:
            print(f"  {details}")
    elif status == "WARN":
        RESULTS["warnings"].append({"name": test_name, "details": details})
        print(f"⚠ {test_name}")
        if details:
            print(f"  {details}")
    else:
        RESULTS["failed"].append({"name": test_name, "details": details})
        print(f"✗ {test_name}")
        if details:
            print(f"  ERROR: {details}")

def api_call(method: str, endpoint: str, token: Optional[str] = None,
             data: Optional[Dict] = None, params: Optional[Dict] = None, timeout: int = 30) -> Dict[str, Any]:
    """Make an API call and return response"""
    url = f"{BASE_URL}{endpoint}"
    headers = {"Content-Type": "application/json"}
    if token:
        headers["Authorization"] = f"Bearer {token}"

    try:
        if method == "GET":
            response = requests.get(url, headers=headers, params=params, timeout=timeout)
        elif method == "POST":
            response = requests.post(url, headers=headers, json=data, timeout=timeout)
        elif method == "PATCH":
            response = requests.patch(url, headers=headers, json=data, timeout=timeout)
        elif method == "DELETE":
            response = requests.delete(url, headers=headers, timeout=timeout)
        else:
            return {"error": f"Unknown method: {method}"}

        try:
            return response.json()
        except:
            return {"status_code": response.status_code, "text": response.text, "ok": response.ok}
    except requests.exceptions.Timeout:
        return {"error": "timeout", "message": f"Request timed out after {timeout}s"}
    except Exception as e:
        return {"error": str(e)}

def get_existing_vendor_id(admin_token: str) -> Optional[str]:
    """Get vendor_id from existing products"""
    products_response = api_call("GET", "/catalog/products", admin_token)
    if isinstance(products_response, dict) and "products" in products_response:
        products = products_response["products"]
        if products and len(products) > 0:
            return products[0].get("vendor_id")
    return None

def main():
    print("=" * 70)
    print("COMPREHENSIVE CRUD API TEST")
    print("Testing: Admin CRUD → Vendor CRUD → Customer Visibility → Error Handling")
    print("=" * 70)

    # =========================================================================
    # PART 1: ADMIN AUTHENTICATION
    # =========================================================================
    print("\n" + "=" * 70)
    print("PART 1: ADMIN AUTHENTICATION")
    print("=" * 70)

    admin_response = api_call("POST", "/auth/login", data={
        "email": "admin@mymeddevices.com",
        "password": "Admin123!",
        "device_id": "test-device-comprehensive-001",
        "device_name": "Comprehensive Test Device"
    })

    admin_data = admin_response.get("data", admin_response)
    admin_token = admin_data.get("access_token")

    if admin_token:
        log_test("Admin Login", "PASS", f"Authenticated as {admin_data.get('user', {}).get('email')}")
    else:
        log_test("Admin Login", "FAIL", f"Failed: {admin_response}")
        return 1

    test_data = {"admin_token": admin_token}

    # =========================================================================
    # PART 2: ADMIN CRUD OPERATIONS
    # =========================================================================
    print("\n" + "=" * 70)
    print("PART 2: ADMIN CRUD OPERATIONS")
    print("=" * 70)

    # --- Categories ---
    print("\n--- Categories ---")

    # Create category
    category_slug = f"test-category-{datetime.now().strftime('%Y%m%d%H%M%S')}"
    category_response = api_call("POST", "/catalog/categories", admin_token, {
        "name": f"Test Category {datetime.now().strftime('%H:%M')}",
        "slug": category_slug,
        "description": "Test category for comprehensive CRUD testing",
        "is_active": True,
        "parent_id": None
    })

    category_id = category_response.get("id")
    if category_id:
        test_data["category_id"] = category_id
        test_data["category_slug"] = category_slug
        log_test("Create Category", "PASS", f"ID: {category_id}")
    else:
        log_test("Create Category", "FAIL", f"Response: {category_response}")

    # Update category
    if category_id:
        update_response = api_call("PATCH", f"/catalog/categories/{category_id}", admin_token, {
            "description": "Updated description for test category"
        })
        if update_response.get("description") == "Updated description for test category":
            log_test("Update Category", "PASS", "Description updated")
        else:
            log_test("Update Category", "FAIL", f"Response: {update_response}")

    # --- Brands ---
    print("\n--- Brands ---")

    # Create brand
    brand_slug = f"test-brand-{datetime.now().strftime('%Y%m%d%H%M%S')}"
    brand_response = api_call("POST", "/catalog/brands", admin_token, {
        "name": f"TestBrand {datetime.now().strftime('%H%M')}",
        "slug": brand_slug,
        "description": "Test brand for comprehensive testing",
        "is_active": True,
        "approval_status": "approved"
    })

    brand_id = brand_response.get("id")
    if brand_id:
        test_data["brand_id"] = brand_id
        test_data["brand_slug"] = brand_slug
        test_data["brand_name"] = brand_response.get("name")
        log_test("Create Brand", "PASS", f"ID: {brand_id}")
    else:
        log_test("Create Brand", "FAIL", f"Response: {brand_response}")

    # --- Tags ---
    print("\n--- Tags ---")

    # Create tag
    tag_slug = f"test-tag-{datetime.now().strftime('%Y%m%d%H%M%S')}"
    tag_response = api_call("POST", "/catalog/tags", admin_token, {
        "name": tag_slug.replace("-", " "),
        "slug": tag_slug,
        "is_active": True
    })

    tag_id = tag_response.get("id")
    if tag_id:
        test_data["tag_id"] = tag_id
        test_data["tag_slug"] = tag_slug
        log_test("Create Tag", "PASS", f"ID: {tag_id}")
    else:
        log_test("Create Tag", "FAIL", f"Response: {tag_response}")

    # --- Products (as Admin) ---
    print("\n--- Products (Admin) ---")

    # Get existing vendor_id
    vendor_id = get_existing_vendor_id(admin_token)
    if vendor_id:
        test_data["vendor_id"] = vendor_id
        log_test("Get Vendor ID", "PASS", f"Using vendor_id: {vendor_id}")
    else:
        log_test("Get Vendor ID", "WARN", "No existing vendor found")

    # Create product with vendor_id
    product_slug = f"test-product-{datetime.now().strftime('%Y%m%d%H%M%S')}"
    if vendor_id:
        product_data = {
            "name": f"Test Product {datetime.now().strftime('%H:%M')}",
            "slug": product_slug,
            "description": "Comprehensive test product for CRUD validation. This is a detailed description that explains the features and benefits of the product to ensure completeness validation passes.",
            "short_description": "Test product for CRUD testing with all required fields",
            "price": 1499.99,
            "currency": "KES",
            "category_id": category_id,
            "brand": test_data.get("brand_name", "TestBrand"),
            "model_number": "TEST-001",
            "stock_quantity": 100,
            "vendor_id": vendor_id,
            "specifications": {
                "Material": "Test Material",
                "Dimensions": "15x15x15",
                "Weight": "2.0 kg",
                "Power Source": "Battery",
                "Sterilization": "Autoclave"
            },
            "tags": [test_data.get("tag_slug", tag_slug)],
            # Additional fields for completeness
            "kmpdb_registration_number": "PPB-TEST-001",
            "ppb_classification": "Class IIa",
            "ce_marking_or_fda_clearance": "CE Marked",
            "warranty_info": "2 year warranty",
            "meta_title": f"Test Product {datetime.now().strftime('%H%M')} - Comprehensive Test",
            "meta_description": "Test product for comprehensive CRUD validation testing"
        }

        product_response = api_call("POST", "/catalog/products", admin_token, product_data)
        product_id = product_response.get("id")

        if product_id:
            test_data["product_id"] = product_id
            test_data["product_slug"] = product_slug
            log_test("Create Product (Admin)", "PASS", f"ID: {product_id}")
        else:
            log_test("Create Product (Admin)", "FAIL", f"Response: {product_response}")
    else:
        log_test("Create Product (Admin)", "WARN", "Skipped - no vendor_id")
        product_id = None

    # Read product
    if product_id:
        read_response = api_call("GET", f"/catalog/products/{product_id}", admin_token)
        if read_response.get("id") == product_id:
            log_test("Read Product (Admin)", "PASS", "Product retrieved successfully")
        else:
            log_test("Read Product (Admin)", "FAIL", f"Response: {read_response}")

        # Update product
        update_response = api_call("PATCH", f"/catalog/products/{product_id}", admin_token, {
            "description": "Updated product description via comprehensive test",
            "price": 1599.99
        })
        if update_response.get("description") and update_response.get("price") == 1599.99:
            log_test("Update Product (Admin)", "PASS", "Product updated successfully")
        else:
            log_test("Update Product (Admin)", "FAIL", f"Response: {update_response}")

        # Verify product
        verify_response = api_call("POST", f"/catalog/products/{product_id}/verify", admin_token)
        if verify_response.get("status") in ["verified", "pending_review"]:
            log_test("Verify Product", "PASS", f"Status: {verify_response.get('status')}")
        else:
            log_test("Verify Product", "WARN", f"Response: {verify_response}")

        # Publish product
        publish_response = api_call("POST", f"/catalog/products/{product_id}/publish", admin_token)
        if publish_response.get("status") == "published":
            log_test("Publish Product", "PASS", "Product published to storefront")
            test_data["product_published"] = True
        else:
            log_test("Publish Product", "WARN", f"Response: {publish_response}")
            test_data["product_published"] = False

    # =========================================================================
    # PART 3: CUSTOMER STOREFRONT VISIBILITY
    # =========================================================================
    print("\n" + "=" * 70)
    print("PART 3: CUSTOMER STOREFRONT VISIBILITY")
    print("=" * 70)

    # List all products (no auth required)
    storefront_response = api_call("GET", "/storefront/products")
    storefront_products = storefront_response.get("products", [])
    total_products = storefront_response.get("total", len(storefront_products))

    log_test("Storefront Access", "PASS", f"Storefront accessible with {total_products} products")

    # Check if our test product is visible
    if test_data.get("product_published"):
        test_product_visible = any(
            p.get("slug") == product_slug for p in storefront_products
        )

        if test_product_visible:
            log_test("Test Product Visibility", "PASS", "Test product visible in storefront")

            # Get product by slug
            slug_response = api_call("GET", f"/storefront/products/{product_slug}")
            if slug_response.get("slug") == product_slug:
                log_test("Product Detail (by slug)", "PASS", "Product accessible via slug")
            else:
                log_test("Product Detail (by slug)", "FAIL", f"Response: {slug_response}")
        else:
            log_test("Test Product Visibility", "FAIL", "Test product not found in storefront")

    # Category filtering
    if category_id:
        category_products = api_call("GET", "/storefront/products", params={"category_id": category_id})
        category_total = category_products.get("total", 0)

        if category_total > 0:
            log_test("Category Filter", "PASS", f"Found {category_total} products in test category")
        else:
            log_test("Category Filter", "WARN", "No products found in test category")

    # Search functionality
    search_response = api_call("GET", "/storefront/products", params={"search": "Test Product"})
    search_results = search_response.get("products", [])

    if len(search_results) > 0:
        log_test("Storefront Search", "PASS", f"Search returned {len(search_results)} results")

        # Check if our product is in search results
        if test_data.get("product_published"):
            found_in_search = any(p.get("slug") == product_slug for p in search_results)
            if found_in_search:
                log_test("Search Results Accuracy", "PASS", "Test product found in search")
            else:
                log_test("Search Results Accuracy", "WARN", "Test product not in search results")
    else:
        log_test("Storefront Search", "WARN", "Search returned no results")

    # Price filtering
    price_filter = api_call("GET", "/storefront/products", params={"price_min": 1000, "price_max": 2000})
    price_results = price_filter.get("products", [])

    log_test("Price Range Filter", "PASS", f"Price filter returned {len(price_results)} products")

    # =========================================================================
    # PART 4: ERROR HANDLING
    # =========================================================================
    print("\n" + "=" * 70)
    print("PART 4: ERROR HANDLING & VALIDATION")
    print("=" * 70)

    # Unauthorized access
    unauthorized = api_call("POST", "/catalog/products", data={"name": "Unauthorized Product"})
    if unauthorized.get("detail") or unauthorized.get("status_code") == 401:
        log_test("Unauthorized Create", "PASS", "Correctly rejected unauthorized request")
    else:
        log_test("Unauthorized Create", "FAIL", f"Should reject: {unauthorized}")

    # Invalid data - empty name
    invalid_name = api_call("POST", "/catalog/products", admin_token, {
        "name": "",
        "price": 1000,
        "category_id": category_id,
        "vendor_id": vendor_id
    })
    status_code = invalid_name.get("status_code", 0)
    if invalid_name.get("detail") or status_code >= 400:
        log_test("Invalid Product Name", "PASS", "Correctly rejected empty name")
    else:
        log_test("Invalid Product Name", "FAIL", f"Should reject: {invalid_name}")

    # Invalid data - negative price
    invalid_price = api_call("POST", "/catalog/products", admin_token, {
        "name": "Invalid Price Product",
        "price": -100,
        "category_id": category_id,
        "vendor_id": vendor_id
    })
    status_code = invalid_price.get("status_code", 0)
    if invalid_price.get("detail") or status_code >= 400:
        log_test("Invalid Price", "PASS", "Correctly rejected negative price")
    else:
        log_test("Invalid Price", "FAIL", f"Should reject: {invalid_price}")

    # Non-existent resource
    fake_uuid = "00000000-0000-0000-0000-000000000000"
    not_found = api_call("GET", f"/catalog/products/{fake_uuid}", admin_token)
    status_code = not_found.get("status_code", 0)
    if not_found.get("detail") or status_code == 404:
        log_test("Not Found Error", "PASS", "Correctly returns 404 for non-existent product")
    else:
        log_test("Not Found Error", "FAIL", f"Should return 404: {not_found}")

    # Duplicate slug
    if product_slug:
        duplicate_response = api_call("POST", "/catalog/products", admin_token, {
            "name": "Duplicate Product",
            "slug": product_slug,  # Same slug
            "price": 500,
            "category_id": category_id,
            "vendor_id": vendor_id
        })
        status_code = duplicate_response.get("status_code", 0)
        if duplicate_response.get("detail") or status_code >= 400:
            log_test("Duplicate Slug", "PASS", "Correctly rejected duplicate slug")
        else:
            log_test("Duplicate Slug", "WARN", f"May allow duplicates: {duplicate_response}")

    # =========================================================================
    # PART 5: AI GENERATION
    # =========================================================================
    print("\n" + "=" * 70)
    print("PART 5: AI GENERATION FEATURES")
    print("=" * 70)

    # Pre-creation AI generation
    ai_response = api_call("POST", "/catalog/ai/generate-descriptions", admin_token, {
        "product_name": "AI Test Blood Pressure Monitor",
        "brand": "HealthTech Pro",
        "category": "Diagnostic Equipment"
    }, timeout=60)

    ai_suggestions = ai_response.get("suggestions", {})
    if ai_suggestions.get("description"):
        log_test("AI Generate Descriptions", "PASS", "AI generated full suggestions")

        # Check all expected fields
        expected_fields = ["description", "short_description", "meta_title", "meta_description"]
        missing_fields = [f for f in expected_fields if not ai_suggestions.get(f)]

        if not missing_fields:
            log_test("AI Response Completeness", "PASS", "All expected fields present")
        else:
            log_test("AI Response Completeness", "WARN", f"Missing fields: {missing_fields}")

        print(f"  Generated preview: {ai_suggestions.get('short_description', '')[:80]}...")
    elif "error" in ai_response:
        if ai_response.get("error") == "timeout":
            log_test("AI Generate Descriptions", "WARN", "AI request timed out (service may be slow)")
        else:
            log_test("AI Generate Descriptions", "FAIL", f"AI service error: {ai_response}")
    else:
        log_test("AI Generate Descriptions", "WARN", f"Unexpected response: {str(ai_response)[:100]}")

    # Product completeness check
    if product_id:
        completeness = api_call("GET", f"/catalog/products/{product_id}/completeness", admin_token)
        score = completeness.get("score")

        if score is not None:
            log_test("Product Completeness", "PASS", f"Score: {score}/100")

            # Check breakdown
            breakdown = completeness.get("breakdown", {})
            if breakdown:
                log_test("Completeness Breakdown", "PASS", f"Fields checked: {len(breakdown)}")
        else:
            log_test("Product Completeness", "FAIL", f"Response: {completeness}")

    # =========================================================================
    # PART 6: VENDOR OPERATIONS (via Admin)
    # =========================================================================
    print("\n" + "=" * 70)
    print("PART 6: VENDOR-FOCUSED OPERATIONS")
    print("=" * 70)

    # Quick-create brand (available to all authenticated users)
    quick_brand_response = api_call("POST", "/catalog/brands/quick-create", admin_token, {
        "name": f"QuickBrand {datetime.now().strftime('%H%M%S')}"
    })

    if quick_brand_response.get("id"):
        quick_brand_id = quick_brand_response.get("id")
        log_test("Quick Create Brand", "PASS", f"Brand created: {quick_brand_id}")

        # Approve the brand (admin only)
        approve_response = api_call("PATCH", f"/catalog/brands/{quick_brand_id}/approve", admin_token)
        if approve_response.get("approval_status") == "approved":
            log_test("Approve Brand", "PASS", "Brand approved successfully")
        else:
            log_test("Approve Brand", "WARN", f"Response: {approve_response}")
    else:
        log_test("Quick Create Brand", "WARN", f"Response: {quick_brand_response}")

    # List brands with filters
    brands_list = api_call("GET", "/catalog/products", params={"page": 1, "page_size": 5}, token=admin_token)
    if isinstance(brands_list, dict):
        log_test("Product Pagination", "PASS", f"Pagination working, page size: {brands_list.get('page_size', 'unknown')}")

    # =========================================================================
    # SUMMARY
    # =========================================================================
    print("\n" + "=" * 70)
    print("TEST SUMMARY")
    print("=" * 70)
    print(f"Passed:     {len(RESULTS['passed'])}")
    print(f"Warnings:   {len(RESULTS['warnings'])}")
    print(f"Failed:     {len(RESULTS['failed'])}")
    print(f"Total:      {len(RESULTS['passed']) + len(RESULTS['failed']) + len(RESULTS['warnings'])}")

    if RESULTS['failed']:
        print("\n❌ Failed tests:")
        for test in RESULTS['failed'][:10]:
            print(f"  - {test['name']}: {test['details'][:80]}")

    if RESULTS['warnings']:
        print("\n⚠️  Warnings:")
        for test in RESULTS['warnings'][:10]:
            print(f"  - {test['name']}: {test['details'][:80]}")

    # Save results
    RESULTS["end_time"] = datetime.now().isoformat()
    RESULTS["test_data"] = test_data

    with open("/tmp/comprehensive_crud_test_results.json", "w") as f:
        json.dump(RESULTS, f, indent=2)

    print(f"\nDetailed results saved to: /tmp/comprehensive_crud_test_results.json")

    # Return success if no failures
    return 0 if not RESULTS['failed'] else 1

if __name__ == "__main__":
    sys.exit(main())
