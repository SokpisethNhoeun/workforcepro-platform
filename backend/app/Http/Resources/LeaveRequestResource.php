<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class LeaveRequestResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'employee_id' => $this->employee_id,
            'leave_type_id' => $this->leave_type_id,
            'start_date' => $this->start_date?->toDateString(),
            'end_date' => $this->end_date?->toDateString(),
            'total_days' => $this->total_days,
            'status' => $this->status,
            'reason' => $this->reason,
            'rejection_reason' => $this->rejection_reason,
            'responded_at' => $this->responded_at?->toIso8601String(),
            'employee' => new EmployeeResource($this->whenLoaded('employee')),
            'leave_type' => $this->whenLoaded('leaveType'),
            'approver' => new UserResource($this->whenLoaded('approver')),
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
