import React, { useRef } from 'react';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { FileText, Table as TableIcon, FileSpreadsheet, FileType } from 'lucide-react';
import { DropdownMenuItem } from '@/components/ui/dropdown-menu';
import ExportLayout from '@/components/ExportLayout';
import { format } from 'date-fns';

// Define theme colors
const THEME = {
  primary: '#163832',
  secondary: '#235347',
  lightBg: '#f8fafc',
  border: '#e2e8f0',
  text: '#1e293b',
  textLight: '#64748b',
  white: '#ffffff',
  success: '#10b981',
  warning: '#f59e0b',
  error: '#ef4444'
};

// Extend jsPDF with autoTable
declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: any) => jsPDF;
  }
}

export interface PesticideData {
  id: number;
  [key: string]: any;
}

export interface ExportPesticideProps {
  /**
   * The pesticide data to be exported
   */
  data: PesticideData[];
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
   * Optional: Show only icon without text
   */
  iconOnly?: boolean;
  /**
   * Optional: Callback when export starts
   */
  onExportStart?: () => void;
}

const ExportPesticide: React.FC<ExportPesticideProps> = ({
  data,
  filename,
  headers,
  renderCell,
  className = '',
  variant = 'outline',
  size = 'default',
  iconOnly = false,
  onExportStart,
}) => {
  // Helper function to get nested property value using dot notation
  const getNestedValue = (obj: any, path: string) => {
    const value = path.split('.').reduce((acc, part) => {
      if (acc === null || acc === undefined) return '';
      return acc[part];
    }, obj);
    
    // Format date fields (check if the key contains 'date' or 'Date')
    if (path.toLowerCase().includes('date') && value) {
      try {
        // Handle both ISO strings and date objects
        const date = new Date(value);
        if (!isNaN(date.getTime())) {
          return date.toISOString().split('T')[0]; // Returns YYYY-MM-DD
        }
      } catch (e) {
        console.warn('Could not parse date:', value);
      }
    }
    
    return value ?? '';
  };

  // Format data for export based on headers or use all properties
  const getExportData = () => {
    if (!data || data.length === 0) return [];

    // If headers are provided, use them to structure the data
    if (headers && headers.length > 0) {
      return data.map(item => {
        const row: Record<string, any> = {};
        headers.forEach(header => {
          if (renderCell) {
            row[header.key] = renderCell(header.key, item[header.key], item) ?? '';
          } else {
            // Handle nested properties using dot notation (e.g., 'pesticide.brand_name')
            row[header.key] = header.key.includes('.') 
              ? getNestedValue(item, header.key) 
              : item[header.key] ?? '';
          }
        });
        return row;
      });
    }
    
    // If no headers, use the data as is
    return [...data];
  };

  // Helper to format individual cell values (especially dates and numbers)
  const formatCellValue = (value: any, key: string) => {
    if (value === null || value === undefined) return '';

    // Normalize and format date-like fields
    if (key.toLowerCase().includes('date')) {
      try {
        const date = new Date(value);
        if (!isNaN(date.getTime())) {
          return format(date, 'yyyy-MM-dd');
        }
      } catch (e) {
        // Fall through and return raw value below if parsing fails
      }
    }

    return value;
  };

  // Get headers for export
  const getExportHeaders = () => {
    if (headers && headers.length > 0) {
      return headers.map(h => h.label || h.key);
    }
    
    // If no headers provided, use keys from first data item
    if (data.length > 0) {
      return Object.keys(data[0]);
    }
    
    return [];
  };

  // Export to CSV
  const exportToCSV = () => {
    if (onExportStart) onExportStart();
    
    try {
      // Get the raw data if available, or use the processed data
      const exportData = data && data.length > 0 ? data : getExportData();
      
      // Get headers from props or generate from data
      let exportHeaders: string[] = [];
      
      if (headers && headers.length > 0) {
        // Use the label if available, otherwise use the key
        exportHeaders = headers.map(h => h.label || h.key);
      } else if (exportData.length > 0) {
        // Fallback to object keys if no headers provided
        exportHeaders = Object.keys(exportData[0]);
      }
      
      // Create CSV content with proper escaping
      const escapeCsv = (value: any): string => {
        if (value === null || value === undefined) return '';
        
        // Handle Date objects
        if (value instanceof Date) {
          return value.toISOString().split('T')[0];
        }
        
        // Convert to string and handle nested objects
        let str = '';
        if (typeof value === 'object') {
          try {
            // Try to stringify objects, but handle circular references
            const getCircularReplacer = () => {
              const seen = new WeakSet();
              return (key: string, val: any) => {
                if (typeof val === 'object' && val !== null) {
                  if (seen.has(val)) return '[Circular]';
                  seen.add(val);
                }
                return val;
              };
            };
            str = JSON.stringify(value, getCircularReplacer());
          } catch (e) {
            str = String(value);
          }
        } else {
          str = String(value);
        }
        
        // Escape double quotes by doubling them
        const escaped = str.replace(/"/g, '""');
        // Wrap in quotes if contains comma, newline, or double quote
        if (str.includes(',') || str.includes('"') || str.includes('\n')) {
          return `"${escaped}"`;
        }
        return escaped;
      };

      // Process data rows
      const processRow = (row: any): string => {
        if (!row) return '';
        
        if (headers && headers.length > 0) {
          // Use headers to get values in correct order
          return headers.map(header => {
            // Handle nested properties
            const value = header.key.includes('.')
              ? getNestedValue(row, header.key)
              : row[header.key];
            return escapeCsv(value);
          }).join(',');
        }
        
        // Fallback: use all properties
        return Object.values(row).map(val => escapeCsv(val)).join(',');
      };

      // Create header row
      const headerRow = exportHeaders.map(escapeCsv).join(',');
      
      // Create data rows
      const dataRows = exportData.map(row => processRow(row));

      // Combine header and data
      const csvContent = [headerRow, ...dataRows].join('\n');

      // Create and trigger download
      const blob = new Blob([
        '\uFEFF', // UTF-8 BOM for Excel
        csvContent
      ], { type: 'text/csv;charset=utf-8;' });
      
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${filename}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error exporting to CSV:', error);
      alert('Failed to export to CSV. Please try again.');
    }
  };

  // Export to Excel with enhanced formatting
  const exportToExcel = () => {
    if (onExportStart) onExportStart();
    
    try {
      const exportData = getExportData();
      const headerKeys = headers?.map(h => h.key) || [];
      const headerLabels = headers?.map(h => h.label || h.key) || [];
      
      // Prepare data for Excel export
      const excelData = exportData.map(row => {
        const newRow: Record<string, any> = {};
        headerKeys.forEach((key, index) => {
          const header = headerLabels[index] || key;
          const value = key.includes('.')
            ? getNestedValue(row, key)
            : row[key];
          newRow[header] = formatCellValue(value, key);
        });
        return newRow;
      });
      
      // Create worksheet with headers
      const ws = XLSX.utils.json_to_sheet(excelData, { header: headerLabels });
      
      // Set column widths and styles
      const columnWidths = headerLabels.map((label, index) => {
        // Auto-size columns based on content
        const maxContentLength = Math.max(
          label ? String(label).length : 0,
          ...exportData.map(row => {
            const key = headerKeys[index];
            const value = key.includes('.') 
              ? getNestedValue(row, key) 
              : row[key];
            return value ? String(formatCellValue(value, key)).length : 0;
          })
        );
        
        // Set reasonable min/max widths
        return { 
          wch: Math.min(Math.max(maxContentLength + 2, 10), 50) 
        };
      });
      
      ws['!cols'] = columnWidths;
      
      // Apply styles to header row
      const headerRange = XLSX.utils.decode_range(ws['!ref'] || 'A1');
      for (let C = headerRange.s.c; C <= headerRange.e.c; ++C) {
        const cellRef = XLSX.utils.encode_cell({ r: 0, c: C });
        if (!ws[cellRef]) continue;
        
        // Apply header style
        ws[cellRef].s = {
          font: { bold: true, color: { rgb: THEME.white } },
          fill: { fgColor: { rgb: THEME.primary.replace('#', '') } },
          alignment: { 
            horizontal: 'center',
            vertical: 'center',
            wrapText: true
          },
          border: {
            top: { style: 'thin', color: { rgb: THEME.border.replace('#', '') } },
            bottom: { style: 'thin', color: { rgb: THEME.border.replace('#', '') } },
            left: { style: 'thin', color: { rgb: THEME.border.replace('#', '') } },
            right: { style: 'thin', color: { rgb: THEME.border.replace('#', '') } }
          }
        };
      }
      
      // Apply styles to data rows
      for (let R = headerRange.s.r + 1; R <= headerRange.e.r + 1; ++R) {
        // Alternate row colors
        const rowColor = R % 2 === 0 ? THEME.lightBg : THEME.white;
        
        for (let C = headerRange.s.c; C <= headerRange.e.c; ++C) {
          const cellRef = XLSX.utils.encode_cell({ r: R, c: C });
          if (!ws[cellRef]) continue;
          
          // Check if cell contains a number
          const isNumeric = !isNaN(parseFloat(ws[cellRef].v)) && isFinite(ws[cellRef].v);
          
          ws[cellRef].s = {
            font: { color: { rgb: THEME.text.replace('#', '') } },
            fill: { fgColor: { rgb: rowColor.replace('#', '') } },
            alignment: { 
              horizontal: isNumeric ? 'right' : 'left',
              vertical: 'center',
              wrapText: true
            },
            border: {
              top: { style: 'thin', color: { rgb: THEME.border.replace('#', '') } },
              bottom: { style: 'thin', color: { rgb: THEME.border.replace('#', '') } },
              left: { style: 'thin', color: { rgb: THEME.border.replace('#', '') } },
              right: { style: 'thin', color: { rgb: THEME.border.replace('#', '') } }
            },
            numFmt: isNumeric ? '0.00' : '@'
          };
        }
      }
      
      // Create workbook and trigger download
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Data');
      
      // Add a title row
      const title = `${filename} - Exported on ${format(new Date(), 'yyyy-MM-dd HH:mm')}`;
      XLSX.utils.sheet_add_aoa(ws, [[title]], { origin: -1 });
      
      // Save the file
      XLSX.writeFile(wb, `${filename}-${format(new Date(), 'yyyyMMdd-HHmmss')}.xlsx`);
    } catch (error) {
      console.error('Error exporting to Excel:', error);
      alert('Failed to export to Excel. Please try again.');
    }
  };

  // Export to PDF
  const exportToPdf = () => {
    if (onExportStart) onExportStart();
    
    try {
      const exportData = getExportData();
      if (exportData.length === 0) {
        alert('No data to export');
        return;
      }
      
      const exportHeaders = getExportHeaders();
      const pageMargin = 40;
      
      // Create PDF document
      const doc = new jsPDF({
        orientation: 'landscape',
        unit: 'pt'
      });
      
      const pageWidth = doc.internal.pageSize.getWidth();
      
      // Add title
      doc.setFontSize(18);
      doc.text(filename, pageMargin, 30);
      
      // Add date
      doc.setFontSize(10);
      doc.text(`Generated on: ${new Date().toLocaleString()}`, pageMargin, 50);
      
      // Prepare data for PDF table
      const tableData = exportData.map(row => {
        if (headers && headers.length > 0) {
          // Use header keys to get the correct values
          return headers.map(header => {
            const value = row[header.key];
            if (value === null || value === undefined) return '';
            if (typeof value === 'object') return JSON.stringify(value);
            return String(value);
          });
        } else {
          // Fallback to using header strings as keys
          return exportHeaders.map(header => {
            const value = row[header];
            if (value === null || value === undefined) return '';
            if (typeof value === 'object') return JSON.stringify(value);
            return String(value);
          });
        }
      });
      
      // Add table using autoTable
      autoTable(doc, {
        head: [exportHeaders],
        body: tableData,
        startY: 70,
        margin: { left: pageMargin, right: pageMargin },
        styles: { 
          fontSize: 8,
          cellPadding: 4,
          overflow: 'linebreak',
          lineWidth: 0.1,
          lineColor: [200, 200, 200],
          valign: 'middle',
          halign: 'left',
          cellWidth: 'wrap'
        },
        headStyles: {
          fillColor: [41, 128, 185],
          textColor: 255,
          fontStyle: 'bold',
          fontSize: 9,
          halign: 'center'
        },
        alternateRowStyles: {
          fillColor: [245, 248, 250]
        },
        didDrawPage: (data: any) => {
          // Add page number
          const pageCount = doc.getNumberOfPages();
          const pageSize = doc.internal.pageSize;
          const pageHeight = pageSize.height ? pageSize.height : pageSize.getHeight();
          
          doc.setFontSize(8);
          doc.setTextColor(100);
          doc.text(
            `Page ${data.pageNumber} of ${pageCount}`,
            pageMargin,
            pageHeight - 15
          );
          
          // Add a line above the footer
          doc.setDrawColor(200, 200, 200);
          doc.setLineWidth(0.3);
          doc.line(
            pageMargin,
            pageHeight - 20,
            pageWidth - pageMargin,
            pageHeight - 20
          );
        },
        willDrawCell: (data: any) => {
          // Add zebra striping
          if (data.section === 'body' && data.row.index % 2 === 0) {
            doc.setFillColor(245, 248, 250);
          } else if (data.section === 'body') {
            doc.setFillColor(255, 255, 255);
          }
        }
      });
      
      // Save the PDF
      doc.save(`${filename}.pdf`);
      
      // Save the PDF
      doc.save(`${filename}.pdf`);
    } catch (error) {
      console.error('Error exporting to PDF:', error);
      alert('Failed to export to PDF. Please try again.');
    }
  };

  if (!data || data.length === 0) return null;

  return (
    <ExportLayout 
      className={className}
      variant={variant}
      size={size}
      iconOnly={iconOnly}
      onExportStart={onExportStart}
    >
      <DropdownMenuItem onClick={exportToCSV} className="flex items-center gap-2">
        <FileText className="h-4 w-4" />
        <span>Export to CSV</span>
      </DropdownMenuItem>
      <DropdownMenuItem onClick={exportToExcel} className="flex items-center gap-2">
        <TableIcon className="h-4 w-4" />
        <span>Export to Excel</span>
      </DropdownMenuItem>
      <DropdownMenuItem onClick={exportToPdf} className="flex items-center gap-2">
        <FileText className="h-4 w-4" />
        <span>Export as PDF</span>
      </DropdownMenuItem>
    </ExportLayout>
  );
};

export default ExportPesticide;
