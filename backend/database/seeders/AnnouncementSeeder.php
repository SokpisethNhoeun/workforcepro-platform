<?php

namespace Database\Seeders;

use App\Models\Announcement;
use Illuminate\Database\Seeder;

class AnnouncementSeeder extends Seeder
{
    public function run(): void
    {
        $announcements = [
            ['title' => 'Welcome to WorkforcePro', 'body' => 'We are excited to launch our new HR management platform. Please explore the features and reach out if you have any questions.', 'type' => 'general', 'priority' => 'normal', 'published_at' => now()],
            ['title' => 'Office Closed for Public Holiday', 'body' => 'The office will be closed on July 4th for Independence Day. Please plan accordingly.', 'type' => 'event', 'priority' => 'high', 'published_at' => now()],
            ['title' => 'Updated Leave Policy', 'body' => 'Our leave policy has been updated. Employees now have 20 days of annual leave. Please review the full policy in the Documents section.', 'type' => 'policy', 'priority' => 'normal', 'published_at' => now()],
        ];

        foreach ($announcements as $announcement) {
            Announcement::firstOrCreate(['title' => $announcement['title']], $announcement);
        }
    }
}
