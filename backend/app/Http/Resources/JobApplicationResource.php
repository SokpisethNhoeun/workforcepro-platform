<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class JobApplicationResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'job_posting_id' => $this->job_posting_id,
            'applicant_name' => $this->applicant_name,
            'applicant_email' => $this->applicant_email,
            'applicant_phone' => $this->applicant_phone,
            'resume_path' => $this->resume_path,
            'cover_letter' => $this->cover_letter,
            'status' => $this->status,
            'notes' => $this->notes,
            'job_posting' => new JobPostingResource($this->whenLoaded('jobPosting')),
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
