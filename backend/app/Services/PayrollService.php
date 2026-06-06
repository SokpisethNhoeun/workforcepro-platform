<?php

namespace App\Services;

use App\Models\Employee;
use App\Models\PayrollRun;
use App\Models\Payslip;
use Illuminate\Support\Facades\DB;
use Exception;

class PayrollService
{
    /**
     * Process payroll for a given run.
     * Generates payslips for all active employees.
     */
    public function processPayroll(PayrollRun $payrollRun): void
    {
        DB::transaction(function () use ($payrollRun) {
            // Only process if in draft or processing status
            if (!in_array($payrollRun->status, ['draft', 'processing'])) {
                throw new Exception("Payroll run cannot be processed in its current status: {$payrollRun->status}");
            }

            $payrollRun->update(['status' => 'processing']);

            // Get active employees
            $employees = Employee::where('status', 'active')->get();

            foreach ($employees as $employee) {
                $this->generatePayslip($payrollRun, $employee);
            }

            // Update totals
            $totalAmount = $payrollRun->payslips()->sum('net_salary');
            $payrollRun->update([
                'status' => 'completed',
                'total_amount' => $totalAmount
            ]);
        });
    }

    /**
     * Generate a single payslip for an employee.
     */
    public function generatePayslip(PayrollRun $payrollRun, Employee $employee): Payslip
    {
        // Check if payslip already exists for this run/employee
        $payslip = Payslip::where('payroll_run_id', $payrollRun->id)
            ->where('employee_id', $employee->id)
            ->first();

        $basicSalary = $employee->base_salary;
        
        // Simple calculation for now
        // TODO: Integrate with Attendance for deductions/overtime
        // TODO: Integrate with Leave for paid/unpaid leave adjustments
        
        $allowances = 0; // Could fetch from employee contracts or recurring allowances
        $deductions = 0; // Could fetch from attendance late/absent or loans
        
        // Tax Calculation (Simplified)
        $tax = $this->calculateTax($basicSalary + $allowances - $deductions, $employee->salary_currency);
        
        // NSSF Calculation (Simplified)
        $nssf = $this->calculateNssf($basicSalary, $employee->salary_currency);
        
        $netSalary = $basicSalary + $allowances - $deductions - $tax - $nssf;

        $data = [
            'payroll_run_id' => $payrollRun->id,
            'employee_id' => $employee->id,
            'basic_salary' => $basicSalary,
            'allowances' => $allowances,
            'deductions' => $deductions,
            'tax' => $tax,
            'nssf' => $nssf,
            'net_salary' => $netSalary,
            'currency' => $employee->salary_currency ?? config('payroll.currency', 'USD'),
            'status' => 'generated'
        ];

        if ($payslip) {
            $payslip->update($data);
        } else {
            $payslip = Payslip::create($data);
        }

        return $payslip;
    }

    /**
     * Calculate Tax on Salary based on config brackets.
     */
    private function calculateTax(float $taxableIncome, string $currency): float
    {
        $brackets = config('payroll.withholding_tax_brackets_khr', []);
        
        // Convert to KHR if needed (assuming 1 USD = 4100 KHR for tax purposes)
        $exchangeRate = 4100;
        $incomeInKhr = ($currency === 'USD') ? $taxableIncome * $exchangeRate : $taxableIncome;
        
        $taxInKhr = 0;
        foreach ($brackets as $bracket) {
            if ($incomeInKhr > $bracket['from']) {
                $taxableInBracket = ($bracket['to'] === null) 
                    ? $incomeInKhr 
                    : min($incomeInKhr, $bracket['to']);
                
                // Effective tax = (Income * Rate) - Deduction (this is the simplified way TOS is calculated in KM)
                // But typically it's $tax = ($income * $rate) - $deduction
                if ($bracket['to'] === null || $incomeInKhr <= $bracket['to']) {
                    $taxInKhr = ($incomeInKhr * $bracket['rate']) - $bracket['deduction'];
                    break;
                }
            }
        }

        return ($currency === 'USD') ? $taxInKhr / $exchangeRate : $taxInKhr;
    }

    /**
     * Calculate NSSF (placeholder).
     */
    private function calculateNssf(float $salary, string $currency): float
    {
        // Simple NSSF placeholder: 2% of salary, capped at a certain amount
        // In KM: around $6 max for Healthcare + Occupational Risk
        return min($salary * 0.02, 6.0);
    }
}
