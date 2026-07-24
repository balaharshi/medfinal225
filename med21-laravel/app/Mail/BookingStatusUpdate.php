<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class BookingStatusUpdate extends Mailable implements ShouldQueue
{
    use Queueable, SerializesModels;

    public function __construct(
        public array $booking,
        public string $previousStatus
    ) {}

    public function envelope(): Envelope
    {
        $title = $this->booking['serviceTitle'] ?? $this->booking['service_title'] ?? 'Healthcare Service';
        return new Envelope(
            subject: "Booking Update - {$title}",
        );
    }

    public function content(): Content
    {
        return new Content(
            htmlString: $this->buildHtml(),
        );
    }

    private function buildHtml(): string
    {
        $booking = $this->booking;
        $appUrl = config('app.url');
        $supportEmail = config('mail.from.address', '' . $supportEmail . '');
        $serviceName = htmlspecialchars($booking['serviceTitle'] ?? $booking['service_title'] ?? 'Healthcare Service');
        $customerName = htmlspecialchars($booking['customerName'] ?? $booking['customer_name'] ?? 'Valued Customer');
        $bookingId = htmlspecialchars($booking['id'] ?? 'N/A');
        $date = htmlspecialchars($booking['date'] ?? 'N/A');
        $timeSlot = htmlspecialchars($booking['timeSlot'] ?? $booking['time_slot'] ?? 'N/A');
        $status = htmlspecialchars($booking['status'] ?? 'Updated');
        $previousStatus = htmlspecialchars($this->previousStatus);

        $statusColor = match($status) {
            'Active' => '#1769b3',
            'Completed' => '#82c342',
            'Canceled' => '#dc2626',
            'In Progress' => '#f59e0b',
            default => '#64748b',
        };

        $statusMessage = match($status) {
            'Active' => 'Your booking has been assigned to a healthcare professional and is now active.',
            'Completed' => 'Your healthcare service has been completed. We hope you had a great experience!',
            'Canceled' => "Your booking has been cancelled. We're sorry things didn't work out — if this was unexpected or you need help rebooking, we're here for you.",
            'In Progress' => 'Your healthcare professional is on the way or has started the service.',
            default => 'Your booking status has been updated.',
        };

        return "
<!DOCTYPE html>
<html>
<head>
    <meta charset='utf-8'>
    <meta name='viewport' content='width=device-width, initial-scale=1.0'>
</head>
<body style='margin:0;padding:0;background-color:#f8fafc;font-family:Arial,sans-serif;'>
    <div style='max-width:600px;margin:0 auto;background-color:#ffffff;'>
        <!-- Header -->
        <div style='background:linear-gradient(135deg,{$statusColor}," . $this->darkenColor($statusColor) . ");padding:30px;text-align:center;'>
            <h1 style='color:#ffffff;margin:0;font-size:24px;font-weight:800;'>Booking {$status}</h1>
            <p style='color:#ffffff;margin:8px 0 0;font-size:12px;opacity:0.9;'>MedZiva Healthcare</p>
        </div>

        <!-- Body -->
        <div style='padding:30px;'>
            <h2 style='color:#0f172a;font-size:18px;margin:0 0 10px;'>Hello {$customerName},</h2>
            <p style='color:#475569;font-size:14px;line-height:1.6;margin:0 0 20px;'>
                {$statusMessage}
            </p>

            <!-- Status Badge -->
            <div style='text-align:center;margin:0 0 25px;'>
                <span style='display:inline-block;background-color:{$statusColor};color:#ffffff;padding:8px 20px;border-radius:20px;font-size:13px;font-weight:700;'>{$status}</span>
            </div>

            <!-- Booking Details Card -->
            <div style='background-color:#f1f5f9;border-radius:12px;padding:20px;margin:0 0 20px;'>
                <table style='width:100%;border-collapse:collapse;'>
                    <tr>
                        <td style='padding:8px 0;color:#64748b;font-size:12px;font-weight:600;'>Booking ID</td>
                        <td style='padding:8px 0;color:#0f172a;font-size:13px;font-weight:700;text-align:right;'>{$bookingId}</td>
                    </tr>
                    <tr>
                        <td style='padding:8px 0;color:#64748b;font-size:12px;font-weight:600;'>Service</td>
                        <td style='padding:8px 0;color:#0f172a;font-size:13px;font-weight:700;text-align:right;'>{$serviceName}</td>
                    </tr>
                    <tr>
                        <td style='padding:8px 0;color:#64748b;font-size:12px;font-weight:600;'>Date</td>
                        <td style='padding:8px 0;color:#0f172a;font-size:13px;font-weight:700;text-align:right;'>{$date}</td>
                    </tr>
                    <tr>
                        <td style='padding:8px 0;color:#64748b;font-size:12px;font-weight:600;'>Time Slot</td>
                        <td style='padding:8px 0;color:#0f172a;font-size:13px;font-weight:700;text-align:right;'>{$timeSlot}</td>
                    </tr>
                    <tr>
                        <td style='padding:8px 0;color:#64748b;font-size:12px;font-weight:600;border-top:1px solid #e2e8f0;'>Previous Status</td>
                        <td style='padding:8px 0;color:#64748b;font-size:13px;font-weight:600;text-align:right;border-top:1px solid #e2e8f0;'>{$previousStatus}</td>
                    </tr>
                    <tr>
                        <td style='padding:8px 0;color:#64748b;font-size:12px;font-weight:600;'>Current Status</td>
                        <td style='padding:8px 0;color:{$statusColor};font-size:13px;font-weight:700;text-align:right;'>{$status}</td>
                    </tr>
                </table>
            </div>

            <p style='color:#475569;font-size:13px;line-height:1.6;margin:0 0 15px;'>
                You can view your booking details and track updates in your MedZiva account.
            </p>

            <p style='color:#475569;font-size:13px;line-height:1.6;margin:0 0 20px;'>
                Questions? Contact us at <a href='mailto:{$supportEmail}' style='color:#1769b3;'>{$supportEmail}</a>
            </p>
        </div>

        <!-- Footer -->
        <div style='background-color:#f1f5f9;padding:20px;text-align:center;'>
            <p style='color:#475569;font-size:13px;font-weight:700;margin:0 0 4px;'>— MedZiva Team</p>
            <p style='color:#94a3b8;font-size:11px;margin:0 0 5px;'>MedZiva International Healthcare L.L.C.</p>
            <p style='color:#94a3b8;font-size:11px;margin:0;'>Dubai, United Arab Emirates | {$appUrl}</p>
        </div>
    </div>
</body>
</html>";
    }

    private function darkenColor(string $hex): string
    {
        $hex = ltrim($hex, '#');
        $r = max(0, hexdec(substr($hex, 0, 2)) - 30);
        $g = max(0, hexdec(substr($hex, 2, 2)) - 30);
        $b = max(0, hexdec(substr($hex, 4, 2)) - 30);
        return sprintf('#%02x%02x%02x', $r, $g, $b);
    }
}
