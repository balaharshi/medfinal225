<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\ChangePasswordRequest;
use App\Http\Requests\LoginRequest;
use App\Http\Requests\ProfileRequest;
use App\Http\Requests\RegisterRequest;
use App\Models\User;
use App\Services\AuthService;
use App\Services\OAuthIdentityService;
use App\Services\PusherService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class AuthController extends Controller
{
    public function __construct(
        private readonly AuthService $authService,
        private readonly PusherService $pusherService,
        private readonly OAuthIdentityService $oauthIdentityService,
    )
    {
    }

    public function register(RegisterRequest $request): JsonResponse
    {
        $session = $this->authService->register($request->validated());

        return $this->withAccessCookie(response()->json(['success' => true, ...$session], 201), $session['accessToken']);
    }

    public function login(LoginRequest $request): JsonResponse
    {
        $session = $this->authService->login($request->validated());
        $this->pusherService->triggerEvent('auth:login-success', ['message' => 'Welcome back, '.($session['user']['fullName'] ?? $session['user']['email']).'!', 'user' => ['id' => $session['user']['id'], 'fullName' => $session['user']['fullName'] ?? null, 'email' => $session['user']['email'] ?? null]]);

        return $this->withAccessCookie(response()->json(['success' => true, ...$session]), $session['accessToken']);
    }

    public function oauth(Request $request): JsonResponse
    {
        $session = $this->authService->oauthCustomer($this->oauthPayload($request, 'google'));

        return $this->withAccessCookie(response()->json(['success' => true, ...$session]), $session['accessToken']);
    }

    public function oauthAdmin(Request $request): JsonResponse
    {
        $payload = $this->oauthPayload($request, 'google');
        $email = strtolower(trim($payload['email'] ?? ''));
        $allowedEmails = array_map('trim', explode(',', strtolower(config('services.google.admin_emails', ''))));

        if ($email === '' || ! in_array($email, $allowedEmails, true)) {
            abort(403, 'This Google account is not authorized for admin access.');
        }

        $session = $this->authService->oauthAdmin($payload);

        return $this->withAccessCookie(response()->json(['success' => true, ...$session]), $session['accessToken']);
    }

    public function oauthVendor(Request $request): JsonResponse
    {
        $payload = $this->oauthPayload($request, 'google');
        $email = strtolower(trim($payload['email'] ?? ''));

        if ($email === '' || ! \App\Models\Vendor::query()->where('email', $email)->exists()) {
            abort(403, 'This Google account is not linked to any vendor. Please contact support.');
        }

        $session = $this->authService->oauthVendor($payload);

        return $this->withAccessCookie(response()->json(['success' => true, ...$session]), $session['accessToken']);
    }

    public function vendorLogin(LoginRequest $request): JsonResponse
    {
        $session = $this->authService->vendorLogin($request->validated());

        return $this->withAccessCookie(response()->json($session), $session['accessToken']);
    }

    public function logout(Request $request): JsonResponse
    {
        if ($request->user()) {
            $request->user()->currentAccessToken()->delete();
        }

        return response()->json(['success' => true])->withoutCookie('accessToken');
    }

    public function session(Request $request): JsonResponse
    {
        return response()->json(['success' => true, ...$this->authService->getSession($request->user()->id)]);
    }

    public function profile(Request $request): JsonResponse
    {
        return response()->json($this->authService->getProfile($request->user()->id));
    }

    public function updateProfile(ProfileRequest $request): JsonResponse
    {
        return response()->json($this->authService->updateProfile($request->user()->id, $request->validated()));
    }

    public function changePassword(ChangePasswordRequest $request): JsonResponse
    {
        return response()->json($this->authService->changePassword($request->user()->id, $request->validated('currentPassword'), $request->validated('newPassword')));
    }

    public function forgotPassword(Request $request): JsonResponse
    {
        $request->validate([
            'email' => 'required|email',
        ]);

        $email = strtolower(trim($request->input('email')));
        $user = User::query()->where('email', $email)->first();

        if ($user) {
            $code = Str::random(6);
            DB::table('password_reset_tokens')->updateOrInsert(
                ['email' => $email],
                [
                    'token' => Hash::make($code),
                    'created_at' => now(),
                ]
            );

            // In a real application, send the $code via email here.
            // For now we return it in the response for development/debugging.
        }

        return response()->json([
            'success' => true,
            'message' => 'If your email is registered, you\'ll receive a reset code.',
        ]);
    }

    public function resetPassword(Request $request): JsonResponse
    {
        $request->validate([
            'email' => 'required|email',
            'code' => 'required|string|size:6',
            'newPassword' => 'required|string|min:6',
        ]);

        $email = strtolower(trim($request->input('email')));
        $tokenRow = DB::table('password_reset_tokens')->where('email', $email)->first();

        if (! $tokenRow || ! Hash::check($request->input('code'), $tokenRow->token)) {
            return response()->json(['success' => false, 'error' => 'Invalid or expired reset code.'], 422);
        }

        $user = User::query()->where('email', $email)->first();
        if (! $user) {
            return response()->json(['success' => false, 'error' => 'User not found.'], 404);
        }

        $user->forceFill(['password_hash' => Hash::make($request->input('newPassword'))])->save();
        DB::table('password_reset_tokens')->where('email', $email)->delete();

        return response()->json(['success' => true, 'message' => 'Password has been reset successfully.']);
    }

    private function withAccessCookie(JsonResponse $response, string $token): JsonResponse
    {
        return $response->cookie('accessToken', $token, 60 * 24 * 7, '/', null, app()->isProduction(), true, false, 'lax');
    }

    public function apple(Request $request): JsonResponse
    {
        $session = $this->authService->oauthCustomer($this->oauthPayload($request, 'apple'));

        return $this->withAccessCookie(response()->json(['success' => true, ...$session]), $session['accessToken']);
    }

    private function oauthPayload(Request $request, string $provider): array
    {
        return $provider === 'apple'
            ? $this->oauthIdentityService->verifyApple($request->all())
            : $this->oauthIdentityService->verifyGoogle($request->all());
    }
}
