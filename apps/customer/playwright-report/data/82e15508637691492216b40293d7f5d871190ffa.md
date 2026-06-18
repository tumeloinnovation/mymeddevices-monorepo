# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: auth.spec.ts >> Authentication E2E Tests >> should show validation/error states on empty fields
- Location: e2e/auth.spec.ts:29:7

# Error details

```
Error: expect(page).toHaveURL(expected) failed

Expected pattern: /\/login/
Received string:  "http://localhost:3000/"
Timeout: 5000ms

Call log:
  - Expect "toHaveURL" with timeout 5000ms
    14 × unexpected value "http://localhost:3000/"

```

```yaml
- region "Notifications alt+T"
- dialog "Login to your account":
  - heading "Login to your account" [level=2]
  - paragraph: Enter your email and password to access your account
  - img
  - text: MyMedDevices
  - heading "Welcome Back" [level=2]
  - paragraph: Access your account and orders
  - button "Login"
  - button "Register"
  - text: Email Address
  - img
  - textbox "Email Address":
    - /placeholder: you@example.com
  - text: Password
  - button "Forgot Password?"
  - img
  - textbox "Password":
    - /placeholder: ••••••••
  - button:
    - img
  - button "Login to Account"
  - button "Close":
    - img
    - text: Close
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
  9  |     await expect(page.locator('h1, h2, h3, .card-title').filter({ hasText: 'Login' })).toBeVisible();
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
> 36 |     await expect(page).toHaveURL(/\/login/);
     |                        ^ Error: expect(page).toHaveURL(expected) failed
  37 |   });
  38 | });
  39 | 
```