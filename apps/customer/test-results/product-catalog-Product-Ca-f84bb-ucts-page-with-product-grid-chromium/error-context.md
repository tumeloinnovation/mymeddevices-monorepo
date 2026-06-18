# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: product-catalog.spec.ts >> Product Catalog E2E Tests >> should load the products page with product grid
- Location: e2e/product-catalog.spec.ts:9:7

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: locator('text=/no products/i')
Expected: visible
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 5000ms
  - waiting for locator('text=/no products/i')

```

```yaml
- main:
  - link "About Us":
    - /url: /about-us
  - link "Offers":
    - /url: /offers
  - link "Returns & Refunds":
    - /url: /return-policy
  - link "Contact Us":
    - /url: /contact-us
  - link "Instagram":
    - /url: https://www.instagram.com/mymedevices/
    - img "Instagram"
  - link "Facebook":
    - /url: https://www.facebook.com/profile.php?id=61581546818170
    - img "Facebook"
  - link "X":
    - /url: https://twitter.com/mymeddevicesltd
    - img "X"
  - link "TikTok":
    - /url: https://vm.tiktok.com/ZMA3sMq5S/
    - img "TikTok"
  - link "Whatsapp":
    - /url: https://api.whatsapp.com/send?phone=254735239696&text=MyMedDevices%0AHello!%20I'm%20interested%20in%20your%20medical%20devices.%20Can%20you%20help%20me%3F
    - img "WhatsApp"
  - link "LinkedIn":
    - /url: https://www.linkedin.com/company/my-med-device-ltd/
    - img "LinkedIn"
  - link "YouTube":
    - /url: https://www.youtube.com/@mymeddevices
    - img "YouTube"
  - button "Toggle theme"
  - link "MyMedDevices Logo":
    - /url: /
    - img "MyMedDevices Logo"
  - link "Call us +254 707 757 088":
    - /url: tel:+254734585958
    - paragraph: Call us
    - paragraph: +254 707 757 088
  - textbox "Search for Medicines and Health Products"
  - button
  - text: Compare Wishlist Cart Login
  - navigation "Main":
    - list:
      - listitem:
        - button "Shop by Category"
      - listitem:
        - button "Featured Products"
      - listitem:
        - button "New Arrivals"
      - listitem:
        - link "Shop":
          - /url: /products
  - navigation "breadcrumb":
    - list:
      - listitem:
        - link "Home":
          - /url: /
          - paragraph: Home
      - listitem:
        - text: /
        - link "Products":
          - /url: /products
          - paragraph: Products
  - heading "All Products" [level=1]
  - complementary:
    - complementary:
      - heading "Categories" [level=3]
      - radio "Monitoring Devices"
      - text: Monitoring Devices
      - radio "Mobility & Rehabilitation Aids"
      - text: Mobility & Rehabilitation Aids
      - radio "Respiratory Equipment"
      - text: Respiratory Equipment
      - radio "Diagnostic Devices"
      - text: Diagnostic Devices
      - radio "Home Care Equipment"
      - text: Home Care Equipment
      - radio "Orthotics & Braces"
      - text: Orthotics & Braces Price Range
      - application
      - slider "Minimum"
      - slider "Maximum"
      - text: KSH
      - spinbutton: "0"
      - text: — KSH
      - spinbutton: "10000"
      - heading "More Filters" [level=4]
      - checkbox "On sale only"
      - text: On sale only Stock status
      - combobox:
        - option "Any"
        - option "In stock" [selected]
        - option "Out of stock"
      - text: Brand
      - textbox "Filter by brand name..."
      - text: Minimum rating
      - combobox:
        - option "Any" [selected]
        - option "1 star & up"
        - option "2 stars & up"
        - option "3 stars & up"
        - option "4 stars & up"
        - option "5 stars"
      - button "Clear All Filters"
  - main:
    - heading "Products" [level=1]
    - text: 14 results
    - button "Sort by"
    - img "Yuwell YX305 Fingertip Pulse Oximeter"
    - text: Sale ★ 4.5 (24)
    - button "Add to wishlist"
    - button "Share"
    - button "View related products"
    - paragraph: Monitoring Devices
    - heading "Yuwell YX305 Fingertip Pulse Oximeter" [level=3]
    - paragraph: Ksh. 900
    - text: Ksh. 1,100
    - button "Add to cart"
    - img "Contec CMS50D Fingertip Pulse Oximeter"
    - text: Sale ★ 4.5 (24)
    - button "Add to wishlist"
    - button "Share"
    - button "View related products"
    - paragraph: Monitoring Devices
    - heading "Contec CMS50D Fingertip Pulse Oximeter" [level=3]
    - paragraph: Ksh. 1,200
    - text: Ksh. 1,500
    - button "Add to cart"
    - img "Yuwell 710 Blood Glucose Testing System"
    - text: Sale ★ 4.5 (24)
    - button "Add to wishlist"
    - button "Share"
    - button "View related products"
    - paragraph: Monitoring Devices
    - heading "Yuwell 710 Blood Glucose Testing System" [level=3]
    - paragraph: Ksh. 1,800
    - text: Ksh. 2,200
    - button "Add to cart"
    - img "Contec GLU10 Blood Glucose Meter with 50 Test Strips"
    - text: Sale ★ 4.5 (24)
    - button "Add to wishlist"
    - button "Share"
    - button "View related products"
    - paragraph: Monitoring Devices
    - heading "Contec GLU10 Blood Glucose Meter with 50 Test Strips" [level=3]
    - paragraph: Ksh. 2,200
    - text: Ksh. 2,700
    - button "Add to cart"
    - img "Beurer FT 90 Non-Contact Infrared Forehead Thermometer"
    - text: Sale ★ 4.5 (24)
    - button "Add to wishlist"
    - button "Share"
    - button "View related products"
    - paragraph: Monitoring Devices
    - heading "Beurer FT 90 Non-Contact Infrared Forehead Thermometer" [level=3]
    - paragraph: Ksh. 3,200
    - text: Ksh. 3,800
    - button "Add to cart"
    - img "Beurer PO 30 Fingertip Pulse Oximeter"
    - text: ★ 4.5 (24)
    - button "Add to wishlist"
    - button "Share"
    - button "View related products"
    - paragraph: Monitoring Devices
    - heading "Beurer PO 30 Fingertip Pulse Oximeter" [level=3]
    - paragraph: Ksh. 1,600
    - button "Add to cart"
    - img "Omron M3 Comfort Automatic Blood Pressure Monitor"
    - text: Sale ★ 4.5 (24)
    - button "Add to wishlist"
    - button "Share"
    - button "View related products"
    - paragraph: Monitoring Devices
    - heading "Omron M3 Comfort Automatic Blood Pressure Monitor" [level=3]
    - paragraph: Ksh. 4,500
    - text: Ksh. 5,200
    - button "Add to cart"
    - img "Omron HGM-112 Blood Glucose Meter"
    - text: ★ 4.5 (24)
    - button "Add to wishlist"
    - button "Share"
    - button "View related products"
    - paragraph: Monitoring Devices
    - heading "Omron HGM-112 Blood Glucose Meter" [level=3]
    - paragraph: Ksh. 2,900
    - button "Add to cart"
    - img "Beurer BC 57 Wrist Blood Pressure Monitor with Bluetooth"
    - text: Sale ★ 4.5 (24)
    - button "Add to wishlist"
    - button "Share"
    - button "View related products"
    - paragraph: Monitoring Devices
    - heading "Beurer BC 57 Wrist Blood Pressure Monitor with Bluetooth" [level=3]
    - paragraph: Ksh. 5,500
    - text: Ksh. 6,000
    - button "Add to cart"
    - img "Beurer BM 55 Upper Arm Blood Pressure Monitor"
    - text: ★ 4.5 (24)
    - button "Add to wishlist"
    - button "Share"
    - button "View related products"
    - paragraph: Monitoring Devices
    - heading "Beurer BM 55 Upper Arm Blood Pressure Monitor" [level=3]
    - paragraph: Ksh. 3,800
    - button "Add to cart"
    - img "Contec CMS60C Wrist Pulse Oximeter with Alarm"
    - text: ★ 4.5 (24)
    - button "Add to wishlist"
    - button "Share"
    - button "View related products"
    - paragraph: Monitoring Devices
    - heading "Contec CMS60C Wrist Pulse Oximeter with Alarm" [level=3]
    - paragraph: Ksh. 5,800
    - button "Add to cart"
    - img "Omron HEM-7156T Wireless Upper Arm Monitor"
    - text: ★ 4.5 (24)
    - button "Add to wishlist"
    - button "Share"
    - button "View related products"
    - paragraph: Monitoring Devices
    - heading "Omron HEM-7156T Wireless Upper Arm Monitor" [level=3]
    - paragraph: Ksh. 6,200
    - button "Add to cart"
    - img "Omron Evolv All-in-One Upper Arm Blood Pressure Monitor"
    - text: Sale ★ 4.5 (24)
    - button "Add to wishlist"
    - button "Share"
    - button "View related products"
    - paragraph: Monitoring Devices
    - heading "Omron Evolv All-in-One Upper Arm Blood Pressure Monitor" [level=3]
    - paragraph: Ksh. 9,500
    - text: Ksh. 10,500
    - button "Add to cart"
    - img "Contec CMS50D+ Wrist Pulse Oximeter with Glucose Function"
    - text: Sale ★ 4.5 (24)
    - button "Add to wishlist"
    - button "Share"
    - button "View related products"
    - paragraph: Monitoring Devices
    - heading "Contec CMS50D+ Wrist Pulse Oximeter with Glucose Function" [level=3]
    - paragraph: Ksh. 7,800
    - text: Ksh. 8,500
    - button "Add to cart"
  - img "MyMedDevices Logo"
  - paragraph: Your trusted pharmaceutical partner, providing quality health solutions for everyone.
  - link "Instagram":
    - /url: https://www.instagram.com/mymedevices/
    - img "Instagram"
  - link "Facebook":
    - /url: https://www.facebook.com/profile.php?id=61581546818170
    - img "Facebook"
  - link "X":
    - /url: https://twitter.com/mymeddevicesltd
    - img "X"
  - link "TikTok":
    - /url: https://vm.tiktok.com/ZMA3sMq5S/
    - img "TikTok"
  - link "Whatsapp":
    - /url: https://api.whatsapp.com/send?phone=254735239696&text=MyMedDevices%0AHello!%20I'm%20interested%20in%20your%20medical%20devices.%20Can%20you%20help%20me%3F
    - img "WhatsApp"
  - link "LinkedIn":
    - /url: https://www.linkedin.com/company/my-med-device-ltd/
    - img "LinkedIn"
  - link "YouTube":
    - /url: https://www.youtube.com/@mymeddevices
    - img "YouTube"
  - heading "Company" [level=4]
  - list:
    - listitem:
      - link "About Us":
        - /url: /about-us
    - listitem:
      - link "Contact Us":
        - /url: /contact-us
  - heading "Policies" [level=4]
  - list:
    - listitem:
      - link "Privacy Policy":
        - /url: /privacy-policy
    - listitem:
      - link "Terms & Conditions":
        - /url: /terms-and-conditions
    - listitem:
      - link "Shipping Policy":
        - /url: /shipping-policy
    - listitem:
      - link "Return Policy":
        - /url: /return-policy
  - heading "Shop" [level=4]
  - list:
    - listitem:
      - link "All Products":
        - /url: /products
    - listitem:
      - link "Offers":
        - /url: /offers
    - listitem:
      - link "Best Sellers":
        - /url: /best-sellers
    - listitem:
      - link "New Arrivals":
        - /url: /new-arrivals
  - heading "Quick Links" [level=4]
  - list:
    - listitem:
      - link "Checkout":
        - /url: /checkout
    - listitem:
      - link "My Wishlist":
        - /url: /wishlist
    - listitem:
      - link "Compare Products":
        - /url: /compare
  - heading "Download Our App" [level=4]
  - link "Download on the App Store":
    - /url: https://apps.apple.com/
    - img "Download on the App Store"
  - link "Get it on Google Play":
    - /url: https://play.google.com/store/apps/details?id=com.tumeloinnovations.my_med_devices&hl=en
    - img "Get it on Google Play"
  - heading "Shop on The Go" [level=4]
  - paragraph: Email Support
  - paragraph: support@mymeddevices.co.ke
  - paragraph: Phone Support
  - paragraph: +254 707 757 088
  - paragraph: Customer Service
  - paragraph: 24/7 dedicated support
  - paragraph: Head Office
  - paragraph: Muchai Drive 47, Ngong RD
  - paragraph: © 2026 MyMedDevices Kenya. All Rights Reserved.
  - img "M-Pesa payment"
  - button "Go to top"
- region "Notifications alt+T"
- button "Chat on WhatsApp":
  - img "WhatsApp"
- alert
```

# Test source

```ts
  1   | import { test, expect } from '@playwright/test';
  2   | 
  3   | test.describe('Product Catalog E2E Tests', () => {
  4   |   test.beforeEach(async ({ page }) => {
  5   |     // Navigate to the products page before each test
  6   |     await page.goto('/products');
  7   |   });
  8   | 
  9   |   test('should load the products page with product grid', async ({ page }) => {
  10  |     // Check page title
  11  |     await expect(page).toHaveTitle(/All Products/i);
  12  | 
  13  |     // Verify main heading
  14  |     await expect(page.getByRole('heading', { name: 'All Products' })).toBeVisible();
  15  | 
  16  |     // Wait for products to load (check for product cards or loading state)
  17  |     // If using API hooks, we might see loading skeleton first
  18  |     await page.waitForSelector('[data-testid="product-card"]', { timeout: 10000 }).catch(() => {
  19  |       // If no product cards, check for empty state or error
> 20  |       expect(page.locator('text=/no products/i')).toBeVisible();
      |                                                   ^ Error: expect(locator).toBeVisible() failed
  21  |     });
  22  |   });
  23  | 
  24  |   test('should display products with valid data structure', async ({ page }) => {
  25  |     // Wait for products to load
  26  |     const productCards = page.locator('[data-testid="product-card"]').first();
  27  |     await productCards.waitFor({ state: 'visible', timeout: 10000 });
  28  | 
  29  |     // Verify product card has expected elements
  30  |     await expect(productCards.locator('img')).toBeVisible(); // Product image
  31  |     await expect(productCards.locator('[data-testid="product-name"]')).toBeVisible(); // Product name
  32  |     await expect(productCards.locator('[data-testid="product-price"]')).toBeVisible(); // Product price
  33  |   });
  34  | 
  35  |   test('should navigate to featured products page', async ({ page }) => {
  36  |     await page.goto('/featured');
  37  | 
  38  |     // Check page title
  39  |     await expect(page).toHaveTitle(/Featured Products/i);
  40  | 
  41  |     // Verify heading
  42  |     await expect(page.getByRole('heading', { name: 'Featured Products' })).toBeVisible();
  43  | 
  44  |     // Verify products are displayed
  45  |     const productCards = page.locator('[data-testid="product-card"]').first();
  46  |     await productCards.waitFor({ state: 'visible', timeout: 10000 });
  47  |   });
  48  | 
  49  |   test('should navigate to new arrivals page', async ({ page }) => {
  50  |     await page.goto('/new-arrivals');
  51  | 
  52  |     // Check page title
  53  |     await expect(page).toHaveTitle(/New Arrivals/i);
  54  | 
  55  |     // Verify heading
  56  |     await expect(page.getByRole('heading', { name: 'New Arrivals' })).toBeVisible();
  57  | 
  58  |     // Verify products are displayed
  59  |     const productCards = page.locator('[data-testid="product-card"]').first();
  60  |     await productCards.waitFor({ state: 'visible', timeout: 10000 });
  61  |   });
  62  | 
  63  |   test('should navigate to best sellers page', async ({ page }) => {
  64  |     await page.goto('/best-sellers');
  65  | 
  66  |     // Check page title
  67  |     await expect(page).toHaveTitle(/Best Sellers/i);
  68  | 
  69  |     // Verify heading
  70  |     await expect(page.getByRole('heading', { name: 'Best Sellers' })).toBeVisible();
  71  | 
  72  |     // Verify products are displayed
  73  |     const productCards = page.locator('[data-testid="product-card"]').first();
  74  |     await productCards.waitFor({ state: 'visible', timeout: 10000 });
  75  |   });
  76  | 
  77  |   test('should navigate to offers/sale page', async ({ page }) => {
  78  |     await page.goto('/offers');
  79  | 
  80  |     // Check page title
  81  |     await expect(page).toHaveTitle(/Offers/i);
  82  | 
  83  |     // Verify heading or section
  84  |     await expect(page.getByRole('heading', { name: /offers/i }).or(page.getByText(/special offers/i))).toBeVisible();
  85  | 
  86  |     // Verify offers are displayed
  87  |     const offerCards = page.locator('[data-testid="offer-card"], [data-testid="product-card"]').first();
  88  |     await offerCards.waitFor({ state: 'visible', timeout: 10000 });
  89  |   });
  90  | 
  91  |   test('should navigate to categories page and show categories', async ({ page }) => {
  92  |     await page.goto('/categories');
  93  | 
  94  |     // Check page title
  95  |     await expect(page).toHaveTitle(/Categories/i);
  96  | 
  97  |     // Verify heading
  98  |     await expect(page.getByRole('heading', { name: /categories/i })).toBeVisible();
  99  | 
  100 |     // Verify category cards are displayed
  101 |     const categoryCards = page.locator('a[href*="/categories/"]').first();
  102 |     await categoryCards.waitFor({ state: 'visible', timeout: 10000 });
  103 |   });
  104 | 
  105 |   test('should navigate to a specific category page', async ({ page }) => {
  106 |     // First go to categories to get a valid category link
  107 |     await page.goto('/categories');
  108 | 
  109 |     // Find a category link
  110 |     const categoryLink = page.locator('a[href*="/categories/"]').first();
  111 |     await expect(categoryLink).toBeVisible();
  112 | 
  113 |     // Get the category name for verification
  114 |     const categoryName = await categoryLink.innerText();
  115 | 
  116 |     // Click and navigate
  117 |     await Promise.all([
  118 |       page.waitForNavigation(),
  119 |       categoryLink.click()
  120 |     ]);
```