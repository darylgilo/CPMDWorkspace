import { useState, useEffect } from 'react';
import { Head, router, usePage } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { UserPlus, Search, Eye } from 'lucide-react';

// Employee Management list page component
export default function EmployeeManagement() {
  const pageProps = usePage().props as any;
  const { users = { data: [], links: [] }, search: searchProp = '', perPage: perPageProp = 12, office: officeProp = '', cpmd: cpmdProp = '', auth } = pageProps;

  // Local UI state for filters and pagination
  const [search, setSearch] = useState<string>(searchProp || '');
  const [perPage, setPerPage] = useState<number>(Number(perPageProp) || 12);
  const [office, setOffice] = useState<string>(officeProp || '');
  const [cpmd, setCpmd] = useState<string>(cpmdProp || '');

  // Sync component state with server-provided props
  useEffect(() => setSearch(searchProp || ''), [searchProp]);
  useEffect(() => setPerPage(Number(perPageProp) || 12), [perPageProp]);
  useEffect(() => setOffice(officeProp || ''), [officeProp]);
  useEffect(() => setCpmd(cpmdProp || ''), [cpmdProp]);

  // Debounce search to avoid excessive requests
  useEffect(() => {
    const timer = setTimeout(() => {
      if (search !== searchProp) {
        router.get('/employees', { search, perPage, office, cpmd }, { preserveState: true, replace: true });
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [search]);

  const handleSearchChange = (value: string) => {
    setSearch(value);
  };

  // Navigate to selected pagination link
  const handlePageChange = (url: string) => {
    router.get(url, {}, { preserveState: true, replace: true });
  };

  return (
    <AppLayout breadcrumbs={[{ title: 'Employee Management', href: '/employees' }] }>
      <Head title="Employee Management" />

      <div className="p-4 flex flex-col gap-4">
        {/* Header actions */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 bg-white dark:bg-neutral-900 rounded-md border border-gray-200 dark:border-neutral-800 p-3 md:p-4" style={{ boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1), 0 2px 8px rgba(0, 0, 0, 0.06)' }}>
          {/* Filters and Add button on the left */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            {(auth?.user?.role === 'superadmin' || auth?.user?.role === 'admin') && (
              <button
                onClick={() => router.get('/employees/create')}
                className="inline-flex items-center justify-center gap-2 rounded-md bg-[#163832] hover:bg-[#163832]/90 dark:bg-[#235347] dark:hover:bg-[#235347]/90 px-3 py-2 text-sm text-white transition"
              >
                <UserPlus className="h-4 w-4" /> Add Employee
              </button>
            )}
            <select
              className="rounded-md border border-gray-300 px-3 py-2 text-sm outline-none transition focus:border-gray-500 dark:border-neutral-700 dark:bg-neutral-950 dark:text-gray-100"
              value={office}
              onChange={(e) => {
                const val = e.target.value;
                setOffice(val);
                // Reset section if office changes away from CPMD
                const nextCpmd = val === 'CPMD' ? cpmd : '';
                setCpmd(nextCpmd);
                router.get('/employees', { search, perPage, office: val, cpmd: nextCpmd }, { preserveState: true, replace: true });
              }}
            >
              <option value="">All Offices</option>
              <option value="DO">DO</option>
              <option value="ADO">ADO</option>
              <option value="CPMD">CPMD</option>
              <option value="AED">AED</option>
              <option value="NSQCS">NSQCS</option>
              <option value="NPQSD">NPQSD</option>
              <option value="NSIC">NSIC</option>
              <option value="CRPSD">CRPSD</option>
              <option value="PPSSD">PPSSD</option>
              <option value="ADMINISTRATIVE">ADMINISTRATIVE</option>
              <option value="Others">Others</option>
            </select>
            <select
              className="rounded-md border border-gray-300 px-3 py-2 text-sm outline-none transition focus:border-gray-500 dark:border-neutral-700 dark:bg-neutral-950 dark:text-gray-100 disabled:opacity-60"
              value={cpmd}
              disabled={office !== 'CPMD'}
              onChange={(e) => {
                const val = e.target.value;
                setCpmd(val);
                router.get('/employees', { search, perPage, office, cpmd: val }, { preserveState: true, replace: true });
              }}
            >
              <option value="">{office === 'CPMD' ? 'All Sections' : 'Select Office First'}</option>
              <option value="BIOCON section">BIOCON section</option>
              <option value="PFS section">PFS section</option>
              <option value="PHPS SECTION">PHPS SECTION</option>
              <option value="OC-Admin Support Unit">OC-Admin Support Unit</option>
              <option value="OC-ICT Unit">OC-ICT Unit</option>
              <option value="OC-Special Project">OC-Special Project</option>
              <option value="Others">Others</option>
            </select>
            <button
              type="button"
              onClick={() => {
                setOffice('');
                setCpmd('');
                router.get('/employees', { search, perPage, office: '', cpmd: '' }, { preserveState: true, replace: true });
              }}
              className="inline-flex items-center justify-center gap-2 rounded-md bg-[#163832] hover:bg-[#163832]/90 dark:bg-[#235347] dark:hover:bg-[#235347]/90 px-3 py-2 text-sm text-white transition"
            >
              Clear
            </button>
          </div>

          {/* Search on the right */}
          <div className="relative w-full md:w-auto">
            <input
              type="text"
              placeholder="Search employees"
              value={search}
              onChange={(e) => handleSearchChange(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  router.get('/employees', { search, perPage, office, cpmd }, { preserveState: true, replace: true });
                }
              }}
              className="w-full rounded-md border border-gray-300 px-3 py-2 pr-10 text-sm outline-none transition focus:border-gray-500 dark:border-neutral-700 dark:bg-neutral-950 md:w-80"
            />
            <button
              type="button"
              onClick={() => router.get('/employees', { search, perPage, office, cpmd }, { preserveState: true, replace: true })}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors cursor-pointer"
              aria-label="Search"
            >
              <Search className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Cards grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3 md:gap-4">
          {Array.isArray(users?.data) && users.data.length > 0 ? (
            users.data.map((u: any) => (
              <div key={u.id} className="bg-white dark:bg-neutral-900 rounded-lg border border-gray-200 dark:border-neutral-800 p-4 flex gap-3 transition hover:-translate-y-0.5 hover:shadow-lg" style={{ boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1), 0 2px 8px rgba(0, 0, 0, 0.06)' }}>
                <div className="h-14 w-14 rounded-full bg-muted overflow-hidden flex items-center justify-center border border-gray-200 dark:border-neutral-700">
                  {u.profile_picture ? (
                    <img src={`/storage/${u.profile_picture}`} className="h-full w-full object-cover" alt={u.name} />
                  ) : (
                    <svg className="w-8 h-8 text-muted-foreground" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                    </svg>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-gray-900 dark:text-white truncate">{u.name}</div>
                  <div className="text-xs text-gray-500 dark:text-neutral-400 truncate">{u.position || '—'}</div>
                  <div className="mt-1 text-xs text-gray-500 dark:text-neutral-400 truncate">{u.employee_id || u.email}</div>

                  <div className="mt-3 flex items-center justify-between">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${u.status === 'active' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300' : 'bg-gray-100 text-gray-700 dark:bg-neutral-700 dark:text-gray-300'}`}>{u.status || '—'}</span>
                    <button
                      onClick={() => router.get(`/employees/${u.id}`)}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-[#163832] hover:bg-[#163832]/90 text-white text-xs dark:bg-[#235347] dark:hover:bg-[#235347]/90"
                    >
                      <Eye className="h-3.5 w-3.5" /> View
                    </button>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-full text-center py-10 text-gray-500 dark:text-neutral-400">No employees found.</div>
          )}
        </div>

        {/* Pagination */}
        {users.links && users.links.length > 1 && (
          <div className="flex items-center justify-end gap-2 flex-wrap">
            {users.links.map((link: any, idx: number) => (
              <button
                key={idx}
                disabled={!link.url}
                className={`px-3 py-1 rounded border transition-colors ${
                  link.active
                    ? 'bg-[#163832] text-white hover:bg-[#163832]/90 border-[#163832] dark:bg-[#235347] dark:hover:bg-[#235347]/90 dark:border-[#235347]'
                    : (link.label?.includes('Previous') || link.label?.includes('Next'))
                        ? 'bg-[#163832] text-white hover:bg-[#235347] border-[#163832] dark:bg-[#235347] dark:hover:bg-[#235347]/90 dark:border-[#235347]'
                        : 'bg-white hover:bg-gray-50 text-gray-900 border-gray-300 dark:bg-neutral-800 dark:hover:bg-neutral-700 dark:text-gray-100 dark:border-neutral-600'
                }`}
                dangerouslySetInnerHTML={{ __html: link.label }}
                onClick={() => link.url && handlePageChange(link.url)}
              />
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
