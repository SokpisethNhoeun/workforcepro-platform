<?php

namespace App\Http\Controllers\Api\Announcements;

use App\Http\Controllers\Controller;
use App\Http\Resources\AnnouncementResource;
use App\Models\Announcement;
use App\Support\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class AnnouncementController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = Announcement::query()
            ->with('author')
            ->when($request->input('search'), function ($q, string $search) {
                $q->where('title', 'like', "%{$search}%");
            })
            ->when($request->input('priority'), fn ($q, $p) => $q->where('priority', $p));

        $paginated = $query
            ->orderByDesc('is_pinned')
            ->orderByDesc('published_at')
            ->paginate((int) ($request->input('per_page', 15)));

        return ApiResponse::success(
            AnnouncementResource::collection($paginated)->response()->getData(true)['data'],
            'Announcements retrieved.',
            200,
            [
                'current_page' => $paginated->currentPage(),
                'last_page' => $paginated->lastPage(),
                'per_page' => $paginated->perPage(),
                'total' => $paginated->total(),
            ]
        );
    }

    public function show(Announcement $announcement): JsonResponse
    {
        return ApiResponse::success(new AnnouncementResource($announcement->load('author')));
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'title' => ['required', 'string', 'max:255'],
            'body' => ['required', 'string'],
            'priority' => ['sometimes', Rule::in(['low', 'normal', 'high', 'urgent'])],
            'is_pinned' => ['sometimes', 'boolean'],
            'published_at' => ['nullable', 'date'],
            'expires_at' => ['nullable', 'date', 'after:published_at'],
        ]);

        $data['author_id'] = $request->user()->id;
        $data['published_at'] ??= now();

        $announcement = Announcement::create($data);

        return ApiResponse::success(
            new AnnouncementResource($announcement->load('author')),
            'Announcement published.',
            201
        );
    }

    public function update(Request $request, Announcement $announcement): JsonResponse
    {
        $data = $request->validate([
            'title' => ['sometimes', 'required', 'string', 'max:255'],
            'body' => ['sometimes', 'required', 'string'],
            'priority' => ['sometimes', Rule::in(['low', 'normal', 'high', 'urgent'])],
            'is_pinned' => ['sometimes', 'boolean'],
            'published_at' => ['nullable', 'date'],
            'expires_at' => ['nullable', 'date'],
        ]);

        $announcement->update($data);

        return ApiResponse::success(
            new AnnouncementResource($announcement->fresh()->load('author')),
            'Announcement updated.'
        );
    }

    public function destroy(Announcement $announcement): JsonResponse
    {
        $announcement->delete();

        return ApiResponse::success(null, 'Announcement deleted.');
    }
}
