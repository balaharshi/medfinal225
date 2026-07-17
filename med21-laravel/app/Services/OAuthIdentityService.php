<?php

namespace App\Services;

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
        $audOk = ($claims['aud'] ?? null) === $clientId;
        $emailOk = !empty($claims['email']);
        $emailVerified = !isset($claims['email_verified']) || $claims['email_verified'] === true || $claims['email_verified'] === 'true';
        if (! $audOk || ! $emailOk || ! $emailVerified) {
            throw new HttpException(401, 'Google account email could not be verified');
        }

        return ['email' => $claims['email'], 'fullName' => $claims['name'] ?? trim(($claims['given_name'] ?? '').' '.($claims['family_name'] ?? ''))];
    }
}
