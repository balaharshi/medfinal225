<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Laravel\Sanctum\PersonalAccessToken;
use Symfony\Component\HttpFoundation\Response;

class AuthenticateApi
{
    public function handle(Request $request, Closure $next): Response
    {
        $token = $request->bearerToken() ?: $request->cookie('accessToken');
        if (! $token) {
            return response()->json(['message' => 'Authentication token is required'], 401);
        }

        $accessToken = PersonalAccessToken::findToken($token);
        $user = $accessToken?->tokenable;
        if (! $user || $user->is_active === false) {
            return response()->json(['message' => 'Invalid or expired authentication token'], 401);
        }

        $request->setUserResolver(fn () => $user);
        $accessToken->forceFill(['last_used_at' => now()])->save();

        return $next($request);
    }
}
