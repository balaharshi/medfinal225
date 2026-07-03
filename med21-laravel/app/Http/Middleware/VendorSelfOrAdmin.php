<?php

namespace App\Http\Middleware;

use App\Constants\AppConstants;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class VendorSelfOrAdmin
{
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();
        $adminRoles = [AppConstants::USER_ROLES['SUPER_ADMIN'], AppConstants::USER_ROLES['ADMIN']];

        if (! $user) {
            return response()->json(['message' => 'Authentication token is required'], 401);
        }

        if (in_array($user->role, $adminRoles, true) || ($user->role === AppConstants::USER_ROLES['VENDOR'] && (string) $user->vendor_id === (string) $request->route('vendorId'))) {
            return $next($request);
        }

        return response()->json(['message' => 'You do not have permission to access this resource'], 403);
    }
}
