# MedZiva — Deployment & Testing Guide

## Quick Start

```bash
# On the staging server:
php artisan migrate:fresh --seed
php artisan config:cache
./deploy.sh staging
```

---

## Test Accounts

| Role | Email | Password |
|------|-------|----------|
| Super Admin | superadmin@medzivahealthcare.com | Medziva@123 |
| Admin | admin@medzivahealthcare.com | Medziva@123 |
| Vendor | vendor@medzivahealthcare.com | Medziva@123 |
| Customer | customer@medzivahealthcare.com | Medziva@123 |

**All demo accounts use @medzivahealthcare.com domain.** The old @medziva.ae accounts were removed.

---

## What the Seeder Does

1. Creates all 4 test accounts
2. Seeds 27 Home Healthcare, 14 IV Therapy, 47 Lab Tests, 295 Biomarkers, 12 Products
3. Demo Vendor gets ALL 383 services enabled
4. Demo Vendor gets default working hours (8AM-10PM daily)
5. Creates promo code `MEDZIVA10` (10% off, max AED 100)

---

## Configurations

### .env (staging/production)

```env
# MUST BE SET:
APP_TIMEZONE=Asia/Dubai
SESSION_ENCRYPT=true

# SMTP (for booking emails)
MAIL_MAILER=smtp
MAIL_HOST=smtpout.secureserver.net
MAIL_PORT=465
MAIL_USERNAME=booking@medzivahealthcare.com
MAIL_PASSWORD=<actual_password>
MAIL_FROM_ADDRESS=booking@medzivahealthcare.com  # NO quotes

# ENBDPay (production = mock=false, staging = mock=true)
ENBDPAY_MOCK=false  # Change to false in production
ENBDPAY_REDIRECT_URL=https://medzivahealthcare.com/payment/return
ENBDPAY_WEBHOOK_URL=https://medzivahealthcare.com/api/payments/enbd/webhook
# NOT: /api/enbdpay/webhook (wrong path)

# Pusher (for real-time vendor notifications)
PUSHER_APP_ID=
PUSHER_KEY=
PUSHER_SECRET=
PUSHER_CLUSTER=
```

After editing `.env`:
```bash
php artisan config:cache
```

---

## Important: Set Up Cron

The following scheduled tasks must be running:

```bash
# Run `crontab -e` and add:
* * * * * cd /path/to/med21-laravel && php artisan schedule:run >> /dev/null 2>&1
```

This enables:
- `bookings:cancel-expired` — runs every 5 min, cancels unaccepted bookings after 2h from vendor working hours
- `bookings:send-reminders` — runs hourly, sends 24h booking reminders (only if booked >48h before appointment)
- `CaptureExpiredAuthorizations` — runs hourly, captures expired payment auths

---

## Booking Flow

1. Customer selects service → picks date/time (filtered by vendor working hours + lead time)
2. Booking created with `vendor_id = null`, `status = Pending`, `expires_at = vendor_start + 2h`
3. Email + Pusher notification sent to ALL eligible vendors
4. First vendor to accept gets the booking (atomic `UPDATE WHERE vendor_id IS NULL`)
5. Booking expires if no vendor accepts within 2h of vendor's working hours start

### Key Rules:
- **Lead time** starts from vendor's next working hour (not from current time)
- **Booking expiry** = earliest vendor working hour + 2h (not from booking creation)
- **Cancellation refund**: >24h from booking = full refund. ≤24h = 20% fee (max AED 100)
- **Rescheduling**: 1 free reschedule, 24h notice before original time
- **Cart checkout**: Creates one booking per item, each with its own time slot

---

## Admin Panel — Vendor Service Management

**Path:** Admin Panel → Vendor Services (sidebar)

**How it works:**
1. Left panel shows all vendors — click to select one
2. Right panel shows ALL services with toggle checkboxes
3. Each enabled service has a "Cost" input field (what the vendor charges MedZiva)
4. Reports → Revenue tab shows Revenue vs Cost vs Profit breakdown

---

## Testing Checklist

### Admin Panel
- [ ] Login as admin@medzivahealthcare.com at /admin
- [ ] Verify dashboard KPI cards show correct counts
- [ ] Verify revenue chart renders
- [ ] Go to Vendors → view details → check vendor pricing input works
- [ ] Go to Vendor Services → toggle services on/off, set vendor prices
- [ ] Go to Reports → Revenue tab → verify Revenue/Cost/Profit shows
- [ ] Go to SLA tab → verify vendor metrics load
- [ ] Go to Settings → verify SMTP config, regions, VAT can be updated

### Vendor Panel
- [ ] Login as vendor@medzivahealthcare.com at /vendor
- [ ] Verify "Working Hours" tab shows 7 days with time pickers
- [ ] Change working hours, save, verify customer sees updated slots
- [ ] Verify "My Bookings" shows pending bookings with expiry timer
- [ ] Accept a booking → verify it moves to Active
- [ ] Try double-clicking accept → should get 409 Conflict
- [ ] Update booking status (In Progress → Completed, Canceled)
- [ ] Verify profile change request flow works

### Customer Flow
- [ ] Browse Services → verify all categories show
- [ ] Browse Products → verify 12 rental items render with correct images
- [ ] Click "Book Now" on a service → verify time slots respected vendor hours
- [ ] Add multiple items to cart → verify checkout shows per-service time slots
- [ ] Complete checkout → verify booking appears in My Bookings
- [ ] Reschedule a booking → verify 24h notice enforced
- [ ] Cancel a booking → verify confirmation dialog appears
- [ ] View "My Profile" → update name/email/phone

### Image Verification
- [ ] All IV therapy services show IV drip related images (not broken)
- [ ] All home healthcare services show appropriate images
- [ ] All lab tests show lab-related images
- [ ] All 12 rental products show actual equipment photos
- [ ] No broken image icons anywhere

### Email Verification (check storage/logs/laravel.log)
- [ ] Booking creation → BookingReceived + VendorNewBooking
- [ ] Vendor accept → BookingStatusUpdate (Active) + Vendor accepted confirmation
- [ ] Customer cancel → BookingStatusUpdate (Cancelled) + VendorBookingCancelled
- [ ] Booking expiry → BookingExpired (customer)
- [ ] Run `php artisan bookings:send-reminders` → BookingReminder (only if booked >48h prior)

---

## File Structure

```
medfinal225/
├── BALA_DEBRIEF_AND_TESTING_GUIDE.md   # Full bug list + test scenarios for developers
├── med21/                               # React frontend
│   ├── src/
│   │   ├── components/
│   │   ├── context/
│   │   │   └── AppDataContext.tsx       # API-first data loading (no hardcoded fallbacks)
│   │   ├── data.ts                      # Image resolution ONLY (no hardcoded services/products)
│   │   └── App.tsx                      # 3100+ lines — needs splitting
│   └── src/assets/images/
│       ├── home_healthcare/             # 50+ service images (IV therapy, nursing, etc.)
│       ├── rentalimg/                   # 12 rental equipment images
│       ├── lab-tests-at-home/           # 49 lab test images
│       └── services/                    # General service category images
├── med21-laravel/                       # Laravel backend
│   ├── app/
│   │   ├── Mail/                        # 7 mail classes (BookingConfirmation, BookingExpired, BookingReminder, BookingStatusUpdate, PaymentConfirmation, VendorNewBooking, VendorBookingCancelled)
│   │   ├── Services/
│   │   │   ├── CatalogService.php       # 1400+ lines — all booking/expiry/refund/reschedule logic
│   │   │   ├── TimeSlotCalculator.php   # Vendor-hours-aware slot calculation
│   │   │   └── EnbdpayService.php       # AUTH + CAPTURE payment flow
│   │   └── Console/Commands/
│   │       ├── CancelExpiredBookings.php     # Auto-cancel + void payment
│   │       └── SendBookingReminders.php      # 24h reminder email
│   ├── database/seeders/               # 8 seeders (HomeHealthcare, IVTherapy, LabTest, Biomarker, HealthPackage, Product, VendorWorkingHours, DatabaseSeeder)
│   └── routes/api.php                   # API routes with auth middleware on payment endpoints
└── deploy.sh                            # Deployment script
```
