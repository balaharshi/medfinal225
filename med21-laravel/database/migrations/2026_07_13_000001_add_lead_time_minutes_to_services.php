<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('services', function (Blueprint $table): void {
            $table->integer('lead_time_minutes')->nullable()->after('booking_notice');
            $table->integer('booking_notice_minutes')->nullable()->after('lead_time_minutes');
        });

        $parsed = DB::table('services')->whereNotNull('booking_notice')->pluck('booking_notice', 'id');
        $updates = [];

        foreach ($parsed as $id => $text) {
            $minutes = $this->parseMinutes($text);
            $updates[] = ['id' => $id, 'lead_time_minutes' => $minutes, 'booking_notice_minutes' => $minutes];
        }

        foreach ($updates as $row) {
            DB::table('services')->where('id', $row['id'])->update([
                'lead_time_minutes' => $row['lead_time_minutes'],
                'booking_notice_minutes' => $row['booking_notice_minutes'],
            ]);
        }
    }

    public function down(): void
    {
        Schema::table('services', function (Blueprint $table): void {
            $table->dropColumn(['lead_time_minutes', 'booking_notice_minutes']);
        });
    }

    private function parseMinutes(string $text): ?int
    {
        $text = strtolower(trim($text));
        $text = preg_replace('/\s*prior\s+booking\s*/i', '', $text);

        if (preg_match('/(\d+)\s*(hour|hr|h)/', $text, $m)) {
            return (int) $m[1] * 60;
        }

        if (preg_match('/(\d+)\s*(min|minute)/', $text, $m)) {
            return (int) $m[1];
        }

        if (preg_match('/(\d+)\s*(day|d)/', $text, $m)) {
            return (int) $m[1] * 1440;
        }

        return null;
    }
};
