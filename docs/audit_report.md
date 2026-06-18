# Project Audit Report: MyMedDevices

## 1. Authentication & Registration Flow

### Issues Identified:
- **Vendor Registration Bypass:** Vendors can log in immediately after registration without admin approval. The `AuthService.authenticate` method only checks if the user is `is_active`, but not `is_vendor_verified`.
- **Registration Failures:** Customer registration is failing due to strict password validation on the backend (requires special characters) which isn't clearly communicated to the user until after a failed attempt.
- **Double Toast Notifications:** The frontend triggers multiple success toasts when a user registers (one for registration success and another for auto-login success).
- **Incomplete Registration Form:** The registration form only asks for email initially, then OTP, then profile. The user wants a more comprehensive form from the start.

### Proposed Fixes:
- Update `AuthService.authenticate` to check `is_vendor_verified` for vendor roles.
- Implement a global exception handler in FastAPI to catch `ValidationError` and return user-friendly error messages.
- Refactor `LoginModal.tsx` to handle toast notifications more cleanly and provide a better registration UX.

## 2. Role-Based Access Control (RBAC)

### Issues Identified:
- **Access Leaks:** Vendors might be able to access customer-only endpoints if roles aren't strictly checked at the API layer.
- **Admin Access:** Admins need a unified view but current implementation has scattered checks.

### Proposed Fixes:
- Audit all routers to ensure `require_role` or `get_current_user` with role checks are consistently applied.
- Ensure the 3 actors (Admin, Vendor, Customer) have strictly defined dashboard access.

## 3. UI/UX Improvements

### Issues Identified:
- **Logo:** Missing landscape logo in the auth modal.
- **Password Icon:** The eye icon for toggling password visibility is poorly positioned or overlapping.
- **Navigation:** Switching between user and vendor registration is currently a tab/toggle; the user wants it to be a link within the form.
- **Error Persistence:** Error messages remain visible when switching between Login and Register modes.

### Proposed Fixes:
- Update `LoginModal.tsx` styling and layout.
- Clear error states in `useEffect` when switching modes.
- Use the correct assets from `packages/assets/logos`.

## 4. Code Quality & Maintenance

### Issues Identified:
- **.gitignore:** Missing some common patterns for Node.js and Python development.
- **Hardcoded Messages:** Some messages are hardcoded in the frontend instead of coming from the backend.

### Proposed Fixes:
- Update `.gitignore`.
- Standardize API responses to include descriptive messages.
