<?php

namespace App\Mail;

use App\Models\Task;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;

class TaskNotification extends Mailable
{
    use Queueable, SerializesModels;

    public $task;
    public $type; // 'created' or 'updated'
    public $assigneeNames;

    /**
     * Create a new message instance.
     */
    public function __construct(Task $task, string $type, array $assigneeNames = [])
    {
        $this->task = $task;
        $this->type = $type;
        $this->assigneeNames = $assigneeNames;
    }

    /**
     * Build the message.
     */
    public function build()
    {
        $subject = $this->type === 'created' 
            ? "New Task Assigned: {$this->task->title}" 
            : "Task Update: {$this->task->title}";

        return $this->subject($subject)
                    ->markdown('emails.task-notification');
    }
}
