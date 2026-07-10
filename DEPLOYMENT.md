# MedZiva Deployment Guide

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    GoDaddy Shared Hosting                │
│                                                         │
│  ┌──────────────────┐    ┌──────────────────────────┐  │
│  │  medzivahealthcare.com                           │  │
│  │  ─────────────────                                │  │
│  │  /public_html/     ← React frontend (built)      │  │
│  │  /public_html/api/ ← Laravel backend             │  │
│  │  ─────────────────                                │  │
│  │  /staging/         ← React frontend (test)       │  │
│  │  /staging/api/     ← Laravel backend (test)      │  │
│  └──────────────────┘    └──────────────────────────┘  │
│                                                         │
│  Frontend: React (Vite) → built locally → uploaded      │
│  Backend:  Laravel/PHP → deployed via SSH               │
│  Database: MySQL (GoDaddy)                             │
│                                                         │
│  ⚠️  IMPORTANT: GoDaddy shared hosting cannot run       │
│  Vite builds. Frontend MUST be built locally and        │
│  uploaded via cPanel.                                  │
└─────────────────────────────────────────────────────────┘
```

## Server Details

| Item | Value |
|------|-------|
| Server IP | 92.204.28.237 |
| SSH User | rvdkqh1z30zk |
| Staging URL | https://staging.medzivahealthcare.com |
| Production URL | https://medzivahealthcare.com |
| Node.js | v20.20.2 (installed via nvm) |

## Folder Structure

```
Server (92.204.28.237)
│
├── /home/rvdkqh1z30zk/
│   ├── public_html/
│   │   ├── medzivahealthcare.com/        ← PRODUCTION frontend (built files)
│   │   ├── staging.medzivahealthcare.com/ ← STAGING frontend (built files)
│   │   └── api.medzivahealthcare.com/     ← PRODUCTION Laravel backend
│   │
│   └── staging/
│       └── api/                           ← STAGING Laravel backend
│
└── Databases
    ├── medziva                            ← Production database
    └── medziva_staging                    ← Staging database
```

## Deployment Workflow

### Frontend (React/Vite)

**⚠️ GoDaddy shared hosting cannot run Vite builds.** The server lacks resources for the Rust-based SWC compiler. Frontend must be built locally and uploaded.

#### Step-by-Step:

```bash
# 1. Build locally
cd med21
npm run build

# 2. Create zip of dist folder
cd ..
zip -r staging-frontend.zip med21/dist/*

# 3. Upload via cPanel File Manager
#    - Navigate to target folder:
#      Staging: /home/rvdkqh1z30zk/public_html/staging.medzivahealthcare.com/
#      Production: /home/rvdkqh1z30zk/public_html/medzivahealthcare.com/
#    - Delete old files (keep .well-known and .htaccess)
#    - Upload zip → Extract → Delete zip
```

### Backend (Laravel)

Backend deploys via SSH:

```bash
# Staging
ssh rvdkqh1z30zk@92.204.28.237
cd /home/rvdkqh1z30zk/staging/api
git pull
php artisan migrate --force
php artisan config:cache
php artisan route:cache

# Production
ssh rvdkqh1z30zk@92.204.28.237
cd /home/rvdkqh1z30zk/public_html/api.medzivahealthcare.com
git pull
php artisan migrate --force
php artisan config:cache
php artisan route:cache
```

### One-Command Deploy (Staging)

```bash
ssh rvdkqh1z30zk@92.204.28.237 "cd /home/rvdkqh1z30zk/staging/api && git pull && php artisan migrate --force && php artisan config:cache && php artisan route:cache"
```

## First-Time Server Setup

### 1. Install Node.js (via nvm)

```bash
ssh rvdkqh1z30zk@92.204.28.237
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
source ~/.bashrc
nvm install 20
```

### 2. Initialize Git on Server

```bash
# Staging backend
cd /home/rvdkqh1z30zk/staging/api
git init
git remote add origin https://github.com/balaharshi/medfinal225.git
git fetch origin
git checkout main
git reset --hard origin/main

# Staging frontend
cd /home/rvdkqh1z30zk/public_html/staging.medzivahealthcare.com
git init
git remote add origin https://github.com/balaharshi/medfinal225.git
git fetch origin
git checkout main
git reset --hard origin/main
# Then move files from med21/ subfolder to root
cp -r med21/* .
cp med21/.* . 2>/dev/null
rm -rf med21 med21-laravel .git
```

### 3. Set Up Database

1. cPanel → MySQL Databases
2. Create database: `medziva_staging`
3. Create user with password: `Healthcare@0909`
4. Add user to database with ALL PRIVILEGES

## Environment Variables

### Staging Backend (.env)

```
APP_ENV=staging
APP_DEBUG=true
APP_URL=https://staging.medzivahealthcare.com
DB_DATABASE=medziva_staging
DB_USERNAME=medziva_staging
DB_PASSWORD=Healthcare@0909
ENBDPAY_BASE_URL=https://enbduat-acquiring-apigw.creditpluspinelabs.com
ENBDPAY_TRANSACTION_TYPE=AUTH
ENBDPAY_MOCK=true
```

### Production Backend (.env)

```
APP_ENV=production
APP_DEBUG=false
APP_URL=https://medzivahealthcare.com
DB_DATABASE=medziva
DB_USERNAME=medziva
DB_PASSWORD=PRODUCTION_PASSWORD
ENBDPAY_BASE_URL=https://api.emiratesnbdpay.com
ENBDPAY_TRANSACTION_TYPE=AUTH
ENBDPAY_MOCK=true
```

## Troubleshooting

### Frontend build fails on server
- **Expected:** GoDaddy shared hosting can't run Vite builds
- **Solution:** Build locally, upload zip via cPanel

### Backend migration fails
- Check database user has ALL PRIVILEGES in cPanel
- Verify .env credentials match cPanel MySQL settings

### Changes not appearing on site
- Frontend: Did you rebuild and upload the dist folder?
- Backend: Did you run `php artisan config:cache`?
- Try hard refresh: Ctrl+Shift+R / Cmd+Shift+R

### Git pull fails on server
- Check if .git folder exists: `ls -la /path/to/folder/.git`

---

## ⚠️ Critical Config (Added July 2026)

The following .env values MUST be set correctly. See `DEPLOYMENT_GUIDE.md` for full details.

```env
APP_TIMEZONE=Asia/Dubai          # NOT UTC — Dubai is GMT+4
SESSION_ENCRYPT=true             # Encrypt session data at rest
MAIL_MAILER=smtp                 # NOT "log" — must send real emails
MAIL_HOST=smtpout.secureserver.net
MAIL_PORT=465
MAIL_FROM_ADDRESS=booking@medzivahealthcare.com   # NO quotes around the address
ENBDPAY_MOCK=false               # Set to false in production for real payments
ENBDPAY_REDIRECT_URL=https://medzivahealthcare.com/payment/return
ENBDPAY_WEBHOOK_URL=https://medzivahealthcare.com/api/payments/enbd/webhook
# NOT: /api/enbdpay/webhook (wrong path)
```

### Cron Jobs (must be running)

```
* * * * * cd /path/to/med21-laravel && php artisan schedule:run >> /dev/null 2>&1
```

This enables:
- `bookings:cancel-expired` — cancels unaccepted bookings (5min)
- `bookings:send-reminders` — 24h WhatsApp/email reminders (hourly)
- `CaptureExpiredAuthorizations` — payment auth cleanup (hourly)

### Post-Deploy Checklist

- [ ] Run `php artisan migrate --force`
- [ ] Run `php artisan config:cache`
- [ ] Run `php artisan route:cache`
- [ ] Run `php artisan key:generate` (first time only)
- [ ] Verify ENBDPAY_WEBHOOK_URL path is correct (/api/payments/enbd/webhook)
- [ ] Verify MAIL_MAILER=smtp (not "log")
- [ ] Verify APP_TIMEZONE=Asia/Dubai
- If not, initialize git (see First-Time Server Setup)
