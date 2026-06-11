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
use Symfony\Component\HttpFoundation\BinaryFileResponse;

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
        $this->authorize('view', $document);

        return ApiResponse::success(new DocumentResource($this->documents->find($document->id)));
    }

    public function store(StoreDocumentRequest $request): JsonResponse
    {
        $this->authorize('create', EmployeeDocument::class);

        $data = $request->safe()->except('file');
        $data['uploaded_by'] = $request->user()->id;

        $document = $this->documents->create($data, $request->file('file'));

        return ApiResponse::success(new DocumentResource($document), 'Document uploaded.', 201);
    }

    public function download(EmployeeDocument $document): BinaryFileResponse|JsonResponse
    {
        $this->authorize('view', $document);

        $filePath = $this->documents->getFilePath($document);

        if (! $filePath) {
            return ApiResponse::error('File not found.', 404);
        }

        return response()->download($filePath, $document->title . '.' . pathinfo($document->file_path, PATHINFO_EXTENSION), [
            'Content-Type' => $document->mime_type,
        ]);
    }

    public function update(UpdateDocumentRequest $request, EmployeeDocument $document): JsonResponse
    {
        $this->authorize('update', $document);

        return ApiResponse::success(
            new DocumentResource($this->documents->update($document, $request->validated())),
            'Document updated.'
        );
    }

    public function destroy(EmployeeDocument $document): JsonResponse
    {
        $this->authorize('delete', $document);

        $this->documents->delete($document);

        return ApiResponse::success(null, 'Document deleted.');
    }
}
