<?php

namespace App\Support;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Contracts\Support\Arrayable;
use Illuminate\Support\Str;

final class CaseKeys
{
    public static function camelize(mixed $value): mixed
    {
        if ($value instanceof Model) {
            $value = $value->toArray();
        }

        if ($value instanceof Arrayable) {
            $value = $value->toArray();
        }

        if (! is_array($value)) {
            return $value;
        }

        $result = [];
        foreach ($value as $key => $item) {
            $result[is_string($key) ? Str::camel($key) : $key] = self::camelize($item);
        }

        return $result;
    }

    public static function snakePayload(array $payload): array
    {
        $result = [];
        foreach ($payload as $key => $value) {
            $result[Str::snake($key)] = $value;
        }

        return $result;
    }
}
