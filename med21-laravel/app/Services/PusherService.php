<?php

namespace App\Services;

use Illuminate\Support\Facades\Log;

class PusherService
{
    public function triggerEvent(string $event, array $payload = []): void
    {
        Log::info('Realtime event', ['event' => $event, 'payload' => $payload]);
    }

    public function triggerNotification(string $message, array $payload = []): void
    {
        $this->triggerEvent('notification:new', ['message' => $message, ...$payload]);
    }
}
