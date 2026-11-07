export type SurveyType = 'CS' | 'SA' | 'RS' | 'BRS' | 'BS' | 'City Survey' | string;

export interface LandRecord {
  id: string;
  slNo: number;
  propertyId?: string;         // Property ID
  personId?: string;           // Person ID
  district: string;            // জেলা
  upazila: string;             // উপজেলা
  mouza: string;               // মৌজা
  jlNo: string;                // জে.এল. নং
  surveyType: SurveyType;      // জরিপের ধরণ (CS, CR, SA, RS, BRS, BS, etc.)
  khatianNo: string;           // খতিয়ান নং
  dagNo: string;               // দাগ নং
  ownerDetails: string;        // মালিক / স্বত্ত্বাধিকারীর বিবরণ
  recordedOwner?: string;      // Recorded Owner (original spelling preserved)
  fatherName?: string;         // Father's Name
  spouseName?: string;         // Spouse's Name
  share: string;               // হিস্যা / অংশ (Ownership Share)
  landClass: string;           // জমির শ্রেণি / ধরণ
  area: string;                // দাগের মোট পরিমাণ / মন্তব্য
  landAreaUnit?: 'শতক' | 'একর' | 'কাঠা' | 'বিঘা' | string;
  parentDag?: string;          // সাবেক / প্যারেন্ট দাগ
  successorDag?: string;       // হাল / পরবর্তী দাগ
  parentKhatian?: string;      // সাবেক / প্যারেন্ট খতিয়ান
  successorKhatian?: string;   // হাল / পরবর্তী খতিয়ান
  genealogyRelationship?: string;
  inheritanceCertificateReference?: string;
  deedReference?: string;
  mutationReference?: string;
  mapReference?: string;
  currentRecordReference?: string;
  possessionInformation?: string;
  // Separate Ownership & Status Distinctions (Section 13)
  recordedOwnership?: string;
  claimedOwnership?: string;
  inheritanceRelationshipStatus?: string;
  mutationStatus?: string;
  physicalPossession?: string;
  currentRecordStatus?: string;
  // Evidence & Traceability
  evidenceStatus?: string;
  evidenceId?: string;
  sourceDocument?: string;
  pageNumber?: string;
  recordDate?: string;
  remarks?: string;            // বিশেষ মন্তব্য
  extraAttributes: Record<string, string>; // তৌজি নং, সাবেক দাগ, হাল দাগ, বাটা দাগ, খাজনা, etc.
  fileName?: string;           // File name if parsed from archive
  relativePath?: string;       // Full directory path
  fileSize?: number;           // Size in bytes
  dateIngested?: string;
  verified?: boolean;
}

export interface DynamicColumn {
  id: string;                  // Key in LandRecord or extraAttributes
  label: string;               // Bengali / English Header label
  isCustom?: boolean;          // User-created custom column
  isExtra?: boolean;           // Auto-discovered extra attribute from archive
  visible: boolean;
  order: number;
  width?: number;              // Min width in px
  type: 'text' | 'number' | 'badge' | 'formula';
  formula?: string;            // Formula or transformer e.g. 'katha' | 'bigha' | 'prefix'
}

export interface IngestedArchiveNode {
  name: string;
  type: 'folder' | 'file';
  path: string;
  size?: number;
  children?: IngestedArchiveNode[];
  recordCount?: number;
  district?: string;
  upazila?: string;
  surveyType?: string;
  mouza?: string;
  jlNo?: string;
}

export interface IngestionSummary {
  archiveName: string;
  totalFiles: number;
  totalRecordsExtracted: number;
  districtsFound: string[];
  upazilasFound: string[];
  mouzasFound: string[];
  surveyTypesFound: string[];
  extraColumnsDetected: string[];
  skippedFiles: number;
  ingestionDurationMs: number;
}

export interface FilterState {
  searchQuery: string;
  selectedDistrict: string;
  selectedUpazila: string;
  selectedMouza: string;
  selectedSurveyType: string;
  selectedLandClass: string;
  showOnlyVerified?: boolean;
}
