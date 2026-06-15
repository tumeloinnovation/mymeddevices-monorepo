// apps/customer/e2e/order-tracking.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Order Tracking', () => {
  test('should display tracking information for an order', async ({ page }) => {
    // Intercept API calls to provide mock data for predictable testing
    await page.route('**/orders*', async route => {
      const json = {
        success: true,
        data: {
          orders: [
            {
              id: 'order-1',
              number: 'ORD-12345',
              status: 'shipped',
              total: 100,
              created_at: new Date().toISOString()
            }
          ],
          total: 1
        }
      };
      await route.fulfill({ json });
    });

    await page.route('**/orders/order-1/tracking', async route => {
      const json = {
        success: true,
        data: {
          tracking_number: 'REAL-TRACK-999',
          status: 'shipped',
          history: [
            { status: 'pending', timestamp: new Date().toISOString(), description: 'Order placed' }
          ]
        }
      };
      await route.fulfill({ json });
    });

    await page.goto('/dashboard/orders/order-1');
    
    // We expect the real tracking number, not the hardcoded 1Z999...
    await expect(page.getByText('REAL-TRACK-999')).toBeVisible();
  });
});
