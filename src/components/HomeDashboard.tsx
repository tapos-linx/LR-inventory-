import React, { useCallback } from 'react';
import {
  UploadCloud,
  FolderArchive,
  Files,
  Table2,
  Fingerprint,
  FileDown,
  ArrowRight,
  CheckCircle2,
  Loader2,
  X,
  Scale,
  Users,
  SlidersHorizontal,
} from 'lucide-react';
import { LandRecord } from '../types/landRecord';
import { formatAreaBengali, toBengaliNumber } from '../utils/bengaliNumerals';
import { DAG_651_DISCREPANCY_ITEMS } from './Dag651DiscrepancyDetector';
import { COURT_READY_PLAINT_DATA, LITIGATION_APPENDICES } from '../utils/slulisEngine';
import { PROVIDED_WARISH_CERTIFICATES } from '../utils/inheritanceData';

interface HomeDashboardProps {
  records: LandRecord[];
  mouzaCount: number;
  totalKhatianCount: number;
  totalDagCount: number;
  totalAcreValue: number;
  onDirectUpload: (files: FileList | null) => void;
  onOpenIngestModal: () => void;
  onNavigateBrowse: () => void;
  onNavigateMatch: (initialTab?: 'inheritance' | 'forensic' | 'slulis') => void;
  onNavigateExport: () => void;
  isQuickUploading: boolean;
  quickUploadMsg: string | null;
  onClearQuickMsg: () => void;
}

export const HomeDashboard: React.FC<HomeDashboardProps> = ({
  records,
  mouzaCount,
  totalKhatianCount,
  totalDagCount,
  totalAcreValue,
  onDirectUpload,
  onOpenIngestModal,
  onNavigateBrowse,
  onNavigateMatch,
  onNavigateExport,
  isQuickUploading,
  quickUploadMsg,
  onClearQuickMsg,
}) => {
  const setFolderInputAttributes = useCallback((node: HTMLInputElement | null) => {
    if (node) {
      node.setAttribute('webkitdirectory', '');
      node.setAttribute('directory', '');
      node.setAttribute('mozdirectory', '');
      node.setAttribute('multiple', '');
    }
  }, []);

  const totalHeirsCount = PROVIDED_WARISH_CERTIFICATES.reduce(
    (sum, c) => sum + c.heirs.length,
    0
  );
  const unresolvedDag651Count = DAG_651_DISCREPANCY_ITEMS.filter(
    (d) => d.severity === 'CRITICAL' || d.severity === 'HIGH'
  ).length;
  const activeDraftCount =
    (COURT_READY_PLAINT_DATA.sections.length > 0 ? 1 : 0) +
    (COURT_READY_PLAINT_DATA.schedules?.length || 4) +
    LITIGATION_APPENDICES.length;

  return (
    <main className="flex-1 max-w-[1440px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6 font-bengali">
      {(isQuickUploading || quickUploadMsg) && (
        <div className="surface-3d-subtle px-4 py-3 flex items-center justify-between gap-3 border-[var(--border-accent)]">
          <div className="flex items-center gap-2.5 text-xs sm:text-sm font-semibold text-[var(--accent-emerald)]">
            {isQuickUploading ? (
              <Loader2 className="w-4 h-4 animate-spin text-[var(--accent-gold)] shrink-0" />
            ) : (
              <CheckCircle2 className="w-4 h-4 text-[var(--accent-emerald)] shrink-0" />
            )}
            <span>{quickUploadMsg}</span>
          </div>
          {!isQuickUploading && (
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={onNavigateExport}
                className="px-3 py-1 rounded-lg bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs cursor-pointer transition-colors"
              >
                এক্সপোর্ট সেন্টার →
              </button>
              <button
                type="button"
                onClick={onClearQuickMsg}
                className="p-1 text-[var(--text-muted)] hover:text-[var(--text-primary)] cursor-pointer"
                aria-label="বার্তা বন্ধ করুন"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      )}

      {/* Compact Unboxed 4-Metric Ledger Summary Strip */}
      <section className="surface-3d-subtle px-5 py-4">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 divide-y sm:divide-y-0 lg:divide-x divide-[var(--border-subtle)]">
          <div className="pt-1 sm:pt-0">
            <div className="text-[11px] font-medium text-[var(--text-muted)]">
              মোট খতিয়ান সংখ্যা
            </div>
            <div className="text-xl sm:text-2xl font-bold font-mono-num text-[var(--accent-gold)] mt-0.5">
              {toBengaliNumber(totalKhatianCount)}
            </div>
            <div className="text-[11px] text-[var(--text-secondary)]">
              {toBengaliNumber(records.length)} টি সারি · ১০০% সংরক্ষিত
            </div>
          </div>

          <div className="pt-2 sm:pt-0 lg:pl-6">
            <div className="text-[11px] font-medium text-[var(--text-muted)]">
              স্বতন্ত্র দাগ / প্লট
            </div>
            <div className="text-xl sm:text-2xl font-bold font-mono-num text-[var(--text-primary)] mt-0.5">
              {toBengaliNumber(totalDagCount)}
            </div>
            <div className="text-[11px] text-[var(--text-secondary)]">
              CS · SA · RS · BS/BRS শৃঙ্খল
            </div>
          </div>

          <div className="pt-2 sm:pt-0 lg:pl-6">
            <div className="text-[11px] font-medium text-[var(--text-muted)]">
              মোট জমির পরিমাণ
            </div>
            <div className="text-xl sm:text-2xl font-bold font-mono-num text-[var(--accent-emerald)] mt-0.5 truncate">
              {formatAreaBengali(totalAcreValue)}
            </div>
            <div className="text-[11px] text-[var(--text-secondary)] font-mono-num">
              {toBengaliNumber((totalAcreValue * 100).toFixed(1))} শতক সমতুল্য
            </div>
          </div>

          <div className="pt-2 sm:pt-0 lg:pl-6">
            <div className="text-[11px] font-medium text-[var(--text-muted)]">
              আর্কাইভ মৌজা ও বংশধারা
            </div>
            <div className="text-xl sm:text-2xl font-bold font-mono-num text-[var(--text-primary)] mt-0.5">
              {toBengaliNumber(mouzaCount)} টি মৌজা
            </div>
            <div className="text-[11px] text-[var(--text-secondary)]">
              সফর আলী বংশধারা · {toBengaliNumber(PROVIDED_WARISH_CERTIFICATES.length)}টি সনদ
            </div>
          </div>
        </div>
      </section>

      {/* 4-Pillar 3D Action Grid */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6">
        {/* Pillar 1: রেকর্ড আপলোড (Ingest) */}
        <article className="surface-3d surface-3d-interactive p-6 flex flex-col justify-between gap-5 relative overflow-hidden">
          <div className="space-y-3">
            <div className="flex items-start justify-between gap-4">
              <div className="w-13 h-13 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-slate-950 icon-3d shrink-0">
                <UploadCloud className="w-6 h-6 stroke-[2.2]" />
              </div>
              <button
                type="button"
                onClick={onOpenIngestModal}
                className="text-xs font-semibold text-[var(--text-muted)] hover:text-[var(--accent-gold)] flex items-center gap-1 transition-colors cursor-pointer"
              >
                <SlidersHorizontal className="w-3.5 h-3.5" />
                <span>অ্যাডভান্সড অপশন</span>
              </button>
            </div>

            <div>
              <div className="text-[11px] font-semibold uppercase tracking-wider text-[var(--accent-gold)]">
                পিলার ১ · আর্কাইভ ইনজেস্ট
              </div>
              <h2 className="text-lg sm:text-xl font-bold text-[var(--text-primary)] mt-0.5">
                রেকর্ড আপলোড (Ingest)
              </h2>
              <p className="text-xs sm:text-sm text-[var(--text-secondary)] mt-1 leading-relaxed">
                ফোল্ডার, সাব-ফোল্ডার, ফোন মেমোরি বা ZIP আর্কাইভ থেকে ০% রেকর্ড বাদে সরাসরি লোড করুন।
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-2.5 pt-2">
            <label className="flex-1 cursor-pointer btn-3d px-4 py-3 rounded-xl bg-gradient-to-r from-amber-400 via-amber-300 to-yellow-400 text-slate-950 font-bold text-xs sm:text-sm flex items-center justify-center gap-2 text-center">
              <FolderArchive className="w-4 h-4 stroke-[2.4] shrink-0" />
              <span>ফোল্ডার ও সাব-ফোল্ডার নির্বাচন</span>
              <input
                type="file"
                ref={setFolderInputAttributes}
                className="sr-only"
                onChange={(e) => {
                  onDirectUpload(e.target.files);
                  e.target.value = '';
                }}
              />
            </label>

            <label className="flex-1 cursor-pointer btn-3d px-4 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 font-bold text-xs sm:text-sm flex items-center justify-center gap-2 text-center">
              <Files className="w-4 h-4 stroke-[2.4] shrink-0" />
              <span>ফোন মেমোরি ফাইল/ZIP নির্বাচন</span>
              <input
                type="file"
                multiple
                className="sr-only"
                onChange={(e) => {
                  onDirectUpload(e.target.files);
                  e.target.value = '';
                }}
              />
            </label>
          </div>
        </article>

        {/* Pillar 2: মাস্টার লেজার দেখুন (Browse) */}
        <article className="surface-3d surface-3d-interactive p-6 flex flex-col justify-between gap-5">
          <div className="space-y-3">
            <div className="flex items-start justify-between gap-4">
              <div className="w-13 h-13 rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-600 flex items-center justify-center text-slate-950 icon-3d shrink-0">
                <Table2 className="w-6 h-6 stroke-[2.2]" />
              </div>
              <span className="text-xs font-mono-num text-[var(--text-muted)]">
                {toBengaliNumber(records.length)} সারি · {toBengaliNumber(mouzaCount)} মৌজা
              </span>
            </div>

            <div>
              <div className="text-[11px] font-semibold uppercase tracking-wider text-[var(--accent-emerald)]">
                পিলার ২ · লেজার ব্রাউজার
              </div>
              <h2 className="text-lg sm:text-xl font-bold text-[var(--text-primary)] mt-0.5">
                মাস্টার লেজার দেখুন (Browse)
              </h2>
              <p className="text-xs sm:text-sm text-[var(--text-secondary)] mt-1 leading-relaxed">
                জেলা-উপজেলা-মৌজা হায়ারার্কি ট্রি, ডায়নামিক কলাম ও ইনলাইন এডিটসহ সম্পূর্ণ খতিয়ান গ্রিড।
              </p>
            </div>
          </div>

          <div className="pt-2">
            <button
              type="button"
              onClick={onNavigateBrowse}
              className="w-full btn-3d px-5 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 font-bold text-sm flex items-center justify-between cursor-pointer"
            >
              <span>মাস্টার লেজার ও হায়ারার্কি খুলুন</span>
              <ArrowRight className="w-4 h-4 stroke-[2.5]" />
            </button>
          </div>
        </article>

        {/* Pillar 3: ওয়ারিশ ও ফরেনসিক ম্যাচিং (Match) */}
        <article className="surface-3d surface-3d-interactive p-6 flex flex-col justify-between gap-5">
          <div className="space-y-3">
            <div className="flex items-start justify-between gap-4">
              <div className="w-13 h-13 rounded-2xl bg-gradient-to-br from-teal-400 via-emerald-500 to-emerald-700 flex items-center justify-center text-slate-950 icon-3d shrink-0">
                <Fingerprint className="w-6 h-6 stroke-[2.2]" />
              </div>
              <span className="text-xs font-mono-num text-[var(--accent-gold)] font-semibold">
                দাগ ৬৫১: {toBengaliNumber(unresolvedDag651Count)} অসঙ্গতি · {toBengaliNumber(activeDraftCount)} ড্রাফট
              </span>
            </div>

            <div>
              <div className="text-[11px] font-semibold uppercase tracking-wider text-[var(--accent-emerald)]">
                পিলার ৩ · ম্যাচিং ও তদন্ত
              </div>
              <h2 className="text-lg sm:text-xl font-bold text-[var(--text-primary)] mt-0.5">
                ওয়ারিশ ও ফরেনসিক ম্যাচিং (Match)
              </h2>
              <p className="text-xs sm:text-sm text-[var(--text-secondary)] mt-1 leading-relaxed">
                {toBengaliNumber(PROVIDED_WARISH_CERTIFICATES.length)}টি ওয়ারিশ সনদ ({toBengaliNumber(totalHeirsCount)} জন), ১১-ধাপ ফরেনসিক অডিট এবং সফর আলী SLULIS মোকদ্দমা স্টুডিও।
              </p>
            </div>
          </div>

          <div className="space-y-2.5 pt-2">
            <button
              type="button"
              onClick={() => onNavigateMatch('inheritance')}
              className="w-full btn-3d px-5 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 font-bold text-sm flex items-center justify-between cursor-pointer"
            >
              <span>ম্যাচিং ও ফরেনসিক ওয়ার্কস্পেস খুলুন</span>
              <ArrowRight className="w-4 h-4 stroke-[2.5]" />
            </button>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-[var(--text-muted)] px-1">
              <button
                type="button"
                onClick={() => onNavigateMatch('inheritance')}
                className="hover:text-[var(--accent-emerald)] flex items-center gap-1 cursor-pointer transition-colors"
              >
                <Users className="w-3.5 h-3.5" />
                <span>ওয়ারিশ তালিকা</span>
              </button>
              <span aria-hidden="true">·</span>
              <button
                type="button"
                onClick={() => onNavigateMatch('forensic')}
                className="hover:text-[var(--accent-emerald)] flex items-center gap-1 cursor-pointer transition-colors"
              >
                <Fingerprint className="w-3.5 h-3.5" />
                <span>১১-ধাপ ফরেনসিক অডিট</span>
              </button>
              <span aria-hidden="true">·</span>
              <button
                type="button"
                onClick={() => onNavigateMatch('slulis')}
                className="hover:text-[var(--accent-gold)] flex items-center gap-1 cursor-pointer transition-colors font-semibold"
              >
                <Scale className="w-3.5 h-3.5" />
                <span>SLULIS দাগ ৬৫১ ও মোকদ্দমা</span>
              </button>
            </div>
          </div>
        </article>

        {/* Pillar 4: রিপোর্ট ও এক্সপোর্ট (Export Center) */}
        <article className="surface-3d surface-3d-interactive p-6 flex flex-col justify-between gap-5">
          <div className="space-y-3">
            <div className="flex items-start justify-between gap-4">
              <div className="w-13 h-13 rounded-2xl bg-gradient-to-br from-amber-300 via-amber-400 to-yellow-500 flex items-center justify-center text-slate-950 icon-3d shrink-0">
                <FileDown className="w-6 h-6 stroke-[2.2]" />
              </div>
              <span className="text-xs text-[var(--text-muted)]">
                ১-ক্লিক ডাউনলোড
              </span>
            </div>

            <div>
              <div className="text-[11px] font-semibold uppercase tracking-wider text-[var(--accent-gold)]">
                পিলার ৪ · একীভূত এক্সপোর্ট সেন্টার
              </div>
              <h2 className="text-lg sm:text-xl font-bold text-[var(--text-primary)] mt-0.5">
                রিপোর্ট ও এক্সপোর্ট (Export Center)
              </h2>
              <p className="text-xs sm:text-sm text-[var(--text-secondary)] mt-1 leading-relaxed">
                ওয়ারিশ PDF, মৌজাভিত্তিক মাস্টার লেজার, ফরেনসিক রিপোর্ট ১–১০ ও SLULIS মাস্টার জিপ এক জায়গা থেকে ১-ক্লিকে ডাউনলোড করুন।
              </p>
            </div>
          </div>

          <div className="pt-2">
            <button
              type="button"
              onClick={onNavigateExport}
              className="w-full btn-3d px-5 py-3 rounded-xl bg-gradient-to-r from-amber-400 via-amber-300 to-yellow-400 text-slate-950 font-bold text-sm flex items-center justify-between cursor-pointer"
            >
              <span>এক্সপোর্ট সেন্টার খুলুন (PDF · Excel · ZIP)</span>
              <ArrowRight className="w-4 h-4 stroke-[2.5]" />
            </button>
          </div>
        </article>
      </section>
    </main>
  );
};
