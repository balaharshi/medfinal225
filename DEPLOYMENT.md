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
│  Frontend: React (Vite) → built to dist/               │
│  Backend:  Laravel/PHP → API routes                    │
│  Database: MySQL (GoDaddy)                             │
└─────────────────────────────────────────────────────────┘
```

## Git Branching

| Branch | Purpose | Deploys To |
|--------|---------|------------|
| `main` | Production code | medzivahealthcare.com |
| `develop` | Staging/test code | staging.medzivahealthcare.com |
| `feature/*` | Individual features | Merges into `develop` |

## First-Time Setup (GoDaddy)

### 1. Create Staging Subdomain
1. Go to GoDaddy cPanel → **Subdomains**
2. Create: `staging.medzivahealthcare.com`
3. Document Root: `/staging`
4. This creates a separate directory from production

### 2. Create Staging Database
1. cPanel → **MySQL Databases**
2. Create database: `medziva_staging`
3. Create user, add to database with ALL PRIVILEGES
4. Note the database name, username, and password

### 3. Enable SSH Access
1. cPanel → **Security** → **SSH Access**
2. Enable it
3. Add your SSH public key (run `cat ~/.ssh/id_rsa.pub` on your Mac)
4. Note your SSH username (shown in cPanel)

### 4. Set Environment Variables
1. Upload `med21-laravel/.env.staging` as `med21-laravel/.env` in `/staging/api/`
2. Replace `YOUR_STAGING_DB_PASSWORD` with actual password
3. Generate APP_KEY: `php artisan key:generate` (via SSH)
4. Upload `med21/.env.staging` as `med21/.env` in `/staging/`
5. Set `VITE_GOOGLE_CLIENT_ID` to your staging Google OAuth client ID

### 5. Configure Deploy Script
Edit `deploy.sh` and replace:
- `YOUR_GODADDY_SSH_USER` with your actual SSH username

### 6. Secure Staging Site (HTTP Basic Auth)

**Why:** Anyone who types `staging.medzivahealthcare.com` can see it. Customers might find it, Google might index it, and test data could be exposed.

**How to set up (GoDaddy cPanel):**

1. Go to cPanel → **Security** → **Password Protect Directories**
2. Click **Web Root** (or navigate to `/staging`)
3. Click **Staging** folder (or create it if prompted)
4. Check **"Password protect this directory"**
5. Name it: `Staging - Authorized Access Only`
6. Click **Save**
7. Scroll down to **"Create User"**
8. Enter a username (e.g., `staging-admin`)
9. Enter a strong password (different from your production admin password)
10. Click **Add/Modify Authorized User**

**What happens:** When anyone visits staging.medzivahealthcare.com, a browser popup asks for username/password. They can't see anything until they enter it.

**Also add noindex to prevent Google from indexing staging:**

Create a file called `.htaccess` in `/staging/` with this content:

```apache
# Block search engines from indexing staging
<IfModule mod_headers.c>
    Header set X-Robots-Tag "noindex, nofollow"
</IfModule>

# Password protection (GoDaddy may add this automatically)
AuthType Basic
AuthName "Staging - Authorized Access Only"
AuthUserFile /home/YOUR_GODADDY_USERNAME/.htpasswd
Require valid-user
```

Replace `YOUR_GODADDY_USERNAME` with your actual GoDaddy username.

**Share credentials with Bala only. Never give staging password to customers.**

## Deployment Workflow

### Making Changes (Day-to-Day)

```bash
# 1. Create feature branch from develop
git checkout develop
git checkout -b feature/my-new-feature

# 2. Make changes, test locally
npm run dev          # Run frontend locally
cd ../med21-laravel && php artisan serve  # Run backend locally

# 3. Commit changes
git add .
git commit -m "feat: add new feature"
git push origin feature/my-new-feature

# 4. Merge into develop (staging)
git checkout develop
git merge feature/my-new-feature
git push origin develop

# 5. Deploy to staging
./deploy.sh staging

# 6. Test at staging.medzivahealthcare.com

# 7. When ready for production
git checkout main
git merge develop
git push origin main
./deploy.sh production
```

### Quick Deploy (No New Features)

```bash
# Just deploy current branch
./deploy.sh staging     # Test first
./deploy.sh production  # Then go live
```

## How the Deploy Script Works

The script (`deploy.sh`) does incremental deployment:

1. **Pulls latest code** from the current branch
2. **Builds frontend** with the correct environment variables
3. **Installs production dependencies** (no dev dependencies)
4. **Uploads only changed files** via rsync (not everything)
5. **Runs server commands** (migrate, cache, optimize)

### What Gets Uploaded

| Component | Source | Destination |
|-----------|--------|-------------|
| Frontend | `med21/dist/` | `/public_html/` (prod) or `/staging/` (staging) |
| Backend | `med21-laravel/` | `/public_html/api/` (prod) or `/staging/api/` (staging) |

### What's Excluded

- `.env` files (already on server)
- `node_modules/`
- `vendor/` (composer install runs on server)
- `.git/`

## Manual Deployment (Without SSH)

If SSH is not available, use FTP:

1. Build frontend locally:
   ```bash
   cd med21
   cp .env.production .env
   npm run build
   ```

2. Upload `med21/dist/*` to `/public_html/` via FTP
3. Upload `med21-laravel/*` to `/public_html/api/` via FTP
4. On server via cPanel Terminal:
   ```bash
   cd /public_html/api
   composer install --no-dev
   php artisan migrate --force
   php artisan config:cache
   php artisan route:cache
   ```

## Environment Variables

### Frontend (`med21/.env`)

| Variable | Staging | Production |
|----------|---------|------------|
| `VITE_API_BASE_URL` | `https://staging.medzivahealthcare.com` | `https://medzivahealthcare.com` |
| `VITE_GOOGLE_CLIENT_ID` | staging client ID | production client ID |

### Backend (`med21-laravel/.env`)

| Variable | Staging | Production |
|----------|---------|------------|
| `APP_ENV` | `staging` | `production` |
| `APP_DEBUG` | `true` | `false` |
| `APP_URL` | `https://staging.medzivahealthcare.com` | `https://medzivahealthcare.com` |
| `DB_DATABASE` | `medziva_staging` | `medziva` |
| `LOG_LEVEL` | `debug` | `error` |

## Troubleshooting

### Laravel returns HTML instead of JSON
- Check document root points to `public/` folder
- Verify `.htaccess` exists in `public_html/api/public/`
- Enable `mod_rewrite` in Apache

### CORS errors on staging
- Add `staging.medzivahealthcare.com` to `SANCTUM_STATEFUL_DOMAINS`
- Add to `CLIENT_ORIGIN` and `FRONTEND_URL`

### Google Sign-In doesn't work on staging
- Create a separate Google OAuth client for staging
- Add `staging.medzivahealthcare.com` to authorized origins in Google Cloud Console

### Build fails locally
- Delete `node_modules` and `package-lock.json`, run `npm install` again
- Make sure Node.js 18+ is installed
