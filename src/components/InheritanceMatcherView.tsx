import React, { useEffect, useMemo, useState } from 'react';
import {
  Users,
  FileCheck2,
  Printer,
  FileSpreadsheet,
  ArrowLeft,
  CheckCircle2,
  BookOpen,
  Download,
  Search,
  Layers,
  UserCheck,
  FileText,
} from 'lucide-react';
import { DynamicColumn, LandRecord } from '../types/landRecord';
import {
  PROVIDED_WARISH_CERTIFICATES,
  REFERENCE_INHERITANCE_FILE_PATH,
  matchLandRecordsWithInheritance,
  convertMatchedListToLandRecords,
} from '../utils/inheritanceData';
import { toBengaliNumber, parseAcreValue } from '../utils/bengaliNumerals';
import { exportToExcel } from '../utils/exportUtils';

interface InheritanceMatcherViewProps {
  records: LandRecord[];
  columns: DynamicColumn[];
  onBack: () => void;
  onApplyMatchedListToLedger: (matchedRecords: LandRecord[], openPrintAfter?: boolean) => void;
}

export const InheritanceMatcherView: React.FC<InheritanceMatcherViewProps> = ({
  records,
  columns,
  onBack,
  onApplyMatchedListToLedger,
}) => {
  const [matchMode, setMatchMode] = useState<'all' | 'strict'>('all');
  const [selectedCertId, setSelectedCertId] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [showRawReferenceModal, setShowRawReferenceModal] = useState<boolean>(false);
  const [rawReferenceText, setRawReferenceText] = useState<string>('');
  const [appliedBanner, setAppliedBanner] = useState<string | null>(null);

  // Load the attached reference txt file from /assets/aistudio/____________________a9904dbe.txt
  useEffect(() => {
    fetch(REFERENCE_INHERITANCE_FILE_PATH)
      .then((res) => (res.ok ? res.text() : Promise.reject('Failed to load')))
      .then((txt) => setRawReferenceText(txt))
      .catch(() => {
        setRawReferenceText('');
      });
  }, []);

  // Generate the matched list from the current land records + provided inheritance list
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
        const inHeirs = item.matchedCertificate.heirs.some((h) =>
          h.name.toLowerCase().includes(q)
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
        `নতুন ম্যাচকৃত ${toBengaliNumber(enriched.length)} টি ওয়ারিশ-খতিয়ান রেকর্ড মাস্টার লেজারে সফলভাবে যুক্ত করা হয়েছে!`
      );
      setTimeout(() => setAppliedBanner(null), 6000);
    }
  };

  const handleExportMatchedExcel = () => {
    const enriched = buildEnrichedRecords();
    const extraKeys = [
      'ওয়ারিশ সনদ নং',
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

  const handlePrintMatchedReport = () => {
    window.print();
  };

  return (
    <div className="flex-1 bg-[#090d16] text-slate-100 font-bengali">
      {/* Screen Toolbar (Hidden during Print) */}
      <div className="no-print sticky top-[61px] z-30 bg-[#101726]/95 backdrop-blur border-b border-amber-500/30 px-4 sm:px-8 py-3">
        <div className="max-w-[1720px] mx-auto flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <button
              onClick={onBack}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium flex items-center gap-1.5 border border-slate-700 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5 text-amber-400" />
              <span>মাস্টার লেজারে ফিরুন</span>
            </button>

            <div>
              <h2 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
                <Users className="w-4 h-4 text-amber-400" />
                <span>ওয়ারিশ সনদের তালিকা ও খতিয়ান-দাগ ম্যাচকৃত নতুন তালিকা (Inheritance Matched List)</span>
              </h2>
              <p className="text-[11px] text-slate-400">
                সংযুক্ত রেফারেন্স: গ্রাম/মৌজা গোয়ালী, ওয়ার্ড ০৮, কাইতলা (দক্ষিণ), নবীনগর, ব্রাহ্মণবাড়িয়া — ৬টি ওয়ারিশ সনদ ({toBengaliNumber(totalHeirsCount)} জন ওয়ারিশ)
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setShowRawReferenceModal(!showRawReferenceModal)}
              className="px-3 py-2 text-xs font-semibold text-amber-300 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 rounded-lg flex items-center gap-1.5 transition-colors"
            >
              <BookOpen className="w-3.5 h-3.5 text-amber-400" />
              <span>সংযুক্ত ওয়ারিশ সনদ রেফারেন্স ({toBengaliNumber(6)} টি)</span>
            </button>

            <button
              onClick={() => handleLoadIntoLedger(false)}
              className="px-3.5 py-2 text-xs font-bold text-emerald-950 bg-emerald-400 hover:bg-emerald-300 rounded-lg shadow-md flex items-center gap-1.5 transition-all"
            >
              <Layers className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>নতুন ম্যাচকৃত তালিকা মাস্টার লেজারে লোড করুন</span>
            </button>

            <button
              onClick={() => handleLoadIntoLedger(true)}
              className="px-3.5 py-2 text-xs font-bold text-slate-950 bg-gradient-to-r from-amber-400 via-amber-300 to-yellow-400 hover:from-amber-300 hover:to-yellow-300 rounded-lg shadow-md flex items-center gap-1.5 transition-all"
            >
              <Printer className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>মৌজাভিত্তিক ম্যাচকৃত PDF রিপোর্ট</span>
            </button>

            <button
              onClick={handlePrintMatchedReport}
              className="px-3 py-2 text-xs font-semibold text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg flex items-center gap-1.5 transition-colors"
            >
              <Printer className="w-3.5 h-3.5 text-amber-400" />
              <span>এই ম্যাচকৃত টেবিল সরাসরি প্রিন্ট / PDF</span>
            </button>

            <button
              onClick={handleExportMatchedExcel}
              className="px-3 py-2 text-xs font-semibold text-emerald-300 bg-emerald-950/40 hover:bg-emerald-950/70 border border-emerald-500/30 rounded-lg flex items-center gap-1.5 transition-colors"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
              <span>এক্সেল (.xlsx)</span>
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

        {/* 6 Provided Warish Certificates Reference Cards (Interactive Filter) */}
        <section className="no-print bg-[#121827] border border-amber-500/30 rounded-xl p-4 space-y-3 shadow-lg">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <FileCheck2 className="w-4 h-4 text-amber-400" />
                <span>আপনার সংযুক্ত ৬টি ওয়ারিশ সনদের তালিকা (ক্লিক করে নির্দিষ্ট সনদ অনুযায়ী ফিল্টার করুন)</span>
              </h3>
              <p className="text-xs text-slate-400">
                উৎস ফাইল: <code className="text-amber-300 font-mono">ওয়ারিশ সনদের তালিকা.txt</code> (নবীনগর উপজেলা, কাইতলা দক্ষিণ ইউনিয়ন, গ্রাম: গোয়ালী)
              </p>
            </div>

            <div className="flex items-center gap-2">
              <a
                href={REFERENCE_INHERITANCE_FILE_PATH}
                download="ওয়ারিশ_সনদের_তালিকা.txt"
                className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-[11px] text-amber-300 flex items-center gap-1.5 transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
                <span>রেফারেন্স .txt ডাউনলোড</span>
              </a>
              {selectedCertId !== 'all' && (
                <button
                  onClick={() => setSelectedCertId('all')}
                  className="px-2.5 py-1.5 rounded-lg bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[11px] font-semibold"
                >
                  সকল ৬টি সনদ দেখুন
                </button>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-2.5">
            {PROVIDED_WARISH_CERTIFICATES.map((cert) => {
              const isSelected = selectedCertId === cert.id;
              const matchCountForCert = allMatchedList.filter(
                (m) => m.matchedCertificate.id === cert.id
              ).length;

              return (
                <button
                  key={cert.id}
                  onClick={() =>
                    setSelectedCertId(isSelected ? 'all' : cert.id)
                  }
                  className={`text-left p-3 rounded-xl border transition-all flex flex-col justify-between gap-2 ${
                    isSelected
                      ? 'bg-amber-500/20 border-amber-400 shadow-md shadow-amber-950/50'
                      : 'bg-[#0c111d] border-slate-800 hover:border-amber-500/40'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between gap-1 text-[10px] text-amber-300 font-mono">
                      <span className="bg-amber-500/15 px-1.5 py-0.5 rounded border border-amber-500/30">
                        সনদ #{toBengaliNumber(cert.slNo)}
                      </span>
                      <span className="truncate">{cert.certificateNo}</span>
                    </div>
                    <div className="text-xs font-bold text-white mt-1.5">
                      মৃত: {cert.deceasedName}
                    </div>
                    <div className="text-[11px] text-slate-400 truncate">
                      পিতা: {cert.fatherName}
                    </div>
                    <div className="text-[10px] text-slate-500 truncate">
                      মাতা: {cert.motherName}
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px]">
                    <span className="text-emerald-400 font-semibold">
                      ওয়ারিশ: {toBengaliNumber(cert.heirs.length)} জন
                    </span>
                    <span className="bg-slate-800 text-slate-200 px-1.5 py-0.5 rounded text-[10px]">
                      ম্যাচ: {toBengaliNumber(matchCountForCert)} টি
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </section>

        {/* Optional Collapsible Raw Reference File Viewer */}
        {showRawReferenceModal && (
          <section className="no-print bg-[#0d1322] border border-amber-500/40 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-bold text-amber-300">
                <FileText className="w-4 h-4" />
                <span>সংযুক্ত মূল ফাইল: ওয়ারিশ সনদের তালিকা.txt (অপরিবর্তিত রেফারেন্স কপি)</span>
              </div>
              <button
                onClick={() => setShowRawReferenceModal(false)}
                className="text-xs text-slate-400 hover:text-white px-2 py-1 rounded bg-slate-800"
              >
                বন্ধ করুন ✕
              </button>
            </div>
            <pre className="bg-[#070a12] border border-slate-800 rounded-lg p-3.5 text-xs text-slate-200 font-bengali whitespace-pre-wrap max-h-80 overflow-y-auto leading-relaxed">
              {rawReferenceText || 'লোড হচ্ছে...'}
            </pre>
          </section>
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
                placeholder="মালিক, মৃত ব্যক্তি, ওয়ারিশ, খতিয়ান বা দাগ খুঁজুন..."
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
              মোট ম্যাচকৃত রেকর্ড:{' '}
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
                গণপ্রজাতন্ত্রী বাংলাদেশ সরকার · ভূমি রেকর্ড ও ওয়ারিশ সনদ সমন্বয় প্রতিবেদন
              </div>
              <h1 className="text-base sm:text-xl font-bold text-white print:text-black mt-0.5">
                ওয়ারিশ সনদের সাথে ম্যাচকৃত ভূমি রেকর্ডের নতুন মাস্টার তালিকা (Matched Inheritance & Land Ledger)
              </h1>
              <p className="text-xs text-slate-300 print:text-black mt-0.5">
                রেফারেন্স ঠিকানা: গ্রাম/মৌজা: গোয়ালী, ওয়ার্ড নং: ০৮, ডাকঘর: কাইতলা - ৩৪৭৭, ইউনিয়ন: কাইতলা (দক্ষিণ), উপজেলা: নবীনগর, জেলা: ব্রাহ্মণবাড়িয়া
              </p>
            </div>

            <div className="text-right text-xs text-slate-300 print:text-black space-y-0.5">
              <div className="font-semibold text-amber-300 print:text-black">
                মোট সনদ: {toBengaliNumber(6)} টি | মোট ওয়ারিশ: {toBengaliNumber(totalHeirsCount)} জন
              </div>
              <div>
                তালিকাভুক্ত ম্যাচকৃত রেকর্ড: {toBengaliNumber(filteredMatchedList.length)} টি
              </div>
              <div>
                সর্বমোট জমি: {toBengaliNumber(totalMatchedAcre.toFixed(4))} একর
              </div>
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
                  <th className="py-2.5 px-3 border-r border-slate-800 print:border-black min-w-[200px]">
                    ম্যাচকৃত ওয়ারিশ সনদ ও মৃত পূর্বপুরুষ
                  </th>
                  <th className="py-2.5 px-3 border-r border-slate-800 print:border-black min-w-[310px]">
                    সনদভুক্ত ওয়ারিশগণের নামের তালিকা (ক্রমিক, সম্পর্ক ও জন্ম তারিখসহ)
                  </th>
                  <th className="py-2.5 px-3 text-center">
                    ম্যাচিং স্ট্যাটাস
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
                        <div className="text-[10px] font-mono text-amber-300 print:text-black">
                          সনদ নং: {cert.certificateNo}
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
                              {h.dob !== '-' && (
                                <div className="text-[9px] text-slate-500 print:text-black">
                                  জন্ম: {h.dob}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </td>

                      <td className="py-3 px-3 text-center">
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
                        <div className="text-[10px] text-slate-400 print:text-black mt-1">
                          {item.matchedPersonName}
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
