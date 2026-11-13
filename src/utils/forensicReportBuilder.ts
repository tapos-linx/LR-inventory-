import { LandRecord } from '../types/landRecord';
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
} from './forensicEngine';
import { toBengaliNumber } from './bengaliNumerals';
import { DAG_651_DISCREPANCY_ITEMS } from '../components/Dag651DiscrepancyDetector';

export type ForensicExportReportId =
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
  | 'detector'
  | 'genealogy'
  | 'tests';

export interface ForensicReportTableData {
  title: string;
  subtitle: string;
  fileName: string;
  headers: { key: string; label: string; width: number }[];
  rows: Record<string, string>[];
}

export const FORENSIC_REPORT_OPTIONS: { id: ForensicExportReportId; label: string }[] = [
  { id: 'report1', label: 'REPORT 1 — উদ্ধৃত দলিল ও তথ্য তালিকা' },
  { id: 'report2', label: 'REPORT 2 — বংশলতিকায় ম্যাচকৃত ব্যক্তি' },
  { id: 'report3', label: 'REPORT 3 — ওয়ারিশ সনদ নিষ্কাশিত ব্যক্তি' },
  { id: 'report4', label: 'REPORT 4 — অমিলকৃত ব্যক্তি (Persons of Interest)' },
  { id: 'report5', label: 'REPORT 5 — ঐতিহাসিক খতিয়ান-দাগ ক্রস-ম্যাপিং' },
  { id: 'report6', label: 'REPORT 6 — নাম পরিবর্তন ও বিলুপ্তি অডিট' },
  { id: 'report7', label: 'REPORT 7 — জমির পরিমাণ ও অংশ সমন্বয়' },
  { id: 'report8', label: 'REPORT 8 — অনুপস্থিত দলিল ও রেকর্ড গ্যাপ' },
  { id: 'report9', label: 'REPORT 9 — বিরোধ ও অসঙ্গতি প্রতিবেদন' },
  { id: 'report10', label: 'REPORT 10 — মাস্টার লেজার আপডেট প্রস্তাব' },
  { id: 'detector', label: 'দাগ ৬৫১ স্বয়ংক্রিয় গরমিল ডিটেক্টর' },
  { id: 'genealogy', label: 'মাস্টার বংশলতিকা (Genealogy Ledger)' },
  { id: 'tests', label: 'বাধ্যতামূলক ফরেনসিক টেস্ট (Test A–J)' },
];

export function buildForensicReportExportData(
  reportId: ForensicExportReportId,
  records: LandRecord[]
): ForensicReportTableData {
  const genealogyLedger = buildMasterGenealogyLedger();
  const extracted = buildExtractedEntriesFromRecords(records, genealogyLedger);
  const allMatches = extracted.map((e) =>
    matchExtractedPersonAgainstGenealogy(e, genealogyLedger)
  );

  switch (reportId) {
    case 'detector':
      return {
        title:
          'DAG 651 DISCREPANCY DETECTOR — INCONSISTENCY ALERT REPORT (দাগ ৬৫১ স্বয়ংক্রিয় অসঙ্গতি ও গরমিল ডিটেক্টর)',
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
        rows: extracted.map((e) => ({
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

    case 'report2': {
      const matched = allMatches.filter(
        (m) => m.categoryBucket === 'MATCHED' || m.categoryBucket === 'REQUIRES_VERIFICATION'
      );
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
        rows: matched.map((m) => ({
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
    }

    case 'report3': {
      const persons = extractInheritanceCertificatePersonsTable(records, genealogyLedger);
      return {
        title: 'REPORT 3 — INHERITANCE CERTIFICATE — EXTRACTED PERSONS (ওয়ারিশ সনদ নিষ্কাশিত ব্যক্তি তালিকা)',
        subtitle:
          'নিরপেক্ষ মর্যাদা: RECORD-LINKED PERSONS | সনদ নং ১–৮ হতে নিষ্কাশিত সনদভুক্ত ব্যক্তি ও ঐতিহাসিক রেকর্ড ক্রস-রেফারেন্স',
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
        rows: persons.map((p) => ({
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
    }

    case 'report4': {
      const unmatched = allMatches.filter((m) => m.categoryBucket === 'UNMATCHED');
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
        rows: unmatched.map((u) => ({
          evidenceId: `${u.evidenceId} (${u.uploadedDocumentName})`,
          originalName: u.originalExtractedName,
          fatherName: u.fatherSpouseComparison,
          geo: `${u.extractedEntry.district} → ${u.extractedEntry.upazila} → ${u.extractedEntry.mouza} (JL ${u.extractedEntry.jlNo})`,
          khDag: u.khatianDagComparison,
          classification: `${u.matchClassification} [${u.evidenceStatus}] (${u.neutralDesignation})`,
          explanation: u.explanation,
        })),
      };
    }

    case 'report5': {
      const mappings = buildDagKhatianCrossMapping(records);
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
        rows: mappings.map((m) => ({
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
    }

    case 'report6': {
      const transitions = buildHistoricalTransitionAudit(records);
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
        rows: transitions.map((t) => ({
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
    }

    case 'report7': {
      const areas = buildLandAreaReconciliationReport(records);
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
        rows: areas.map((r) => ({
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
    }

    case 'report8': {
      const gaps = buildRecordGapRegister();
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
        rows: gaps.map((g) => ({
          gapId: `${g.gapId}: ${g.gapCategory}`,
          khatianDag: `মৌজা: ${g.mouza} (JL ${g.jlNo}) | ${g.affectedKhatianDag}`,
          persons: g.affectedPersons,
          description: g.description,
          notice: `${g.mandatoryNotice} [${g.status}] (${g.evidenceIds.join(', ')})`,
        })),
      };
    }

    case 'report9': {
      const anomalies = buildContradictionAnomalyReport();
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
        rows: anomalies.map((a) => ({
          anomalyId: `${a.anomalyId}: ${a.anomalyType}`,
          sourceA: a.earlierOrSourceA,
          sourceB: a.laterOrSourceB,
          finding: a.neutralFindingSummary,
          status: `${a.classification} (${a.evidenceIds.join(', ')})`,
        })),
      };
    }

    case 'genealogy':
      return {
        title: 'MASTER GENEALOGY LEDGER (প্রমিত বংশলতিকা তালিকা)',
        subtitle:
          'রোশন আলী → নাজির আলী নোয়াজ অথবা আলী নোয়াজ → সফর আলী → কামদার আলী ও সিরাজ আলী এবং তদীয় বংশধরগণ',
        fileName: 'Forensic_Master_Genealogy_Ledger',
        headers: [
          { key: 'personId', label: 'Person ID', width: 110 },
          { key: 'generation', label: 'Generation', width: 110 },
          { key: 'name', label: 'Original & Normalized Name', width: 240 },
          { key: 'father', label: "Father's Name", width: 200 },
          { key: 'branch', label: 'Branch / Relationship', width: 260 },
          { key: 'records', label: 'Associated Khatians & Dags', width: 260 },
          { key: 'status', label: 'Verification & Evidence', width: 220 },
        ],
        rows: genealogyLedger.map((g) => ({
          personId: g.personId,
          generation: `Gen ${toBengaliNumber(g.generation)}`,
          name: `${g.originalName} (${g.normalizedName})`,
          father: g.fatherOriginalName,
          branch: `${g.branchName} · ${g.relationshipLabel}`,
          records: `খতিয়ান: ${g.associatedKhatians.join(', ') || '—'} | দাগ: ${g.associatedDags.join(', ') || '—'}`,
          status: `${g.verificationStatus} (${g.evidenceIds.join(', ')})`,
        })),
      };

    case 'tests': {
      const tests = runMandatoryForensicTests(genealogyLedger);
      return {
        title: 'MANDATORY AUTOMATED FORENSIC TEST SUITE (TEST A – TEST J)',
        subtitle: 'বংশধারা, দাগ ৬৫১ ও ৬৫৪, ভৌগোলিক যাচাই এবং প্রমাণ-সংযুক্ত নির্ভুলতা পরীক্ষা',
        fileName: 'Forensic_Automated_Tests_A_to_J',
        headers: [
          { key: 'code', label: 'Test Code', width: 110 },
          { key: 'title', label: 'Test Name', width: 280 },
          { key: 'classification', label: 'Classification', width: 220 },
          { key: 'status', label: 'Evidence Status', width: 170 },
          { key: 'result', label: 'Pass/Fail', width: 110 },
          { key: 'output', label: 'Detailed Forensic Output', width: 510 },
        ],
        rows: tests.map((t) => ({
          code: t.testCode,
          title: t.title,
          classification: t.actualClassification,
          status: t.evidenceStatus,
          result: t.passed ? 'PASSED' : 'FAILED',
          output: t.detailedOutput,
        })),
      };
    }

    default: {
      const proposals = buildInitialMasterLedgerProposals(records);
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
  }
}
