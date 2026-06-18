# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: cart-checkout.spec.ts >> Shopping Cart and Checkout E2E Flow >> should go through the full purchase flow
- Location: e2e/cart-checkout.spec.ts:36:7

# Error details

```
Test timeout of 30000ms exceeded.
```

```
Error: page.goto: Test timeout of 30000ms exceeded.
Call log:
  - navigating to "http://localhost:3000/checkout", waiting until "load"

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
    - navigation "breadcrumb" [ref=e60]:
      - list [ref=e61]:
        - listitem [ref=e62]:
          - link "Home" [ref=e63] [cursor=pointer]:
            - /url: /
            - paragraph [ref=e64]: Home
        - listitem [ref=e65]:
          - generic [ref=e66]: /
          - link "Checkout" [ref=e67] [cursor=pointer]:
            - /url: /checkout
            - paragraph [ref=e68]: Checkout
    - generic [ref=e74]:
      - generic [ref=e75]:
        - generic [ref=e77]:
          - generic [ref=e78]:
            - img "MyMedDevices Logo" [ref=e80]
            - paragraph [ref=e81]: Your trusted pharmaceutical partner, providing quality health solutions for everyone.
            - generic [ref=e82]:
              - link "Instagram" [ref=e83] [cursor=pointer]:
                - /url: https://www.instagram.com/mymedevices/
                - img "Instagram" [ref=e84]
              - link "Facebook" [ref=e86] [cursor=pointer]:
                - /url: https://www.facebook.com/profile.php?id=61581546818170
                - img "Facebook" [ref=e87]
              - link "X" [ref=e89] [cursor=pointer]:
                - /url: https://twitter.com/mymeddevicesltd
                - img "X" [ref=e90]
              - link "TikTok" [ref=e92] [cursor=pointer]:
                - /url: https://vm.tiktok.com/ZMA3sMq5S/
                - img "TikTok" [ref=e93]
              - link "Whatsapp" [ref=e95] [cursor=pointer]:
                - /url: https://api.whatsapp.com/send?phone=254735239696&text=MyMedDevices%0AHello!%20I'm%20interested%20in%20your%20medical%20devices.%20Can%20you%20help%20me%3F
                - img "WhatsApp" [ref=e96]
              - link "LinkedIn" [ref=e98] [cursor=pointer]:
                - /url: https://www.linkedin.com/company/my-med-device-ltd/
                - img "LinkedIn" [ref=e99]
              - link "YouTube" [ref=e101] [cursor=pointer]:
                - /url: https://www.youtube.com/@mymeddevices
                - img "YouTube" [ref=e102]
          - generic [ref=e104]:
            - generic [ref=e105]:
              - heading "Company" [level=4] [ref=e106]
              - list [ref=e107]:
                - listitem [ref=e108]:
                  - link "About Us" [ref=e109] [cursor=pointer]:
                    - /url: /about-us
                - listitem [ref=e110]:
                  - link "Contact Us" [ref=e111] [cursor=pointer]:
                    - /url: /contact-us
            - generic [ref=e112]:
              - heading "Policies" [level=4] [ref=e113]
              - list [ref=e114]:
                - listitem [ref=e115]:
                  - link "Privacy Policy" [ref=e116] [cursor=pointer]:
                    - /url: /privacy-policy
                - listitem [ref=e117]:
                  - link "Terms & Conditions" [ref=e118] [cursor=pointer]:
                    - /url: /terms-and-conditions
                - listitem [ref=e119]:
                  - link "Shipping Policy" [ref=e120] [cursor=pointer]:
                    - /url: /shipping-policy
                - listitem [ref=e121]:
                  - link "Return Policy" [ref=e122] [cursor=pointer]:
                    - /url: /return-policy
            - generic [ref=e123]:
              - heading "Shop" [level=4] [ref=e124]
              - list [ref=e125]:
                - listitem [ref=e126]:
                  - link "All Products" [ref=e127] [cursor=pointer]:
                    - /url: /products
                - listitem [ref=e128]:
                  - link "Offers" [ref=e129] [cursor=pointer]:
                    - /url: /offers
                - listitem [ref=e130]:
                  - link "Best Sellers" [ref=e131] [cursor=pointer]:
                    - /url: /best-sellers
                - listitem [ref=e132]:
                  - link "New Arrivals" [ref=e133] [cursor=pointer]:
                    - /url: /new-arrivals
            - generic [ref=e134]:
              - heading "Quick Links" [level=4] [ref=e135]
              - list [ref=e136]:
                - listitem [ref=e137]:
                  - link "Checkout" [ref=e138] [cursor=pointer]:
                    - /url: /checkout
                - listitem [ref=e139]:
                  - link "My Wishlist" [ref=e140] [cursor=pointer]:
                    - /url: /wishlist
                - listitem [ref=e141]:
                  - link "Compare Products" [ref=e142] [cursor=pointer]:
                    - /url: /compare
        - generic [ref=e145]:
          - generic [ref=e147]:
            - heading "Download Our App" [level=4] [ref=e148]
            - generic [ref=e149]:
              - link "Download on the App Store" [ref=e150] [cursor=pointer]:
                - /url: https://apps.apple.com/
                - img "Download on the App Store" [ref=e151]
              - link "Get it on Google Play" [ref=e152] [cursor=pointer]:
                - /url: https://play.google.com/store/apps/details?id=com.tumeloinnovations.my_med_devices&hl=en
                - img "Get it on Google Play" [ref=e153]
          - generic [ref=e154]:
            - heading "Shop on The Go" [level=4] [ref=e155]
            - generic [ref=e156]:
              - generic [ref=e157]:
                - img [ref=e159]
                - generic [ref=e162]:
                  - paragraph [ref=e163]: Email Support
                  - paragraph [ref=e164]: support@mymeddevices.co.ke
              - generic [ref=e165]:
                - img [ref=e167]
                - generic [ref=e169]:
                  - paragraph [ref=e170]: Phone Support
                  - paragraph [ref=e171]: +254 707 757 088
              - generic [ref=e172]:
                - img [ref=e174]
                - generic [ref=e177]:
                  - paragraph [ref=e178]: Customer Service
                  - paragraph [ref=e179]: 24/7 dedicated support
              - generic [ref=e180]:
                - img [ref=e182]
                - generic [ref=e185]:
                  - paragraph [ref=e186]: Head Office
                  - paragraph [ref=e187]: Muchai Drive 47, Ngong RD
      - generic [ref=e188]:
        - paragraph [ref=e189]: © 2026 MyMedDevices Kenya. All Rights Reserved.
        - img "M-Pesa payment" [ref=e192]
    - button "Go to top":
      - img
  - region "Notifications alt+T"
  - button "Chat on WhatsApp" [ref=e193]:
    - img "WhatsApp" [ref=e194]
```

# Test source

```ts
  1   | import { test, expect } from '@playwright/test';
  2   | 
  3   | test.describe('Shopping Cart and Checkout E2E Flow', () => {
  4   |   test.beforeEach(async ({ page }) => {
  5   |     // Seed default address in Zustand local storage state before page loads
  6   |     // and mock window.open to prevent WhatsApp redirect from opening new windows/tabs
  7   |     await page.addInitScript(() => {
  8   |       window.open = () => null as any;
  9   |       
  10  |       const mockAddressStore = {
  11  |         state: {
  12  |           addresses: [
  13  |             {
  14  |               id: 'addr-1',
  15  |               address: '123 Ngong Road, Nairobi',
  16  |               region: 'Nairobi',
  17  |               city: 'Nairobi',
  18  |               country: 'Kenya',
  19  |               lat: '-1.2921',
  20  |               lon: '36.8219',
  21  |               isDefault: true,
  22  |               tag: 'home',
  23  |             },
  24  |           ],
  25  |           customTags: [],
  26  |           hydrated: true,
  27  |           syncNeeded: false,
  28  |         },
  29  |         version: 0,
  30  |       };
  31  |       
  32  |       window.localStorage.setItem('mymed_addresses_v3', JSON.stringify(mockAddressStore));
  33  |     });
  34  |   });
  35  | 
  36  |   test('should go through the full purchase flow', async ({ page }) => {
  37  |     // 1. Go to homepage
  38  |     await page.goto('/');
  39  | 
  40  |     // 2. Select first product and go to details page
  41  |     const productLink = page.locator('a[href^="/products/"]').first();
  42  |     await expect(productLink).toBeVisible();
  43  |     await productLink.click();
  44  | 
  45  |     // 3. Add product to cart
  46  |     // Scope to the first "Add to cart" button, which should be the main product
  47  |     const addToCartBtn = page.getByRole('button', { name: /add to cart/i }).first();
  48  |     await expect(addToCartBtn).toBeVisible();
  49  |     await addToCartBtn.click();
  50  | 
  51  |     // 4. Verify product quantity control is visible after adding to cart
  52  |     // Scope to the product info container
  53  |     const productInfo = page.locator('div').filter({ has: page.getByRole('button', { name: /add to cart/i }) }).first();
  54  |     // Re-locate using the already scoped container
  55  |     const increaseBtn = productInfo.getByRole('button', { name: /increase/i });
  56  |     await expect(increaseBtn).toBeVisible();
  57  | 
  58  |     // 5. Navigate to checkout page
> 59  |     await page.goto('/checkout');
      |                ^ Error: page.goto: Test timeout of 30000ms exceeded.
  60  | 
  61  |     // 6. Verify checkout page loads with the item in summary
  62  |     await expect(page.locator('h1')).toContainText(/checkout/i);
  63  |     // Removed faulty Order Summary assertion.
  64  |     // Instead, verify that the Delivery Address section is present.
  65  |     await expect(page.locator(':text("Delivery Address")')).toBeVisible();
  66  | 
  67  |     // 7. Verify address is pre-filled from seeded local storage
  68  |     // Since isDefault is true, the checkout page rehydrates and should pre-fill the delivery address.
  69  |     const deliveryTitle = page.locator('[data-step-index="0"]');
  70  |     await expect(deliveryTitle).toContainText(/123 Ngong Road, Nairobi/i);
  71  | 
  72  |     // 8. Fill Customer Information section (Step 1 or Active Section)
  73  |     // We target the input fields in the customer section
  74  |     await page.fill('input[placeholder="Your Full Name"]', 'Jane Doe');
  75  |     await page.fill('input[type="email"]', 'jane.doe@example.com');
  76  |     await page.fill('input[type="tel"]', '0712345678');
  77  | 
  78  |     // Click Next button to go to Review step
  79  |     const nextBtn = page.getByRole('button', { name: /next/i });
  80  |     await expect(nextBtn).toBeVisible();
  81  |     await nextBtn.click();
  82  | 
  83  |     // 9. Review and choose payment method
  84  |     // By default COD might be checked, let's explicitly click "Cash on Delivery" or cod input
  85  |     const codOption = page.locator('label:has-text("Cash on Delivery")');
  86  |     if (await codOption.isVisible()) {
  87  |       await codOption.click();
  88  |     }
  89  | 
  90  |     // 10. Click Place Order
  91  |     // The Place Order button is in the Summary Panel
  92  |     const placeOrderBtn = page.getByRole('button', { name: /place order/i });
  93  |     await expect(placeOrderBtn).toBeEnabled();
  94  |     await placeOrderBtn.click();
  95  | 
  96  |     // 11. Assert redirection to order confirmation /details page
  97  |     // The redirect goes to /orders/[random-number]
  98  |     await page.waitForURL('**/orders/*', { timeout: 8000 });
  99  |     await expect(page).toHaveURL(/\/orders\/\d+/);
  100 | 
  101 |     // Cart should be cleared after successful checkout
  102 |     await page.goto('/checkout');
  103 |     await expect(page.getByText(/your cart is empty/i)).toBeVisible();
  104 |   });
  105 | });
  106 | 
```