import { LandRecord } from './landRecord';

// Section 11: Evidence Classification System (12 Mandatory Statuses)
export type EvidenceClassificationStatus =
  | 'VERIFIED'
  | 'CORROBORATED'
  | 'PARTIALLY VERIFIED'
  | 'PROBABLE'
  | 'POSSIBLE'
  | 'IDENTITY CANDIDATE'
  | 'UNVERIFIED'
  | 'RECORD GAP'
  | 'AREA MISMATCH'
  | 'GEOGRAPHIC MISMATCH'
  | 'CONTRADICTORY RECORDS'
  | 'HYPOTHESIS — REQUIRES PRIMARY DOCUMENT VERIFICATION';

// Section 11: 12-Tier Evidence Hierarchy
export type EvidenceHierarchyTier =
  | '1. Original Government Record'
  | '2. Certified Government Copy'
  | '3. Registered Deed'
  | '4. Original Survey Map'
  | '5. Official Mutation Record'
  | '6. Official Inheritance Certificate'
  | '7. Court Record or Judgment'
  | '8. Government Gazette or Official Order'
  | '9. Official Digital Record'
  | '10. Secondary Record'
  | '11. Family Document'
  | '12. Oral History';

// Section 6: 9 Mandatory Match Classifications
export type MatchClassification =
  | 'EXACT NAME MATCH'
  | 'EXACT NAME + FATHER MATCH'
  | 'VARIANT NAME MATCH'
  | 'PARTIAL IDENTITY MATCH'
  | 'IDENTITY CANDIDATE'
  | 'POSSIBLE SAME PERSON'
  | 'UNVERIFIED SAME PERSON'
  | 'NO MATCH'
  | 'CONTRADICTORY IDENTITY';

// Section 4: Supported Document Types (Categories A, B, C)
export type ForensicDocumentType =
  | 'CS Khatian'
  | 'CR / Subsequent Record'
  | 'SA Khatian'
  | 'RS Khatian'
  | 'BS / BRS Khatian'
  | 'Survey Map / Mouza Map'
  | 'Dag Conversion List'
  | 'Certified Copy / Record Extract'
  | 'Warish / Inheritance Certificate'
  | 'Registered Deed'
  | 'Gift Deed'
  | 'Partition Deed'
  | 'Mutation / Namjari'
  | 'DCR / Land Tax Receipt'
  | 'Court Order / Judgment / Plaint'
  | 'Family Genealogy Document'
  | 'Handwritten List'
  | 'Government Office Slip'
  | 'Scanned Document / OCR'
  | 'Excel / CSV / Word List';

// Section 15: Evidence ID & Document Traceability
export interface EvidenceDocumentRecord {
  evidenceId: string; // e.g., CS-001, CR-001, SA-001, RS-001, BS-001, MAP-001, DEED-001, MUT-001, WAR-001, COURT-001, SLIP-001
  originalFileName: string;
  documentType: ForensicDocumentType;
  hierarchyTier: EvidenceHierarchyTier;
  uploadDate: string;
  pageNumber: string;
  extractedOriginalText: string;
  normalizedText: string;
  hasUncertainOcr: boolean; // True if [অস্পষ্ট] or [পাঠোদ্ধার সম্ভব হয়নি] detected
  uncertainTokens: string[];
  sha256Hash: string;
  isDuplicateUpload: boolean;
  verificationStatus: EvidenceClassificationStatus;
  district: string;
  upazila: string;
  mouza: string;
  jlNo: string;
}

// Section 3: Master Genealogy Node
export interface GenealogyPersonNode {
  personId: string;
  generation: number;
  originalName: string; // Exact original spelling preserved
  normalizedName: string; // Search-friendly normalized Bangla form
  variantSpellings: string[]; // Alternative spellings treated as variants, not auto-merged
  fatherOriginalName: string;
  fatherNormalizedName: string;
  motherName: string;
  spouseNames: string[];
  parentPersonId?: string;
  branchName: string;
  relationshipLabel: string;
  district: string;
  upazila: string;
  mouza: string;
  village: string;
  jlNo: string;
  associatedKhatians: string[];
  associatedDags: string[];
  evidenceIds: string[];
  verificationStatus: EvidenceClassificationStatus;
  neutralDesignation: 'RECORD-LINKED PERSONS' | 'FORENSIC PERSONS OF INTEREST';
}

// Section 5: Geographical Validation Result
export interface GeographicValidationResult {
  isValid: boolean;
  status: 'GEOGRAPHIC IDENTITY CONFIRMED' | 'GEOGRAPHIC MISMATCH' | 'GEOGRAPHIC IDENTITY UNVERIFIED';
  districtMatch: boolean;
  upazilaMatch: boolean;
  mouzaMatch: boolean;
  jlNoMatch: boolean;
  details: string;
}

// Section 4 & 14 (Report 1): Extracted Document Entry
export interface ExtractedForensicEntry {
  entryId: string;
  evidenceId: string;
  sourceDocumentName: string;
  documentType: ForensicDocumentType;
  pageLocation: string;
  district: string;
  upazila: string;
  mouza: string;
  jlNo: string;
  surveyType: string;
  khatianNo: string;
  dagNo: string;
  parentDag?: string;
  successorDag?: string;
  originalPersonName: string; // Preserved verbatim
  normalizedPersonName: string;
  fatherOriginalName: string;
  fatherNormalizedName: string;
  motherName?: string;
  spouseName?: string;
  relationshipToDeceased?: string;
  certificateNumber?: string;
  issueDate?: string;
  issuingAuthority?: string;
  share: string;
  landAreaRaw: string;
  landAreaShatak: number; // Standardized in শতক (1 Acre = 100 Shatak) for reconciliation
  hasOcrUncertainty: boolean;
  rawTextExcerpt: string;
  geographicValidation: GeographicValidationResult;
  evidenceStatus: EvidenceClassificationStatus;
}

// Section 6 & 14 (Report 2 & Report 4): Person & Genealogy Match Result
export interface ForensicPersonMatchResult {
  matchId: string;
  extractedEntry: ExtractedForensicEntry;
  uploadedDocumentName: string;
  evidenceId: string;
  originalExtractedName: string;
  normalizedExtractedName: string;
  matchedGenealogyPerson?: GenealogyPersonNode;
  matchedGenealogyName: string;
  fatherSpouseComparison: string;
  geographicComparison: string;
  khatianDagComparison: string;
  supportingEvidence: string[];
  conflictingEvidence: string[];
  matchClassification: MatchClassification;
  evidenceStatus: EvidenceClassificationStatus;
  confidenceScore: number; // Analytical aid only, not proof of identity or ownership
  explanation: string;
  neutralDesignation: 'RECORD-LINKED PERSONS' | 'FORENSIC PERSONS OF INTEREST';
  categoryBucket: 'MATCHED' | 'UNMATCHED' | 'REQUIRES_VERIFICATION';
}

// Section 7 & 14 (Report 3): "INHERITANCE CERTIFICATE — EXTRACTED PERSONS"
export interface InheritanceCertificateExtractedPerson {
  personId: string;
  originalName: string;
  normalizedName: string;
  fatherName: string;
  spouseName: string;
  relationshipToDeceased: string;
  deceasedAncestorName: string;
  certificateNumber: string;
  issueDate: string;
  issuingAuthority: string;
  mouzaVillage: string;
  sourceDocument: string;
  pageLocation: string;
  evidenceId: string;
  verificationStatus: EvidenceClassificationStatus;
  neutralDesignation: 'RECORD-LINKED PERSONS' | 'FORENSIC PERSONS OF INTEREST';
  outputGroup:
    | 'Matched Inheritance Certificate Persons'
    | 'Unmatched Inheritance Certificate Persons'
    | 'Inheritance Certificate Persons Requiring Identity Verification';
  crossReferences: {
    genealogyMatch: string;
    csRecordRef: string;
    crRecordRef: string;
    saRecordRef: string;
    rsRecordRef: string;
    bsBrsRecordRef: string;
    deedRef: string;
    mutationRef: string;
  };
}

// Section 8 & 14 (Report 6): Historical Record Transition & Name Disappearance Audit
export type TransitionChangeCode =
  | 'A. Name retained'
  | 'B. Name changed'
  | 'C. Name omitted'
  | 'D. Name replaced'
  | 'E. Share changed'
  | 'F. Land area changed'
  | 'G. Dag split'
  | 'H. Dag merged'
  | 'I. Khatian transferred or reorganized'
  | 'J. Supporting transition document missing'
  | 'K. Conflicting records';

export interface HistoricalTransitionAuditRow {
  auditId: string;
  transitionStage: string; // e.g., "CS → SA", "CS → CR", "SA → RS", "RS → BS/BRS"
  mouza: string;
  jlNo: string;
  earlierRecordSummary: string;
  laterRecordSummary: string;
  identifiedChanges: TransitionChangeCode[];
  changeDescription: string;
  supportingEvidence: string;
  evidenceIds: string[];
  primarySourceGapNote?: string; // e.g. "ORIGINAL HANDWRITTEN CS RECORD NOT PRODUCED — PRIMARY SOURCE ACCESS GAP."
  status: EvidenceClassificationStatus;
}

// Section 9 & 14 (Report 7): Land Area & Share Reconciliation Engine
export interface LandAreaReconciliationRow {
  reconciliationId: string;
  mouza: string;
  jlNo: string;
  parentSurvey: string;
  parentKhatian: string;
  parentDag: string;
  parentOwner: string;
  parentAreaShatakPrimaryClaim: number; // e.g., 33 শতক
  parentAreaShatakAlternativeClaim?: number; // e.g., 30 শতক if conflicting source claim exists
  successorEntries: {
    survey: string;
    khatianNo: string;
    dagNo: string;
    ownerName: string;
    areaShatak: number;
    evidenceId: string;
  }[];
  totalIdentifiedSuccessorShatak: number; // e.g., 28 শতক
  unexplainedAreaPrimaryShatak: number; // Parent (33) - Identified (28) = 5 শতক
  unexplainedAreaAltShatak?: number; // Alt Parent (30) - Identified (28) = 2 শতক
  reconciliationClassification:
    | 'AREA RECONCILED (0 শতক)'
    | 'AREA GAP'
    | 'OVER-ALLOCATION / AREA CONFLICT';
  classificationLabel: string; // e.g., "AREA GAP — 5 শতক UNRECONCILED (Alt Claim: 2 শতক UNRECONCILED)"
  evidenceStatus: EvidenceClassificationStatus;
  evidenceIds: string[];
  notes: string;
}

// Section 10 & 14 (Report 5): Dag & Khatian Cross-Mapping
export interface DagKhatianCrossMappingRow {
  mappingId: string;
  mouza: string;
  jlNo: string;
  csKhatian?: string;
  csDag?: string;
  crKhatian?: string;
  crDag?: string;
  saKhatian?: string;
  saDag?: string;
  rsKhatian?: string;
  rsDag?: string;
  bsBrsKhatian?: string;
  bsBrsDag?: string;
  recordedOwnerProgression: string;
  fatherNameProgression: string;
  areaProgression: string;
  conversionType:
    | 'CS Dag → Later Dag'
    | 'CR Dag → Later Dag'
    | 'SA Dag → RS Dag'
    | 'RS Dag → BS/BRS Dag'
    | 'One-to-Many (Dag Split)'
    | 'Many-to-One (Dag Merged)'
    | 'Unmapped Dag'
    | 'Unverified Conversion';
  sourceDocument: string;
  evidenceId: string;
  verificationStatus: EvidenceClassificationStatus;
}

// Section 14 (Report 8): Record Gap Register
export interface RecordGapEntry {
  gapId: string;
  gapCategory:
    | 'Missing Original Handwritten CS Record'
    | 'Unavailable Certified Copy'
    | 'Missing Survey / Mouza Map'
    | 'Missing Transfer / Partition Deed'
    | 'Missing Official Mutation / Namjari Order'
    | 'Missing Warish Certificate Link';
  mouza: string;
  jlNo: string;
  affectedKhatianDag: string;
  affectedPersons: string;
  description: string;
  mandatoryNotice: string;
  evidenceIds: string[];
  status: EvidenceClassificationStatus;
}

// Section 14 (Report 9): Contradiction & Anomaly Report
export interface ContradictionAnomalyEntry {
  anomalyId: string;
  anomalyType:
    | 'Conflicting Land Area Claims'
    | 'Father Name Contradiction'
    | 'Geographic Mouza/Upazila Conflict'
    | 'Unexplained Ownership Share Drop'
    | 'Unexplained Name Omission'
    | 'OCR / Handwritten Uncertainty';
  earlierOrSourceA: string;
  laterOrSourceB: string;
  neutralFindingSummary: string;
  evidenceIds: string[];
  classification: EvidenceClassificationStatus;
}

// Section 12: Court Document Analysis
export interface CourtDocumentAnalysisEntry {
  courtDocId: string;
  evidenceId: string;
  caseNumber: string;
  courtName: string;
  documentSubType: 'Plaint (আরজি)' | 'Written Statement (জবাব)' | 'Affidavit' | 'Interim Order' | 'Final Judgment / Decree';
  plaintiffAllegations: string[];
  defendantStatements: string[];
  documentaryExhibits: string[];
  courtObservations: string[];
  interimOrders: string[];
  finalJudgmentOrDecree: string;
  appealOrReviewStatus: string;
  mandatoryLegalSafeguardClassification: string; // e.g., "PLAINTIFF'S ALLEGATION — REQUIRES INDEPENDENT DOCUMENTARY VERIFICATION."
}

// Section 14 (Report 10) & Section 17: Master Ledger Update Proposal & Version History
export interface MasterLedgerUpdateProposal {
  proposalId: string;
  proposalType: 'ADD_NEW_EVIDENCE_LINKED_RECORD' | 'APPEND_FORENSIC_METADATA_WITHOUT_OVERWRITE';
  proposedRecord: LandRecord;
  targetExistingRecordId?: string;
  reasonAndEvidenceSummary: string;
  evidenceIds: string[];
  evidenceStatus: EvidenceClassificationStatus;
  approvalState: 'PENDING_REVIEW' | 'APPROVED' | 'REJECTED';
  reviewedAt?: string;
}

export interface LedgerAuditVersionEntry {
  versionId: string;
  timestamp: string;
  actionTitle: string;
  proposalId: string;
  evidenceIds: string[];
  previousRecordsSnapshot: LandRecord[];
}

// Section 19: Automated Verification Test Case Result (TEST A through TEST J)
export interface ForensicTestCaseResult {
  testCode:
    | 'TEST A'
    | 'TEST B'
    | 'TEST C'
    | 'TEST D'
    | 'TEST E'
    | 'TEST F'
    | 'TEST G'
    | 'TEST H'
    | 'TEST I'
    | 'TEST J';
  title: string;
  scenarioDescription: string;
  sampleInputSummary: string;
  actualClassification: string;
  evidenceStatus: EvidenceClassificationStatus;
  evidenceIds: string[];
  passed: boolean;
  detailedOutput: string;
}
