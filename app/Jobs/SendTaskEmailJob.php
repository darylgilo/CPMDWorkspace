<?php

namespace App\Jobs;

use App\Models\Task;
use App\Mail\TaskNotification;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Mail;

class SendTaskEmailJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public $tries = 3;
    public $backoff = [30, 60, 120];

    protected $task;
    protected $type;
    protected $assigneeNames;

    public function __construct(Task $task, string $type, array $assigneeNames = [])
    {
        $this->task = $task;
        $this->type = $type;
        $this->assigneeNames = $assigneeNames;
    }

    public function handle()
    {
        $assignees = $this->task->assignees ?? [];
        if (empty($assignees)) return;

        $users = \App\Models\User::whereIn('id', $assignees)->get();

        foreach ($users as $user) {
            if ($user->email) {
                Mail::to($user->email)->send(new TaskNotification($this->task, $this->type, $this->assigneeNames));
            }
        }
    }
}
