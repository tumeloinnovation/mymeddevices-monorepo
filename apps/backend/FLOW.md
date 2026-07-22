# Backend Application Feature Flows (`apps/backend`)

This document outlines the internal system pipelines, security flows, background tasks, and API integration mechanics for the **FastAPI Backend Application**.

---

## Backend Infrastructure Pipelines

```mermaid
flowchart TD
    A[1. Identity, Auth & RS256 JWT Token Lifecycle] --> B[2. M-Pesa Daraja Payment & Callback Engine]
    B --> C[3. Guest-to-Customer Cart Merging & Pricing Snapshot Pipeline]
    C --> D[4. Transactional Email & MJML Background Pipeline]
    D --> E[5. Dynamic Rate Limiting & Security Middleware Stack]
```

---

## 1. Identity, Auth & RS256 JWT Token Lifecycle

```mermaid
sequenceDiagram
    autonumber
    participant Client as Frontend Client
    participant API as FastAPI Auth Domain
    participant DB as Async Database
    participant Redis as Redis Cache

    Client->>API: POST /api/v1/auth/login {email, password}
    API->>DB: Query User record by email
    API->>API: Verify password using Argon2 (`PasswordHasher.verify()`)

    API->>API: Generate RS256 JWT Access Token (30m expiry, custom JTI claim)
    API->>API: Generate Long-Lived Refresh Token (7d expiry)
    API->>DB: Save RefreshToken record & UserDevice fingerprint

    API-->>Client: Return Access Token, Refresh Token, User DTO

    Note over Client, Redis: Authenticated Request Inspection
    Client->>API: GET /api/v1/customers/me (Header: Bearer JWT)
    API->>Redis: Query key `blacklist:<jti>`
    Redis-->>API: Key Not Found (Token Active)
    API->>API: Decode RS256 Public Key & Verify Expiry
    API-->>Client: 200 OK (Protected Resource)

    Note over Client, Redis: Token Revocation / Logout
    Client->>API: POST /api/v1/auth/logout
    API->>Redis: Set key `blacklist:<jti>` with TTL = remaining token lifetime
    API->>DB: Mark RefreshToken record as revoked (`is_revoked = True`)
    API-->>Client: Token Revoked
```

---

## 2. M-Pesa Daraja STK Push & Webhook Callback Engine

```mermaid
sequenceDiagram
    autonumber
    participant Client as Customer Frontend
    participant API as Payments Domain (/api/v1/payments)
    participant Daraja as Safaricom Daraja API
    participant DB as Database

    Client->>API: POST /api/v1/payments/stk-push {order_id, phone_number}
    API->>DB: Retrieve Order details & total amount
    API->>Daraja: POST /mpesa/stkpush/v1/processrequest (Bearer OAuth)
    Daraja-->>API: Return MerchantRequestID & CheckoutRequestID

    API->>DB: Create Transaction Record (Status: 'pending')
    API-->>Client: Return MerchantRequestID & CheckoutRequestID

    Note over API, Daraja: Async Callback Webhook Execution
    Daraja->>API: POST /api/v1/payments/callback (Body: M-Pesa Callback Payload)
    API->>DB: Save raw payload into `payment_callbacks` audit table
    API->>API: Parse ResultCode (0 = Success, non-zero = Cancelled/Failed)

    alt ResultCode == 0 (Success)
        API->>DB: Update Transaction status -> 'completed', store `mpesa_receipt`
        API->>DB: Update Order status -> 'paid' & Payment status -> 'completed'
        API->>DB: Create OrderTimelineEvent ('Payment Received via M-Pesa')
    else ResultCode != 0 (Failed/Cancelled)
        API->>DB: Update Transaction status -> 'failed'
        API->>DB: Update Order status -> 'payment_failed'
    end
    API-->>Daraja: 200 OK Response `{"ResultCode": 0, "ResultDesc": "Accepted"}`
```

---

## 3. Guest-to-Customer Cart Merging & Pricing Snapshot Pipeline

```mermaid
flowchart TD
    A[POST /api/v1/shopping/cart/merge] --> B[Retrieve authenticated User's remote Cart Entity]
    B --> C[Iterate through incoming guest item array]
    C --> D{Does item exist in Customer Cart?}
    D -- Yes --> E[Sum guest quantity + customer quantity]
    D -- No --> F[Create new CartItem record with guest quantity]
    E & F --> G[Snapshot active product pricing from `Product.price`]
    G --> H[Recalculate Cart Subtotal, Tax & Shipping estimates]
    H --> I[Commit transaction to database & return updated Cart DTO]
```

---

## 4. Transactional Email & MJML Background Pipeline

```mermaid
sequenceDiagram
    autonumber
    participant Event as Domain Event (e.g. Order Placed)
    participant Renderer as EmailTemplate Renderer
    participant Mail as Core Mailer (app/core/mail.py)
    participant SMTP as Async SMTP Server / Mailpit

    Event->>Renderer: Trigger render_template("order_confirmation.html", context)
    Renderer->>Renderer: Load Jinja2 template compiled from `templates/order_confirmation.mjml`
    Renderer->>Renderer: Inject dynamic variables (Order number, customer name, items table)
    Renderer-->>Mail: Return compiled HTML string

    Mail->>Mail: Wrap email dispatch in worker thread (`anyio.to_thread.run_sync`)
    Mail->>SMTP: Connect & send MIME HTML message
    SMTP-->>Mail: 250 Message Accepted
```

---

## 5. Sliding-Window Rate Limiting & ASGI Security Middleware Stack

```mermaid
flowchart TD
    A[Incoming HTTP Request] --> B[RequestLoggingMiddleware]
    B --> C[Generate UUID request_id & trace_id]
    C --> D[ContentLengthLimitMiddleware]
    D --> E{Is Content-Length > 10MB?}
    E -- Yes --> F[Return HTTP 413 Payload Too Large]
    E -- No --> G[RateLimiter Middleware]
    G --> H[Extract Client IP or device_id header]
    H --> I[Execute Sliding Window script on Redis]
    I --> J{Request Count > Endpoint Limit?}
    J -- Yes --> K[Return HTTP 429 Too Many Requests with `Retry-After` header]
    J -- No --> L[Forward request to FastAPI APIRouter endpoint]
```
