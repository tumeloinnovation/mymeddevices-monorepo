# Admin Portal Feature Flows (`apps/admin`)

This document outlines the complete internal governance workflows, vendor moderation, regulatory product catalog oversight, user administration, and system configuration flows for the **Admin Portal**.

---

## E2E Admin Governance Overview

```mermaid
flowchart TD
    A[1. Admin Login & System Overview] --> B[2. Vendor Moderation Desk]
    B --> C[3. Product Catalog Oversight]
    C --> D[4. Customer & Staff User Management]
    D --> E[5. Global Orders & Refund Processing]
    E --> F[6. System Settings & Gateway Management]
```

---

## 1. Secure Admin Authentication & System Diagnostics

```mermaid
sequenceDiagram
    autonumber
    actor Admin
    participant App as Admin App (Next.js)
    participant API as FastAPI Backend (/api/v1)
    participant DB as Database

    Admin->>App: Navigate to /login
    Admin->>App: Enter Admin Email & Password
    App->>API: POST /api/v1/auth/login
    API->>DB: Verify Admin Role (`role == 'admin'`)
    API-->>App: Return User & Admin JWT Token
    App->>Admin: Redirect to /dashboard

    App->>API: GET /api/v1/admin/status
    API-->>App: Health DTO (DB status, Redis status, Uptime, Rate limiters)
    App-->>Admin: Display System Overview Dashboard Widgets
```

---

## 2. Vendor Application Moderation Desk

```mermaid
sequenceDiagram
    autonumber
    actor Admin
    participant App as Admin App
    participant API as FastAPI Backend
    participant Mail as Async SMTP Mailer
    actor Vendor

    Admin->>App: Navigate to /dashboard/vendors
    App->>API: GET /api/v1/admin/vendors/overview
    API-->>App: Return List of Vendor Applications (Pending, Approved, Suspended)

    Admin->>App: Click 'Review Vendor Application'
    App-->>Admin: Display Store details, KMPDB/PPB license numbers, contact info

    alt Approve Vendor
        Admin->>App: Click 'Approve Vendor Application'
        App->>API: PATCH /api/v1/admin/vendors/{id}/approve {status: 'approved'}
        API->>API: Update VendorProfile status -> 'approved'
        API->>Mail: Trigger `vendor_approved.html` email template
        Mail-->>Vendor: Email notification "Store Application Approved!"
        API-->>App: 200 OK (Vendor Approved)
    else Reject / Suspend Vendor
        Admin->>App: Click 'Reject' or 'Suspend' with Reason Notes
        App->>API: PATCH /api/v1/admin/vendors/{id}/approve {status: 'rejected', notes: '...'}
        API->>Mail: Trigger rejection email template
        API-->>App: 200 OK (Vendor Status Updated)
    end
```

---

## 3. Global Product Catalog & Regulatory Moderation

```mermaid
flowchart TD
    A[Admin navigates to /dashboard/catalog/products] --> B[Inspect published & pending product listings]
    B --> C{Check Regulatory Compliance}
    C -- Valid Registration numbers --> D[Maintain 'published' state]
    C -- Invalid / Missing Registration --> E[Admin sets status to 'archived' or 'draft']
    E --> F[Vendor notified to update regulatory documents]

    G[Admin navigates to /dashboard/catalog/categories] --> H[Reorder category tree via `@dnd-kit` drag-and-drop]
    H --> I[PATCH /api/v1/catalog/categories/{id} with new sort order]
```

---

## 4. Customer & Staff Account Management

```mermaid
sequenceDiagram
    autonumber
    actor Admin
    participant App as Admin App
    participant API as FastAPI Backend

    Admin->>App: Navigate to /dashboard/users
    App->>API: GET /api/v1/admin/customers
    API-->>App: Return Customer list with order counts & registration dates

    opt Suspend Malicious Account
        Admin->>App: Toggle Customer Status -> 'suspended'
        App->>API: PATCH /api/v1/admin/customers/{id}/status {is_active: false}
        API-->>App: Account Suspended (Access Token revoked via Blacklist)
    end

    opt Invite New Admin Staff
        Admin->>App: Click 'Invite Staff Member' modal
        Admin->>App: Input email & role ('admin' or 'worker')
        App->>API: POST /api/v1/admin/staff {email, role}
        API-->>App: Invitation Email Dispatched
    end
```

---

## 5. Global Orders Auditing & Refund Processing

```mermaid
sequenceDiagram
    autonumber
    actor Admin
    participant App as Admin App
    participant API as FastAPI Backend
    participant MPesa as Safaricom M-Pesa Reversal API

    Admin->>App: Navigate to /dashboard/shopping
    App->>API: GET /api/v1/admin/orders
    API-->>App: Return global order master ledger

    opt Order Refund Processing
        Admin->>App: Select Order & Click 'Initiate Refund'
        App->>API: POST /api/v1/payments/refunds {order_id, reason, amount}
        API->>MPesa: Send M-Pesa B2C Reversal API Call
        MPesa-->>API: Reversal Accepted
        API->>API: Update Order Status -> 'refunded' & Log Refund Record
        API-->>App: 200 OK (Refund Processed)
    end
```

---

## 6. System Configuration & Dynamic Rate Limiting Control

```mermaid
flowchart TD
    A[Admin opens /system] --> B[View active SMTP mailer, SMS gateway, and rate limit settings]
    B --> C[Admin updates dynamic endpoint rate limit thresholds]
    C --> D[PUT /api/v1/admin/rate-limits {endpoint: '/api/v1/auth/login', limit: 10}]
    D --> E[API updates `SystemSetting` DB row]
    E --> F[Redis Sliding Window Rate Limiter reloads thresholds without server restart]
```
