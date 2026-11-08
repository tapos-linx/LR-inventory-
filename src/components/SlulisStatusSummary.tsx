import React, { useState, useMemo } from 'react';
import {
  AlertTriangle,
  Scale,
  ShieldAlert,
  FileText,
  FileSpreadsheet,
  FolderArchive,
  Split,
  Layers,
  ArrowRight,
  CheckCircle2,
  TrendingDown,
  Info,
  Calendar,
  Building,
  UserCheck,
  Users,
  ChevronRight,
  ExternalLink,
  Loader2,
  Search,
  Filter,
} from 'lucide-react';
import { LandRecord } from '../types/landRecord';
import { toBengaliNumber } from '../utils/bengaliNumerals';
import {
  DAG_651_DISCREPANCY_ITEMS,
  Dag651DiscrepancyItem,
} from './Dag651DiscrepancyDetector';
import {
  COURT_READY_PLAINT_DATA,
  LITIGATION_APPENDICES,
  MISSING_LAND_DAG_651_REPORT,
  THIRD_PARTY_INTRUSION_MATRIX,
  FAMILY_DISCREPANCY_REGISTER,
} from '../utils/slulisEngine';

export interface SlulisStatusSummaryProps {
  records: LandRecord[];
  onNavigateToSlulis: (tab?: string) => void;
  onNavigateToForensic: (tab?: string) => void;
  onNavigateToSideBySide?: () => void;
  onDownloadMasterBundle?: () => void;
  isDownloadingMasterBundle?: boolean;
}

type SummarySubTab = 'anomalies651' | 'litigation' | 'appendices' | 'missing80';

export const SlulisStatusSummary: React.FC<SlulisStatusSummaryProps> = ({
  records,
  onNavigateToSlulis,
  onNavigateToForensic,
  onNavigateToSideBySide,
  onDownloadMasterBundle,
  isDownloadingMasterBundle = false,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<SummarySubTab>('anomalies651');
  const [anomalySearch, setAnomalySearch] = useState('');
  const [anomalySeverityFilter, setAnomalySeverityFilter] = useState<string>('ALL');

  // Metrics computation from Forensic Audit View & SLULIS Engine
  const metrics = useMemo(() => {
    // 1. Unresolved anomalies in Dag 651
    const totalAnomalies651 = DAG_651_DISCREPANCY_ITEMS.length;
    const criticalAnomalies651 = DAG_651_DISCREPANCY_ITEMS.filter(
      (a) => a.severity === 'CRITICAL'
    ).length;
    const highAnomalies651 = DAG_651_DISCREPANCY_ITEMS.filter(
      (a) => a.severity === 'HIGH'
    ).length;
    const mediumAnomalies651 = DAG_651_DISCREPANCY_ITEMS.filter(
      (a) => a.severity === 'MEDIUM'
    ).length;

    // 2. Missing area in Dag 651
    const missingDecimal651 = Math.abs(
      MISSING_LAND_DAG_651_REPORT.disputedAreaDecimal || 80
    );

    // 3. Active litigation drafts
    const plaintSectionsCount = COURT_READY_PLAINT_DATA.sections.length; // 27 sections
    const plaintSchedulesCount = COURT_READY_PLAINT_DATA.schedules?.length || 4; // 4 schedules
    const appendicesCount = LITIGATION_APPENDICES.length; // 14 appendices
    const totalActiveLitigationDrafts = 1 + plaintSchedulesCount + appendicesCount; // 1 Plaint + 4 Schedules + 14 Appendices = 19 active litigation items

    // 4. Third-party intrusions and family issues
    const thirdPartyIntrusionsCount = THIRD_PARTY_INTRUSION_MATRIX.length; // 8
    const familyDiscrepanciesCount = FAMILY_DISCREPANCY_REGISTER.length; // 12

    return {
      totalAnomalies651,
      criticalAnomalies651,
      highAnomalies651,
      mediumAnomalies651,
      missingDecimal651,
      plaintSectionsCount,
      plaintSchedulesCount,
      appendicesCount,
      totalActiveLitigationDrafts,
      thirdPartyIntrusionsCount,
      familyDiscrepanciesCount,
    };
  }, []);

  // Filtered anomalies for Tab 1
  const filteredAnomalies = useMemo(() => {
    return DAG_651_DISCREPANCY_ITEMS.filter((item) => {
      if (
        anomalySeverityFilter !== 'ALL' &&
        item.severity !== anomalySeverityFilter
      ) {
        return false;
      }
      if (anomalySearch) {
        const q = anomalySearch.toLowerCase();
        const matchesDesc =
          item.anomalyTypeBengali.toLowerCase().includes(q) ||
          item.rootCauseDescription.toLowerCase().includes(q) ||
          item.surveyStage.toLowerCase().includes(q) ||
          item.id.toLowerCase().includes(q);
        if (!matchesDesc) return false;
      }
      return true;
    });
  }, [anomalySearch, anomalySeverityFilter]);

  return (
    <section className="bg-gradient-to-r from-[#101726] via-[#141f36] to-[#0e1629] border-2 border-amber-500/40 rounded-2xl p-4 sm:p-5 shadow-2xl space-y-4 font-bengali">
      {/* Top Header & Status Badge */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800/80 pb-3.5">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-slate-950 font-black shadow-lg shadow-amber-950/50 shrink-0 ring-2 ring-amber-300/40">
            <Scale className="w-6 h-6 stroke-[2.5]" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-bold text-amber-300 bg-amber-950/80 border border-amber-500/40 px-2.5 py-0.5 rounded-full flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                <span>SLULIS Status Summary (স্ট্যাটাস সামারি ড্যাশবোর্ড)</span>
              </span>
              <span className="text-[11px] font-mono bg-red-950/70 text-red-300 border border-red-500/40 px-2 py-0.5 rounded">
                দাগ ৬৫১: ৮০ শতক উধাও জমি অডিট
              </span>
              <span className="text-[11px] font-mono bg-emerald-950/70 text-emerald-300 border border-emerald-500/40 px-2 py-0.5 rounded">
                আদালত-উপযোগী লিটিগেশন রেডি
              </span>
            </div>
            <h2 className="text-base sm:text-lg font-bold text-white mt-0.5">
              ফরেনসিক অডিট ও দেওয়ানি মোকদ্দমা স্ট্যাটাস ওভারভিউ (Forensic Metrics Dashboard)
            </h2>
            <p className="text-xs text-slate-300 max-w-4xl">
              গোয়ালী মৌজার দাগ ৬৫১-এর সিএস → এসএ → আরএস → বিআরএস জরিপভিত্তিক অমীমাংসিত গরমিল, নিখোঁজ ৮০ শতক জমির ফরেনসিক অডিট এবং বিজ্ঞ যুগ্ম জেলা জজ আদালতের সক্রিয় আরজি ও পরিশিষ্টের সমন্বিত পরিসংখ্যান।
            </p>
          </div>
        </div>

        {/* Global Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {onDownloadMasterBundle && (
            <button
              onClick={onDownloadMasterBundle}
              disabled={isDownloadingMasterBundle}
              className="px-3.5 py-2 rounded-lg bg-gradient-to-r from-amber-400 via-amber-300 to-yellow-400 hover:from-amber-300 hover:to-yellow-300 text-slate-950 font-bold text-xs shadow-md flex items-center gap-1.5 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-60"
              title="১-ক্লিকে সকল আরজি, পরিশিষ্ট, ১১-শিট এক্সেল ও ফরেনসিক অডিট রেজিস্টার জিপ ফাইল হিসেবে ডাউনলোড করুন"
            >
              {isDownloadingMasterBundle ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin text-slate-950" />
              ) : (
                <FolderArchive className="w-3.5 h-3.5 text-slate-950 stroke-[2.5]" />
              )}
              <span>১-ক্লিকে সকল নথি মাস্টার ডাউনলোড (.ZIP)</span>
            </button>
          )}

          <button
            onClick={() => onNavigateToSlulis('plaint')}
            className="px-3 py-2 rounded-lg bg-[#19243c] hover:bg-[#223150] border border-amber-500/40 text-amber-300 font-bold text-xs flex items-center gap-1.5 transition-all"
            title="কোর্ট-রেডি আরজি ও তফশিল ড্রাফট দেখুন"
          >
            <FileText className="w-3.5 h-3.5 text-amber-400" />
            <span>আরজি ও তফশিল ড্রাফট</span>
          </button>

          <button
            onClick={() => (onNavigateToSideBySide ? onNavigateToSideBySide() : onNavigateToSlulis('compare'))}
            className="px-3 py-2 rounded-lg bg-[#151f33] hover:bg-[#1d2b48] border border-slate-700 text-slate-200 font-semibold text-xs flex items-center gap-1.5 transition-all"
            title="দাগ ৬৫১ পাশাপাশি জরিপ তুলনা দেখুন"
          >
            <Split className="w-3.5 h-3.5 text-sky-400" />
            <span>জরিপ তুলনা (Side-by-Side)</span>
          </button>
        </div>
      </div>

      {/* 4 Key Aggregated Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Card 1: Unresolved Anomalies in Dag 651 */}
        <div
          onClick={() => setActiveSubTab('anomalies651')}
          className={`cursor-pointer rounded-xl p-3.5 border transition-all shadow-md flex flex-col justify-between gap-3 ${
            activeSubTab === 'anomalies651'
              ? 'bg-[#1b1928] border-red-500/70 ring-1 ring-red-500/40'
              : 'bg-[#121828] border-red-500/30 hover:border-red-500/50'
          }`}
        >
          <div className="flex items-start justify-between gap-2">
            <div>
              <span className="text-[11px] font-bold text-red-300 uppercase tracking-wider flex items-center gap-1">
                <AlertTriangle className="w-3.5 h-3.5 text-red-400" />
                <span>দাগ ৬৫১ অমীমাংসিত অসঙ্গতি</span>
              </span>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-2xl sm:text-3xl font-black font-mono-num text-red-400">
                  {toBengaliNumber(metrics.totalAnomalies651)} টি
                </span>
                <span className="text-[10px] text-red-300/80 font-mono">
                  (অমীমাংসিত ঝুঁকি)
                </span>
              </div>
            </div>
            <div className="w-9 h-9 rounded-lg bg-red-500/15 border border-red-500/30 flex items-center justify-center text-red-400 shrink-0">
              <ShieldAlert className="w-5 h-5" />
            </div>
          </div>

          <div className="pt-2 border-t border-red-500/20 text-[11px] text-slate-300 space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-slate-400">মারাত্মক (Critical):</span>
              <span className="font-bold text-red-400 font-mono-num">
                {toBengaliNumber(metrics.criticalAnomalies651)} টি
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400">উচ্চ ও মধ্যম (High/Med):</span>
              <span className="font-bold text-amber-300 font-mono-num">
                {toBengaliNumber(metrics.highAnomalies651 + metrics.mediumAnomalies651)} টি
              </span>
            </div>
            <div className="text-[10px] text-red-400/90 font-medium pt-0.5 flex items-center gap-1">
              <span>• ৮০ শতক উধাও ও তৃতীয় পক্ষ বিআরএস অনুপ্রবেশ</span>
            </div>
          </div>
        </div>

        {/* Card 2: Active Litigation Drafts */}
        <div
          onClick={() => setActiveSubTab('litigation')}
          className={`cursor-pointer rounded-xl p-3.5 border transition-all shadow-md flex flex-col justify-between gap-3 ${
            activeSubTab === 'litigation'
              ? 'bg-[#182337] border-amber-500/70 ring-1 ring-amber-500/40'
              : 'bg-[#121828] border-amber-500/30 hover:border-amber-500/50'
          }`}
        >
          <div className="flex items-start justify-between gap-2">
            <div>
              <span className="text-[11px] font-bold text-amber-300 uppercase tracking-wider flex items-center gap-1">
                <Scale className="w-3.5 h-3.5 text-amber-400" />
                <span>সক্রিয় লিটিগেশন ড্রাফটস</span>
              </span>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-2xl sm:text-3xl font-black font-mono-num text-amber-300">
                  {toBengaliNumber(metrics.totalActiveLitigationDrafts)} টি
                </span>
                <span className="text-[10px] text-amber-200/80 font-mono">
                  (কোর্ট-রেডি)
                </span>
              </div>
            </div>
            <div className="w-9 h-9 rounded-lg bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
              <FileText className="w-5 h-5" />
            </div>
          </div>

          <div className="pt-2 border-t border-amber-500/20 text-[11px] text-slate-300 space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-slate-400">মূল দেওয়ানি আরজি:</span>
              <span className="font-bold text-white font-mono-num">
                ১টি ({toBengaliNumber(metrics.plaintSectionsCount)} দফা)
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400">আরজি তফশিল ও পরিশিষ্ট:</span>
              <span className="font-bold text-amber-300 font-mono-num">
                {toBengaliNumber(metrics.plaintSchedulesCount)} তফশিল + {toBengaliNumber(metrics.appendicesCount)} পরিশিষ্ট
              </span>
            </div>
            <div className="text-[10px] text-emerald-400 font-medium pt-0.5 flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0" />
              <span>যুগ্ম জেলা জজ ১ম আদালত, ব্রাহ্মণবাড়িয়া</span>
            </div>
          </div>
        </div>

        {/* Card 3: Missing Land Area Dag 651 */}
        <div
          onClick={() => setActiveSubTab('missing80')}
          className={`cursor-pointer rounded-xl p-3.5 border transition-all shadow-md flex flex-col justify-between gap-3 ${
            activeSubTab === 'missing80'
              ? 'bg-[#1b1c2b] border-purple-500/70 ring-1 ring-purple-500/40'
              : 'bg-[#121828] border-purple-500/30 hover:border-purple-500/50'
          }`}
        >
          <div className="flex items-start justify-between gap-2">
            <div>
              <span className="text-[11px] font-bold text-purple-300 uppercase tracking-wider flex items-center gap-1">
                <TrendingDown className="w-3.5 h-3.5 text-purple-400" />
                <span>দাগ ৬৫১ উধাও / অমীমাংসিত জমি</span>
              </span>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-2xl sm:text-3xl font-black font-mono-num text-purple-300">
                  -{toBengaliNumber(metrics.missingDecimal651)} শতক
                </span>
                <span className="text-[10px] text-purple-200/80 font-mono">
                  (০.৮০ একর)
                </span>
              </div>
            </div>
            <div className="w-9 h-9 rounded-lg bg-purple-500/15 border border-purple-500/30 flex items-center justify-center text-purple-400 shrink-0">
              <Layers className="w-5 h-5" />
            </div>
          </div>

          <div className="pt-2 border-t border-purple-500/20 text-[11px] text-slate-300 space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-slate-400">সিএস মূল আয়তন:</span>
              <span className="font-bold text-white font-mono-num">৩২০ শতক (৩.২০ একর)</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400">এসএ কর্তন ও বিআরএস দাগ:</span>
              <span className="font-bold text-purple-300 font-mono-num">
                বিআরএস ১৫৮৮ দাগে অনুপ্রবেশ
              </span>
            </div>
            <div className="text-[10px] text-purple-300 font-medium pt-0.5 flex items-center gap-1">
              <span>• বায়া দলিলহীন জাল খতিয়ান ৯০২ বাতিলযোগ্য</span>
            </div>
          </div>
        </div>

        {/* Card 4: Lineage & Intrusion Forensic Entities */}
        <div
          onClick={() => setActiveSubTab('appendices')}
          className={`cursor-pointer rounded-xl p-3.5 border transition-all shadow-md flex flex-col justify-between gap-3 ${
            activeSubTab === 'appendices'
              ? 'bg-[#15232b] border-teal-500/70 ring-1 ring-teal-500/40'
              : 'bg-[#121828] border-teal-500/30 hover:border-teal-500/50'
          }`}
        >
          <div className="flex items-start justify-between gap-2">
            <div>
              <span className="text-[11px] font-bold text-teal-300 uppercase tracking-wider flex items-center gap-1">
                <Users className="w-3.5 h-3.5 text-teal-400" />
                <span>বংশধারা ও অনুপ্রবেশকারী সত্ত্বা</span>
              </span>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-2xl sm:text-3xl font-black font-mono-num text-teal-300">
                  {toBengaliNumber(metrics.thirdPartyIntrusionsCount)} শ্রেণি
                </span>
                <span className="text-[10px] text-teal-200/80 font-mono">
                  (অনুপ্রবেশকারী)
                </span>
              </div>
            </div>
            <div className="w-9 h-9 rounded-lg bg-teal-500/15 border border-teal-500/30 flex items-center justify-center text-teal-400 shrink-0">
              <UserCheck className="w-5 h-5" />
            </div>
          </div>

          <div className="pt-2 border-t border-teal-500/20 text-[11px] text-slate-300 space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-slate-400">পারিবারিক নাম/বয়স গরমিল:</span>
              <span className="font-bold text-white font-mono-num">
                {toBengaliNumber(metrics.familyDiscrepanciesCount)} টি (সমাধানকৃত)
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400">ফারায়েজ বণ্টন প্রজন্ম:</span>
              <span className="font-bold text-teal-300 font-mono-num">৪ প্রজন্ম (সফর আলী)</span>
            </div>
            <div className="text-[10px] text-emerald-400 font-medium pt-0.5 flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0" />
              <span>৬টি ওয়ারিশ সনদ ও ৪৯ জন ওয়ারিশ ভেরিফাইড</span>
            </div>
          </div>
        </div>
      </div>

      {/* Sub-Tabs Selector inside the Summary Card */}
      <div className="flex items-center justify-between gap-2 border-b border-slate-800 pt-1 flex-wrap">
        <div className="flex items-center gap-1.5 flex-wrap">
          <button
            onClick={() => setActiveSubTab('anomalies651')}
            className={`px-3 py-1.5 rounded-t-lg text-xs font-bold flex items-center gap-1.5 border-t border-x transition-colors ${
              activeSubTab === 'anomalies651'
                ? 'bg-[#1b2234] text-red-300 border-red-500/50 border-b-transparent'
                : 'bg-transparent text-slate-400 border-transparent hover:text-slate-200'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5 text-red-400" />
            <span>১. দাগ ৬৫১ অমীমাংসিত অসঙ্গতি ({toBengaliNumber(metrics.totalAnomalies651)})</span>
          </button>

          <button
            onClick={() => setActiveSubTab('litigation')}
            className={`px-3 py-1.5 rounded-t-lg text-xs font-bold flex items-center gap-1.5 border-t border-x transition-colors ${
              activeSubTab === 'litigation'
                ? 'bg-[#1b2234] text-amber-300 border-amber-500/50 border-b-transparent'
                : 'bg-transparent text-slate-400 border-transparent hover:text-slate-200'
            }`}
          >
            <FileText className="w-3.5 h-3.5 text-amber-400" />
            <span>২. সক্রিয় দেওয়ানি আরজি ও তফশিল ({toBengaliNumber(metrics.plaintSectionsCount)} দফা)</span>
          </button>

          <button
            onClick={() => setActiveSubTab('appendices')}
            className={`px-3 py-1.5 rounded-t-lg text-xs font-bold flex items-center gap-1.5 border-t border-x transition-colors ${
              activeSubTab === 'appendices'
                ? 'bg-[#1b2234] text-teal-300 border-teal-500/50 border-b-transparent'
                : 'bg-transparent text-slate-400 border-transparent hover:text-slate-200'
            }`}
          >
            <Scale className="w-3.5 h-3.5 text-teal-400" />
            <span>৩. ১৪টি লিটিগেশন পরিশিষ্ট (Appendices)</span>
          </button>

          <button
            onClick={() => setActiveSubTab('missing80')}
            className={`px-3 py-1.5 rounded-t-lg text-xs font-bold flex items-center gap-1.5 border-t border-x transition-colors ${
              activeSubTab === 'missing80'
                ? 'bg-[#1b2234] text-purple-300 border-purple-500/50 border-b-transparent'
                : 'bg-transparent text-slate-400 border-transparent hover:text-slate-200'
            }`}
          >
            <TrendingDown className="w-3.5 h-3.5 text-purple-400" />
            <span>৪. ৮০ শতক নিখোঁজ জমির রূপান্তর চেইন</span>
          </button>
        </div>

        <div className="flex items-center gap-2 pb-1.5">
          <button
            onClick={() => onNavigateToForensic('detector')}
            className="text-[11px] font-bold text-amber-400 hover:text-amber-300 flex items-center gap-1 transition-colors"
          >
            <span>সম্পূর্ণ ফরেনসিক অডিট ভিউ খুলুন</span>
            <ExternalLink className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* Sub-Tab 1: Dag 651 Unresolved Anomalies Quick Register */}
      {activeSubTab === 'anomalies651' && (
        <div className="space-y-3 bg-[#0d1424] border border-red-500/30 rounded-xl p-3.5">
          <div className="flex flex-wrap items-center justify-between gap-2.5">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-white flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-red-400" />
                <span>দাগ ৬৫১ স্বয়ংক্রিয় অসঙ্গতি ও গরমিল ডিটেক্টর রেজিস্টার (Discrepancy Alerts)</span>
              </span>
              <span className="text-[10px] font-mono bg-red-950/80 text-red-300 border border-red-500/40 px-2 py-0.5 rounded">
                মোট {toBengaliNumber(filteredAnomalies.length)} টি প্রদর্শিত
              </span>
            </div>

            {/* Filters */}
            <div className="flex items-center gap-2 flex-wrap">
              <div className="flex items-center gap-1 bg-[#151f35] border border-slate-700 rounded-lg px-2 py-1 text-xs">
                <Search className="w-3 h-3 text-slate-400" />
                <input
                  type="text"
                  placeholder="অসঙ্গতি খুঁজুন..."
                  value={anomalySearch}
                  onChange={(e) => setAnomalySearch(e.target.value)}
                  className="bg-transparent text-white placeholder-slate-500 text-xs focus:outline-none w-28 sm:w-36"
                />
              </div>

              <select
                value={anomalySeverityFilter}
                onChange={(e) => setAnomalySeverityFilter(e.target.value)}
                className="bg-[#151f35] border border-slate-700 text-amber-300 text-xs rounded-lg px-2 py-1 focus:outline-none"
              >
                <option value="ALL">সকল মাত্রা (All)</option>
                <option value="CRITICAL">মারাত্মক (Critical)</option>
                <option value="HIGH">উচ্চ (High)</option>
                <option value="MEDIUM">মধ্যম (Medium)</option>
              </select>

              <button
                onClick={() => onNavigateToForensic('detector')}
                className="px-2.5 py-1 bg-red-500/20 hover:bg-red-500/30 border border-red-500/40 text-red-300 rounded text-xs font-bold flex items-center gap-1 transition-colors"
              >
                <span>পূর্ণ ডিটেক্টর টেবিল খুলুন</span>
                <ChevronRight className="w-3 h-3" />
              </button>
            </div>
          </div>

          {/* Anomalies List */}
          <div className="space-y-2">
            {filteredAnomalies.map((item) => (
              <div
                key={item.id}
                className="bg-[#10182b] border border-slate-800 hover:border-red-500/40 rounded-lg p-3 transition-colors"
              >
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800/80 pb-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono text-[11px] font-bold text-amber-300 bg-amber-950/70 border border-amber-500/30 px-1.5 py-0.5 rounded">
                      {item.id}
                    </span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                        item.severity === 'CRITICAL'
                          ? 'bg-red-950/80 text-red-300 border-red-500/50'
                          : item.severity === 'HIGH'
                          ? 'bg-amber-950/80 text-amber-300 border-amber-500/50'
                          : 'bg-blue-950/80 text-blue-300 border-blue-500/50'
                      }`}
                    >
                      {item.severity === 'CRITICAL'
                        ? 'মারাত্মক (Critical)'
                        : item.severity === 'HIGH'
                        ? 'উচ্চ ঝুঁকি (High)'
                        : 'মধ্যম (Medium)'}
                    </span>
                    <span className="text-xs font-bold text-white">
                      {item.anomalyTypeBengali}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-mono text-purple-300 bg-purple-950/60 border border-purple-500/30 px-2 py-0.5 rounded">
                      {item.surveyStage}
                    </span>
                    <span className="text-xs font-bold text-red-400 font-mono-num">
                      {item.areaDiscrepancyText}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-2 text-xs">
                  <div className="bg-[#0b101c] p-2.5 rounded border border-slate-800/80 space-y-1">
                    <div className="text-[11px] font-bold text-slate-400 flex items-center justify-between">
                      <span>পূর্ববর্তী জরিপ রেকর্ড ({item.earlierRecord.survey}):</span>
                      <span className="text-amber-400 font-mono-num">
                        {item.earlierRecord.areaText}
                      </span>
                    </div>
                    <div className="text-white font-semibold">
                      খতিয়ান {toBengaliNumber(item.earlierRecord.khatianNo)} | দাগ {toBengaliNumber(item.earlierRecord.dagNo)}
                    </div>
                    <div className="text-slate-300">
                      মালিক: {item.earlierRecord.owner} (পিতা: {item.earlierRecord.father})
                    </div>
                  </div>

                  <div className="bg-[#0b101c] p-2.5 rounded border border-slate-800/80 space-y-1">
                    <div className="text-[11px] font-bold text-slate-400 flex items-center justify-between">
                      <span>পরবর্তী জরিপ রেকর্ড ({item.laterRecord.survey}):</span>
                      <span className="text-red-400 font-mono-num">
                        {item.laterRecord.areaText}
                      </span>
                    </div>
                    <div className="text-white font-semibold">
                      খতিয়ান {toBengaliNumber(item.laterRecord.khatianNo)} | দাগ {toBengaliNumber(item.laterRecord.dagNo)}
                    </div>
                    <div className="text-slate-300">
                      রেকর্ডকৃত: {item.laterRecord.owner}
                    </div>
                  </div>
                </div>

                <div className="mt-2 text-xs text-slate-300 bg-[#090e1a] p-2 rounded border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <p className="text-[11px] text-slate-300">
                    <span className="font-bold text-amber-400">তদন্ত ফাইন্ডিং: </span>
                    {item.rootCauseDescription}
                  </p>
                  <button
                    onClick={() => onNavigateToSlulis('plaint')}
                    className="shrink-0 px-2.5 py-1 bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300 rounded text-[11px] font-bold flex items-center gap-1 self-start sm:self-auto"
                  >
                    <span>আরজিতে সংযুক্ত প্রতিকার</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Sub-Tab 2: Active Litigation Drafts & Schedules */}
      {activeSubTab === 'litigation' && (
        <div className="space-y-3 bg-[#0d1424] border border-amber-500/30 rounded-xl p-3.5">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800/80 pb-2.5">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-white flex items-center gap-1.5">
                  <Building className="w-4 h-4 text-amber-400" />
                  <span>{COURT_READY_PLAINT_DATA.courtName}</span>
                </span>
                <span className="text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/40 px-2 py-0.5 rounded font-mono">
                  {COURT_READY_PLAINT_DATA.suitTitle}
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-1">
                <span className="font-bold text-amber-400">মোকদ্দমার বিষয়বস্তু: </span>
                {COURT_READY_PLAINT_DATA.natureOfSuit}
              </p>
            </div>

            <button
              onClick={() => onNavigateToSlulis('plaint')}
              className="px-3 py-1.5 bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs rounded-lg flex items-center gap-1.5 shadow"
            >
              <span>সম্পূর্ণ আরজি স্টুডিও খুলুন</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* 4 Plaint Schedules Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {COURT_READY_PLAINT_DATA.schedules?.map((sched, idx) => (
              <div
                key={`${sched.scheduleName}_${idx}`}
                className="bg-[#10182b] border border-slate-800 hover:border-amber-500/40 rounded-lg p-3 space-y-1.5 text-xs"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-amber-300">{sched.scheduleName}</span>
                  <span className="font-mono text-[10px] text-slate-400 bg-slate-800 px-1.5 py-0.5 rounded">
                    দাগ: {sched.dagNo}
                  </span>
                </div>
                <div className="text-slate-300">
                  <span className="text-slate-400">জমির আয়তন: </span>
                  <span className="font-bold text-white font-mono-num">{sched.claimedArea || sched.totalArea}</span>
                  <span className="text-slate-400 ml-2">শ্রেণি: </span>
                  <span className="text-amber-200">{sched.landNature}</span>
                </div>
                <div className="text-[11px] text-slate-400">
                  <span className="text-slate-400">চৌহদ্দি: </span>
                  উত্তরে {sched.boundaries.north}, দক্ষিণে {sched.boundaries.south}, পূর্বে {sched.boundaries.east}, পশ্চিমে {sched.boundaries.west}
                </div>
                <div className="pt-1 border-t border-slate-800/80 text-[11px] text-amber-300/90 font-medium">
                  {sched.currentPossessionStatus}
                </div>
              </div>
            ))}
          </div>

          <div className="bg-[#0b101c] p-3 rounded-lg border border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="space-y-0.5">
              <span className="text-slate-400">মোকদ্দমা মূল্যায়ন ও অ্যাড-ভ্যালোরেম কোর্ট ফি:</span>
              <div className="font-bold text-white">
                মূল্যায়ন: ৪৫,০০,০০০/- টাকা | কোর্ট ফি: ৪৫,৫০০/- টাকা (Court Fees Act 1870 মোতাবেক সর্বোচ্চ সিলিং ৪৫,০০০/- + প্রসেস ফি)
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] bg-emerald-950/80 text-emerald-300 border border-emerald-500/40 px-2.5 py-1 rounded font-semibold flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>সত্যপাঠ ও ওকালতনামার খসড়া সংযুক্ত</span>
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Sub-Tab 3: 14 Litigation Appendices */}
      {activeSubTab === 'appendices' && (
        <div className="space-y-3 bg-[#0d1424] border border-teal-500/30 rounded-xl p-3.5">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800/80 pb-2">
            <div>
              <span className="text-xs font-bold text-white flex items-center gap-1.5">
                <Scale className="w-4 h-4 text-teal-400" />
                <span>দেওয়ানি কার্যবিধির আওতায় দাখিলযোগ্য ১৪টি লিটিগেশন পরিশিষ্ট (Litigation Appendices)</span>
              </span>
              <p className="text-xs text-slate-400">
                আদালতে সাক্ষ্যগ্রহণ, অন্তর্বর্তীকালীন নিষেধাজ্ঞা, অ্যাডভোকেট কমিশনার নিয়োগ এবং প্রদর্শনীর জন্য প্রস্তুতকৃত আইনি পরিশিষ্ট।
              </p>
            </div>

            <button
              onClick={() => onNavigateToSlulis('appendices')}
              className="px-3 py-1.5 bg-teal-500/20 hover:bg-teal-500/30 border border-teal-500/40 text-teal-300 font-bold text-xs rounded-lg flex items-center gap-1"
            >
              <span>সকল পরিশিষ্ট স্টুডিওতে দেখুন</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
            {LITIGATION_APPENDICES.slice(0, 6).map((app) => (
              <div
                key={app.appendixId}
                className="bg-[#10182b] border border-slate-800 hover:border-teal-500/40 rounded-lg p-2.5 space-y-1 text-xs"
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[10px] font-bold text-teal-300 bg-teal-950/80 border border-teal-500/30 px-1.5 py-0.2 rounded">
                    {app.appendixId}
                  </span>
                  <span className="text-[10px] text-slate-400 truncate max-w-[120px]">
                    {app.statutoryReference}
                  </span>
                </div>
                <h4 className="font-bold text-white text-xs">{app.bengaliTitle}</h4>
                <p className="text-[11px] text-slate-400 line-clamp-2">{app.purpose}</p>
              </div>
            ))}
          </div>

          <div className="text-center pt-1">
            <button
              onClick={() => onNavigateToSlulis('appendices')}
              className="text-xs font-bold text-teal-400 hover:text-teal-300 flex items-center justify-center gap-1 mx-auto"
            >
              <span>+ অবশিষ্ট ৮টি পরিশিষ্ট দেখুন (Exhibits, Witnesses, Commissioner Requisition...)</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Sub-Tab 4: Missing 80 Decimals Flow */}
      {activeSubTab === 'missing80' && (
        <div className="space-y-3 bg-[#0d1424] border border-purple-500/30 rounded-xl p-3.5 text-xs">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800/80 pb-2">
            <div>
              <span className="text-xs font-bold text-white flex items-center gap-1.5">
                <TrendingDown className="w-4 h-4 text-purple-400" />
                <span>দাগ ৬৫১: ৮০ শতক নিখোঁজ জমির ঐতিহাসিক রূপান্তর ও উধাও হওয়ার ধাপসমূহ</span>
              </span>
              <p className="text-xs text-slate-400">
                সিএস ১৯১৫ হতে বিআরএস চলতি জরিপ পর্যন্ত রেকর্ডীয় কর্তন ও অনুপ্রবেশের স্তরভিত্তিক অডিট।
              </p>
            </div>

            <button
              onClick={() => onNavigateToSlulis('dag651')}
              className="px-3 py-1.5 bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/40 text-purple-300 font-bold text-xs rounded-lg flex items-center gap-1"
            >
              <span>৮০ শতক ফরেনসিক রিপোর্ট খুলুন</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Sequential Survey Flow Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
            {/* Step 1: CS */}
            <div className="bg-[#11182c] border border-slate-800 p-2.5 rounded-lg space-y-1">
              <div className="flex items-center justify-between text-[11px] font-bold text-slate-400">
                <span>১. সিএস জরিপ (১৯১৫)</span>
                <span className="text-emerald-400">স্বত্ব নিরঙ্কুশ</span>
              </div>
              <div className="text-white font-bold">সিএস দাগ ৬৫১ · খতিয়ান ১১৮</div>
              <div className="text-emerald-300 font-bold font-mono-num">৩২০ শতক (৩.২০ একর)</div>
              <p className="text-[11px] text-slate-400">মালিক: সফর আলী (১৬ আনা একক স্বত্ব)</p>
            </div>

            {/* Step 2: SA */}
            <div className="bg-[#19192c] border border-amber-500/30 p-2.5 rounded-lg space-y-1">
              <div className="flex items-center justify-between text-[11px] font-bold text-slate-400">
                <span>২. এসএ জরিপ (১৯৬২)</span>
                <span className="text-amber-400">-৮০ শতক কর্তন</span>
              </div>
              <div className="text-white font-bold">এসএ দাগ ৬৫১ · খতিয়ান ২৪৫</div>
              <div className="text-amber-300 font-bold font-mono-num">২৪০ শতক (-৮০ শতক ড্রপ)</div>
              <p className="text-[11px] text-slate-400">মালিক: সিরাজ আলী ও কামদার আলী (৮ আনা করে)</p>
            </div>

            {/* Step 3: RS */}
            <div className="bg-[#11182c] border border-slate-800 p-2.5 rounded-lg space-y-1">
              <div className="flex items-center justify-between text-[11px] font-bold text-slate-400">
                <span>৩. আরএস জরিপ (১৯৮৫)</span>
                <span className="text-slate-300">দাগ বিভাজন</span>
              </div>
              <div className="text-white font-bold">আরএস দাগ ১১২৪ · খতিয়ান ৫১০</div>
              <div className="text-white font-bold font-mono-num">১২০ শতক (সিরাজ আলীর অর্ধাংশ)</div>
              <p className="text-[11px] text-slate-400">মালিক: ফিরুজ মিয়া গং (সিরাজ আলীর ওয়ারিশ)</p>
            </div>

            {/* Step 4: BRS */}
            <div className="bg-[#24131e] border border-red-500/40 p-2.5 rounded-lg space-y-1">
              <div className="flex items-center justify-between text-[11px] font-bold text-red-300">
                <span>৪. বিআরএস জরিপ (চলতি)</span>
                <span className="text-red-400 font-bold">অবৈধ অনুপ্রবেশ!</span>
              </div>
              <div className="text-white font-bold">বিআরএস দাগ ১৫৮৮ · খতিয়ান ৯০২</div>
              <div className="text-red-400 font-bold font-mono-num">৮০ শতক অবৈধ জবরদখল</div>
              <p className="text-[11px] text-red-300">অনধিকার বিবাদী: সামসুল হক গং (বায়াহীন জাল রেকর্ড)</p>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
