import React, { useEffect, useMemo, useState } from 'react';
import { FileDown } from 'lucide-react';
import { Header, WorkspaceView } from './components/Header';
import { HomeDashboard } from './components/HomeDashboard';
import { BrowseWorkspace } from './components/BrowseWorkspace';
import { MatchWorkspace, MatchWorkspaceTab } from './components/MatchWorkspace';
import { ExportCenter } from './components/ExportCenter';
import { SettingsPanel, ThemeMode } from './components/SettingsPanel';
import { IngestionModal } from './components/IngestionModal';
import { ColumnCustomizerModal } from './components/ColumnCustomizerModal';
import { RecordDetailModal } from './components/RecordDetailModal';
import { PrintReportView } from './components/PrintReportView';
import { ApkDownloadModal } from './components/ApkDownloadModal';
import { ReportTabId } from './components/ForensicAuditView';
import { SlulisTabId } from './components/SingleLineageInvestigationView';
import { LedgerAuditVersionEntry } from './types/forensic';
import {
  DynamicColumn,
  IngestedArchiveNode,
  IngestionSummary,
  LandRecord,
} from './types/landRecord';
import { DEFAULT_COLUMNS, INITIAL_MOCK_RECORDS } from './utils/mockData';
import { exportToExcel } from './utils/exportUtils';
import { parseAcreValue, toBengaliNumber } from './utils/bengaliNumerals';
import {
  buildArchiveFileTree,
  parseFolderIngestion,
  parseZipIngestion,
} from './utils/archiveParser';
import {
  getSessionCacheInfo,
  purgeAllAppGeneratedCaches,
  registerExitCacheCleanup,
} from './utils/cacheCleaner';

export default function App() {
  // Main Data States (100% client-side, zero missing records)
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

  // Theme Mode (Dark / Light / System)
  const [themeMode, setThemeMode] = useState<ThemeMode>('dark');

  useEffect(() => {
    const root = document.documentElement;
    const applyTheme = (isDark: boolean) => {
      root.classList.toggle('dark', isDark);
      root.classList.toggle('light', !isDark);
    };

    if (themeMode === 'dark') {
      applyTheme(true);
      return;
    }
    if (themeMode === 'light') {
      applyTheme(false);
      return;
    }

    const media = window.matchMedia('(prefers-color-scheme: dark)');
    applyTheme(media.matches);
    const handler = (e: MediaQueryListEvent) => applyTheme(e.matches);
    media.addEventListener('change', handler);
    return () => media.removeEventListener('change', handler);
  }, [themeMode]);

  // Selection & 4-Pillar Navigation States
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [activeView, setActiveView] = useState<WorkspaceView>('home');
  const [matchInitialTab, setMatchInitialTab] = useState<MatchWorkspaceTab>('inheritance');
  const [matchNavKey, setMatchNavKey] = useState<number>(0);
  const [slulisInitialTab] = useState<SlulisTabId>('summary');
  const [forensicInitialTab] = useState<ReportTabId>('report2');

  const [printUpazilaScope, setPrintUpazilaScope] = useState<string>('');
  const [printMouzaScope, setPrintMouzaScope] = useState<string>('');
  const [exportUpazilaScope, setExportUpazilaScope] = useState<string>('');
  const [exportMouzaScope, setExportMouzaScope] = useState<string>('');

  const [versionHistory, setVersionHistory] = useState<LedgerAuditVersionEntry[]>(() => [
    {
      versionId: 'VER-INIT-001',
      timestamp: 'প্রাথমিক মাস্টার লেজার বেসলাইন',
      actionTitle: 'প্রাথমিক যাচাইকৃত মাস্টার লেজার স্ন্যাপশট (Initial Baseline Snapshot — CS/SA/RS/BS)',
      proposalId: 'PROP-BASELINE-INIT',
      evidenceIds: ['EVD-CS-303', 'EVD-SA-752', 'EVD-RS-905', 'EVD-BS-2905'],
      previousRecordsSnapshot: INITIAL_MOCK_RECORDS,
    },
  ]);

  // Quick Home Upload & Cache Cleaner States
  const [isQuickUploading, setIsQuickUploading] = useState(false);
  const [quickUploadMsg, setQuickUploadMsg] = useState<string | null>(null);
  const [generatedCacheCount, setGeneratedCacheCount] = useState<number>(0);

  // Automatically delete all app-generated cached files, Blob URLs, IndexedDB, and Cache Storage when exiting the app
  useEffect(() => {
    const syncCount = () => {
      const info = getSessionCacheInfo();
      setGeneratedCacheCount(info.totalGeneratedFilesCount + info.activeBlobUrlsCount);
    };
    const cleanup = registerExitCacheCleanup(syncCount);
    syncCount();
    return cleanup;
  }, []);

  const handlePurgeAllCachedFilesNow = async () => {
    const stats = await purgeAllAppGeneratedCaches();
    setGeneratedCacheCount(0);
    setQuickUploadMsg(
      `অ্যাপের সকল জেনারেটেড ক্যাশ ফাইল (Blob URLs: ${toBengaliNumber(stats.revokedBlobUrls)}, IndexedDB: ${toBengaliNumber(stats.deletedIndexedDbCount)}, Cache Storage: ${toBengaliNumber(stats.deletedCacheStorageCount)}) সফলভাবে মুছে ফেলা হয়েছে!`
    );
    setTimeout(() => setQuickUploadMsg(null), 6000);
  };

  // Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDistrict, setSelectedDistrict] = useState('');
  const [selectedUpazila, setSelectedUpazila] = useState('');
  const [selectedMouza, setSelectedMouza] = useState('');
  const [selectedSurveyType, setSelectedSurveyType] = useState('');
  const [selectedLandClass, setSelectedLandClass] = useState('');

  // Modals & Slide-Over Panels
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isIngestOpen, setIsIngestOpen] = useState(false);
  const [isColCustomizerOpen, setIsColCustomizerOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<LandRecord | null>(null);
  const [isRecordModalOpen, setIsRecordModalOpen] = useState(false);
  const [isNewRecord, setIsNewRecord] = useState(false);
  const [isApkModalOpen, setIsApkModalOpen] = useState(false);

  // Distinct Upazilas & Mouzas across all records
  const availableUpazilas = useMemo(
    () => Array.from(new Set(records.map((r) => r.upazila))).filter(Boolean),
    [records]
  );

  const mouzaCards = useMemo(() => {
    const map = new Map<
      string,
      {
        mouza: string;
        jlNo: string;
        upazila: string;
        district: string;
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
          count: 0,
          totalAcre: 0,
        });
      }
      const entry = map.get(key)!;
      entry.count++;
      entry.totalAcre += parseAcreValue(r.area);
    }

    return Array.from(map.values());
  }, [records]);

  // Filtering Logic
  const filteredRecords = useMemo(() => {
    return records.filter((rec) => {
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
  }, [
    records,
    selectedDistrict,
    selectedUpazila,
    selectedMouza,
    selectedSurveyType,
    selectedLandClass,
    searchQuery,
  ]);

  // Overview Metrics (All records on Home, filtered in Browse)
  const totalKhatianCount = useMemo(
    () => new Set(records.map((r) => `${r.mouza}_${r.khatianNo}`)).size,
    [records]
  );
  const totalDagCount = useMemo(
    () => new Set(records.map((r) => `${r.mouza}_${r.dagNo}`)).size,
    [records]
  );
  const totalAcreValue = useMemo(
    () => records.reduce((acc, r) => acc + parseAcreValue(r.area), 0),
    [records]
  );

  // Navigation Helpers
  const handleNavigateMatch = (tab: MatchWorkspaceTab = 'inheritance') => {
    setMatchInitialTab(tab);
    setMatchNavKey((k) => k + 1);
    setActiveView('match');
  };

  const handleJumpToExportCenter = (upazila?: string, mouza?: string) => {
    setExportUpazilaScope(upazila || '');
    setExportMouzaScope(mouza || '');
    setActiveView('export');
  };

  const handleQuickSearchJump = (query: string, upazila?: string, mouza?: string) => {
    if (upazila !== undefined || mouza !== undefined) {
      setSelectedDistrict('');
      setSelectedUpazila(upazila || '');
      setSelectedMouza(mouza || '');
      setSearchQuery(query);
    } else {
      setSearchQuery(query);
    }
    setActiveView('browse');
  };

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
    setExportUpazilaScope('');
    setExportMouzaScope('');

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
      district: selectedDistrict || 'ব্রাহ্মণবাড়িয়া',
      upazila: selectedUpazila || 'নবীনগর',
      mouza: selectedMouza || 'গোয়ালী',
      jlNo: '৮৪',
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

  const handleExportExcelSelected = () => {
    const toExport = records.filter((r) => selectedIds.has(r.id));
    if (toExport.length === 0) return;
    exportToExcel(toExport, columns, 'LR_Master_Ledger_Selected');
  };

  const handleResetToSample = () => {
    setRecords(INITIAL_MOCK_RECORDS);
    setSelectedIds(new Set());
    setSelectedDistrict('');
    setSelectedUpazila('');
    setSelectedMouza('');
    setSearchQuery('');
  };

  // Apply the matched list (Land Records + Matched Warish Certificate Data) to the Master Ledger
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

  // Forensic Master Ledger Proposal Approval (with Rollback Snapshot)
  const handleApproveLedgerProposal = (
    updatedRecords: LandRecord[],
    versionEntry: LedgerAuditVersionEntry
  ) => {
    setVersionHistory((prev) => [versionEntry, ...prev]);
    setRecords(updatedRecords);
    setQuickUploadMsg(
      `অনুমোদিত ফরেনসিক প্রস্তাবনা মাস্টার লেজারে সংযুক্ত হয়েছে (${versionEntry.actionTitle})।`
    );
    setTimeout(() => setQuickUploadMsg(null), 7000);
  };

  // Rollback Master Ledger to a Previous Snapshot
  const handleRollbackLedgerVersion = (versionEntry: LedgerAuditVersionEntry) => {
    setRecords(versionEntry.previousRecordsSnapshot);
    const rollbackLog: LedgerAuditVersionEntry = {
      versionId: `VER-ROLLBACK-${Date.now()}`,
      timestamp: new Date().toISOString(),
      actionTitle: `রোলব্যাক কার্যকর করা হয়েছে: ${versionEntry.versionId} (${versionEntry.actionTitle})`,
      proposalId: versionEntry.proposalId,
      evidenceIds: versionEntry.evidenceIds,
      previousRecordsSnapshot: versionEntry.previousRecordsSnapshot,
    };
    setVersionHistory((prev) => [rollbackLog, ...prev]);
    setQuickUploadMsg(`সফলভাবে পূর্ববর্তী সংস্করণ (${versionEntry.versionId})-এ রোলব্যাক করা হয়েছে!`);
    setTimeout(() => setQuickUploadMsg(null), 7000);
  };

  // Target records for Print Studio: Selected or all records
  const printTargetRecords =
    selectedIds.size > 0
      ? records.filter((r) => selectedIds.has(r.id))
      : records;

  return (
    <div className="min-h-screen app-body flex flex-col selection:bg-amber-500/30 selection:text-amber-200 transition-colors">
      {/* Persistent Minimal Header (Logo + Upazila/Mouza Quick Search + Settings Gear) */}
      <Header
        totalRecords={records.length}
        mouzaCount={mouzaCards.length}
        activeView={activeView}
        onNavigateHome={() => setActiveView('home')}
        onQuickSearchJump={handleQuickSearchJump}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        availableUpazilas={availableUpazilas}
        availableMouzas={mouzaCards.map((m) => ({
          mouza: m.mouza,
          upazila: m.upazila,
          count: m.count,
        }))}
        onOpenSettings={() => setIsSettingsOpen(true)}
        generatedCacheCount={generatedCacheCount}
      />

      {/* Pillar 0: 4-Pillar 3D Home Dashboard */}
      {activeView === 'home' && (
        <HomeDashboard
          records={records}
          mouzaCount={mouzaCards.length}
          totalKhatianCount={totalKhatianCount}
          totalDagCount={totalDagCount}
          totalAcreValue={totalAcreValue}
          onDirectUpload={handleDirectHomeUpload}
          onOpenIngestModal={() => setIsIngestOpen(true)}
          onNavigateBrowse={() => setActiveView('browse')}
          onNavigateMatch={(tab) => handleNavigateMatch(tab || 'inheritance')}
          onNavigateExport={() => handleJumpToExportCenter('', '')}
          isQuickUploading={isQuickUploading}
          quickUploadMsg={quickUploadMsg}
          onClearQuickMsg={() => setQuickUploadMsg(null)}
        />
      )}

      {/* Pillar 2: Unified Browse Workspace (Hierarchy Explorer + Inventory Grid + Column Gear) */}
      {activeView === 'browse' && (
        <BrowseWorkspace
          records={records}
          filteredRecords={filteredRecords}
          columns={columns}
          selectedIds={selectedIds}
          setSelectedIds={setSelectedIds}
          selectedDistrict={selectedDistrict}
          selectedUpazila={selectedUpazila}
          selectedMouza={selectedMouza}
          onSelectHierarchyNode={handleSelectHierarchyNode}
          onClearHierarchyFilter={handleClearHierarchyFilter}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          selectedSurveyType={selectedSurveyType}
          setSelectedSurveyType={setSelectedSurveyType}
          selectedLandClass={selectedLandClass}
          setSelectedLandClass={setSelectedLandClass}
          onEditRecord={handleOpenEdit}
          onDeleteRecord={handleDeleteRecord}
          onDeleteSelected={handleDeleteSelected}
          onPrintSelected={() => {
            setPrintUpazilaScope(selectedUpazila);
            setPrintMouzaScope(selectedMouza);
            setActiveView('print');
          }}
          onExportSelected={handleExportExcelSelected}
          onAddNewRecord={handleOpenNew}
          onOpenColumnCustomizer={() => setIsColCustomizerOpen(true)}
          onJumpToExportCenter={handleJumpToExportCenter}
        />
      )}

      {/* Pillar 3: Unified Match Workspace (Inheritance Matcher + 11-Step Forensic Audit + SLULIS) */}
      {activeView === 'match' && (
        <MatchWorkspace
          key={matchNavKey}
          records={records}
          columns={columns}
          initialTab={matchInitialTab}
          forensicInitialTab={forensicInitialTab}
          slulisInitialTab={slulisInitialTab}
          onBackHome={() => setActiveView('home')}
          onApplyMatchedListToLedger={handleApplyMatchedListToLedger}
          onApproveLedgerProposal={handleApproveLedgerProposal}
          onRollbackLedgerVersion={handleRollbackLedgerVersion}
          versionHistory={versionHistory}
        />
      )}

      {/* Pillar 4: Unified 1-Click Export Center */}
      {activeView === 'export' && (
        <ExportCenter
          records={records}
          filteredRecords={filteredRecords}
          selectedIds={selectedIds}
          columns={columns}
          availableUpazilas={availableUpazilas}
          initialUpazila={exportUpazilaScope}
          initialMouza={exportMouzaScope}
          onOpenPrintStudio={(upz, mouz) => {
            setPrintUpazilaScope(upz);
            setPrintMouzaScope(mouz);
            setActiveView('print');
          }}
        />
      )}

      {/* Interactive A4 Print Studio (reached via Export Center or Grid Selected A4 Print) */}
      {activeView === 'print' && (
        <PrintReportView
          records={printTargetRecords}
          columns={columns}
          onBack={() => setActiveView('export')}
          initialSelectedUpazila={printUpazilaScope}
          initialSelectedMouza={printMouzaScope}
        />
      )}

      {/* Small Persistent Export Center Floating Action Button */}
      {activeView !== 'export' && activeView !== 'print' && (
        <button
          type="button"
          onClick={() => handleJumpToExportCenter(selectedUpazila, selectedMouza)}
          className="fixed bottom-5 right-5 z-30 no-print btn-3d px-4 py-2.5 rounded-2xl bg-gradient-to-r from-amber-400 via-amber-300 to-yellow-400 text-slate-950 font-bold text-xs shadow-2xl flex items-center gap-2 font-bengali cursor-pointer"
          title="একীভূত এক্সপোর্ট সেন্টার (PDF, Excel, CSV, JSON, SLULIS .ZIP)"
        >
          <FileDown className="w-4 h-4 stroke-[2.4]" />
          <span>এক্সপোর্ট সেন্টার</span>
        </button>
      )}

      {/* Settings Slide-Over Panel (Theme, APK, Sample Tools, Archive Tree, Auto-Exit Cache Purge) */}
      <SettingsPanel
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        themeMode={themeMode}
        onChangeTheme={setThemeMode}
        onOpenApkModal={() => setIsApkModalOpen(true)}
        onIngestionComplete={handleIngestionComplete}
        onResetToSample={handleResetToSample}
        archiveTree={archiveTree}
        records={records}
        onSelectRecord={handleOpenEdit}
        onOpenIngestModal={() => setIsIngestOpen(true)}
        onPurgeCacheNow={handlePurgeAllCachedFilesNow}
        generatedCacheCount={generatedCacheCount}
        columns={columns}
      />

      {/* Ingestion Engine Modal (Folder + Phone Memory + ZIP) */}
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

      {/* Android APK & GitHub Repository Sync Modal */}
      <ApkDownloadModal
        isOpen={isApkModalOpen}
        onClose={() => setIsApkModalOpen(false)}
        records={records}
      />
    </div>
  );
}
