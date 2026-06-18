# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: auth.spec.ts >> Authentication E2E Tests >> should log in as a demo customer and redirect to dashboard
- Location: e2e/auth.spec.ts:4:7

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: locator('h1, h2, h3, .card-title').filter({ hasText: 'Login' })
Expected: visible
Timeout: 5000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 5000ms
  - waiting for locator('h1, h2, h3, .card-title').filter({ hasText: 'Login' })

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
  - text: BEST SELLER
  - paragraph: Foldable and durable design
  - heading "Pediatric Wheelchair" [level=1]
  - paragraph: BT973-35/BA021
  - paragraph: Starts from
  - paragraph: KSh 13,000
  - link "SHOP NOW":
    - /url: /products/wheelchair-peadiatric-bt973-35-ba021
  - img "Modern Medical Device"
  - button
  - button
  - button
  - heading "Mobility Solutions" [level=3]
  - link "View more":
    - /url: /categories/mobility-rehabilitation-aids
  - img "Modern Wheelchair"
  - heading "Diagnostic Equipment" [level=3]
  - paragraph: Up to 20% Discount
  - link "View more":
    - /url: /categories/diagnostic-devices
  - img "Digital Blood Pressure Monitor"
  - main:
    - heading "Special Offers" [level=2]
    - button "Previous"
    - button "Next"
    - paragraph: Discover exclusive deals and discounts on our top products. Limited-time offers you don't want to miss!
    - heading "Trending Now" [level=2]
    - button "Previous"
    - button "Next"
    - paragraph: Discover what other healthcare professionals are buying right now.
    - heading "Medical devices for care teams and home patients." [level=1]
    - paragraph: Browse certified devices, compare specs, and get same-day shipping on select items. Trusted by clinics and caregivers across the region.
    - text: Search devices
    - textbox "Search devices":
      - /placeholder: Search devices, e.g. blood pressure monitor
    - button "Shop Now"
    - text: Express delivery Same day if ordered by 7pm Customer Support 7 days a week Genuine Products 100% certified Easy Payments M-Pesa, Visa, MasterCard
    - img "An adult daughter in a Kenyan setting helping her elderly father check his blood pressure at home."
    - heading "Featured Products" [level=2]
    - button "Previous"
    - button "Next"
    - paragraph: Hand-picked medical devices and equipment curated for quality and reliability.
    - heading "New Arrivals" [level=2]
    - button "Previous"
    - button "Next"
    - paragraph: Be the first to explore our latest medical technology and equipment.
    - heading "Shop By Categories" [level=2]
    - button "Previous"
    - button "Next"
    - paragraph: Check out all the feature categories for simple product discovery.
  - text: Newsletter
  - heading "Stay in the Loop" [level=2]
  - paragraph: Subscribe to receive new arrivals, special offers, and updates directly in your inbox.
  - textbox "Enter your email"
  - button "Subscribe"
  - paragraph: We respect your privacy. Unsubscribe anytime.
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
  1  | import { test, expect } from '@playwright/test';
  2  | 
  3  | test.describe('Authentication E2E Tests', () => {
  4  |   test('should log in as a demo customer and redirect to dashboard', async ({ page }) => {
  5  |     // Navigate to login page
  6  |     await page.goto('/login');
  7  | 
  8  |     // Verify login page elements
> 9  |     await expect(page.locator('h1, h2, h3, .card-title').filter({ hasText: 'Login' })).toBeVisible();
     |                                                                                        ^ Error: expect(locator).toBeVisible() failed
  10 | 
  11 |     // Fill out login credentials
  12 |     await page.fill('#login-email', 'customer@meddevices.com');
  13 |     await page.fill('#login-password', 'password123');
  14 | 
  15 |     // Click submit button
  16 |     await page.click('button[type="submit"]');
  17 | 
  18 |     // Should show loading spinner/state or redirect immediately
  19 |     // The login process has a mock delay of 1.5 seconds, so we wait for navigation to /dashboard
  20 |     await page.waitForURL('**/dashboard', { timeout: 15000 }); // Increase timeout to 15s to be safe
  21 | 
  22 |     // Assert that we are in the customer dashboard
  23 |     await expect(page).toHaveURL(/\/dashboard/);
  24 |     
  25 |     // Check that John Doe's welcome message is displayed
  26 |     await expect(page.getByText(/John Doe/i).first()).toBeVisible();
  27 |   });
  28 | 
  29 |   test('should show validation/error states on empty fields', async ({ page }) => {
  30 |     await page.goto('/login');
  31 |     
  32 |     // Click submit button without filling anything
  33 |     await page.click('button[type="submit"]:has-text("Login")');
  34 | 
  35 |     // HTML5 validation or form errors should prevent redirect
  36 |     await expect(page).toHaveURL(/\/login/);
  37 |   });
  38 | });
  39 | 
```