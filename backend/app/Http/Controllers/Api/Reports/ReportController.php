<?php

namespace App\Http\Controllers\Api\Reports;

use App\Http\Controllers\Controller;
use App\Services\ReportService;
use App\Support\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ReportController extends Controller
{
    public function __construct(private readonly ReportService $reports) {}

    public function summary(): JsonResponse
    {
        return ApiResponse::success($this->reports->summary(), 'Report summary retrieved.');
    }

    public function departmentHeadcount(): JsonResponse
    {
        return ApiResponse::success($this->reports->departmentHeadcount(), 'Department headcount retrieved.');
    }

    public function attendanceTrend(Request $request): JsonResponse
    {
        $days = (int) ($request->input('days', 30));

        return ApiResponse::success($this->reports->attendanceTrend($days), 'Attendance trend retrieved.');
    }

    public function payrollSummary(): JsonResponse
    {
        return ApiResponse::success($this->reports->payrollSummary(), 'Payroll summary retrieved.');
    }

    public function performanceSummary(): JsonResponse
    {
        return ApiResponse::success($this->reports->performanceSummary(), 'Performance summary retrieved.');
    }
}
