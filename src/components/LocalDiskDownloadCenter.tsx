import React, { useState } from 'react';
import * as XLSX from 'xlsx';
import {
  Download,
  FileSpreadsheet,
  FileText,
  FileJson,
  HardDriveDownload,
  CheckCircle2,
  Loader2,
  FolderTree,
  Users,
  Fingerprint,
  Layers,
  MapPin,
  BookOpen,
  Scale,
  FolderArchive,
} from 'lucide-react';
import {
  downloadMasterSlulisPackage,
  buildMasterSlulisExcelWorkbook,
  buildCourtReadyPlaintText,
} from '../utils/slulisMasterBundleEngine';
import {
  DynamicColumn,
  IngestedArchiveNode,
  LandRecord,
} from '../types/landRecord';
import {
  PROVIDED_WARISH_CERTIFICATES,
  REFERENCE_INHERITANCE_FILE_PATH,
  convertMatchedListToLandRecords,
  matchLandRecordsWithInheritance,
} from '../utils/inheritanceData';
import {
  exportGenericTableToCSV,
  exportGenericTableToExcel,
  exportToCSV,
  exportToExcel,
  exportToJSON,
  exportWarishCertificatesToExcel,
  flattenArchiveTreeRows,
} from '../utils/exportUtils';
import {
  downloadForensicReportTablePdf,
  downloadMatchedInheritancePdf,
  downloadMouzaLandRecordsPdf,
} from '../utils/pdfDownloadEngine';
import {
  buildContradictionAnomalyReport,
  buildDagKhatianCrossMapping,
  buildExtractedEntriesFromRecords,
  buildHistoricalTransitionAudit,
  buildInitialMasterLedgerProposals,
  buildLandAreaReconciliationReport,
  buildMasterGenealogyLedger,
  buildRecordGapRegister,
  extractInheritanceCertificatePersonsTable,
  matchExtractedPersonAgainstGenealogy,
  runMandatoryForensicTests,
} from '../utils/forensicEngine';
import { formatAreaBengali, parseAcreValue, toBengaliNumber } from '../utils/bengaliNumerals';

interface LocalDiskDownloadCenterProps {
  records: LandRecord[];
  filteredRecords: LandRecord[];
  columns: DynamicColumn[];
  archiveTree: IngestedArchiveNode | null;
}

type ForensicDocKey =
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
  | 'genealogy'
  | 'tests';

export const LocalDiskDownloadCenter: React.FC<LocalDiskDownloadCenterProps> = ({
  records,
  filteredRecords,
  columns,
  archiveTree,
}) => {
  const [busyDocId, setBusyDocId] = useState<string | null>(null);
  const [lastSavedMsg, setLastSavedMsg] = useState<string | null>(null);
  const [selectedForensicDoc, setSelectedForensicDoc] = useState<ForensicDocKey>('report1');
  const [isDownloadingSlulisZip, setIsDownloadingSlulisZip] = useState(false);
  const [slulisZipMsg, setSlulisZipMsg] = useState<string | null>(null);

  const notifySaved = (docLabel: string) => {
    setLastSavedMsg(`"${docLabel}" সফলভাবে আপনার লোকাল ডিস্কে ডাউনলোড ও সেভ হয়েছে!`);
    setTimeout(() => setLastSavedMsg(null), 6000);
  };

  const handleDownloadSlulisMasterZip = async () => {
    if (isDownloadingSlulisZip) return;
    setIsDownloadingSlulisZip(true);
    setSlulisZipMsg('মাস্টার প্যাকেজ জিপ তৈরি হচ্ছে...');
    try {
      await downloadMasterSlulisPackage(records, (step, pct) => {
        setSlulisZipMsg(`${step} (${pct}%)`);
      });
      notifySaved('SLULIS মৃত সফর আলী বংশধারার সকল নথি মাস্টার জিপ প্যাকেজ (.zip)');
    } catch (err) {
      console.error('Failed to download SLULIS bundle:', err);
      setSlulisZipMsg('ডাউনলোডে ত্রুটি দেখা দিয়েছে');
    } finally {
      setIsDownloadingSlulisZip(false);
      setTimeout(() => setSlulisZipMsg(null), 5000);
    }
  };

  const handleDownloadSlulisExcelOnly = () => {
    const uint8 = buildMasterSlulisExcelWorkbook(records);
    const blob = new Blob([uint8.buffer as ArrayBuffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `SLULIS_Sofor_Ali_Full_Investigation_Workbook_${new Date().toISOString().slice(0, 10)}.xlsx`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    notifySaved('SLULIS ১১-শিট পূর্ণাঙ্গ এক্সেল ওয়ার্কবুক (.xlsx)');
  };

  const handleDownloadSlulisPlaintOnly = () => {
    const text = buildCourtReadyPlaintText();
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `SLULIS_Court_Ready_Civil_Plaint_27_Sections_${new Date().toISOString().slice(0, 10)}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    notifySaved('SLULIS কোর্ট-রেডি ২৭ দফা দেওয়ানি আরজি ড্রাফট (.txt)');
  };

  // 1. Master Land Record Ledger Downloads
  const handleSaveMasterLedgerPdf = async () => {
    if (busyDocId) return;
    setBusyDocId('master-pdf');
    try {
      await downloadMouzaLandRecordsPdf(filteredRecords, columns, 'Master_Land_Record_Ledger');
      notifySaved('মাস্টার খতিয়ান ও দাগ লেজার (.pdf)');
    } finally {
      setBusyDocId(null);
    }
  };

  // 2. Mouza Summary Index Downloads
  const buildMouzaSummaryRows = () => {
    const map = new Map<
      string,
      {
        district: string;
        upazila: string;
        mouza: string;
        jlNo: string;
        surveys: Set<string>;
        khatians: Set<string>;
        dags: Set<string>;
        count: number;
        totalAcre: number;
      }
    >();

    for (const r of records) {
      const k = `${r.upazila}__${r.mouza}`;
      if (!map.has(k)) {
        map.set(k, {
          district: r.district,
          upazila: r.upazila,
          mouza: r.mouza,
          jlNo: r.jlNo,
          surveys: new Set([r.surveyType]),
          khatians: new Set([r.khatianNo]),
          dags: new Set([r.dagNo]),
          count: 0,
          totalAcre: 0,
        });
      }
      const entry = map.get(k)!;
      entry.count++;
      entry.surveys.add(r.surveyType);
      entry.khatians.add(r.khatianNo);
      entry.dags.add(r.dagNo);
      entry.totalAcre += parseAcreValue(r.area);
    }

    return Array.from(map.values()).map((m, idx) => ({
      sl: toBengaliNumber(idx + 1),
      district: m.district,
      upazila: m.upazila,
      mouza: m.mouza,
      jlNo: m.jlNo,
      surveys: Array.from(m.surveys).join(', '),
      khatians: toBengaliNumber(m.khatians.size),
      dags: toBengaliNumber(m.dags.size),
      records: toBengaliNumber(m.count),
      area: formatAreaBengali(m.totalAcre),
    }));
  };

  const mouzaSummaryHeaders = [
    { key: 'sl', label: 'ক্রমিক', width: 80 },
    { key: 'district', label: 'জেলা', width: 150 },
    { key: 'upazila', label: 'উপজেলা/থানা', width: 170 },
    { key: 'mouza', label: 'মৌজার নাম', width: 180 },
    { key: 'jlNo', label: 'জে.এল. নং', width: 100 },
    { key: 'surveys', label: 'জরিপসমূহ', width: 150 },
    { key: 'khatians', label: 'মোট খতিয়ান', width: 120 },
    { key: 'dags', label: 'মোট দাগ', width: 120 },
    { key: 'records', label: 'রেকর্ড সংখ্যা', width: 130 },
    { key: 'area', label: 'মৌজার মোট জমির পরিমাণ', width: 220 },
  ];

  const handleSaveMouzaSummaryPdf = async () => {
    if (busyDocId) return;
    setBusyDocId('mouza-index-pdf');
    try {
      const rows = buildMouzaSummaryRows();
      await downloadForensicReportTablePdf({
        reportTitle: 'মৌজাভিত্তিক সারসংক্ষেপ সূচিপত্র (Mouza-wise Master Summary Index)',
        reportSubtitle: `সর্বমোট মৌজা: ${toBengaliNumber(rows.length)} টি | সর্বমোট রেকর্ড: ${toBengaliNumber(records.length)} টি`,
        headers: mouzaSummaryHeaders,
        rows,
        fileNamePrefix: 'LR_Mouza_Master_Summary_Index',
      });
      notifySaved('মৌজাভিত্তিক সারসংক্ষেপ সূচিপত্র (.pdf)');
    } finally {
      setBusyDocId(null);
    }
  };

  // 3. Warish Matched New List Downloads
  const handleSaveWarishMatchedPdf = async () => {
    if (busyDocId) return;
    setBusyDocId('warish-matched-pdf');
    try {
      const matched = matchLandRecordsWithInheritance(
        records,
        PROVIDED_WARISH_CERTIFICATES,
        false
      );
      await downloadMatchedInheritancePdf(matched, 'LR_Warish_Matched_New_List');
      notifySaved('ওয়ারিশ ম্যাচকৃত নতুন খতিয়ান তালিকা (.pdf)');
    } finally {
      setBusyDocId(null);
    }
  };

  const handleSaveWarishMatchedExcelOrCsv = (format: 'xlsx' | 'csv' | 'json') => {
    const matched = matchLandRecordsWithInheritance(
      records,
      PROVIDED_WARISH_CERTIFICATES,
      false
    );
    const enriched = convertMatchedListToLandRecords(matched);
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

    if (format === 'xlsx') {
      exportToExcel(enriched, exportCols, 'LR_Warish_Matched_New_List');
      notifySaved('ওয়ারিশ ম্যাচকৃত নতুন তালিকা (.xlsx)');
    } else if (format === 'csv') {
      exportToCSV(enriched, exportCols, 'LR_Warish_Matched_New_List');
      notifySaved('ওয়ারিশ ম্যাচকৃত নতুন তালিকা (.csv)');
    } else {
      exportToJSON(matched, 'LR_Warish_Matched_New_List');
      notifySaved('ওয়ারিশ ম্যাচকৃত নতুন তালিকা (.json)');
    }
  };

  // 4. 6 Warish Certificates Directory Downloads
  const handleSaveWarishDirectoryPdf = async () => {
    if (busyDocId) return;
    setBusyDocId('warish-dir-pdf');
    try {
      const rows: Record<string, string>[] = [];
      PROVIDED_WARISH_CERTIFICATES.forEach((cert) => {
        cert.heirs.forEach((h) => {
          rows.push({
            certNo: `সনদ #${toBengaliNumber(cert.slNo)} (${cert.certificateNo})`,
            issueDate: cert.issueDate,
            deceased: `${cert.deceasedName} (পিতা: ${cert.fatherName}, মাতা: ${cert.motherName})`,
            village: `${cert.village}, ${cert.union}, ${cert.upazila}`,
            heirSl: h.sl,
            heirName: h.name,
            relation: h.relation,
            dobStatus: `${h.dob} (${h.status})`,
          });
        });
      });

      await downloadForensicReportTablePdf({
        reportTitle: 'প্রদত্ত ৬টি ওয়ারিশ সনদ ও ৪৯ জন ওয়ারিশের মাস্টার ডিরেক্টরি (Warish Certificates Directory)',
        reportSubtitle: 'গ্রাম/মৌজা: গোয়ালী, ওয়ার্ড ০৮, কাইতলা (দক্ষিণ), নবীনগর, ব্রাহ্মণবাড়িয়া',
        headers: [
          { key: 'certNo', label: 'সনদ নং ও ক্রমিক', width: 200 },
          { key: 'issueDate', label: 'ইস্যু তারিখ', width: 120 },
          { key: 'deceased', label: 'মৃত পূর্বপুরুষ (পিতা ও মাতা)', width: 280 },
          { key: 'village', label: 'গ্রাম/মৌজা ও ঠিকানা', width: 220 },
          { key: 'heirSl', label: 'ওয়ারিশ ক্রমিক', width: 100 },
          { key: 'heirName', label: 'ওয়ারিশের নাম', width: 210 },
          { key: 'relation', label: 'সম্পর্ক', width: 140 },
          { key: 'dobStatus', label: 'জন্ম তারিখ ও অবস্থা', width: 190 },
        ],
        rows,
        fileNamePrefix: 'LR_All_6_Warish_Certificates_Directory',
      });
      notifySaved('৬টি ওয়ারিশ সনদ ও ৪৯ জন ওয়ারিশের তালিকা (.pdf)');
    } finally {
      setBusyDocId(null);
    }
  };

  // 5. Archive File Tree Manifest Downloads
  const archiveHeaders = [
    { key: 'slNo', label: 'ক্রমিক', width: 80 },
    { key: 'nodeType', label: 'ধরণ (Folder/File)', width: 140 },
    { key: 'name', label: 'ফোল্ডার / ফাইলের নাম', width: 240 },
    { key: 'relativePath', label: 'সম্পূর্ণ রিলেটিভ পাথ (Relative Path)', width: 340 },
    { key: 'fileSize', label: 'আকার (Size)', width: 110 },
    { key: 'mouzaAndJl', label: 'ম্যাপকৃত মৌজা ও জে.এল.', width: 190 },
    { key: 'surveyKhatianDag', label: 'জরিপ, খতিয়ান ও দাগ নং', width: 210 },
    { key: 'ownerAndArea', label: 'মালিক ও জমির পরিমাণ', width: 290 },
  ];

  const handleSaveArchiveTreePdf = async () => {
    if (!archiveTree || busyDocId) return;
    setBusyDocId('tree-pdf');
    try {
      const rows = flattenArchiveTreeRows(archiveTree, records);
      await downloadForensicReportTablePdf({
        reportTitle: 'ARCHIVE FILE-TREE & RECORD MAPPING MANIFEST (আর্কাইভ ফোল্ডার ও ফাইল ট্রি ম্যানিফেস্ট)',
        reportSubtitle: `সর্বমোট সক্রিয় খতিয়ান রেকর্ড: ${toBengaliNumber(records.length)} টি`,
        headers: archiveHeaders,
        rows,
        fileNamePrefix: 'LR_Archive_File_Tree_Manifest',
      });
      notifySaved('আর্কাইভ ফোল্ডার ও ফাইল ট্রি ম্যানিফেস্ট (.pdf)');
    } finally {
      setBusyDocId(null);
    }
  };

  // 6. Forensic Reports Builder & Downloader
  const buildSelectedForensicPayload = (docKey: ForensicDocKey) => {
    const genealogy = buildMasterGenealogyLedger();
    const extracted = buildExtractedEntriesFromRecords(records, genealogy);
    const matchResults = extracted.map((e) => matchExtractedPersonAgainstGenealogy(e, genealogy));
    const matched = matchResults.filter(
      (m) => m.categoryBucket === 'MATCHED' || m.categoryBucket === 'REQUIRES_VERIFICATION'
    );
    const unmatched = matchResults.filter((m) => m.categoryBucket === 'UNMATCHED');
    const inheritancePersons = extractInheritanceCertificatePersonsTable(records, genealogy);
    const crossMappings = buildDagKhatianCrossMapping(records);
    const transitions = buildHistoricalTransitionAudit(records);
    const areaReconciliations = buildLandAreaReconciliationReport(records);
    const recordGaps = buildRecordGapRegister();
    const anomalies = buildContradictionAnomalyReport();
    const proposals = buildInitialMasterLedgerProposals(records);
    const tests = runMandatoryForensicTests(genealogy);

    switch (docKey) {
      case 'report1':
        return {
          title: 'REPORT 1 — UPLOADED DOCUMENT EXTRACTION',
          subtitle: 'উদ্ধৃত নাম, খতিয়ান, দাগ, জমি ও দলিল রেফারেন্স',
          fileName: 'Forensic_Report_01_Document_Extraction',
          headers: [
            { key: 'evidenceId', label: 'Evidence ID', width: 120 },
            { key: 'sourceDoc', label: 'Source Document', width: 220 },
            { key: 'geo', label: 'Geography', width: 230 },
            { key: 'surveyKhDag', label: 'Survey, Khatian & Dag', width: 180 },
            { key: 'originalName', label: 'Original Name', width: 210 },
            { key: 'fatherName', label: 'Father Name', width: 190 },
            { key: 'areaShare', label: 'Area & Share', width: 180 },
            { key: 'status', label: 'Evidence Status', width: 180 },
          ],
          rows: extracted.map((e) => ({
            evidenceId: e.evidenceId,
            sourceDoc: `${e.sourceDocumentName} (${e.pageLocation})`,
            geo: `${e.district} → ${e.upazila} → ${e.mouza} (JL ${e.jlNo})`,
            surveyKhDag: `${e.surveyType} | খতিয়ান ${e.khatianNo} | দাগ ${e.dagNo}`,
            originalName: e.originalPersonName,
            fatherName: e.fatherOriginalName,
            areaShare: `${e.landAreaRaw} (${toBengaliNumber(e.landAreaShatak)} শতক) | ${e.share}`,
            status: e.evidenceStatus,
          })),
        };
      case 'report2':
        return {
          title: 'REPORT 2 — GENEALOGY MATCHED PERSONS',
          subtitle: 'বংশলতিকায় ম্যাচকৃত ব্যক্তিগণের তালিকা',
          fileName: 'Forensic_Report_02_Genealogy_Matched',
          headers: [
            { key: 'evidenceId', label: 'Evidence ID', width: 130 },
            { key: 'extractedName', label: 'Extracted Name', width: 190 },
            { key: 'genealogyName', label: 'Matched Genealogy', width: 200 },
            { key: 'fatherComp', label: 'Father Comparison', width: 230 },
            { key: 'geoComp', label: 'Geography', width: 220 },
            { key: 'classification', label: 'Match Classification', width: 220 },
            { key: 'evidence', label: 'Supporting Evidence', width: 290 },
          ],
          rows: matched.map((m) => ({
            evidenceId: m.evidenceId,
            extractedName: m.originalExtractedName,
            genealogyName: m.matchedGenealogyName,
            fatherComp: m.fatherSpouseComparison,
            geoComp: m.geographicComparison,
            classification: `${m.matchClassification} [${m.evidenceStatus}]`,
            evidence: m.supportingEvidence.join(' | '),
          })),
        };
      case 'report3':
        return {
          title: 'REPORT 3 — INHERITANCE CERTIFICATE EXTRACTED PERSONS',
          subtitle: 'আপলোডকৃত ৮টি সনদ হতে নিষ্কাশিত ৬৭ জন ব্যক্তি (RECORD-LINKED PERSONS)',
          fileName: 'Forensic_Report_03_Inheritance_Persons',
          headers: [
            { key: 'personId', label: 'Person & Evidence ID', width: 150 },
            { key: 'originalName', label: 'Original Name', width: 180 },
            { key: 'fatherSpouse', label: 'Father / Spouse', width: 200 },
            { key: 'relation', label: 'Relation to Deceased', width: 190 },
            { key: 'certInfo', label: 'Certificate No & Date', width: 200 },
            { key: 'crossRef', label: 'CS / SA / RS / BS Cross-Ref', width: 280 },
            { key: 'status', label: 'Group & Status', width: 220 },
          ],
          rows: inheritancePersons.map((p) => ({
            personId: `${p.personId} [${p.evidenceId}]`,
            originalName: p.originalName,
            fatherSpouse: `${p.fatherName} | ${p.spouseName}`,
            relation: p.relationshipToDeceased,
            certInfo: `${p.certificateNumber} (${p.issueDate})`,
            crossRef: `CS:${p.crossReferences.csRecordRef} | SA:${p.crossReferences.saRecordRef} | RS:${p.crossReferences.rsRecordRef} | BRS:${p.crossReferences.bsBrsRecordRef}`,
            status: `${p.outputGroup} [${p.verificationStatus}]`,
          })),
        };
      case 'report4':
        return {
          title: 'REPORT 4 — UNMATCHED & CANDIDATE PERSONS',
          subtitle: 'অমিলকৃত বা অতিরিক্ত প্রমাণ আবশ্যক ব্যক্তিগণের তালিকা',
          fileName: 'Forensic_Report_04_Unmatched_Persons',
          headers: [
            { key: 'evidenceId', label: 'Evidence ID', width: 140 },
            { key: 'originalName', label: 'Original Name', width: 200 },
            { key: 'fatherComp', label: 'Father Comparison', width: 220 },
            { key: 'geoComp', label: 'Geography', width: 220 },
            { key: 'classification', label: 'Classification', width: 220 },
            { key: 'reasons', label: 'Forensic Reasons', width: 350 },
          ],
          rows: unmatched.map((u) => ({
            evidenceId: u.evidenceId,
            originalName: u.originalExtractedName,
            fatherComp: u.fatherSpouseComparison,
            geoComp: u.geographicComparison,
            classification: `${u.matchClassification} [${u.evidenceStatus}]`,
            reasons: u.conflictingEvidence.join(' | '),
          })),
        };
      case 'report5':
        return {
          title: 'REPORT 5 — DAG & KHATIAN CROSS-MAPPING TABLE',
          subtitle: 'সিএস → এসএ → আরএস → বিএস খতিয়ান ও দাগ ক্রস-ম্যাপিং',
          fileName: 'Forensic_Report_05_Dag_Khatian_Mapping',
          headers: [
            { key: 'mappingId', label: 'Mapping ID & Mouza', width: 180 },
            { key: 'cs', label: 'CS Kh & Dag', width: 180 },
            { key: 'sa', label: 'SA Kh & Dag', width: 180 },
            { key: 'rs', label: 'RS Kh & Dag', width: 180 },
            { key: 'bs', label: 'BS Kh & Dag', width: 180 },
            { key: 'owners', label: 'Owner & Father Progression', width: 260 },
            { key: 'basis', label: 'Conversion & Status', width: 240 },
          ],
          rows: crossMappings.map((c) => ({
            mappingId: `${c.mappingId} (${c.mouza} JL ${c.jlNo})`,
            cs: `খতিয়ান ${c.csKhatian} | দাগ ${c.csDag}`,
            sa: `খতিয়ান ${c.saKhatian} | দাগ ${c.saDag}`,
            rs: `খতিয়ান ${c.rsKhatian} | দাগ ${c.rsDag}`,
            bs: `খতিয়ান ${c.bsBrsKhatian} | দাগ ${c.bsBrsDag}`,
            owners: `${c.recordedOwnerProgression} | পিতা: ${c.fatherNameProgression}`,
            basis: `${c.areaProgression} [${c.conversionType}] (${c.verificationStatus})`,
          })),
        };
      case 'report6':
        return {
          title: 'REPORT 6 — HISTORICAL RECORD TRANSITION & NAME DISAPPEARANCE AUDIT',
          subtitle: 'সিএস → এসএ → আরএস → বিএস নাম বিলুপ্তি ও মালিকানা পরিবর্তন অডিট',
          fileName: 'Forensic_Report_06_Transition_Audit',
          headers: [
            { key: 'stage', label: 'Transition Stage & Mouza', width: 200 },
            { key: 'earlier', label: 'Earlier Record', width: 280 },
            { key: 'later', label: 'Later Record', width: 280 },
            { key: 'change', label: 'Change & Disappearance Audit', width: 380 },
            { key: 'status', label: 'Supporting Evidence & Status', width: 280 },
          ],
          rows: transitions.map((t) => ({
            stage: `${t.transitionStage} (${t.mouza}, JL ${t.jlNo})`,
            earlier: t.earlierRecordSummary,
            later: t.laterRecordSummary,
            change: `${t.identifiedChanges.join(', ')} — ${t.changeDescription}${
              t.primarySourceGapNote ? ` [${t.primarySourceGapNote}]` : ''
            }`,
            status: `${t.supportingEvidence} [${t.status}]`,
          })),
        };
      case 'report7':
        return {
          title: 'REPORT 7 — LAND AREA & SHARE RECONCILIATION REPORT',
          subtitle: 'জমির পরিমাণ ও অংশ রিকনসিলিয়েশন (৩৩ বনাম ৩০ শতক এবং ২৮ শতক পরবর্তী হিসাবসহ)',
          fileName: 'Forensic_Report_07_Area_Reconciliation',
          headers: [
            { key: 'recId', label: 'ID & Parent Dag', width: 200 },
            { key: 'claims', label: 'Claimed Parent Area', width: 210 },
            { key: 'successors', label: 'Successor Records', width: 320 },
            { key: 'totalId', label: 'Identified Total', width: 150 },
            { key: 'gap', label: 'Unexplained Area Gap', width: 280 },
            { key: 'explanation', label: 'Classification & Notes', width: 310 },
          ],
          rows: areaReconciliations.map((a) => ({
            recId: `${a.reconciliationId} (${a.parentSurvey} Kh ${a.parentKhatian} Dag ${a.parentDag})`,
            claims: `প্রাথমিক: ${toBengaliNumber(a.parentAreaShatakPrimaryClaim)} শতক${
              a.parentAreaShatakAlternativeClaim
                ? ` | বিকল্প: ${toBengaliNumber(a.parentAreaShatakAlternativeClaim)} শতক`
                : ''
            }`,
            successors: a.successorEntries
              .map(
                (s) =>
                  `${s.survey} Kh ${s.khatianNo} Dag ${s.dagNo}: ${toBengaliNumber(s.areaShatak)} শতক`
              )
              .join(' + '),
            totalId: `${toBengaliNumber(a.totalIdentifiedSuccessorShatak)} শতক`,
            gap: `${toBengaliNumber(a.unexplainedAreaPrimaryShatak)} শতক${
              a.unexplainedAreaAltShatak !== undefined
                ? ` (বিকল্পে ${toBengaliNumber(a.unexplainedAreaAltShatak)} শতক)`
                : ''
            }`,
            explanation: `${a.classificationLabel} | ${a.notes}`,
          })),
        };
      case 'report8':
        return {
          title: 'REPORT 8 — RECORD GAP & MISSING DOCUMENT REGISTER',
          subtitle: 'রেকর্ড গ্যাপ ও অনুপস্থিত মূল দলিলের তালিকা',
          fileName: 'Forensic_Report_08_Record_Gap_Register',
          headers: [
            { key: 'gapId', label: 'Gap ID & Category', width: 220 },
            { key: 'khDag', label: 'Affected Mouza, Khatian & Dag', width: 230 },
            { key: 'persons', label: 'Affected Persons', width: 230 },
            { key: 'desc', label: 'Forensic Description', width: 380 },
            { key: 'safeguard', label: 'Mandatory Classification & Status', width: 330 },
          ],
          rows: recordGaps.map((g) => ({
            gapId: `${g.gapId}: ${g.gapCategory}`,
            khDag: `${g.mouza} (JL ${g.jlNo}) | ${g.affectedKhatianDag}`,
            persons: g.affectedPersons,
            desc: g.description,
            safeguard: `${g.mandatoryNotice} [${g.status}]`,
          })),
        };
      case 'report9':
        return {
          title: 'REPORT 9 — CONTRADICTION & FORENSIC ANOMALY REPORT',
          subtitle: 'বিরোধপূর্ণ দাবি, অসামঞ্জস্য ও দেওয়ানি মোকদ্দমা বিশ্লেষণ',
          fileName: 'Forensic_Report_09_Anomalies_And_Court',
          headers: [
            { key: 'anomalyId', label: 'Anomaly ID & Type', width: 210 },
            { key: 'sourceA', label: 'Earlier / Source A', width: 320 },
            { key: 'sourceB', label: 'Later / Source B', width: 320 },
            { key: 'finding', label: 'Neutral Forensic Finding', width: 380 },
            { key: 'status', label: 'Classification & Evidence', width: 230 },
          ],
          rows: anomalies.map((an) => ({
            anomalyId: `${an.anomalyId}: ${an.anomalyType}`,
            sourceA: an.earlierOrSourceA,
            sourceB: an.laterOrSourceB,
            finding: an.neutralFindingSummary,
            status: `${an.classification} (${an.evidenceIds.join(', ')})`,
          })),
        };
      case 'report10':
        return {
          title: 'REPORT 10 — MASTER LEDGER UPDATE PROPOSAL REPORT',
          subtitle: 'মাস্টার লেজার আপডেট প্রস্তাবনা তালিকা (অনুমোদন সাপেক্ষ)',
          fileName: 'Forensic_Report_10_Master_Ledger_Proposals',
          headers: [
            { key: 'proposalId', label: 'Proposal ID & Type', width: 210 },
            { key: 'record', label: 'Proposed Mouza, Kh & Dag', width: 240 },
            { key: 'ownerArea', label: 'Proposed Owner & Area', width: 280 },
            { key: 'reason', label: 'Evidence & Reason', width: 380 },
            { key: 'state', label: 'Approval State', width: 170 },
          ],
          rows: proposals.map((p) => ({
            proposalId: `${p.proposalId} (${p.proposalType})`,
            record: `${p.proposedRecord.mouza} | ${p.proposedRecord.surveyType} খতিয়ান ${p.proposedRecord.khatianNo} | দাগ ${p.proposedRecord.dagNo}`,
            ownerArea: `${p.proposedRecord.ownerDetails} (${p.proposedRecord.area})`,
            reason: p.reasonAndEvidenceSummary,
            state: `${p.approvalState} [${p.evidenceStatus}]`,
          })),
        };
      case 'genealogy':
        return {
          title: 'MASTER GENEALOGY LEDGER (মাস্টার বংশলতিকা বৃক্ষ)',
          subtitle: 'রোশন আলী → নাজির আলী নোয়াজ অথবা আলী নোয়াজ → সফর আলী → কামদার আলী ও সিরাজ আলী এবং তদীয় বংশধরগণ',
          fileName: 'Forensic_Master_Genealogy_Ledger',
          headers: [
            { key: 'personId', label: 'Person ID & Gen', width: 160 },
            { key: 'originalName', label: 'Original Name', width: 200 },
            { key: 'normalizedName', label: 'Normalized Name', width: 190 },
            { key: 'variants', label: 'Variant Spellings', width: 220 },
            { key: 'father', label: 'Father Name', width: 200 },
            { key: 'branch', label: 'Lineage Branch', width: 250 },
            { key: 'evidence', label: 'Evidence & Status', width: 230 },
          ],
          rows: genealogy.map((g) => ({
            personId: `${g.personId} (Gen ${toBengaliNumber(g.generation)})`,
            originalName: g.originalName,
            normalizedName: g.normalizedName,
            variants: g.variantSpellings.join(', '),
            father: g.fatherOriginalName,
            branch: g.relationshipLabel,
            evidence: `${g.evidenceIds.join(', ')} [${g.verificationStatus}]`,
          })),
        };
      case 'tests':
        return {
          title: 'AUTOMATED VERIFICATION SUITE (TEST A — TEST J)',
          subtitle: '১০টি বাধ্যতামূলক ফরেনসিক ও বংশলতিকা টেস্ট কেসের ফলাফল',
          fileName: 'Forensic_Verification_Suite_Test_A_to_J',
          headers: [
            { key: 'testCode', label: 'Test Code & Title', width: 210 },
            { key: 'scenario', label: 'Scenario', width: 260 },
            { key: 'input', label: 'Sample Input', width: 260 },
            { key: 'classification', label: 'Classification & Status', width: 240 },
            { key: 'output', label: 'Detailed Forensic Output', width: 350 },
          ],
          rows: tests.map((t) => ({
            testCode: `${t.testCode}: ${t.title}`,
            scenario: t.scenarioDescription,
            input: t.sampleInputSummary,
            classification: `${t.actualClassification} [${t.evidenceStatus}] (${t.passed ? 'PASSED' : 'FAILED'})`,
            output: t.detailedOutput,
          })),
        };
    }
  };

  const handleSaveSelectedForensicDoc = async (format: 'pdf' | 'xlsx' | 'csv' | 'json') => {
    const payload = buildSelectedForensicPayload(selectedForensicDoc);
    if (format === 'pdf') {
      if (busyDocId) return;
      setBusyDocId('forensic-pdf');
      try {
        await downloadForensicReportTablePdf({
          reportTitle: payload.title,
          reportSubtitle: payload.subtitle,
          headers: payload.headers,
          rows: payload.rows,
          fileNamePrefix: payload.fileName,
        });
        notifySaved(`${payload.title} (.pdf)`);
      } finally {
        setBusyDocId(null);
      }
    } else if (format === 'xlsx') {
      exportGenericTableToExcel(payload.headers, payload.rows, payload.fileName, 'Forensic_Report');
      notifySaved(`${payload.title} (.xlsx)`);
    } else if (format === 'csv') {
      exportGenericTableToCSV(payload.headers, payload.rows, payload.fileName);
      notifySaved(`${payload.title} (.csv)`);
    } else {
      exportToJSON(payload, payload.fileName);
      notifySaved(`${payload.title} (.json)`);
    }
  };

  // All-in-One Complete Application Workbook (.xlsx with every document type on its own sheet!)
  const handleSaveCompleteAppMasterWorkbook = () => {
    const wb = XLSX.utils.book_new();
    const visibleCols = columns.filter((c) => c.visible).sort((a, b) => a.order - b.order);

    // Sheet 1: Master Land Ledger
    const ledgerRows = records.map((rec) => {
      const obj: Record<string, string> = {};
      visibleCols.forEach((col) => {
        obj[col.label] = String((rec as any)[col.id] ?? rec.extraAttributes?.[col.id] ?? '');
      });
      return obj;
    });
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(ledgerRows), '01_Master_Land_Ledger');

    // Sheet 2: Mouza Summary Index
    XLSX.utils.book_append_sheet(
      wb,
      XLSX.utils.json_to_sheet(buildMouzaSummaryRows()),
      '02_Mouza_Summary_Index'
    );

    // Sheet 3: Warish Matched New List
    const matched = matchLandRecordsWithInheritance(records, PROVIDED_WARISH_CERTIFICATES, false);
    const matchedRows = matched.map((m, idx) => ({
      ক্রমিক: toBengaliNumber(idx + 1),
      মৌজা: `${m.landRecord.mouza} (JL ${m.landRecord.jlNo})`,
      জরিপ: m.landRecord.surveyType,
      খতিয়ান: m.landRecord.khatianNo,
      দাগ: m.landRecord.dagNo,
      মালিক: m.landRecord.ownerDetails,
      জমি: m.landRecord.area,
      'ম্যাচকৃত সনদ নং': m.matchedCertificate.certificateNo,
      'মৃত পূর্বপুরুষ': m.matchedCertificate.deceasedName,
      'ওয়ারিশ প্রতি গড় অংশ': m.allocatedAreaPerLivingHeir,
    }));
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(matchedRows), '03_Warish_Matched_List');

    // Sheet 4: 6 Warish Certificates Directory
    const warishDirRows: Record<string, string>[] = [];
    PROVIDED_WARISH_CERTIFICATES.forEach((c) => {
      c.heirs.forEach((h) => {
        warishDirRows.push({
          'সনদ নং': c.certificateNo,
          'মৃত পূর্বপুরুষ': c.deceasedName,
          পিতা: c.fatherName,
          'ওয়ারিশ ক্রমিক': h.sl,
          'ওয়ারিশের নাম': h.name,
          সম্পর্ক: h.relation,
          'জন্ম তারিখ': h.dob,
        });
      });
    });
    XLSX.utils.book_append_sheet(
      wb,
      XLSX.utils.json_to_sheet(warishDirRows),
      '04_6_Warish_Certificates'
    );

    // Sheet 5: Archive File Tree Manifest
    if (archiveTree) {
      XLSX.utils.book_append_sheet(
        wb,
        XLSX.utils.json_to_sheet(flattenArchiveTreeRows(archiveTree, records)),
        '05_Archive_File_Tree'
      );
    }

    // Sheet 6: Forensic Area & Transition Audit
    const forensicArea = buildSelectedForensicPayload('report7');
    XLSX.utils.book_append_sheet(
      wb,
      XLSX.utils.json_to_sheet(forensicArea.rows),
      '06_Forensic_Area_Audit'
    );

    XLSX.writeFile(
      wb,
      `LR_All_Generated_Documents_Master_Pack_${new Date().toISOString().slice(0, 10)}.xlsx`
    );
    notifySaved('সকল তৈরিকৃত ডকুমেন্টের সমন্বিত মাস্টার প্যাক (.xlsx)');
  };

  return (
    <section className="bg-gradient-to-r from-[#10182b] via-[#131d34] to-[#0f1728] border border-amber-500/40 rounded-xl p-4 shadow-xl space-y-3.5 font-bengali">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shrink-0">
            <HardDriveDownload className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm sm:text-base font-bold text-white flex items-center gap-2 flex-wrap">
              <span>সকল তৈরিকৃত ডকুমেন্ট লোকাল ডিস্কে সেভ ও ডাউনলোড কেন্দ্র (Local Disk Document Save Hub)</span>
              <span className="text-[11px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-2 py-0.5 rounded">
                ৬ ধরনের ডকুমেন্ট · .PDF · .XLSX · .CSV · .JSON
              </span>
            </h2>
            <p className="text-xs text-slate-300">
              অ্যাপের মাধ্যমে তৈরিকৃত প্রতিটি তালিকা, মৌজাভিত্তিক খতিয়ান রেজিস্টার, ওয়ারিশ ম্যাচকৃত তালিকা, ফাইল ট্রি ম্যানিফেস্ট এবং ফরেনসিক অডিট রিপোর্ট সরাসরি আপনার কম্পিউটার বা ফোনের লোকাল ডিস্কে সেভ করুন।
            </p>
          </div>
        </div>

        <button
          onClick={handleSaveCompleteAppMasterWorkbook}
          className="px-4 py-2 rounded-lg bg-gradient-to-r from-amber-400 via-amber-300 to-yellow-400 hover:from-amber-300 hover:to-yellow-300 text-slate-950 font-bold text-xs shadow-lg flex items-center gap-1.5 transition-all"
          title="অ্যাপে তৈরিকৃত সকল ডকুমেন্ট একটি মাল্টি-শিট Excel ওয়ার্কবুকে লোকাল ডিস্কে সেভ করুন"
        >
          <Download className="w-4 h-4 stroke-[2.5] text-slate-950" />
          <span>১-ক্লিকে সকল ডকুমেন্ট একসাথে ডিস্কে সেভ (.xlsx Master Pack)</span>
        </button>
      </div>

      {lastSavedMsg && (
        <div className="bg-emerald-950/70 border border-emerald-500/40 rounded-lg px-3 py-2 text-xs text-emerald-200 flex items-center gap-2 font-semibold">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{lastSavedMsg}</span>
        </div>
      )}

      {/* 6 Document Category Cards with Direct Local Disk Download Buttons */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {/* Card 1: Master Land Record Ledger */}
        <div className="bg-[#0b101d] border border-slate-800 hover:border-amber-500/40 rounded-xl p-3 flex flex-col justify-between gap-2.5">
          <div>
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-bold text-white flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-amber-400" />
                <span>১. মাস্টার খতিয়ান ও দাগ লেজার</span>
              </span>
              <span className="text-[10px] font-mono bg-amber-500/15 text-amber-300 px-1.5 py-0.5 rounded">
                {toBengaliNumber(filteredRecords.length)} রেকর্ড
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              সকল খতিয়ান, দাগ, মালিক, অংশ, শ্রেণি ও জমির পরিমাণের মূল তালিকা।
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-slate-800/80">
            <button
              onClick={handleSaveMasterLedgerPdf}
              disabled={busyDocId === 'master-pdf'}
              className="px-2.5 py-1 bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold rounded text-[11px] flex items-center gap-1"
            >
              {busyDocId === 'master-pdf' ? (
                <Loader2 className="w-3 h-3 animate-spin" />
              ) : (
                <Download className="w-3 h-3" />
              )}
              <span>.PDF সেভ</span>
            </button>
            <button
              onClick={() => {
                exportToExcel(filteredRecords, columns, 'LR_Master_Land_Ledger');
                notifySaved('মাস্টার খতিয়ান ও দাগ লেজার (.xlsx)');
              }}
              className="px-2 py-1 bg-emerald-950/60 hover:bg-emerald-900/70 border border-emerald-500/40 text-emerald-300 font-semibold rounded text-[11px] flex items-center gap-1"
            >
              <FileSpreadsheet className="w-3 h-3" />
              <span>.XLSX</span>
            </button>
            <button
              onClick={() => {
                exportToCSV(filteredRecords, columns, 'LR_Master_Land_Ledger');
                notifySaved('মাস্টার খতিয়ান ও দাগ লেজার (.csv)');
              }}
              className="px-2 py-1 bg-sky-950/60 hover:bg-sky-900/70 border border-sky-500/40 text-sky-300 font-semibold rounded text-[11px] flex items-center gap-1"
            >
              <FileText className="w-3 h-3" />
              <span>.CSV</span>
            </button>
            <button
              onClick={() => {
                exportToJSON(filteredRecords, 'LR_Master_Land_Ledger');
                notifySaved('মাস্টার খতিয়ান ও দাগ লেজার (.json)');
              }}
              className="px-2 py-1 bg-purple-950/60 hover:bg-purple-900/70 border border-purple-500/40 text-purple-300 font-semibold rounded text-[11px] flex items-center gap-1"
            >
              <FileJson className="w-3 h-3" />
              <span>.JSON</span>
            </button>
          </div>
        </div>

        {/* Card 2: Mouza-Wise Summary Index & Mouza Registers */}
        <div className="bg-[#0b101d] border border-slate-800 hover:border-amber-500/40 rounded-xl p-3 flex flex-col justify-between gap-2.5">
          <div>
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-bold text-white flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-emerald-400" />
                <span>২. মৌজাভিত্তিক সারসংক্ষেপ সূচিপত্র</span>
              </span>
              <span className="text-[10px] font-mono bg-emerald-500/15 text-emerald-300 px-1.5 py-0.5 rounded">
                মৌজা সূচি
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              প্রতিটি মৌজার জে.এল. নং, মোট খতিয়ান, মোট দাগ ও সর্বমোট জমির সূচিপত্র।
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-slate-800/80">
            <button
              onClick={handleSaveMouzaSummaryPdf}
              disabled={busyDocId === 'mouza-index-pdf'}
              className="px-2.5 py-1 bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold rounded text-[11px] flex items-center gap-1"
            >
              {busyDocId === 'mouza-index-pdf' ? (
                <Loader2 className="w-3 h-3 animate-spin" />
              ) : (
                <Download className="w-3 h-3" />
              )}
              <span>সূচিপত্র .PDF</span>
            </button>
            <button
              onClick={() => {
                exportGenericTableToExcel(
                  mouzaSummaryHeaders,
                  buildMouzaSummaryRows(),
                  'LR_Mouza_Summary_Index',
                  'মৌজা সূচিপত্র'
                );
                notifySaved('মৌজাভিত্তিক সারসংক্ষেপ সূচিপত্র (.xlsx)');
              }}
              className="px-2 py-1 bg-emerald-950/60 hover:bg-emerald-900/70 border border-emerald-500/40 text-emerald-300 font-semibold rounded text-[11px] flex items-center gap-1"
            >
              <FileSpreadsheet className="w-3 h-3" />
              <span>.XLSX</span>
            </button>
            <button
              onClick={() => {
                exportGenericTableToCSV(
                  mouzaSummaryHeaders,
                  buildMouzaSummaryRows(),
                  'LR_Mouza_Summary_Index'
                );
                notifySaved('মৌজাভিত্তিক সারসংক্ষেপ সূচিপত্র (.csv)');
              }}
              className="px-2 py-1 bg-sky-950/60 hover:bg-sky-900/70 border border-sky-500/40 text-sky-300 font-semibold rounded text-[11px] flex items-center gap-1"
            >
              <FileText className="w-3 h-3" />
              <span>.CSV</span>
            </button>
            <button
              onClick={() => {
                exportToJSON(buildMouzaSummaryRows(), 'LR_Mouza_Summary_Index');
                notifySaved('মৌজাভিত্তিক সারসংক্ষেপ সূচিপত্র (.json)');
              }}
              className="px-2 py-1 bg-purple-950/60 hover:bg-purple-900/70 border border-purple-500/40 text-purple-300 font-semibold rounded text-[11px] flex items-center gap-1"
            >
              <FileJson className="w-3 h-3" />
              <span>.JSON</span>
            </button>
          </div>
        </div>

        {/* Card 3: Warish-Matched Land Record New List */}
        <div className="bg-[#0b101d] border border-slate-800 hover:border-amber-500/40 rounded-xl p-3 flex flex-col justify-between gap-2.5">
          <div>
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-bold text-white flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-teal-400" />
                <span>৩. ওয়ারিশ ম্যাচকৃত নতুন খতিয়ান তালিকা</span>
              </span>
              <span className="text-[10px] font-mono bg-teal-500/15 text-teal-300 px-1.5 py-0.5 rounded">
                ম্যাচকৃত তালিকা
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              ওয়ারিশ সনদের সাথে খতিয়ান ও দাগের সমন্বয়ে তৈরিকৃত নতুন মাস্টার তালিকা।
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-slate-800/80">
            <button
              onClick={handleSaveWarishMatchedPdf}
              disabled={busyDocId === 'warish-matched-pdf'}
              className="px-2.5 py-1 bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold rounded text-[11px] flex items-center gap-1"
            >
              {busyDocId === 'warish-matched-pdf' ? (
                <Loader2 className="w-3 h-3 animate-spin" />
              ) : (
                <Download className="w-3 h-3" />
              )}
              <span>.PDF সেভ</span>
            </button>
            <button
              onClick={() => handleSaveWarishMatchedExcelOrCsv('xlsx')}
              className="px-2 py-1 bg-emerald-950/60 hover:bg-emerald-900/70 border border-emerald-500/40 text-emerald-300 font-semibold rounded text-[11px] flex items-center gap-1"
            >
              <FileSpreadsheet className="w-3 h-3" />
              <span>.XLSX</span>
            </button>
            <button
              onClick={() => handleSaveWarishMatchedExcelOrCsv('csv')}
              className="px-2 py-1 bg-sky-950/60 hover:bg-sky-900/70 border border-sky-500/40 text-sky-300 font-semibold rounded text-[11px] flex items-center gap-1"
            >
              <FileText className="w-3 h-3" />
              <span>.CSV</span>
            </button>
            <button
              onClick={() => handleSaveWarishMatchedExcelOrCsv('json')}
              className="px-2 py-1 bg-purple-950/60 hover:bg-purple-900/70 border border-purple-500/40 text-purple-300 font-semibold rounded text-[11px] flex items-center gap-1"
            >
              <FileJson className="w-3 h-3" />
              <span>.JSON</span>
            </button>
          </div>
        </div>

        {/* Card 4: 8 Uploaded Warish Certificates & 67 Heirs Directory */}
        <div className="bg-[#0b101d] border border-slate-800 hover:border-amber-500/40 rounded-xl p-3 flex flex-col justify-between gap-2.5">
          <div>
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-bold text-white flex items-center gap-1.5">
                <BookOpen className="w-3.5 h-3.5 text-amber-400" />
                <span>৪. আপলোডকৃত ৮টি সনদ ও ৬৭ জন ওয়ারিশ ডিরেক্টরি</span>
              </span>
              <span className="text-[10px] font-mono bg-amber-500/15 text-amber-300 px-1.5 py-0.5 rounded">
                ৬৭ জন সনদভুক্ত
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              গোয়ালী মৌজার আপলোডকৃত ৮টি সনদের (৭টি ওয়ারিশ/উত্তরাধিকারী + ১টি নাগরিকত্ব সনদ) সকল ৬৭ জন ওয়ারিশের তালিকা।
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-slate-800/80">
            <button
              onClick={handleSaveWarishDirectoryPdf}
              disabled={busyDocId === 'warish-dir-pdf'}
              className="px-2.5 py-1 bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold rounded text-[11px] flex items-center gap-1"
            >
              {busyDocId === 'warish-dir-pdf' ? (
                <Loader2 className="w-3 h-3 animate-spin" />
              ) : (
                <Download className="w-3 h-3" />
              )}
              <span>.PDF সেভ</span>
            </button>
            <button
              onClick={() => {
                exportWarishCertificatesToExcel(
                  PROVIDED_WARISH_CERTIFICATES,
                  'LR_All_8_Uploaded_Warish_Certificates'
                );
                notifySaved('৮টি আপলোডকৃত ওয়ারিশ সনদ ডিরেক্টরি (.xlsx)');
              }}
              className="px-2 py-1 bg-emerald-950/60 hover:bg-emerald-900/70 border border-emerald-500/40 text-emerald-300 font-semibold rounded text-[11px] flex items-center gap-1"
            >
              <FileSpreadsheet className="w-3 h-3" />
              <span>.XLSX</span>
            </button>
            <button
              onClick={() => {
                exportToJSON(PROVIDED_WARISH_CERTIFICATES, 'LR_All_8_Uploaded_Warish_Certificates');
                notifySaved('৮টি আপলোডকৃত ওয়ারিশ সনদ ডিরেক্টরি (.json)');
              }}
              className="px-2 py-1 bg-purple-950/60 hover:bg-purple-900/70 border border-purple-500/40 text-purple-300 font-semibold rounded text-[11px] flex items-center gap-1"
            >
              <FileJson className="w-3 h-3" />
              <span>.JSON</span>
            </button>
          </div>
        </div>

        {/* Card 5: Ingested Archive Folder & File Tree Manifest */}
        <div className="bg-[#0b101d] border border-slate-800 hover:border-amber-500/40 rounded-xl p-3 flex flex-col justify-between gap-2.5">
          <div>
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-bold text-white flex items-center gap-1.5">
                <FolderTree className="w-3.5 h-3.5 text-sky-400" />
                <span>৫. আর্কাইভ ফোল্ডার ও ফাইল ট্রি ম্যানিফেস্ট</span>
              </span>
              <span className="text-[10px] font-mono bg-sky-500/15 text-sky-300 px-1.5 py-0.5 rounded">
                ফাইল ম্যাপিং
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              আপলোডকৃত ফোল্ডার কাঠামো ও প্রতিটি ফাইলের সাথে খতিয়ান-দাগ রেকর্ডের ম্যাপিং তালিকা।
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-slate-800/80">
            <button
              onClick={handleSaveArchiveTreePdf}
              disabled={!archiveTree || busyDocId === 'tree-pdf'}
              className="px-2.5 py-1 bg-amber-400 hover:bg-amber-300 disabled:opacity-40 text-slate-950 font-bold rounded text-[11px] flex items-center gap-1"
            >
              {busyDocId === 'tree-pdf' ? (
                <Loader2 className="w-3 h-3 animate-spin" />
              ) : (
                <Download className="w-3 h-3" />
              )}
              <span>.PDF সেভ</span>
            </button>
            <button
              onClick={() => {
                if (!archiveTree) return;
                exportGenericTableToExcel(
                  archiveHeaders,
                  flattenArchiveTreeRows(archiveTree, records),
                  'LR_Archive_File_Tree_Manifest',
                  'ফাইল ট্রি'
                );
                notifySaved('আর্কাইভ ফাইল ট্রি ম্যানিফেস্ট (.xlsx)');
              }}
              className="px-2 py-1 bg-emerald-950/60 hover:bg-emerald-900/70 border border-emerald-500/40 text-emerald-300 font-semibold rounded text-[11px] flex items-center gap-1"
            >
              <FileSpreadsheet className="w-3 h-3" />
              <span>.XLSX</span>
            </button>
            <button
              onClick={() => {
                if (!archiveTree) return;
                exportGenericTableToCSV(
                  archiveHeaders,
                  flattenArchiveTreeRows(archiveTree, records),
                  'LR_Archive_File_Tree_Manifest'
                );
                notifySaved('আর্কাইভ ফাইল ট্রি ম্যানিফেস্ট (.csv)');
              }}
              className="px-2 py-1 bg-sky-950/60 hover:bg-sky-900/70 border border-sky-500/40 text-sky-300 font-semibold rounded text-[11px] flex items-center gap-1"
            >
              <FileText className="w-3 h-3" />
              <span>.CSV</span>
            </button>
            <button
              onClick={() => {
                if (!archiveTree) return;
                exportToJSON(
                  flattenArchiveTreeRows(archiveTree, records),
                  'LR_Archive_File_Tree_Manifest'
                );
                notifySaved('আর্কাইভ ফাইল ট্রি ম্যানিফেস্ট (.json)');
              }}
              className="px-2 py-1 bg-purple-950/60 hover:bg-purple-900/70 border border-purple-500/40 text-purple-300 font-semibold rounded text-[11px] flex items-center gap-1"
            >
              <FileJson className="w-3 h-3" />
              <span>.JSON</span>
            </button>
          </div>
        </div>

        {/* Card 6: All 12 Historical Forensic & Genealogy Reports Selector */}
        <div className="bg-[#0b101d] border border-purple-500/40 rounded-xl p-3 flex flex-col justify-between gap-2">
          <div>
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-bold text-white flex items-center gap-1.5">
                <Fingerprint className="w-3.5 h-3.5 text-purple-400" />
                <span>৬. ফরেনসিক অডিট ও বংশলতিকা রিপোর্ট (১–১২)</span>
              </span>
              <span className="text-[10px] font-mono bg-purple-500/20 text-purple-300 px-1.5 py-0.5 rounded">
                ১২টি রিপোর্ট
              </span>
            </div>

            <select
              value={selectedForensicDoc}
              onChange={(e) => setSelectedForensicDoc(e.target.value as ForensicDocKey)}
              className="w-full mt-1.5 bg-[#121a2d] border border-slate-700 rounded-lg px-2 py-1 text-[11px] text-amber-300 font-semibold focus:outline-none focus:border-amber-400"
            >
              <option value="report1">REPORT 1: নিষ্কাশিত দলিল ও তথ্য তালিকা</option>
              <option value="report2">REPORT 2: বংশলতিকায় ম্যাচকৃত ব্যক্তি</option>
              <option value="report3">REPORT 3: ওয়ারিশ সনদ নিষ্কাশিত ব্যক্তি</option>
              <option value="report4">REPORT 4: অমিলকৃত ও প্রার্থী ব্যক্তি</option>
              <option value="report5">REPORT 5: খতিয়ান ও দাগ ক্রস-ম্যাপিং</option>
              <option value="report6">REPORT 6: নাম বিলুপ্তি ও রূপান্তর অডিট</option>
              <option value="report7">REPORT 7: জমির পরিমাণ ও অংশ রিকনসিলিয়েশন</option>
              <option value="report8">REPORT 8: রেকর্ড গ্যাপ ও মিসিং ডকুমেন্ট</option>
              <option value="report9">REPORT 9: বিরোধপূর্ণ দাবি ও আদালত বিশ্লেষণ</option>
              <option value="report10">REPORT 10: মাস্টার লেজার আপডেট প্রস্তাবনা</option>
              <option value="genealogy">REPORT 11: মাস্টার বংশলতিকা বৃক্ষ</option>
              <option value="tests">REPORT 12: TEST A–J ভেরিফিকেশন রিপোর্ট</option>
            </select>
          </div>

          <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-slate-800/80">
            <button
              onClick={() => handleSaveSelectedForensicDoc('pdf')}
              disabled={busyDocId === 'forensic-pdf'}
              className="px-2.5 py-1 bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold rounded text-[11px] flex items-center gap-1"
            >
              {busyDocId === 'forensic-pdf' ? (
                <Loader2 className="w-3 h-3 animate-spin" />
              ) : (
                <Download className="w-3 h-3" />
              )}
              <span>.PDF সেভ</span>
            </button>
            <button
              onClick={() => handleSaveSelectedForensicDoc('xlsx')}
              className="px-2 py-1 bg-emerald-950/60 hover:bg-emerald-900/70 border border-emerald-500/40 text-emerald-300 font-semibold rounded text-[11px] flex items-center gap-1"
            >
              <FileSpreadsheet className="w-3 h-3" />
              <span>.XLSX</span>
            </button>
            <button
              onClick={() => handleSaveSelectedForensicDoc('csv')}
              className="px-2 py-1 bg-sky-950/60 hover:bg-sky-900/70 border border-sky-500/40 text-sky-300 font-semibold rounded text-[11px] flex items-center gap-1"
            >
              <FileText className="w-3 h-3" />
              <span>.CSV</span>
            </button>
            <button
              onClick={() => handleSaveSelectedForensicDoc('json')}
              className="px-2 py-1 bg-purple-950/60 hover:bg-purple-900/70 border border-purple-500/40 text-purple-300 font-semibold rounded text-[11px] flex items-center gap-1"
            >
              <FileJson className="w-3 h-3" />
              <span>.JSON</span>
            </button>
          </div>
        </div>

        {/* Card 7: SLULIS Master 1-Click Litigation Bundle (Full-Width Card) */}
        <div className="md:col-span-2 lg:col-span-3 bg-gradient-to-r from-[#121b30] via-[#16233f] to-[#10182c] border-2 border-amber-500/60 rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xl">
          <div className="space-y-1.5 max-w-3xl">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-bold text-amber-400 bg-amber-950/80 border border-amber-500/50 px-2 py-0.5 rounded flex items-center gap-1.5">
                <Scale className="w-3.5 h-3.5 text-amber-400" />
                <span>৭. SLULIS — মৃত সফর আলী বংশধারা: সর্বমৌজা টাইটেল পুনর্গঠন ও মোকদ্দমা ড্রাফট</span>
              </span>
              <span className="text-[11px] bg-emerald-950/80 text-emerald-300 border border-emerald-500/40 px-2 py-0.5 rounded font-mono">
                ১-ক্লিকে সকল নথি মাস্টার ডাউনলোড (.ZIP)
              </span>
            </div>
            <h3 className="text-sm font-bold text-white">
              কোর্ট-রেডি ২৭ দফা দেওয়ানি আরজি, ১৪টি আইনি পরিশিষ্ট, ১১-শিট এক্সেল ও ফরেনসিক অডিট রেজিস্টার
            </h3>
            <p className="text-xs text-slate-300">
              দাগ ৬৫১-৬৫৪ ও সর্বমৌজার CS→SA→RS→BS খতিয়ান চেইন, ১২টি বংশগত গরমিল, ৮ শ্রেণির তৃতীয় পক্ষ অনুপ্রবেশ, ৮০ শতক মিসিং ল্যান্ড অ্যানালাইসিস, মুসলিম ফারায়েজ এবং অডিট ম্যানিফেস্ট CSV সহ মোট ২০+ নথির ফুল প্যাকেজ।
            </p>
            {slulisZipMsg && (
              <div className="bg-emerald-950/90 border border-emerald-500/60 rounded-lg p-2 flex items-center gap-2 text-xs text-emerald-200 font-semibold">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>{slulisZipMsg}</span>
              </div>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              onClick={handleDownloadSlulisMasterZip}
              disabled={isDownloadingSlulisZip}
              className="px-4 py-2.5 rounded-lg bg-gradient-to-r from-amber-400 via-amber-300 to-yellow-400 hover:from-amber-300 hover:to-yellow-300 text-slate-950 font-bold text-xs shadow-xl flex items-center gap-2 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-60"
              title="১-ক্লিকে সকল আরজি, পরিশিষ্ট, এক্সেল, ফরেনসিক ও ম্যানিফেস্ট ফাইল একটি জিপে ডাউনলোড করুন"
            >
              {isDownloadingSlulisZip ? (
                <Loader2 className="w-4 h-4 animate-spin text-slate-950" />
              ) : (
                <FolderArchive className="w-4 h-4 text-slate-950 stroke-[2.5]" />
              )}
              <span>১-ক্লিকে সকল নথি মাস্টার ডাউনলোড (.ZIP)</span>
            </button>

            <button
              onClick={handleDownloadSlulisExcelOnly}
              className="px-3 py-2 bg-emerald-950/70 hover:bg-emerald-900/80 border border-emerald-500/50 text-emerald-300 font-semibold rounded-lg text-xs flex items-center gap-1.5 transition-all"
              title="১১টি শিট সহ সম্পূর্ণ SLULIS এক্সেল ওয়ার্কবুক সেভ করুন"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>১১-শিট এক্সেল (.XLSX)</span>
            </button>

            <button
              onClick={handleDownloadSlulisPlaintOnly}
              className="px-3 py-2 bg-sky-950/70 hover:bg-sky-900/80 border border-sky-500/50 text-sky-300 font-semibold rounded-lg text-xs flex items-center gap-1.5 transition-all"
              title="২৭ দফা সম্বলিত কোর্ট-রেডি দেওয়ানি আরজি ড্রাফট সেভ করুন"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>দেওয়ানি আরজি (.TXT)</span>
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};
