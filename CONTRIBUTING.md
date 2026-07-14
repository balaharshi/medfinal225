# Contributing to MedZiva

> **This file is mandatory reading for anyone working on this project — including AI coding assistants (OpenCode, Cursor, Copilot, etc.).**

---

## Project Overview

MedZiva is a healthcare services marketplace. Customers book medical services; vendors accept and fulfill bookings.

**Tech Stack:**
- Frontend: React + TypeScript + Vite + Tailwind CSS
- Backend: Laravel 11 (PHP 8.2) + MySQL
- Hosting: GoDaddy shared hosting (both frontend and backend)
- Auth: Google OAuth + email/password via Laravel Sanctum
- Payments: ENBDpay (UAE payment gateway)

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    GoDaddy Shared Hosting                    │
│                                                             │
│  medzivahealthcare.com (production)                         │
│  ├── /public_html/medzivahealthcare.com/  → React build    │
│  └── /public_html/api.medzivahealthcare.com/ → Laravel     │
│                                                             │
│  staging.medzivahealthcare.com (test)                      │
│  ├── /public_html/staging.medzivahealthcare.com/ → React   │
│  └── /staging/api/                     → Laravel           │
│                                                             │
│  Databases: medziva (prod), medziva_staging (test)         │
└─────────────────────────────────────────────────────────────┘
```

---

## RULES — READ BEFORE DOING ANYTHING

### Rule 1: Branching Strategy

```
main          → PRODUCTION code (live website)
develop       → STAGING code (test website)
feature/*     → Individual features (branch off develop)
fix/*         → Bug fixes (branch off develop)
```

**NEVER push directly to `main`.** All changes go through `develop` first.

### Rule 2: Deployment Flow

```
feature/xyz  →  develop  →  main
   ↓               ↓          ↓
 you work     test here    go live
```

1. Branch off `develop`
2. Make changes
3. Commit to your branch
4. Merge into `develop`
5. Deploy to staging → test
6. When confirmed working, merge `develop` into `main`
7. Deploy to production

### Rule 3: Environment Files

| File | Location | In Git? | Purpose |
|------|----------|---------|---------|
| `.env.staging` | Both med21/ and med21-laravel/ | YES | Template with placeholder values |
| `.env.production` | Both med21/ and med21-laravel/ | YES | Template with placeholder values |
| `.env` | Both med21/ and med21-laravel/ | NO | Real secrets (on server only) |

**NEVER commit `.env` files to git.** They contain database passwords and API keys.

### Rule 4: Code Standards

- **Language:** American English spelling (e.g., "Color" not "Colour")
- **Formatting:** Use Prettier (config in `med21/.prettierrc`)
- **Linting:** Fix all ESLint errors before committing
- **API calls:** Use the centralized client at `src/lib/api.ts` — never raw `fetch()`
- **Images:** Always use `<SafeImage>` component — never raw `<img>` tags. Pass `fallbackSrc` for a secondary URL to try on error.
- **Vendors:** Never hardcode vendor names — they come from the database
- **Image filenames:** Use lowercase slugs only — no spaces, no mixed case
- **No hardcoded values:** Use environment variables for URLs, API keys, etc.
- **No console.log in production:** Use `console.warn` or `console.error` only
- **No comments:** Unless explicitly asked for

### Rule 5: Before Committing

```bash
# Always run these before committing frontend changes:
cd med21
npm run lint          # Fix any ESLint errors
npm run format        # Format code with Prettier
npm run typecheck     # Verify TypeScript compiles
npm run build         # Verify build succeeds
```

**Commit message format:** `type: short description` (e.g., `feat: add rental duration toggle`, `fix: booking date not saving`, `refactor: extract booking modal`). Types: `feat`, `fix`, `refactor`, `style`, `docs`, `chore`.

### Rule 6: After Backend Changes

```bash
# After modifying migrations, seeders, or image paths:
php artisan images:verify
```

---

## File Structure

```
medfinal225/
├── med21/                          # React frontend
│   ├── src/
│   │   ├── App.tsx                 # Layout, routing, shared modals (778 lines)
│   │   ├── components/             # UI components + page-level pages
│   │   ├── hooks/
│   │   │   └── useAppState.ts      # Shared state, handlers, computed data
│   │   ├── lib/
│   │   │   └── api.ts             # Centralized API client
│   │   ├── services/               # Feature-specific API calls
│   │   ├── content/                # Legal/FAQ content
│   │   └── types.ts               # TypeScript types
│   ├── public/                     # Static assets (images)
│   ├── .env                        # Frontend secrets (git-ignored)
│   ├── .env.staging               # Staging template
│   ├── .env.production            # Production template
│   ├── eslint.config.js           # Linting rules
│   ├── .prettierrc                # Formatting rules
│   └── package.json               # Dependencies
│
├── med21-laravel/                  # Laravel backend
│   ├── app/
│   │   ├── Http/Controllers/Api/   # API endpoints
│   │   ├── Models/                 # Database models
│   │   └── Services/               # Business logic
│   ├── database/
│   │   ├── migrations/             # Database schema
│   │   └── seeders/               # Default data
│   ├── routes/
│   │   └── api.php                # All API routes
│   ├── .env                        # Backend secrets (git-ignored)
│   ├── .env.staging               # Staging template
│   ├── .env.production            # Production template
│   └── composer.json               # PHP dependencies
│
├── deploy.sh                       # Deployment script
├── CONTRIBUTING.md                 # This file — single source of truth
└── .github/workflows/build.yml    # CI/CD (auto-build on push)
```

---

## Server Details

| Item | Value |
|------|-------|
| Server IP | 92.204.28.237 |
| SSH User | rvdkqh1z30zk |
| Staging URL | https://staging.medzivahealthcare.com |
| Production URL | https://medzivahealthcare.com |
| Node.js | v20.20.2 (installed via nvm) |

## Folder Structure on Server

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

## Deployment

### Frontend (React/Vite) — Manual via cPanel

**⚠️ GoDaddy shared hosting cannot run Vite builds.** Build locally and upload.

```bash
# 1. Build locally
cd med21
npm run build

# 2. Create zip
cd ..
zip -r staging-frontend.zip med21/dist/*

# 3. Upload via cPanel File Manager
#    - Navigate to target folder:
#      Staging: /home/rvdkqh1z30zk/public_html/staging.medzivahealthcare.com/
#      Production: /home/rvdkqh1z30zk/public_html/medzivahealthcare.com/
#    - Delete old files (keep .well-known and .htaccess)
#    - Upload zip → Extract → Delete zip
```

### Backend (Laravel) — Manual via SSH

```bash
# Staging
ssh rvdkqh1z30zk@92.204.28.237
cd /home/rvdkqh1z30zk/staging/api/med21-laravel
git pull
composer install --no-dev --optimize-autoloader
php artisan migrate --force
php artisan config:cache
php artisan route:cache
php artisan view:cache

# Production
ssh rvdkqh1z30zk@92.204.28.237
cd /home/rvdkqh1z30zk/public_html/api.medzivahealthcare.com
git pull
composer install --no-dev --optimize-autoloader
php artisan migrate --force
php artisan config:cache
php artisan route:cache
php artisan view:cache
```

### Scripted Deploy (automated)

```bash
./deploy.sh staging    # Deploys develop branch to staging
./deploy.sh production # Deploys main branch to production
```

The script: builds frontend, runs `composer install`, rsyncs everything to server, and runs post-deploy commands (migrate, cache).

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
git checkout develop
git reset --hard origin/develop

# Staging frontend
cd /home/rvdkqh1z30zk/public_html/staging.medzivahealthcare.com
git init
git remote add origin https://github.com/balaharshi/medfinal225.git
git fetch origin
git checkout develop
git reset --hard origin/develop
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

---

### Frontend (.env)

```
VITE_API_BASE_URL=https://staging.medzivahealthcare.com/api  (or your local backend URL)
VITE_GOOGLE_CLIENT_ID=your-google-oauth-client-id
VITE_PUSHER_KEY=f0c6b9b2061f5e146c3c
VITE_PUSHER_CLUSTER=ap2
VITE_PUSHER_CHANNEL=medziva-notifications-staging
```

---

## Development Workflow

### Setting Up Your Environment

```bash
# 1. Clone the repo
git clone https://github.com/balaharshi/medfinal225.git
cd medfinal225

# 2. Install frontend dependencies
cd med21
npm install

# 3. Set up your .env file
cp .env.staging .env
# Edit .env and set VITE_GOOGLE_CLIENT_ID

# 4. Start development server
npm run dev

# 5. In another terminal, set up backend
cd ../med21-laravel
composer install
cp .env.staging .env
# Edit .env with your local database credentials
php artisan key:generate
php artisan migrate
php artisan serve
```

### Making a Change

```bash
# 1. Create feature branch
git checkout develop
git checkout -b feature/your-feature-name

# 2. Make changes to code

# 3. Test locally
cd med21 && npm run dev

# 4. Verify code quality
npm run lint
npm run format
npm run typecheck
npm run build

# 5. Commit
git add .
git commit -m "feat: short description of change"

# 6. Push and deploy to staging
git push origin feature/your-feature-name
git checkout develop
git merge feature/your-feature-name
git push origin develop
./deploy.sh staging

# 7. Test on staging.medzivahealthcare.com

# 8. When confirmed, deploy to production
git checkout main
git merge develop
git push origin main
./deploy.sh production
```

---

## API Conventions

### Using the API Client

```typescript
import { api } from '@/lib/api';

// GET request
const categories = await api.get('/api/categories');

// POST request
const booking = await api.post('/api/bookings', {
  body: { serviceId: 1, date: '2025-01-15' }
});

// PATCH request
await api.patch('/api/service/123', {
  body: { active: true }
});

// DELETE request
await api.delete('/api/service/123');
```

The API client automatically:
- Adds `Authorization: Bearer <token>` header
- Includes `credentials: 'include'`
- Parses JSON responses
- Throws on non-2xx responses
- Clears stale tokens on 401 errors

### Error Handling

```typescript
import { api, ApiError } from '@/lib/api';

try {
  await api.post('/api/bookings', { body: data });
} catch (err) {
  const error = err as ApiError;
  if (error.status === 422) {
    // Validation error — error.errors contains field-specific messages
  }
  toast.error(error.message);
}
```

---

## Backend API Routes

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/auth/register` | No | Register new customer |
| POST | `/api/auth/login` | No | Login customer |
| POST | `/api/auth/logout` | Yes | Logout |
| GET | `/api/auth/session` | Yes | Get current user |
| POST | `/api/auth/forgot-password` | No | Request password reset |
| POST | `/api/auth/reset-password` | No | Reset password with code |
| POST | `/api/auth/google` | No | Google OAuth login |
| POST | `/api/vendorLogin` | No | Vendor login |
| GET | `/api/categories` | No | List categories |
| GET | `/api/products` | No | List products |
| GET | `/api/services` | No | List services |
| GET | `/api/services/all` | No | List all services |
| POST | `/api/bookings` | Yes | Create booking |
| GET | `/api/bookings` | Admin | List all bookings |
| GET | `/api/booking/:id` | Admin | Get booking detail |
| DELETE | `/api/booking/:id` | Admin | Delete booking |
| GET | `/api/my-bookings` | Yes | Get customer's bookings |
| DELETE | `/api/my-bookings/:id` | Yes | Cancel customer's booking |
| GET | `/api/vendors` | Admin | List vendors |
| POST | `/api/vendors` | Admin | Create vendor |
| PATCH | `/api/vendor/:id` | Admin | Update vendor |
| DELETE | `/api/vendors/:id` | Admin | Delete vendor |
| GET | `/api/vendorBookings/:vendorId` | Vendor | Get vendor's bookings |
| POST | `/api/vendorBookings/:vendorId/:id/accept` | Vendor | Accept booking |
| PATCH | `/api/vendorBookings/:vendorId/:id/status` | Vendor | Update booking status |
| GET | `/api/vendorServices/:vendorId` | Vendor | Get vendor's services |
| POST | `/api/promos/validate` | No | Validate promo code |
| POST | `/api/payments/enbd/create` | Yes | Create payment |
| GET | `/api/payments/enbd/status` | Yes | Check payment status |

---

## Security Rules

1. **Never hardcode secrets** in source code. Use environment variables.
2. **Never commit `.env` files.** They're git-ignored for a reason.
3. **Never share database passwords, API keys, or tokens** in chat, email, or screenshots.
4. **Never add demo/admin credentials** to the codebase.
5. **Always validate user input** on the backend (Laravel Form Requests).
6. **Always use HTTPS** in production.
7. **Never disable CSRF protection** in production.
8. **Never set `APP_DEBUG=true`** in production.

---

## Troubleshooting

| Issue | Fix |
|-------|-----|
| Frontend can't reach API | Check `VITE_API_BASE_URL` in `.env` matches backend URL |
| CORS errors | Add domain to `SANCTUM_STATEFUL_DOMAINS` in Laravel `.env` |
| Google Sign-In fails | Check `GOOGLE_CLIENT_ID` matches the domain in Google Cloud Console |
| Build fails locally | Delete `node_modules` and `package-lock.json`, run `npm install` |
| Build fails on server | **Expected** — GoDaddy can't run Vite. Build locally and upload zip via cPanel |
| Laravel returns HTML | Document root must point to `public/` folder, not project root |
| Migration errors | Run `php artisan migrate:fresh --seed` on staging (never on production!) |
| Changes not appearing on site | Rebuild frontend, upload dist, run `php artisan config:cache` on backend, hard refresh (Cmd+Shift+R) |
| Git pull fails on server | Check `.git` folder exists: `ls -la /path/to/folder/.git`. If missing, re-init (see First-Time Server Setup) |

---

## AI Assistant Instructions

If you are an AI coding assistant (OpenCode, Cursor, Copilot, etc.) working on this project:

1. **Read this file — it is the single source of truth**
2. **Always use `src/lib/api.ts`** for API calls — never use raw `fetch()`
4. **Never modify `.env` files** — only `.env.staging` and `.env.production` templates
5. **Run `npm run lint`, `npm run format`, `npm run typecheck`, `npm run build`** after changes
6. **Never add comments** unless explicitly asked
7. **Never add demo credentials** to the codebase
8. **Always use American English spelling**
9. **Never commit secrets** (passwords, API keys, tokens)
10. **Never push to `main`** — always use the feature branch → develop → main flow

---

## OpenCode Prompt

Copy and paste this into OpenCode when starting work on this project:

```
I am working on the MedZiva healthcare website.

PROJECT STRUCTURE:
- med21/ = React frontend (Vite + TypeScript + Tailwind)
- med21-laravel/ = Laravel backend (PHP + MySQL)
- Both hosted on GoDaddy shared hosting

RULES:
1. Always use src/lib/api.ts for API calls (never raw fetch)
2. Run npm run lint, npm run format, npm run typecheck, npm run build after changes
3. Never modify .env files (only .env.staging and .env.production templates)
4. Never add comments unless asked
5. Never add demo credentials
6. Use American English spelling (Color not Colour)
7. Never commit secrets

BRANCHING:
- main = production (live site)
- develop = staging (test site)
- feature/* = individual features (branch off develop)

DEPLOYMENT:
- ./deploy.sh staging = deploy to test site
- ./deploy.sh production = deploy to live site
- Always test on staging before production

Read CONTRIBUTING.md for full details.
```
