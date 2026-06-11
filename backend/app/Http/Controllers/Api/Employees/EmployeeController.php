<?php

namespace App\Http\Controllers\Api\Employees;

use App\Exports\EmployeesExport;
use App\Http\Controllers\Controller;
use App\Http\Requests\Employees\StoreEmployeeRequest;
use App\Http\Requests\Employees\UpdateEmployeeRequest;
use App\Http\Resources\EmployeeListResource;
use App\Http\Resources\EmployeeResource;
use App\Imports\EmployeesImport;
use App\Models\Employee;
use App\Services\EmployeeService;
use App\Support\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Maatwebsite\Excel\Facades\Excel;
use Symfony\Component\HttpFoundation\BinaryFileResponse;

class EmployeeController extends Controller
{
    public function __construct(private readonly EmployeeService $employees) {}

    public function index(Request $request): JsonResponse
    {
        $paginated = $this->employees->paginate($request->only([
            'search',
            'department_id',
            'position_id',
            'status',
            'sort',
            'direction',
            'per_page',
        ]));

        return ApiResponse::success(EmployeeListResource::collection($paginated)->response()->getData(true)['data'], 'Employees retrieved.', 200, [
            'current_page' => $paginated->currentPage(),
            'last_page' => $paginated->lastPage(),
            'per_page' => $paginated->perPage(),
            'total' => $paginated->total(),
        ]);
    }

    public function store(StoreEmployeeRequest $request): JsonResponse
    {
        $employee = $this->employees->create($request->validated());

        return ApiResponse::success(new EmployeeResource($employee), 'Employee created.', 201);
    }

    public function show(Employee $employee): JsonResponse
    {
        $this->authorize('view', $employee);

        return ApiResponse::success(new EmployeeResource($this->employees->find($employee->id)));
    }

    public function update(UpdateEmployeeRequest $request, Employee $employee): JsonResponse
    {
        $this->authorize('update', $employee);

        $employee = $this->employees->update($employee, $request->validated());

        return ApiResponse::success(new EmployeeResource($employee), 'Employee updated.');
    }

    public function destroy(Employee $employee): JsonResponse
    {
        $this->authorize('delete', $employee);

        $this->employees->delete($employee);

        return ApiResponse::success(null, 'Employee deleted.');
    }

    public function export(): BinaryFileResponse
    {
        return Excel::download(new EmployeesExport, 'employees.xlsx');
    }

    public function import(Request $request): JsonResponse
    {
        $request->validate(['file' => ['required', 'file', 'mimes:xlsx,csv']]);
        Excel::import(new EmployeesImport, $request->file('file'));

        return ApiResponse::success(null, 'Employees imported.');
    }
}
