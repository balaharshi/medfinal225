<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class EnquirySubmitted extends Notification
{
    use Queueable;

    public function __construct(private readonly array $enquiry)
    {
    }

    public function via(object $notifiable): array
    {
        return ['mail'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        return (new MailMessage)
            ->subject('New MedZiva enquiry')
            ->line('A new enquiry has been submitted.')
            ->line('Service: '.($this->enquiry['serviceTitle'] ?? 'General Interest'))
            ->line('Customer: '.($this->enquiry['customerName'] ?? 'Guest'));
    }
}
