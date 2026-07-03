<?php

namespace App\Support;

use Illuminate\Database\Eloquent\Model;

final class SequentialId
{
    /**
     * @param class-string<Model> $modelClass
     */
    public static function next(string $modelClass, string $prefix): string
    {
        $max = $modelClass::query()
            ->where('id', 'like', "{$prefix}-%")
            ->pluck('id')
            ->reduce(function (int $max, string $id): int {
                if (! preg_match('/-(\d+)$/', $id, $matches)) {
                    return $max;
                }

                return max($max, (int) $matches[1]);
            }, 0);

        return sprintf('%s-%03d', $prefix, $max + 1);
    }
}
