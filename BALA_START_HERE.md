# BALA — START HERE

> **Read this file first. Everything you need is in here.**

---

## What You Are Looking At

This is a **healthcare website** (MedZiva) with TWO parts:

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│   PART 1: FRONTEND          PART 2: BACKEND                │
│   (What users see)          (The brain)                     │
│                                                             │
│   Folder: med21/            Folder: med21-laravel/          │
│   Technology: React         Technology: Laravel (PHP)       │
│   Built with: npm           Built with: composer            │
│                                                             │
│   Users click buttons  →    Backend processes everything    │
│                             (logins, bookings, payments)    │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**Both live on GoDaddy.** Same hosting account. Zero extra cost.

---

## Server Details

| Item | Value |
|------|-------|
| Server IP | 92.204.28.237 |
| SSH User | rvdkqh1z30zk |
| Staging URL | https://staging.medzivahealthcare.com |
| Production URL | https://medzivahealthcare.com |
| Node.js | v20.20.2 (installed via nvm) |

---

## Where Things Live

```
Server (92.204.28.237)
│
├── /home/rvdkqh1z30zk/
│   ├── public_html/
│   │   ├── medzivahealthcare.com/        ← PRODUCTION frontend
│   │   ├── staging.medzivahealthcare.com/ ← STAGING frontend
│   │   └── api.medzivahealthcare.com/     ← PRODUCTION Laravel backend
│   │
│   └── staging/
│       └── api/                           ← STAGING Laravel backend
│
└── Databases
    ├── medziva                            ← Production database
    └── medziva_staging                    ← Staging database
```

---

## How To Deploy — STAGING

**⚠️ IMPORTANT: Frontend must be built locally and uploaded. Server can't run Vite builds.**

### Step 1: Ask Varun to build the frontend

Varun builds it locally and puts a zip in the GitHub repo. You download it.

### Step 2: Deploy Frontend

```bash
# SSH into server
ssh rvdkqh1z30zk@92.204.28.237

# Go to staging frontend folder
cd /home/rvdkqh1z30zk/public_html/staging.medzivahealthcare.com

# Download the zip from GitHub
wget https://github.com/balaharshi/medfinal225/raw/main/med21/staging-frontend.zip

# Clear old files
rm -rf assets Archive.zip __MACOSX b1.png b23.png b23.png.bak hero-banner.png log.png newbane.png newlogo sounds med21 med21-laravel .git index.html

# Extract
unzip staging-frontend.zip

# Clean up
rm staging-frontend.zip
```

### Step 3: Deploy Backend

```bash
cd /home/rvdkqh1z30zk/staging/api
git pull
php artisan migrate --force
php artisan config:cache
php artisan route:cache
```

### Step 4: Verify

Open: https://staging.medzivahealthcare.com
Check everything works.

---

## How To Deploy — PRODUCTION

**⚠️ Only deploy after Varun says it's OK.**

### Step 1: Deploy Frontend

Same as staging but target folder is:
```bash
cd /home/rvdkqh1z30zk/public_html/medzivahealthcare.com
```

### Step 2: Deploy Backend

```bash
cd /home/rvdkqh1z30zk/public_html/api.medzivahealthcare.com
git pull
php artisan migrate --force
php artisan config:cache
php artisan route:cache
```

---

## Quick Reference — Full Deploy Command

**Copy and paste this entire block for staging deploy:**

```bash
ssh rvdkqh1z30zk@92.204.28.237 "cd /home/rvdkqh1z30zk/staging/api && git pull && php artisan migrate --force && php artisan config:cache && php artisan route:cache"
```

---

## Common Issues

| Problem | Solution |
|---------|----------|
| `npm run build` fails on server | Expected! Server can't run Vite. Build locally and upload. |
| `git pull` fails | Check if .git folder exists. If not, init git (see DEPLOYMENT.md) |
| `php artisan migrate` fails | Check database user has ALL PRIVILEGES in cPanel |
| Site shows old version | Hard refresh: Ctrl+Shift+R / Cmd+Shift+R |
| "Access denied" database error | Go to cPanel → MySQL Databases → Add User To Database → ALL PRIVILEGES |

---

## Files You Should NEVER Touch

```
❌  med21-laravel/.env          (secrets — database password, API keys)
❌  med21-laravel/.env.staging  (template)
❌  med21-laravel/.env.production (template)
```

**The .env files on the SERVER have the real passwords. The ones in git are templates only.**

---

## If Something Breaks

**On staging:** No worries. It's a test site. Fix it and redeploy.

**On production:**
1. Don't panic
2. Roll back: `git revert HEAD`
3. Redeploy

---

## When Varun Says "Deploy to Staging"

1. Ask Varun to build the frontend and push the zip to GitHub
2. Download the zip from GitHub
3. Upload to staging folder via cPanel or wget
4. Run backend deploy command
5. Test the site
6. Tell Varun it's done
