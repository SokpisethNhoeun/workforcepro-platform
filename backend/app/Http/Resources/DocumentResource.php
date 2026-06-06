<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class DocumentResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'employee_id' => $this->employee_id,
            'uploaded_by' => $this->uploaded_by,
            'type' => $this->type,
            'title' => $this->title,
            'file_path' => $this->file_path,
            'mime_type' => $this->mime_type,
            'size_bytes' => $this->size_bytes,
            'expires_at' => $this->expires_at?->toDateString(),
            'employee' => new EmployeeResource($this->whenLoaded('employee')),
            'uploader' => new UserResource($this->whenLoaded('uploader')),
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
