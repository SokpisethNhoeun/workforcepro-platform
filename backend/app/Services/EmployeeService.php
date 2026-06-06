<?php

namespace App\Services;

use App\Models\Employee;
use App\Repositories\Contracts\EmployeeRepositoryInterface;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\DB;

class EmployeeService
{
    public function __construct(private readonly EmployeeRepositoryInterface $employees) {}

    public function paginate(array $filters): LengthAwarePaginator
    {
        return $this->employees->paginate($filters);
    }

    public function find(int $id): Employee
    {
        return $this->employees->find($id);
    }

    public function create(array $data): Employee
    {
        return DB::transaction(function () use ($data) {
            $contacts = Arr::pull($data, 'emergency_contacts', []);
            $employee = $this->employees->create($data);
            $this->syncEmergencyContacts($employee, $contacts);

            return $this->employees->find($employee->id);
        });
    }

    public function update(Employee $employee, array $data): Employee
    {
        return DB::transaction(function () use ($employee, $data) {
            $contactsProvided = array_key_exists('emergency_contacts', $data);
            $contacts = Arr::pull($data, 'emergency_contacts', []);
            $this->employees->update($employee, $data);

            if ($contactsProvided) {
                $this->syncEmergencyContacts($employee, $contacts);
            }

            return $this->employees->find($employee->id);
        });
    }

    public function delete(Employee $employee): void
    {
        $this->employees->delete($employee);
    }

    private function syncEmergencyContacts(Employee $employee, array $contacts): void
    {
        if ($contacts === []) {
            return;
        }

        $employee->emergencyContacts()->delete();

        foreach ($contacts as $index => $contact) {
            $employee->emergencyContacts()->create([
                ...$contact,
                'is_primary' => (bool) ($contact['is_primary'] ?? $index === 0),
            ]);
        }
    }
}
