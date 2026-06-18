# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: order-returns.spec.ts >> Order Returns >> should submit a return request with selected items
- Location: e2e/order-returns.spec.ts:13:7

# Error details

```
Test timeout of 30000ms exceeded.
```

```
Error: locator.click: Test timeout of 30000ms exceeded.
Call log:
  - waiting for getByRole('button', { name: /request return/i })

```

# Page snapshot

```yaml
- generic [ref=e2]: "{\"success\":true,\"data\":{\"items\":[],\"total\":0}}"
```

# Test source

```ts
  1  | // apps/customer/e2e/order-returns.spec.ts
  2  | import { test, expect } from '@playwright/test';
  3  | 
  4  | test.describe('Order Returns', () => {
  5  |   test.beforeEach(async ({ context }) => {
  6  |     await context.addCookies([{
  7  |       name: 'auth_token',
  8  |       value: 'demo-customer-token',
  9  |       url: 'http://localhost:3000',
  10 |     }]);
  11 |   });
  12 | 
  13 |   test('should submit a return request with selected items', async ({ page }) => {
  14 |     // Mock the returns API
  15 |     await page.route('**/returns', async route => {
  16 |       if (route.request().method() === 'POST') {
  17 |         const postData = route.request().postDataJSON();
  18 |         // Assert that items are sent
  19 |         expect(postData.items.length).toBeGreaterThan(0);
  20 |         
  21 |         await route.fulfill({
  22 |           json: {
  23 |             success: true,
  24 |             data: {
  25 |               id: 'ret-1',
  26 |               return_number: 'RET-123',
  27 |               status: 'pending',
  28 |               reason: postData.reason,
  29 |               created_at: new Date().toISOString(),
  30 |               items: []
  31 |             }
  32 |           }
  33 |         });
  34 |       } else {
  35 |         await route.fulfill({ json: { success: true, data: { items: [], total: 0 } } });
  36 |       }
  37 |     });
  38 | 
  39 |     // Mock the orders API so the dialog has orders to select from
  40 |     await page.route('**/orders*', async route => {
  41 |       await route.fulfill({
  42 |         json: {
  43 |           success: true,
  44 |           data: {
  45 |             orders: [
  46 |               {
  47 |                 id: 'order-1',
  48 |                 number: 'ORD-123',
  49 |                 items: [{ id: 'item-1', product_name: 'Test Product', quantity: 1, total: 100 }]
  50 |               }
  51 |             ],
  52 |             total: 1
  53 |           }
  54 |         }
  55 |       });
  56 |     });
  57 | 
  58 |     await page.goto('/dashboard/returns');
  59 |     
> 60 |     await page.getByRole('button', { name: /request return/i }).click();
     |                                                                 ^ Error: locator.click: Test timeout of 30000ms exceeded.
  61 |     
  62 |     // In the dialog, select the order (assuming we change the UI to a dropdown or type the ID)
  63 |     await page.fill('input[placeholder*="order ID"]', 'order-1');
  64 |     
  65 |     // In a real implementation we would select items. We will just check that items were sent in the payload.
  66 |     await page.getByRole('combobox').click();
  67 |     await page.getByRole('option', { name: /defective/i }).click();
  68 |     
  69 |     await page.getByRole('button', { name: /submit request/i }).click();
  70 |     
  71 |     await expect(page.getByText('Return request created successfully')).toBeVisible();
  72 |   });
  73 | });
  74 | 
```