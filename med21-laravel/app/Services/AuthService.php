<?php

namespace App\Services;

use App\Constants\AppConstants;
use App\Models\User;
use App\Models\Vendor;
use App\Support\CaseKeys;
use App\Support\SequentialId;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Symfony\Component\HttpKernel\Exception\HttpException;

class AuthService
{
    public function register(array $payload): array
    {
        if (User::query()->where('email', $payload['email'])->exists()) {
            throw new HttpException(409, 'Email is already registered');
        }

        $user = User::query()->create([
            'id' => SequentialId::next(User::class, 'u'),
            'full_name' => $payload['fullName'],
            'email' => $payload['email'],
            'phone' => $payload['phone'] ?? null,
            'address' => $payload['address'] ?? null,
            'password_hash' => Hash::make($payload['password']),
            'role' => AppConstants::USER_ROLES['CUSTOMER'],
        ]);

        return $this->createSession($user);
    }

    public function login(array $payload): array
    {
        $user = User::query()
            ->when($payload['username'] ?? null, fn ($query, $username) => $query->where('username', $username)->orWhere('email', $username))
            ->when(! ($payload['username'] ?? null), fn ($query) => $query->where('email', $payload['email'] ?? ''))
            ->first();

        if (! $user || ! Hash::check($payload['password'], $user->password_hash)) {
            throw new HttpException(401, 'Invalid credentials');
        }

        return $this->createSession($user);
    }

    public function vendorLogin(array $payload): array
    {
        $vendor = Vendor::query()->where('email', $payload['email'] ?? '')->first();
        if (! $vendor || ! $vendor->password_hash || ! Hash::check($payload['password'], $vendor->password_hash)) {
            throw new HttpException(401, 'Invalid credentials');
        }

        $user = User::query()
            ->where('vendor_id', $vendor->id)
            ->where('role', AppConstants::USER_ROLES['VENDOR'])
            ->first();

        if (! $user) {
            throw new HttpException(404, 'Linked vendor account is missing');
        }

        $session = $this->createSession($user);

        return [
            'success' => true,
            'vendorId' => $vendor->id,
            'vendor' => CaseKeys::camelize($vendor),
            'accessToken' => $session['accessToken'],
            'user' => $session['user'],
        ];
    }

    public function oauthCustomer(array $payload): array
    {
        return $this->upsertOAuthUser($payload, AppConstants::USER_ROLES['CUSTOMER']);
    }

    public function oauthAdmin(array $payload): array
    {
        return $this->upsertOAuthUser($payload, AppConstants::USER_ROLES['ADMIN']);
    }

    public function oauthVendor(array $payload): array
    {
        $email = strtolower(trim((string) ($payload['email'] ?? '')));
        if ($email === '') {
            throw new HttpException(400, 'OAuth account email is required');
        }

        $name = $payload['fullName'] ?? Str::before($email, '@');
        $vendor = Vendor::query()->firstOrCreate(
            ['email' => $email],
            [
                'id' => SequentialId::next(Vendor::class, 'v'),
                'name' => $name,
                'type' => 'Healthcare Provider',
                'address' => 'Dubai',
            ],
        );

        $session = $this->upsertOAuthUser(['email' => $email, 'fullName' => $name], AppConstants::USER_ROLES['VENDOR'], $vendor->id);

        return [...$session, 'vendor' => CaseKeys::camelize($vendor)];
    }

    public function getSession(string $userId): array
    {
        $user = User::query()->findOrFail($userId);
        $session = ['user' => CaseKeys::camelize($user)];

        if ($user->role === AppConstants::USER_ROLES['VENDOR'] && $user->vendor_id) {
            $vendor = Vendor::query()->find($user->vendor_id);
            if ($vendor) {
                $session['vendor'] = CaseKeys::camelize($vendor);
            }
        }

        return $session;
    }

    public function getProfile(string $userId): array
    {
        return CaseKeys::camelize(User::query()->findOrFail($userId));
    }

    public function updateProfile(string $userId, array $payload): array
    {
        $user = User::query()->findOrFail($userId);
        $user->fill(CaseKeys::snakePayload(array_filter([
            'fullName' => $payload['fullName'] ?? null,
            'email' => $payload['email'] ?? null,
            'phone' => $payload['phone'] ?? null,
            'address' => $payload['address'] ?? null,
        ], fn ($value) => $value !== null)));
        $user->save();

        return CaseKeys::camelize($user);
    }

    public function changePassword(string $userId, string $currentPassword, string $newPassword): array
    {
        $user = User::query()->findOrFail($userId);
        if (! Hash::check($currentPassword, $user->password_hash)) {
            throw new HttpException(401, 'Current password is incorrect');
        }

        $user->forceFill(['password_hash' => Hash::make($newPassword)])->save();

        return ['success' => true];
    }

    private function upsertOAuthUser(array $payload, string $role, ?string $vendorId = null): array
    {
        $email = strtolower(trim((string) ($payload['email'] ?? '')));
        if ($email === '') {
            throw new HttpException(400, 'OAuth account email is required');
        }

        $user = User::query()->where('email', $email)->first();
        if ($user) {
            $user->forceFill([
                'full_name' => $user->full_name ?: ($payload['fullName'] ?? Str::before($email, '@')),
                'role' => $role,
                'vendor_id' => $vendorId,
            ])->save();

            return $this->createSession($user);
        }

        $user = User::query()->create([
            'id' => SequentialId::next(User::class, 'u'),
            'full_name' => $payload['fullName'] ?? Str::before($email, '@'),
            'email' => $email,
            'password_hash' => Hash::make((string) Str::uuid()),
            'role' => $role,
            'vendor_id' => $vendorId,
        ]);

        return $this->createSession($user);
    }

    private function createSession(User $user): array
    {
        $token = $user->createToken('api')->plainTextToken;

        return [
            'accessToken' => $token,
            'user' => CaseKeys::camelize($user),
        ];
    }
}
