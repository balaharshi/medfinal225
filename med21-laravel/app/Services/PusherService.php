<?php

namespace App\Services;

use Illuminate\Support\Facades\Log;

class PusherService
{
    private ?object $pusher = null;

    private function client(): ?object
    {
        if ($this->pusher !== null) {
            return $this->pusher;
        }

        $appId = config('services.pusher.app_id');
        $key = config('services.pusher.key');
        $secret = config('services.pusher.secret');
        $cluster = config('services.pusher.cluster');

        if (! $appId || ! $key || ! $secret) {
            return null;
        }

        try {
            $this->pusher = new \Pusher\Pusher($key, $secret, $appId, [
                'cluster' => $cluster,
                'use_tls' => config('services.pusher.use_tls', true),
            ]);
        } catch (\Throwable $e) {
            Log::warning('Pusher init failed: '.$e->getMessage());
            $this->pusher = null;
        }

        return $this->pusher;
    }

    public function triggerEvent(string $event, array $payload = []): void
    {
        $channel = config('services.pusher.channel', 'medziva-notifications');

        try {
            $client = $this->client();
            if ($client) {
                $client->trigger($channel, $event, $payload);
            } else {
                Log::info('Realtime event (Pusher not configured)', ['event' => $event, 'payload' => $payload]);
            }
        } catch (\Throwable $e) {
            Log::error('Pusher trigger failed: '.$e->getMessage(), ['event' => $event]);
        }
    }

    public function triggerNotification(string $message, array $payload = []): void
    {
        $this->triggerEvent('notification:new', ['message' => $message, ...$payload]);
    }
}
