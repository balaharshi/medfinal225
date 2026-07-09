<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Third Party Services
    |--------------------------------------------------------------------------
    |
    | This file is for storing the credentials for third party services such
    | as Mailgun, Postmark, AWS and more. This file provides the de facto
    | location for this type of information, allowing packages to have
    | a conventional file to locate the various service credentials.
    |
    */

    'postmark' => [
        'key' => env('POSTMARK_API_KEY'),
    ],

    'resend' => [
        'key' => env('RESEND_API_KEY'),
    ],

    'google' => [
        'client_id' => env('GOOGLE_CLIENT_ID'),
        'admin_emails' => env('GOOGLE_ADMIN_EMAILS', ''),
    ],

    'ses' => [
        'key' => env('AWS_ACCESS_KEY_ID'),
        'secret' => env('AWS_SECRET_ACCESS_KEY'),
        'region' => env('AWS_DEFAULT_REGION', 'us-east-1'),
    ],

    'slack' => [
        'notifications' => [
            'bot_user_oauth_token' => env('SLACK_BOT_USER_OAUTH_TOKEN'),
            'channel' => env('SLACK_BOT_USER_DEFAULT_CHANNEL'),
        ],
    ],

    'enbdpay' => [
        'base_url' => env('ENBDPAY_BASE_URL', 'https://enbduat-acquiring-apigw.creditpluspinelabs.com'),
        'username' => env('ENBDPAY_USERNAME'),
        'api_key' => env('ENBDPAY_API_KEY'),
        'currency' => env('ENBDPAY_CURRENCY', 'AED'),
        'payment_method' => env('ENBDPAY_PAYMENT_METHOD', 'CARD'),
        'transaction_type' => env('ENBDPAY_TRANSACTION_TYPE', 'AUTH'),
        'redirect_url' => env('ENBDPAY_REDIRECT_URL'),
        'webhook_url' => env('ENBDPAY_WEBHOOK_URL'),
        'webhook_secret' => env('ENBDPAY_WEBHOOK_SECRET'),
        'mock' => env('ENBDPAY_MOCK', true),
    ],

    'pusher' => [
        'app_id' => env('PUSHER_APP_ID'),
        'key' => env('PUSHER_KEY'),
        'secret' => env('PUSHER_SECRET'),
        'cluster' => env('PUSHER_CLUSTER'),
        'use_tls' => env('PUSHER_USE_TLS', true),
        'channel' => env('PUSHER_CHANNEL', 'medziva-notifications'),
    ],

    'whatsapp' => [
        'token' => env('WHATSAPP_TOKEN'),
        'phone_number_id' => env('WHATSAPP_PHONE_NUMBER_ID'),
        'base_url' => env('WHATSAPP_BASE_URL', 'https://graph.facebook.com/v21.0'),
        'webhook_verify_token' => env('WHATSAPP_WEBHOOK_VERIFY_TOKEN', 'medziva_verify'),
        'business_phone' => env('WHATSAPP_BUSINESS_PHONE', '971559510794'),
    ],

];
