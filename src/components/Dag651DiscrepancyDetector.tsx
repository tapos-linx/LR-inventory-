import React, { useState, useMemo, useEffect } from 'react';
import * as XLSX from 'xlsx';
import {
  AlertTriangle,
  ShieldAlert,
  Search,
  CheckCircle2,
  XCircle,
  Download,
  FileSpreadsheet,
  FileJson,
  FileText,
  RotateCcw,
  Scale,
  TrendingDown,
  Layers,
  ArrowRight,
  Filter,
  Info,
  Sparkles,
  Split,
  Eye,
  Check,
  Zap,
} from 'lucide-react';
import { LandRecord } from '../types/landRecord';
import { toBengaliNumber } from '../utils/bengaliNumerals';
import { downloadForensicReportTablePdf } from '../utils/pdfDownloadEngine';
import { exportToJSON } from '../utils/exportUtils';
import { MULTI_MOUZA_SURVEY_CHAIN_RECORDS } from '../utils/slulisEngine';

export interface Dag651DiscrepancyItem {
  id: string;
  anomalyType: 'AREA_REDUCTION' | 'OWNER_MISMATCH' | 'THIRD_PARTY_INTRUSION' | 'UNAUTHORIZED_SPLIT' | 'NAME_SPELLING_CONFLICT';
  anomalyTypeBengali: string;
  surveyStage: string;
  earlierRecord: {
    survey: string;
    khatianNo: string;
    dagNo: string;
    owner: string;
    father: string;
    areaDecimal: number;
    areaText: string;
    share: string;
  };
  laterRecord: {
    survey: string;
    khatianNo: string;
    dagNo: string;
    owner: string;
    father: string;
    areaDecimal: number;
    areaText: string;
    share: string;
  };
  areaDiscrepancyDecimal: number;
  areaDiscrepancyText: string;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM';
  rootCauseDescription: string;
  forensicEvidenceId: string;
  supportingDocStatus: string;
  statutoryViolation: string;
  recommendedLegalAction: string;
}

interface Dag651DiscrepancyDetectorProps {
  records?: LandRecord[];
  onNavigateToPlaint?: () => void;
  onNavigateToChain?: () => void;
  onSelectRecord?: (recordId: string) => void;
  isCompact?: boolean;
}

export const DAG_651_DISCREPANCY_ITEMS: Dag651DiscrepancyItem[] = [
  {
    id: 'DISC-651-001',
    anomalyType: 'AREA_REDUCTION',
    anomalyTypeBengali: 'রহস্যজনক আয়তন হ্রাস (৮০ শতক জমি নিখোঁজ)',
    surveyStage: 'সিএস (১৯১৫) → এসএ (১৯৬২)',
    earlierRecord: {
      survey: 'CS',
      khatianNo: '১১৮',
      dagNo: '৬৫১',
      owner: 'সফর আলী',
      father: 'মৃত নাজির ওরফে আলী নোয়াজ',
      areaDecimal: 320,
      areaText: '৩.২০ একর (৩২০ শতক)',
      share: '১.০০০০ (১৬ আনা একক স্বত্ব)',
    },
    laterRecord: {
      survey: 'SA',
      khatianNo: '২৪৫',
      dagNo: '৬৫১',
      owner: 'সিরাজ আলী ও কামদার আলী',
      father: 'মৃত সফর আলী',
      areaDecimal: 240,
      areaText: '২.৪০ একর (২৪০ শতক)',
      share: 'উভয়ে সমান (৮ আনা করে)',
    },
    areaDiscrepancyDecimal: -80,
    areaDiscrepancyText: '-৮০.০০ শতক (-০.৮০ একর) অমীমাংসিত কর্তন',
    severity: 'CRITICAL',
    rootCauseDescription:
      'সিএস ৩২০ শতক হতে এসএ রেকর্ডে ২৪০ শতক প্রস্তুতকালে অবশিষ্ট ৮০ শতক জমি হস্তান্তরের কোনো রেজিঃ দলিল (Deed of Transfer), অধিগ্রহণ (Land Acquisition) বা হুকুমদখল নেই। করণিক বাদ পড়া বা জরিপ ত্রুটির কারণে এটি রেকর্ডবহির্ভূত হয়েছে।',
    forensicEvidenceId: 'EVD-000001 / EVD-000002',
    supportingDocStatus: 'কোনো বৈধ দলিল বা সরকারি অধিগ্রহণ আদেশ নেই (Zero Transfer Trace)',
    statutoryViolation: 'SAT Act 1950-এর সংশ্লিষ্ট বিধিমালার পরিপন্থী করণিক বাদ পড়া।',
    recommendedLegalAction: 'বিজ্ঞ আদালতে সিএস মূল স্বত্বমূলে সম্পূরক ঘোষণার আরজি অন্তর্ভুক্তি।',
  },
  {
    id: 'DISC-651-002',
    anomalyType: 'THIRD_PARTY_INTRUSION',
    anomalyTypeBengali: 'মারাত্মক তৃতীয় পক্ষ অনুপ্রবেশ ও স্বত্বহীন জাল বিআরএস এন্ট্রি',
    surveyStage: 'আরএস (১৯৮৫) → বিআরএস (চলতি)',
    earlierRecord: {
      survey: 'RS',
      khatianNo: '৫১০',
      dagNo: '১১২৪ (সাবেক ৬৫১)',
      owner: 'ফিরুজ মিয়া গং (সিরাজ আলীর ওয়ারিশ)',
      father: 'মৃত সিরাজ আলী',
      areaDecimal: 120,
      areaText: '১.২০ একর (১২০ শতক)',
      share: '০.৫০০০ (সিরাজ আলীর অর্ধাংশ)',
    },
    laterRecord: {
      survey: 'BS/BRS',
      khatianNo: '৯০২ (অবৈধ) ও ৭৮৫',
      dagNo: '১৫৮৮ (৮০ শতক) + ১৫৮৭ (৬০ শতক)',
      owner: 'সামসুল হক, রফিকুল ইসলাম গং (অনধিকার তৃতীয় পক্ষ)',
      father: 'মৃত আব্দুর রহমান',
      areaDecimal: 80,
      areaText: '০.৮০ একর (৮০ শতক জবরদখলীয়)',
      share: 'অননুমোদিত পৃথক খতিয়ান',
    },
    areaDiscrepancyDecimal: -80,
    areaDiscrepancyText: '-৮০.০০ শতক সম্পূর্ণ বেআইনি অনুপ্রবেশ ও দখল',
    severity: 'CRITICAL',
    rootCauseDescription:
      'সিএস ৬৫১-এর নিখোঁজ ৮০ শতক জমি চিহ্নিত করে বিআরএস জরিপে যোগসাজশে নতুন বিআরএস দাগ ১৫৮৮ সৃষ্টি করে সফর আলীর বংশধরদের পরিবর্তে সম্পূর্ণ বহিরাগত তৃতীয় পক্ষ সামসুল হক গং-এর নামে অবৈধ খতিয়ান ৯০২ প্রস্তুত করা হয়েছে।',
    forensicEvidenceId: 'EVD-000004',
    supportingDocStatus: 'বিবাদীগণের কোনো পৈতৃক লিংক বা সাব-রেজিস্ট্রি ক্রয় দলিল নেই (Void Ab Initio)',
    statutoryViolation: 'ভূমি অপরাধ প্রতিরোধ ও প্রতিকার আইন ২০২৩-এর ধারা ৪, ৫ ও ৭; দণ্ডবিধি ১৮৬০-এর ৪৬৫/৪৬৭/৪৬৮ ধারা।',
    recommendedLegalAction: 'দেওয়ানী আদালতে বিআরএস খতিয়ান ৯০২ বাতিল এবং সহকারী কমিশনার (ভূমি) বরাবরে নামজারি আপত্তি।',
  },
  {
    id: 'DISC-651-003',
    anomalyType: 'OWNER_MISMATCH',
    anomalyTypeBengali: 'মালিকানা ও বংশগত হিস্যা সংকুচিতকরণ',
    surveyStage: 'আরএস (১৯৮৫) → বিআরএস (চলতি)',
    earlierRecord: {
      survey: 'RS',
      khatianNo: '৫১০',
      dagNo: '১১২৪',
      owner: 'ফিরুজ মিয়া, মোঃ জাহের মিয়া, নোয়াব মিয়া গং',
      father: 'মৃত সিরাজ আলী',
      areaDecimal: 120,
      areaText: '১.২০ একর (১২০ শতক)',
      share: '০.৫০০০',
    },
    laterRecord: {
      survey: 'BS/BRS',
      khatianNo: '৭৮৫',
      dagNo: '১৫৮৭',
      owner: 'সিরাজ আলীর ওয়ারিশগণ',
      father: 'মৃত সিরাজ আলী',
      areaDecimal: 60,
      areaText: '০.৬০ একর (৬০ শতক)',
      share: 'সংকুচিত অংশ',
    },
    areaDiscrepancyDecimal: -60,
    areaDiscrepancyText: '-৬০.০০ শতক সিরাজ আলীর বৈধ বংশীয় অংশের ক্ষতি',
    severity: 'HIGH',
    rootCauseDescription:
      'সিরাজ আলীর বৈধ উত্তরাধিকারীদের আরএস ১১২৪ দাগের ১২০ শতকের মধ্যে বিআরএস ১৫৮৭ দাগে মাত্র ৬০ শতক রেকর্ড হয়েছে, অবশিষ্ট ৬০ শতক সংলগ্ন দাগে অননুমোদিতভাবে কর্তন করা হয়েছে।',
    forensicEvidenceId: 'EVD-000003 / EVD-000004',
    supportingDocStatus: 'ওয়ারিশদের কোনো বিক্রয় বা এওয়াজ দলিল নেই',
    statutoryViolation: 'মুসলিম উত্তরাধিকার ফারায়েজ ও প্রজাস্বত্ব বিধিমালার লংঘন।',
    recommendedLegalAction: 'সাবেক ১১২৪ দাগের পূর্ণাঙ্গ ১২০ শতক জমি পুনরুদ্ধারের স্বত্ব ঘোষণার প্রতিকার।',
  },
  {
    id: 'DISC-651-004',
    anomalyType: 'UNAUTHORIZED_SPLIT',
    anomalyTypeBengali: 'বাটোয়ারা দলিলবিহীন দাগ বিভাজন (Unregistered Dag Partition)',
    surveyStage: 'এসএ (১৯৬২) → আরএস (১৯৮৫)',
    earlierRecord: {
      survey: 'SA',
      khatianNo: '২৪৫',
      dagNo: '৬৫১',
      owner: 'সিরাজ আলী ও কামদার আলী',
      father: 'মৃত সফর আলী',
      areaDecimal: 240,
      areaText: '২.৪০ একর (২৪০ শতক)',
      share: '১.০০০০ (এজমালি)',
    },
    laterRecord: {
      survey: 'RS',
      khatianNo: '৫১০ ও ৫১১',
      dagNo: '১১২৪ (১২০ শতক) ও ১১২৬ (১২০ শতক)',
      owner: 'সিরাজ আলীর ওয়ারিশ বনাম কামদার আলী শাখা',
      father: 'মৃত সফর আলী বংশ',
      areaDecimal: 240,
      areaText: '২.৪০ একর (২৪০ শতক)',
      share: 'পৃথক আরএস দাগ সৃষ্টি',
    },
    areaDiscrepancyDecimal: 0,
    areaDiscrepancyText: '০.০০ শতক নিট (তবে বাটোয়ারা দলিল নেই)',
    severity: 'MEDIUM',
    rootCauseDescription:
      'এসএ ৬৫০ দাগের ২৪০ শতক জমি আরএস জরিপে দুই ভাইয়ের নামে ১১২৪ ও ১১২৬ দাগে বিভক্ত হয়। আয়তন মিল থাকলেও কোনো রেজিঃ বাটোয়ারা দলিল (Registered Partition Deed) বা দেওয়ানী আদালতের বাটোয়ারা ডিক্রি পাওয়া যায়নি।',
    forensicEvidenceId: 'EVD-000003',
    supportingDocStatus: 'পারিবারিক মৌখিক আপোষ বণ্টন (Amicable Family Arrangement)',
    statutoryViolation: 'রেজিস্ট্রেশন আইন ১৯০৮-এর ১৭ ধারার আওতায় লিখিত বাটোয়ারা রেজিস্ট্রেশনের ঘাটতি।',
    recommendedLegalAction: 'আরজিতে পারিবারিক মৌখিক আপোষ বণ্টনের দীর্ঘমেয়াদী দখলীয় স্বীকৃতির প্রমাণ উপস্থাপন।',
  },
  {
    id: 'DISC-651-005',
    anomalyType: 'NAME_SPELLING_CONFLICT',
    anomalyTypeBengali: 'পিতা ও পূর্বপুরুষের নাম রূপভেদ সংক্রান্ত বিবাদ ঝুঁকি',
    surveyStage: 'সিএস (১৯১৫) বনাম এসএ (১৯৬২) বনাম জাতীয় পরিচয়পত্র',
    earlierRecord: {
      survey: 'CS',
      khatianNo: '১১৮',
      dagNo: '৬৫১',
      owner: 'সফর আলী (Sofor Ali / Chhafor Ali)',
      father: 'মৃত নাজির ওরফে আলী নোয়াজ',
      areaDecimal: 320,
      areaText: '৩২০ শতক',
      share: '১.০০০০',
    },
    laterRecord: {
      survey: 'SA & NID',
      khatianNo: '২৪৫',
      dagNo: '৬৫১',
      owner: 'সিরাজ আলী (Siraj Ali / Chhiraj Ali)',
      father: 'মৃত সফর আলী',
      areaDecimal: 240,
      areaText: '২৪০ শতক',
      share: '০.৫০০০',
    },
    areaDiscrepancyDecimal: 0,
    areaDiscrepancyText: 'বানান রূপভেদজনিত আইনি প্রতিরক্ষা প্রয়োজন',
    severity: 'MEDIUM',
    rootCauseDescription:
      'সিএস রেকর্ডে "নাজির ওরফে আলী নোয়াজ", এসএ রেকর্ডে "সফর আলী" এবং ওয়ারিশ সনদে নামের সামান্য বানান ভিন্নতা প্রতিপক্ষ কর্তৃক ভিন্ন ব্যক্তি বলে দাবি করার ঝুঁকি তৈরি করে।',
    forensicEvidenceId: 'EVD-000001 / DISC-010',
    supportingDocStatus: 'স্থানীয় ইউপি চেয়ারম্যানের এক ও অভিন্ন ব্যক্তি প্রত্যয়নপত্র আবশ্যক',
    statutoryViolation: 'আইনগত লংঘন নয়, তবে সাক্ষ্য আইন ১৮৭২-এর বিধানমতে শনাক্তকরণ জরুরি।',
    recommendedLegalAction: 'আরজিতে ব্যক্তি শনাক্তকরণের স্পষ্ট এন্ট্রি ও ডাকনাম/উপনামের দ্ব্যর্থহীন ঘোষণা।',
  },
];

export const Dag651DiscrepancyDetector: React.FC<Dag651DiscrepancyDetectorProps> = ({
  records = [],
  onNavigateToPlaint,
  onNavigateToChain,
  onSelectRecord,
  isCompact = false,
}) => {
  const [isScanning, setIsScanning] = useState(false);
  const [lastScannedTime, setLastScannedTime] = useState<string>('স্বয়ংক্রিয় স্ক্যান সক্রিয়');
  const [filterSeverity, setFilterSeverity] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isExporting, setIsExporting] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(DAG_651_DISCREPANCY_ITEMS[0].id);

  // Trigger Scanner Simulation
  const handleRunScan = () => {
    setIsScanning(true);
    setTimeout(() => {
      setIsScanning(false);
      setLastScannedTime(new Date().toLocaleTimeString('bn-BD'));
    }, 600);
  };

  // Filtered Items
  const filteredDiscrepancies = useMemo(() => {
    return DAG_651_DISCREPANCY_ITEMS.filter((item) => {
      if (filterSeverity !== 'ALL' && item.severity !== filterSeverity) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = item.anomalyTypeBengali.toLowerCase().includes(q);
        const matchCause = item.rootCauseDescription.toLowerCase().includes(q);
        const matchOwner =
          item.earlierRecord.owner.toLowerCase().includes(q) ||
          item.laterRecord.owner.toLowerCase().includes(q);
        const matchStage = item.surveyStage.toLowerCase().includes(q);
        return matchTitle || matchCause || matchOwner || matchStage;
      }
      return true;
    });
  }, [filterSeverity, searchQuery]);

  // Metric Totals
  const totalCount = DAG_651_DISCREPANCY_ITEMS.length;
  const criticalCount = DAG_651_DISCREPANCY_ITEMS.filter((d) => d.severity === 'CRITICAL').length;
  const highCount = DAG_651_DISCREPANCY_ITEMS.filter((d) => d.severity === 'HIGH').length;
  const mediumCount = DAG_651_DISCREPANCY_ITEMS.filter((d) => d.severity === 'MEDIUM').length;
  const totalMissingDecimal = 80;

  // Export to PDF
  const handleExportPdf = async () => {
    if (isExporting) return;
    setIsExporting(true);
    try {
      const rows = filteredDiscrepancies.map((d, idx) => ({
        sl: toBengaliNumber(idx + 1),
        type: d.anomalyTypeBengali,
        stage: d.surveyStage,
        earlier: `${d.earlierRecord.survey} খতিয়ান ${d.earlierRecord.khatianNo}, দাগ ${d.earlierRecord.dagNo} (${d.earlierRecord.owner}) = ${d.earlierRecord.areaText}`,
        later: `${d.laterRecord.survey} খতিয়ান ${d.laterRecord.khatianNo}, দাগ ${d.laterRecord.dagNo} (${d.laterRecord.owner}) = ${d.laterRecord.areaText}`,
        delta: d.areaDiscrepancyText,
        cause: d.rootCauseDescription,
        severity: d.severity,
        remedy: d.recommendedLegalAction,
      }));

      await downloadForensicReportTablePdf({
        reportTitle: 'দাগ ৬৫১: স্বয়ংক্রিয় অসঙ্গতি ও জমি লোপাট ডিটেক্টর রিপোর্ট',
        reportSubtitle: 'গোয়ালী মৌজা (জেএল ৮৪) | সিএস ৩২০ শতক হতে বিআরএস-এ ৮০ শতক জমি বেদখল অডিট',
        headers: [
          { key: 'sl', label: 'ক্র.', width: 60 },
          { key: 'type', label: 'গরমিলের ধরণ', width: 200 },
          { key: 'stage', label: 'জরিপ পর্যায়', width: 160 },
          { key: 'earlier', label: 'পূর্ববর্তী রেকর্ডীয় দাবি', width: 250 },
          { key: 'later', label: 'পরবর্তী বিতর্কিত রেকর্ড', width: 250 },
          { key: 'delta', label: 'আয়তন গরমিল', width: 170 },
          { key: 'severity', label: 'ঝুঁকি স্তর', width: 120 },
          { key: 'cause', label: 'ফরেনসিক বিশ্লেষণ ও কারণ', width: 330 },
          { key: 'remedy', label: 'আইনি প্রতিকার', width: 250 },
        ],
        rows,
        fileNamePrefix: 'Dag651_Discrepancy_Detector_Alert',
      });
    } finally {
      setIsExporting(false);
    }
  };

  // Export to Excel
  const handleExportExcel = () => {
    const data = filteredDiscrepancies.map((d, idx) => ({
      ক্রমিক: idx + 1,
      'গরমিল আইডি': d.id,
      'গরমিলের ধরণ': d.anomalyTypeBengali,
      'জরিপ পর্যায়': d.surveyStage,
      'পূর্ববর্তী জরিপ রেকর্ড': `${d.earlierRecord.survey} খতিয়ান ${d.earlierRecord.khatianNo}, দাগ ${d.earlierRecord.dagNo} (${d.earlierRecord.owner})`,
      'পূর্ববর্তী আয়তন': d.earlierRecord.areaText,
      'পরবর্তী জরিপ রেকর্ড': `${d.laterRecord.survey} খতিয়ান ${d.laterRecord.khatianNo}, দাগ ${d.laterRecord.dagNo} (${d.laterRecord.owner})`,
      'পরবর্তী আয়তন': d.laterRecord.areaText,
      'আয়তন পার্থক্য': d.areaDiscrepancyText,
      'সতর্কতা স্তর': d.severity,
      'ফরেনসিক বিবরণ ও মূল কারণ': d.rootCauseDescription,
      'দলিলগত ভিত্তি': d.supportingDocStatus,
      'আইনগত লংঘন': d.statutoryViolation,
      'প্রস্তাবিত দেওয়ানী প্রতিকার': d.recommendedLegalAction,
      'এভিডেন্স আইডি': d.forensicEvidenceId,
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Dag651_Discrepancies');
    XLSX.writeFile(
      wb,
      `Dag651_Discrepancy_Audit_Alerts_${new Date().toISOString().slice(0, 10)}.xlsx`
    );
  };

  return (
    <section className="bg-gradient-to-r from-[#170f1a] via-[#1c1221] to-[#141b2e] border-2 border-rose-500/60 rounded-xl p-4 sm:p-5 shadow-2xl font-bengali space-y-4 relative overflow-hidden">
      {/* Background Accent Glow */}
      <div className="absolute -right-20 -top-20 w-80 h-80 bg-rose-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header Bar */}
      <div className="relative z-10 flex flex-wrap items-center justify-between gap-3 border-b border-rose-500/20 pb-3.5">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-rose-500 via-red-600 to-amber-600 flex items-center justify-center text-white shadow-lg shadow-rose-950/70 shrink-0 ring-2 ring-rose-400/50">
            <ShieldAlert className="w-6 h-6 stroke-[2.2]" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[11px] font-bold uppercase tracking-wider text-rose-300 bg-rose-950/80 border border-rose-500/50 px-2 py-0.5 rounded flex items-center gap-1">
                <Zap className="w-3 h-3 text-amber-400" />
                <span>Forensic Discrepancy Detector</span>
              </span>
              <span className="text-[11px] bg-red-500/20 text-red-300 border border-red-500/40 px-2 py-0.5 rounded font-mono font-bold">
                দাগ ৬৫১ (৮০ শতক লোপাট ও তৃতীয় পক্ষ জাল রেকর্ড)
              </span>
            </div>
            <h2 className="text-base sm:text-lg font-bold text-white mt-0.5">
              দাগ ৬৫১ স্বয়ংক্রিয় অসঙ্গতি ও গরমিল ডিটেক্টর (Automated Inconsistency Flagging)
            </h2>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleRunScan}
            disabled={isScanning}
            className="px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-rose-600 via-rose-500 to-amber-500 hover:from-rose-500 hover:to-amber-400 text-white font-bold text-xs shadow-md flex items-center gap-1.5 transition-all active:scale-[0.98]"
          >
            <RotateCcw className={`w-3.5 h-3.5 ${isScanning ? 'animate-spin' : ''}`} />
            <span>{isScanning ? 'স্ক্যান হচ্ছে...' : 'পুনরায় স্বয়ংক্রিয় স্ক্যান'}</span>
          </button>

          <button
            onClick={handleExportPdf}
            disabled={isExporting}
            className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-emerald-300 border border-emerald-500/40 font-bold text-xs flex items-center gap-1.5 shadow-sm"
          >
            <Download className="w-3.5 h-3.5" />
            <span>PDF রিপোর্ট</span>
          </button>

          <button
            onClick={handleExportExcel}
            className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>এক্সেল (.xlsx)</span>
          </button>

          <button
            onClick={() =>
              exportToJSON(
                {
                  scanSubject: 'Dag 651 Discrepancy Detector',
                  totalDiscrepancies: totalCount,
                  totalMissingDecimal,
                  items: DAG_651_DISCREPANCY_ITEMS,
                },
                'Dag651_Discrepancy_Detector_Data'
              )
            }
            className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 text-xs font-semibold flex items-center gap-1"
          >
            <FileJson className="w-3 h-3 text-amber-400" />
            <span>JSON</span>
          </button>
        </div>
      </div>

      {/* Metric Counters & Real-Time Finding Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 text-xs">
        <div className="bg-[#12182b] border border-rose-500/30 rounded-lg p-2.5 space-y-0.5">
          <span className="text-[11px] text-slate-400">মোট চিহ্নিত গরমিল</span>
          <div className="text-lg font-bold text-rose-300 font-mono">
            {toBengaliNumber(totalCount)} টি
          </div>
          <div className="text-[10px] text-slate-400">সর্বমোট ৫টি জরিপ ধাপ স্ক্যান</div>
        </div>

        <div className="bg-rose-950/40 border border-rose-500/50 rounded-lg p-2.5 space-y-0.5">
          <span className="text-[11px] text-rose-300 font-semibold">মারাত্মক ঝুঁকি (Critical)</span>
          <div className="text-lg font-bold text-rose-400 font-mono">
            {toBengaliNumber(criticalCount)} টি
          </div>
          <div className="text-[10px] text-rose-300/80">৮০ শতক লোপাট ও বেদখল</div>
        </div>

        <div className="bg-amber-950/30 border border-amber-500/40 rounded-lg p-2.5 space-y-0.5">
          <span className="text-[11px] text-amber-300 font-semibold">উচ্চ সতর্কতা (High)</span>
          <div className="text-lg font-bold text-amber-400 font-mono">
            {toBengaliNumber(highCount)} টি
          </div>
          <div className="text-[10px] text-slate-400">মালিকানা অংশ সংকুচিতকরণ</div>
        </div>

        <div className="bg-[#111928] border border-slate-800 rounded-lg p-2.5 space-y-0.5">
          <span className="text-[11px] text-slate-400">মাঝারি স্তরের অসঙ্গতি</span>
          <div className="text-lg font-bold text-slate-200 font-mono">
            {toBengaliNumber(mediumCount)} টি
          </div>
          <div className="text-[10px] text-slate-400">বাটোয়ারা ও নাম রূপভেদ</div>
        </div>

        <div className="bg-red-950/50 border border-red-500/60 rounded-lg p-2.5 space-y-0.5">
          <span className="text-[11px] text-red-300 font-semibold">মোট নিখোঁজ জমি</span>
          <div className="text-lg font-bold text-red-400 font-mono">
            {toBengaliNumber(totalMissingDecimal)} শতক
          </div>
          <div className="text-[10px] text-red-200 font-semibold">বিআরএস ১৫৮৮ দাগে উধাও</div>
        </div>
      </div>

      {/* Filter and Search Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-2.5 pt-1">
        <div className="flex flex-wrap items-center gap-1.5 text-xs">
          <span className="text-slate-400 font-semibold flex items-center gap-1">
            <Filter className="w-3 h-3 text-amber-400" />
            <span>ফিল্টার:</span>
          </span>

          {[
            { id: 'ALL', label: `সকল গরমিল (${toBengaliNumber(totalCount)})` },
            { id: 'CRITICAL', label: `মারাত্মক (${toBengaliNumber(criticalCount)})`, color: 'text-rose-400' },
            { id: 'HIGH', label: `উচ্চ সতর্কতা (${toBengaliNumber(highCount)})`, color: 'text-amber-300' },
            { id: 'MEDIUM', label: `মাঝারি (${toBengaliNumber(mediumCount)})`, color: 'text-slate-300' },
          ].map((btn) => (
            <button
              key={btn.id}
              onClick={() => setFilterSeverity(btn.id)}
              className={`px-2.5 py-1 rounded-md text-xs font-bold transition-all ${
                filterSeverity === btn.id
                  ? 'bg-rose-500 text-white shadow'
                  : 'bg-[#12192c] text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              {btn.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
            <input
              type="text"
              placeholder="গরমিলের ধরণ বা কারণ খুঁজুন..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 pr-3 py-1.5 bg-[#090d16] border border-slate-700 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-rose-400 w-52 sm:w-64 font-bengali"
            />
          </div>
          <span className="text-[11px] text-slate-400 hidden md:inline">
            সর্বশেষ স্ক্যান: <strong className="text-slate-200">{lastScannedTime}</strong>
          </span>
        </div>
      </div>

      {/* HIGHLIGHTED ALERT TABLE */}
      <div className="overflow-x-auto rounded-xl border border-rose-500/40 bg-[#0c111e] shadow-inner">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-[#19101d] text-rose-300 border-b border-rose-500/30">
              <th className="p-3 border-r border-slate-800/80 font-bold">ক্র. ও আইডি</th>
              <th className="p-3 border-r border-slate-800/80 font-bold">গরমিলের ধরণ ও পর্যায়</th>
              <th className="p-3 border-r border-slate-800/80 font-bold">পূর্ববর্তী যাচাইকৃত রেকর্ড</th>
              <th className="p-3 border-r border-slate-800/80 font-bold">পরবর্তী বিতর্কিত রেকর্ড</th>
              <th className="p-3 border-r border-slate-800/80 font-bold">আয়তন তারতম্য (Delta)</th>
              <th className="p-3 border-r border-slate-800/80 font-bold">সতর্কতা স্তর</th>
              <th className="p-3 font-bold text-center">বিশ্লেষণ ও বিস্তারিত</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/80">
            {filteredDiscrepancies.map((item, idx) => {
              const isExpanded = expandedId === item.id;
              const isCritical = item.severity === 'CRITICAL';
              const isHigh = item.severity === 'HIGH';

              return (
                <React.Fragment key={item.id}>
                  <tr
                    className={`transition-colors cursor-pointer ${
                      isExpanded
                        ? 'bg-rose-950/30 border-l-4 border-l-rose-500'
                        : isCritical
                        ? 'hover:bg-rose-950/20 bg-rose-950/10'
                        : 'hover:bg-slate-800/40'
                    }`}
                    onClick={() => setExpandedId(isExpanded ? null : item.id)}
                  >
                    <td className="p-3 border-r border-slate-800/80 align-top">
                      <div className="font-mono font-bold text-amber-300">{item.id}</div>
                      <span className="text-[10px] text-slate-400 font-mono">#{idx + 1}</span>
                    </td>

                    <td className="p-3 border-r border-slate-800/80 align-top max-w-[240px]">
                      <div className="font-bold text-white leading-tight flex items-center gap-1.5">
                        {isCritical && <AlertTriangle className="w-3.5 h-3.5 text-rose-400 shrink-0" />}
                        <span>{item.anomalyTypeBengali}</span>
                      </div>
                      <div className="text-[11px] text-amber-300 font-mono mt-1 flex items-center gap-1">
                        <span>{item.surveyStage}</span>
                      </div>
                    </td>

                    <td className="p-3 border-r border-slate-800/80 align-top max-w-[230px]">
                      <div className="font-semibold text-slate-200">
                        {item.earlierRecord.survey} খতিয়ান {item.earlierRecord.khatianNo}, দাগ {item.earlierRecord.dagNo}
                      </div>
                      <div className="text-[11px] text-slate-400">
                        মালিক: <strong className="text-white">{item.earlierRecord.owner}</strong>
                      </div>
                      <div className="text-[11px] text-emerald-400 font-mono mt-0.5">
                        {item.earlierRecord.areaText} ({item.earlierRecord.share})
                      </div>
                    </td>

                    <td className="p-3 border-r border-slate-800/80 align-top max-w-[230px]">
                      <div className="font-semibold text-slate-200">
                        {item.laterRecord.survey} খতিয়ান {item.laterRecord.khatianNo}, দাগ {item.laterRecord.dagNo}
                      </div>
                      <div className="text-[11px] text-slate-400">
                        মালিক:{' '}
                        <strong className={item.anomalyType === 'THIRD_PARTY_INTRUSION' ? 'text-rose-400' : 'text-white'}>
                          {item.laterRecord.owner}
                        </strong>
                      </div>
                      <div className="text-[11px] text-rose-300 font-mono mt-0.5">
                        {item.laterRecord.areaText}
                      </div>
                    </td>

                    <td className="p-3 border-r border-slate-800/80 align-top whitespace-nowrap">
                      <div
                        className={`font-mono font-bold text-xs ${
                          item.areaDiscrepancyDecimal < 0
                            ? 'text-rose-400 bg-rose-950/70 border border-rose-500/40 px-2 py-0.5 rounded'
                            : 'text-emerald-400 bg-emerald-950/40 border border-emerald-500/30 px-2 py-0.5 rounded'
                        }`}
                      >
                        {item.areaDiscrepancyText}
                      </div>
                      <div className="text-[10px] text-slate-400 mt-1">
                        এভিডেন্স: {item.forensicEvidenceId}
                      </div>
                    </td>

                    <td className="p-3 border-r border-slate-800/80 align-top text-center whitespace-nowrap">
                      <span
                        className={`px-2 py-1 rounded text-[10px] font-bold border inline-flex items-center gap-1 ${
                          isCritical
                            ? 'bg-rose-500/20 text-rose-300 border-rose-500/50 shadow-sm'
                            : isHigh
                            ? 'bg-amber-500/20 text-amber-300 border-amber-500/50'
                            : 'bg-slate-800 text-slate-300 border-slate-700'
                        }`}
                      >
                        {isCritical ? (
                          <AlertTriangle className="w-3 h-3 text-rose-400" />
                        ) : isHigh ? (
                          <ShieldAlert className="w-3 h-3 text-amber-400" />
                        ) : (
                          <Info className="w-3 h-3 text-slate-400" />
                        )}
                        <span>{item.severity}</span>
                      </span>
                    </td>

                    <td className="p-3 text-center align-top whitespace-nowrap">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setExpandedId(isExpanded ? null : item.id);
                        }}
                        className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-amber-300 border border-slate-700 font-bold text-[11px] inline-flex items-center gap-1 transition-colors"
                      >
                        <Eye className="w-3 h-3" />
                        <span>{isExpanded ? 'সংক্ষেপ' : 'বিস্তারিত'}</span>
                      </button>
                    </td>
                  </tr>

                  {/* Expanded Forensic Detail Drawer */}
                  {isExpanded && (
                    <tr className="bg-[#12182b] border-b border-slate-800">
                      <td colSpan={7} className="p-4 space-y-3 text-xs">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                          <div className="bg-[#0b101c] p-3 rounded-lg border border-slate-800 space-y-1">
                            <span className="text-[11px] font-bold text-amber-300 flex items-center gap-1">
                              <Info className="w-3 h-3" />
                              <span>ফরেনসিক অনুসন্ধান ও কারণ:</span>
                            </span>
                            <p className="text-slate-200 leading-relaxed">
                              {item.rootCauseDescription}
                            </p>
                          </div>

                          <div className="bg-[#0b101c] p-3 rounded-lg border border-slate-800 space-y-1">
                            <span className="text-[11px] font-bold text-rose-300 flex items-center gap-1">
                              <ShieldAlert className="w-3 h-3" />
                              <span>দলিলগত ভিত্তি ও আইনগত লংঘন:</span>
                            </span>
                            <div className="text-slate-300">
                              <strong className="text-slate-200">দলিল স্থিতি:</strong> {item.supportingDocStatus}
                            </div>
                            <div className="text-rose-300 pt-0.5">
                              <strong className="text-slate-200">লংঘিত আইন:</strong> {item.statutoryViolation}
                            </div>
                          </div>

                          <div className="bg-[#0b101c] p-3 rounded-lg border border-slate-800 space-y-1">
                            <span className="text-[11px] font-bold text-emerald-300 flex items-center gap-1">
                              <Scale className="w-3 h-3" />
                              <span>প্রস্তাবিত দেওয়ানী প্রতিকার:</span>
                            </span>
                            <p className="text-slate-200 leading-relaxed">
                              {item.recommendedLegalAction}
                            </p>
                            {onNavigateToPlaint && (
                              <button
                                onClick={onNavigateToPlaint}
                                className="mt-2 px-2.5 py-1 bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold rounded text-[10px] inline-flex items-center gap-1 transition-colors"
                              >
                                <Scale className="w-3 h-3" />
                                <span>কোর্ট আরজি তপশিল "ক" দেখুন →</span>
                              </button>
                            )}
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Summary Footer Note */}
      <div className="bg-[#0b101d] p-3 rounded-lg border border-slate-800/80 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-300">
        <div className="flex items-center gap-2">
          <Info className="w-4 h-4 text-amber-400 shrink-0" />
          <span>
            <strong>ডিটেক্টর সারসংক্ষেপ:</strong> সাবেক সিএস ৬৫১ দাগের মূল ৩২০ শতক হতে মোট ৮০ শতক জমি এসএ ও বিআরএস পর্যায়ে কোনো হস্তান্তর দলিল ব্যতীত বাদ পড়েছে এবং বিআরএস ১৫৮৮ দাগে অনধিকার তৃতীয় পক্ষ সামসুল হক গং-এর নামে লিপিবদ্ধ হয়েছে।
          </span>
        </div>

        {onNavigateToChain && (
          <button
            onClick={onNavigateToChain}
            className="px-3 py-1 bg-[#1a2542] hover:bg-[#25355e] border border-amber-500/40 text-amber-300 font-bold rounded text-xs flex items-center gap-1 transition-colors"
          >
            <Split className="w-3 h-3" />
            <span>পাশাপাশি ৫ জরিপ তুলনা ভিউ খুলুন →</span>
          </button>
        )}
      </div>
    </section>
  );
};
