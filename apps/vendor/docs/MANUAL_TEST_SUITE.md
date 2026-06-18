# Manual Test Suite: Product Management Revamp

This document provides a step-by-step guide to manually verify the new Product Management features for both Vendors and Admins.

## 1. Vendor Walkthrough: The Product Wizard

### Test Case 1.1: Core Identity (Step 1)
- **Action**: Go to "List New Equipment".
- **Expectation**: 
    - Form starts at Step 1.
    - Fields: Name, SKU, Category, Price, and Brand are visible.
    - "Next" button is disabled until required fields (Name, SKU, Category, Price) are filled.
- **Verification**: Fill in "MRI Scanner X1", "SKU-MRI-001", Select a category, and set Price to "1500000". Click "Next".

### Test Case 1.2: Media & Assets (Step 2)
- **Action**: Upload 2-3 images.
- **Expectation**:
    - Thumbnails appear for each image.
    - First image is automatically marked as "Primary".
    - Clicking the "X" on an image removes it.
- **Verification**: Upload 2 images, verify previews, then click "Next".

### Test Case 1.3: AI Intelligence (Step 3)
- **Action**: Click "Generate with Gemini".
- **Expectation**:
    - Shimmer loading state appears.
    - Description, Meta Title, and Meta Description are auto-filled.
    - Content is professional and relevant to the product name.
- **Verification**: Verify descriptions are filled. Manually edit one sentence to ensure it's editable. Click "Next".

### Test Case 1.4: Compliance & Review (Step 4)
- **Action**: Enter medical compliance data and review.
- **Expectation**:
    - Enter a dummy KMPDB number (e.g., "KMPDB/2026/001").
    - Select "Class C" for PPB.
    - "Listing Preview" card on the right shows correct name, price, and status.
- **Verification**: Click "Publish Listing". Redirected to product list with status "Pending Review".

---

## 2. Admin Walkthrough: The Audit Desk

### Test Case 2.1: Review Queue
- **Action**: Login as Admin, go to Products Catalog.
- **Expectation**:
    - The new product appears with a "Pending Review" status badge.
- **Verification**: Click "Edit" or "Eye" to open the detail page.

### Test Case 2.2: AI Validator & Rejection
- **Action**: Use the Audit Desk tools.
- **Expectation**:
    - "Run AI Validation" button shows a toast and returns a success message.
- **Verification**: 
    - Click "Reject with Feedback".
    - Enter "Please provide a clearer image of the control panel." in the modal.
    - Click "Send Feedback".
    - Status changes to "Draft" (or "Rejected" depending on exact logic).

### Test Case 2.3: Approval & Publication
- **Action**: Approve a corrected product.
- **Expectation**:
    - Click "Approve & Publish".
- **Verification**: 
    - Status changes to "Published".
    - Visit the Customer Storefront URL (from the Preview button) to see the live listing.

---

## 3. Visual & UX Standards (`emil-design-eng`)
- [ ] **Shimmer Effects**: Visible during AI generation.
- [ ] **Toasts**: "Product created successfully", "AI content generated", etc. appear in the bottom right.
- [ ] **Wizard Transitions**: Steps slide in/out smoothly.
- [ ] **Status Badges**: High contrast and clearly legible.
- [ ] **Responsiveness**: Form remains usable on smaller screens (stacked columns).
