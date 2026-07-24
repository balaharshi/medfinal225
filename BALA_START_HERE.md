# Bala — Start Here

Welcome to the MedZiva project. This file is the first thing you (or any AI assistant) should read before touching the code.

---

## What is MedZiva?

MedZiva is a healthcare services marketplace. Customers book medical services (nursing care, IV therapy, lab tests, doctor visits, physiotherapy, etc.) and vendors fulfill those bookings.

---

## Project Layout

```
medfinal225/
├── med21/                  # React frontend (Vite + TypeScript + Tailwind)
│   ├── src/
│   │   ├── components/     # React components
│   │   ├── lib/api.ts      # Centralized API client — USE THIS for all API calls
│   │   ├── App.tsx         # Main app (being refactored into pages)
│   │   └── ...
│   ├── public/images/      # Static images (services, products, lab-tests)
│   └── package.json
│
├── med21-laravel/          # Laravel backend (PHP 8.2 + MySQL)
│   ├── app/
│   │   ├── Console/Commands/  # Artisan commands, including image:* helpers
│   │   ├── Http/Controllers/  # API controllers
│   │   ├── Models/            # Eloquent models
│   │   └── Services/          # Business logic (BookingService, CatalogManagementService, VendorService, etc.)
│   ├── database/seeders/     # Default data
│   ├── database/migrations/  # Schema
│   ├── config/medziva.php    # Frontend public path config
│   └── routes/api.php        # All API routes
│
├── deploy.sh                 # One-command deploy script
├── DEPLOYMENT.md             # Deployment instructions
├── CONTRIBUTING.md           # Full contribution rules
├── BALA_DEBRIEF_AND_TESTING_GUIDE.md  # What was fixed + how to test
├── AUDIT_REPORT.md           # Full audit findings and roadmap
└── OPENCODE_PROMPT.md        # Copy/paste prompt for OpenCode
```

---

## Quick Start (Local Development)

```bash
# 1. Clone
git clone https://github.com/balaharshi/medfinal225.git
cd medfinal225

# 2. Frontend
cd med21
npm install
cp .env.staging .env
npm run dev

# 3. Backend (new terminal)
cd ../med21-laravel
composer install
cp .env.staging .env
# Edit .env with your local DB credentials
php artisan key:generate
php artisan migrate:fresh --seed
php artisan serve
```

Open http://localhost:3000.

---

## The Most Important Rules

1. **Branch from `develop`, never `main`.**  
   `main` is production. `develop` is staging.

2. **Use `src/lib/api.ts` for every API call.**  
   No raw `fetch()`.

3. **Never edit `.env` files in version control.**  
   Only edit `.env.staging` and `.env.production` templates.

4. **Run checks after frontend changes:**  
   ```bash
   npm run lint
   npm run format
   npm run typecheck
   npm run build
   ```

5. **Image handling:**  
   - No spaces or mixed case in filenames.  
   - Use `SafeImage` component, never raw `<img>`.  
   - After image/seeder changes, run `php artisan images:verify`.  
   See [Image Handling](#image-handling) below for details.

6. **No hardcoded credentials or secrets.**  
   Ever.

7. **American English spelling.**  
   "Color", "Center", "Optimize".

---

## Image Handling

Images are a frequent source of bugs. Follow this strictly:

### Naming

```
Good:  generic-nurse-visit.jpg
Bad:   Generic Nurse Visit.jpg
Bad:   GenericNurseVisit.jpg
Bad:   generic nurse visit.jpg
```

Rules: lowercase, hyphen-separated, no spaces, no special characters except hyphens, `.jpg`/`.png`/`.webp` extension.

### Where Images Live

| Type | Folder |
|------|--------|
| Services / IV therapy | `med21/public/images/services/` |
| Products / rental equipment | `med21/public/images/products/` |
| Lab tests | `med21/public/images/lab-tests/` |

### How to Use Images in React

```tsx
import { SafeImage } from '@/components/SafeImage';

<SafeImage
  src={service.image}
  alt={service.title}
  className="h-48 w-full object-cover rounded-lg"
/>
```

`SafeImage` hides broken/missing images cleanly. Do not add fallback placeholders without discussing it first.

### Verification Commands

Run these after changing images or seeders:

```bash
cd med21-laravel
php artisan images:verify       # Check every DB path exists on disk
php artisan images:canonicalize # Rename files to slug form and update DB
php artisan images:repair-missing # Map known bad paths to canonical files
```

---

## Testing Before Deploy

1. Run all frontend checks (lint, format, typecheck, build).
2. Run `php artisan images:verify`.
3. Test on staging first: `./deploy.sh staging`.
4. Only then deploy to production: `./deploy.sh production`.

See `BALA_DEBRIEF_AND_TESTING_GUIDE.md` for detailed test scenarios.

---

## When to Read Other Files

| Want to... | Read |
|------------|------|
| Deploy | `DEPLOYMENT.md` |
| Contribute / code-review rules | `CONTRIBUTING.md` |
| Understand what was recently fixed | `BALA_DEBRIEF_AND_TESTING_GUIDE.md` |
| See all known issues and roadmap | `AUDIT_REPORT.md` |
| Copy a prompt into OpenCode | `OPENCODE_PROMPT.md` |

---

## Need Help?

If you are an AI assistant and unsure what to do, stop and ask the user for clarification. Do not guess, and do not make large architectural changes without approval.
