#!/usr/bin/env python3
"""
Comprehensive CRUD API Test Script
Tests Admin, Vendor, and Customer flows
"""

import requests
import json
import sys
from typing import Optional, Dict, Any
from datetime import datetime

BASE_URL = "http://localhost:8000/api/v1"
RESULTS = {
    "passed": [],
    "failed": [],
    "start_time": datetime.now().isoformat()
}

def log_test(test_name: str, status: str, details: str = ""):
    """Log a test result"""
    if status == "PASS":
        RESULTS["passed"].append({"name": test_name, "details": details})
        print(f"✓ {test_name}")
        if details:
            print(f"  {details}")
    else:
        RESULTS["failed"].append({"name": test_name, "details": details})
        print(f"✗ {test_name}")
        if details:
            print(f"  ERROR: {details}")

def api_call(method: str, endpoint: str, token: Optional[str] = None,
             data: Optional[Dict] = None, expect_status: int = 200) -> Dict[str, Any]:
    """Make an API call and return response"""
    url = f"{BASE_URL}{endpoint}"
    headers = {"Content-Type": "application/json"}
    if token:
        headers["Authorization"] = f"Bearer {token}"

    try:
        if method == "GET":
            response = requests.get(url, headers=headers, timeout=10)
        elif method == "POST":
            response = requests.post(url, headers=headers, json=data, timeout=10)
        elif method == "PATCH":
            response = requests.patch(url, headers=headers, json=data, timeout=10)
        elif method == "DELETE":
            response = requests.delete(url, headers=headers, timeout=10)
        else:
            return {"error": f"Unknown method: {method}"}

        try:
            return response.json()
        except:
            return {"status_code": response.status_code, "text": response.text}
    except Exception as e:
        return {"error": str(e)}

def save_results(data: Dict[str, Any]):
    """Save test data for cleanup and further tests"""
    with open("/tmp/crud_test_data.json", "w") as f:
        json.dump(data, f, indent=2)

def main():
    print("=" * 60)
    print("CRUD API Test Suite")
    print("=" * 60)

    # Step 1: Authentication
    print("\n=== STEP 1: Authentication ===")

    # Admin login (using dev database credentials)
    admin_response = api_call("POST", "/auth/login", data={
        "email": "admin@mymeddevices.com",
        "password": "Admin123!",
        "device_id": "test-device-crud-001",
        "device_name": "Test CRUD Device"
    })

    # The API wraps the response in a 'data' object
    admin_data = admin_response.get("data", admin_response)
    admin_token = admin_data.get("access_token")
    if admin_token:
        print("✓ Admin authenticated")
    else:
        print(f"✗ Admin authentication failed: {admin_response}")
        return

    # Create or login test vendor
    vendor_email = "crud-test-vendor@example.com"
    vendor_password = "VendorTest123!"

    # Try to login vendor (if already exists)
    vendor_response = api_call("POST", "/auth/login", data={
        "email": vendor_email,
        "password": vendor_password,
        "device_id": "test-device-crud-vendor-001",
        "device_name": "Test Vendor CRUD Device"
    })
    vendor_data = vendor_response.get("data", vendor_response)
    vendor_token = vendor_data.get("access_token")

    if vendor_token:
        print("✓ Vendor authenticated")
    else:
        print(f"⚠ Vendor authentication failed: {vendor_response}")
        vendor_token = None

    test_data = {"admin_token": admin_token, "vendor_token": vendor_token}

    # Step 2: Category CRUD
    print("\n=== STEP 2: Category CRUD ===")

    # Create category
    category_data = {
        "name": "Test Category CRUD",
        "slug": "test-category-crud",
        "description": "Test category for CRUD operations",
        "is_active": True,
        "parent_id": None
    }

    category_response = api_call("POST", "/catalog/categories", admin_token, category_data)
    category_id = category_response.get("id")

    if category_id:
        log_test("Create Category", "PASS", f"ID: {category_id}")
        test_data["category_id"] = category_id

        # Read category - categories API returns list, we need to find ours
        read_response = api_call("GET", "/catalog/categories")
        categories = read_response if isinstance(read_response, list) else read_response.get("categories", read_response.get("data", []))
        found = False
        for cat in categories:
            if cat.get("id") == category_id or cat.get("slug") == "test-category-crud":
                if cat.get("name") == "Test Category CRUD":
                    log_test("Read Category", "PASS", "Name matches in category list")
                    found = True
                break
        if not found:
            log_test("Read Category", "FAIL", f"Category not found in list. Response: {read_response}")

        # Update category
        update_response = api_call("PATCH", f"/catalog/categories/{category_id}", admin_token, {
            "description": "Updated description for CRUD test"
        })
        if update_response.get("description") == "Updated description for CRUD test":
            log_test("Update Category", "PASS", "Description updated")
        else:
            log_test("Update Category", "FAIL", f"Update failed: {update_response}")
    else:
        log_test("Create Category", "FAIL", f"Response: {category_response}")

    # Step 3: Brand CRUD
    print("\n=== STEP 3: Brand CRUD ===")

    brand_data = {
        "name": "Test Brand CRUD",
        "slug": "test-brand-crud",
        "description": "Test brand for CRUD operations",
        "logo_url": None,
        "is_active": True,
        "approval_status": "approved"
    }

    brand_response = api_call("POST", "/catalog/brands", admin_token, brand_data)
    brand_id = brand_response.get("id")

    if brand_id:
        log_test("Create Brand", "PASS", f"ID: {brand_id}")
        test_data["brand_id"] = brand_id

        # Read brand
        read_response = api_call("GET", f"/catalog/brands/{brand_id}")
        if read_response.get("name") == "Test Brand CRUD":
            log_test("Read Brand", "PASS", "Name matches")
        else:
            log_test("Read Brand", "FAIL", f"Name mismatch: {read_response}")

        # Update brand
        update_response = api_call("PATCH", f"/catalog/brands/{brand_id}", admin_token, {
            "description": "Updated brand description"
        })
        if update_response.get("description") == "Updated brand description":
            log_test("Update Brand", "PASS", "Description updated")
        else:
            log_test("Update Brand", "FAIL", f"Update failed: {update_response}")
    else:
        log_test("Create Brand", "FAIL", f"Response: {brand_response}")

    # Step 4: Tag CRUD
    print("\n=== STEP 4: Tag CRUD ===")

    tag_data = {
        "name": "test-tag-crud",
        "slug": "test-tag-crud",
        "is_active": True
    }

    tag_response = api_call("POST", "/catalog/tags", admin_token, tag_data)
    tag_id = tag_response.get("id")

    if tag_id:
        log_test("Create Tag", "PASS", f"ID: {tag_id}")
        test_data["tag_id"] = tag_id

        # Read tag
        read_response = api_call("GET", f"/catalog/tags/{tag_id}")
        if read_response.get("name") == "test-tag-crud":
            log_test("Read Tag", "PASS", "Name matches")
        else:
            log_test("Read Tag", "FAIL", f"Name mismatch: {read_response}")
    else:
        log_test("Create Tag", "FAIL", f"Response: {tag_response}")

    # Step 5: Create a test vendor for product creation
    print("\n=== STEP 5: Vendor Setup for Products ===")

    # First, let's check if there's an existing vendor we can use
    vendors_list = api_call("GET", "/catalog/vendors", admin_token)  # Try to get vendors list
    # If that doesn't work, we'll create a vendor user
    test_vendor_id = None

    # For now, let's try to get the vendor from vendor_token if we have one
    if vendor_token:
        # Get vendor user info
        me_response = api_call("GET", "/auth/me", vendor_token)
        test_vendor_id = me_response.get("id")

    if not test_vendor_id:
        # Try using the vendor user from the login
        vendor_create_response = api_call("POST", "/auth/register", data={
            "email": "test-product-vendor@example.com",
            "password": "VendorTest123!",
            "role": "vendor",
            "first_name": "Product",
            "last_name": "Vendor",
            "company_name": "Test Product Vendor Ltd",
            "phone": "+254712345678",
            "address_street": "Nairobi",
            "latitude": -1.3011758537859464,
            "longitude": 36.800690681948126
        })
        # Vendor registration requires OTP verification, so we'll skip this for now
        # and instead use a workaround or existing vendor

    # Check if we can get any vendor from the system
    # For testing, let's use a workaround - the admin will create the product
    # but we need a vendor_id. Let's check if there's one we can use.

    # For now, let's try to list products to see existing vendors
    products_list = api_call("GET", "/catalog/products", admin_token)
    if products_list and isinstance(products_list, list) and len(products_list) > 0:
        test_vendor_id = products_list[0].get("vendor_id")
        print(f"Using existing vendor_id: {test_vendor_id}")
    else:
        print("⚠ No existing vendor found, product creation may fail")

    # Step 6: Product CRUD (Admin)
    print("\n=== STEP 6: Product CRUD (Admin) ===")

    product_data = {
        "name": "Test Product CRUD",
        "slug": "test-product-crud",
        "description": "Test product for CRUD operations",
        "short_description": "Test CRUD product",
        "price": 999.99,
        "currency": "KES",
        "category_id": test_data.get("category_id"),
        "brand": "Test Brand CRUD",
        "model_number": "CRUD-001",
        "stock_quantity": 50,
        "specifications": {
            "Material": "Test Material",
            "Dimensions": "10x10x10",
            "Weight": "1.0 kg",
            "Power Source": "Test",
            "Sterilization": "Test Method"
        },
        "tags": ["test-tag-crud"]
    }

    # Add vendor_id if we found one
    if test_vendor_id:
        product_data["vendor_id"] = test_vendor_id

    product_response = api_call("POST", "/catalog/products", admin_token, product_data)
    product_id = product_response.get("id")

    if product_id:
        log_test("Create Product (Admin)", "PASS", f"ID: {product_id}")
        test_data["product_id"] = product_id

        # Read product
        read_response = api_call("GET", f"/catalog/products/{product_id}", admin_token)
        if read_response.get("name") == "Test Product CRUD":
            log_test("Read Product (Admin)", "PASS", "Name matches")
        else:
            log_test("Read Product (Admin)", "FAIL", f"Name mismatch: {read_response}")

        # Update product
        update_response = api_call("PATCH", f"/catalog/products/{product_id}", admin_token, {
            "description": "Updated product description for CRUD test"
        })
        if update_response.get("description") == "Updated product description for CRUD test":
            log_test("Update Product (Admin)", "PASS", "Description updated")
        else:
            log_test("Update Product (Admin)", "FAIL", f"Update failed: {update_response}")
    else:
        log_test("Create Product (Admin)", "FAIL", f"Response: {product_response}")

    # Step 7: Product Lifecycle
    print("\n=== STEP 7: Product Lifecycle ===")

    if product_id:
        # Verify product
        verify_response = api_call("POST", f"/catalog/products/{product_id}/verify", admin_token)
        if verify_response.get("status") in ["verified", "pending_review"]:
            log_test("Verify Product", "PASS", f"Status: {verify_response.get('status')}")
        else:
            log_test("Verify Product", "FAIL", f"Response: {verify_response}")

        # Publish product
        publish_response = api_call("POST", f"/catalog/products/{product_id}/publish", admin_token)
        if publish_response.get("status") == "published":
            log_test("Publish Product", "PASS", "Product published to storefront")
        else:
            log_test("Publish Product", "FAIL", f"Response: {publish_response}")

    # Step 8: Customer Storefront Visibility
    print("\n=== STEP 8: Customer Storefront Visibility ===")

    # List all products
    storefront_response = api_call("GET", "/storefront/products")
    storefront_products = storefront_response.get("products", [])

    # Check if our test product is visible
    test_product_visible = any(
        p.get("slug") == "test-product-crud" for p in storefront_products
    )

    if test_product_visible:
        log_test("Storefront Product List", "PASS", "Test product visible in storefront")
    else:
        log_test("Storefront Product List", "FAIL", f"Test product not found. Total: {len(storefront_products)}")

    # Get product by slug
    if test_product_visible:
        slug_response = api_call("GET", "/storefront/products/test-product-crud")
        if slug_response.get("slug") == "test-product-crud":
            log_test("Storefront Product Detail", "PASS", "Product accessible by slug")
        else:
            log_test("Storefront Product Detail", "FAIL", f"Response: {slug_response}")

    # Category filtering
    if category_id:
        category_products = api_call("GET", "/storefront/products", data={"category_id": category_id})
        if category_products.get("total", 0) > 0:
            log_test("Category Filter", "PASS", f"Found {category_products.get('total')} products")
        else:
            log_test("Category Filter", "FAIL", "No products found in test category")

    # Step 9: Error Handling Tests
    print("\n=== STEP 9: Error Handling ===")

    # Test unauthorized access
    unauthorized = api_call("POST", "/catalog/products", data={"name": "Unauthorized"})
    if unauthorized.get("detail") or unauthorized.get("status_code") == 401:
        log_test("Unauthorized Create", "PASS", "Correctly rejected unauthorized request")
    else:
        log_test("Unauthorized Create", "FAIL", f"Should reject but got: {unauthorized}")

    # Test invalid data
    invalid_product = api_call("POST", "/catalog/products", admin_token, {
        "name": "",  # Invalid: empty name
        "price": -10  # Invalid: negative price
    })
    if invalid_product.get("detail") or invalid_product.get("status_code") >= 400:
        log_test("Invalid Data", "PASS", "Correctly rejected invalid data")
    else:
        log_test("Invalid Data", "FAIL", f"Should reject invalid data: {invalid_product}")

    # Test non-existent resource
    not_found = api_call("GET", "/catalog/products/00000000-0000-0000-0000-000000000000", admin_token)
    if not_found.get("detail") or not_found.get("status_code") == 404:
        log_test("Not Found Error", "PASS", "Correctly returns 404 for non-existent product")
    else:
        log_test("Not Found Error", "FAIL", f"Should return 404: {not_found}")

    # Step 10: AI Generation Tests
    print("\n=== STEP 10: AI Generation ===")

    # Test pre-creation AI generation
    ai_generate_response = api_call("POST", "/catalog/ai/generate-descriptions", admin_token, {
        "product_name": "AI Test Thermometer",
        "brand": "MedTech",
        "category": "Diagnostic Equipment"
    })

    # AI API returns suggestions object
    ai_suggestions = ai_generate_response.get("suggestions", {})
    if ai_suggestions.get("description"):
        log_test("AI Generate Descriptions", "PASS", "AI generated description")
        print(f"  Generated: {ai_suggestions.get('description', '')[:100]}...")
    else:
        log_test("AI Generate Descriptions", "FAIL", f"Response: {ai_generate_response}")

    # Test product completeness check
    if product_id:
        completeness = api_call("GET", f"/catalog/products/{product_id}/completeness", admin_token)
        if completeness.get("score") is not None:
            log_test("Product Completeness", "PASS", f"Completeness score: {completeness.get('score')}")
        else:
            log_test("Product Completeness", "FAIL", f"Response: {completeness}")

    # Save test data
    test_data["end_time"] = datetime.now().isoformat()
    save_results(test_data)

    # Summary
    print("\n" + "=" * 60)
    print("TEST SUMMARY")
    print("=" * 60)
    print(f"Passed: {len(RESULTS['passed'])}")
    print(f"Failed: {len(RESULTS['failed'])}")
    print(f"Total: {len(RESULTS['passed']) + len(RESULTS['failed'])}")

    if RESULTS['failed']:
        print("\nFailed tests:")
        for test in RESULTS['failed']:
            print(f"  - {test['name']}: {test['details']}")

    # Save results
    RESULTS["end_time"] = datetime.now().isoformat()
    with open("/tmp/crud_test_results.json", "w") as f:
        json.dump(RESULTS, f, indent=2)

    return 0 if not RESULTS['failed'] else 1

if __name__ == "__main__":
    sys.exit(main())
