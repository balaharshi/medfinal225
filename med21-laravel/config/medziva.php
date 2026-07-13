<?php

return [
    /*
    |--------------------------------------------------------------------------
    | Frontend Public Path
    |--------------------------------------------------------------------------
    |
    | Absolute path to the React/Vite frontend's public directory. This is
    | used by image verification and canonicalization commands to check that
    | DB image paths actually exist on disk.
    |
    */
    'frontend_public_path' => env('FRONTEND_PUBLIC_PATH', base_path('../med21/public')),

    /*
    |--------------------------------------------------------------------------
    | Image Registry
    |--------------------------------------------------------------------------
    |
    | Canonical image mappings for every service and product. Seeders and
    | migrations should read from this registry to ensure consistent image
    | paths across the application.
    |
    | Preferred: config('medziva-images.services.some-slug')
    | Fallback: config('medziva-images.defaults.iv-therapy')
    |
    */
    'images' => [
        'services' => [
            'iv-therapy' => [
                'skin-glow-iv-therapy' => 'skin-glow-iv-therapy.jpg',
                'hair-skin-nail-care-iv-therapy' => 'hair-skin-nail-care-iv-therapy.jpg',
                'energy-weight-loss-iv-therapy' => 'energy-weight-loss-iv-therapy.jpg',
                'immune-hydration-drip' => 'immune-hydration-drip.jpg',
                'antistress-relax-iv-therapy' => 'antistress-relax-iv-therapy.jpg',
                'gut-cleanse-acne-cure-iv-therapy' => 'gut-cleanse-acne-cure-iv-therapy.jpg',
                'memory-boost-focus-iv-therapy' => 'memory-boost-focus-iv-therapy.jpg',
                'surgery-recovery-iv-therapy' => 'surgery-recovery-iv-therapy.jpg',
                'women-health-fertility-iv-therapy' => 'women-health-fertility-iv-therapy.jpg',
                'men-power-iv-drip' => 'men-power-iv-drip.jpg',
                'liver-detox-drip-after-party' => 'liver-detox-drip-after-party.jpg',
            ],
        ],
        'products' => [],
        'lab-tests' => [],
        'defaults' => [
            'iv-therapy' => 'https://images.unsplash.com/photo-1631563016585-64a1e38db6b1?auto=format&fit=crop&q=80&w=400',
            'service' => 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&q=80&w=400',
            'product' => 'https://images.unsplash.com/photo-1576091160550-2173dba999ef?auto=format&fit=crop&q=80&w=400',
        ],
    ],
];
