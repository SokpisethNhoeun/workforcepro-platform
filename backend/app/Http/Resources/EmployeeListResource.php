<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class EmployeeListResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'employee_code' => $this->employee_code,
            'first_name' => $this->first_name,
            'last_name' => $this->last_name,
            'full_name' => $this->full_name,
            'khmer_name' => $this->khmer_name,
            'gender' => $this->gender,
            'phone' => $this->phone,
            'work_email' => $this->work_email,
            'hired_at' => $this->hired_at,
            'base_salary' => $this->base_salary,
            'salary_currency' => $this->salary_currency,
            'status' => $this->status,
            'department' => $this->whenLoaded('department'),
            'position' => $this->whenLoaded('position'),
            'employment_status' => $this->whenLoaded('employmentStatus'),
            'user' => $this->whenLoaded('user', fn () => [
                'id' => $this->user?->id,
                'name' => $this->user?->name,
                'email' => $this->user?->email,
                'roles' => $this->user?->roles->pluck('name')->values() ?? [],
            ]),
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
