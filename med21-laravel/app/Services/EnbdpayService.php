<?php

namespace App\Services;

use App\Models\AuthTransaction;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use Symfony\Component\HttpKernel\Exception\HttpException;

class EnbdpayService
{
    private ?string $cachedToken = null;

    private int $tokenExpiresAt = 0;

    public function __construct(private readonly CatalogService $catalogService)
    {
    }

    public function createCheckoutTransaction(array $payload = []): array
    {
        $appUtr = $payload['appUtr'] ?? $this->buildAppUtr();
        $orderId = $payload['orderId'] ?? $this->buildOrderId();
        $bookingId = isset($payload['bookingId']) ? (string) $payload['bookingId'] : '';
        $paymentGroupId = isset($payload['paymentGroupId']) ? (string) $payload['paymentGroupId'] : '';
        $amount = $this->toMinorUnits($payload['amount'] ?? null);
        $redirectUrl = $this->appendReturnParams($this->redirectUrl(), compact('appUtr', 'orderId', 'bookingId', 'paymentGroupId'));

        if ((bool) config('services.enbdpay.mock', true)) {
            $mockReturnUrl = $this->appendReturnParams($redirectUrl, [
                'appUtr' => $appUtr,
                'orderId' => $orderId,
                'responseStatus' => 'CAPTURED',
                'mock' => 'true',
                'bookingId' => $bookingId,
                'paymentGroupId' => $paymentGroupId,
            ]);
            if ($bookingId !== '') {
                $this->catalogService->updateBookingPaymentStatus([
                    'bookingId' => $bookingId,
                    'appUtr' => $appUtr,
                    'orderId' => $orderId,
                    'responseStatus' => 'CAPTURED',
                ]);
            } elseif ($paymentGroupId !== '') {
                $this->catalogService->updateBookingPaymentStatus([
                    'appUtr' => $appUtr,
                    'orderId' => $orderId,
                    'responseStatus' => 'CAPTURED',
                ], $paymentGroupId);
            }

            return [
                'responseStatus' => 'CREATED',
                'responseMessage' => 'Mock ENBDpay checkout created',
                'redirectUri' => $mockReturnUrl,
                'appUtr' => $appUtr,
                'orderId' => $orderId,
                'bookingId' => $bookingId,
                'paymentGroupId' => $paymentGroupId,
                'amount' => $amount,
                'currency' => config('services.enbdpay.currency', 'AED'),
                'mock' => true,
            ];
        }

        $response = $this->requestJson('/checkout/apis/v2/transactions', [
            'method' => 'post',
            'token' => $this->getAuthToken(),
            'body' => [
                'amount' => $amount,
                'currency' => config('services.enbdpay.currency', 'AED'),
                'description' => $this->sanitize($payload['description'] ?? null, 'MedZiva Healthcare Payment', 250),
                'transactionType' => strtoupper((string) ($payload['transactionType'] ?? config('services.enbdpay.transaction_type', 'SALE'))),
                'notes' => ['source' => $this->sanitize($payload['source'] ?? null, 'MedZiva'), 'category' => $this->sanitize($payload['category'] ?? null, 'Healthcare'), ...($bookingId ? ['bookingId' => $bookingId] : []), ...($paymentGroupId ? ['paymentGroupId' => $paymentGroupId] : [])],
                'app' => array_filter([
                    'appUtr' => $appUtr,
                    'redirectUrl' => $redirectUrl,
                    'webhook' => config('services.enbdpay.webhook_url') ?: null,
                    'events' => config('services.enbdpay.webhook_url')
                        ? ['AUTHORIZED', 'CANCELLED', 'CAPTURED', 'PROCESSED', 'FAILED', 'REFUNDED']
                        : null,
                ]),
                'paymentMethod' => config('services.enbdpay.payment_method', 'CARD'),
                'orderId' => $orderId,
                'refundConfig' => ['type' => 'PARTIAL', 'minAmount' => '100'],
                'customerDetails' => $this->customerDetails($payload['customer'] ?? []),
            ],
        ]);

        $redirectUri = $this->readField($response, 'redirectUri');
        $responseStatus = $this->readField($response, 'responseStatus');
        $transactionUtr = $this->readField($response, 'transactionUtr');
        if ($responseStatus !== 'CREATED' || ! $redirectUri) {
            throw new HttpException(424, $this->readField($response, 'responseMessage') ?: 'ENBDpay did not create a checkout link');
        }

        if ($paymentGroupId) {
            $this->catalogService->attachBookingPayment('', [
                'paymentStatus' => 'Pending',
                'paymentProvider' => 'ENBDpay',
                'paymentAppUtr' => $appUtr,
                'paymentOrderId' => $orderId,
                'paymentTransactionUtr' => $transactionUtr,
                'paymentResponseStatus' => $responseStatus,
            ], $paymentGroupId);
        } elseif ($bookingId) {
            $this->catalogService->attachBookingPayment($bookingId, [
                'paymentStatus' => 'Pending',
                'paymentProvider' => 'ENBDpay',
                'paymentAppUtr' => $appUtr,
                'paymentOrderId' => $orderId,
                'paymentTransactionUtr' => $transactionUtr,
                'paymentResponseStatus' => $responseStatus,
            ]);
        }

        $transactionType = strtoupper((string) ($payload['transactionType'] ?? config('services.enbdpay.transaction_type', 'PURCHASE')));

        if ($transactionType === 'AUTH') {
            $customer = $payload['customer'] ?? [];
            $authorizedAmount = (float) $amount / 100;

            AuthTransaction::create([
                'booking_id' => $bookingId ?: null,
                'payment_group_id' => $paymentGroupId ?: null,
                'app_utr' => $appUtr,
                'order_id' => $orderId,
                'transaction_utr' => $transactionUtr,
                'authorized_amount' => $authorizedAmount,
                'status' => 'AUTHORIZED',
                'customer_name' => $customer['fullName'] ?? $customer['name'] ?? null,
                'customer_email' => $customer['email'] ?? null,
                'customer_phone' => $customer['phone'] ?? null,
                'authorized_at' => now(),
                'capture_deadline' => now()->addHours(24),
            ]);

            Log::info('AUTH transaction created', [
                'appUtr' => $appUtr,
                'orderId' => $orderId,
                'amount' => $authorizedAmount,
                'paymentGroupId' => $paymentGroupId,
                'capture_deadline' => now()->addHours(24)->toDateTimeString(),
            ]);
        }

        return [...$response, 'responseStatus' => $responseStatus, 'redirectUri' => $redirectUri, 'transactionUtr' => $transactionUtr, 'appUtr' => $appUtr, 'orderId' => $orderId, 'bookingId' => $bookingId, 'paymentGroupId' => $paymentGroupId, 'booking' => null];
    }

    public function checkCheckoutStatus(array $payload): array
    {
        if (! ($payload['appUtr'] ?? null) && ! ($payload['transactionUtr'] ?? null)) {
            throw new HttpException(400, 'appUtr or transactionUtr is required');
        }

        if ((bool) config('services.enbdpay.mock', true)) {
            $responseStatus = strtoupper((string) ($payload['responseStatus'] ?? 'CAPTURED'));
            $booking = $this->catalogService->updateBookingPaymentStatus([
                'bookingId' => $payload['bookingId'] ?? null,
                'appUtr' => $payload['appUtr'] ?? null,
                'orderId' => $payload['orderId'] ?? null,
                'transactionUtr' => $payload['transactionUtr'] ?? null,
                'responseStatus' => $responseStatus,
            ], $payload['paymentGroupId'] ?? null);

            return [
                'appUtr' => $payload['appUtr'] ?? null,
                'orderId' => $payload['orderId'] ?? null,
                'transactionUtr' => $payload['transactionUtr'] ?? null,
                'responseStatus' => $responseStatus,
                'booking' => $booking,
                'mock' => true,
            ];
        }

        $params = http_build_query(array_filter([
            'transactionUtr' => $payload['transactionUtr'] ?? null,
            'appUtr' => ($payload['transactionUtr'] ?? null) ? null : ($payload['appUtr'] ?? null),
        ]));

        $status = $this->requestJson("/checkout/apis/v2/transactions?{$params}", ['token' => $this->getAuthToken()]);
        $booking = $this->catalogService->updateBookingPaymentStatus([
            'bookingId' => $payload['bookingId'] ?? null,
            'appUtr' => $this->readField($status, 'appUtr') ?: ($payload['appUtr'] ?? null),
            'orderId' => $this->readField($status, 'orderId') ?: ($payload['orderId'] ?? null),
            'transactionUtr' => $this->readField($status, 'transactionUtr') ?: ($payload['transactionUtr'] ?? null),
            'responseStatus' => $this->readField($status, 'responseStatus') ?: $this->readField($status, 'status'),
        ]);

        return [...$status, 'booking' => $booking];
    }

    public function captureTransaction(array $payload): array
    {
        $transactionUtr = $payload['transactionUtr'] ?? null;
        $appUtr = $payload['appUtr'] ?? null;
        $amount = isset($payload['amount']) ? $this->toMinorUnits($payload['amount']) : null;

        if (! $transactionUtr && ! $appUtr) {
            throw new HttpException(400, 'transactionUtr or appUtr is required');
        }

        if ((bool) config('services.enbdpay.mock', true)) {
            $this->catalogService->updateBookingPaymentStatus([
                'appUtr' => $appUtr,
                'transactionUtr' => $transactionUtr,
                'responseStatus' => 'CAPTURED',
            ], $payload['paymentGroupId'] ?? null);

            return [
                'responseStatus' => 'CAPTURED',
                'responseMessage' => 'Mock capture successful',
                'transactionUtr' => $transactionUtr,
                'appUtr' => $appUtr,
                'amount' => $amount,
                'mock' => true,
            ];
        }

        $path = '/checkout/apis/v2/transactions/capture';
        $body = array_filter([
            'transactionUtr' => $transactionUtr,
            'appUtr' => $appUtr,
            'amount' => $amount,
            'orderId' => $payload['orderId'] ?? null,
        ]);

        $response = $this->requestJson($path, ['method' => 'post', 'token' => $this->getAuthToken(), 'body' => $body]);
        $responseStatus = $this->readField($response, 'responseStatus') ?: 'CAPTURED';

        $this->catalogService->updateBookingPaymentStatus([
            'appUtr' => $appUtr,
            'transactionUtr' => $transactionUtr,
            'responseStatus' => $responseStatus,
        ], $payload['paymentGroupId'] ?? null);

        return [...$response, 'responseStatus' => $responseStatus];
    }

    public function refundTransaction(array $payload): array
    {
        $transactionUtr = $payload['transactionUtr'] ?? null;
        $appUtr = $payload['appUtr'] ?? null;
        $amount = isset($payload['amount']) ? $this->toMinorUnits($payload['amount']) : null;

        if (! $transactionUtr && ! $appUtr) {
            throw new HttpException(400, 'transactionUtr or appUtr is required');
        }

        if ((bool) config('services.enbdpay.mock', true)) {
            return [
                'responseStatus' => 'REFUNDED',
                'responseMessage' => 'Mock refund successful',
                'transactionUtr' => $transactionUtr,
                'appUtr' => $appUtr,
                'amount' => $amount,
                'mock' => true,
            ];
        }

        $path = '/checkout/apis/v2/transactions/refund';
        $body = array_filter([
            'transactionUtr' => $transactionUtr,
            'appUtr' => $appUtr,
            'amount' => $amount,
            'orderId' => $payload['orderId'] ?? null,
            'refundNote' => $payload['reason'] ?? 'Customer request',
        ]);

        $response = $this->requestJson($path, ['method' => 'post', 'token' => $this->getAuthToken(), 'body' => $body]);
        $responseStatus = $this->readField($response, 'responseStatus') ?: 'REFUNDED';

        return [...$response, 'responseStatus' => $responseStatus];
    }

    public function voidAuthorization(array $payload): array
    {
        $transactionUtr = $payload['transactionUtr'] ?? null;
        $appUtr = $payload['appUtr'] ?? null;

        if (! $transactionUtr && ! $appUtr) {
            throw new HttpException(400, 'transactionUtr or appUtr is required');
        }

        if ((bool) config('services.enbdpay.mock', true)) {
            return [
                'responseStatus' => 'VOIDED',
                'responseMessage' => 'Mock authorization void successful',
                'transactionUtr' => $transactionUtr,
                'appUtr' => $appUtr,
                'mock' => true,
            ];
        }

        $path = '/checkout/apis/v2/transactions/' . urlencode($transactionUtr ?: $appUtr) . '/cancel';
        $body = array_filter([
            'appUtr' => $appUtr,
            'orderId' => $payload['orderId'] ?? null,
        ]);

        $response = $this->requestJson($path, ['method' => 'post', 'token' => $this->getAuthToken(), 'body' => $body]);
        $responseStatus = $this->readField($response, 'responseStatus') ?: 'VOIDED';

        return [...$response, 'responseStatus' => $responseStatus];
    }

    public function voidCapture(array $payload): array
    {
        $transactionUtr = $payload['transactionUtr'] ?? null;
        $appUtr = $payload['appUtr'] ?? null;

        if (! $transactionUtr && ! $appUtr) {
            throw new HttpException(400, 'transactionUtr or appUtr is required');
        }

        if ((bool) config('services.enbdpay.mock', true)) {
            return [
                'responseStatus' => 'VOIDED',
                'responseMessage' => 'Mock capture void successful',
                'transactionUtr' => $transactionUtr,
                'appUtr' => $appUtr,
                'mock' => true,
            ];
        }

        $path = '/checkout/apis/v2/transactions/' . urlencode($transactionUtr ?: $appUtr) . '/reverse';
        $body = array_filter([
            'appUtr' => $appUtr,
            'orderId' => $payload['orderId'] ?? null,
        ]);

        $response = $this->requestJson($path, ['method' => 'post', 'token' => $this->getAuthToken(), 'body' => $body]);
        $responseStatus = $this->readField($response, 'responseStatus') ?: 'REVERSED';

        return [...$response, 'responseStatus' => $responseStatus];
    }

    public function voidRefund(array $payload): array
    {
        $transactionUtr = $payload['transactionUtr'] ?? null;
        $appUtr = $payload['appUtr'] ?? null;

        if (! $transactionUtr && ! $appUtr) {
            throw new HttpException(400, 'transactionUtr or appUtr is required');
        }

        if ((bool) config('services.enbdpay.mock', true)) {
            return [
                'responseStatus' => 'CANCELLED',
                'responseMessage' => 'Mock refund void successful',
                'transactionUtr' => $transactionUtr,
                'appUtr' => $appUtr,
                'mock' => true,
            ];
        }

        $path = '/checkout/apis/v2/transactions/' . urlencode($transactionUtr ?: $appUtr) . '/refund/cancel';
        $body = array_filter([
            'appUtr' => $appUtr,
            'orderId' => $payload['orderId'] ?? null,
        ]);

        $response = $this->requestJson($path, ['method' => 'post', 'token' => $this->getAuthToken(), 'body' => $body]);
        $responseStatus = $this->readField($response, 'responseStatus') ?: 'CANCELLED';

        return [...$response, 'responseStatus' => $responseStatus];
    }

    public function recordWebhookPaymentStatus(array $payload, array $headers = [], string $rawBody = ''): array
    {
        $this->verifyWebhookSignature($payload, $headers, $rawBody);

        $notes = $this->readField($payload, 'notes');
        $paymentGroupId = is_array($notes) ? $this->readField($notes, 'paymentGroupId') : null;
        $booking = $this->catalogService->updateBookingPaymentStatus([
            'bookingId' => is_array($notes) ? $this->readField($notes, 'bookingId') : null,
            'appUtr' => $this->readField($payload, 'appUtr'),
            'orderId' => $this->readField($payload, 'orderId'),
            'transactionUtr' => $this->readField($payload, 'transactionUtr'),
            'responseStatus' => $this->readField($payload, 'responseStatus') ?: $this->readField($payload, 'status'),
        ], $paymentGroupId);

        return ['received' => true, 'booking' => $booking];
    }

    private function verifyWebhookSignature(array $payload, array $headers, string $rawBody = ''): void
    {
        $secret = config('services.enbdpay.webhook_secret');
        if (! $secret) {
            Log::error('ENBDpay webhook secret not configured — rejecting webhook');
            abort(503, 'Webhook secret not configured');
        }

        $signature = $this->firstHeader($headers, ['x-signature', 'x-hmac-sha256', 'authorization']);
        if ($signature === '') {
            Log::warning('ENBDpay webhook missing signature header');
            throw new HttpException(401, 'Invalid webhook signature');
        }

        // Strip an optional "sha256=" scheme prefix commonly sent by HMAC signers.
        if (preg_match('/^sha256=/i', $signature)) {
            $signature = substr($signature, 7);
        }

        // Prefer the raw request body for verification; providers sign the exact
        // bytes they sent, so re-encoding the decoded payload can break the match.
        $data = $rawBody !== '' ? $rawBody : json_encode($payload);
        $expected = hash_hmac('sha256', $data, $secret);

        if (! hash_equals($expected, strtolower(trim($signature)))) {
            Log::error('ENBDpay webhook signature mismatch');
            throw new HttpException(401, 'Invalid webhook signature');
        }
    }

    private function firstHeader(array $headers, array $names): string
    {
        foreach ($names as $name) {
            $value = $headers[$name] ?? null;
            if (is_array($value) && isset($value[0])) {
                return trim((string) $value[0]);
            }
            if (is_string($value) && $value !== '') {
                return trim($value);
            }
        }

        return '';
    }

    private function getAuthToken(): string
    {
        if ($this->cachedToken && time() < $this->tokenExpiresAt) {
            return $this->cachedToken;
        }
        if (! config('services.enbdpay.username') || ! config('services.enbdpay.api_key')) {
            throw new HttpException(400, 'ENBDpay credentials are not configured');
        }

        $payload = $this->requestJson('/v1/apis/tokens', [
            'method' => 'post',
            'body' => ['username' => config('services.enbdpay.username'), 'apiKey' => config('services.enbdpay.api_key')],
        ]);

        $token = $this->readField($payload, 'token');
        if ($this->readField($payload, 'responseStatus') !== 'SUCCESS' || ! $token) {
            throw new HttpException(424, $this->readField($payload, 'responseMessage') ?: 'ENBDpay token generation failed');
        }

        $this->cachedToken = $token;
        $this->tokenExpiresAt = time() + max(((int) ($this->readField($payload, 'expiresIn') ?: 240)) - 30, 30);

        return $token;
    }

    private function requestJson(string $path, array $options = []): array
    {
        $request = Http::acceptJson()->timeout(30)->withHeaders([
            'Content-Type' => 'application/json',
            'X-Trace-Id' => 'medziva-'.time().'-'.Str::random(12),
        ]);
        if ($options['token'] ?? null) {
            $request = $request->withToken($options['token']);
        }

        $response = strtolower($options['method'] ?? 'get') === 'post'
            ? $request->post($this->baseUrl().$path, $options['body'] ?? [])
            : $request->get($this->baseUrl().$path);

        $responsePayload = $response->json();
        if (! is_array($responsePayload)) {
            $responsePayload = [];
        }

        if (! $response->successful()) {
            Log::warning('ENBDpay request failed', [
                'path' => $path,
                'status' => $response->status(),
                'response' => $responsePayload ?: substr($response->body(), 0, 1000),
            ]);

            throw new HttpException(424, $this->readField($responsePayload, 'responseMessage') ?: 'ENBDpay request failed');
        }

        return $responsePayload;
    }

    private function readField(array $payload, string $field): mixed
    {
        $wanted = strtolower(preg_replace('/\s+/', '', $field));
        foreach ($payload as $key => $value) {
            if (strtolower(preg_replace('/\s+/', '', (string) $key)) === $wanted) {
                return $value;
            }
        }

        return null;
    }

    private function baseUrl(): string
    {
        return rtrim((string) config('services.enbdpay.base_url'), '/');
    }

    private function buildAppUtr(): string
    {
        return substr('MDZ'.strtoupper(base_convert((string) time(), 10, 36)).strtoupper(Str::random(8)), 0, 25);
    }

    private function buildOrderId(): string
    {
        return substr('MZ'.strtoupper(base_convert((string) time(), 10, 36)).strtoupper(Str::random(4)), 0, 18);
    }

    private function toMinorUnits(mixed $amount): string
    {
        if (! is_numeric($amount) || (float) $amount <= 0) {
            throw new HttpException(400, 'A valid payment amount is required');
        }

        return (string) round(((float) $amount) * 100);
    }

    private function redirectUrl(): string
    {
        return config('services.enbdpay.redirect_url') ?: rtrim((string) config('app.frontend_url', 'http://localhost:5173'), '/').'/payment/return';
    }

    private function appendReturnParams(string $url, array $params): string
    {
        $separator = str_contains($url, '?') ? '&' : '?';

        return $url.$separator.http_build_query(array_filter($params));
    }

    private function sanitize(mixed $value, string $fallback, int $maxLength = 50): string
    {
        $cleaned = trim(preg_replace('/\s+/', ' ', preg_replace('/[^A-Za-z0-9 #_,\/().&:\-]/', ' ', (string) ($value ?: $fallback))));

        return substr($cleaned ?: $fallback, 0, $maxLength);
    }

    private function customerDetails(array $customer): array
    {
        $parts = preg_split('/\s+/', trim((string) ($customer['fullName'] ?? $customer['name'] ?? ''))) ?: [];
        $first = substr($parts[0] ?? 'MedZiva', 0, 30);
        $last = substr(implode(' ', array_slice($parts, 1)) ?: 'Customer', 0, 30);
        $address = $this->sanitize($customer['address'] ?? null, 'Dubai');

        return [
            'firstName' => $first,
            'lastName' => $last,
            'isdCode' => '+971',
            'mobileNumber' => substr(preg_replace('/\D/', '', (string) ($customer['phone'] ?? '500000000')), -15) ?: '500000000',
            'email' => substr((string) ($customer['email'] ?? 'booking@' . config('app.name') . '.ae'), 0, 50),
            'shippingAddress' => ['addressLine1' => $address, 'addressLine2' => 'MedZiva Healthcare', 'city' => 'Dubai', 'state' => 'Dubai', 'countryCode' => 'AE', 'pinCode' => '00000'],
            'billingAddress' => ['addressLine1' => $address, 'addressLine2' => 'MedZiva Healthcare', 'city' => 'Dubai', 'state' => 'Dubai', 'countryCode' => 'AE', 'pinCode' => '00000'],
        ];
    }
}
