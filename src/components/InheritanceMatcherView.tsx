import React, { useMemo, useState } from 'react';
import {
  Users,
  FileCheck2,
  Printer,
  FileSpreadsheet,
  ArrowLeft,
  CheckCircle2,
  Download,
  Search,
  Layers,
  UserCheck,
  FileText,
  FileJson,
  Loader2,
  Eye,
  Image as ImageIcon,
  X,
  AlertCircle,
} from 'lucide-react';
import { DynamicColumn, LandRecord } from '../types/landRecord';
import {
  PROVIDED_WARISH_CERTIFICATES,
  WarishCertificate,
  matchLandRecordsWithInheritance,
  convertMatchedListToLandRecords,
} from '../utils/inheritanceData';
import { toBengaliNumber, parseAcreValue } from '../utils/bengaliNumerals';
import {
  exportToCSV,
  exportToExcel,
  exportToJSON,
  exportWarishCertificatesToExcel,
} from '../utils/exportUtils';
import {
  downloadForensicReportTablePdf,
  downloadMatchedInheritancePdf,
} from '../utils/pdfDownloadEngine';

interface InheritanceMatcherViewProps {
  records: LandRecord[];
  columns: DynamicColumn[];
  onBack: () => void;
  onApplyMatchedListToLedger: (matchedRecords: LandRecord[], openPrintAfter?: boolean) => void;
  embedded?: boolean;
}

export const InheritanceMatcherView: React.FC<InheritanceMatcherViewProps> = ({
  records,
  columns,
  onBack,
  onApplyMatchedListToLedger,
  embedded = false,
}) => {
  const [matchMode, setMatchMode] = useState<'all' | 'strict'>('all');
  const [selectedCertId, setSelectedCertId] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [previewCertificate, setPreviewCertificate] = useState<WarishCertificate | null>(null);
  const [showAllScansGallery, setShowAllScansGallery] = useState<boolean>(false);
  const [appliedBanner, setAppliedBanner] = useState<string | null>(null);
  const [isDownloadingPdf, setIsDownloadingPdf] = useState<boolean>(false);

  // Generate the matched list from the current land records + 8 uploaded certificates
  const allMatchedList = useMemo(() => {
    return matchLandRecordsWithInheritance(
      records,
      PROVIDED_WARISH_CERTIFICATES,
      matchMode === 'strict'
    );
  }, [records, matchMode]);

  // Filter by selected certificate and search term
  const filteredMatchedList = useMemo(() => {
    return allMatchedList.filter((item) => {
      if (selectedCertId !== 'all' && item.matchedCertificate.id !== selectedCertId) {
        return false;
      }
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase().trim();
        const inOwner = item.landRecord.ownerDetails.toLowerCase().includes(q);
        const inDeceased = item.matchedCertificate.deceasedName.toLowerCase().includes(q);
        const inCertNo = item.matchedCertificate.certificateNo.toLowerCase().includes(q);
        const inMouza = item.landRecord.mouza.toLowerCase().includes(q);
        const inKhatian = item.landRecord.khatianNo.toLowerCase().includes(q);
        const inDag = item.landRecord.dagNo.toLowerCase().includes(q);
        const inHeirs = item.matchedCertificate.heirs.some(
          (h) =>
            h.name.toLowerCase().includes(q) ||
            h.nidOrBirthReg.toLowerCase().includes(q)
        );
        return inOwner || inDeceased || inCertNo || inMouza || inKhatian || inDag || inHeirs;
      }
      return true;
    });
  }, [allMatchedList, selectedCertId, searchTerm]);

  const totalHeirsCount = useMemo(
    () => PROVIDED_WARISH_CERTIFICATES.reduce((sum, c) => sum + c.heirs.length, 0),
    []
  );

  const totalMatchedAcre = useMemo(
    () => filteredMatchedList.reduce((sum, item) => sum + parseAcreValue(item.landRecord.area), 0),
    [filteredMatchedList]
  );

  const directNameMatchCount = useMemo(
    () =>
      allMatchedList.filter(
        (m) =>
          m.matchType === 'exact_ancestor' ||
          m.matchType === 'heir_match' ||
          m.matchType === 'lineage_chain'
      ).length,
    [allMatchedList]
  );

  // Convert the filtered matched rows into enriched LandRecord[]
  const buildEnrichedRecords = (): LandRecord[] => {
    return convertMatchedListToLandRecords(filteredMatchedList);
  };

  const handleLoadIntoLedger = (openPrintAfter = false) => {
    const enriched = buildEnrichedRecords();
    onApplyMatchedListToLedger(enriched, openPrintAfter);
    if (!openPrintAfter) {
      setAppliedBanner(
        `আপলোডকৃত ৮টি সনদের সাথে ম্যাচকৃত ${toBengaliNumber(enriched.length)} টি ওয়ারিশ-খতিয়ান রেকর্ড মাস্টার লেজারে সফলভাবে যুক্ত করা হয়েছে!`
      );
      setTimeout(() => setAppliedBanner(null), 6000);
    }
  };

  const handleExportMatchedExcel = () => {
    const enriched = buildEnrichedRecords();
    const extraKeys = [
      'ওয়ারিশ সনদ নং',
      'সনদের ধরন',
      'মৃত পূর্বসূরি',
      'জীবিত ওয়ারিশ সংখ্যা',
      'ওয়ারিশ প্রতি গড় অংশ',
    ];
    const exportCols: DynamicColumn[] = [
      ...columns,
      ...extraKeys
        .filter((k) => !columns.some((c) => c.id === k))
        .map((k, idx) => ({
          id: k,
          label: k,
          visible: true,
          order: columns.length + idx + 1,
          type: 'text' as const,
          isExtra: true,
        })),
    ];
    exportToExcel(enriched, exportCols, 'LR_Warish_Matched_New_List');
  };

  const handleExportMatchedCsv = () => {
    const enriched = buildEnrichedRecords();
    const extraKeys = [
      'ওয়ারিশ সনদ নং',
      'সনদের ধরন',
      'মৃত পূর্বসূরি',
      'জীবিত ওয়ারিশ সংখ্যা',
      'ওয়ারিশ প্রতি গড় অংশ',
    ];
    const exportCols: DynamicColumn[] = [
      ...columns,
      ...extraKeys
        .filter((k) => !columns.some((c) => c.id === k))
        .map((k, idx) => ({
          id: k,
          label: k,
          visible: true,
          order: columns.length + idx + 1,
          type: 'text' as const,
          isExtra: true,
        })),
    ];
    exportToCSV(enriched, exportCols, 'LR_Warish_Matched_New_List');
  };

  const handleExportMatchedJson = () => {
    exportToJSON(
      {
        generatedAt: new Date().toISOString(),
        totalUploadedCertificates: PROVIDED_WARISH_CERTIFICATES.length,
        totalExtractedHeirs: totalHeirsCount,
        totalMatchedRecords: filteredMatchedList.length,
        matchedItems: filteredMatchedList,
      },
      'LR_Warish_Matched_New_List'
    );
  };

  const handleDownloadWarishDirectoryPdf = async (singleCert?: WarishCertificate) => {
    if (isDownloadingPdf) return;
    setIsDownloadingPdf(true);
    try {
      const targetCerts = singleCert ? [singleCert] : PROVIDED_WARISH_CERTIFICATES;
      const rows: Record<string, string>[] = [];
      targetCerts.forEach((cert) => {
        cert.heirs.forEach((h) => {
          rows.push({
            certNo: `সনদ #${toBengaliNumber(cert.slNo)} [${cert.certificateType}] (${cert.certificateNo})`,
            issueDate: cert.issueDate,
            deceased: `${cert.deceasedName} (পিতা: ${cert.fatherName}, মাতা: ${cert.motherName})`,
            village: `${cert.village}, ওয়ার্ড ${cert.ward}, ${cert.union}, ${cert.upazila}`,
            heirSl: h.sl,
            heirName: h.name,
            relation: h.relation,
            nid: h.nidOrBirthReg,
            dobStatus: `${h.dob} (${h.status})`,
          });
        });
      });

      await downloadForensicReportTablePdf({
        reportTitle: singleCert
          ? `${singleCert.certificateType} নং ${singleCert.certificateNo} — মৃত: ${singleCert.deceasedName}`
          : `আপলোডকৃত ৮টি সনদ ও ${toBengaliNumber(totalHeirsCount)} জন সনদভুক্ত ওয়ারিশের মাস্টার ডিরেক্টরি`,
        reportSubtitle:
          'গ্রাম/মৌজা: গোয়ালী, ওয়ার্ড ০৮, ডাকঘর: কাইতলা - ৩৪১৭, ইউনিয়ন: কাইতলা (দক্ষিণ), উপজেলা: নবীনগর, জেলা: ব্রাহ্মণবাড়িয়া',
        headers: [
          { key: 'certNo', label: 'সনদ নং ও ধরন', width: 210 },
          { key: 'issueDate', label: 'ইস্যু তারিখ', width: 110 },
          { key: 'deceased', label: 'মৃত পূর্বপুরুষ (পিতা ও মাতা)', width: 250 },
          { key: 'village', label: 'গ্রাম/মৌজা ও ঠিকানা', width: 200 },
          { key: 'heirSl', label: 'ক্রঃ', width: 70 },
          { key: 'heirName', label: 'ওয়ারিশের নাম', width: 190 },
          { key: 'relation', label: 'সম্পর্ক', width: 120 },
          { key: 'nid', label: 'ভোটার আইডি / জন্ম সনদ', width: 160 },
          { key: 'dobStatus', label: 'জন্ম তারিখ ও মন্তব্য', width: 160 },
        ],
        rows,
        fileNamePrefix: singleCert
          ? `Uploaded_Certificate_${singleCert.slNo}_${singleCert.certificateNo}`
          : 'LR_All_8_Uploaded_Certificates_Directory',
      });
    } finally {
      setIsDownloadingPdf(false);
    }
  };

  const handleDownloadDirectPdf = async () => {
    if (filteredMatchedList.length === 0 || isDownloadingPdf) return;
    setIsDownloadingPdf(true);
    try {
      const certSuffix =
        selectedCertId !== 'all' ? `_Cert_${selectedCertId}` : '_All_8_Certs';
      await downloadMatchedInheritancePdf(
        filteredMatchedList,
        `LR_Warish_Matched_New_List${certSuffix}`
      );
      setAppliedBanner(
        `সফলভাবে ${toBengaliNumber(filteredMatchedList.length)} টি ম্যাচকৃত ওয়ারিশ-খতিয়ান রেকর্ডের PDF ফাইল ডাউনলোড হয়েছে!`
      );
      setTimeout(() => setAppliedBanner(null), 6000);
    } finally {
      setIsDownloadingPdf(false);
    }
  };

  const handlePrintMatchedReport = () => {
    window.print();
  };

  return (
    <div className="flex-1 bg-[#090d16] text-slate-100 font-bengali">
      {/* Screen Toolbar (Hidden during Print) */}
      <div
        className={`no-print sticky ${
          embedded ? 'top-0' : 'top-[61px]'
        } z-30 bg-[#101726]/95 backdrop-blur border-b border-amber-500/30 px-4 sm:px-8 py-3`}
      >
        <div className="max-w-[1720px] mx-auto flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            {!embedded && (
              <button
                onClick={onBack}
                className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium flex items-center gap-1.5 border border-slate-700 transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5 text-amber-400" />
                <span>মাস্টার লেজারে ফিরুন</span>
              </button>
            )}

            <div>
              <h2 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
                <Users className="w-4 h-4 text-amber-400" />
                <span>আপলোডকৃত ৮টি উত্তরাধিকার/ওয়ারিশ সনদ ও খতিয়ান-দাগ ম্যাচকৃত তালিকা</span>
              </h2>
              <p className="text-[11px] text-slate-400">
                সংযুক্ত উৎস: গ্রাম/মৌজা গোয়ালী, ওয়ার্ড ০৮, কাইতলা (দক্ষিণ), নবীনগর, ব্রাহ্মণবাড়িয়া — ৮টি সনদ ({toBengaliNumber(totalHeirsCount)} জন সনদভুক্ত ব্যক্তি, বহিরাগত সকল তথ্য বাতিলকৃত)
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleDownloadDirectPdf}
              disabled={isDownloadingPdf || filteredMatchedList.length === 0}
              className="px-4 py-2 text-xs font-bold text-slate-950 bg-gradient-to-r from-amber-400 via-amber-300 to-yellow-400 hover:from-amber-300 hover:to-yellow-300 disabled:opacity-50 rounded-lg shadow-lg shadow-amber-950/50 flex items-center gap-1.5 transition-all"
            >
              {isDownloadingPdf ? (
                <Loader2 className="w-4 h-4 animate-spin text-slate-950" />
              ) : (
                <Download className="w-4 h-4 stroke-[2.5] text-slate-950" />
              )}
              <span>
                {isDownloadingPdf
                  ? 'PDF তৈরি হচ্ছে...'
                  : 'ম্যাচকৃত নতুন তালিকা PDF ডাউনলোড (.pdf)'}
              </span>
            </button>

            <button
              onClick={() => handleLoadIntoLedger(false)}
              className="px-3.5 py-2 text-xs font-bold text-emerald-950 bg-emerald-400 hover:bg-emerald-300 rounded-lg shadow-md flex items-center gap-1.5 transition-all"
            >
              <Layers className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>মাস্টার লেজারে লোড করুন</span>
            </button>

            <button
              onClick={() => handleLoadIntoLedger(true)}
              className="px-3 py-2 text-xs font-semibold text-amber-200 bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/40 rounded-lg flex items-center gap-1.5 transition-all"
            >
              <Printer className="w-3.5 h-3.5 text-amber-400" />
              <span>মৌজাভিত্তিক প্রিন্ট ভিউ</span>
            </button>

            <button
              onClick={handlePrintMatchedReport}
              className="px-3 py-2 text-xs font-semibold text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg flex items-center gap-1.5 transition-colors"
            >
              <Printer className="w-3.5 h-3.5 text-amber-400" />
              <span>প্রিন্ট</span>
            </button>

            <button
              onClick={handleExportMatchedExcel}
              className="px-3 py-2 text-xs font-semibold text-emerald-300 bg-emerald-950/40 hover:bg-emerald-950/70 border border-emerald-500/30 rounded-lg flex items-center gap-1.5 transition-colors"
              title="ম্যাচকৃত নতুন তালিকা Excel (.xlsx) হিসেবে লোকাল ডিস্কে সেভ করুন"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
              <span>এক্সেল (.xlsx)</span>
            </button>

            <button
              onClick={handleExportMatchedCsv}
              className="px-3 py-2 text-xs font-semibold text-sky-300 bg-sky-950/40 hover:bg-sky-950/70 border border-sky-500/30 rounded-lg flex items-center gap-1.5 transition-colors"
              title="ম্যাচকৃত নতুন তালিকা CSV (.csv) হিসেবে লোকাল ডিস্কে সেভ করুন"
            >
              <FileText className="w-3.5 h-3.5 text-sky-400" />
              <span>CSV (.csv)</span>
            </button>

            <button
              onClick={handleExportMatchedJson}
              className="px-3 py-2 text-xs font-semibold text-purple-300 bg-purple-950/40 hover:bg-purple-950/70 border border-purple-500/30 rounded-lg flex items-center gap-1.5 transition-colors"
              title="ম্যাচকৃত নতুন তালিকা JSON (.json) হিসেবে লোকাল ডিস্কে সেভ করুন"
            >
              <FileJson className="w-3.5 h-3.5 text-purple-400" />
              <span>JSON (.json)</span>
            </button>

            <button
              onClick={() => setShowAllScansGallery(!showAllScansGallery)}
              className="px-3 py-2 text-xs font-semibold text-amber-300 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 rounded-lg flex items-center gap-1.5 transition-colors"
            >
              <ImageIcon className="w-3.5 h-3.5 text-amber-400" />
              <span>আপলোডকৃত ৮টি মূল সনদ ছবি ({toBengaliNumber(8)})</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Container */}
      <div className="max-w-[1720px] mx-auto p-3 sm:p-6 space-y-5">
        {appliedBanner && (
          <div className="no-print bg-emerald-950/60 border border-emerald-500/40 rounded-xl p-3 flex items-center justify-between text-xs text-emerald-200">
            <div className="flex items-center gap-2 font-semibold">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{appliedBanner}</span>
            </div>
            <button
              onClick={onBack}
              className="px-3 py-1 bg-emerald-400 text-slate-950 font-bold rounded hover:bg-emerald-300"
            >
              মাস্টার লেজার গ্রিডে দেখুন →
            </button>
          </div>
        )}

        {/* Authoritative Master Genealogy Lineage & Spelling Mistake Note */}
        <section className="bg-gradient-to-r from-[#11192c] via-[#131d33] to-[#11192c] border border-emerald-500/40 rounded-xl p-4 space-y-2.5 shadow-lg">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-2">
            <h3 className="text-sm font-bold text-amber-300 flex items-center gap-2">
              <Users className="w-4 h-4 text-emerald-400" />
              <span>প্রমিত মাস্টার বংশলতিকা (Master Family Genealogy Chain)</span>
            </h3>
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[11px] font-bold">
              চূড়ান্ত ও প্রমাণিত বংশধারা
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-2.5 text-xs">
            <div className="bg-[#0b101d] p-2.5 rounded-lg border border-slate-800">
              <div className="text-[10px] text-amber-400 font-bold">১ম প্রজন্ম (মূল পূর্বপুরুষ)</div>
              <div className="text-sm font-bold text-white mt-0.5">• রোশন আলী</div>
            </div>
            <div className="bg-[#0b101d] p-2.5 rounded-lg border border-slate-800">
              <div className="text-[10px] text-amber-400 font-bold">২য় প্রজন্ম (তাহার পুত্র)</div>
              <div className="text-sm font-bold text-white mt-0.5">• নাজির আলী নোয়াজ অথবা আলী নোয়াজ</div>
              <div className="text-[10px] text-slate-400">সনদে: মৃত নাজির ওরফে আলী নোয়াজ | স্ত্রী: পরিষ্কারের নেছা</div>
            </div>
            <div className="bg-[#0b101d] p-2.5 rounded-lg border border-slate-800">
              <div className="text-[10px] text-amber-400 font-bold">৩য় প্রজন্ম (তাহার পুত্র)</div>
              <div className="text-sm font-bold text-emerald-300 mt-0.5">• সফর আলী</div>
              <div className="text-[10px] text-slate-400">মৃত্যু: ১৮-১১-১৯০৫ | স্ত্রী: ফুলবানু</div>
            </div>
            <div className="bg-[#0b101d] p-2.5 rounded-lg border border-emerald-500/30">
              <div className="text-[10px] text-emerald-400 font-bold">৪র্থ প্রজন্ম ও তৎপরবর্তী</div>
              <div className="text-sm font-bold text-white mt-0.5">• দুই পুত্র: কামদার আলী ও সিরাজ আলী</div>
              <div className="text-[10px] text-emerald-300">এবং তদীয় বংশধরগণ (সকল ৮টি সনদভুক্ত)</div>
            </div>
          </div>

          <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg px-3 py-2 text-xs text-amber-200 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <strong>বিশেষ দ্রষ্টব্য (বানান সংশোধনী):</strong> উল্লিখিত সনদে (বিশেষত আব্দুল কাদিরের সনদ নং ২০২৬১২১৮৫৪০০০০০২১ এবং আঃ আলীমের সনদ নং কাই(দঃ)/ইউপি/২০২৩(৫৩)) পিতার নাম <strong>“কানদার আলী / কান্দর আলী / মৃত কাম্দার আলী”</strong> হিসেবে <strong>স্পেলিং মিসটেক (করণিক বানান ভুল)</strong> হয়েছে; মূলত সেটি হবে সফর আলীর পুত্র <strong>“কামদার আলী”</strong>।
            </div>
          </div>
        </section>

        {/* 8 Uploaded Certificates Reference Cards (Interactive Filter + Scan Preview & Download) */}
        <section className="no-print bg-[#121827] border border-amber-500/30 rounded-xl p-4 space-y-3 shadow-lg">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <FileCheck2 className="w-4 h-4 text-amber-400" />
                <span>আপনার আপলোডকৃত ৮টি সনদের এক্সট্রাক্টকৃত তালিকা (ক্লিক করে ফিল্টার বা মূল স্ক্যান দেখুন)</span>
              </h3>
              <p className="text-xs text-slate-400">
                ৭টি ওয়ারিশান/উত্তরাধিকারী সনদ + ১টি নাগরিকত্ব সনদ (মোট {toBengaliNumber(totalHeirsCount)} জন সনদভুক্ত ব্যক্তি) — আপলোডকৃত সনদের বাইরের সকল তথ্য বাতিল করা হয়েছে
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => handleDownloadWarishDirectoryPdf()}
                disabled={isDownloadingPdf}
                className="px-2.5 py-1.5 rounded-lg bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-[11px] flex items-center gap-1 shadow transition-colors"
                title="৮টি সনদ ও ৬৭ জন সনদভুক্ত ওয়ারিশের তালিকা PDF হিসেবে লোকাল ডিস্কে সেভ করুন"
              >
                <Download className="w-3.5 h-3.5 stroke-[2.5]" />
                <span>৮টি সনদ ডিরেক্টরি PDF (.pdf)</span>
              </button>

              <button
                onClick={() =>
                  exportWarishCertificatesToExcel(
                    PROVIDED_WARISH_CERTIFICATES,
                    'LR_All_8_Uploaded_Warish_Certificates'
                  )
                }
                className="px-2.5 py-1.5 rounded-lg bg-emerald-950/50 hover:bg-emerald-900/60 border border-emerald-500/40 text-emerald-300 text-[11px] font-semibold flex items-center gap-1 transition-colors"
                title="৮টি সনদ Excel হিসেবে লোকাল ডিস্কে সেভ করুন"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
                <span>৮টি সনদ Excel (.xlsx)</span>
              </button>

              <button
                onClick={() =>
                  exportToJSON(PROVIDED_WARISH_CERTIFICATES, 'LR_All_8_Uploaded_Warish_Certificates')
                }
                className="px-2.5 py-1.5 rounded-lg bg-purple-950/50 hover:bg-purple-900/60 border border-purple-500/40 text-purple-300 text-[11px] font-semibold flex items-center gap-1 transition-colors"
                title="৮টি সনদ JSON হিসেবে লোকাল ডিস্কে সেভ করুন"
              >
                <FileJson className="w-3.5 h-3.5 text-purple-400" />
                <span>JSON</span>
              </button>

              {selectedCertId !== 'all' && (
                <button
                  onClick={() => setSelectedCertId('all')}
                  className="px-2.5 py-1.5 rounded-lg bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[11px] font-semibold"
                >
                  সকল ৮টি সনদ দেখুন
                </button>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {PROVIDED_WARISH_CERTIFICATES.map((cert) => {
              const isSelected = selectedCertId === cert.id;
              const matchCountForCert = allMatchedList.filter(
                (m) => m.matchedCertificate.id === cert.id
              ).length;

              return (
                <div
                  key={cert.id}
                  onClick={() => setSelectedCertId(isSelected ? 'all' : cert.id)}
                  className={`cursor-pointer text-left p-3 rounded-xl border transition-all flex flex-col justify-between gap-2.5 ${
                    isSelected
                      ? 'bg-amber-500/20 border-amber-400 shadow-md shadow-amber-950/50'
                      : 'bg-[#0c111d] border-slate-800 hover:border-amber-500/40'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between gap-1 text-[10px] font-mono">
                      <span className="bg-amber-500/15 text-amber-300 px-1.5 py-0.5 rounded border border-amber-500/30 font-bengali">
                        সনদ #{toBengaliNumber(cert.slNo)} · {cert.certificateType}
                      </span>
                      <span className="text-slate-400">{cert.issueDate.split(' ')[0]}</span>
                    </div>
                    <div className="text-[11px] text-amber-200 font-mono mt-1 truncate">
                      নং: {cert.certificateNo}
                    </div>
                    <div className="text-xs font-bold text-white mt-1">
                      {cert.certificateType === 'নাগরিকত্ব সনদ'
                        ? cert.deceasedName
                        : `মৃত: ${cert.deceasedName}`}
                    </div>
                    <div className="text-[11px] text-slate-300 truncate">
                      পিতা: {cert.fatherName}
                    </div>
                    <div className="text-[10px] text-slate-400 truncate">
                      মাতা: {cert.motherName}
                    </div>
                    <div className="text-[10px] text-slate-500 mt-0.5">
                      মৃত্যু তারিখ: {cert.deathDate}
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-800/80 flex flex-wrap items-center justify-between text-[11px] gap-1">
                    <span className="text-emerald-400 font-semibold">
                      ওয়ারিশ: {toBengaliNumber(cert.heirs.length)} জন (ম্যাচ: {toBengaliNumber(matchCountForCert)})
                    </span>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setPreviewCertificate(cert);
                        }}
                        className="px-1.5 py-0.5 bg-sky-500/20 hover:bg-sky-500/30 border border-sky-500/40 text-sky-300 font-semibold rounded text-[10px] inline-flex items-center gap-0.5"
                        title="আপলোডকৃত মূল সনদের স্ক্যান কপি ও পূর্ণ ছক দেখুন"
                      >
                        <Eye className="w-2.5 h-2.5" />
                        <span>মূল সনদ</span>
                      </button>

                      <a
                        href={cert.imagePath}
                        download={`Uploaded_Cert_${cert.slNo}_${cert.certificateNo}.jpg`}
                        onClick={(e) => e.stopPropagation()}
                        className="px-1.5 py-0.5 bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 text-emerald-300 font-semibold rounded text-[10px] inline-flex items-center gap-0.5"
                        title="আপলোডকৃত মূল সনদের ছবি (.jpg) ডাউনলোড করুন"
                      >
                        <Download className="w-2.5 h-2.5" />
                        <span>JPG</span>
                      </a>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDownloadWarishDirectoryPdf(cert);
                        }}
                        className="px-1.5 py-0.5 bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold rounded text-[10px] inline-flex items-center gap-0.5"
                        title="এই সনদটি PDF হিসেবে লোকাল ডিস্কে সেভ করুন"
                      >
                        <Download className="w-2.5 h-2.5" />
                        <span>PDF</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Collapsible Gallery of All 8 Uploaded Certificate Images */}
        {showAllScansGallery && (
          <section className="no-print bg-[#0d1322] border border-amber-500/40 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-bold text-amber-300">
                <ImageIcon className="w-4 h-4" />
                <span>আপনার আপলোডকৃত ৮টি সনদের মূল স্ক্যান কপি (ক্লিক করে বড় করে দেখুন বা ডাউনলোড করুন)</span>
              </div>
              <button
                onClick={() => setShowAllScansGallery(false)}
                className="text-xs text-slate-400 hover:text-white px-2.5 py-1 rounded bg-slate-800"
              >
                বন্ধ করুন ✕
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {PROVIDED_WARISH_CERTIFICATES.map((cert) => (
                <div
                  key={`scan-${cert.id}`}
                  className="bg-[#090d16] border border-slate-800 rounded-xl overflow-hidden flex flex-col justify-between"
                >
                  <div
                    onClick={() => setPreviewCertificate(cert)}
                    className="cursor-pointer relative group aspect-[3/4] bg-black overflow-hidden"
                  >
                    <img
                      src={cert.imagePath}
                      alt={cert.deceasedName}
                      className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                  <div className="p-2.5 space-y-1 border-t border-slate-800">
                    <div className="text-[11px] font-bold text-amber-300">
                      সনদ #{toBengaliNumber(cert.slNo)}: {cert.deceasedName}
                    </div>
                    <div className="text-[10px] text-slate-400 font-mono">
                      নং: {cert.certificateNo} | তাং: {cert.issueDate}
                    </div>
                    <div className="flex items-center justify-between pt-1">
                      <button
                        onClick={() => setPreviewCertificate(cert)}
                        className="text-[10px] px-2 py-1 rounded bg-sky-500/20 text-sky-300 border border-sky-500/30 font-semibold"
                      >
                        বিস্তারিত ও জুম ভিউ
                      </button>
                      <a
                        href={cert.imagePath}
                        download={`Certificate_${cert.slNo}_${cert.certificateNo}.jpg`}
                        className="text-[10px] px-2 py-1 rounded bg-amber-400 text-slate-950 font-bold inline-flex items-center gap-1"
                      >
                        <Download className="w-3 h-3" />
                        <span>মূল ছবি সেভ</span>
                      </a>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Modal for Single Certificate Scan + Verbatim Extracted Table */}
        {previewCertificate && (
          <div className="no-print fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6">
            <div className="bg-[#101726] border-2 border-amber-500/50 rounded-2xl max-w-6xl w-full max-h-[92vh] flex flex-col overflow-hidden shadow-2xl">
              <div className="p-4 bg-[#161f33] border-b border-slate-800 flex items-center justify-between gap-3">
                <div>
                  <span className="text-[11px] text-amber-400 font-bold">
                    সনদ #{toBengaliNumber(previewCertificate.slNo)} · {previewCertificate.certificateType} (নং: {previewCertificate.certificateNo})
                  </span>
                  <h3 className="text-base font-bold text-white">
                    মৃত/প্রত্যয়নকৃত: {previewCertificate.deceasedName} | পিতা: {previewCertificate.fatherName} | মাতা: {previewCertificate.motherName}
                  </h3>
                </div>
                <div className="flex items-center gap-2">
                  <a
                    href={previewCertificate.imagePath}
                    download={`Certificate_${previewCertificate.slNo}_${previewCertificate.certificateNo}.jpg`}
                    className="px-3 py-1.5 rounded-lg bg-emerald-400 hover:bg-emerald-300 text-slate-950 font-bold text-xs flex items-center gap-1.5"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>মূল সনদ ছবি ডাউনলোড (.jpg)</span>
                  </a>
                  <button
                    onClick={() => handleDownloadWarishDirectoryPdf(previewCertificate)}
                    className="px-3 py-1.5 rounded-lg bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs flex items-center gap-1.5"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>সনদ টেবিল PDF (.pdf)</span>
                  </button>
                  <button
                    onClick={() => setPreviewCertificate(null)}
                    className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-4 grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div className="bg-black rounded-xl border border-slate-800 p-2 flex items-center justify-center">
                  <img
                    src={previewCertificate.imagePath}
                    alt={previewCertificate.deceasedName}
                    className="max-h-[72vh] w-auto object-contain rounded"
                  />
                </div>

                <div className="space-y-3">
                  <div className="bg-[#0b101d] border border-slate-800 rounded-xl p-3.5 text-xs space-y-1.5">
                    <div className="text-amber-300 font-bold text-sm border-b border-slate-800 pb-1.5">
                      সনদ হতে হুবহু এক্সট্রাক্টকৃত মেটাডেটা
                    </div>
                    <div><span className="text-slate-400">সনদের ধরন:</span> <span className="font-bold text-white">{previewCertificate.certificateType}</span></div>
                    <div><span className="text-slate-400">সনদ নং:</span> <span className="font-mono text-amber-300">{previewCertificate.certificateNo}</span></div>
                    {previewCertificate.memoNo && (
                      <div><span className="text-slate-400">স্মারক/ভেরিফিকেশন:</span> <span className="font-mono text-slate-200">{previewCertificate.memoNo}</span></div>
                    )}
                    <div><span className="text-slate-400">ইস্যু/প্রদানের তারিখ:</span> <span className="text-white">{previewCertificate.issueDate}</span></div>
                    <div><span className="text-slate-400">মৃত ব্যক্তি / বিষয়:</span> <span className="font-bold text-emerald-300">{previewCertificate.deceasedName}</span></div>
                    {previewCertificate.deceasedNid && (
                      <div><span className="text-slate-400">মৃতের জাতীয় পরিচয়পত্র নং:</span> <span className="font-mono text-amber-200">{previewCertificate.deceasedNid}</span></div>
                    )}
                    <div><span className="text-slate-400">পিতা:</span> <span className="text-white">{previewCertificate.fatherName}</span></div>
                    <div><span className="text-slate-400">মাতা:</span> <span className="text-white">{previewCertificate.motherName}</span></div>
                    <div><span className="text-slate-400">ঠিকানা:</span> <span className="text-slate-200">গ্রাম: {previewCertificate.village}, ওয়ার্ড: {previewCertificate.ward}, ডাকঘর: {previewCertificate.postOffice}, ইউনিয়ন: {previewCertificate.union}, উপজেলা: {previewCertificate.upazila}, জেলা: {previewCertificate.district}</span></div>
                    <div><span className="text-slate-400">মৃত্যু তারিখ:</span> <span className="text-amber-200">{previewCertificate.deathDate}</span></div>
                  </div>

                  <div className="bg-[#0b101d] border border-slate-800 rounded-xl overflow-hidden">
                    <div className="px-3.5 py-2 bg-[#141d31] border-b border-slate-800 text-xs font-bold text-amber-300">
                      সনদভুক্ত ওয়ারিশগণের তালিকা ({toBengaliNumber(previewCertificate.heirs.length)} জন)
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse text-xs">
                        <thead>
                          <tr className="bg-[#090d16] text-slate-300 border-b border-slate-800">
                            <th className="py-2 px-2.5 border-r border-slate-800">ক্রঃ</th>
                            <th className="py-2 px-2.5 border-r border-slate-800">নাম</th>
                            <th className="py-2 px-2.5 border-r border-slate-800">সম্পর্ক</th>
                            <th className="py-2 px-2.5 border-r border-slate-800">ভোটার আইডি / জন্ম সনদ</th>
                            <th className="py-2 px-2.5 border-r border-slate-800">জন্ম তারিখ</th>
                            <th className="py-2 px-2.5">মন্তব্য</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/70">
                          {previewCertificate.heirs.map((h) => (
                            <tr key={`${previewCertificate.id}-modal-${h.sl}`}>
                              <td className="py-1.5 px-2.5 border-r border-slate-800 font-mono text-amber-300">{h.sl}</td>
                              <td className="py-1.5 px-2.5 border-r border-slate-800 font-bold text-white">{h.name}</td>
                              <td className="py-1.5 px-2.5 border-r border-slate-800 text-slate-300">{h.relation}</td>
                              <td className="py-1.5 px-2.5 border-r border-slate-800 font-mono text-slate-200">{h.nidOrBirthReg}</td>
                              <td className="py-1.5 px-2.5 border-r border-slate-800 font-mono text-slate-300">{h.dob}</td>
                              <td className="py-1.5 px-2.5">
                                <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${h.status === 'জীবিত' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-rose-500/20 text-rose-300'}`}>
                                  {h.status}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Filter & Match Mode Controls Bar */}
        <section className="no-print bg-[#121827] border border-slate-800 rounded-xl p-3.5 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative w-64 sm:w-80">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="মালিক, মৃত ব্যক্তি, ওয়ারিশ, ভোটার আইডি, খতিয়ান বা দাগ খুঁজুন..."
                className="w-full bg-[#090d16] border border-slate-700 focus:border-amber-400 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-100 focus:outline-none"
              />
            </div>

            <div className="flex items-center gap-1 bg-[#090d16] p-1 rounded-lg border border-slate-800 text-xs">
              <button
                onClick={() => setMatchMode('all')}
                className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
                  matchMode === 'all'
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                সকল রেকর্ড সমন্বিত নতুন তালিকা ({toBengaliNumber(records.length)})
              </button>
              <button
                onClick={() => setMatchMode('strict')}
                className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
                  matchMode === 'strict'
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                শুধুমাত্র সরাসরি নাম/বংশক্রম ম্যাচ ({toBengaliNumber(directNameMatchCount)})
              </button>
            </div>
          </div>

          <div className="flex items-center gap-4 text-xs text-slate-300">
            <div>
              মোট ম্যাচকৃত এন্ট্রি:{' '}
              <span className="font-bold text-amber-300">
                {toBengaliNumber(filteredMatchedList.length)} টি
              </span>
            </div>
            <div>
              মোট জমির পরিমাণ:{' '}
              <span className="font-bold text-emerald-400">
                {toBengaliNumber(totalMatchedAcre.toFixed(4))} একর
              </span>
            </div>
          </div>
        </section>

        {/* Printable & Interactive Matched New List Table */}
        <section className="bg-[#121827] print:bg-white border border-amber-500/20 print:border-black rounded-xl overflow-hidden shadow-xl">
          {/* Official Header (Visible on Screen & Print) */}
          <div className="p-4 sm:p-5 bg-gradient-to-r from-[#161f33] to-[#101726] print:bg-white border-b border-amber-500/20 print:border-black flex flex-wrap items-center justify-between gap-4">
            <div>
              <div className="text-[11px] text-amber-400 print:text-black font-semibold uppercase tracking-wider">
                গণপ্রজাতন্ত্রী বাংলাদেশ সরকার · আপলোডকৃত উত্তরাধিকার/ওয়ারিশ সনদ ও ভূমি রেকর্ড সমন্বয় প্রতিবেদন
              </div>
              <h1 className="text-base sm:text-xl font-bold text-white print:text-black mt-0.5">
                আপলোডকৃত ৮টি সনদের সাথে ম্যাচকৃত ভূমি রেকর্ডের মাস্টার তালিকা (Matched Inheritance & Land Ledger)
              </h1>
              <p className="text-xs text-slate-300 print:text-black mt-0.5">
                রেফারেন্স ঠিকানা: গ্রাম/মৌজা: গোয়ালী, ওয়ার্ড নং: ০৮, ডাকঘর: কাইতলা - ৩৪১৭, ইউনিয়ন: কাইতলা (দক্ষিণ), উপজেলা: নবীনগর, জেলা: ব্রাহ্মণবাড়িয়া
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <div className="text-right text-xs text-slate-300 print:text-black space-y-0.5">
                <div className="font-semibold text-amber-300 print:text-black">
                  মোট আপলোডকৃত সনদ: {toBengaliNumber(PROVIDED_WARISH_CERTIFICATES.length)} টি | সনদভুক্ত ব্যক্তি: {toBengaliNumber(totalHeirsCount)} জন
                </div>
                <div>
                  তালিকাভুক্ত ম্যাচকৃত রেকর্ড: {toBengaliNumber(filteredMatchedList.length)} টি
                </div>
                <div>
                  সর্বমোট জমি: {toBengaliNumber(totalMatchedAcre.toFixed(4))} একর
                </div>
              </div>

              <button
                onClick={handleDownloadDirectPdf}
                disabled={isDownloadingPdf || filteredMatchedList.length === 0}
                className="no-print px-4 py-2.5 text-xs font-bold text-slate-950 bg-gradient-to-r from-emerald-400 via-teal-300 to-emerald-400 hover:from-emerald-300 hover:to-teal-200 rounded-xl shadow-lg flex items-center gap-2 transition-all"
              >
                {isDownloadingPdf ? (
                  <Loader2 className="w-4 h-4 animate-spin text-slate-950" />
                ) : (
                  <Download className="w-4 h-4 stroke-[2.5] text-slate-950" />
                )}
                <span>নতুন ম্যাচকৃত তালিকা PDF ডাউনলোড (.pdf)</span>
              </button>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-[#0d1320] print:bg-slate-100 text-amber-300 print:text-black border-b border-slate-800 print:border-black">
                  <th className="py-2.5 px-3 border-r border-slate-800 print:border-black w-12 text-center">
                    ক্রমিক
                  </th>
                  <th className="py-2.5 px-3 border-r border-slate-800 print:border-black">
                    মৌজা, জে.এল. ও জরিপ
                  </th>
                  <th className="py-2.5 px-3 border-r border-slate-800 print:border-black">
                    খতিয়ান ও দাগ নং
                  </th>
                  <th className="py-2.5 px-3 border-r border-slate-800 print:border-black min-w-[210px]">
                    খতিয়ানে লিপিবদ্ধ মালিকের বিবরণ
                  </th>
                  <th className="py-2.5 px-3 border-r border-slate-800 print:border-black">
                    শ্রেণি, অংশ ও জমির পরিমাণ
                  </th>
                  <th className="py-2.5 px-3 border-r border-slate-800 print:border-black min-w-[210px]">
                    ম্যাচকৃত সনদ ও মৃত পূর্বপুরুষ
                  </th>
                  <th className="py-2.5 px-3 border-r border-slate-800 print:border-black min-w-[330px]">
                    সনদভুক্ত ওয়ারিশগণের নামের তালিকা (ক্রমিক, সম্পর্ক, এনআইডি ও জন্ম তারিখসহ)
                  </th>
                  <th className="py-2.5 px-3 text-center">
                    ম্যাচিং স্ট্যাটাস ও ডাউনলোড
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80 print:divide-black">
                {filteredMatchedList.map((item, idx) => {
                  const { landRecord: rec, matchedCertificate: cert } = item;
                  const isDirect =
                    item.matchType === 'exact_ancestor' ||
                    item.matchType === 'heir_match' ||
                    item.matchType === 'lineage_chain';

                  return (
                    <tr
                      key={`${rec.id}_${cert.id}_${idx}`}
                      className="hover:bg-slate-800/40 print:hover:bg-transparent transition-colors align-top"
                    >
                      <td className="py-3 px-3 border-r border-slate-800/80 print:border-black text-center font-mono-num font-bold text-slate-300 print:text-black">
                        {toBengaliNumber(idx + 1)}
                      </td>

                      <td className="py-3 px-3 border-r border-slate-800/80 print:border-black">
                        <div className="font-bold text-white print:text-black">
                          মৌজা: {rec.mouza}
                        </div>
                        <div className="text-[11px] text-slate-400 print:text-black">
                          জে.এল. নং: {rec.jlNo} | {rec.upazila}, {rec.district}
                        </div>
                        <span className="inline-block mt-1 px-2 py-0.5 text-[10px] font-bold rounded bg-amber-500/15 text-amber-300 print:text-black border border-amber-500/30 print:border-black">
                          {rec.surveyType} জরিপ
                        </span>
                      </td>

                      <td className="py-3 px-3 border-r border-slate-800/80 print:border-black font-mono-num">
                        <div className="text-amber-300 print:text-black font-bold">
                          খতিয়ান: {rec.khatianNo}
                        </div>
                        <div className="text-slate-200 print:text-black font-semibold mt-0.5">
                          দাগ নং: {rec.dagNo}
                        </div>
                      </td>

                      <td className="py-3 px-3 border-r border-slate-800/80 print:border-black text-slate-200 print:text-black leading-relaxed">
                        {rec.ownerDetails}
                      </td>

                      <td className="py-3 px-3 border-r border-slate-800/80 print:border-black">
                        <div className="font-semibold text-emerald-400 print:text-black">
                          {rec.area}
                        </div>
                        <div className="text-[11px] text-slate-300 print:text-black mt-0.5">
                          শ্রেণি: {rec.landClass} | হিস্যা: {rec.share}
                        </div>
                        <div className="text-[10px] text-amber-300 print:text-black mt-0.5">
                          ওয়ারিশ প্রতি গড়: {item.allocatedAreaPerLivingHeir}
                        </div>
                      </td>

                      <td className="py-3 px-3 border-r border-slate-800/80 print:border-black">
                        <div className="text-[10px] font-semibold text-emerald-300 print:text-black">
                          {cert.certificateType} (#{toBengaliNumber(cert.slNo)})
                        </div>
                        <div className="text-[10px] font-mono text-amber-300 print:text-black">
                          নং: {cert.certificateNo}
                        </div>
                        <div className="font-bold text-white print:text-black mt-0.5">
                          মৃত: {cert.deceasedName}
                        </div>
                        <div className="text-[11px] text-slate-300 print:text-black">
                          পিতা: {cert.fatherName}
                        </div>
                        <div className="text-[10px] text-slate-400 print:text-black">
                          মাতা: {cert.motherName}
                        </div>
                        <div className="no-print mt-1.5">
                          <button
                            onClick={() => setPreviewCertificate(cert)}
                            className="text-[10px] px-2 py-0.5 rounded bg-sky-500/15 hover:bg-sky-500/25 text-sky-300 border border-sky-500/30 inline-flex items-center gap-1"
                          >
                            <Eye className="w-2.5 h-2.5" />
                            <span>স্ক্যান কপি দেখুন</span>
                          </button>
                        </div>
                      </td>

                      <td className="py-3 px-3 border-r border-slate-800/80 print:border-black">
                        <div className="text-[11px] font-semibold text-emerald-300 print:text-black mb-1">
                          মোট ওয়ারিশ: {toBengaliNumber(cert.heirs.length)} জন (জীবিত: {toBengaliNumber(item.livingHeirsCount)} জন)
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-1">
                          {cert.heirs.map((h) => (
                            <div
                              key={`${cert.id}_heir_${h.sl}`}
                              className="text-[11px] bg-[#0b0f1a] print:bg-transparent border border-slate-800 print:border-slate-400 rounded px-2 py-1 text-slate-200 print:text-black"
                            >
                              <span className="font-bold text-amber-300 print:text-black">
                                {h.sl}. {h.name}
                              </span>{' '}
                              <span className="text-slate-400 print:text-black">
                                ({h.relation} - {h.status})
                              </span>
                              {(h.nidOrBirthReg !== '-' || h.dob !== '-') && (
                                <div className="text-[9px] text-slate-400 print:text-black font-mono">
                                  {h.nidOrBirthReg !== '-' ? `আইডি: ${h.nidOrBirthReg}` : ''}
                                  {h.nidOrBirthReg !== '-' && h.dob !== '-' ? ' | ' : ''}
                                  {h.dob !== '-' ? `জন্ম: ${h.dob}` : ''}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </td>

                      <td className="py-3 px-3 text-center space-y-1.5">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-1 rounded text-[10px] font-bold border ${
                            isDirect
                              ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30 print:text-black print:border-black'
                              : 'bg-amber-500/15 text-amber-300 border-amber-500/30 print:text-black print:border-black'
                          }`}
                        >
                          <UserCheck className="w-3 h-3" />
                          <span>{isDirect ? 'সরাসরি নাম ও বংশক্রম ম্যাচ' : 'মৌজা/বংশক্রম সমন্বিত'}</span>
                        </span>
                        <div className="text-[10px] text-slate-400 print:text-black">
                          {item.matchedPersonName}
                        </div>
                        <div className="no-print flex items-center justify-center gap-1 pt-1">
                          <button
                            onClick={() =>
                              downloadMatchedInheritancePdf(
                                [item],
                                `Warish_Matched_Kh_${rec.khatianNo}_Dag_${rec.dagNo}`
                              )
                            }
                            className="px-2 py-1 bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold rounded text-[10px] inline-flex items-center gap-1 shadow transition-colors"
                            title="এই একক ওয়ারিশ-খতিয়ান রেকর্ডটি PDF হিসেবে লোকাল ডিস্কে ডাউনলোড করুন"
                          >
                            <Download className="w-2.5 h-2.5" />
                            <span>Download .PDF</span>
                          </button>
                          <button
                            onClick={() =>
                              exportToJSON(
                                item,
                                `Warish_Matched_Kh_${rec.khatianNo}_Dag_${rec.dagNo}`
                              )
                            }
                            className="px-1.5 py-1 bg-purple-950/60 hover:bg-purple-900/70 border border-purple-500/40 text-purple-300 font-semibold rounded text-[10px] inline-flex items-center gap-0.5 transition-colors"
                            title="এই একক ওয়ারিশ-খতিয়ান রেকর্ডটি JSON হিসেবে লোকাল ডিস্কে ডাউনলোড করুন"
                          >
                            <FileJson className="w-2.5 h-2.5" />
                            <span>.JSON</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  );
};
