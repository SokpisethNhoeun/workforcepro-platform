<?php

namespace App\Http\Controllers\Api\Calendar;

use App\Http\Controllers\Controller;
use App\Http\Resources\CalendarEventResource;
use App\Models\CalendarEvent;
use App\Support\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class CalendarEventController extends Controller
{
    private const CALENDAR_IDS = ['general', 'team', 'leave', 'attendance', 'holiday', 'meeting'];

    public function index(Request $request): JsonResponse
    {
        $data = $request->validate([
            'from' => ['nullable', 'date'],
            'to' => ['nullable', 'date'],
            'calendar_id' => ['nullable', 'string'],
            'per_page' => ['nullable', 'integer', 'min:1', 'max:500'],
        ]);

        $query = CalendarEvent::query()->with('user');

        if (! empty($data['from'])) {
            $query->where('end_at', '>=', $data['from']);
        }
        if (! empty($data['to'])) {
            $query->where('start_at', '<=', $data['to']);
        }
        if (! empty($data['calendar_id'])) {
            $query->where('calendar_id', $data['calendar_id']);
        }

        $perPage = (int) ($data['per_page'] ?? 200);
        $paginated = $query->orderBy('start_at')->paginate($perPage);

        return ApiResponse::success(
            CalendarEventResource::collection($paginated)->response()->getData(true)['data'],
            'Calendar events retrieved.',
            200,
            [
                'current_page' => $paginated->currentPage(),
                'last_page' => $paginated->lastPage(),
                'per_page' => $paginated->perPage(),
                'total' => $paginated->total(),
            ]
        );
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'uuid' => ['nullable', 'string', 'max:64', 'unique:calendar_events,uuid'],
            'title' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'start_at' => ['required', 'date'],
            'end_at' => ['required', 'date', 'after_or_equal:start_at'],
            'all_day' => ['sometimes', 'boolean'],
            'calendar_id' => ['sometimes', Rule::in(self::CALENDAR_IDS)],
            'color' => ['nullable', 'string', 'max:16'],
            'meta' => ['nullable', 'array'],
        ]);

        $data['user_id'] = $request->user()?->id;
        $data['calendar_id'] ??= 'general';

        $event = CalendarEvent::create($data);

        return ApiResponse::success(
            new CalendarEventResource($event->load('user')),
            'Calendar event created.',
            201
        );
    }

    public function show(CalendarEvent $event): JsonResponse
    {
        return ApiResponse::success(new CalendarEventResource($event->load('user')));
    }

    public function update(Request $request, CalendarEvent $event): JsonResponse
    {
        $data = $request->validate([
            'title' => ['sometimes', 'required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'start_at' => ['sometimes', 'required', 'date'],
            'end_at' => ['sometimes', 'required', 'date', 'after_or_equal:start_at'],
            'all_day' => ['sometimes', 'boolean'],
            'calendar_id' => ['sometimes', Rule::in(self::CALENDAR_IDS)],
            'color' => ['nullable', 'string', 'max:16'],
            'meta' => ['nullable', 'array'],
        ]);

        $event->update($data);

        return ApiResponse::success(
            new CalendarEventResource($event->fresh()->load('user')),
            'Calendar event updated.'
        );
    }

    public function destroy(CalendarEvent $event): JsonResponse
    {
        $event->delete();

        return ApiResponse::success(null, 'Calendar event deleted.');
    }
}
