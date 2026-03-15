@component('mail::message')
# Writeup Ready for Review

Hello,

A new writeup has been submitted for review.

**Title:** {{ $document->title }}

**Category:** {{ str_replace('_', ' ', ucfirst($document->category)) }}

**Author:** {{ $document->user->name }}

**Submitted At:** {{ $document->updated_at->format('M d, Y h:i A') }}

@component('mail::button', ['url' => config('app.url') . '/writing'])
Review Document
@endcomponent

Thanks,<br>

{{ config('app.name') }}
@endcomponent
