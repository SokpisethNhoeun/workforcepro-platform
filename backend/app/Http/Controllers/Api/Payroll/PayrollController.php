<?php

namespace App\Http\Controllers\Api\Payroll;

use App\Http\Controllers\Controller;
use App\Services\PayrollService;
use App\Models\PayrollRun;
use App\Support\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class PayrollController extends Controller
{
    public function __construct(
        protected PayrollService $payrollService
    ) {}

    public function index(Request $request): JsonResponse
    {
        $query = PayrollRun::query()
            ->withCount('payslips')
            ->when($request->input('search'), fn ($q, $s) => $q->where('period', 'like', "%{$s}%"))
            ->when($request->input('status'), fn ($q, $v) => $q->where('status', $v));

        $paginated = $query->orderByDesc('run_date')->paginate((int) $request->input('per_page', 15));

        return ApiResponse::success($paginated->items(), 'Payroll runs retrieved.', 200, [
            'current_page' => $paginated->currentPage(),
            'last_page' => $paginated->lastPage(),
            'per_page' => $paginated->perPage(),
            'total' => $paginated->total(),
        ]);
    }

    public function show(PayrollRun $payrollRun): JsonResponse
    {
        return ApiResponse::success($payrollRun->load('payslips.employee'));
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'period' => ['required', 'string', 'max:20', 'unique:payroll_runs,period'],
            'run_date' => ['required', 'date'],
            'currency' => ['sometimes', 'string', 'size:3'],
            'notes' => ['nullable', 'string'],
        ]);

        return ApiResponse::success(PayrollRun::create($data), 'Payroll run created.', 201);
    }

    public function update(Request $request, PayrollRun $payrollRun): JsonResponse
    {
        $data = $request->validate([
            'status' => ['sometimes', Rule::in(['draft', 'processing', 'completed', 'cancelled'])],
            'notes' => ['nullable', 'string'],
        ]);

        if (isset($data['status']) && $data['status'] === 'completed') {
            $data['total_amount'] = $payrollRun->payslips()->sum('net_salary');
        }

        $payrollRun->update($data);

        return ApiResponse::success($payrollRun->fresh()->loadCount('payslips'), 'Payroll run updated.');
    }

    public function process(PayrollRun $payrollRun): JsonResponse
    {
        try {
            $this->payrollService->processPayroll($payrollRun);
            return ApiResponse::success($payrollRun->fresh()->load('payslips.employee'), 'Payroll processed successfully.');
        } catch (\Exception $e) {
            return ApiResponse::error($e->getMessage(), 422);
        }
    }

    public function destroy(PayrollRun $payrollRun): JsonResponse
    {
        $payrollRun->delete();

        return ApiResponse::success(null, 'Payroll run deleted.');
    }
}
