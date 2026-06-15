# Order, Returns, and Tracking E2E Implementation Design

## 1. Overview
This document outlines the test-driven implementation (TDD/E2E first) to ensure that customer order placement, order returns, and order tracking functionalities are fully working and verified in the MyMedDevices application. 

Currently, order placement is implemented and partially tested, while Returns and Tracking UIs are stubbed out with mock data. We will write E2E tests first, then implement the missing UI integrations.

## 2. Test Suite Architecture (E2E First)
We will leverage Playwright to create End-to-End tests in the `apps/customer/e2e` directory.

- **Orders (`cart-checkout.spec.ts`)**: 
  - Ensure the existing flow covers adding an item, checking out, and landing on the order confirmation page.
- **Returns (`order-returns.spec.ts`)**:
  - Navigate to the Returns dashboard (`/dashboard/returns`).
  - Open the "Request Return" dialog.
  - Fill in an Order ID, select items to return, select a reason, and submit.
  - Verify that the new return request appears in the list.
- **Tracking (`order-tracking.spec.ts`)**:
  - Navigate to an order's detail page (`/dashboard/orders/[id]`).
  - Verify that the page displays the actual tracking number and tracking events rather than the hardcoded mockup.

## 3. UI Implementation Details

### 3.1 Returns UI Integration
- **File**: `apps/customer/app/(shop)/dashboard/returns/page.tsx`
- **Changes**:
  - Refactor `NewReturnDialog` to allow the user to select specific items from the provided order.
  - Remove the mocked `items: []` payload in the `createMutation`.
  - Pass the correct selected items and quantities to `customerReturnsApi.create()`.

### 3.2 Tracking UI Integration
- **File**: `apps/customer/app/(shop)/dashboard/orders/[id]/page.tsx`
- **Changes**:
  - Remove the hardcoded `trackingNumber="1Z999AA10123456784"` parameter being passed to `<ShipmentTracking />`.
  - Pass the dynamic `order.tracking_number` from the fetched order data.
  - Ensure the `ShipmentTracking` component correctly displays events fetched from the API (if history is provided).

## 4. Backend Dependencies
- **Order Tracking**: The backend `GET /orders/{order_id}/tracking` endpoint currently provides simulated tracking history based on the order's `status` and `updated_at`. The frontend will consume this.
- **Returns**: The backend `POST /returns` endpoint already expects an array of items. The UI will now correctly send this.

## 5. Deployment / Execution Strategy
1. Create the failing E2E tests.
2. Implement the UI fixes to remove mocked data.
3. Run the E2E tests and ensure they all pass.