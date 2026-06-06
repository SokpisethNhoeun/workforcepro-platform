<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class OnboardingChecklistResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'employee_id' => $this->employee_id,
            'title' => $this->title,
            'due_date' => $this->due_date?->toDateString(),
            'status' => $this->status,
            'completed_at' => $this->completed_at?->toIso8601String(),
            'employee' => new EmployeeResource($this->whenLoaded('employee')),
            'tasks' => OnboardingTaskResource::collection($this->whenLoaded('tasks')),
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
