<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Relations\HasMany;

class Category extends BaseModel
{
    public function subcategories(): HasMany
    {
        return $this->hasMany(Subcategory::class);
    }
}
