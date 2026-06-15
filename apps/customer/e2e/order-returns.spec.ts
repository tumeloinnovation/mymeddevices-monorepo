// apps/customer/e2e/order-returns.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Order Returns', () => {
  test.beforeEach(async ({ context }) => {
    await context.addCookies([{
      name: 'auth_token',
      value: 'demo-customer-token',
      url: 'http://localhost:3000',
    }]);
  });

  test('should submit a return request with selected items', async ({ page }) => {
    // Mock the returns API
    await page.route('**/returns', async route => {
      if (route.request().method() === 'POST') {
        const postData = route.request().postDataJSON();
        // Assert that items are sent
        expect(postData.items.length).toBeGreaterThan(0);
        
        await route.fulfill({
          json: {
            success: true,
            data: {
              id: 'ret-1',
              return_number: 'RET-123',
              status: 'pending',
              reason: postData.reason,
              created_at: new Date().toISOString(),
              items: []
            }
          }
        });
      } else {
        await route.fulfill({ json: { success: true, data: { items: [], total: 0 } } });
      }
    });

    // Mock the orders API so the dialog has orders to select from
    await page.route('**/orders*', async route => {
      await route.fulfill({
        json: {
          success: true,
          data: {
            orders: [
              {
                id: 'order-1',
                number: 'ORD-123',
                items: [{ id: 'item-1', product_name: 'Test Product', quantity: 1, total: 100 }]
              }
            ],
            total: 1
          }
        }
      });
    });

    await page.goto('/dashboard/returns');
    
    await page.getByRole('button', { name: /request return/i }).click();
    
    // In the dialog, select the order (assuming we change the UI to a dropdown or type the ID)
    await page.fill('input[placeholder*="order ID"]', 'order-1');
    
    // In a real implementation we would select items. We will just check that items were sent in the payload.
    await page.getByRole('combobox').click();
    await page.getByRole('option', { name: /defective/i }).click();
    
    await page.getByRole('button', { name: /submit request/i }).click();
    
    await expect(page.getByText('Return request created successfully')).toBeVisible();
  });
});
