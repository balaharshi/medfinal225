<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Str;

class VerifyImages extends Command
{
    protected $signature = 'images:verify
                            {--fix : Update DB paths that differ only by slug formatting (spaces vs dashes)}
                            {--rename : Rename files on disk to match slug-based DB paths}';

    protected $description = 'Verify that DB image paths exist on disk and report mismatches';

    private array $tables = [
        ['table' => 'categories', 'column' => 'image'],
        ['table' => 'subcategories', 'column' => 'image'],
        ['table' => 'services', 'column' => 'image'],
        ['table' => 'products', 'column' => 'image'],
    ];

    public function handle(): int
    {
        $this->info('Verifying image paths...');
        $this->newLine();

        $publicPath = $this->frontendPublicPath();
        $missing = [];
        $empty = [];
        $ok = [];

        $this->line("Checking files under: {$publicPath}");
        $this->newLine();

        foreach ($this->tables as $config) {
            $table = $config['table'];
            $column = $config['column'];

            $rows = DB::table($table)
                ->select('id', $column)
                ->whereNotNull($column)
                ->where($column, '!=', '')
                ->get();

            foreach ($rows as $row) {
                $path = $row->{$column};
                $diskPath = $this->diskPath($publicPath, $path);

                if ($diskPath === null) {
                    $empty[] = ['table' => $table, 'id' => $row->id, 'path' => $path, 'issue' => 'external or invalid URL'];
                    continue;
                }

                if (File::exists($diskPath)) {
                    $ok[] = ['table' => $table, 'id' => $row->id, 'path' => $path];
                } else {
                    $missing[] = [
                        'table' => $table,
                        'id' => $row->id,
                        'path' => $path,
                        'slug' => $this->slugFilename($path),
                    ];
                }
            }
        }

        if (! empty($ok)) {
            $this->info("✓ Found " . count($ok) . " valid image paths.");
        }

        if (! empty($empty)) {
            $this->warn("⚠ " . count($empty) . " rows use external URLs or invalid paths (not checked):");
            $this->table(['Table', 'ID', 'Path', 'Issue'], $empty);
            $this->newLine();
        }

        if (! empty($missing)) {
            $this->error("✗ Found " . count($missing) . " missing image files:");
            $this->table(['Table', 'ID', 'Path', 'Suggested slug filename'], $missing);
            $this->newLine();
            return Command::FAILURE;
        }

        $this->info('All local image paths are valid.');
        return Command::SUCCESS;
    }

    private function diskPath(string $publicPath, string $path): ?string
    {
        // External URLs are not verified locally
        if (Str::startsWith($path, ['http://', 'https://', 'data:'])) {
            return null;
        }

        $path = ltrim($path, '/');

        if (empty($path)) {
            return null;
        }

        return $publicPath . '/' . $path;
    }

    private function frontendPublicPath(): string
    {
        $configured = config('medziva.frontend_public_path');

        if ($configured && is_dir($configured)) {
            return rtrim($configured, '/');
        }

        // Default: sibling med21/public directory relative to this Laravel app
        $sibling = base_path('../med21/public');

        if (is_dir($sibling)) {
            return $sibling;
        }

        return public_path();
    }

    private function slugFilename(string $path): string
    {
        $basename = basename($path);
        $extension = pathinfo($basename, PATHINFO_EXTENSION);
        $name = pathinfo($basename, PATHINFO_FILENAME);

        return Str::slug($name) . (empty($extension) ? '' : '.' . strtolower($extension));
    }
}
