<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Subcategory extends BaseModel
{
    protected $fillable = ['id', 'category_id', 'title', 'slug', 'image'];

    public function category(): BelongsTo
    {
        return $this->belongsTo(Category::class);
    }
}
