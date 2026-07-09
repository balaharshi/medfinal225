<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\VendorServiceAssignmentService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class VendorServiceAssignmentController extends Controller
{
    public function __construct(private readonly VendorServiceAssignmentService $service)
    {
    }

    public function index(string $vendorId): JsonResponse
    {
        return response()->json($this->service->getVendorServiceAssignments($vendorId));
    }

    public function update(Request $request, string $vendorId, string $serviceId): JsonResponse
    {
        return response()->json(['success' => true, 'assignment' => $this->service->setVendorServiceAssignment(
            $vendorId,
            $serviceId,
            $request->input('enabled'),
            $request->input('vendorPrice'),
            $request->input('commissionType'),
            $request->input('commissionValue') !== null ? (float) $request->input('commissionValue') : null,
        )]);
    }

    public function bulk(Request $request, string $vendorId): JsonResponse
    {
        return response()->json($this->service->bulkSetVendorServiceAssignments(
            $vendorId,
            $request->input('serviceIds', []),
            $request->input('enabled', true),
            $request->input('vendorPrice'),
        ));
    }
}
