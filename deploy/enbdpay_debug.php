<?php

/**
 * Temporary ENBDPAY diagnostic.
 *
 * Upload to: public_html/api.medzivahealthcare.com/enbdpay_debug.php
 * Open: https://api.medzivahealthcare.com/enbdpay_debug.php?token=medziva-debug-2026
 * Delete this file immediately after diagnosis.
 */

if (($_GET['token'] ?? '') !== 'medziva-debug-2026') {
    http_response_code(404);
    exit('Not found');
}

require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Str;

$baseUrl = rtrim((string) config('services.enbdpay.base_url'), '/');
$username = (string) config('services.enbdpay.username');
$apiKey = (string) config('services.enbdpay.api_key');
$currency = (string) config('services.enbdpay.currency', 'AED');
$paymentMethod = (string) config('services.enbdpay.payment_method', 'CARD');
$transactionType = (string) config('services.enbdpay.transaction_type', 'AUTH');
$redirectUrl = (string) config('services.enbdpay.redirect_url');
$webhookUrl = (string) config('services.enbdpay.webhook_url');

header('Content-Type: text/plain; charset=UTF-8');

echo "ENBDPAY CONFIG\n";
echo "baseUrl={$baseUrl}\n";
echo "username={$username}\n";
echo 'apiKey='.($apiKey ? substr($apiKey, 0, 3).'***'.substr($apiKey, -2) : 'MISSING')."\n";
echo "currency={$currency}\n";
echo "paymentMethod={$paymentMethod}\n";
echo "transactionType={$transactionType}\n";
echo "redirectUrl={$redirectUrl}\n";
echo "webhookUrl={$webhookUrl}\n\n";

try {
    $tokenResponse = Http::acceptJson()
        ->timeout(30)
        ->withHeaders([
            'Content-Type' => 'application/json',
            'X-Trace-Id' => 'medziva-debug-'.time().'-'.Str::random(8),
        ])
        ->post($baseUrl.'/v1/apis/tokens', [
            'username' => $username,
            'apiKey' => $apiKey,
        ]);

    echo "TOKEN HTTP STATUS: ".$tokenResponse->status()."\n";
    echo "TOKEN RESPONSE:\n".$tokenResponse->body()."\n\n";

    $tokenPayload = $tokenResponse->json();
    $token = is_array($tokenPayload) ? ($tokenPayload['token'] ?? $tokenPayload['Token'] ?? null) : null;

    if (! $token) {
        exit("No token returned. Fix credentials/base URL/account access first.\n");
    }

    $appUtr = substr('MDZ'.strtoupper(base_convert((string) time(), 10, 36)).strtoupper(Str::random(8)), 0, 25);
    $orderId = substr('MZ'.strtoupper(base_convert((string) time(), 10, 36)).strtoupper(Str::random(4)), 0, 18);
    $returnUrl = $redirectUrl ?: 'https://medzivahealthcare.com/payment/return';
    $returnUrl .= (str_contains($returnUrl, '?') ? '&' : '?').http_build_query([
        'appUtr' => $appUtr,
        'orderId' => $orderId,
    ]);

    $checkoutBody = [
        'amount' => '100',
        'currency' => $currency,
        'description' => 'MedZiva debug payment',
        'transactionType' => $transactionType,
        'notes' => [
            'source' => 'debug',
            'category' => 'Healthcare',
        ],
        'app' => array_filter([
            'appUtr' => $appUtr,
            'redirectUrl' => $returnUrl,
            'webhook' => $webhookUrl ?: null,
            'events' => $webhookUrl ? ['AUTHORIZED', 'CANCELLED', 'CAPTURED', 'PROCESSED', 'FAILED', 'REFUNDED'] : null,
        ]),
        'paymentMethod' => $paymentMethod,
        'orderId' => $orderId,
        'refundConfig' => [
            'type' => 'PARTIAL',
            'minAmount' => '100',
        ],
        'customerDetails' => [
            'firstName' => 'Test',
            'lastName' => 'Customer',
            'isdCode' => '+971',
            'mobileNumber' => '500000000',
            'email' => 'test@example.com',
            'shippingAddress' => [
                'addressLine1' => 'Dubai',
                'addressLine2' => 'MedZiva Healthcare',
                'city' => 'Dubai',
                'state' => 'Dubai',
                'countryCode' => 'AE',
                'pinCode' => '00000',
            ],
            'billingAddress' => [
                'addressLine1' => 'Dubai',
                'addressLine2' => 'MedZiva Healthcare',
                'city' => 'Dubai',
                'state' => 'Dubai',
                'countryCode' => 'AE',
                'pinCode' => '00000',
            ],
        ],
    ];

    echo "CHECKOUT REQUEST:\n".json_encode($checkoutBody, JSON_PRETTY_PRINT)."\n\n";

    $checkoutResponse = Http::acceptJson()
        ->timeout(30)
        ->withToken($token)
        ->withHeaders([
            'Content-Type' => 'application/json',
            'X-Trace-Id' => 'medziva-debug-'.time().'-'.Str::random(8),
        ])
        ->post($baseUrl.'/checkout/apis/v2/transactions', $checkoutBody);

    echo "CHECKOUT HTTP STATUS: ".$checkoutResponse->status()."\n";
    echo "CHECKOUT RESPONSE:\n".$checkoutResponse->body()."\n";
} catch (Throwable $error) {
    echo "EXCEPTION:\n";
    echo get_class($error).': '.$error->getMessage()."\n";
}
