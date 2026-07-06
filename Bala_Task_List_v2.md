# Updated Task List for Bala

**Date:** July 6, 2026
**Repository:** balaharshi/medfinal225 (main branch)

---

## WHAT'S ALREADY DONE (Code complete, just needs deploy)

These are already in the code. You just need to deploy them.

- [x] Booking View fetches from API (GET /api/booking/{id})
- [x] Vendor logo field in admin form
- [x] Vendor profile change request system (submit + review)
- [x] PusherService implementation (real Pusher SDK, not stub)
- [x] Password reset flow
- [x] Promo code system
- [x] Booking status update endpoints
- [x] Customer self-cancellation
- [x] Search bug fixes
- [x] Console.error removal

---

## WHAT YOU NEED TO DO ON THE SERVER (GoDaddy)

### 1. Google Sign-In Button

The button won't show until you do this on your LOCAL machine:

**Step 1:** Open `med21/.env` on your computer

**Step 2:** Add this line:
```
VITE_GOOGLE_CLIENT_ID=280907089546-fj9j3evjsf5nn18ir63bcprb9stpod5b.apps.googleusercontent.com
```

**Step 3:** Rebuild:
```bash
cd med21
npm run build
```

**Step 4:** Upload the NEW `med21/dist/` to GoDaddy (replace old one)

**Why:** Vite reads `.env` at build time. Server `.env` doesn't help frontend.

---

### 2. Deploy All Code

Upload both to GoDaddy:
- `med21/dist/` → frontend
- `med21-laravel/` → backend

---

### 3. Run These Commands on Server

```bash
cd /path/to/med21-laravel

# Install Pusher package
composer require pusher/pusher-php-server

# Install dependencies
composer install --no-dev --optimize-autoloader

# Run all new migrations
php artisan migrate --force

# Cache config
php artisan config:cache
php artisan route:cache
```

---

### 4. Set Backend .env on Server

Make sure these are set in `med21-laravel/.env`:

```env
# Database
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=medziva
DB_USERNAME=medziva
DB_PASSWORD=your_actual_password

# Google OAuth
GOOGLE_CLIENT_ID=280907089546-fj9j3evjsf5nn18ir63bcprb9stpod5b.apps.googleusercontent.com
GOOGLE_ADMIN_EMAILS=varun@medziva.com

# Pusher (get from dashboard.pusher.com)
PUSHER_APP_ID=your_app_id
PUSHER_KEY=your_key
PUSHER_SECRET=your_secret
PUSHER_CLUSTER=ap2
PUSHER_USE_TLS=true
PUSHER_CHANNEL=medziva-notifications

# Session
SESSION_DRIVER=database
SANCTUM_STATEFUL_DOMAINS=medzivahealthcare.com,localhost,localhost:5173

# Payment (get from ENBDpay)
ENBDPAY_API_KEY=your_api_key
ENBDPAY_WEBHOOK_SECRET=your_webhook_secret
ENBDPAY_MOCK=true
```

---

### 5. Fix Laravel API Routing

If `/api/categories` returns HTML instead of JSON:

1. Make sure document root points to `public/` folder
2. Check `.htaccess` exists in `public/`
3. Make sure `mod_rewrite` is enabled
4. If in subdirectory, add `RewriteBase /` to `.htaccess`

---

## VERIFY AFTER DEPLOYMENT

- [ ] Homepage loads at medzivahealthcare.com
- [ ] Google login button appears on login page
- [ ] Google login works
- [ ] Admin can login
- [ ] Admin can view bookings (click View)
- [ ] Admin can manage vendors (with logo field)
- [ ] Admin can review profile change requests
- [ ] Vendor can login
- [ ] Vendor can see their bookings
- [ ] Vendor can accept bookings
- [ ] Vendor profile is read-only
- [ ] Vendor can submit change requests
- [ ] API returns JSON not HTML
- [ ] No console errors in browser

---

## IF SOMETHING BREAKS

| Problem | Fix |
|---|---|
| API returns HTML | Fix document root to `public/` |
| Google button missing | Set `VITE_GOOGLE_CLIENT_ID` in `med21/.env` before build |
| Pusher not working | Set Pusher credentials + run `composer require pusher/pusher-php-server` |
| Migration error | Run `php artisan migrate --force` |
| White screen | Check `storage/logs/laravel.log` |
| 403 on admin | Email not in `GOOGLE_ADMIN_EMAILS` or role not `super_admin` |

---
