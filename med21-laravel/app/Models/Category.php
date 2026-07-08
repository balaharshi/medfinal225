<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Relations\HasMany;

class Category extends BaseModel
{
    protected $fillable = ['title', 'image', 'slug', 'type', 'description'];

    public function subcategories(): HasMany
    {
        return $this->hasMany(Subcategory::class);
    }
}
