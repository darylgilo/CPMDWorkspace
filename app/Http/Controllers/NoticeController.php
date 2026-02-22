<?php

namespace App\Http\Controllers;

use App\Models\Notice;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use ZipArchive;
use PharData;
use Exception;

class NoticeController extends Controller
{
    // List notices for the Noticeboard page and shape the data for the frontend
    public function index()
    {
        $notices = Notice::query()
            ->with('user')
            ->latest()
            ->get()
            ->map(function (Notice $notice) {
                $hasFiles = is_array($notice->files) && count($notice->files) > 0;
                $zipAvailable = class_exists(\ZipArchive::class);
                return [
                    'id' => $notice->id,
                    'title' => $notice->title,
                    'category' => $notice->category,
                    'description' => $notice->description,
                    'username' => optional($notice->user)->name ?? 'Unknown',
                    'created_at' => $notice->created_at->toIso8601String(),
                    'file_name' => $notice->file_name,
                    'file_mime' => $notice->file_mime,
                    'file_size' => $notice->file_size,
                    'file_url' => $notice->file_path ? route('noticeboard.download', $notice) : null,
                    'date' => $notice->date,
                    'time' => $notice->time,
                    // Array of attachments (for multiple files)
                    'files' => collect($notice->files ?? [])->map(function ($f) {
                        return [
                            'path' => $f['path'] ?? null,
                            'name' => $f['name'] ?? null,
                            'mime' => $f['mime'] ?? null,
                            'size' => $f['size'] ?? null,
                            'url'  => isset($f['path']) ? Storage::url($f['path']) : null,
                        ];
                    })->all(),
                    // One-click download URL and suggested filename for all attachments
                    'files_download_url' => $hasFiles ? route('noticeboard.downloadAll', $notice) : null,
                    'files_download_name' => $hasFiles
                        ? ('notice-' . $notice->id . '-attachments.' . ($zipAvailable ? 'zip' : 'tar.gz'))
                        : null,
                ];
            });

        return Inertia::render('Noticeboard/index', [
            'notices' => $notices,
        ]);
    }

    // Create a notice and handle both legacy single-file and new multiple-file uploads
    public function store(Request $request)
    {
        $validated = $request->validate([
            'title' => ['required', 'string', 'max:255'],
            'category' => ['required', 'in:Announcement,Notice of Meeting,Notice of Event,Reminder/Deadline'],
            'description' => ['required', 'string'],
            'file' => ['nullable', 'file', 'max:10240'],
            'files' => ['nullable', 'array'],
            'files.*' => ['file', 'max:10240'],
            'date' => ['nullable', 'date'],
            'time' => ['nullable', 'date_format:H:i'],
        ]);

        // Guard against accidental duplicate submissions (e.g., double-clicking submit)
        // If the same user posts the exact same title/category/description within 2 minutes, skip creating a new one
        $recentDuplicateExists = Notice::query()
            ->where('user_id', Auth::id())
            ->where('title', $validated['title'])
            ->where('category', $validated['category'])
            ->where('description', $validated['description'])
            ->where('created_at', '>=', now()->subMinutes(2))
            ->exists();

        if ($recentDuplicateExists) {
            return redirect()->route('noticeboard.index');
        }

        $filePath = null;
        $fileName = null;
        $fileMime = null;
        $fileSize = null;
        $filesMeta = null;

        if ($request->hasFile('files')) {
            $filesMeta = [];
            foreach ($request->file('files') as $uploaded) {
                if (!$uploaded) {
                    continue;
                }
                $storedPath = $uploaded->store('public/notices');
                $filesMeta[] = [
                    'path' => $storedPath,
                    'name' => $uploaded->getClientOriginalName(),
                    'mime' => $uploaded->getClientMimeType(),
                    'size' => $uploaded->getSize(),
                ];
            }
            if (count($filesMeta) === 1) {
                $filePath = $filesMeta[0]['path'];
                $fileName = $filesMeta[0]['name'];
                $fileMime = $filesMeta[0]['mime'];
                $fileSize = $filesMeta[0]['size'];
            }
        } elseif ($request->hasFile('file')) {
            $uploaded = $request->file('file');
            $filePath = $uploaded->store('public/notices');
            $fileName = $uploaded->getClientOriginalName();
            $fileMime = $uploaded->getClientMimeType();
            $fileSize = $uploaded->getSize();
            $filesMeta = [[
                'path' => $filePath,
                'name' => $fileName,
                'mime' => $fileMime,
                'size' => $fileSize,
            ]];
        }

        $notice = Notice::create([
            'title' => $validated['title'],
            'category' => $validated['category'],
            'description' => $validated['description'],
            'user_id' => Auth::id(),
            'file_path' => $filePath,
            'file_name' => $fileName,
            'file_mime' => $fileMime,
            'file_size' => $fileSize,
            'files' => $filesMeta,
            'date' => $validated['date'] ?? null,
            'time' => $validated['time'] ?? null,
        ]);

        return redirect()->route('noticeboard.index');
    }

    // Update an existing notice
    public function update(Request $request, Notice $notice)
    {
        // Check if user owns the notice or is an admin/superadmin
        if ($notice->user_id !== Auth::id() && !in_array(Auth::user()->role, ['admin', 'superadmin'])) {
            abort(403, 'Unauthorized action.');
        }

        $validated = $request->validate([
            'title' => ['required', 'string', 'max:255'],
            'category' => ['required', 'in:Announcement,Notice of Meeting,Notice of Event,Reminder/Deadline'],
            'description' => ['required', 'string'],
            'files' => ['nullable', 'array'],
            'files.*' => ['file', 'max:10240'],
            'date' => ['nullable', 'date'],
            'time' => ['nullable', 'date_format:H:i'],
        ]);

        // Update basic fields
        $notice->title = $validated['title'];
        $notice->category = $validated['category'];
        $notice->description = $validated['description'];
        $notice->date = $validated['date'] ?? null;
        $notice->time = $validated['time'] ?? null;

        // Handle new file uploads if provided
        if ($request->hasFile('files')) {
            $filesMeta = [];
            foreach ($request->file('files') as $uploaded) {
                if (!$uploaded) {
                    continue;
                }
                $storedPath = $uploaded->store('public/notices');
                $filesMeta[] = [
                    'path' => $storedPath,
                    'name' => $uploaded->getClientOriginalName(),
                    'mime' => $uploaded->getClientMimeType(),
                    'size' => $uploaded->getSize(),
                ];
            }

            // If new files uploaded, replace old ones
            if (count($filesMeta) > 0) {
                // Optionally delete old files from storage
                if (is_array($notice->files)) {
                    foreach ($notice->files as $oldFile) {
                        if (isset($oldFile['path']) && Storage::exists($oldFile['path'])) {
                            Storage::delete($oldFile['path']);
                        }
                    }
                } elseif ($notice->file_path && Storage::exists($notice->file_path)) {
                    Storage::delete($notice->file_path);
                }

                // Update file metadata
                if (count($filesMeta) === 1) {
                    $notice->file_path = $filesMeta[0]['path'];
                    $notice->file_name = $filesMeta[0]['name'];
                    $notice->file_mime = $filesMeta[0]['mime'];
                    $notice->file_size = $filesMeta[0]['size'];
                }
                $notice->files = $filesMeta;
            }
        }

        $notice->save();

        return redirect()->route('noticeboard.index');
    }

    // Download the legacy single attachment for a notice
    public function download(Notice $notice)
    {
        if (!$notice->file_path) {
            abort(404);
        }

        $path = $notice->file_path;
        $filename = $notice->file_name ?: basename($path);
        $mime = $notice->file_mime ?: null;

        if (!Storage::exists($path)) {
            abort(404);
        }

        $headers = [];
        if ($mime) {
            $headers['Content-Type'] = $mime;
        }

        return Storage::download($path, $filename, $headers);
    }

    // Download all attachments as a single archive (ZIP if available, otherwise TAR.GZ)
    public function downloadAll(Notice $notice)
    {
        // Check for legacy single file first
        if ($notice->file_path) {
            if (Storage::exists($notice->file_path)) {
                return $this->download($notice);
            }
            abort(404, 'The requested file could not be found');
        }

        // Handle multiple files
        $files = is_array($notice->files) ? $notice->files : [];
        if (empty($files)) {
            abort(404, 'No files found for this notice');
        }

        // Validate files array
        $validFiles = [];
        foreach ($files as $file) {
            if (!is_array($file) || empty($file['path']) || !is_string($file['path'])) {
                continue;
            }
            $path = $file['path'];
            if (!Storage::exists($path)) {
                continue;
            }
            $validFiles[] = [
                'path' => $path,
                'name' => $file['name'] ?? basename($path)
            ];
        }

        if (empty($validFiles)) {
            abort(404, 'No valid files found for download');
        }

        // Try ZIP first if available
        if (class_exists(\ZipArchive::class)) {
            $zip = new \ZipArchive();
            $zipName = 'notice-' . $notice->id . '-attachments-' . time() . '.zip';
            $zipPath = sys_get_temp_dir() . '/' . $zipName;
            
            if ($zip->open($zipPath, \ZipArchive::CREATE | \ZipArchive::OVERWRITE) !== true) {
                abort(500, 'Cannot create ZIP file');
            }

            $addedFiles = 0;
            foreach ($validFiles as $file) {
                try {
                    $filePath = Storage::path($file['path']);
                    if (file_exists($filePath)) {
                        $zip->addFile($filePath, $file['name']);
                        $addedFiles++;
                    }
                } catch (\Exception $e) {
                    continue;
                }
            }

            $zip->close();

            if ($addedFiles === 0) {
                @unlink($zipPath);
                abort(404, 'No files could be added to archive');
            }

            // Stream the file directly to the browser
            return response()->stream(
                function () use ($zipPath) {
                    if (file_exists($zipPath)) {
                        readfile($zipPath);
                        @unlink($zipPath);
                    }
                },
                200,
                [
                    'Content-Type' => 'application/zip',
                    'Content-Disposition' => 'attachment; filename="' . $zipName . '"',
                    'Content-Length' => filesize($zipPath),
                    'Pragma' => 'no-cache',
                    'Expires' => '0',
                    'Cache-Control' => 'must-revalidate, post-check=0, pre-check=0',
                ]
            );
        }

        // Fallback to TAR.GZ if ZIP is not available
        $tmp = tempnam(sys_get_temp_dir(), 'notice_');
        if ($tmp === false) {
            abort(500, 'Failed to create temporary file');
        }
        
        $tarPath = $tmp . '.tar';
        $tarGzPath = $tarPath . '.gz';
        @unlink($tmp);

        try {
            $phar = new \PharData($tarPath);
            $addedFiles = 0;
            
            foreach ($validFiles as $file) {
                try {
                    $content = Storage::get($file['path']);
                    if ($content === false) {
                        continue;
                    }
                    $phar->addFromString($file['name'], $content);
                    $addedFiles++;
                } catch (\Exception $e) {
                    continue;
                }
            }
            
            if ($addedFiles === 0) {
                @unlink($tarPath);
                @unlink($tarGzPath);
                abort(404, 'No files could be added to archive');
            }
            
            // Compress the TAR to TAR.GZ
            $phar->compress(\Phar::GZ);
            unset($phar); // Close the PharData object
            
            // Clean up the uncompressed TAR file
            @unlink($tarPath);
            
            if (!file_exists($tarGzPath)) {
                abort(500, 'Failed to create compressed archive');
            }
            
            $downloadName = 'notice-' . $notice->id . '-attachments.tar.gz';
            return response()->download($tarGzPath, $downloadName, [
                'Content-Type' => 'application/gzip'
            ])->deleteFileAfterSend(true);
            
        } catch (\Exception $e) {
            // Clean up any partial files
            @unlink($tarPath);
            @unlink($tarGzPath);
            abort(500, 'Failed to create archive: ' . $e->getMessage());
        }
    }

    // Delete a notice and its associated files
    public function destroy(Notice $notice)
    {
        // Check if user owns the notice or is an admin/superadmin
        if ($notice->user_id !== Auth::id() && !in_array(Auth::user()->role, ['admin', 'superadmin'])) {
            abort(403, 'Unauthorized action.');
        }

        // Delete all associated files from storage
        if (is_array($notice->files)) {
            foreach ($notice->files as $file) {
                if (isset($file['path']) && Storage::exists($file['path'])) {
                    Storage::delete($file['path']);
                }
            }
        } elseif ($notice->file_path && Storage::exists($notice->file_path)) {
            Storage::delete($notice->file_path);
        }

        // Delete the notice record
        $notice->delete();

        return redirect()->route('noticeboard.index');
    }

    // Display announcements page with calendar
    public function announcements()
    {
        $notices = Notice::query()
            ->with('user')
            ->latest()
            ->get()
            ->map(function (Notice $notice) {
                $hasFiles = is_array($notice->files) && count($notice->files) > 0;
                $zipAvailable = class_exists(\ZipArchive::class);
                return [
                    'id' => $notice->id,
                    'title' => $notice->title,
                    'category' => $notice->category,
                    'description' => $notice->description,
                    'username' => optional($notice->user)->name ?? 'Unknown',
                    'created_at' => $notice->created_at->toIso8601String(),
                    'file_name' => $notice->file_name,
                    'file_mime' => $notice->file_mime,
                    'file_size' => $notice->file_size,
                    'file_url' => $notice->file_path ? route('noticeboard.download', $notice) : null,
                    'date' => $notice->date,
                    'time' => $notice->time,
                    // Array of attachments (for multiple files)
                    'files' => collect($notice->files ?? [])->map(function ($f) {
                        return [
                            'path' => $f['path'] ?? null,
                            'name' => $f['name'] ?? null,
                            'mime' => $f['mime'] ?? null,
                            'size' => $f['size'] ?? null,
                            'url'  => isset($f['path']) ? Storage::url($f['path']) : null,
                        ];
                    })->all(),
                    // One-click download URL and suggested filename for all attachments
                    'files_download_url' => $hasFiles ? route('noticeboard.downloadAll', $notice) : null,
                    'files_download_name' => $hasFiles
                        ? ('notice-' . $notice->id . '-attachments.' . ($zipAvailable ? 'zip' : 'tar.gz'))
                        : null,
                ];
            });

        return Inertia::render('Noticeboard/announcement', [
            'notices' => $notices,
        ]);
    }

        
    // Display events page with calendar
    public function events()
    {
        $notices = Notice::query()
            ->with('user')
            ->where('category', 'Notice of Event')
            ->latest()
            ->get()
            ->map(function (Notice $notice) {
                $hasFiles = is_array($notice->files) && count($notice->files) > 0;
                $zipAvailable = class_exists(\ZipArchive::class);
                return [
                    'id' => $notice->id,
                    'title' => $notice->title,
                    'category' => $notice->category,
                    'description' => $notice->description,
                    'username' => optional($notice->user)->name ?? 'Unknown',
                    'created_at' => $notice->created_at->toIso8601String(),
                    'file_name' => $notice->file_name,
                    'file_mime' => $notice->file_mime,
                    'file_size' => $notice->file_size,
                    'file_url' => $notice->file_path ? route('noticeboard.download', $notice) : null,
                    'date' => $notice->date,
                    'time' => $notice->time,
                    // Array of attachments (for multiple files)
                    'files' => collect($notice->files ?? [])->map(function ($f) {
                        return [
                            'path' => $f['path'] ?? null,
                            'name' => $f['name'] ?? null,
                            'mime' => $f['mime'] ?? null,
                            'size' => $f['size'] ?? null,
                            'url'  => isset($f['path']) ? Storage::url($f['path']) : null,
                        ];
                    })->all(),
                    // One-click download URL and suggested filename for all attachments
                    'files_download_url' => $hasFiles ? route('noticeboard.downloadAll', $notice) : null,
                    'files_download_name' => $hasFiles
                        ? ('notice-' . $notice->id . '-attachments.' . ($zipAvailable ? 'zip' : 'tar.gz'))
                        : null,
                ];
            });

        return Inertia::render('Noticeboard/event', [
            'notices' => $notices,
        ]);
    }

    // Display meetings page with calendar
    public function meetings()
    {
        $notices = Notice::query()
            ->with('user')
            ->where('category', 'Notice of Meeting')
            ->latest()
            ->get()
            ->map(function (Notice $notice) {
                $hasFiles = is_array($notice->files) && count($notice->files) > 0;
                $zipAvailable = class_exists(\ZipArchive::class);
                return [
                    'id' => $notice->id,
                    'title' => $notice->title,
                    'category' => $notice->category,
                    'description' => $notice->description,
                    'username' => optional($notice->user)->name ?? 'Unknown',
                    'created_at' => $notice->created_at->toIso8601String(),
                    'file_name' => $notice->file_name,
                    'file_mime' => $notice->file_mime,
                    'file_size' => $notice->file_size,
                    'file_url' => $notice->file_path ? route('noticeboard.download', $notice) : null,
                    'date' => $notice->date,
                    'time' => $notice->time,
                    'files' => collect($notice->files ?? [])->map(function ($f) {
                        return [
                            'path' => $f['path'] ?? null,
                            'name' => $f['name'] ?? null,
                            'mime' => $f['mime'] ?? null,
                            'size' => $f['size'] ?? null,
                            'url'  => isset($f['path']) ? Storage::url($f['path']) : null,
                        ];
                    })->all(),
                    'files_download_url' => $hasFiles ? route('noticeboard.downloadAll', $notice) : null,
                    'files_download_name' => $hasFiles
                        ? ('notice-' . $notice->id . '-attachments.' . ($zipAvailable ? 'zip' : 'tar.gz'))
                        : null,
                ];
            });

        return Inertia::render('Noticeboard/meeting', [
            'notices' => $notices,
        ]);
    }

    // Display reminders/deadlines page with calendar
    public function reminders()
    {
        $notices = Notice::query()
            ->with('user')
            ->where('category', 'Reminder/Deadline')
            ->latest()
            ->get()
            ->map(function (Notice $notice) {
                $hasFiles = is_array($notice->files) && count($notice->files) > 0;
                $zipAvailable = class_exists(\ZipArchive::class);
                return [
                    'id' => $notice->id,
                    'title' => $notice->title,
                    'category' => $notice->category,
                    'description' => $notice->description,
                    'username' => optional($notice->user)->name ?? 'Unknown',
                    'created_at' => $notice->created_at->toIso8601String(),
                    'file_name' => $notice->file_name,
                    'file_mime' => $notice->file_mime,
                    'file_size' => $notice->file_size,
                    'file_url' => $notice->file_path ? route('noticeboard.download', $notice) : null,
                    'date' => $notice->date,
                    'time' => $notice->time,
                    'files' => collect($notice->files ?? [])->map(function ($f) {
                        return [
                            'path' => $f['path'] ?? null,
                            'name' => $f['name'] ?? null,
                            'mime' => $f['mime'] ?? null,
                            'size' => $f['size'] ?? null,
                            'url'  => isset($f['path']) ? Storage::url($f['path']) : null,
                        ];
                    })->all(),
                    'files_download_url' => $hasFiles ? route('noticeboard.downloadAll', $notice) : null,
                    'files_download_name' => $hasFiles
                        ? ('notice-' . $notice->id . '-attachments.' . ($zipAvailable ? 'zip' : 'tar.gz'))
                        : null,
                ];
            });

        return Inertia::render('Noticeboard/reminder', [
            'notices' => $notices,
        ]);
    }

    // API endpoint for CalendarWidget
    public function getNoticesForWidget()
    {
        $notices = Notice::query()
            ->with('user')
            ->whereNotNull('date') // Only include notices with dates
            ->latest()
            ->get()
            ->map(function (Notice $notice) {
                return [
                    'id' => $notice->id,
                    'title' => $notice->title,
                    'category' => $notice->category,
                    'description' => $notice->description,
                    'username' => optional($notice->user)->name ?? 'Unknown',
                    'created_at' => $notice->created_at->toIso8601String(),
                    'date' => $notice->date,
                    'time' => $notice->time,
                ];
            });

        return response()->json($notices);
    }
}
