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
];
