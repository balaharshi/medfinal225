<?php

namespace App\Models\Concerns;

trait UsesStringPrimaryKey
{
    public function initializeUsesStringPrimaryKey(): void
    {
        $this->incrementing = false;
        $this->keyType = 'string';
    }
}
