<?php

namespace App\Http\Controllers\Api\Onboarding;

use App\Http\Controllers\Controller;
use App\Http\Requests\Onboarding\StoreOnboardingRequest;
use App\Http\Requests\Onboarding\UpdateOnboardingRequest;
use App\Http\Resources\OnboardingChecklistResource;
use App\Http\Resources\OnboardingTaskResource;
use App\Models\OnboardingChecklist;
use App\Models\OnboardingTask;
use App\Services\OnboardingService;
use App\Support\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class OnboardingController extends Controller
{
    public function __construct(private readonly OnboardingService $onboarding) {}

    public function index(Request $request): JsonResponse
    {
        $paginated = $this->onboarding->paginate($request->only(['search', 'status', 'employee_id', 'per_page']));

        return ApiResponse::success(
            OnboardingChecklistResource::collection($paginated)->response()->getData(true)['data'],
            'Onboarding checklists retrieved.',
            200,
            [
                'current_page' => $paginated->currentPage(),
                'last_page' => $paginated->lastPage(),
                'per_page' => $paginated->perPage(),
                'total' => $paginated->total(),
            ]
        );
    }

    public function show(OnboardingChecklist $onboarding): JsonResponse
    {
        return ApiResponse::success(new OnboardingChecklistResource($this->onboarding->find($onboarding->id)));
    }

    public function store(StoreOnboardingRequest $request): JsonResponse
    {
        return ApiResponse::success(
            new OnboardingChecklistResource($this->onboarding->create($request->validated())),
            'Checklist created.',
            201
        );
    }

    public function update(UpdateOnboardingRequest $request, OnboardingChecklist $onboarding): JsonResponse
    {
        return ApiResponse::success(
            new OnboardingChecklistResource($this->onboarding->update($onboarding, $request->validated())),
            'Checklist updated.'
        );
    }

    public function toggleTask(OnboardingTask $task): JsonResponse
    {
        return ApiResponse::success(
            new OnboardingTaskResource($this->onboarding->toggleTask($task)),
            'Task toggled.'
        );
    }

    public function destroy(OnboardingChecklist $onboarding): JsonResponse
    {
        $this->onboarding->delete($onboarding);

        return ApiResponse::success(null, 'Checklist deleted.');
    }
}
