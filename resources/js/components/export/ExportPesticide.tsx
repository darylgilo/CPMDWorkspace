import ExportLayout from '@/components/ExportLayout';
import { DropdownMenuItem } from '@/components/ui/dropdown-menu';
import { format } from 'date-fns';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { FileText, Table as TableIcon } from 'lucide-react';
import React from 'react';
import * as XLSX from 'xlsx';

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
    error: '#ef4444',
};

// Extend jsPDF with autoTable
declare module 'jspdf' {
    interface jsPDF {
        autoTable: (options: Record<string, unknown>) => jsPDF;
    }
}

export interface PesticideData {
    id: number;
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
    renderCell?: (
        key: string,
        value: unknown,
        row: PesticideData,
    ) => string | number | null;
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
    const getNestedValue = (
        obj: Record<string, unknown> | null | undefined,
        path: string,
    ): unknown => {
        const value = path.split('.').reduce<unknown>((acc, part) => {
            if (acc === null || acc === undefined) return '';
            if (typeof acc === 'object' && acc !== null && part in acc) {
                return (acc as Record<string, unknown>)[part];
            }
            return '';
        }, obj as unknown);

        // Format date fields (check if the key contains 'date' or 'Date')
        if (path.toLowerCase().includes('date') && value) {
            try {
                // Handle both ISO strings and date objects
                const date = new Date(value as string | number | Date);
                if (!isNaN(date.getTime())) {
                    return date.toISOString().split('T')[0]; // Returns YYYY-MM-DD
                }
            } catch {
                console.warn('Could not parse date:', value);
            }
        }

        return value ?? '';
    };

    // Format data for export based on headers or use all properties
    const getExportData = (): Array<Record<string, unknown>> => {
        if (!data || data.length === 0) return [];

        // If headers are provided, use them to structure the data
        if (headers && headers.length > 0) {
            return data.map((item) => {
                const row: Record<string, unknown> = {};
                headers.forEach((header) => {
                    if (renderCell) {
                        const itemRecord = item as unknown as Record<
                            string,
                            unknown
                        >;
                        row[header.key] =
                            renderCell(
                                header.key,
                                itemRecord[header.key],
                                item,
                            ) ?? '';
                    } else {
                        // Handle nested properties using dot notation (e.g., 'pesticide.brand_name')
                        row[header.key] = header.key.includes('.')
                            ? getNestedValue(
                                  item as unknown as Record<string, unknown>,
                                  header.key,
                              )
                            : ((item as unknown as Record<string, unknown>)[
                                  header.key
                              ] ?? '');
                    }
                });
                return row;
            });
        }

        // If no headers, use the data as is
        // Cast via unknown to acknowledge that data items may have arbitrary keys
        return [...data] as unknown as Array<Record<string, unknown>>;
    };

    // Helper to format individual cell values (especially dates and numbers)
    const formatCellValue = (value: unknown, key: string): unknown => {
        if (value === null || value === undefined) return '';

        // Normalize and format date-like fields
        if (key.toLowerCase().includes('date')) {
            try {
                const date = new Date(value as string | number | Date);
                if (!isNaN(date.getTime())) {
                    return format(date, 'yyyy-MM-dd');
                }
            } catch {
                // Fall through and return raw value below if parsing fails
            }
        }

        return value;
    };

    // Get headers for export
    const getExportHeaders = () => {
        if (headers && headers.length > 0) {
            return headers.map((h) => h.label || h.key);
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
            const exportData = (
                data && data.length > 0 ? data : getExportData()
            ) as Array<Record<string, unknown>>;

            // Get headers from props or generate from data
            let exportHeaders: string[] = [];

            if (headers && headers.length > 0) {
                // Use the label if available, otherwise use the key
                exportHeaders = headers.map((h) => h.label || h.key);
            } else if (exportData.length > 0) {
                // Fallback to object keys if no headers provided
                exportHeaders = Object.keys(exportData[0]);
            }

            // Create CSV content with proper escaping
            const escapeCsv = (value: unknown): string => {
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
                            return (key: string, val: unknown) => {
                                if (typeof val === 'object' && val !== null) {
                                    if (seen.has(val)) return '[Circular]';
                                    seen.add(val);
                                }
                                return val;
                            };
                        };
                        str = JSON.stringify(value, getCircularReplacer());
                    } catch {
                        str = String(value);
                    }
                } else {
                    str = String(value);
                }

                // Escape double quotes by doubling them
                const escaped = str.replace(/"/g, '""');
                // Wrap in quotes if contains comma, newline, or double quote
                if (
                    str.includes(',') ||
                    str.includes('"') ||
                    str.includes('\n')
                ) {
                    return `"${escaped}"`;
                }
                return escaped;
            };

            // Process data rows
            const processRow = (row: Record<string, unknown>): string => {
                if (!row) return '';

                if (headers && headers.length > 0) {
                    // Use headers to get values in correct order
                    return headers
                        .map((header) => {
                            // Handle nested properties
                            const value = header.key.includes('.')
                                ? getNestedValue(row, header.key)
                                : row[header.key];
                            return escapeCsv(value);
                        })
                        .join(',');
                }

                // Fallback: use all properties
                return Object.values(row)
                    .map((val) => escapeCsv(val))
                    .join(',');
            };

            // Create title row (similar to Excel export)
            const title = `${filename} - Exported on ${format(new Date(), 'yyyy-MM-dd HH:mm')}`;
            const titleRow = escapeCsv(title);

            // Create header row
            const headerRow = exportHeaders.map(escapeCsv).join(',');

            // Create data rows
            const dataRows = exportData.map((row) => processRow(row));

            // Combine title, header and data
            const csvContent = [titleRow, headerRow, ...dataRows].join('\n');

            // Create and trigger download
            const blob = new Blob(
                [
                    '\uFEFF', // UTF-8 BOM for Excel
                    csvContent,
                ],
                { type: 'text/csv;charset=utf-8;' },
            );

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
            // Use the original data when available so nested keys (e.g. 'pesticide.brand_name')
            // can be correctly resolved via getNestedValue
            const exportData = (
                data && data.length > 0 ? data : getExportData()
            ) as Array<Record<string, unknown>>;
            const headerKeys = headers?.map((h) => h.key) || [];
            const headerLabels = headers?.map((h) => h.label || h.key) || [];

            // Prepare data for Excel export
            const excelData = exportData.map((row) => {
                const newRow: Record<string, unknown> = {};
                headerKeys.forEach((key, index) => {
                    const header = headerLabels[index] || key;
                    const value = key.includes('.')
                        ? getNestedValue(row, key)
                        : (row as Record<string, unknown>)[key];
                    newRow[header] = formatCellValue(value, key);
                });
                return newRow;
            });

            // Create worksheet with headers (header row will initially be at the top)
            const ws = XLSX.utils.json_to_sheet(excelData, {
                header: headerLabels,
            });

            // Shift existing table (headers + data) down by one row to make space for a title row
            const originalRange = XLSX.utils.decode_range(ws['!ref'] || 'A1');
            for (let R = originalRange.e.r; R >= originalRange.s.r; --R) {
                for (let C = originalRange.s.c; C <= originalRange.e.c; ++C) {
                    const fromRef = XLSX.utils.encode_cell({ r: R, c: C });
                    const toRef = XLSX.utils.encode_cell({ r: R + 1, c: C });
                    if (ws[fromRef]) {
                        ws[toRef] = ws[fromRef];
                        delete ws[fromRef];
                    }
                }
            }

            // Update sheet range so it includes the new title row at the top
            const shiftedRange = {
                // Start at the original first row (typically 0) so A1 is part of the used range
                s: { r: originalRange.s.r, c: originalRange.s.c },
                // Data has been moved down by one row, so extend the end row by 1
                e: { r: originalRange.e.r + 1, c: originalRange.e.c },
            };
            ws['!ref'] = XLSX.utils.encode_range(shiftedRange);

            // Insert title in the very first row (above the table)
            const title = `${filename} - Exported on ${format(new Date(), 'yyyy-MM-dd HH:mm')}`;
            ws[XLSX.utils.encode_cell({ r: 0, c: 0 })] = { t: 's', v: title };

            // Set column widths and styles
            const columnWidths = headerLabels.map((label, index) => {
                // Auto-size columns based on content
                const maxContentLength = Math.max(
                    label ? String(label).length : 0,
                    ...exportData.map((row) => {
                        const key = headerKeys[index];
                        const value = key.includes('.')
                            ? getNestedValue(row, key)
                            : (row as Record<string, unknown>)[key];
                        return value
                            ? String(formatCellValue(value, key)).length
                            : 0;
                    }),
                );

                // Set reasonable min/max widths
                return {
                    wch: Math.min(Math.max(maxContentLength + 2, 10), 50),
                };
            });

            ws['!cols'] = columnWidths;

            // Apply styles to header row (dark green, bold, with borders)
            const headerRange = XLSX.utils.decode_range(ws['!ref'] || 'A1');
            // Header row is now the first row *after* the title
            const headerRowIndex = headerRange.s.r;
            for (let C = headerRange.s.c; C <= headerRange.e.c; ++C) {
                const cellRef = XLSX.utils.encode_cell({
                    r: headerRowIndex,
                    c: C,
                });
                if (!ws[cellRef]) continue;

                // Apply header style
                ws[cellRef].s = {
                    font: { bold: true, color: { rgb: 'FFFFFF' } },
                    // Dark green header background ( [22, 56, 50] -> 0x163832)
                    fill: { fgColor: { rgb: '163832' } },
                    alignment: {
                        horizontal: 'center',
                        vertical: 'center',
                        wrapText: true,
                    },
                    border: {
                        // Medium gray borders[150,150,150] -> 0x969696
                        top: { style: 'thin', color: { rgb: '969696' } },
                        bottom: { style: 'thin', color: { rgb: '969696' } },
                        left: { style: 'thin', color: { rgb: '969696' } },
                        right: { style: 'thin', color: { rgb: '969696' } },
                    },
                };
            }

            // Apply styles to data rows (rows after the header row)
            for (let R = headerRange.s.r + 1; R <= headerRange.e.r; ++R) {
                // Alternate row colors
                const rowColor = R % 2 === 0 ? THEME.lightBg : THEME.white;

                for (let C = headerRange.s.c; C <= headerRange.e.c; ++C) {
                    const cellRef = XLSX.utils.encode_cell({ r: R, c: C });
                    if (!ws[cellRef]) continue;

                    // Check if cell contains a number
                    const cellValue = ws[cellRef].v as unknown;
                    const isNumeric =
                        typeof cellValue === 'number' ||
                        !Number.isNaN(Number(cellValue));

                    ws[cellRef].s = {
                        font: { color: { rgb: THEME.text.replace('#', '') } },
                        fill: { fgColor: { rgb: rowColor.replace('#', '') } },
                        alignment: {
                            horizontal: isNumeric ? 'right' : 'left',
                            vertical: 'center',
                            wrapText: true,
                        },
                        border: {
                            // medium gray borders as header for a consistent table look
                            top: { style: 'thin', color: { rgb: '969696' } },
                            bottom: { style: 'thin', color: { rgb: '969696' } },
                            left: { style: 'thin', color: { rgb: '969696' } },
                            right: { style: 'thin', color: { rgb: '969696' } },
                        },
                        numFmt: isNumeric ? '0.00' : '@',
                    };
                }
            }

            // Create workbook and trigger download
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, 'Data');

            // Save the file
            XLSX.writeFile(
                wb,
                `${filename}-${format(new Date(), 'yyyyMMdd-HHmmss')}.xlsx`,
            );
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
                unit: 'pt',
            });

            const pageWidth = doc.internal.pageSize.getWidth();

            // Add title
            doc.setFontSize(18);
            doc.text(filename, pageMargin, 30);

            // Add date
            doc.setFontSize(10);
            doc.text(
                `Generated on: ${new Date().toLocaleString()}`,
                pageMargin,
                50,
            );

            // Prepare data for PDF table
            const tableData = exportData.map((row) => {
                if (headers && headers.length > 0) {
                    // Use header keys to get the correct values
                    return headers.map((header) => {
                        const value = row[header.key];
                        if (value === null || value === undefined) return '';
                        if (typeof value === 'object')
                            return JSON.stringify(value);
                        return String(value);
                    });
                }

                // Fallback to using header strings as keys
                return exportHeaders.map((header) => {
                    const value = (row as Record<string, unknown>)[header];
                    if (value === null || value === undefined) return '';
                    if (typeof value === 'object') return JSON.stringify(value);
                    return String(value);
                });
            });

            // Add table using autoTable with professional styling
            autoTable(doc, {
                head: [exportHeaders],
                body: tableData,
                startY: 70,
                margin: { left: pageMargin, right: pageMargin },
                styles: {
                    fontSize: 8,
                    cellPadding: 4,
                    overflow: 'linebreak',
                    lineWidth: 0.5,
                    lineColor: [150, 150, 150],
                    valign: 'middle',
                    halign: 'left',
                    // Auto-fit columns while allowing wrapping
                    cellWidth: 'auto',
                },
                headStyles: {
                    // Dark green header background, bold text
                    fillColor: [22, 56, 50],
                    textColor: 255,
                    fontStyle: 'bold',
                    fontSize: 9,
                    halign: 'center',
                    lineWidth: 0.5,
                    lineColor: [150, 150, 150],
                },
                alternateRowStyles: {
                    fillColor: [245, 248, 250],
                },
                tableLineWidth: 0.5,
                tableLineColor: [150, 150, 150],
                didDrawPage: (data) => {
                    // Add page number
                    const pageCount = doc.getNumberOfPages();
                    const pageSize = doc.internal.pageSize;
                    const pageHeight =
                        (pageSize as { height?: number; getHeight(): number })
                            .height ?? pageSize.getHeight();

                    doc.setFontSize(8);
                    doc.setTextColor(100);
                    doc.text(
                        `Page ${data.pageNumber} of ${pageCount}`,
                        pageMargin,
                        pageHeight - 15,
                    );

                    // Add a line above the footer
                    doc.setDrawColor(200, 200, 200);
                    doc.setLineWidth(0.3);
                    doc.line(
                        pageMargin,
                        pageHeight - 20,
                        pageWidth - pageMargin,
                        pageHeight - 20,
                    );
                },
                willDrawCell: (data) => {
                    // Zebra striping
                    if (data.section === 'body' && data.row.index % 2 === 0) {
                        doc.setFillColor(245, 248, 250);
                    } else if (data.section === 'body') {
                        doc.setFillColor(255, 255, 255);
                    }
                },
            });

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
            <DropdownMenuItem
                onClick={exportToCSV}
                className="flex items-center gap-2"
            >
                <FileText className="h-4 w-4" />
                <span>Export to CSV</span>
            </DropdownMenuItem>
            <DropdownMenuItem
                onClick={exportToExcel}
                className="flex items-center gap-2"
            >
                <TableIcon className="h-4 w-4" />
                <span>Export to Excel</span>
            </DropdownMenuItem>
            <DropdownMenuItem
                onClick={exportToPdf}
                className="flex items-center gap-2"
            >
                <FileText className="h-4 w-4" />
                <span>Export as PDF</span>
            </DropdownMenuItem>
        </ExportLayout>
    );
};

export default ExportPesticide;
