<?php

namespace App\Http\Controllers;

use App\Models\Notice;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use ZipArchive;

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
            'category' => ['required', 'in:Announcement/News,Travel Notice,Meeting Notice,Event Notice'],
            'description' => ['required', 'string'],
            'file' => ['nullable', 'file', 'max:10240'],
            'files' => ['nullable', 'array'],
            'files.*' => ['file', 'max:10240'],
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
        ]);

        return redirect()->route('noticeboard.index');
    }

    // Update an existing notice
    public function update(Request $request, Notice $notice)
    {
        // Optional: Check if user owns the notice or has permission to edit
        // if ($notice->user_id !== Auth::id()) {
        //     abort(403);
        // }

        $validated = $request->validate([
            'title' => ['required', 'string', 'max:255'],
            'category' => ['required', 'in:Announcement/News,Travel Notice,Meeting Notice,Event Notice'],
            'description' => ['required', 'string'],
            'files' => ['nullable', 'array'],
            'files.*' => ['file', 'max:10240'],
        ]);

        // Update basic fields
        $notice->title = $validated['title'];
        $notice->category = $validated['category'];
        $notice->description = $validated['description'];

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
        $files = is_array($notice->files) ? $notice->files : [];
        if (empty($files)) {
            if ($notice->file_path && Storage::exists($notice->file_path)) {
                return $this->download($notice);
            }
            abort(404);
        }

        if (class_exists(\ZipArchive::class)) {
            $tmp = tempnam(sys_get_temp_dir(), 'notice_');
            $zipPath = $tmp . '.zip';
            @unlink($tmp);

            $zip = new \ZipArchive();
            if ($zip->open($zipPath, \ZipArchive::CREATE | \ZipArchive::OVERWRITE) !== true) {
                abort(500);
            }

            foreach ($files as $f) {
                $p = $f['path'] ?? null;
                if (!$p || !Storage::exists($p)) {
                    continue;
                }
                $abs = Storage::path($p);
                $name = $f['name'] ?? basename($p);
                $zip->addFile($abs, $name);
            }

            $zip->close();

            $downloadName = 'notice-' . $notice->id . '-attachments.zip';
            return response()->download($zipPath, $downloadName)->deleteFileAfterSend(true);
        }

        $tmp = tempnam(sys_get_temp_dir(), 'notice_');
        $tarPath = $tmp . '.tar';
        @unlink($tmp);

        try {
            $phar = new \PharData($tarPath);
            foreach ($files as $f) {
                $p = $f['path'] ?? null;
                if (!$p || !Storage::exists($p)) {
                    continue;
                }
                $abs = Storage::path($p);
                $name = $f['name'] ?? basename($p);
                $phar->addFile($abs, $name);
            }
            $phar->compress(\Phar::GZ);
            unset($phar);
            @unlink($tarPath);
        } catch (\Exception $e) {
            abort(500);
        }

        $tarGzPath = $tarPath . '.gz';
        $downloadName = 'notice-' . $notice->id . '-attachments.tar.gz';
        return response()->download($tarGzPath, $downloadName)->deleteFileAfterSend(true);
    }
}

