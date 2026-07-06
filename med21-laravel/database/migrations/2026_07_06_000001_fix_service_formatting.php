<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        $services = DB::table('services')->get();

        foreach ($services as $service) {
            $name = $service->title ?? '';
            $description = $service->description ?? '';
            $notes = $service->booking_notes ?? '';

            // Fix title case and spacing around hyphens
            $name = $this->fixServiceName($name);

            // Fix description - remove vendor-specific text, fix typos
            $description = $this->fixServiceDescription($description);

            // Fix booking notes - remove vendor-specific text
            $notes = $this->fixBookingNotes($notes);

            // Override specific descriptions based on service name
            if (stripos($name, 'physiotherapy') !== false) {
                if (stripos($name, 'session/week') !== false || stripos($name, '6 sessions') !== false) {
                    $name = 'Physiotherapy - 1 Hour Session/Week - 6 Sessions';
                } else {
                    $name = 'Physiotherapy - 1 Hour Session';
                }
                $description = 'A dedicated hour with a certified physiotherapist to assess, treat, and rehabilitate — helping you move better and recover faster.';
            }

            DB::table('services')
                ->where('id', $service->id)
                ->update([
                    'title' => $name,
                    'description' => $description,
                    'booking_notes' => $notes,
                ]);
        }
    }

    public function down(): void
    {
        // No rollback needed - data fixes are one-way
    }

    private function fixServiceName(string $name): string
    {
        // Fix common misspellings
        $name = str_ireplace('physiotherapy', 'Physiotherapy', $name);
        $name = str_ireplace('physiotheraphy', 'Physiotherapy', $name);
        $name = str_ireplace('physio', 'Physio', $name);

        // Add spaces around hyphens if missing
        $name = preg_replace('/(\w)-(\w)/', '$1 - $2', $name);
        $name = preg_replace('/(\w)-\s/', '$1 - ', $name);
        $name = preg_replace('/\s-(\w)/', ' - $1', $name);

        // Fix title case for common words
        $name = preg_replace('/\b(\w)/', function ($matches) {
            return strtoupper($matches[1]);
        }, $name);

        // Fix specific patterns that shouldn't be title case
        $lowercaseWords = ['and', 'or', 'the', 'for', 'with', 'in', 'on', 'at', 'to', 'a', 'an'];
        foreach ($lowercaseWords as $word) {
            $name = preg_replace('/\b' . $word . '\b/i', strtolower($word), $name);
        }

        // Fix numbers and sessions
        $name = preg_replace('/(\d+)\s*(hour|hours|session|sessions|day|days|week|weeks|month|months)/i', '$1 $2', $name);

        // Clean up extra spaces
        $name = preg_replace('/\s+/', ' ', trim($name));

        return $name;
    }

    private function fixServiceDescription(string $description): string
    {
        if (empty($description)) {
            return $description;
        }

        // Remove vendor-specific text patterns
        $patterns = [
            '/\d+\s*hours?\s*(prior|before|notice)\s*(for\s*vendor\s*\d+(\s*and\s*\d+)?)?/i',
            '/\d+\s*days?\s*(prior|before|notice)\s*(for\s*vendor\s*\d+(\s*and\s*\d+)?)?/i',
            '/vendor\s*\d+(\s*and\s*\d+)?/i',
            '/prior\s*notice\s*for\s*vendor/i',
            '/hours?\s*prior\s*for\s*vendor/i',
            '/days?\s*prior\s*for\s*vendor/i',
        ];

        foreach ($patterns as $pattern) {
            $description = preg_replace($pattern, '', $description);
        }

        // Fix typos
        $description = str_ireplace('prioir', 'prior', $description);
        $description = str_ireplace('prior ', 'prior ', $description);

        // Clean up extra spaces
        $description = preg_replace('/\s+/', ' ', trim($description));

        return $description;
    }

    private function fixBookingNotes(string $notes): string
    {
        if (empty($notes)) {
            return $notes;
        }

        // Remove vendor-specific text patterns
        $patterns = [
            '/\d+\s*hours?\s*(prior|before|notice)\s*(for\s*vendor\s*\d+(\s*and\s*\d+)?)?/i',
            '/\d+\s*days?\s*(prior|before|notice)\s*(for\s*vendor\s*\d+(\s*and\s*\d+)?)?/i',
            '/vendor\s*\d+(\s*and\s*\d+)?/i',
            '/prior\s*notice\s*for\s*vendor/i',
            '/hours?\s*prior\s*for\s*vendor/i',
            '/days?\s*prior\s*for\s*vendor/i',
        ];

        foreach ($patterns as $pattern) {
            $notes = preg_replace($pattern, '', $notes);
        }

        // Fix typos
        $notes = str_ireplace('prioir', 'prior', $notes);

        // Clean up extra spaces and commas
        $notes = preg_replace('/\s+/', ' ', $notes);
        $notes = preg_replace('/,\s*,/', ',', $notes);
        $notes = preg_replace('/^\s*,/', '', $notes);
        $notes = preg_replace('/,\s*$/', '', $notes);

        return trim($notes);
    }
};
