<?php

namespace App\Http\Controllers\Api\Recruitment;

use App\Http\Controllers\Controller;
use App\Http\Requests\Recruitment\StoreJobPostingRequest;
use App\Http\Requests\Recruitment\UpdateJobPostingRequest;
use App\Http\Resources\JobPostingResource;
use App\Models\JobPosting;
use App\Services\RecruitmentService;
use App\Support\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class JobPostingController extends Controller
{
    public function __construct(private readonly RecruitmentService $recruitment) {}

    public function index(Request $request): JsonResponse
    {
        $paginated = $this->recruitment->paginatePostings($request->only(['search', 'status', 'department_id', 'per_page']));

        return ApiResponse::success(
            JobPostingResource::collection($paginated)->response()->getData(true)['data'],
            'Job postings retrieved.',
            200,
            [
                'current_page' => $paginated->currentPage(),
                'last_page' => $paginated->lastPage(),
                'per_page' => $paginated->perPage(),
                'total' => $paginated->total(),
            ]
        );
    }

    public function show(JobPosting $jobPosting): JsonResponse
    {
        return ApiResponse::success(new JobPostingResource($this->recruitment->findPosting($jobPosting->id)));
    }

    public function store(StoreJobPostingRequest $request): JsonResponse
    {
        return ApiResponse::success(
            new JobPostingResource($this->recruitment->createPosting($request->validated())),
            'Job posting created.',
            201
        );
    }

    public function update(UpdateJobPostingRequest $request, JobPosting $jobPosting): JsonResponse
    {
        return ApiResponse::success(
            new JobPostingResource($this->recruitment->updatePosting($jobPosting, $request->validated())),
            'Job posting updated.'
        );
    }

    public function destroy(JobPosting $jobPosting): JsonResponse
    {
        $this->recruitment->deletePosting($jobPosting);

        return ApiResponse::success(null, 'Job posting deleted.');
    }
}
