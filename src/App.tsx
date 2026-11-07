import React, { useCallback, useState } from 'react';
import {
  FileSpreadsheet,
  Printer,
  UploadCloud,
  Layers,
  Database,
  CheckCircle2,
  PieChart,
  MapPin,
  ShieldCheck,
  Download,
  Building2,
  Smartphone,
  FolderArchive,
  Files,
  FileArchive,
  Loader2,
  RotateCcw,
  Users,
  FileCheck2,
} from 'lucide-react';
import { Header } from './components/Header';
import { HierarchyExplorer } from './components/HierarchyExplorer';
import { InventoryGrid } from './components/InventoryGrid';
import { IngestionModal } from './components/IngestionModal';
import { ColumnCustomizerModal } from './components/ColumnCustomizerModal';
import { RecordDetailModal } from './components/RecordDetailModal';
import { PrintReportView } from './components/PrintReportView';
import { ArchiveTreeView } from './components/ArchiveTreeView';
import { ApkDownloadModal } from './components/ApkDownloadModal';
import { InheritanceMatcherView } from './components/InheritanceMatcherView';
import { REPOSITORY_CONFIG } from './config/repository';
import {
  PROVIDED_WARISH_CERTIFICATES,
  matchLandRecordsWithInheritance,
  convertMatchedListToLandRecords,
} from './utils/inheritanceData';
import {
  DynamicColumn,
  IngestedArchiveNode,
  IngestionSummary,
  LandRecord,
} from './types/landRecord';
import { DEFAULT_COLUMNS, INITIAL_MOCK_RECORDS } from './utils/mockData';
import { exportToCSV, exportToExcel } from './utils/exportUtils';
import {
  formatAreaBengali,
  parseAcreValue,
  toBengaliNumber,
} from './utils/bengaliNumerals';
import {
  buildArchiveFileTree,
  parseFolderIngestion,
  parseZipIngestion,
} from './utils/archiveParser';

export default function App() {
  // Main Data States
  const [records, setRecords] = useState<LandRecord[]>(INITIAL_MOCK_RECORDS);
  const [columns, setColumns] = useState<DynamicColumn[]>(() => {
    const extraKeys = new Set<string>();
    INITIAL_MOCK_RECORDS.forEach((r) => {
      Object.keys(r.extraAttributes).forEach((k) => extraKeys.add(k));
    });

    const extras: DynamicColumn[] = Array.from(extraKeys).map((key, idx) => ({
      id: key,
      label: key,
      visible: true,
      order: DEFAULT_COLUMNS.length + idx + 1,
      type: 'text',
      isExtra: true,
    }));

    return [...DEFAULT_COLUMNS, ...extras];
  });

  const [archiveTree, setArchiveTree] = useState<IngestedArchiveNode | null>(() =>
    buildArchiveFileTree(
      INITIAL_MOCK_RECORDS.map((r) => ({
        path: r.relativePath || '',
        size: r.fileSize || 350000,
      }))
    )
  );

  // Selection & Views
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [activeView, setActiveView] = useState<'ledger' | 'print' | 'tree' | 'inheritance'>('ledger');
  const [printUpazilaScope, setPrintUpazilaScope] = useState<string>('');
  const [printMouzaScope, setPrintMouzaScope] = useState<string>('');

  // Quick Home Upload Status
  const [isQuickUploading, setIsQuickUploading] = useState(false);
  const [quickUploadMsg, setQuickUploadMsg] = useState<string | null>(null);

  // Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDistrict, setSelectedDistrict] = useState('');
  const [selectedUpazila, setSelectedUpazila] = useState('');
  const [selectedMouza, setSelectedMouza] = useState('');
  const [selectedSurveyType, setSelectedSurveyType] = useState('');
  const [selectedLandClass, setSelectedLandClass] = useState('');

  // Modals
  const [isIngestOpen, setIsIngestOpen] = useState(false);
  const [isColCustomizerOpen, setIsColCustomizerOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<LandRecord | null>(null);
  const [isRecordModalOpen, setIsRecordModalOpen] = useState(false);
  const [isNewRecord, setIsNewRecord] = useState(false);
  const [isApkModalOpen, setIsApkModalOpen] = useState(false);

  // Callback ref to ensure webkitdirectory is set natively on the home page quick-folder input
  const setHomeFolderAttributes = useCallback((node: HTMLInputElement | null) => {
    if (node) {
      node.setAttribute('webkitdirectory', '');
      node.setAttribute('directory', '');
      node.setAttribute('mozdirectory', '');
      node.setAttribute('multiple', '');
    }
  }, []);

  // Distinct Upazilas & Mouzas across all records
  const availableUpazilas = Array.from(new Set(records.map((r) => r.upazila))).filter(Boolean);
  const availableMouzasForScope = Array.from(
    new Set(
      (printUpazilaScope
        ? records.filter((r) => r.upazila === printUpazilaScope)
        : records
      ).map((r) => r.mouza)
    )
  ).filter(Boolean);

  // Group Mouza summaries for the Home Page Mouza-Best PDF Implementation Hub
  const mouzaCards = React.useMemo(() => {
    const map = new Map<
      string,
      {
        mouza: string;
        jlNo: string;
        upazila: string;
        district: string;
        surveys: Set<string>;
        count: number;
        totalAcre: number;
      }
    >();

    for (const r of records) {
      const key = `${r.upazila}__${r.mouza}`;
      if (!map.has(key)) {
        map.set(key, {
          mouza: r.mouza,
          jlNo: r.jlNo,
          upazila: r.upazila,
          district: r.district,
          surveys: new Set([r.surveyType]),
          count: 0,
          totalAcre: 0,
        });
      }
      const entry = map.get(key)!;
      entry.count++;
      entry.surveys.add(r.surveyType);
      entry.totalAcre += parseAcreValue(r.area);
    }

    return Array.from(map.values());
  }, [records]);

  // Filtering Logic
  const filteredRecords = records.filter((rec) => {
    if (selectedDistrict && rec.district !== selectedDistrict) return false;
    if (selectedUpazila && rec.upazila !== selectedUpazila) return false;
    if (selectedMouza && rec.mouza !== selectedMouza) return false;
    if (selectedSurveyType && rec.surveyType !== selectedSurveyType) return false;
    if (selectedLandClass && rec.landClass !== selectedLandClass) return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const matchKhatian = rec.khatianNo?.toLowerCase().includes(q);
      const matchDag = rec.dagNo?.toLowerCase().includes(q);
      const matchOwner = rec.ownerDetails?.toLowerCase().includes(q);
      const matchMouza = rec.mouza?.toLowerCase().includes(q);
      const matchDistrict = rec.district?.toLowerCase().includes(q);
      const matchUpazila = rec.upazila?.toLowerCase().includes(q);
      const matchRemarks = rec.remarks?.toLowerCase().includes(q);
      const matchExtra = Object.values(rec.extraAttributes || {}).some((v) =>
        String(v).toLowerCase().includes(q)
      );

      return (
        matchKhatian ||
        matchDag ||
        matchOwner ||
        matchMouza ||
        matchDistrict ||
        matchUpazila ||
        matchRemarks ||
        matchExtra
      );
    }

    return true;
  });

  // Calculate Metrics
  const totalKhatianCount = new Set(filteredRecords.map((r) => `${r.mouza}_${r.khatianNo}`)).size;
  const totalDagCount = new Set(filteredRecords.map((r) => `${r.mouza}_${r.dagNo}`)).size;
  const totalAcreValue = filteredRecords.reduce((acc, r) => acc + parseAcreValue(r.area), 0);
  const verifiedCount = filteredRecords.filter((r) => r.verified).length;

  // Ingestion Handler (Preserves 100% of uploaded records — zero missing)
  const handleIngestionComplete = (
    newRecords: LandRecord[],
    summary: IngestionSummary,
    tree: IngestedArchiveNode,
    replaceExisting = true
  ) => {
    if (newRecords.length === 0) return;

    setRecords((prev) => {
      const base = replaceExisting ? newRecords : [...newRecords, ...prev];
      return base.map((r, idx) => ({ ...r, slNo: idx + 1 }));
    });

    setArchiveTree(tree);
    setSelectedDistrict('');
    setSelectedUpazila('');
    setSelectedMouza('');
    setPrintUpazilaScope('');
    setPrintMouzaScope('');

    // Dynamic Schema update
    if (summary.extraColumnsDetected.length > 0) {
      setColumns((prevCols) => {
        const existingColIds = new Set(prevCols.map((c) => c.id));
        const newCols: DynamicColumn[] = summary.extraColumnsDetected
          .filter((key) => !existingColIds.has(key))
          .map((key, i) => ({
            id: key,
            label: key,
            visible: true,
            order: prevCols.length + i + 1,
            type: 'text',
            isExtra: true,
          }));
        return [...prevCols, ...newCols];
      });
    }

    setQuickUploadMsg(
      `সফলভাবে ${toBengaliNumber(summary.totalFiles)} টি ফাইল থেকে ${toBengaliNumber(
        summary.totalRecordsExtracted
      )} টি রেকর্ড (${toBengaliNumber(summary.mouzasFound.length)} টি মৌজা) লোড হয়েছে!`
    );
    setTimeout(() => setQuickUploadMsg(null), 8000);
  };

  // Direct Home Page Upload Handler (for instant mobile/desktop folder or file upload)
  const handleDirectHomeUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setIsQuickUploading(true);
    setQuickUploadMsg(`ফোন/মেমোরি থেকে ${toBengaliNumber(files.length)} টি ফাইল স্ক্যান হচ্ছে...`);

    try {
      const firstFile = files[0];
      const result =
        files.length === 1 && firstFile.name.toLowerCase().endsWith('.zip')
          ? await parseZipIngestion(firstFile)
          : await parseFolderIngestion(files);

      handleIngestionComplete(result.records, result.summary, result.tree, true);
    } catch (err: any) {
      setQuickUploadMsg(`আপলোড ত্রুটি: ${err.message || 'অজ্ঞাত ত্রুটি'}`);
    } finally {
      setIsQuickUploading(false);
    }
  };

  // Node selection from Hierarchy Explorer
  const handleSelectHierarchyNode = (dist: string, upz: string, mouz: string) => {
    setSelectedDistrict(dist);
    setSelectedUpazila(upz);
    setSelectedMouza(mouz);
  };

  const handleClearHierarchyFilter = () => {
    setSelectedDistrict('');
    setSelectedUpazila('');
    setSelectedMouza('');
  };

  // Record CRUD Handlers
  const handleOpenEdit = (rec: LandRecord) => {
    setEditingRecord(rec);
    setIsNewRecord(false);
    setIsRecordModalOpen(true);
  };

  const handleOpenNew = () => {
    const newRec: LandRecord = {
      id: `rec-${Date.now()}`,
      slNo: records.length + 1,
      district: selectedDistrict || 'কুমিল্লা',
      upazila: selectedUpazila || 'আদর্শ সদর',
      mouza: selectedMouza || 'বরাইচারা',
      jlNo: '১০৪',
      surveyType: 'RS',
      khatianNo: toBengaliNumber(records.length + 10),
      dagNo: toBengaliNumber(records.length + 150),
      ownerDetails: '',
      share: '১.০০০০',
      landClass: 'নাল',
      area: '০.১৫০০ একর',
      remarks: '',
      extraAttributes: {},
      verified: true,
      dateIngested: new Date().toISOString(),
    };
    setEditingRecord(newRec);
    setIsNewRecord(true);
    setIsRecordModalOpen(true);
  };

  const handleSaveRecord = (savedRecord: LandRecord) => {
    if (isNewRecord) {
      setRecords((prev) => [savedRecord, ...prev]);
    } else {
      setRecords((prev) => prev.map((r) => (r.id === savedRecord.id ? savedRecord : r)));
    }
  };

  const handleDeleteRecord = (id: string) => {
    setRecords((prev) => prev.filter((r) => r.id !== id));
    setSelectedIds((prev) => {
      const copy = new Set(prev);
      copy.delete(id);
      return copy;
    });
  };

  const handleDeleteSelected = () => {
    if (selectedIds.size === 0) return;
    setRecords((prev) => prev.filter((r) => !selectedIds.has(r.id)));
    setSelectedIds(new Set());
  };

  // Export Handlers
  const handleExportExcelAll = () => {
    exportToExcel(filteredRecords, columns, 'LR_Master_Ledger_Full');
  };

  const handleExportExcelSelected = () => {
    const toExport = records.filter((r) => selectedIds.has(r.id));
    if (toExport.length === 0) return;
    exportToExcel(toExport, columns, 'LR_Master_Ledger_Selected');
  };

  const handleExportCSVAll = () => {
    exportToCSV(filteredRecords, columns, 'LR_Master_Ledger_Full');
  };

  const handleTriggerQuickPdf = (upazila?: string, mouza?: string) => {
    setPrintUpazilaScope(upazila || '');
    setPrintMouzaScope(mouza || '');
    setActiveView('print');
  };

  const handleResetToSample = () => {
    setRecords(INITIAL_MOCK_RECORDS);
    setSelectedIds(new Set());
    setSelectedDistrict('');
    setSelectedUpazila('');
    setSelectedMouza('');
    setSearchQuery('');
  };

  // Apply the new matched list (Land Records + Matched Warish Certificate Data) to the Master Ledger
  const handleApplyMatchedListToLedger = (
    matchedRecords: LandRecord[],
    openPrintAfter = false
  ) => {
    if (matchedRecords.length === 0) return;

    setRecords(matchedRecords);
    setSelectedIds(new Set());
    setSelectedDistrict('');
    setSelectedUpazila('');
    setSelectedMouza('');

    // Ensure Warish Certificate extra columns are visible in the Master Ledger & PDF Report
    const warishExtraKeys = [
      'ওয়ারিশ সনদ নং',
      'মৃত পূর্বসূরি',
      'জীবিত ওয়ারিশ সংখ্যা',
      'ওয়ারিশ প্রতি গড় অংশ',
    ];

    setColumns((prevCols) => {
      const existingIds = new Set(prevCols.map((c) => c.id));
      const addedCols: DynamicColumn[] = warishExtraKeys
        .filter((k) => !existingIds.has(k))
        .map((k, idx) => ({
          id: k,
          label: k,
          visible: true,
          order: prevCols.length + idx + 1,
          type: 'text',
          isExtra: true,
        }));
      return [...prevCols, ...addedCols];
    });

    if (openPrintAfter) {
      setPrintUpazilaScope('');
      setPrintMouzaScope('');
      setActiveView('print');
    } else {
      setQuickUploadMsg(
        `ওয়ারিশ সনদের তালিকার সাথে ম্যাচকৃত নতুন ${toBengaliNumber(
          matchedRecords.length
        )} টি রেকর্ড মাস্টার লেজারে লোড হয়েছে!`
      );
      setTimeout(() => setQuickUploadMsg(null), 8000);
    }
  };

  // 1-Click Instant Match & Load from Home Screen
  const handleInstantMatchAndLoad = (strictOnly: boolean) => {
    const matched = matchLandRecordsWithInheritance(
      records,
      PROVIDED_WARISH_CERTIFICATES,
      strictOnly
    );
    const enriched = convertMatchedListToLandRecords(matched);
    handleApplyMatchedListToLedger(enriched, false);
  };

  // Target records for Print View: Ensure 100% of uploaded records are available!
  const printTargetRecords =
    selectedIds.size > 0
      ? records.filter((r) => selectedIds.has(r.id))
      : records;

  return (
    <div className="min-h-screen bg-[#090d16] text-slate-100 flex flex-col selection:bg-amber-500/30 selection:text-amber-200">
      {/* Top Bar Contract */}
      <Header
        totalRecords={records.length}
        filteredCount={filteredRecords.length}
        selectedCount={selectedIds.size}
        activeView={activeView}
        setActiveView={setActiveView}
        onOpenIngest={() => setIsIngestOpen(true)}
        onOpenColumnCustomizer={() => setIsColCustomizerOpen(true)}
        onExportExcel={handleExportExcelAll}
        onExportCSV={handleExportCSVAll}
        onAddNewRecord={handleOpenNew}
        onResetToSample={handleResetToSample}
        onOpenApkModal={() => setIsApkModalOpen(true)}
        onQuickPdfDownload={(upz) => handleTriggerQuickPdf(upz, '')}
        availableUpazilas={availableUpazilas}
      />

      {/* Main Workspace Body */}
      {activeView === 'print' ? (
        <PrintReportView
          records={printTargetRecords}
          columns={columns}
          onBack={() => setActiveView('ledger')}
          initialSelectedUpazila={printUpazilaScope}
          initialSelectedMouza={printMouzaScope}
        />
      ) : activeView === 'inheritance' ? (
        <InheritanceMatcherView
          records={records}
          columns={columns}
          onBack={() => setActiveView('ledger')}
          onApplyMatchedListToLedger={handleApplyMatchedListToLedger}
        />
      ) : (
        <main className="flex-1 max-w-[1720px] w-full mx-auto p-3 sm:p-5 lg:p-6 flex flex-col space-y-4">
          {/* Quick Direct Phone Memory & Subfolder Upload Bar (No Modal Required!) */}
          <section className="bg-gradient-to-r from-[#141d33] via-[#18233c] to-[#12192c] border border-amber-500/40 rounded-xl p-3.5 sm:p-4 shadow-xl font-bengali">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shrink-0">
                  <UploadCloud className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-sm sm:text-base font-bold text-white flex items-center gap-2 flex-wrap">
                    <span>ফোন মেমোরি ও সাব-ফোল্ডার ডিরেক্ট আপলোড (Phone & Folder Upload)</span>
                    <span className="text-[11px] bg-amber-500/20 text-amber-300 border border-amber-500/40 px-2 py-0.5 rounded">
                      সকল সাব-ফোল্ডার সাপোর্ট
                    </span>
                  </h2>
                  <p className="text-xs text-slate-300">
                    আপনার ফোনে বা পিসিতে ডাউনলোড করা সম্পূর্ণ ফোল্ডার, একাধিক ফাইল (PDF, ছবি, Excel, CSV) অথবা ZIP সরাসরি এখান থেকেই সিলেক্ট করুন।
                  </p>
                </div>
              </div>

              {/* Native <label> Upload Buttons directly on the Home Screen for 100% Mobile Compatibility */}
              <div className="flex flex-wrap items-center gap-2">
                <label className="cursor-pointer px-3.5 py-2 rounded-lg bg-gradient-to-r from-amber-400 via-amber-300 to-yellow-500 hover:from-amber-300 hover:to-yellow-400 text-slate-950 font-bold text-xs shadow-md flex items-center gap-1.5 transition-all">
                  <FolderArchive className="w-4 h-4 stroke-[2.5]" />
                  <span>ফোল্ডার ও সাব-ফোল্ডার নির্বাচন</span>
                  <input
                    type="file"
                    ref={setHomeFolderAttributes}
                    className="sr-only"
                    onChange={(e) => {
                      handleDirectHomeUpload(e.target.files);
                      e.target.value = '';
                    }}
                  />
                </label>

                <label className="cursor-pointer px-3.5 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-md flex items-center gap-1.5 transition-all">
                  <Files className="w-4 h-4 stroke-[2.5]" />
                  <span>ফোন মেমোরি ফাইল / ZIP নির্বাচন</span>
                  <input
                    type="file"
                    multiple
                    className="sr-only"
                    onChange={(e) => {
                      handleDirectHomeUpload(e.target.files);
                      e.target.value = '';
                    }}
                  />
                </label>

                <button
                  onClick={() => setIsIngestOpen(true)}
                  className="px-3 py-2 rounded-lg bg-[#1d2944] hover:bg-[#263556] border border-slate-700 text-slate-200 text-xs font-medium transition-colors"
                >
                  অ্যাডভান্সড অপশন
                </button>

                <button
                  onClick={handleResetToSample}
                  title="নমুনা ডাটা রিসেট করুন"
                  className="p-2 rounded-lg bg-[#161f33] hover:bg-slate-800 border border-slate-700/80 text-slate-400 hover:text-amber-300 transition-colors"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {(isQuickUploading || quickUploadMsg) && (
              <div className="mt-3 pt-2.5 border-t border-slate-800/80 flex items-center justify-between gap-2 text-xs">
                <div className="flex items-center gap-2 text-emerald-300 font-semibold">
                  {isQuickUploading ? (
                    <Loader2 className="w-4 h-4 animate-spin text-amber-400" />
                  ) : (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  )}
                  <span>{quickUploadMsg}</span>
                </div>
                {!isQuickUploading && (
                  <button
                    onClick={() => handleTriggerQuickPdf('', '')}
                    className="px-3 py-1 bg-amber-400 text-slate-950 font-bold rounded text-xs hover:bg-amber-300"
                  >
                    মৌজাভিত্তিক PDF দেখুন →
                  </button>
                )}
              </div>
            )}
          </section>

          {/* Inheritance (Warish Certificate) Matching & New Matched List Hub */}
          <section className="bg-gradient-to-r from-[#0e221d] via-[#122624] to-[#11192a] border border-emerald-500/40 rounded-xl p-3.5 sm:p-4 shadow-lg font-bengali">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shrink-0">
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-sm sm:text-base font-bold text-white flex items-center gap-2 flex-wrap">
                    <span>সংযুক্ত ওয়ারিশ সনদের তালিকা ও খতিয়ান ম্যাচকৃত নতুন তালিকা (Inheritance List Matcher)</span>
                    <span className="text-[11px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-2 py-0.5 rounded">
                      ৬টি ওয়ারিশ সনদ · ৪৯ জন ওয়ারিশ (গ্রাম: গোয়ালী, নবীনগর)
                    </span>
                  </h2>
                  <p className="text-xs text-slate-300">
                    আপনার সংযুক্ত ৬টি ওয়ারিশ সনদের (মৃত ফিরুজ মিয়া, সফর আলী, সিরাজ আলী, মোঃ জাহের মিয়া, আব্দুল কাদির ও নোয়াব মিয়া) সাথে তৈরিকৃত খতিয়ান-দাগ তালিকা মিলিয়ে নতুন ম্যাচকৃত তালিকা তৈরি ও প্রিন্ট করুন।
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={() => setActiveView('inheritance')}
                  className="px-3.5 py-2 rounded-lg bg-gradient-to-r from-emerald-400 to-teal-400 hover:from-emerald-300 hover:to-teal-300 text-slate-950 font-bold text-xs shadow-md flex items-center gap-1.5 transition-all"
                >
                  <FileCheck2 className="w-4 h-4 stroke-[2.5]" />
                  <span>ওয়ারিশ ম্যাচকৃত নতুন তালিকা দেখুন ({toBengaliNumber(records.length)} টি)</span>
                </button>

                <button
                  onClick={() => handleInstantMatchAndLoad(false)}
                  className="px-3 py-2 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-200 text-xs font-semibold transition-colors"
                >
                  ১-ক্লিকে সকল রেকর্ড ওয়ারিশসহ লেজারে যুক্ত করুন
                </button>

                <button
                  onClick={() => handleInstantMatchAndLoad(true)}
                  className="px-3 py-2 rounded-lg bg-[#162336] hover:bg-[#1e304a] border border-slate-700 text-slate-200 text-xs font-medium transition-colors"
                >
                  শুধু গোয়ালী মৌজার ওয়ারিশ ম্যাচ লোড করুন
                </button>
              </div>
            </div>
          </section>

          {/* Top Metric Cards */}
          <section className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
            <div className="bg-[#121827] border border-amber-500/20 rounded-xl p-3 sm:p-4 flex items-center justify-between shadow-lg shadow-black/30">
              <div className="space-y-0.5 font-bengali">
                <span className="text-[11px] text-slate-400 font-medium">সর্বমোট খতিয়ান সংখ্যা</span>
                <div className="text-xl sm:text-2xl font-bold font-mono-num text-amber-300">
                  {toBengaliNumber(totalKhatianCount)}
                </div>
                <div className="text-[10px] text-slate-400">অনন্য খতিয়ান লেজার</div>
              </div>
              <div className="w-10 h-10 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
                <Database className="w-5 h-5" />
              </div>
            </div>

            <div className="bg-[#121827] border border-amber-500/20 rounded-xl p-3 sm:p-4 flex items-center justify-between shadow-lg shadow-black/30">
              <div className="space-y-0.5 font-bengali">
                <span className="text-[11px] text-slate-400 font-medium">সর্বমোট দাগ / প্লট</span>
                <div className="text-xl sm:text-2xl font-bold font-mono-num text-slate-100">
                  {toBengaliNumber(totalDagCount)}
                </div>
                <div className="text-[10px] text-slate-400">স্বতন্ত্র প্লট ম্যাপিং</div>
              </div>
              <div className="w-10 h-10 rounded-lg bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400">
                <PieChart className="w-5 h-5" />
              </div>
            </div>

            <div className="bg-[#121827] border border-amber-500/20 rounded-xl p-3 sm:p-4 flex items-center justify-between shadow-lg shadow-black/30">
              <div className="space-y-0.5 font-bengali">
                <span className="text-[11px] text-slate-400 font-medium">মোট জমির আয়তন</span>
                <div className="text-base sm:text-lg font-bold font-mono-num text-emerald-400 truncate">
                  {toBengaliNumber(totalAcreValue.toFixed(4))} একর
                </div>
                <div className="text-[10px] text-slate-400">
                  {(totalAcreValue * 100).toFixed(1)} শতাংশ সমান
                </div>
              </div>
              <div className="w-10 h-10 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                <Layers className="w-5 h-5" />
              </div>
            </div>

            <div className="bg-[#121827] border border-amber-500/20 rounded-xl p-3 sm:p-4 flex items-center justify-between shadow-lg shadow-black/30">
              <div className="space-y-0.5 font-bengali">
                <span className="text-[11px] text-slate-400 font-medium">মোট মৌজা ও রেকর্ড</span>
                <div className="text-xl sm:text-2xl font-bold font-mono-num text-amber-200">
                  {toBengaliNumber(mouzaCards.length)} মৌজা ({toBengaliNumber(filteredRecords.length)})
                </div>
                <div className="text-[10px] text-emerald-400 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3 inline" />
                  <span>১০০% রেকর্ড অন্তর্ভুক্ত</span>
                </div>
              </div>
              <div className="w-10 h-10 rounded-lg bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400">
                <ShieldCheck className="w-5 h-5" />
              </div>
            </div>
          </section>

          {/* Mouza-Best PDF Implementation Hub (মৌজাভিত্তিক মাস্টার PDF হাব) */}
          <section className="bg-[#121827] border border-amber-500/30 rounded-xl p-4 shadow-lg space-y-3 font-bengali">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-lg bg-emerald-500/15 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shrink-0">
                  <Printer className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2 flex-wrap">
                    <span>মৌজাভিত্তিক মাস্টার PDF হাব (Mouza-Best PDF Generator)</span>
                    <span className="text-[10px] font-mono bg-emerald-950/60 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded">
                      প্রতিটি মৌজার পৃথক টেবিল · ০% মিসিং রেকর্ড
                    </span>
                  </h3>
                  <p className="text-xs text-slate-400">
                    যেকোনো একক মৌজা অথবা সমগ্র উপজেলার সকল মৌজার পৃথক টেবিল সংবলিত A4 Landscape PDF রিপোর্ট ১-ক্লিকে তৈরি করুন।
                  </p>
                </div>
              </div>

              {/* Upazila + Mouza Selectors + Master Print Button */}
              <div className="flex flex-wrap items-center gap-2">
                <div className="flex items-center gap-1.5 bg-[#0b0f19] border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs">
                  <Building2 className="w-3.5 h-3.5 text-amber-400" />
                  <select
                    value={printUpazilaScope}
                    onChange={(e) => {
                      setPrintUpazilaScope(e.target.value);
                      setPrintMouzaScope('');
                    }}
                    className="bg-transparent text-slate-200 focus:outline-none cursor-pointer"
                  >
                    <option value="" className="bg-[#121827] text-slate-200">
                      সকল উপজেলা ({toBengaliNumber(records.length)} রেকর্ড)
                    </option>
                    {availableUpazilas.map((u) => (
                      <option key={u} value={u} className="bg-[#121827] text-slate-200">
                        {u} উপজেলা ({toBengaliNumber(records.filter((r) => r.upazila === u).length)} রেকর্ড)
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center gap-1.5 bg-[#0b0f19] border border-emerald-500/40 rounded-lg px-2.5 py-1.5 text-xs">
                  <MapPin className="w-3.5 h-3.5 text-emerald-400" />
                  <select
                    value={printMouzaScope}
                    onChange={(e) => setPrintMouzaScope(e.target.value)}
                    className="bg-transparent text-emerald-300 font-semibold focus:outline-none cursor-pointer"
                  >
                    <option value="" className="bg-[#121827] text-slate-200">
                      সকল মৌজা (পৃথক টেবিলে)
                    </option>
                    {availableMouzasForScope.map((m) => (
                      <option key={m} value={m} className="bg-[#121827] text-slate-200">
                        মৌজা: {m}
                      </option>
                    ))}
                  </select>
                </div>

                <button
                  onClick={() => handleTriggerQuickPdf(printUpazilaScope, printMouzaScope)}
                  className="px-4 py-2 text-xs font-bold text-slate-950 bg-gradient-to-r from-amber-400 via-amber-300 to-yellow-400 hover:from-amber-300 hover:to-yellow-300 active:scale-[0.98] rounded-lg shadow-md flex items-center gap-1.5 transition-all"
                >
                  <Download className="w-3.5 h-3.5 text-slate-950 stroke-[2.5]" />
                  <span>
                    {printMouzaScope
                      ? `${printMouzaScope} মৌজার PDF ডাউনলোড`
                      : 'মৌজাভিত্তিক মাস্টার PDF ডাউনলোড'}
                  </span>
                </button>

                <a
                  href={REPOSITORY_CONFIG.fallbackApkDownloadUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-2 text-xs font-bold text-emerald-300 bg-emerald-950/50 hover:bg-emerald-900/60 border border-emerald-500/40 rounded-lg flex items-center gap-1.5 transition-colors"
                  title="GitHub Repository থেকে সরাসরি .APK ডাউনলোড করুন"
                >
                  <Smartphone className="w-3.5 h-3.5 text-emerald-400" />
                  <span>GitHub .APK ডাউনলোড</span>
                </a>

                <button
                  onClick={() => setIsApkModalOpen(true)}
                  className="px-3 py-2 text-xs font-medium text-amber-300 bg-[#1e2a44] hover:bg-[#273757] border border-amber-500/40 rounded-lg flex items-center gap-1.5 transition-colors"
                >
                  <Smartphone className="w-3.5 h-3.5 text-amber-400" />
                  <span>ফোনে ইনস্টল ও APK হাব</span>
                </button>
              </div>
            </div>

            {/* Individual Mouza Quick-PDF Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2.5 pt-1">
              {mouzaCards.map((mc) => (
                <div
                  key={`${mc.upazila}_${mc.mouza}`}
                  className="bg-[#0e1422] border border-slate-800 hover:border-amber-500/40 rounded-lg p-2.5 flex flex-col justify-between gap-2 transition-all"
                >
                  <div>
                    <div className="flex items-center justify-between gap-1">
                      <span className="text-xs font-bold text-white truncate">
                        মৌজা: {mc.mouza}
                      </span>
                      <span className="text-[10px] font-mono-num text-amber-300 bg-amber-500/10 px-1.5 py-0.5 rounded shrink-0">
                        JL {mc.jlNo}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-400 truncate mt-0.5">
                      {mc.upazila}, {mc.district}
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-slate-300 pt-1 border-t border-slate-800/80">
                    <span className="font-mono-num">
                      {toBengaliNumber(mc.count)} টি রেকর্ড · {toBengaliNumber(mc.totalAcre.toFixed(2))} একর
                    </span>
                    <button
                      onClick={() => handleTriggerQuickPdf(mc.upazila, mc.mouza)}
                      className="px-2 py-0.5 bg-amber-500/20 hover:bg-amber-400 text-amber-300 hover:text-slate-950 font-semibold rounded text-[10px] flex items-center gap-1 transition-colors"
                    >
                      <Printer className="w-2.5 h-2.5" />
                      <span>PDF</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Core Content Area */}
          {activeView === 'tree' ? (
            <ArchiveTreeView
              tree={archiveTree}
              records={records}
              onSelectRecord={handleOpenEdit}
              onOpenIngest={() => setIsIngestOpen(true)}
            />
          ) : (
            <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-4 items-start min-h-[600px]">
              {/* Left Side: Administrative Hierarchy Explorer */}
              <div className="lg:col-span-3 h-[680px]">
                <HierarchyExplorer
                  records={records}
                  selectedDistrict={selectedDistrict}
                  selectedUpazila={selectedUpazila}
                  selectedMouza={selectedMouza}
                  onSelectNode={handleSelectHierarchyNode}
                  onClearFilter={handleClearHierarchyFilter}
                />
              </div>

              {/* Right Side: Interactive Dynamic Schema Inventory Grid */}
              <div className="lg:col-span-9 h-[680px] flex flex-col">
                <InventoryGrid
                  records={filteredRecords}
                  columns={columns}
                  selectedIds={selectedIds}
                  setSelectedIds={setSelectedIds}
                  searchQuery={searchQuery}
                  setSearchQuery={setSearchQuery}
                  selectedSurveyType={selectedSurveyType}
                  setSelectedSurveyType={setSelectedSurveyType}
                  selectedLandClass={selectedLandClass}
                  setSelectedLandClass={setSelectedLandClass}
                  onEditRecord={handleOpenEdit}
                  onDeleteRecord={handleDeleteRecord}
                  onDeleteSelected={handleDeleteSelected}
                  onPrintSelected={() => setActiveView('print')}
                  onExportSelected={handleExportExcelSelected}
                  onAddNewRecord={handleOpenNew}
                />
              </div>
            </div>
          )}
        </main>
      )}

      {/* Ingestion Engine Modal (Folder + Phone Memory + ZIP) */}
      <IngestionModal
        isOpen={isIngestOpen}
        onClose={() => setIsIngestOpen(false)}
        onIngestionComplete={handleIngestionComplete}
        onOpenPrintAfterIngest={() => handleTriggerQuickPdf('', '')}
      />

      {/* Dynamic Column Customizer Modal */}
      <ColumnCustomizerModal
        isOpen={isColCustomizerOpen}
        onClose={() => setIsColCustomizerOpen(false)}
        columns={columns}
        setColumns={setColumns}
      />

      {/* Record Detail & Edit Modal */}
      <RecordDetailModal
        record={editingRecord}
        isOpen={isRecordModalOpen}
        onClose={() => setIsRecordModalOpen(false)}
        onSaveRecord={handleSaveRecord}
        isNew={isNewRecord}
      />

      {/* Android APK & GitHub Repository Sync Modal */}
      <ApkDownloadModal
        isOpen={isApkModalOpen}
        onClose={() => setIsApkModalOpen(false)}
        records={records}
      />
    </div>
  );
}
