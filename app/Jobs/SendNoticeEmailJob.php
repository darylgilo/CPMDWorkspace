<?php

namespace App\Jobs;

use App\Models\Notice;
use App\Mail\NoticeNotification;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Mail;

class SendNoticeEmailJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public $tries = 3;
    public $backoff = [30, 60, 120];

    protected $notice;

    public function __construct(Notice $notice)
    {
        $this->notice = $notice;
    }

    public function handle()
    {
        $recipients = collect();
        $category = $this->notice->category;
        
        // Announcements and Events go to all active/verified CPMD users automatically
        if ($category === 'Announcement' || $category === 'Notice of Event') {
            $cpmdEmployees = \App\Models\User::where(function ($query) {
                                    $query->where('office', 'CPMD')->orWhere('cpmd', 1);
                                })
                                ->whereNotNull('email')
                                ->whereNotNull('email_verified_at')
                                ->where('status', 'active')
                                ->get();
            
            $recipients = $recipients->merge($cpmdEmployees);
        }
        
        // For all types, always include specifically added assignees
        if ($this->notice->assignees && is_array($this->notice->assignees)) {
            $assignees = \App\Models\User::whereIn('id', $this->notice->assignees)
                                ->whereNotNull('email')
                                ->whereNotNull('email_verified_at')
                                ->where('status', 'active')
                                ->get();
            
            $recipients = $recipients->merge($assignees);
        }
        
        // Remove duplicates and send emails
        $uniqueRecipients = $recipients->unique('id');
        
        foreach ($uniqueRecipients as $recipient) {
            Mail::to($recipient->email)->send(new NoticeNotification($this->notice));
        }
    }
}
