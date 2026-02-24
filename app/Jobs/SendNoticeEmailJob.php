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
        $cpmdEmployees = \App\Models\User::where('cpmd', 1)
                            ->whereNotNull('email')
                            ->whereNotNull('email_verified_at')
                            ->where('status', 'active')
                            ->get();
        
        foreach ($cpmdEmployees as $employee) {
            Mail::to($employee->email)->send(new NoticeNotification($this->notice));
        }
    }
}
