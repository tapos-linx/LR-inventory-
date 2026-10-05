import React, { useState } from 'react';
import {
  Printer,
  ArrowLeft,
  Download,
  CheckCircle,
  Sparkles,
  Building2,
  MapPin,
  Layers,
  FileSpreadsheet,
} from 'lucide-react';
import { DynamicColumn, LandRecord } from '../types/landRecord';
import {
  formatAreaBengali,
  parseAcreValue,
  toBengaliNumber,
} from '../utils/bengaliNumerals';

interface PrintReportViewProps {
  records: LandRecord[];
  columns: DynamicColumn[];
  onBack: () => void;
  initialSelectedUpazila?: string;
}

export const PrintReportView: React.FC<PrintReportViewProps> = ({
  records,
  columns,
  onBack,
  initialSelectedUpazila = '',
}) => {
  const [selectedUpazila, setSelectedUpazila] = useState<string>(initialSelectedUpazila);

  const visibleColumns = columns.filter((c) => c.visible).sort((a, b) => a.order - b.order);

  // Available Upazilas in the dataset
  const availableUpazilas = Array.from(new Set(records.map((r) => r.upazila))).filter(Boolean);

  // Filter records based on selected Upazila
  const activeRecords = selectedUpazila
    ? records.filter((r) => r.upazila === selectedUpazila)
    : records;

  // Group records by Upazila -> Mouza so each Mouza gets its own separate table!
  const groupedData = new Map<string, Map<string, LandRecord[]>>();

  for (const rec of activeRecords) {
    const upz = rec.upazila || 'অন্যান্য উপজেলা';
    const mouzKey = `${rec.mouza || 'অন্যান্য মৌজা'}_(JL_${rec.jlNo || '০'})`;

    if (!groupedData.has(upz)) {
      groupedData.set(upz, new Map());
    }
    const upzMap = groupedData.get(upz)!;
    if (!upzMap.has(mouzKey)) {
      upzMap.set(mouzKey, []);
    }
    upzMap.get(mouzKey)!.push(rec);
  }

  // Grand totals across all active records
  const grandTotalRecords = activeRecords.length;
  const grandUniqueKhatians = new Set(activeRecords.map((r) => `${r.mouza}_${r.khatianNo}`)).size;
  const grandUniqueDags = new Set(activeRecords.map((r) => `${r.mouza}_${r.dagNo}`)).size;
  const grandTotalAcre = activeRecords.reduce((acc, r) => acc + parseAcreValue(r.area), 0);

  const handlePrint = () => {
    window.print();
  };

  // Download self-contained printable HTML report that can be opened or saved directly as PDF
  const handleDownloadHtmlReport = () => {
    const printContent = document.getElementById('printable-ledger-report')?.innerHTML;
    if (!printContent) return;

    const fullHtml = `<!DOCTYPE html>
<html lang="bn">
<head>
  <meta charset="UTF-8">
  <title>LR Master Ledger Report - ${selectedUpazila || 'All Upazilas'}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Hind+Siliguri:wght@400;500;600;700&family=JetBrains+Mono:wght@400;600&display=swap" rel="stylesheet">
  <style>
    @page { size: A4 landscape; margin: 8mm 10mm 10mm 10mm; }
    body { font-family: 'Hind Siliguri', sans-serif; background: #fff; color: #111827; margin: 0; padding: 20px; }
    table { width: 100%; border-collapse: collapse; font-size: 11px; margin-bottom: 25px; page-break-inside: avoid; }
    th, td { border: 1px solid #1e293b; padding: 5px 6px; }
    th { background: #f1f5f9; font-weight: 700; text-align: center; }
    .font-mono-num { font-family: 'JetBrains Mono', monospace; }
    .print-page-break { page-break-after: always; break-after: page; }
    .header-banner { border-bottom: 2px solid #0f172a; padding-bottom: 8px; margin-bottom: 14px; text-align: center; }
    .mouza-card { margin-bottom: 30px; }
  </style>
</head>
<body>
  ${printContent}
</body>
</html>`;

    const blob = new Blob([fullHtml], { type: 'text/html;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `LR_Ledger_${selectedUpazila || 'All_Upazilas'}_${new Date().toISOString().slice(0, 10)}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-[#070a12] text-slate-100 flex flex-col font-bengali">
      {/* Top Floating Action Bar (Hidden when printing) */}
      <div className="no-print sticky top-0 z-30 bg-[#0f1523]/95 backdrop-blur border-b border-amber-500/20 px-4 sm:px-8 py-3 flex flex-wrap items-center justify-between gap-3 shadow-xl">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-2 text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-700 rounded-lg transition-colors flex items-center gap-1.5 text-xs font-semibold"
          >
            <ArrowLeft className="w-4 h-4 text-amber-400" />
            <span>লেজারে ফিরে যান</span>
          </button>

          {/* Upazila Selector for Instant Scope Selection */}
          <div className="flex items-center gap-2 bg-[#151c2d] border border-amber-500/30 rounded-lg px-2.5 py-1">
            <Building2 className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span className="text-xs text-slate-400">উপজেলা নির্বাচন:</span>
            <select
              value={selectedUpazila}
              onChange={(e) => setSelectedUpazila(e.target.value)}
              className="bg-transparent text-amber-300 text-xs font-semibold focus:outline-none cursor-pointer"
            >
              <option value="" className="bg-[#121827] text-slate-200">
                সকল উপজেলা (সকল মৌজা পৃথক টেবিলে)
              </option>
              {availableUpazilas.map((u) => (
                <option key={u} value={u} className="bg-[#121827] text-slate-200">
                  {u} উপজেলা ({toBengaliNumber(records.filter((r) => r.upazila === u).length)} রেকর্ড)
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handleDownloadHtmlReport}
            className="p-2 sm:px-3 sm:py-2 text-xs font-medium text-slate-300 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors flex items-center gap-1.5"
            title="স্ট্যান্ডঅ্যালোন অফলাইন ফাইল হিসেবে ডাউনলোড"
          >
            <Download className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden sm:inline">HTML রিপোর্ট ফাইল</span>
          </button>

          <button
            onClick={handlePrint}
            className="px-4 py-2 text-xs sm:text-sm font-semibold text-slate-950 bg-gradient-to-r from-amber-400 via-amber-300 to-yellow-500 hover:from-amber-300 hover:to-yellow-400 active:scale-[0.98] rounded-lg shadow-lg shadow-amber-950/40 flex items-center gap-2 transition-all"
          >
            <Printer className="w-4 h-4 text-slate-950" />
            <span>প্রিন্ট / PDF ডাউনলোড (A4 Landscape)</span>
          </button>
        </div>
      </div>

      {/* Main Printable Document Sheet */}
      <div className="flex-1 max-w-[1550px] w-full mx-auto p-4 sm:p-8">
        <div
          id="printable-ledger-report"
          className="bg-white text-slate-900 shadow-2xl rounded-sm p-6 sm:p-10 font-bengali print:p-0 print:shadow-none print:m-0"
        >
          {/* Master Header Banner */}
          <div className="header-banner border-b-2 border-slate-900 pb-4 mb-6 text-center">
            <div className="inline-block px-3 py-1 bg-slate-100 rounded text-xs font-semibold text-slate-700 mb-1 border border-slate-300">
              গণপ্রজাতন্ত্রী বাংলাদেশ সরকার — ভূমি রেকর্ড ও জরিপ অধিদপ্তর
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-950 tracking-tight">
              মাস্টার ল্যান্ড রেকর্ড লেজার ও মৌজাভিত্তিক খতিয়ান-দাগ রেজিস্টার
            </h1>
            <p className="text-sm font-medium text-slate-700 mt-0.5">
              {selectedUpazila
                ? `${selectedUpazila} উপজেলার মৌজাভিত্তিক সমন্বিত রেকর্ড তালিকা`
                : 'সকল উপজেলার সমন্বিত মাস্টার রেকর্ড তালিকা (মৌজাভিত্তিক পৃথক রেজিস্টার)'}
            </p>

            {/* Scope Summary Statistics Block */}
            <div className="mt-4 bg-slate-50 border border-slate-300 rounded p-3 text-xs text-left grid grid-cols-2 sm:grid-cols-4 gap-2">
              <div>
                <span className="text-slate-500">নির্বাচিত আওতা: </span>
                <span className="font-bold text-slate-900">
                  {selectedUpazila ? `${selectedUpazila} উপজেলা` : 'সমগ্র জেলা ও উপজেলা'}
                </span>
              </div>
              <div>
                <span className="text-slate-500">মোট অন্তর্ভুক্ত রেকর্ড: </span>
                <span className="font-bold text-slate-900 font-mono-num">
                  {toBengaliNumber(grandTotalRecords)} টি (কোনো রেকর্ড বাদ নেই)
                </span>
              </div>
              <div>
                <span className="text-slate-500">অনন্য খতিয়ান ও দাগ: </span>
                <span className="font-bold text-slate-900 font-mono-num">
                  {toBengaliNumber(grandUniqueKhatians)} খতিয়ান / {toBengaliNumber(grandUniqueDags)} দাগ
                </span>
              </div>
              <div>
                <span className="text-slate-500">সর্বমোট জমির পরিমাণ: </span>
                <span className="font-bold text-slate-950 font-mono-num">
                  {formatAreaBengali(grandTotalAcre)}
                </span>
              </div>
            </div>
          </div>

          {/* Iterate Over Upazilas and Render Separate Table For EACH Mouza */}
          {Array.from(groupedData.entries()).map(([upazilaName, mouzaMap], upzIdx) => (
            <div key={upazilaName} className="space-y-8">
              {/* Upazila Title Bar (if all upazilas view) */}
              {!selectedUpazila && (
                <div className="bg-slate-800 text-white px-4 py-2 rounded font-bold text-sm flex items-center justify-between mt-6">
                  <span>উপজেলা: {upazilaName}</span>
                  <span className="text-xs font-normal text-slate-300">
                    মৌজা সংখ্যা: {toBengaliNumber(mouzaMap.size)} টি
                  </span>
                </div>
              )}

              {/* Each Mouza gets its own dedicated table! */}
              {Array.from(mouzaMap.entries()).map(([mouzaKey, mouzaRecords], mouzaIdx) => {
                const sample = mouzaRecords[0] || {};
                const mouzaAcre = mouzaRecords.reduce(
                  (acc, r) => acc + parseAcreValue(r.area),
                  0
                );
                const mouzaKhatians = new Set(mouzaRecords.map((r) => r.khatianNo)).size;
                const mouzaDags = new Set(mouzaRecords.map((r) => r.dagNo)).size;
                const surveyTypes = Array.from(new Set(mouzaRecords.map((r) => r.surveyType))).join(', ');

                return (
                  <div
                    key={mouzaKey}
                    className="mouza-card border border-slate-400 rounded-sm p-4 print:p-0 print:border-none print-avoid-break"
                  >
                    {/* Mouza Section Header Banner */}
                    <div className="bg-slate-100 border border-slate-400 p-2.5 mb-2 rounded-t flex flex-wrap items-center justify-between gap-2 text-xs">
                      <div className="flex items-center gap-2">
                        <span className="bg-slate-900 text-white font-bold px-2 py-0.5 rounded text-[11px]">
                          টেবিল নং {toBengaliNumber(mouzaIdx + 1)}
                        </span>
                        <span className="text-sm font-bold text-slate-950">
                          মৌজা: {sample.mouza || 'অজ্ঞাত'} (জে.এল. নং: {sample.jlNo || '—'})
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-slate-700">
                        <span>জেলা: <strong className="text-slate-950">{sample.district}</strong></span>
                        <span>উপজেলা: <strong className="text-slate-950">{sample.upazila}</strong></span>
                        <span>জরিপের ধরণ: <strong className="text-slate-950">{surveyTypes || 'RS'}</strong></span>
                      </div>
                    </div>

                    {/* Mouza Table with All Columns */}
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse border border-slate-900 text-xs">
                        <thead>
                          <tr className="bg-slate-200 text-slate-950 font-bold border-b border-slate-900 divide-x divide-slate-400">
                            {visibleColumns.map((col) => (
                              <th
                                key={col.id}
                                className="p-1.5 text-center text-[11px] leading-tight"
                              >
                                {col.label}
                              </th>
                            ))}
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
                                      className="p-1 text-center font-mono-num text-[11px]"
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
                            </tr>
                          ))}
                        </tbody>

                        {/* Separate Mouza Footer Totals */}
                        <tfoot>
                          <tr className="bg-slate-100 text-slate-950 font-bold border-t border-slate-800 divide-x divide-slate-400">
                            <td colSpan={visibleColumns.length} className="p-2">
                              <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
                                <span>
                                  মৌজার মোট রেকর্ড: {toBengaliNumber(mouzaRecords.length)} টি
                                </span>
                                <span>
                                  খতিয়ান: {toBengaliNumber(mouzaKhatians)} টি · দাগ: {toBengaliNumber(mouzaDags)} টি
                                </span>
                                <span className="font-bold text-slate-950">
                                  মৌজার মোট জমির পরিমাণ: {formatAreaBengali(mouzaAcre)}
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
                        <div className="border-b border-dotted border-slate-400 w-32 mx-auto mb-1" />
                        <span className="font-semibold">সার্ভেয়ার</span>
                      </div>
                      <div>
                        <div className="border-b border-dotted border-slate-400 w-32 mx-auto mb-1" />
                        <span className="font-semibold">কানুনগো</span>
                      </div>
                      <div>
                        <div className="border-b border-dotted border-slate-400 w-32 mx-auto mb-1" />
                        <span className="font-semibold">সহকারী কমিশনার (ভূমি)</span>
                      </div>
                    </div>

                    {/* Page break after each Mouza so each Mouza is neatly separated */}
                    <div className="print-page-break my-4" />
                  </div>
                );
              })}
            </div>
          ))}

          {/* Final Verification Note */}
          <div className="mt-8 pt-3 border-t-2 border-slate-900 text-xs text-slate-600 flex flex-wrap items-center justify-between gap-2">
            <span>মুদ্রণ তারিখ ও সময়: {new Date().toLocaleString('bn-BD')}</span>
            <span>
              LR Master Ledger & Inventory Studio · শতভাগ রেকর্ড অক্ষুণ্ণ রেখে প্রস্তুতকৃত
            </span>
            <span>পৃষ্ঠা সমাপন</span>
          </div>
        </div>
      </div>
    </div>
  );
};
