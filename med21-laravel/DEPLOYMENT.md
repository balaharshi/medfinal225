# Laravel Production Deployment

1. Set `APP_ENV=production`, `APP_DEBUG=false`, `APP_KEY`, MySQL credentials, `FRONTEND_URL`, and provider secrets.
2. Run `composer install --no-dev --optimize-autoloader`.
3. Run `php artisan migrate --force` against MySQL 8.
4. Run `php artisan storage:link` if public uploads are used.
5. Run `php artisan config:cache`, `php artisan route:cache`, and `php artisan view:cache`.
6. Serve `public/index.php` through PHP-FPM and point the unchanged frontend API base URL to this Laravel API.
