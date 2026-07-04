<?php

namespace App\Services;

use Firebase\JWT\JWK;
use Firebase\JWT\JWT;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Symfony\Component\HttpKernel\Exception\HttpException;

class OAuthIdentityService
{
    public function verifyGoogle(array $payload): array
    {
        $token = $payload['credential'] ?? $payload['idToken'] ?? null;
        $clientId = config('services.google.client_id');
        if (! $token) {
            throw new HttpException(401, 'Google credential is required');
        }
        if (! $clientId) {
            throw new HttpException(503, 'Google login is not configured');
        }

        $response = Http::get('https://oauth2.googleapis.com/tokeninfo', ['id_token' => $token]);
        if (! $response->successful()) {
            throw new HttpException(401, 'Google login could not be verified');
        }

        $claims = $response->json();
        if (($claims['aud'] ?? null) !== $clientId || empty($claims['email']) || ($claims['email_verified'] ?? 'true') === 'false') {
            throw new HttpException(401, 'Google account email could not be verified');
        }

        return ['email' => $claims['email'], 'fullName' => $claims['name'] ?? trim(($claims['given_name'] ?? '').' '.($claims['family_name'] ?? ''))];
    }

    public function verifyApple(array $payload): array
    {
        $token = $payload['credential'] ?? $payload['idToken'] ?? null;
        $clientId = config('services.apple.client_id');
        if (! $token) {
            throw new HttpException(401, 'Apple credential is required');
        }
        if (! $clientId) {
            throw new HttpException(503, 'Apple login is not configured');
        }

        try {
            $keys = Cache::remember('apple_jwks', 3600, fn () => Http::get('https://appleid.apple.com/auth/keys')->throw()->json());
            $claims = (array) JWT::decode($token, JWK::parseKeySet($keys));
        } catch (\Throwable) {
            throw new HttpException(401, 'Apple login could not be verified');
        }

        $audience = $claims['aud'] ?? null;
        if ((is_array($audience) ? ! in_array($clientId, $audience, true) : $audience !== $clientId) || empty($claims['email'])) {
            throw new HttpException(401, 'Apple account email could not be verified');
        }

        $name = $payload['user']['name'] ?? null;

        return [
            'email' => $claims['email'],
            'fullName' => is_array($name) ? trim(($name['firstName'] ?? '').' '.($name['lastName'] ?? '')) : ($claims['email'] ? strtok($claims['email'], '@') : ''),
        ];
    }


}
