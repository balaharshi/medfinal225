<?php

return [
    'paths' => ['api/*', 'sanctum/csrf-cookie'],

    'allowed_methods' => ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],

    'allowed_origins' => array_values(array_filter(array_map('trim', explode(
        ',',
        env(
            'CORS_ORIGIN',
            env(
                'CLIENT_ORIGIN',
                env(
                    'FRONTEND_URL',
                    'http://localhost:3000,http://localhost:5173,https://medzivahealthcare.com,https://staging.medzivahealthcare.com'
                )
            )
        )
    )))),

    'allowed_origins_patterns' => [],

    'allowed_headers' => ['Authorization', 'Content-Type', 'X-Requested-With', 'Accept', 'Origin'],

    'exposed_headers' => [],

    'max_age' => 86400,

    'supports_credentials' => true,
];
