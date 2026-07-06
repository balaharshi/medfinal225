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

## Where Things Live

```
GoDaddy Server
│
├── /public_html/              ← LIVE website (production)
│   ├── index.html             ← React frontend (built files)
│   ├── assets/                ← Images, CSS, JS bundles
│   └── api/                   ← Laravel backend
│       ├── public/            ← Laravel entry point
│       ├── app/               ← PHP code
│       └── .env               ← SECRETS (database password, API keys)
│
├── /staging/                  ← TEST website (staging)
│   ├── index.html             ← Same React frontend (copy)
│   ├── assets/
│   └── api/                   ← Same Laravel backend (copy)
│       └── .env               ← DIFFERENT secrets (staging database)
│
└── databases
    ├── medziva                ← Production database
    └── medziva_staging        ← Staging database (separate!)
```

**IMPORTANT:** Staging and production are completely separate. Testing on staging NEVER affects the live site.

---

## The Golden Rule

```
╔══════════════════════════════════════════════════════════════╗
║                                                              ║
║   ALWAYS test on STAGING first.                              ║
║   Only deploy to PRODUCTION when you are 100% sure.         ║
║                                                              ║
╚══════════════════════════════════════════════════════════════╝
```

---

## How To Deploy (Step by Step)

### First Time Setup (Do Once)

**Step 1: Enable SSH on GoDaddy**
```
1. Log in to GoDaddy → cPanel
2. Find "SSH Access" (under Security)
3. Turn it ON
4. Add your SSH public key:
   - On your Mac, open Terminal
   - Type: cat ~/.ssh/id_rsa.pub
   - Copy everything it shows
   - Paste into GoDaddy SSH page
5. Note your SSH username (GoDaddy shows it)
```

**Step 2: Create Staging Subdomain**
```
1. GoDaddy cPanel → Subdomains
2. Create new subdomain:
   - Name: staging
   - Domain: medzivahealthcare.com
   - Document Root: /staging
3. Click Create
```

**Step 3: Create Staging Database**
```
1. GoDaddy cPanel → MySQL Databases
2. Create new database: medziva_staging
3. Create new user (pick any name, strong password)
4. Add user to database → ALL PRIVILEGES
5. Write down: database name, username, password
```

**Step 4: Configure Deploy Script**
```
1. Open deploy.sh on your computer
2. Find this line:  REMOTE_USER="YOUR_GODADDY_SSH_USER"
3. Replace with your actual SSH username
4. Save the file
```

**Step 5: Set Up Server Environment**
```
1. SSH into GoDaddy:
   ssh YOUR_USERNAME@medzivahealthcare.com

2. Navigate to staging:
   cd /staging/api

3. Create .env file:
   cp .env.staging .env

4. Edit .env with your database credentials:
   nano .env
   (Replace YOUR_STAGING_DB_PASSWORD with actual password)

5. Generate encryption key:
   php artisan key:generate

6. Run database setup:
   php artisan migrate --force

7. Exit SSH:
   exit
```

### Every Time You Make a Change

**Option A: Using the deploy script (Recommended)**

```bash
# 1. Make sure you're on the right branch
git checkout develop

# 2. Make your changes
#    (edit files in med21/ or med21-laravel/)

# 3. Test locally
cd med21 && npm run dev

# 4. When happy, commit
git add .
git commit -m "describe what you changed"
git push origin develop

# 5. Deploy to staging
./deploy.sh staging

# 6. Test at staging.medzivahealthcare.com

# 7. When staging looks good, deploy to production
git checkout main
git merge develop
git push origin main
./deploy.sh production
```

**Option B: Manual upload (if SSH doesn't work)**

```bash
# 1. Build frontend
cd med21
cp .env.production .env
npm run build

# 2. Upload med21/dist/* to /public_html/ via FileZilla (FTP)
# 3. Upload med21-laravel/* to /public_html/api/ via FileZilla

# 4. On server (cPanel Terminal):
cd /public_html/api
composer install --no-dev
php artisan migrate --force
php artisan config:cache
php artisan route:cache
```

---

## Git Branches — What They Mean

```
main        = PRODUCTION  (what's on the live website)
develop     = STAGING     (what's being tested)
feature/*   = WORK IN PROGRESS (individual tasks)
```

**The flow:**
```
feature/xyz  →  develop  →  main
   ↓               ↓          ↓
 you work     test here    go live
```

**NEVER push directly to main. Always go through develop first.**

---

## Files You Should NEVER Touch

```
❌  med21-laravel/.env          (secrets — database password, API keys)
❌  med21-laravel/.env.staging  (template — has placeholder passwords)
❌  med21-laravel/.env.production (template — has placeholder passwords)
❌  med21/.env                  (Google Client ID)
❌  med21/.env.staging          (template)
❌  med21/.env.production       (template)
```

**The .env files on the SERVER have the real passwords. The ones in git are templates only.**

---

## What Each Folder Does

```
med21/                          ← React frontend
├── src/
│   ├── App.tsx                 ← Main app (big file, handles routing)
│   ├── components/             ← UI pieces (buttons, modals, dashboards)
│   ├── lib/
│   │   └── api.ts              ← API client (use this for fetch calls)
│   ├── services/               ← API calls for specific features
│   ├── data.ts                 ← Service/category data
│   └── types.ts                ← TypeScript definitions
├── public/                     ← Images (logo, hero banner)
├── .env                        ← Frontend secrets (Google Client ID)
└── package.json                ← Dependencies (npm install)

med21-laravel/                  ← Laravel backend
├── app/
│   ├── Http/Controllers/Api/   ← API endpoints (where requests go)
│   ├── Models/                 ← Database table definitions
│   └── Services/               ← Business logic
├── database/
│   ├── migrations/             ← Database structure
│   └── seeders/                ← Default data (promo codes, etc.)
├── routes/
│   └── api.php                 ← All API routes (maps URLs to controllers)
├── .env                        ← Backend secrets (DB password, API keys)
└── composer.json               ← Dependencies (composer install)
```

---

## Common Mistakes to Avoid

| Mistake | What Happens | How to Avoid |
|---------|--------------|--------------|
| Editing files on the server directly | Your changes get overwritten next deploy | Always edit locally, then deploy |
| Forgetting to run `npm run build` | Frontend changes don't appear | Run build before deploying |
| Pushing to main without testing | Live site breaks | Always test on staging first |
| Sharing .env files | Passwords leak | Never commit .env to git |
| Running `composer install` locally | Might install wrong PHP version | Run it on the server only |

---

## If Something Breaks

**On staging:** No worries. It's a test site. Fix it and redeploy.

**On production:** 
1. Don't panic
2. Roll back: `git revert HEAD` then `./deploy.sh production`
3. Or restore from GoDaddy backup (cPanel → Backups)

---

## Quick Reference Commands

```bash
# Deploy to staging
./deploy.sh staging

# Deploy to production
./deploy.sh production

# Build frontend only
cd med21 && npm run build

# Check git status
git status

# See what changed
git diff

# Undo changes
git checkout -- filename

# Go back to last commit
git reset --hard HEAD

# Create a new feature branch
git checkout develop
git checkout -b feature/your-feature-name

# Merge feature into staging
git checkout develop
git merge feature/your-feature-name

# Merge staging into production
git checkout main
git merge develop
```
