<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\Crypt;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        DB::table('employees')
            ->whereNotNull('tax_identifier')
            ->orWhereNotNull('nssf_number')
            ->orderBy('id')
            ->each(function ($employee) {
                $updates = [];

                if ($employee->tax_identifier && ! $this->isEncrypted($employee->tax_identifier)) {
                    $updates['tax_identifier'] = Crypt::encryptString($employee->tax_identifier);
                }

                if ($employee->nssf_number && ! $this->isEncrypted($employee->nssf_number)) {
                    $updates['nssf_number'] = Crypt::encryptString($employee->nssf_number);
                }

                if ($updates !== []) {
                    DB::table('employees')->where('id', $employee->id)->update($updates);
                }
            });
    }

    public function down(): void
    {
        DB::table('employees')
            ->whereNotNull('tax_identifier')
            ->orWhereNotNull('nssf_number')
            ->orderBy('id')
            ->each(function ($employee) {
                $updates = [];

                if ($employee->tax_identifier && $this->isEncrypted($employee->tax_identifier)) {
                    $updates['tax_identifier'] = Crypt::decryptString($employee->tax_identifier);
                }

                if ($employee->nssf_number && $this->isEncrypted($employee->nssf_number)) {
                    $updates['nssf_number'] = Crypt::decryptString($employee->nssf_number);
                }

                if ($updates !== []) {
                    DB::table('employees')->where('id', $employee->id)->update($updates);
                }
            });
    }

    private function isEncrypted(string $value): bool
    {
        try {
            Crypt::decryptString($value);

            return true;
        } catch (\Exception) {
            return false;
        }
    }
};
