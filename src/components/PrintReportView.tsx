import React, { useEffect, useState } from 'react';
import {
  Printer,
  ArrowLeft,
  Download,
  Building2,
  MapPin,
  Layers,
  FileSpreadsheet,
  CheckSquare,
  FileText,
  FileJson,
  Loader2,
} from 'lucide-react';
import { DynamicColumn, LandRecord } from '../types/landRecord';
import {
  formatAreaBengali,
  parseAcreValue,
  toBengaliNumber,
} from '../utils/bengaliNumerals';
import {
  exportGenericTableToExcel,
  exportToCSV,
  exportToExcel,
  exportToJSON,
} from '../utils/exportUtils';
import {
  downloadForensicReportTablePdf,
  downloadMouzaLandRecordsPdf,
} from '../utils/pdfDownloadEngine';

interface PrintReportViewProps {
  records: LandRecord[];
  columns: DynamicColumn[];
  onBack: () => void;
  initialSelectedUpazila?: string;
  initialSelectedMouza?: string;
}

export const PrintReportView: React.FC<PrintReportViewProps> = ({
  records,
  columns,
  onBack,
  initialSelectedUpazila = '',
  initialSelectedMouza = '',
}) => {
  const [selectedUpazila, setSelectedUpazila] = useState<string>(initialSelectedUpazila);
  const [selectedMouza, setSelectedMouza] = useState<string>(initialSelectedMouza);
  const [pageBreakPerMouza, setPageBreakPerMouza] = useState<boolean>(true);
  const [showMouzaSummaryIndex, setShowMouzaSummaryIndex] = useState<boolean>(true);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState<boolean>(false);

  useEffect(() => {
    setSelectedUpazila(initialSelectedUpazila);
  }, [initialSelectedUpazila]);

  useEffect(() => {
    setSelectedMouza(initialSelectedMouza);
  }, [initialSelectedMouza]);

  const visibleColumns = columns.filter((c) => c.visible).sort((a, b) => a.order - b.order);

  // Available Upazilas in the dataset
  const availableUpazilas = Array.from(new Set(records.map((r) => r.upazila))).filter(Boolean);

  // Filter by Upazila first
  const upazilaFilteredRecords = selectedUpazila
    ? records.filter((r) => r.upazila === selectedUpazila)
    : records;

  // Available Mouzas within the selected Upazila (or all)
  const availableMouzas = Array.from(
    new Set(upazilaFilteredRecords.map((r) => r.mouza))
  ).filter(Boolean);

  // Final active records filtered by both Upazila and Mouza
  const activeRecords = selectedMouza
    ? upazilaFilteredRecords.filter((r) => r.mouza === selectedMouza)
    : upazilaFilteredRecords;

  // Group records by Upazila -> Mouza so each Mouza gets its own separate table
  const groupedData = new Map<string, Map<string, LandRecord[]>>();

  for (const rec of activeRecords) {
    const upz = rec.upazila || 'অন্যান্য উপজেলা';
    const mouzKey = `${rec.mouza || 'অন্যান্য মৌজা'}__JL_${rec.jlNo || '০১'}`;

    if (!groupedData.has(upz)) {
      groupedData.set(upz, new Map());
    }
    const upzMap = groupedData.get(upz)!;
    if (!upzMap.has(mouzKey)) {
      upzMap.set(mouzKey, []);
    }
    upzMap.get(mouzKey)!.push(rec);
  }

  // Build flat list of Mouza summaries for the Mouza Index Table
  const mouzaSummaries = Array.from(groupedData.entries()).flatMap(([upzName, mouzaMap]) =>
    Array.from(mouzaMap.entries()).map(([mouzKey, mouzRecords]) => {
      const first = mouzRecords[0];
      const totalAcre = mouzRecords.reduce((acc, r) => acc + parseAcreValue(r.area), 0);
      const uniqueKhatians = new Set(mouzRecords.map((r) => r.khatianNo)).size;
      const uniqueDags = new Set(mouzRecords.map((r) => r.dagNo)).size;
      const surveys = Array.from(new Set(mouzRecords.map((r) => r.surveyType))).join(', ');
      return {
        key: mouzKey,
        district: first?.district || '—',
        upazila: upzName,
        mouza: first?.mouza || '—',
        jlNo: first?.jlNo || '—',
        surveys,
        recordCount: mouzRecords.length,
        uniqueKhatians,
        uniqueDags,
        totalAcre,
      };
    })
  );

  // Grand totals across all active records
  const grandTotalRecords = activeRecords.length;
  const grandUniqueKhatians = new Set(activeRecords.map((r) => `${r.mouza}_${r.khatianNo}`)).size;
  const grandUniqueDags = new Set(activeRecords.map((r) => `${r.mouza}_${r.dagNo}`)).size;
  const grandTotalAcre = activeRecords.reduce((acc, r) => acc + parseAcreValue(r.area), 0);

  const handlePrint = () => {
    window.print();
  };

  const handleDirectDownloadPdf = async () => {
    if (activeRecords.length === 0 || isGeneratingPdf) return;
    setIsGeneratingPdf(true);
    try {
      const scope = selectedMouza || selectedUpazila || 'All_Mouzas';
      await downloadMouzaLandRecordsPdf(activeRecords, columns, scope);
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const handleDirectDownloadSingleMouzaPdf = async (
    mouzaRecords: LandRecord[],
    mouzaName: string
  ) => {
    if (mouzaRecords.length === 0 || isGeneratingPdf) return;
    setIsGeneratingPdf(true);
    try {
      await downloadMouzaLandRecordsPdf(mouzaRecords, columns, `Mouza_${mouzaName}`);
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const handleDownloadMouzaSummaryIndexPdf = async () => {
    if (mouzaSummaries.length === 0 || isGeneratingPdf) return;
    setIsGeneratingPdf(true);
    try {
      await downloadForensicReportTablePdf({
        reportTitle: 'মৌজাভিত্তিক সারসংক্ষেপ সূচিপত্র (Mouza-wise Master Summary Index)',
        reportSubtitle: `সর্বমোট মৌজা: ${toBengaliNumber(mouzaSummaries.length)} টি | সর্বমোট রেকর্ড: ${toBengaliNumber(grandTotalRecords)} টি`,
        headers: [
          { key: 'sl', label: 'ক্রমিক', width: 80 },
          { key: 'district', label: 'জেলা', width: 150 },
          { key: 'upazila', label: 'উপজেলা/থানা', width: 170 },
          { key: 'mouza', label: 'মৌজার নাম', width: 180 },
          { key: 'jlNo', label: 'জে.এল. নং', width: 100 },
          { key: 'surveys', label: 'জরিপসমূহ', width: 150 },
          { key: 'khatians', label: 'মোট খতিয়ান', width: 120 },
          { key: 'dags', label: 'মোট দাগ', width: 120 },
          { key: 'records', label: 'রেকর্ড সংখ্যা', width: 130 },
          { key: 'area', label: 'মৌজার মোট জমির পরিমাণ', width: 220 },
        ],
        rows: mouzaSummaries.map((ms, idx) => ({
          sl: toBengaliNumber(idx + 1),
          district: ms.district,
          upazila: ms.upazila,
          mouza: ms.mouza,
          jlNo: ms.jlNo,
          surveys: ms.surveys,
          khatians: toBengaliNumber(ms.uniqueKhatians),
          dags: toBengaliNumber(ms.uniqueDags),
          records: toBengaliNumber(ms.recordCount),
          area: formatAreaBengali(ms.totalAcre),
        })),
        fileNamePrefix: 'LR_Mouza_Master_Summary_Index',
      });
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const handleDownloadMouzaSummaryIndexExcel = () => {
    exportGenericTableToExcel(
      [
        { key: 'sl', label: 'ক্রমিক' },
        { key: 'district', label: 'জেলা' },
        { key: 'upazila', label: 'উপজেলা/থানা' },
        { key: 'mouza', label: 'মৌজার নাম' },
        { key: 'jlNo', label: 'জে.এল. নং' },
        { key: 'surveys', label: 'জরিপসমূহ' },
        { key: 'khatians', label: 'মোট খতিয়ান' },
        { key: 'dags', label: 'মোট দাগ' },
        { key: 'records', label: 'রেকর্ড সংখ্যা' },
        { key: 'area', label: 'মৌজার মোট জমির পরিমাণ' },
      ],
      mouzaSummaries.map((ms, idx) => ({
        sl: toBengaliNumber(idx + 1),
        district: ms.district,
        upazila: ms.upazila,
        mouza: ms.mouza,
        jlNo: ms.jlNo,
        surveys: ms.surveys,
        khatians: toBengaliNumber(ms.uniqueKhatians),
        dags: toBengaliNumber(ms.uniqueDags),
        records: toBengaliNumber(ms.recordCount),
        area: formatAreaBengali(ms.totalAcre),
      })),
      'LR_Mouza_Master_Summary_Index',
      'মৌজা সূচিপত্র'
    );
  };

  const handlePrintSingleMouza = (upz: string, mouz: string) => {
    setSelectedUpazila(upz);
    setSelectedMouza(mouz);
    setTimeout(() => {
      window.print();
    }, 150);
  };

  // Download self-contained printable HTML report that can be opened or saved directly as PDF
  const handleDownloadHtmlReport = () => {
    const printContent = document.getElementById('printable-ledger-report')?.innerHTML;
    if (!printContent) return;

    const scopeTitle = selectedMouza
      ? `Mouza_${selectedMouza}`
      : selectedUpazila
      ? `Upazila_${selectedUpazila}`
      : 'All_Mouzas_Master_Ledger';

    const fullHtml = `<!DOCTYPE html>
<html lang="bn">
<head>
  <meta charset="UTF-8">
  <title>LR Master Ledger Report - ${scopeTitle}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Hind+Siliguri:wght@400;500;600;700&family=JetBrains+Mono:wght@400;600&display=swap" rel="stylesheet">
  <style>
    @page { size: A4 landscape; margin: 8mm 10mm 10mm 10mm; }
    body { font-family: 'Hind Siliguri', sans-serif; background: #fff; color: #111827; margin: 0; padding: 16px; }
    table { width: 100%; border-collapse: collapse; font-size: 11px; margin-bottom: 18px; }
    th, td { border: 1px solid #1e293b; padding: 5px 6px; }
    th { background: #f1f5f9; font-weight: 700; text-align: center; }
    .font-mono-num { font-family: 'JetBrains Mono', monospace; }
    .print-page-break { page-break-after: always; break-after: page; }
    .no-print { display: none !important; }
    .header-banner { border-bottom: 2px solid #0f172a; padding-bottom: 8px; margin-bottom: 14px; text-align: center; }
    .mouza-card { margin-bottom: 28px; }
    @media print {
      body { padding: 0; }
      button { display: none !important; }
    }
  </style>
</head>
<body>
  <div style="background:#fef3c7;border:1px solid #f59e0b;padding:10px 16px;margin-bottom:16px;border-radius:6px;display:flex;justify-content:space-between;align-items:center;" class="no-print">
    <span><strong>মৌজাভিত্তিক অফলাইন প্রিন্ট ভিউ:</strong> সরাসরি PDF হিসেবে সংরক্ষণ করতে ডানপাশের বাটনে ক্লিক করুন এবং Destination থেকে <strong>Save as PDF</strong> সিলেক্ট করুন।</span>
    <button onclick="window.print()" style="background:#d97706;color:#fff;border:none;padding:8px 16px;border-radius:6px;font-weight:bold;cursor:pointer;">প্রিন্ট / Save as PDF</button>
  </div>
  ${printContent}
</body>
</html>`;

    const blob = new Blob([fullHtml], { type: 'text/html;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `LR_Mouza_PDF_Report_${scopeTitle}_${new Date().toISOString().slice(0, 10)}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-[#070a12] text-slate-100 flex flex-col font-bengali">
      {/* Top Floating Control Bar (Hidden when printing) */}
      <div className="no-print sticky top-0 z-30 bg-[#0f1523]/95 backdrop-blur border-b border-amber-500/20 px-4 sm:px-8 py-3 space-y-2.5 shadow-xl">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={onBack}
              className="p-2 text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-700 rounded-lg transition-colors flex items-center gap-1.5 text-xs font-semibold"
            >
              <ArrowLeft className="w-4 h-4 text-amber-400" />
              <span>লেজারে ফিরে যান</span>
            </button>

            {/* Upazila Selector */}
            <div className="flex items-center gap-1.5 bg-[#151c2d] border border-amber-500/30 rounded-lg px-2.5 py-1.5">
              <Building2 className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span className="text-xs text-slate-400">উপজেলা:</span>
              <select
                value={selectedUpazila}
                onChange={(e) => {
                  setSelectedUpazila(e.target.value);
                  setSelectedMouza('');
                }}
                className="bg-transparent text-amber-300 text-xs font-semibold focus:outline-none cursor-pointer"
              >
                <option value="" className="bg-[#121827] text-slate-200">
                  সকল উপজেলা ({toBengaliNumber(records.length)} রেকর্ড)
                </option>
                {availableUpazilas.map((u) => (
                  <option key={u} value={u} className="bg-[#121827] text-slate-200">
                    {u} ({toBengaliNumber(records.filter((r) => r.upazila === u).length)} রেকর্ড)
                  </option>
                ))}
              </select>
            </div>

            {/* Mouza Selector (Mouza-Best PDF Implementation) */}
            <div className="flex items-center gap-1.5 bg-[#151c2d] border border-emerald-500/40 rounded-lg px-2.5 py-1.5">
              <MapPin className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span className="text-xs text-slate-400">মৌজা নির্বাচন:</span>
              <select
                value={selectedMouza}
                onChange={(e) => setSelectedMouza(e.target.value)}
                className="bg-transparent text-emerald-300 text-xs font-semibold focus:outline-none cursor-pointer"
              >
                <option value="" className="bg-[#121827] text-slate-200">
                  সকল মৌজা — পৃথক টেবিল ({toBengaliNumber(availableMouzas.length)} টি মৌজা)
                </option>
                {availableMouzas.map((m) => {
                  const mCount = upazilaFilteredRecords.filter((r) => r.mouza === m).length;
                  return (
                    <option key={m} value={m} className="bg-[#121827] text-slate-200">
                      মৌজা: {m} ({toBengaliNumber(mCount)} টি রেকর্ড)
                    </option>
                  );
                })}
              </select>
            </div>
          </div>

          {/* Right Action Triggers */}
          <div className="flex flex-wrap items-center gap-2">
            <label className="hidden lg:flex items-center gap-1.5 text-xs text-slate-300 bg-[#151c2d] border border-slate-700 px-2.5 py-1.5 rounded-lg cursor-pointer">
              <input
                type="checkbox"
                checked={showMouzaSummaryIndex}
                onChange={(e) => setShowMouzaSummaryIndex(e.target.checked)}
                className="rounded border-slate-600 text-amber-500"
              />
              <span>মৌজা সূচিপত্র</span>
            </label>

            <label className="hidden lg:flex items-center gap-1.5 text-xs text-slate-300 bg-[#151c2d] border border-slate-700 px-2.5 py-1.5 rounded-lg cursor-pointer">
              <input
                type="checkbox"
                checked={pageBreakPerMouza}
                onChange={(e) => setPageBreakPerMouza(e.target.checked)}
                className="rounded border-slate-600 text-amber-500"
              />
              <span>প্রতি মৌজা আলাদা পৃষ্ঠায়</span>
            </label>

            <button
              onClick={() =>
                exportToExcel(
                  activeRecords,
                  columns,
                  `LR_Mouza_${selectedMouza || selectedUpazila || 'Master'}`
                )
              }
              className="p-2 sm:px-3 sm:py-2 text-xs font-medium text-emerald-300 bg-emerald-950/40 hover:bg-emerald-950/60 border border-emerald-500/30 rounded-lg transition-colors flex items-center gap-1.5"
              title="Excel (.xlsx) হিসেবে লোকাল ডিস্কে সেভ করুন"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
              <span className="hidden sm:inline">Excel (.xlsx)</span>
            </button>

            <button
              onClick={() =>
                exportToCSV(
                  activeRecords,
                  columns,
                  `LR_Mouza_${selectedMouza || selectedUpazila || 'Master'}`
                )
              }
              className="p-2 sm:px-3 sm:py-2 text-xs font-medium text-sky-300 bg-sky-950/40 hover:bg-sky-950/60 border border-sky-500/30 rounded-lg transition-colors flex items-center gap-1.5"
              title="CSV (.csv) হিসেবে লোকাল ডিস্কে সেভ করুন"
            >
              <FileText className="w-3.5 h-3.5 text-sky-400" />
              <span className="hidden sm:inline">CSV</span>
            </button>

            <button
              onClick={() =>
                exportToJSON(
                  activeRecords,
                  `LR_Mouza_${selectedMouza || selectedUpazila || 'Master'}`
                )
              }
              className="p-2 sm:px-3 sm:py-2 text-xs font-medium text-purple-300 bg-purple-950/40 hover:bg-purple-950/60 border border-purple-500/30 rounded-lg transition-colors flex items-center gap-1.5"
              title="JSON (.json) হিসেবে লোকাল ডিস্কে সেভ করুন"
            >
              <FileJson className="w-3.5 h-3.5 text-purple-400" />
              <span className="hidden sm:inline">JSON</span>
            </button>

            <button
              onClick={handleDownloadHtmlReport}
              className="p-2 sm:px-3 sm:py-2 text-xs font-medium text-slate-200 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg transition-colors flex items-center gap-1.5"
              title="অফলাইনে যেকোনো ডিভাইসে প্রিন্ট করার জন্য HTML ফাইল লোকাল ডিস্কে সেভ করুন"
            >
              <Download className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden sm:inline">HTML রিপোর্ট সেভ</span>
            </button>

            <button
              onClick={handleDirectDownloadPdf}
              disabled={isGeneratingPdf || activeRecords.length === 0}
              className="px-4 py-2 text-xs sm:text-sm font-bold text-slate-950 bg-gradient-to-r from-emerald-400 via-teal-300 to-emerald-400 hover:from-emerald-300 hover:to-teal-200 disabled:opacity-50 rounded-lg shadow-lg flex items-center gap-2 transition-all"
            >
              {isGeneratingPdf ? (
                <Loader2 className="w-4 h-4 animate-spin text-slate-950" />
              ) : (
                <Download className="w-4 h-4 text-slate-950 stroke-[2.5]" />
              )}
              <span>
                {isGeneratingPdf
                  ? 'PDF তৈরি হচ্ছে...'
                  : selectedMouza
                  ? `${selectedMouza} মৌজার .PDF ডাউনলোড`
                  : 'সরাসরি .PDF ফাইল ডাউনলোড'}
              </span>
            </button>

            <button
              onClick={handlePrint}
              className="px-4 py-2 text-xs sm:text-sm font-bold text-slate-950 bg-gradient-to-r from-amber-400 via-amber-300 to-yellow-500 hover:from-amber-300 hover:to-yellow-400 active:scale-[0.98] rounded-lg shadow-lg shadow-amber-950/40 flex items-center gap-2 transition-all"
            >
              <Printer className="w-4 h-4 text-slate-950 stroke-[2.5]" />
              <span>প্রিন্ট / Save as PDF</span>
            </button>
          </div>
        </div>

        {/* Interactive Mouza Pill Bar for 1-Click Mouza Switching */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 pt-0.5">
          <span className="text-[11px] text-slate-400 shrink-0 mr-1">দ্রুত মৌজা ভিউ:</span>
          <button
            onClick={() => setSelectedMouza('')}
            className={`px-2.5 py-1 rounded text-xs font-medium whitespace-nowrap transition-colors ${
              selectedMouza === ''
                ? 'bg-amber-400 text-slate-950 font-bold'
                : 'bg-[#161f33] text-slate-300 hover:bg-slate-800'
            }`}
          >
            সকল মৌজা একত্রে ({toBengaliNumber(availableMouzas.length)})
          </button>
          {availableMouzas.map((m) => {
            const count = upazilaFilteredRecords.filter((r) => r.mouza === m).length;
            return (
              <button
                key={m}
                onClick={() => setSelectedMouza(m)}
                className={`px-2.5 py-1 rounded text-xs font-medium whitespace-nowrap transition-colors flex items-center gap-1 ${
                  selectedMouza === m
                    ? 'bg-emerald-400 text-slate-950 font-bold'
                    : 'bg-[#161f33] text-slate-300 hover:bg-slate-800'
                }`}
              >
                <span>{m}</span>
                <span className="text-[10px] opacity-80">({toBengaliNumber(count)})</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Printable Document Sheet */}
      <div className="flex-1 max-w-[1550px] w-full mx-auto p-3 sm:p-8">
        <div
          id="printable-ledger-report"
          className="bg-white text-slate-900 shadow-2xl rounded-sm p-5 sm:p-10 font-bengali print:p-0 print:shadow-none print:m-0"
        >
          {/* Official Header Banner */}
          <div className="header-banner border-b-2 border-slate-900 pb-4 mb-6 text-center">
            <div className="flex items-center justify-between text-[10px] text-slate-600 mb-1">
              <span>বাংলাদেশ ফরম নং ৫৪৬২ (সংশোধিত)</span>
              <span>গণপ্রজাতন্ত্রী বাংলাদেশ সরকার · ভূমি রেকর্ড ও জরিপ অধিদপ্তর</span>
              <span>রেজিস্টার: খতিয়ান ও দাগ সূচি</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-950 tracking-tight">
              {selectedMouza
                ? `${selectedMouza} মৌজার চূড়ান্ত খতিয়ান ও দাগ রেজিস্টার লেজার`
                : 'মৌজাভিত্তিক মাস্টার ল্যান্ড রেকর্ড ও খতিয়ান-দাগ ইনভেন্টরি লেজার'}
            </h1>
            <p className="text-xs sm:text-sm font-medium text-slate-700 mt-0.5">
              {selectedMouza
                ? `উপজেলা: ${activeRecords[0]?.upazila || '—'} · জেলা: ${activeRecords[0]?.district || '—'} · জে.এল. নং: ${activeRecords[0]?.jlNo || '—'}`
                : selectedUpazila
                ? `${selectedUpazila} উপজেলার সকল মৌজার পৃথক টেবিল ও সমন্বিত তালিকা`
                : 'আপলোডকৃত সোর্সের শতভাগ রেকর্ড সংবলিত মৌজাভিত্তিক পৃথক রেজিস্টার'}
            </p>

            {/* Grand Summary Bar */}
            <div className="mt-3.5 bg-slate-50 border border-slate-400 rounded p-2.5 text-xs text-left grid grid-cols-2 sm:grid-cols-5 gap-2">
              <div>
                <span className="text-slate-600">মোট মৌজা: </span>
                <span className="font-bold text-slate-950 font-mono-num">
                  {toBengaliNumber(mouzaSummaries.length)} টি
                </span>
              </div>
              <div>
                <span className="text-slate-600">মোট রেকর্ড: </span>
                <span className="font-bold text-slate-950 font-mono-num">
                  {toBengaliNumber(grandTotalRecords)} টি (১০০% অন্তর্ভুক্ত)
                </span>
              </div>
              <div>
                <span className="text-slate-600">অনন্য খতিয়ান: </span>
                <span className="font-bold text-slate-950 font-mono-num">
                  {toBengaliNumber(grandUniqueKhatians)} টি
                </span>
              </div>
              <div>
                <span className="text-slate-600">অনন্য দাগ/প্লট: </span>
                <span className="font-bold text-slate-950 font-mono-num">
                  {toBengaliNumber(grandUniqueDags)} টি
                </span>
              </div>
              <div>
                <span className="text-slate-600">সর্বমোট জমি: </span>
                <span className="font-bold text-slate-950 font-mono-num">
                  {formatAreaBengali(grandTotalAcre)}
                </span>
              </div>
            </div>
          </div>

          {/* Mouza-Wise Summary Index Table (মৌজাভিত্তিক সারসংক্ষেপ সূচিপত্র) */}
          {showMouzaSummaryIndex && mouzaSummaries.length > 1 && (
            <div className="mb-8 border border-slate-400 rounded-sm p-3 print:border-none print:p-0">
              <div className="bg-slate-900 text-white px-3 py-1.5 text-xs font-bold flex flex-wrap items-center justify-between gap-2 mb-2">
                <span>মৌজাভিত্তিক সারসংক্ষেপ সূচিপত্র (Mouza-wise Master Summary Index)</span>
                <div className="flex items-center gap-2">
                  <span>মোট মৌজা: {toBengaliNumber(mouzaSummaries.length)} টি</span>
                  <button
                    onClick={handleDownloadMouzaSummaryIndexPdf}
                    disabled={isGeneratingPdf}
                    className="no-print px-2 py-0.5 bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold rounded text-[10px] inline-flex items-center gap-1"
                  >
                    <Download className="w-3 h-3" />
                    <span>সূচিপত্র .PDF ডাউনলোড</span>
                  </button>
                  <button
                    onClick={handleDownloadMouzaSummaryIndexExcel}
                    className="no-print px-2 py-0.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded text-[10px] inline-flex items-center gap-1"
                  >
                    <FileSpreadsheet className="w-3 h-3" />
                    <span>সূচিপত্র .XLSX সেভ</span>
                  </button>
                </div>
              </div>
              <table className="w-full text-left border-collapse border border-slate-900 text-xs">
                <thead>
                  <tr className="bg-slate-100 text-slate-950 font-bold border-b border-slate-900 divide-x divide-slate-400 text-[11px]">
                    <th className="p-1.5 text-center w-12">ক্রমিক</th>
                    <th className="p-1.5">জেলা</th>
                    <th className="p-1.5">উপজেলা/থানা</th>
                    <th className="p-1.5">মৌজার নাম</th>
                    <th className="p-1.5 text-center">জে.এল. নং</th>
                    <th className="p-1.5 text-center">জরিপ</th>
                    <th className="p-1.5 text-center">মোট খতিয়ান</th>
                    <th className="p-1.5 text-center">মোট দাগ</th>
                    <th className="p-1.5 text-center">রেকর্ড সংখ্যা</th>
                    <th className="p-1.5 text-right">মৌজার মোট জমির পরিমাণ</th>
                    <th className="p-1.5 text-center no-print">লোকাল ডিস্কে সেভ / প্রিন্ট</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-300">
                  {mouzaSummaries.map((ms, idx) => {
                    const mRecords = activeRecords.filter(
                      (r) => r.upazila === ms.upazila && r.mouza === ms.mouza
                    );
                    return (
                      <tr key={ms.key} className="divide-x divide-slate-300 hover:bg-amber-50/40">
                        <td className="p-1.5 text-center font-mono-num">{toBengaliNumber(idx + 1)}</td>
                        <td className="p-1.5">{ms.district}</td>
                        <td className="p-1.5 font-medium">{ms.upazila}</td>
                        <td className="p-1.5 font-bold text-slate-950">{ms.mouza}</td>
                        <td className="p-1.5 text-center font-mono-num font-bold">{ms.jlNo}</td>
                        <td className="p-1.5 text-center font-semibold">{ms.surveys}</td>
                        <td className="p-1.5 text-center font-mono-num">{toBengaliNumber(ms.uniqueKhatians)}</td>
                        <td className="p-1.5 text-center font-mono-num">{toBengaliNumber(ms.uniqueDags)}</td>
                        <td className="p-1.5 text-center font-mono-num font-bold">{toBengaliNumber(ms.recordCount)}</td>
                        <td className="p-1.5 text-right font-mono-num font-semibold">
                          {formatAreaBengali(ms.totalAcre)}
                        </td>
                        <td className="p-1.5 text-center no-print">
                          <div className="flex items-center justify-center gap-1">
                            <button
                              onClick={() => handleDirectDownloadSingleMouzaPdf(mRecords, ms.mouza)}
                              disabled={isGeneratingPdf}
                              className="px-2 py-0.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded text-[10px] inline-flex items-center gap-1"
                              title="এই মৌজার PDF সরাসরি লোকাল ডিস্কে ডাউনলোড করুন"
                            >
                              <Download className="w-3 h-3" />
                              <span>.PDF সেভ</span>
                            </button>
                            <button
                              onClick={() => exportToExcel(mRecords, columns, `LR_Mouza_${ms.mouza}`)}
                              className="px-1.5 py-0.5 bg-slate-800 hover:bg-slate-700 text-emerald-300 font-bold rounded text-[10px] inline-flex items-center gap-0.5"
                              title="এই মৌজার Excel লোকাল ডিস্কে সেভ করুন"
                            >
                              <FileSpreadsheet className="w-2.5 h-2.5" />
                              <span>.XLSX</span>
                            </button>
                            <button
                              onClick={() => handlePrintSingleMouza(ms.upazila, ms.mouza)}
                              className="px-1.5 py-0.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded text-[10px] inline-flex items-center gap-0.5"
                            >
                              <Printer className="w-2.5 h-2.5" />
                              <span>প্রিন্ট</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Render Separate Dedicated Table For Each Mouza */}
          {Array.from(groupedData.entries()).map(([upazilaName, mouzaMap]) => (
            <div key={upazilaName} className="space-y-8">
              {!selectedUpazila && !selectedMouza && (
                <div className="bg-slate-800 text-white px-4 py-2 rounded font-bold text-sm flex items-center justify-between mt-4">
                  <span>উপজেলা / থানা: {upazilaName}</span>
                  <span className="text-xs font-normal text-slate-300">
                    অন্তর্ভুক্ত মৌজা: {toBengaliNumber(mouzaMap.size)} টি
                  </span>
                </div>
              )}

              {Array.from(mouzaMap.entries()).map(([mouzaKey, mouzaRecords], mouzaIdx) => {
                const sample = mouzaRecords[0] || ({} as LandRecord);
                const mouzaAcre = mouzaRecords.reduce(
                  (acc, r) => acc + parseAcreValue(r.area),
                  0
                );
                const mouzaKhatians = new Set(mouzaRecords.map((r) => r.khatianNo)).size;
                const mouzaDags = new Set(mouzaRecords.map((r) => r.dagNo)).size;

                // Survey counts in this Mouza
                const surveyBreakdown = mouzaRecords.reduce<Record<string, number>>((acc, r) => {
                  const st = r.surveyType || 'RS';
                  acc[st] = (acc[st] || 0) + 1;
                  return acc;
                }, {});

                // Land class breakdown in this Mouza
                const classBreakdown = mouzaRecords.reduce<Record<string, number>>((acc, r) => {
                  const lc = r.landClass || 'অন্যান্য';
                  acc[lc] = (acc[lc] || 0) + 1;
                  return acc;
                }, {});

                return (
                  <div
                    key={mouzaKey}
                    className="mouza-card border border-slate-400 rounded-sm p-4 print:p-0 print:border-none"
                  >
                    {/* Dedicated Mouza Header Box */}
                    <div className="bg-slate-100 border-2 border-slate-900 p-3 mb-2 rounded-t space-y-1.5">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="bg-slate-900 text-white font-bold px-2.5 py-0.5 rounded text-xs">
                            মৌজা টেবিল নং {toBengaliNumber(mouzaIdx + 1)}
                          </span>
                          <h2 className="text-base sm:text-lg font-bold text-slate-950">
                            মৌজা: {sample.mouza || 'অজ্ঞাত'} · জে.এল. নং: {toBengaliNumber(sample.jlNo || '—')}
                          </h2>
                        </div>

                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-xs font-semibold text-slate-800 bg-white px-2.5 py-0.5 rounded border border-slate-300">
                            উপজেলা: {sample.upazila} · জেলা: {sample.district}
                          </span>
                          <button
                            onClick={() =>
                              handleDirectDownloadSingleMouzaPdf(
                                mouzaRecords,
                                sample.mouza || 'Mouza'
                              )
                            }
                            disabled={isGeneratingPdf}
                            className="no-print px-2.5 py-1 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded text-xs flex items-center gap-1 shadow-sm"
                            title="এই মৌজার পৃথক টেবিল সরাসরি .PDF ফাইল হিসেবে লোকাল ডিস্কে সেভ করুন"
                          >
                            <Download className="w-3 h-3" />
                            <span>এই মৌজার .PDF ডাউনলোড</span>
                          </button>
                          <button
                            onClick={() =>
                              exportToExcel(
                                mouzaRecords,
                                columns,
                                `LR_Mouza_${sample.mouza || 'Export'}`
                              )
                            }
                            className="no-print px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-emerald-300 font-bold rounded text-xs flex items-center gap-1 shadow-sm"
                            title="এই মৌজার পৃথক টেবিল Excel (.xlsx) হিসেবে লোকাল ডিস্কে সেভ করুন"
                          >
                            <FileSpreadsheet className="w-3 h-3" />
                            <span>এই মৌজার .XLSX</span>
                          </button>
                          {!selectedMouza && (
                            <button
                              onClick={() => handlePrintSingleMouza(sample.upazila, sample.mouza)}
                              className="no-print px-2.5 py-1 bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold rounded text-xs flex items-center gap-1 shadow-sm"
                            >
                              <Printer className="w-3 h-3" />
                              <span>প্রিন্ট</span>
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Survey & Land Class Micro-Summary for the Mouza */}
                      <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-700 border-t border-slate-300 pt-1.5">
                        <div>
                          <span className="font-semibold">জরিপভিত্তিক বিভাজন: </span>
                          {Object.entries(surveyBreakdown)
                            .map(([k, v]) => `${k}: ${toBengaliNumber(v)} টি`)
                            .join(' · ')}
                        </div>
                        <div>
                          <span className="font-semibold">শ্রেণিভিত্তিক বিভাজন: </span>
                          {Object.entries(classBreakdown)
                            .map(([k, v]) => `${k} (${toBengaliNumber(v)})`)
                            .join(', ')}
                        </div>
                      </div>
                    </div>

                    {/* Mouza Data Table */}
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse border border-slate-900 text-xs">
                        <thead>
                          <tr className="bg-slate-200 text-slate-950 font-bold border-b-2 border-slate-900 divide-x divide-slate-400">
                            {visibleColumns.map((col) => (
                              <th
                                key={col.id}
                                className="p-1.5 text-center text-[11px] leading-tight"
                              >
                                {col.label}
                              </th>
                            ))}
                            <th className="p-1.5 text-center text-[11px] leading-tight no-print">
                              ডাউনলোড
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-300">
                          {mouzaRecords.map((rec, rIdx) => (
                            <tr
                              key={rec.id}
                              className="hover:bg-amber-50/50 divide-x divide-slate-300 leading-normal"
                            >
                              {visibleColumns.map((col) => {
                                if (col.id === 'slNo') {
                                  return (
                                    <td
                                      key={col.id}
                                      className="p-1.5 text-center font-mono-num text-[11px]"
                                    >
                                      {toBengaliNumber(rIdx + 1)}
                                    </td>
                                  );
                                }
                                if (col.id === 'mouza') {
                                  return (
                                    <td key={col.id} className="p-1.5 font-medium whitespace-nowrap">
                                      {rec.mouza}{' '}
                                      <span className="text-[10px] text-slate-600 font-mono-num">
                                        (JL {rec.jlNo})
                                      </span>
                                    </td>
                                  );
                                }
                                if (col.id === 'surveyType') {
                                  return (
                                    <td key={col.id} className="p-1.5 text-center font-semibold text-[11px]">
                                      {rec.surveyType}
                                    </td>
                                  );
                                }
                                if (col.id === 'khatianNo') {
                                  return (
                                    <td
                                      key={col.id}
                                      className="p-1.5 text-center font-mono-num font-bold text-slate-950"
                                    >
                                      {rec.khatianNo}
                                    </td>
                                  );
                                }
                                if (col.id === 'dagNo') {
                                  return (
                                    <td
                                      key={col.id}
                                      className="p-1.5 text-center font-mono-num font-bold text-slate-900"
                                    >
                                      {rec.dagNo}
                                    </td>
                                  );
                                }
                                if (col.id === 'ownerDetails') {
                                  return (
                                    <td key={col.id} className="p-1.5 leading-snug">
                                      {rec.ownerDetails}
                                    </td>
                                  );
                                }
                                if (col.id === 'share') {
                                  return (
                                    <td key={col.id} className="p-1.5 text-center font-mono-num">
                                      {rec.share}
                                    </td>
                                  );
                                }
                                if (col.id === 'landClass') {
                                  return (
                                    <td key={col.id} className="p-1.5 text-center font-medium">
                                      {rec.landClass}
                                    </td>
                                  );
                                }
                                if (col.id === 'area') {
                                  return (
                                    <td
                                      key={col.id}
                                      className="p-1.5 text-right font-mono-num font-semibold"
                                    >
                                      {rec.area}
                                    </td>
                                  );
                                }
                                if (col.id in rec.extraAttributes) {
                                  return (
                                    <td key={col.id} className="p-1.5 text-center font-mono-num">
                                      {rec.extraAttributes[col.id]}
                                    </td>
                                  );
                                }
                                return (
                                  <td key={col.id} className="p-1.5">
                                    {(rec as any)[col.id] || ''}
                                  </td>
                                );
                              })}
                              <td className="p-1.5 text-center no-print whitespace-nowrap">
                                <button
                                  onClick={() =>
                                    handleDirectDownloadSingleMouzaPdf(
                                      [rec],
                                      `${rec.mouza}_Kh_${rec.khatianNo}_Dag_${rec.dagNo}`
                                    )
                                  }
                                  disabled={isGeneratingPdf}
                                  className="px-2 py-0.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded text-[10px] inline-flex items-center gap-0.5"
                                  title="এই একক খতিয়ান ও দাগ রেকর্ডটি PDF হিসেবে লোকাল ডিস্কে ডাউনলোড করুন"
                                >
                                  <Download className="w-2.5 h-2.5" />
                                  <span>.PDF</span>
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>

                        {/* Mouza Table Footer Totals */}
                        <tfoot>
                          <tr className="bg-slate-100 text-slate-950 font-bold border-t-2 border-slate-900 divide-x divide-slate-400">
                            <td colSpan={visibleColumns.length + 1} className="p-2">
                              <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
                                <span>
                                  {sample.mouza} মৌজার মোট রেকর্ড: {toBengaliNumber(mouzaRecords.length)} টি
                                </span>
                                <span>
                                  অনন্য খতিয়ান: {toBengaliNumber(mouzaKhatians)} টি · অনন্য দাগ: {toBengaliNumber(mouzaDags)} টি
                                </span>
                                <span className="font-bold text-slate-950 text-sm">
                                  মৌজার সর্বমোট জমি: {formatAreaBengali(mouzaAcre)}
                                </span>
                              </div>
                            </td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>

                    {/* Official Signatures line after each Mouza */}
                    <div className="mt-6 pt-4 border-t border-slate-300 grid grid-cols-3 gap-4 text-center text-[11px] text-slate-700 print-avoid-break">
                      <div>
                        <div className="border-b border-dotted border-slate-400 w-36 mx-auto mb-1" />
                        <span className="font-semibold">সার্ভেয়ার / প্রস্তুতকারী</span>
                      </div>
                      <div>
                        <div className="border-b border-dotted border-slate-400 w-36 mx-auto mb-1" />
                        <span className="font-semibold">কানুনগো / যাচাইকারী</span>
                      </div>
                      <div>
                        <div className="border-b border-dotted border-slate-400 w-36 mx-auto mb-1" />
                        <span className="font-semibold">সহকারী কমিশনার (ভূমি)</span>
                      </div>
                    </div>

                    {pageBreakPerMouza && <div className="print-page-break my-4" />}
                  </div>
                );
              })}
            </div>
          ))}

          {/* Final Verification Note */}
          <div className="mt-8 pt-3 border-t-2 border-slate-900 text-xs text-slate-600 flex flex-wrap items-center justify-between gap-2">
            <span>মুদ্রণ তারিখ ও সময়: {new Date().toLocaleString('bn-BD')}</span>
            <span>
              LR Master Ledger & Inventory Studio · মৌজাভিত্তিক মাস্টার পিডিএফ ইঞ্জিন (১০০% রেকর্ড অন্তর্ভুক্ত)
            </span>
            <span>চূড়ান্ত ভেরিফায়েড কপি</span>
          </div>
        </div>
      </div>
    </div>
  );
};
