<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AuthTransaction;
use App\Services\EnbdpayService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class AdminPaymentController extends Controller
{
    public function __construct(private readonly EnbdpayService $enbdpayService)
    {
    }

    public function getPendingPayments(): JsonResponse
    {
        $pending = AuthTransaction::orderBy('authorized_at', 'desc')->get();

        return response()->json([
            'success' => true,
            'payments' => $pending->map(fn ($p) => [
                'id' => $p->id,
                'booking_id' => $p->booking_id,
                'app_utr' => $p->app_utr,
                'order_id' => $p->order_id,
                'transaction_utr' => $p->transaction_utr,
                'authorized_amount' => $p->authorized_amount,
                'captured_amount' => $p->captured_amount,
                'status' => $p->status,
                'customer_name' => $p->customer_name,
                'customer_email' => $p->customer_email,
                'customer_phone' => $p->customer_phone,
                'authorized_at' => $p->authorized_at?->toDateTimeString(),
                'capture_deadline' => $p->capture_deadline?->toDateTimeString(),
                'captured_at' => $p->captured_at?->toDateTimeString(),
                'voided_at' => $p->voided_at?->toDateTimeString(),
                'hours_until_capture' => $p->hoursUntilCapture(),
                'is_pending' => $p->isPending(),
                'is_ready_to_capture' => $p->isReadyToCapture(),
            ]),
        ]);
    }

    public function captureAuth(Request $request): JsonResponse
    {
        $request->validate([
            'id' => 'required|integer|exists:auth_transactions,id',
            'amount' => 'nullable|numeric|min:0',
        ]);

        $auth = AuthTransaction::findOrFail($request->id);

        if ($auth->status !== 'AUTHORIZED') {
            return response()->json([
                'success' => false,
                'error' => 'Transaction is not in AUTHORIZED status',
            ], 400);
        }

        $captureAmount = $request->amount ?? $auth->authorized_amount;

        if ($captureAmount > $auth->authorized_amount) {
            return response()->json([
                'success' => false,
                'error' => 'Capture amount cannot exceed authorized amount',
            ], 400);
        }

        try {
            $result = $this->enbdpayService->captureTransaction([
                'transactionUtr' => $auth->transaction_utr,
                'appUtr' => $auth->app_utr,
                'orderId' => $auth->order_id,
                'amount' => $captureAmount,
            ]);

            $auth->update([
                'status' => 'CAPTURED',
                'captured_amount' => $captureAmount,
                'captured_at' => now(),
            ]);

            Log::info('Admin captured AUTH transaction', [
                'auth_id' => $auth->id,
                'appUtr' => $auth->app_utr,
                'authorized_amount' => $auth->authorized_amount,
                'captured_amount' => $captureAmount,
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Transaction captured successfully',
                'result' => $result,
                'auth' => $auth->fresh(),
            ]);
        } catch (\Exception $e) {
            Log::error('Admin capture failed', [
                'auth_id' => $auth->id,
                'error' => $e->getMessage(),
            ]);

            return response()->json([
                'success' => false,
                'error' => 'Capture failed: ' . $e->getMessage(),
            ], 500);
        }
    }

    public function voidAuth(Request $request): JsonResponse
    {
        $request->validate([
            'id' => 'required|integer|exists:auth_transactions,id',
        ]);

        $auth = AuthTransaction::findOrFail($request->id);

        if ($auth->status !== 'AUTHORIZED') {
            return response()->json([
                'success' => false,
                'error' => 'Transaction is not in AUTHORIZED status',
            ], 400);
        }

        try {
            $result = $this->enbdpayService->voidAuthorization([
                'transactionUtr' => $auth->transaction_utr,
                'appUtr' => $auth->app_utr,
                'orderId' => $auth->order_id,
            ]);

            $auth->update([
                'status' => 'VOIDED',
                'voided_at' => now(),
            ]);

            Log::info('Admin voided AUTH transaction', [
                'auth_id' => $auth->id,
                'appUtr' => $auth->app_utr,
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Transaction voided successfully',
                'result' => $result,
                'auth' => $auth->fresh(),
            ]);
        } catch (\Exception $e) {
            Log::error('Admin void failed', [
                'auth_id' => $auth->id,
                'error' => $e->getMessage(),
            ]);

            return response()->json([
                'success' => false,
                'error' => 'Void failed: ' . $e->getMessage(),
            ], 500);
        }
    }

    public function updateAmount(Request $request): JsonResponse
    {
        $request->validate([
            'id' => 'required|integer|exists:auth_transactions,id',
            'amount' => 'required|numeric|min:0',
        ]);

        $auth = AuthTransaction::findOrFail($request->id);

        if ($auth->status !== 'AUTHORIZED') {
            return response()->json([
                'success' => false,
                'error' => 'Transaction is not in AUTHORIZED status',
            ], 400);
        }

        if ($request->amount > $auth->authorized_amount) {
            return response()->json([
                'success' => false,
                'error' => 'New amount cannot exceed authorized amount',
            ], 400);
        }

        $auth->update([
            'notes' => ($auth->notes ? $auth->notes . ' | ' : '') . 'Amount adjusted from AED ' . $auth->authorized_amount . ' to AED ' . $request->amount . ' by admin at ' . now()->toDateTimeString(),
        ]);

        Log::info('Admin updated AUTH amount', [
            'auth_id' => $auth->id,
            'old_amount' => $auth->authorized_amount,
            'new_amount' => $request->amount,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Amount updated. Will be captured when you click Capture.',
            'auth' => $auth->fresh(),
        ]);
    }
}
