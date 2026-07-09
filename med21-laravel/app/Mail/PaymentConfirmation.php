<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class PaymentConfirmation extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(
        public array $booking
    ) {}

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: "Payment Received - {$this->booking['serviceTitle'] ?? $this->booking['service_title'] ?? 'Healthcare Service'}",
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
        <!-- Header -->
        <div style='background:linear-gradient(135deg,#82c342,#6ba836);padding:30px;text-align:center;'>
            <h1 style='color:#ffffff;margin:0;font-size:24px;font-weight:800;'>Payment Confirmed</h1>
            <p style='color:#ffffff;margin:8px 0 0;font-size:12px;opacity:0.9;'>MedZiva Healthcare</p>
        </div>

        <!-- Body -->
        <div style='padding:30px;'>
            <div style='text-align:center;margin:0 0 25px;'>
                <div style='width:60px;height:60px;background-color:#dcfce7;border-radius:50%;margin:0 auto 15px;line-height:60px;font-size:28px;'>&#10003;</div>
                <h2 style='color:#0f172a;font-size:18px;margin:0;'>Thank you, {$customerName}!</h2>
                <p style='color:#475569;font-size:13px;margin:8px 0 0;'>Your payment has been successfully processed.</p>
            </div>

            <!-- Payment Details Card -->
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
                        <td style='padding:8px 0;color:#64748b;font-size:12px;font-weight:600;border-top:1px solid #e2e8f0;'>Amount Paid</td>
                        <td style='padding:8px 0;color:#82c342;font-size:18px;font-weight:800;text-align:right;border-top:1px solid #e2e8f0;'>AED {$price}</td>
                    </tr>
                </table>
            </div>

            <p style='color:#475569;font-size:13px;line-height:1.6;margin:0 0 15px;'>
                Your booking is now confirmed and a healthcare professional will be dispatched at the scheduled time. Please ensure someone is available at the provided address.
            </p>

            <p style='color:#475569;font-size:13px;line-height:1.6;margin:0 0 20px;'>
                For any changes or cancellations, please contact us at least 24 hours before your scheduled appointment.
            </p>
        </div>

        <!-- Footer -->
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
