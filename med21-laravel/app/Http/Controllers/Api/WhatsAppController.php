<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\WhatsAppService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class WhatsAppController extends Controller
{
    public function __construct(private readonly WhatsAppService $whatsapp) {}

    /**
     * Webhook verification (GET) — Meta sends this to verify the endpoint.
     */
    public function verify(Request $request): JsonResponse|string
    {
        $mode = $request->query('hub_mode');
        $token = $request->query('hub_verify_token');
        $challenge = $request->query('hub_challenge');

        $result = $this->whatsapp->verifyWebhook($mode, $token, $challenge);

        if ($result !== null) {
            return response($result, 200)->header('Content-Type', 'text/plain');
        }

        return response()->json(['error' => 'Verification failed'], 403);
    }

    /**
     * Incoming message handler (POST) — Meta sends this when a customer messages the business.
     */
    public function handleIncoming(Request $request): JsonResponse
    {
        $body = $request->all();
        $entry = $body['entry'][0] ?? null;
        $change = $entry['changes'][0] ?? null;
        $value = $change['value'] ?? null;
        $messages = $value['messages'] ?? [];
        $message = $messages[0] ?? null;

        if (! $message) {
            return response()->json(['status' => 'ok']);
        }

        $from = $message['from'] ?? '';
        $text = $message['text']['body'] ?? '';
        $type = $message['type'] ?? 'text';

        // Ignore messages from the business itself (avoid echo loops)
        $businessPhone = config('services.whatsapp.business_phone', '971559510794');
        if (str_replace('+', '', $from) === $businessPhone) {
            return response()->json(['status' => 'ok']);
        }

        // Type-specific handling
        if ($type !== 'text' || ! $text) {
            $this->whatsapp->sendText($from, 'Thank you for your message! How can we help you today?');
            return response()->json(['status' => 'ok']);
        }

        $response = $this->generateAutoReply($text);

        $this->whatsapp->sendText($from, $response);

        return response()->json(['status' => 'ok']);
    }

    /**
     * Generate an auto-reply based on customer's message content.
     */
    private function generateAutoReply(string $message): string
    {
        $lower = mb_strtolower(trim($message));
        $appUrl = config('app.url');
        $supportEmail = config('mail.from.address', '' . $supportEmail . '');

        // Greetings
        if (preg_match('/^(hi|hello|hey|good\s*(morning|afternoon|evening)|مرحبا|السلام)\b/i', $lower)) {
            return "👋 Hello! Welcome to MedZiva Healthcare.\n\n"
                . "I'm your virtual assistant. Here's how I can help:\n"
                . "• 📋 Book a service — type 'book'\n"
                . "• 💰 Check pricing — type 'price'\n"
                . "• 🕐 Working hours — type 'hours'\n"
                . "• 📍 Service areas — type 'area'\n"
                . "• 🙋‍♂️ Talk to a person — type 'agent'";
        }

        // Bookings
        if (preg_match('/\b(book|booking|appointment|schedule|حجز|موعد)\b/i', $lower)) {
            return "To book a service:\n\n"
                . "1. Visit {$appUrl}\n"
                . "2. Browse our services (Nursing, IV Therapy, Lab Tests, etc.)\n"
                . "3. Click 'Book Now' or add to cart\n"
                . "4. Choose your preferred date and time\n\n"
                . "You can also call us at +971 55 951 0794 for assistance.";
        }

        // Pricing
        if (preg_match('/\b(price|cost|fee|rate|how much|سعر|كم)\b/i', $lower)) {
            return "Our pricing varies by service:\n\n"
                . "• Nursing care: from AED 250/visit\n"
                . "• Doctor at Home: AED 500\n"
                . "• Physiotherapy: AED 400/session\n"
                . "• IV Therapy: from AED 850\n"
                . "• Lab Tests: from AED 59\n\n"
                . "For an exact quote, visit our website or call +971 55 951 0794.";
        }

        // Working hours
        if (preg_match('/\b(hours|timing|open|time|work|ساعات|دوام)\b/i', $lower)) {
            return "Our working hours:\n\n"
                . "• Sunday - Saturday: 8:00 AM - 10:00 PM\n"
                . "• We operate across Dubai and Sharjah\n\n"
                . "Online booking is available 24/7 at {$appUrl}";
        }

        // Service area
        if (preg_match('/\b(area|location|dubai|sharjah|abu dhabi|منطقة|دبي|الشارقة)\b/i', $lower)) {
            return "We currently serve:\n\n"
                . "📍 Dubai — all areas\n"
                . "📍 Sharjah — all areas\n\n"
                . "Services are delivered to your home or hotel within these emirates.";
        }

        // Services list
        if (preg_match('/\b(service|offer|provide|what do you|خدمة)\b/i', $lower)) {
            return "We offer:\n\n"
                . "🩺 Nursing Care at Home\n"
                . "🏥 Doctor on Call\n"
                . "💪 Physiotherapy & Rehabilitation\n"
                . "💉 IV Therapy & Wellness Drips\n"
                . "🔬 Lab Tests at Home\n"
                . "🛏️ Medical Equipment Rental\n\n"
                . "Visit {$appUrl} to explore all services.";
        }

        // Speak to agent
        if (preg_match('/\b(agent|human|person|support|help|ممثل|مساعدة)\b/i', $lower)) {
            return "You can reach our team:\n\n"
                . "📞 Call/WhatsApp: +971 55 951 0794\n"
                . "📧 Email: {$supportEmail}\n\n"
                . "Our team is available during business hours (8AM - 10PM).";
        }

        // Default response
        return "Thank you for reaching out to MedZiva Healthcare! 🙏\n\n"
            . "To help you better, please reply with one of these keywords:\n"
            . "• 'book' — Make a booking\n"
            . "• 'price' — Pricing info\n"
            . "• 'hours' — Working hours\n"
            . "• 'services' — What we offer\n"
            . "• 'agent' — Talk to a person\n\n"
            . "Or visit {$appUrl}";
    }
}
