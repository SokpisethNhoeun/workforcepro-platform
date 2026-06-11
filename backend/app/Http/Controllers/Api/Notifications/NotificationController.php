<?php

namespace App\Http\Controllers\Api\Notifications;

use App\Http\Controllers\Controller;
use App\Http\Resources\NotificationResource;
use App\Models\Notification;
use App\Services\NotificationService;
use App\Support\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class NotificationController extends Controller
{
    public function __construct(private readonly NotificationService $notifications) {}

    public function index(Request $request): JsonResponse
    {
        $paginated = $this->notifications->paginate($request->user()->id, $request->only(['unread', 'per_page']));

        return ApiResponse::success(
            NotificationResource::collection($paginated)->response()->getData(true)['data'],
            'Notifications retrieved.',
            200,
            [
                'current_page' => $paginated->currentPage(),
                'last_page' => $paginated->lastPage(),
                'per_page' => $paginated->perPage(),
                'total' => $paginated->total(),
                'unread_count' => $this->notifications->unreadCount($request->user()->id),
            ]
        );
    }

    public function markAsRead(Notification $notification): JsonResponse
    {
        $this->authorize('update', $notification);

        return ApiResponse::success(
            new NotificationResource($this->notifications->markAsRead($notification)),
            'Notification marked as read.'
        );
    }

    public function markAllRead(Request $request): JsonResponse
    {
        $this->notifications->markAllRead($request->user()->id);

        return ApiResponse::success(null, 'All notifications marked as read.');
    }

    public function destroy(Notification $notification): JsonResponse
    {
        $this->authorize('delete', $notification);

        $this->notifications->delete($notification);

        return ApiResponse::success(null, 'Notification deleted.');
    }
}
