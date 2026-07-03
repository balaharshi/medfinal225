<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\ChangePasswordRequest;
use App\Http\Requests\LoginRequest;
use App\Http\Requests\ProfileRequest;
use App\Http\Requests\RegisterRequest;
use App\Services\AuthService;
use App\Services\OAuthIdentityService;
use App\Services\PusherService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

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
        $session = $this->authService->oauthAdmin($this->oauthPayload($request, 'google'));

        return $this->withAccessCookie(response()->json(['success' => true, ...$session]), $session['accessToken']);
    }

    public function oauthVendor(Request $request): JsonResponse
    {
        $session = $this->authService->oauthVendor($this->oauthPayload($request, 'google'));

        return $this->withAccessCookie(response()->json(['success' => true, ...$session]), $session['accessToken']);
    }

    public function vendorLogin(LoginRequest $request): JsonResponse
    {
        $session = $this->authService->vendorLogin($request->validated());

        return $this->withAccessCookie(response()->json($session), $session['accessToken']);
    }

    public function logout(): JsonResponse
    {
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
