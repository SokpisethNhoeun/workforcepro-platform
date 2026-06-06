<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class DepartmentResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'code' => $this->code,
            'manager_user_id' => $this->manager_user_id,
            'description' => $this->description,
            'is_active' => $this->is_active,
            'employees_count' => $this->whenCounted('employees'),
            'manager' => new UserResource($this->whenLoaded('manager')),
            'employees' => EmployeeResource::collection($this->whenLoaded('employees')),
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
