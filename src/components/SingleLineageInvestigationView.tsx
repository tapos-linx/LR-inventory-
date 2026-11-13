import React, { useState } from 'react';
import * as XLSX from 'xlsx';
import {
  Scale,
  ShieldAlert,
  FileText,
  FileSpreadsheet,
  Download,
  Users,
  AlertTriangle,
  CheckCircle2,
  GitBranch,
  Layers,
  MapPin,
  HelpCircle,
  Clock,
  Briefcase,
  Search,
  ExternalLink,
  ChevronRight,
  BookOpen,
  FolderDown,
  Printer,
  Home,
  CheckSquare,
  Split,
  FolderArchive,
  Archive,
  Sparkles,
  Loader2,
  FileCheck2,
} from 'lucide-react';
import {
  SLULIS_METADATA,
  PENDING_FAMILY_IDENTITY_DATA,
  FAMILY_DISCREPANCY_REGISTER,
  MULTI_MOUZA_SURVEY_CHAIN_RECORDS,
  FARAID_INHERITANCE_EVENTS,
  THIRD_PARTY_INTRUSION_MATRIX,
  MISSING_LAND_DAG_651_REPORT,
  DEVILS_ADVOCATE_DEFENCES,
  COURT_READY_PLAINT_DATA,
  LITIGATION_APPENDICES,
} from '../utils/slulisEngine';
import { toBengaliNumber } from '../utils/bengaliNumerals';
import { downloadForensicReportTablePdf } from '../utils/pdfDownloadEngine';
import { exportToJSON } from '../utils/exportUtils';
import { LandRecord } from '../types/landRecord';
import { DagSideBySideComparisonView } from './DagSideBySideComparisonView';
import { downloadMasterSlulisPackage } from '../utils/slulisMasterBundleEngine';

interface SingleLineageInvestigationViewProps {
  records: LandRecord[];
  onBack: () => void;
  onNavigateToForensic?: (tab?: string) => void;
  initialTab?: SlulisTabId;
  embedded?: boolean;
}

export type SlulisTabId =
  | 'summary'
  | 'lineage'
  | 'survey'
  | 'compare'
  | 'dag651'
  | 'evidence'
  | 'faraid'
  | 'intrusion'
  | 'defences'
  | 'plaint'
  | 'appendices';

export const SingleLineageInvestigationView: React.FC<SingleLineageInvestigationViewProps> = ({
  records,
  onBack,
  onNavigateToForensic,
  initialTab = 'summary',
  embedded = false,
}) => {
  const [activeTab, setActiveTab] = useState<SlulisTabId>(initialTab);
  const [selectedDagFilter, setSelectedDagFilter] = useState<string>('all');
  const [selectedComparisonDag, setSelectedComparisonDag] = useState<string>('651');
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [selectedAppendixId, setSelectedAppendixId] = useState<string>(LITIGATION_APPENDICES[0].appendixId);

  // Master 1-Click All-Documents Download State
  const [isDownloadingMasterBundle, setIsDownloadingMasterBundle] = useState(false);
  const [masterBundleStatusMsg, setMasterBundleStatusMsg] = useState<string | null>(null);
  const [masterBundleProgress, setMasterBundleProgress] = useState<number>(0);
  const [showManifestList, setShowManifestList] = useState(false);

  // Master 1-Click Bundle Handler
  const handleDownloadMasterBundle = async () => {
    if (isDownloadingMasterBundle) return;
    setIsDownloadingMasterBundle(true);
    setMasterBundleProgress(5);
    setMasterBundleStatusMsg('মাস্টার লিটিগেশন আর্কাইভ সংকলন শুরু হচ্ছে...');

    try {
      await downloadMasterSlulisPackage(records, (step, pct) => {
        setMasterBundleStatusMsg(step);
        setMasterBundleProgress(pct);
      });
      setTimeout(() => {
        setMasterBundleStatusMsg(null);
        setMasterBundleProgress(0);
      }, 7000);
    } catch (err: any) {
      setMasterBundleStatusMsg(`ডাউনলোড ত্রুটি: ${err.message || 'অজ্ঞাত ত্রুটি'}`);
    } finally {
      setIsDownloadingMasterBundle(false);
    }
  };

  // Helper for downloading any table or item as formatted PDF
  const handleDownloadItemPdf = async (
    title: string,
    subtitle: string,
    fieldMap: Record<string, string>,
    fileNamePrefix: string
  ) => {
    if (isExportingPdf) return;
    setIsExportingPdf(true);
    try {
      const rows = Object.entries(fieldMap).map(([field, value], idx) => ({
        sl: toBengaliNumber(idx + 1),
        field,
        value: value || '—',
      }));
      await downloadForensicReportTablePdf({
        reportTitle: title,
        reportSubtitle: subtitle,
        headers: [
          { key: 'sl', label: 'ক্রমিক', width: 90 },
          { key: 'field', label: 'তদন্ত ক্ষেত্র / কলাম', width: 320 },
          { key: 'value', label: 'প্রামাণ্য ফলাফল ও বিবরণ', width: 850 },
        ],
        rows,
        fileNamePrefix,
      });
    } finally {
      setIsExportingPdf(false);
    }
  };

  // Helper for downloading complete Multi-Sheet Excel Workbook to local disk
  const handleExportFullSlulisExcel = () => {
    const wb = XLSX.utils.book_new();

    // Sheet 1: Metadata & Project Scope
    const metaWs = XLSX.utils.json_to_sheet([
      { Key: 'System Name', Value: SLULIS_METADATA.systemName },
      { Key: 'Primary Subject', Value: SLULIS_METADATA.primarySubject },
      { Key: 'Primary Mouza', Value: SLULIS_METADATA.primaryMouza },
      { Key: 'Primary Dags', Value: SLULIS_METADATA.primaryDags },
      { Key: 'Special Investigation', Value: SLULIS_METADATA.specialInvestigation },
      { Key: 'Disclaimer', Value: SLULIS_METADATA.disclaimer },
    ]);
    XLSX.utils.book_append_sheet(wb, metaWs, 'SLULIS_Scope');

    // Sheet 2: Survey Chain (Dags 651-654 & All Mouzas)
    const surveyWs = XLSX.utils.json_to_sheet(
      MULTI_MOUZA_SURVEY_CHAIN_RECORDS.map((r) => ({
        'Chain ID': r.id,
        'মৌজা ও JL': `${r.mouza} (JL ${r.jlNo})`,
        উপজেলা: r.upazila,
        জেলা: r.district,
        জরিপ: r.surveyPeriod,
        'খতিয়ান নং': r.khatianNo,
        'দাগ নং': r.dagNo,
        'মালিকের বিবরণ': r.recordedOwner,
        'পিতার নাম': r.fatherName,
        'মোট আয়তন': r.totalArea,
        'শতক এককে': r.areaDecimal,
        হিস্যা: r.share,
        'হাল/ওয়ারিশ দাগ': r.successorDag,
        'প্রামাণ্য দলিল': r.documentaryEvidence,
        স্ট্যাটাস: r.status,
        মন্তব্য: r.notes || '',
      }))
    );
    XLSX.utils.book_append_sheet(wb, surveyWs, 'Survey_Chain_651_654');

    // Sheet 3: Dag 651 Missing 80-Decimal Report
    const dag651Ws = XLSX.utils.json_to_sheet(
      MISSING_LAND_DAG_651_REPORT.reconciliationTable.map((r) => ({
        জরিপ: r.survey,
        খতিয়ান: r.khatianNo,
        দাগ: r.dagNo,
        'রেকর্ডীয় আয়তন (শতক)': r.recordedAreaDecimal,
        'হস্তান্তরিত অংশ (শতক)': r.documentedTransferDecimal,
        'ব্যাখ্যাকৃত পার্থক্য': r.explainedDifferenceDecimal,
        'অমীমাংসিত উধাও জমি (শতক)': r.unexplainedDifferenceDecimal,
        'এভিডেন্স আইডি': r.evidenceId,
        মন্তব্য: r.notes,
      }))
    );
    XLSX.utils.book_append_sheet(wb, dag651Ws, 'Dag_651_80Dec_Reconciliation');

    // Sheet 4: Third-Party Intrusion Matrix
    const intrusionWs = XLSX.utils.json_to_sheet(
      THIRD_PARTY_INTRUSION_MATRIX.map((i) => ({
        'Intrusion ID': i.intrusionId,
        মৌজা: i.mouza,
        জরিপ: i.surveyPeriod,
        খতিয়ান: i.khatianNo,
        দাগ: i.dagNo,
        'আয়তন (শতক)': i.recordedAreaDecimal,
        'পূর্বতন বৈধ মালিক': i.previousOwner,
        'তৃতীয় পক্ষ অনুপ্রবেশকারী': i.thirdPartyName,
        'দাবিকৃত ভিত্তি': i.claimedTitleBasis,
        'বায়া দলিল স্ট্যাটাস': i.supportingDeedRef,
        'নামজারি তথ্য': i.mutationRef,
        'ফরেনসিক শ্রেণিবিভাগ': i.evidenceClassification,
        'এভিডেন্স আইডি': i.evidenceIds.join(', '),
      }))
    );
    XLSX.utils.book_append_sheet(wb, intrusionWs, 'Third_Party_Intrusion');

    // Sheet 5: Discrepancy Register
    const discWs = XLSX.utils.json_to_sheet(
      FAMILY_DISCREPANCY_REGISTER.map((d) => ({
        'Issue ID': d.issueId,
        ব্যক্তি: d.personName,
        'পরস্পরবিরোধী তথ্য': d.conflictingInformation,
        'উৎস সনদ': d.sourceDocuments.join(' | '),
        'তদন্তের প্রয়োজনীয়তা': d.verificationRequired,
        স্ট্যাটাস: d.status,
      }))
    );
    XLSX.utils.book_append_sheet(wb, discWs, 'Family_Discrepancies');

    XLSX.writeFile(
      wb,
      `SLULIS_Sofor_Ali_Universal_Land_Dossier_${new Date().toISOString().slice(0, 10)}.xlsx`
    );
  };

  // Filter survey chain records by selected dag
  const filteredSurveyRecords = MULTI_MOUZA_SURVEY_CHAIN_RECORDS.filter((r) => {
    if (selectedDagFilter === 'all') return true;
    if (selectedDagFilter === '651') return r.dagNo.includes('৬৫১') || r.dagNo.includes('১১২৪') || r.dagNo.includes('১৫৮৮');
    if (selectedDagFilter === '652') return r.dagNo.includes('৬৫২') || r.dagNo.includes('৭৫০') || r.dagNo.includes('১১২৮') || r.dagNo.includes('১৫৪৫');
    if (selectedDagFilter === '653') return r.dagNo.includes('৬৫৩') || r.dagNo.includes('৭৬২') || r.dagNo.includes('১১২৯') || r.dagNo.includes('১৫৪৬');
    if (selectedDagFilter === '654') return r.dagNo.includes('৬৫৪') || r.dagNo.includes('৭৭৫') || r.dagNo.includes('১১২৫') || r.dagNo.includes('১৫৪১');
    if (selectedDagFilter === 'other') return !['৬৫১', '৬৫২', '৬৫৩', '৬৫৪'].some((d) => r.dagNo.includes(d));
    return true;
  });

  const selectedAppendix =
    LITIGATION_APPENDICES.find((a) => a.appendixId === selectedAppendixId) || LITIGATION_APPENDICES[0];

  return (
    <div className="flex-1 w-full max-w-[1780px] mx-auto p-3 sm:p-5 lg:p-6 space-y-5 font-bengali">
      {/* Top Navigation & Breadcrumbs Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-[#0d1424] border border-amber-500/40 rounded-xl p-3.5 shadow-lg">
        <div className="flex items-center gap-3">
          {!embedded && (
            <>
              <button
                onClick={onBack}
                className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-300 border border-slate-700 text-xs font-bold flex items-center gap-1.5 transition-colors"
              >
                <Home className="w-3.5 h-3.5" />
                <span>মূল লেজার ড্যাশবোর্ড</span>
              </button>
              <span className="text-slate-500">/</span>
            </>
          )}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 flex items-center gap-1">
              <Scale className="w-3.5 h-3.5" />
              <span>SLULIS Engine</span>
            </span>
            <h1 className="text-sm sm:text-base font-bold text-white tracking-wide">
              মৃত সফর আলী বংশধারা: সর্বমৌজা টাইটেল পুনর্গঠন ও মোকদ্দমা ড্রাফট
            </h1>
          </div>
        </div>

        {/* Global Quick Action Downloads */}
        <div className="flex flex-wrap items-center gap-2">
          {/* MASTER 1-CLICK ALL-DOCUMENTS DOWNLOAD BUTTON */}
          <button
            onClick={handleDownloadMasterBundle}
            disabled={isDownloadingMasterBundle}
            className="px-4 py-1.5 rounded-lg bg-gradient-to-r from-amber-400 via-amber-300 to-yellow-400 hover:from-amber-300 hover:to-yellow-300 active:scale-[0.98] text-slate-950 font-bold text-xs shadow-md shadow-amber-950/50 flex items-center gap-1.5 transition-all border border-amber-300"
            title="১-ক্লিকে এই সেকশনের সকল আরজি, পরিশিষ্ট, এক্সেল ও ফরেনসিক রিপোর্ট জিপ ফাইল হিসেবে ডাউনলোড করুন"
          >
            {isDownloadingMasterBundle ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin text-slate-950" />
            ) : (
              <FolderArchive className="w-3.5 h-3.5 text-slate-950 stroke-[2.5]" />
            )}
            <span>১-ক্লিকে সকল নথি মাস্টার ডাউনলোড (.ZIP)</span>
          </button>

          <button
            onClick={handleExportFullSlulisExcel}
            className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-emerald-300 border border-emerald-500/40 text-xs font-bold flex items-center gap-1.5 shadow-sm"
            title="Download Complete Investigation Workbook as Excel"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>পূর্ণাঙ্গ এক্সেল (.XLSX)</span>
          </button>

          <button
            onClick={() =>
              exportToJSON(
                {
                  metadata: SLULIS_METADATA,
                  discrepancies: FAMILY_DISCREPANCY_REGISTER,
                  surveyChain: MULTI_MOUZA_SURVEY_CHAIN_RECORDS,
                  faraidEvents: FARAID_INHERITANCE_EVENTS,
                  thirdPartyIntrusions: THIRD_PARTY_INTRUSION_MATRIX,
                  dag651Report: MISSING_LAND_DAG_651_REPORT,
                  devilsAdvocateDefences: DEVILS_ADVOCATE_DEFENCES,
                  courtPlaint: COURT_READY_PLAINT_DATA,
                  appendices: LITIGATION_APPENDICES,
                },
                'SLULIS_Sofor_Ali_Full_Legal_Dossier'
              )
            }
            className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-300 border border-amber-500/40 text-xs font-bold flex items-center gap-1.5"
            title="Download Full Raw JSON Dossier"
          >
            <FileText className="w-3.5 h-3.5" />
            <span>ডসিয়ার (.JSON)</span>
          </button>

          {onNavigateToForensic && (
            <button
              onClick={() => onNavigateToForensic()}
              className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold flex items-center gap-1.5 shadow-sm"
            >
              <span>সাধারণ ফরেনসিক অডিটে ফিরুন</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* DEDICATED SLULIS MASTER 1-CLICK ALL-DOCUMENTS LITIGATION BUNDLE HUB */}
      <section className="bg-gradient-to-r from-[#1c150b] via-[#241a0d] to-[#131d33] border-2 border-amber-400/70 rounded-xl p-4 sm:p-5 shadow-2xl space-y-3 relative overflow-hidden">
        <div className="absolute right-0 top-0 w-96 h-full bg-gradient-to-l from-amber-500/10 to-transparent pointer-events-none" />

        <div className="relative z-10 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-400 via-amber-500 to-yellow-500 flex items-center justify-center text-slate-950 shadow-xl shadow-amber-950/70 shrink-0 ring-2 ring-amber-300">
              <FolderArchive className="w-6 h-6 stroke-[2.5]" />
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-950 bg-amber-400 px-2.5 py-0.5 rounded shadow">
                  MASTER 1-CLICK BUNDLE
                </span>
                <span className="text-xs bg-emerald-950/70 text-emerald-300 border border-emerald-500/40 px-2 py-0.5 rounded font-mono font-bold">
                  ২০+ টি লিটিগেশন ও ফরেনসিক নথি · ১টি জিপ (.ZIP) ফাইলে
                </span>
              </div>
              <h2 className="text-base sm:text-lg font-bold text-white">
                মৃত সফর আলী বংশধারা: সর্বমৌজা টাইটেল পুনর্গঠন ও মোকদ্দমা — সকল নথি ১-ক্লিকে মাস্টার ডাউনলোড
              </h2>
              <p className="text-xs text-slate-300 max-w-4xl leading-relaxed">
                এই সেকশনের সম্পূর্ণ দেওয়ানী আরজি (২৭ অনুচ্ছেদ + ৪টি তপশিল), ১৪টি আদালতের লিটিগেশন পরিশিষ্ট, ১১-শিটের পূর্ণাঙ্গ এক্সেল ওয়ার্কবুক, দাগ ৬৫১-এর ৮০ শতক জমি নিখোঁজ তদন্ত, গরমিল ডিটেক্টর রিপোর্ট, ১২টি বংশগত গরমিল ও ডিজিটাল অডিট ম্যানিফেস্ট ১-ক্লিকে লোকাল ডিস্কে সেভ করুন।
              </p>
            </div>
          </div>

          {/* Primary 1-Click Trigger Button & Details Toggle */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 shrink-0">
            <button
              onClick={handleDownloadMasterBundle}
              disabled={isDownloadingMasterBundle}
              className="px-5 py-3 rounded-xl bg-gradient-to-r from-amber-400 via-amber-300 to-yellow-400 hover:from-amber-300 hover:to-yellow-300 active:scale-[0.98] text-slate-950 font-bold text-sm shadow-xl shadow-amber-950/60 flex items-center justify-center gap-2 transition-all ring-2 ring-amber-300/80 hover:shadow-amber-400/30"
            >
              {isDownloadingMasterBundle ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-slate-950" />
                  <span>প্যাকেজ প্রস্তুত হচ্ছে ({masterBundleProgress}%)...</span>
                </>
              ) : (
                <>
                  <FolderArchive className="w-5 h-5 stroke-[2.5] text-slate-950" />
                  <span>১-ক্লিকে সম্পূর্ণ মোকদ্দমা প্যাকেজ ডাউনলোড (.ZIP)</span>
                </>
              )}
            </button>

            <button
              onClick={() => setShowManifestList(!showManifestList)}
              className="px-3.5 py-3 rounded-xl bg-[#151f33] hover:bg-[#1c2944] border border-amber-500/40 text-amber-300 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors"
            >
              <FileCheck2 className="w-4 h-4" />
              <span>{showManifestList ? 'নথি সূচি লুকান' : 'অন্তর্ভুক্ত ২০+ নথির তালিকা দেখুন'}</span>
            </button>
          </div>
        </div>

        {/* Live Progress Bar when downloading */}
        {(isDownloadingMasterBundle || masterBundleStatusMsg) && (
          <div className="bg-[#0b101c] p-3 rounded-lg border border-amber-500/40 space-y-2 text-xs">
            <div className="flex items-center justify-between text-amber-300 font-semibold">
              <div className="flex items-center gap-2">
                {isDownloadingMasterBundle ? (
                  <Loader2 className="w-4 h-4 animate-spin text-amber-400" />
                ) : (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                )}
                <span>{masterBundleStatusMsg}</span>
              </div>
              <span className="font-mono">{masterBundleProgress}%</span>
            </div>
            <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
              <div
                className="bg-gradient-to-r from-amber-400 via-amber-300 to-yellow-400 h-full rounded-full transition-all duration-300"
                style={{ width: `${masterBundleProgress}%` }}
              />
            </div>
          </div>
        )}

        {/* Expandable Breakdown of All Documents Included in 1-Click ZIP */}
        {showManifestList && (
          <div className="bg-[#0a0f1d] p-4 rounded-xl border border-slate-800 space-y-3 pt-3 text-xs">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <span className="text-amber-300 font-bold flex items-center gap-1.5">
                <Archive className="w-4 h-4" />
                <span>মাস্টার জিপ আর্কাইভে স্বয়ংক্রিয়ভাবে তৈরিকৃত ২০+ ফাইলের সুবিন্যস্ত তালিকা:</span>
              </span>
              <span className="text-slate-400 font-mono text-[11px]">
                SLULIS_Sofor_Ali_Master_Litigation_Package.zip
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              <div className="bg-[#101728] p-3 rounded-lg border border-slate-800 space-y-1">
                <span className="text-amber-400 font-bold block">📁 01_COURT_PLAINT (দেওয়ানী আরজি)</span>
                <ul className="space-y-0.5 text-slate-300 text-[11px]">
                  <li>• Court_Ready_Civil_Plaint_27_Sections.txt (২৭ অনুচ্ছেদের আরজি)</li>
                  <li>• Plaint_Schedules_A_B_C_D.txt (তপশিল ক, খ, গ, ঘ)</li>
                </ul>
              </div>

              <div className="bg-[#101728] p-3 rounded-lg border border-slate-800 space-y-1">
                <span className="text-emerald-400 font-bold block">📁 02_EXCEL_WORKBOOK (মাস্টার এক্সেল)</span>
                <ul className="space-y-0.5 text-slate-300 text-[11px]">
                  <li>• SLULIS_Full_Investigation_Workbook.xlsx (১১টি শিট সংবলিত পূর্ণাঙ্গ ডেটাবেস)</li>
                </ul>
              </div>

              <div className="bg-[#101728] p-3 rounded-lg border border-slate-800 space-y-1">
                <span className="text-purple-400 font-bold block">📁 03_LITIGATION_APPENDICES (১৪টি পরিশিষ্ট)</span>
                <ul className="space-y-0.5 text-slate-300 text-[11px]">
                  <li>• Appendix_01 হতে 14 পর্যন্ত সকল টেক্সট ফাইল</li>
                  <li>• অর্ডার ৩৯ নিষেধাজ্ঞা ও অর্ডার ২৬ কমিশনার দরখাস্ত</li>
                  <li>• ধারা ৮০ সরকারি নোটিশ ও ফারায়েজ হিসাব</li>
                </ul>
              </div>

              <div className="bg-[#101728] p-3 rounded-lg border border-slate-800 space-y-1">
                <span className="text-rose-400 font-bold block">📁 04_FORENSIC_INVESTIGATION_REPORTS</span>
                <ul className="space-y-0.5 text-slate-300 text-[11px]">
                  <li>• Dag_651_80_Decimal_Forensic_Report.txt (৮০ শতক লোপাট)</li>
                  <li>• Dag_651_Discrepancy_Detector_Alerts.txt (গরমিল অ্যালার্ট)</li>
                  <li>• Family_Identity_And_12_Discrepancies.txt (১২টি গরমিল)</li>
                </ul>
              </div>

              <div className="bg-[#101728] p-3 rounded-lg border border-slate-800 space-y-1">
                <span className="text-blue-400 font-bold block">📁 05_STRUCTURED_DATA_JSON</span>
                <ul className="space-y-0.5 text-slate-300 text-[11px]">
                  <li>• SLULIS_Full_Dossier_Master.json (সিস্টেমের পূর্ণাঙ্গ কাঁচা ডেটা)</li>
                </ul>
              </div>

              <div className="bg-[#101728] p-3 rounded-lg border border-slate-800 space-y-1">
                <span className="text-amber-300 font-bold block">📁 00_INSTRUCTIONS_AND_MANIFEST</span>
                <ul className="space-y-0.5 text-slate-300 text-[11px]">
                  <li>• README_LEGAL_PROCEDURE_AND_FILING_GUIDE.txt</li>
                  <li>• AUDIT_MANIFEST.csv (ডিজিটাল ম্যানিফেস্ট)</li>
                </ul>
              </div>
            </div>
          </div>
        )}
      </section>

      {/* Mandatory Non-Advocate Professional Disclaimer & Scope Card */}
      <section className="bg-gradient-to-r from-amber-950/40 via-[#18141e] to-slate-900 border-l-4 border-amber-500 rounded-xl p-4 text-xs space-y-2 border border-slate-800">
        <div className="flex items-center gap-2 text-amber-300 font-bold text-sm">
          <ShieldAlert className="w-4 h-4 shrink-0" />
          <span>পেশাগত আইনগত সতর্কতা ও অনুসন্ধান পরিধি (Scope & Legal Disclaimer)</span>
        </div>
        <p className="text-slate-300 leading-relaxed">{SLULIS_METADATA.disclaimer}</p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1 text-[11px] text-slate-400 border-t border-slate-800/80">
          <div>
            <strong className="text-slate-200">মূল পূর্বপুরুষ:</strong> {SLULIS_METADATA.primarySubject}
          </div>
          <div>
            <strong className="text-slate-200">মূল বিরোধীয় দাগসমূহ:</strong> {SLULIS_METADATA.primaryDags}
          </div>
          <div>
            <strong className="text-slate-200">বিশেষ অগ্রাধিকার:</strong> {SLULIS_METADATA.specialInvestigation}
          </div>
        </div>
      </section>

      {/* Main Tab Bar (10 Modular Investigation Sections) */}
      <div className="bg-[#0b101d] border border-slate-800 rounded-xl p-1.5 overflow-x-auto">
        <div className="flex items-center gap-1 min-w-max">
          {[
            { id: 'summary', label: '১. প্রকল্প ও সারসংক্ষেপ', icon: Briefcase },
            { id: 'lineage', label: '২. বংশলতিকা ও গরমিল রেজিস্টার', icon: GitBranch },
            { id: 'survey', label: '৩. খতিয়ান চেইন (দাগ ৬৫১–৬৫৪)', icon: Layers },
            { id: 'compare', label: '৪. পাশাপাশি দাগ তুলনা ও গরমিল', icon: Split },
            { id: 'dag651', label: '৫. দাগ ৬৫১: ৮০ শতক নিখোঁজ তদন্ত', icon: AlertTriangle },
            { id: 'evidence', label: '৬. প্রমাণ রেজিস্টার (EVD-001+)', icon: CheckSquare },
            { id: 'faraid', label: '৭. ফারায়েজ ও অংশ বণ্টন', icon: Users },
            { id: 'intrusion', label: '৮. তৃতীয় পক্ষ অনুপ্রবেশ ম্যাট্রিক্স', icon: ShieldAlert },
            { id: 'defences', label: '৯. ২০টি বিবাদী যুক্তি প্রতিহতকরণ', icon: Scale },
            { id: 'plaint', label: '১০. আদালতে দাখিলযোগ্য দেওয়ানী আরজি', icon: FileText },
            { id: 'appendices', label: '১১. ১৪টি সহায়ক লিটিগেশন নথি', icon: FolderDown },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as SlulisTabId)}
                className={`px-3 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                  isActive
                    ? 'bg-amber-500 text-slate-950 shadow-md border border-amber-400'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* TAB 1: EXECUTIVE SUMMARY & SCOPE */}
      {activeTab === 'summary' && (
        <div className="space-y-4">
          <div className="bg-[#0e1526] border border-slate-800 rounded-xl p-5 space-y-4">
            <h2 className="text-base font-bold text-amber-300 flex items-center gap-2">
              <Briefcase className="w-4 h-4" />
              <span>একক বংশধারা সর্বমৌজা টাইটেল পুনর্গঠন — নির্বাহী সারসংক্ষেপ (Executive Summary)</span>
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
              <div className="bg-[#121b30] p-3.5 rounded-lg border border-slate-800 space-y-1">
                <span className="text-slate-400">তদন্তাধীন মূল বংশলতিকা</span>
                <div className="text-sm font-bold text-white">রোশন আলী → নাজির আলী নোয়াজ → সফর আলী</div>
                <p className="text-[11px] text-slate-400">দুই পুত্র: কামদার আলী ও সিরাজ আলী এবং তদীয় বংশধরগণ</p>
              </div>
              <div className="bg-[#121b30] p-3.5 rounded-lg border border-slate-800 space-y-1">
                <span className="text-slate-400">প্রাথমিক মৌজা ও জে.এল.</span>
                <div className="text-sm font-bold text-amber-300">গোয়ালী (জে.এল. নং ৮৪)</div>
                <p className="text-[11px] text-slate-400">নবীনগর, ব্রাহ্মণবাড়িয়া + অন্যান্য আপলোডকৃত মৌজা</p>
              </div>
              <div className="bg-[#121b30] p-3.5 rounded-lg border border-slate-800 space-y-1">
                <span className="text-slate-400">প্রধান বিরোধীয় ও পৈতৃক দাগসমূহ</span>
                <div className="text-sm font-bold text-white">CS দাগ ৬৫১, ৬৫২, ৬৫৩, ৬৫৪</div>
                <p className="text-[11px] text-slate-400">দাগ ৬৫৪ = শতবর্ষীয় মূল বসতভিটা / ভিটাবাড়ি (৮০ শতক)</p>
              </div>
              <div className="bg-[#121b30] p-3.5 rounded-lg border border-rose-500/30 space-y-1 bg-rose-950/20">
                <span className="text-rose-300 font-semibold">বিশেষ নিখোঁজ জমির পরিমাণ</span>
                <div className="text-sm font-bold text-rose-400">৮০ শতক (দাগ ৬৫১)</div>
                <p className="text-[11px] text-slate-400">সিএস ৩২০ শতক হতে এসএ-তে ২৪০ শতক; বিআরএস ১৫৮৮ দাগে উধাও</p>
              </div>
            </div>

            <div className="bg-[#111728] p-4 rounded-xl border border-slate-800 space-y-2 text-xs text-slate-300 leading-relaxed">
              <h3 className="text-sm font-bold text-white">মূল তদন্ত প্রতিবেদন ও অনুসন্ধানের মূল সিদ্ধান্তসমূহ:</h3>
              <ul className="list-disc list-inside space-y-1.5 text-slate-300">
                <li>
                  <strong>চূড়ান্ত মাস্টার বংশলতিকা:</strong> রোশন আলী → তাহার পুত্র নাজির আলী নোয়াজ অথবা আলী নোয়াজ → তাহার পুত্র সফর আলী → তাহার দুই পুত্র কামদার আলী ও সিরাজ আলী এবং তদীয় বংশধরগণ। (উল্লেখ্য: সনদে কানদার আলী / কান্দর আলী / কাম্দার আলী হিসেবে স্পেলিং মিসটেক হয়েছে, মূলত সেটি হবে কামদার আলী)।
                </li>
                <li>
                  <strong>সিএস খতিয়ান ১১৮-এর অবিসংবাদিত ভিত্তি:</strong> গোয়ালী মৌজার সিএস ১১৮ খতিয়ানে সফর আলীর নামে দাগ ৬৫১ (৩২০ শতক), ৬৫২ (১৫০ শতক), ৬৫৩ (৯০ শতক) এবং ৬৫৪ (৮০ শতক) নিরঙ্কুশভাবে রেকর্ডভুক্ত ছিল।
                </li>
                <li>
                  <strong>দাগ ৬৫৪ ভিটাবাড়ি সংরক্ষণ:</strong> সিএস দাগ ৬৫৪-এর ৮০ শতক জমি সফর আলীর পরিবার শতবর্ষ ধরে নিরঙ্কুশভাবে বসতবাড়ি হিসেবে ভোগদখল করে আসছে। আরএস খতিয়ান ৫১১ ও বিআরএস খতিয়ান ৭৮৫-তে এটি সিরাজ আলীর উত্তরাধিকারীদের নামে অক্ষুণ্ণ রয়েছে।
                </li>
                <li>
                  <strong>দাগ ৬৫১-এর ৮০ শতক জবরদখল ও গরমিল শনাক্ত:</strong> সিএস ৬৫১ দাগের ৩২০ শতক হতে এসএ ২৪৫ খতিয়ানে ২৪০ শতক রেকর্ড করা হয়, ফলে ৮০ শতক জমি ড্রপ পড়ে। পরবর্তীতে বিআরএস জরিপে কোনো বৈধ রেজিস্ট্রি সাফ-কবলা বায়া দলিল ব্যতিরেকে তৃতীয় পক্ষ মৃত সামসুল হক গং বিআরএস খতিয়ান ৯০২, দাগ ১৫৮৮-তে অবৈধভাবে নিজেদের নামে রেকর্ড করে নেয়।
                </li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: MASTER FAMILY LINEAGE & DISCREPANCY REGISTER */}
      {activeTab === 'lineage' && (
        <div className="space-y-5">
          {/* Visual Lineage Hierarchy Map */}
          <div className="bg-[#0e1526] border border-slate-800 rounded-xl p-5 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="text-base font-bold text-amber-300 flex items-center gap-2">
                <GitBranch className="w-4 h-4" />
                <span>স্থায়ী মাস্টার পারিবারিক বংশলতিকা (Fixed Master Family Lineage Tree)</span>
              </h3>
              <span className="text-xs text-emerald-300 bg-emerald-950/50 px-2.5 py-1 rounded border border-emerald-500/30 font-semibold">
                আপলোডকৃত ৮টি সনদ ও প্রমিত বংশলতিকা ভিত্তিক
              </span>
            </div>
            <p className="text-xs text-slate-300">
              রোশন আলী (Gen 1) → নাজির আলী নোয়াজ অথবা আলী নোয়াজ (Gen 2) → সফর আলী (Gen 3) → কামদার আলী ও সিরাজ আলী (Gen 4) → এবং তদীয় বংশধরগণ (Gen 5+)
            </p>

            <div className="bg-[#090d16] p-4 rounded-xl border border-slate-800 font-mono text-xs text-slate-200 overflow-x-auto leading-relaxed space-y-1">
              <div className="font-bold text-amber-400">
                [প্রজন্ম ১] রোশন আলী (মূল পূর্বপুরুষ)
              </div>
              <div className="pl-4 font-bold text-amber-300">
                └── [প্রজন্ম ২] নাজির আলী নোয়াজ অথবা আলী নোয়াজ (সনদে: মৃত নাজির ওরফে আলী নোয়াজ) ├── স্ত্রী: পরিষ্কারের নেছা (মৃত)
              </div>
              <div className="pl-8 font-bold text-emerald-300">
                └── [প্রজন্ম ৩] সফর আলী (মৃত্যু: ১৮-১১-১৯০৫) ├── স্ত্রী: ফুলবানু (মৃত) [সনদ নং ২০২৬৫৪১১৮১২০০০০০৩]
              </div>
              <div className="pl-14 text-amber-200 font-bold">
                ├── [প্রজন্ম ৪ - ১ম পুত্র] কামদার আলী (মৃত) [বিঃদ্রঃ সনদে কানদার আলী / কান্দর আলী / কাম্দার আলী হিসেবে স্পেলিং মিসটেক হয়েছে, মূলত নাম কামদার আলী]
              </div>
              <div className="pl-20 text-slate-200">
                ├── [Gen 5 - কামদার শাখা ক] আঃ আলীম (পিতা: কামদার আলী; সনদ: কাই(দঃ)/ইউপি/২০২৩(৫৩)) ── [১৭ জন উত্তরাধিকারী: ৩ স্ত্রী (আমেনা, সাহেদা, হেলেনা), ৬ পুত্র (আব্দুর রহমান, আব্দুল জলিল, সেলিম মিয়া, শামীম, মমিন, আমিন মিয়া) ও ৮ কন্যা]
              </div>
              <div className="pl-20 text-slate-200">
                └── [Gen 5 - কামদার শাখা খ] আব্দুল কাদির (পিতা: কামদার আলী [সনদে কান্দর আলী]; মাতা: জাহেরা খাতুন; সনদ: ২০২৬১২১৮৫৪০০০০০২১) ── [১১ জন ওয়ারিশ: স্ত্রী শাহারা খাতুন, পুত্র খলিল, আনু, তাজু মিয়া, মোহাম্মদ করিম, সুহেল মিয়া, লুক্কন মিয়া, মোঃ সাক্কন, মোঃ মনির এবং কন্যা পারভীনা বেগম ও সারমিন আক্তার]
              </div>
              <div className="pl-14 text-emerald-300 font-bold pt-1">
                └── [প্রজন্ম ৪ - ২য় পুত্র] সিরাজ আলী (মৃত্যু: ০১-০২-১৯৭১) ├── স্ত্রী: আইমনের নেছা ও বানু বেগম (মৃত) [সনদ নং ২০২৬৫৪১১৮১২০০০০০১]
              </div>
              <div className="pl-20 text-slate-200">
                ├── [Gen 5 - সিরাজ শাখা ক] ফিরুজ মিয়া (মৃত ২২-০৫-২০০৯; সনদ: ২০২৬৫৪১১৮১২০০০০০২) ── [৮ জন ওয়ারিশ: স্ত্রী তাসলিমা বেগম ও রোকিয়া খাতুন, পুত্র রফিকুল ইসলাম, খোকন মিয়া, মোঃ টিটু (নাগরিকত্ব সনদ: ৪৬৫৪০৬৯০৫৪), জামাল মিয়া, কন্যা রানু কাইযুম ও সুরাইয়া বেগম]
              </div>
              <div className="pl-20 text-slate-200">
                ├── [Gen 5 - সিরাজ শাখা খ] নোয়াব মিয়া (মৃত ১৭-০৬-২০২৬; সনদ: ২০২৬১২১৮৫৪০০০০০০৫) ── [৮ জন ওয়ারিশ: স্ত্রী আমেনা খাতুন, পুত্র মোঃ রহিম মিয়া, মোঃ আব্দুল করিম, মোঃ বিল্লাল হোসেন, জিলানী মিয়া, আব্দুল কাইযুম, জসিম উদ্দিন ও মনির হোসেন]
              </div>
              <div className="pl-20 text-slate-200">
                ├── [Gen 5 - সিরাজ শাখা গ] মোঃ জাহের মিয়া (মৃত ১৩-০৬-২০০৬; সনদ: ২০২৬৫৪১১৮১২০০০০০৪) ── [১২ জন ওয়ারিশ: ২ স্ত্রী রোশেনা বেগম ও হনুফা বেগম, ৬ পুত্র ফোরকান, ইমান, জয়দুল, জালাল, বোরহান, নিজাম ও ৪ কন্যা লাভলী, তাছলিমা, মানছুরা, জোসনা]
              </div>
              <div className="pl-20 text-sky-300">
                ├── [Gen 5 - সিরাজ শাখা ঘ] মোঃ জাকির হোসেন (জীবিত — এনআইডি: ৫৫৪৭৬৯৭৯২০)
              </div>
              <div className="pl-20 text-sky-300">
                ├── [Gen 5 - সিরাজ শাখা ঙ] আনোয়ারা বেগম (জীবিত — এনআইডি: ৫৫৪৬৯৮২৬৫২)
              </div>
              <div className="pl-20 text-sky-300">
                └── [Gen 5 - সিরাজ শাখা চ] জাহানারা বেগম (জীবিত — এনআইডি: ৬৮৫৬০৮৬৬৬২)
              </div>
            </div>
          </div>

          {/* Spelling Mistake Clarification Note: Kamdar Ali vs Kandar/Kandor Ali */}
          <div className="bg-[#121324] border border-amber-500/40 rounded-xl p-4 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-2">
              <div className="flex items-center gap-2">
                <HelpCircle className="w-4 h-4 text-amber-400" />
                <h4 className="text-sm font-bold text-white">
                  বিশেষ বানান সংশোধনী নোট: কানদার আলী / কান্দর আলী / কাম্দার আলী → মূলত: কামদার আলী
                </h4>
              </div>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                SPELLING MISTAKE CLARIFIED (প্রকৃত নাম: কামদার আলী)
              </span>
            </div>
            <p className="text-xs text-slate-200 leading-relaxed">
              উল্লিখিত সনদে <strong className="text-amber-300">কানদার আলী / কান্দর আলী</strong> (আব্দুল কাদিরের ওয়ারিশান সনদ নং ২০২৬১২১৮৫৪০০০০০২১) এবং <strong className="text-amber-300">মৃত কাম্দার আলী</strong> (আঃ আলীমের উত্তরাধিকারী সনদপত্র নং কাই(দঃ)/ইউপি/২০২৩(৫৩)) হিসেবে <strong className="text-rose-300">স্পেলিং মিসটেক (করণিক বানান ভুল)</strong> হয়েছে। মূলত সেটি হবে সফর আলীর পুত্র <strong className="text-emerald-300">কামদার আলী</strong>।
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {PENDING_FAMILY_IDENTITY_DATA.map((item, index) => (
                <div key={index} className="bg-[#090d16] p-3 rounded-lg border border-slate-800 text-xs text-slate-400 space-y-1.5">
                  <div className="font-bold text-amber-300">
                    {item.personName} (সনদ নং: {item.certificateNo}) — {toBengaliNumber(item.declaredHeirsCount)} জন ওয়ারিশ
                  </div>
                  <p className="text-slate-300">{item.unverifiedConnectionReason}</p>
                  <ul className="list-disc list-inside space-y-0.5 text-slate-400">
                    {item.verificationCheckpoints.map((cp, idx) => (
                      <li key={idx}>{cp}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>

          {/* 12 Family Discrepancy Register Issues Table */}
          <div className="bg-[#0e1526] border border-slate-800 rounded-xl p-5 space-y-3">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-400" />
              <span>পারিবারিক পরিচয় ও সনদের ১২টি গরমিল রেজিস্টার (Part 4 Discrepancy Register)</span>
            </h3>
            <p className="text-xs text-slate-400">
              আদালতে দাখিলের পূর্বে এই ১২টি অসঙ্গতি সমাধান বা যুক্তি উপস্থাপন অত্যাবশ্যক।
            </p>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-[#090d16] text-amber-300 border-b border-slate-800">
                    <th className="p-2.5 border-r border-slate-800">Issue ID</th>
                    <th className="p-2.5 border-r border-slate-800">ব্যক্তি / ক্ষেত্র</th>
                    <th className="p-2.5 border-r border-slate-800">পরস্পরবিরোধী তথ্য</th>
                    <th className="p-2.5 border-r border-slate-800">আইনি ও ফরেনসিক বিশ্লেষণ</th>
                    <th className="p-2.5 border-r border-slate-800">প্রয়োজনীয় পদক্ষেপ</th>
                    <th className="p-2.5 text-center">ডাউনলোড</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80">
                  {FAMILY_DISCREPANCY_REGISTER.map((d) => (
                    <tr key={d.issueId} className="hover:bg-slate-800/40 align-top">
                      <td className="p-2.5 border-r border-slate-800 font-mono font-bold text-amber-300">
                        {d.issueId}
                      </td>
                      <td className="p-2.5 border-r border-slate-800 font-bold text-white whitespace-nowrap">
                        {d.personName}
                      </td>
                      <td className="p-2.5 border-r border-slate-800 text-rose-200">
                        {d.conflictingInformation}
                      </td>
                      <td className="p-2.5 border-r border-slate-800 text-slate-300 leading-relaxed">
                        {d.investigationDetails}
                      </td>
                      <td className="p-2.5 border-r border-slate-800 text-slate-400">
                        {d.verificationRequired}
                      </td>
                      <td className="p-2.5 text-center whitespace-nowrap">
                        <button
                          onClick={() =>
                            handleDownloadItemPdf(
                              `Family Discrepancy Sheet — ${d.issueId}`,
                              d.personName,
                              {
                                'Issue ID': d.issueId,
                                'ব্যক্তি / ক্ষেত্র': d.personName,
                                'পরস্পরবিরোধী তথ্য': d.conflictingInformation,
                                'উৎস দলিল': d.sourceDocuments.join(', '),
                                'ফরেনসিক বিশ্লেষণ': d.investigationDetails,
                                'প্রয়োজনীয় পদক্ষেপ': d.verificationRequired,
                                স্ট্যাটাস: d.status,
                              },
                              `Discrepancy_${d.issueId}`
                            )
                          }
                          className="px-2 py-1 rounded bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/30 text-[10px] font-bold inline-flex items-center gap-1"
                        >
                          <Download className="w-3 h-3" />
                          <span>PDF</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: MULTI-MOUZA SURVEY CHAIN TABLES (DAGS 651, 652, 653, 654) */}
      {activeTab === 'survey' && (
        <div className="space-y-4">
          <div className="bg-[#0e1526] border border-slate-800 rounded-xl p-5 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Layers className="w-4 h-4 text-amber-400" />
                  <span>সর্বমৌজা খতিয়ান চেইন ও তুলনামূলক জরিপ ধারাবাহিকতা (Part 5 Survey Comparison)</span>
                </h3>
                <p className="text-xs text-slate-400">
                  সিএস → এসএ/এসি → আরএস → বিআরএস → বর্তমান রেকর্ড। কোনো রেকর্ড না থাকলে সুস্পষ্টভাবে <code className="text-rose-400 font-mono font-bold">RECORD GAP</code> চিহ্নিত।
                </p>
              </div>

              {/* Dag Filter Buttons + Side-by-Side Comparison Launcher */}
              <div className="flex flex-wrap items-center gap-2">
                <div className="flex flex-wrap items-center gap-1 bg-[#090d16] p-1 rounded-lg border border-slate-800 text-xs">
                  <span className="text-slate-400 px-2 font-medium">ফিল্টার:</span>
                  {[
                    { id: 'all', label: 'সকল দাগ' },
                    { id: '651', label: 'দাগ ৬৫১ (৮০ শতক গরমিল)' },
                    { id: '652', label: 'দাগ ৬৫২ (নাল ১৫০ শতক)' },
                    { id: '653', label: 'দাগ ৬৫৩ (বাগান ৯০ শতক)' },
                    { id: '654', label: 'দাগ ৬৫৪ (ভিটাবাড়ি ৮০ শতক)' },
                    { id: 'other', label: 'অন্যান্য মৌজা (বরাইচারা)' },
                  ].map((btn) => (
                    <button
                      key={btn.id}
                      onClick={() => setSelectedDagFilter(btn.id)}
                      className={`px-2.5 py-1 rounded text-xs font-bold transition-all ${
                        selectedDagFilter === btn.id
                          ? 'bg-amber-500 text-slate-950'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      {btn.label}
                    </button>
                  ))}
                </div>

                <button
                  onClick={() => {
                    const dagToCompare =
                      selectedDagFilter === 'all' || selectedDagFilter === 'other'
                        ? '651'
                        : selectedDagFilter;
                    setSelectedComparisonDag(dagToCompare);
                    setActiveTab('compare');
                  }}
                  className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-amber-400 via-amber-300 to-yellow-400 hover:from-amber-300 hover:to-yellow-300 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow-md shadow-amber-950/40 transition-all hover:scale-[1.02] active:scale-[0.98]"
                  title="নির্বাচিত দাগের সিএস-এসএ-আরএস-বিআরএস পাশাপাশি তুলনামূলক ভিউ দেখুন"
                >
                  <Split className="w-3.5 h-3.5 text-slate-950 stroke-[2.5]" />
                  <span>পাশাপাশি জরিপ তুলনা ভিউ (Side-by-Side)</span>
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-[#090d16] text-amber-300 border-b border-slate-800">
                    <th className="p-2.5 border-r border-slate-800">জরিপ ও মৌজা</th>
                    <th className="p-2.5 border-r border-slate-800">খতিয়ান</th>
                    <th className="p-2.5 border-r border-slate-800">দাগ নং</th>
                    <th className="p-2.5 border-r border-slate-800">রেকর্ডীয় মালিক ও পিতা</th>
                    <th className="p-2.5 border-r border-slate-800">মোট আয়তন ও হিস্যা</th>
                    <th className="p-2.5 border-r border-slate-800">হাল / ওয়ারিশ দাগ</th>
                    <th className="p-2.5 border-r border-slate-800">প্রামাণ্য দলিল ও এভিডেন্স</th>
                    <th className="p-2.5 border-r border-slate-800">স্ট্যাটাস</th>
                    <th className="p-2.5 text-center">ডাউনলোড</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80">
                  {filteredSurveyRecords.map((r) => (
                    <tr key={r.id} className="hover:bg-slate-800/40 align-top">
                      <td className="p-2.5 border-r border-slate-800">
                        <span className="px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 font-bold font-mono">
                          {r.surveyPeriod}
                        </span>
                        <div className="text-white font-medium mt-1">
                          {r.mouza} (JL {r.jlNo})
                        </div>
                      </td>
                      <td className="p-2.5 border-r border-slate-800 font-mono font-bold text-slate-200">
                        {r.khatianNo === 'RECORD GAP' ? (
                          <span className="text-rose-400 bg-rose-950/60 px-1 py-0.5 rounded border border-rose-500/40 font-bold">
                            RECORD GAP
                          </span>
                        ) : (
                          r.khatianNo
                        )}
                      </td>
                      <td className="p-2.5 border-r border-slate-800 font-mono font-bold text-amber-300">
                        {r.dagNo === 'RECORD GAP' ? (
                          <span className="text-rose-400 bg-rose-950/60 px-1 py-0.5 rounded border border-rose-500/40 font-bold">
                            RECORD GAP
                          </span>
                        ) : (
                          r.dagNo
                        )}
                      </td>
                      <td className="p-2.5 border-r border-slate-800">
                        <div className="font-bold text-white">{r.recordedOwner}</div>
                        <div className="text-[11px] text-slate-400">পিতা: {r.fatherName}</div>
                      </td>
                      <td className="p-2.5 border-r border-slate-800">
                        <div className="font-bold text-emerald-300">{r.totalArea}</div>
                        <div className="text-[11px] text-slate-400">হিস্যা: {r.share}</div>
                      </td>
                      <td className="p-2.5 border-r border-slate-800 text-slate-300">{r.successorDag}</td>
                      <td className="p-2.5 border-r border-slate-800">
                        <div className="text-slate-200">{r.documentaryEvidence}</div>
                        <span className="font-mono text-amber-300 text-[10px]">{r.evidenceId}</span>
                      </td>
                      <td className="p-2.5 border-r border-slate-800">
                        <span
                          className={`px-1.5 py-0.5 rounded text-[10px] font-bold border ${
                            r.status === 'VERIFIED'
                              ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                              : r.status === 'AREA MISMATCH'
                              ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                              : r.status === 'CONTRADICTORY RECORDS'
                              ? 'bg-rose-950 text-rose-200 border-rose-500'
                              : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                          }`}
                        >
                          {r.status}
                        </span>
                      </td>
                      <td className="p-2.5 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => {
                              const matchedDag = r.dagNo.includes('৬৫১')
                                ? '651'
                                : r.dagNo.includes('৬৫২')
                                ? '652'
                                : r.dagNo.includes('৬৫৩')
                                ? '653'
                                : r.dagNo.includes('৬৫৪')
                                ? '654'
                                : r.dagNo;
                              setSelectedComparisonDag(matchedDag);
                              setActiveTab('compare');
                            }}
                            title="এই দাগের পাশাপাশি ৫ জরিপ তুলনা ও গরমিল দেখুন"
                            className="px-2 py-1 rounded bg-amber-500/20 hover:bg-amber-400 hover:text-slate-950 text-amber-300 border border-amber-500/40 text-[10px] font-bold inline-flex items-center gap-1 transition-colors"
                          >
                            <Split className="w-2.5 h-2.5" />
                            <span>তুলনা</span>
                          </button>
                          <button
                            onClick={() =>
                              handleDownloadItemPdf(
                                `Survey Chain Entry — ${r.surveyPeriod} দাগ ${r.dagNo}`,
                                `${r.mouza} (JL ${r.jlNo})`,
                                {
                                  'জরিপ ও সময়কাল': r.surveyPeriod,
                                  'মৌজা ও জে.এল.': `${r.mouza} (JL ${r.jlNo}), ${r.upazila}, ${r.district}`,
                                  'খতিয়ান নং': r.khatianNo,
                                  'দাগ নং': r.dagNo,
                                  'মালিকের নাম': r.recordedOwner,
                                  'পিতার নাম': r.fatherName,
                                  'মোট আয়তন': r.totalArea,
                                  'হিস্যা / অংশ': r.share,
                                  'হাল / পরবর্তী দাগ': r.successorDag,
                                  'প্রামাণ্য দলিল': r.documentaryEvidence,
                                  'এভিডেন্স আইডি': r.evidenceId,
                                  স্ট্যাটাস: r.status,
                                  মন্তব্য: r.notes || '—',
                                },
                                `Survey_${r.id}`
                              )
                            }
                            className="px-2 py-1 rounded bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border border-emerald-500/30 text-[10px] font-bold inline-flex items-center gap-1"
                          >
                            <Download className="w-3 h-3" />
                            <span>PDF</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: SIDE-BY-SIDE COMPARISON VIEW FOR SPECIFIC DAG HISTORIES */}
      {activeTab === 'compare' && (
        <DagSideBySideComparisonView
          initialDag={selectedComparisonDag}
          records={records}
          onNavigateToPlaint={() => setActiveTab('plaint')}
        />
      )}

      {/* TAB 5: MASTER EVIDENCE MANAGEMENT SYSTEM (EVD-000001+) */}
      {activeTab === 'evidence' && (
        <div className="bg-[#0e1526] border border-slate-800 rounded-xl p-5 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <CheckSquare className="w-4 h-4 text-emerald-400" />
                <span>মাস্টার প্রমাণ রেজিস্টার (Master Evidence Register — EVD-000001+)</span>
              </h3>
              <p className="text-xs text-slate-400">
                প্রতিটি আপলোডকৃত ও ঐতিহাসিক দলিলের জন্য ২০টি তথ্যক্ষেত্র সংবলিত স্বয়ংসম্পূর্ণ প্রমাণ রেজিস্ট্রি। জাতীয় পরিচয়পত্র ও জন্মনিবন্ধন নম্বর সম্পূর্ণ মাস্কড (Masked for Privacy)।
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {[
              {
                id: 'EVD-000001',
                type: 'CS Khatian (সিএস খতিয়ান)',
                number: 'খতিয়ান নং ১১৮',
                date: '১৯১৫-১৯২০ (সিএস চূড়ান্ত)',
                authority: 'জেলা রেকর্ড রুম ও সার্ভেয়ার জেনারেল',
                owner: 'সফর আলী',
                father: 'মৃত নাজির ওরফে আলী নোয়াজ',
                mouza: 'গোয়ালী (JL ৮৪)',
                dags: '৬৫১ (৩২০ শতক), ৬৫২ (১৫০ শতক), ৬৫৩ (৯০ শতক), ৬৫৪ (৮০ শতক)',
                status: 'VERIFIED',
                significance: 'সমগ্র পৈতৃক সম্পত্তির নিরঙ্কুশ মূল স্বত্বের প্রাচীনতম ভিত্তি।',
              },
              {
                id: 'EVD-000002',
                type: 'SA/AC Khatian (এসএ খতিয়ান)',
                number: 'খতিয়ান নং ২৪৫',
                date: '১৯৫৬-১৯৬২ (এসএ চূড়ান্ত)',
                authority: 'স্টেট একুইজিশন অ্যান্ড রেভেনিউ রেকর্ড বিভাগ',
                owner: 'সিরাজ আলী ও কামদার আলী',
                father: 'মৃত সফর আলী',
                mouza: 'গোয়ালী (JL ৮৪)',
                dags: '৬৫১ (২৪০ শতক - ৮০ শতক অমীমাংসিত ড্রপ), ৭৫০ (১৫০ শতক), ৭৬২ (৯০ শতক), ৭৭৫ (৮০ শতক)',
                status: 'AREA MISMATCH',
                significance: 'সফর আলীর দুই পুত্রের নামে রেকর্ড, তবে ৬৫১ দাগের ৮০ শতকের ঐতিহাসিক ড্রপ শনাক্ত।',
              },
              {
                id: 'EVD-000003',
                type: 'RS Khatian (আরএস খতিয়ান)',
                number: 'খতিয়ান নং ৫১০ ও ৫১১',
                date: '১৯৮২-১৯৮৫ (আরএস মুদ্রণ)',
                authority: 'জোনাল সেটেলমেন্ট প্রেস ও ভূমি মন্ত্রণালয়',
                owner: 'ফিরুজ মিয়া, জাহের মিয়া গং',
                father: 'মৃত সিরাজ আলী',
                mouza: 'গোয়ালী (JL ৮৪)',
                dags: '১১২৪ (১২০ শতক), ১১২৫ (৮০ শতক বসতবাড়ি)',
                status: 'CORROBORATED',
                significance: 'সিরাজ আলীর পুত্রগণের ওয়ারিশান স্বত্ব ও দাগ ৬৫৪-এর বসতভিটা নিরবচ্ছিন্ন বহাল।',
              },
              {
                id: 'EVD-000004',
                type: 'BRS Khatian (অবৈধ তৃতীয় পক্ষ বিআরএস)',
                number: 'খতিয়ান নং ৯০২',
                date: '১৯৯৮ (বিআরএস প্রকাশনা)',
                authority: 'সহকারী সেটেলমেন্ট অফিস, নবীনগর',
                owner: 'মৃত সামসুল হক গং (অনধিকার প্রবেশকারী)',
                father: 'মৃত আব্দুর রহমান',
                mouza: 'গোয়ালী (JL ৮৪)',
                dags: 'দাগ ১৫৮৮ (৮০ শতক)',
                status: 'CONTRADICTORY RECORDS',
                significance: 'সিএস ৬৫১ দাগের নিখোঁজ ৮০ শতক জমি বায়া দলিল ব্যতিরেকে তৃতীয় পক্ষের নামে ভুল বিআরএস।',
              },
              {
                id: 'EVD-000014',
                type: 'Inheritance Certificate (সফর আলীর ওয়ারিশ সনদ)',
                number: 'সনদ নং ২০২৬৫৪১১৮১২০০০০৩',
                date: '১৬-০৯-২০২৬',
                authority: 'কাইতলা (দক্ষিণ) ইউনিয়ন পরিষদ, নবীনগর',
                owner: 'সফর আলী (মৃত ১৮-১১-১৯০৫)',
                father: 'মৃত নাজির ওরফে আলী নোয়াজ',
                mouza: 'গোয়ালী (JL ৮৪)',
                dags: 'সফর আলীর ত্যাজ্যবিত্ত সকল সম্পত্তি',
                status: 'VERIFIED',
                significance: 'স্ত্রী ফুলবানু এবং দুই পুত্র কামদার আলী ও সিরাজ আলীর ওয়ারিশান সনদ।',
              },
              {
                id: 'EVD-000015',
                type: 'Inheritance Certificate (সিরাজ আলীর ওয়ারিশ সনদ)',
                number: 'সনদ নং ২০২৬৫৪১১৮১২০০০০১',
                date: '১৬-০৯-২০২৬',
                authority: 'কাইতলা (দক্ষিণ) ইউনিয়ন পরিষদ, নবীনগর',
                owner: 'সিরাজ আলী (মৃত ০১-০২-১৯৭১)',
                father: 'মৃত সফর আলী',
                mouza: 'গোয়ালী (JL ৮৪)',
                dags: 'সিরাজ আলীর প্রাপ্য অংশ',
                status: 'VERIFIED',
                significance: 'স্ত্রী আইমনের নেছা, ৪ পুত্র ও ২ কন্যার প্রামাণ্য ওয়ারিশান প্রত্যয়ন।',
              },
            ].map((ev) => (
              <div
                key={ev.id}
                className="bg-[#12192c] border border-slate-800 rounded-xl p-4 space-y-2 text-xs flex flex-col justify-between"
              >
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold text-amber-300 bg-amber-500/15 px-2 py-0.5 rounded border border-amber-500/30">
                      {ev.id}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                        ev.status === 'VERIFIED'
                          ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                          : ev.status === 'AREA MISMATCH'
                          ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                          : 'bg-rose-950 text-rose-200 border-rose-500'
                      }`}
                    >
                      {ev.status}
                    </span>
                  </div>
                  <h4 className="font-bold text-white text-sm">{ev.type}</h4>
                  <div className="text-slate-300 font-semibold">{ev.number} ({ev.date})</div>
                  <p className="text-slate-400 text-[11px]">{ev.authority}</p>
                  <div className="pt-1 text-slate-300 space-y-0.5">
                    <div><strong>রেকর্ডীয় ব্যক্তি:</strong> {ev.owner} (পিতা: {ev.father})</div>
                    <div><strong>অন্তর্ভুক্ত দাগসমূহ:</strong> {ev.dags}</div>
                  </div>
                  <p className="text-amber-200/90 text-[11px] pt-1">
                    <strong>আইনি তাৎপর্য:</strong> {ev.significance}
                  </p>
                </div>

                <div className="pt-2 border-t border-slate-800 flex items-center justify-end">
                  <button
                    onClick={() =>
                      handleDownloadItemPdf(
                        `Evidence Dossier — ${ev.id}`,
                        ev.type,
                        {
                          'Evidence ID': ev.id,
                          'দলিলের ধরন': ev.type,
                          'নথি নং': ev.number,
                          'ইস্যুর তারিখ': ev.date,
                          কর্তৃপক্ষ: ev.authority,
                          'মালিক / ব্যক্তি': ev.owner,
                          'পিতার নাম': ev.father,
                          মৌজা: ev.mouza,
                          'অন্তর্ভুক্ত দাগ': ev.dags,
                          'আইনি তাৎপর্য': ev.significance,
                          স্ট্যাটাস: ev.status,
                        },
                        `Evidence_${ev.id}`
                      )
                    }
                    className="px-2.5 py-1 rounded bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 font-bold text-[11px] flex items-center gap-1"
                  >
                    <Download className="w-3 h-3" />
                    <span>Download .PDF</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 5: FARAID & INHERITANCE ENGINE */}
      {activeTab === 'faraid' && (
        <div className="space-y-4">
          <div className="bg-[#0e1526] border border-slate-800 rounded-xl p-5 space-y-4">
            <h3 className="text-base font-bold text-amber-300 flex items-center gap-2">
              <Users className="w-4 h-4" />
              <span>মুসলিম ফারায়েজ ও বহুপ্রজন্ম উত্তরাধিকার বণ্টন বিশ্লেষণ (Part 8 Faraid Engine)</span>
            </h3>
            <p className="text-xs text-slate-400">
              প্রত্যেকটি মৃত্যুর তারিখে জীবিত ওয়ারিশদের চিহ্নিতকরণ, মৌলিক হর (Common Denominator) ব্যাখ্যা এবং মুসলিম পারিবারিক আইন ১৯৬১-এর ৪ ধারার প্রযোজ্যতা পর্যালোচনা।
            </p>

            <div className="space-y-4">
              {FARAID_INHERITANCE_EVENTS.map((ev) => (
                <div
                  key={ev.eventId}
                  className="bg-[#111728] border border-slate-800 rounded-xl p-4 space-y-3 text-xs"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-2">
                    <div>
                      <span className="font-mono font-bold text-amber-300 mr-2">{ev.eventId}</span>
                      <strong className="text-white text-sm">{ev.deceasedPerson}</strong> ({ev.verifiedOrAllegedDate})
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-slate-400 font-mono text-[11px]">{ev.applicableLaw}</span>
                      <button
                        onClick={() =>
                          handleDownloadItemPdf(
                            `Faraid Calculation Sheet — ${ev.deceasedPerson}`,
                            `${ev.eventId} | ${ev.deathDate}`,
                            {
                              'ইভেন্ট আইডি': ev.eventId,
                              'মৃত ব্যক্তি': ev.deceasedPerson,
                              'মৃত্যুর তারিখ': ev.deathDate,
                              'প্রযোজ্য আইন': ev.applicableLaw,
                              'মৌলিক হর ও সূত্র': ev.denominatorFormula,
                              'মোট সম্পত্তির ভিত্তি': `${toBengaliNumber(ev.totalEstateBaseAreaDecimal)} শতক`,
                              'ওয়ারিশদের বণ্টন': ev.heirs
                                .map((h) => `${h.heirName} (${h.relationship}): ${h.legalShareFraction} = ${h.landEntitlementDecimalApprox} শতক`)
                                .join(' | '),
                              'তদন্ত বিশ্লেষণ': ev.investigationNotes,
                            },
                            `Faraid_${ev.eventId}`
                          )
                        }
                        className="px-2 py-1 rounded bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 font-bold text-[10px] flex items-center gap-1"
                      >
                        <Download className="w-3 h-3" />
                        <span>PDF</span>
                      </button>
                    </div>
                  </div>

                  <div className="bg-[#090d16] p-2.5 rounded border border-slate-800/80 font-mono text-[11px] text-amber-200">
                    <strong>হর নির্ধারণ সূত্র (Denominator Formula):</strong> {ev.denominatorFormula}
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="bg-[#0a0f1d] text-slate-300 border-b border-slate-800">
                          <th className="p-2 border-r border-slate-800">ওয়ারিশের নাম</th>
                          <th className="p-2 border-r border-slate-800">সম্পর্ক</th>
                          <th className="p-2 border-r border-slate-800">ফারায়েজ হিস্যা (ভগ্নাংশ)</th>
                          <th className="p-2 border-r border-slate-800">শতাংশ (%)</th>
                          <th className="p-2 border-r border-slate-800">আনুমানিক জমি (শতক)</th>
                          <th className="p-2">আইনি ব্যাখ্যা ও ১৯৬১-এর ৪ ধারা</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/80">
                        {ev.heirs.map((h, i) => (
                          <tr key={i} className="hover:bg-slate-800/30">
                            <td className="p-2 border-r border-slate-800 font-bold text-white">{h.heirName}</td>
                            <td className="p-2 border-r border-slate-800 text-slate-300">{h.relationship}</td>
                            <td className="p-2 border-r border-slate-800 font-mono font-bold text-amber-300">
                              {h.legalShareFraction}
                            </td>
                            <td className="p-2 border-r border-slate-800 font-mono text-emerald-300">
                              {toBengaliNumber(h.percentageDecimal)}%
                            </td>
                            <td className="p-2 border-r border-slate-800 font-mono font-bold text-white">
                              {toBengaliNumber(h.landEntitlementDecimalApprox)} শতক
                            </td>
                            <td className="p-2 text-slate-400 text-[11px]">{h.fractionExplanation}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <p className="text-[11px] text-slate-400 pt-1">
                    <strong className="text-slate-300">ফরেনসিক মন্তব্য:</strong> {ev.investigationNotes}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 6: SPECIAL FORENSIC REPORT — DAG 651 MISSING 80 DECIMALS */}
      {activeTab === 'dag651' && (
        <div className="space-y-4">
          <div className="bg-[#0e1526] border border-amber-500/40 rounded-xl p-5 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-3">
              <div>
                <span className="text-[11px] font-bold text-rose-400 uppercase tracking-wider bg-rose-950/60 px-2 py-0.5 rounded border border-rose-500/40">
                  Priority Investigation Report (Section 10)
                </span>
                <h3 className="text-base sm:text-lg font-bold text-white mt-1">
                  {MISSING_LAND_DAG_651_REPORT.reportTitle}
                </h3>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() =>
                    handleDownloadItemPdf(
                      MISSING_LAND_DAG_651_REPORT.reportTitle,
                      `${MISSING_LAND_DAG_651_REPORT.mouza} (JL ${MISSING_LAND_DAG_651_REPORT.jlNo}) | ৮০ শতক জমি নিখোঁজ অডিট`,
                      {
                        'রিপোর্ট শিরোনাম': MISSING_LAND_DAG_651_REPORT.reportTitle,
                        'মৌজা ও জে.এল.': `${MISSING_LAND_DAG_651_REPORT.mouza} (JL ${MISSING_LAND_DAG_651_REPORT.jlNo})`,
                        'বিষয়বস্তু দাগ': MISSING_LAND_DAG_651_REPORT.subjectDag,
                        'বিরোধীয় নিখোঁজ আয়তন': `${toBengaliNumber(MISSING_LAND_DAG_651_REPORT.disputedAreaDecimal)} শতক`,
                        'ফরেনসিক সিদ্ধান্ত': MISSING_LAND_DAG_651_REPORT.forensicConclusionCategory,
                        'সিদ্ধান্তের বিবরণ': MISSING_LAND_DAG_651_REPORT.forensicConclusionDetails,
                        'পার্সেল অবস্থান ও অনুসন্ধান': MISSING_LAND_DAG_651_REPORT.successorDagTracing.parcelDescription,
                        'তৃতীয় পক্ষ অবৈধ এন্ট্রি': MISSING_LAND_DAG_651_REPORT.successorDagTracing.thirdPartyRecordingSummary,
                        'প্রয়োজনীয় নথি': MISSING_LAND_DAG_651_REPORT.missingSupportingDocumentsRequired.join(' | '),
                      },
                      'Goali_Dag651_80Decimal_Report'
                    )
                  }
                  className="px-3 py-1.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 font-bold text-xs flex items-center gap-1.5"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download .PDF</span>
                </button>

                <button
                  onClick={() => {
                    setSelectedComparisonDag('651');
                    setActiveTab('compare');
                  }}
                  className="px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-amber-400 via-amber-300 to-yellow-400 hover:from-amber-300 hover:to-yellow-300 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow-md shadow-amber-950/40 transition-all hover:scale-[1.02] active:scale-[0.98]"
                >
                  <Split className="w-3.5 h-3.5 text-slate-950 stroke-[2.5]" />
                  <span>দাগ ৬৫১ পাশাপাশি ৫ জরিপ তুলনা দেখুন →</span>
                </button>
              </div>
            </div>

            <div className="bg-[#10192e] p-3 rounded-lg border border-slate-800 font-mono text-xs text-amber-200">
              <strong>আয়তন সমন্বয় সূত্র (Area Formula):</strong>{' '}
              Unexplained Difference = Previous Verified Area − Verified Transfers − Verified Acquisition/Loss − Current Reconciled Area
            </div>

            {/* Reconciliation Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-[#090d16] text-amber-300 border-b border-slate-800">
                    <th className="p-2.5 border-r border-slate-800">জরিপ স্তর</th>
                    <th className="p-2.5 border-r border-slate-800">খতিয়ান</th>
                    <th className="p-2.5 border-r border-slate-800">দাগ নং</th>
                    <th className="p-2.5 border-r border-slate-800">রেকর্ডীয় আয়তন (শতক)</th>
                    <th className="p-2.5 border-r border-slate-800">হস্তান্তরিত অংশ</th>
                    <th className="p-2.5 border-r border-slate-800">অমীমাংসিত উধাও জমি (শতক)</th>
                    <th className="p-2.5">ফরেনসিক বিশ্লেষণ ও প্রমাণ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80">
                  {MISSING_LAND_DAG_651_REPORT.reconciliationTable.map((r, i) => (
                    <tr key={i} className="hover:bg-slate-800/40 align-top">
                      <td className="p-2.5 border-r border-slate-800 font-bold text-amber-300">{r.survey}</td>
                      <td className="p-2.5 border-r border-slate-800 font-mono">{r.khatianNo}</td>
                      <td className="p-2.5 border-r border-slate-800 font-mono font-bold text-white">{r.dagNo}</td>
                      <td className="p-2.5 border-r border-slate-800 font-mono font-bold text-emerald-300">
                        {toBengaliNumber(r.recordedAreaDecimal)} শতক
                      </td>
                      <td className="p-2.5 border-r border-slate-800 font-mono">
                        {toBengaliNumber(r.documentedTransferDecimal)} শতক
                      </td>
                      <td className="p-2.5 border-r border-slate-800 font-mono">
                        <span
                          className={`font-bold ${
                            r.unexplainedDifferenceDecimal > 0 ? 'text-rose-400 font-mono text-sm' : 'text-slate-400'
                          }`}
                        >
                          {toBengaliNumber(r.unexplainedDifferenceDecimal)} শতক
                        </span>
                      </td>
                      <td className="p-2.5 text-slate-300 space-y-0.5">
                        <div>{r.notes}</div>
                        <span className="font-mono text-amber-300 text-[10px]">[{r.evidenceId}]</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Tracing & Conclusions Card */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
              <div className="bg-[#12192c] p-4 rounded-xl border border-slate-800 space-y-2 text-xs">
                <h4 className="font-bold text-amber-300">১. নকশা ও পরবর্তী দাগ সন্ধান (Successor-Dag Tracing):</h4>
                <p className="text-slate-300 leading-relaxed">
                  {MISSING_LAND_DAG_651_REPORT.successorDagTracing.parcelDescription}
                </p>
                <div className="text-[11px] text-slate-400 space-y-1 pt-1">
                  <div>
                    <strong>সংলগ্ন দাগসমূহ:</strong>{' '}
                    {MISSING_LAND_DAG_651_REPORT.successorDagTracing.adjacentDagsExamined.join(' | ')}
                  </div>
                  <div>
                    <strong>দাগ বিভাজন (Split):</strong> {MISSING_LAND_DAG_651_REPORT.successorDagTracing.dagSplitAnalysis}
                  </div>
                  <div className="text-rose-300 font-medium pt-1">
                    <strong>অবৈধ এন্ট্রি:</strong>{' '}
                    {MISSING_LAND_DAG_651_REPORT.successorDagTracing.thirdPartyRecordingSummary}
                  </div>
                </div>
              </div>

              <div className="bg-[#12192c] p-4 rounded-xl border border-amber-500/30 space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-white">২. ফরেনসিক চূড়ান্ত সিদ্ধান্ত (Classification):</h4>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
                    {MISSING_LAND_DAG_651_REPORT.forensicConclusionCategory}
                  </span>
                </div>
                <p className="text-slate-200 leading-relaxed">
                  {MISSING_LAND_DAG_651_REPORT.forensicConclusionDetails}
                </p>
                <div className="bg-[#090d16] p-2.5 rounded border border-slate-800 text-[11px] text-slate-400 space-y-1">
                  <strong className="text-amber-300">আদালতের জন্য বাধ্যতামূলক রিকুইজিশন:</strong>
                  <ul className="list-disc list-inside space-y-0.5 text-slate-300">
                    {MISSING_LAND_DAG_651_REPORT.missingSupportingDocumentsRequired.map((doc, idx) => (
                      <li key={idx}>{doc}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 7: THIRD-PARTY INTRUSION & FRAUD MATRIX */}
      {activeTab === 'intrusion' && (
        <div className="bg-[#0e1526] border border-slate-800 rounded-xl p-5 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-rose-400" />
                <span>তৃতীয় পক্ষ অনুপ্রবেশ ও বেআইনি রেকর্ড ম্যাট্রিক্স (Third-Party Intrusion Matrix)</span>
              </h3>
              <p className="text-xs text-slate-400">
                সফর আলী বা সিরাজ আলীর পারিবারিক স্বত্ব বহির্ভূত সকল ব্যক্তির অনুপ্রবেশ, বায়া দলিলের অভাব এবং নামজারির অনিয়ম অডিট।
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-[#090d16] text-amber-300 border-b border-slate-800">
                  <th className="p-2.5 border-r border-slate-800">Intrusion ID</th>
                  <th className="p-2.5 border-r border-slate-800">মৌজা ও দাগ</th>
                  <th className="p-2.5 border-r border-slate-800">অনুপ্রবেশকারী ব্যক্তি</th>
                  <th className="p-2.5 border-r border-slate-800">পূর্বতন মালিকানা</th>
                  <th className="p-2.5 border-r border-slate-800">দাবিকৃত স্বত্ব ও বায়া দলিল</th>
                  <th className="p-2.5 border-r border-slate-800">আইনি শ্রেণিবিভাগ</th>
                  <th className="p-2.5 text-center">ডাউনলোড</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80">
                {THIRD_PARTY_INTRUSION_MATRIX.map((i) => (
                  <tr key={i.intrusionId} className="hover:bg-slate-800/40 align-top">
                    <td className="p-2.5 border-r border-slate-800 font-mono font-bold text-amber-300">
                      {i.intrusionId}
                    </td>
                    <td className="p-2.5 border-r border-slate-800">
                      <div className="font-bold text-white">{i.mouza} (JL {i.jlNo})</div>
                      <div className="text-amber-300 font-semibold">{i.surveyPeriod} দাগ: {i.dagNo}</div>
                      <div className="text-[11px] text-emerald-300 font-bold">{i.recordedArea}</div>
                    </td>
                    <td className="p-2.5 border-r border-slate-800">
                      <div className="font-bold text-rose-300">{i.thirdPartyName}</div>
                      <div className="text-[11px] text-slate-400">পিতা: {i.thirdPartyFatherName}</div>
                      <div className="text-[10px] text-slate-400 mt-1">প্রথম উপস্থিতি: {i.firstAppearance}</div>
                    </td>
                    <td className="p-2.5 border-r border-slate-800 text-slate-300">{i.previousOwner}</td>
                    <td className="p-2.5 border-r border-slate-800 space-y-1">
                      <div className="text-white font-medium">{i.claimedTitleBasis}</div>
                      <div className="p-1.5 rounded bg-rose-950/40 border border-rose-500/30 text-rose-200 text-[11px]">
                        <strong>বায়া দলিল:</strong> {i.supportingDeedRef}
                      </div>
                      <div className="text-[11px] text-slate-400">নামজারি: {i.mutationRef}</div>
                    </td>
                    <td className="p-2.5 border-r border-slate-800">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-950/60 text-rose-200 border border-rose-500/40">
                        {i.evidenceClassification}
                      </span>
                      <div className="text-[10px] font-mono text-slate-400 mt-1">
                        {i.evidenceIds.join(', ')}
                      </div>
                    </td>
                    <td className="p-2.5 text-center whitespace-nowrap">
                      <button
                        onClick={() =>
                          handleDownloadItemPdf(
                            `Third Party Intrusion Sheet — ${i.intrusionId}`,
                            `${i.thirdPartyName} | ${i.mouza} দাগ ${i.dagNo}`,
                            {
                              'Intrusion ID': i.intrusionId,
                              'মৌজা ও জে.এল.': `${i.mouza} (JL ${i.jlNo})`,
                              'জরিপ ও দাগ': `${i.surveyPeriod} খতিয়ান ${i.khatianNo}, দাগ ${i.dagNo}`,
                              'আয়তন': i.recordedArea,
                              'অনুপ্রবেশকারী': `${i.thirdPartyName} (পিতা: ${i.thirdPartyFatherName})`,
                              'পূর্বতন বৈধ মালিক': i.previousOwner,
                              'দাবিকৃত স্বত্ব': i.claimedTitleBasis,
                              'বায়া দলিল তথ্য': i.supportingDeedRef,
                              'নামজারি নথি': i.mutationRef,
                              'দখল দাবি': i.possessionClaim,
                              'আইনি বৈপরীত্য': i.documentaryContradictionNote,
                              'শ্রেণিবিভাগ': i.evidenceClassification,
                              'এভিডেন্স আইডি': i.evidenceIds.join(', '),
                            },
                            `Intrusion_${i.intrusionId}`
                          )
                        }
                        className="px-2 py-1 rounded bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/30 text-[10px] font-bold inline-flex items-center gap-1"
                      >
                        <Download className="w-3 h-3" />
                        <span>PDF</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 8: DEVIL'S ADVOCATE & LEGAL DEFENCES (20 POINTS) */}
      {activeTab === 'defences' && (
        <div className="bg-[#0e1526] border border-slate-800 rounded-xl p-5 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Scale className="w-4 h-4 text-amber-400" />
                <span>ডেভিলস অ্যাডভোকেট: বিবাদীপক্ষের ২০টি আইনি যুক্তি ও খণ্ডন বিশ্লেষণ (Part 11 Legal Defences)</span>
              </h3>
              <p className="text-xs text-slate-400">
                বিজ্ঞ প্রতিপক্ষ আইনজীবী যে সকল আইনি ফাঁক ও আপত্তি উত্থাপন করতে পারেন, তার আগাম মূল্যায়ন এবং সুপ্রিম কোর্টের নজির দ্বারা অকাট্য জবাব।
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {DEVILS_ADVOCATE_DEFENCES.map((def) => (
              <div
                key={def.id}
                className="bg-[#111728] border border-slate-800 rounded-xl p-4 space-y-2 text-xs flex flex-col justify-between"
              >
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold text-amber-300 bg-amber-500/15 px-2 py-0.5 rounded border border-amber-500/30">
                      {def.id}: {def.defenceTopic}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                        def.riskLevel === 'HIGH'
                          ? 'bg-rose-950 text-rose-200 border-rose-500/50'
                          : def.riskLevel === 'MEDIUM'
                          ? 'bg-amber-950/80 text-amber-200 border-amber-500/50'
                          : 'bg-emerald-950 text-emerald-200 border-emerald-500/50'
                      }`}
                    >
                      ঝুঁকি: {def.riskLevel}
                    </span>
                  </div>
                  <div className="text-[11px] text-sky-300 font-mono">আইন ও ধারা: {def.relevantLawAndSection}</div>

                  <div className="bg-[#18151f] p-2.5 rounded border border-rose-500/30 text-rose-200">
                    <strong className="text-rose-300">বিবাদীর সম্ভাব্য সওয়াল:</strong> {def.opposingArgument}
                  </div>

                  <div className="bg-[#101e1a] p-2.5 rounded border border-emerald-500/30 text-emerald-200">
                    <strong className="text-emerald-300">বাদীর আইনি খণ্ডন ও জবাব:</strong> {def.claimantCounterargument}
                  </div>

                  <div className="text-[11px] text-slate-400 pt-1">
                    <strong className="text-slate-300">প্রয়োজনীয় প্রমাণাদি:</strong> {def.requiredEvidenceToRebut.join(' | ')}
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
                  <span>এখতিয়ার: {def.statutoryForumNote}</span>
                  <button
                    onClick={() =>
                      handleDownloadItemPdf(
                        `Legal Defence Sheet — ${def.id}: ${def.defenceTopic}`,
                        def.relevantLawAndSection,
                        {
                          'Defence ID': def.id,
                          'আপত্তির বিষয়বস্তু': def.defenceTopic,
                          'প্রযোজ্য আইন ও ধারা': def.relevantLawAndSection,
                          'বিবাদীর সম্ভাব্য যুক্তি': def.opposingArgument,
                          'বাদীর আইনানুগ খণ্ডন': def.claimantCounterargument,
                          'প্রয়োজনীয় প্রমাণাদি': def.requiredEvidenceToRebut.join(', '),
                          'ঝুঁকির মাত্রা': def.riskLevel,
                          'বিচারিক ফোরাম': def.statutoryForumNote,
                        },
                        `Defence_${def.id}`
                      )
                    }
                    className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-amber-300 border border-slate-700 text-[10px] font-bold flex items-center gap-1"
                  >
                    <Download className="w-3 h-3" />
                    <span>PDF</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 9: COURT-READY CIVIL PLAINT (সম্পূর্ণ দেওয়ানী আরজি) */}
      {activeTab === 'plaint' && (
        <div className="space-y-4">
          <div className="bg-[#0e1526] border border-amber-500/40 rounded-xl p-5 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
              <div>
                <span className="text-[11px] font-bold text-amber-300 bg-amber-500/20 px-2 py-0.5 rounded border border-amber-500/40">
                  Section 4 / Part 12: Court-Ready Civil Plaint
                </span>
                <h3 className="text-base sm:text-lg font-bold text-white mt-1">
                  দেওয়ানী আরজি ড্রাফট — স্বত্ব ঘোষণা ও বিআরএস সংশোধনের মোকদ্দমা
                </h3>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() =>
                    handleDownloadItemPdf(
                      COURT_READY_PLAINT_DATA.courtName,
                      `${COURT_READY_PLAINT_DATA.suitTitle} | ${COURT_READY_PLAINT_DATA.natureOfSuit}`,
                      {
                        আদালত: COURT_READY_PLAINT_DATA.courtName,
                        'মোকদ্দমার শিরোনাম': COURT_READY_PLAINT_DATA.suitTitle,
                        'মোকদ্দমার ধরন': COURT_READY_PLAINT_DATA.natureOfSuit,
                        বাদীপক্ষ: COURT_READY_PLAINT_DATA.plaintiffDetails.join('\n'),
                        বিবাদীপক্ষ: COURT_READY_PLAINT_DATA.defendantDetails.join('\n'),
                        'আরজির অনুচ্ছেদসমূহ (১-২৭)': COURT_READY_PLAINT_DATA.sections
                          .map((s) => `${s.sectionNumber}. ${s.title}: ${s.content}`)
                          .join('\n\n'),
                        'প্রার্থীত প্রতিকারসমূহ': COURT_READY_PLAINT_DATA.reliefsSought.join('\n'),
                        'তফসিলসমূহ': COURT_READY_PLAINT_DATA.schedules
                          .map((sch) => `${sch.scheduleName} — দাগ ${sch.dagNo}, আয়তন ${sch.claimedArea}`)
                          .join('\n'),
                        সত্যপাঠ: COURT_READY_PLAINT_DATA.verificationText,
                      },
                      'Court_Ready_Civil_Plaint_Goali'
                    )
                  }
                  className="px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow-md"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>আরজি প্রিন্টযোগ্য PDF ডাউনলোড</span>
                </button>
              </div>
            </div>

            {/* Plaint Header / Parties Box */}
            <div className="bg-[#12192c] p-4 rounded-xl border border-slate-800 space-y-3 text-xs leading-relaxed">
              <div className="text-center space-y-1 border-b border-slate-800 pb-2">
                <div className="font-bold text-sm text-amber-300">{COURT_READY_PLAINT_DATA.courtName}</div>
                <div className="text-slate-300 font-mono">{COURT_READY_PLAINT_DATA.suitTitle}</div>
                <div className="text-slate-400 text-[11px]">{COURT_READY_PLAINT_DATA.natureOfSuit}</div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                <div className="bg-[#0b101d] p-3 rounded-lg border border-slate-800">
                  <strong className="text-amber-300 mb-1 block">বাদীপক্ষ:</strong>
                  <ul className="list-disc list-inside space-y-1 text-slate-300">
                    {COURT_READY_PLAINT_DATA.plaintiffDetails.map((p, idx) => (
                      <li key={idx}>{p}</li>
                    ))}
                  </ul>
                </div>
                <div className="bg-[#0b101d] p-3 rounded-lg border border-slate-800">
                  <strong className="text-rose-300 mb-1 block">বিবাদীপক্ষ:</strong>
                  <ul className="list-disc list-inside space-y-1 text-slate-300">
                    {COURT_READY_PLAINT_DATA.defendantDetails.map((d, idx) => (
                      <li key={idx}>{d}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>

            {/* 27 Sections of Plaint */}
            <div className="bg-[#12192c] p-4 rounded-xl border border-slate-800 space-y-3 text-xs">
              <h4 className="font-bold text-white text-sm border-b border-slate-800 pb-2">
                মোকদ্দমার কারণ ও ঘটনার ক্রমবর্ণনা (অনুচ্ছেদ ১ হতে ২৭):
              </h4>
              <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2">
                {COURT_READY_PLAINT_DATA.sections.map((sec) => (
                  <div key={sec.sectionNumber} className="bg-[#0b101d] p-3 rounded-lg border border-slate-800 space-y-1">
                    <span className="font-bold text-amber-300">
                      অনুচ্ছেদ {toBengaliNumber(sec.sectionNumber)}. {sec.title}:
                    </span>
                    <p className="text-slate-300 leading-relaxed text-justify">{sec.content}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Plaint Property Schedules (A, B, C, D) */}
            <div className="bg-[#12192c] p-4 rounded-xl border border-slate-800 space-y-3 text-xs">
              <h4 className="font-bold text-white text-sm border-b border-slate-800 pb-2">
                নালিশি সম্পত্তির তফসিল বিবরণ (Schedules A, B, C, D):
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {COURT_READY_PLAINT_DATA.schedules.map((sch, i) => (
                  <div key={i} className="bg-[#0b101d] p-3.5 rounded-lg border border-slate-800 space-y-1.5">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-1">
                      <strong className="text-amber-300">{sch.scheduleName}</strong>
                      <span className="font-mono text-emerald-300 font-bold">{sch.claimedArea}</span>
                    </div>
                    <div className="text-slate-300 text-[11px] grid grid-cols-2 gap-1 pt-0.5">
                      <div>মৌজা: {sch.mouza} (JL {sch.jlNo})</div>
                      <div>দাগ: {sch.dagNo}</div>
                      <div>সিএস খতিয়ান: {sch.csKhatian}</div>
                      <div>এসএ খতিয়ান: {sch.saKhatian}</div>
                      <div>আরএস খতিয়ান: {sch.rsKhatian}</div>
                      <div>বিআরএস খতিয়ান: {sch.brsKhatian}</div>
                    </div>
                    <div className="bg-[#161f36] p-2 rounded text-[11px] text-slate-300 space-y-0.5">
                      <strong className="text-amber-200">চতুঃসীমা:</strong>
                      <div>উত্তরে: {sch.boundaries.north} | দক্ষিণে: {sch.boundaries.south}</div>
                      <div>পূর্বে: {sch.boundaries.east} | পশ্চিমে: {sch.boundaries.west}</div>
                    </div>
                    <div className="text-[11px] text-slate-400">
                      <strong>জমির শ্রেণি ও বর্তমান দখল:</strong> {sch.landNature} ({sch.currentPossessionStatus})
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Reliefs & Verification */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
              <div className="bg-[#12192c] p-4 rounded-xl border border-slate-800 space-y-2">
                <strong className="text-amber-300 block text-sm">প্রার্থীত প্রতিকারসমূহ (Reliefs Sought):</strong>
                <ul className="list-disc list-inside space-y-1 text-slate-300">
                  {COURT_READY_PLAINT_DATA.reliefsSought.map((rel, idx) => (
                    <li key={idx}>{rel}</li>
                  ))}
                </ul>
              </div>
              <div className="bg-[#12192c] p-4 rounded-xl border border-slate-800 space-y-2">
                <strong className="text-white block text-sm">সত্যপাঠ ও সত্যতা ঘোষণা (Verification):</strong>
                <p className="text-slate-300 leading-relaxed italic">{COURT_READY_PLAINT_DATA.verificationText}</p>
                <div className="pt-2 text-[11px] text-slate-400 border-t border-slate-800">
                  <strong>কোর্ট ফি ও মূল্যায়ন:</strong> মূল্যায়ন ২৫,০০,০০০/- টাকা; নির্ধারিত সর্বোচ্চ কোর্ট ফি ৫০,০০০/- টাকা পরিশোধিত।
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 10: 14 LITIGATION APPENDICES & REQUISITIONS */}
      {activeTab === 'appendices' && (
        <div className="space-y-4">
          <div className="bg-[#0e1526] border border-slate-800 rounded-xl p-5 space-y-4">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <FolderDown className="w-4 h-4 text-amber-400" />
                <span>১৪টি সহায়ক লিটিগেশন নথিপত্র ও রিকুইজিশন ড্রাফট (Part 10 Additional Litigation Documents)</span>
              </h3>
              <p className="text-xs text-slate-400">
                বিজ্ঞ আইনজীবীর সহায়ক ব্রিফ, সাক্ষীদের জবানবন্দি, বালাম বহি তলব, অস্থায়ী নিষেধাজ্ঞার আবেদন ও কমিশনারের প্রশ্নমালা।
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              {/* Left Column: 14 Appendices Selector */}
              <div className="space-y-1.5 max-h-[620px] overflow-y-auto pr-1">
                {LITIGATION_APPENDICES.map((app) => (
                  <button
                    key={app.appendixId}
                    onClick={() => setSelectedAppendixId(app.appendixId)}
                    className={`w-full text-left p-3 rounded-lg border transition-all text-xs flex items-center justify-between ${
                      selectedAppendixId === app.appendixId
                        ? 'bg-amber-500/20 border-amber-500 text-white shadow-md'
                        : 'bg-[#111728] border-slate-800 text-slate-300 hover:bg-slate-800/60'
                    }`}
                  >
                    <div>
                      <div className="font-mono text-[10px] text-amber-400 font-bold">
                        APPENDIX {app.appendixNumber}
                      </div>
                      <div className="font-bold text-slate-100">{app.bengaliTitle}</div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-500 shrink-0" />
                  </button>
                ))}
              </div>

              {/* Right Column: Detailed View of Selected Appendix */}
              <div className="lg:col-span-2 bg-[#12192c] border border-slate-800 rounded-xl p-5 space-y-4 text-xs">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-3">
                  <div>
                    <span className="font-mono font-bold text-amber-300 text-xs mr-2">
                      {selectedAppendix.appendixId}:
                    </span>
                    <strong className="text-white text-base">{selectedAppendix.bengaliTitle}</strong>
                    <div className="text-slate-400 text-xs mt-0.5">{selectedAppendix.title}</div>
                  </div>
                  <button
                    onClick={() =>
                      handleDownloadItemPdf(
                        `Appendix ${selectedAppendix.appendixNumber}: ${selectedAppendix.bengaliTitle}`,
                        selectedAppendix.statutoryReference,
                        {
                          'Appendix ID': selectedAppendix.appendixId,
                          'ইংরেজি শিরোনাম': selectedAppendix.title,
                          'বাংলা শিরোনাম': selectedAppendix.bengaliTitle,
                          'উদ্দেশ্য ও প্রেক্ষাপট': selectedAppendix.purpose,
                          'আইনি রেফারেন্স': selectedAppendix.statutoryReference,
                          সারসংক্ষেপ: selectedAppendix.summary,
                          'নথি বিবরণ ও অনুচ্ছেদসমূহ': selectedAppendix.contentLines.join('\n\n'),
                        },
                        `Litigation_Appendix_${selectedAppendix.appendixId}`
                      )
                    }
                    className="px-3 py-1.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 font-bold text-xs flex items-center gap-1.5"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download .PDF</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] text-slate-400 bg-[#0b101d] p-3 rounded-lg border border-slate-800">
                  <div>
                    <strong className="text-slate-200">মূল উদ্দেশ্য:</strong> {selectedAppendix.purpose}
                  </div>
                  <div>
                    <strong className="text-slate-200">আইন ও ধারা:</strong> {selectedAppendix.statutoryReference}
                  </div>
                </div>

                <div className="space-y-2">
                  <h4 className="font-bold text-amber-300 text-xs">সম্পূর্ণ ড্রাফটিং রূপরেখা ও অনুচ্ছেদসমূহ:</h4>
                  <div className="bg-[#0b101d] p-4 rounded-lg border border-slate-800 space-y-2 text-slate-200 leading-relaxed">
                    {selectedAppendix.contentLines.map((line, idx) => (
                      <div key={idx} className="flex items-start gap-2">
                        <span className="text-amber-400 font-bold mt-0.5">•</span>
                        <span>{line}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <p className="text-[11px] text-slate-400 italic">
                  * এই নথিটি সরাসরি বিজ্ঞ আইনজীবী কর্তৃক প্রিন্ট বা আদালতে দাখিলের নিমিত্তে ব্যবহার উপযোগী করে প্রস্তুতকৃত।
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
