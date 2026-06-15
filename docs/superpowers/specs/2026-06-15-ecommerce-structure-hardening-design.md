# Ecommerce Structure Hardening Design

## 1. Overview
This design outlines the architecture for hardening the ecommerce logic (orders and shipping) in the MyMedDevices platform. The goals are to secure transactional integrity, enforce valid state transitions, and guarantee correct data authorization for users, vendors, and admins.

## 2. Architecture & Data Flow (Transactional Outbox)
### Components
*   **Outbox Model:** A new `outbox_events` table will be created to store pending events securely (`id`, `aggregate_type`, `aggregate_id`, `event_type`, `payload`, `status`, `created_at`).
*   **Unit of Work / DB Commit:** When domain services (like `CheckoutService`) perform an action (e.g., creating an order), the state changes and the corresponding event (e.g., `OrderCreated`) are inserted into the database within the *exact same transaction*.
*   **Outbox Relay:** A background process (via Celery or a dedicated worker) polls the `outbox_events` table for unprocessed events, dispatches them to their final destination, and marks them as `processed`.
*   **Internal Event Bus:** Events like `OrderPaid` or `OrderCreated` trigger side-effects (e.g., `EmailNotificationService` dispatching emails) completely asynchronously, ensuring checkout operations do not block or fail due to third-party outages.

### Data Flow Example (Checkout)
1. User clicks Checkout.
2. `CheckoutService` runs the business logic.
3. Database transaction: Insert `Order`, `OrderItem`s, and `OutboxEvent` atomically.
4. Database commit.
5. Background Relay picks up the `OutboxEvent`.
6. Background Relay pushes a task to Celery.
7. Celery executes the side-effect (e.g., sending an email).

## 3. State Machines & Data Integrity
### Order State Machine
*   Strict linear and branching transitions: `PENDING` -> `PAID` -> `PROCESSING` -> `SHIPPED` -> `DELIVERED`.
*   Terminal states: `CANCELLED` and `REFUNDED`.
*   Domain constraints will raise `InvalidStateTransitionError` if an illegal transition is attempted, preventing the database commit.

### Shipment State Machine
*   Statuses: `CREATED` -> `IN_TRANSIT` -> `DELIVERED` / `EXCEPTION`.
*   State rules: Shipments can only be created if the associated Order is `PAID` or `PROCESSING`.

### Data Integrity Measures
*   **Pricing Snapshots:** The `CheckoutService` will map `current_product_price` directly to `unit_price` on `OrderItem` entities, freezing the pricing at checkout.
*   **Currency Handling:** Currency will be explicitly handled and validated, removing hardcoded fallbacks where inappropriate.
*   **Idempotency:** Implement or utilize existing `idempotency_key` fields to prevent duplicate order generation in the event of retries.

## 4. Access Control & Security (RBAC/Auth)
### Service-Level Authorization
*   **Customer Scope:** Methods like `OrderService.get_order` will verify that `order.user_id == current_user_id`.
*   **Vendor Scope:** Vendors querying the API will only receive `OrderItem` entities and subtotals belonging to their `vendor_id`. Vendors will be restricted from viewing or updating items belonging to other vendors on the same order.
*   **Admin Scope:** Administrators bypass vendor/customer restrictions and can view or update all items.

### API Layer Guards
*   All endpoints will be secured by FastAPI dependencies (e.g., `RequireRole(["vendor", "admin"])`).
*   Vendors are strictly restricted to creating shipments only for their specific items.

## 5. Error Handling and Testing
### Errors
*   Invalid transitions or unauthorized access will throw domain exceptions mapped to standard `400 Bad Request` or `403 Forbidden` API errors.
*   Side-effect failures (e.g., email timeouts) will be handled by Celery retry policies.

### Testing Strategy
*   Unit tests validating state transitions (Order and Shipment).
*   Integration tests verifying Row-Level authorization rules for Customers and Vendors.
*   End-to-End/Unit tests for the Outbox Relay logic.
