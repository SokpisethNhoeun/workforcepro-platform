<?php

namespace App\Http\Controllers\Api\Documents;

use App\Http\Controllers\Controller;
use App\Http\Requests\Documents\StoreDocumentRequest;
use App\Http\Requests\Documents\UpdateDocumentRequest;
use App\Http\Resources\DocumentResource;
use App\Models\EmployeeDocument;
use App\Services\DocumentService;
use App\Support\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class DocumentController extends Controller
{
    public function __construct(private readonly DocumentService $documents) {}

    public function index(Request $request): JsonResponse
    {
        $paginated = $this->documents->paginate($request->only(['search', 'type', 'employee_id', 'per_page']));

        return ApiResponse::success(
            DocumentResource::collection($paginated)->response()->getData(true)['data'],
            'Documents retrieved.',
            200,
            [
                'current_page' => $paginated->currentPage(),
                'last_page' => $paginated->lastPage(),
                'per_page' => $paginated->perPage(),
                'total' => $paginated->total(),
            ]
        );
    }

    public function show(EmployeeDocument $document): JsonResponse
    {
        return ApiResponse::success(new DocumentResource($this->documents->find($document->id)));
    }

    public function store(StoreDocumentRequest $request): JsonResponse
    {
        $data = $request->validated();
        $data['uploaded_by'] = $request->user()->id;

        return ApiResponse::success(new DocumentResource($this->documents->create($data)), 'Document uploaded.', 201);
    }

    public function update(UpdateDocumentRequest $request, EmployeeDocument $document): JsonResponse
    {
        return ApiResponse::success(
            new DocumentResource($this->documents->update($document, $request->validated())),
            'Document updated.'
        );
    }

    public function destroy(EmployeeDocument $document): JsonResponse
    {
        $this->documents->delete($document);

        return ApiResponse::success(null, 'Document deleted.');
    }
}
