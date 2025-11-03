import { useState, useEffect, useMemo } from 'react';
import { Head, usePage, router } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Eye, RotateCcw } from 'lucide-react';
import SearchBar from '@/components/SearchBar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import CustomPagination from '@/components/CustomPagination';
import { CustomCard, CustomCardAvatar, CustomCardContent } from "@/components/ui/CustomCard";

// Employee Directory list page component (read-only)
export default function EmployeeDirectory() {
  const pageProps = usePage().props as any;
  const { users = { data: [] }, auth } = pageProps;

  // State for search and filters
  const [search, setSearch] = useState<string>('');
  const [perPage, setPerPage] = useState<number>(12);
  const [office, setOffice] = useState<string>('');
  const [cpmd, setCpmd] = useState<string>('');
  const [currentPage, setCurrentPage] = useState(1);
  
  // Local state for all employees
  const [allEmployees, setAllEmployees] = useState(users.data || []);
  
  // Update local state when props change
  useEffect(() => {
    setAllEmployees(users.data || []);
    // Reset to first page when filters change
    setCurrentPage(1);
  }, [users.data]);

  // Client-side filtering
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
  
  // Calculate total pages
  const totalPages = Math.ceil(filteredEmployees.length / perPage);
  
  // Get paginated employees
  const paginatedEmployees = useMemo(() => {
    const startIndex = (currentPage - 1) * perPage;
    return filteredEmployees.slice(startIndex, startIndex + perPage);
  }, [filteredEmployees, currentPage, perPage]);

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

  const handleSearchChange = (value: string) => {
    setSearch(value);
  };
  
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    updateUrl();
  };
  
  const handleClearFilters = () => {
    setSearch('');
    setOffice('');
    setCpmd('');
    setCurrentPage(1);
  };

  return (
    <AppLayout breadcrumbs={[{ title: 'Employee Directory', href: '/directory' }]}>
      <Head title="Employee Directory" />

      <div className="p-4 flex flex-col gap-4">
        {/* Header actions (no Add button) */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 bg-white dark:bg-neutral-900 rounded-md border border-gray-200 dark:border-neutral-800 p-3 md:p-4 shadow-sm">
          {/* Filters on the left */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            <Select 
              value={office || "all"} 
              onValueChange={(val) => {
                const newValue = val === "all" ? "" : val;
                setOffice(newValue);
                setCpmd(''); // Reset CPMD when office changes
                setCurrentPage(1); // Reset to first page on filter change
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
                setCurrentPage(1); // Reset to first page on filter change
              }}
              disabled={office !== 'CPMD'}
            >
              <SelectTrigger className="w-[180px] border-gray-300 dark:border-neutral-700 dark:bg-neutral-950 disabled:opacity-60">
                <SelectValue placeholder={office === 'CPMD' ? 'All Sections' : 'Select CPMD First'} />
              </SelectTrigger>
              <SelectContent className="dark:bg-neutral-900 border-gray-200 dark:border-neutral-700">
                <SelectItem value="all" className="hover:bg-[#1a4d3e] cursor-pointer">All Sections</SelectItem>
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
                setCurrentPage(1); // Reset to first page when changing items per page
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
              onClick={handleClearFilters}
              className="inline-flex items-center justify-center gap-2 rounded-md bg-[#163832] hover:bg-[#163832]/90 dark:bg-[#235347] dark:hover:bg-[#235347]/90 px-3 py-2 text-sm text-white transition"
              title="Clear filters"
            >
              <RotateCcw className="h-4 w-4" />
              <span className="sr-only">Clear filters</span>
            </button>
          </div>

          {/* Search on the right */}
          <div className="w-full md:w-80">
            <SearchBar
              search={search}
              onSearchChange={handleSearchChange}
              placeholder="Search employees..."
              className="w-full"
              searchRoute="/directory"
              additionalParams={{ perPage, office, cpmd }}
            />
          </div>
        </div>

        {/* Employee Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {paginatedEmployees.map((employee: any) => (
            <CustomCard key={employee.id}>
              <CustomCardAvatar 
                src={employee.profile_picture ? `/storage/${employee.profile_picture}` : undefined}
                alt={employee.name}
              />
              <CustomCardContent>
                <div className="font-semibold text-gray-900 dark:text-white truncate">{employee.name}</div>
                <div className="text-xs text-gray-500 dark:text-neutral-400 truncate">{employee.position || '—'}</div>
                <div className="mt-1 text-xs text-gray-500 dark:text-neutral-400 truncate">{employee.employee_id || employee.email}</div>

                <div className="mt-3 flex items-center justify-between">
                  <span className={`text-xs px-2 py-0.5 rounded-full ${employee.status === 'active' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300' : 'bg-gray-100 text-gray-700 dark:bg-neutral-700 dark:text-gray-300'}`}>{employee.status || '—'}</span>
                  <button
                    onClick={() => router.get(`/directory/${employee.id}`)}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-[#163832] hover:bg-[#163832]/90 text-white text-xs dark:bg-[#235347] dark:hover:bg-[#235347]/90"
                  >
                    <Eye className="h-3.5 w-3.5" /> View
                  </button>
                </div>
              </CustomCardContent>
            </CustomCard>
          ))}
        </div>

        {/* Pagination */}
        {filteredEmployees.length > 0 && (
          <CustomPagination
            currentPage={currentPage}
            totalItems={filteredEmployees.length}
            perPage={perPage}
            onPageChange={handlePageChange}
          />
        )}
      </div>
    </AppLayout>
  );
}
