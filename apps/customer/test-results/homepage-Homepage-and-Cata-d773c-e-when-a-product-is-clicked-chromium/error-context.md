# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: homepage.spec.ts >> Homepage and Catalog E2E Tests >> should navigate to product detail page when a product is clicked
- Location: e2e/homepage.spec.ts:20:7

# Error details

```
Error: expect(page).toHaveURL(expected) failed

Expected pattern: /\/products\/[a-z0-9-]+/
Received string:  "http://localhost:3000/"
Timeout: 5000ms

Call log:
  - Expect "toHaveURL" with timeout 5000ms
    9 × unexpected value "http://localhost:3000/"

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
  - text: NEW ARRIVAL
  - paragraph: Ideal for Carpal Tunnel recovery
  - heading "Wrist & Forearm Brace" [level=1]
  - paragraph: Universal Support
  - paragraph: Starts from
  - paragraph: KSh 1,920
  - link "SHOP NOW":
    - /url: /products/wrist-forearm-brace-universal
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
    - paragraph: No products found.
    - heading "Trending Now" [level=2]
    - button "Previous"
    - button "Next"
    - paragraph: Discover what other healthcare professionals are buying right now.
    - paragraph: No products found.
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
    - paragraph: No products found.
    - heading "New Arrivals" [level=2]
    - button "Previous"
    - button "Next"
    - paragraph: Be the first to explore our latest medical technology and equipment.
    - img "SMART WATCH MONITOR"
    - text: ★ 4.5 (24)
    - button "Add to wishlist"
    - button "Share"
    - button "View related products"
    - heading "SMART WATCH MONITOR" [level=3]
    - paragraph: Ksh. 12,800
    - button "Add to cart"
    - img "INFRA RED THERMOMETER JA 11S"
    - text: ★ 4.5 (24)
    - button "Add to wishlist"
    - button "Share"
    - button "View related products"
    - heading "INFRA RED THERMOMETER JA 11S" [level=3]
    - paragraph: Ksh. 1,920
    - button "Add to cart"
    - img "Glucose meter AC303"
    - text: ★ 4.5 (24)
    - button "Add to wishlist"
    - button "Share"
    - button "View related products"
    - heading "Glucose meter AC303" [level=3]
    - paragraph: Ksh. 1,999.36
    - button "Add to cart"
    - img "INFRA RED THERMOMETER JA 11C"
    - text: ★ 4.5 (24)
    - button "Add to wishlist"
    - button "Share"
    - button "View related products"
    - heading "INFRA RED THERMOMETER JA 11C" [level=3]
    - paragraph: Ksh. 1,920
    - button "Add to cart"
    - img "CLINICAL ELECTRONIC THERMOMETER FLEXIBLE TIP JA-12A"
    - text: ★ 4.5 (24)
    - button "Add to wishlist"
    - button "Share"
    - button "View related products"
    - heading "CLINICAL ELECTRONIC THERMOMETER FLEXIBLE TIP JA-12A" [level=3]
    - paragraph: Ksh. 208
    - button "Add to cart"
    - img "CLINICAL ELECTRONIC THERMOMETER FIRM TIP JA-12A"
    - text: ★ 4.5 (24)
    - button "Add to wishlist"
    - button "Share"
    - button "View related products"
    - heading "CLINICAL ELECTRONIC THERMOMETER FIRM TIP JA-12A" [level=3]
    - paragraph: Ksh. 208
    - button "Add to cart"
    - img "Digital Personal Weighing Scale"
    - text: ★ 4.5 (24)
    - button "Add to wishlist"
    - button "Share"
    - button "View related products"
    - heading "Digital Personal Weighing Scale" [level=3]
    - paragraph: Ksh. 3,200
    - button "Add to cart"
    - img "YASEE TYPE BLOOD PRESSURE MONITOR JN-163B"
    - text: ★ 4.5 (24)
    - button "Add to wishlist"
    - button "Share"
    - button "View related products"
    - heading "YASEE TYPE BLOOD PRESSURE MONITOR JN-163B" [level=3]
    - paragraph: Ksh. 6,144
    - button "Add to cart"
    - img "TEMPERATURE AND HUMIDITY DATA LOGGER"
    - text: ★ 4.5 (24)
    - button "Add to wishlist"
    - button "Share"
    - button "View related products"
    - heading "TEMPERATURE AND HUMIDITY DATA LOGGER" [level=3]
    - paragraph: Ksh. 15,000
    - button "Add to cart"
    - img "Wheelchair Peadiatric BT973-35/BA021"
    - text: ★ 4.5 (24)
    - button "Add to wishlist"
    - button "Share"
    - button "View related products"
    - heading "Wheelchair Peadiatric BT973-35/BA021" [level=3]
    - paragraph: Ksh. 13,125
    - button "Add to cart"
    - heading "Shop By Categories" [level=2]
    - button "Previous"
    - button "Next"
    - paragraph: Check out all the feature categories for simple product discovery.
    - link "Browse Monitoring Devices products":
      - /url: /categories/monitoring-devices
      - img "Monitoring Devices"
      - heading "Monitoring Devices" [level=3]
      - text: 24 items
    - link "Browse Mobility & Rehabilitation Aids products":
      - /url: /categories/mobility-rehabilitation-aids
      - img "Mobility & Rehabilitation Aids"
      - heading "Mobility & Rehabilitation Aids" [level=3]
      - text: 18 items
    - link "Browse Respiratory Equipment products":
      - /url: /categories/respiratory-equipment
      - img "Respiratory Equipment"
      - heading "Respiratory Equipment" [level=3]
      - text: 12 items
    - link "Browse Diagnostic Devices products":
      - /url: /categories/diagnostic-devices
      - img "Diagnostic Devices"
      - heading "Diagnostic Devices" [level=3]
      - text: 15 items
    - link "Browse Home Care Equipment products":
      - /url: /categories/home-care-equipment
      - img "Home Care Equipment"
      - heading "Home Care Equipment" [level=3]
      - text: 10 items
    - link "Browse Orthotics & Braces products":
      - /url: /categories/orthotics-braces
      - img "Orthotics & Braces"
      - heading "Orthotics & Braces" [level=3]
      - text: 14 items
    - link "Browse Blood Pressure Monitors products":
      - /url: /categories/blood-pressure-monitors
      - img "Blood Pressure Monitors"
      - heading "Blood Pressure Monitors" [level=3]
      - text: 8 items
    - link "Browse Glucose Monitors products":
      - /url: /categories/glucose-monitors
      - img "Glucose Monitors"
      - heading "Glucose Monitors" [level=3]
      - text: 6 items
    - link "Browse Pulse Oximeters products":
      - /url: /categories/pulse-oximeters
      - img "Pulse Oximeters"
      - heading "Pulse Oximeters" [level=3]
      - text: 5 items
    - link "Browse Thermometers products":
      - /url: /categories/thermometers
      - img "Thermometers"
      - heading "Thermometers" [level=3]
      - text: 5 items
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
  3  | test.describe('Homepage and Catalog E2E Tests', () => {
  4  |   test('should load the homepage and show main sections', async ({ page }) => {
  5  |     // Navigate to homepage
  6  |     await page.goto('/');
  7  | 
  8  |     // Check page title
  9  |     await expect(page).toHaveTitle(/MyMedDevices/i);
  10 | 
  11 |     // Verify presence of Hero Section content (e.g. Medical marketplace text)
  12 |     await expect(page.getByText(/medical/i).first()).toBeVisible();
  13 | 
  14 |     // Verify homepage headings
  15 |     await expect(page.getByRole('heading', { name: 'Special Offers' })).toBeVisible();
  16 |     await expect(page.getByRole('heading', { name: 'Featured Products' })).toBeVisible();
  17 |     await expect(page.getByRole('heading', { name: 'Shop By Categories' })).toBeVisible();
  18 |   });
  19 | 
  20 |   test('should navigate to product detail page when a product is clicked', async ({ page }) => {
  21 |     await page.goto('/');
  22 | 
  23 |     // Find a product link directly using a broad selector to ensure it is found
  24 |     const productLink = page.locator('a[href*="/products/"]').first();
  25 |     
  26 |     await expect(productLink).toBeVisible();
  27 |     const productTitle = await productLink.innerText();
  28 | 
  29 |     // Click the product link and wait for navigation
  30 |     await Promise.all([
  31 |       page.waitForNavigation(),
  32 |       productLink.click()
  33 |     ]);
  34 | 
  35 |     // Should navigate to product detail page
> 36 |     await expect(page).toHaveURL(/\/products\/[a-z0-9-]+/);
     |                        ^ Error: expect(page).toHaveURL(expected) failed
  37 | 
  38 |     // Should display the product title or name on the detail page
  39 |     await expect(page.locator('h1')).toBeVisible();
  40 |   });
  41 | });
  42 | 
```