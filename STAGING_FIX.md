# Staging Fix — API Routing

## Root Cause

Laravel is hosted behind Apache at the `/api/` subdirectory (via symlink). Apache resolves the symlink and sets `SCRIPT_NAME` to `/api/index.php`. Symfony then determines `baseUrl` as `/api/`, strips it from the request URI, and passes `pathInfo` as just `/health` to Laravel's router.

BUT the routes are registered with the `/api` prefix (e.g., `api/health`) because `withRouting(api: ...)` auto-prefixes them. The router tries to match `/health` against `api/health` → no match → 404.

**Fix:** Remove the `/api` prefix from route registration since Apache already serves the app from that subdirectory.

---

## Single File Change

### File: `med21-laravel/bootstrap/app.php`

Replace the entire file with this content:

```php
<?php

use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Support\Facades\Route;
use Symfony\Component\HttpKernel\Exception\HttpExceptionInterface;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
        then: function () {
            Route::middleware('api')->group(__DIR__.'/../routes/api.php');
        },
    )
    ->withMiddleware(function (Middleware $middleware): void {
        $middleware->alias([
            'api.auth' => \App\Http\Middleware\AuthenticateApi::class,
            'role' => \App\Http\Middleware\AuthorizeRole::class,
            'vendor.self_or_admin' => \App\Http\Middleware\VendorSelfOrAdmin::class,
        ]);
        $middleware->append(\App\Http\Middleware\SecurityHeaders::class);
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        $exceptions->render(function (Throwable $e, Illuminate\Http\Request $request) {
            if (! str_starts_with($request->getRequestUri(), '/api/')) {
                return null;
            }

            $status = $e instanceof HttpExceptionInterface ? $e->getStatusCode() : 500;

            $message = $status === 500 && app()->isProduction() ? 'Server error' : ($e->getMessage() ?: 'Server error');

            return response()->json([
                'error' => $message,
                'message' => $message,
            ], $status);
        });
    })->create();
```

---

## What Changed

1. **Removed `api: __DIR__.'/../routes/api.php'`** from `withRouting()` — this was auto-adding the `/api` prefix to all routes
2. **Added `then:` callback** — loads `api.php` routes with just the `api` middleware, WITHOUT the `/api` prefix
3. **Updated exception handler** — changed `$request->is('api/*')` to `str_starts_with($request->getRequestUri(), '/api/')` because the path no longer contains `api/` after the routing change

## Steps for Bala

1. **Pull latest code** from the repo (the local fix is already applied)
2. **Upload just this file** to the server:
   ```
   scp med21-laravel/bootstrap/app.php rvdkqh1z30zk@staging.medzivahealthcare.com:~/staging/api/med21-laravel/bootstrap/app.php
   ```
3. **SSH into the server and clear the route cache:**
   ```
   cd ~/staging/api/med21-laravel
   php artisan route:clear
   php artisan config:clear
   ```
4. **Verify the routes (prefix should be gone):**
   ```
   php artisan route:list | grep health
   ```
   Should show: `GET|HEAD health ... Api\HealthController` (NOT `api/health`)
5. **Test:**
   ```
   curl -s https://staging.medzivahealthcare.com/api/health
   ```
   Should return: `{"status":"ok","service":"medziva-backend"}`

---

## Why This Works

Before:
- Request URL: `https://staging.medzivahealthcare.com/api/health`
- Apache resolves via symlink, passes to Laravel
- Symfony sees path as: `/health` (strips `/api/` base)
- Route registered as: `api/health` → NO MATCH ❌

After:
- Request URL: `https://staging.medzivahealthcare.com/api/health`
- Apache resolves via symlink, passes to Laravel
- Symfony sees path as: `/health` (strips `/api/` base)
- Route registered as: `health` → MATCH ✅

## No Other Files Need Changing

- `med21/.htaccess` — already correct (skips `/api/` for SPA)
- `med21-laravel/public/.htaccess` — fine (standard Laravel rewrite)
- Frontend `api.ts` — already calls `/api/*` URLs, unchanged
- The `api` symlink on the server — already correct
