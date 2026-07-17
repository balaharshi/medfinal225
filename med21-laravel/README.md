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
| `CatalogService` | All booking/business logic (1400+ lines) |
| `TimeSlotCalculator` | Vendor-hours-aware slot + lead time calculation |
| `AuthService` | Login, register, OAuth |
| `EnbdpayService` | ENBDPay AUTH + CAPTURE flow |
| `PusherService` | Real-time vendor notifications |
| `VendorServiceAssignmentService` | Vendor-service assignment management |
| `WhatsAppService` | Meta Cloud API for WhatsApp notifications |

### Cron Jobs

| Command | Frequency | Purpose |
|---|---|---|
| `bookings:cancel-expired` | Every 5 min | Cancel unaccepted bookings 2h after vendor working hours |
| `bookings:send-reminders` | Hourly | Send 24h reminder (only if booked >48h before appointment) |
| `payments:capture-expired` | Hourly | Capture expired ENBDPay authorizations |

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
