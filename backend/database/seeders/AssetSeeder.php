<?php

namespace Database\Seeders;

use App\Models\Asset;
use Illuminate\Database\Seeder;

class AssetSeeder extends Seeder
{
    public function run(): void
    {
        $assets = [
            ['name' => 'MacBook Pro 16"', 'asset_code' => 'AST-001', 'category' => 'laptop', 'status' => 'available', 'serial_number' => 'C02X12345', 'purchase_date' => '2025-01-15', 'purchase_cost' => 2499.00, 'currency' => 'USD'],
            ['name' => 'Dell U2723QE Monitor', 'asset_code' => 'AST-002', 'category' => 'monitor', 'status' => 'available', 'serial_number' => 'DL987654', 'purchase_date' => '2025-02-20', 'purchase_cost' => 619.99, 'currency' => 'USD'],
            ['name' => 'iPhone 15 Pro', 'asset_code' => 'AST-003', 'category' => 'phone', 'status' => 'available', 'serial_number' => 'AP555666', 'purchase_date' => '2025-03-10', 'purchase_cost' => 999.00, 'currency' => 'USD'],
            ['name' => 'Standing Desk', 'asset_code' => 'AST-004', 'category' => 'furniture', 'status' => 'available', 'purchase_date' => '2025-01-05', 'purchase_cost' => 799.00, 'currency' => 'USD'],
            ['name' => 'Adobe Creative Suite License', 'asset_code' => 'AST-005', 'category' => 'software', 'status' => 'available', 'purchase_date' => '2025-04-01', 'purchase_cost' => 599.88, 'currency' => 'USD'],
        ];

        foreach ($assets as $asset) {
            Asset::firstOrCreate(['asset_code' => $asset['asset_code']], $asset);
        }
    }
}
