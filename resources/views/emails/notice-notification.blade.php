@component('mail::message')
# {{ $notice->category }}

Hello CPMD,

A new {{ strtolower($notice->category) }} has been posted on the Noticeboard.

**Title:** {{ $notice->title }}

**Category:** {{ $notice->category }}

@if($notice->date)
**Scheduled Date:** {{ \Carbon\Carbon::parse($notice->date)->format('M d, Y') }}
@endif

@if($notice->time)
**Time:** {{ \Carbon\Carbon::parse($notice->time)->format('h:i A') }}
@endif

**Description:**
{{ $notice->description }}

@if($notice->file_name)
**Attachment:** {{ $notice->file_name }}
@elseif(is_array($notice->files) && count($notice->files) > 0)
**Attachments:** {{ count($notice->files) }} file(s) attached.
@endif

@component('mail::button', ['url' => config('app.url') . '/noticeboard'])
View Noticeboard
@endcomponent

Thanks,<br>
{{ config('app.name') }}
@endcomponent
