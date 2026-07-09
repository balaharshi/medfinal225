<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class BookingReminder extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(public array $booking) {}

    public function envelope(): Envelope
    {
        $title = $this->booking['serviceTitle'] ?? $this->booking['service_title'] ?? 'your appointment';

        return new Envelope(
            subject: "Reminder: {$title} — Tomorrow at MedZiva",
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
        $serviceName = htmlspecialchars($this->booking['serviceTitle'] ?? $this->booking['service_title'] ?? 'your appointment');
        $customerName = htmlspecialchars($this->booking['customerName'] ?? $this->booking['customer_name'] ?? 'Valued Customer');
        $bookingId = htmlspecialchars($this->booking['id'] ?? 'N/A');
        $date = htmlspecialchars($this->booking['date'] ?? 'N/A');
        $timeSlot = htmlspecialchars($this->booking['timeSlot'] ?? $this->booking['time_slot'] ?? 'N/A');
        $vendorName = htmlspecialchars($this->booking['vendorName'] ?? $this->booking['vendor_name'] ?? 'a healthcare professional');

        return "
<!DOCTYPE html>
<html>
<head>
    <meta charset='utf-8'>
    <meta name='viewport' content='width=device-width, initial-scale=1.0'>
</head>
<body style='margin:0;padding:0;background-color:#f8fafc;font-family:Arial,sans-serif;'>
    <div style='max-width:600px;margin:0 auto;background-color:#ffffff;'>

        <div style='background:linear-gradient(135deg,#1769b3,#0f5a94);padding:30px;text-align:center;'>
            <h1 style='color:#ffffff;margin:0;font-size:22px;font-weight:800;'>Booking Reminder</h1>
            <p style='color:#ffffff;margin:8px 0 0;font-size:12px;opacity:0.9;'>MedZiva Healthcare</p>
        </div>

        <div style='padding:30px;'>
            <h2 style='color:#0f172a;font-size:18px;margin:0 0 15px;'>Hello {$customerName},</h2>

            <p style='color:#475569;font-size:14px;line-height:1.7;margin:0 0 15px;'>
                This is a friendly reminder that your appointment with <strong>{$vendorName}</strong> is scheduled for <strong>tomorrow</strong>.
            </p>

            <div style='background-color:#f1f5f9;border-radius:12px;padding:20px;margin:0 0 25px;'>
                <table style='width:100%;border-collapse:collapse;'>
                    <tr>
                        <td style='padding:6px 0;color:#64748b;font-size:12px;'>Service</td>
                        <td style='padding:6px 0;color:#0f172a;font-size:12px;font-weight:700;text-align:right;'>{$serviceName}</td>
                    </tr>
                    <tr>
                        <td style='padding:6px 0;color:#64748b;font-size:12px;'>Date</td>
                        <td style='padding:6px 0;color:#0f172a;font-size:12px;font-weight:700;text-align:right;'>{$date}</td>
                    </tr>
                    <tr>
                        <td style='padding:6px 0;color:#64748b;font-size:12px;'>Time</td>
                        <td style='padding:6px 0;color:#0f172a;font-size:12px;font-weight:700;text-align:right;'>{$timeSlot}</td>
                    </tr>
                    <tr>
                        <td style='padding:6px 0;color:#64748b;font-size:12px;'>Provider</td>
                        <td style='padding:6px 0;color:#0f172a;font-size:12px;font-weight:700;text-align:right;'>{$vendorName}</td>
                    </tr>
                </table>
            </div>

            <p style='color:#475569;font-size:13px;line-height:1.6;margin:0 0 10px;'>
                Please ensure someone is available at the booked address during the time slot. If you need to cancel or reschedule, you can do so from your MedZiva account with at least 24 hours notice.
            </p>

            <p style='color:#475569;font-size:13px;line-height:1.6;margin:0 0 20px;'>
                Questions? Contact us at <a href='mailto:booking@medzivahealthcare.com' style='color:#1769b3;'>booking@medzivahealthcare.com</a>
            </p>
        </div>

        <div style='background-color:#f1f5f9;padding:20px;text-align:center;'>
            <p style='color:#475569;font-size:13px;font-weight:700;margin:0 0 4px;'>— MedZiva Team</p>
            <p style='color:#94a3b8;font-size:11px;margin:0 0 5px;'>MedZiva International Healthcare L.L.C.</p>
            <p style='color:#94a3b8;font-size:11px;margin:0;'>Dubai, United Arab Emirates | medzivahealthcare.com</p>
        </div>
    </div>
</body>
</html>";
    }
}
