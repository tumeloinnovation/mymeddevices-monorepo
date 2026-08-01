# MyMedDevices API Reference

All backend API endpoints are exposed under the base path **`/api/v1`**.

---

## 1. Response Formats & Error Codes

### Success Response Format
```json
{
  "success": true,
  "data": { ... }
}
```

### Error Response Format
```json
{
  "success": false,
  "error": "Human readable error description",
  "error_code": "SPECIFIC_ERROR_CODE",
  "errors": [ ... ]
}
```

### Common HTTP Status Codes
| Code | Meaning | Common Cause in MyMedDevices |
|---|---|---|
| `200 OK` | Request succeeded | Successful GET, PATCH, PUT |
| `201 Created` | Resource created | Successful POST creation |
| `400 Bad Request` | Invalid parameters | Malformed body, missing required attributes |
| `401 Unauthorized` | Auth required | Missing, invalid, or expired Bearer JWT token |
| `403 Forbidden` | Access denied | User role lacks required permission (e.g. customer accessing admin route) |
| `404 Not Found` | Not found | Requested resource ID or slug does not exist |
| `409 Conflict` | Duplicate resource | Duplicate user email, store name, or unique constraint violation |
| `413 Payload Too Large` | Body exceeds limit | Uploaded file or body exceeds 10 MB limit |
| `422 Unprocessable Entity` | Validation error | Pydantic / Zod schema validation failure |
| `429 Too Many Requests` | Rate limited | Exceeded sliding window rate limit (check `Retry-After` header) |

---

## 2. Authentication & Identity (`/api/v1/auth`)

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `POST` | `/api/v1/auth/register/initiate` | Public | Initiate customer registration (generates 6-digit OTP code) |
| `POST` | `/api/v1/auth/register/complete` | Public | Complete customer registration with OTP verification |
| `POST` | `/api/v1/auth/register` | Public | Direct customer registration |
| `POST` | `/api/v1/auth/register/vendor` | Public | Register new vendor application |
| `POST` | `/api/v1/auth/login` | Public | Authenticate user with email and password |
| `POST` | `/api/v1/auth/login/otp` | Public | Authenticate user using OTP passcode |
| `POST` | `/api/v1/auth/guest` | Public | Obtain guest session token |
| `POST` | `/api/v1/auth/refresh` | Public | Obtain new access token using refresh token |
| `POST` | `/api/v1/auth/logout` | Bearer | Revoke active refresh token and blacklist access token JTI |
| `POST` | `/api/v1/auth/change-password` | Bearer | Update user password |
| `POST` | `/api/v1/auth/forgot-password` | Public | Request password reset OTP code |
| `POST` | `/api/v1/auth/reset-password` | Public | Reset password using valid OTP code |
| `GET` | `/api/v1/auth/devices` | Bearer | List active logged-in device sessions |
| `DELETE`| `/api/v1/auth/devices/{id}` | Bearer | Revoke a specific device session |
| `DELETE`| `/api/v1/auth/account` | Bearer | Soft-delete authenticated user account |

---

## 3. Product Catalog & Storefront (`/api/v1/catalog`, `/api/v1/storefront`)

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `GET` | `/api/v1/catalog/categories` | Public | List hierarchical category tree |
| `POST` | `/api/v1/catalog/categories` | Admin/Vendor | Create new catalog category |
| `PATCH`| `/api/v1/catalog/categories/{id}` | Admin | Update category details |
| `DELETE`| `/api/v1/catalog/categories/{id}`| Admin | Soft-delete category |
| `GET` | `/api/v1/catalog/brands` | Public | List approved product brands |
| `POST` | `/api/v1/catalog/brands` | Vendor | Submit brand for platform approval |
| `PATCH`| `/api/v1/catalog/brands/{id}/approve` | Admin | Approve submitted vendor brand |
| `GET` | `/api/v1/catalog/tags` | Public | List product tags |
| `GET` | `/api/v1/catalog/products` | Vendor/Admin | List products owned by vendor |
| `POST` | `/api/v1/catalog/products` | Vendor | Create new medical product listing |
| `GET` | `/api/v1/catalog/products/{id}` | Bearer | Get specific product details |
| `PATCH`| `/api/v1/catalog/products/{id}` | Vendor/Admin | Update product specifications & pricing |
| `DELETE`| `/api/v1/catalog/products/{id}`| Vendor/Admin | Soft-delete product listing |
| `POST` | `/api/v1/catalog/products/{id}/image` | Vendor | Upload product image file |
| `POST` | `/api/v1/catalog/products/bulk-upload` | Vendor | Bulk create products via CSV upload |
| `POST` | `/api/v1/catalog/ai-assist/suggest` | Vendor/Admin | Auto-generate product description via Gemini AI |
| `GET` | `/api/v1/storefront/products` | Public | Search and filter published products storefront |
| `GET` | `/api/v1/storefront/products/{slug}` | Public | Get public storefront product detail by slug |

---

## 4. Customer Portal (`/api/v1/customers`)

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `GET` | `/api/v1/customers/me` | Customer | Get current customer profile |
| `PATCH`| `/api/v1/customers/me` | Customer | Update profile settings and preferences |
| `POST` | `/api/v1/customers/me/avatar` | Customer | Upload profile avatar image |
| `GET` | `/api/v1/customers/me/addresses` | Customer | List customer shipping/billing addresses |
| `POST` | `/api/v1/customers/me/addresses` | Customer | Create new shipping/billing address |
| `PATCH`| `/api/v1/customers/me/addresses/{id}` | Customer | Update address |
| `DELETE`| `/api/v1/customers/me/addresses/{id}` | Customer | Delete address |
| `GET` | `/api/v1/customers/me/loyalty` | Customer | View loyalty tier and points balance ledger |
| `GET` | `/api/v1/customers/me/wishlist` | Customer | List saved wishlist items |
| `POST` | `/api/v1/customers/me/wishlist` | Customer | Add product to wishlist |
| `DELETE`| `/api/v1/customers/me/wishlist/{id}` | Customer | Remove product from wishlist |

---

## 5. Shopping, Checkout & Orders (`/api/v1/shopping`)

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `GET` | `/api/v1/shopping/cart` | Public/Bearer | Get active cart (guest session or authenticated user) |
| `POST` | `/api/v1/shopping/cart/items` | Public/Bearer | Add item to active shopping cart |
| `PATCH`| `/api/v1/shopping/cart/items/{id}` | Public/Bearer | Update cart item quantity or notes |
| `DELETE`| `/api/v1/shopping/cart/items/{id}` | Public/Bearer | Remove item from cart |
| `POST` | `/api/v1/shopping/cart/merge` | Bearer | Merge guest cart items into customer cart |
| `POST` | `/api/v1/shopping/coupons/apply` | Public/Bearer | Validate and apply promotional coupon |
| `POST` | `/api/v1/shopping/checkout` | Bearer | Initialize checkout validation with customer notes |
| `POST` | `/api/v1/shopping/orders` | Bearer | Place new order |
| `GET` | `/api/v1/shopping/orders` | Bearer | List order history for customer |
| `GET` | `/api/v1/shopping/orders/{id}` | Bearer | Detailed order overview with items & timeline |
| `POST` | `/api/v1/shopping/shipping/calculate` | Public/Bearer | Calculate shipping fees based on address |

---

## 6. Payments (`/api/v1/payments`)

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `POST` | `/api/v1/payments/stkpush/initiate` | Bearer | Initiate M-Pesa Daraja STK Push prompt to phone |
| `POST` | `/api/v1/payments/stkpush/status` | Bearer | Check M-Pesa STK push execution status by checkout request ID |
| `POST` | `/api/v1/payments/callbacks/mpesa` | Public | Webhook endpoint for M-Pesa payment result notifications |
| `GET` | `/api/v1/payments/methods` | Public | List active platform payment methods |
| `GET` | `/api/v1/payments/methods/default` | Public | Get system default payment method |
| `GET` | `/api/v1/payments/transactions` | Bearer | List payment transactions with status filtering |
| `GET` | `/api/v1/payments/transactions/{id}` | Bearer | Get detailed transaction overview |
| `POST` | `/api/v1/payments/refunds` | Admin/Worker | Create new refund request |
| `GET` | `/api/v1/payments/refunds` | Admin/Worker | List refund requests |
| `POST` | `/api/v1/payments/refunds/{id}/approve` | Admin | Approve and execute payment refund |

---

## 7. Vendor Dashboard & Orders (`/api/v1/vendor`)

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `GET` | `/api/v1/vendor/profile` | Vendor | Get vendor business profile and store status |
| `PATCH`| `/api/v1/vendor/profile` | Vendor | Update store settings and M-Pesa/Bank payout details |
| `GET` | `/api/v1/vendor/analytics` | Vendor | Get store sales metrics and performance reports |
| `GET` | `/api/v1/vendor/earnings` | Vendor | View payout ledgers and commission breakdown |
| `GET` | `/api/v1/vendor/orders` | Vendor | List orders containing vendor's products |
| `GET` | `/api/v1/vendor/orders/{order_id}` | Vendor | Get detailed vendor order with items, timeline, and customer notes |
| `PATCH`| `/api/v1/vendor/orders/{order_id}/items/{item_id}/status` | Vendor | Update order item fulfillment status (`processing`, `packed`, `shipped`, `delivered`, `cancelled`) with state machine validation & auto rollup |
| `POST` | `/api/v1/vendor/orders/{order_id}/items/{item_id}/tracking` | Vendor | Add or update shipping carrier and tracking number for an order item |

---

## 8. Admin Portal & Global Orders (`/api/v1/admin`)

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `GET` | `/api/v1/admin/status` | Admin | Get system health, database status, and uptime |
| `GET` | `/api/v1/admin/rate-limits` | Admin | View current endpoint rate limits |
| `PUT` | `/api/v1/admin/rate-limits` | Admin | Dynamically update endpoint rate limit thresholds |
| `GET` | `/api/v1/admin/users/stats` | Admin | View user registrations and role breakdowns |
| `GET` | `/api/v1/admin/customers` | Admin | List all registered customer accounts |
| `PATCH`| `/api/v1/admin/customers/{id}/status` | Admin | Activate or suspend customer account |
| `GET` | `/api/v1/admin/vendors/overview` | Admin | List pending and active vendor applications |
| `PATCH`| `/api/v1/admin/vendors/{id}/approve` | Admin | Approve or reject vendor application |
| `GET` | `/api/v1/admin/shopping/orders` | Admin | Global platform order overview |
| `GET` | `/api/v1/admin/shopping/orders/{order_id}` | Admin | Get full order details, items, timeline, customer & internal notes |
| `PATCH`| `/api/v1/admin/shopping/orders/{order_id}/status` | Admin | Update order status with state machine transition validation |
| `PATCH`| `/api/v1/admin/shopping/orders/{order_id}/internal-notes` | Admin | Update admin-only internal communication notes for an order |

---

## 9. Support Tickets & Returns (`/api/v1/tickets`, `/api/v1/returns`)

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `GET` | `/api/v1/tickets` | Bearer | List support tickets for user |
| `POST` | `/api/v1/tickets` | Bearer | Create new support ticket |
| `POST` | `/api/v1/tickets/{id}/replies` | Bearer | Add reply message to support ticket |
| `GET` | `/api/v1/returns` | Bearer | List order return requests |
| `POST` | `/api/v1/returns` | Bearer | Initiate return request for delivered order |
