import ExportLayout from '@/components/ExportLayout';
import { DropdownMenuItem } from '@/components/ui/dropdown-menu';
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import { Table as TableIcon } from 'lucide-react';
import React, { useState } from 'react';

// Types for PPMP data structure
interface Timeline {
    start_procurement: string;
    end_procurement: string;
    delivery_period: string;
}

interface FundingDetail {
    quantity_size: string;
    mode_of_procurement: string;
    pre_procurement_conference: string;
    estimated_budget: string;
    source_of_funds: string;
    supporting_documents: string;
    remarks: string;
    timelines?: Timeline[];
}

interface Project {
    id: string;
    general_description: string;
    project_type: string;
    category: string;
    funding_details?: FundingDetail[];
    fund?: {
        fund_name: string;
    };
}

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
    const [isIndicative, setIsIndicative] = useState(true);
    const [isFinal, setIsFinal] = useState(false);

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

    // Calculate totals
    const calculateTotals = (projects: Project[]) => {
        let grandTotal = 0;
        const categoryTotals = new Map<string, number>();

        projects.forEach((project) => {
            const category = project.category || 'Uncategorized';
            let projectTotal = 0;

            if (project.funding_details) {
                projectTotal = project.funding_details.reduce(
                    (total, detail) =>
                        total + parseFloat(detail.estimated_budget || '0'),
                    0,
                );
            }

            grandTotal += projectTotal;
            categoryTotals.set(
                category,
                (categoryTotals.get(category) || 0) + projectTotal,
            );
        });

        return { grandTotal, categoryTotals };
    };

    // Format currency
    const formatCurrency = (amount: number) => {
        return `₱ ${amount.toLocaleString('en-PH', { minimumFractionDigits: 2 })}`;
    };

    // Export to PDF
    const exportToPDF = () => {
        return; /*
        // 8.5 x 13 inches (Long Bond Paper) in mm: 215.9 x 330.2
        // We use 216 x 330 for simplicity
        const doc = new jsPDF({
            orientation: "landscape",
            unit: "mm",
            format: [216, 330]
        });

        // Title
        doc.setFontSize(14);
        doc.setFont("helvetica", "bold");
        doc.text("PROJECT PROCUREMENT MANAGEMENT PLAN (PPMP) NO. 001", 165, 15, { align: "center" });

        // Checkboxes Section - Visual approximation
        // Centered around 165

        // Indicative
        doc.setDrawColor(0);
        doc.setFillColor(255, 255, 255);
        doc.rect(130, 22, 5, 5, "FD"); // Empty box
        doc.setFontSize(10);
        doc.text("INDICATIVE", 137, 26);

        // Final
        doc.setFillColor(212, 160, 23); // Golden/Orange #D4A017
        doc.rect(180, 22, 5, 5, "FD"); // Filled box
        doc.text("FINAL", 187, 26);

        // Header Info
        doc.setFontSize(10);
        doc.setFont("helvetica", "normal");
        doc.text(`Fiscal Year: ${year}`, 15, 35);
        doc.text("End-User / Implementing Unit: Crop Pest Management Division", 15, 40);

        // Prepare table body data with calculated rowspans
        const tableBody: any[] = [];
        let grandTotal = 0;

        Array.from(groupProjectsByCategory(data).entries()).forEach(([key, projects]) => {
            let categoryTotal = 0;
            const groupRows: any[] = [];

            // Calculate total rows for entire Group (for Col 0 & 1 merging)
            let groupTotalRows = 0;
            projects.forEach(p => {
                if (p.funding_details) {
                    p.funding_details.forEach(fd => {
                        groupTotalRows += (fd.timelines?.length || 1);
                    });
                }
            });
            if (groupTotalRows === 0) groupTotalRows = 1;

            let groupRowCounter = 0;

            // Helper to handle potential objects
            const getText = (val: any) => {
                if (!val) return '';
                if (typeof val === 'object') return val.name || val.label || val.title || '';
                return String(val);
            };

            // Iterate Projects within Group
            projects.forEach(project => {
                const fundingDetails = project.funding_details || [];

                fundingDetails.forEach((fundingDetail, fdIndex) => {
                    const budget = parseFloat(fundingDetail.estimated_budget || '0');
                    categoryTotal += budget;
                    grandTotal += budget;

                    const timelines = fundingDetail.timelines && fundingDetail.timelines.length > 0
                        ? fundingDetail.timelines
                        : [{ start_procurement: '', end_procurement: '', delivery_period: '' }];

                    timelines.forEach((timeline, tlIndex) => {
                        // Initialize row with empty strings for potentially spanned columns
                        const row: any = [
                            '', // 0 (Group Span)
                            '', // 1 (Group Span)
                            '', // 2 (Detail Span)
                            '', // 3 (Detail Span)
                            '', // 4 (Detail Span)
                            getText(timeline.start_procurement),      // 5
                            getText(timeline.end_procurement),        // 6
                            getText(timeline.delivery_period),        // 7
                            '', // 8 (Detail Span)
                            '', // 9 (Detail Span)
                            '', // 10 (Detail Span)
                            ''  // 11 (Detail Span)
                        ];

                        // GROUP LEVEL MERGE (Cols 0 & 1) - Only Apply on the Very First Row of the Group
                        if (groupRowCounter === 0) {
                            row[0] = { content: getText(project.general_description), rowSpan: groupTotalRows, styles: { valign: 'middle', halign: 'center' } };
                            row[1] = { content: getText(project.project_type), rowSpan: groupTotalRows, styles: { valign: 'middle', halign: 'center' } };
                        }

                        // FUNDING DETAIL LEVEL MERGE (Cols 2,3,4,8,9,10,11)
                        if (tlIndex === 0) {
                            const detailSpan = timelines.length;
                            row[2] = { content: getText(fundingDetail.quantity_size), rowSpan: detailSpan, styles: { valign: 'middle', halign: 'center' } };
                            row[3] = { content: getText(fundingDetail.mode_of_procurement) || 'N/A', rowSpan: detailSpan, styles: { valign: 'middle', halign: 'center' } };
                            row[4] = { content: getText(fundingDetail.pre_procurement_conference) || 'No', rowSpan: detailSpan, styles: { valign: 'middle', halign: 'center' } };

                            // Cols 5,6,7 are distinct

                            row[8] = { content: getText(fundingDetail.source_of_funds) || 'Corn Fund', rowSpan: detailSpan, styles: { valign: 'middle', halign: 'center' } };
                            row[9] = { content: `₱ ${budget.toLocaleString('en-PH', { minimumFractionDigits: 2 })}`, rowSpan: detailSpan, styles: { valign: 'middle', halign: 'right' } };
                            row[10] = { content: getText(fundingDetail.supporting_documents) || 'Market Scoping, Technical Specifications', rowSpan: detailSpan, styles: { valign: 'middle', halign: 'left' } };
                            row[11] = { content: getText(fundingDetail.remarks), rowSpan: detailSpan, styles: { valign: 'middle', halign: 'left' } };
                        }

                        groupRows.push(row);
                        groupRowCounter++;
                    });
                });
            });

            tableBody.push(...groupRows);

            // Sub-Total Row
            tableBody.push([
                { content: '', colSpan: 8, styles: { fillColor: [212, 160, 23] } },
                { content: 'Sub-Total:', styles: { halign: 'right', fontStyle: 'bold', fillColor: [212, 160, 23] } },
                { content: `₱ ${categoryTotal.toLocaleString('en-PH', { minimumFractionDigits: 2 })}`, styles: { halign: 'right', fontStyle: 'bold', fillColor: [212, 160, 23] } },
                { content: '', colSpan: 2, styles: { fillColor: [212, 160, 23] } }
            ]);
        });

        // Add Grand Total Row
        tableBody.push([
            { content: '', colSpan: 8, styles: { fillColor: [255, 255, 255] } }, // White
            { content: 'TOTAL BUDGET:', styles: { halign: 'right', fontStyle: 'bold', fillColor: [230, 230, 230], lineWidth: 0.5 } },
            { content: `₱ ${grandTotal.toLocaleString('en-PH', { minimumFractionDigits: 2 })}`, styles: { halign: 'right', fontStyle: 'bold', fillColor: [230, 230, 230], lineWidth: 0.5 } },
            { content: '', colSpan: 2, styles: { fillColor: [255, 255, 255] } }
        ]);

        autoTable(doc, {
            startY: 45,
            theme: 'grid',
            head: [
                [
                    { content: 'PROCUREMENT PROJECT DETAILS', colSpan: 5, styles: { halign: 'center', valign: 'middle', fillColor: [217, 217, 217], fontStyle: 'bold', lineWidth: 0.1 } },
                    { content: 'PROJECTED TIMELINE (MM/YYYY)', colSpan: 3, styles: { halign: 'center', valign: 'middle', fillColor: [217, 217, 217], fontStyle: 'bold', lineWidth: 0.1 } },
                    { content: 'FUNDING DETAILS', colSpan: 2, styles: { halign: 'center', valign: 'middle', fillColor: [217, 217, 217], fontStyle: 'bold', lineWidth: 0.1 } },
                    { content: 'OTHER COLUMNS', colSpan: 2, styles: { halign: 'center', valign: 'middle', fillColor: [217, 217, 217], fontStyle: 'bold', lineWidth: 0.1 } }
                ],
                [
                    "General Description and Objective of the Project to be Procured",
                    "Type of the Project to be Procured",
                    "Quantity and Size of the Project to be Procured",
                    "Recommended Mode of Procurement",
                    "Pre-Procurement Conference",
                    "Start of Procurement Activity",
                    "End of Procurement Activity",
                    "Expected Delivery / Implementation Period",
                    "Source of Funds",
                    "Estimated Budget / Authorized Budgetary Allocation (PHP)",
                    "Attached Supporting Documents",
                    "Remarks",
                ],
                [
                    "Column 1", "Column 2", "Column 3", "Column 4", "Column 5", "Column 6",
                    "Column 7", "Column 8", "Column 9", "Column 10", "Column 11", "Column 12"
                ]
            ],
            body: tableBody,
            styles: {
                fontSize: 7.5,
                cellPadding: 1.5,
                lineWidth: 0.1,
                lineColor: [0, 0, 0],
                textColor: 0,
                valign: 'middle',
                overflow: 'linebreak'
            },
            headStyles: {
                fillColor: [240, 240, 240], // Light gray default
                textColor: 0,
                lineWidth: 0.1,
                lineColor: 0,
                fontStyle: "bold",
                halign: 'center',
                valign: 'middle'
            },
            columnStyles: {
                0: { cellWidth: 32 },
                1: { cellWidth: 26 },
                2: { cellWidth: 45 },
                3: { cellWidth: 26 },
                4: { cellWidth: 20 },
                5: { cellWidth: 16 },
                6: { cellWidth: 16 },
                7: { cellWidth: 20 },
                8: { cellWidth: 20 },
                9: { cellWidth: 26, halign: 'right' },
                10: { cellWidth: 32 },
                11: { cellWidth: 20 }
            },
            didParseCell: (data) => {
                // Header Styling Logic
                if (data.section === 'head') {
                    // Row 1 (Index 1) - Text Headers
                    if (data.row.index === 1) {
                        data.cell.styles.fillColor = [240, 240, 240];
                    }
                    // Row 2 (Index 2) - Columns Numbers
                    if (data.row.index === 2) {
                        data.cell.styles.fontStyle = 'italic';
                        data.cell.styles.fontSize = 7;
                        data.cell.styles.fillColor = [240, 240, 240];
                    }
                }
            }
        });

        // Add Footer after table
        // @ts-ignore
        let finalY = doc.lastAutoTable.finalY || 150;

        // Ensure space for footer
        if (finalY > 150) {
            doc.addPage();
            finalY = 20;
        } else {
            finalY += 20;
        }

        const footerY = finalY;

        // Prepared by (Left) - Column B approx
        doc.setFontSize(10);
        doc.setFont("helvetica", "normal");
        doc.text("Prepared by:", 25, footerY);

        doc.setFont("helvetica", "normal");
        doc.text("Name & Signature here", 25, footerY + 15);
        // Underline Name
        doc.setLineWidth(0.1);
        doc.line(25, footerY + 16, 75, footerY + 16);

        doc.setFont("helvetica", "italic");
        doc.setFontSize(8);
        doc.text("Signature over Printed name", 25, footerY + 20);

        doc.setFont("helvetica", "normal");
        doc.setFontSize(10);
        doc.text("Position Title", 25, footerY + 30);
        doc.text("Crop Pest Management Division", 25, footerY + 35);
        doc.text("Date: _______________", 25, footerY + 40);

        // Submitted by (Right) - Column E approx
        const rightColX = 140;
        doc.text("Submitted by:", rightColX, footerY);

        // Name
        doc.setFont("helvetica", "bold");
        doc.text("PETER M. MAGDARAOG Ph.D.", rightColX, footerY + 15);
        const nameWidth = doc.getTextWidth("PETER M. MAGDARAOG Ph.D.");
        doc.line(rightColX, footerY + 16, rightColX + nameWidth, footerY + 16); // Underline

        doc.setFont("helvetica", "italic");
        doc.setFontSize(8);
        doc.text("Signature over Printed name", rightColX, footerY + 20);

        doc.setFont("helvetica", "italic"); // Italic for title as per Excel
        doc.setFontSize(10);
        doc.text("Chief, Crop Pest Management Division", rightColX, footerY + 30);
        doc.text("Crop Pest Management Division", rightColX, footerY + 35);

        doc.setFont("helvetica", "normal");
        doc.text("Date: _______________", rightColX, footerY + 40);

        */
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
        sheet.getCell('D3').border = null as any;
        sheet.getCell('D3').fill = { type: 'pattern', pattern: 'none' } as any;

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
        sheet.getCell('F3').border = null as any;
        sheet.getCell('F3').fill = { type: 'pattern', pattern: 'none' } as any;

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

        Array.from(groupedProjects.entries()).forEach(([key, projects]) => {
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

            projects.forEach((project, projectIndex) => {
                if (project.funding_details) {
                    project.funding_details.forEach(
                        (fundingDetail, detailIndex) => {
                            const budget = parseFloat(
                                fundingDetail.estimated_budget || '0',
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

                            timelines.forEach((timeline, timelineIndex) => {
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
