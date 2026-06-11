<?php

namespace App\Http\Controllers\Api\Tasks;

use App\Http\Controllers\Controller;
use App\Http\Requests\Tasks\StoreTaskRequest;
use App\Http\Requests\Tasks\UpdateTaskRequest;
use App\Http\Resources\TaskResource;
use App\Models\Task;
use App\Services\TaskService;
use App\Support\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class TaskController extends Controller
{
    public function __construct(private readonly TaskService $tasks) {}

    public function index(Request $request): JsonResponse
    {
        $paginated = $this->tasks->paginate($request->only(['search', 'status', 'priority', 'assigned_to', 'per_page']));

        return ApiResponse::success(
            TaskResource::collection($paginated)->response()->getData(true)['data'],
            'Tasks retrieved.',
            200,
            [
                'current_page' => $paginated->currentPage(),
                'last_page' => $paginated->lastPage(),
                'per_page' => $paginated->perPage(),
                'total' => $paginated->total(),
            ]
        );
    }

    public function show(Task $task): JsonResponse
    {
        $this->authorize('view', $task);

        return ApiResponse::success(new TaskResource($this->tasks->find($task->id)));
    }

    public function store(StoreTaskRequest $request): JsonResponse
    {
        $this->authorize('create', Task::class);

        $data = $request->validated();
        $data['assigned_by'] = $request->user()->id;

        return ApiResponse::success(new TaskResource($this->tasks->create($data)), 'Task created.', 201);
    }

    public function update(UpdateTaskRequest $request, Task $task): JsonResponse
    {
        $this->authorize('update', $task);

        $task = $this->tasks->update($task, $request->validated());

        return ApiResponse::success(new TaskResource($task), 'Task updated.');
    }

    public function destroy(Task $task): JsonResponse
    {
        $this->authorize('delete', $task);

        $this->tasks->delete($task);

        return ApiResponse::success(null, 'Task deleted.');
    }
}
