import React, { useState } from 'react';
import {
  FileSpreadsheet,
  Printer,
  UploadCloud,
  Layers,
  Database,
  CheckCircle2,
  PieChart,
  MapPin,
  RefreshCw,
  Sparkles,
  ShieldCheck,
  FolderTree,
  Download,
  Building2,
  Smartphone,
  ExternalLink,
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
import { buildArchiveFileTree } from './utils/archiveParser';

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
  const [activeView, setActiveView] = useState<'ledger' | 'print' | 'tree'>('ledger');
  const [printUpazilaScope, setPrintUpazilaScope] = useState<string>('');

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

  // Distinct Upazilas across all records
  const availableUpazilas = Array.from(new Set(records.map((r) => r.upazila))).filter(Boolean);

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

  // Ingestion Handlers
  const handleIngestionComplete = (
    newRecords: LandRecord[],
    summary: IngestionSummary,
    tree: IngestedArchiveNode
  ) => {
    // Append records without dropping any
    setRecords((prev) => {
      const combined = [...newRecords, ...prev];
      const seen = new Set<string>();
      return combined.filter((r) => {
        const key = `${r.district}_${r.upazila}_${r.mouza}_${r.khatianNo}_${r.dagNo}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });
    });

    setArchiveTree(tree);

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

    setIsIngestOpen(false);
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
    if (
      confirm(
        `আপনি কি নিশ্চিত যে নির্বাচিত ${toBengaliNumber(
          selectedIds.size
        )} টি রেকর্ড মুছে ফেলতে চান?`
      )
    ) {
      setRecords((prev) => prev.filter((r) => !selectedIds.has(r.id)));
      setSelectedIds(new Set());
    }
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

  const handleTriggerQuickPdf = (upazila?: string) => {
    setPrintUpazilaScope(upazila || '');
    setActiveView('print');
  };

  const handleResetToSample = () => {
    if (confirm('নমুনা ডাটায় রিসেট করতে চান? আপনার বর্তমান পরিবর্তন রিসেট হবে।')) {
      setRecords(INITIAL_MOCK_RECORDS);
      setSelectedIds(new Set());
      setSelectedDistrict('');
      setSelectedUpazila('');
      setSelectedMouza('');
      setSearchQuery('');
    }
  };

  // Target records for Print View: Ensure no records from the uploaded sources are missing!
  const printTargetRecords =
    selectedIds.size > 0
      ? records.filter((r) => selectedIds.has(r.id))
      : records; // Default to all uploaded records so none are missing!

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
        onQuickPdfDownload={handleTriggerQuickPdf}
        availableUpazilas={availableUpazilas}
      />

      {/* Main Workspace Body */}
      {activeView === 'print' ? (
        <PrintReportView
          records={printTargetRecords}
          columns={columns}
          onBack={() => setActiveView('ledger')}
          initialSelectedUpazila={printUpazilaScope}
        />
      ) : (
        <main className="flex-1 max-w-[1720px] w-full mx-auto p-3 sm:p-5 lg:p-6 flex flex-col space-y-4">
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
                <span className="text-[11px] text-slate-400 font-medium">যাচাইকৃত খতিয়ান রেকর্ড</span>
                <div className="text-xl sm:text-2xl font-bold font-mono-num text-amber-200">
                  {toBengaliNumber(verifiedCount)} / {toBengaliNumber(filteredRecords.length)}
                </div>
                <div className="text-[10px] text-emerald-400 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3 inline" />
                  <span>রেজিস্ট্রি ভ্যালিডেটেড</span>
                </div>
              </div>
              <div className="w-10 h-10 rounded-lg bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400">
                <ShieldCheck className="w-5 h-5" />
              </div>
            </div>
          </section>

          {/* Quick PDF & APK Action Banner directly in UI Home Page */}
          <section className="bg-gradient-to-r from-[#12192b] via-[#162138] to-[#111726] border border-amber-500/30 rounded-xl p-4 shadow-lg flex flex-wrap items-center justify-between gap-4 font-bengali">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shrink-0">
                <Printer className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <span>উপজেলা ও মৌজাভিত্তিক A4 লেজার PDF ডাউনলোড সেন্টার</span>
                  <span className="text-[10px] font-mono bg-emerald-950/60 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded">
                    সকল রেকর্ড অন্তর্ভুক্ত · নো মিসিং
                  </span>
                </h3>
                <p className="text-xs text-slate-400">
                  যেকোনো উপজেলার সকল রেকর্ড মৌজাভিত্তিক আলাদা টেবিলে বিভক্ত করে প্রফেশনাল A4 ল্যান্ডস্কেপ PDF প্রিন্ট বা সংরক্ষণ করুন।
                </p>
              </div>
            </div>

            {/* Direct Quick PDF and APK Buttons */}
            <div className="flex flex-wrap items-center gap-2.5">
              <div className="flex items-center gap-1.5 bg-[#0b0f19] border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs">
                <Building2 className="w-3.5 h-3.5 text-amber-400" />
                <select
                  value={printUpazilaScope}
                  onChange={(e) => setPrintUpazilaScope(e.target.value)}
                  className="bg-transparent text-slate-200 focus:outline-none cursor-pointer"
                >
                  <option value="" className="bg-[#121827] text-slate-200">
                    সকল উপজেলা (মৌজাভিত্তিক আলাদা টেবিল)
                  </option>
                  {availableUpazilas.map((u) => (
                    <option key={u} value={u} className="bg-[#121827] text-slate-200">
                      {u} উপজেলা ({toBengaliNumber(records.filter((r) => r.upazila === u).length)} রেকর্ড)
                    </option>
                  ))}
                </select>
              </div>

              <button
                onClick={() => handleTriggerQuickPdf(printUpazilaScope)}
                className="px-4 py-2 text-xs font-semibold text-slate-950 bg-gradient-to-r from-amber-400 via-amber-300 to-yellow-400 hover:from-amber-300 hover:to-yellow-300 active:scale-[0.98] rounded-lg shadow-md shadow-amber-950/40 flex items-center gap-1.5 transition-all"
              >
                <Download className="w-3.5 h-3.5 text-slate-950 stroke-[2.5]" />
                <span>PDF লেজার ডাউনলোড / প্রিন্ট</span>
              </button>

              <button
                onClick={() => setIsApkModalOpen(true)}
                className="px-3.5 py-2 text-xs font-medium text-amber-300 bg-[#1e2a44] hover:bg-[#273757] border border-amber-500/40 rounded-lg flex items-center gap-1.5 transition-colors"
              >
                <Smartphone className="w-3.5 h-3.5 text-amber-400" />
                <span>অ্যান্ড্রয়েড APK (.apk)</span>
              </button>
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
              {/* Left Side: Administrative Hierarchy Explorer (3 columns on lg) */}
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

              {/* Right Side: Interactive Dynamic Schema Inventory Grid (9 columns on lg) */}
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

      {/* Ingestion Engine Modal (Folder + ZIP) */}
      <IngestionModal
        isOpen={isIngestOpen}
        onClose={() => setIsIngestOpen(false)}
        onIngestionComplete={handleIngestionComplete}
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

      {/* Android APK Download Modal */}
      <ApkDownloadModal
        isOpen={isApkModalOpen}
        onClose={() => setIsApkModalOpen(false)}
      />
    </div>
  );
}
