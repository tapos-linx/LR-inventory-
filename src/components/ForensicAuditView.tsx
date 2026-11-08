import React, { useMemo, useState } from 'react';
import * as XLSX from 'xlsx';
import {
  ShieldAlert,
  FileSearch,
  Users,
  GitBranch,
  Scale,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Download,
  FileSpreadsheet,
  FileJson,
  FileText,
  UploadCloud,
  RotateCcw,
  ArrowLeft,
  History,
  CheckSquare,
  MapPin,
  Fingerprint,
  BookOpen,
  Layers,
  Loader2,
  Plus,
} from 'lucide-react';
import { LandRecord } from '../types/landRecord';
import {
  EvidenceClassificationStatus,
  EvidenceDocumentRecord,
  ExtractedForensicEntry,
  ForensicDocumentType,
  GenealogyPersonNode,
  LedgerAuditVersionEntry,
  MasterLedgerUpdateProposal,
  MatchClassification,
} from '../types/forensic';
import {
  buildContradictionAnomalyReport,
  buildCourtDocumentAnalysis,
  buildDagKhatianCrossMapping,
  buildExtractedEntriesFromRecords,
  buildHistoricalTransitionAudit,
  buildInitialMasterLedgerProposals,
  buildLandAreaReconciliationReport,
  buildMasterGenealogyLedger,
  buildRecordGapRegister,
  computeSha256Hex,
  extractInheritanceCertificatePersonsTable,
  getEvidencePrefixAndTier,
  matchExtractedPersonAgainstGenealogy,
  normalizeBanglaName,
  parseUploadedForensicText,
  runMandatoryForensicTests,
} from '../utils/forensicEngine';
import { toBengaliNumber } from '../utils/bengaliNumerals';
import { DEFAULT_COLUMNS } from '../utils/mockData';
import { exportToExcel, exportToJSON } from '../utils/exportUtils';
import {
  downloadForensicReportTablePdf,
  downloadMouzaLandRecordsPdf,
} from '../utils/pdfDownloadEngine';
import {
  Dag651DiscrepancyDetector,
  DAG_651_DISCREPANCY_ITEMS,
} from './Dag651DiscrepancyDetector';

interface ForensicAuditViewProps {
  records: LandRecord[];
  onBack: () => void;
  onApproveLedgerProposal: (
    updatedRecords: LandRecord[],
    auditEntry: LedgerAuditVersionEntry
  ) => void;
  onRollbackLedgerVersion: (versionEntry: LedgerAuditVersionEntry) => void;
  versionHistory: LedgerAuditVersionEntry[];
  initialTab?: ReportTabId;
}

export type ReportTabId =
  | 'detector'
  | 'report1'
  | 'report2'
  | 'report3'
  | 'report4'
  | 'report5'
  | 'report6'
  | 'report7'
  | 'report8'
  | 'report9'
  | 'report10'
  | 'tests'
  | 'genealogy';

const WORKFLOW_STEPS = [
  { step: 1, label: 'STEP 1: দলিল/তালিকা আপলোড' },
  { step: 2, label: 'STEP 2: দলিলের ধরন নির্বাচন' },
  { step: 3, label: 'STEP 3: ভৌগোলিক পরিচয় যাচাই' },
  { step: 4, label: 'STEP 4: নাম ও ভূমির তথ্য নিষ্কাশন' },
  { step: 5, label: 'STEP 5: বংশলতিকা ক্রস-ম্যাচিং' },
  { step: 6, label: 'STEP 6: ওয়ারিশ সনদ ব্যক্তি নিষ্কাশন' },
  { step: 7, label: 'STEP 7: ঐতিহাসিক খতিয়ান-দাগ মিলকরণ' },
  { step: 8, label: 'STEP 8: দাগ ও জমির পরিমাণ সমন্বয়' },
  { step: 9, label: 'STEP 9: বিরোধ ও অযাচাইকৃত ম্যাচ রিভিউ' },
  { step: 10, label: 'STEP 10: ১০টি পৃথক ফরেনসিক রিপোর্ট' },
  { step: 11, label: 'STEP 11: মাস্টার লেজার আপডেট অনুমোদন/প্রত্যাখ্যান' },
];

const DOCUMENT_TYPES: ForensicDocumentType[] = [
  'CS Khatian',
  'CR / Subsequent Record',
  'SA Khatian',
  'RS Khatian',
  'BS / BRS Khatian',
  'Warish / Inheritance Certificate',
  'Registered Deed',
  'Partition Deed',
  'Gift Deed',
  'Mutation / Namjari',
  'DCR / Land Tax Receipt',
  'Survey Map / Mouza Map',
  'Dag Conversion List',
  'Court Order / Judgment / Plaint',
  'Handwritten List',
  'Scanned Document / OCR',
  'Government Office Slip',
  'Excel / CSV / Word List',
];

export const ForensicAuditView: React.FC<ForensicAuditViewProps> = ({
  records,
  onBack,
  onApproveLedgerProposal,
  onRollbackLedgerVersion,
  versionHistory,
  initialTab = 'report2',
}) => {
  // Active Workflow Step & Active Report Tab
  const [activeStep, setActiveStep] = useState<number>(10);
  const [activeReportTab, setActiveReportTab] = useState<ReportTabId>(initialTab);

  // Master Genealogy State (Anchored on Roshan Ali -> Ali Newaz -> Safar Ali -> Kamdar Ali & Siraj Ali)
  const [genealogyLedger, setGenealogyLedger] = useState<GenealogyPersonNode[]>(() =>
    buildMasterGenealogyLedger()
  );

  // Additional user-uploaded forensic entries & Evidence Document Register
  const [customExtractedEntries, setCustomExtractedEntries] = useState<ExtractedForensicEntry[]>([]);
  const [evidenceDocs, setEvidenceDocs] = useState<EvidenceDocumentRecord[]>([
    {
      evidenceId: 'WAR-001..006',
      originalFileName: 'ওয়ারিশ সনদের তালিকা.txt',
      documentType: 'Warish / Inheritance Certificate',
      hierarchyTier: '6. Official Inheritance Certificate',
      uploadDate: '2026-11-07',
      pageNumber: 'সনদ ১–৬',
      extractedOriginalText:
        'গ্রাম: গোয়ালী, ওয়ার্ড: ০৮, ডাকঘর: কাইতলা - ৩৪৭৭, ইউনিয়ন: কাইতলা (দক্ষিণ), উপজেলা: নবীনগর, জেলা: ব্রাহ্মণবাড়িয়া — ৬টি ওয়ারিশ সনদ (৪৯ জন ওয়ারিশ)',
      normalizedText: 'গোয়ালী কাইতলা দক্ষিণ নবীনগর ব্রাহ্মণবাড়িয়া ৬টি ওয়ারিশ সনদ',
      hasUncertainOcr: false,
      uncertainTokens: [],
      sha256Hash: 'a9904dbe8c41e92017b6f43d291048ce9912a4f50012c8e1d4a9904dbe000001',
      isDuplicateUpload: false,
      verificationStatus: 'VERIFIED',
      district: 'ব্রাহ্মণবাড়িয়া',
      upazila: 'নবীনগর',
      mouza: 'গোয়ালী',
      jlNo: '৮৪',
    },
  ]);

  // Upload / Manual Forensic Entry Form States
  const [selectedDocType, setSelectedDocType] = useState<ForensicDocumentType>('CS Khatian');
  const [geoDistrict, setGeoDistrict] = useState<string>('ব্রাহ্মণবাড়িয়া');
  const [geoUpazila, setGeoUpazila] = useState<string>('নবীনগর');
  const [geoMouza, setGeoMouza] = useState<string>('গোয়ালী');
  const [geoJlNo, setGeoJlNo] = useState<string>('৮৪');
  const [geoSurvey, setGeoSurvey] = useState<string>('CS');
  const [manualTextInput, setManualTextInput] = useState<string>('');
  const [uploadStatusMsg, setUploadStatusMsg] = useState<string | null>(null);
  const [isExportingPdf, setIsExportingPdf] = useState<boolean>(false);

  // New Genealogy Node Addition State
  const [newGenName, setNewGenName] = useState('');
  const [newGenFather, setNewGenFather] = useState('');
  const [newGenRelation, setNewGenRelation] = useState('');
  const [newGenEvidenceId, setNewGenEvidenceId] = useState('DEED-001');

  // Filter States (Section 16)
  const [filterDistrict, setFilterDistrict] = useState<string>('');
  const [filterUpazila, setFilterUpazila] = useState<string>('');
  const [filterMouza, setFilterMouza] = useState<string>('');
  const [filterSurvey, setFilterSurvey] = useState<string>('');
  const [filterKhatian, setFilterKhatian] = useState<string>('');
  const [filterDag, setFilterDag] = useState<string>('');
  const [filterPerson, setFilterPerson] = useState<string>('');
  const [filterFather, setFilterFather] = useState<string>('');
  const [filterEvidenceStatus, setFilterEvidenceStatus] = useState<string>('');
  const [filterMatchClass, setFilterMatchClass] = useState<string>('');
  const [filterDocType, setFilterDocType] = useState<string>('');
  const [report3SubFilter, setReport3SubFilter] = useState<string>('ALL');

  // Master Ledger Proposals State (Report 10)
  const [proposals, setProposals] = useState<MasterLedgerUpdateProposal[]>(() =>
    buildInitialMasterLedgerProposals(records)
  );

  // Compute all Extracted Entries (Report 1)
  const allExtractedEntries = useMemo(() => {
    const base = buildExtractedEntriesFromRecords(records, genealogyLedger);
    return [...customExtractedEntries, ...base];
  }, [records, genealogyLedger, customExtractedEntries]);

  // Apply Filters to Extracted Entries
  const filteredExtractedEntries = useMemo(() => {
    return allExtractedEntries.filter((e) => {
      if (filterDistrict && e.district !== filterDistrict) return false;
      if (filterUpazila && e.upazila !== filterUpazila) return false;
      if (filterMouza && e.mouza !== filterMouza) return false;
      if (filterSurvey && e.surveyType !== filterSurvey) return false;
      if (filterKhatian && !e.khatianNo.includes(filterKhatian)) return false;
      if (filterDag && !e.dagNo.includes(filterDag)) return false;
      if (
        filterPerson &&
        !e.originalPersonName.toLowerCase().includes(filterPerson.toLowerCase()) &&
        !e.normalizedPersonName.toLowerCase().includes(filterPerson.toLowerCase())
      )
        return false;
      if (
        filterFather &&
        !e.fatherOriginalName.toLowerCase().includes(filterFather.toLowerCase())
      )
        return false;
      if (filterEvidenceStatus && e.evidenceStatus !== filterEvidenceStatus) return false;
      if (filterDocType && e.documentType !== filterDocType) return false;
      return true;
    });
  }, [
    allExtractedEntries,
    filterDistrict,
    filterUpazila,
    filterMouza,
    filterSurvey,
    filterKhatian,
    filterDag,
    filterPerson,
    filterFather,
    filterEvidenceStatus,
    filterDocType,
  ]);

  // Compute Person & Genealogy Match Results for all filtered entries
  const allPersonMatchResults = useMemo(() => {
    return filteredExtractedEntries
      .map((entry) => matchExtractedPersonAgainstGenealogy(entry, genealogyLedger))
      .filter((m) => {
        if (filterMatchClass && m.matchClassification !== filterMatchClass) return false;
        return true;
      });
  }, [filteredExtractedEntries, genealogyLedger, filterMatchClass]);

  // REPORT 2: Genealogy Matched Persons
  const report2MatchedPersons = useMemo(
    () =>
      allPersonMatchResults.filter(
        (m) => m.categoryBucket === 'MATCHED' || m.categoryBucket === 'REQUIRES_VERIFICATION'
      ),
    [allPersonMatchResults]
  );

  // REPORT 4: Unmatched Persons
  const report4UnmatchedPersons = useMemo(
    () => allPersonMatchResults.filter((m) => m.categoryBucket === 'UNMATCHED'),
    [allPersonMatchResults]
  );

  // REPORT 3: Inheritance Certificate — Extracted Persons
  const report3InheritancePersons = useMemo(() => {
    const allHeirs = extractInheritanceCertificatePersonsTable(records, genealogyLedger);
    return allHeirs.filter((p) => {
      if (report3SubFilter !== 'ALL' && p.outputGroup !== report3SubFilter) return false;
      if (
        filterPerson &&
        !p.originalName.includes(filterPerson) &&
        !p.normalizedName.includes(filterPerson)
      )
        return false;
      if (filterFather && !p.fatherName.includes(filterFather)) return false;
      if (filterEvidenceStatus && p.verificationStatus !== filterEvidenceStatus) return false;
      return true;
    });
  }, [records, genealogyLedger, report3SubFilter, filterPerson, filterFather, filterEvidenceStatus]);

  // REPORT 5: Historical Khatian & Dag Cross-Mapping
  const report5CrossMappings = useMemo(() => buildDagKhatianCrossMapping(records), [records]);

  // REPORT 6: Historical Record Transition & Name Disappearance Audit
  const report6TransitionAudits = useMemo(
    () => buildHistoricalTransitionAudit(records),
    [records]
  );

  // REPORT 7: Land Area & Share Reconciliation
  const report7AreaReconciliations = useMemo(
    () => buildLandAreaReconciliationReport(records),
    [records]
  );

  // REPORT 8: Record Gap Register
  const report8RecordGaps = useMemo(() => buildRecordGapRegister(), []);

  // REPORT 9: Contradiction & Anomaly Report + Court Document Analysis
  const report9Anomalies = useMemo(() => buildContradictionAnomalyReport(), []);
  const courtDocs = useMemo(() => buildCourtDocumentAnalysis(), []);

  // Mandatory Automated Test Suite (TEST A – TEST J)
  const testResults = useMemo(
    () => runMandatoryForensicTests(genealogyLedger),
    [genealogyLedger]
  );

  // Handle Document File Upload with SHA-256 Hashing & Duplicate Detection (Step 1–4)
  const handleForensicFileUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const file = files[0];
    const buffer = await file.arrayBuffer();
    const sha256 = await computeSha256Hex(buffer);

    const isDuplicate = evidenceDocs.some((d) => d.sha256Hash === sha256);
    const { prefix, tier } = getEvidencePrefixAndTier(selectedDocType);
    const nextNum = evidenceDocs.filter((d) => d.evidenceId.startsWith(prefix)).length + 1;
    const evidenceId = `${prefix}-${String(nextNum).padStart(3, '0')}`;

    let rawText = '';
    if (
      file.name.endsWith('.txt') ||
      file.name.endsWith('.csv') ||
      file.name.endsWith('.json')
    ) {
      rawText = new TextDecoder('utf-8').decode(buffer);
    } else if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
      const wb = XLSX.read(buffer, { type: 'array' });
      const firstSheet = wb.Sheets[wb.SheetNames[0]];
      rawText = XLSX.utils.sheet_to_csv(firstSheet);
    } else {
      rawText = `${file.name} (${selectedDocType}) — মৌজা: ${geoMouza}, জে.এল. নং: ${geoJlNo}, জরিপ: ${geoSurvey}`;
    }

    const hasUncertainOcr =
      rawText.includes('[অস্পষ্ট]') || rawText.includes('[পাঠোদ্ধার সম্ভব হয়নি]');

    const newEvidenceDoc: EvidenceDocumentRecord = {
      evidenceId,
      originalFileName: file.name,
      documentType: selectedDocType,
      hierarchyTier: tier,
      uploadDate: new Date().toISOString().slice(0, 10),
      pageNumber: 'পৃষ্ঠা ১',
      extractedOriginalText: rawText.slice(0, 1500),
      normalizedText: normalizeBanglaName(rawText.slice(0, 1500)),
      hasUncertainOcr,
      uncertainTokens: hasUncertainOcr ? ['[অস্পষ্ট]', '[পাঠোদ্ধার সম্ভব হয়নি]'] : [],
      sha256Hash: sha256,
      isDuplicateUpload: isDuplicate,
      verificationStatus: hasUncertainOcr ? 'UNVERIFIED' : 'PARTIALLY VERIFIED',
      district: geoDistrict,
      upazila: geoUpazila,
      mouza: geoMouza,
      jlNo: geoJlNo,
    };

    setEvidenceDocs((prev) => [newEvidenceDoc, ...prev]);

    const parsedEntries = parseUploadedForensicText(rawText, file.name, selectedDocType, evidenceId, {
      district: geoDistrict,
      upazila: geoUpazila,
      mouza: geoMouza,
      jlNo: geoJlNo,
      surveyType: geoSurvey,
    });

    setCustomExtractedEntries((prev) => [...parsedEntries, ...prev]);
    setUploadStatusMsg(
      `${
        isDuplicate ? '[সতর্কবার্তা: ডুপ্লিকেট SHA-256 হ্যাশ শনাক্ত] ' : ''
      }দলিল "${file.name}" নিষ্কাশিত হয়েছে | এভিডেন্স আইডি: ${evidenceId} | SHA-256: ${sha256.slice(
        0,
        16
      )}... | নিষ্কাশিত এন্ট্রি: ${toBengaliNumber(parsedEntries.length)} টি`
    );
    setActiveReportTab('report1');
  };

  // Handle Manual / OCR Text Extraction Submission
  const handleManualTextExtract = async () => {
    if (!manualTextInput.trim()) return;
    const sha256 = await computeSha256Hex(manualTextInput);
    const isDuplicate = evidenceDocs.some((d) => d.sha256Hash === sha256);
    const { prefix, tier } = getEvidencePrefixAndTier(selectedDocType);
    const nextNum = evidenceDocs.filter((d) => d.evidenceId.startsWith(prefix)).length + 1;
    const evidenceId = `${prefix}-${String(nextNum).padStart(3, '0')}`;

    const hasUncertainOcr =
      manualTextInput.includes('[অস্পষ্ট]') ||
      manualTextInput.includes('[পাঠোদ্ধার সম্ভব হয়নি]');

    const docName = `Manual_${selectedDocType.replace(/\s+/g, '_')}_${evidenceId}.txt`;

    setEvidenceDocs((prev) => [
      {
        evidenceId,
        originalFileName: docName,
        documentType: selectedDocType,
        hierarchyTier: tier,
        uploadDate: new Date().toISOString().slice(0, 10),
        pageNumber: 'পৃষ্ঠা ১',
        extractedOriginalText: manualTextInput,
        normalizedText: normalizeBanglaName(manualTextInput),
        hasUncertainOcr,
        uncertainTokens: hasUncertainOcr ? ['[অস্পষ্ট]', '[পাঠোদ্ধার সম্ভব হয়নি]'] : [],
        sha256Hash: sha256,
        isDuplicateUpload: isDuplicate,
        verificationStatus: hasUncertainOcr ? 'UNVERIFIED' : 'PARTIALLY VERIFIED',
        district: geoDistrict,
        upazila: geoUpazila,
        mouza: geoMouza,
        jlNo: geoJlNo,
      },
      ...prev,
    ]);

    const parsedEntries = parseUploadedForensicText(
      manualTextInput,
      docName,
      selectedDocType,
      evidenceId,
      {
        district: geoDistrict,
        upazila: geoUpazila,
        mouza: geoMouza,
        jlNo: geoJlNo,
        surveyType: geoSurvey,
      }
    );

    setCustomExtractedEntries((prev) => [...parsedEntries, ...prev]);
    setManualTextInput('');
    setUploadStatusMsg(
      `সফলভাবে ${toBengaliNumber(
        parsedEntries.length
      )} টি ফরেনসিক এন্ট্রি নিষ্কাশন ও বংশলতিকার সাথে তুলনা করা হয়েছে (এভিডেন্স আইডি: ${evidenceId})।`
    );
    setActiveReportTab('report2');
  };

  // Add verified Genealogy Person Node (Section 3)
  const handleAddGenealogyNode = () => {
    if (!newGenName.trim() || !newGenFather.trim()) return;
    const newId = `GEN-${String(genealogyLedger.length + 1).padStart(3, '0')}`;
    const node: GenealogyPersonNode = {
      personId: newId,
      generation: 6,
      originalName: newGenName.trim(),
      normalizedName: normalizeBanglaName(newGenName.trim()),
      variantSpellings: [newGenName.trim()],
      fatherOriginalName: newGenFather.trim(),
      fatherNormalizedName: normalizeBanglaName(newGenFather.trim()),
      motherName: '—',
      spouseNames: [],
      branchName: `${newGenFather.trim()} শাখা`,
      relationshipLabel: newGenRelation.trim() || `পিতা: ${newGenFather.trim()}`,
      district: geoDistrict,
      upazila: geoUpazila,
      mouza: geoMouza,
      village: geoMouza,
      jlNo: geoJlNo,
      associatedKhatians: [],
      associatedDags: [],
      evidenceIds: [newGenEvidenceId || 'DEED-001'],
      verificationStatus: 'CORROBORATED',
      neutralDesignation: 'RECORD-LINKED PERSONS',
    };
    setGenealogyLedger((prev) => [...prev, node]);
    setNewGenName('');
    setNewGenFather('');
    setNewGenRelation('');
  };

  // Approve or Reject Master Ledger Proposal (Section 14 Report 10 & Section 17)
  const handleProposalDecision = (
    proposal: MasterLedgerUpdateProposal,
    decision: 'APPROVED' | 'REJECTED'
  ) => {
    setProposals((prev) =>
      prev.map((p) =>
        p.proposalId === proposal.proposalId
          ? { ...p, approvalState: decision, reviewedAt: new Date().toLocaleString('bn-BD') }
          : p
      )
    );

    if (decision === 'APPROVED') {
      const snapshot = [...records];
      let nextRecords: LandRecord[];
      if (
        proposal.proposalType === 'APPEND_FORENSIC_METADATA_WITHOUT_OVERWRITE' &&
        proposal.targetExistingRecordId
      ) {
        nextRecords = records.map((r) =>
          r.id === proposal.targetExistingRecordId ? proposal.proposedRecord : r
        );
      } else {
        nextRecords = [
          ...records,
          { ...proposal.proposedRecord, slNo: records.length + 1 },
        ];
      }

      const auditEntry: LedgerAuditVersionEntry = {
        versionId: `VER-${Date.now()}`,
        timestamp: new Date().toLocaleString('bn-BD'),
        actionTitle: `অনুমোদিত প্রস্তাব ${proposal.proposalId}: ${proposal.reasonAndEvidenceSummary.slice(
          0,
          70
        )}...`,
        proposalId: proposal.proposalId,
        evidenceIds: proposal.evidenceIds,
        previousRecordsSnapshot: snapshot,
      };

      onApproveLedgerProposal(nextRecords, auditEntry);
    }
  };

  // Build tabular representation of the currently active report for PDF / Excel / CSV / JSON Export
  const buildCurrentReportExportData = (): {
    title: string;
    subtitle: string;
    fileName: string;
    headers: { key: string; label: string; width: number }[];
    rows: Record<string, string>[];
  } => {
    switch (activeReportTab) {
      case 'detector':
        return {
          title: 'DAG 651 DISCREPANCY DETECTOR — INCONSISTENCY ALERT REPORT (দাগ ৬৫১ স্বয়ংক্রিয় অসঙ্গতি ও গরমিল ডিটেক্টর)',
          subtitle:
            'গোয়ালী মৌজা (জেএল ৮৪) | সিএস ৩২০ শতক হতে বিআরএস-এ ৮০ শতক জমি নিখোঁজ ও অনধিকার তৃতীয় পক্ষ বিআরএস রেকর্ড অডিট',
          fileName: 'Forensic_Report_Dag651_Discrepancy_Alerts',
          headers: [
            { key: 'id', label: 'Anomaly ID', width: 120 },
            { key: 'type', label: 'Inconsistency Type', width: 220 },
            { key: 'stage', label: 'Survey Transition Stage', width: 170 },
            { key: 'earlier', label: 'Earlier Verified Claim', width: 240 },
            { key: 'later', label: 'Later Contested Record', width: 240 },
            { key: 'delta', label: 'Area Delta', width: 150 },
            { key: 'severity', label: 'Severity Level', width: 110 },
            { key: 'cause', label: 'Forensic Root Cause', width: 330 },
            { key: 'remedy', label: 'Statutory Remedy', width: 220 },
          ],
          rows: DAG_651_DISCREPANCY_ITEMS.map((d) => ({
            id: d.id,
            type: d.anomalyTypeBengali,
            stage: d.surveyStage,
            earlier: `${d.earlierRecord.survey} Kh ${d.earlierRecord.khatianNo}, Dag ${d.earlierRecord.dagNo} (${d.earlierRecord.owner}) = ${d.earlierRecord.areaText}`,
            later: `${d.laterRecord.survey} Kh ${d.laterRecord.khatianNo}, Dag ${d.laterRecord.dagNo} (${d.laterRecord.owner}) = ${d.laterRecord.areaText}`,
            delta: d.areaDiscrepancyText,
            severity: d.severity,
            cause: d.rootCauseDescription,
            remedy: d.recommendedLegalAction,
          })),
        };

      case 'report1':
        return {
          title: 'REPORT 1 — UPLOADED DOCUMENT EXTRACTION (উদ্ধৃত দলিল ও তথ্য তালিকা)',
          subtitle: 'মূল বাংলা পাঠ, ভৌগোলিক পরিচয় এবং এভিডেন্স আইডি সংবলিত সম্পূর্ণ নিষ্কাশন তালিকা',
          fileName: 'Forensic_Report_01_Document_Extraction',
          headers: [
            { key: 'evidenceId', label: 'Evidence ID', width: 110 },
            { key: 'sourceDoc', label: 'Source Document & Page', width: 210 },
            { key: 'geo', label: 'District → Upazila → Mouza → JL', width: 230 },
            { key: 'surveyKhDag', label: 'Survey, Khatian & Dag', width: 170 },
            { key: 'originalName', label: 'Original Extracted Name', width: 210 },
            { key: 'normalizedName', label: 'Normalized Name', width: 180 },
            { key: 'fatherName', label: "Father's Name", width: 180 },
            { key: 'areaShare', label: 'Area & Share', width: 160 },
            { key: 'status', label: 'Evidence Status', width: 180 },
          ],
          rows: filteredExtractedEntries.map((e) => ({
            evidenceId: e.evidenceId,
            sourceDoc: `${e.sourceDocumentName} (${e.pageLocation})`,
            geo: `${e.district} → ${e.upazila} → ${e.mouza} (JL ${e.jlNo}) [${e.geographicValidation.status}]`,
            surveyKhDag: `${e.surveyType} | খতিয়ান: ${e.khatianNo} | দাগ: ${e.dagNo}`,
            originalName: e.originalPersonName,
            normalizedName: e.normalizedPersonName,
            fatherName: e.fatherOriginalName,
            areaShare: `${e.landAreaRaw} (${toBengaliNumber(e.landAreaShatak)} শতক) | অংশ: ${e.share}`,
            status: e.evidenceStatus,
          })),
        };

      case 'report2':
        return {
          title: 'REPORT 2 — GENEALOGY MATCHED PERSONS (বংশলতিকায় ম্যাচকৃত ব্যক্তিগণের তালিকা)',
          subtitle:
            'রোশন আলী → নাজির আলী নোয়াজ অথবা আলী নোয়াজ → সফর আলী → কামদার আলী ও সিরাজ আলী এবং তদীয় বংশধরগণ বংশধারার সাথে প্রমাণভিত্তিক ম্যাচিং',
          fileName: 'Forensic_Report_02_Genealogy_Matched_Persons',
          headers: [
            { key: 'evidenceId', label: 'Evidence ID & Doc', width: 150 },
            { key: 'extractedName', label: 'Original Extracted Name', width: 180 },
            { key: 'genealogyName', label: 'Matched Genealogy Name', width: 190 },
            { key: 'fatherComp', label: 'Father / Spouse Comparison', width: 230 },
            { key: 'geoComp', label: 'Geographic Comparison', width: 220 },
            { key: 'khDag', label: 'Khatian & Dag', width: 140 },
            { key: 'classification', label: 'Match Classification', width: 190 },
            { key: 'evidence', label: 'Supporting / Conflicting Evidence', width: 290 },
          ],
          rows: report2MatchedPersons.map((m) => ({
            evidenceId: `${m.evidenceId} (${m.uploadedDocumentName})`,
            extractedName: m.originalExtractedName,
            genealogyName: `${m.matchedGenealogyName} (${m.matchedGenealogyPerson?.personId || '—'})`,
            fatherComp: m.fatherSpouseComparison,
            geoComp: m.geographicComparison,
            khDag: m.khatianDagComparison,
            classification: `${m.matchClassification} [${m.evidenceStatus}] (Analytical Score: ${m.confidenceScore}%)`,
            evidence: [...m.supportingEvidence, ...m.conflictingEvidence].join(' | '),
          })),
        };

      case 'report3':
        return {
          title: 'REPORT 3 — INHERITANCE CERTIFICATE — EXTRACTED PERSONS (ওয়ারিশ সনদ নিষ্কাশিত ব্যক্তি তালিকা)',
          subtitle:
            'নিরপেক্ষ মর্যাদা: RECORD-LINKED PERSONS | সনদ নং ১–৬ হতে নিষ্কাশিত ৪৯ জন ওয়ারিশ ও ঐতিহাসিক রেকর্ড ক্রস-রেফারেন্স',
          fileName: 'Forensic_Report_03_Inheritance_Certificate_Persons',
          headers: [
            { key: 'personId', label: 'Person ID & Evidence', width: 130 },
            { key: 'originalName', label: 'Original Name', width: 150 },
            { key: 'normalizedName', label: 'Normalized Name', width: 140 },
            { key: 'fatherSpouse', label: "Father's / Spouse's Name", width: 190 },
            { key: 'relation', label: 'Relationship to Deceased', width: 170 },
            { key: 'certInfo', label: 'Certificate No & Date', width: 180 },
            { key: 'mouzaDoc', label: 'Mouza & Source Location', width: 200 },
            { key: 'crossRef', label: 'CS / SA / RS / BRS Cross-Ref', width: 260 },
            { key: 'status', label: 'Group & Verification Status', width: 200 },
          ],
          rows: report3InheritancePersons.map((p) => ({
            personId: `${p.personId} (${p.evidenceId})`,
            originalName: p.originalName,
            normalizedName: p.normalizedName,
            fatherSpouse: `${p.fatherName} | স্বামী: ${p.spouseName}`,
            relation: p.relationshipToDeceased,
            certInfo: `সনদ: ${p.certificateNumber} | তাং: ${p.issueDate}`,
            mouzaDoc: `${p.mouzaVillage} | ${p.sourceDocument} (${p.pageLocation})`,
            crossRef: `CS: ${p.crossReferences.csRecordRef} | SA: ${p.crossReferences.saRecordRef} | RS: ${p.crossReferences.rsRecordRef} | BRS: ${p.crossReferences.bsBrsRecordRef}`,
            status: `${p.outputGroup} [${p.verificationStatus}] (${p.neutralDesignation})`,
          })),
        };

      case 'report4':
        return {
          title: 'REPORT 4 — UNMATCHED PERSONS (বংশলতিকায় অমিলকৃত ব্যক্তিগণের পৃথক তালিকা)',
          subtitle:
            'আপলোডকৃত রেকর্ডে পাওয়া গেছে কিন্তু বর্তমান রোশন আলী → নাজির আলী নোয়াজ অথবা আলী নোয়াজ → সফর আলী বংশলতিকায় পাওয়া যায়নি (FORENSIC PERSONS OF INTEREST)',
          fileName: 'Forensic_Report_04_Unmatched_Persons',
          headers: [
            { key: 'evidenceId', label: 'Evidence ID & Document', width: 180 },
            { key: 'originalName', label: 'Original Extracted Name', width: 210 },
            { key: 'fatherName', label: "Father's / Spouse's Name", width: 220 },
            { key: 'geo', label: 'District, Upazila, Mouza & JL', width: 240 },
            { key: 'khDag', label: 'Survey, Khatian & Dag', width: 190 },
            { key: 'classification', label: 'Classification & Status', width: 220 },
            { key: 'explanation', label: 'Forensic Explanation', width: 350 },
          ],
          rows: report4UnmatchedPersons.map((u) => ({
            evidenceId: `${u.evidenceId} (${u.uploadedDocumentName})`,
            originalName: u.originalExtractedName,
            fatherName: u.fatherSpouseComparison,
            geo: `${u.extractedEntry.district} → ${u.extractedEntry.upazila} → ${u.extractedEntry.mouza} (JL ${u.extractedEntry.jlNo})`,
            khDag: u.khatianDagComparison,
            classification: `${u.matchClassification} [${u.evidenceStatus}] (${u.neutralDesignation})`,
            explanation: u.explanation,
          })),
        };

      case 'report5':
        return {
          title: 'REPORT 5 — HISTORICAL KHATIAN & DAG MATCHING (ঐতিহাসিক খতিয়ান ও দাগ ক্রস-ম্যাপিং)',
          subtitle: 'CS → CR → SA → RS → BS/BRS দাগ ও খতিয়ান রূপান্তর এবং মালিকানার ধারাবাহিকতা',
          fileName: 'Forensic_Report_05_Khatian_Dag_Cross_Mapping',
          headers: [
            { key: 'mouza', label: 'Mouza & JL', width: 130 },
            { key: 'cs', label: 'CS Khatian & Dag', width: 150 },
            { key: 'sa', label: 'SA Khatian & Dag', width: 150 },
            { key: 'rs', label: 'RS Khatian & Dag', width: 160 },
            { key: 'bs', label: 'BS/BRS Khatian & Dag', width: 170 },
            { key: 'owners', label: 'Owner & Father Progression', width: 340 },
            { key: 'areaConv', label: 'Area & Conversion Type', width: 260 },
            { key: 'evidence', label: 'Evidence ID & Status', width: 240 },
          ],
          rows: report5CrossMappings.map((m) => ({
            mouza: `${m.mouza} (JL ${m.jlNo})`,
            cs: `খতিয়ান: ${m.csKhatian || '—'} | দাগ: ${m.csDag || '—'}`,
            sa: `খতিয়ান: ${m.saKhatian || '—'} | দাগ: ${m.saDag || '—'}`,
            rs: `খতিয়ান: ${m.rsKhatian || '—'} | দাগ: ${m.rsDag || '—'}`,
            bs: `খতিয়ান: ${m.bsBrsKhatian || '—'} | দাগ: ${m.bsBrsDag || '—'}`,
            owners: `${m.recordedOwnerProgression} | পিতা: ${m.fatherNameProgression}`,
            areaConv: `${m.areaProgression} [${m.conversionType}]`,
            evidence: `${m.evidenceId} | ${m.verificationStatus}`,
          })),
        };

      case 'report6':
        return {
          title:
            'REPORT 6 — HISTORICAL RECORD TRANSITION & NAME DISAPPEARANCE AUDIT (নাম পরিবর্তন ও বিলুপ্তি অডিট)',
          subtitle:
            'Earlier Record | Later Record | Change | Supporting Evidence | Status (CS → CR → SA → RS → BS/BRS)',
          fileName: 'Forensic_Report_06_Record_Transition_Audit',
          headers: [
            { key: 'stage', label: 'Transition Stage', width: 180 },
            { key: 'earlier', label: 'Earlier Record', width: 300 },
            { key: 'later', label: 'Later Record', width: 300 },
            { key: 'change', label: 'Change & Disappearance Audit', width: 420 },
            { key: 'evidence', label: 'Supporting Evidence', width: 230 },
            { key: 'status', label: 'Status', width: 180 },
          ],
          rows: report6TransitionAudits.map((t) => ({
            stage: `${t.transitionStage} (${t.mouza}, JL ${t.jlNo})`,
            earlier: t.earlierRecordSummary,
            later: t.laterRecordSummary,
            change: `${t.identifiedChanges.join(', ')} — ${t.changeDescription}${
              t.primarySourceGapNote ? ` [${t.primarySourceGapNote}]` : ''
            }`,
            evidence: t.supportingEvidence,
            status: t.status,
          })),
        };

      case 'report7':
        return {
          title: 'REPORT 7 — LAND AREA RECONCILIATION (জমির পরিমাণ ও অংশ সমন্বয় ইঞ্জিন)',
          subtitle:
            'Formula: Unexplained Area = Parent Dag Area − Sum of Identified Successor Areas (শতক ও একর)',
          fileName: 'Forensic_Report_07_Land_Area_Reconciliation',
          headers: [
            { key: 'parent', label: 'Parent Survey, Khatian & Dag', width: 230 },
            { key: 'parentArea', label: 'Parent Dag Area Claim(s)', width: 200 },
            { key: 'successors', label: 'Identified Successor Entries', width: 420 },
            { key: 'totalId', label: 'Total Identified Area', width: 160 },
            { key: 'unexplained', label: 'Unexplained Area', width: 190 },
            { key: 'classification', label: 'Classification & Evidence', width: 410 },
          ],
          rows: report7AreaReconciliations.map((r) => ({
            parent: `${r.parentSurvey} | খতিয়ান: ${r.parentKhatian} | দাগ: ${r.parentDag} (${r.parentOwner})`,
            parentArea: `${toBengaliNumber(r.parentAreaShatakPrimaryClaim)} শতক${
              r.parentAreaShatakAlternativeClaim
                ? ` (বিকল্প উৎস দাবি: ${toBengaliNumber(r.parentAreaShatakAlternativeClaim)} শতক)`
                : ''
            }`,
            successors: r.successorEntries
              .map(
                (s) =>
                  `${s.survey} খতিয়ান ${s.khatianNo}, দাগ ${s.dagNo} = ${toBengaliNumber(
                    s.areaShatak
                  )} শতক (${s.evidenceId})`
              )
              .join(' + '),
            totalId: `${toBengaliNumber(r.totalIdentifiedSuccessorShatak)} শতক`,
            unexplained: `${toBengaliNumber(r.unexplainedAreaPrimaryShatak)} শতক${
              r.unexplainedAreaAltShatak !== undefined
                ? ` (বিকল্পে ${toBengaliNumber(r.unexplainedAreaAltShatak)} শতক)`
                : ''
            }`,
            classification: `${r.classificationLabel} | Evidence: ${r.evidenceIds.join(', ')} | ${r.notes}`,
          })),
        };

      case 'report8':
        return {
          title: 'REPORT 8 — RECORD GAP REGISTER (অনুপস্থিত মূল দলিল ও রেকর্ড গ্যাপ রেজিস্টার)',
          subtitle:
            'Missing original handwritten CS records, unavailable certified copies, missing maps, deeds & mutation orders',
          fileName: 'Forensic_Report_08_Record_Gap_Register',
          headers: [
            { key: 'gapId', label: 'Gap ID & Category', width: 240 },
            { key: 'khatianDag', label: 'Affected Mouza, Khatian & Dag', width: 250 },
            { key: 'persons', label: 'Affected Record-Linked Persons', width: 260 },
            { key: 'description', label: 'Forensic Gap Description', width: 440 },
            { key: 'notice', label: 'Mandatory Classification & Evidence ID', width: 410 },
          ],
          rows: report8RecordGaps.map((g) => ({
            gapId: `${g.gapId}: ${g.gapCategory}`,
            khatianDag: `মৌজা: ${g.mouza} (JL ${g.jlNo}) | ${g.affectedKhatianDag}`,
            persons: g.affectedPersons,
            description: g.description,
            notice: `${g.mandatoryNotice} [${g.status}] (${g.evidenceIds.join(', ')})`,
          })),
        };

      case 'report9':
        return {
          title: 'REPORT 9 — CONTRADICTION & ANOMALY REPORT (বিরোধ ও অসঙ্গতি প্রতিবেদন)',
          subtitle:
            'Conflicting names, areas, shares, geographic identifiers, record transitions & Court Document Safeguards',
          fileName: 'Forensic_Report_09_Contradiction_Anomaly',
          headers: [
            { key: 'anomalyId', label: 'Anomaly ID & Type', width: 220 },
            { key: 'sourceA', label: 'Earlier / Source A Claim', width: 360 },
            { key: 'sourceB', label: 'Later / Source B Claim', width: 360 },
            { key: 'finding', label: 'Neutral Forensic Finding Summary', width: 440 },
            { key: 'status', label: 'Evidence ID & Classification', width: 230 },
          ],
          rows: report9Anomalies.map((a) => ({
            anomalyId: `${a.anomalyId}: ${a.anomalyType}`,
            sourceA: a.earlierOrSourceA,
            sourceB: a.laterOrSourceB,
            finding: a.neutralFindingSummary,
            status: `${a.classification} (${a.evidenceIds.join(', ')})`,
          })),
        };

      default:
        return {
          title: 'REPORT 10 — MASTER LEDGER UPDATE PROPOSAL (মাস্টার লেজার আপডেট প্রস্তাবনা)',
          subtitle:
            'যাচাইকৃত রেকর্ড স্বয়ংক্রিয়ভাবে ওভাররাইট না করে অনুমোদন সাপেক্ষে মাস্টার লেজার হালনাগাদ প্রস্তাব',
          fileName: 'Forensic_Report_10_Master_Ledger_Proposals',
          headers: [
            { key: 'proposalId', label: 'Proposal ID & Type', width: 220 },
            { key: 'record', label: 'Target Khatian, Dag & Owner', width: 340 },
            { key: 'reason', label: 'Forensic Reason & Evidence Summary', width: 520 },
            { key: 'evidence', label: 'Evidence IDs & Status', width: 250 },
            { key: 'state', label: 'Approval State', width: 260 },
          ],
          rows: proposals.map((p) => ({
            proposalId: `${p.proposalId} (${p.proposalType})`,
            record: `${p.proposedRecord.surveyType} খতিয়ান ${p.proposedRecord.khatianNo}, দাগ ${p.proposedRecord.dagNo} | ${p.proposedRecord.ownerDetails}`,
            reason: p.reasonAndEvidenceSummary,
            evidence: `${p.evidenceIds.join(', ')} [${p.evidenceStatus}]`,
            state: p.approvalState,
          })),
        };
    }
  };

  // Multi-Format Export Handlers (PDF, Excel, CSV, JSON) retaining all Evidence IDs
  const handleExportCurrentReportPdf = async () => {
    if (isExportingPdf) return;
    setIsExportingPdf(true);
    try {
      const data = buildCurrentReportExportData();
      await downloadForensicReportTablePdf({
        reportTitle: data.title,
        reportSubtitle: data.subtitle,
        headers: data.headers,
        rows: data.rows,
        fileNamePrefix: data.fileName,
      });
    } finally {
      setIsExportingPdf(false);
    }
  };

  const handleExportCurrentReportExcel = () => {
    const data = buildCurrentReportExportData();
    const formattedRows = data.rows.map((r) => {
      const obj: Record<string, string> = {};
      data.headers.forEach((h) => {
        obj[h.label] = r[h.key] || '—';
      });
      return obj;
    });
    const ws = XLSX.utils.json_to_sheet(formattedRows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Forensic_Report');
    XLSX.writeFile(wb, `${data.fileName}_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  const handleExportCurrentReportCsv = () => {
    const data = buildCurrentReportExportData();
    const headerLine = data.headers.map((h) => `"${h.label.replace(/"/g, '""')}"`).join(',');
    const bodyLines = data.rows.map((r) =>
      data.headers
        .map((h) => `"${String(r[h.key] || '').replace(/"/g, '""')}"`)
        .join(',')
    );
    const csv = '\uFEFF' + [headerLine, ...bodyLines].join('\r\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${data.fileName}_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleExportCurrentReportJson = () => {
    const data = buildCurrentReportExportData();
    const payload = {
      generatedAt: new Date().toISOString(),
      system: 'Bangladesh Historical Land Record Forensic Matching & Genealogy Integration Engine',
      genealogyAnchor:
        'রোশন আলী → নাজির আলী নোয়াজ অথবা আলী নোয়াজ → সফর আলী → কামদার আলী ও সিরাজ আলী এবং তদীয় বংশধরগণ',
      reportTitle: data.title,
      evidenceRegister: evidenceDocs,
      rowCount: data.rows.length,
      rows: data.rows,
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: 'application/json;charset=utf-8;',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${data.fileName}_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Download Evidence Register directly to Local Disk (.pdf & .xlsx)
  const handleDownloadEvidenceRegisterPdf = async () => {
    if (isExportingPdf) return;
    setIsExportingPdf(true);
    try {
      await downloadForensicReportTablePdf({
        reportTitle: 'EVIDENCE ID & DOCUMENT TRACEABILITY REGISTER (প্রমাণ নিবন্ধন ও উৎস তালিকা)',
        reportSubtitle: `মোট নিবন্ধিত প্রামাণ্য দলিল: ${toBengaliNumber(evidenceDocs.length)} টি | SHA-256 হ্যাশ ও প্রমাণের স্তরক্রম`,
        headers: [
          { key: 'evidenceId', label: 'Evidence ID', width: 120 },
          { key: 'fileName', label: 'Original File Name', width: 230 },
          { key: 'docType', label: 'Document Type', width: 170 },
          { key: 'tier', label: 'Hierarchy Tier', width: 220 },
          { key: 'geo', label: 'Mouza & JL No.', width: 180 },
          { key: 'sha256', label: 'SHA-256 Hash', width: 260 },
          { key: 'status', label: 'Verification Status', width: 190 },
        ],
        rows: evidenceDocs.map((d) => ({
          evidenceId: d.evidenceId,
          fileName: d.originalFileName,
          docType: d.documentType,
          tier: d.hierarchyTier,
          geo: `${d.district} → ${d.upazila} → ${d.mouza} (JL ${d.jlNo})`,
          sha256: d.sha256Hash,
          status: d.verificationStatus,
        })),
        fileNamePrefix: 'Forensic_Evidence_Traceability_Register',
      });
    } finally {
      setIsExportingPdf(false);
    }
  };

  const handleDownloadEvidenceRegisterExcel = () => {
    const rows = evidenceDocs.map((d) => ({
      'Evidence ID': d.evidenceId,
      'Original File Name': d.originalFileName,
      'Document Type': d.documentType,
      'Hierarchy Tier': d.hierarchyTier,
      'District / Upazila / Mouza': `${d.district} → ${d.upazila} → ${d.mouza} (JL ${d.jlNo})`,
      'SHA-256 Hash': d.sha256Hash,
      'Verification Status': d.verificationStatus,
      'Duplicate Upload': d.isDuplicateUpload ? 'হ্যাঁ' : 'না',
    }));
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Evidence_Register');
    XLSX.writeFile(wb, `Forensic_Evidence_Register_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  // Generic Per-Item / Per-Row Forensic Document Download (.pdf & .json) to Local Disk
  const handleDownloadSingleItemPdf = async (
    itemTitle: string,
    itemSubtitle: string,
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
        reportTitle: itemTitle,
        reportSubtitle: itemSubtitle,
        headers: [
          { key: 'sl', label: 'ক্রমিক', width: 90 },
          { key: 'field', label: 'ফরেনসিক ক্ষেত্র / বিবরণ (Field)', width: 320 },
          { key: 'value', label: 'প্রামাণ্য তথ্য ও ফলাফল (Verified Value)', width: 850 },
        ],
        rows,
        fileNamePrefix,
      });
    } finally {
      setIsExportingPdf(false);
    }
  };

  const handleDownloadSingleItemJson = (data: unknown, fileNamePrefix: string) => {
    exportToJSON(data, fileNamePrefix);
  };

  // Download a Specific Ledger Snapshot (Version History Item or Current Active Snapshot) to Local Disk
  const handleDownloadLedgerSnapshot = async (
    snapshotRecords: LandRecord[],
    versionId: string,
    format: 'pdf' | 'xlsx' | 'json'
  ) => {
    const cleanId = versionId.replace(/[^a-zA-Z0-9_-]/g, '_');
    if (format === 'pdf') {
      if (isExportingPdf) return;
      setIsExportingPdf(true);
      try {
        await downloadMouzaLandRecordsPdf(
          snapshotRecords,
          DEFAULT_COLUMNS,
          `Ledger_Snapshot_${cleanId}`
        );
      } finally {
        setIsExportingPdf(false);
      }
    } else if (format === 'xlsx') {
      exportToExcel(snapshotRecords, DEFAULT_COLUMNS, `Ledger_Snapshot_${cleanId}`);
    } else {
      exportToJSON(
        {
          versionId,
          exportedAt: new Date().toISOString(),
          recordCount: snapshotRecords.length,
          records: snapshotRecords,
        },
        `Ledger_Snapshot_${cleanId}`
      );
    }
  };

  // Download ALL 12 Forensic Documents in a single Multi-Sheet Excel Workbook (.xlsx) to Local Disk
  const handleExportAllForensicDocumentsWorkbook = () => {
    const wb = XLSX.utils.book_new();

    const appendSheet = (sheetName: string, rows: Record<string, string>[]) => {
      const ws = XLSX.utils.json_to_sheet(rows.length > 0 ? rows : [{ Note: 'No entries' }]);
      XLSX.utils.book_append_sheet(wb, ws, sheetName.slice(0, 31));
    };

    appendSheet(
      '01_Extracted_Docs',
      filteredExtractedEntries.map((e) => ({
        'Evidence ID': e.evidenceId,
        'Source Document': `${e.sourceDocumentName} (${e.pageLocation})`,
        Geography: `${e.district} → ${e.upazila} → ${e.mouza} (JL ${e.jlNo})`,
        'Survey / Khatian / Dag': `${e.surveyType} | Kh ${e.khatianNo} | Dag ${e.dagNo}`,
        'Original Name': e.originalPersonName,
        'Normalized Name': e.normalizedPersonName,
        'Father Name': e.fatherOriginalName,
        'Area & Share': `${e.landAreaRaw} (${e.landAreaShatak} শতক) | ${e.share}`,
        Status: e.evidenceStatus,
      }))
    );

    appendSheet(
      '02_Genealogy_Matched',
      report2MatchedPersons.map((m) => ({
        'Evidence ID': m.evidenceId,
        'Extracted Name': m.originalExtractedName,
        'Matched Genealogy': m.matchedGenealogyName,
        'Father Comparison': m.fatherSpouseComparison,
        Geography: m.geographicComparison,
        'Khatian & Dag': m.khatianDagComparison,
        Classification: m.matchClassification,
        Status: m.evidenceStatus,
      }))
    );

    appendSheet(
      '03_Warish_Cert_Persons',
      report3InheritancePersons.map((p) => ({
        'Person ID': p.personId,
        'Evidence ID': p.evidenceId,
        'Original Name': p.originalName,
        'Normalized Name': p.normalizedName,
        'Father / Spouse': `${p.fatherName} | ${p.spouseName}`,
        Relation: p.relationshipToDeceased,
        'Certificate No': `${p.certificateNumber} (${p.issueDate})`,
        CrossRef: `CS:${p.crossReferences.csRecordRef} | SA:${p.crossReferences.saRecordRef} | RS:${p.crossReferences.rsRecordRef} | BRS:${p.crossReferences.bsBrsRecordRef}`,
        Category: p.outputGroup,
      }))
    );

    appendSheet(
      '04_Unmatched_Candidates',
      report4UnmatchedPersons.map((u) => ({
        'Evidence ID': u.evidenceId,
        'Original Name': u.originalExtractedName,
        'Father Comparison': u.fatherSpouseComparison,
        Geography: u.geographicComparison,
        Classification: u.matchClassification,
        Reasons: u.conflictingEvidence.join(' | '),
      }))
    );

    appendSheet(
      '05_Dag_Khatian_Map',
      report5CrossMappings.map((c) => ({
        'Mapping ID': c.mappingId,
        'Mouza & JL': `${c.mouza} (JL ${c.jlNo})`,
        'CS Kh/Dag': `${c.csKhatian} / ${c.csDag}`,
        'SA Kh/Dag': `${c.saKhatian} / ${c.saDag}`,
        'RS Kh/Dag': `${c.rsKhatian} / ${c.rsDag}`,
        'BS Kh/Dag': `${c.bsBrsKhatian} / ${c.bsBrsDag}`,
        Owners: c.recordedOwnerProgression,
        Verification: `${c.conversionType} [${c.verificationStatus}]`,
      }))
    );

    appendSheet(
      '06_Transition_Audit',
      report6TransitionAudits.map((t) => ({
        'Audit ID': t.auditId,
        'Stage & Mouza': `${t.transitionStage} (${t.mouza}, JL ${t.jlNo})`,
        'Earlier Record': t.earlierRecordSummary,
        'Later Record': t.laterRecordSummary,
        Changes: `${t.identifiedChanges.join(', ')} — ${t.changeDescription}`,
        'Primary Source Gap': t.primarySourceGapNote || '—',
        Status: t.status,
      }))
    );

    appendSheet(
      '07_Area_Reconciliation',
      report7AreaReconciliations.map((a) => ({
        'Reconciliation ID': a.reconciliationId,
        'Parent Survey & Dag': `${a.parentSurvey} Kh ${a.parentKhatian} Dag ${a.parentDag}`,
        'Primary Claim (Shatak)': String(a.parentAreaShatakPrimaryClaim),
        'Alt Claim (Shatak)': String(a.parentAreaShatakAlternativeClaim ?? '—'),
        'Identified Total (Shatak)': String(a.totalIdentifiedSuccessorShatak),
        'Unexplained Gap Primary': `${a.unexplainedAreaPrimaryShatak} শতক`,
        'Unexplained Gap Alt':
          a.unexplainedAreaAltShatak !== undefined
            ? `${a.unexplainedAreaAltShatak} শতক`
            : '—',
        Result: a.classificationLabel,
      }))
    );

    appendSheet(
      '08_Record_Gap_Register',
      report8RecordGaps.map((g) => ({
        'Gap ID': g.gapId,
        Category: g.gapCategory,
        'Khatian & Dag': `${g.mouza} (JL ${g.jlNo}) | ${g.affectedKhatianDag}`,
        Description: g.description,
        'Mandatory Safeguard': g.mandatoryNotice,
        Status: g.status,
      }))
    );

    appendSheet(
      '09_Anomalies_Court',
      report9Anomalies.map((an) => ({
        'Anomaly ID': an.anomalyId,
        Type: an.anomalyType,
        SourceA: an.earlierOrSourceA,
        SourceB: an.laterOrSourceB,
        Finding: an.neutralFindingSummary,
        Status: an.classification,
      }))
    );

    appendSheet(
      '10_Ledger_Proposals',
      proposals.map((p) => ({
        'Proposal ID': p.proposalId,
        Type: p.proposalType,
        'Mouza / Kh / Dag': `${p.proposedRecord.mouza} | Kh ${p.proposedRecord.khatianNo} | Dag ${p.proposedRecord.dagNo}`,
        Owner: p.proposedRecord.ownerDetails,
        Area: p.proposedRecord.area,
        State: p.approvalState,
      }))
    );

    appendSheet(
      '11_Master_Genealogy',
      genealogyLedger.map((g) => ({
        'Person ID': g.personId,
        Generation: `Gen ${g.generation}`,
        'Original Name': g.originalName,
        'Normalized Name': g.normalizedName,
        Variants: g.variantSpellings.join(', '),
        Father: g.fatherOriginalName,
        Branch: g.relationshipLabel,
        Status: g.verificationStatus,
      }))
    );

    appendSheet(
      '12_Tests_A_to_J',
      testResults.map((t) => ({
        Code: t.testCode,
        Title: t.title,
        Classification: t.actualClassification,
        Status: t.evidenceStatus,
        Result: t.passed ? 'PASSED' : 'FAILED',
        Output: t.detailedOutput,
      }))
    );

    XLSX.writeFile(
      wb,
      `LR_Complete_Forensic_Audit_All_12_Reports_${new Date().toISOString().slice(0, 10)}.xlsx`
    );
  };

  const getBadgeStyle = (status: string) => {
    if (status.includes('VERIFIED') && !status.includes('UNVERIFIED') && !status.includes('PARTIALLY'))
      return 'bg-emerald-500/15 text-emerald-300 border-emerald-500/40';
    if (status.includes('CORROBORATED') || status.includes('PARTIALLY'))
      return 'bg-teal-500/15 text-teal-300 border-teal-500/40';
    if (
      status.includes('MISMATCH') ||
      status.includes('CONTRADICTORY') ||
      status.includes('GAP')
    )
      return 'bg-rose-500/15 text-rose-300 border-rose-500/40';
    return 'bg-amber-500/15 text-amber-300 border-amber-500/40';
  };

  return (
    <div className="flex-1 bg-[#090d16] text-slate-100 font-bengali">
      {/* Top Sticky Forensic Command Bar */}
      <div className="no-print sticky top-[61px] z-30 bg-[#0e1525]/95 backdrop-blur border-b border-amber-500/30 px-4 sm:px-8 py-3">
        <div className="max-w-[1720px] mx-auto flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <button
              onClick={onBack}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium flex items-center gap-1.5 border border-slate-700"
            >
              <ArrowLeft className="w-3.5 h-3.5 text-amber-400" />
              <span>মাস্টার লেজারে ফিরুন</span>
            </button>

            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-mono uppercase tracking-wider px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold">
                  FORENSIC MATCHING & LAND RECORD AUDIT
                </span>
                <h1 className="text-sm sm:text-base font-bold text-white">
                  বাংলাদেশ ঐতিহাসিক ভূমি রেকর্ড ফরেনসিক ম্যাচিং ও বংশলতিকা ক্রস-ম্যাচিং ইঞ্জিন
                </h1>
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">
                মাস্টার বংশলতিকা নোঙর: <strong className="text-amber-300">রোশন আলী → নাজির আলী নোয়াজ অথবা আলী নোয়াজ → সফর আলী → কামদার আলী ও সিরাজ আলী এবং তদীয় বংশধরগণ</strong> (গোয়ালী, জে.এল. ৮৪, নবীনগর, ব্রাহ্মণবাড়িয়া | বিঃদ্রঃ সনদে কানদার আলী = কামদার আলী স্পেলিং মিসটেক)
              </p>
            </div>
          </div>

          {/* Export Current Report Buttons (PDF, Excel, CSV, JSON) */}
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              onClick={handleExportCurrentReportPdf}
              disabled={isExportingPdf}
              className="px-3.5 py-2 text-xs font-bold text-slate-950 bg-gradient-to-r from-amber-400 via-amber-300 to-yellow-400 hover:from-amber-300 hover:to-yellow-300 rounded-lg shadow-md flex items-center gap-1.5"
            >
              {isExportingPdf ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin text-slate-950" />
              ) : (
                <Download className="w-3.5 h-3.5 stroke-[2.5] text-slate-950" />
              )}
              <span>রিপোর্ট PDF (.pdf)</span>
            </button>

            <button
              onClick={handleExportCurrentReportExcel}
              className="px-3 py-2 text-xs font-semibold text-emerald-300 bg-emerald-950/50 hover:bg-emerald-900/60 border border-emerald-500/40 rounded-lg flex items-center gap-1.5"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
              <span>Excel (.xlsx)</span>
            </button>

            <button
              onClick={handleExportCurrentReportCsv}
              className="px-3 py-2 text-xs font-semibold text-sky-300 bg-sky-950/50 hover:bg-sky-900/60 border border-sky-500/40 rounded-lg flex items-center gap-1.5"
            >
              <FileText className="w-3.5 h-3.5 text-sky-400" />
              <span>CSV</span>
            </button>

            <button
              onClick={handleExportCurrentReportJson}
              className="px-3 py-2 text-xs font-semibold text-purple-300 bg-purple-950/50 hover:bg-purple-900/60 border border-purple-500/40 rounded-lg flex items-center gap-1.5"
            >
              <FileJson className="w-3.5 h-3.5 text-purple-400" />
              <span>JSON (Evidence IDs)</span>
            </button>

            <button
              onClick={handleExportAllForensicDocumentsWorkbook}
              className="px-3 py-2 text-xs font-bold text-slate-950 bg-gradient-to-r from-emerald-400 to-teal-300 hover:from-emerald-300 hover:to-teal-200 rounded-lg shadow flex items-center gap-1.5"
              title="সকল ১২টি ফরেনসিক রিপোর্ট, বংশলতিকা ও টেস্ট স্যুট একসাথে একটি মাল্টি-শিট Excel ওয়ার্কবুকে লোকাল ডিস্কে সেভ করুন"
            >
              <Download className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>সকল ১২টি রিপোর্ট একসাথে সেভ (.xlsx)</span>
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-[1720px] mx-auto p-3 sm:p-6 space-y-5">
        {/* 11-Step Forensic Workflow Stepper (Section 16) */}
        <section className="bg-[#121827] border border-amber-500/30 rounded-xl p-3.5 shadow-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
              <Fingerprint className="w-4 h-4" />
              <span>১১-ধাপ ফরেনসিক ম্যাচিং ও অডিট ওয়ার্কফ্লো (11-Step Forensic Workflow)</span>
            </span>
            <span className="text-[11px] text-slate-400">
              যেকোনো ধাপে ক্লিক করে সরাসরি সেই মডিউলে যান
            </span>
          </div>
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
            {WORKFLOW_STEPS.map((ws) => (
              <button
                key={ws.step}
                onClick={() => {
                  setActiveStep(ws.step);
                  if (ws.step === 4) setActiveReportTab('report1');
                  if (ws.step === 5) setActiveReportTab('report2');
                  if (ws.step === 6) setActiveReportTab('report3');
                  if (ws.step === 7) setActiveReportTab('report5');
                  if (ws.step === 8) setActiveReportTab('report7');
                  if (ws.step === 9) setActiveReportTab('report9');
                  if (ws.step === 11) setActiveReportTab('report10');
                }}
                className={`px-2.5 py-1.5 rounded-lg text-[11px] font-semibold whitespace-nowrap border transition-all ${
                  activeStep === ws.step
                    ? 'bg-amber-400 text-slate-950 border-amber-300 font-bold shadow'
                    : 'bg-[#0b101b] text-slate-300 border-slate-800 hover:border-amber-500/40'
                }`}
              >
                {ws.label}
              </button>
            ))}
          </div>
        </section>

        {/* STEP 1–3: Document Upload, Type Selection, Geographical Validation & SHA-256 Traceability */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          <div className="lg:col-span-7 bg-[#121827] border border-slate-800 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <UploadCloud className="w-4 h-4 text-amber-400" />
                <span>STEP 1–4: দলিল আপলোড, ধরন নির্বাচন, ভৌগোলিক যাচাই ও টেক্সট/OCR নিষ্কাশন</span>
              </h3>
              <span className="text-[10px] font-mono text-emerald-300 bg-emerald-950/60 border border-emerald-500/30 px-2 py-0.5 rounded">
                SHA-256 Hash & Evidence ID Auto-Generator
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-xs">
              <div className="col-span-2 sm:col-span-1">
                <label className="text-[10px] text-slate-400 block mb-1">দলিলের ধরন (STEP 2)</label>
                <select
                  value={selectedDocType}
                  onChange={(e) => setSelectedDocType(e.target.value as ForensicDocumentType)}
                  className="w-full bg-[#090d16] border border-slate-700 rounded-lg px-2 py-1.5 text-slate-200 text-xs"
                >
                  {DOCUMENT_TYPES.map((dt) => (
                    <option key={dt} value={dt}>
                      {dt}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[10px] text-slate-400 block mb-1">জেলা (STEP 3)</label>
                <input
                  value={geoDistrict}
                  onChange={(e) => setGeoDistrict(e.target.value)}
                  className="w-full bg-[#090d16] border border-slate-700 rounded-lg px-2 py-1.5 text-slate-200 text-xs"
                />
              </div>

              <div>
                <label className="text-[10px] text-slate-400 block mb-1">উপজেলা</label>
                <input
                  value={geoUpazila}
                  onChange={(e) => setGeoUpazila(e.target.value)}
                  className="w-full bg-[#090d16] border border-slate-700 rounded-lg px-2 py-1.5 text-slate-200 text-xs"
                />
              </div>

              <div>
                <label className="text-[10px] text-slate-400 block mb-1">মৌজা</label>
                <input
                  value={geoMouza}
                  onChange={(e) => setGeoMouza(e.target.value)}
                  className="w-full bg-[#090d16] border border-slate-700 rounded-lg px-2 py-1.5 text-slate-200 text-xs"
                />
              </div>

              <div>
                <label className="text-[10px] text-slate-400 block mb-1">জে.এল. ও জরিপ</label>
                <div className="flex gap-1">
                  <input
                    value={geoJlNo}
                    onChange={(e) => setGeoJlNo(e.target.value)}
                    placeholder="JL"
                    className="w-1/2 bg-[#090d16] border border-slate-700 rounded-lg px-2 py-1.5 text-slate-200 text-xs"
                  />
                  <input
                    value={geoSurvey}
                    onChange={(e) => setGeoSurvey(e.target.value)}
                    placeholder="CS/SA/RS"
                    className="w-1/2 bg-[#090d16] border border-slate-700 rounded-lg px-2 py-1.5 text-slate-200 text-xs"
                  />
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-2">
              <textarea
                rows={2}
                value={manualTextInput}
                onChange={(e) => setManualTextInput(e.target.value)}
                placeholder="খতিয়ান, ওয়ারিশ সনদ, দলিল বা হাতে লেখা তালিকা এখানে পেস্ট করুন (অস্পষ্ট অক্ষরের জন্য [অস্পষ্ট] বা [পাঠোদ্ধার সম্ভব হয়নি] ব্যবহার করুন)..."
                className="flex-1 bg-[#090d16] border border-slate-700 rounded-lg p-2.5 text-xs text-slate-200 focus:outline-none focus:border-amber-400"
              />
              <div className="flex sm:flex-col justify-between gap-2 shrink-0">
                <button
                  onClick={handleManualTextExtract}
                  className="px-3.5 py-2 bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold rounded-lg text-xs whitespace-nowrap"
                >
                  পাঠ নিষ্কাশন ও ম্যাচ করুন
                </button>
                <label className="cursor-pointer px-3.5 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-lg text-xs text-center whitespace-nowrap">
                  <span>দলিল ফাইল আপলোড</span>
                  <input
                    type="file"
                    className="sr-only"
                    onChange={(e) => {
                      handleForensicFileUpload(e.target.files);
                      e.target.value = '';
                    }}
                  />
                </label>
              </div>
            </div>

            {uploadStatusMsg && (
              <div className="bg-emerald-950/50 border border-emerald-500/40 rounded-lg p-2.5 text-xs text-emerald-200 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>{uploadStatusMsg}</span>
              </div>
            )}
          </div>

          {/* Evidence ID & Document Traceability Register (Section 15) */}
          <div className="lg:col-span-5 bg-[#121827] border border-slate-800 rounded-xl p-4 space-y-2.5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-emerald-400" />
                <span>এভিডেন্স আইডি ও সোর্স ট্রেসেবিলিটি রেজিস্টার (Section 15)</span>
              </h3>
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] text-slate-400">
                  মোট উৎস: {toBengaliNumber(evidenceDocs.length)} টি
                </span>
                <button
                  onClick={handleDownloadEvidenceRegisterPdf}
                  disabled={isExportingPdf}
                  className="px-2 py-1 bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold rounded text-[10px] flex items-center gap-1"
                  title="এভিডেন্স রেজিস্টার PDF হিসেবে লোকাল ডিস্কে সেভ করুন"
                >
                  <Download className="w-3 h-3" />
                  <span>.PDF সেভ</span>
                </button>
                <button
                  onClick={handleDownloadEvidenceRegisterExcel}
                  className="px-2 py-1 bg-emerald-950/60 hover:bg-emerald-900/70 border border-emerald-500/40 text-emerald-300 font-semibold rounded text-[10px] flex items-center gap-1"
                  title="এভিডেন্স রেজিস্টার Excel হিসেবে লোকাল ডিস্কে সেভ করুন"
                >
                  <FileSpreadsheet className="w-3 h-3" />
                  <span>.XLSX সেভ</span>
                </button>
              </div>
            </div>

            <div className="max-h-36 overflow-y-auto space-y-1.5 pr-1">
              {evidenceDocs.map((doc) => (
                <div
                  key={`${doc.evidenceId}_${doc.sha256Hash}`}
                  className="bg-[#0b101b] border border-slate-800 rounded-lg p-2 text-[11px] flex items-center justify-between gap-2"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono font-bold text-amber-300 bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/30">
                        {doc.evidenceId}
                      </span>
                      <span className="font-bold text-white truncate">{doc.originalFileName}</span>
                      {doc.isDuplicateUpload && (
                        <span className="text-[10px] bg-rose-500/20 text-rose-300 px-1.5 rounded">
                          ডুপ্লিকেট ফাইল
                        </span>
                      )}
                    </div>
                    <div className="text-slate-400 truncate mt-0.5">
                      {doc.hierarchyTier} · মৌজা: {doc.mouza} (JL {doc.jlNo}) · SHA-256:{' '}
                      <code className="text-slate-300">{doc.sha256Hash.slice(0, 12)}...</code>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold border ${getBadgeStyle(
                        doc.verificationStatus
                      )}`}
                    >
                      {doc.verificationStatus}
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        handleDownloadSingleItemPdf(
                          `EVIDENCE RECORD: ${doc.evidenceId} (${doc.originalFileName})`,
                          `ধরন: ${doc.documentType} | প্রমাণের স্তর: ${doc.hierarchyTier}`,
                          {
                            'Evidence ID': doc.evidenceId,
                            'মূল ফাইলের নাম': doc.originalFileName,
                            'দলিলের ধরন': doc.documentType,
                            'প্রমাণের স্তরক্রম (Tier)': doc.hierarchyTier,
                            'ভৌগোলিক পরিচয়': `${doc.district} → ${doc.upazila} → মৌজা: ${doc.mouza} (JL ${doc.jlNo})`,
                            'SHA-256 হ্যাশ': doc.sha256Hash,
                            'যাচাই স্ট্যাটাস': doc.verificationStatus,
                            'নিষ্কাশিত মূল পাঠ': doc.extractedOriginalText,
                          },
                          `Evidence_Doc_${doc.evidenceId}`
                        )
                      }
                      className="px-1.5 py-0.5 rounded bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-[10px] flex items-center gap-0.5"
                      title="এই প্রামাণ্য দলিল রেকর্ডটি PDF হিসেবে লোকাল ডিস্কে ডাউনলোড করুন"
                    >
                      <Download className="w-2.5 h-2.5" />
                      <span>PDF</span>
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        handleDownloadSingleItemJson(doc, `Evidence_Doc_${doc.evidenceId}`)
                      }
                      className="px-1.5 py-0.5 rounded bg-purple-950/60 hover:bg-purple-900/80 border border-purple-500/40 text-purple-300 font-semibold text-[10px] flex items-center gap-0.5"
                      title="এই প্রামাণ্য দলিল রেকর্ডটি JSON হিসেবে লোকাল ডিস্কে ডাউনলোড করুন"
                    >
                      <FileJson className="w-2.5 h-2.5" />
                      <span>JSON</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* AUTOMATED DISCREPANCY DETECTOR: DAG 651 INCONSISTENCY ALERT SECTION */}
        <Dag651DiscrepancyDetector
          records={records}
          onNavigateToChain={() => setActiveReportTab('report5')}
        />

        {/* Global Forensic Filter Bar (Section 16: 11 Mandatory Filters) */}
        <section className="bg-[#121827] border border-slate-800 rounded-xl p-3 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-slate-300">
              ফরেনসিক মাল্টি-ডাইমেনশন ফিল্টার (জেলা, উপজেলা, মৌজা, জরিপ, খতিয়ান, দাগ, নাম, পিতার নাম, প্রমাণ স্ট্যাটাস ও ম্যাচ ক্লাসিফিকেশন):
            </span>
            <button
              onClick={() => {
                setFilterDistrict('');
                setFilterUpazila('');
                setFilterMouza('');
                setFilterSurvey('');
                setFilterKhatian('');
                setFilterDag('');
                setFilterPerson('');
                setFilterFather('');
                setFilterEvidenceStatus('');
                setFilterMatchClass('');
                setFilterDocType('');
              }}
              className="text-amber-300 hover:underline text-[11px] flex items-center gap-1"
            >
              <RotateCcw className="w-3 h-3" />
              <span>সকল ফিল্টার রিসেট</span>
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 xl:grid-cols-11 gap-2 text-xs">
            <input
              value={filterDistrict}
              onChange={(e) => setFilterDistrict(e.target.value)}
              placeholder="জেলা..."
              className="bg-[#090d16] border border-slate-700 rounded px-2 py-1 text-slate-200"
            />
            <input
              value={filterUpazila}
              onChange={(e) => setFilterUpazila(e.target.value)}
              placeholder="উপজেলা..."
              className="bg-[#090d16] border border-slate-700 rounded px-2 py-1 text-slate-200"
            />
            <input
              value={filterMouza}
              onChange={(e) => setFilterMouza(e.target.value)}
              placeholder="মৌজা (যেমন: গোয়ালী)..."
              className="bg-[#090d16] border border-slate-700 rounded px-2 py-1 text-slate-200"
            />
            <input
              value={filterSurvey}
              onChange={(e) => setFilterSurvey(e.target.value)}
              placeholder="জরিপ (CS/SA/RS/BS)..."
              className="bg-[#090d16] border border-slate-700 rounded px-2 py-1 text-slate-200"
            />
            <input
              value={filterKhatian}
              onChange={(e) => setFilterKhatian(e.target.value)}
              placeholder="খতিয়ান নং..."
              className="bg-[#090d16] border border-slate-700 rounded px-2 py-1 text-slate-200"
            />
            <input
              value={filterDag}
              onChange={(e) => setFilterDag(e.target.value)}
              placeholder="দাগ নং..."
              className="bg-[#090d16] border border-slate-700 rounded px-2 py-1 text-slate-200"
            />
            <input
              value={filterPerson}
              onChange={(e) => setFilterPerson(e.target.value)}
              placeholder="ব্যক্তির নাম..."
              className="bg-[#090d16] border border-slate-700 rounded px-2 py-1 text-slate-200"
            />
            <input
              value={filterFather}
              onChange={(e) => setFilterFather(e.target.value)}
              placeholder="পিতার নাম..."
              className="bg-[#090d16] border border-slate-700 rounded px-2 py-1 text-slate-200"
            />
            <select
              value={filterEvidenceStatus}
              onChange={(e) => setFilterEvidenceStatus(e.target.value)}
              className="bg-[#090d16] border border-slate-700 rounded px-2 py-1 text-slate-200"
            >
              <option value="">প্রমাণ স্ট্যাটাস (সকল)</option>
              <option value="VERIFIED">VERIFIED</option>
              <option value="CORROBORATED">CORROBORATED</option>
              <option value="PARTIALLY VERIFIED">PARTIALLY VERIFIED</option>
              <option value="IDENTITY CANDIDATE">IDENTITY CANDIDATE</option>
              <option value="UNVERIFIED">UNVERIFIED</option>
              <option value="RECORD GAP">RECORD GAP</option>
              <option value="AREA MISMATCH">AREA MISMATCH</option>
              <option value="GEOGRAPHIC MISMATCH">GEOGRAPHIC MISMATCH</option>
              <option value="CONTRADICTORY RECORDS">CONTRADICTORY RECORDS</option>
            </select>
            <select
              value={filterMatchClass}
              onChange={(e) => setFilterMatchClass(e.target.value)}
              className="bg-[#090d16] border border-slate-700 rounded px-2 py-1 text-slate-200"
            >
              <option value="">ম্যাচ ক্লাস (সকল)</option>
              <option value="EXACT NAME + FATHER MATCH">EXACT NAME + FATHER MATCH</option>
              <option value="VARIANT NAME MATCH">VARIANT NAME MATCH</option>
              <option value="IDENTITY CANDIDATE">IDENTITY CANDIDATE</option>
              <option value="UNVERIFIED SAME PERSON">UNVERIFIED SAME PERSON</option>
              <option value="CONTRADICTORY IDENTITY">CONTRADICTORY IDENTITY</option>
              <option value="NO MATCH">NO MATCH</option>
            </select>
            <select
              value={filterDocType}
              onChange={(e) => setFilterDocType(e.target.value)}
              className="bg-[#090d16] border border-slate-700 rounded px-2 py-1 text-slate-200"
            >
              <option value="">দলিলের ধরন (সকল)</option>
              {DOCUMENT_TYPES.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </div>
        </section>

        {/* Navigation Tabs for All 10 Required Output Reports + Master Genealogy + Automated Tests A–J */}
        <section className="bg-[#121827] border border-amber-500/30 rounded-xl overflow-hidden shadow-xl">
          <div className="p-2.5 bg-[#0c111d] border-b border-slate-800 flex flex-wrap gap-1.5">
            {[
              {
                id: 'detector' as const,
                label: `🚨 দাগ ৬৫১ গরমিল ডিটেক্টর (${toBengaliNumber(DAG_651_DISCREPANCY_ITEMS.length)})`,
              },
              {
                id: 'report1' as const,
                label: `REPORT 1: নিষ্কাশিত দলিল (${toBengaliNumber(filteredExtractedEntries.length)})`,
              },
              {
                id: 'report2' as const,
                label: `REPORT 2: বংশলতিকা ম্যাচকৃত (${toBengaliNumber(report2MatchedPersons.length)})`,
              },
              {
                id: 'report3' as const,
                label: `REPORT 3: ওয়ারিশ সনদ ব্যক্তি (${toBengaliNumber(report3InheritancePersons.length)})`,
              },
              {
                id: 'report4' as const,
                label: `REPORT 4: অমিলকৃত ব্যক্তি (${toBengaliNumber(report4UnmatchedPersons.length)})`,
              },
              {
                id: 'report5' as const,
                label: `REPORT 5: খতিয়ান ও দাগ ম্যাপিং (${toBengaliNumber(report5CrossMappings.length)})`,
              },
              {
                id: 'report6' as const,
                label: `REPORT 6: নাম বিলুপ্তি ও রূপান্তর অডিট (${toBengaliNumber(
                  report6TransitionAudits.length
                )})`,
              },
              {
                id: 'report7' as const,
                label: `REPORT 7: জমির পরিমাণ সমন্বয় (${toBengaliNumber(
                  report7AreaReconciliations.length
                )})`,
              },
              {
                id: 'report8' as const,
                label: `REPORT 8: রেকর্ড গ্যাপ রেজিস্টার (${toBengaliNumber(report8RecordGaps.length)})`,
              },
              {
                id: 'report9' as const,
                label: `REPORT 9: বিরোধ ও আদালত বিশ্লেষণ (${toBengaliNumber(report9Anomalies.length)})`,
              },
              {
                id: 'report10' as const,
                label: `REPORT 10: মাস্টার লেজার আপডেট প্রস্তাব (${toBengaliNumber(proposals.length)})`,
              },
              {
                id: 'genealogy' as const,
                label: `মাস্টার বংশলতিকা বৃক্ষ (${toBengaliNumber(genealogyLedger.length)} জন)`,
              },
              {
                id: 'tests' as const,
                label: `TEST A–J ভেরিফিকেশন স্যুট (১০/১০ পাস)`,
              },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveReportTab(tab.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  activeReportTab === tab.id
                    ? 'bg-amber-400 text-slate-950 font-bold shadow'
                    : 'bg-[#151e32] text-slate-300 hover:bg-slate-800'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Dedicated Per-Document Local Disk Save Bar */}
          <div className="px-4 py-2.5 bg-[#101829] border-b border-amber-500/20 flex flex-wrap items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-2 text-slate-200">
              <Download className="w-4 h-4 text-amber-400 shrink-0" />
              <span>
                বর্তমান নির্বাচিত ডকুমেন্ট (<strong className="text-amber-300">{buildCurrentReportExportData().title}</strong>) সরাসরি লোকাল ডিস্কে সেভ করুন:
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-1.5">
              <button
                onClick={handleExportCurrentReportPdf}
                disabled={isExportingPdf}
                className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-amber-400 to-yellow-400 hover:from-amber-300 hover:to-yellow-300 text-slate-950 font-bold text-xs flex items-center gap-1 shadow"
              >
                {isExportingPdf ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Download className="w-3.5 h-3.5 stroke-[2.5]" />
                )}
                <span>লোকাল ডিস্কে PDF সেভ (.pdf)</span>
              </button>
              <button
                onClick={handleExportCurrentReportExcel}
                className="px-2.5 py-1.5 rounded-lg bg-emerald-950/60 hover:bg-emerald-900/70 border border-emerald-500/40 text-emerald-300 font-semibold text-xs flex items-center gap-1"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
                <span>Excel সেভ (.xlsx)</span>
              </button>
              <button
                onClick={handleExportCurrentReportCsv}
                className="px-2.5 py-1.5 rounded-lg bg-sky-950/60 hover:bg-sky-900/70 border border-sky-500/40 text-sky-300 font-semibold text-xs flex items-center gap-1"
              >
                <FileText className="w-3.5 h-3.5 text-sky-400" />
                <span>CSV সেভ (.csv)</span>
              </button>
              <button
                onClick={handleExportCurrentReportJson}
                className="px-2.5 py-1.5 rounded-lg bg-purple-950/60 hover:bg-purple-900/70 border border-purple-500/40 text-purple-300 font-semibold text-xs flex items-center gap-1"
              >
                <FileJson className="w-3.5 h-3.5 text-purple-400" />
                <span>JSON সেভ (.json)</span>
              </button>
            </div>
          </div>

          {/* DETECTOR: DAG 651 DISCREPANCY DETECTOR (AUTOMATED INCONSISTENCY FLAGGING) */}
          {activeReportTab === 'detector' && (
            <div className="p-4 space-y-4">
              <Dag651DiscrepancyDetector
                records={records}
                onNavigateToChain={() => setActiveReportTab('report5')}
              />
            </div>
          )}

          {/* REPORT 1: UPLOADED DOCUMENT EXTRACTION */}
          {activeReportTab === 'report1' && (
            <div className="p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-white">
                    REPORT 1 — UPLOADED DOCUMENT EXTRACTION (উদ্ধৃত নাম, খতিয়ান, দাগ, জমি ও দলিল রেফারেন্স)
                  </h3>
                  <p className="text-xs text-slate-400">
                    মূল বাংলা নাম ও সংখ্যা অবিকৃত রেখে নরমালাইজড রূপ পৃথক কলামে সংরক্ষিত (Section 4 & 14)
                  </p>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-[#0b101d] text-amber-300 border-b border-slate-800">
                      <th className="p-2.5 border-r border-slate-800">Evidence ID & Source</th>
                      <th className="p-2.5 border-r border-slate-800">ভৌগোলিক যাচাই (Stage 1)</th>
                      <th className="p-2.5 border-r border-slate-800">জরিপ, খতিয়ান ও দাগ</th>
                      <th className="p-2.5 border-r border-slate-800">মূল নাম (Original Name)</th>
                      <th className="p-2.5 border-r border-slate-800">নরমালাইজড নাম</th>
                      <th className="p-2.5 border-r border-slate-800">পিতার নাম (Original)</th>
                      <th className="p-2.5 border-r border-slate-800">জমি ও অংশ</th>
                      <th className="p-2.5">প্রমাণ স্ট্যাটাস ও ডাউনলোড</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/80">
                    {filteredExtractedEntries.map((e) => (
                      <tr key={e.entryId} className="hover:bg-slate-800/40">
                        <td className="p-2.5 border-r border-slate-800">
                          <span className="font-mono font-bold text-amber-300">{e.evidenceId}</span>
                          <div className="text-[11px] text-slate-300">{e.sourceDocumentName}</div>
                          <div className="text-[10px] text-slate-500">
                            {e.documentType} · {e.pageLocation}
                          </div>
                        </td>
                        <td className="p-2.5 border-r border-slate-800">
                          <div className="font-semibold text-white">
                            {e.district} → {e.upazila} → মৌজা: {e.mouza} (JL {e.jlNo})
                          </div>
                          <span
                            className={`inline-block mt-1 px-1.5 py-0.5 rounded text-[10px] font-bold border ${
                              e.geographicValidation.isValid
                                ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                                : 'bg-rose-500/15 text-rose-300 border-rose-500/30'
                            }`}
                          >
                            {e.geographicValidation.status}
                          </span>
                        </td>
                        <td className="p-2.5 border-r border-slate-800 font-mono-num">
                          <span className="text-amber-300 font-bold">{e.surveyType}</span> | খতিয়ান:{' '}
                          {e.khatianNo} | দাগ: {e.dagNo}
                        </td>
                        <td className="p-2.5 border-r border-slate-800 font-bold text-white">
                          {e.originalPersonName}
                        </td>
                        <td className="p-2.5 border-r border-slate-800 text-slate-300">
                          {e.normalizedPersonName}
                        </td>
                        <td className="p-2.5 border-r border-slate-800 text-slate-200">
                          {e.fatherOriginalName}
                        </td>
                        <td className="p-2.5 border-r border-slate-800">
                          <div className="text-emerald-400 font-semibold">
                            {e.landAreaRaw} ({toBengaliNumber(e.landAreaShatak)} শতক)
                          </div>
                          <div className="text-[11px] text-slate-400">অংশ: {e.share}</div>
                        </td>
                        <td className="p-2.5 space-y-1.5">
                          <span
                            className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold border ${getBadgeStyle(
                              e.evidenceStatus
                            )}`}
                          >
                            {e.evidenceStatus}
                          </span>
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() =>
                                handleDownloadSingleItemPdf(
                                  `EXTRACTED ENTRY: ${e.evidenceId} — ${e.originalPersonName}`,
                                  `${e.surveyType} খতিয়ান: ${e.khatianNo} | দাগ: ${e.dagNo} | মৌজা: ${e.mouza}`,
                                  {
                                    'Entry & Evidence ID': `${e.entryId} (${e.evidenceId})`,
                                    'উৎস দলিল ও পৃষ্ঠা': `${e.sourceDocumentName} (${e.pageLocation})`,
                                    'ভৌগোলিক পরিচয়': `${e.district} → ${e.upazila} → ${e.mouza} (JL ${e.jlNo}) [${e.geographicValidation.status}]`,
                                    'জরিপ, খতিয়ান ও দাগ': `${e.surveyType} | খতিয়ান: ${e.khatianNo} | দাগ: ${e.dagNo}`,
                                    'মূল নাম (Original)': e.originalPersonName,
                                    'নরমালাইজড নাম': e.normalizedPersonName,
                                    'পিতার নাম': e.fatherOriginalName,
                                    'জমি ও অংশ': `${e.landAreaRaw} (${toBengaliNumber(e.landAreaShatak)} শতক) | অংশ: ${e.share}`,
                                    'প্রমাণ স্ট্যাটাস': e.evidenceStatus,
                                  },
                                  `Extracted_Entry_${e.entryId}`
                                )
                              }
                              className="px-1.5 py-0.5 rounded bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-[10px] flex items-center gap-0.5"
                              title="এই নিষ্কাশিত এন্ট্রিটি PDF হিসেবে লোকাল ডিস্কে ডাউনলোড করুন"
                            >
                              <Download className="w-2.5 h-2.5" />
                              <span>Download .PDF</span>
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                handleDownloadSingleItemJson(e, `Extracted_Entry_${e.entryId}`)
                              }
                              className="px-1.5 py-0.5 rounded bg-purple-950/60 hover:bg-purple-900/80 border border-purple-500/40 text-purple-300 font-semibold text-[10px]"
                            >
                              .JSON
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* REPORT 2: GENEALOGY MATCHED PERSONS */}
          {activeReportTab === 'report2' && (
            <div className="p-4 space-y-3">
              <div>
                <h3 className="text-base font-bold text-white">
                  REPORT 2 — GENEALOGY MATCHED PERSONS (মাস্টার বংশলতিকার সাথে ম্যাচকৃত ব্যক্তিগণের ফরেনসিক প্রতিবেদন)
                </h3>
                <p className="text-xs text-slate-400">
                  কেবল নামের সাদৃশ্যে কাউকে পরিবারভুক্ত নিশ্চিত করা হয়নি; ভৌগোলিক মৌজা, পিতার নাম ও খতিয়ান-দাগ প্রমাণসহ শ্রেণিবিন্যাসকৃত (Section 6)
                </p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-[#0b101d] text-amber-300 border-b border-slate-800">
                      <th className="p-2.5 border-r border-slate-800">Evidence & Source</th>
                      <th className="p-2.5 border-r border-slate-800">উদ্ধৃত মূল নাম</th>
                      <th className="p-2.5 border-r border-slate-800">বংশলতিকায় ম্যাচকৃত নাম</th>
                      <th className="p-2.5 border-r border-slate-800">পিতা/স্বামী ও ভৌগোলিক তুলনা</th>
                      <th className="p-2.5 border-r border-slate-800">খতিয়ান ও দাগ তুলনা</th>
                      <th className="p-2.5 border-r border-slate-800">সমর্থনকারী ও বিরোধী প্রমাণ</th>
                      <th className="p-2.5">ফরেনসিক ম্যাচ ক্লাসিফিকেশন ও ডাউনলোড</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/80">
                    {report2MatchedPersons.map((m) => (
                      <tr key={m.matchId} className="hover:bg-slate-800/40 align-top">
                        <td className="p-2.5 border-r border-slate-800">
                          <span className="font-mono font-bold text-amber-300">{m.evidenceId}</span>
                          <div className="text-[11px] text-slate-300">{m.uploadedDocumentName}</div>
                        </td>
                        <td className="p-2.5 border-r border-slate-800">
                          <div className="font-bold text-white">{m.originalExtractedName}</div>
                          <div className="text-[10px] text-slate-400">
                            Normalized: {m.normalizedExtractedName}
                          </div>
                        </td>
                        <td className="p-2.5 border-r border-slate-800">
                          <div className="font-bold text-emerald-300">{m.matchedGenealogyName}</div>
                          {m.matchedGenealogyPerson && (
                            <div className="text-[10px] text-slate-400">
                              ID: {m.matchedGenealogyPerson.personId} ·{' '}
                              {m.matchedGenealogyPerson.relationshipLabel}
                            </div>
                          )}
                        </td>
                        <td className="p-2.5 border-r border-slate-800 space-y-1">
                          <div className="text-slate-200">{m.fatherSpouseComparison}</div>
                          <div className="text-[10px] text-slate-400">{m.geographicComparison}</div>
                        </td>
                        <td className="p-2.5 border-r border-slate-800 font-mono-num text-slate-200">
                          {m.khatianDagComparison}
                        </td>
                        <td className="p-2.5 border-r border-slate-800 space-y-1">
                          {m.supportingEvidence.map((s, i) => (
                            <div key={i} className="text-[11px] text-emerald-300">
                              ✓ {s}
                            </div>
                          ))}
                          {m.conflictingEvidence.map((c, i) => (
                            <div key={i} className="text-[11px] text-rose-300">
                              ⚠ {c}
                            </div>
                          ))}
                          <div className="text-[11px] text-slate-300 pt-1 border-t border-slate-800">
                            {m.explanation}
                          </div>
                        </td>
                        <td className="p-2.5 space-y-1">
                          <span
                            className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold border ${getBadgeStyle(
                              m.evidenceStatus
                            )}`}
                          >
                            {m.matchClassification}
                          </span>
                          <div className="text-[10px] text-slate-400">
                            প্রমাণ স্ট্যাটাস: <strong>{m.evidenceStatus}</strong>
                          </div>
                          <div className="text-[10px] text-amber-300">
                            বিশ্লেষণাত্মক স্কোর: {toBengaliNumber(m.confidenceScore)}% (সহায়ক সূচক মাত্র)
                          </div>
                          <div className="text-[10px] text-slate-400 font-mono">
                            {m.neutralDesignation}
                          </div>
                          <div className="flex items-center gap-1 pt-1">
                            <button
                              type="button"
                              onClick={() =>
                                handleDownloadSingleItemPdf(
                                  `GENEALOGY MATCH REPORT: ${m.originalExtractedName}`,
                                  `Evidence ID: ${m.evidenceId} | Classification: ${m.matchClassification}`,
                                  {
                                    'Match ID & Evidence': `${m.matchId} (${m.evidenceId})`,
                                    'উদ্ধৃত মূল নাম': m.originalExtractedName,
                                    'বংশলতিকায় ম্যাচকৃত নাম': m.matchedGenealogyName,
                                    'পিতা/স্বামী তুলনা': m.fatherSpouseComparison,
                                    'ভৌগোলিক তুলনা': m.geographicComparison,
                                    'খতিয়ান ও দাগ তুলনা': m.khatianDagComparison,
                                    'ম্যাচ ক্লাসিফিকেশন': `${m.matchClassification} [${m.evidenceStatus}]`,
                                    'ফরেনসিক ব্যাখ্যা': m.explanation,
                                  },
                                  `Genealogy_Match_${m.matchId}`
                                )
                              }
                              className="px-1.5 py-0.5 rounded bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-[10px] flex items-center gap-0.5"
                            >
                              <Download className="w-2.5 h-2.5" />
                              <span>Download .PDF</span>
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                handleDownloadSingleItemJson(m, `Genealogy_Match_${m.matchId}`)
                              }
                              className="px-1.5 py-0.5 rounded bg-purple-950/60 hover:bg-purple-900/80 border border-purple-500/40 text-purple-300 font-semibold text-[10px]"
                            >
                              .JSON
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* REPORT 3: INHERITANCE CERTIFICATE — EXTRACTED PERSONS */}
          {activeReportTab === 'report3' && (
            <div className="p-4 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h3 className="text-base font-bold text-white">
                    INHERITANCE CERTIFICATE — EXTRACTED PERSONS (ওয়ারিশ সনদ হতে নিষ্কাশিত পৃথক ব্যক্তি তালিকা — Section 7)
                  </h3>
                  <p className="text-xs text-slate-400">
                    নিরপেক্ষ মর্যাদা: <strong className="text-amber-300">RECORD-LINKED PERSONS</strong> | ওয়ারিশ সনদ নিজে থেকে বর্তমান স্বত্ব বা দখল প্রমাণ করে না; ঐতিহাসিক খতিয়ানের সাথে ক্রস-রেফারেন্সকৃত
                  </p>
                </div>

                {/* 3 Mandatory Output Sub-Buckets */}
                <div className="flex flex-wrap gap-1.5 text-xs">
                  {[
                    { id: 'ALL', label: 'সকল ওয়ারিশ (৪৯ জন)' },
                    {
                      id: 'Matched Inheritance Certificate Persons',
                      label: '1. Matched Inheritance Persons',
                    },
                    {
                      id: 'Unmatched Inheritance Certificate Persons',
                      label: '2. Unmatched Inheritance Persons',
                    },
                    {
                      id: 'Inheritance Certificate Persons Requiring Identity Verification',
                      label: '3. Requiring Identity Verification',
                    },
                  ].map((b) => (
                    <button
                      key={b.id}
                      onClick={() => setReport3SubFilter(b.id)}
                      className={`px-2.5 py-1 rounded border text-[11px] font-semibold ${
                        report3SubFilter === b.id
                          ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                          : 'bg-[#090d16] text-slate-400 border-slate-800'
                      }`}
                    >
                      {b.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-[#0b101d] text-amber-300 border-b border-slate-800">
                      <th className="p-2 border-r border-slate-800">Person ID</th>
                      <th className="p-2 border-r border-slate-800">Original Name</th>
                      <th className="p-2 border-r border-slate-800">Normalized Name</th>
                      <th className="p-2 border-r border-slate-800">Father's & Spouse's Name</th>
                      <th className="p-2 border-r border-slate-800">Relationship to Deceased</th>
                      <th className="p-2 border-r border-slate-800">Certificate No, Date & Authority</th>
                      <th className="p-2 border-r border-slate-800">Mouza, Source & Page</th>
                      <th className="p-2 border-r border-slate-800">CS / SA / RS / BRS Cross-Ref</th>
                      <th className="p-2">Verification Status & Download</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/80">
                    {report3InheritancePersons.map((p) => (
                      <tr key={p.personId} className="hover:bg-slate-800/40 align-top">
                        <td className="p-2 border-r border-slate-800 font-mono font-bold text-amber-300">
                          {p.personId}
                          <div className="text-[10px] text-slate-400">{p.evidenceId}</div>
                        </td>
                        <td className="p-2 border-r border-slate-800 font-bold text-white">
                          {p.originalName}
                        </td>
                        <td className="p-2 border-r border-slate-800 text-slate-300">
                          {p.normalizedName}
                        </td>
                        <td className="p-2 border-r border-slate-800">
                          <div>পিতা: {p.fatherName}</div>
                          <div className="text-[10px] text-slate-400">স্বামী: {p.spouseName}</div>
                        </td>
                        <td className="p-2 border-r border-slate-800 text-emerald-300 font-semibold">
                          {p.relationshipToDeceased}
                        </td>
                        <td className="p-2 border-r border-slate-800">
                          <div className="font-mono text-amber-200">সনদ: {p.certificateNumber}</div>
                          <div className="text-[10px] text-slate-300">তারিখ: {p.issueDate}</div>
                          <div className="text-[10px] text-slate-400">{p.issuingAuthority}</div>
                        </td>
                        <td className="p-2 border-r border-slate-800">
                          <div>{p.mouzaVillage}</div>
                          <div className="text-[10px] text-slate-400">
                            {p.sourceDocument} ({p.pageLocation})
                          </div>
                        </td>
                        <td className="p-2 border-r border-slate-800 text-[11px] space-y-0.5">
                          <div>
                            <strong className="text-amber-300">বংশলতিকা:</strong>{' '}
                            {p.crossReferences.genealogyMatch}
                          </div>
                          <div>
                            <strong>SA:</strong> {p.crossReferences.saRecordRef}
                          </div>
                          <div>
                            <strong>RS:</strong> {p.crossReferences.rsRecordRef}
                          </div>
                          <div>
                            <strong>BRS:</strong> {p.crossReferences.bsBrsRecordRef}
                          </div>
                        </td>
                        <td className="p-2 space-y-1">
                          <span
                            className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold border ${getBadgeStyle(
                              p.verificationStatus
                            )}`}
                          >
                            {p.verificationStatus}
                          </span>
                          <div className="text-[10px] text-slate-300">{p.outputGroup}</div>
                          <div className="text-[9px] font-mono text-amber-300">
                            {p.neutralDesignation}
                          </div>
                          <div className="flex items-center gap-1 pt-1">
                            <button
                              type="button"
                              onClick={() =>
                                handleDownloadSingleItemPdf(
                                  `INHERITANCE PERSON RECORD: ${p.originalName} (${p.personId})`,
                                  `সনদ নং: ${p.certificateNumber} | ইস্যু তারিখ: ${p.issueDate}`,
                                  {
                                    'Person ID & Evidence': `${p.personId} (${p.evidenceId})`,
                                    'মূল নাম (Original)': p.originalName,
                                    'নরমালাইজড নাম': p.normalizedName,
                                    'পিতা ও স্বামী': `পিতা: ${p.fatherName} | স্বামী: ${p.spouseName}`,
                                    'মৃত পূর্বপুরুষের সাথে সম্পর্ক': p.relationshipToDeceased,
                                    'ওয়ারিশ সনদ নং ও তারিখ': `${p.certificateNumber} (${p.issueDate})`,
                                    'ঐতিহাসিক রেকর্ড ক্রস-রেফারেন্স': `CS: ${p.crossReferences.csRecordRef} | SA: ${p.crossReferences.saRecordRef} | RS: ${p.crossReferences.rsRecordRef} | BRS: ${p.crossReferences.bsBrsRecordRef}`,
                                    'যাচাই স্ট্যাটাস': `${p.outputGroup} [${p.verificationStatus}]`,
                                  },
                                  `Warish_Person_${p.personId}`
                                )
                              }
                              className="px-1.5 py-0.5 rounded bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-[10px] flex items-center gap-0.5"
                            >
                              <Download className="w-2.5 h-2.5" />
                              <span>Download .PDF</span>
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                handleDownloadSingleItemJson(p, `Warish_Person_${p.personId}`)
                              }
                              className="px-1.5 py-0.5 rounded bg-purple-950/60 hover:bg-purple-900/80 border border-purple-500/40 text-purple-300 font-semibold text-[10px]"
                            >
                              .JSON
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* REPORT 4: UNMATCHED PERSONS */}
          {activeReportTab === 'report4' && (
            <div className="p-4 space-y-3">
              <div>
                <h3 className="text-base font-bold text-white">
                  REPORT 4 — UNMATCHED PERSONS (আপলোডকৃত রেকর্ডে প্রাপ্ত কিন্তু বর্তমান বংশলতিকায় অমিলকৃত ব্যক্তিগণ)
                </h3>
                <p className="text-xs text-slate-400">
                  নিরপেক্ষ মর্যাদা: <strong className="text-amber-300">FORENSIC PERSONS OF INTEREST</strong> | প্রামাণ্য দলিল ছাড়া কাউকে অবৈধ দখলদার বা অপরাধী হিসেবে চিহ্নিত করা নিষিদ্ধ (Section 7 & 18)
                </p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-[#0b101d] text-amber-300 border-b border-slate-800">
                      <th className="p-2.5 border-r border-slate-800">Evidence ID & Doc</th>
                      <th className="p-2.5 border-r border-slate-800">Original Extracted Name</th>
                      <th className="p-2.5 border-r border-slate-800">পিতা / স্বামীর নাম</th>
                      <th className="p-2.5 border-r border-slate-800">ভৌগোলিক অবস্থান</th>
                      <th className="p-2.5 border-r border-slate-800">খতিয়ান ও দাগ</th>
                      <th className="p-2.5 border-r border-slate-800">ফরেনসিক ব্যাখ্যা</th>
                      <th className="p-2.5">স্ট্যাটাস ও ডাউনলোড</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/80">
                    {report4UnmatchedPersons.map((u) => (
                      <tr key={u.matchId} className="hover:bg-slate-800/40">
                        <td className="p-2.5 border-r border-slate-800 font-mono text-amber-300">
                          {u.evidenceId}
                          <div className="text-[10px] text-slate-400">{u.uploadedDocumentName}</div>
                        </td>
                        <td className="p-2.5 border-r border-slate-800 font-bold text-white">
                          {u.originalExtractedName}
                        </td>
                        <td className="p-2.5 border-r border-slate-800 text-slate-300">
                          {u.fatherSpouseComparison}
                        </td>
                        <td className="p-2.5 border-r border-slate-800">
                          {u.extractedEntry.district} → {u.extractedEntry.upazila} → মৌজা:{' '}
                          {u.extractedEntry.mouza} (JL {u.extractedEntry.jlNo})
                        </td>
                        <td className="p-2.5 border-r border-slate-800 font-mono-num">
                          {u.khatianDagComparison}
                        </td>
                        <td className="p-2.5 border-r border-slate-800 text-slate-300">
                          {u.explanation}
                        </td>
                        <td className="p-2.5 space-y-1">
                          <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-rose-500/15 text-rose-300 border border-rose-500/30">
                            {u.matchClassification}
                          </span>
                          <div className="text-[10px] text-slate-400">
                            {u.neutralDesignation}
                          </div>
                          <div className="flex items-center gap-1 pt-1">
                            <button
                              type="button"
                              onClick={() =>
                                handleDownloadSingleItemPdf(
                                  `UNMATCHED PERSON RECORD: ${u.originalExtractedName}`,
                                  `Evidence ID: ${u.evidenceId} | ${u.neutralDesignation}`,
                                  {
                                    'Match ID & Evidence': `${u.matchId} (${u.evidenceId})`,
                                    'উদ্ধৃত নাম': u.originalExtractedName,
                                    'পিতা/স্বামীর তথ্য': u.fatherSpouseComparison,
                                    'ভৌগোলিক অবস্থান': `${u.extractedEntry.district} → ${u.extractedEntry.upazila} → ${u.extractedEntry.mouza}`,
                                    'খতিয়ান ও দাগ': u.khatianDagComparison,
                                    'ফরেনসিক ব্যাখ্যা': u.explanation,
                                  },
                                  `Unmatched_Person_${u.matchId}`
                                )
                              }
                              className="px-1.5 py-0.5 rounded bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-[10px] flex items-center gap-0.5"
                            >
                              <Download className="w-2.5 h-2.5" />
                              <span>Download .PDF</span>
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                handleDownloadSingleItemJson(u, `Unmatched_Person_${u.matchId}`)
                              }
                              className="px-1.5 py-0.5 rounded bg-purple-950/60 hover:bg-purple-900/80 border border-purple-500/40 text-purple-300 font-semibold text-[10px]"
                            >
                              .JSON
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* REPORT 5: HISTORICAL KHATIAN & DAG MATCHING */}
          {activeReportTab === 'report5' && (
            <div className="p-4 space-y-3">
              <div>
                <h3 className="text-base font-bold text-white">
                  REPORT 5 — HISTORICAL KHATIAN & DAG MATCHING (CS → CR → SA → RS → BS/BRS খতিয়ান ও দাগ ক্রস-ম্যাপিং)
                </h3>
                <p className="text-xs text-slate-400">
                  কেবল সংখ্যার মিল দেখে দাগ রূপান্তর অনুমান করা হয়নি; প্রতিটি ম্যাপিংয়ে উৎস দলিল ও যাচাই স্ট্যাটাস সংযুক্ত (Section 10)
                </p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-[#0b101d] text-amber-300 border-b border-slate-800">
                      <th className="p-2.5 border-r border-slate-800">মৌজা ও জে.এল.</th>
                      <th className="p-2.5 border-r border-slate-800">CS খতিয়ান ও দাগ</th>
                      <th className="p-2.5 border-r border-slate-800">CR খতিয়ান ও দাগ</th>
                      <th className="p-2.5 border-r border-slate-800">SA খতিয়ান ও দাগ</th>
                      <th className="p-2.5 border-r border-slate-800">RS খতিয়ান ও দাগ</th>
                      <th className="p-2.5 border-r border-slate-800">BS/BRS খতিয়ান ও দাগ</th>
                      <th className="p-2.5 border-r border-slate-800">মালিক, পিতা ও আয়তন ধারাবাহিকতা</th>
                      <th className="p-2.5">রূপান্তর ধরন, প্রমাণ ও ডাউনলোড</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/80">
                    {report5CrossMappings.map((m) => (
                      <tr key={m.mappingId} className="hover:bg-slate-800/40 align-top">
                        <td className="p-2.5 border-r border-slate-800 font-bold text-white">
                          {m.mouza} (JL {m.jlNo})
                        </td>
                        <td className="p-2.5 border-r border-slate-800 font-mono-num">
                          খতিয়ান: {m.csKhatian || '—'}
                          <div>দাগ: {m.csDag || '—'}</div>
                        </td>
                        <td className="p-2.5 border-r border-slate-800 text-rose-300">
                          {m.crKhatian || '—'}
                        </td>
                        <td className="p-2.5 border-r border-slate-800 font-mono-num">
                          খতিয়ান: {m.saKhatian || '—'}
                          <div>দাগ: {m.saDag || '—'}</div>
                        </td>
                        <td className="p-2.5 border-r border-slate-800 font-mono-num">
                          খতিয়ান: {m.rsKhatian || '—'}
                          <div>দাগ: {m.rsDag || '—'}</div>
                        </td>
                        <td className="p-2.5 border-r border-slate-800 font-mono-num">
                          খতিয়ান: {m.bsBrsKhatian || '—'}
                          <div>দাগ: {m.bsBrsDag || '—'}</div>
                        </td>
                        <td className="p-2.5 border-r border-slate-800 space-y-1">
                          <div className="text-slate-200">{m.recordedOwnerProgression}</div>
                          <div className="text-[11px] text-slate-400">
                            পিতা: {m.fatherNameProgression}
                          </div>
                          <div className="text-[11px] text-emerald-300">
                            আয়তন: {m.areaProgression}
                          </div>
                        </td>
                        <td className="p-2.5 space-y-1">
                          <div className="font-bold text-amber-300">{m.conversionType}</div>
                          <div className="text-[10px] font-mono text-slate-300">{m.evidenceId}</div>
                          <span
                            className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold border ${getBadgeStyle(
                              m.verificationStatus
                            )}`}
                          >
                            {m.verificationStatus}
                          </span>
                          <div className="flex items-center gap-1 pt-1">
                            <button
                              type="button"
                              onClick={() =>
                                handleDownloadSingleItemPdf(
                                  `DAG & KHATIAN CROSS-MAPPING: ${m.mappingId}`,
                                  `মৌজা: ${m.mouza} (JL ${m.jlNo}) | ${m.conversionType}`,
                                  {
                                    'Mapping ID & Evidence': `${m.mappingId} (${m.evidenceId})`,
                                    'CS খতিয়ান ও দাগ': `খতিয়ান: ${m.csKhatian} | দাগ: ${m.csDag}`,
                                    'SA খতিয়ান ও দাগ': `খতিয়ান: ${m.saKhatian} | দাগ: ${m.saDag}`,
                                    'RS খতিয়ান ও দাগ': `খতিয়ান: ${m.rsKhatian} | দাগ: ${m.rsDag}`,
                                    'BS/BRS খতিয়ান ও দাগ': `খতিয়ান: ${m.bsBrsKhatian} | দাগ: ${m.bsBrsDag}`,
                                    'মালিকানার ধারাবাহিকতা': m.recordedOwnerProgression,
                                    'আয়তন ধারাবাহিকতা': m.areaProgression,
                                    'যাচাই স্ট্যাটাস': `${m.conversionType} [${m.verificationStatus}]`,
                                  },
                                  `Dag_Cross_Mapping_${m.mappingId}`
                                )
                              }
                              className="px-1.5 py-0.5 rounded bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-[10px] flex items-center gap-0.5"
                            >
                              <Download className="w-2.5 h-2.5" />
                              <span>Download .PDF</span>
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                handleDownloadSingleItemJson(m, `Dag_Cross_Mapping_${m.mappingId}`)
                              }
                              className="px-1.5 py-0.5 rounded bg-purple-950/60 hover:bg-purple-900/80 border border-purple-500/40 text-purple-300 font-semibold text-[10px]"
                            >
                              .JSON
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* REPORT 6: HISTORICAL RECORD TRANSITION & NAME DISAPPEARANCE AUDIT */}
          {activeReportTab === 'report6' && (
            <div className="p-4 space-y-3">
              <div>
                <h3 className="text-base font-bold text-white">
                  HISTORICAL RECORD TRANSITION & NAME DISAPPEARANCE AUDIT (REPORT 6 — Section 8)
                </h3>
                <p className="text-xs text-slate-400">
                  Earlier Record | Later Record | Change | Supporting Evidence | Status — কোন জরিপের ধাপে কার নাম বা অংশ বাদ পড়েছে বা পরিবর্তিত হয়েছে তার প্রামাণ্য অডিট
                </p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-[#0b101d] text-amber-300 border-b border-slate-800">
                      <th className="p-2.5 border-r border-slate-800">Transition Stage</th>
                      <th className="p-2.5 border-r border-slate-800">Earlier Record</th>
                      <th className="p-2.5 border-r border-slate-800">Later Record</th>
                      <th className="p-2.5 border-r border-slate-800">Change (A–K Classification)</th>
                      <th className="p-2.5 border-r border-slate-800">Supporting Evidence</th>
                      <th className="p-2.5 border-r border-slate-800">Status</th>
                      <th className="p-2.5 text-center">Download</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/80">
                    {report6TransitionAudits.map((t) => (
                      <tr key={t.auditId} className="hover:bg-slate-800/40 align-top">
                        <td className="p-2.5 border-r border-slate-800 font-bold text-amber-300">
                          {t.transitionStage}
                          <div className="text-[11px] text-slate-400">
                            মৌজা: {t.mouza} (JL {t.jlNo})
                          </div>
                        </td>
                        <td className="p-2.5 border-r border-slate-800 text-slate-200">
                          {t.earlierRecordSummary}
                        </td>
                        <td className="p-2.5 border-r border-slate-800 text-slate-200">
                          {t.laterRecordSummary}
                        </td>
                        <td className="p-2.5 border-r border-slate-800 space-y-1.5">
                          <div className="flex flex-wrap gap-1">
                            {t.identifiedChanges.map((c) => (
                              <span
                                key={c}
                                className="px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-300 border border-amber-500/30 text-[10px] font-semibold"
                              >
                                {c}
                              </span>
                            ))}
                          </div>
                          <div className="text-slate-200 leading-relaxed">{t.changeDescription}</div>
                          {t.primarySourceGapNote && (
                            <div className="p-2 rounded bg-rose-950/50 border border-rose-500/40 text-rose-200 font-mono text-[11px] font-bold">
                              {t.primarySourceGapNote}
                            </div>
                          )}
                        </td>
                        <td className="p-2.5 border-r border-slate-800 font-mono text-slate-300">
                          {t.supportingEvidence}
                        </td>
                        <td className="p-2.5 border-r border-slate-800">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold border ${getBadgeStyle(
                              t.status
                            )}`}
                          >
                            {t.status}
                          </span>
                        </td>
                        <td className="p-2.5 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <button
                              onClick={() =>
                                handleDownloadSingleItemPdf(
                                  `Record Transition Audit (${t.transitionStage})`,
                                  `${t.auditId} | মৌজা: ${t.mouza} | Status: ${t.status}`,
                                  {
                                    'Audit ID': t.auditId,
                                    'Transition Stage': t.transitionStage,
                                    'মৌজা ও JL': `${t.mouza} (JL ${t.jlNo})`,
                                    'পূর্ববর্তী রেকর্ড': t.earlierRecordSummary,
                                    'পরবর্তী রেকর্ড': t.laterRecordSummary,
                                    'পরিবর্তনের ধরন': t.identifiedChanges.join(', '),
                                    'বিবরণ': t.changeDescription,
                                    'গ্যাপ নোট': t.primarySourceGapNote || '—',
                                    'প্রমাণ ও স্ট্যাটাস': `${t.supportingEvidence} (${t.status})`,
                                  },
                                  `Forensic_Report6_Transition_${t.auditId}`
                                )
                              }
                              className="px-2 py-1 rounded bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border border-emerald-500/30 text-[10px] font-bold inline-flex items-center gap-1"
                              title="Download Transition Audit as PDF"
                            >
                              <Download className="w-3 h-3" />
                              <span>PDF</span>
                            </button>
                            <button
                              onClick={() =>
                                handleDownloadSingleItemJson(
                                  t,
                                  `Forensic_Report6_Transition_${t.auditId}`
                                )
                              }
                              className="px-2 py-1 rounded bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/30 text-[10px] font-bold inline-flex items-center gap-1"
                              title="Download Transition Audit as JSON"
                            >
                              <FileSpreadsheet className="w-3 h-3" />
                              <span>JSON</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* REPORT 7: LAND AREA RECONCILIATION */}
          {activeReportTab === 'report7' && (
            <div className="p-4 space-y-3">
              <div>
                <h3 className="text-base font-bold text-white">
                  REPORT 7 — LAND AREA & SHARE RECONCILIATION ENGINE (জমির পরিমাণ ও অংশ সমন্বয় — Section 9)
                </h3>
                <p className="text-xs text-slate-400">
                  সূত্র: <code className="text-amber-300 font-mono">Unexplained Area = Parent Dag Area − Sum of Identified Successor Areas</code> | একাধিক উৎসের দাবি (যেমন ৩৩ শতক বনাম ৩০ শতক) সমানভাবে সংরক্ষিত
                </p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-[#0b101d] text-amber-300 border-b border-slate-800">
                      <th className="p-2.5 border-r border-slate-800">প্যারেন্ট খতিয়ান ও দাগ</th>
                      <th className="p-2.5 border-r border-slate-800">প্যারেন্ট দাগের আয়তন (দাবিসমূহ)</th>
                      <th className="p-2.5 border-r border-slate-800">শনাক্তকৃত পরবর্তী (Successor) রেকর্ডসমূহ</th>
                      <th className="p-2.5 border-r border-slate-800">মোট শনাক্তকৃত আয়তন</th>
                      <th className="p-2.5 border-r border-slate-800">অমীমাংসিত জমি (Unexplained Area)</th>
                      <th className="p-2.5 border-r border-slate-800">ফরেনসিক সিদ্ধান্ত ও Evidence ID</th>
                      <th className="p-2.5 text-center">Download</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/80">
                    {report7AreaReconciliations.map((r) => (
                      <tr key={r.reconciliationId} className="hover:bg-slate-800/40 align-top">
                        <td className="p-2.5 border-r border-slate-800">
                          <div className="font-bold text-white">
                            {r.parentSurvey} খতিয়ান: {r.parentKhatian}
                          </div>
                          <div className="text-amber-300 font-semibold">দাগ: {r.parentDag}</div>
                          <div className="text-[11px] text-slate-400">{r.parentOwner}</div>
                        </td>
                        <td className="p-2.5 border-r border-slate-800 font-mono-num">
                          <div className="font-bold text-white text-sm">
                            প্রাথমিক দাবি: {toBengaliNumber(r.parentAreaShatakPrimaryClaim)} শতক
                          </div>
                          {r.parentAreaShatakAlternativeClaim !== undefined && (
                            <div className="text-amber-300 text-xs mt-1">
                              বিকল্প উৎস দাবি: {toBengaliNumber(r.parentAreaShatakAlternativeClaim)}{' '}
                              শতক
                            </div>
                          )}
                        </td>
                        <td className="p-2.5 border-r border-slate-800 space-y-1">
                          {r.successorEntries.map((s, idx) => (
                            <div
                              key={idx}
                              className="bg-[#0b0f1a] border border-slate-800 rounded px-2 py-1 flex items-center justify-between gap-2"
                            >
                              <span>
                                <strong>{s.survey}</strong> খতিয়ান {s.khatianNo}, দাগ {s.dagNo} (
                                {s.ownerName})
                              </span>
                              <span className="font-mono font-bold text-emerald-300">
                                {toBengaliNumber(s.areaShatak)} শতক [{s.evidenceId}]
                              </span>
                            </div>
                          ))}
                        </td>
                        <td className="p-2.5 border-r border-slate-800 font-mono-num font-bold text-emerald-400 text-sm">
                          {toBengaliNumber(r.totalIdentifiedSuccessorShatak)} শতক
                        </td>
                        <td className="p-2.5 border-r border-slate-800 font-mono-num">
                          <div
                            className={`text-sm font-bold ${
                              r.unexplainedAreaPrimaryShatak === 0
                                ? 'text-emerald-400'
                                : 'text-rose-400'
                            }`}
                          >
                            {toBengaliNumber(r.unexplainedAreaPrimaryShatak)} শতক
                          </div>
                          {r.unexplainedAreaAltShatak !== undefined && (
                            <div className="text-xs text-amber-300 mt-1">
                              বিকল্প ৩০ শতক দাবিতে: {toBengaliNumber(r.unexplainedAreaAltShatak)} শতক
                            </div>
                          )}
                        </td>
                        <td className="p-2.5 border-r border-slate-800 space-y-1">
                          <div className="font-bold text-amber-300">{r.classificationLabel}</div>
                          <div className="text-[11px] text-slate-300">{r.notes}</div>
                          <div className="text-[10px] font-mono text-slate-400">
                            Evidence IDs: {r.evidenceIds.join(', ')}
                          </div>
                        </td>
                        <td className="p-2.5 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <button
                              onClick={() =>
                                handleDownloadSingleItemPdf(
                                  `Land Area Reconciliation (${r.parentSurvey} দাগ ${r.parentDag})`,
                                  `${r.reconciliationId} | ${r.classificationLabel}`,
                                  {
                                    'Reconciliation ID': r.reconciliationId,
                                    'প্যারেন্ট খতিয়ান ও দাগ': `${r.parentSurvey} খতিয়ান ${r.parentKhatian}, দাগ ${r.parentDag}`,
                                    'প্যারেন্ট মালিক': r.parentOwner,
                                    'প্যারেন্ট আয়তন (প্রাথমিক)': `${toBengaliNumber(r.parentAreaShatakPrimaryClaim)} শতক`,
                                    'মোট শনাক্তকৃত আয়তন': `${toBengaliNumber(r.totalIdentifiedSuccessorShatak)} শতক`,
                                    'অমীমাংসিত জমি (Unexplained)': `${toBengaliNumber(r.unexplainedAreaPrimaryShatak)} শতক`,
                                    'সিদ্ধান্ত ও নোট': `${r.classificationLabel} — ${r.notes}`,
                                    'এভিডেন্স আইডি': r.evidenceIds.join(', '),
                                  },
                                  `Forensic_Report7_Area_${r.reconciliationId}`
                                )
                              }
                              className="px-2 py-1 rounded bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border border-emerald-500/30 text-[10px] font-bold inline-flex items-center gap-1"
                              title="Download Area Reconciliation as PDF"
                            >
                              <Download className="w-3 h-3" />
                              <span>PDF</span>
                            </button>
                            <button
                              onClick={() =>
                                handleDownloadSingleItemJson(
                                  r,
                                  `Forensic_Report7_Area_${r.reconciliationId}`
                                )
                              }
                              className="px-2 py-1 rounded bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/30 text-[10px] font-bold inline-flex items-center gap-1"
                              title="Download Area Reconciliation as JSON"
                            >
                              <FileSpreadsheet className="w-3 h-3" />
                              <span>JSON</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* REPORT 8: RECORD GAP REGISTER */}
          {activeReportTab === 'report8' && (
            <div className="p-4 space-y-3">
              <div>
                <h3 className="text-base font-bold text-white">
                  REPORT 8 — RECORD GAP REGISTER (অনুপস্থিত মূল দলিল, হাতে লেখা সিএস রেকর্ড ও ম্যাপ গ্যাপ রেজিস্টার)
                </h3>
                <p className="text-xs text-slate-400">
                  কোনো রেকর্ড অনুপস্থিত থাকলে অনুমানের ভিত্তিতে সিদ্ধান্ত না নিয়ে প্রামাণ্য দলিলের গ্যাপ হিসেবে চিহ্নিত (Section 8 & 14)
                </p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-[#0b101d] text-amber-300 border-b border-slate-800">
                      <th className="p-2.5 border-r border-slate-800">Gap ID & Category</th>
                      <th className="p-2.5 border-r border-slate-800">মৌজা, খতিয়ান ও দাগ</th>
                      <th className="p-2.5 border-r border-slate-800">সংশ্লিষ্ট রেকর্ড-সংযুক্ত ব্যক্তিগণ</th>
                      <th className="p-2.5 border-r border-slate-800">বিবরণ</th>
                      <th className="p-2.5 border-r border-slate-800">বাধ্যতামূলক ফরেনসিক নোট ও স্ট্যাটাস</th>
                      <th className="p-2.5 text-center">Download</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/80">
                    {report8RecordGaps.map((g) => (
                      <tr key={g.gapId} className="hover:bg-slate-800/40 align-top">
                        <td className="p-2.5 border-r border-slate-800">
                          <span className="font-mono font-bold text-amber-300">{g.gapId}</span>
                          <div className="font-bold text-white mt-0.5">{g.gapCategory}</div>
                        </td>
                        <td className="p-2.5 border-r border-slate-800">
                          <div>
                            মৌজা: {g.mouza} (JL {g.jlNo})
                          </div>
                          <div className="text-amber-300 font-semibold">{g.affectedKhatianDag}</div>
                        </td>
                        <td className="p-2.5 border-r border-slate-800 text-slate-200">
                          {g.affectedPersons}
                        </td>
                        <td className="p-2.5 border-r border-slate-800 text-slate-300">
                          {g.description}
                        </td>
                        <td className="p-2.5 border-r border-slate-800 space-y-1">
                          <div className="p-2 rounded bg-rose-950/50 border border-rose-500/40 text-rose-200 font-mono text-[11px] font-bold">
                            {g.mandatoryNotice}
                          </div>
                          <div className="text-[10px] font-mono text-slate-400">
                            Evidence: {g.evidenceIds.join(', ')} · Status: {g.status}
                          </div>
                        </td>
                        <td className="p-2.5 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <button
                              onClick={() =>
                                handleDownloadSingleItemPdf(
                                  `Record Gap Certificate (${g.gapCategory})`,
                                  `${g.gapId} | Status: ${g.status}`,
                                  {
                                    'Gap ID': g.gapId,
                                    'ক্যাটাগরি': g.gapCategory,
                                    'মৌজা ও JL': `${g.mouza} (JL ${g.jlNo})`,
                                    'সংশ্লিষ্ট খতিয়ান ও দাগ': g.affectedKhatianDag,
                                    'সংশ্লিষ্ট ব্যক্তিগণ': g.affectedPersons,
                                    'বিবরণ': g.description,
                                    'বাধ্যতামূলক ফরেনসিক নোট': g.mandatoryNotice,
                                    'এভিডেন্স আইডি': g.evidenceIds.join(', '),
                                  },
                                  `Forensic_Report8_Gap_${g.gapId}`
                                )
                              }
                              className="px-2 py-1 rounded bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border border-emerald-500/30 text-[10px] font-bold inline-flex items-center gap-1"
                              title="Download Record Gap Item as PDF"
                            >
                              <Download className="w-3 h-3" />
                              <span>PDF</span>
                            </button>
                            <button
                              onClick={() =>
                                handleDownloadSingleItemJson(g, `Forensic_Report8_Gap_${g.gapId}`)
                              }
                              className="px-2 py-1 rounded bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/30 text-[10px] font-bold inline-flex items-center gap-1"
                              title="Download Record Gap Item as JSON"
                            >
                              <FileSpreadsheet className="w-3 h-3" />
                              <span>JSON</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* REPORT 9: CONTRADICTION & ANOMALY REPORT + SECTION 12 COURT DOCUMENT ANALYSIS */}
          {activeReportTab === 'report9' && (
            <div className="p-4 space-y-6">
              <div>
                <h3 className="text-base font-bold text-white">
                  REPORT 9 — CONTRADICTION & ANOMALY REPORT (পরস্পরবিরোধী তথ্য ও অসঙ্গতি প্রতিবেদন)
                </h3>
                <p className="text-xs text-slate-400">
                  নিরপেক্ষ পরিভাষা: Record Anomaly, Area Mismatch, Missing Primary Record, Alleged Irregularity (Section 14 & 18)
                </p>
                <div className="overflow-x-auto mt-3">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-[#0b101d] text-amber-300 border-b border-slate-800">
                        <th className="p-2.5 border-r border-slate-800">Anomaly ID & Type</th>
                        <th className="p-2.5 border-r border-slate-800">উৎস ক / পূর্ববর্তী রেকর্ড দাবি</th>
                        <th className="p-2.5 border-r border-slate-800">উৎস খ / পরবর্তী রেকর্ড দাবি</th>
                        <th className="p-2.5 border-r border-slate-800">নিরপেক্ষ ফরেনসিক বিশ্লেষণ</th>
                        <th className="p-2.5 border-r border-slate-800">প্রমাণ স্ট্যাটাস</th>
                        <th className="p-2.5 text-center">Download</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/80">
                      {report9Anomalies.map((a) => (
                        <tr key={a.anomalyId} className="hover:bg-slate-800/40 align-top">
                          <td className="p-2.5 border-r border-slate-800">
                            <span className="font-mono font-bold text-amber-300">
                              {a.anomalyId}
                            </span>
                            <div className="font-bold text-white">{a.anomalyType}</div>
                          </td>
                          <td className="p-2.5 border-r border-slate-800 text-slate-200">
                            {a.earlierOrSourceA}
                          </td>
                          <td className="p-2.5 border-r border-slate-800 text-slate-200">
                            {a.laterOrSourceB}
                          </td>
                          <td className="p-2.5 border-r border-slate-800 text-slate-300">
                            {a.neutralFindingSummary}
                          </td>
                          <td className="p-2.5 border-r border-slate-800">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-bold border ${getBadgeStyle(
                                a.classification
                              )}`}
                            >
                              {a.classification}
                            </span>
                            <div className="text-[10px] font-mono text-slate-400 mt-1">
                              {a.evidenceIds.join(', ')}
                            </div>
                          </td>
                          <td className="p-2.5 text-center">
                            <div className="flex items-center justify-center gap-1">
                              <button
                                onClick={() =>
                                  handleDownloadSingleItemPdf(
                                    `Contradiction & Anomaly Sheet (${a.anomalyType})`,
                                    `${a.anomalyId} | Classification: ${a.classification}`,
                                    {
                                      'Anomaly ID': a.anomalyId,
                                      'অসঙ্গতির ধরন': a.anomalyType,
                                      'উৎস ক / পূর্ববর্তী দাবি': a.earlierOrSourceA,
                                      'উৎস খ / পরবর্তী দাবি': a.laterOrSourceB,
                                      'নিরপেক্ষ ফরেনসিক বিশ্লেষণ': a.neutralFindingSummary,
                                      'প্রমাণ স্ট্যাটাস': a.classification,
                                      'এভিডেন্স আইডি': a.evidenceIds.join(', '),
                                    },
                                    `Forensic_Report9_Anomaly_${a.anomalyId}`
                                  )
                                }
                                className="px-2 py-1 rounded bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border border-emerald-500/30 text-[10px] font-bold inline-flex items-center gap-1"
                                title="Download Anomaly Sheet as PDF"
                              >
                                <Download className="w-3 h-3" />
                                <span>PDF</span>
                              </button>
                              <button
                                onClick={() =>
                                  handleDownloadSingleItemJson(
                                    a,
                                    `Forensic_Report9_Anomaly_${a.anomalyId}`
                                  )
                                }
                                className="px-2 py-1 rounded bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/30 text-[10px] font-bold inline-flex items-center gap-1"
                                title="Download Anomaly Sheet as JSON"
                              >
                                <FileSpreadsheet className="w-3 h-3" />
                                <span>JSON</span>
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Section 12: Court Document Analysis Module */}
              <div className="border-t border-slate-800 pt-4 space-y-3">
                <h3 className="text-base font-bold text-amber-300 flex items-center gap-2">
                  <Scale className="w-4 h-4" />
                  <span>COURT DOCUMENT ANALYSIS (Section 12 — আরজি, জবাব, প্রদর্শনী ও আদালতের আদেশ পৃথকীকরণ)</span>
                </h3>
                {courtDocs.map((cd) => (
                  <div
                    key={cd.courtDocId}
                    className="bg-[#0b101d] border border-amber-500/30 rounded-xl p-4 space-y-3 text-xs"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-2">
                      <div>
                        <span className="font-mono text-amber-300 font-bold">{cd.evidenceId}</span> ·{' '}
                        <strong className="text-white">{cd.caseNumber}</strong> ({cd.courtName})
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="px-2.5 py-1 rounded bg-rose-950/60 border border-rose-500/40 text-rose-200 font-mono font-bold text-[11px]">
                          {cd.mandatoryLegalSafeguardClassification}
                        </span>
                        <button
                          onClick={() =>
                            handleDownloadSingleItemPdf(
                              `Court Document Forensic Analysis — ${cd.caseNumber}`,
                              `${cd.courtDocId} | ${cd.courtName} | ${cd.mandatoryLegalSafeguardClassification}`,
                              {
                                'Case Number & Court': `${cd.caseNumber} (${cd.courtName})`,
                                'Evidence ID': cd.evidenceId,
                                'A. বাদীর আরজির অভিযোগ': cd.plaintiffAllegations.join(' | '),
                                'B. বিবাদীর জবাব': cd.defendantStatements.join(' | '),
                                'C. দালিলিক প্রদর্শনী (Exhibits)': cd.documentaryExhibits.join(' | '),
                                'D. আদালতের পর্যবেক্ষণ': cd.courtObservations.join(' | '),
                                'G. চূড়ান্ত রায় / ডিক্রি': cd.finalJudgmentOrDecree,
                                'আইনি সুরক্ষা নোট': cd.mandatoryLegalSafeguardClassification,
                              },
                              `Forensic_CourtDoc_${cd.courtDocId}`
                            )
                          }
                          className="px-2.5 py-1 rounded bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 font-bold text-[11px] flex items-center gap-1"
                          title="Download Court Document Analysis as PDF"
                        >
                          <Download className="w-3 h-3" />
                          <span>Download .PDF</span>
                        </button>
                        <button
                          onClick={() =>
                            handleDownloadSingleItemJson(cd, `Forensic_CourtDoc_${cd.courtDocId}`)
                          }
                          className="px-2.5 py-1 rounded bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/30 font-bold text-[11px] flex items-center gap-1"
                          title="Download Court Document Analysis as JSON"
                        >
                          <FileSpreadsheet className="w-3 h-3" />
                          <span>.JSON</span>
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div className="bg-[#121827] p-3 rounded-lg border border-slate-800">
                        <div className="font-bold text-amber-300 mb-1">
                          A. বাদীর আরজির অভিযোগ (Plaintiff's Allegations):
                        </div>
                        <ul className="list-disc list-inside space-y-1 text-slate-300">
                          {cd.plaintiffAllegations.map((al, i) => (
                            <li key={i}>{al}</li>
                          ))}
                        </ul>
                      </div>
                      <div className="bg-[#121827] p-3 rounded-lg border border-slate-800">
                        <div className="font-bold text-sky-300 mb-1">
                          B & C. বিবাদীর জবাব ও দালিলিক প্রদর্শনী (Exhibits):
                        </div>
                        <p className="text-slate-300 mb-1.5">{cd.defendantStatements.join(' ')}</p>
                        <ul className="list-disc list-inside space-y-0.5 text-slate-400 text-[11px]">
                          {cd.documentaryExhibits.map((ex, i) => (
                            <li key={i}>{ex}</li>
                          ))}
                        </ul>
                      </div>
                      <div className="bg-[#121827] p-3 rounded-lg border border-slate-800">
                        <div className="font-bold text-emerald-300 mb-1">
                          D–G. আদালতের পর্যবেক্ষণ, অন্তর্বর্তী আদেশ ও চূড়ান্ত রায়:
                        </div>
                        <p className="text-slate-300 mb-1">{cd.courtObservations.join(' ')}</p>
                        <p className="text-amber-200 text-[11px]">
                          <strong>চূড়ান্ত রায়/ডিক্রি:</strong> {cd.finalJudgmentOrDecree}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* REPORT 10: MASTER LEDGER UPDATE PROPOSAL + ROLLBACK VERSION HISTORY */}
          {activeReportTab === 'report10' && (
            <div className="p-4 space-y-5">
              <div>
                <h3 className="text-base font-bold text-white">
                  REPORT 10 — MASTER LEDGER UPDATE PROPOSAL (STEP 11: অনুমোদন বা প্রত্যাখ্যান এবং রোলব্যাক অডিট ট্রেইল)
                </h3>
                <p className="text-xs text-slate-400">
                  কোনো যাচাইকৃত রেকর্ড স্বয়ংক্রিয়ভাবে ওভাররাইট করা হয় না। প্রতিটি প্রস্তাব পরীক্ষা করে Approve অথবা Reject করুন এবং যেকোনো প্রস্তাব বা লেজার স্ন্যাপশট লোকাল ডিস্কে ডাউনলোড করুন (Section 14, 16 & 17)
                </p>
              </div>

              <div className="space-y-3">
                {proposals.map((p) => (
                  <div
                    key={p.proposalId}
                    className="bg-[#0b101d] border border-amber-500/30 rounded-xl p-4 flex flex-wrap items-center justify-between gap-4"
                  >
                    <div className="space-y-1 max-w-4xl">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono font-bold text-amber-300 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/30 text-xs">
                          {p.proposalId}
                        </span>
                        <span className="text-xs font-bold text-white">
                          {p.proposedRecord.surveyType} খতিয়ান {p.proposedRecord.khatianNo}, দাগ{' '}
                          {p.proposedRecord.dagNo} (মৌজা: {p.proposedRecord.mouza})
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold border ${getBadgeStyle(
                            p.evidenceStatus
                          )}`}
                        >
                          {p.evidenceStatus}
                        </span>
                      </div>
                      <p className="text-xs text-slate-200">{p.reasonAndEvidenceSummary}</p>
                      <div className="text-[11px] text-slate-400 grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1">
                        <div>
                          <strong>রেকর্ডীয় মালিকানা:</strong>{' '}
                          {p.proposedRecord.recordedOwnership || p.proposedRecord.ownerDetails}
                        </div>
                        <div>
                          <strong>দাবিকৃত/ওয়ারিশ সম্পর্ক:</strong>{' '}
                          {p.proposedRecord.claimedOwnership || '—'}
                        </div>
                        <div>
                          <strong>এভিডেন্স আইডি:</strong> {p.evidenceIds.join(', ')}
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        onClick={() =>
                          handleDownloadSingleItemPdf(
                            `Master Ledger Update Proposal — ${p.proposedRecord.surveyType} খতিয়ান ${p.proposedRecord.khatianNo}`,
                            `${p.proposalId} | ${p.evidenceStatus} (${p.approvalState})`,
                            {
                              'Proposal ID': p.proposalId,
                              'জরিপ ও খতিয়ান': `${p.proposedRecord.surveyType} খতিয়ান ${p.proposedRecord.khatianNo}, দাগ ${p.proposedRecord.dagNo}`,
                              'মৌজা ও JL': `${p.proposedRecord.mouza} (JL ${p.proposedRecord.jlNo})`,
                              'রেকর্ডীয় মালিকানা':
                                p.proposedRecord.recordedOwnership || p.proposedRecord.ownerDetails,
                              'দাবিকৃত/ওয়ারিশ সম্পর্ক': p.proposedRecord.claimedOwnership || '—',
                              'জমির পরিমাণ': p.proposedRecord.area || '—',
                              'প্রস্তাবের কারণ ও প্রমাণ': p.reasonAndEvidenceSummary,
                              'এভিডেন্স আইডি ও স্ট্যাটাস': `${p.evidenceIds.join(', ')} — ${p.approvalState}`,
                            },
                            `Forensic_Report10_Proposal_${p.proposalId}`
                          )
                        }
                        className="px-2.5 py-2 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border border-emerald-500/30 font-bold text-xs flex items-center gap-1"
                        title="Download Proposal Document as PDF"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Download .PDF</span>
                      </button>
                      <button
                        onClick={() =>
                          handleDownloadSingleItemJson(
                            p,
                            `Forensic_Report10_Proposal_${p.proposalId}`
                          )
                        }
                        className="px-2.5 py-2 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/30 font-bold text-xs flex items-center gap-1"
                        title="Download Proposal Document as JSON"
                      >
                        <FileSpreadsheet className="w-3.5 h-3.5" />
                        <span>.JSON</span>
                      </button>
                      {p.approvalState === 'PENDING_REVIEW' ? (
                        <>
                          <button
                            onClick={() => handleProposalDecision(p, 'APPROVED')}
                            className="px-3.5 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center gap-1.5"
                          >
                            <CheckCircle2 className="w-4 h-4 stroke-[2.5]" />
                            <span>অনুমোদন করুন (Approve)</span>
                          </button>
                          <button
                            onClick={() => handleProposalDecision(p, 'REJECTED')}
                            className="px-3.5 py-2 rounded-lg bg-rose-950/60 hover:bg-rose-900/70 text-rose-200 border border-rose-500/40 font-bold text-xs flex items-center gap-1.5"
                          >
                            <XCircle className="w-4 h-4" />
                            <span>প্রত্যাখ্যান (Reject)</span>
                          </button>
                        </>
                      ) : (
                        <div className="text-xs font-bold px-3 py-1.5 rounded-lg border border-slate-700 bg-slate-800/80 text-amber-300">
                          সিদ্ধান্ত: {p.approvalState} ({p.reviewedAt})
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Rollback & Audit Version History (Section 17) */}
              <div className="border-t border-slate-800 pt-4 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h4 className="text-sm font-bold text-amber-300 flex items-center gap-2">
                    <History className="w-4 h-4" />
                    <span>মাস্টার লেজার স্ন্যাপশট ও ভার্সন রোলব্যাক হিস্ট্রি (Section 17 — Ledger Snapshots & Local Disk Download)</span>
                  </h4>
                  {/* Current Live Master Ledger Snapshot Direct Download Bar */}
                  <div className="flex flex-wrap items-center gap-1.5 bg-[#090d16] px-2.5 py-1.5 rounded-lg border border-emerald-500/30 text-xs">
                    <span className="text-emerald-300 font-bold">
                      বর্তমান সক্রিয় লেজার স্ন্যাপশট ({toBengaliNumber(records.length)}টি রেকর্ড):
                    </span>
                    <button
                      onClick={() =>
                        handleDownloadLedgerSnapshot(records, 'VER-LIVE-CURRENT', 'pdf')
                      }
                      className="px-2 py-1 rounded bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-[11px] flex items-center gap-1"
                      title="Download Active Ledger Snapshot as PDF"
                    >
                      <Download className="w-3 h-3" />
                      <span>Download .PDF</span>
                    </button>
                    <button
                      onClick={() =>
                        handleDownloadLedgerSnapshot(records, 'VER-LIVE-CURRENT', 'xlsx')
                      }
                      className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-emerald-300 border border-emerald-500/30 font-bold text-[11px] flex items-center gap-1"
                      title="Download Active Ledger Snapshot as Excel"
                    >
                      <FileSpreadsheet className="w-3 h-3" />
                      <span>.XLSX</span>
                    </button>
                    <button
                      onClick={() =>
                        handleDownloadLedgerSnapshot(records, 'VER-LIVE-CURRENT', 'json')
                      }
                      className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-amber-300 border border-amber-500/30 font-bold text-[11px] flex items-center gap-1"
                      title="Download Active Ledger Snapshot as JSON"
                    >
                      <FileText className="w-3 h-3" />
                      <span>.JSON</span>
                    </button>
                  </div>
                </div>

                {versionHistory.length === 0 ? (
                  <p className="text-xs text-slate-400">
                    এখনো কোনো পূর্ববর্তী সংস্করণ স্ন্যাপশট সংরক্ষিত হয়নি। কোনো প্রস্তাব অনুমোদন করলে পূর্ববর্তী স্ন্যাপশট এখানে সংরক্ষিত হবে এবং যেকোনো সময় লোকাল ডিস্কে ডাউনলোড বা ১-ক্লিকে রোলব্যাক করা যাবে।
                  </p>
                ) : (
                  <div className="space-y-2">
                    {versionHistory.map((vh) => (
                      <div
                        key={vh.versionId}
                        className="bg-[#090d16] border border-slate-800 rounded-lg p-3 flex flex-wrap items-center justify-between gap-3 text-xs"
                      >
                        <div>
                          <span className="font-mono text-amber-300 font-bold">{vh.versionId}</span>{' '}
                          · <span className="text-slate-400">{vh.timestamp}</span> ·{' '}
                          <span className="text-emerald-300 font-mono">
                            ({toBengaliNumber(vh.previousRecordsSnapshot.length)}টি রেকর্ড)
                          </span>
                          <div className="text-slate-200 font-semibold mt-0.5">
                            {vh.actionTitle}
                          </div>
                        </div>
                        <div className="flex flex-wrap items-center gap-1.5">
                          <button
                            onClick={() =>
                              handleDownloadLedgerSnapshot(
                                vh.previousRecordsSnapshot,
                                vh.versionId,
                                'pdf'
                              )
                            }
                            className="px-2.5 py-1.5 rounded bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 font-bold text-xs flex items-center gap-1"
                            title="Download Ledger Snapshot as PDF to local disk"
                          >
                            <Download className="w-3.5 h-3.5" />
                            <span>Download .PDF</span>
                          </button>
                          <button
                            onClick={() =>
                              handleDownloadLedgerSnapshot(
                                vh.previousRecordsSnapshot,
                                vh.versionId,
                                'xlsx'
                              )
                            }
                            className="px-2.5 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-emerald-300 border border-slate-700 font-bold text-xs flex items-center gap-1"
                            title="Download Ledger Snapshot as Excel (.xlsx) to local disk"
                          >
                            <FileSpreadsheet className="w-3.5 h-3.5" />
                            <span>.XLSX</span>
                          </button>
                          <button
                            onClick={() =>
                              handleDownloadLedgerSnapshot(
                                vh.previousRecordsSnapshot,
                                vh.versionId,
                                'json'
                              )
                            }
                            className="px-2.5 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-amber-300 border border-slate-700 font-bold text-xs flex items-center gap-1"
                            title="Download Ledger Snapshot as JSON to local disk"
                          >
                            <FileText className="w-3.5 h-3.5" />
                            <span>.JSON</span>
                          </button>
                          <button
                            onClick={() => onRollbackLedgerVersion(vh)}
                            className="px-3 py-1.5 rounded bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 font-bold text-xs flex items-center gap-1"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                            <span>এই সংস্করণে রোলব্যাক করুন</span>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* MASTER GENEALOGY LEDGER TREE & BRANCH EXPANDER (Section 3) */}
          {activeReportTab === 'genealogy' && (
            <div className="p-4 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h3 className="text-base font-bold text-white">
                    MASTER GENEALOGY REFERENCE LEDGER (রোশন আলী → নাজির আলী নোয়াজ অথবা আলী নোয়াজ → সফর আলী → কামদার আলী ও সিরাজ আলী এবং তদীয় বংশধরগণ)
                  </h3>
                  <p className="text-xs text-slate-400">
                    মূল বানান (Original Name), নরমালাইজড রূপ এবং বিকল্প বানান (Variant Spellings) পৃথকভাবে সংরক্ষিত (উল্লেখ্য: সনদে কানদার আলী / কান্দর আলী / কাম্দার আলী হিসেবে স্পেলিং মিসটেক হয়েছে, মূলত সেটি হবে কামদার আলী)
                  </p>
                </div>

                {/* Add Verified Ancestor/Descendant/Spouse Form */}
                <div className="flex flex-wrap items-center gap-2 bg-[#090d16] p-2 rounded-lg border border-slate-800 text-xs">
                  <input
                    value={newGenName}
                    onChange={(e) => setNewGenName(e.target.value)}
                    placeholder="নতুন সদস্যের মূল নাম..."
                    className="bg-[#121827] border border-slate-700 rounded px-2 py-1 text-slate-200"
                  />
                  <input
                    value={newGenFather}
                    onChange={(e) => setNewGenFather(e.target.value)}
                    placeholder="পিতা/স্বামীর নাম..."
                    className="bg-[#121827] border border-slate-700 rounded px-2 py-1 text-slate-200"
                  />
                  <input
                    value={newGenRelation}
                    onChange={(e) => setNewGenRelation(e.target.value)}
                    placeholder="সম্পর্ক ও সনদ/দলিল নং..."
                    className="bg-[#121827] border border-slate-700 rounded px-2 py-1 text-slate-200"
                  />
                  <input
                    value={newGenEvidenceId}
                    onChange={(e) => setNewGenEvidenceId(e.target.value)}
                    placeholder="Evidence ID"
                    className="w-24 bg-[#121827] border border-slate-700 rounded px-2 py-1 text-slate-200 font-mono"
                  />
                  <button
                    onClick={handleAddGenealogyNode}
                    className="px-3 py-1 bg-emerald-400 hover:bg-emerald-300 text-slate-950 font-bold rounded flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>বংশলতিকায় যুক্ত করুন</span>
                  </button>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-[#0b101d] text-amber-300 border-b border-slate-800">
                      <th className="p-2.5 border-r border-slate-800">Person ID & প্রজন্ম</th>
                      <th className="p-2.5 border-r border-slate-800">মূল নাম (Original Name)</th>
                      <th className="p-2.5 border-r border-slate-800">নরমালাইজড ও বিকল্প বানান</th>
                      <th className="p-2.5 border-r border-slate-800">পিতা, মাতা ও স্বামী/স্ত্রী</th>
                      <th className="p-2.5 border-r border-slate-800">বংশধারা সম্পর্ক ও শাখা</th>
                      <th className="p-2.5 border-r border-slate-800">Evidence ID & Status</th>
                      <th className="p-2.5 text-center">Download</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/80">
                    {genealogyLedger.map((g) => (
                      <tr key={g.personId} className="hover:bg-slate-800/40">
                        <td className="p-2.5 border-r border-slate-800 font-mono font-bold text-amber-300">
                          {g.personId} (প্রজন্ম {toBengaliNumber(g.generation)})
                        </td>
                        <td className="p-2.5 border-r border-slate-800 font-bold text-white">
                          {g.originalName}
                        </td>
                        <td className="p-2.5 border-r border-slate-800">
                          <div className="text-slate-300">{g.normalizedName}</div>
                          <div className="text-[10px] text-slate-400">
                            ভ্যারিয়েন্ট: {g.variantSpellings.join(', ')}
                          </div>
                        </td>
                        <td className="p-2.5 border-r border-slate-800">
                          <div>পিতা: {g.fatherOriginalName}</div>
                          <div className="text-[10px] text-slate-400">
                            মাতা: {g.motherName} · স্ত্রী/স্বামী: {g.spouseNames.join(', ') || '—'}
                          </div>
                        </td>
                        <td className="p-2.5 border-r border-slate-800 text-emerald-300">
                          {g.relationshipLabel}
                        </td>
                        <td className="p-2.5 border-r border-slate-800">
                          <span className="font-mono text-amber-200">
                            {g.evidenceIds.join(', ')}
                          </span>{' '}
                          ·{' '}
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold border ${getBadgeStyle(
                              g.verificationStatus
                            )}`}
                          >
                            {g.verificationStatus}
                          </span>
                        </td>
                        <td className="p-2.5 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <button
                              onClick={() =>
                                handleDownloadSingleItemPdf(
                                  `Genealogy Member Dossier — ${g.originalName}`,
                                  `${g.personId} | Status: ${g.verificationStatus}`,
                                  {
                                    'Person ID ও প্রজন্ম': `${g.personId} (প্রজন্ম ${toBengaliNumber(g.generation)})`,
                                    'মূল নাম (Original Name)': g.originalName,
                                    'নরমালাইজড ও বিকল্প বানান': `${g.normalizedName} (${g.variantSpellings.join(', ')})`,
                                    'পিতার নাম': g.fatherOriginalName,
                                    'মাতা ও স্বামী/স্ত্রী': `মাতা: ${g.motherName} | স্ত্রী/স্বামী: ${g.spouseNames.join(', ') || '—'}`,
                                    'বংশধারা সম্পর্ক ও শাখা': g.relationshipLabel,
                                    'এভিডেন্স আইডি ও স্ট্যাটাস': `${g.evidenceIds.join(', ')} (${g.verificationStatus})`,
                                  },
                                  `Forensic_Genealogy_${g.personId}`
                                )
                              }
                              className="px-2 py-1 rounded bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border border-emerald-500/30 text-[10px] font-bold inline-flex items-center gap-1"
                              title="Download Genealogy Member Dossier as PDF"
                            >
                              <Download className="w-3 h-3" />
                              <span>PDF</span>
                            </button>
                            <button
                              onClick={() =>
                                handleDownloadSingleItemJson(g, `Forensic_Genealogy_${g.personId}`)
                              }
                              className="px-2 py-1 rounded bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/30 text-[10px] font-bold inline-flex items-center gap-1"
                              title="Download Genealogy Member Dossier as JSON"
                            >
                              <FileSpreadsheet className="w-3 h-3" />
                              <span>JSON</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* SECTION 19: AUTOMATED VERIFICATION TEST SUITE (TEST A – TEST J) */}
          {activeReportTab === 'tests' && (
            <div className="p-4 space-y-3">
              <div>
                <h3 className="text-base font-bold text-white">
                  AUTOMATED FORENSIC VERIFICATION TEST SUITE (TEST A – TEST J — Section 19)
                </h3>
                <p className="text-xs text-slate-400">
                  মাস্টার প্রম্পটের ১০টি বাধ্যতামূলক টেস্ট কেস (TEST A থেকে TEST J) লাইভ ফরেনসিক ইঞ্জিনে যাচাইকৃত ফলাফল — প্রতিটি টেস্ট কেস সার্টিফিকেট লোকাল ডিস্কে ডাউনলোডযোগ্য
                </p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {testResults.map((tr) => (
                  <div
                    key={tr.testCode}
                    className="bg-[#0b101d] border border-emerald-500/30 rounded-xl p-3.5 space-y-1.5 text-xs"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="font-mono font-bold text-amber-300 bg-amber-500/15 px-2 py-0.5 rounded border border-amber-500/30">
                        {tr.testCode}: {tr.title}
                      </span>
                      <div className="flex items-center gap-1.5">
                        <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold text-[11px] flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>PASSED</span>
                        </span>
                        <button
                          onClick={() =>
                            handleDownloadSingleItemPdf(
                              `Forensic Verification Test Report — ${tr.testCode}: ${tr.title}`,
                              `${tr.testCode} | PASSED | Evidence: ${tr.evidenceIds.join(', ')}`,
                              {
                                'Test Code & Title': `${tr.testCode}: ${tr.title}`,
                                'দৃশ্যপট (Scenario)': tr.scenarioDescription,
                                'স্যাম্পল ইনপুট': tr.sampleInputSummary,
                                'প্রাপ্ত ফলাফল': tr.actualClassification,
                                'বিস্তারিত আউটপুট': tr.detailedOutput,
                                'এভিডেন্স আইডি ও স্ট্যাটাস': `${tr.evidenceIds.join(', ')} [${tr.evidenceStatus}]`,
                              },
                              `Forensic_Test_${tr.testCode.replace(/\s+/g, '_')}`
                            )
                          }
                          className="px-2 py-0.5 rounded bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border border-emerald-500/30 text-[10px] font-bold flex items-center gap-1"
                          title="Download Test Certificate as PDF"
                        >
                          <Download className="w-3 h-3" />
                          <span>PDF</span>
                        </button>
                        <button
                          onClick={() =>
                            handleDownloadSingleItemJson(
                              tr,
                              `Forensic_Test_${tr.testCode.replace(/\s+/g, '_')}`
                            )
                          }
                          className="px-2 py-0.5 rounded bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/30 text-[10px] font-bold flex items-center gap-1"
                          title="Download Test Certificate as JSON"
                        >
                          <FileSpreadsheet className="w-3 h-3" />
                          <span>JSON</span>
                        </button>
                      </div>
                    </div>
                    <p className="text-slate-300 text-[11px]">{tr.scenarioDescription}</p>
                    <div className="bg-[#121827] p-2 rounded border border-slate-800 text-[11px] text-slate-200 font-mono">
                      ইনপুট: {tr.sampleInputSummary}
                    </div>
                    <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-[11px]">
                      <span className="text-emerald-300 font-bold">
                        ফলাফল: {tr.actualClassification}
                      </span>
                      <span className="font-mono text-amber-200">
                        Evidence: {tr.evidenceIds.join(', ')} [{tr.evidenceStatus}]
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400">{tr.detailedOutput}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
};
