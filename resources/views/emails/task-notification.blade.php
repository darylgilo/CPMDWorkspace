@component('mail::message')
# {{ $type === 'created' ? 'New Task Assigned' : 'Task Progress Update' }}

Hello,

{{ $type === 'created' 
    ? 'You have been assigned to a new task:' 
    : 'A task you are assigned to has been updated.' }}

**Task Title:** {{ $task->title }}
@if($task->description)
**Description:** {{ $task->description }}
@endif

**Task Details:**
- **End Date:** {{ $task->end_date ? $task->end_date->format('M d, Y') : 'No deadline set' }}
- **Priority:** {{ ucfirst($task->priority) }}
- **Progress:** {{ $task->progress }}%
- **Status:** {{ str_replace('_', ' ', ucfirst($task->status)) }}

**Assignees:**
{{ implode(', ', $assigneeNames) }}

@component('mail::button', ['url' => config('app.url') . '/taskboard'])
View Taskboard
@endcomponent

Thanks,<br>

{{ config('app.name') }}
@endcomponent
