import ExportLayout from '@/components/ExportLayout';
import { DropdownMenuItem } from '@/components/ui/dropdown-menu';
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import { Table as TableIcon } from 'lucide-react';
import React from 'react';

import { PPMPProject as Project } from '@/types/ppmp';

export interface ExportPPMPProps {
    data: Project[];
    fundName: string;
    year: number;
    className?: string;
    variant?: 'default' | 'outline' | 'ghost' | 'link' | 'secondary';
    size?: 'default' | 'sm' | 'lg' | 'icon';
}

const ExportPPMP: React.FC<ExportPPMPProps> = ({
    data,
    fundName,
    year,
    className = '',
    variant = 'outline',
    size = 'default',
}) => {

    // Group projects by general_description and project_type (matching PPMP.tsx structure)
    const groupProjectsByCategory = (projects: Project[]) => {
        const grouped = new Map<string, Project[]>();
        projects.forEach((project) => {
            // Group by combination of general_description and project_type
            const key = `${project.general_description}|${project.project_type}`;
            if (!grouped.has(key)) {
                grouped.set(key, []);
            }
            grouped.get(key)!.push(project);
        });
        return grouped;
    };



    // Export to Excel
    const exportToExcel = async () => {
        const workbook = new ExcelJS.Workbook();
        const sheet = workbook.addWorksheet('PPMP 2026', {
            pageSetup: { paperSize: 9, orientation: 'landscape' },
        });

        /* ==========================
           COLUMN WIDTHS
        ========================== */
        sheet.columns = [
            { width: 25 }, // Col 1
            { width: 20 }, // Col 2
            { width: 35 }, // Col 3
            { width: 20 }, // Col 4
            { width: 15 }, // Col 5
            { width: 12 }, // Col 6
            { width: 12 }, // Col 7
            { width: 15 }, // Col 8
            { width: 15 }, // Col 9
            { width: 20 }, // Col 10
            { width: 25 }, // Col 11
            { width: 15 }, // Col 12
        ];

        /* ==========================
           TITLE
        ========================== */
        sheet.mergeCells('A1:L1');
        sheet.getCell('A1').value =
            'PROJECT PROCUREMENT MANAGEMENT PLAN (PPMP) NO. 001';
        sheet.getCell('A1').font = { bold: true, size: 14 };
        sheet.getCell('A1').alignment = { horizontal: 'center' };

        /* ==========================
           CHECKBOXES AND INFO
        ========================== */
        // INDICATIVE - Empty square character
        sheet.getCell('D3').value = '□';
        sheet.getCell('D3').font = {
            name: 'Arial',
            size: 20,
            bold: true,
        };
        sheet.getCell('D3').alignment = {
            horizontal: 'right',
            vertical: 'middle',
        };
        // Ensure no borders/fill from default or previous references
        sheet.getCell('D3').border = {} as Partial<ExcelJS.Borders>;
        sheet.getCell('D3').fill = {
            type: 'pattern',
            pattern: 'none',
        } as ExcelJS.Fill;

        // INDICATIVE label
        sheet.getCell('E3').value = 'INDICATIVE';
        sheet.getCell('E3').font = { bold: true, size: 10 };
        sheet.getCell('E3').alignment = {
            horizontal: 'left',
            vertical: 'middle',
        };

        // FINAL - Filled square character (Gold)
        sheet.getCell('F3').value = '■';
        sheet.getCell('F3').font = {
            name: 'Arial',
            size: 20,
            color: { argb: 'FFD4A017' }, // Golden/Orange
            bold: true,
        };
        sheet.getCell('F3').alignment = {
            horizontal: 'right',
            vertical: 'middle',
        };
        sheet.getCell('F3').border = {} as Partial<ExcelJS.Borders>;
        sheet.getCell('F3').fill = {
            type: 'pattern',
            pattern: 'none',
        } as ExcelJS.Fill;

        // FINAL label
        sheet.getCell('G3').value = 'FINAL';
        sheet.getCell('G3').font = { bold: true, size: 10 };
        sheet.getCell('G3').alignment = {
            horizontal: 'left',
            vertical: 'middle',
        };

        sheet.getCell('A5').value = `Fiscal Year: ${year}`;
        sheet.getCell('A6').value =
            'End-User / Implementing Unit: Crop Pest Management Division';

        /* ==========================
           HEADER ROWS
        ========================== */
        // Top-level header row - Main section headers (NEW)
        sheet.mergeCells('A8:E8'); // PROCUREMENT PROJECT DETAILS
        sheet.getCell('A8').value = 'PROCUREMENT PROJECT DETAILS';
        sheet.getCell('A8').font = { bold: true, size: 11 };
        sheet.getCell('A8').alignment = {
            horizontal: 'center',
            vertical: 'middle',
        };
        sheet.getCell('A8').fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFD9D9D9' }, // Light gray
        };
        sheet.getCell('A8').border = {
            top: { style: 'medium' },
            left: { style: 'medium' },
            bottom: { style: 'thin' },
            right: { style: 'thin' },
        };

        sheet.mergeCells('F8:H8'); // PROJECTED TIMELINE
        sheet.getCell('F8').value = 'PROJECTED TIMELINE (MM/YYYY)';
        sheet.getCell('F8').font = { bold: true, size: 11 };
        sheet.getCell('F8').alignment = {
            horizontal: 'center',
            vertical: 'middle',
        };
        sheet.getCell('F8').fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFD9D9D9' },
        };
        sheet.getCell('F8').border = {
            top: { style: 'medium' },
            left: { style: 'thin' },
            bottom: { style: 'thin' },
            right: { style: 'thin' },
        };

        sheet.mergeCells('I8:J8'); // FUNDING DETAILS
        sheet.getCell('I8').value = 'FUNDING DETAILS';
        sheet.getCell('I8').font = { bold: true, size: 11 };
        sheet.getCell('I8').alignment = {
            horizontal: 'center',
            vertical: 'middle',
        };
        sheet.getCell('I8').fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFD9D9D9' },
        };
        sheet.getCell('I8').border = {
            top: { style: 'medium' },
            left: { style: 'thin' },
            bottom: { style: 'thin' },
            right: { style: 'thin' },
        };

        sheet.mergeCells('K8:L8'); // OTHER COLUMNS
        sheet.getCell('K8').value = 'OTHER COLUMNS';
        sheet.getCell('K8').font = { bold: true, size: 11 };
        sheet.getCell('K8').alignment = {
            horizontal: 'center',
            vertical: 'middle',
        };
        sheet.getCell('K8').fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFD9D9D9' },
        };
        sheet.getCell('K8').border = {
            top: { style: 'medium' },
            left: { style: 'thin' },
            bottom: { style: 'thin' },
            right: { style: 'medium' },
        };

        // Row 9 - Column names (previously row 9)
        sheet.getRow(9).values = [
            'General Description and Objective of the Project to be Procured',
            'Type of the Project to be Procured',
            'Quantity and Size of the Project to be Procured',
            'Recommended Mode of Procurement',
            'Pre-Procurement Conference',
            'Start of Procurement Activity',
            'End of Procurement Activity',
            'Expected Delivery / Implementation Period',
            'Source of Funds',
            'Estimated Budget / Authorized Budgetary Allocation (PHP)',
            'Attached Supporting Documents',
            'Remarks',
        ];

        // Row 10 - Column numbers (previously row 10)
        sheet.getRow(10).values = [
            'Column 1',
            'Column 2',
            'Column 3',
            'Column 4',
            'Column 5',
            'Column 6',
            'Column 7',
            'Column 8',
            'Column 9',
            'Column 10',
            'Column 11',
            'Column 12',
        ];

        /* ==========================
           HEADER STYLING
        ========================== */
        // Style column names row (row 9)
        sheet.getRow(9).eachCell((cell) => {
            cell.font = { bold: true, size: 9 };
            cell.alignment = {
                horizontal: 'center',
                vertical: 'middle',
                wrapText: true,
            };
            cell.border = {
                top: { style: 'thin' },
                left: { style: 'thin' },
                bottom: { style: 'thin' },
                right: { style: 'thin' },
            };
            cell.fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: 'FFF0F0F0' },
            };
        });

        // Style column numbers row (row 10)
        sheet.getRow(10).eachCell((cell) => {
            cell.font = { bold: false, size: 8, italic: true };
            cell.alignment = { horizontal: 'center', vertical: 'middle' };
            cell.border = {
                top: { style: 'thin' },
                left: { style: 'thin' },
                bottom: { style: 'thin' },
                right: { style: 'thin' },
            };
            cell.fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: 'FFF0F0F0' },
            };
        });

        /* ==========================
           DATA ROWS
        ========================== */
        let startRow = 11;
        const groupedProjects = groupProjectsByCategory(data);
        let grandTotal = 0;

        Array.from(groupedProjects.entries()).forEach(([, projects]) => {
            let categoryTotal = 0;
            const groupStartRow = startRow;

            // Calculate total rows for this project group (all funding details × all timelines)
            let totalRowsInGroup = 0;
            projects.forEach((project) => {
                if (project.funding_details) {
                    project.funding_details.forEach((fundingDetail) => {
                        const timelineCount =
                            fundingDetail.timelines?.length || 1;
                        totalRowsInGroup += timelineCount;
                    });
                }
            });

            projects.forEach((project) => {
                if (project.funding_details) {
                    project.funding_details.forEach(
                        (fundingDetail) => {
                            const budget = parseFloat(
                                String(fundingDetail.estimated_budget || '0'),
                            );
                            categoryTotal += budget;
                            grandTotal += budget;

                            const timelines = fundingDetail.timelines || [
                                {
                                    start_procurement: '',
                                    end_procurement: '',
                                    delivery_period: '',
                                },
                            ];
                            const timelineCount = timelines.length;
                            const fundingDetailStartRow = startRow;

                            timelines.forEach((timeline) => {
                                sheet.addRow([
                                    project.general_description,
                                    project.project_type,
                                    fundingDetail.quantity_size,
                                    fundingDetail.mode_of_procurement || 'N/A',
                                    fundingDetail.pre_procurement_conference ||
                                    'No',
                                    timeline.start_procurement || '',
                                    timeline.end_procurement || '',
                                    timeline.delivery_period || '',
                                    fundingDetail.source_of_funds ||
                                    'Corn Fund',
                                    budget,
                                    fundingDetail.supporting_documents ||
                                    'Market Scoping, Technical Specifications',
                                    fundingDetail.remarks || '',
                                ]);

                                // Format currency column
                                sheet.getRow(startRow).getCell(10).numFmt =
                                    '₱#,##0.00';
                                sheet.getRow(startRow).getCell(10).alignment = {
                                    horizontal: 'right',
                                };

                                // Add borders to data row
                                sheet.getRow(startRow).eachCell((cell) => {
                                    cell.border = {
                                        top: { style: 'thin' },
                                        left: { style: 'thin' },
                                        bottom: { style: 'thin' },
                                        right: { style: 'thin' },
                                    };
                                    cell.alignment = {
                                        wrapText: true,
                                        vertical: 'middle',
                                        horizontal: 'left',
                                    };
                                });

                                // Center specific columns
                                [2, 3, 4, 5, 6, 7, 8, 9].forEach((colIndex) => {
                                    sheet
                                        .getRow(startRow)
                                        .getCell(colIndex).alignment = {
                                        horizontal: 'center',
                                        vertical: 'middle',
                                        wrapText: true,
                                    };
                                });

                                startRow++;
                            });

                            // Merge cells for columns that should span all timelines of this funding detail
                            if (timelineCount > 1) {
                                sheet.mergeCells(
                                    `C${fundingDetailStartRow}:C${fundingDetailStartRow + timelineCount - 1}`,
                                ); // Quantity
                                sheet.mergeCells(
                                    `D${fundingDetailStartRow}:D${fundingDetailStartRow + timelineCount - 1}`,
                                ); // Mode
                                sheet.mergeCells(
                                    `E${fundingDetailStartRow}:E${fundingDetailStartRow + timelineCount - 1}`,
                                ); // Pre-Proc
                                sheet.mergeCells(
                                    `I${fundingDetailStartRow}:I${fundingDetailStartRow + timelineCount - 1}`,
                                ); // Source of Funds
                                sheet.mergeCells(
                                    `J${fundingDetailStartRow}:J${fundingDetailStartRow + timelineCount - 1}`,
                                ); // Budget
                                sheet.mergeCells(
                                    `K${fundingDetailStartRow}:K${fundingDetailStartRow + timelineCount - 1}`,
                                ); // Supporting Docs
                                sheet.mergeCells(
                                    `L${fundingDetailStartRow}:L${fundingDetailStartRow + timelineCount - 1}`,
                                ); // Remarks
                            }
                        },
                    );
                }
            });

            // Merge cells for Column 1 (General Description) and Column 2 (Type of Project)
            if (totalRowsInGroup > 1) {
                sheet.mergeCells(
                    `A${groupStartRow}:A${groupStartRow + totalRowsInGroup - 1}`,
                );
                sheet.mergeCells(
                    `B${groupStartRow}:B${groupStartRow + totalRowsInGroup - 1}`,
                );
            }

            // Center align the merged cells
            sheet.getCell(`A${groupStartRow}`).alignment = {
                horizontal: 'center',
                vertical: 'middle',
                wrapText: true,
            };
            sheet.getCell(`B${groupStartRow}`).alignment = {
                horizontal: 'center',
                vertical: 'middle',
                wrapText: true,
            };

            /* ==========================
               SUBTOTAL ROW (GREEN)
            ========================== */
            const subTotalRow = sheet.getRow(startRow);
            subTotalRow.getCell(9).value = 'Sub-Total:'; // Column I
            subTotalRow.getCell(10).value = categoryTotal; // Column J

            // Format subtotal values
            subTotalRow.getCell(9).alignment = { horizontal: 'right' }; // "Sub-Total:" align right
            subTotalRow.getCell(10).numFmt = '₱#,##0.00';
            subTotalRow.getCell(10).alignment = { horizontal: 'right' };

            // Apply styling to the whole row with green background
            // Apply styling to the whole row with green background
            for (let i = 1; i <= 12; i++) {
                const cell = subTotalRow.getCell(i);
                cell.font = { bold: true };
                cell.fill = {
                    type: 'pattern',
                    pattern: 'solid',
                    fgColor: { argb: 'FFD4A017' }, // Golden/Orange
                };
                cell.border = {
                    top: { style: 'thin' },
                    left: { style: 'thin' },
                    bottom: { style: 'thin' },
                    right: { style: 'thin' },
                };
            }
            startRow++;
        });

        /* ==========================
           GRAND TOTAL ROW (GRAY)
        ========================== */
        // Label cell (Column I)
        const totalLabelCell = sheet.getCell(`I${startRow}`);
        totalLabelCell.value = 'TOTAL BUDGET:';
        totalLabelCell.font = { bold: true };
        totalLabelCell.alignment = { horizontal: 'right' };
        totalLabelCell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFE6E6E6' }, // Gray
        };
        totalLabelCell.border = {
            top: { style: 'medium' },
            left: { style: 'medium' },
            bottom: { style: 'medium' },
            right: { style: 'thin' },
        };

        // Value cell (Column J)
        const totalValueCell = sheet.getCell(`J${startRow}`);
        totalValueCell.value = grandTotal;
        totalValueCell.numFmt = '₱#,##0.00';
        totalValueCell.font = { bold: true };
        totalValueCell.alignment = { horizontal: 'right' };
        totalValueCell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFE6E6E6' }, // Gray
        };
        totalValueCell.border = {
            top: { style: 'medium' },
            left: { style: 'thin' },
            bottom: { style: 'medium' },
            right: { style: 'medium' },
        };

        /* ==========================
           FOOTER
        ========================== */
        /* ==========================
           FOOTER
        ========================== */
        const footerStart = startRow + 2;

        // Prepared by Section (Column B)
        sheet.getCell(`B${footerStart}`).value = 'Prepared by:';
        sheet.getCell(`B${footerStart}`).font = { size: 10 };

        sheet.getCell(`B${footerStart + 2}`).value = 'Name & Signature here';
        sheet.getCell(`B${footerStart + 2}`).font = {
            underline: true,
            size: 10,
        };

        sheet.getCell(`B${footerStart + 3}`).value =
            'Signature over Printed name';
        sheet.getCell(`B${footerStart + 3}`).font = { italic: true, size: 8 };

        sheet.getCell(`B${footerStart + 5}`).value = 'Position Title';
        sheet.getCell(`B${footerStart + 5}`).font = { size: 10 };

        sheet.getCell(`B${footerStart + 6}`).value =
            'Crop Pest Management Division';
        sheet.getCell(`B${footerStart + 6}`).font = { size: 10 };

        sheet.getCell(`B${footerStart + 7}`).value = 'Date: _______________';
        sheet.getCell(`B${footerStart + 7}`).font = { size: 10 };

        // Submitted by Section (Column E)
        sheet.getCell(`E${footerStart}`).value = 'Submitted by:';
        sheet.getCell(`E${footerStart}`).font = { size: 10 };

        // Merge cells for the long name and titles on the right side
        sheet.mergeCells(`E${footerStart + 2}:H${footerStart + 2}`);
        sheet.getCell(`E${footerStart + 2}`).value = 'PETER M. MAGDARAOG Ph.D.';
        sheet.getCell(`E${footerStart + 2}`).font = {
            bold: true,
            underline: true,
            size: 10,
        };

        sheet.mergeCells(`E${footerStart + 3}:H${footerStart + 3}`);
        sheet.getCell(`E${footerStart + 3}`).value =
            'Signature over Printed name';
        sheet.getCell(`E${footerStart + 3}`).font = { italic: true, size: 8 };

        sheet.mergeCells(`E${footerStart + 5}:H${footerStart + 5}`);
        sheet.getCell(`E${footerStart + 5}`).value =
            'Chief, Crop Pest Management Division';
        sheet.getCell(`E${footerStart + 5}`).font = { italic: true, size: 10 };

        sheet.mergeCells(`E${footerStart + 6}:H${footerStart + 6}`);
        sheet.getCell(`E${footerStart + 6}`).value =
            'Crop Pest Management Division';
        sheet.getCell(`E${footerStart + 6}`).font = { italic: true, size: 10 };

        sheet.getCell(`E${footerStart + 7}`).value = 'Date: _______________';
        sheet.getCell(`E${footerStart + 7}`).font = { size: 10 };

        /* ==========================
           DOWNLOAD
        ========================== */
        const buffer = await workbook.xlsx.writeBuffer();
        saveAs(new Blob([buffer]), `PPMP_${fundName}_${year}.xlsx`);
    };

    return (
        <ExportLayout variant={variant} size={size} className={className}>
            <DropdownMenuItem onClick={exportToExcel}>
                <TableIcon className="mr-2 h-4 w-4" />
                Export to Excel
            </DropdownMenuItem>
        </ExportLayout>
    );
};

export default ExportPPMP;


