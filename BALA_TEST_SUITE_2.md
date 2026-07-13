# MedZiva — Advanced QA Test Suite

> **Branch**: `feature/repo-improvements`  
> **Before testing**: `cd med21-laravel && php artisan migrate:fresh --seed` (fresh DB required — schema changed)  
> **Build frontend**: `cd med21 && npm run build`  
> **Estimated time**: 4–6 hours for thorough testing (27 tests)  
> **Report**: PASS / FAIL per test + screenshots of any errors

---

## What Changed — Read This First

This branch contains Varun's full platform improvement pass. Here's what's different from the last version you tested:

### Bugs Fixed (from your last report)
| Issue | Fix |
|-------|-----|
| "Too Many Requests" on cart checkout | Throttle raised: bookings 20/min, payments 15/min |
| Admin vendor pricing broken | URL fixed + vendor pricing form UI added |
| Revenue/Cost/Profit reports blank | `cost` column added to DB, 4 KPI cards in Reports tab |
| Can't book monthly rental | Weekly/Monthly duration toggle in rental modal |
| Booking expiry timer missing | `expires_at` column + countdown on vendor dashboard |
| "undefined" vendor names on IV therapy | Hardcoded vendors removed — customer never sees vendor pricing |

### Architecture Changes
- **App.tsx**: Split from 3,100+ lines to 778. 11 separate page components + shared state hook
- **SafeImage**: New image component used everywhere (42 replacements) — no more broken image icons
- **API calls**: All raw `fetch()` replaced with centralized client (except LocationPicker for OpenStreetMap)
- **Backend**: Image validation observer, custom validation rule, image registry config
- **Migrations**: 3 new — `lead_time_minutes` + `booking_notice_minutes` on services, composite index on bookings, `cost` + `expires_at` on bookings

### Files Changed
- 20 modified, 8 new files across backend + frontend
- Vendors "Doctor Plus Home Healthcare" and "Pegasus" removed from seeders (accidental Excel import — will add back properly later)
- Only MedZiva MRP prices are customer-facing. Vendor internal pricing is admin-only

---

## Test Accounts

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@medzivahealthcare.com | Medziva@123 |
| Vendor | vendor@medzivahealthcare.com | Medziva@123 |
| Customer | customer@medzivahealthcare.com | Medziva@123 |

For Tests 2-4, create new accounts — do not reuse demo accounts.

---

## Test 1: Fresh Database + Verify Seed Data
```bash
php artisan migrate:fresh --seed
php artisan tinker
```
Verify counts in tinker:
```
App\Models\User::count()         # Expected: varies (admin, vendor, customer accounts)
App\Models\Vendor::count()       # Expected: 1
App\Models\Service::count()      # Expected: varies
App\Models\Product::count()      # Expected: varies
App\Models\VendorWorkingHour::count()  # Expected: 7
App\Models\PromoCode::count()    # Expected: 1
```
**Expected**: All counts match seeder output. Record actual numbers.

---

## Test 2: Register a Brand New Customer
Steps:
1. Open site, click "Sign In" → "Create MedZiva Account"
2. Register with: `testuser1@example.com` / `Test@12345` / Full Name: "Test User One" / Phone: `050 111 2222`
3. After registration, verify you are logged in (profile icon shows name)
4. Log out and log back in with the same credentials
5. Verify profile name shows correctly

**Expected**: Registration succeeds, login works, profile name persists.

---

## Test 3: Create a Second Vendor via Admin Panel
Steps:
1. Login as `admin@medzivahealthcare.com` / `Medziva@123`
2. Navigate to Admin Panel → Vendors tab
3. Click "Add Vendor" and create:
   - Name: "Test Vendor LLC"
   - Email: `testvendor@example.com`
   - Type: "Healthcare Provider"
   - Contact: `050 333 4444`
   - Address: "Dubai"
   - Active: Yes
4. Go to Vendor Services tab, select "Test Vendor LLC"
5. Enable 3 services and set vendor prices for each:
   - Generic Nurse Visit: AED 150
   - Physiotherapy at Home: AED 300
   - Doctor at Home: AED 350
6. Go to Vendor Working Hours tab (or have vendor log in and set them)
7. Set working hours: Sunday-Thursday 8AM-6PM, Friday-Saturday CLOSED

**Expected**: Vendor created, services assigned with prices, working hours saved.

---

## Test 4: Login as the New Vendor and Accept a Booking
Steps:
1. Login as `testvendor@example.com` (Use password set during creation or check DB)
   - If no password set, use admin panel to create vendor user account
2. Verify vendor dashboard shows:
   - Working Hours tab with correct schedule
   - My Bookings tab ready to receive bookings
3. Verify the 3 assigned services appear correctly

**Expected**: Vendor dashboard loads, assigned services visible, working hours match.

---

## Test 5: Single Booking — Complete Flow (Customer → Vendor → Completion)
Steps:
1. Login as `testuser1@example.com` (from Test 2)
2. Browse to Services → Nursing Care → "Generic Nurse Visit"
3. Click "Book Now"
4. Select date 3 days from now, pick a time slot within working hours (8AM-6PM, Sun-Thu)
5. Apply promo code `MEDZIVA10` — verify 10% discount
6. Fill in address: "123 Test Street, Dubai Marina"
7. Click PAY NOW and complete payment
8. Login as `testvendor@example.com`
9. Go to My Bookings — verify the new booking appears with status "Pending" and expiry timer visible
10. Click "Accept Booking"
11. Verify booking moves to "Active" status
12. Click "In Progress" → then "Completed"
13. Login back as customer — verify booking shows "Completed" in My Bookings

**Expected**: Full booking flow works end-to-end. Expiry timer visible on pending bookings. Promo code applied. Status transitions correctly.

---

## Test 6: Multi-Service Cart Checkout with Per-Service Time Slots
Steps:
1. Login as customer
2. Add 3 different services to cart:
   - Generic Nurse Visit
   - Physiotherapy at Home
   - Doctor at Home
3. Open cart → click "Proceed to Checkout"
4. Verify each service has its OWN date/time slot picker (not shared)
5. Select different dates/times for each service
6. Verify prices auto-update to latest API prices (stale price warning if applicable)
7. Fill customer details and complete checkout
8. Verify 3 separate bookings are created (check My Bookings)
9. Verify vendor receives 3 booking notifications

**Expected**: Cart creates separate bookings per service with individual time slots. No "Too Many Requests" error.

---

## Test 7: Booking Reschedule Flow
Steps:
1. From Test 5 or 6, pick a completed/accepted booking in My Bookings
2. Create a new booking for a service (Generic Nurse Visit)
3. Click "Reschedule" on that booking
4. Pick a new date (at least 24 hours from now) and a new time slot
5. Save — verify booking updates with new date/time
6. Verify reschedule count increments to "1 time(s)"
7. Try rescheduling again — verify it's blocked (only 1 free reschedule)

**Expected**: Reschedule works once. Second attempt blocked.

---

## Test 8: Booking Cancellation and Refund
Steps:
1. Create a booking for a service
2. Wait for vendor to accept it (or test with unaccepted booking first)
3. Click "Cancel" on the booking
4. Verify confirmation dialog appears before canceling
5. Confirm cancellation
6. Check My Bookings — booking should show "Canceled"
7. If payment was captured, verify refund logic applied
8. Create another booking and cancel immediately (before vendor accepts) — verify it cancels

**Expected**: Cancellation works with confirmation dialog. Refund triggered for captured payments.

---

## Test 9: Vendor Availability — Time Slot Filtering
Steps:
1. Login as vendor, set working hours for Monday: 10AM-2PM only
2. Save hours
3. Login as customer, try to book a service assigned to that vendor for Monday
4. Verify time slots ONLY show between 10AM-2PM (not 8AM-10PM)
5. Try booking outside those hours — should not be allowed
6. Change vendor hours for Tuesday to CLOSED (uncheck all)
7. Try booking for Tuesday — should show "No slots available"
8. Reset vendor hours back to default (8AM-10PM all days)

**Expected**: Time slots strictly respect vendor working hours. Closed days show no slots.

---

## Test 10: Admin Revenue and Cost Reporting
Steps:
1. Login as admin, go to Admin Panel → Reports & Analytics
2. Verify Revenue tab shows 4 KPI cards:
   - Gross Revenue (AED)
   - Total Cost (AED)
   - Net Profit (AED)
   - Completed Visits
3. Create a booking with a service that has a vendor cost set
4. Complete the booking
5. Refresh reports — verify Revenue, Cost, and Profit numbers update correctly
6. Check that charts render (Revenue by Service, Vendor Performance, Sales Trend)
7. Test date range filter — select "This Month" and verify data filters

**Expected**: Revenue/Cost/Profit KPIs show correct calculations. Charts render for all data segments.

---

## Test 11: Admin — Create and Manage a Service
Steps:
1. Login as admin, go to Services tab
2. Click "Add Service" and create:
   - Title: "Test Service - Foot Massage"
   - Category: "service" / Subcategory: "home-healthcare"
   - Price: 150 AED
   - Sale Price: 99 AED
   - Lead time: 12 hours
3. Add vendor pricing for "Test Vendor LLC": AED 80
4. Save service
5. Verify service appears in customer-facing service list
6. Edit the service — change price to 200 AED
7. Save and verify price updated
8. Toggle service to inactive — verify it disappears from customer view
9. Toggle back to active
10. Delete the service

**Expected**: Full CRUD for services works through admin panel.

---

## Test 12: Product Rental Booking — Weekly vs Monthly
Steps:
1. Browse to Products → "Rent Medical Equipment"
2. Select "Electric Bed 3 Function"
3. Click "Book"
4. Verify rental modal shows duration selector: Weekly / Monthly
5. Select "Weekly" — verify price shows as listed (e.g., AED 500)
6. Switch to "Monthly" — verify price multiplies (e.g., AED 2,000)
7. Fill customer details, select delivery date, add address
8. Submit booking
9. Check My Bookings — verify rental booking appears with correct duration in notes

**Expected**: Duration toggle works with correct price calculation. Monthly = weekly x 4.

---

## Test 13: Lab Tests — Browse and Book
Steps:
1. Browse to Lab Tests → "Routine Blood Tests"
2. Verify all lab tests in that category show with images and prices
3. Click "Add to Cart" on Complete Blood Count (CBC)
4. Navigate to "Create Your Own Package"
5. Search for "Vitamin D" in biomarker search
6. Select Vitamin D test and add to cart
7. Verify both items appear in cart
8. Proceed to checkout with separate time slots
9. Complete booking
10. Verify both bookings appear in My Bookings

**Expected**: Lab test browsing, biomarker search, cart, and checkout all work.

---

## Test 14: Enquiry / Contact Form
Steps:
1. Without logging in, navigate to any service
2. Click "Enquire" button (if available) or find the contact/support section
3. Fill enquiry form:
   - Name: "Prospect Customer"
   - Email: `prospect@example.com`
   - Phone: `050 999 8888`
   - Service: "Custom nursing care"
   - Message: "I need 24/7 nursing support for my elderly mother in Dubai"
4. Submit
5. Login as admin → Enquiries tab
6. Verify the enquiry appears with correct details
7. Change enquiry status to "Responded"
8. Delete the enquiry

**Expected**: Enquiry form submits correctly. Admin can view, update status, and delete.

---

## Test 15: Promo Code — Edge Cases
Steps:
1. Try applying promo code `MEDZIVA10` on a booking under AED 100
2. Verify discount calculation is correct
3. Try an invalid promo code like `FAKE123`
4. Verify "Invalid promo code" error message
5. Create a booking, apply promo code, verify discount in checkout
6. Login as admin, go to Promo Codes (or Settings)
7. Disable the `MEDZIVA10` promo code
8. Try applying it again as customer — should be rejected

**Expected**: Valid promo codes apply discounts. Invalid/disabled codes show appropriate error.

---

## Test 16: Session Persistence and Logout
Steps:
1. Login as customer
2. Add 2 items to cart
3. Close browser tab completely
4. Reopen site — verify items still in cart (localStorage)
5. Verify login session persists (still logged in)
6. Click Logout
7. Verify cart is empty after logout
8. Verify profile icon shows "Sign In" again

**Expected**: Cart persists across tab close. Session persists. Logout clears everything.

---

## Test 17: Responsive Design — Mobile View
Steps:
1. Open browser DevTools, switch to mobile view (iPhone 14 or similar)
2. Browse Home page — verify hero image, services carousel render correctly
3. Open hamburger menu — verify all navigation links work
4. Browse Services → verify category pills scroll horizontally
5. Click a service → verify "Book Now" and "Add to Cart" buttons are tappable (not too small)
6. Open cart drawer from mobile — verify touch targets for close, delete, plus/minus are ≥ 44px
7. Complete a booking entirely on mobile view
8. Open Admin or Vendor dashboard on mobile — verify tables scroll horizontally

**Expected**: All pages usable on mobile. Touch targets large enough. No visual overflow.

---

## Test 18: Error Handling — Invalid Inputs
Steps:
1. Try registering with an already-used email: `customer@medzivahealthcare.com`
   - Verify error message: "Email already registered"
2. Try logging in with wrong password for `customer@medzivahealthcare.com`
   - Verify error message
3. Try booking with empty required fields (no name, no email)
   - Verify validation errors shown per field
4. Try submitting enquiry with invalid email format (`notanemail`)
   - Verify validation error
5. Try to access `/admin` URL while logged in as customer
   - Verify redirect or access denied

**Expected**: All invalid inputs show clear error messages. Routes are protected.

---

## Test 19: Booking Expiry — Vendor Doesn't Accept
Steps:
1. Login as customer, create a booking for a service
2. Do NOT log in as vendor to accept it
3. Wait for expiry period (2 hours from creation)
4. Check My Bookings — booking should show "Canceled" or "Expired"
5. Run `php artisan bookings:cancel-expired` manually
6. Verify expired booking is handled correctly

**Expected**: Unaccepted bookings expire after the timeout. Expired status shown.

---

## Test 20: Image Verification
Steps:
```bash
cd med21-laravel
php artisan images:verify
```
1. Verify command output shows all image paths are valid
2. Browse through ALL service categories on the frontend
3. Verify every service card shows a relevant image (no broken images, no empty boxes)
4. Check IV Therapy, Nursing, Physiotherapy, Long-Term Care, Doctor on Call, Speech Therapy, Occupational Therapy
5. Browse all Lab Test categories — verify each test has an image
6. Browse all Products — verify each of 12 rental equipment items has correct image
7. Verify SafeImage hides any truly missing images cleanly (no broken image icon, no empty placeholder box)

**Expected**: `images:verify` passes. All 7 service categories + lab tests + products show valid images. Any missing image is cleanly hidden by SafeImage with no visual glitch.

---

## Test 21: Concurrent Vendors — First-Come Booking Acceptance
Steps:
1. Create 2 vendors via admin: "Alpha Care" and "Beta Health" (both with Generic Nurse Visit enabled)
2. Login as customer, create a booking for Generic Nurse Visit
3. Login as both vendors in separate browser tabs/windows
4. In tab A (Alpha Care): click "Accept Booking"
5. In tab B (Beta Health): click "Accept Booking" on the same booking
6. Verify one vendor gets the booking (Status: Active) and the other gets "Already accepted" error
7. Verify the booking shows correct vendor assignment (not "Unassigned")

**Expected**: Atomic vendor acceptance. Only one vendor can accept. Second attempt gets 409 Conflict.

---

## Test 22: Customer Profile — Update Details
Steps:
1. Login as customer, open Profile (click profile icon)
2. Update Full Name to "Test User Modified"
3. Update Phone to `050 999 8888`
4. Update Address to "456 New Street, JVC, Dubai"
5. Save changes
6. Log out and log back in
7. Verify profile shows updated name, phone, address

**Expected**: Profile updates persist across sessions.

---

## Test 23: Admin — Bulk Vendor Service Assignment
Steps:
1. Login as admin, go to Vendor Services tab
2. Select a vendor from the left panel
3. Toggle 5 services ON simultaneously
4. Set vendor prices for all 5 (different amounts)
5. Click Save
6. Refresh the page — verify all 5 assignments persisted
7. Toggle all 5 OFF
8. Verify all removed
9. Select another vendor — verify their services are independent (not affected by previous vendor)

**Expected**: Bulk assignment works. Vendor services are independent per vendor.

---

## Test 24: Admin — Category and Subcategory Management
Steps:
1. Login as admin, go to Categories tab
2. Create a new category: "Wellness Programs" with slug "wellness-programs"
3. Add 2 subcategories: "Yoga at Home" and "Meditation Sessions"
4. Verify both subcategories appear under the category
5. Delete one subcategory
6. Verify it's removed
7. Delete the entire category
8. Verify it's gone from the list

**Expected**: Full CRUD for categories and subcategories.

---

## Test 25: Booking Conflict — Same Customer, Same Slot
Steps:
1. Login as customer
2. Book "Generic Nurse Visit" for July 20, 10:00AM-12:00PM
3. Immediately try to book "Generic Nurse Visit" again for the same date and time slot
4. Verify the system blocks the duplicate (same customer + same service + same date + same slot)
5. Verify error message: "Duplicate booking detected" or similar

**Expected**: Duplicate booking detection prevents identical bookings.

---

## Test 26: Payment Return Page — Success and Failure
Steps:
1. Create a booking and go through ENBDpay checkout flow
2. Complete payment successfully — verify redirect to `/payment/return?responseStatus=CAPTURED`
3. Verify return page shows "Payment Successful" with booking details
4. Verify booking status updates to "Paid" in My Bookings
5. Create another booking but cancel at the payment gateway
6. Verify return page shows appropriate status for cancelled/failed payment
7. Verify booking shows correct payment_status

**Expected**: Payment return page handles all statuses (Captured, Failed, Cancelled). Booking payment status updates correctly.

---

## Test 27: All Navigation Links and Page Routing
Steps:
1. From homepage, click every nav item and verify correct page loads:
   - Home → homepage
   - Services → services with nursing care default
   - Lab Tests → lab tests with routine blood tests default
   - Products → products with rent equipment default
   - Offers → offers page
   - Support → support page
2. Click each service category pill (Nursing, Physio, Doctor, Long-Term, Speech, OT, IV Therapy) — verify correct category loads
3. Click each lab test category pill — verify correct subcategory loads
4. Click each product category pill — verify filtering works
5. Click MedZiva logo → verify goes to homepage
6. Test browser back/forward buttons — verify correct navigation

**Expected**: All routes work. No 404s. Browser history works.

---

## Summary Checklist

| Test | Description | Status |
|------|-------------|--------|
| 1 | Fresh DB + seed data counts | |
| 2 | Register new customer | |
| 3 | Create vendor via admin + assign services | |
| 4 | Vendor login + dashboard | |
| 5 | Complete booking flow (create → accept → complete) | |
| 6 | Multi-service cart checkout | |
| 7 | Booking reschedule (1 free) | |
| 8 | Booking cancellation + confirmation dialog | |
| 9 | Time slot filtering by vendor hours | |
| 10 | Admin revenue/cost/profit reports | |
| 11 | Admin CRUD service (create/edit/delete) | |
| 12 | Product rental — weekly vs monthly | |
| 13 | Lab tests + biomarker search + cart | |
| 14 | Enquiry form submission | |
| 15 | Promo code edge cases | |
| 16 | Session persistence + logout | |
| 17 | Mobile responsive design | |
| 18 | Error handling — invalid inputs | |
| 19 | Booking expiry | |
| 20 | Image verification | |
| 21 | Concurrent vendor booking acceptance | |
| 22 | Customer profile update | |
| 23 | Bulk vendor service assignment | |
| 24 | Category/subcategory CRUD | |
| 25 | Duplicate booking detection | |
| 26 | Payment return page (success/failure) | |
| 27 | All navigation links and routing | |
