<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\File;

class RepairMissingImages extends Command
{
    protected $signature = 'images:repair-missing
                            {--dry-run : Show what would change without making changes}
                            {--frontend-path=../med21/public : Path to the frontend public directory}';

    protected $description = 'Repair missing image paths by mapping to existing images or clearing them';

    /**
     * Map of missing relative DB paths to existing relative DB paths.
     * The source file of the existing path must already exist on disk.
     */
    private array $pathMap = [
        // Therapy category images mapped to actual renamed files
        '/images/services/physiotherapy_session.jpg' => '/images/services/physiotherapy.jpg',
        '/images/services/speech_therapy_session.jpg' => '/images/services/adult-speech-rehabilitation.jpg',
        '/images/services/occupational_therapy_session.jpg' => '/images/services/occupational-therapy.jpg',

        // Product oxygen concentrator reuses the services image
        '/images/products/Oxygen Concentrator 5 ltr.jpg' => '/images/services/oxygen-concentrator-5-ltr.jpg',
    ];

    /**
     * Paths that have no equivalent image and should be cleared.
     */
    private array $clearPaths = [
        '/images/services/Catheterisation at home (Female).jpg',
        '/images/services/IV antibiotics at home (with Dr Prescription).jpg',
        '/images/products/Oxygen Cylinder Set 48cft.jpg',
    ];

    private array $tables = [
        ['table' => 'categories', 'column' => 'image'],
        ['table' => 'subcategories', 'column' => 'image'],
        ['table' => 'services', 'column' => 'image'],
        ['table' => 'products', 'column' => 'image'],
    ];

    public function handle(): int
    {
        $publicPath = $this->frontendPublicPath();
        $dryRun = $this->option('dry-run');

        $this->info('Repairing missing image paths...');
        $this->line("Frontend public path: {$publicPath}");
        $this->newLine();

        if ($dryRun) {
            $this->warn('DRY RUN — no files or database rows will be changed.');
            $this->newLine();
        }

        $copied = 0;
        $remapped = 0;
        $cleared = 0;

        // Copy files that are mapped from one directory to another
        foreach ($this->pathMap as $missing => $existing) {
            if (str_starts_with($missing, '/images/services/') && str_starts_with($existing, '/images/services/')) {
                continue; // same directory, no copy needed
            }

            $source = $publicPath . $existing;
            $target = $publicPath . $missing;

            // Use a slug-based target filename
            $targetSlug = $this->slugTarget($missing);

            if (! File::exists($source)) {
                $this->error("Source file missing, cannot copy: {$existing}");
                continue;
            }

            if (! $dryRun) {
                File::ensureDirectoryExists(dirname($targetSlug));
                File::copy($source, $targetSlug);
            }

            $this->info("Copied: {$existing} -> {$targetSlug}");
            $copied++;

            // Remap DB references from the old missing path to the slug-based copied file
            $newRelative = '/' . ltrim(str_replace($publicPath, '', $targetSlug), '/');
            $this->remapPath($missing, $newRelative, $dryRun);
        }

        // Remap paths that point to existing files in the same directory
        foreach ($this->pathMap as $missing => $existing) {
            if (! str_starts_with($missing, '/images/services/') || ! str_starts_with($existing, '/images/services/')) {
                continue;
            }

            $this->remapPath($missing, $existing, $dryRun);
            $remapped++;
        }

        // Clear paths that have no equivalent image
        foreach ($this->clearPaths as $path) {
            $cleared += $this->clearPath($path, $dryRun);
        }

        $this->newLine();
        $this->info(($dryRun ? 'Would ' : '') . "copy {$copied} file(s), remap {$remapped} path(s), clear " . ($dryRun ? 'would clear ' : '') . "{$cleared} path(s).");

        if (! $dryRun) {
            $this->newLine();
            $this->info('Done. Run `php artisan images:verify` to confirm.');
        }

        return Command::SUCCESS;
    }

    private function remapPath(string $from, string $to, bool $dryRun): void
    {
        foreach ($this->tables as $config) {
            $table = $config['table'];
            $column = $config['column'];

            $count = DB::table($table)
                ->where($column, $from)
                ->count();

            if ($count === 0) {
                continue;
            }

            if (! $dryRun) {
                DB::table($table)
                    ->where($column, $from)
                    ->update([$column => $to]);
            }

            $this->info("Remapped DB [{$table}]: {$from} -> {$to} ({$count} row(s))");
        }
    }

    private function clearPath(string $path, bool $dryRun): int
    {
        $cleared = 0;

        foreach ($this->tables as $config) {
            $table = $config['table'];
            $column = $config['column'];

            $count = DB::table($table)
                ->where($column, $path)
                ->count();

            if ($count === 0) {
                continue;
            }

            if (! $dryRun) {
                DB::table($table)
                    ->where($column, $path)
                    ->update([$column => '']);
            }

            $this->warn("Cleared DB [{$table}]: {$path} ({$count} row(s))");
            $cleared += $count;
        }

        return $cleared;
    }

    private function slugTarget(string $path): string
    {
        $publicPath = $this->frontendPublicPath();
        $basename = basename($path);
        $extension = strtolower(pathinfo($basename, PATHINFO_EXTENSION));
        $name = pathinfo($basename, PATHINFO_FILENAME);
        $slug = \Illuminate\Support\Str::slug($name);

        return $publicPath . '/' . dirname(ltrim($path, '/')) . '/' . $slug . '.' . $extension;
    }

    private function frontendPublicPath(): string
    {
        $configured = $this->option('frontend-path');

        if ($configured && is_dir($configured)) {
            return rtrim(realpath($configured) ?: $configured, '/');
        }

        $sibling = base_path('../med21/public');

        if (is_dir($sibling)) {
            return $sibling;
        }

        return public_path();
    }
}
