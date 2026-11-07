import * as XLSX from 'xlsx';
import { DynamicColumn, IngestedArchiveNode, LandRecord } from '../types/landRecord';
import { WarishCertificate } from './inheritanceData';
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

export function exportToJSON(data: unknown, fileName = 'LR_Document_Export') {
  const jsonContent = JSON.stringify(data, null, 2);
  const blob = new Blob([jsonContent], { type: 'application/json;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', `${fileName}_${new Date().toISOString().slice(0, 10)}.json`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function exportGenericTableToExcel(
  headers: { key: string; label: string }[],
  rows: Record<string, string>[],
  fileName: string,
  sheetName = 'Document_Sheet'
) {
  const formattedRows = rows.map((r) => {
    const obj: Record<string, string> = {};
    headers.forEach((h) => {
      obj[h.label] = r[h.key] || '—';
    });
    return obj;
  });
  const ws = XLSX.utils.json_to_sheet(formattedRows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, sheetName.slice(0, 31));
  XLSX.writeFile(wb, `${fileName}_${new Date().toISOString().slice(0, 10)}.xlsx`);
}

export function exportGenericTableToCSV(
  headers: { key: string; label: string }[],
  rows: Record<string, string>[],
  fileName: string
) {
  const headerLine = headers.map((h) => `"${h.label.replace(/"/g, '""')}"`).join(',');
  const bodyLines = rows.map((r) =>
    headers.map((h) => `"${String(r[h.key] || '').replace(/"/g, '""')}"`).join(',')
  );
  const csv = '\uFEFF' + [headerLine, ...bodyLines].join('\r\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${fileName}_${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function exportWarishCertificatesToExcel(
  certificates: WarishCertificate[],
  fileName = 'LR_Warish_Certificates_Directory'
) {
  const rows: Record<string, string>[] = [];
  certificates.forEach((cert) => {
    cert.heirs.forEach((heir) => {
      rows.push({
        'সনদ ক্রমিক': toBengaliNumber(cert.slNo),
        'ওয়ারিশ সনদ নং': cert.certificateNo,
        'ইস্যুর তারিখ': cert.issueDate,
        'মৃত পূর্বপুরুষের নাম': cert.deceasedName,
        'পিতার নাম': cert.fatherName,
        'মাতার নাম': cert.motherName,
        'গ্রাম/মৌজা': `${cert.village} (${cert.union}, ${cert.upazila}, ${cert.district})`,
        'ওয়ারিশ ক্রমিক': heir.sl,
        'ওয়ারিশের নাম': heir.name,
        'মৃতের সাথে সম্পর্ক': heir.relation,
        'জন্ম তারিখ': heir.dob,
        'বর্তমান অবস্থা': heir.status,
      });
    });
  });

  const ws = XLSX.utils.json_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'ওয়ারিশ সনদ তালিকা');
  XLSX.writeFile(wb, `${fileName}_${new Date().toISOString().slice(0, 10)}.xlsx`);
}

export function flattenArchiveTreeRows(
  node: IngestedArchiveNode | null,
  records: LandRecord[]
): Record<string, string>[] {
  if (!node) return [];
  const rows: Record<string, string>[] = [];
  const walk = (n: IngestedArchiveNode, depth: number) => {
    const isFolder = n.type === 'folder' || (n.children && n.children.length > 0);
    const matched = !isFolder
      ? records.find(
          (r) =>
            r.relativePath === n.path ||
            r.fileName === n.name ||
            n.path.endsWith(r.fileName || '___')
        )
      : undefined;

    rows.push({
      slNo: toBengaliNumber(rows.length + 1),
      nodeType: isFolder ? 'ফোল্ডার (Folder)' : 'ফাইল (File)',
      name: `${'  '.repeat(depth)}${n.name}`,
      relativePath: n.path || n.name,
      fileSize: n.size ? `${(n.size / 1024).toFixed(1)} KB` : '—',
      mouzaAndJl: matched ? `${matched.mouza} (JL ${matched.jlNo})` : '—',
      surveyKhatianDag: matched
        ? `${matched.surveyType} | খতিয়ান ${matched.khatianNo} | দাগ ${matched.dagNo}`
        : '—',
      ownerAndArea: matched ? `${matched.ownerDetails} (${matched.area})` : '—',
    });

    if (n.children) {
      n.children.forEach((child) => walk(child, depth + 1));
    }
  };
  walk(node, 0);
  return rows;
}
