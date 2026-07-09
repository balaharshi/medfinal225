# MedZiva Platform — Critical Fixes & Developer Guide

## Overview

This document captures all the issues found and fixed in the MedZiva healthcare platform, along with instructions for Bala on how to properly test and maintain the codebase.

## Part 1: Critical Mistakes Fixed

### Architecture

| # | Issue | Fix |
|---|-------|-----|
| 1 | **Three sources of truth** — Data existed in `data.ts` (hardcoded), `../../shared/` catalog files (outside project), AND the database. Changes had to be made in all three places. | Cleaned up `data.ts` to only contain utility functions (image resolution). **Database is now the single source of truth**. The `../../shared/` imports removed entirely. |
| 2 | **Broken shared catalog imports** — `data.ts` imported from `../../shared/homeHealthcareCatalog.js` and `../../shared/labTestsAtHomeCatalog.js`. These paths resolve during development but **break in production builds** since the `shared/` directory is outside the project root. | Removed all `../../shared/` imports. Their content is now either in database seeders or defined locally in App.tsx. |
| 3 | **3200-line App.tsx monolith** — All routing, state management, rendering, and inline components in a single file. | Partially extracted (AppDataContext handles data fetching). Service/health-package rendering made data-driven. |
| 4 | **No state management** — All state in `useState` hooks at top level. No React Context for shared data. | Created `AppDataContext` with `AppDataProvider` for shared catalog data (services, products, categories). |
| 5 | **Duplicate fetch mechanisms** — `configureApiFetch.ts` monkey-patched `window.fetch` globally, while `lib/api.ts` had its own API client with different env vars. | Both now use the same `VITE_API_URL` env var. |

### Backend

| # | Issue | Fix |
|---|-------|-----|
| 6 | **All payment capture/void/refund endpoints had NO authentication** — Anyone on the internet could call `POST /payments/enbd/capture`, `/refund`, `/void/auth`, etc. if they knew a transaction UTR. | Added `$admin` middleware to all payment mutation endpoints. |
| 7 | **Timezone was UTC** — Dubai is GMT+4. All `now()` calls, booking dates, reminders, and expiry cron were 4 hours off. | Changed to `Asia/Dubai` in `config/app.php` with `APP_TIMEZONE` env configurable. |
| 8 | **ENBDPAY_MOCK=true in production** — No real payments would ever be collected. | Set `ENBDPAY_MOCK=false` in `.env.production`. |
| 9 | **MAIL_MAILER=log everywhere** — No emails were being sent. All booking confirmations, vendor notifications, reminders only went to log files. | Set `MAIL_MAILER=smtp` with correct SMTP credentials (`smtpout.secureserver.net:465`). |
| 10 | **MAIL_FROM_ADDRESS had literal quote characters** — `"booking@medzivahealthcare.com"` with quotes is not a valid email address. | Removed quotes: `MAIL_FROM_ADDRESS=booking@medzivahealthcare.com`. |
| 11 | **Production APP_KEY was a placeholder** — `base64:GENERATE_WITH_PHP_ARTISAN_KEY_GENERATE` is not a valid encryption key. | Documented that `php artisan key:generate` must be run on production server. |
| 12 | **Hardcoded DB password and Google Client ID committed to .env.staging** — `DB_PASSWORD=Healthcare@0909` and `GOOGLE_CLIENT_ID=280907...` were in version control. | Replaced with empty placeholders. |
| 13 | **`pusherService` was null** — `$this->pusherService->triggerToChannel()` in `notifyEligibleVendors()` caused errors because PusherService was never injected. | Added `PusherService` to CatalogService constructor. |
| 14 | **Email key format inconsistency** — Some mailers received snake_case keys from `$booking->toArray()`, others received camelCase from `CaseKeys::camelize()`. Mail classes only checked one format. | All mail classes now check both `serviceTitle` and `service_title`, `customerName` and `customer_name`, etc. |
| 15 | **No booking expiry** — Unaccepted bookings stayed "Pending" forever. | Added `expires_at` column, calculated from earliest vendor working hours + 2h. Cron `bookings:cancel-expired` runs every 5 min. |
| 16 | **No refund on cancellation** — When a customer cancelled, the booking status changed but payments were never voided/refunded. | Added `handleCancellationPayment()` — voids auth payments, refunds captured payments. Policy: >24h = full refund, ≤24h = 20% fee (max AED 100). |
| 17 | **No vendor working hours system** — Vendors couldn't set their availability. Time slots showed all 24 hours regardless of vendor availability. | Created `vendor_working_hours` table with CRUD API. VendorDashboard has Working Hours tab. `TimeSlotCalculator` filters slots by vendor hours. |
| 18 | **Lead time calculated from current time, not vendor hours** — Customer at 10PM booking for a 12h-notice service: lead time started from 10PM (resulting in 10AM slot) instead of vendor's next working hour. | Lead time now starts from earliest vendor working hour + lead hours. |
| 19 | **1-hour overlap not enforced** — A 2-hour slot starting at 12PM with vendor working 1PM-6PM was incorrectly excluded. | Added 1-hour minimum overlap requirement between slot and vendor hours. |
| 20 | **No booking conflict detection** — Same vendor could be double-booked. | User decided this is vendor's responsibility to manage, but `createBooking()` now has a duplicate check (same customer+service+date+slot). |
| 21 | **Deactivated vendor could update bookings** — `updateVendorBookingStatus()` didn't check `vendor.active`. | Added active vendor check. |
| 22 | **getRevenueReport had N+1 query** — Each booking triggered a separate `VendorServiceAssignment` query. | Batch-loads all assignments in one query. |
| 23 | **CORS missing PUT method** — `PUT /vendor-working-hours/{vendorId}` failed preflight in production. | Added `'PUT'` to `allowed_methods`. |
| 24 | **No rate limiting on public endpoints** — `GET /services`, `/products`, `/categories`, `/available-slots` could be scraped/DDoSed. | Added `throttle:60,1` to each. |
| 25 | **PromoCode model/schema mismatch** — Model had `discount_percent` and `uses` but migration had `discount_type`/`discount_value` and `times_used`. | Fixed model `$fillable`. |

### Frontend

| # | Issue | Fix |
|---|-------|-----|
| 26 | **Cart created ONE combined booking for ALL items** — Multi-service cart produced a single booking with truncated `serviceTitle` and no per-service vendor notification. | Cart now creates ONE booking PER ITEM with its own `serviceId` and `timeSlot`. Each booking notifies that service's eligible vendors. |
| 27 | **Cart used stale prices** — User could add an item at AED 250, price changes to AED 300, then checkout at 250. | On checkout, fetches current prices from API. Uses latest price. Shows toast if price changed. |
| 28 | **Single time slot for entire cart** — Customer picked one date/time slot for all cart items regardless of different services having different lead times/vendor hours. | Per-service time slot pickers in checkout. Each fetches available slots from that service's `/api/services/{id}/available-slots`. |
| 29 | **No booking rescheduling** — Customers could only cancel, not change booking date/time. | `POST /api/my-bookings/{id}/reschedule` with 24h notice, 1 free reschedule, all booking logic applies. |
| 30 | **IV therapy image was a 404** — `photo-1631563016585-64a1e38db6b1` returned 404. All 14 IV therapy services showed broken images. | Downloaded new `iv_therapy_drip.jpg` from Unsplash. Updated seeder URL. |
| 31 | **Broken filename mismatches (would fail on Linux production)** — Files named `Antistress and Antoixidant IV Therapy.jpg` (typo), `DHA NURSE.jpg` (case), `Wound care and Surgical Dressing-*.jpg` (case), `CARE GIVER.jpg` (case). macOS's case-insensitive filesystem hid these bugs. | Renamed all files to match code expectations. Files: `Antistress and Antioxidant IV Therapy.jpg`, `DHA Nurse.jpg`, `Wound Care and Surgical Dressing-*.jpg`, `Caregiver.jpg`. |
| 32 | **Wrong image mappings** — Surgery Recovery IV Therapy mapped to IV antibiotics image. Weight Loss Drip mapped to Gut Support. | Fixed mapping: Surgery Recovery → `Surgery Recovery IV Therapy.jpg`. |
| 33 | **Rental product images didn't apply to DB source data** — `withRentalEquipmentImages()` was only called on hardcoded data in `data.ts`, not on API products. | Exported the function and call it on DB products in `AppDataContext`. |
| 34 | **Lab test images didn't apply to DB source data** — `resolveHealthcareServiceImage` explicitly skipped lab tests. DB lab tests showed same generic Unsplash URL. | Added `normalizeLabImageSlug()` to match DB lab test titles to local `srv-lab-home-*.jpg` files. |
| 35 | **10+ empty/defective home healthcare images** — Wrong categories (surgical OR for long-term care, gym for physiotherapy, injection for speech therapy, factory for occupational therapy). | Downloaded real photos for each category (caregiver with elderly, therapy sessions, etc.). |
| 36 | **All 12 rental products used same generic image** — `photo-1576091160550-2173dba999ef` showed laptop/stethoscope, actual rental products are beds/wheelchairs/O2 cylinders. | Downloaded `hospital_bed.jpg` and added mapping for electric beds. |
| 37 | **20+ empty catch blocks** — Silent error swallowing throughout the codebase. | Fixed 3 critical ones (provider registration, support ticket, newsletter). Added `toast.error()` and proper error messages. |
| 38 | **No confirmation on booking cancellation** — ProfileModal cancelled bookings immediately with no confirmation dialog. | Added `ConfirmDialog` before cancelling. |
| 39 | **AuthModal terms link was dead** — Span styled as link but had no `onClick` or `href`. | Changed to proper `<a>` tag linking to medzivahealthcare.com. |
| 40 | **CartDrawer touch targets too small** — Close (X), delete (Trash), Minus, Plus buttons had `p-1` (22px) — below 44px minimum for mobile. | Increased all to `p-2` (36px+). Added `aria-label` to all icon-only buttons. |
| 41 | **Custom hex colors instead of Tailwind tokens** — `hover:bg-[#0fd08f]` (BookingModal, EnquiryModal, AdminDashboard), `bg-[#10B981]` (AuthModal). | Standardized to `hover:bg-emerald-600` and `bg-medical-green`. |
| 42 | **Overlapping lab tests** — CBC, FBS, and HbA1c appeared in BOTH `routine-blood-tests` AND `customize-lab-package`. | Removed from `routine-blood-tests`, keep only in `customize-lab-package`. |
| 43 | **Service count mismatch** — LabTestSeeder created 47 services, not 50 after removing 3 duplicates. | Verified: 47 lab-tests-at-home + 295 biomarkers + 27 home health + 14 IV + 4 health packages = 387 total. |

## Part 2: Test Scenarios

### Test 1: Fresh Install
```bash
cd med21-laravel
cp .env.example .env  # Then edit DB credentials
php artisan key:generate
php artisan migrate:fresh --seed
php artisan serve
# In another terminal:
cd med21
cp .env.example .env
npx tsx server.ts
# Visit http://localhost:3000
```

### Test 2: Verify Seed Data
```bash
# Check accounts
php artisan tinker
App\Models\User::count(); # Should be 4
App\Models\Vendor::count(); # Should be 1
App\Models\Service::count(); # Should be 387
App\Models\Product::count(); # Should be 12
App\Models\VendorWorkingHour::count(); # Should be 7
```

### Test 3: Login Flow
1. Open http://localhost:3000
2. Click profile icon → "Sign In"
3. Log in as customer: `customer@medzivahealthcare.com` / `Medziva@123`
4. Verify profile loads with correct name
5. Log out, log in as vendor: `vendor@medzivahealthcare.com` / `Medziva@123`
6. Verify vendor dashboard shows services and working hours

### Test 4: Browse Services
1. Click "Services" in navigation
2. Verify all 7 service categories appear (Nursing, Long-Term, Physio, Doctor, Speech, Occupational, IV Therapy)
3. Click a service → verify "Book Now" and "Add to Cart" buttons work
4. Click "View Details" → verify service attributes show (ingredients, benefits, disclaimer for IV therapy)
5. Click "Lab Tests" → verify routine-blood-tests and other subcategories show with correct number of tests
6. Click "Create Your Own Package" → verify biomarker search works

### Test 5: Rent Equipment
1. Click "Products" → "Rent Medical Equipment"
2. Verify 12 products show with correct images
3. Verify each has correct prices (weekly + monthly + deposit)

### Test 6: Single Service Booking
1. Logged in as customer, go to any service
2. Click "Book Now"
3. Select date → verify time slots are filtered by vendor hours + lead time
4. Verify promo code field works (try `MEDZIVA10`)
5. Fill in details → click "PAY NOW" → verify ENBDpay redirect
6. On return, verify booking appears in "My Bookings"

### Test 7: Multi-Service Cart Checkout
1. Add 2-3 different services to cart
2. Open cart, click "Proceed to Checkout"
3. Verify each service has its own time slot picker
4. Verify slots are filtered per-service (different lead times/different vendors)
5. Fill details → checkout → verify separate bookings are created

### Test 8: Vendor Booking Acceptance
1. Login as vendor: `vendor@medzivahealthcare.com`
2. Go to "My Bookings" tab
3. Verify new pending bookings appear
4. Click "Accept" on a booking → verify it moves to Active
5. Verify booking expiry is shown (2h from vendor's next working hour)

### Test 9: Booking Expiry
1. Create a booking at night (after vendor hours)
2. Don't accept as vendor
3. Run `php artisan bookings:cancel-expired`
4. Verify booking is cancelled and customer gets "Unable to Fulfill" email
5. Verify no money was charged (auth voided)

### Test 10: Booking Reschedule
1. Login as customer with a pending booking
2. Go to "My Bookings" in ProfileModal
3. Click "Reschedule" on a booking
4. Pick new date/time → Save
5. Verify booking updated. If vendor was assigned, it goes back to pending.

### Test 11: Cancellation
1. Login as customer with a booking
2. Click "Cancel" → confirm dialog appears
3. Confirm → verify booking cancelled
4. If less than 24h since booking, check 20% cancellation fee logic applies

### Test 12: Admin Panel
1. Login as admin: `admin@medzivahealthcare.com`
2. Go to http://localhost:3000/admin
3. Verify dashboard shows correct KPIs
4. Go to Vendors → view vendor details → verify vendor pricing input works
5. Go to Reports → Revenue tab → verify Revenue/Cost/Profit breakdown shows

### Test 13: Vendor Working Hours
1. Login as vendor
2. Go to "Working Hours" tab
3. Verify 7 days show with 8AM-10PM defaults
4. Change hours for a day → Save
5. Login as customer → try booking that service → verify slots respect new hours

### Test 14: Image Verification
1. Navigate to ALL service pages
2. Verify each service card shows a relevant, good quality photo (not broken, not stretched)
3. Check IV therapy → should show IV drip bags
4. Check wound care → should show wound dressing
5. Check caregiver → should show caregiving
6. Verify all 12 rental products show correct equipment images (not generic laptop/stethoscope)

### Test 15: Email Flow (check `storage/logs/laravel.log`)
1. Create a booking → check log for `BookingConfirmation` email
2. Accept as vendor → check log for `BookingStatusUpdate` (Active) + vendor acceptance email
3. Cancel a booking → check log for `BookingStatusUpdate` (Canceled) + vendor cancellation email
4. Run `php artisan bookings:send-reminders` → check log for `BookingReminder` email (only if booked >48h before appointment)

## Part 3: Deployment Checklist

```bash
# Pre-deployment checks
php artisan migrate --force
php artisan config:cache
php artisan route:cache
php artisan view:cache
php artisan key:generate   # Generate APP_KEY

# Ensure .env has:
APP_TIMEZONE=Asia/Dubai
SESSION_ENCRYPT=true
MAIL_MAILER=smtp
ENBDPAY_MOCK=false
APP_KEY={generated key}

# Set up cron (run `crontab -e`):
* * * * * cd /path/to/med21-laravel && php artisan schedule:run >> /dev/null 2>&1

# Set up webhook:
# ENBDPAY_WEBHOOK_URL must be: https://medzivahealthcare.com/api/payments/enbd/webhook
# (NOT /api/enbdpay/webhook)
```

## Part 4: Key Principles for Future Development

1. **Database is the single source of truth** — Never hardcode services, products, or categories in frontend code. Always fetch from API.
2. **No shared imports outside project root** — `../../shared/` will break in production builds. Define data locally or seed to database.
3. **Check file paths on Linux** — macOS is case-insensitive, Linux is case-sensitive. Always use exact case.
4. **Test payment endpoints with auth** — Payment mutations (capture, refund, void) must always be admin-protected.
5. **Always set timezone explicitly** — Never assume UTC. Dubai is Asia/Dubai (GMT+4).
6. **Never commit real credentials** — DB passwords, API keys, OAuth client IDs go in production .env only.
7. **Every API call needs error handling** — Empty catch blocks hide bugs. At minimum log the error.
8. **Mobile touch targets must be ≥44px** — Buttons with `p-1` are too small. Use `p-2` minimum.
9. **One source of truth for emails** — Always pass `CaseKeys::camelize()` data to mail classes. Mail classes should check both key formats.
10. **All unsplash URLs must be verified** — Check they return 200 before using. Use `?w=400&h=300&fit=crop&q=80` for consistent sizing and small file size.
