# MedZiva — Bala Staging Tests (55 Tests)

> **Branch**: `develop`  
> **Environment**: staging.medzivahealthcare.com  
> **Expected Service Count**: 383 | **Expected Product Count**: 12

## Pre-Test Setup

Before running any tests, verify the deployment is clean:

```bash
ssh rvdkqh1z30zk@staging.medzivahealthcare.com
cd ~/staging/api
php artisan tinker --execute="echo \App\Models\Service::count();"
```
Must show: **383**

```bash
php artisan tinker --execute="echo \App\Models\Product::count();"
```
Must show: **12**

Then verify these endpoints (from Mac terminal):
```bash
curl -s -w "\nHTTP_CODE: %{http_code}\n" https://staging.medzivahealthcare.com/api/health
curl -s -w "\nHTTP_CODE: %{http_code}\n" https://staging.medzivahealthcare.com/api/categories
curl -s -o /dev/null -w "HTTP_CODE: %{http_code}\n" https://staging.medzivahealthcare.com/
curl -s -o /dev/null -w "HTTP_CODE: %{http_code}\n" https://staging.medzivahealthcare.com/services
```
All must return **200**.

---

## SECTION 1: Database & Seed Verification (10 tests)

### Test 1: Service Count
`php artisan tinker --execute="echo \App\Models\Service::count();"`  
**Expected**: 383

### Test 2: Product Count  
`php artisan tinker --execute="echo \App\Models\Product::count();"`  
**Expected**: 12

### Test 3: User Count
`php artisan tinker --execute="echo \App\Models\User::count();"`  
**Expected**: 3 (admin, vendor, customer)

### Test 4: Vendor Count
`php artisan tinker --execute="echo \App\Models\Vendor::count();"`  
**Expected**: 1

### Test 5: IV Therapy Count
`php artisan tinker --execute="echo \App\Models\Service::where('subcategory','iv-therapy')->count();"`  
**Expected**: 14

### Test 6: Biomarker Count
`php artisan tinker --execute="echo \App\Models\Service::where('subcategory','customize-lab-package')->count();"`  
**Expected**: 295

### Test 7: Lab Test Count
`php artisan tinker --execute="echo \App\Models\Service::where('category','lab-tests-at-home')->count();"`  
**Expected**: 47

### Test 8: Home Healthcare Count
`php artisan tinker --execute="echo \App\Models\Service::where('category','home-healthcare')->count();"`  
**Expected**: 41 (27 core services + 14 IV Therapy)

### Test 9: No Health Packages Exist
Browse the website → Lab Tests page. There should be **no** "Health Packages" category pill.

### Test 10: No Duplicate Services
Browse Services → Lab Tests. Switch between subcategory pills (Routine Blood, Preventive Health, Men's, Women's, etc.). Each service should appear in exactly ONE section.

---

## SECTION 2: Authentication & Sessions (6 tests)

### Test 11: Register New Customer
Click "Sign in / Sign up" → switch to Register tab. Fill in: name, email, phone, password, confirm password. Submit.  
**Expected**: Redirect to homepage with success toast. Profile icon shows name.

### Test 12: Logout and Login
Click profile icon → Logout. Then sign in again with the registered email + password.  
**Expected**: Login successful. Profile shows correct name.

### Test 13: Invalid Login
Attempt login with wrong password.  
**Expected**: Error toast shown. Not logged in.

### Test 14: Session Persistence
Login. Close browser tab. Open new tab → go to staging.medzivahealthcare.com.  
**Expected**: Still logged in. Cart is empty.

### Test 15: Logout Clears Cart
Add 2-3 services to cart. Logout. Login again.  
**Expected**: Cart is empty after logout.

### Test 16: Google OAuth
Click "Sign in with Google". Click your saved Google account.  
**Expected**: Logged in successfully.

---

## SECTION 3: Service & Product Catalog (7 tests)

### Test 17: Service Categories Display
On homepage, click "Book a Service". The categories should show: Home Healthcare (with subcategory pills: Nursing Care, Physiotherapy, Doctor on Call, Long-Term Care, Speech Therapy, Occupational Therapy, IV Therapy), Lab Tests at Home, and Rent Medical Equipment.

### Test 18: IV Therapy — Only 14 Services
Go to Services → IV Therapy. Scroll through all entries.  
**Expected**: 14 IV therapy services. No duplicates. All have images.

### Test 19: Lab Tests — Create Your Own Package
Go to Lab Tests → navigation menu → "Create your own Package".  
**Expected**: 295 biomarkers load. Search filter works. Each shows: Test Code, Coverage (Dubai and SHJ only), Price.

### Test 20: Lab Tests — Routine Blood Tests
Go to Lab Tests → click "Routine Blood Tests" pill.  
**Expected**: Lipid Profile, Liver Function Test, Kidney Function Test, Thyroid Function Test show. CBC, FBS, HbA1c do NOT show here (they are in Create Your Own Package).

### Test 21: Lab Tests — All Subcategory Pills Work
Click each pill: Routine Blood Tests, Preventive Health Packages, Men's Health, Women's Health, STD/Sexual Health, Specialized, Genetic Testing.  
**Expected**: Services load for each. No loading errors.

### Test 22: Products — Rental Equipment
Go to Products. All 12 rental items show. Each has: image, name, weekly price, monthly price, security deposit. Click "Rent Now" → booking modal opens.

### Test 23: Product Rental — Weekly vs Monthly
Book a Wheel Chair. Select weekly rental. Check cart → verify weekly price. Repeat with monthly → verify monthly price.  
**Expected**: Correct prices for each rental period.

---

## SECTION 4: Booking Flow (8 tests)

### Test 24: Single Service Booking
Book "Generic Nurse Visit". Choose date 3+ days ahead. Pick time slot (e.g., 08:00-10:00 AM). Enter location, address. Checkout.  
**Expected**: Booking created. Cart shows "Booking Confirmed".

### Test 25: Multi-Service Cart Booking
Add 3 different services to cart (e.g., Nurse Visit, Doctor at Home, IV Therapy). Checkout.  
**Expected**: All 3 bookings created. Go to My Bookings → all 3 show.

### Test 26: My Bookings — Customer View
Click profile → My Bookings. Check your bookings display.  
**Expected**: All bookings show with: service name, date, time slot, status, price.

### Test 27: Cancel Booking
In My Bookings, cancel a Pending booking.  
**Expected**: Status changes to "Cancelled" immediately. No manual refresh needed.

### Test 28: Duplicate Booking Prevention
Book the same service, same date, same time slot twice (from the same account).  
**Expected**: Second attempt rejected with error message.

### Test 29: Booking with Missing Fields
Attempt to checkout with empty name/phone/email fields.  
**Expected**: Validation errors shown. Booking not created.

### Test 30: Time Slot Availability
Book a service for a specific date+time slot. Then try booking the same service, same date, same time again.  
**Expected**: Already-booked slot is not available or booking is rejected.

### Test 31: Booking Enquiry (Enquiry-Only Service)
Find a service marked "Enquiry Only". Click it. Fill enquiry form. Submit.  
**Expected**: Enquiry submitted successfully. "Thank you" message shown.

---

## SECTION 5: Vendor Operations (5 tests)

### Test 32: Vendor Accepts Booking
Login as vendor@medzivahealthcare.com. Go to My Bookings. Click Accept on a Pending booking.  
**Expected**: Booking moves to Active status. Customer-side shows status update.

### Test 33: Vendor Marks Booking Complete
After accepting, change status to "In Progress" then "Completed".  
**Expected**: Booking status updates. Customer sees Completed.

### Test 34: Vendor Cannot Modify Another Vendor's Booking
If a second vendor exists, try accessing a booking assigned to them.  
**Expected**: Access denied.

### Test 35: Vendor Time Slot View
Vendor views their appointments.  
**Expected**: All accepted bookings show with correct date, time, customer info.

### Test 36: Vendor Booking Cancellation by Customer
As customer, cancel a booking. As vendor, check My Bookings.  
**Expected**: Vendor sees status as Cancelled.

---

## SECTION 6: Admin Operations (7 tests)

### Test 37: Admin Creates a Category
Login as admin@medzivahealthcare.com. Go to Admin panel → Categories. Create new category (e.g., "Nutrition").  
**Expected**: Category created. Appears in list immediately.

### Test 38: Admin Creates a Subcategory
Add "Diet Consultation" as subcategory to "Nutrition".  
**Expected**: Subcategory created. Appears under parent category.

### Test 39: Admin Creates a Service
Go to Admin → Services → Add Service. Fill all fields, assign to a category. Submit.  
**Expected**: Service created. Appears in Service Records.

### Test 40: Admin Assigns Vendor to Service
Go to Admin → Vendor Services. Select demo vendor. Enable a service for them. Set vendor price.  
**Expected**: Service assigned. Vendor price saved.

### Test 41: Admin Bulk Enables Vendor Services
Select 5 services. Click "Bulk Enable Services". Set vendor price in the price input.  
**Expected**: All 5 services enabled for vendor. Price applied.

### Test 42: Admin Views Revenue Report
Go to Admin → Reports → Revenue.  
**Expected**: Revenue KPIs load. Not all zeros if there are completed bookings.

### Test 43: Admin Creates a Vendor
Go to Admin → Vendors → Add Vendor. Fill: name, type, email, contact, address. Submit.  
**Expected**: Vendor created successfully. No "connection error".

---

## SECTION 7: Profile & Account (4 tests)

### Test 44: Update Profile — Name and Phone
Click profile → Edit Profile. Change name and phone number. Save. Logout. Login again.  
**Expected**: Updated name and phone persist after re-login.

### Test 45: Update Profile — Address
Edit profile → change address. Save. Checkout a booking → auto-filled address matches the new one.  
**Expected**: Profile address is used in booking forms.

### Test 46: Change Password
Edit profile → change password. Logout. Login with new password.  
**Expected**: Login works with new password. Old password rejected.

### Test 47: Invalid Profile Update
Try saving profile with empty name.  
**Expected**: Validation error shown. Not saved.

---

## SECTION 8: Inquiry & Contact (3 tests)

### Test 48: Enquiry Form — All Options Present
Click "Enquiry" on homepage. Open service dropdown.  
**Expected**: Shows: General Corporate & Wellness Screening, Custom Long-Term Care Package, Custom Nursing Care, Nursing Care, Physiotherapy, Doctor on Call, Long-Term Care, Speech Therapy, Occupational Therapy, IV Therapy.

### Test 49: Enquiry Submission
Fill enquiry form with name, email, phone, select "Nursing Care", write message, select contact method "Email". Submit.  
**Expected**: Success message. No error.

### Test 50: Enquiry — WhatsApp Contact
Submit an enquiry with contact method set to "WhatsApp".  
**Expected**: Submission successful.

---

## SECTION 9: UI & Responsive Design (3 tests)

### Test 51: Mobile View — Home Page
Open staging on mobile or Chrome DevTools mobile view (iPhone 14).  
**Expected**: All content visible. "Book a Service" and "Explore Products" buttons do not overlap hero image. Navigation bottom bar visible.

### Test 52: Mobile View — Service Pages
On mobile, navigate to Services → any category. Scroll through services.  
**Expected**: Cards stack vertically. Text readable. Buttons tap-friendly.

### Test 53: Desktop View — All Routes
On desktop, navigate: Home, Services, Lab Tests, Products, About, Privacy, Terms, Support, Providers.  
**Expected**: All pages load. No 404 errors. Back/forward browser buttons work.

---

## SECTION 10: Edge Cases & Error Handling (2 tests)

### Test 54: Booking Expiry
Create a booking. Wait 2 hours without vendor accepting it.  
**Expected**: Booking moves to Expired status.

### Test 55: Rapid Add-to-Cart
Add 10 items to cart rapidly one after another.  
**Expected**: Cart shows 10 items. No UI freeze or error.

---

## Summary Checklist

| # | Test | Expected | Result |
|---|------|----------|--------|
| 1 | Service count | 383 | |
| 2 | Product count | 12 | |
| 3 | User count | 3 | |
| 4 | Vendor count | 1 | |
| 5 | IV Therapy count | 14 | |
| 6 | Biomarker count | 295 | |
| 7 | Lab test count | 47 | |
| 8 | Home healthcare count | 41 (27 core + 14 IV) | |
| 9 | No health packages | None visible | |
| 10 | No duplicate services | Each appears once | |
| 11 | Register new customer | Success | |
| 12 | Logout + login | Success | |
| 13 | Invalid login | Rejected | |
| 14 | Session persistence | Stays logged in | |
| 15 | Logout clears cart | Cart empty | |
| 16 | Google OAuth | Success | |
| 17 | Service categories display | 3 cats w/ subcategories | |
| 18 | IV Therapy only 14 | Exactly 14 | |
| 19 | Create your own package | 295 biomarkers | |
| 20 | Routine blood tests | 4 services, no CBC/FBS/HbA1c | |
| 21 | All subcategory pills | All work | |
| 22 | Products rental | 12 items | |
| 23 | Product weekly vs monthly | Correct prices | |
| 24 | Single booking | Created | |
| 25 | Multi-service cart | All 3 show | |
| 26 | My bookings customer view | All show | |
| 27 | Cancel booking | Status updates | |
| 28 | Duplicate booking | Rejected | |
| 29 | Missing field validation | Error shown | |
| 30 | Time slot availability | Booked slot blocked | |
| 31 | Enquiry-only booking | Enquiry submitted | |
| 32 | Vendor accepts booking | Active status | |
| 33 | Vendor completes booking | Completed | |
| 34 | Vendor cannot cross-access | Denied | |
| 35 | Vendor time slot view | Correct info | |
| 36 | Customer cancels, vendor sees | Cancelled status | |
| 37 | Admin creates category | Created | |
| 38 | Admin creates subcategory | Created | |
| 39 | Admin creates service | Appears in records | |
| 40 | Admin assigns vendor service | Saved with price | |
| 41 | Admin bulk enables | All 5 enabled | |
| 42 | Admin revenue report | Not all zeros | |
| 43 | Admin creates vendor | No error | |
| 44 | Update profile persists | Saved after relogin | |
| 45 | Address in checkout | Auto-filled | |
| 46 | Change password | Works | |
| 47 | Invalid profile update | Rejected | |
| 48 | Enquiry options present | All 10 options | |
| 49 | Enquiry submission | Success | |
| 50 | Enquiry WhatsApp | Success | |
| 51 | Mobile home page | No overlap | |
| 52 | Mobile services | Readable | |
| 53 | Desktop all routes | No 404s | |
| 54 | Booking expiry | Expired after 2h | |
| 55 | Rapid add-to-cart | No freeze | |
