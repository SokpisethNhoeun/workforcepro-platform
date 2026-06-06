<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PerformanceHistory extends Model
{
    use HasFactory;

    protected $fillable = ['employee_id', 'reviewer_id', 'period', 'score', 'summary', 'strengths', 'improvements'];

    protected function casts(): array
    {
        return ['score' => 'decimal:2'];
    }

    public function employee(): BelongsTo
    {
        return $this->belongsTo(Employee::class);
    }

    public function reviewer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'reviewer_id');
    }
}
