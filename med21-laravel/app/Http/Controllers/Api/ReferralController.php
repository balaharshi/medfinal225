<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\ReferralService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ReferralController extends Controller
{
    public function __construct(private readonly ReferralService $referralService)
    {
    }

    public function getCode(Request $request): JsonResponse
    {
        $code = $this->referralService->getCode($request->user()->id);
        if (! $code) {
            return response()->json(['message' => 'No referral code found. Generate one first.'], 404);
        }

        return response()->json($code);
    }

    public function getStats(Request $request): JsonResponse
    {
        return response()->json($this->referralService->getStats($request->user()->id));
    }

    public function getHistory(Request $request): JsonResponse
    {
        return response()->json($this->referralService->getHistory($request->user()->id));
    }

    public function applyCode(Request $request): JsonResponse
    {
        $request->validate([
            'code' => 'required|string|max:20',
        ]);

        return response()->json(
            $this->referralService->applyCode($request->input('code'), $request->user()->id)
        );
    }

    public function getConfig(): JsonResponse
    {
        return response()->json($this->referralService->getConfig());
    }

    public function updateConfig(Request $request): JsonResponse
    {
        $request->validate([
            'referrerReward' => 'integer|min:0',
            'friendDiscount' => 'integer|min:0',
            'vestingDays' => 'integer|min:1|max:365',
            'maxPerYear' => 'integer|min:1',
        ]);

        return response()->json($this->referralService->updateConfig($request->all()));
    }

    public function adminGetAll(): JsonResponse
    {
        return response()->json($this->referralService->adminGetAll());
    }

    public function adminRevoke(string $id): JsonResponse
    {
        return response()->json($this->referralService->adminRevoke($id));
    }
}
