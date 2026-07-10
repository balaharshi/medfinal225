<?php

namespace App\Console\Commands;

use App\Constants\AppConstants;
use App\Models\Booking;
use App\Support\CaseKeys;
use Carbon\Carbon;
use Illuminate\Console\Command;

class SendBookingReminders extends Command
{
    protected $signature = 'bookings:send-reminders';

    protected $description = 'Send reminders for bookings happening within 24 hours, only if booked more than 48 hours ago';

    public function handle(): int
    {
        $now = now();
        $in24h = $now->copy()->addHours(24);
        $in26h = $now->copy()->addHours(26); // wider window to catch edge cases

        // Find active bookings with appointments within the next 24-26 hours
        $bookings = Booking::query()
            ->where('status', AppConstants::BOOKING_STATUSES['ACTIVE'])
            ->whereNotNull('vendor_id')
            ->get()
            ->filter(function (Booking $booking) use ($now, $in24h, $in26h) {
                try {
                    $slotParts = explode('-', str_replace(' ', '', $booking->time_slot));
                    $startStr = $slotParts[0] ?? '00:00';
                    $appointmentTime = Carbon::parse($booking->date . ' ' . $startStr);
                } catch (\Throwable) {
                    $appointmentTime = Carbon::parse($booking->date);
                }

                // Must be within 24-26 hour window (send once per booking)
                if ($appointmentTime->lt($in24h) || $appointmentTime->gt($in26h)) {
                    return false;
                }

                // Only send if booking was made at least 48 hours before appointment
                $bookingCreatedAt = $booking->created_at ?? $now;
                $hoursBetweenBookingAndAppointment = $bookingCreatedAt->diffInHours($appointmentTime);

                return $hoursBetweenBookingAndAppointment >= 48;
            });

        $sent = 0;
        foreach ($bookings as $booking) {
            try {
                $email = $booking->customer_email;
                if (! $email || $email === 'guest@example.com') {
                    continue;
                }

                \Mail::to($email)->send(new \App\Mail\BookingReminder(
                    CaseKeys::camelize($booking->toArray())
                ));
                $sent++;
            } catch (\Throwable $e) {
                $this->warn("Failed to send reminder for booking {$booking->id}: {$e->getMessage()}");
            }
        }

        $this->info("Sent {$sent} booking reminder(s).");
        return self::SUCCESS;
    }
}
