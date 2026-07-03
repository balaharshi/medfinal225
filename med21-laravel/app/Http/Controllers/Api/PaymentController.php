<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\EnbdpayService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class PaymentController extends Controller
{
    public function __construct(private readonly EnbdpayService $enbdpayService)
    {
    }

    public function createEnbdpayCheckout(Request $request): JsonResponse
    {
        return response()->json(['success' => true, 'checkout' => $this->enbdpayService->createCheckoutTransaction($request->all())], 201);
    }

    public function getEnbdpayStatus(Request $request): JsonResponse
    {
        return response()->json(['success' => true, 'status' => $this->enbdpayService->checkCheckoutStatus($request->only(['appUtr', 'transactionUtr']))]);
    }

    public function enbdpayWebhook(Request $request): JsonResponse
    {
        Log::info('ENBDpay webhook received');
        $result = $this->enbdpayService->recordWebhookPaymentStatus(
            $request->all(),
            $request->headers->all()
        );

        return response()->json(['success' => true, ...$result]);
    }
}
