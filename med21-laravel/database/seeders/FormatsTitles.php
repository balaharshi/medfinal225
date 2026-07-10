<?php

namespace Database\Seeders;

trait FormatsTitles
{
    /**
     * Normalize dash, slash, and double-dash formatting in titles.
     * "A-B" -> "A - B", "A/B" -> "A / B", "A--B" -> "A - B"
     */
    protected function fmt(string $title): string
    {
        $title = preg_replace('/\s*-\s*-\s*/', ' - ', $title);   // "--" -> " - "
        $title = preg_replace('/(?<=[^\s])-(?=[^\s])/', ' - ', $title); // "-" -> " - "
        $title = preg_replace('/(?<=[^\s])\/(?=[^\s])/', ' / ', $title); // "/" -> " / "
        return $title;
    }
}
