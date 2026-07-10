<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class BookingExpired extends Mailable implements ShouldQueue
{
    use Queueable, SerializesModels;

    public function __construct(public array $booking) {}

    public function envelope(): Envelope
    {
        $serviceTitle = $this->booking['serviceTitle'] ?? $this->booking['service_title'] ?? 'your service';

        return new Envelope(
            subject: "Unable to Fulfill Your Booking — {$serviceTitle}",
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
        $serviceName = htmlspecialchars($booking['serviceTitle'] ?? $booking['service_title'] ?? 'Healthcare Service');
        $customerName = htmlspecialchars($booking['customerName'] ?? $booking['customer_name'] ?? 'Valued Customer');
        $bookingId = htmlspecialchars($booking['id'] ?? 'N/A');
        $date = htmlspecialchars($booking['date'] ?? 'N/A');
        $timeSlot = htmlspecialchars($booking['timeSlot'] ?? $booking['time_slot'] ?? 'N/A');
        $price = number_format($booking['price'] ?? 0);

        return "
<!DOCTYPE html>
<html>
<head>
    <meta charset='utf-8'>
    <meta name='viewport' content='width=device-width, initial-scale=1.0'>
</head>
<body style='margin:0;padding:0;background-color:#f8fafc;font-family:Arial,sans-serif;'>
    <div style='max-width:600px;margin:0 auto;background-color:#ffffff;'>

        <div style='background:linear-gradient(135deg,#6366f1,#4f46e5);padding:30px;text-align:center;'>
            <h1 style='color:#ffffff;margin:0;font-size:22px;font-weight:800;'>Booking Could Not Be Fulfilled</h1>
            <p style='color:#ffffff;margin:8px 0 0;font-size:12px;opacity:0.9;'>MedZiva Healthcare</p>
        </div>

        <div style='padding:30px;'>
            <h2 style='color:#0f172a;font-size:18px;margin:0 0 15px;'>Dear {$customerName},</h2>

            <p style='color:#475569;font-size:14px;line-height:1.7;margin:0 0 15px;'>
                We're sorry, but we were unable to find a healthcare professional available to fulfill your booking for <strong>{$serviceName}</strong>. We understand this is disappointing and we sincerely apologize for the inconvenience.
            </p>

            <p style='color:#475569;font-size:14px;line-height:1.7;margin:0 0 20px;'>
                <strong>Don't worry — you have not been charged.</strong> Any payment authorization has been automatically released, and no funds will be deducted from your account.
            </p>

            <div style='background-color:#f1f5f9;border-radius:12px;padding:20px;margin:0 0 25px;'>
                <p style='color:#64748b;font-size:11px;font-weight:700;margin:0 0 10px;text-transform:uppercase;letter-spacing:0.5px;'>Cancelled Booking Details</p>
                <table style='width:100%;border-collapse:collapse;'>
                    <tr>
                        <td style='padding:6px 0;color:#64748b;font-size:12px;'>Booking ID</td>
                        <td style='padding:6px 0;color:#0f172a;font-size:12px;font-weight:700;text-align:right;'>{$bookingId}</td>
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
                    <tr>
                        <td style='padding:6px 0;color:#64748b;font-size:12px;border-top:1px solid #e2e8f0;'>Amount</td>
                        <td style='padding:6px 0;color:#6366f1;font-size:14px;font-weight:800;text-align:right;border-top:1px solid #e2e8f0;'>AED {$price} — Not Charged</td>
                    </tr>
                </table>
            </div>

            <p style='color:#475569;font-size:14px;line-height:1.7;margin:0 0 10px;'>
                You're welcome to book again at any time — we have many healthcare professionals available throughout the day.
            </p>

            <div style='text-align:center;margin:25px 0;'>
                <a href='https://medzivahealthcare.com' style='display:inline-block;background:linear-gradient(135deg,#1769b3,#0f5a94);color:#ffffff;text-decoration:none;padding:12px 30px;border-radius:8px;font-size:14px;font-weight:700;'>Book Another Service</a>
            </div>

            <p style='color:#475569;font-size:13px;line-height:1.6;margin:0;'>
                Need help? Reach us at <a href='mailto:booking@medzivahealthcare.com' style='color:#1769b3;'>booking@medzivahealthcare.com</a>
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
