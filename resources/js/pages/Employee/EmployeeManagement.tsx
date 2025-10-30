import { useState, useEffect, useMemo } from 'react';
import { Head, router, usePage } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { UserPlus, Eye } from 'lucide-react';
import CustomPagination from '@/components/CustomPagination';
import SearchBar from '@/components/SearchBar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

// Employee Management list page component
export default function EmployeeManagement() {
  const pageProps = usePage().props as any;
  const { users = { data: [], links: [] }, auth } = pageProps;

  // Local state for search, filters, and employees
  const [search, setSearch] = useState<string>('');
  const [perPage, setPerPage] = useState<number>(12);
  const [office, setOffice] = useState<string>('');
  const [cpmd, setCpmd] = useState<string>('');
  const [currentPage, setCurrentPage] = useState(1);
  
  // Load all employees once on component mount
  const [allEmployees, setAllEmployees] = useState(users.data || []);
  
  // Update all employees when data changes
  useEffect(() => {
    setAllEmployees(users.data || []);
  }, [users.data]);

  // Filter employees based on search and filters
  const filteredEmployees = useMemo(() => {
    let result = [...allEmployees];
    
    // Apply office filter
    if (office) {
      result = result.filter(emp => emp.office === office);
    }
    
    // Apply CPMD section filter if office is CPMD
    if (office === 'CPMD' && cpmd) {
      result = result.filter(emp => emp.cpmd_section === cpmd);
    }
    
    // Apply search
    if (search) {
      const query = search.toLowerCase();
      result = result.filter(emp => 
        (emp.name?.toLowerCase().includes(query) ||
         emp.email?.toLowerCase().includes(query) ||
         emp.position?.toLowerCase().includes(query))
      );
    }
    
    return result;
  }, [allEmployees, search, office, cpmd]);
  
  // Pagination
  const totalPages = Math.ceil(filteredEmployees.length / perPage);
  const paginatedEmployees = useMemo(() => {
    const startIndex = (currentPage - 1) * perPage;
    return filteredEmployees.slice(startIndex, startIndex + perPage);
  }, [filteredEmployees, currentPage, perPage]);
  
  // Handle page changes when filters or items per page changes
  useEffect(() => {
    const newTotalPages = Math.ceil(filteredEmployees.length / perPage);
    if (currentPage > newTotalPages && newTotalPages > 0) {
      setCurrentPage(newTotalPages);
    } else if (currentPage === 0 && newTotalPages > 0) {
      setCurrentPage(1);
    } else if (search || office || cpmd) {
      setCurrentPage(1);
    }
    updateUrl();
  }, [search, office, cpmd, perPage, filteredEmployees.length]);
  
  // Update URL without page reload
  const updateUrl = () => {
    const params = new URLSearchParams();
    if (search) params.set('search', search);
    if (perPage !== 12) params.set('perPage', perPage.toString());
    if (office) params.set('office', office);
    if (cpmd) params.set('cpmd', cpmd);
    if (currentPage > 1) params.set('page', currentPage.toString());
    
    const url = `${window.location.pathname}?${params.toString()}`;
    window.history.replaceState({}, '', url);
  };

  const handleSearchChange = (value: string) => {
    setSearch(value);
  };
  
  // Handle page change for pagination
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    updateUrl();
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
            <Select
              value={office || "all"}
              onValueChange={(val) => {
                const newValue = val === "all" ? "" : val;
                setOffice(newValue);
                // Reset section if office changes away from CPMD
                const nextCpmd = newValue === 'CPMD' ? cpmd : '';
                setCpmd(nextCpmd);
                // Update state only, no server request needed
              }}
            >
              <SelectTrigger className="w-[180px] border-gray-300 dark:border-neutral-700 dark:bg-neutral-950">
                <SelectValue placeholder="All Offices" />
              </SelectTrigger>
              <SelectContent className="dark:bg-neutral-900 border-gray-200 dark:border-neutral-700">
                <SelectItem value="all" className="hover:bg-[#1a4d3e] cursor-pointer">All Offices</SelectItem>
                <SelectItem value="DO" className="hover:bg-[#1a4d3e] cursor-pointer">DO</SelectItem>
                <SelectItem value="ADO" className="hover:bg-[#1a4d3e] cursor-pointer">ADO</SelectItem>
                <SelectItem value="CPMD" className="hover:bg-[#1a4d3e] cursor-pointer">CPMD</SelectItem>
                <SelectItem value="AED" className="hover:bg-[#1a4d3e] cursor-pointer">AED</SelectItem>
                <SelectItem value="NSQCS" className="hover:bg-[#1a4d3e] cursor-pointer">NSQCS</SelectItem>
                <SelectItem value="NPQSD" className="hover:bg-[#1a4d3e] cursor-pointer">NPQSD</SelectItem>
                <SelectItem value="NSIC" className="hover:bg-[#1a4d3e] cursor-pointer">NSIC</SelectItem>
                <SelectItem value="CRPSD" className="hover:bg-[#1a4d3e] cursor-pointer">CRPSD</SelectItem>
                <SelectItem value="PPSSD" className="hover:bg-[#1a4d3e] cursor-pointer">PPSSD</SelectItem>
                <SelectItem value="ADMINISTRATIVE" className="hover:bg-[#1a4d3e] cursor-pointer">ADMINISTRATIVE</SelectItem>
                <SelectItem value="Others" className="hover:bg-[#1a4d3e] cursor-pointer">Others</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={cpmd || "all"}
              onValueChange={(val) => {
                const newValue = val === "all" ? "" : val;
                setCpmd(newValue);
                // Update state only, no server request needed
              }}
              disabled={office !== 'CPMD'}
            >
              <SelectTrigger className="w-[180px] border-gray-300 dark:border-neutral-700 dark:bg-neutral-950 disabled:opacity-60">
                <SelectValue placeholder={office === 'CPMD' ? 'All Sections' : 'Select Office First'} />
              </SelectTrigger>
              <SelectContent className="dark:bg-neutral-900 border-gray-200 dark:border-neutral-700">
                <SelectItem value="all" className="hover:bg-[#1a4d3e] cursor-pointer">
                  {office === 'CPMD' ? 'All Sections' : 'Select Office First'}
                </SelectItem>
                <SelectItem value="BIOCON section" className="hover:bg-[#1a4d3e] cursor-pointer">BIOCON section</SelectItem>
                <SelectItem value="PFS section" className="hover:bg-[#1a4d3e] cursor-pointer">PFS section</SelectItem>
                <SelectItem value="PHPS SECTION" className="hover:bg-[#1a4d3e] cursor-pointer">PHPS SECTION</SelectItem>
                <SelectItem value="OC-Admin Support Unit" className="hover:bg-[#1a4d3e] cursor-pointer">OC-Admin Support Unit</SelectItem>
                <SelectItem value="OC-ICT Unit" className="hover:bg-[#1a4d3e] cursor-pointer">OC-ICT Unit</SelectItem>
                <SelectItem value="OC-Special Project" className="hover:bg-[#1a4d3e] cursor-pointer">OC-Special Project</SelectItem>
                <SelectItem value="Others" className="hover:bg-[#1a4d3e] cursor-pointer">Others</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={perPage.toString()}
              onValueChange={(value) => {
                const newPerPage = parseInt(value);
                setPerPage(newPerPage);
                // Update state only, no server request needed
              }}
            >
              <SelectTrigger className="w-[150px] border-gray-300 dark:border-neutral-700 dark:bg-neutral-950">
                <SelectValue placeholder="Rows per page" />
              </SelectTrigger>
              <SelectContent className="dark:bg-neutral-900 border-gray-200 dark:border-neutral-700">
                <SelectItem value="12" className="hover:bg-[#1a4d3e] cursor-pointer">12 per page</SelectItem>
                <SelectItem value="24" className="hover:bg-[#1a4d3e] cursor-pointer">24 per page</SelectItem>
                <SelectItem value="48" className="hover:bg-[#1a4d3e] cursor-pointer">48 per page</SelectItem>
              </SelectContent>
            </Select>
            <button
              type="button"
              onClick={() => {
                setOffice('');
                setCpmd('');
                // Update state only, no server request needed
              }}
              className="inline-flex items-center justify-center gap-2 rounded-md bg-[#163832] hover:bg-[#163832]/90 dark:bg-[#235347] dark:hover:bg-[#235347]/90 px-3 py-2 text-sm text-white transition"
            >
              Clear
            </button>
          </div>

          {/* Search on the right */}
          <div className="w-full md:w-auto">
            <SearchBar
              search={search}
              onSearchChange={handleSearchChange}
              placeholder="Search employees..."
              className="w-full md:w-80"
              searchRoute="/employees"
              additionalParams={{ perPage, office, cpmd }}
            />
          </div>
        </div>

        {/* Cards grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredEmployees.length > 0 ? (
            paginatedEmployees.map((employee: any) => (
              <div key={employee.id} className="bg-white dark:bg-neutral-900 rounded-lg border border-gray-200 dark:border-neutral-800 p-4 flex gap-3 transition hover:-translate-y-0.5 hover:shadow-lg" style={{ boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1), 0 2px 8px rgba(0, 0, 0, 0.06)' }}>
                <div className="h-14 w-14 rounded-full bg-muted overflow-hidden flex items-center justify-center border border-gray-200 dark:border-neutral-700">
                  {employee.profile_picture ? (
                    <img src={`/storage/${employee.profile_picture}`} className="h-full w-full object-cover" alt={employee.name} />
                  ) : (
                    <svg className="w-8 h-8 text-muted-foreground" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                    </svg>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-gray-900 dark:text-white truncate">{employee.name}</div>
                  <div className="text-xs text-gray-500 dark:text-neutral-400 truncate">{employee.position || '—'}</div>
                  <div className="mt-1 text-xs text-gray-500 dark:text-neutral-400 truncate">{employee.employee_id || employee.email}</div>

                  <div className="mt-3 flex items-center justify-between">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${employee.status === 'active' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300' : 'bg-gray-100 text-gray-700 dark:bg-neutral-700 dark:text-gray-300'}`}>{employee.status || '—'}</span>
                    <button
                      onClick={() => router.get(`/employees/${employee.id}`)}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-[#163832] hover:bg-[#163832]/90 text-white text-xs dark:bg-[#235347] dark:hover:bg-[#235347]/90"
                    >
                      <Eye className="h-3.5 w-3.5" /> View
                    </button>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-full text-center py-8">
              <p className="text-gray-500 dark:text-gray-400">
                {search ? 'No employees match your search' : 'No employees found'}
              </p>
            </div>
          )}
        </div>

        {/* Pagination */}
        <div className="mt-4">
          <CustomPagination
            currentPage={currentPage}
            totalItems={filteredEmployees.length}
            perPage={perPage}
            onPageChange={handlePageChange}
          />
        </div>
      </div>
    </AppLayout>
  );
}
