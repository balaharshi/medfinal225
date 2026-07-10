<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class WhatsAppService
{
    private ?string $token;
    private ?string $phoneNumberId;
    private string $baseUrl;

    public function __construct()
    {
        $this->token = config('services.whatsapp.token');
        $this->phoneNumberId = config('services.whatsapp.phone_number_id');
        $this->baseUrl = config('services.whatsapp.base_url', 'https://graph.facebook.com/v21.0');
    }

    /**
     * Send a template message via WhatsApp Business API.
     *
     * @param string $to Recipient phone number in international format (e.g., +971501234567)
     * @param string $templateName The approved template name
     * @param array $parameters Body parameters to fill the template
     * @param string $language Template language code (default: en)
     * @return array{success: bool, message: string}
     */
    public function sendTemplate(string $to, string $templateName, array $parameters = [], string $language = 'en'): array
    {
        if (! $this->token || ! $this->phoneNumberId) {
            Log::warning('WhatsApp not configured — skipping message', [
                'to' => $to,
                'template' => $templateName,
            ]);
            return ['success' => false, 'message' => 'WhatsApp not configured'];
        }

        $payload = [
            'messaging_product' => 'whatsapp',
            'to' => $this->normalizePhone($to),
            'type' => 'template',
            'template' => [
                'name' => $templateName,
                'language' => ['code' => $language],
            ],
        ];

        if (! empty($parameters)) {
            $payload['template']['components'] = [
                [
                    'type' => 'body',
                    'parameters' => array_map(fn ($val) => ['type' => 'text', 'text' => (string) $val], $parameters),
                ],
            ];
        }

        try {
            $response = Http::withToken($this->token)
                ->withHeaders(['Content-Type' => 'application/json'])
                ->post("{$this->baseUrl}/{$this->phoneNumberId}/messages", $payload);

            $body = $response->json() ?? [];

            if ($response->successful()) {
                Log::info('WhatsApp message sent', [
                    'to' => $to,
                    'template' => $templateName,
                    'msgId' => $body['messages'][0]['id'] ?? null,
                ]);
                return ['success' => true, 'message' => 'Sent', 'messageId' => $body['messages'][0]['id'] ?? null];
            }

            Log::error('WhatsApp API error', [
                'to' => $to,
                'template' => $templateName,
                'status' => $response->status(),
                'response' => $body,
            ]);
            return ['success' => false, 'message' => $body['error']['message'] ?? 'API error'];
        } catch (\Throwable $e) {
            Log::error('WhatsApp send failed', [
                'to' => $to,
                'template' => $templateName,
                'error' => $e->getMessage(),
            ]);
            return ['success' => false, 'message' => $e->getMessage()];
        }
    }

    /**
     * Send a free-form text message (only allowed within 24h of last customer message).
     */
    public function sendText(string $to, string $text): array
    {
        if (! $this->token || ! $this->phoneNumberId) {
            return ['success' => false, 'message' => 'WhatsApp not configured'];
        }

        $payload = [
            'messaging_product' => 'whatsapp',
            'to' => $this->normalizePhone($to),
            'type' => 'text',
            'text' => ['body' => $text],
        ];

        try {
            $response = Http::withToken($this->token)
                ->withHeaders(['Content-Type' => 'application/json'])
                ->post("{$this->baseUrl}/{$this->phoneNumberId}/messages", $payload);

            if ($response->successful()) {
                return ['success' => true, 'message' => 'Sent'];
            }

            Log::error('WhatsApp text error', [
                'to' => $to,
                'status' => $response->status(),
                'response' => $response->json(),
            ]);
            return ['success' => false, 'message' => $response->json()['error']['message'] ?? 'API error'];
        } catch (\Throwable $e) {
            return ['success' => false, 'message' => $e->getMessage()];
        }
    }

    /**
     * Verify a webhook from Meta (for incoming messages / delivery receipts).
     */
    public function verifyWebhook(string $mode, string $token, string $challenge): ?string
    {
        $verifyToken = config('services.whatsapp.webhook_verify_token');
        if ($mode === 'subscribe' && $token === $verifyToken) {
            return $challenge;
        }
        return null;
    }

    private function normalizePhone(string $phone): string
    {
        // Remove non-digit characters except leading +
        $cleaned = '+' . preg_replace('/[^0-9]/', '', $phone);
        return $cleaned;
    }
}
