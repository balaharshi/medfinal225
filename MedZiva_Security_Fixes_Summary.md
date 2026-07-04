# MedZiva — Fixes, Audit & Remaining Work

**Date:** July 4, 2026
**Repository:** balaharshi/medfinal225
**Branch:** main

---

## SECTION A: CRITICAL SECURITY VULNERABILITIES FIXED (Today)

### 1. OAuth Authentication Bypass — `fallbackPayload()` bypass
**Severity:** CRITICAL
**File:** `med21-laravel/app/Services/OAuthIdentityService.php`
**Issue:** When no Google/Apple credential was provided, `fallbackPayload()` accepted an arbitrary `email` and `fullName` from the request body and returned them as verified identity. Anyone could forge a login request with any email and gain access as that user.
**Fix:** Removed `fallbackPayload()` entirely. Both `verifyGoogle()` and `verifyApple()` now throw `401 Unauthorized` if no credential is provided.

### 2. Role Escalation via OAuth Upsert
**Severity:** CRITICAL
**File:** `med21-laravel/app/Services/AuthService.php`
**Issue:** `upsertOAuthUser()` forcefully overwrote any existing user's `role` field when they logged in via OAuth. A regular customer logging in through `/auth/google/admin` would be silently promoted to admin.
**Fix:** Role is now only upgraded from CUSTOMER to another role. Existing admins/vendors never have their role changed by OAuth.

### 3. Public Admin/Vendor OAuth Endpoints (Privilege Escalation)
**Severity:** CRITICAL
**Files:** `med21-laravel/app/Http/Controllers/Api/AuthController.php`, `med21-laravel/routes/api.php`
**Issue:** `/auth/google/admin` and `/auth/google/vendor` were public. Anyone with any Google account could POST to `/auth/google/admin` and become admin.
**Fix:**
- `/auth/google/admin` now requires email in `GOOGLE_ADMIN_EMAILS` env var. Returns 403 otherwise.
- `/auth/google/vendor` now requires an existing `vendors` record. No auto-creation.
- Rate limiting: admin (5/min), vendor (5/min), vendorLogin (10/min).

### 4. Broken Apple Sign-In Buttons (XSS Vector)
**Severity:** HIGH
**Files:** `med21/src/components/SocialAuthButtons.tsx`, `med21/src/components/AuthModal.tsx`
**Issue:** When `VITE_APPLE_CLIENT_ID` was empty, Apple buttons still rendered and loaded `appleid.apple.com` scripts (XSS risk).
**Fix:** Apple buttons hidden when `VITE_APPLE_CLIENT_ID` is not set.

---

## SECTION B: OTHER SECURITY HARDENING (Today)

| Change | File | Details |
|---|---|---|
| Rate limiting on admin OAuth | `routes/api.php` | 5 requests/min |
| Rate limiting on vendor OAuth | `routes/api.php` | 5 requests/min |
| Rate limiting on vendor login | `routes/api.php` | 10 requests/min |
| Rate limiting on Apple callback | `routes/api.php` | 10 requests/min |
| Admin email allowlist | `config/services.php`, `.env.example` | `GOOGLE_ADMIN_EMAILS` env var |
| No vendor auto-creation via OAuth | `AuthService.php` | Requires existing vendor record |

---

## SECTION C: PREVIOUSLY COMPLETED (This Session)

### Backend Security
- Removed `admin@gmail.com` auto-promote backdoor from `AuthService.php`
- Added `api.auth` middleware to booking creation (was unauthenticated)
- Added rate limiting: login/register (10/min), payments (5/min), promos (20/min)
- Fixed logout to properly invalidate Sanctum tokens (was no-op)
- Removed hardcoded admin/vendor demo credentials from all dashboards
- JWT secret now throws error in production mode

### Backend Features
- Created `GET /api/my-bookings` — customers see only their own bookings
- Created `DELETE /api/my-bookings/{id}` — customer self-cancellation (Pending/Active only)
- Created `PATCH /api/vendorBookings/{vendorId}/{id}/status` — vendor status updates
- Created full backend promo code system: model, migration, validation, seeded MEDZIVA10
- Created password reset flow: forgot-password + reset-password with 6-char code
- Created `password_reset_tokens` migration

### Frontend Fixes
- Fixed critical search bug: `setSearchQuery('')` clearing search on every route change
- Fixed critical search crash: `attributes.find()` on non-array objects (IV therapy)
- Fixed logo trimming and layout
- Home Collection Fee shows "Free" when subtotal >= 1000 AED
- Added 3 missing routine blood tests (CBC, FBS, HbA1c)
- Date validation: can't select past dates
- Region selector dropdown in BookingModal and CartDrawer
- Backend promo validation (replaced hardcoded MEDZIVA10)
- Replaced all `alert()` with `toast.error()` (8 instances)
- Removed 35+ `console.error` from production code
- React ErrorBoundary wrapping main content
- Password Reset flow in AuthModal
- ProfileModal uses `/api/my-bookings` with customer self-cancellation
- Vendor status update buttons in VendorDashboard
- 35+ title case/formatting fixes
- Spelling fixes across all files

### Repository Cleanup
- Deleted `med21-backend/`, `render.yaml`, `railway.json`, Firebase files, boilerplate, unreferenced images
- Updated `.gitignore` for Laravel+React
- Updated `.env.example` with correct URLs

---

## SECTION D: CODEBASE AUDIT — What Exists vs What's Needed

Cross-referenced against the developer review document. This is the honest assessment.

### D1. Real-Time Push Notification System (Pusher)

**Current state: PARTIALLY IMPLEMENTED — Backend is a stub.**

The `PusherService.php` exists and `CatalogController` calls `triggerEvent()` on:
- New bookings (`createBooking`)
- Booking status changes (`updateBooking`, `cancelBooking`, `cancelMyBooking`, `updateVendorBookingStatus`)
- Vendor acceptance (`acceptVendorBooking`)
- Enquiry creation (`createEnquiry`)

**Problem:** `PusherService::triggerEvent()` is a **no-op logger** — it only calls `Log::info()`. It does not actually connect to Pusher or push any WebSocket events. The real-time system is wired up on the calling side but the service itself does nothing.

**What needs to be done:**
- Implement actual Pusher connection in `PusherService` using `pusher/pusher-php-server` package
- Configure Pusher credentials in `.env`
- Test that events reach the frontend
- Add duplicate prevention for notifications
- Add read/unread notification status

### D2. Admin Dashboard Redesign

**Current state: EXISTS but needs cleanup.**

The `AdminDashboard.tsx` is 4,533 lines with working CRUD for categories, services, products, vendors, bookings, enquiries, users, and settings. But:
- Dashboard counts already come from the database (not hardcoded)
- Users page counts (`super_admin`, `admin`, `vendor`, `staff`, `customer`) are dynamically computed from `usersList`
- Contains some unnecessary widgets and static data

**What needs to be done:**
- Remove unnecessary cards, widgets, duplicate information
- Simplify to show: Total Bookings, Pending/Confirmed/Completed/Cancelled, Active Vendors, Total Customers, New Enquiries, Recent Activity
- Improve spacing, alignment, responsiveness
- Fix broken View booking option (currently uses client-side modal from pre-loaded list — no separate API call)

### D3. Booking View Option

**Current state: CLIENT-SIDE ONLY — No backend endpoint.**

There is no `GET /api/booking/{id}` route. The admin "View" button opens a modal populated from the already-fetched `bookingsList` array. If the booking list is stale or incomplete, the View will show wrong data.

**What needs to be done:**
- Add `GET /api/booking/{id}` endpoint (admin-only)
- Update `handleViewBooking` to fetch fresh data from the API
- Display: customer details, service/product, date/time, address, assigned vendor, payment details, status, status history

### D4. Booking Live Stream and Auto Refresh

**Current state: WIRED UP but service is a stub.**

See D1 above. The calling code exists in CatalogController but PusherService does nothing.

### D5. Enquiry Auto Refresh

**Current state: WIRED UP but service is a stub.**

Same as D4 — `createEnquiry` calls `triggerNotification` but PusherService is a no-op.

### D6. Vendor Panel

**Current state: EXISTS but needs cleanup.**

`VendorDashboard.tsx` (921 lines) has booking management, service display, and profile editing. Needs:
- Simplify navigation
- Remove dummy/static data
- Fix mobile responsiveness
- Correct booking management functionality
- Improve loading/empty states

### D7. Vendor Partner Section (Admin)

**Current state: EXISTS with working enable/disable.**

`VendorServiceAssignmentController` has working single and bulk toggle. Admin middleware enforced.

**What needs to be done:**
- UI redesign for cleanliness
- Add search, filters, pagination
- Improve view/edit options

### D8. Vendor Services Enable/Disable

**Current state: FULLY IMPLEMENTED.**

Backend (`VendorServiceAssignmentController`) and frontend (`AdminDashboard.tsx`) both have working single and bulk toggle operations. Routes protected by admin middleware.

**What needs to be done:**
- End-to-end testing only — the code is complete

### D9. Customer Request Services Workflow

**Current state: FULLY IMPLEMENTED.**

Customer frontend → `POST /api/bookings` → backend creates booking → stored in database → appears in admin bookings list.

**What needs to be done:**
- E2E testing
- Real-time notification to admin (requires Pusher fix from D1)

### D10. Super Admin Count

**Current state: COUNTS WORK — no bug found.**

Counts are dynamically computed from database via `/api/users` endpoint, grouped by `role` field client-side. If Super Admin count shows zero, it means no user has `role = 'super_admin'` in the database. This is a data issue, not a code bug.

**What needs to be done:**
- Verify the admin user's role in the database
- If the admin user has `role = 'admin'` instead of `super_admin`, update it

### D11. Roles and Permissions

**Current state: MINIMAL — string-based roles only.**

- Roles stored as plain string column on `users` table (`customer`, `vendor`, `staff`, `admin`, `super_admin`)
- `AuthorizeRole` middleware checks role strings
- The "Roles & Permissions" page in AdminDashboard is a **static UI mockup** — no API backend, no permission model, no RBAC

**What needs to be done:**
- Decide: implement full RBAC or keep simple role-based access?
- If RBAC: create `permissions` table, `role_permissions` pivot, middleware to check permissions
- If simple: the current system works — just remove the mock UI or wire it to actual role management

### D12. Vendor Profile

**Current state: EDITABLE by vendor.**

Vendor can edit: name, type, contact, address. Cannot edit: commission, active, rating (admin-only fields). The review asks for read-only + change request workflow.

**What needs to be done:**
- Make vendor profile read-only in frontend (remove edit form)
- Add "Request Profile Change" button
- Create backend endpoint for change requests
- Admin review/approve/reject workflow
- Real-time notifications for change requests

### D13. Vendor Logo

**Current state: DOES NOT EXIST.**

No `logo` column in `vendors` table. No upload functionality.

**What needs to be done:**
- Add `logo` column to vendors migration
- Add file upload endpoint or use URL field
- Display logo in Vendor Panel
- Admin manages logo uploads
- Default placeholder if no logo

---

## SECTION E: REMAINING WORK — Prioritized Checklist

### CRITICAL (Must fix before any launch)

| # | Issue | Status | Code Exists? | Notes |
|---|---|---|---|---|
| 1 | **Rotate ALL exposed credentials** | PENDING | N/A | DB password, Pusher keys, ENBDpay API key, Google OAuth, APP_KEY in git history |
| 2 | **Deploy latest code to GoDaddy** | PENDING | N/A | Frontend + backend upload. Run `php artisan migrate` |
| 3 | **Fix Laravel API routing on GoDaddy** | PENDING | N/A | `/api/` returns HTML. Document root must be `public/` |
| 4 | **Implement real PusherService** | PENDING | Stub exists | `PusherService.php` is a no-op logger. Need actual Pusher SDK integration |
| 5 | **Configure Google Sign-In** | PENDING | Placeholder | Need real `GOOGLE_CLIENT_ID` from Google Cloud Console |
| 6 | **Set GOOGLE_ADMIN_EMAILS** | PENDING | Config exists | Add admin email(s) to `.env` |

### HIGH (Must fix before launch)

| # | Issue | Status | Code Exists? | Notes |
|---|---|---|---|---|
| 7 | **Add GET /api/booking/{id} endpoint** | PENDING | Missing | Admin View button needs fresh backend data |
| 8 | **Admin Dashboard redesign** | PENDING | Exists, needs cleanup | Remove unnecessary elements, improve layout |
| 9 | **Vendor Panel cleanup** | PENDING | Exists, needs cleanup | Simplify navigation, remove static data |
| 10 | **Vendor Partner section redesign** | PENDING | Exists, needs cleanup | Improve admin's vendor management UI |
| 11 | **Vendor Profile → read-only** | PENDING | Currently editable | Remove edit form, add change request workflow |
| 12 | **Vendor Profile Change Request** | PENDING | Missing | New feature: vendor submits request → admin approves/rejects |
| 13 | **Vendor Logo Management** | PENDING | Missing | No logo column, no upload, no display |
| 14 | **Real-time notifications (end-to-end)** | PENDING | Stub service | Requires PusherService implementation |
| 15 | **Booking distribution testing** | PENDING | Code exists | Test with multiple vendors simultaneously |
| 16 | **First Vendor Accept race condition** | PENDING | Partially protected | Atomic WHERE update exists, but no DB transaction. Safe for normal load |
| 17 | **Email/SMS booking confirmations** | PENDING | Missing | Need mail driver + templates |
| 18 | **Vendor self-registration** | PENDING | Missing | Currently admin-only vendor creation |

### MEDIUM (Should fix before launch)

| # | Issue | Status | Code Exists? | Notes |
|---|---|---|---|---|
| 19 | **Admin Panel page-by-page cleanup** | PENDING | Exists | Remove broken links, unused buttons, duplicate features |
| 20 | **Booking View — status history** | PENDING | Missing | No booking_status_history table or endpoint |
| 21 | **Roles & Permissions system** | PENDING | Mock UI only | Decide: full RBAC or simple role management? |
| 22 | **Duplicate notification prevention** | PENDING | Not implemented | Need deduplication logic in Pusher events |
| 23 | **Notification read/unread status** | PENDING | Missing | Need notifications table + API |
| 24 | **Create API client utility** | PENDING | 37 raw fetch() calls | Centralize in single client with error handling |
| 25 | **Split AdminDashboard.tsx** | PENDING | 4,533 lines | Break into smaller components |
| 26 | **Add ESLint/Prettier** | PENDING | None | No code formatting configured |
| 27 | **State management** | PENDING | Prop-drilling | Add Context/Zustand for auth/cart/data |
| 28 | **Apple Sign-In** | PENDING | Placeholder only | Needs Apple Developer account + significant work |
| 29 | **Appointment reminders** | PENDING | Missing | 24h-before notification |
| 30 | **Customer reviews/ratings** | PENDING | Missing | Review system for completed bookings |
| 31 | **Vendor availability/schedule** | PENDING | Missing | Vendor working hours management |

### LOW (Can launch without)

| # | Issue | Status | Notes |
|---|---|---|---|
| 32 | Appointment rescheduling | PENDING | Customers can cancel but not reschedule |
| 33 | Invoice/receipt PDF | PENDING | No PDF generation |
| 34 | Refund workflow | PENDING | No refund process |
| 35 | Real-time slot availability | PENDING | No live availability checking |
| 36 | Add tests | PENDING | No unit or integration tests |

---

## SECTION F: ENVIRONMENT VARIABLES REQUIRED

```
# Security (ROTATE ALL)
APP_KEY=base64:...              # php artisan key:generate
DB_PASSWORD=...                 # Was exposed in git — rotate now
ENBDPAY_API_KEY=...             # Was exposed in git — rotate now
ENBDPAY_WEBHOOK_SECRET=...      # Was exposed in git — rotate now
PUSHER_APP_ID=...               # Was exposed in git — rotate now
PUSHER_KEY=...
PUSHER_SECRET=...
PUSHER_CLUSTER=...

# Google OAuth
GOOGLE_CLIENT_ID=...            # From Google Cloud Console (currently placeholder)
GOOGLE_ADMIN_EMAILS=...         # Comma-separated admin emails for OAuth allowlist

# Apple OAuth (optional)
APPLE_CLIENT_ID=...
```

---

## SECTION G: DEVELOPER ACTION ITEMS (In Order)

### Immediate (Do First)
1. **Rotate credentials** — DB password, Pusher keys, ENBDpay API key, generate new APP_KEY
2. **Deploy to GoDaddy** — upload frontend (`med21/dist/`) + backend (`med21-laravel/`), run `php artisan migrate`
3. **Fix API routing** — document root = `med21-laravel/public/`, verify `.htaccess` + `mod_rewrite`
4. **Implement PusherService** — replace stub with actual `pusher/pusher-php-server` integration
5. **Set real GOOGLE_CLIENT_ID** — create Google Cloud Console project, OAuth 2.0 credentials

### Then (Core Features)
6. Add `GET /api/booking/{id}` endpoint for admin View
7. Test booking flow end-to-end with real Pusher events
8. Test vendor acceptance with multiple simultaneous vendors
9. Make vendor profile read-only, add change request workflow
10. Add vendor logo field + upload
11. Admin Dashboard cleanup
12. Vendor Panel cleanup

### Finally (Polish)
13. Email/SMS confirmations
14. Roles & Permissions (decide scope)
15. ESLint/Prettier, API client, state management
16. Split AdminDashboard into components
17. Remaining features (reminders, reviews, rescheduling, PDFs)

---

## SECTION H: WHAT TO TELL YOUR DEVELOPERS

1. **The real-time system is wired up but the service is a stub.** `PusherService.php` only logs — it doesn't connect to Pusher. All the `triggerEvent()` calls in `CatalogController` do nothing. Implement the actual Pusher SDK connection.

2. **There is no `GET /api/booking/{id}` endpoint.** The admin View button uses pre-loaded client-side data. Add a backend endpoint for fresh data.

3. **Roles & Permissions is a static mockup.** The UI exists but has no API backend. Decide if you need full RBAC or just role management.

4. **Vendor profile is editable.** The review says it should be read-only with a change request workflow. Currently vendors can edit name, type, contact, address directly.

5. **No vendor logo field exists.** Need to add a `logo` column to the vendors table and build upload/display.

6. **Super Admin count showing zero** is likely a data issue — the admin user's role in the database might be `admin` instead of `super_admin`. Check the `users` table.

7. **All code changes are on `main` branch** and ready to deploy. The security fixes, password reset, promo system, booking endpoints, and search fixes are all committed.

---

*Generated by MedZiva AI Assistant — July 4, 2026*
