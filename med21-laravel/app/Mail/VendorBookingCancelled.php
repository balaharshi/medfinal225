<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class VendorBookingCancelled extends Mailable implements ShouldQueue
{
    use Queueable, SerializesModels;

    public function __construct(
        public array $booking,
        public string $vendorName,
    ) {}

    public function envelope(): Envelope
    {
        $serviceTitle = $this->booking['serviceTitle'] ?? $this->booking['service_title'] ?? 'a service';

        return new Envelope(
            subject: "Booking Cancelled — {$serviceTitle}",
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
        $appUrl = config('app.url');
        $serviceName = htmlspecialchars($this->booking['serviceTitle'] ?? $this->booking['service_title'] ?? 'Healthcare Service');
        $vendorName = htmlspecialchars($this->vendorName);
        $customerName = htmlspecialchars($this->booking['customerName'] ?? $this->booking['customer_name'] ?? 'Customer');
        $bookingId = htmlspecialchars($this->booking['id'] ?? 'N/A');
        $date = htmlspecialchars($this->booking['date'] ?? 'N/A');
        $timeSlot = htmlspecialchars($this->booking['timeSlot'] ?? $this->booking['time_slot'] ?? 'N/A');

        return "
<!DOCTYPE html>
<html>
<head>
    <meta charset='utf-8'>
    <meta name='viewport' content='width=device-width, initial-scale=1.0'>
</head>
<body style='margin:0;padding:0;background-color:#f8fafc;font-family:Arial,sans-serif;'>
    <div style='max-width:600px;margin:0 auto;background-color:#ffffff;'>

        <div style='background:linear-gradient(135deg,#ef4444,#dc2626);padding:30px;text-align:center;'>
            <h1 style='color:#ffffff;margin:0;font-size:22px;font-weight:800;'>Booking Cancelled</h1>
            <p style='color:#ffffff;margin:8px 0 0;font-size:12px;opacity:0.9;'>MedZiva Healthcare</p>
        </div>

        <div style='padding:30px;'>
            <h2 style='color:#0f172a;font-size:18px;margin:0 0 15px;'>Hello {$vendorName},</h2>

            <p style='color:#475569;font-size:14px;line-height:1.7;margin:0 0 15px;'>
                A booking for <strong>{$serviceName}</strong> that was assigned to you has been cancelled.
            </p>

            <div style='background-color:#f1f5f9;border-radius:12px;padding:20px;margin:0 0 25px;'>
                <table style='width:100%;border-collapse:collapse;'>
                    <tr>
                        <td style='padding:6px 0;color:#64748b;font-size:12px;'>Booking ID</td>
                        <td style='padding:6px 0;color:#0f172a;font-size:12px;font-weight:700;text-align:right;'>{$bookingId}</td>
                    </tr>
                    <tr>
                        <td style='padding:6px 0;color:#64748b;font-size:12px;'>Customer</td>
                        <td style='padding:6px 0;color:#0f172a;font-size:12px;font-weight:700;text-align:right;'>{$customerName}</td>
                    </tr>
                    <tr>
                        <td style='padding:6px 0;color:#64748b;font-size:12px;'>Service</td>
                        <td style='padding:6px 0;color:#0f172a;font-size:12px;font-weight:700;text-align:right;'>{$serviceName}</td>
                    </tr>
                    <tr>
                        <td style='padding:6px 0;color:#64748b;font-size:12px;'>Date</td>
                        <td style='padding:6px 0;color:#0f172a;font-size:12px;font-weight:700;text-align:right;'>{$date}</td>
                    </tr>
                    <tr>
                        <td style='padding:6px 0;color:#64748b;font-size:12px;'>Time Slot</td>
                        <td style='padding:6px 0;color:#0f172a;font-size:12px;font-weight:700;text-align:right;'>{$timeSlot}</td>
                    </tr>
                </table>
            </div>

            <p style='color:#475569;font-size:14px;line-height:1.7;margin:0;'>
                This slot is now free for other bookings. Log in to your vendor dashboard to view other available bookings.
            </p>
        </div>

        <div style='background-color:#f1f5f9;padding:20px;text-align:center;'>
            <p style='color:#475569;font-size:13px;font-weight:700;margin:0 0 4px;'>— MedZiva Team</p>
            <p style='color:#94a3b8;font-size:11px;margin:0 0 5px;'>MedZiva International Healthcare L.L.C.</p>
            <p style='color:#94a3b8;font-size:11px;margin:0;'>Dubai, United Arab Emirates | {$appUrl}</p>
        </div>
    </div>
</body>
</html>";
    }
}
