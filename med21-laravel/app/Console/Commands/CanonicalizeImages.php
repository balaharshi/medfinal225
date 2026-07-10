<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Str;

class CanonicalizeImages extends Command
{
    protected $signature = 'images:canonicalize
                            {--dry-run : Show what would change without making changes}
                            {--frontend-path=../med21/public : Path to the frontend public directory}';

    protected $description = 'Rename image files to URL-safe slugs and update DB paths';

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

        $this->info('Canonicalizing image filenames...');
        $this->line("Frontend public path: {$publicPath}");
        $this->newLine();

        if ($dryRun) {
            $this->warn('DRY RUN — no files or database rows will be changed.');
            $this->newLine();
        }

        $renameMap = $this->buildRenameMap($publicPath);

        if (empty($renameMap)) {
            $this->info('No files need renaming.');
        } else {
            $this->info('Files to rename:');
            $rows = [];
            foreach ($renameMap as $old => $new) {
                $rows[] = [str_replace($publicPath, '', $old), str_replace($publicPath, '', $new)];
            }
            $this->table(['Old path', 'New path'], $rows);

            if (! $dryRun) {
                foreach ($renameMap as $old => $new) {
                    File::move($old, $new);
                }
                $this->info('Files renamed.');
            }
        }

        $this->newLine();

        $updates = $this->updateDatabasePaths($publicPath, $renameMap, $dryRun);

        if ($updates === 0) {
            $this->info('No database paths needed updating.');
        } else {
            $this->info(($dryRun ? 'Would update' : 'Updated') . " {$updates} database path(s).");
        }

        $this->newLine();
        $this->info('Done. Run `php artisan images:verify` to confirm.');

        return Command::SUCCESS;
    }

    private function buildRenameMap(string $publicPath): array
    {
        $map = [];
        $imageDirs = ['images/services', 'images/products'];

        foreach ($imageDirs as $dir) {
            $fullDir = $publicPath . '/' . $dir;
            if (! is_dir($fullDir)) {
                continue;
            }

            foreach (File::files($fullDir) as $file) {
                $basename = $file->getFilename();

                // Skip hidden files and backups
                if (str_starts_with($basename, '.') || str_ends_with($basename, '.backup')) {
                    continue;
                }

                $slugName = $this->slugFilename($basename);

                if ($slugName === $basename) {
                    continue;
                }

                $oldPath = $file->getPathname();
                $newPath = $file->getPath() . '/' . $slugName;

                // Avoid collisions by appending a counter
                $counter = 1;
                $originalNewPath = $newPath;
                while (isset($map[$newPath]) || ($this->fileExistsAndIsDifferent($oldPath, $newPath))) {
                    $info = pathinfo($originalNewPath);
                    $newPath = $info['dirname'] . '/' . $info['filename'] . '-' . $counter . '.' . $info['extension'];
                    $counter++;
                }

                $map[$oldPath] = $newPath;
            }
        }

        return $map;
    }

    private function updateDatabasePaths(string $publicPath, array $renameMap, bool $dryRun): int
    {
        // Build a map keyed by relative old path -> relative new path
        $relativeMap = [];
        foreach ($renameMap as $old => $new) {
            $oldRelative = '/' . ltrim(str_replace($publicPath, '', $old), '/');
            $newRelative = '/' . ltrim(str_replace($publicPath, '', $new), '/');
            $relativeMap[$oldRelative] = $newRelative;
        }

        $updated = 0;

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

                if (! isset($relativeMap[$path])) {
                    continue;
                }

                if (! $dryRun) {
                    DB::table($table)
                        ->where('id', $row->id)
                        ->update([$column => $relativeMap[$path]]);
                }

                $updated++;
            }
        }

        return $updated;
    }

    private function slugFilename(string $basename): string
    {
        $extension = strtolower(pathinfo($basename, PATHINFO_EXTENSION));
        $name = pathinfo($basename, PATHINFO_FILENAME);

        $slug = Str::slug($name);

        return $slug . (empty($extension) ? '' : '.' . $extension);
    }

    private function fileExistsAndIsDifferent(string $source, string $target): bool
    {
        if (! File::exists($target)) {
            return false;
        }

        // On case-insensitive filesystems the target may be the source file itself.
        // Compare inodes to be certain.
        $sourceStat = @stat($source);
        $targetStat = @stat($target);

        if ($sourceStat && $targetStat && $sourceStat['ino'] === $targetStat['ino']) {
            return false;
        }

        return true;
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
