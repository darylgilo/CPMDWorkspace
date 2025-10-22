import { Head, useForm, usePage, router } from '@inertiajs/react';
import { Search, Eye, Trash2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { useMemo, useState, useEffect, useRef } from 'react';
type Category = 'Announcement/News' | 'Travel Notice' | 'Meeting Notice' | 'Event Notice';

// Display shape for a notice card in the UI
interface Notice {
  id: string;
  title: string;
  category: Category;
  description: string;
  username: string;
  createdAt: string;
  files_download_url?: string | null;
  file?: {
    name: string;
    url: string;
    type: string;
    size: number;
  } | null;
  files?: Array<{
    name: string;
    url: string;
    type: string;
    size: number;
  }>;
}

// Form payload shape sent to backend
interface FormData {
  title: string;
  category: Category;
  description: string;
  files: File[];
}

const categoryOptions: Category[] = [
  'Announcement/News',
  'Travel Notice',
  'Meeting Notice',
  'Event Notice',
];

const categoryIcon: Record<Category, string> = {
  'Announcement/News': '📰',
  'Travel Notice': '✈️',
  'Meeting Notice': '📅',
  'Event Notice': '📢',
};

export default function Noticeboard() {
  const pageProps = usePage().props as any;
  const serverNotices = (pageProps?.notices as any[]) ?? [];

  // Local form state for creating a notice
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<Category>('Announcement/News');
  const [description, setDescription] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [open, setOpen] = useState(false);

  // Edit dialog state
  const [editOpen, setEditOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingNotice, setEditingNotice] = useState<Notice | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editCategory, setEditCategory] = useState<Category>('Announcement/News');
  const [editDescription, setEditDescription] = useState('');
  const [editFiles, setEditFiles] = useState<File[]>([]);
  const editFileInputRef = useRef<HTMLInputElement | null>(null);

  const [filterCategory, setFilterCategory] = useState<'All' | Category>('All');
  const [search, setSearch] = useState('');

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    return () => {
      // cleanup any object URLs created in this component (none after backend refactor)
    };
  }, []);

 // Open edit dialog and populate with notice data (starts in read-only mode)
  function openEditDialog(notice: Notice) {
    setEditingNotice(notice);
    setEditTitle(notice.title);
    setEditCategory(notice.category);
    setEditDescription(notice.description);
    setEditFiles([]);
    if (editFileInputRef.current) editFileInputRef.current.value = '';
    setIsEditMode(false); // Start in read-only mode
    setEditOpen(true);
  }


  // Map backend props into a typed, UI-friendly array of notices
  const mappedNotices: Notice[] = useMemo(() => {
    return (serverNotices as any[]).map((n) => {
      const isImage = n.file_mime ? String(n.file_mime).startsWith('image/') : false;
      const filesArr = Array.isArray(n.files)
        ? (n.files as any[]).map((f) => ({
            name: f.name ?? 'file',
            url: f.url,
            type: f.mime ?? '',
            size: Number(f.size ?? 0),
          }))
        : [];
      return {
        id: String(n.id),
        title: n.title,
        category: n.category as Category,
        description: n.description,
        username: n.username,
        createdAt: n.created_at,
        files_download_url: n.files_download_url ?? null,
        file: n.file_url
          ? {
              name: n.file_name ?? 'file',
              url: n.file_url,
              type: n.file_mime ?? '',
              size: Number(n.file_size ?? 0),
            }
          : null,
        files: filesArr,
      } as Notice;
    });
  }, [serverNotices]);

  const filteredNotices = useMemo(() => {
    return mappedNotices
      .filter((n) => (filterCategory === 'All' ? true : n.category === filterCategory))
      .filter((n) => {
        const q = search.trim().toLowerCase();
        if (!q) return true;
        return (
          n.title.toLowerCase().includes(q) ||
          n.username.toLowerCase().includes(q) ||
          n.description.toLowerCase().includes(q)
        );
      })
      .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
  }, [mappedNotices, filterCategory, search]);

  // Programmatically download a file/blob given a URL and an optional filename
  async function downloadFile(url: string, filename?: string) {
    try {
      const res = await fetch(url, { credentials: 'include' });
      if (!res.ok) {
        window.open(url, '_blank');
        return;
      }
      const blob = await res.blob();
      const objectUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = objectUrl;
      a.download = filename || 'download';
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
    } catch (e) {
      window.open(url, '_blank');
    }
  }

  // Reset the create-notice form
  function resetForm() {
    setTitle('');
    setCategory('Announcement/News');
    setDescription('');
    setFiles([]);
    if (fileInputRef.current) fileInputRef.current.value = '';
  }

  // Capture multi-file input selection
  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const list = e.target.files ? Array.from(e.target.files) : [];
    setFiles(list);
  }

  // Inertia form for POST /noticeboard
  const form = useForm<FormData>({
    title: '',
    category: 'Announcement/News' as Category,
    description: '',
    files: [] as File[],
  });

  // Inertia form for updating a notice
  const editForm = useForm<FormData>({
    title: '',
    category: 'Announcement/News' as Category,
    description: '',
    files: [] as File[],
  });

  // Submit create-notice request with FormData (supports multi-file)
  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (form.processing) return; // prevent double submit while in-flight

    // Transform form data synchronously before submission
    form.transform(() => ({
      title,
      category,
      description,
      files,
    }));

    // Submit the form
    form.post('/noticeboard', {
      forceFormData: true,
      preserveScroll: true,
      onSuccess: () => {
        resetForm();
        setOpen(false);
      },
      onError: (errors: Record<string, string>) => {
        console.error('Error submitting notice:', errors);
      },
    });
  }

 

  // Handle edit file input change
  function handleEditFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const list = e.target.files ? Array.from(e.target.files) : [];
    setEditFiles(list);
  }

  // Reset edit form
  function resetEditForm() {
    setEditTitle('');
    setEditCategory('Announcement/News');
    setEditDescription('');
    setEditFiles([]);
    setIsEditMode(false);
    if (editFileInputRef.current) editFileInputRef.current.value = '';
  }

  // Submit update request
  function onEditSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!editingNotice || editForm.processing) return;

    // Transform form data synchronously before submission
    editForm.transform(() => ({
      title: editTitle,
      category: editCategory,
      description: editDescription,
      files: editFiles,
    }));

    // Submit the update (using POST with _method=PUT or PATCH)
    editForm.post(`/noticeboard/${editingNotice.id}`, {
      forceFormData: true,
      preserveScroll: true,
      onSuccess: () => {
        resetEditForm();
        setEditOpen(false);
        setEditingNotice(null);
      },
      onError: (errors: Record<string, string>) => {
        console.error('Error updating notice:', errors);
      },
    });
  }

  const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Noticeboard', href: '/noticeboard' },
  ];

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title="Noticeboard" />

      <div className="flex h-full flex-1 flex-col gap-6 overflow-x-hidden p-4">
        <div className="rounded-xl border border-sidebar-border/70 bg-white p-4 shadow-sm dark:border-sidebar-border dark:bg-neutral-900">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-3">
              <Dialog open={open} onOpenChange={setOpen}>
                <DialogTrigger asChild>
                  <button
                    disabled={form.processing}
                    className="inline-flex items-center justify-center gap-2 rounded-md bg-[#163832] hover:bg-[#163832]/90 dark:bg-[#235347] dark:hover:bg-[#235347]/90 px-3 py-2 text-sm text-white transition disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    Create Notice
                  </button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Create a Notice</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={onSubmit} className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div className="flex flex-col gap-2">
                      <label className="text-sm font-medium">Title</label>
                      <input
                        type="text"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="Enter title"
                        className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm outline-none transition focus:border-gray-500 dark:border-neutral-700 dark:bg-neutral-950"
                        required
                      />
                    </div>

                    <div className="flex flex-col gap-2">
                      <label className="text-sm font-medium">Category</label>
                      <select
                        value={category}
                        onChange={(e) => setCategory(e.target.value as Category)}
                        className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm outline-none transition focus:border-gray-500 dark:border-neutral-700 dark:bg-neutral-950"
                      >
                        {categoryOptions.map((opt) => (
                          <option key={opt} value={opt}>
                            {opt}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="md:col-span-2 flex flex-col gap-2">
                      <label className="text-sm font-medium">Description</label>
                      <textarea
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="Write the notice details..."
                        rows={4}
                        className="w-full resize-y rounded-md border border-gray-300 px-3 py-2 text-sm outline-none transition focus:border-gray-500 dark:border-neutral-700 dark:bg-neutral-950"
                        required
                      />
                    </div>

                    <div className="flex flex-col gap-2">
                      <label className="text-sm font-medium">Attach Files</label>
                      <input
                        ref={fileInputRef}
                        type="file"
                        onChange={handleFileChange}
                        multiple
                        className="w-full text-sm file:mr-4 file:rounded-md file:border file:border-gray-300 file:bg-white file:px-3 file:py-2 file:text-sm file:font-medium hover:file:bg-gray-50 dark:file:border-neutral-700 dark:file:bg-neutral-950 dark:hover:file:bg-neutral-900"
                        accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.txt"
                      />
                      {files.length > 0 && (
                        <div className="text-xs text-gray-600 dark:text-gray-300">
                          Selected ({files.length}): {files.map((f) => f.name).join(', ')}
                        </div>
                      )}
                    </div>

                    <div className="md:col-span-2 flex items-center justify-end gap-3">
                      <button
                        type="button"
                        onClick={resetForm}
                        className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium transition hover:bg-gray-50 dark:border-neutral-700 dark:hover:bg-neutral-900"
                      >
                        Reset
                      </button>
                      <button
                        type="submit"
                        disabled={form.processing}
                        className="rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white shadow transition hover:bg-neutral-800 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60 dark:bg-white dark:text-neutral-900 dark:hover:bg-gray-200"
                      >
                        {form.processing ? 'Submitting...' : 'Submit Notice'}
                      </button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>

              {/* View/Edit Notice Dialog */}
              <Dialog open={editOpen} onOpenChange={setEditOpen}>
                <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>{isEditMode ? 'Edit Notice' : 'View & Edit Notice'}</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={onEditSubmit} className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div className={`flex flex-col gap-2 ${!isEditMode ? 'md:col-span-2' : ''}`}>
                      <label className="text-sm font-medium">Title</label>
                      {!isEditMode ? (
                        <textarea
                          value={editTitle}
                          readOnly
                          rows={Math.ceil(editTitle.length / 80) || 1}
                          onFocus={(e) => e.target.blur()}
                          onMouseDown={(e) => e.preventDefault()}
                          style={{ userSelect: 'none', resize: 'none' }}
                          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm outline-none transition focus:border-gray-500 dark:border-neutral-700 dark:bg-neutral-950 cursor-default bg-gray-50 dark:bg-neutral-800"
                        />
                      ) : (
                        <input
                          type="text"
                          value={editTitle}
                          onChange={(e) => setEditTitle(e.target.value)}
                          placeholder="Enter title"
                          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm outline-none transition focus:border-gray-500 dark:border-neutral-700 dark:bg-neutral-950"
                          required
                        />
                      )}
                    </div>

                    <div className="flex flex-col gap-2">
                      <label className="text-sm font-medium">Category</label>
                      <select
                        value={editCategory}
                        onChange={(e) => setEditCategory(e.target.value as Category)}
                        disabled={!isEditMode}
                        className={`w-full rounded-md border border-gray-300 px-3 py-2 text-sm outline-none transition focus:border-gray-500 dark:border-neutral-700 dark:bg-neutral-950 ${!isEditMode ? 'cursor-default bg-gray-50 dark:bg-neutral-800' : ''}`}
                      >
                        {categoryOptions.map((opt) => (
                          <option key={opt} value={opt}>
                            {opt}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="md:col-span-2 flex flex-col gap-2">
                      <label className="text-sm font-medium">Description</label>
                      <textarea
                        value={editDescription}
                        onChange={(e) => setEditDescription(e.target.value)}
                        placeholder="Write the notice details..."
                        rows={15}
                        readOnly={!isEditMode}
                        onFocus={(e) => !isEditMode && e.target.blur()}
                        onMouseDown={(e) => !isEditMode && e.preventDefault()}
                        style={!isEditMode ? { userSelect: 'none' } : undefined}
                        className={`w-full resize-y rounded-md border border-gray-300 px-3 py-2 text-sm outline-none transition focus:border-gray-500 dark:border-neutral-700 dark:bg-neutral-950 ${!isEditMode ? 'cursor-default bg-gray-50 dark:bg-neutral-800' : ''}`}
                        required
                      />
                    </div>

                    {/* Show existing files if any */}
                    {editingNotice && (
                      <div className="md:col-span-2 flex flex-col gap-2">
                        <label className="text-sm font-medium">Current Attachments</label>
                        {editingNotice.files && editingNotice.files.length > 0 ? (
                          <div className="text-xs text-gray-600 dark:text-gray-300">
                            {editingNotice.files.map((f, idx) => (
                              <div key={idx} className="truncate">• {f.name}</div>
                            ))}
                          </div>
                        ) : editingNotice.file ? (
                          <div className="text-xs text-gray-600 dark:text-gray-300">
                            • {editingNotice.file.name}
                          </div>
                        ) : (
                          <div className="text-xs text-gray-500 italic">No attachments</div>
                        )}
                      </div>
                    )}

                    {/* Only show file upload in edit mode */}
                    {isEditMode && (
                      <div className="md:col-span-2 flex flex-col gap-2">
                        <label className="text-sm font-medium">Replace/Add Files</label>
                        <input
                          ref={editFileInputRef}
                          type="file"
                          onChange={handleEditFileChange}
                          multiple
                          className="w-full text-sm file:mr-4 file:rounded-md file:border file:border-gray-300 file:bg-white file:px-3 file:py-2 file:text-sm file:font-medium hover:file:bg-gray-50 dark:file:border-neutral-700 dark:file:bg-neutral-950 dark:hover:file:bg-neutral-900"
                          accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.txt"
                        />
                        {editFiles.length > 0 && (
                          <div className="text-xs text-gray-600 dark:text-gray-300">
                            New files ({editFiles.length}): {editFiles.map((f) => f.name).join(', ')}
                          </div>
                        )}
                      </div>
                    )}

                    <div className="md:col-span-2 flex items-center justify-end" style={{ gap: '6px' }}>
                      {!isEditMode && (
                        <button
                          type="button"
                          onClick={() => {
                            setEditOpen(false);
                            resetEditForm();
                          }}
                          className="inline-flex items-center justify-center rounded-md border border-gray-300 hover:bg-gray-50 px-4 py-2 text-sm font-medium transition dark:border-neutral-700 dark:hover:bg-neutral-800 min-w-[80px] h-[38px]"
                        >
                          Cancel
                        </button>
                      )}
                      {isEditMode && editingNotice && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            if (confirm('Are you sure you want to delete this notice?')) {
                              router.delete(`/noticeboard/${editingNotice.id}`, {
                                preserveScroll: true,
                                onSuccess: () => {
                                  setEditOpen(false);
                                  resetEditForm();
                                },
                              });
                            }
                          }}
                          className="inline-flex items-center justify-center rounded-md bg-red-600 hover:bg-red-700 px-4 py-2 text-sm font-medium text-white transition active:scale-[0.98] min-w-[38px] h-[38px]"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                      {!isEditMode ? (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            setIsEditMode(true);
                          }}
                          className="inline-flex items-center justify-center rounded-md bg-[#163832] hover:bg-[#163832]/90 px-4 py-2 text-sm font-medium text-white transition active:scale-[0.98] dark:bg-[#235347] dark:hover:bg-[#235347]/90 min-w-[100px] h-[38px]"
                        >
                          Edit Notice
                        </button>
                      ) : (
                        <button
                          type="submit"
                          disabled={editForm.processing}
                          className="inline-flex items-center justify-center rounded-md bg-[#163832] hover:bg-[#163832]/90 px-4 py-2 text-sm font-medium text-white transition active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60 dark:bg-[#235347] dark:hover:bg-[#235347]/90 min-w-[120px] h-[38px]"
                        >
                          {editForm.processing ? 'Updating...' : 'Update Notice'}
                        </button>
                      )}
                    </div>
                  </form>
                </DialogContent>
              </Dialog>

              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value as any)}
                className="rounded-md border border-gray-300 px-3 py-2 text-sm outline-none transition focus:border-gray-500 dark:border-neutral-700 dark:bg-neutral-950"
              >
                <option value="All">All Categories</option>
                {categoryOptions.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            </div>
            <div className="relative">
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by title or user..."
                className="w-full rounded-md border border-gray-300 px-3 py-2 pr-10 text-sm outline-none transition focus:border-gray-500 dark:border-neutral-700 dark:bg-neutral-950 md:w-80"
              />
              <button
                type="button"
                aria-label="Search"
                onClick={() => {}}
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1 text-gray-400 transition hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-neutral-800"
              >
                <Search className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
        
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredNotices.map((n) => {
            const isImage = n.file?.type?.startsWith('image/');
            return (
              <div
                key={n.id}
                className="group flex flex-col rounded-xl border border-sidebar-border/70 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md dark:border-sidebar-border dark:bg-neutral-900"
              >
                <div className="mb-2 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xl" aria-hidden>{categoryIcon[n.category]}</span>
                    <span
                      className="inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium text-gray-700 dark:text-gray-200"
                    >
                      {n.category}
                    </span>
                  </div>
                  <span className="text-xs text-gray-500">{new Date(n.createdAt).toLocaleString()}</span>
                </div>

                <h3 className="mb-1 line-clamp-1 text-base font-semibold">{n.title}</h3>
                <p className="mb-3 line-clamp-2 text-sm text-gray-700 dark:text-gray-200">{n.description}</p>

                {/** When a notice has multiple files, show one button that downloads an archive of all attachments */}
                {Array.isArray(n.files) && n.files.length > 0 && n.files_download_url && (
                  <div className="mb-3">
                    <a
                      href={n.files_download_url}
                      onClick={(e) => {
                        e.preventDefault();
                        const filename = (n as any).files_download_name || `${n.title || 'attachments'}.zip`;
                        downloadFile(n.files_download_url!, filename as string);
                      }}
                      className="inline-block w-full truncate rounded-md border bg-gray-50 px-3 py-2 text-sm hover:underline dark:border-neutral-700 dark:bg-neutral-950"
                    >
                      Attachments ({n.files.length})
                    </a>
                  </div>
                )}

                {/** Fallback: legacy single-file preview/link */}
                {!n.files?.length && n.file && (
                  <div className="mb-3 overflow-hidden rounded-md border text-sm dark:border-neutral-700">
                    {isImage ? (
                      <img
                        src={n.file.url}
                        alt={n.file.name}
                        className="h-40 w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
                      />)
                    : (
                      <a
                        href={n.file.url}
                        onClick={(e) => {
                          e.preventDefault();
                          downloadFile(n.file!.url, n.file!.name);
                        }}
                        className="block truncate bg-gray-50 px-3 py-2 hover:underline dark:bg-neutral-950"
                      >
                        {n.file.name}
                      </a>
                    )}
                  </div>
                )}

                <div className="mt-auto flex items-center justify-between text-xs text-gray-600 dark:text-gray-300">
                  <span>Posted by {n.username}</span>
                  <button
                    onClick={() => openEditDialog(n)}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-[#163832] hover:bg-[#163832]/90 text-white text-xs dark:bg-[#235347] dark:hover:bg-[#235347]/90"
                  >
                    <Eye className="h-3.5 w-3.5" />
                    View
                  </button>
                </div>
              </div>
            );
          })}

          {filteredNotices.length === 0 && (
            <div className="col-span-full rounded-xl border border-dashed p-8 text-center text-sm text-gray-500 dark:border-neutral-700">
              No notices yet. Create one above.
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
