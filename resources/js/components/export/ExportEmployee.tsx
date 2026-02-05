import ExportLayout from '@/components/ExportLayout';
import { DropdownMenuItem } from '@/components/ui/dropdown-menu';
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import { Table as TableIcon } from 'lucide-react';
import React from 'react';

export interface ExportEmployeeProps {
    data: any[];
    className?: string;
    variant?: 'default' | 'outline' | 'ghost' | 'link' | 'secondary';
    size?: 'default' | 'sm' | 'lg' | 'icon';
}

const ExportEmployee: React.FC<ExportEmployeeProps> = ({
    data,
    className = '',
    variant = 'outline',
    size = 'default',
}) => {

    const exportToExcel = async () => {
        // Create a new workbook
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Employees');

        // Define comprehensive columns based on employee view
        worksheet.columns = [
            { header: 'Employee ID', key: 'employee_id', width: 15 },
            { header: 'Name', key: 'name', width: 25 },
            { header: 'Email', key: 'email', width: 30 },
            { header: 'Position', key: 'position', width: 25 },
            { header: 'Employment Status', key: 'employment_status', width: 20 },
            { header: 'Office', key: 'office', width: 15 },
            { header: 'Section/Unit', key: 'cpmd', width: 25 },
            { header: 'Hiring Date', key: 'hiring_date', width: 15 },
            { header: 'TIN Number', key: 'tin_number', width: 20 },
            { header: 'GSIS Number', key: 'gsis_number', width: 20 },
            { header: 'Address', key: 'address', width: 35 },
            { header: 'Date of Birth', key: 'date_of_birth', width: 15 },
            { header: 'Gender', key: 'gender', width: 10 },
            { header: 'Mobile Number', key: 'mobile_number', width: 20 },
            { header: 'Contact Person', key: 'contact_person', width: 25 },
            { header: 'Contact Number', key: 'contact_number', width: 20 },
            { header: 'Item Number', key: 'item_number', width: 20 },
            { header: 'Status', key: 'status', width: 15 },
        ];

        // Add data rows with all available fields
        data.forEach((employee) => {
            worksheet.addRow({
                employee_id: employee.employee_id || '',
                name: employee.name || '',
                email: employee.email || '',
                position: employee.position || '',
                employment_status: employee.employment_status || '',
                office: employee.office || '',
                cpmd: employee.cpmd || '',
                hiring_date: employee.hiring_date || '',
                tin_number: employee.tin_number || '',
                gsis_number: employee.gsis_number || '',
                address: employee.address || '',
                date_of_birth: employee.date_of_birth || '',
                gender: employee.gender || '',
                mobile_number: employee.mobile_number || '',
                contact_person: employee.contact_person || '',
                contact_number: employee.contact_number || '',
                item_number: employee.item_number || '',
                status: employee.status || '',
            });
        });

        // Style header row
        worksheet.getRow(1).eachCell((cell) => {
            cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
            cell.fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: 'FF163832' }
            };
            cell.border = {
                top: { style: 'thin' },
                left: { style: 'thin' },
                bottom: { style: 'thin' },
                right: { style: 'thin' }
            };
        });

        // Add borders to all data cells
        worksheet.eachRow((row, rowNumber) => {
            if (rowNumber > 1) { // Skip header row
                row.eachCell((cell) => {
                    cell.border = {
                        top: { style: 'thin' },
                        left: { style: 'thin' },
                        bottom: { style: 'thin' },
                        right: { style: 'thin' }
                    };
                });
            }
        });

        // Generate Excel file
        const buffer = await workbook.xlsx.writeBuffer();
        const blob = new Blob([buffer], { 
            type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
        });
        
        // Save file
        saveAs(blob, `CPMD_Employees_Complete_${new Date().toISOString().split('T')[0]}.xlsx`);
    };

    const exportToCSV = () => {
        // Create CSV content with all fields
        const headers = [
            'Employee ID', 'Name', 'Email', 'Position', 'Employment Status', 
            'Office', 'Section/Unit', 'Hiring Date', 'TIN Number', 'GSIS Number',
            'Address', 'Date of Birth', 'Gender', 'Mobile Number', 'Contact Person', 
            'Contact Number', 'Item Number', 'Status'
        ];
        
        const csvContent = [
            headers.join(','),
            ...data.map((employee) => [
                employee.employee_id || '',
                employee.name || '',
                employee.email || '',
                employee.position || '',
                employee.employment_status || '',
                employee.office || '',
                employee.cpmd || '',
                employee.hiring_date || '',
                employee.tin_number || '',
                employee.gsis_number || '',
                employee.address || '',
                employee.date_of_birth || '',
                employee.gender || '',
                employee.mobile_number || '',
                employee.contact_person || '',
                employee.contact_number || '',
                employee.item_number || '',
                employee.status || ''
            ].map(field => `"${field}"`).join(','))
        ].join('\n');

        // Create and download CSV file
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        saveAs(blob, `CPMD_Employees_Complete_${new Date().toISOString().split('T')[0]}.csv`);
    };

    return (
        <ExportLayout
            className={className}
            variant={variant}
            size={size}
            onExportStart={() => console.log('Export started')}
        >
            <DropdownMenuItem onClick={exportToExcel}>
                <TableIcon className="mr-2 h-4 w-4" />
                Export as Excel
            </DropdownMenuItem>
            <DropdownMenuItem onClick={exportToCSV}>
                <TableIcon className="mr-2 h-4 w-4" />
                Export as CSV
            </DropdownMenuItem>
        </ExportLayout>
    );
};

export default ExportEmployee;
