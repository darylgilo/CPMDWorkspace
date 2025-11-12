import React, { useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Download, FileText, Table as TableIcon, ChevronDown } from 'lucide-react';
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export interface TableExportProps {
  /**
   * The data to be exported
   */
  data: any[];
  /**
   * The filename to use for the exported file (without extension)
   */
  filename: string;
  /**
   * Optional: Column headers to use for the export
   * If not provided, it will use the keys from the first data item
   */
  headers?: { key: string; label: string }[];
  /**
   * Optional: Custom render function for specific columns
   */
  renderCell?: (key: string, value: any, row: any) => string | number | null;
  /**
   * Optional: Additional classes for the button
   */
  className?: string;
  /**
   * Optional: Button variant
   */
  variant?: 'default' | 'outline' | 'ghost' | 'link' | 'secondary';
  /**
   * Optional: Button size
   */
  size?: 'default' | 'sm' | 'lg' | 'icon';
  /**
   * Optional: Show icon only
   */
  iconOnly?: boolean;
}

const TableExport: React.FC<TableExportProps> = ({
  data,
  filename,
  headers,
  renderCell,
  className = '',
  variant = 'outline',
  size = 'default',
  iconOnly = false,
}) => {
  const dropdownRef = useRef<HTMLDivElement>(null);

  const getExportData = () => {
    if (!data || data.length === 0) return [];

    // Use provided headers or extract from data
    const columnKeys = headers 
      ? headers.map(h => h.key)
      : Object.keys(data[0] || {});

    // Process data according to headers
    return data.map(item => {
      const row: Record<string, any> = {};
      columnKeys.forEach(key => {
        if (renderCell) {
          row[key] = renderCell(key, item[key], item) ?? '';
        } else {
          row[key] = item[key] ?? '';
        }
      });
      return row;
    });
  };

  const getExportHeaders = () => {
    if (headers) {
      return headers.map(h => h.label || h.key);
    }
    
    if (data.length > 0) {
      return Object.keys(data[0] || {});
    }
    
    return [];
  };

  const exportToExcel = () => {
    const exportData = getExportData();
    if (exportData.length === 0) return;

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');
    
    // Auto-size columns
    const colWidths = getExportHeaders().map((_, colIndex) => {
      return { wch: Math.max(
        10, 
        ...exportData.map(row => 
          String(row[Object.keys(row)[colIndex]] || '').length
        )
      )};
    });
    
    ws['!cols'] = colWidths;
    
    XLSX.writeFile(wb, `${filename}.xlsx`);
  };

  const exportToPdf = () => {
    const exportData = getExportData();
    if (exportData.length === 0) return;

    const doc = new jsPDF('landscape');
    const tableColumn = getExportHeaders();
    const tableRows: any[] = [];

    // Prepare data for PDF
    exportData.forEach(item => {
      const rowData = Object.values(item);
      tableRows.push(rowData);
    });

    // @ts-ignore - jspdf-autotable types are not properly imported
    doc.autoTable({
      head: [tableColumn],
      body: tableRows,
      theme: 'grid',
      headStyles: {
        fillColor: [41, 128, 185],
        textColor: 255,
        fontStyle: 'bold',
      },
      margin: { top: 20 },
      didDrawPage: (data: any) => {
        // Header
        doc.setFontSize(20);
        doc.setTextColor(40);
        doc.text(
          filename,
          data.settings.margin.left,
          15
        );
      },
    });

    doc.save(`${filename}.pdf`);
  };

  if (data.length === 0) return null;

  return (
    <div className={className} ref={dropdownRef}>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button 
            variant={variant} 
            size={size}
            className="flex items-center gap-2"
          >
            <Download className="h-4 w-4" />
            {!iconOnly && 'Export'}
            <ChevronDown className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-48">
          <DropdownMenuItem onClick={exportToExcel} className="cursor-pointer">
            <TableIcon className="mr-2 h-4 w-4" />
            <span>Export as Excel</span>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={exportToPdf} className="cursor-pointer">
            <FileText className="mr-2 h-4 w-4" />
            <span>Export as PDF</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};

export default TableExport;
