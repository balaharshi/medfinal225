<?php

namespace App\Http\Resources;

use App\Support\CaseKeys;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class BaseResource extends JsonResource
{
    public static $wrap = null;

    public function toArray(Request $request): array
    {
        return CaseKeys::camelize(parent::toArray($request));
    }
}
