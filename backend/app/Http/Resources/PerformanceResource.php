<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class PerformanceResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'employee_id' => $this->employee_id,
            'reviewer_id' => $this->reviewer_id,
            'period' => $this->period,
            'score' => $this->score,
            'summary' => $this->summary,
            'strengths' => $this->strengths,
            'improvements' => $this->improvements,
            'employee' => new EmployeeResource($this->whenLoaded('employee')),
            'reviewer' => new UserResource($this->whenLoaded('reviewer')),
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
