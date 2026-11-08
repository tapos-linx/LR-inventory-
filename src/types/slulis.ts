import { LandRecord } from './landRecord';
import { EvidenceClassificationStatus } from './forensic';

// Part 3: Pending Family Identity & Discrepancies
export interface PendingFamilyIdentityRecord {
  personName: string;
  fatherNameAsRecorded: string;
  motherNameAsRecorded: string;
  certificateNo: string;
  issueDate: string;
  declaredHeirsCount: number;
  unverifiedConnectionReason: string;
  potentialLinkToLineage: string;
  verificationCheckpoints: string[];
  currentStatus: 'UNVERIFIED FAMILY CONNECTION' | 'PENDING PRIMARY DOCUMENT VERIFICATION' | 'VERIFIED';
}

export interface FamilyDiscrepancyIssue {
  issueId: string;
  personName: string;
  conflictingInformation: string;
  sourceDocuments: string[];
  investigationDetails: string;
  verificationRequired: string;
  status: 'PENDING_DOCUMENTARY_CORROBORATION' | 'UNDER_INVESTIGATION' | 'EXPLAINED_BY_PRIMARY_EVIDENCE';
}

// Part 5: Multi-Mouza Universal Survey Chain Row
export interface MultiMouzaSurveyChainRow {
  id: string;
  mouza: string;
  jlNo: string;
  upazila: string;
  district: string;
  surveyPeriod: 'CS' | 'SA/AC' | 'RS' | 'BS/BRS' | 'Current Record';
  khatianNo: string;
  dagNo: string;
  recordedOwner: string;
  fatherName: string;
  totalArea: string;
  areaDecimal: number;
  share: string;
  successorDag: string;
  documentaryEvidence: string;
  evidenceId: string;
  status: EvidenceClassificationStatus;
  notes?: string;
}

// Part 8: Faraid Multi-Generation Inheritance Event & Calculation
export interface FaraidHeirEntitlement {
  heirName: string;
  relationship: string;
  legalShareFraction: string;
  percentageDecimal: number;
  fractionExplanation: string;
  mfloSection4Applicable: boolean;
  mfloNotes?: string;
  landEntitlementDecimalApprox: number;
  evidenceStatus: EvidenceClassificationStatus;
  livingOrDeceasedAtOpening: 'জীবিত' | 'মৃত' | 'পরবর্তীকালে মৃত';
}

export interface FaraidInheritanceEvent {
  eventId: string;
  deceasedPerson: string;
  fatherName: string;
  deathDate: string;
  verifiedOrAllegedDate: string;
  certificateRef: string;
  applicableLaw: string;
  totalEstateBaseAreaDecimal: number;
  denominatorFormula: string;
  heirs: FaraidHeirEntitlement[];
  investigationNotes: string;
}

// Part 9: Third-Party Intrusion Matrix Row
export interface ThirdPartyIntrusionRow {
  intrusionId: string;
  mouza: string;
  jlNo: string;
  surveyPeriod: string;
  khatianNo: string;
  dagNo: string;
  recordedArea: string;
  recordedAreaDecimal: number;
  previousOwner: string;
  thirdPartyName: string;
  thirdPartyFatherName: string;
  firstAppearance: string;
  claimedTitleBasis: string;
  supportingDeedRef: string;
  mutationRef: string;
  possessionClaim: string;
  documentaryContradictionNote: string;
  evidenceClassification:
    | 'Documented Lawful Transfer'
    | 'Unexplained Third-Party Entry'
    | 'Potentially Irregular Mutation'
    | 'Suspected Forged Document'
    | 'Possible Survey Error'
    | 'Disputed Inheritance'
    | 'Unverified Possession'
    | 'Confirmed Documentary Contradiction';
  evidenceIds: string[];
}

// Part 10: Missing Land Forensic Report
export interface MissingLandReconciliationRow {
  survey: 'CS' | 'SA/AC' | 'RS' | 'BRS' | 'Current';
  khatianNo: string;
  dagNo: string;
  recordedAreaDecimal: number;
  documentedTransferDecimal: number;
  explainedDifferenceDecimal: number;
  unexplainedDifferenceDecimal: number;
  evidenceId: string;
  notes: string;
}

export interface MissingLandForensicReport {
  reportTitle: string;
  mouza: string;
  jlNo: string;
  subjectDag: string;
  disputedAreaDecimal: number;
  reconciliationTable: MissingLandReconciliationRow[];
  successorDagTracing: {
    parcelDescription: string;
    adjacentDagsExamined: string[];
    dagSplitAnalysis: string;
    dagMergeAnalysis: string;
    omissionFinding: string;
    thirdPartyRecordingSummary: string;
  };
  forensicConclusionCategory:
    | 'A. Recovered through documentary chain'
    | 'B. Geographically traced but ownership unresolved'
    | 'C. Partially accounted for'
    | 'D. Unexplained survey discrepancy'
    | 'E. Possible third-party recording'
    | 'F. Insufficient evidence';
  forensicConclusionDetails: string;
  missingSupportingDocumentsRequired: string[];
}

// Part 11: Devil's Advocate & Legal Defence Analysis
export interface DevilsAdvocateDefenceItem {
  id: string;
  defenceTopic: string;
  relevantLawAndSection: string;
  opposingArgument: string;
  claimantCounterargument: string;
  requiredEvidenceToRebut: string[];
  riskLevel: 'HIGH' | 'MEDIUM' | 'LOW';
  statutoryForumNote: string;
}

// Part 12: Court-Ready Civil Plaint Structure
export interface CourtPlaintScheduleItem {
  scheduleName: string;
  mouza: string;
  jlNo: string;
  upazila: string;
  district: string;
  csKhatian: string;
  saKhatian: string;
  rsKhatian: string;
  brsKhatian: string;
  dagNo: string;
  totalArea: string;
  claimedArea: string;
  boundaries: {
    north: string;
    south: string;
    east: string;
    west: string;
  };
  landNature: string;
  currentPossessionStatus: string;
  relatedEvidenceIds: string[];
}

export interface CourtReadyCivilPlaintData {
  courtName: string;
  suitTitle: string;
  natureOfSuit: string;
  plaintiffDetails: string[];
  defendantDetails: string[];
  sections: {
    sectionNumber: number;
    title: string;
    content: string;
  }[];
  schedules: CourtPlaintScheduleItem[];
  reliefsSought: string[];
  suitValuationAndCourtFee: {
    suitValuationBdt: number;
    courtFeeType: string;
    courtFeeBdt: number;
    statutoryProvision: string;
  };
  verificationText: string;
  listOfDocumentsReliedUpon: {
    sl: number;
    documentTitle: string;
    evidenceId: string;
    certifiedCopyStatus: string;
  }[];
}

// Part 12: Litigation Appendix Item
export interface LitigationAppendixItem {
  appendixId: string;
  appendixNumber: number;
  title: string;
  bengaliTitle: string;
  purpose: string;
  statutoryReference: string;
  summary: string;
  contentLines: string[];
}
