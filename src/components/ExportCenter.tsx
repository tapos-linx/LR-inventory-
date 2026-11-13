import React, { useMemo, useState } from 'react';
import * as XLSX from 'xlsx';
import {
  Download,
  Users,
  MapPin,
  Fingerprint,
  CheckSquare,
  Scale,
  Loader2,
  CheckCircle2,
  Printer,
  Building2,
} from 'lucide-react';
import { DynamicColumn, LandRecord } from '../types/landRecord';
import {
  PROVIDED_WARISH_CERTIFICATES,
  convertMatchedListToLandRecords,
  matchLandRecordsWithInheritance,
} from '../utils/inheritanceData';
import {
  downloadForensicReportTablePdf,
  downloadMatchedInheritancePdf,
  downloadMouzaLandRecordsPdf,
} from '../utils/pdfDownloadEngine';
import { exportToCSV, exportToExcel, exportToJSON } from '../utils/exportUtils';
import {
  FORENSIC_REPORT_OPTIONS,
  ForensicExportReportId,
  buildForensicReportExportData,
} from '../utils/forensicReportBuilder';
import { downloadMasterSlulisPackage } from '../utils/slulisMasterBundleEngine';
import { toBengaliNumber } from '../utils/bengaliNumerals';

type ExportFormat = 'pdf' | 'xlsx' | 'csv' | 'json';

interface ExportCenterProps {
  records: LandRecord[];
  filteredRecords: LandRecord[];
  selectedIds: Set<string>;
  columns: DynamicColumn[];
  availableUpazilas: string[];
  initialUpazila?: string;
  initialMouza?: string;
  onOpenPrintStudio: (upazila: string, mouza: string) => void;
}

const FORMAT_OPTIONS: { id: ExportFormat; label: string }[] = [
  { id: 'pdf', label: 'PDF' },
  { id: 'xlsx', label: 'Excel' },
  { id: 'csv', label: 'CSV' },
  { id: 'json', label: 'JSON' },
];

export const ExportCenter: React.FC<ExportCenterProps> = ({
  records,
  filteredRecords,
  selectedIds,
  columns,
  availableUpazilas,
  initialUpazila = '',
  initialMouza = '',
  onOpenPrintStudio,
}) => {
  const [warishScope, setWarishScope] = useState<'all' | 'goali'>('all');
  const [warishFormat, setWarishFormat] = useState<ExportFormat>('pdf');

  const [mouzaUpazila, setMouzaUpazila] = useState<string>(initialUpazila);
  const [mouzaName, setMouzaName] = useState<string>(initialMouza);
  const [mouzaFormat, setMouzaFormat] = useState<ExportFormat>('pdf');

  const [forensicReportId, setForensicReportId] = useState<ForensicExportReportId>('report1');
  const [forensicFormat, setForensicFormat] = useState<ExportFormat>('pdf');

  const [rowsScope, setRowsScope] = useState<'selected' | 'filtered' | 'all'>(
    selectedIds.size > 0 ? 'selected' : 'filtered'
  );
  const [rowsFormat, setRowsFormat] = useState<ExportFormat>('pdf');

  const [busyCard, setBusyCard] = useState<string | null>(null);
  const [slulisProgressText, setSlulisProgressText] = useState<string | null>(null);
  const [statusBanner, setStatusBanner] = useState<string | null>(null);

  const mouzasForSelectedUpazila = useMemo(() => {
    const base = mouzaUpazila ? records.filter((r) => r.upazila === mouzaUpazila) : records;
    return Array.from(new Set(base.map((r) => r.mouza))).filter(Boolean);
  }, [records, mouzaUpazila]);

  const notifyDone = (message: string) => {
    setStatusBanner(message);
    setTimeout(() => setStatusBanner(null), 6500);
  };

  const handleDownloadWarish = async () => {
    if (busyCard) return;
    setBusyCard('warish');
    try {
      const matched = matchLandRecordsWithInheritance(
        records,
        PROVIDED_WARISH_CERTIFICATES,
        warishScope === 'goali'
      );
      const enriched = convertMatchedListToLandRecords(matched);
      const fileBase =
        warishScope === 'goali'
          ? 'LR_Warish_Matched_Goali_Mouza'
          : 'LR_Warish_Matched_All_Mouzas';

      if (warishFormat === 'pdf') {
        await downloadMatchedInheritancePdf(matched, fileBase);
      } else if (warishFormat === 'xlsx') {
        exportToExcel(enriched, columns, fileBase);
      } else if (warishFormat === 'csv') {
        exportToCSV(enriched, columns, fileBase);
      } else {
        exportToJSON(
          {
            generatedAt: new Date().toISOString(),
            scope: warishScope,
            totalMatched: matched.length,
            records: matched,
          },
          fileBase
        );
      }
      notifyDone(
        `সফলভাবে ${toBengaliNumber(matched.length)} টি ওয়ারিশ-ম্যাচকৃত রেকর্ড (${warishFormat.toUpperCase()}) ডাউনলোড সম্পন্ন হয়েছে!`
      );
    } finally {
      setBusyCard(null);
    }
  };

  const handleDownloadMouza = async () => {
    if (busyCard) return;
    setBusyCard('mouza');
    try {
      const target = records.filter((r) => {
        if (mouzaUpazila && r.upazila !== mouzaUpazila) return false;
        if (mouzaName && r.mouza !== mouzaName) return false;
        return true;
      });
      const scopeName = mouzaName || mouzaUpazila || 'All_Mouzas';
      const fileBase = `LR_Mouza_Ledger_${scopeName.replace(/\s+/g, '_')}`;

      if (mouzaFormat === 'pdf') {
        await downloadMouzaLandRecordsPdf(target, columns, scopeName);
      } else if (mouzaFormat === 'xlsx') {
        exportToExcel(target, columns, fileBase);
      } else if (mouzaFormat === 'csv') {
        exportToCSV(target, columns, fileBase);
      } else {
        exportToJSON(
          {
            generatedAt: new Date().toISOString(),
            upazila: mouzaUpazila || 'সকল উপজেলা',
            mouza: mouzaName || 'সকল মৌজা',
            totalRecords: target.length,
            records: target,
          },
          fileBase
        );
      }
      notifyDone(
        `সফলভাবে "${mouzaName || mouzaUpazila || 'সকল মৌজা'}" (${toBengaliNumber(
          target.length
        )} টি রেকর্ড, ${mouzaFormat.toUpperCase()}) ডাউনলোড হয়েছে!`
      );
    } finally {
      setBusyCard(null);
    }
  };

  const handleDownloadForensic = async () => {
    if (busyCard) return;
    setBusyCard('forensic');
    try {
      const data = buildForensicReportExportData(forensicReportId, records);
      const dateTag = new Date().toISOString().slice(0, 10);

      if (forensicFormat === 'pdf') {
        await downloadForensicReportTablePdf({
          reportTitle: data.title,
          reportSubtitle: data.subtitle,
          headers: data.headers,
          rows: data.rows,
          fileNamePrefix: data.fileName,
        });
      } else if (forensicFormat === 'xlsx') {
        const formatted = data.rows.map((r) => {
          const obj: Record<string, string> = {};
          data.headers.forEach((h) => {
            obj[h.label] = r[h.key] || '—';
          });
          return obj;
        });
        const ws = XLSX.utils.json_to_sheet(
          formatted.length > 0 ? formatted : [{ Note: 'No records' }]
        );
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Forensic_Report');
        XLSX.writeFile(wb, `${data.fileName}_${dateTag}.xlsx`);
      } else if (forensicFormat === 'csv') {
        const headerLine = data.headers
          .map((h) => `"${h.label.replace(/"/g, '""')}"`)
          .join(',');
        const bodyLines = data.rows.map((r) =>
          data.headers
            .map((h) => `"${String(r[h.key] || '').replace(/"/g, '""')}"`)
            .join(',')
        );
        const csv = '\uFEFF' + [headerLine, ...bodyLines].join('\r\n');
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${data.fileName}_${dateTag}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      } else {
        exportToJSON(
          {
            generatedAt: new Date().toISOString(),
            reportTitle: data.title,
            rowCount: data.rows.length,
            rows: data.rows,
          },
          data.fileName
        );
      }
      notifyDone(
        `ফরেনসিক প্রতিবেদন "${data.title.slice(0, 42)}..." (${forensicFormat.toUpperCase()}) ডাউনলোড হয়েছে!`
      );
    } finally {
      setBusyCard(null);
    }
  };

  const handleDownloadRows = async () => {
    if (busyCard) return;
    setBusyCard('rows');
    try {
      const target =
        rowsScope === 'selected' && selectedIds.size > 0
          ? records.filter((r) => selectedIds.has(r.id))
          : rowsScope === 'filtered'
          ? filteredRecords
          : records;

      const label =
        rowsScope === 'selected' && selectedIds.size > 0
          ? 'Selected_Rows'
          : rowsScope === 'filtered'
          ? 'Filtered_Rows'
          : 'All_Records';
      const fileBase = `LR_Ledger_${label}`;

      if (rowsFormat === 'pdf') {
        await downloadMouzaLandRecordsPdf(target, columns, label);
      } else if (rowsFormat === 'xlsx') {
        exportToExcel(target, columns, fileBase);
      } else if (rowsFormat === 'csv') {
        exportToCSV(target, columns, fileBase);
      } else {
        exportToJSON(target, fileBase);
      }
      notifyDone(
        `সফলভাবে ${toBengaliNumber(target.length)} টি সারি (${rowsFormat.toUpperCase()}) ডাউনলোড হয়েছে!`
      );
    } finally {
      setBusyCard(null);
    }
  };

  const handleDownloadSlulisZip = async () => {
    if (busyCard) return;
    setBusyCard('slulis');
    setSlulisProgressText('মাস্টার জিপ প্যাকেজ সংকলন হচ্ছে...');
    try {
      await downloadMasterSlulisPackage(records, (step, pct) => {
        setSlulisProgressText(`${step} (${toBengaliNumber(pct)}%)`);
      });
      notifyDone('SLULIS সফর আলী বংশধারা সকল নথি মাস্টার প্যাকেজ (.ZIP) ডাউনলোড সম্পন্ন হয়েছে!');
    } finally {
      setBusyCard(null);
      setSlulisProgressText(null);
    }
  };

  const selectedRowsCount =
    rowsScope === 'selected' && selectedIds.size > 0
      ? selectedIds.size
      : rowsScope === 'filtered'
      ? filteredRecords.length
      : records.length;

  return (
    <main className="flex-1 max-w-[1440px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6 font-bengali">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="text-[11px] font-semibold uppercase tracking-wider text-[var(--accent-gold)]">
            পিলার ৪ · একীভূত এক্সপোর্ট সেন্টার
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-[var(--text-primary)]">
            রিপোর্ট ও এক্সপোর্ট সেন্টার (১-ক্লিক ডিরেক্ট ডাউনলোড)
          </h1>
          <p className="text-xs sm:text-sm text-[var(--text-secondary)] mt-0.5">
            যেকোনো কার্ডে ইনলাইন ফরম্যাট বা স্কোপ বেছে নিয়ে সরাসরি এক ক্লিকে চূড়ান্ত ফাইল ডাউনলোড করুন।
          </p>
        </div>
      </div>

      {statusBanner && (
        <div className="surface-3d-subtle px-4 py-3 flex items-center gap-2.5 text-xs sm:text-sm font-semibold text-[var(--accent-emerald)] border-[var(--border-accent)]">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{statusBanner}</span>
        </div>
      )}

      <section className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* 1. Warish-Matched Export */}
        <article className="surface-3d p-5 sm:p-6 flex flex-col justify-between gap-4">
          <div className="space-y-3">
            <div className="flex items-start gap-3.5">
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-600 flex items-center justify-center text-slate-950 icon-3d shrink-0">
                <Users className="w-5 h-5 stroke-[2.2]" />
              </div>
              <div>
                <h2 className="text-base sm:text-lg font-bold text-[var(--text-primary)]">
                  ওয়ারিশ-ম্যাচকৃত রেকর্ড (Warish-Matched)
                </h2>
                <p className="text-xs text-[var(--text-secondary)]">
                  ৮টি আপলোডকৃত সনদের (সফর আলী বংশধারা) সাথে মিলকৃত খতিয়ান ও ওয়ারিশ অংশের তালিকা।
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div>
                <label className="block text-[11px] font-medium text-[var(--text-muted)] mb-1">
                  মৌজা স্কোপ
                </label>
                <div className="grid grid-cols-2 gap-1 p-1 rounded-xl bg-[var(--surface-input)] border border-[var(--border-subtle)] text-xs">
                  <button
                    type="button"
                    onClick={() => setWarishScope('all')}
                    className={`py-1.5 px-2 rounded-lg font-semibold transition-colors cursor-pointer ${
                      warishScope === 'all'
                        ? 'bg-emerald-500 text-slate-950'
                        : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                    }`}
                  >
                    সকল মৌজা
                  </button>
                  <button
                    type="button"
                    onClick={() => setWarishScope('goali')}
                    className={`py-1.5 px-2 rounded-lg font-semibold transition-colors cursor-pointer ${
                      warishScope === 'goali'
                        ? 'bg-emerald-500 text-slate-950'
                        : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                    }`}
                  >
                    শুধু গোয়ালী
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-medium text-[var(--text-muted)] mb-1">
                  ফাইল ফরম্যাট
                </label>
                <div className="grid grid-cols-4 gap-1 p-1 rounded-xl bg-[var(--surface-input)] border border-[var(--border-subtle)] text-xs">
                  {FORMAT_OPTIONS.map((f) => (
                    <button
                      key={f.id}
                      type="button"
                      onClick={() => setWarishFormat(f.id)}
                      className={`py-1.5 rounded-lg font-semibold transition-colors cursor-pointer ${
                        warishFormat === f.id
                          ? 'bg-amber-400 text-slate-950'
                          : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                      }`}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={handleDownloadWarish}
            disabled={busyCard !== null}
            className="w-full btn-3d px-4 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
          >
            {busyCard === 'warish' ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Download className="w-4 h-4 stroke-[2.5]" />
            )}
            <span>ওয়ারিশ তালিকা ডাউনলোড (.{warishFormat})</span>
          </button>
        </article>

        {/* 2. Mouza-wise Master Ledger */}
        <article className="surface-3d p-5 sm:p-6 flex flex-col justify-between gap-4">
          <div className="space-y-3">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3.5">
                <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-amber-300 to-amber-500 flex items-center justify-center text-slate-950 icon-3d shrink-0">
                  <MapPin className="w-5 h-5 stroke-[2.2]" />
                </div>
                <div>
                  <h2 className="text-base sm:text-lg font-bold text-[var(--text-primary)]">
                    মৌজাভিত্তিক মাস্টার লেজার (Mouza Ledger)
                  </h2>
                  <p className="text-xs text-[var(--text-secondary)]">
                    উপজেলা ও মৌজা অনুযায়ী পৃথক টেবিলে A4 Landscape PDF বা স্প্রেডশিট।
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => onOpenPrintStudio(mouzaUpazila, mouzaName)}
                className="text-[11px] font-semibold text-[var(--text-muted)] hover:text-[var(--accent-gold)] flex items-center gap-1 shrink-0 cursor-pointer transition-colors"
                title="A4 প্রিন্ট লেআউট কাস্টমাইজ করতে প্রিন্ট স্টুডিও খুলুন"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>প্রিন্ট স্টুডিও</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
              <div>
                <label className="block text-[11px] font-medium text-[var(--text-muted)] mb-1">
                  উপজেলা
                </label>
                <div className="flex items-center gap-1.5 bg-[var(--surface-input)] border border-[var(--border-subtle)] rounded-xl px-2.5 py-2 text-xs">
                  <Building2 className="w-3.5 h-3.5 text-[var(--accent-gold)] shrink-0" />
                  <select
                    value={mouzaUpazila}
                    onChange={(e) => {
                      setMouzaUpazila(e.target.value);
                      setMouzaName('');
                    }}
                    className="w-full bg-transparent text-[var(--text-primary)] focus:outline-none cursor-pointer"
                  >
                    <option value="">সকল উপজেলা</option>
                    {availableUpazilas.map((u) => (
                      <option key={u} value={u}>
                        {u}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-medium text-[var(--text-muted)] mb-1">
                  মৌজা
                </label>
                <select
                  value={mouzaName}
                  onChange={(e) => setMouzaName(e.target.value)}
                  className="w-full bg-[var(--surface-input)] border border-[var(--border-subtle)] rounded-xl px-2.5 py-2 text-xs text-[var(--text-primary)] focus:outline-none cursor-pointer"
                >
                  <option value="">সকল মৌজা</option>
                  {mouzasForSelectedUpazila.map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-medium text-[var(--text-muted)] mb-1">
                  ফরম্যাট
                </label>
                <div className="grid grid-cols-4 gap-1 p-1 rounded-xl bg-[var(--surface-input)] border border-[var(--border-subtle)] text-[11px]">
                  {FORMAT_OPTIONS.map((f) => (
                    <button
                      key={f.id}
                      type="button"
                      onClick={() => setMouzaFormat(f.id)}
                      className={`py-1 rounded-lg font-semibold transition-colors cursor-pointer ${
                        mouzaFormat === f.id
                          ? 'bg-amber-400 text-slate-950'
                          : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                      }`}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={handleDownloadMouza}
            disabled={busyCard !== null}
            className="w-full btn-3d px-4 py-3 rounded-xl bg-gradient-to-r from-amber-400 via-amber-300 to-yellow-400 text-slate-950 font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
          >
            {busyCard === 'mouza' ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Download className="w-4 h-4 stroke-[2.5]" />
            )}
            <span>
              {mouzaName ? `${mouzaName} মৌজার ফাইল` : 'মৌজা মাস্টার লেজার'} ডাউনলোড (.{mouzaFormat})
            </span>
          </button>
        </article>

        {/* 3. Forensic Reports (REPORT 1–10 + Detector/Genealogy/Tests) */}
        <article className="surface-3d p-5 sm:p-6 flex flex-col justify-between gap-4">
          <div className="space-y-3">
            <div className="flex items-start gap-3.5">
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-teal-400 to-emerald-600 flex items-center justify-center text-slate-950 icon-3d shrink-0">
                <Fingerprint className="w-5 h-5 stroke-[2.2]" />
              </div>
              <div>
                <h2 className="text-base sm:text-lg font-bold text-[var(--text-primary)]">
                  ফরেনসিক অডিট রিপোর্ট (REPORT ১–১০)
                </h2>
                <p className="text-xs text-[var(--text-secondary)]">
                  বংশলতিকা, খতিয়ান-দাগ ক্রস-ম্যাপিং, দাগ ৬৫১ গরমিল ও অনুপস্থিত দলিলের প্রমাণভিত্তিক প্রতিবেদন।
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
              <div className="sm:col-span-2">
                <label className="block text-[11px] font-medium text-[var(--text-muted)] mb-1">
                  রিপোর্ট নির্বাচন (Report 1–10)
                </label>
                <select
                  value={forensicReportId}
                  onChange={(e) => setForensicReportId(e.target.value as ForensicExportReportId)}
                  className="w-full bg-[var(--surface-input)] border border-[var(--border-subtle)] rounded-xl px-3 py-2 text-xs text-[var(--text-primary)] focus:outline-none cursor-pointer"
                >
                  {FORENSIC_REPORT_OPTIONS.map((opt) => (
                    <option key={opt.id} value={opt.id}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-medium text-[var(--text-muted)] mb-1">
                  ফরম্যাট
                </label>
                <div className="grid grid-cols-4 gap-1 p-1 rounded-xl bg-[var(--surface-input)] border border-[var(--border-subtle)] text-[11px]">
                  {FORMAT_OPTIONS.map((f) => (
                    <button
                      key={f.id}
                      type="button"
                      onClick={() => setForensicFormat(f.id)}
                      className={`py-1 rounded-lg font-semibold transition-colors cursor-pointer ${
                        forensicFormat === f.id
                          ? 'bg-amber-400 text-slate-950'
                          : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                      }`}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={handleDownloadForensic}
            disabled={busyCard !== null}
            className="w-full btn-3d px-4 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
          >
            {busyCard === 'forensic' ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Download className="w-4 h-4 stroke-[2.5]" />
            )}
            <span>ফরেনসিক রিপোর্ট ডাউনলোড (.{forensicFormat})</span>
          </button>
        </article>

        {/* 4. Selected / Filtered Rows */}
        <article className="surface-3d p-5 sm:p-6 flex flex-col justify-between gap-4">
          <div className="space-y-3">
            <div className="flex items-start gap-3.5">
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-slate-200 to-slate-400 dark:from-slate-600 dark:to-slate-800 flex items-center justify-center text-slate-950 dark:text-white icon-3d shrink-0">
                <CheckSquare className="w-5 h-5 stroke-[2.2]" />
              </div>
              <div>
                <h2 className="text-base sm:text-lg font-bold text-[var(--text-primary)]">
                  নির্বাচিত ও ফিল্টারকৃত সারি (Selected / Filtered)
                </h2>
                <p className="text-xs text-[var(--text-secondary)]">
                  বর্তমান সার্চ ফিল্টার অথবা লেজার গ্রিডে টিক চিহ্নিত সারিগুলোর কাস্টম কলামসহ তাৎক্ষণিক এক্সপোর্ট।
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div>
                <label className="block text-[11px] font-medium text-[var(--text-muted)] mb-1">
                  সারির পরিসর
                </label>
                <select
                  value={rowsScope}
                  onChange={(e) => setRowsScope(e.target.value as 'selected' | 'filtered' | 'all')}
                  className="w-full bg-[var(--surface-input)] border border-[var(--border-subtle)] rounded-xl px-3 py-2 text-xs text-[var(--text-primary)] focus:outline-none cursor-pointer"
                >
                  {selectedIds.size > 0 && (
                    <option value="selected">
                      শুধু নির্বাচিত সারি ({toBengaliNumber(selectedIds.size)} টি)
                    </option>
                  )}
                  <option value="filtered">
                    ফিল্টারকৃত সারি ({toBengaliNumber(filteredRecords.length)} টি)
                  </option>
                  <option value="all">
                    সকল রেকর্ড ({toBengaliNumber(records.length)} টি)
                  </option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-medium text-[var(--text-muted)] mb-1">
                  ফরম্যাট
                </label>
                <div className="grid grid-cols-4 gap-1 p-1 rounded-xl bg-[var(--surface-input)] border border-[var(--border-subtle)] text-xs">
                  {FORMAT_OPTIONS.map((f) => (
                    <button
                      key={f.id}
                      type="button"
                      onClick={() => setRowsFormat(f.id)}
                      className={`py-1.5 rounded-lg font-semibold transition-colors cursor-pointer ${
                        rowsFormat === f.id
                          ? 'bg-amber-400 text-slate-950'
                          : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                      }`}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={handleDownloadRows}
            disabled={busyCard !== null || selectedRowsCount === 0}
            className="w-full btn-3d px-4 py-3 rounded-xl bg-gradient-to-r from-amber-400 via-amber-300 to-yellow-400 text-slate-950 font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
          >
            {busyCard === 'rows' ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Download className="w-4 h-4 stroke-[2.5]" />
            )}
            <span>
              {toBengaliNumber(selectedRowsCount)} টি সারি ডাউনলোড (.{rowsFormat})
            </span>
          </button>
        </article>
      </section>

      {/* 5. SLULIS 1-Click Master Litigation Package (.ZIP) */}
      <section className="surface-3d p-5 sm:p-6 border-[var(--border-gold)] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-slate-950 icon-3d shrink-0">
            <Scale className="w-6 h-6 stroke-[2.2]" />
          </div>
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-wider text-[var(--accent-gold)]">
              SLULIS মাস্টার বান্ডেল
            </div>
            <h2 className="text-base sm:text-lg font-bold text-[var(--text-primary)]">
              সফর আলী বংশধারা: সর্বমৌজা টাইটেল পুনর্গঠন ও মোকদ্দমা ড্রাফট (সব নথি একসাথে)
            </h2>
            <p className="text-xs text-[var(--text-secondary)] mt-0.5">
              {slulisProgressText ||
                'দেওয়ানি আরজি, ১৪টি পরিশিষ্ট, দাগ ৬৫১ ও ৬৫৪ অসঙ্গতি বিশ্লেষণ, ১১-শিট এক্সেল ও সম্পূর্ণ ফরেনসিক আর্কাইভ এক .ZIP ফাইলে।'}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleDownloadSlulisZip}
          disabled={busyCard !== null}
          className="w-full sm:w-auto shrink-0 btn-3d px-6 py-3.5 rounded-xl bg-gradient-to-r from-amber-400 via-amber-300 to-yellow-400 text-slate-950 font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
        >
          {busyCard === 'slulis' ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Download className="w-4 h-4 stroke-[2.5]" />
          )}
          <span>১-ক্লিকে SLULIS মাস্টার ডাউনলোড (.ZIP)</span>
        </button>
      </section>
    </main>
  );
};
