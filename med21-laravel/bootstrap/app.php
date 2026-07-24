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
            if ($request->expectsJson() || str_starts_with($request->getRequestUri() ?? '', '/api/')) {
                $status = $e instanceof HttpExceptionInterface ? $e->getStatusCode() : 500;
                $message = $status === 500 && app()->isProduction() ? 'Server error' : ($e->getMessage() ?: 'Server error');

                return response()->json([
                    'error' => $message,
                    'message' => $message,
                ], $status);
            }

            return null;
        });
    })->create();
