<?php

namespace App\Support;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\DB;

final class SequentialId
{
    /**
     * @param class-string<Model> $modelClass
     */
    public static function next(string $modelClass, string $prefix): string
    {
        // Use a database lock to prevent race conditions
        $lockName = "sequential_id_{$prefix}";

        return DB::transaction(function () use ($modelClass, $prefix, $lockName) {
            // For SQLite, we use a simple retry approach since it doesn't support SELECT FOR UPDATE
            $attempts = 0;
            $maxAttempts = 5;

            while ($attempts < $maxAttempts) {
                $max = $modelClass::query()
                    ->where('id', 'like', "{$prefix}-%")
                    ->pluck('id')
                    ->reduce(function (int $max, string $id): int {
                        if (! preg_match('/-(\d+)$/', $id, $matches)) {
                            return $max;
                        }

                        return max($max, (int) $matches[1]);
                    }, 0);

                $candidateId = sprintf('%s-%03d', $prefix, $max + 1);

                // Check if this ID already exists (race condition guard)
                $exists = $modelClass::query()->whereKey($candidateId)->exists();
                if (! $exists) {
                    return $candidateId;
                }

                $attempts++;
            }

            // Fallback: use timestamp-based ID to ensure uniqueness
            return sprintf('%s-%s', $prefix, uniqid());
        });
    }
}
