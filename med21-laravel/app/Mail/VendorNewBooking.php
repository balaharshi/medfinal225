<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class VendorNewBooking extends Mailable implements ShouldQueue
{
    use Queueable, SerializesModels;

    public function __construct(
        public array $booking,
        public string $vendorName
    ) {}

    public function envelope(): Envelope
    {
        $title = $this->booking['serviceTitle'] ?? $this->booking['service_title'] ?? 'Healthcare Service';
        return new Envelope(
            subject: "New Booking Available - {$title}",
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
        $vendorName = htmlspecialchars($this->vendorName);
        $serviceName = htmlspecialchars($booking['serviceTitle'] ?? $booking['service_title'] ?? 'Healthcare Service');
        $customerName = htmlspecialchars($booking['customerName'] ?? $booking['customer_name'] ?? 'Customer');
        $bookingId = htmlspecialchars($booking['id'] ?? 'N/A');
        $date = htmlspecialchars($booking['date'] ?? 'N/A');
        $timeSlot = htmlspecialchars($booking['timeSlot'] ?? $booking['time_slot'] ?? 'N/A');
        $region = htmlspecialchars($booking['region'] ?? 'N/A');
        $price = number_format($booking['price'] ?? 0);
        $notes = htmlspecialchars($booking['notes'] ?? '');

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
        <div style='background:linear-gradient(135deg,#7c3aed,#6d28d9);padding:30px;text-align:center;'>
            <h1 style='color:#ffffff;margin:0;font-size:24px;font-weight:800;'>New Booking Available</h1>
            <p style='color:#ffffff;margin:8px 0 0;font-size:12px;opacity:0.9;'>MedZiva Vendor Portal</p>
        </div>

        <!-- Body -->
        <div style='padding:30px;'>
            <h2 style='color:#0f172a;font-size:18px;margin:0 0 10px;'>Hello {$vendorName},</h2>
            <p style='color:#475569;font-size:14px;line-height:1.6;margin:0 0 20px;'>
                A new booking is available for your services. Please review the details below and accept the booking through your vendor dashboard.
            </p>

            <!-- Booking Details Card -->
            <div style='background-color:#f5f3ff;border-radius:12px;padding:20px;margin:0 0 20px;border:1px solid #e9d5ff;'>
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
                        <td style='padding:8px 0;color:#64748b;font-size:12px;font-weight:600;'>Customer</td>
                        <td style='padding:8px 0;color:#0f172a;font-size:13px;font-weight:700;text-align:right;'>{$customerName}</td>
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
                        <td style='padding:8px 0;color:#64748b;font-size:12px;font-weight:600;'>Region</td>
                        <td style='padding:8px 0;color:#0f172a;font-size:13px;font-weight:700;text-align:right;'>{$region}</td>
                    </tr>
                    <tr>
                        <td style='padding:8px 0;color:#64748b;font-size:12px;font-weight:600;border-top:1px solid #e9d5ff;'>Booking Value</td>
                        <td style='padding:8px 0;color:#7c3aed;font-size:16px;font-weight:800;text-align:right;border-top:1px solid #e9d5ff;'>AED {$price}</td>
                    </tr>
                </table>
            </div>

            " . ($notes ? "
            <div style='background-color:#fffbeb;border-radius:8px;padding:15px;margin:0 0 20px;border:1px solid #fde68a;'>
                <p style='color:#92400e;font-size:11px;font-weight:700;margin:0 0 5px;text-transform:uppercase;'>Customer Notes</p>
                <p style='color:#78350f;font-size:12px;margin:0;line-height:1.5;'>{$notes}</p>
            </div>
            " : "") . "

            <div style='text-align:center;margin:25px 0;'>
                <a href='https://medzivahealthcare.com/vendor' style='display:inline-block;background-color:#7c3aed;color:#ffffff;padding:12px 30px;border-radius:8px;text-decoration:none;font-weight:700;font-size:13px;'>View in Vendor Portal</a>
            </div>

            <p style='color:#475569;font-size:12px;line-height:1.5;margin:0 0 10px;'>
                Please accept this booking within 30 minutes to maintain your vendor rating. Bookings not accepted will be reassigned.
            </p>
        </div>

        <div style='background-color:#f1f5f9;padding:20px;text-align:center;'>
            <p style='color:#94a3b8;font-size:11px;margin:0 0 5px;'>MedZiva International Healthcare L.L.C.</p>
            <p style='color:#94a3b8;font-size:11px;margin:0;'>Dubai, United Arab Emirates | medzivahealthcare.com</p>
        </div>
    </div>
</body>
</html>";
    }
}
