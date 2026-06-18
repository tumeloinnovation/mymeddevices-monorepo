# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: product-catalog.spec.ts >> Product Catalog E2E Tests >> should navigate to new arrivals page
- Location: e2e/product-catalog.spec.ts:49:7

# Error details

```
TimeoutError: locator.waitFor: Timeout 10000ms exceeded.
Call log:
  - waiting for locator('[data-testid="product-card"]').first() to be visible

```

# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - main [ref=e2]:
    - generic [ref=e3]:
      - generic [ref=e5]:
        - generic [ref=e6]:
          - link "About Us" [ref=e7] [cursor=pointer]:
            - /url: /about-us
          - link "Offers" [ref=e8] [cursor=pointer]:
            - /url: /offers
          - link "Returns & Refunds" [ref=e9] [cursor=pointer]:
            - /url: /return-policy
          - link "Contact Us" [ref=e10] [cursor=pointer]:
            - /url: /contact-us
        - generic [ref=e11]:
          - link "Instagram" [ref=e12] [cursor=pointer]:
            - /url: https://www.instagram.com/mymedevices/
            - img "Instagram" [ref=e13]
          - link "Facebook" [ref=e15] [cursor=pointer]:
            - /url: https://www.facebook.com/profile.php?id=61581546818170
            - img "Facebook" [ref=e16]
          - link "X" [ref=e18] [cursor=pointer]:
            - /url: https://twitter.com/mymeddevicesltd
            - img "X" [ref=e19]
          - link "TikTok" [ref=e21] [cursor=pointer]:
            - /url: https://vm.tiktok.com/ZMA3sMq5S/
            - img "TikTok" [ref=e22]
          - link "Whatsapp" [ref=e24] [cursor=pointer]:
            - /url: https://api.whatsapp.com/send?phone=254735239696&text=MyMedDevices%0AHello!%20I'm%20interested%20in%20your%20medical%20devices.%20Can%20you%20help%20me%3F
            - img "WhatsApp" [ref=e25]
          - link "LinkedIn" [ref=e27] [cursor=pointer]:
            - /url: https://www.linkedin.com/company/my-med-device-ltd/
            - img "LinkedIn" [ref=e28]
          - link "YouTube" [ref=e30] [cursor=pointer]:
            - /url: https://www.youtube.com/@mymeddevices
            - img "YouTube" [ref=e31]
          - button "Toggle theme" [ref=e33]:
            - img [ref=e34]
      - generic [ref=e40]:
        - generic [ref=e41]:
          - link "MyMedDevices Logo" [ref=e42] [cursor=pointer]:
            - /url: /
            - img "MyMedDevices Logo" [ref=e43]
          - link "Call us +254 707 757 088" [ref=e44] [cursor=pointer]:
            - /url: tel:+254734585958
            - img [ref=e45]
            - generic [ref=e47]:
              - paragraph [ref=e48]: Call us
              - paragraph [ref=e49]: +254 707 757 088
        - generic [ref=e52]:
          - textbox "Search for Medicines and Health Products" [ref=e53]
          - button [ref=e55]:
            - img [ref=e56]
        - generic [ref=e60]:
          - generic [ref=e61] [cursor=pointer]:
            - img [ref=e62]
            - generic [ref=e69]: Compare
          - generic [ref=e70] [cursor=pointer]:
            - img [ref=e71]
            - generic [ref=e73]: Wishlist
          - generic [ref=e74] [cursor=pointer]:
            - img [ref=e75]
            - generic [ref=e79]: Cart
          - generic [ref=e80] [cursor=pointer]:
            - img [ref=e81]
            - generic [ref=e84]: Login
      - navigation "Main" [ref=e88]:
        - list [ref=e90]:
          - listitem [ref=e91]:
            - button "Shop by Category" [ref=e92]:
              - text: Shop by Category
              - img [ref=e93]
          - listitem [ref=e95]:
            - button "Featured Products" [ref=e96]:
              - text: Featured Products
              - img [ref=e97]
          - listitem [ref=e99]:
            - button "New Arrivals" [ref=e100]:
              - text: New Arrivals
              - img [ref=e101]
          - listitem [ref=e103]:
            - link "Shop" [ref=e104] [cursor=pointer]:
              - /url: /products
    - navigation "breadcrumb" [ref=e106]:
      - list [ref=e107]:
        - listitem [ref=e108]:
          - link "Home" [ref=e109] [cursor=pointer]:
            - /url: /
            - paragraph [ref=e110]: Home
        - listitem [ref=e111]:
          - generic [ref=e112]: /
          - link "New-arrivals" [ref=e113] [cursor=pointer]:
            - /url: /new-arrivals
            - paragraph [ref=e114]: New-arrivals
    - generic [ref=e116]:
      - heading "New Arrivals" [level=1] [ref=e118]
      - generic [ref=e119]:
        - complementary [ref=e120]:
          - complementary [ref=e121]:
            - generic [ref=e122]:
              - heading "Categories" [level=3] [ref=e123]
              - generic [ref=e124]:
                - generic [ref=e125]:
                  - radio "Monitoring Devices" [ref=e126]
                  - generic [ref=e127] [cursor=pointer]: Monitoring Devices
                - generic [ref=e128]:
                  - radio "Mobility & Rehabilitation Aids" [ref=e129]
                  - generic [ref=e130] [cursor=pointer]: Mobility & Rehabilitation Aids
                - generic [ref=e131]:
                  - radio "Respiratory Equipment" [ref=e132]
                  - generic [ref=e133] [cursor=pointer]: Respiratory Equipment
                - generic [ref=e134]:
                  - radio "Diagnostic Devices" [ref=e135]
                  - generic [ref=e136] [cursor=pointer]: Diagnostic Devices
                - generic [ref=e137]:
                  - radio "Home Care Equipment" [ref=e138]
                  - generic [ref=e139] [cursor=pointer]: Home Care Equipment
                - generic [ref=e140]:
                  - radio "Orthotics & Braces" [ref=e141]
                  - generic [ref=e142] [cursor=pointer]: Orthotics & Braces
            - generic [ref=e144]:
              - generic [ref=e145]: Price Range
              - application [ref=e149]
              - generic [ref=e156]:
                - slider "Minimum" [ref=e160]
                - slider "Maximum" [ref=e162]
              - generic [ref=e163]:
                - generic [ref=e164]:
                  - generic [ref=e165]: KSH
                  - spinbutton [ref=e166]: "0"
                - generic [ref=e167]: —
                - generic [ref=e168]:
                  - generic [ref=e169]: KSH
                  - spinbutton [ref=e170]: "10000"
            - generic [ref=e172]:
              - generic [ref=e173]:
                - heading "More Filters" [level=4] [ref=e174]
                - generic [ref=e175]:
                  - generic [ref=e176] [cursor=pointer]:
                    - checkbox "On sale only" [ref=e177]
                    - generic [ref=e178]: On sale only
                  - generic [ref=e179]:
                    - generic [ref=e180]: Stock status
                    - combobox [ref=e181]:
                      - option "Any"
                      - option "In stock" [selected]
                      - option "Out of stock"
                  - generic [ref=e182]:
                    - generic [ref=e183]: Brand
                    - textbox "Filter by brand name..." [ref=e184]
                  - generic [ref=e185]:
                    - generic [ref=e186]: Minimum rating
                    - combobox [ref=e187]:
                      - option "Any" [selected]
                      - option "1 star & up"
                      - option "2 stars & up"
                      - option "3 stars & up"
                      - option "4 stars & up"
                      - option "5 stars"
              - button "Clear All Filters" [ref=e189]
        - main [ref=e190]:
          - generic [ref=e192]:
            - generic [ref=e193]:
              - heading "Products" [level=1] [ref=e194]
              - generic [ref=e195]: 0 results
            - button "Sort by" [ref=e197]:
              - text: Sort by
              - img
          - generic [ref=e200]: No products match your filters.
    - generic [ref=e202]:
      - generic [ref=e203]:
        - generic [ref=e205]:
          - generic [ref=e206]:
            - img "MyMedDevices Logo" [ref=e208]
            - paragraph [ref=e209]: Your trusted pharmaceutical partner, providing quality health solutions for everyone.
            - generic [ref=e210]:
              - link "Instagram" [ref=e211] [cursor=pointer]:
                - /url: https://www.instagram.com/mymedevices/
                - img "Instagram" [ref=e212]
              - link "Facebook" [ref=e214] [cursor=pointer]:
                - /url: https://www.facebook.com/profile.php?id=61581546818170
                - img "Facebook" [ref=e215]
              - link "X" [ref=e217] [cursor=pointer]:
                - /url: https://twitter.com/mymeddevicesltd
                - img "X" [ref=e218]
              - link "TikTok" [ref=e220] [cursor=pointer]:
                - /url: https://vm.tiktok.com/ZMA3sMq5S/
                - img "TikTok" [ref=e221]
              - link "Whatsapp" [ref=e223] [cursor=pointer]:
                - /url: https://api.whatsapp.com/send?phone=254735239696&text=MyMedDevices%0AHello!%20I'm%20interested%20in%20your%20medical%20devices.%20Can%20you%20help%20me%3F
                - img "WhatsApp" [ref=e224]
              - link "LinkedIn" [ref=e226] [cursor=pointer]:
                - /url: https://www.linkedin.com/company/my-med-device-ltd/
                - img "LinkedIn" [ref=e227]
              - link "YouTube" [ref=e229] [cursor=pointer]:
                - /url: https://www.youtube.com/@mymeddevices
                - img "YouTube" [ref=e230]
          - generic [ref=e232]:
            - generic [ref=e233]:
              - heading "Company" [level=4] [ref=e234]
              - list [ref=e235]:
                - listitem [ref=e236]:
                  - link "About Us" [ref=e237] [cursor=pointer]:
                    - /url: /about-us
                - listitem [ref=e238]:
                  - link "Contact Us" [ref=e239] [cursor=pointer]:
                    - /url: /contact-us
            - generic [ref=e240]:
              - heading "Policies" [level=4] [ref=e241]
              - list [ref=e242]:
                - listitem [ref=e243]:
                  - link "Privacy Policy" [ref=e244] [cursor=pointer]:
                    - /url: /privacy-policy
                - listitem [ref=e245]:
                  - link "Terms & Conditions" [ref=e246] [cursor=pointer]:
                    - /url: /terms-and-conditions
                - listitem [ref=e247]:
                  - link "Shipping Policy" [ref=e248] [cursor=pointer]:
                    - /url: /shipping-policy
                - listitem [ref=e249]:
                  - link "Return Policy" [ref=e250] [cursor=pointer]:
                    - /url: /return-policy
            - generic [ref=e251]:
              - heading "Shop" [level=4] [ref=e252]
              - list [ref=e253]:
                - listitem [ref=e254]:
                  - link "All Products" [ref=e255] [cursor=pointer]:
                    - /url: /products
                - listitem [ref=e256]:
                  - link "Offers" [ref=e257] [cursor=pointer]:
                    - /url: /offers
                - listitem [ref=e258]:
                  - link "Best Sellers" [ref=e259] [cursor=pointer]:
                    - /url: /best-sellers
                - listitem [ref=e260]:
                  - link "New Arrivals" [ref=e261] [cursor=pointer]:
                    - /url: /new-arrivals
            - generic [ref=e262]:
              - heading "Quick Links" [level=4] [ref=e263]
              - list [ref=e264]:
                - listitem [ref=e265]:
                  - link "Checkout" [ref=e266] [cursor=pointer]:
                    - /url: /checkout
                - listitem [ref=e267]:
                  - link "My Wishlist" [ref=e268] [cursor=pointer]:
                    - /url: /wishlist
                - listitem [ref=e269]:
                  - link "Compare Products" [ref=e270] [cursor=pointer]:
                    - /url: /compare
        - generic [ref=e273]:
          - generic [ref=e275]:
            - heading "Download Our App" [level=4] [ref=e276]
            - generic [ref=e277]:
              - link "Download on the App Store" [ref=e278] [cursor=pointer]:
                - /url: https://apps.apple.com/
                - img "Download on the App Store" [ref=e279]
              - link "Get it on Google Play" [ref=e280] [cursor=pointer]:
                - /url: https://play.google.com/store/apps/details?id=com.tumeloinnovations.my_med_devices&hl=en
                - img "Get it on Google Play" [ref=e281]
          - generic [ref=e282]:
            - heading "Shop on The Go" [level=4] [ref=e283]
            - generic [ref=e284]:
              - generic [ref=e285]:
                - img [ref=e287]
                - generic [ref=e290]:
                  - paragraph [ref=e291]: Email Support
                  - paragraph [ref=e292]: support@mymeddevices.co.ke
              - generic [ref=e293]:
                - img [ref=e295]
                - generic [ref=e297]:
                  - paragraph [ref=e298]: Phone Support
                  - paragraph [ref=e299]: +254 707 757 088
              - generic [ref=e300]:
                - img [ref=e302]
                - generic [ref=e305]:
                  - paragraph [ref=e306]: Customer Service
                  - paragraph [ref=e307]: 24/7 dedicated support
              - generic [ref=e308]:
                - img [ref=e310]
                - generic [ref=e313]:
                  - paragraph [ref=e314]: Head Office
                  - paragraph [ref=e315]: Muchai Drive 47, Ngong RD
      - generic [ref=e316]:
        - paragraph [ref=e317]: © 2026 MyMedDevices Kenya. All Rights Reserved.
        - img "M-Pesa payment" [ref=e320]
    - button "Go to top":
      - img
  - region "Notifications alt+T"
  - button "Chat on WhatsApp" [ref=e321]:
    - img "WhatsApp" [ref=e322]
  - button "Open Next.js Dev Tools" [ref=e328] [cursor=pointer]:
    - generic [ref=e331]:
      - text: Compiling
      - generic [ref=e332]:
        - generic [ref=e333]: .
        - generic [ref=e334]: .
        - generic [ref=e335]: .
  - alert [ref=e336]
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
  20  |       expect(page.locator('text=/no products/i')).toBeVisible();
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
> 60  |     await productCards.waitFor({ state: 'visible', timeout: 10000 });
      |                        ^ TimeoutError: locator.waitFor: Timeout 10000ms exceeded.
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
  121 | 
  122 |     // Verify we're on a category page
  123 |     await expect(page).toHaveURL(/\/categories\/[a-z0-9-]+/);
  124 | 
  125 |     // Verify the category heading matches (or is related to) what we clicked
  126 |     const heading = page.locator('h1, h2').first();
  127 |     await expect(heading).toBeVisible();
  128 |   });
  129 | 
  130 |   test('should show loading skeleton while fetching products', async ({ page }) => {
  131 |     // Navigate to products page
  132 |     await page.goto('/products');
  133 | 
  134 |     // Check for loading skeleton (might be visible briefly)
  135 |     const skeleton = page.locator('.animate-pulse').first();
  136 | 
  137 |     // The skeleton should appear briefly or not at all if data loads quickly
  138 |     // This test verifies the component structure exists
  139 |     const hasSkeleton = await skeleton.count().then(count => count > 0);
  140 | 
  141 |     if (hasSkeleton) {
  142 |       // If skeleton exists, it should disappear after loading
  143 |       await skeleton.waitFor({ state: 'hidden', timeout: 5000 }).catch(() => {
  144 |         // Skeleton might remain visible if data takes time to load
  145 |         // This is acceptable
  146 |       });
  147 |     }
  148 |   });
  149 | 
  150 |   test('should handle empty state when no products match filters', async ({ page }) => {
  151 |     // This test would require implementing filters first
  152 |     // For now, we'll skip or mark as pending
  153 |     test.skip(true, 'Filter functionality test - to be implemented when filters are added');
  154 |   });
  155 | 
  156 |   test('should navigate from homepage to product listing via section links', async ({ page }) => {
  157 |     await page.goto('/');
  158 | 
  159 |     // Find the "Special Offers" section
  160 |     const specialOffersHeading = page.getByRole('heading', { name: 'Special Offers' });
```