<?php

namespace App\Observers;

use App\Models\Product;
use App\Models\Service;
use Illuminate\Support\Facades\File;

class ImagePathObserver
{
    public function saving(Service|Product $model): void
    {
        if (! $model->isDirty('image')) {
            return;
        }

        $image = $model->image;

        if (empty($image)) {
            return;
        }

        if (str_starts_with($image, 'http://') || str_starts_with($image, 'https://')) {
            return;
        }

        $publicPath = config('medziva.frontend_public_path');
        $fullPath = $publicPath . '/' . ltrim($image, '/');

        if (! File::exists($fullPath)) {
            $modelName = class_basename($model);
            \Illuminate\Support\Facades\Log::warning("Image path not found on disk for {$modelName} #{$model->id}: {$image}");
        }
    }
}
