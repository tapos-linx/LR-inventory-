import * as XLSX from 'xlsx';
import { DynamicColumn, LandRecord } from '../types/landRecord';
import { parseAcreValue, toBengaliNumber } from './bengaliNumerals';

export function exportToExcel(
  records: LandRecord[],
  columns: DynamicColumn[],
  fileName = 'LR_Master_Ledger_Export'
) {
  const visibleColumns = columns.filter((c) => c.visible).sort((a, b) => a.order - b.order);

  // Transform records into key-value map matching visible columns
  const dataRows = records.map((rec) => {
    const row: Record<string, any> = {};
    for (const col of visibleColumns) {
      if (col.id === 'slNo') {
        row[col.label] = toBengaliNumber(rec.slNo);
      } else if (col.id === 'mouza') {
        row[col.label] = `${rec.mouza} (জে.এল. ${rec.jlNo})`;
      } else if (col.id in rec) {
        row[col.label] = (rec as any)[col.id] || '';
      } else if (rec.extraAttributes && col.id in rec.extraAttributes) {
        row[col.label] = rec.extraAttributes[col.id] || '';
      } else if (col.formula === 'katha') {
        const val = parseAcreValue(rec.area);
        row[col.label] = `${toBengaliNumber((val * 60.5).toFixed(2))} কাঠা`;
      } else if (col.formula === 'bigha') {
        const val = parseAcreValue(rec.area);
        row[col.label] = `${toBengaliNumber((val * 3.025).toFixed(2))} বিঘা`;
      } else {
        row[col.label] = '';
      }
    }
    return row;
  });

  const worksheet = XLSX.utils.json_to_sheet(dataRows);

  // Calculate auto column widths
  const colWidths = visibleColumns.map((col) => {
    let maxLen = col.label.length * 2;
    dataRows.forEach((r) => {
      const valStr = String(r[col.label] || '');
      if (valStr.length > maxLen) {
        maxLen = Math.min(valStr.length, 50);
      }
    });
    return { wch: Math.max(maxLen + 4, 12) };
  });

  worksheet['!cols'] = colWidths;

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'খতিয়ান ও দাগ লেজার');

  XLSX.writeFile(workbook, `${fileName}_${new Date().toISOString().slice(0, 10)}.xlsx`);
}

export function exportToCSV(
  records: LandRecord[],
  columns: DynamicColumn[],
  fileName = 'LR_Master_Ledger_Export'
) {
  const visibleColumns = columns.filter((c) => c.visible).sort((a, b) => a.order - b.order);

  // CSV headers
  const headers = visibleColumns.map((c) => `"${c.label.replace(/"/g, '""')}"`).join(',');

  // CSV rows
  const rows = records.map((rec) => {
    return visibleColumns
      .map((col) => {
        let val = '';
        if (col.id === 'slNo') {
          val = toBengaliNumber(rec.slNo);
        } else if (col.id === 'mouza') {
          val = `${rec.mouza} (জে.এল. ${rec.jlNo})`;
        } else if (col.id in rec) {
          val = String((rec as any)[col.id] || '');
        } else if (rec.extraAttributes && col.id in rec.extraAttributes) {
          val = String(rec.extraAttributes[col.id] || '');
        } else if (col.formula === 'katha') {
          const acre = parseAcreValue(rec.area);
          val = `${toBengaliNumber((acre * 60.5).toFixed(2))} কাঠা`;
        } else if (col.formula === 'bigha') {
          const acre = parseAcreValue(rec.area);
          val = `${toBengaliNumber((acre * 3.025).toFixed(2))} বিঘা`;
        }
        return `"${val.replace(/"/g, '""')}"`;
      })
      .join(',');
  });

  // Include UTF-8 BOM so Excel opens Bengali characters properly
  const csvContent = '\uFEFF' + [headers, ...rows].join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', `${fileName}_${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
