# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: product-catalog.spec.ts >> Product Catalog E2E Tests >> should navigate to offers/sale page
- Location: e2e/product-catalog.spec.ts:77:7

# Error details

```
TimeoutError: locator.waitFor: Timeout 10000ms exceeded.
Call log:
  - waiting for locator('[data-testid="offer-card"], [data-testid="product-card"]').first() to be visible

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
          - link "Offers" [ref=e113] [cursor=pointer]:
            - /url: /offers
            - paragraph [ref=e114]: Offers
    - generic [ref=e118]:
      - generic [ref=e119]:
        - generic [ref=e123]:
          - img [ref=e125]
          - generic [ref=e127]:
            - heading "Oops! Something went wrong" [level=1] [ref=e128]
            - paragraph [ref=e129]: We encountered an unexpected error while processing your request.
          - generic [ref=e130]: "Error ID: ERR-MQID2ZJO-X1LII"
        - generic [ref=e131]:
          - paragraph [ref=e133]: Rendered more hooks than during the previous render.
          - button "Show technical details" [ref=e135]:
            - img [ref=e136]
            - generic [ref=e145]: Show technical details
          - generic [ref=e147]:
            - img [ref=e148]
            - generic [ref=e155]:
              - paragraph [ref=e156]: Need help? Contact our customer support team with the Error ID above for faster assistance.
              - button "Copy Error Details" [ref=e158]:
                - img
                - text: Copy Error Details
          - generic [ref=e159]:
            - button "Refresh Page" [ref=e160]:
              - img
              - text: Refresh Page
            - button "Try Again" [ref=e161]:
              - img
              - text: Try Again
            - link "Continue Shopping" [ref=e162] [cursor=pointer]:
              - /url: /shop/products
              - button "Continue Shopping" [ref=e163]:
                - img
                - text: Continue Shopping
            - link "Home" [ref=e164] [cursor=pointer]:
              - /url: /
              - button "Home" [ref=e165]:
                - img
                - text: Home
      - paragraph [ref=e166]: If this error persists, please contact our customer support team with the Error ID above.
    - generic [ref=e168]:
      - generic [ref=e169]:
        - generic [ref=e171]:
          - generic [ref=e172]:
            - img "MyMedDevices Logo" [ref=e174]
            - paragraph [ref=e175]: Your trusted pharmaceutical partner, providing quality health solutions for everyone.
            - generic [ref=e176]:
              - link "Instagram" [ref=e177] [cursor=pointer]:
                - /url: https://www.instagram.com/mymedevices/
                - img "Instagram" [ref=e178]
              - link "Facebook" [ref=e180] [cursor=pointer]:
                - /url: https://www.facebook.com/profile.php?id=61581546818170
                - img "Facebook" [ref=e181]
              - link "X" [ref=e183] [cursor=pointer]:
                - /url: https://twitter.com/mymeddevicesltd
                - img "X" [ref=e184]
              - link "TikTok" [ref=e186] [cursor=pointer]:
                - /url: https://vm.tiktok.com/ZMA3sMq5S/
                - img "TikTok" [ref=e187]
              - link "Whatsapp" [ref=e189] [cursor=pointer]:
                - /url: https://api.whatsapp.com/send?phone=254735239696&text=MyMedDevices%0AHello!%20I'm%20interested%20in%20your%20medical%20devices.%20Can%20you%20help%20me%3F
                - img "WhatsApp" [ref=e190]
              - link "LinkedIn" [ref=e192] [cursor=pointer]:
                - /url: https://www.linkedin.com/company/my-med-device-ltd/
                - img "LinkedIn" [ref=e193]
              - link "YouTube" [ref=e195] [cursor=pointer]:
                - /url: https://www.youtube.com/@mymeddevices
                - img "YouTube" [ref=e196]
          - generic [ref=e198]:
            - generic [ref=e199]:
              - heading "Company" [level=4] [ref=e200]
              - list [ref=e201]:
                - listitem [ref=e202]:
                  - link "About Us" [ref=e203] [cursor=pointer]:
                    - /url: /about-us
                - listitem [ref=e204]:
                  - link "Contact Us" [ref=e205] [cursor=pointer]:
                    - /url: /contact-us
            - generic [ref=e206]:
              - heading "Policies" [level=4] [ref=e207]
              - list [ref=e208]:
                - listitem [ref=e209]:
                  - link "Privacy Policy" [ref=e210] [cursor=pointer]:
                    - /url: /privacy-policy
                - listitem [ref=e211]:
                  - link "Terms & Conditions" [ref=e212] [cursor=pointer]:
                    - /url: /terms-and-conditions
                - listitem [ref=e213]:
                  - link "Shipping Policy" [ref=e214] [cursor=pointer]:
                    - /url: /shipping-policy
                - listitem [ref=e215]:
                  - link "Return Policy" [ref=e216] [cursor=pointer]:
                    - /url: /return-policy
            - generic [ref=e217]:
              - heading "Shop" [level=4] [ref=e218]
              - list [ref=e219]:
                - listitem [ref=e220]:
                  - link "All Products" [ref=e221] [cursor=pointer]:
                    - /url: /products
                - listitem [ref=e222]:
                  - link "Offers" [ref=e223] [cursor=pointer]:
                    - /url: /offers
                - listitem [ref=e224]:
                  - link "Best Sellers" [ref=e225] [cursor=pointer]:
                    - /url: /best-sellers
                - listitem [ref=e226]:
                  - link "New Arrivals" [ref=e227] [cursor=pointer]:
                    - /url: /new-arrivals
            - generic [ref=e228]:
              - heading "Quick Links" [level=4] [ref=e229]
              - list [ref=e230]:
                - listitem [ref=e231]:
                  - link "Checkout" [ref=e232] [cursor=pointer]:
                    - /url: /checkout
                - listitem [ref=e233]:
                  - link "My Wishlist" [ref=e234] [cursor=pointer]:
                    - /url: /wishlist
                - listitem [ref=e235]:
                  - link "Compare Products" [ref=e236] [cursor=pointer]:
                    - /url: /compare
        - generic [ref=e239]:
          - generic [ref=e241]:
            - heading "Download Our App" [level=4] [ref=e242]
            - generic [ref=e243]:
              - link "Download on the App Store" [ref=e244] [cursor=pointer]:
                - /url: https://apps.apple.com/
                - img "Download on the App Store" [ref=e245]
              - link "Get it on Google Play" [ref=e246] [cursor=pointer]:
                - /url: https://play.google.com/store/apps/details?id=com.tumeloinnovations.my_med_devices&hl=en
                - img "Get it on Google Play" [ref=e247]
          - generic [ref=e248]:
            - heading "Shop on The Go" [level=4] [ref=e249]
            - generic [ref=e250]:
              - generic [ref=e251]:
                - img [ref=e253]
                - generic [ref=e256]:
                  - paragraph [ref=e257]: Email Support
                  - paragraph [ref=e258]: support@mymeddevices.co.ke
              - generic [ref=e259]:
                - img [ref=e261]
                - generic [ref=e263]:
                  - paragraph [ref=e264]: Phone Support
                  - paragraph [ref=e265]: +254 707 757 088
              - generic [ref=e266]:
                - img [ref=e268]
                - generic [ref=e271]:
                  - paragraph [ref=e272]: Customer Service
                  - paragraph [ref=e273]: 24/7 dedicated support
              - generic [ref=e274]:
                - img [ref=e276]
                - generic [ref=e279]:
                  - paragraph [ref=e280]: Head Office
                  - paragraph [ref=e281]: Muchai Drive 47, Ngong RD
      - generic [ref=e282]:
        - paragraph [ref=e283]: © 2026 MyMedDevices Kenya. All Rights Reserved.
        - img "M-Pesa payment" [ref=e286]
    - button "Go to top":
      - img
  - region "Notifications alt+T"
  - button "Chat on WhatsApp" [ref=e287]:
    - img "WhatsApp" [ref=e288]
  - generic [ref=e293] [cursor=pointer]:
    - button "Open Next.js Dev Tools" [ref=e294]:
      - img [ref=e295]
    - generic [ref=e298]:
      - button "Open issues overlay" [ref=e299]:
        - generic [ref=e300]:
          - generic [ref=e301]: "4"
          - generic [ref=e302]: "5"
        - generic [ref=e303]:
          - text: Issue
          - generic [ref=e304]: s
      - button "Collapse issues badge" [ref=e305]:
        - img [ref=e306]
  - alert [ref=e308]
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
> 88  |     await offerCards.waitFor({ state: 'visible', timeout: 10000 });
      |                      ^ TimeoutError: locator.waitFor: Timeout 10000ms exceeded.
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
  161 |     await expect(specialOffersHeading).toBeVisible();
  162 | 
  163 |     // Look for a "View All" or similar link (if it exists)
  164 |     const viewAllLink = page.locator('a[href*="/offers"], a[href*="/products"]').first();
  165 | 
  166 |     if (await viewAllLink.count() > 0) {
  167 |       await Promise.all([
  168 |         page.waitForNavigation(),
  169 |         viewAllLink.click()
  170 |       ]);
  171 | 
  172 |       // Should navigate to offers or products page
  173 |       await expect(page).toHaveURL(/\/(offers|products)/);
  174 |     } else {
  175 |       // If no "View All" link, click on a product card instead
  176 |       const productLink = page.locator('a[href*="/products/"]').first();
  177 |       await Promise.all([
  178 |         page.waitForNavigation(),
  179 |         productLink.click()
  180 |       ]);
  181 | 
  182 |       await expect(page).toHaveURL(/\/products\/[a-z0-9-]+/);
  183 |     }
  184 |   });
  185 | });
  186 | 
```