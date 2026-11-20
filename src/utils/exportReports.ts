import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas-pro';

export interface ExcelSummaryRow {
  label: string;
  value: string | number;
}

export function buildReportWorkbook(options: {
  sheetName: string;
  title: string;
  metaLines: string[];
  summaryRows: ExcelSummaryRow[];
  headers: string[];
  rows: (string | number)[][];
}): XLSX.WorkBook {
  const wb = XLSX.utils.book_new();
  wb.Workbook = { Views: [{ RTL: true }] };

  const aoa: (string | number)[][] = [
    [options.title],
    ...options.metaLines.map((line) => [line]),
    [],
    ...options.summaryRows.map((s) => [s.label, s.value]),
    [],
    options.headers,
    ...options.rows,
  ];

  const ws = XLSX.utils.aoa_to_sheet(aoa);
  ws['!views'] = [{ rightToLeft: true }];

  const colCount = Math.max(
    2,
    options.headers.length,
    ...options.rows.map((r) => r.length)
  );
  ws['!cols'] = Array.from({ length: colCount }, (_, colIdx) => {
    const headerLen = String(options.headers[colIdx] ?? '').length;
    const maxDataLen = options.rows.reduce(
      (max, row) => Math.max(max, String(row[colIdx] ?? '').length),
      0
    );
    const width = Math.min(48, Math.max(14, Math.max(headerLen, maxDataLen) + 6));
    return { wch: width };
  });

  const safeSheetName = options.sheetName.replace(/[\\/?*[\]:]/g, '').slice(0, 31) || 'التقرير';
  XLSX.utils.book_append_sheet(wb, ws, safeSheetName);
  return wb;
}

export function downloadReportExcel(options: {
  filename: string;
  sheetName: string;
  title: string;
  metaLines: string[];
  summaryRows: ExcelSummaryRow[];
  headers: string[];
  rows: (string | number)[][];
}): void {
  const wb = buildReportWorkbook(options);
  XLSX.writeFile(wb, options.filename.endsWith('.xlsx') ? options.filename : `${options.filename}.xlsx`);
}

export async function downloadReportPdfFromElement(
  element: HTMLElement,
  filename: string
): Promise<void> {
  const canvas = await html2canvas(element, {
    scale: 2,
    useCORS: true,
    backgroundColor: '#ffffff',
    logging: false,
    windowWidth: Math.max(element.scrollWidth, 960),
  });

  const imgData = canvas.toDataURL('image/png');
  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 10;
  const contentWidth = pageWidth - margin * 2;
  const contentHeight = (canvas.height * contentWidth) / canvas.width;

  let heightLeft = contentHeight;
  let position = margin;

  pdf.addImage(imgData, 'PNG', margin, position, contentWidth, contentHeight, undefined, 'FAST');
  heightLeft -= pageHeight - margin * 2;

  while (heightLeft > 0) {
    position = heightLeft - contentHeight + margin;
    pdf.addPage();
    pdf.addImage(imgData, 'PNG', margin, position, contentWidth, contentHeight, undefined, 'FAST');
    heightLeft -= pageHeight - margin * 2;
  }

  pdf.save(filename.endsWith('.pdf') ? filename : `${filename}.pdf`);
}
