<?php

namespace App\Mail;

use App\Models\Notice;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;

class NoticeNotification extends Mailable
{
    use Queueable, SerializesModels;

    public $notice;

    /**
     * Create a new message instance.
     */
    public function __construct(Notice $notice)
    {
        $this->notice = $notice;
    }

    /**
     * Build the message.
     */
    public function build()
    {
        return $this->subject("New {$this->notice->category}: {$this->notice->title}")
                    ->markdown('emails.notice-notification');
    }
}
