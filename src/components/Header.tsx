import React, { useState } from 'react';
import {
  FileSpreadsheet,
  Printer,
  UploadCloud,
  SlidersHorizontal,
  Plus,
  RefreshCw,
  Layers,
  Sparkles,
  Smartphone,
  ChevronDown,
  Building2,
  Download,
} from 'lucide-react';
import { toBengaliNumber } from '../utils/bengaliNumerals';

interface HeaderProps {
  totalRecords: number;
  filteredCount: number;
  selectedCount: number;
  activeView: 'ledger' | 'print' | 'tree';
  setActiveView: (view: 'ledger' | 'print' | 'tree') => void;
  onOpenIngest: () => void;
  onOpenColumnCustomizer: () => void;
  onExportExcel: () => void;
  onExportCSV: () => void;
  onAddNewRecord: () => void;
  onResetToSample: () => void;
  onOpenApkModal: () => void;
  onQuickPdfDownload: (upazila?: string) => void;
  availableUpazilas: string[];
}

export const Header: React.FC<HeaderProps> = ({
  totalRecords,
  filteredCount,
  selectedCount,
  activeView,
  setActiveView,
  onOpenIngest,
  onOpenColumnCustomizer,
  onExportExcel,
  onAddNewRecord,
  onResetToSample,
  onOpenApkModal,
  onQuickPdfDownload,
  availableUpazilas,
}) => {
  const [showPdfMenu, setShowPdfMenu] = useState(false);

  return (
    <header className="sticky top-0 z-40 bg-[#0c111e]/95 backdrop-blur border-b border-amber-500/20 px-3 sm:px-6 lg:px-8 py-3 transition-colors">
      <div className="max-w-[1720px] mx-auto flex items-center justify-between gap-3">
        {/* Zone 1: Wordmark / Brand Title */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-amber-400 via-amber-500 to-amber-700 flex items-center justify-center shadow-md shadow-amber-950/60 ring-1 ring-amber-300/40 shrink-0">
            <Layers className="w-5 h-5 text-slate-950" />
          </div>
          <div className="flex flex-col">
            <div className="text-base sm:text-lg font-bold tracking-tight text-white flex items-center gap-2">
              <span className="font-bengali">ভূমি রেকর্ড মাস্টার লেজার</span>
              <span className="text-amber-400 font-normal hidden lg:inline text-xs font-sans tracking-wider border border-amber-500/30 px-2 py-0.5 rounded bg-amber-500/10">
                LR Master Ledger Studio
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-slate-400 font-bengali">
              <span>মোট রেকর্ড: {toBengaliNumber(totalRecords)} টি</span>
              <span aria-hidden="true" className="text-amber-500/50">·</span>
              <span>প্রদর্শিত: {toBengaliNumber(filteredCount)} টি</span>
              {selectedCount > 0 && (
                <>
                  <span aria-hidden="true" className="text-amber-500/50">·</span>
                  <span className="text-amber-300 font-medium">নির্বাচিত: {toBengaliNumber(selectedCount)} টি</span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Zone 2: Navigation / Workspace View Tabs (Single-line controls) */}
        <nav className="hidden xl:flex items-center gap-1 p-1 bg-[#141b2c] border border-amber-500/20 rounded-lg">
          <button
            onClick={() => setActiveView('ledger')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all whitespace-nowrap font-bengali ${
              activeView === 'ledger'
                ? 'bg-amber-500/20 text-amber-200 border border-amber-500/40 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            মাস্টার লেজার গ্রিড
          </button>
          <button
            onClick={() => setActiveView('tree')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all whitespace-nowrap font-bengali ${
              activeView === 'tree'
                ? 'bg-amber-500/20 text-amber-200 border border-amber-500/40 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            হায়ারার্কি ও ফাইল ট্রি
          </button>
          <button
            onClick={() => setActiveView('print')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all whitespace-nowrap font-bengali ${
              activeView === 'print'
                ? 'bg-amber-500/20 text-amber-200 border border-amber-500/40 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            উপজেলা ও মৌজাভিত্তিক A4 PDF রিপোর্ট
          </button>
        </nav>

        {/* Zone 3: Primary Actions with High-Visibility Buttons */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* APK Download Button */}
          <button
            onClick={onOpenApkModal}
            title="অ্যান্ড্রয়েড মোবাইল APK ডাউনলোড"
            className="p-2 sm:px-3 sm:py-2 text-xs font-medium text-amber-300 bg-amber-950/40 hover:bg-amber-950/70 border border-amber-500/40 rounded-lg transition-colors flex items-center gap-1.5 whitespace-nowrap font-bengali"
          >
            <Smartphone className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden sm:inline">APK ডাউনলোড</span>
          </button>

          {/* Quick PDF Report Trigger with Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowPdfMenu(!showPdfMenu)}
              className="p-2 sm:px-3 sm:py-2 text-xs font-semibold text-amber-950 bg-gradient-to-r from-amber-400 via-amber-300 to-yellow-400 hover:from-amber-300 hover:to-yellow-300 rounded-lg shadow-md shadow-amber-950/30 transition-all flex items-center gap-1.5 whitespace-nowrap font-bengali"
            >
              <Printer className="w-3.5 h-3.5 text-slate-950 stroke-[2.5]" />
              <span className="hidden md:inline">মৌজাভিত্তিক PDF ডাউনলোড</span>
              <span className="md:hidden">PDF</span>
              <ChevronDown className="w-3 h-3 text-slate-950" />
            </button>

            {showPdfMenu && (
              <div
                className="absolute right-0 mt-2 w-64 bg-[#141b2c] border border-amber-500/30 rounded-xl shadow-2xl py-2 z-50 font-bengali text-xs"
                onMouseLeave={() => setShowPdfMenu(false)}
              >
                <div className="px-3 py-1.5 text-[11px] font-semibold text-slate-400 border-b border-slate-800">
                  উপজেলা অনুযায়ী মৌজাভিত্তিক PDF ডাউনলোড:
                </div>
                <button
                  onClick={() => {
                    onQuickPdfDownload('');
                    setShowPdfMenu(false);
                  }}
                  className="w-full text-left px-3 py-2 text-slate-200 hover:bg-amber-500/20 hover:text-amber-300 flex items-center justify-between transition-colors"
                >
                  <span className="font-semibold">সকল উপজেলা (পৃথক মৌজা টেবিল)</span>
                  <Download className="w-3.5 h-3.5 text-amber-400" />
                </button>
                {availableUpazilas.map((u) => (
                  <button
                    key={u}
                    onClick={() => {
                      onQuickPdfDownload(u);
                      setShowPdfMenu(false);
                    }}
                    className="w-full text-left px-3 py-1.5 text-slate-300 hover:bg-slate-800/80 hover:text-white flex items-center justify-between transition-colors"
                  >
                    <span>{u} উপজেলা</span>
                    <Download className="w-3 h-3 text-slate-400" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Excel Export */}
          <button
            onClick={onExportExcel}
            title="এক্সেল এক্সপোর্ট (.xlsx)"
            className="p-2 sm:px-2.5 sm:py-2 text-xs font-medium text-emerald-300 bg-emerald-950/30 hover:bg-emerald-950/50 border border-emerald-500/30 rounded-lg transition-colors flex items-center gap-1.5 whitespace-nowrap font-bengali"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
            <span className="hidden xl:inline">এক্সেল</span>
          </button>

          {/* Ingest Archive Button */}
          <button
            onClick={onOpenIngest}
            className="px-3 sm:px-3.5 py-2 text-xs sm:text-xs font-semibold text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 hover:border-amber-400/50 rounded-lg transition-all flex items-center gap-1.5 whitespace-nowrap font-bengali"
          >
            <UploadCloud className="w-4 h-4 text-amber-400" />
            <span className="hidden sm:inline">আর্কাইভ আপলোড</span>
          </button>
        </div>
      </div>
    </header>
  );
};
