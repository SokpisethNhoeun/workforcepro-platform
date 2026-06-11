<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class EmployeeResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $canViewSensitive = $this->canViewSensitive($request);

        return [
            'id' => $this->id,
            'employee_code' => $this->employee_code,
            'first_name' => $this->first_name,
            'last_name' => $this->last_name,
            'full_name' => $this->full_name,
            'khmer_name' => $this->khmer_name,
            'gender' => $this->gender,
            'date_of_birth' => $this->date_of_birth,
            'phone' => $this->phone,
            'personal_email' => $this->when($canViewSensitive, $this->personal_email),
            'work_email' => $this->work_email,
            'address' => $this->when($canViewSensitive, $this->address),
            'hired_at' => $this->hired_at,
            'probation_ends_at' => $this->probation_ends_at,
            'terminated_at' => $this->terminated_at,
            'base_salary' => $this->when($canViewSensitive, $this->base_salary),
            'salary_currency' => $this->when($canViewSensitive, $this->salary_currency),
            'tax_identifier' => $this->when($canViewSensitive, $this->tax_identifier),
            'nssf_number' => $this->when($canViewSensitive, $this->nssf_number),
            'status' => $this->status,
            'metadata' => $this->metadata,
            'user' => new UserResource($this->whenLoaded('user')),
            'department' => $this->whenLoaded('department'),
            'position' => $this->whenLoaded('position'),
            'employment_status' => $this->whenLoaded('employmentStatus'),
            'manager' => new self($this->whenLoaded('manager')),
            'emergency_contacts' => $this->whenLoaded('emergencyContacts'),
            'contracts' => $this->when($canViewSensitive, fn () => $this->whenLoaded('contracts')),
            'documents' => $this->when($canViewSensitive, fn () => $this->whenLoaded('documents')),
            'performance_histories' => $this->when($canViewSensitive, fn () => $this->whenLoaded('performanceHistories')),
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }

    private function canViewSensitive(Request $request): bool
    {
        $user = $request->user();

        if (! $user) {
            return false;
        }

        if ($user->hasAnyRole(['Admin', 'HR'])) {
            return true;
        }

        return $user->employee?->id === $this->resource->id;
    }
}
