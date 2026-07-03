<?php

namespace App\Services;

use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;

class FileStorageService
{
    public function store(UploadedFile $file, string $directory = 'uploads', string $disk = 'public'): array
    {
        $path = $file->store($directory, $disk);

        return [
            'path' => $path,
            'url' => Storage::disk($disk)->url($path),
            'disk' => $disk,
            'size' => $file->getSize(),
            'mimeType' => $file->getMimeType(),
        ];
    }
}
