# MedZiva Platform Audit Report

> Generated: 2026-07-10  
> Scope: Full-stack audit of the MedZiva healthcare marketplace (React frontend + Laravel backend + GoDaddy infrastructure).

---

## 1. Executive Summary

This report records every significant issue discovered during the full-platform audit and the remediation work that followed.  
Some items are already fixed (noted in §6).  The remaining work is grouped by severity and component so the team can tackle it in priority order.

The user has requested that **Database and Frontend issues** be discussed before any further code changes begin.  Those sections are therefore presented as decision points rather than active work.

---

## 2. Audit Scope

| Area | What was reviewed |
|------|-------------------|
| Frontend (med21) | React components, image handling, API usage, build output, state management, routing |
| Backend (med21-laravel) | Models, migrations, seeders, controllers, services, routes, middleware, cron jobs, mailers |
| Database | Schema design, data integrity, image-path storage, seeder consistency |
| Infrastructure | GoDaddy hosting layout, deployment scripts, environment variables, cron setup |
| Security | Auth, payments, CORS, secrets, rate limiting, input validation |
| Process | Documentation, branching, code-review practices, AI-assistant onboarding |

---

## 3. Severity Legend

| Severity | Meaning |
|----------|---------|
| **P0 — Critical** | Live-impacting bug, security vulnerability, or data-integrity risk. Fix immediately. |
| **P1 — High** | Causes user-facing defects, blocks features, or creates significant tech debt. Fix next. |
| **P2 — Medium** | Quality-of-life or maintainability issue. Address in the next sprint. |
| **P3 — Low** | Nice-to-have polish or documentation improvement. |

---

## 4. Issues by Category

### 4.1 Database Issues

| ID | Severity | Issue | Description / Impact | Proposed Fix |
|----|----------|-------|----------------------|--------------|
| **DB-01** | **P0** | **Image paths stored as free text with no validation** | The `image` column on services/products is an unvalidated string. Any typo, moved file, or space in the filename breaks the UI silently. | Add a model-level validator or dedicated `ImagePath` value object that checks the file exists before save. Provide a Laravel cast or observer. |
| **DB-02** | **P0** | **Filenames contain spaces and mixed case** | Files such as `Generic Nurse Visit.jpg` were stored on disk with spaces. URLs encode these inconsistently and Linux production servers are case-sensitive, so paths that work on macOS break on GoDaddy. | Enforce a **slug naming convention** for every image: lowercase, hyphen-separated, no spaces, no special characters. Add a seeder helper that auto-slugs. |
| **DB-03** | **P1** | **Seeder and DB are the only sources of image truth** | There is no canonical registry of which image belongs to which service/product. Mappings live in individual seeders (`HomeHealthcareServicesSeeder`, `HomeHealthcareIVTherapySeeder`, etc.). | Create a single `ImageRegistry` class or config array that maps every service/product slug to its canonical image. Seeders and migrations both read from it. |
| **DB-04** | **P1** | **No database-level constraint for image existence** | Even after renaming files, nothing prevents a future code change from referencing a missing file until runtime. | Add a validation rule `image_path_exists` and run `php artisan images:verify` in CI. Fail the build on missing paths. |
| **DB-05** | **P1** | **Seeders use brittle title matching** | `resolveImage()` in `HomeHealthcareServicesSeeder` matches exact human-readable titles. Renaming a service silently breaks its image mapping. | Map images by stable slug or SKU, not by display title. Treat titles as translatable/changeable labels. |
| **DB-06** | **P1** | **`booking_notice` stored as descriptive text** | Values like `"12 hours prior booking"` are parsed at runtime into minutes. This is error-prone and unqueryable. | Add integer columns `lead_time_minutes` and `booking_notice_minutes`. Backfill from existing strings with a one-time migration. |
| **DB-07** | **P2** | **No composite index on bookings for duplicate detection** | `createBooking()` checks duplicates with `(customer_email, date, time_slot, service_id)` but no index exists. | Add migration: `Schema::table('bookings', fn ($t) => $t->index(['customer_email', 'date', 'time_slot', 'service_id']));` |
| **DB-08** | **P2** | **Vendor logos stored on local disk** | Vendor uploads use local storage, which complicates multi-server deployments and backups. | Move vendor logos/uploads to S3-compatible storage with a local fallback for dev. |
| **DB-09** | **P2** | **Inconsistent slug generation for services** | Some seeders manually slug titles while others rely on `Str::slug()`. Special characters and duplicate titles produce collisions. | Centralize slug/SKU generation in a dedicated helper that handles collisions (append `-2`, `-3`, etc.). |
| **DB-10** | **P3** | **No audit log on image-path changes** | When an admin updates a service image, there is no history of the old path. | Add a lightweight audit column `image_history` JSON or use a dedicated `activity_log` table for image changes. |

### 4.2 Frontend Issues

| ID | Severity | Issue | Description / Impact | Proposed Fix |
|----|----------|-------|----------------------|--------------|
| **FE-01** | **P0** | **No defensive image component** | Raw `<img>` tags fail with broken-link icons or empty boxes when the source is missing. This was visible across service cards, products, cart, and admin previews. | Use the new `SafeImage` component everywhere. It validates `onError` and hides itself cleanly when the path is invalid. |
| **FE-02** | **P0** | **Hardcoded image paths in components** | `PromotionalBanners.tsx` and other components contained literal paths such as `/images/services/something.jpg`. When the backend changes a filename, the frontend stays broken. | Remove all hardcoded image paths from components. Resolve images from API payload or a shared, versioned image registry. |
| **FE-03** | **P1** | **Fallback/default images mask broken paths** | The previous code showed a generic placeholder when an image failed, hiding the real problem from users and QA. | `SafeImage` intentionally does **not** show a fallback. Instead, surface the failure via Sentry/bugsnag and fix the source data. |
| **FE-04** | **P1** | **`App.tsx` is a 3000+ line monolith** | Routing, state, data fetching, and rendering are all in one file. It is hard to test, review, and extend. | Extract page-level components: `HomePage`, `ServicesPage`, `LabTestsPage`, `ProductsPage`, `WellnessPage`, `OffersPage`, `SupportPage`, `SearchResultsPage`. Each < 300 lines. |
| **FE-05** | **P1** | **57+ raw `fetch()` calls bypass `src/lib/api.ts`** | Token injection, 401 handling, and JSON parsing are duplicated inconsistently. | Replace every raw `fetch` with `api.get/post/patch/delete` from `src/lib/api.ts`. Add an ESLint rule to forbid raw `fetch` in `src/`. |
| **FE-06** | **P1** | **Auth tokens stored in `localStorage`** | Tokens are vulnerable to XSS. Any compromised script can exfiltrate them. | Move to `httpOnly` cookies with `SESSION_HTTP_ONLY=true`. Update `api.ts` to rely on cookie auth and stop reading/writing tokens from `localStorage`. |
| **FE-07** | **P2** | **No route-based code splitting** | Only `AdminDashboard` and `VendorDashboard` use `lazy()`. The initial bundle is larger than necessary. | Apply `React.lazy()` to all page-level components and add a `<Suspense>` boundary with a shared loading spinner. |
| **FE-08** | **P2** | **Custom hex colors instead of Tailwind tokens** | `hover:bg-[#0fd08f]`, `bg-[#10B981]` and similar one-off colors make theming and dark mode impossible. | Standardize on `bg-medical-green`, `bg-emerald-600`, and other named tokens in `tailwind.config.js`. Audit and replace all arbitrary hex values. |
| **FE-09** | **P2** | **Mobile touch targets below 44px** | Icon-only buttons in `CartDrawer` used `p-1`, which is below the recommended minimum touch size. | Ensure all icon-only buttons use at least `p-2` (≈ 36–44 px depending on icon size) and have `aria-label`. |
| **FE-10** | **P2** | **No centralized error boundary** | Runtime React errors crash the whole app. | Add an `ErrorBoundary` around the router that shows a user-friendly message and reports to Sentry/bugsnag. |
| **FE-11** | **P2** | **Image dimensions not enforced** | Large uploaded/vendor images can cause layout shift (CLS) and slow LCP. | Add `width`/`height` attributes or aspect-ratio wrappers. Run images through an optimizer or CDN. |
| **FE-12** | **P3** | **No automated visual regression for images** | Broken images are only caught by manual browsing. | Add a CI step that builds the frontend and runs `php artisan images:verify` against the seeded database. |

### 4.3 Backend Issues

| ID | Severity | Issue | Description / Impact | Proposed Fix |
|----|----------|-------|----------------------|--------------|
| **BE-01** | **P0** | **CatalogService is a 1500+ line god object** | It handles categories, products, services, vendors, bookings, enquiries, promos, settings, working hours, reports, SLA, change requests, and notifications. | Split into focused services: `BookingService`, `CatalogManagementService`, `VendorService`, `EnquiryService`, `ReportService`. Each < 500 lines. |
| **BE-02** | **P1** | **Payment mutation endpoints need continuous review** | Auth/capture/refund/void endpoints were previously unauthenticated. New endpoints must follow the same `$admin` middleware pattern. | Add a reusable route group `Route::middleware(['auth:sanctum', 'admin'])->group(...)` for all payment mutations. |
| **BE-03** | **P1** | **Pusher notification coupling** | `CatalogService` triggers Pusher directly, making it hard to test and swap channels. | Introduce a `Notifier` interface with `PusherNotifier` and `LogNotifier` implementations. Inject the notifier. |
| **BE-04** | **P2** | **No API versioning** | Routes are `/api/...` with no version. Future third-party integrations will be brittle. | Add `/api/v1/` prefix. Keep `/api/` as a redirect or alias during transition. |
| **BE-05** | **P2** | **Mail classes accept inconsistent key formats** | Some callers pass snake_case arrays, others camelCase. Mail classes currently check both. | Standardize on camelCase everywhere using `CaseKeys::camelize()` before passing data to mailers. |
| **BE-06** | **P2** | **WhatsApp webhook verification not documented in code** | New developers cannot see how Meta signature validation works without reading external docs. | Add a `WhatsAppWebhookController` with inline references to Meta's verification docs and a test command. |
| **BE-07** | **P3** | **No integration tests for booking flow** | Only 3 trivial tests exist. Regressions are caught manually. | Add PHPUnit tests for: create → pay → vendor accept → complete, cancellation + refund, reschedule, duplicate prevention. |

### 4.4 Infrastructure / DevOps Issues

| ID | Severity | Issue | Description / Impact | Proposed Fix |
|----|----------|-------|----------------------|--------------|
| **INF-01** | **P1** | **Frontend must be built locally and uploaded manually** | GoDaddy shared hosting cannot run Vite. Builds are zipped and extracted through cPanel, which is error-prone. | Document and script the process. Consider upgrading hosting or using a CI artifact pipeline that produces a ready-to-upload zip. |
| **INF-02** | **P1** | **No CI gate for image-path verification** | Missing images are only discovered after deploy. | Add a GitHub Actions step that runs `php artisan migrate:fresh --seed && php artisan images:verify` on every PR. |
| **INF-03** | **P2** | **Environment templates contain stale values** | `.env.staging` and `.env.production` must be kept in sync with every new config key (e.g. `FRONTEND_PUBLIC_PATH`). | Add a CI check that diffs required keys across `.env.example`, `.env.staging`, and `.env.production`. |
| **INF-04** | **P2** | **Cron setup is manual** | `bookings:cancel-expired`, `bookings:send-reminders`, and `payments:capture-expired` require `crontab -e` on the server. | Add a deploy script step that verifies the cron entry exists or documents it prominently in `DEPLOYMENT.md`. |
| **INF-05** | **P3** | **No CDN for static assets** | All images and built JS/CSS are served from GoDaddy directly, increasing latency. | Evaluate Cloudflare or an S3 + CloudFront setup for static assets. |

### 4.5 Security Issues

| ID | Severity | Issue | Description / Impact | Proposed Fix |
|----|----------|-------|----------------------|--------------|
| **SEC-01** | **P0** | **localStorage auth tokens (XSS risk)** | `localStorage` tokens can be stolen by any injected script. | Move to `httpOnly` cookies + Sanctum cookie auth. |
| **SEC-02** | **P0** | **Previously exposed payment mutation endpoints** | Even though now protected, the pattern should be enforced for any new payment route. | Add admin middleware group and code-review checklist item. |
| **SEC-03** | **P1** | **No rate limiting on newly added public endpoints** | Any new public endpoint added after the audit may forget `throttle:60,1`. | Create route groups with default throttling and require explicit overrides. |
| **SEC-04** | **P2** | **No CSP headers** | The frontend loads no Content-Security-Policy, increasing XSS impact. | Add CSP headers via `.htaccess` or Vite plugin. Start with `default-src 'self'` and expand as needed. |
| **SEC-05** | **P2** | **No dependency scanning** | Vulnerable npm/composer packages are not flagged automatically. | Add `npm audit` and `composer audit` to CI. |

### 4.6 Process / Code Quality Issues

| ID | Severity | Issue | Description / Impact | Proposed Fix |
|----|----------|-------|----------------------|--------------|
| **PROC-01** | **P1** | **Missing `BALA_START_HERE.md`** | `OPENCODE_PROMPT.md` and `CONTRIBUTING.md` both reference a file that does not exist. | Create `BALA_START_HERE.md` as the single onboarding doc or remove the references and point everything to `CONTRIBUTING.md`. |
| **PROC-02** | **P1** | **Documentation drift** | Recent image-handling changes (commands, `SafeImage`, `config/medziva.php`) are not documented for future contributors. | Update `CONTRIBUTING.md`, `OPENCODE_PROMPT.md`, and backend README with image conventions and commands. |
| **PROC-03** | **P2** | **No code-review checklist** | Security and image-path regressions slip through. | Add a PR template with items: "No raw fetch", "No hardcoded image paths", "`images:verify` passes", "No `.env` secrets committed". |
| **PROC-04** | **P2** | **AI assistants lack explicit image-handling rules** | OpenCode/Cursor/Copilot may reintroduce spaces in filenames or hardcoded paths. | Add a dedicated "Image Handling" section to `CONTRIBUTING.md` and `OPENCODE_PROMPT.md`. |
| **PROC-05** | **P3** | **Inconsistent commit message style** | Some commits use present tense, others past tense, making changelogs hard. | Adopt Conventional Commits (`feat:`, `fix:`, `refactor:`, `docs:`). |

---

## 5. Already Completed Fixes

The following items were resolved during the audit/remediation session that produced this report:

| ID | Fix |
|----|-----|
| **IMG-01** | Created `php artisan images:verify` to confirm every DB image path exists on disk. |
| **IMG-02** | Created `php artisan images:canonicalize` to rename files to URL-safe slugs and update the DB. |
| **IMG-03** | Created `php artisan images:repair-missing` to map known bad paths to canonical filenames. |
| **IMG-04** | Renamed all images to lowercase, hyphenated, no-space names. |
| **IMG-05** | Updated all seeders to produce canonical slug-based image paths. |
| **IMG-06** | Built `SafeImage` React component and replaced `<img>` in `App.tsx`, `ServicesSection.tsx`, `ProductsSection.tsx`, `CartDrawer.tsx`, `AdminDashboard.tsx`, `VendorDashboard.tsx`, `PromotionalBanners.tsx`. |
| **IMG-07** | Fixed hardcoded paths in `PromotionalBanners.tsx`. |
| **IMG-08** | Removed dead `handleServiceImageError` fallback logic and backup files. |
| **IMG-09** | Added `config/medziva.php` and `FRONTEND_PUBLIC_PATH` env variable. |
| **IMG-10** | Downloaded 3 missing CC0 images from Wikimedia Commons and resized them for web. |
| **IMG-11** | Verified 125 valid image paths with `php artisan images:verify`. |
| **BUILD-01** | `npm run typecheck` and `npm run build` pass cleanly. |

---

## 6. Proposed Roadmap

### Phase 1 — Database & Frontend stabilization (discuss before starting)
- Implement DB-01 through DB-06
- Implement FE-01 through FE-06
- Add CI gate for `images:verify`

### Phase 2 — Backend architecture cleanup
- Implement BE-01 (split CatalogService)
- Implement BE-02 and BE-03

### Phase 3 — Infrastructure hardening
- Implement INF-01 through INF-04
- Add CSP and dependency scanning

### Phase 4 — Tests & polish
- Add integration tests (BE-07)
- Visual regression / image checks (FE-12)
- CDN evaluation (INF-05)

---

## 7. Database & Frontend Issues — Discussion Points

The user has asked to discuss these before work begins.  Below are the specific decisions needed.

### 7.1 Database Decisions

1. **Image path validation layer**  
   Do you want a model observer, a custom cast, or a Form Request rule to enforce valid image paths on save?  
   *Recommendation: Laravel cast + observer so validation runs both on manual updates and admin panel edits.*

2. **Single image registry**  
   Should we create one source-of-truth file (e.g. `config/medziva-images.php` or `database/data/image-registry.json`) that maps every service/product slug to its image?  
   *Recommendation: Yes — seeders, migrations, and future admin imports should all read from it.*

3. **`booking_notice` migration**  
   Are you comfortable with a migration that renames/parses the existing text values and populates a new `lead_time_minutes` integer column?  
   *Recommendation: Yes, with a rollback script that restores the original strings.*

4. **Duplicate booking index**  
   The index `(customer_email, date, time_slot, service_id)` is straightforward. Should we add it now?  
   *Recommendation: Yes — low risk, improves the duplicate check.*

### 7.2 Frontend Decisions

1. **`SafeImage` rollout**  
   `SafeImage` is already in place in the main components. Do you want it enforced everywhere via ESLint/custom rule, or do we trust code review?  
   *Recommendation: Add an ESLint rule that warns on raw `<img>` in `src/components/`. It is already the de-facto pattern.*

2. **No-fallback policy**  
   `SafeImage` currently hides broken images entirely. Are you okay with this, or do you want a subtle "Image unavailable" text/badge for admin views?  
   *Recommendation: Keep no-fallback for customer-facing pages; add a small "missing image" badge only in admin dashboards so staff notice quickly.*

3. **`App.tsx` split**  
   This is the largest frontend refactor. Do you want it done in one PR or incrementally (extract one page at a time)?  
   *Recommendation: Incremental — one page per PR to keep reviews small and deploys safe.*

4. **Raw `fetch()` cleanup**  
   There are 57+ raw `fetch` calls. Should we convert all of them in one focused PR, or as we touch each feature?  
   *Recommendation: One focused PR. The change is mechanical and easy to review file-by-file.*

5. **Auth token migration to cookies**  
   This affects `api.ts`, login/logout flows, and Laravel Sanctum config. It also invalidates currently logged-in users on deploy. Do you want this done now or deferred to a dedicated security sprint?  
   *Recommendation: Deferred to a dedicated security PR so it can be tested end-to-end without blocking other fixes.*

---

## 8. Notes for Future OpenCode / AI Assistants

If you are an AI assistant reading this file, follow these rules when modifying images or seeders:

1. **Never use filenames with spaces or mixed case.**  
   Use `generic-nurse-visit.jpg`, not `Generic Nurse Visit.jpg`.

2. **Never hardcode image paths in React components.**  
   Resolve images from API data or `config/medziva.php`. If you must reference a static asset, use a constant exported from a registry file.

3. **Always use `SafeImage`** for any user-facing image.  
   Import: `import { SafeImage } from '@/components/SafeImage';`

4. **After changing any image or seeder, run:**  
   ```bash
   cd med21-laravel
   php artisan images:verify
   ```

5. **After any frontend change, run:**  
   ```bash
   cd med21
   npm run lint
   npm run format
   npm run typecheck
   npm run build
   ```

6. **Never commit real credentials, API keys, or `.env` files.**  
   Only edit `.env.staging` and `.env.production` templates.

7. **Always branch from `develop`, never `main`.**  
   Use `feature/description` or `fix/description` branch names.

8. **Before renaming image files, run `images:canonicalize` or update the DB manually.**  
   A renamed file with a stale DB path is a broken image in production.

---

*End of report.*
