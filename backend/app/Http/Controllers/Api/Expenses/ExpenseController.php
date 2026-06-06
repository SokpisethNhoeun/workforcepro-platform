<?php

namespace App\Http\Controllers\Api\Expenses;

use App\Http\Controllers\Controller;
use App\Http\Requests\Expenses\StoreExpenseRequest;
use App\Http\Resources\ExpenseResource;
use App\Models\Expense;
use App\Services\ExpenseService;
use App\Support\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ExpenseController extends Controller
{
    public function __construct(private readonly ExpenseService $expenses) {}

    public function index(Request $request): JsonResponse
    {
        $paginated = $this->expenses->paginate($request->only(['search', 'status', 'category', 'employee_id', 'per_page']));

        return ApiResponse::success(
            ExpenseResource::collection($paginated)->response()->getData(true)['data'],
            'Expenses retrieved.',
            200,
            [
                'current_page' => $paginated->currentPage(),
                'last_page' => $paginated->lastPage(),
                'per_page' => $paginated->perPage(),
                'total' => $paginated->total(),
            ]
        );
    }

    public function show(Expense $expense): JsonResponse
    {
        return ApiResponse::success(new ExpenseResource($this->expenses->find($expense->id)));
    }

    public function store(StoreExpenseRequest $request): JsonResponse
    {
        return ApiResponse::success(new ExpenseResource($this->expenses->create($request->validated())), 'Expense submitted.', 201);
    }

    public function approve(Request $request, Expense $expense): JsonResponse
    {
        $expense = $this->expenses->approve($expense, $request->user()->id);

        return ApiResponse::success(new ExpenseResource($expense), 'Expense approved.');
    }

    public function reject(Request $request, Expense $expense): JsonResponse
    {
        $expense = $this->expenses->reject($expense, $request->user()->id);

        return ApiResponse::success(new ExpenseResource($expense), 'Expense rejected.');
    }

    public function destroy(Expense $expense): JsonResponse
    {
        $this->expenses->delete($expense);

        return ApiResponse::success(null, 'Expense deleted.');
    }
}
