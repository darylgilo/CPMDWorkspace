import { Head, router, usePage } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Separator } from '@/components/ui/separator';

// Read-only employee profile view for the directory
export default function EmployeeDirectoryView() {
  const pageProps = usePage().props as any;
  const { user } = pageProps;

  return (
    <AppLayout breadcrumbs={[
      { title: 'Employee Directory', href: '/directory' },
      { title: user?.name || 'Employee', href: `/directory/${user?.id}` },
    ]}>
      <Head title={user?.name ? `${user.name} • Employee` : 'Employee'} />

      <div className="p-4">
        <div className="mt-4 grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Left: profile summary card */}
          <div className="lg:col-span-1 bg-white dark:bg-neutral-900 rounded-xl border border-gray-200 dark:border-neutral-800 p-6">
            <div className="flex flex-col items-center gap-3">
              <div className="mt-1 text-xs"><span className={`${user?.status === 'active' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300' : 'bg-gray-100 text-gray-700 dark:bg-neutral-700 dark:text-gray-300'} px-2 py-0.5 rounded-full`}>{user?.status || '—'}</span></div>
              <div className="h-32 w-32 rounded-full overflow-hidden border border-gray-200 dark:border-neutral-700 bg-muted flex items-center justify-center">
                {user?.profile_picture ? (
                  <img src={`/storage/${user.profile_picture}`} className="h-full w-full object-cover" alt={user?.name} />
                ) : (
                  <svg className="w-12 h-12 text-muted-foreground" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                  </svg>
                )}
              </div>
              <div className="text-center">
                <div className="text-xl font-semibold text-gray-900 dark:text-white">{user?.name}</div>
                <div className="text-base text-gray-500 dark:text-neutral-400">{user?.position || '—'}</div>
                <div className="mt-4 space-y-2 text-center">
                  <div className="text-sm text-gray-500 dark:text-neutral-400">Employment Status</div>
                  <div className="text-base text-gray-900 dark:text-gray-100">{user?.employment_status || '—'}</div>
                  <div className="mt-3 text-sm text-gray-500 dark:text-neutral-400">Hiring Date</div>
                  <div className="text-base text-gray-900 dark:text-gray-100">{user?.hiring_date || '—'}</div>
                  <div className="mt-3 text-sm text-gray-500 dark:text-neutral-400">Office</div>
                  <div className="text-base text-gray-900 dark:text-gray-100">{user?.office || '—'}</div>
                  {user?.office === 'CPMD' && (
                    <>
                      <div className="mt-3 text-sm text-gray-500 dark:text-neutral-400">Section/Unit</div>
                      <div className="text-base text-gray-900 dark:text-gray-100">{user?.cpmd || '—'}</div>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Right: details display */}
          <div className="lg:col-span-2 bg-white dark:bg-neutral-900 rounded-xl border border-gray-200 dark:border-neutral-800 p-6" >
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="font-semibold text-gray-900 dark:text-gray-100">Personal Information</div>
              <div className="font-semibold text-gray-900 dark:text-gray-100">Additional Details</div>
              <div className="font-semibold text-gray-900 dark:text-gray-100">Emergency Contact</div>
            </div>
            <div className="mt-4 grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="space-y-4">
                <div className="text-sm text-gray-500 dark:text-neutral-400">Name</div>
                <div className="text-base text-gray-900 dark:text-gray-100">{user?.name || '—'}</div>
                <div className="text-sm text-gray-500 dark:text-neutral-400 mt-4">Email</div>
                <div className="text-base text-gray-900 dark:text-gray-100">{user?.email || '—'}</div>
                <div className="text-sm text-gray-500 dark:text-neutral-400 mt-4">Employee ID No.</div>
                <div className="text-base text-gray-900 dark:text-gray-100">{user?.employee_id || '—'}</div>
                <div className="text-sm text-gray-500 dark:text-neutral-400 mt-4">Position</div>
                <div className="text-base text-gray-900 dark:text-gray-100">{user?.position || '—'}</div>
                {user?.employment_status === 'Regular' && (
                  <>
                    <div className="text-sm text-gray-500 dark:text-neutral-400 mt-4">Item Number</div>
                    <div className="text-base text-gray-900 dark:text-gray-100">{user?.item_number || '—'}</div>
                  </>
                )}
                <div className="text-sm text-gray-500 dark:text-neutral-400 mt-4">Gender</div>
                <div className="text-base text-gray-900 dark:text-gray-100">{user?.gender || '—'}</div>
              </div>

              <div className="space-y-4">
                <div className="text-sm text-gray-500 dark:text-neutral-400">Hiring Date</div>
                <div className="text-base text-gray-900 dark:text-gray-100">{user?.hiring_date || '—'}</div>
                <div className="text-sm text-gray-500 dark:text-neutral-400 mt-4">TIN Number</div>
                <div className="text-base text-gray-900 dark:text-gray-100">{user?.tin_number || '—'}</div>
                <div className="text-sm text-gray-500 dark:text-neutral-400 mt-4">GSIS Number</div>
                <div className="text-base text-gray-900 dark:text-gray-100">{user?.gsis_number || '—'}</div>
                <div className="text-sm text-gray-500 dark:text-neutral-400 mt-4">Address</div>
                <div className="text-base text-gray-900 dark:text-gray-100">{user?.address || '—'}</div>
                <div className="text-sm text-gray-500 dark:text-neutral-400 mt-4">Date of Birth</div>
                <div className="text-base text-gray-900 dark:text-gray-100">{user?.date_of_birth || '—'}</div>
                <div className="text-sm text-gray-500 dark:text-neutral-400 mt-4">Mobile Number</div>
                <div className="text-base text-gray-900 dark:text-gray-100">{user?.mobile_number || '—'}</div>
              </div>

              <div className="space-y-4">
                <div className="text-sm text-gray-500 dark:text-neutral-400">Contact Person</div>
                <div className="text-base text-gray-900 dark:text-gray-100">{user?.contact_person || '—'}</div>
                <div className="text-sm text-gray-500 dark:text-neutral-400 mt-4">Contact Number</div>
                <div className="text-base text-gray-900 dark:text-gray-100">{user?.contact_number || '—'}</div>
              </div>
            </div>
            <div className="py-6">
              <Separator className="bg-gray-200 dark:bg-neutral-700" />
            </div>
            <div className="pt-2">
              <button onClick={() => router.get('/directory')} className="inline-flex w-fit max-w-fit whitespace-nowrap items-center gap-2 px-3 py-2 bg-[#163832] hover:bg-[#163832]/90 dark:bg-[#235347] dark:hover:bg-[#235347]/90 text-white rounded-md shrink-0 sm:self-auto">
                Back to directory
              </button>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
