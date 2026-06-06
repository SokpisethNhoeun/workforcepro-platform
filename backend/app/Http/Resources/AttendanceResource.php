<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class AttendanceResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'employee_id' => $this->employee_id,
            'date' => $this->date?->toDateString(),
            'check_in' => $this->check_in?->toIso8601String(),
            'check_out' => $this->check_out?->toIso8601String(),
            'check_in_method' => $this->check_in_method,
            'check_out_method' => $this->check_out_method,
            'check_in_note' => $this->check_in_note,
            'check_out_note' => $this->check_out_note,
            'work_hours' => $this->work_hours,
            'overtime_hours' => $this->overtime_hours,
            'status' => $this->status,
            'employee' => new EmployeeResource($this->whenLoaded('employee')),
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
