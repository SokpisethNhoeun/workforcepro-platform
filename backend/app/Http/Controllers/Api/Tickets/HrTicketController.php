<?php

namespace App\Http\Controllers\Api\Tickets;

use App\Http\Controllers\Controller;
use App\Http\Requests\Tickets\StoreTicketRequest;
use App\Http\Requests\Tickets\UpdateTicketRequest;
use App\Http\Resources\HrTicketResource;
use App\Models\HrTicket;
use App\Services\HrTicketService;
use App\Support\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class HrTicketController extends Controller
{
    public function __construct(private readonly HrTicketService $tickets) {}

    public function index(Request $request): JsonResponse
    {
        $paginated = $this->tickets->paginate($request->only(['search', 'status', 'category', 'priority', 'per_page']));

        return ApiResponse::success(
            HrTicketResource::collection($paginated)->response()->getData(true)['data'],
            'Tickets retrieved.',
            200,
            [
                'current_page' => $paginated->currentPage(),
                'last_page' => $paginated->lastPage(),
                'per_page' => $paginated->perPage(),
                'total' => $paginated->total(),
            ]
        );
    }

    public function show(HrTicket $hrTicket): JsonResponse
    {
        $this->authorize('view', $hrTicket);

        return ApiResponse::success(new HrTicketResource($this->tickets->find($hrTicket->id)));
    }

    public function store(StoreTicketRequest $request): JsonResponse
    {
        return ApiResponse::success(new HrTicketResource($this->tickets->create($request->validated())), 'Ticket created.', 201);
    }

    public function update(UpdateTicketRequest $request, HrTicket $hrTicket): JsonResponse
    {
        $this->authorize('update', $hrTicket);

        $ticket = $this->tickets->update($hrTicket, $request->validated());

        return ApiResponse::success(new HrTicketResource($ticket), 'Ticket updated.');
    }

    public function destroy(HrTicket $hrTicket): JsonResponse
    {
        $this->authorize('delete', $hrTicket);

        $this->tickets->delete($hrTicket);

        return ApiResponse::success(null, 'Ticket deleted.');
    }
}
