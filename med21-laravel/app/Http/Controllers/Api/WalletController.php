<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\WalletService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class WalletController extends Controller
{
    public function __construct(private readonly WalletService $walletService)
    {
    }

    public function getWallet(Request $request): JsonResponse
    {
        $wallet = $this->walletService->getWallet($request->user()->id);
        return response()->json($wallet ?? ['balance' => 0, 'transactions' => []]);
    }

    public function getTransactions(Request $request): JsonResponse
    {
        $result = $this->walletService->getTransactions($request->user()->id, 20);
        return response()->json($result);
    }

    public function getConfig(): JsonResponse
    {
        return response()->json($this->walletService->getConfig());
    }

    public function updateConfig(Request $request): JsonResponse
    {
        $request->validate([
            'welcomeBonus' => 'integer|min:0',
        ]);

        return response()->json($this->walletService->updateConfig($request->all()));
    }

    public function adminListUsers(): JsonResponse
    {
        $users = \App\Models\User::query()
            ->with('wallet')
            ->where('role', 'customer')
            ->get()
            ->filter(fn ($user) => $user->wallet !== null)
            ->map(fn ($user) => [
                'id' => $user->id,
                'fullName' => $user->full_name,
                'email' => $user->email,
                'phone' => $user->phone,
                'walletBalance' => $user->wallet->balance,
            ])
            ->values();

        return response()->json($users);
    }

    public function adminCredit(Request $request): JsonResponse
    {
        $request->validate([
            'userId' => 'required|string|exists:users,id',
            'amount' => 'required|integer|min:1',
            'description' => 'required|string|max:500',
        ]);

        return response()->json(
            $this->walletService->adminCredit($request->input('userId'), $request->integer('amount'), $request->input('description'))
        );
    }

    public function adminDebit(Request $request): JsonResponse
    {
        $request->validate([
            'userId' => 'required|string|exists:users,id',
            'amount' => 'required|integer|min:1',
            'description' => 'required|string|max:500',
        ]);

        return response()->json(
            $this->walletService->adminDebit($request->input('userId'), $request->integer('amount'), $request->input('description'))
        );
    }
}
