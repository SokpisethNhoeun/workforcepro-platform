<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ExpenseResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'employee_id' => $this->employee_id,
            'approved_by' => $this->approved_by,
            'category' => $this->category,
            'description' => $this->description,
            'amount' => $this->amount,
            'currency' => $this->currency,
            'receipt_path' => $this->receipt_path,
            'status' => $this->status,
            'expense_date' => $this->expense_date?->toDateString(),
            'responded_at' => $this->responded_at?->toIso8601String(),
            'employee' => new EmployeeResource($this->whenLoaded('employee')),
            'approver' => new UserResource($this->whenLoaded('approver')),
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
