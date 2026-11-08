import JSZip from 'jszip';
import * as XLSX from 'xlsx';
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
} from './slulisEngine';
import { DAG_651_DISCREPANCY_ITEMS } from '../components/Dag651DiscrepancyDetector';
import { toBengaliNumber } from './bengaliNumerals';
import { LandRecord } from '../types/landRecord';

export interface MasterBundleProgressCallback {
  (step: string, percentage: number): void;
}

/**
 * Builds the comprehensive Multi-Sheet Excel Workbook for SLULIS
 */
export function buildMasterSlulisExcelWorkbook(records?: LandRecord[]): Uint8Array {
  const wb = XLSX.utils.book_new();

  // Sheet 1: Project Scope & Legal Disclaimer
  const metaSheet = XLSX.utils.json_to_sheet([
    { 'তদন্ত সূচক': 'System Name', বিবরণ: SLULIS_METADATA.systemName },
    { 'তদন্ত সূচক': 'Jurisdiction', বিবরণ: SLULIS_METADATA.jurisdiction },
    { 'তদন্ত সূচক': 'Investigation Type', বিবরণ: SLULIS_METADATA.investigationType },
    { 'তদন্ত সূচক': 'Primary Subject', বিবরণ: SLULIS_METADATA.primarySubject },
    { 'তদন্ত সূচক': 'Primary Mouza', বিবরণ: SLULIS_METADATA.primaryMouza },
    { 'তদন্ত সূচক': 'Primary Dags', বিবরণ: SLULIS_METADATA.primaryDags },
    { 'তদন্ত সূচক': 'Special Investigation', বিবরণ: SLULIS_METADATA.specialInvestigation },
    { 'তদন্ত সূচক': 'Legal Disclaimer', বিবরণ: SLULIS_METADATA.disclaimer },
  ]);
  XLSX.utils.book_append_sheet(wb, metaSheet, '01_Scope_Metadata');

  // Sheet 2: Survey Chain (Dags 651-654 & All Mouzas)
  const surveyData = MULTI_MOUZA_SURVEY_CHAIN_RECORDS.map((r, i) => ({
    ক্রমিক: i + 1,
    'জরিপ পর্যায়': r.surveyPeriod,
    মৌজা: r.mouza,
    'জে.এল.': r.jlNo,
    উপজেলা: r.upazila,
    জেলা: r.district,
    'খতিয়ান নং': r.khatianNo,
    'দাগ নং': r.dagNo,
    'রেকর্ডীয় মালিক': r.recordedOwner,
    'পিতার নাম': r.fatherName,
    'মোট আয়তন': r.totalArea,
    'আয়তন (শতক)': r.areaDecimal,
    হিস্যা: r.share,
    'হাল দাগ': r.successorDag,
    'প্রামাণ্য দলিল': r.documentaryEvidence,
    'এভিডেন্স আইডি': r.evidenceId,
    স্ট্যাটাস: r.status,
    মন্তব্য: r.notes || '',
  }));
  const surveySheet = XLSX.utils.json_to_sheet(surveyData);
  XLSX.utils.book_append_sheet(wb, surveySheet, '02_Survey_Chain');

  // Sheet 3: Family Discrepancies (12 Issues)
  const discData = FAMILY_DISCREPANCY_REGISTER.map((d, i) => ({
    ক্রমিক: i + 1,
    'Issue ID': d.issueId,
    ব্যক্তি: d.personName,
    'পরস্পরবিরোধী তথ্য': d.conflictingInformation,
    'উৎস সনদ': d.sourceDocuments.join(' | '),
    'ফরেনসিক বিবরণ': d.investigationDetails,
    'প্রয়োজনীয় যাচাই': d.verificationRequired,
    স্ট্যাটাস: d.status,
  }));
  const discSheet = XLSX.utils.json_to_sheet(discData);
  XLSX.utils.book_append_sheet(wb, discSheet, '03_Family_Discrepancies');

  // Sheet 4: Pending Lineage Identities
  const pendingData = PENDING_FAMILY_IDENTITY_DATA.map((p, i) => ({
    ক্রমিক: i + 1,
    ব্যক্তি: p.personName,
    'সনদে পিতার নাম': p.fatherNameAsRecorded,
    'সনদে মাতার নাম': p.motherNameAsRecorded,
    'সনদ নং': p.certificateNo,
    'ইস্যুর তারিখ': p.issueDate,
    'ঘোষিত ওয়ারিশ সংখ্যা': p.declaredHeirsCount,
    'অযাচাইকৃত সম্পর্কের কারণ': p.unverifiedConnectionReason,
    'সম্ভাব্য রক্তের যোগসূত্র': p.potentialLinkToLineage,
    'যাচাইকরণ করণীয়': p.verificationCheckpoints.join(' | '),
    স্ট্যাটাস: p.currentStatus,
  }));
  const pendingSheet = XLSX.utils.json_to_sheet(pendingData);
  XLSX.utils.book_append_sheet(wb, pendingSheet, '04_Pending_Lineage');

  // Sheet 5: Faraid Multi-Generation Inheritance Calculations
  const faraidRows: any[] = [];
  FARAID_INHERITANCE_EVENTS.forEach((ev) => {
    ev.heirs.forEach((h, hIdx) => {
      faraidRows.push({
        'Event ID': ev.eventId,
        'মৃত পূর্বপুরুষ': ev.deceasedPerson,
        'মৃত্যুর সন': ev.verifiedOrAllegedDate,
        'মূল এস্টেট (শতক)': ev.totalEstateBaseAreaDecimal,
        'মৌলিক হর ও সূত্র': ev.denominatorFormula,
        'ওয়ারিশের নাম': h.heirName,
        সম্পর্ক: h.relationship,
        'আইনগত হিস্যা (ভগ্নাংশ)': h.legalShareFraction,
        'শতকরা হার': `${h.percentageDecimal}%`,
        'প্রাপ্ত জমির পরিমাণ (শতক)': h.landEntitlementDecimalApprox,
        'মুসলিম পারিবারিক আইন ১৯৬১ ধারা ৪': h.mfloSection4Applicable ? 'হ্যাঁ' : 'না',
        'হিস্যা ব্যাখ্যা': h.fractionExplanation,
      });
    });
  });
  const faraidSheet = XLSX.utils.json_to_sheet(faraidRows);
  XLSX.utils.book_append_sheet(wb, faraidSheet, '05_Faraid_Inheritance');

  // Sheet 6: Third-Party Intrusions (8-Class Matrix)
  const intrusionData = THIRD_PARTY_INTRUSION_MATRIX.map((item, i) => ({
    ক্রমিক: i + 1,
    'Intrusion ID': item.intrusionId,
    মৌজা: item.mouza,
    'জে.এল.': item.jlNo,
    জরিপ: item.surveyPeriod,
    'খতিয়ান নং': item.khatianNo,
    'দাগ নং': item.dagNo,
    'রেকর্ডীয় আয়তন': item.recordedArea,
    'রেকর্ডীয় আয়তন (শতক)': item.recordedAreaDecimal,
    'পূর্ববর্তী প্রকৃত মালিক': item.previousOwner,
    'তৃতীয় পক্ষ অনধিকার প্রবেশকারী': item.thirdPartyName,
    'তৃতীয় পক্ষের পিতার নাম': item.thirdPartyFatherName,
    'প্রথম আবির্ভাবকাল': item.firstAppearance,
    'দাবিকৃত স্বত্বের ভিত্তি': item.claimedTitleBasis,
    'রেজিঃ দলিল নম্বর': item.supportingDeedRef,
    'নামজারি কেস নম্বর': item.mutationRef,
    'দখলগত বাস্তবতা': item.possessionClaim,
    'আইনগত ত্রুটি ও অসঙ্গতি': item.documentaryContradictionNote,
    'ফরেনসিক ক্লাসিফিকেশন': item.evidenceClassification,
  }));
  const intrusionSheet = XLSX.utils.json_to_sheet(intrusionData);
  XLSX.utils.book_append_sheet(wb, intrusionSheet, '06_Third_Party_Intrusions');

  // Sheet 7: Dag 651 Missing 80 Decimal Forensic Reconciliation
  const missingData = MISSING_LAND_DAG_651_REPORT.reconciliationTable.map((r, i) => ({
    ক্রমিক: i + 1,
    জরিপ: r.survey,
    'খতিয়ান নং': r.khatianNo,
    'দাগ নং': r.dagNo,
    'রেকর্ডীয় আয়তন (শতক)': r.recordedAreaDecimal,
    'বৈধ হস্তান্তর (শতক)': r.documentedTransferDecimal,
    'ব্যাখ্যাত পার্থক্য (শতক)': r.explainedDifferenceDecimal,
    'অমীমাংসিত গরমিল (শতক)': r.unexplainedDifferenceDecimal,
    'এভিডেন্স আইডি': r.evidenceId,
    মন্তব্য: r.notes,
  }));
  const missingSheet = XLSX.utils.json_to_sheet(missingData);
  XLSX.utils.book_append_sheet(wb, missingSheet, '07_Dag_651_Reconciliation');

  // Sheet 8: Dag 651 Discrepancy Detector Alerts
  const detectorData = DAG_651_DISCREPANCY_ITEMS.map((d, i) => ({
    ক্রমিক: i + 1,
    'গরমিল আইডি': d.id,
    'গরমিলের ধরণ': d.anomalyTypeBengali,
    'জরিপ পর্যায়': d.surveyStage,
    'পূর্ববর্তী রেকর্ড': `${d.earlierRecord.survey} খতিয়ান ${d.earlierRecord.khatianNo}, দাগ ${d.earlierRecord.dagNo} (${d.earlierRecord.owner}) = ${d.earlierRecord.areaText}`,
    'পরবর্তী রেকর্ড': `${d.laterRecord.survey} খতিয়ান ${d.laterRecord.khatianNo}, দাগ ${d.laterRecord.dagNo} (${d.laterRecord.owner}) = ${d.laterRecord.areaText}`,
    'আয়তন পার্থক্য': d.areaDiscrepancyText,
    'সতর্কতা স্তর': d.severity,
    'মূল কারণ ও বিশ্লেষণ': d.rootCauseDescription,
    'দলিলগত স্থিতি': d.supportingDocStatus,
    'লংঘিত আইন': d.statutoryViolation,
    'প্রস্তাবিত দেওয়ানী প্রতিকার': d.recommendedLegalAction,
    'এভিডেন্স আইডি': d.forensicEvidenceId,
  }));
  const detectorSheet = XLSX.utils.json_to_sheet(detectorData);
  XLSX.utils.book_append_sheet(wb, detectorSheet, '08_Discrepancy_Alerts');

  // Sheet 9: Devil's Advocate Legal Defences (20 Opposing Points)
  const defenceData = DEVILS_ADVOCATE_DEFENCES.map((def, i) => ({
    ক্রমিক: i + 1,
    'Defence ID': def.id,
    'বিবাদীপক্ষের আইনি দাবি': def.defenceTopic,
    'প্রযোজ্য আইন ও ধারা': def.relevantLawAndSection,
    'বিবাদীর সম্ভাব্য যুক্তি': def.opposingArgument,
    'বাদীর প্রতিহতকারী যুক্তি (Rebuttal)': def.claimantCounterargument,
    'প্রয়োজনীয় সাক্ষ্য-প্রমাণ': def.requiredEvidenceToRebut.join(' | '),
    'ঝুঁকি স্তর': def.riskLevel,
    'এখতিয়ারবান আইনি ফোরাম': def.statutoryForumNote,
  }));
  const defenceSheet = XLSX.utils.json_to_sheet(defenceData);
  XLSX.utils.book_append_sheet(wb, defenceSheet, '09_Devils_Advocate_Defences');

  // Sheet 10: Court Plaint Schedules (Schedules A to D)
  const scheduleData = COURT_READY_PLAINT_DATA.schedules.map((s, i) => ({
    ক্রমিক: i + 1,
    তপশিল: s.scheduleName,
    মৌজা: s.mouza,
    'জে.এল.': s.jlNo,
    উপজেলা: s.upazila,
    জেলা: s.district,
    'সিএস খতিয়ান': s.csKhatian,
    'এসএ খতিয়ান': s.saKhatian,
    'আরএস খতিয়ান': s.rsKhatian,
    'বিআরএস খতিয়ান': s.brsKhatian,
    'দাগ নং': s.dagNo,
    'মোট আয়তন': s.totalArea,
    'দাবিকৃত আয়তন': s.claimedArea,
    'চৌহদ্দি (উত্তর)': s.boundaries.north,
    'চৌহদ্দি (দক্ষিণ)': s.boundaries.south,
    'চৌহদ্দি (পূর্ব)': s.boundaries.east,
    'চৌহদ্দি (পশ্চিম)': s.boundaries.west,
    'জমির প্রকৃতি': s.landNature,
    'বর্তমান দখলীয় অবস্থা': s.currentPossessionStatus,
    'সংশ্লিষ্ট এভিডেন্স': s.relatedEvidenceIds.join(' | '),
  }));
  const scheduleSheet = XLSX.utils.json_to_sheet(scheduleData);
  XLSX.utils.book_append_sheet(wb, scheduleSheet, '10_Plaint_Schedules');

  // Sheet 11: Litigation Appendices Index
  const appData = LITIGATION_APPENDICES.map((a) => ({
    'পরিশিষ্ট নং': `পরিশিষ্ট ${toBengaliNumber(a.appendixNumber)} (${a.appendixId})`,
    শিরোনাম: a.title,
    'বাংলা শিরোনাম': a.bengaliTitle,
    'আইনি উদ্দেশ্য': a.purpose,
    'সংবিধিবদ্ধ আইনগত ধারা': a.statutoryReference,
    সারসংক্ষেপ: a.summary,
  }));
  const appSheet = XLSX.utils.json_to_sheet(appData);
  XLSX.utils.book_append_sheet(wb, appSheet, '11_Appendices_Index');

  // Output as Uint8Array for direct JSZip inclusion
  const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  return new Uint8Array(wbout);
}

/**
 * Builds the Complete Court-Ready Civil Plaint Text File
 */
export function buildCourtReadyPlaintText(): string {
  const p = COURT_READY_PLAINT_DATA;
  let text = `================================================================================
আদালতে দাখিলযোগ্য দেওয়ানী স্বত্ব ঘোষণা ও রেকর্ড সংশোধনের আরজি
================================================================================
আদালতের নাম: ${p.courtName}
মোকদ্দমা নম্বর: দেওয়ানী মোকদ্দমা নং- ___________ / ২০২৬ ইং
মোকদ্দমার ধরণ: ${p.natureOfSuit}

--------------------------------------------------------------------------------
বাদীগণ:
--------------------------------------------------------------------------------
${p.plaintiffDetails.join('\n')}
                                                                  ... বাদীপক্ষ

                            -বনাম-

বিবাদীগণ:
--------------------------------------------------------------------------------
${p.defendantDetails.join('\n')}
                                                                  ... বিবাদীপক্ষ

মোকদ্দমার বিষয়বস্তু:
${p.suitTitle}

================================================================================
আরজির দফাওয়ারী পূর্ণাঙ্গ বিবরণ (অনুচ্ছেদ ১ হতে ২৭):
================================================================================
`;

  p.sections.forEach((sec) => {
    text += `\nঅনুচ্ছেদ ${toBengaliNumber(sec.sectionNumber)}. ${sec.title}:\n`;
    text += `${sec.content}\n`;
  });

  text += `\n================================================================================
মোকদ্দমার আর্থিক মূল্যায়ন ও কোর্ট ফি (Suit Valuation & Court Fees):
================================================================================
মোকদ্দমার মূল্যমান: ${toBengaliNumber(p.suitValuationAndCourtFee.suitValuationBdt)}/- (পঁচিশ লক্ষ) টাকা।
কোর্ট ফি ধরন: ${p.suitValuationAndCourtFee.courtFeeType}
দাখিলকৃত কোর্ট ফি: ${toBengaliNumber(p.suitValuationAndCourtFee.courtFeeBdt)}/- টাকা চালানের মাধ্যমে দাখিল করা হলো।
আইনগত বিধান: ${p.suitValuationAndCourtFee.statutoryProvision}

================================================================================
প্রার্থীত প্রতিকারসমূহ (Reliefs Sought):
================================================================================
`;

  p.reliefsSought.forEach((r) => {
    text += `${r}\n`;
  });

  text += `\n================================================================================
নালিশি ভূমির তপশিল বিবরণ (Schedules A to D):
================================================================================
`;

  p.schedules.forEach((sch) => {
    text += `\n--------------------------------------------------------------------------------
${sch.scheduleName}
--------------------------------------------------------------------------------
মৌজা: ${sch.mouza} (জে.এল. নং- ${sch.jlNo}), উপজেলা: ${sch.upazila}, জেলা: ${sch.district}
সিএস খতিয়ান: ${sch.csKhatian} | এসএ খতিয়ান: ${sch.saKhatian} | আরএস খতিয়ান: ${sch.rsKhatian} | বিআরএস খতিয়ান: ${sch.brsKhatian}
দাগ নম্বর: ${sch.dagNo}
মোট আয়তন: ${sch.totalArea} | নালিশি দাবিকৃত অংশ: ${sch.claimedArea}
জমির প্রকৃতি: ${sch.landNature} | বর্তমান বাস্তব দখল: ${sch.currentPossessionStatus}
চৌহদ্দি বিবরণ:
  - উত্তর: ${sch.boundaries.north}
  - দক্ষিণ: ${sch.boundaries.south}
  - পূর্ব: ${sch.boundaries.east}
  - পশ্চিম: ${sch.boundaries.west}
সংশ্লিষ্ট প্রমাণ আইডি: ${sch.relatedEvidenceIds.join(', ')}
`;
  });

  text += `\n================================================================================
সত্যপাঠ ও সত্যতা ঘোষণা (Verification):
================================================================================
${p.verificationText}

স্বাক্ষর:
১. ___________________________ (মোঃ জাকির হোসেন)
২. ___________________________ (রফিকুল ইসলাম)
৩. ___________________________ (মোঃ ফোরকান মিয়া)

তারিখ: ${new Date().toLocaleDateString('bn-BD')} ইং

অ্যাডভোকেট স্বাক্ষর ও ওকালতনামা নম্বর: _______________________________
বিজ্ঞ আইনজীবী, জেলা জজ আদালত, ব্রাহ্মণবাড়িয়া।

================================================================================
বাদীপক্ষের নির্ভরকৃত প্রাথমিক দলিলপত্রের তালিকা (List of Documents Relied Upon):
================================================================================
`;

  p.listOfDocumentsReliedUpon.forEach((doc) => {
    text += `${toBengaliNumber(doc.sl)}. ${doc.documentTitle} [এভিডেন্স: ${doc.evidenceId}] (${doc.certifiedCopyStatus})\n`;
  });

  return text;
}

/**
 * Builds individual text file for each Litigation Appendix
 */
export function buildAppendixText(a: any): string {
  return `================================================================================
পরিশিষ্ট ${toBengaliNumber(a.appendixNumber)}: ${a.bengaliTitle}
Appendix ${a.appendixNumber}: ${a.title} [${a.appendixId}]
================================================================================
আইনি উদ্দেশ্য (Purpose):
${a.purpose}

সংবিধিবদ্ধ রেফারেন্স (Statutory Reference):
${a.statutoryReference}

সারসংক্ষেপ (Summary):
${a.summary}

--------------------------------------------------------------------------------
বিস্তারিত দফা ও সংবিধিবদ্ধ খসড়া পাঠ:
--------------------------------------------------------------------------------
${a.contentLines.join('\n\n')}

================================================================================
নোট: বিজ্ঞ অ্যাডভোকেট কর্তৃক আদালতে দাখিলের পূর্বে সার্টিফাইড কপি ও ওকালতনামা সংযুক্ত করতে হবে।
================================================================================
`;
}

/**
 * Builds the Master Audit Manifest CSV
 */
export function buildAuditManifestCsv(): string {
  const rows = [
    ['Filename', 'Category', 'Subject', 'Language', 'Format', 'Legal Statutory Nexus'],
    [
      '01_COURT_PLAINT/Court_Ready_Civil_Plaint_27_Sections.txt',
      'Civil Plaint',
      'সফর আলী বংশধারা সর্বমৌজা আরজি (২৭ অনুচ্ছেদ)',
      'Bengali',
      'Plain Text UTF-8',
      'Specific Relief Act 1877 s.42, SAT Act 1950, CPC Order 7',
    ],
    [
      '01_COURT_PLAINT/Plaint_Schedules_A_B_C_D.txt',
      'Plaint Schedules',
      'তপশিল ক, খ, গ এবং ঘ (দাগ ৬৫১, ৬৫৪, ৬৫২, ৬৫৩)',
      'Bengali',
      'Plain Text UTF-8',
      'CPC Order 7 Rule 3',
    ],
    [
      '02_EXCEL_WORKBOOK/SLULIS_Full_Investigation_Workbook.xlsx',
      'Master Workbook',
      '১১টি পূর্ণাঙ্গ শিট সংবলিত মাস্টার এক্সেল ডেটাবেস',
      'Bengali & English',
      'Microsoft Excel (.xlsx)',
      'Complete Multi-Survey Matrix',
    ],
    [
      '03_LITIGATION_APPENDICES/Appendix_01_to_14_All.txt',
      'Litigation Appendices',
      '১৪টি আদালতে দাখিলযোগ্য দরখাস্ত ও পরিশিষ্ট',
      'Bengali & English',
      'Plain Text UTF-8',
      'CPC Order 39, Order 26, s.80 Notice',
    ],
    [
      '04_FORENSIC_INVESTIGATION_REPORTS/Dag_651_80_Decimal_Missing_Land.txt',
      'Forensic Report',
      'দাগ ৬৫১: ৮০ শতক নিখোঁজ জমি রিকনসিলিয়েশন রিপোর্ট',
      'Bengali',
      'Plain Text UTF-8',
      'Forensic Mathematical Proof & Dag Tracing',
    ],
    [
      '04_FORENSIC_INVESTIGATION_REPORTS/Dag_651_Discrepancy_Detector_Alert_Register.txt',
      'Alert Register',
      'দাগ ৬৫১ স্বয়ংক্রিয় গরমিল ও অসঙ্গতি সতর্কতা তালিকা',
      'Bengali',
      'Plain Text UTF-8',
      'Automated Scan Output & Statutory Violations',
    ],
    [
      '04_FORENSIC_INVESTIGATION_REPORTS/Family_Identity_And_12_Discrepancies.txt',
      'Identity Register',
      '১২টি বংশলতিকা গরমিল ও রূপভেদ রেজিস্টার',
      'Bengali',
      'Plain Text UTF-8',
      'Evidence Act 1872 Identity Safeguards',
    ],
    [
      '04_FORENSIC_INVESTIGATION_REPORTS/Faraid_Inheritance_Calculations_MFLO_1961.txt',
      'Faraid Calculations',
      '৫টি বহুপ্রজন্ম ফারায়েজ ও অংশ বণ্টন',
      'Bengali',
      'Plain Text UTF-8',
      'Muslim Family Laws Ordinance 1961 Section 4',
    ],
    [
      '05_STRUCTURED_DATA_JSON/SLULIS_Full_Dossier_Master.json',
      'Master JSON',
      'সম্পূর্ণ সিস্টেমের মেশিন-রিডেবল ডেটাসেট',
      'JSON UTF-8',
      '.json',
      'Automated Ingestion & Archival',
    ],
    [
      '00_INSTRUCTIONS_AND_MANIFEST/README_LEGAL_PROCEDURE_AND_FILING_GUIDE.txt',
      'Filing Guide',
      'আইনজীবীর মামলা দাখিল নির্দেশিকা ও কোর্ট ফি হিসাব',
      'Bengali & English',
      'Plain Text UTF-8',
      'Court Fees Act 1870 & Limitation Act 1908',
    ],
  ];

  return rows.map((r) => r.map((c) => `"${c.replace(/"/g, '""')}"`).join(',')).join('\n');
}

/**
 * Builds the README Legal Filing Guide
 */
export function buildReadmeLegalFilingGuide(): string {
  return `================================================================================
SLULIS: মৃত সফর আলী বংশধারা সর্বমৌজা টাইটেল পুনর্গঠন ও মোকদ্দমা মাস্টার প্যাকেজ
================================================================================
প্রকল্প: গোয়ালী মৌজা (জে.এল. নং ৮৪) ও অন্যান্য মৌজায় সফর আলী বংশধারা জমি তদন্ত
আদালত: বিজ্ঞ সিনিয়র সহকারী জজ / যুগ্ম জেলা জজ আদালত, সদর / নবীনগর, ব্রাহ্মণবাড়িয়া
প্রস্তুত তারিখ: ${new Date().toLocaleDateString('bn-BD')} ইং

--------------------------------------------------------------------------------
১. প্যাকেজ ওভারভিউ ও ফোল্ডার বিন্যাস (Package Contents):
--------------------------------------------------------------------------------
এই মাস্টার আর্কাইভে এই অ্যাপ্লিকেশন কর্তৃক প্রস্তুতকৃত সকল লিটিগেশন ও ফরেনসিক নথি অন্তর্ভুক্ত রয়েছে:

├── 00_INSTRUCTIONS_AND_MANIFEST/
│   ├── README_LEGAL_PROCEDURE_AND_FILING_GUIDE.txt  (অত্র নির্দেশিকা)
│   └── AUDIT_MANIFEST.csv                         (সকল ফাইলের ডিজিটাল সূচি)
├── 01_COURT_PLAINT/
│   ├── Court_Ready_Civil_Plaint_27_Sections.txt   (বিজ্ঞ আদালতে দাখিলযোগ্য ২৭ অনুচ্ছেদের মূল দেওয়ানী আরজি)
│   └── Plaint_Schedules_A_B_C_D.txt               (তপশিল ক, খ, গ এবং ঘ-এর সুনির্দিষ্ট চৌহদ্দি ও খতিয়ান বিবরণ)
├── 02_EXCEL_WORKBOOK/
│   └── SLULIS_Full_Investigation_Workbook.xlsx     (১১টি ডেটাশিট সংবলিত পূর্ণাঙ্গ মাস্টার এক্সেল ফাইল)
├── 03_LITIGATION_APPENDICES/
│   ├── Appendix_01_Advocate_Case_Brief.txt         (আইনজীবীর কেস ব্রিফ ও যুক্তি রূপরেখা)
│   ├── Appendix_02_Documentary_Evidence_Index.txt  (প্রদর্শনী ও সাক্ষ্য সূচি)
│   ├── Appendix_03_Genealogy_Pedigree_Table.txt    (সফর আলী ও সিরাজ আলীর বংশলতিকা ছক)
│   ├── Appendix_04_Chain_Of_Title_Chronology.txt   (সিএস → এসএ → আরএস → বিআরএস সময়রেখা)
│   ├── Appendix_05_Dag_Traceability_Mapping.txt    (দাগ বিভাজন ও হাল রূপান্তর ম্যাপিং)
│   ├── Appendix_06_Faraid_Calculations.txt         (মুসলিম ফারায়েজ ও ১৯৬১-এর ৪ ধারার হিসাব)
│   ├── Appendix_07_Missing_Land_Dag_651_Audit.txt  (দাগ ৬৫১-এর ৮০ শতক জমি নিখোঁজ অডিট)
│   ├── Appendix_08_Third_Party_Intrusion.txt       (তৃতীয় পক্ষ সামসুল হক গং-এর অনুপ্রবেশ পর্যালোচনা)
│   ├── Appendix_09_Contradiction_Register.txt      (১২টি নাম ও সনদের গরমিল সমাধান)
│   ├── Appendix_10_Opposing_Case_Rebuttal.txt      (বিবাদীপক্ষের ২০টি যুক্তি খণ্ডন)
│   ├── Appendix_11_Notice_Under_CPC_Section_80.txt (জেলা প্রশাসক ও সরকারি বিবাদীদের ৮০ ধারার নোটিশ)
│   ├── Appendix_12_Injunction_Application.txt      (অর্ডার ৩৯ রুল ১-২ অন্তর্বর্তীকালীন নিষেধাজ্ঞা দরখাস্ত)
│   ├── Appendix_13_Advocate_Commissioner.txt       (অর্ডার ২৬ রুল ৯ সার্ভেয়ার কমিশনার দরখাস্ত)
│   └── Appendix_14_Affidavit_Of_Possession.txt     (দখল ও খাজনা দাখিলার হলফনামা)
├── 04_FORENSIC_INVESTIGATION_REPORTS/
│   ├── Dag_651_80_Decimal_Forensic_Reconstruction.txt
│   ├── Dag_651_Discrepancy_Detector_Alert_Register.txt
│   ├── Family_Identity_And_12_Discrepancies.txt
│   ├── Faraid_Inheritance_Calculations_MFLO_1961.txt
│   └── Third_Party_Intrusions_Analysis.txt
└── 05_STRUCTURED_DATA_JSON/
    └── SLULIS_Full_Dossier_Master.json             (স্বয়ংক্রিয় সিস্টেমের জন্য স্ট্রাকচার্ড JSON ডেটা)

--------------------------------------------------------------------------------
২. বিজ্ঞ অ্যাডভোকেটের জন্য মামলা দাখিলের জরুরি করণীয় (Filing Procedures):
--------------------------------------------------------------------------------
ক) আরজি প্রিন্ট ও ওকালতনামা:
   '01_COURT_PLAINT/Court_Ready_Civil_Plaint_27_Sections.txt' ফাইলটি আদালতের স্ট্যাম্প পেপারে বা নির্ধারিত আইনি সাইজে প্রিন্ট করে বাদীদের স্বাক্ষর ও বিজ্ঞ আইনজীবীর স্বাক্ষরযুক্ত ওকালতনামা সংযুক্ত করুন।

খ) কোর্ট ফি প্রদান:
   কোর্ট ফিস অ্যাক্ট ১৮৭০-এর ৭(iv)(c) ধারা ও সুট ভ্যালুয়েশন অ্যাক্ট ১৮৮৭ মোতাবেক মূল্যায়ন ২৫,০০,০০০/- টাকার অনুকূলে সর্বোচ্চ নির্ধারিত ৫০,০০০/- টাকার কোর্ট ফি ট্রেজারি চালানের মাধ্যমে দাখিল করতে হবে।

গ) অন্তর্বর্তীকালীন নিষেধাজ্ঞা (Injunction):
   আরজি দাখিলের সাথে সাথেই 'Appendix_12_Injunction_Application.txt' ব্যবহার করে বিবাদীপক্ষীয় সামসুল হক গং যাতে নালিশি ৮০ শতক জমিতে কোনো নির্মাণ বা রূপান্তর করতে না পারে, সেজন্য অর্ডার ৩৯ রুল ১-২-এর দরখাস্ত দাখিল করুন।

ঘ) বাধ্যতামূলক নোটিশ (CPC Section 80):
   ১ ও ২ নং সরকারি বিবাদী (সরকার পক্ষে জেলা প্রশাসক, ব্রাহ্মণবাড়িয়া এবং সহকারী কমিশনার ভূমি, নবীনগর)-কে 'Appendix_11_Notice_Under_CPC_Section_80.txt' মোতাবেক নোটিশ রেজিস্ট্রি ডাকে প্রেরণ নিশ্চিত করুন।

--------------------------------------------------------------------------------
৩. আইনি ডিসক্লেইমার (Legal Disclaimer):
--------------------------------------------------------------------------------
${SLULIS_METADATA.disclaimer}
`;
}

/**
 * 1-Click Master Download Generator: Creates and downloads the entire SLULIS dossier as a structured ZIP file
 */
export async function downloadMasterSlulisPackage(
  records?: LandRecord[],
  onProgress?: MasterBundleProgressCallback
): Promise<void> {
  const zip = new JSZip();

  onProgress?.('মাস্টার এক্সেল ডেটাবেস প্রস্তুত হচ্ছে...', 10);
  const excelBytes = buildMasterSlulisExcelWorkbook(records);
  zip.file(
    '02_EXCEL_WORKBOOK/SLULIS_Full_Investigation_Workbook.xlsx',
    excelBytes
  );

  onProgress?.('আদালতে দাখিলযোগ্য দেওয়ানী আরজি সংকলন হচ্ছে...', 30);
  const plaintText = buildCourtReadyPlaintText();
  zip.file(
    '01_COURT_PLAINT/Court_Ready_Civil_Plaint_27_Sections.txt',
    plaintText
  );

  let schedulesText = `================================================================================
মোকদ্দমার নালিশি জমির তপশিল বিবরণ (Schedules A to D)
================================================================================\n`;
  COURT_READY_PLAINT_DATA.schedules.forEach((sch) => {
    schedulesText += `\n--------------------------------------------------------------------------------
${sch.scheduleName}
--------------------------------------------------------------------------------
মৌজা: ${sch.mouza} (জে.এল. নং- ${sch.jlNo}), উপজেলা: ${sch.upazila}, জেলা: ${sch.district}
সিএস খতিয়ান: ${sch.csKhatian} | এসএ: ${sch.saKhatian} | আরএস: ${sch.rsKhatian} | বিআরএস: ${sch.brsKhatian}
দাগ নম্বর: ${sch.dagNo}
মোট আয়তন: ${sch.totalArea} | নালিশি দাবিকৃত অংশ: ${sch.claimedArea}
জমির প্রকৃতি: ${sch.landNature} | বর্তমান দখল: ${sch.currentPossessionStatus}
চৌহদ্দি:
  - উত্তর: ${sch.boundaries.north}
  - দক্ষিণ: ${sch.boundaries.south}
  - পূর্ব: ${sch.boundaries.east}
  - পশ্চিম: ${sch.boundaries.west}
এভিডেন্স: ${sch.relatedEvidenceIds.join(', ')}\n`;
  });
  zip.file('01_COURT_PLAINT/Plaint_Schedules_A_B_C_D.txt', schedulesText);

  onProgress?.('১৪টি লিটিগেশন পরিশিষ্ট ও দরখাস্ত প্রস্তুত হচ্ছে...', 50);
  LITIGATION_APPENDICES.forEach((app) => {
    const safeName = `Appendix_${String(app.appendixNumber).padStart(2, '0')}_${app.title.replace(/[^a-zA-Z0-9]/g, '_')}.txt`;
    zip.file(`03_LITIGATION_APPENDICES/${safeName}`, buildAppendixText(app));
  });

  onProgress?.('দাগ ৬৫১ নিখোঁজ জমি ও গরমিল ডিটেক্টর রিপোর্ট জেনারেট হচ্ছে...', 70);
  // Missing Land Report
  let missingLandText = `================================================================================
${MISSING_LAND_DAG_651_REPORT.reportTitle}
================================================================================
মৌজা: ${MISSING_LAND_DAG_651_REPORT.mouza} (JL ${MISSING_LAND_DAG_651_REPORT.jlNo})
বিষয়বস্তু দাগ: ${MISSING_LAND_DAG_651_REPORT.subjectDag}
বিরোধীয় নিখোঁজ আয়তন: ${toBengaliNumber(MISSING_LAND_DAG_651_REPORT.disputedAreaDecimal)} শতক (০.৮০ একর)
ফরেনসিক সিদ্ধান্ত: ${MISSING_LAND_DAG_651_REPORT.forensicConclusionCategory}

সিদ্ধান্তের বিস্তারিত বিবরণ:
${MISSING_LAND_DAG_651_REPORT.forensicConclusionDetails}

পার্সেল অবস্থান ও পার্শ্ববর্তী দাগ অনুসন্ধান:
${MISSING_LAND_DAG_651_REPORT.successorDagTracing.parcelDescription}
তৃতীয় পক্ষ অবৈধ রেকর্ডের রূপরেখা:
${MISSING_LAND_DAG_651_REPORT.successorDagTracing.thirdPartyRecordingSummary}

প্রয়োজনীয় সহায়ক দলিলপত্র:
${MISSING_LAND_DAG_651_REPORT.missingSupportingDocumentsRequired.map((d, i) => `${i + 1}. ${d}`).join('\n')}

--------------------------------------------------------------------------------
জরিপভিত্তিক আয়তন রিকনসিলিয়েশন ছক:
--------------------------------------------------------------------------------
`;
  MISSING_LAND_DAG_651_REPORT.reconciliationTable.forEach((r) => {
    missingLandText += `জরিপ: ${r.survey} | খতিয়ান: ${r.khatianNo} | দাগ: ${r.dagNo} | আয়তন: ${toBengaliNumber(r.recordedAreaDecimal)} শতক | হস্তান্তর: ${toBengaliNumber(r.documentedTransferDecimal)} শতক | অমীমাংসিত গরমিল: ${toBengaliNumber(r.unexplainedDifferenceDecimal)} শতক [${r.evidenceId}] (${r.notes})\n`;
  });
  zip.file(
    '04_FORENSIC_INVESTIGATION_REPORTS/Dag_651_80_Decimal_Forensic_Reconstruction.txt',
    missingLandText
  );

  // Discrepancy Detector Alerts Report
  let alertsText = `================================================================================
দাগ ৬৫১ স্বয়ংক্রিয় অসঙ্গতি ও গরমিল ডিটেক্টর রেজিস্টার (Discrepancy Alerts)
================================================================================
মোট স্ক্যানকৃত অসঙ্গতি: ${toBengaliNumber(DAG_651_DISCREPANCY_ITEMS.length)} টি
মোট নিখোঁজ জমি: ৮০.০০ শতক
তদন্তাধীন মৌজা: গোয়ালী (জে.এল. নং ৮৪), নবীনগর, ব্রাহ্মণবাড়িয়া\n\n`;
  DAG_651_DISCREPANCY_ITEMS.forEach((item, idx) => {
    alertsText += `--------------------------------------------------------------------------------
${idx + 1}. [${item.id}] ${item.anomalyTypeBengali} (ঝুঁকি স্তর: ${item.severity})
--------------------------------------------------------------------------------
জরিপ পর্যায়: ${item.surveyStage}
পূর্ববর্তী রেকর্ড: ${item.earlierRecord.survey} খতিয়ান ${item.earlierRecord.khatianNo}, দাগ ${item.earlierRecord.dagNo} (${item.earlierRecord.owner}) = ${item.earlierRecord.areaText}
পরবর্তী বিতর্কিত রেকর্ড: ${item.laterRecord.survey} খতিয়ান ${item.laterRecord.khatianNo}, দাগ ${item.laterRecord.dagNo} (${item.laterRecord.owner}) = ${item.laterRecord.areaText}
আয়তন গরমিল: ${item.areaDiscrepancyText}
ফরেনসিক কারণ: ${item.rootCauseDescription}
দলিলগত স্থিতি: ${item.supportingDocStatus}
লংঘিত আইন: ${item.statutoryViolation}
প্রস্তাবিত দেওয়ানী প্রতিকার: ${item.recommendedLegalAction}
এভিডেন্স আইডি: ${item.forensicEvidenceId}\n\n`;
  });
  zip.file(
    '04_FORENSIC_INVESTIGATION_REPORTS/Dag_651_Discrepancy_Detector_Alert_Register.txt',
    alertsText
  );

  // 12 Discrepancies Text
  let discText = `================================================================================
সফর আলী পরিবার সংক্রান্ত ১২টি বংশগত অসঙ্গতি ও সমাধান রেজিস্টার
================================================================================\n\n`;
  FAMILY_DISCREPANCY_REGISTER.forEach((d) => {
    discText += `[${d.issueId}] ব্যক্তি: ${d.personName}\nপরস্পরবিরোধী তথ্য: ${d.conflictingInformation}\nউৎস দলিল: ${d.sourceDocuments.join(', ')}\nফরেনসিক বিশ্লেষণ: ${d.investigationDetails}\nযাচাই করণীয়: ${d.verificationRequired}\nস্ট্যাটাস: ${d.status}\n\n`;
  });
  zip.file(
    '04_FORENSIC_INVESTIGATION_REPORTS/Family_Identity_And_12_Discrepancies.txt',
    discText
  );

  // Machine Readable Master JSON
  onProgress?.('মাস্টার JSON ডসিয়ার প্রস্তুত হচ্ছে...', 85);
  const masterJsonContent = JSON.stringify(
    {
      metadata: SLULIS_METADATA,
      pendingIdentityRecords: PENDING_FAMILY_IDENTITY_DATA,
      familyDiscrepancyRegister: FAMILY_DISCREPANCY_REGISTER,
      surveyChainRecords: MULTI_MOUZA_SURVEY_CHAIN_RECORDS,
      faraidEvents: FARAID_INHERITANCE_EVENTS,
      thirdPartyIntrusions: THIRD_PARTY_INTRUSION_MATRIX,
      dag651MissingLandReport: MISSING_LAND_DAG_651_REPORT,
      dag651Discrepancies: DAG_651_DISCREPANCY_ITEMS,
      devilsAdvocateDefences: DEVILS_ADVOCATE_DEFENCES,
      courtPlaintData: COURT_READY_PLAINT_DATA,
      litigationAppendices: LITIGATION_APPENDICES,
      exportedAt: new Date().toISOString(),
    },
    null,
    2
  );
  zip.file('05_STRUCTURED_DATA_JSON/SLULIS_Full_Dossier_Master.json', masterJsonContent);

  // Instructions & Manifest
  zip.file(
    '00_INSTRUCTIONS_AND_MANIFEST/README_LEGAL_PROCEDURE_AND_FILING_GUIDE.txt',
    buildReadmeLegalFilingGuide()
  );
  zip.file('00_INSTRUCTIONS_AND_MANIFEST/AUDIT_MANIFEST.csv', buildAuditManifestCsv());

  onProgress?.('জিপ আর্কাইভ কম্প্রেস ও ডাউনলোড হচ্ছে...', 95);
  const zipBlob = await zip.generateAsync({
    type: 'blob',
    compression: 'DEFLATE',
    compressionOptions: { level: 6 },
  });

  const dateStr = new Date().toISOString().slice(0, 10);
  const downloadFileName = `SLULIS_Sofor_Ali_Master_Litigation_Package_${dateStr}.zip`;

  // Trigger Native Client Download without window.alert or popups
  const blobUrl = URL.createObjectURL(zipBlob);
  const downloadLink = document.createElement('a');
  downloadLink.href = blobUrl;
  downloadLink.download = downloadFileName;
  document.body.appendChild(downloadLink);
  downloadLink.click();
  document.body.removeChild(downloadLink);
  URL.revokeObjectURL(blobUrl);

  onProgress?.('সফলভাবে ১-ক্লিকে মাস্টার প্যাকেজ ডাউনলোড সম্পন্ন হয়েছে!', 100);
}
