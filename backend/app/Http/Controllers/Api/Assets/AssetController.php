<?php

namespace App\Http\Controllers\Api\Assets;

use App\Http\Controllers\Controller;
use App\Http\Requests\Assets\StoreAssetRequest;
use App\Http\Requests\Assets\UpdateAssetRequest;
use App\Http\Resources\AssetResource;
use App\Models\Asset;
use App\Services\AssetService;
use App\Support\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AssetController extends Controller
{
    public function __construct(private readonly AssetService $assets) {}

    public function index(Request $request): JsonResponse
    {
        $paginated = $this->assets->paginate($request->only(['search', 'status', 'category', 'per_page']));

        return ApiResponse::success(
            AssetResource::collection($paginated)->response()->getData(true)['data'],
            'Assets retrieved.',
            200,
            [
                'current_page' => $paginated->currentPage(),
                'last_page' => $paginated->lastPage(),
                'per_page' => $paginated->perPage(),
                'total' => $paginated->total(),
            ]
        );
    }

    public function show(Asset $asset): JsonResponse
    {
        return ApiResponse::success(new AssetResource($this->assets->find($asset->id)));
    }

    public function store(StoreAssetRequest $request): JsonResponse
    {
        return ApiResponse::success(new AssetResource($this->assets->create($request->validated())), 'Asset created.', 201);
    }

    public function update(UpdateAssetRequest $request, Asset $asset): JsonResponse
    {
        $asset = $this->assets->update($asset, $request->validated());

        return ApiResponse::success(new AssetResource($asset), 'Asset updated.');
    }

    public function destroy(Asset $asset): JsonResponse
    {
        $this->assets->delete($asset);

        return ApiResponse::success(null, 'Asset deleted.');
    }
}
