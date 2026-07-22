# Customer Portal Feature Flows (`apps/customer`)

This document outlines the complete end-to-end user journeys, functional workflows, and feature lifecycles for the **Customer Portal**.

---

## E2E Customer Journey Overview

```mermaid
flowchart TD
    A[1. Discovery & Browsing] --> B[2. Cart Addition & Guest Session]
    B --> C[3. Authentication & Cart Sync]
    C --> D[4. Prescription Upload (Optional)]
    D --> E[5. Delivery Address & Shipping Fee Calculation]
    E --> F[6. Checkout & M-Pesa STK Push Payment]
    F --> G[7. Post-Purchase Tracking & Loyalty Ledger]
```

---

## 1. Discovery & Catalog Browsing

```mermaid
sequenceDiagram
    autonumber
    actor User as Customer
    participant App as Customer App (Next.js)
    participant API as FastAPI Backend (/api/v1)
    participant Search as Typesense Search

    User->>App: Navigate to / or /products
    App->>API: GET /api/v1/storefront/products?category=...&brand=...
    API->>Search: Query indexed catalog
    Search-->>API: Return matched published products
    API-->>App: Return Product DTOs (Pricing, Stock, Regulatory badges)
    App-->>User: Render responsive product grid with badges (KMPDB/PPB certified)

    User->>App: Click Product Card
    App->>API: GET /api/v1/storefront/products/{slug}
    API-->>App: Full Product Detail (Variants, Specs, Vendor info, Reviews)
    App-->>User: Display Product Detail Page (PDP)
```

### Features & Rules
- **Regulatory Badges**: Products display KMPDB registration status, PPB classification, and CE/FDA clearance marks.
- **Price Transparency**: Base price + transparent marketplace fee structure.
- **Fuzzy Search & Filters**: Multi-faceted filter by medical category, brand, price range, stock availability, and tags.

---

## 2. Guest Shopping & Hybrid Cart Management

```mermaid
flowchart TD
    A[Customer clicks 'Add to Cart'] --> B{Is User Logged In?}
    B -- No (Guest) --> C[Add item to Zustand `useCartStore`]
    C --> D[Save item array in browser localStorage]
    D --> E[Display item count badge & Slide-over Cart Drawer]
    B -- Yes (Authenticated) --> F[POST /api/v1/shopping/cart/items]
    F --> G[Update Backend Cart Entity]
    G --> E
```

### Features & Rules
- **Guest Storage**: Cart items persist in `localStorage` (`cart-storage`).
- **Quantity Adjustments**: Incremental updates, item removal, and custom clinical notes.
- **Coupon Application**: Instant validation of promo codes (`POST /api/v1/shopping/coupons/apply`).

---

## 3. Authentication & Cart Synchronization

```mermaid
sequenceDiagram
    autonumber
    actor Customer
    participant App as Customer App
    participant Store as Zustand Auth Store
    participant API as FastAPI Backend

    Customer->>App: Click Login / Checkout
    App->>App: Open Inline Login Modal (/?login=true)
    Customer->>App: Submit Email & Password (or Request OTP)
    App->>API: POST /api/v1/auth/login
    API-->>App: Return User, Access JWT Token, Refresh Token
    App->>Store: Set Auth State & Save Tokens

    Note over App, API: Automatic Cart Sync Trigger
    App->>API: POST /api/v1/shopping/cart/merge (Payload: Guest Local Items)
    API->>API: Merge Guest Quantities into Customer's Backend Cart Entity
    API-->>App: Return Merged Cart Object
    App->>Store: Clear Local Guest Cart & Sync State
```

---

## 4. Medical Prescription Handling Workflow

```mermaid
flowchart TD
    A[Customer orders restricted medical device requiring prescription] --> B[System flags prescription requirement on item]
    B --> C[Customer uploads PDF/Image prescription at checkout or /dashboard/prescriptions]
    C --> D[POST /api/v1/customers/me/prescriptions]
    D --> E[Prescription status marked as 'pending_verification']
    E --> F[Pharmacist / Admin verifies prescription validity]
    F -- Approved --> G[Order processing unlocked for fulfillment]
    F -- Rejected --> H[Customer notified via email/SMS with rejection reason]
```

---

## 5. Address Selection & Dynamic Shipping Calculation

```mermaid
sequenceDiagram
    autonumber
    actor Customer
    participant App as Customer App
    participant Maps as Google Places API
    participant API as FastAPI Backend

    Customer->>App: Select / Add Shipping Address
    App->>Maps: Type location name -> Autocomplete suggestions
    Maps-->>App: Return Place ID, Latitude, Longitude, Formatted Address
    App->>API: POST /api/v1/customers/me/addresses
    API-->>App: Saved Address Object

    App->>API: POST /api/v1/shopping/shipping/calculate {address_id, vendor_ids}
    API->>API: Compute distance matrix between vendor stores and customer location
    API-->>App: Shipping fee breakdown per vendor shipment
```

---

## 6. Checkout & M-Pesa Daraja Payment Execution

```mermaid
sequenceDiagram
    autonumber
    actor Customer
    participant App as Customer App
    participant API as FastAPI Backend
    participant MPesa as Safaricom M-Pesa API
    participant Phone as Customer Mobile Phone

    Customer->>App: Click 'Place Order & Pay with M-Pesa'
    App->>API: POST /api/v1/shopping/checkout (Validate stock & prices)
    API-->>App: Checkout Validated
    App->>API: POST /api/v1/shopping/orders (Create Order Header & Items)
    API-->>App: Order Created (Status: 'pending')

    App->>API: POST /api/v1/payments/stk-push {order_id, phone_number}
    API->>MPesa: Trigger Daraja STK Push Request
    MPesa-->>API: STK Prompt Accepted
    MPesa->>Phone: SIM Pop-up: "Pay Ksh X to MyMedDevices? Enter PIN"
    Customer->>Phone: Enter M-Pesa PIN & Confirm

    Phone->>MPesa: PIN Authorized
    MPesa->>API: POST /api/v1/payments/callback (Webhook Payload)
    API->>API: Record Transaction Receipt & Update Order -> 'paid'
    API-->>App: Real-time status query returns 'payment_success'
    App-->>Customer: Display Order Confirmation Page (/dashboard/orders/{id})
```

---

## 7. Post-Purchase Tracking & Loyalty Ledger

```mermaid
flowchart TD
    A[Order Status updated to 'paid'] --> B[Vendor notified to fulfill order items]
    B --> C[Customer tracks real-time status timeline on /dashboard/orders/{id}]
    C --> D[Shipment marked as 'delivered']
    D --> E[Loyalty points automatically calculated & added to customer ledger]
    E --> F[Customer can write product review or request support return]
```
