# MedZiva Healthcare — Backend API

Laravel backend for the MedZiva healthcare marketplace platform.

## Tech Stack

- Laravel 12 + PHP 8.2
- Sanctum (token auth)
- MySQL / SQLite (dev)
- Pusher (real-time vendor notifications)
- ENBDPay (payment gateway - AUTH + CAPTURE mode)

## Quick Start

```bash
cp .env.example .env
# Edit DB credentials in .env
php artisan key:generate
php artisan migrate:fresh --seed
php artisan images:verify   # Confirm all seeded image paths exist
php artisan serve
```

## Keeping Dependencies in Sync

After editing `package.json` (adding/removing/moving any dependency), always run `npm install` and commit the updated `package-lock.json`:

```bash
cd med21
npm install
git add package.json package-lock.json
git commit -m "chore: sync lockfile after dep changes"
```

The CI's `npm ci --legacy-peer-deps` step **requires** a matching lock file — it will fail immediately if `package-lock.json` is out of sync with `package.json`.

## Image Management Commands

| Command | Purpose |
|---------|---------|
| `php artisan images:verify` | Check every DB image path exists on disk |
| `php artisan images:canonicalize` | Rename image files to URL-safe slugs and update DB |
| `php artisan images:repair-missing` | Map known bad paths to canonical filenames |

Configure the frontend public path in `config/medziva.php` or via the `FRONTEND_PUBLIC_PATH` env variable.

## Key Architecture

### API Routes (`routes/api.php`)
- All payment mutation endpoints (capture, refund, void) require **admin auth**
- Public endpoints have rate limiting (60/min)
- WhatsApp webhook is public (verified by Meta signature)

### Services

| Service | Purpose |
|---|---|
| `CatalogManagementService` | Category, product, service CRUD + payload normalization |
| `BookingService` | Booking CRUD, batch create, payment status, vendor accept, cancel, reschedule, promo codes, email notifications |
| `VendorService` | Vendor CRUD, profile change requests, working hours, SLA metrics, catalog import/export |
| `EnquiryService` | Enquiry CRUD |
| `SettingsService` | Settings read/write, revenue report |
| `TimeSlotCalculator` | Vendor-hours-aware slot + lead time calculation |
| `AuthService` | Login, register, OAuth |
| `EnbdpayService` | ENBDPay AUTH + CAPTURE flow |
| `PusherService` | Real-time vendor notifications |
| `VendorServiceAssignmentService` | Vendor-service assignment management |
| `WhatsAppService` | Meta Cloud API for WhatsApp notifications |
| `WalletService` | Wallet credit/debit, balance, transaction history, config |
| `ReferralService` | Referral code generation, validation, vesting, reward processing |

### Cron Jobs

| Command | Frequency | Purpose |
|---|---|---|
| `bookings:cancel-expired` | Every 5 min | Cancel unaccepted bookings 2h after vendor working hours |
| `bookings:send-reminders` | Hourly | Send 24h reminder (only if booked >48h before appointment) |
| `payments:capture-expired` | Hourly | Capture expired ENBDPay authorizations |
| `referrals:vest` | Daily | Credit vested referral rewards to referrer wallets |

### Customer Wallet & Referral Program

#### Wallet System

Every customer automatically gets a wallet on registration. Wallets are **non-depositable** — balance comes only from:

| Source | Type | Trigger |
|---|---|---|
| Booking cancellation | Refund credit | Customer chooses wallet refund on cancel |
| Admin grant | Promotional credit | Admin manually credits wallet (e.g., welcome bonus) |
| Referral reward | Referral credit | Friend's first booking vests after configurable period |

At booking checkout, wallet credit is **auto-applied** to reduce the payment amount. If the wallet covers the full price, the booking is instantly marked Paid.

**API:**
- `GET /api/wallet` — balance + 10 most recent transactions
- `GET /api/wallet/transactions` — paginated transaction history
- `GET /api/admin/wallet/config` / `PUT` — wallet settings (welcome bonus amount)
- `GET /api/admin/wallet/users` — all customers with balances
- `POST /api/admin/wallet/credit` / `debit` — manual admin adjustments

#### Referral Program

Every customer gets a unique referral code at registration (first 3 chars of name + last 3 digits of phone, e.g. `JOH123`).

| Party | Reward | When |
|---|---|---|
| Friend (new customer) | Configurable AED discount | Applied to their first booking |
| Referrer | Configurable AED wallet credit | Credited after vesting period (default 7 days) |

Referral codes are applied during booking checkout by passing `referralCode` in the payload. The friend discount is only valid for **first-time customers** (no prior non-cancelled bookings).

**Fraud prevention:** self-referral blocked, one code per email, yearly cap (configurable, default 20), admin revoke.

**API:**
- `GET /api/referral/code` — own code + share link
- `GET /api/referral/stats` — invites sent, completed, rewards
- `GET /api/referral/history` — referral records with status
- `POST /api/referral/apply` — validate a code, returns friend discount
- `GET /api/admin/referral/config` / `PUT` — referral settings (reward amounts, vesting days, yearly cap)
- `GET /api/admin/referral/all` — all referrals
- `POST /api/admin/referral/revoke/{id}` — revoke a referral

#### Database Tables

| Table | Purpose |
|---|---|
| `wallets` | 1:1 with users, stores balance |
| `wallet_transactions` | Audit log: every credit/debit with before/after balance |
| `referral_codes` | 1:1 with users, unique code per user |
| `referrals` | Each invite/friend relationship with reward status |
| `settings.wallet_config` | JSON: `{ welcome_bonus }` |
| `settings.referral_config` | JSON: `{ referrer_reward, friend_discount, vesting_days, max_per_year }` |
| `bookings.wallet_amount` | How much wallet credit was applied to this booking |
| `bookings.wallet_transaction_id` | Links booking to the wallet debit transaction |

### Mail Classes (7)

BookingConfirmation, BookingExpired, BookingReminder, BookingStatusUpdate, PaymentConfirmation, VendorNewBooking, VendorBookingCancelled

### Seeders

| Seeder | Records |
|---|---|
| HomeHealthcareServicesSeeder | 27 services |
| HomeHealthcareIVTherapySeeder | 14 services |
| LabTestsAtHomeSeeder | 47 services |
| BiomarkerSeeder | 295 biomarkers |
| HealthPackageSeeder | 0 packages (removed) |
| RentMedicalEquipmentSeeder | 12 products |
| VendorWorkingHoursSeeder | 7 days (8AM-10PM) |
| DatabaseSeeder | 4 accounts + promo code + ~407 vendor assignments |

### Test Accounts

| Role | Email | Password |
|---|---|---|
| Admin | admin@medzivahealthcare.com | Medziva@123 |
| Vendor | vendor@medzivahealthcare.com | Medziva@123 |
| Customer | customer@medzivahealthcare.com | Medziva@123 |

## Deployment

See `../DEPLOYMENT_GUIDE.md` for full deployment instructions.

## Verified Counts (Current DB)

```bash
php artisan tinker --execute="echo json_encode([
  'services' => App\Models\Service::count(),
  'products' => App\Models\Product::count(),
  'users' => App\Models\User::count(),
  'vendors' => App\Models\Vendor::count(),
  'vendor_assignments' => App\Models\VendorServiceAssignment::count(),
]);"
```

Run this after seeding to confirm numbers match expectations.

## WhatsApp Integration

1. Create WhatsApp Business Account via Meta Business Suite
2. Create message templates: `booking_confirmed`, `payment_received`, `booking_status_update`, `new_booking_vendor`, `booking_accepted_vendor`, `booking_cancelled_vendor`
3. Add to `.env`:
```
WHATSAPP_TOKEN=EAAT...
WHATSAPP_PHONE_NUMBER_ID=123...
```
4. Webhook URL: `https://domain.com/api/whatsapp/webhook`
