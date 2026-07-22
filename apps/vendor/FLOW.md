# Vendor Portal Feature Flows (`apps/vendor`)

This document outlines the complete end-to-end seller onboarding, product catalog wizard, stock inventory, order item fulfillment, and financial payout workflows for the **Vendor Portal**.

---

## E2E Vendor Lifecycle Overview

```mermaid
flowchart TD
    A[1. Vendor Registration] --> B[2. Pending Approval Guard]
    B --> C[3. Store Profile & Payout Setup]
    C --> D[4. Product Listing Creation & AI Assistant]
    D --> E[5. Stock Inventory Adjustments]
    E --> F[6. Order Fulfillment & Dispatch]
    F --> G[7. Earnings Ledgers & Payout Withdrawals]
```

---

## 1. Vendor Registration & Application Onboarding

```mermaid
sequenceDiagram
    autonumber
    actor Vendor
    participant App as Vendor App (Next.js)
    participant API as FastAPI Backend (/api/v1)
    participant DB as Database

    Vendor->>App: Navigate to /register or /login
    Vendor->>App: Fill Store Details (Store name, KMPDB/PPB license numbers, phone, email)
    App->>API: POST /api/v1/auth/register/vendor
    API->>DB: Create User (Role: 'vendor') & VendorProfile (Status: 'pending')
    API-->>App: Return User & Access JWT Token
    App->>Vendor: Redirect to /pending-vendor
```

---

## 2. Pending Approval Status Guard (`VendorGuard.tsx`)

```mermaid
flowchart TD
    A[Vendor logs in or navigates to /vendor/*] --> B[VendorGuard inspects `vendorStatus`]
    B -- status == 'pending' --> C[Redirect to /pending-vendor screen]
    B -- status == 'rejected' --> D[Display Rejection Reason screen]
    B -- status == 'suspended' --> E[Display Account Suspended screen]
    B -- status == 'approved' --> F[Grant Access to /vendor/dashboard]
```

---

## 3. Store Profile & Financial Payout Setup

```mermaid
sequenceDiagram
    autonumber
    actor Vendor
    participant App as Vendor App
    participant API as FastAPI Backend

    Vendor->>App: Navigate to /vendor/settings
    Vendor->>App: Enter M-Pesa Paybill / Till Number or Bank Account Details
    App->>API: PATCH /api/v1/vendor/profile
    API->>API: Validate account details & store operating hours
    API-->>App: 200 OK (Vendor Profile Updated)
    App-->>Vendor: Display Payout Credentials Saved Toast
```

---

## 4. Product Listing Creation & AI Assistant Flow

```mermaid
sequenceDiagram
    autonumber
    actor Vendor
    participant App as Vendor App
    participant API as FastAPI Backend
    participant Gemini as Google Gemini AI API

    Vendor->>App: Navigate to /vendor/products/new
    Vendor->>App: Enter basic product name & raw specifications

    opt AI Assistance Trigger
        Vendor->>App: Click 'Generate Description with AI'
        App->>API: POST /api/v1/catalog/ai-assist/suggest {name, raw_specs}
        API->>Gemini: Prompt Gemini for structured medical product copy & SEO tags
        Gemini-->>API: Return generated description, specifications, and category
        API-->>App: Populate form fields with AI output
    end

    Vendor->>App: Input Regulatory Fields (KMPDB reg #, PPB classification, CE/FDA marks)
    Vendor->>App: Input Base Price & Stock Quantity
    App->>App: Automatically compute Marketplace Commission & Final Customer Price

    Vendor->>App: Submit Product Form
    App->>API: POST /api/v1/catalog/products
    API-->>App: Created Product Object (ID)

    Vendor->>App: Upload Product Gallery Images
    App->>API: POST /api/v1/catalog/products/{id}/image (Multipart File)
    API->>API: Save image to /static/uploads/products/ & link ProductImage
    API-->>App: Image Saved & Marked Primary
```

---

## 5. Stock Inventory Adjustment Workflow

```mermaid
flowchart TD
    A[Vendor opens /vendor/inventory] --> B[View grid of listed products & current stock]
    B --> C[Vendor updates stock quantity or safety thresholds]
    C --> D[PATCH /api/v1/catalog/products/{id}]
    D --> E{Is Stock == 0?}
    E -- Yes --> F[Status set to 'out_of_stock' & hidden from active storefront search]
    E -- No --> G[Status set to 'published' & visible on storefront]
```

---

## 6. Order Fulfillment & Item Tracking

```mermaid
sequenceDiagram
    autonumber
    actor Vendor
    participant App as Vendor App
    participant API as FastAPI Backend
    participant CustomerApp as Customer App

    API->>App: New Customer Order Paid Notification
    Vendor->>App: Navigate to /vendor/orders
    App->>API: GET /api/v1/vendor/orders
    API-->>App: Return list of OrderItems assigned to Vendor

    Vendor->>App: Pack item & click 'Mark as Packed'
    App->>API: PATCH /api/v1/vendor/orders/items/{item_id}/fulfillment {status: 'packed'}
    API-->>App: Fulfillment Status Updated

    Vendor->>App: Hand item to courier & enter Tracking Number
    App->>API: PATCH /api/v1/vendor/orders/items/{item_id}/fulfillment {status: 'shipped', tracking_number: '...'}
    API->>CustomerApp: Push Notification & Order Timeline Event ('Item Shipped')
```

---

## 7. Financial Earnings & Payout Withdrawals

```mermaid
flowchart TD
    A[Order Item marked as 'delivered'] --> B[Platform releases funds after return window]
    B --> C[Gross Sales Amount credited to Vendor Balance]
    C --> D[Platform Commission Fee automatically deducted & logged]
    D --> E[Vendor views net balance on /vendor/earnings]
    E --> F[Automated Payout triggered to Vendor M-Pesa Paybill / Bank Account]
```
