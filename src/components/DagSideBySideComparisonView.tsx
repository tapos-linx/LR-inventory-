import React, { useState, useMemo } from 'react';
import * as XLSX from 'xlsx';
import {
  Layers,
  ArrowRight,
  AlertTriangle,
  CheckCircle2,
  Download,
  FileSpreadsheet,
  FileText,
  FileJson,
  Scale,
  ShieldAlert,
  Search,
  Sparkles,
  ChevronRight,
  TrendingDown,
  Info,
  Calendar,
  User,
  MapPin,
  Building2,
  Printer,
  RotateCcw,
  ExternalLink,
  ShieldCheck,
  Split,
  Eye,
} from 'lucide-react';
import { MultiMouzaSurveyChainRow } from '../types/slulis';
import { EvidenceClassificationStatus } from '../types/forensic';
import {
  MULTI_MOUZA_SURVEY_CHAIN_RECORDS,
  SLULIS_METADATA,
  MISSING_LAND_DAG_651_REPORT,
} from '../utils/slulisEngine';
import { toBengaliNumber } from '../utils/bengaliNumerals';
import { downloadForensicReportTablePdf } from '../utils/pdfDownloadEngine';
import { exportToJSON } from '../utils/exportUtils';
import { LandRecord } from '../types/landRecord';

interface DagSideBySideComparisonViewProps {
  initialDag?: string;
  onBack?: () => void;
  onNavigateToPlaint?: () => void;
  records?: LandRecord[];
}

export interface SurveyComparisonColumn {
  surveyPeriod: 'CS' | 'SA/AC' | 'RS' | 'BS/BRS' | 'Current Record';
  surveyNameBengali: string;
  timeframe: string;
  khatianNo: string;
  dagNo: string;
  originalCsDagRef: string;
  recordedOwner: string;
  fatherName: string;
  shareFraction: string;
  landClass: string;
  areaDecimal: number;
  areaText: string;
  evidenceRef: string;
  evidenceId: string;
  status: EvidenceClassificationStatus;
  legalNotes: string;
  isIntruder: boolean;
  intruderNames?: string;
}

export interface DagComparisonData {
  dagKey: string;
  displayTitle: string;
  mouza: string;
  jlNo: string;
  upazila: string;
  district: string;
  primarySubject: string;
  summaryNote: string;
  totalCsAreaDecimal: number;
  totalCurrentRecordedDecimal: number;
  netAreaDiscrepancyDecimal: number;
  discrepancyType: 'CRITICAL_MISSING_LAND' | 'NO_DISCREPANCY' | 'LAWFUL_PARTITION' | 'THIRD_PARTY_INTRUSION';
  columns: SurveyComparisonColumn[];
  timelineAnalysis: {
    fromSurvey: string;
    toSurvey: string;
    areaDifferenceDecimal: number;
    differenceText: string;
    changeCategory: 'AREA_LOSS' | 'NO_CHANGE' | 'PARTITION' | 'THIRD_PARTY_GRAB' | 'RECORD_GAP';
    analysis: string;
    statutoryViolationNote?: string;
  }[];
  statutoryRemedy: {
    recommendedCourt: string;
    suitType: string;
    governingLaws: string[];
    prayers: string[];
  };
}

// Pre-configured comparison profiles for the primary dags with granular survey transitions
export const PRESET_DAG_COMPARISONS: Record<string, DagComparisonData> = {
  '651': {
    dagKey: '651',
    displayTitle: 'দাগ ৬৫১ — ৮০ শতক জমি নিখোঁজ ও তৃতীয় পক্ষ জাল বিআরএস রেকর্ড তদন্ত',
    mouza: 'গোয়ালী',
    jlNo: '৮৪',
    upazila: 'নবীনগর',
    district: 'ব্রাহ্মণবাড়িয়া',
    primarySubject: 'মৃত সফর আলী → পুত্র সিরাজ আলী ও কামদার আলী → পরবর্তী ওয়ারিশগণ',
    summaryNote:
      'সিএস জরিপে মূল আবাদী নাল জমির আয়তন ছিল ৩২০ শতক (৩.২০ একর)। এসএ জরিপে ৮০ শতক জমি উধাও হয়ে রেকর্ড হয় ২৪০ শতক। আরএস ও বিআরএস পর্যায়ে সিরাজ আলীর বংশধরদের অংশ সংকুচিত করে বিআরএস দাগ ১৫৮৮-তে ৮০ শতক জমি সম্পূর্ণ বেআইনিভাবে তৃতীয় পক্ষ সামসুল হক গং-এর নামে রেকর্ড করা হয়েছে।',
    totalCsAreaDecimal: 320,
    totalCurrentRecordedDecimal: 240,
    netAreaDiscrepancyDecimal: -80,
    discrepancyType: 'CRITICAL_MISSING_LAND',
    columns: [
      {
        surveyPeriod: 'CS',
        surveyNameBengali: 'সিএস জরিপ (Cadastral Survey)',
        timeframe: '১৯১৫–১৯২০ খ্রি.',
        khatianNo: '১১৮',
        dagNo: '৬৫১',
        originalCsDagRef: 'মূল সিএস ৬৫১',
        recordedOwner: 'সফর আলী',
        fatherName: 'মৃত নাজির ওরফে আলী নোয়াজ',
        shareFraction: '১.০০০০ (১৬ আনা একক স্বত্ব)',
        landClass: 'নাল (আবাদী ধানি জমি)',
        areaDecimal: 320,
        areaText: '৩.২০ একর (৩২০ শতক)',
        evidenceRef: 'সিএস খতিয়ান নং ১১৮ (জেলা রেকর্ড রুম প্রত্যায়িত)',
        evidenceId: 'EVD-000001',
        status: 'VERIFIED',
        legalNotes: 'পৈতৃক আদি রেকর্ড। কোনো সহ-মালিক বা বাটোয়ারা বিবাদ নেই।',
        isIntruder: false,
      },
      {
        surveyPeriod: 'SA/AC',
        surveyNameBengali: 'এসএ জরিপ (State Acquisition Survey)',
        timeframe: '১৯৫৬–১৯৬২ খ্রি.',
        khatianNo: '২৪৫',
        dagNo: '৬৫১',
        originalCsDagRef: 'সাবেক সিএস ৬৫১',
        recordedOwner: 'সিরাজ আলী ও কামদার আলী',
        fatherName: 'মৃত সফর আলী',
        shareFraction: 'উভয়ে ০.৫০০০ (৮ আনা করে সমান)',
        landClass: 'নাল',
        areaDecimal: 240,
        areaText: '২.৪০ একর (২৪০ শতক)',
        evidenceRef: 'এসএ খতিয়ান নং ২৪৫ (সাব-রেজিস্ট্রি ও তহশিল মিল)',
        evidenceId: 'EVD-000002',
        status: 'AREA MISMATCH',
        legalNotes: 'গুরুতর গরমিল: সিএস ৩২০ শতক হতে ৮০ শতক জমি কোনো হস্তান্তর দলিল ছাড়াই বাদ পড়ে ২৪০ শতক রেকর্ড হয়েছে!',
        isIntruder: false,
      },
      {
        surveyPeriod: 'RS',
        surveyNameBengali: 'আরএস জরিপ (Revisional Survey)',
        timeframe: '১৯৭৫–১৯৮৫ খ্রি.',
        khatianNo: '৫১০',
        dagNo: '১১২৪ (বাটোয়ারা দাগ)',
        originalCsDagRef: 'সাবেক এসএ ৬৫১',
        recordedOwner: 'ফিরুজ মিয়া গং (সিরাজ আলীর ওয়ারিশ)',
        fatherName: 'মৃত সিরাজ আলী',
        shareFraction: '০.৫০০০ (সিরাজ আলীর অর্ধাংশ)',
        landClass: 'নাল',
        areaDecimal: 120,
        areaText: '১.২০ একর (১২০ শতক)',
        evidenceRef: 'আরএস খতিয়ান নং ৫১০',
        evidenceId: 'EVD-000003',
        status: 'CORROBORATED',
        legalNotes: 'সিরাজ আলীর অংশের ১২০ শতক আরএস দাগ ১১২৪-এ এবং কামদার আলীর অংশ আরএস দাগ ১১২৬-এ রেকর্ড।',
        isIntruder: false,
      },
      {
        surveyPeriod: 'BS/BRS',
        surveyNameBengali: 'বিআরএস / বিএস জরিপ (City/BRS Survey)',
        timeframe: '১৯৯৮–বর্তমান',
        khatianNo: '৯০২ (অবৈধ) ও ৭৮৫',
        dagNo: '১৫৮৭ (৬০ শতক) + ১৫৮৮ (৮০ শতক)',
        originalCsDagRef: 'সাবেক আরএস ১১২৪ ও সাবেক এসএ ৬৫১',
        recordedOwner: 'মৃত সামসুল হক গং (১৫৮৮ দাগে ৮০ শতক) / ওয়ারিশগণ (১৫৮৭ দাগে)',
        fatherName: 'মৃত আব্দুর রহমান (তৃতীয় পক্ষ অনুপ্রবেশকারী)',
        shareFraction: 'অননুমোদিত বিভাজন',
        landClass: 'নাল',
        areaDecimal: 80,
        areaText: '০.৮০ একর (৮০ শতক জবরদখলীয়)',
        evidenceRef: 'বিআরএস খতিয়ান নং ৯০২ (জাল/ভিত্তিহীন)',
        evidenceId: 'EVD-000004',
        status: 'CONTRADICTORY RECORDS',
        legalNotes: 'সিএস ৬৫১-এর নিখোঁজ ৮০ শতক জমি অবৈধভাবে বিআরএস ১৫৮৮ দাগে তৃতীয় পক্ষের নামে এন্ট্রি করা হয়েছে। কোনো দলিল বা নামজারি রেফারেন্স নেই।',
        isIntruder: true,
        intruderNames: 'সামসুল হক, রফিকুল ইসলাম গং (পিতা: মৃত আব্দুর রহমান)',
      },
      {
        surveyPeriod: 'Current Record',
        surveyNameBengali: 'বর্তমান মাঠদখল ও আইনি অবস্থা (২০২৬)',
        timeframe: 'চলতি বছর ২০২৬',
        khatianNo: 'RECORD GAP',
        dagNo: 'RECORD GAP (মোকদ্দমাযোগ্য)',
        originalCsDagRef: 'সিএস ৬৫১ / বিআরএস ১৫৮৮',
        recordedOwner: 'সফর আলী ও সিরাজ আলীর ওয়ারিশগণ (দখল বঞ্চিত ও সংক্ষুব্ধ)',
        fatherName: 'মৃত সফর আলী বংশধর',
        shareFraction: '১০০% স্বত্বাধিকারী',
        landClass: 'নাল (বিরোধীয় জমি)',
        areaDecimal: 80,
        areaText: '০.৮০ একর (৮০ শতক উদ্ধারযোগ্য)',
        evidenceRef: 'দেওয়ানী মোকদ্দমা ও আরজি তপশিল "ক"',
        evidenceId: 'EVD-000005',
        status: 'RECORD GAP',
        legalNotes: 'আদালতের মাধ্যমে বিআরএস ৯০২ খতিয়ান বাতিলপূর্বক স্বত্ব ঘোষণা ও চিরতরে দখল পুনরুদ্ধারের মোকদ্দমা প্রস্তুত।',
        isIntruder: false,
      },
    ],
    timelineAnalysis: [
      {
        fromSurvey: 'CS (১৯১৫)',
        toSurvey: 'SA (১৯৬২)',
        areaDifferenceDecimal: -80,
        differenceText: '-৮০.০০ শতক (-০.৮০ একর) রহস্যজনক হ্রাস',
        changeCategory: 'AREA_LOSS',
        analysis:
          'সিএস ৩২০ শতক জমি থেকে এসএ রেকর্ডে ২৪০ শতক লিপিবদ্ধ হয়। অবশিষ্ট ৮০ শতক জমি হস্তান্তরের কোনো রেজিঃ দলিল (Deed of Transfer) বা হুকুমদখল নেই।',
        statutoryViolationNote: 'স্টেট একুইজিশন অ্যান্ড টেন্যান্সি অ্যাক্ট ১৯৫০-এর সংশ্লিষ্ট ধারার পরিপন্থী করণিক বাদ পড়া।',
      },
      {
        fromSurvey: 'SA (১৯৬২)',
        toSurvey: 'RS (১৯৮৫)',
        areaDifferenceDecimal: -120,
        differenceText: '-১২০.০০ শতক (বৈধ ভ্রাতৃপ্রতিম বাটোয়ারা)',
        changeCategory: 'PARTITION',
        analysis:
          'এসএ ২৪০ শতক জমি সফর আলীর দুই পুত্র সিরাজ আলী (১২০ শতক) এবং কামদার আলী (১২০ শতক)-এর মধ্যে পৃথক আরএস দাগে (১১২৪ ও ১১২৬) বিভক্ত হয়। এটি ফারায়েজ অনুযায়ী সম্পূর্ণ সংগতিপূর্ণ।',
      },
      {
        fromSurvey: 'RS (১৯৮৫)',
        toSurvey: 'BS/BRS (চলতি)',
        areaDifferenceDecimal: -60,
        differenceText: '-৬০.০০ শতক হ্রাস ও ৮০ শতক তৃতীয় পক্ষ দখল',
        changeCategory: 'THIRD_PARTY_GRAB',
        analysis:
          'বিআরএস জরিপে মারাত্মক জালিয়াতি ঘটে। সিরাজ আলীর ওয়ারিশদের দাগ সংকুচিত করে সাবেক সিএস-এর বাদ পড়া ৮০ শতকসহ বিআরএস ১৫৮৮ দাগ সৃষ্টি করে সম্পূর্ণ বহিরাগত সামসুল হক গং-এর নামে রেকর্ড প্রস্তুত করা হয়।',
        statutoryViolationNote: 'ভূমি অপরাধ প্রতিরোধ ও প্রতিকার আইন ২০২৩-এর ৪ ও ৫ ধারার অধীন দণ্ডনীয় জালিয়াতি।',
      },
      {
        fromSurvey: 'BS/BRS',
        toSurvey: 'Current (২০২৬)',
        areaDifferenceDecimal: 0,
        differenceText: 'আদালতে স্বত্ব ঘোষণা ও বিআরএস সংশোধনের দাবি',
        changeCategory: 'RECORD_GAP',
        analysis:
          'বিবাদীগণ আরএস ও সিএস-এর সাথে কোনো ধারাবাহিক স্বত্বের যোগসূত্র প্রমাণ করতে অক্ষম। বিআরএস রেকর্ড কোনো স্বত্ব সৃষ্টি করে না (Record of rights does not create or extinguish title)।',
      },
    ],
    statutoryRemedy: {
      recommendedCourt: 'বিজ্ঞ সিনিয়র সহকারী জজ আদালত, নবীনগর, ব্রাহ্মণবাড়িয়া',
      suitType: 'স্বত্ব ঘোষণা, বিআরএস রেকর্ড বাতিল ও দখল পুনরুদ্ধারের দেওয়ানী মোকদ্দমা',
      governingLaws: [
        'Specific Relief Act 1877 (Section 42 & 8)',
        'State Acquisition and Tenancy Act 1950 (Section 143, 144 & 145A)',
        'Code of Civil Procedure 1908 (Order 39 Rules 1-2 Temporary Injunction)',
        'ভূমি অপরাধ প্রতিরোধ ও প্রতিকার আইন ২০২৩ (ধারা ৪, ৫ ও ৭)',
      ],
      prayers: [
        '১. সিএস ও এসএ রেকর্ডমূলে সফর আলী ও সিরাজ আলীর ওয়ারিশগণের নিরঙ্কুশ মালিকানা স্বত্ব ঘোষণা।',
        '২. গোয়ালী মৌজার বিআরএস খতিয়ান ৯০২, দাগ ১৫৮৮-তে তৃতীয় পক্ষের নামীয় রেকর্ড অবৈধ, যোগসাজশী ও বাতিল ঘোষণা।',
        '৩. বিবাদীগণের বিরুদ্ধে তপশিলোক্ত জমি হস্তান্তর, রূপান্তর বা নির্মাণকাজে চিরস্থায়ী ও অস্থায়ী নিষেধাজ্ঞা জারি।',
        '৪. প্রয়োজনে বিজ্ঞ আদালতের নাজির বা কমিশনারের মাধ্যমে জমিন দখল উদ্ধারপূর্বক বাদীগণকে বুঝিয়ে দেওয়া।',
      ],
    },
  },

  '652': {
    dagKey: '652',
    displayTitle: 'দাগ ৬৫২ — ১৫০ শতক আবাদী নাল জমি জরিপ ধারাবাহিকতা ও হিস্যা বণ্টন',
    mouza: 'গোয়ালী',
    jlNo: '৮৪',
    upazila: 'নবীনগর',
    district: 'ব্রাহ্মণবাড়িয়া',
    primarySubject: 'মৃত সফর আলী → সিরাজ আলী ও কামদার আলী → জাহের মিয়া ও নোয়াব মিয়া গং',
    summaryNote:
      'সিএস ৬৫২ দাগের ১৫০ শতক জমি এসএ ৭৫০ দাগে হুবহু ১৫০ শতক হিসেবে সিরাজ আলী ও কামদার আলীর নামে সমান অংশে আসে। আরএস ১১২৮ দাগে সিরাজ আলীর ওয়ারিশগণ ৭৫ শতক এবং বিআরএস ১৫৪৫ দাগে ফোরকান মিয়া গং ৭৫ শতকে নিরবচ্ছিন্ন দখলে রয়েছেন।',
    totalCsAreaDecimal: 150,
    totalCurrentRecordedDecimal: 150,
    netAreaDiscrepancyDecimal: 0,
    discrepancyType: 'NO_DISCREPANCY',
    columns: [
      {
        surveyPeriod: 'CS',
        surveyNameBengali: 'সিএস জরিপ',
        timeframe: '১৯১৫–১৯২০ খ্রি.',
        khatianNo: '১১৮',
        dagNo: '৬৫২',
        originalCsDagRef: 'মূল সিএস ৬৫২',
        recordedOwner: 'সফর আলী',
        fatherName: 'মৃত নাজির ওরফে আলী নোয়াজ',
        shareFraction: '১.০০০০',
        landClass: 'নাল',
        areaDecimal: 150,
        areaText: '১.৫০ একর (১৫০ শতক)',
        evidenceRef: 'সিএস খতিয়ান ১১৮',
        evidenceId: 'EVD-000006',
        status: 'VERIFIED',
        legalNotes: 'আবাদী নাল জমি। একক স্বত্বাধিকারী।',
        isIntruder: false,
      },
      {
        surveyPeriod: 'SA/AC',
        surveyNameBengali: 'এসএ জরিপ',
        timeframe: '১৯৫৬–১৯৬২ খ্রি.',
        khatianNo: '২৪৫',
        dagNo: '৭৫০',
        originalCsDagRef: 'সাবেক সিএস ৬৫২',
        recordedOwner: 'সিরাজ আলী ও কামদার আলী',
        fatherName: 'মৃত সফর আলী',
        shareFraction: '১.০০০০ (উভয়ে ৫০% করে)',
        landClass: 'নাল',
        areaDecimal: 150,
        areaText: '১.৫০ একর (১৫০ শতক)',
        evidenceRef: 'এসএ খতিয়ান ২৪৫',
        evidenceId: 'EVD-000007',
        status: 'VERIFIED',
        legalNotes: 'সিএস রেকর্ডের সাথে ১০০% মিল বহাল। কোনো বিচ্যুতি নেই।',
        isIntruder: false,
      },
      {
        surveyPeriod: 'RS',
        surveyNameBengali: 'আরএস জরিপ',
        timeframe: '১৯৭৫–১৯৮৫ খ্রি.',
        khatianNo: '৫১২',
        dagNo: '১১২৮',
        originalCsDagRef: 'সাবেক এসএ ৭৫০',
        recordedOwner: 'মোঃ জাহের মিয়া ও নোয়াব মিয়া',
        fatherName: 'মৃত সিরাজ আলী',
        shareFraction: '০.৫০০০ (সিরাজ আলীর অর্ধাংশ)',
        landClass: 'নাল',
        areaDecimal: 75,
        areaText: '০.৭৫ একর (৭৫ শতক)',
        evidenceRef: 'আরএস খতিয়ান ৫১২',
        evidenceId: 'EVD-000008',
        status: 'CORROBORATED',
        legalNotes: 'ফারায়েজ বণ্টনমতে সিরাজ আলীর উত্তরাধিকারীদের ৭৫ শতক অংশ।',
        isIntruder: false,
      },
      {
        surveyPeriod: 'BS/BRS',
        surveyNameBengali: 'বিআরএস জরিপ',
        timeframe: '১৯৯৮–বর্তমান',
        khatianNo: '৭৮৬',
        dagNo: '১৫৪৫',
        originalCsDagRef: 'সাবেক আরএস ১১২৮',
        recordedOwner: 'ফোরকান মিয়া, ইমান হোসেন গং',
        fatherName: 'মৃত জাহের মিয়া',
        shareFraction: '০.৫০০০',
        landClass: 'নাল',
        areaDecimal: 75,
        areaText: '০.৭৫ একর (৭৫ শতক)',
        evidenceRef: 'বিআরএস খতিয়ান ৭৮৬',
        evidenceId: 'EVD-000009',
        status: 'VERIFIED',
        legalNotes: 'ওয়ারিশগণের নিরবচ্ছিন্ন হস্তগত ও চাষাবাদে রয়েছে।',
        isIntruder: false,
      },
      {
        surveyPeriod: 'Current Record',
        surveyNameBengali: 'বর্তমান হাল অবস্থা (২০২৬)',
        timeframe: '২০২৬ খ্রি.',
        khatianNo: '৭৮৬',
        dagNo: '১৫৪৫',
        originalCsDagRef: 'সিএস ৬৫২',
        recordedOwner: 'জাহের মিয়া ও সিরাজ আলীর বংশধরগণ',
        fatherName: 'মৃত সফর আলী বংশলতিকা',
        shareFraction: '১০০% সিরাজ আলী শাখা',
        landClass: 'নাল',
        areaDecimal: 75,
        areaText: '০.৭৫ একর (৭৫ শতক)',
        evidenceRef: 'ইউনিয়ন ভূমি অফিস হাল দাখিলা ২০২৬',
        evidenceId: 'EVD-000021',
        status: 'VERIFIED',
        legalNotes: 'সরকারি খাজনা পরিশোধিত ও শান্তিপূর্ণ ভোগদখল বিদ্যমান।',
        isIntruder: false,
      },
    ],
    timelineAnalysis: [
      {
        fromSurvey: 'CS (১৯১৫)',
        toSurvey: 'SA (১৯৬২)',
        areaDifferenceDecimal: 0,
        differenceText: '০.০০ শতক গরমিল (১০০% অক্ষুণ্ণ)',
        changeCategory: 'NO_CHANGE',
        analysis: 'সিএস ১৫০ শতক জমি সম্পূর্ণভাবে এসএ দাগ ৭৫০-এ প্রতিফলিত হয়েছে।',
      },
      {
        fromSurvey: 'SA (১৯৬২)',
        toSurvey: 'RS (১৯৮৫)',
        areaDifferenceDecimal: -75,
        differenceText: '-৭৫.০০ শতক (ফারায়েজ বাটোয়ারা)',
        changeCategory: 'PARTITION',
        analysis: 'সিরাজ আলীর অংশের ৭৫ শতক আরএস দাগ ১১২৮-এ এবং কামদার আলীর ৭৫ শতক অপর দাগে লিপিবদ্ধ।',
      },
      {
        fromSurvey: 'RS (১৯৮৫)',
        toSurvey: 'BS/BRS',
        areaDifferenceDecimal: 0,
        differenceText: '০.০০ শতক গরমিল (অক্ষুণ্ণ)',
        changeCategory: 'NO_CHANGE',
        analysis: 'আরএস ৭৫ শতক জমি যথাযথভাবে বিআরএস দাগ ১৫৪৫-এ সিরাজ আলীর ওয়ারিশদের নামে প্রস্তুত।',
      },
    ],
    statutoryRemedy: {
      recommendedCourt: 'আদালতের মোকদ্দমার প্রয়োজন নেই (প্রতিরক্ষামূলক রেকর্ড)',
      suitType: 'মাস্টার লেজারে অক্ষুণ্ণ স্বত্ব হিসেবে রক্ষিত',
      governingLaws: ['SAT Act 1950 (Section 143 Mutation)', 'মুসলিম উত্তরাধিকার আইন (ফারায়েজ)'],
      prayers: ['১. বিবাদীপক্ষ কর্তৃক কোনো প্রতিবন্ধকতা সৃষ্টি করলে নিষেধাজ্ঞার দরখাস্তে সহায়ক টাইটেল চেইন হিসেবে দাখিল।'],
    },
  },

  '653': {
    dagKey: '653',
    displayTitle: 'দাগ ৬৫৩ — ৯০ শতক বাগান ও নাল জমি জরিপ ধারাবাহিকতা',
    mouza: 'গোয়ালী',
    jlNo: '৮৪',
    upazila: 'নবীনগর',
    district: 'ব্রাহ্মণবাড়িয়া',
    primarySubject: 'মৃত সফর আলী → সিরাজ আলী ও কামদার আলী → জাকির হোসেন ও আনোয়ারা বেগম গং',
    summaryNote:
      'সিএস ৬৫৩ দাগের ৯০ শতক বাগান ও আবাদী জমি এসএ ৭৬২ দাগে ৯০ শতক অক্ষুণ্ণ থাকে। আরএস ১১২৯ ও বিআরএস ১৫৪৬ দাগে সিরাজ আলীর ওয়ারিশগণ ৪৫ শতকে ভোগদখলরত রয়েছেন।',
    totalCsAreaDecimal: 90,
    totalCurrentRecordedDecimal: 90,
    netAreaDiscrepancyDecimal: 0,
    discrepancyType: 'NO_DISCREPANCY',
    columns: [
      {
        surveyPeriod: 'CS',
        surveyNameBengali: 'সিএস জরিপ',
        timeframe: '১৯১৫–১৯২০ খ্রি.',
        khatianNo: '১১৮',
        dagNo: '৬৫৩',
        originalCsDagRef: 'মূল সিএস ৬৫৩',
        recordedOwner: 'সফর আলী',
        fatherName: 'মৃত নাজির ওরফে আলী নোয়াজ',
        shareFraction: '১.০০০০',
        landClass: 'বাগান ও নাল',
        areaDecimal: 90,
        areaText: '০.৯০ একর (৯০ শতক)',
        evidenceRef: 'সিএস খতিয়ান ১১৮',
        evidenceId: 'EVD-000010',
        status: 'VERIFIED',
        legalNotes: 'বাগান ও নাল শ্রেণির পৈতৃক সম্পত্তি।',
        isIntruder: false,
      },
      {
        surveyPeriod: 'SA/AC',
        surveyNameBengali: 'এসএ জরিপ',
        timeframe: '১৯৫৬–১৯৬২ খ্রি.',
        khatianNo: '২৪৫',
        dagNo: '৭৬২',
        originalCsDagRef: 'সাবেক সিএস ৬৫৩',
        recordedOwner: 'সিরাজ আলী ও কামদার আলী',
        fatherName: 'মৃত সফর আলী',
        shareFraction: '১.০০০০',
        landClass: 'বাগান ও নাল',
        areaDecimal: 90,
        areaText: '০.৯০ একর (৯০ শতক)',
        evidenceRef: 'এসএ খতিয়ান ২৪৫',
        evidenceId: 'EVD-000011',
        status: 'VERIFIED',
        legalNotes: 'হিস্যা ও আয়তন সম্পূর্ণ অবিকৃত।',
        isIntruder: false,
      },
      {
        surveyPeriod: 'RS',
        surveyNameBengali: 'আরএস জরিপ',
        timeframe: '১৯৭৫–১৯৮৫ খ্রি.',
        khatianNo: '৫১৩',
        dagNo: '১১২৯',
        originalCsDagRef: 'সাবেক এসএ ৭৬২',
        recordedOwner: 'জাকির হোসেন ও আনোয়ারা বেগম',
        fatherName: 'মৃত সিরাজ আলী',
        shareFraction: '০.৫০০০',
        landClass: 'বাগান ও নাল',
        areaDecimal: 45,
        areaText: '০.৪৫ একর (৪৫ শতক)',
        evidenceRef: 'আরএস খতিয়ান ৫১৩',
        evidenceId: 'EVD-000012',
        status: 'CORROBORATED',
        legalNotes: 'সিরাজ আলীর ওয়ারিশদের অংশে ৪৫ শতক প্রস্তুত।',
        isIntruder: false,
      },
      {
        surveyPeriod: 'BS/BRS',
        surveyNameBengali: 'বিআরএস জরিপ',
        timeframe: '১৯৯৮–বর্তমান',
        khatianNo: '৭৮৭',
        dagNo: '১৫৪৬',
        originalCsDagRef: 'সাবেক আরএস ১১২৯',
        recordedOwner: 'জাকির হোসেন গং',
        fatherName: 'মৃত সিরাজ আলী',
        shareFraction: '০.৫০০০',
        landClass: 'বাগান ও নাল',
        areaDecimal: 45,
        areaText: '০.৪৫ একর (৪৫ শতক)',
        evidenceRef: 'বিআরএস খতিয়ান ৭৮৭',
        evidenceId: 'EVD-000013',
        status: 'VERIFIED',
        legalNotes: 'গাছপালা ও বাঁশঝাড়সহ প্রত্যক্ষ দখল বহাল।',
        isIntruder: false,
      },
      {
        surveyPeriod: 'Current Record',
        surveyNameBengali: 'বর্তমান হাল অবস্থা (২০২৬)',
        timeframe: '২০২৬ খ্রি.',
        khatianNo: '৭৮৭',
        dagNo: '১৫৪৬',
        originalCsDagRef: 'সিএস ৬৫৩',
        recordedOwner: 'সিরাজ আলীর বংশধরগণ',
        fatherName: 'মৃত সফর আলী বংশ',
        shareFraction: '১০০% বংশীয় দখল',
        landClass: 'বাগান ও নাল',
        areaDecimal: 45,
        areaText: '০.৪৫ একর (৪৫ শতক)',
        evidenceRef: 'হাল খাজনা রশিদ',
        evidenceId: 'EVD-000022',
        status: 'VERIFIED',
        legalNotes: 'শান্তিপূর্ণ ভোগদখল বিদ্যমান।',
        isIntruder: false,
      },
    ],
    timelineAnalysis: [
      {
        fromSurvey: 'CS (১৯১৫)',
        toSurvey: 'SA (১৯৬২)',
        areaDifferenceDecimal: 0,
        differenceText: '০.০০ শতক গরমিল',
        changeCategory: 'NO_CHANGE',
        analysis: 'সম্পূর্ণ ৯০ শতক এসএ ৭৬২ দাগে অক্ষুণ্ণ।',
      },
      {
        fromSurvey: 'SA (১৯৬২)',
        toSurvey: 'RS (১৯৮৫)',
        areaDifferenceDecimal: -45,
        differenceText: '-৪৫.০০ শতক (ফারায়েজ ভাগ)',
        changeCategory: 'PARTITION',
        analysis: 'দুই ভাইয়ের মধ্যে ৪৫ শতক করে সুনির্দিষ্টভাবে বণ্টিত।',
      },
      {
        fromSurvey: 'RS (১৯৮৫)',
        toSurvey: 'BS/BRS',
        areaDifferenceDecimal: 0,
        differenceText: '০.০০ শতক গরমিল',
        changeCategory: 'NO_CHANGE',
        analysis: 'বিআরএস ১৫৪৬ দাগে ৪৫ শতক অক্ষুণ্ণ।',
      },
    ],
    statutoryRemedy: {
      recommendedCourt: 'কোনো স্বত্ব বিবাদ নেই',
      suitType: 'পৈতৃক অক্ষুণ্ণ সম্পত্তি',
      governingLaws: ['SAT Act 1950', 'Transfer of Property Act 1882'],
      prayers: ['নিয়মিত খাজনা দাখিলা নবায়ন ও নামজারি খতিয়ান সংরক্ষণ।'],
    },
  },

  '654': {
    dagKey: '654',
    displayTitle: 'দাগ ৬৫৪ — ৮০ শতক শতবর্ষীয় মূল পৈতৃক ভিটাবাড়ি / বসতভিটা ও আঙিনা (Special Homestead Land)',
    mouza: 'গোয়ালী',
    jlNo: '৮৪',
    upazila: 'নবীনগর',
    district: 'ব্রাহ্মণবাড়িয়া',
    primarySubject: 'মৃত সফর আলী → সিরাজ আলী ও কামদার আলী → মোঃ জাহের মিয়া ও নোয়াব মিয়া গং',
    summaryNote:
      'দাবিদারের সুস্পষ্ট বর্ণনা অনুযায়ী সিএস ৬৫৪ দাগটি মূল শতবর্ষীয় পৈতৃক ভিটাবাড়ি / বসতবাড়ি (৮০ শতক)। সিএস ১১৮ → এসএ ৭৭৫ → আরএস ১১২৫ → বিআরএস ১৫৪১ দাগে সিরাজ আলীর ওয়ারিশগণ শতবর্ষ ধরে প্রত্যক্ষ ও নিরবচ্ছিন্ন গৃহবাসে রয়েছেন।',
    totalCsAreaDecimal: 80,
    totalCurrentRecordedDecimal: 80,
    netAreaDiscrepancyDecimal: 0,
    discrepancyType: 'NO_DISCREPANCY',
    columns: [
      {
        surveyPeriod: 'CS',
        surveyNameBengali: 'সিএস জরিপ',
        timeframe: '১৯১৫–১৯২০ খ্রি.',
        khatianNo: '১১৮',
        dagNo: '৬৫৪',
        originalCsDagRef: 'মূল সিএস ৬৫৪ (Special Property)',
        recordedOwner: 'সফর আলী',
        fatherName: 'মৃত নাজির ওরফে আলী নোয়াজ',
        shareFraction: '১.০০০০ (১৬ আনা)',
        landClass: 'ভিটাবাড়ি / বসতবাড়ি ও আঙিনা',
        areaDecimal: 80,
        areaText: '০.৮০ একর (৮০ শতক)',
        evidenceRef: 'সিএস খতিয়ান নং ১১৮ (প্রত্যায়িত)',
        evidenceId: 'EVD-000014',
        status: 'VERIFIED',
        legalNotes: 'শতবর্ষীয় মূল পৈতৃক বসতবাড়ি। বংশপরম্পরায় পরিবারটির আবাসস্থল।',
        isIntruder: false,
      },
      {
        surveyPeriod: 'SA/AC',
        surveyNameBengali: 'এসএ জরিপ',
        timeframe: '১৯৫৬–১৯৬২ খ্রি.',
        khatianNo: '২৪৫',
        dagNo: '৭৭৫',
        originalCsDagRef: 'সাবেক সিএস ৬৫৪',
        recordedOwner: 'সিরাজ আলী ও কামদার আলী',
        fatherName: 'মৃত সফর আলী',
        shareFraction: '১.০০০০ (উভয়ে সমান হিস্যা)',
        landClass: 'বাড়ি',
        areaDecimal: 80,
        areaText: '০.৮০ একর (৮০ শতক)',
        evidenceRef: 'এসএ খতিয়ান নং ২৪৫',
        evidenceId: 'EVD-000015',
        status: 'VERIFIED',
        legalNotes: 'বসতভিটার ঘরবাড়ি ও পুকুরপাড়সহ সম্পূর্ণ ৮০ শতক অক্ষুণ্ণ রেকর্ড।',
        isIntruder: false,
      },
      {
        surveyPeriod: 'RS',
        surveyNameBengali: 'আরএস জরিপ',
        timeframe: '১৯৭৫–১৯৮৫ খ্রি.',
        khatianNo: '৫১১',
        dagNo: '১১২৫',
        originalCsDagRef: 'সাবেক এসএ ৭৭৫',
        recordedOwner: 'মোঃ জাহের মিয়া ও নোয়াব মিয়া',
        fatherName: 'মৃত সিরাজ আলী',
        shareFraction: '১.০০০০',
        landClass: 'বাড়ি / ভিটাবাড়ি',
        areaDecimal: 80,
        areaText: '০.৮০ একর (৮০ শতক)',
        evidenceRef: 'আরএস খতিয়ান নং ৫১১',
        evidenceId: 'EVD-000016',
        status: 'VERIFIED',
        legalNotes: 'সিরাজ আলীর পুত্রগণের নামে পৈতৃক বসতবাড়ি হিসেবে সম্পূর্ণ ৮০ শতক বহাল।',
        isIntruder: false,
      },
      {
        surveyPeriod: 'BS/BRS',
        surveyNameBengali: 'বিআরএস জরিপ',
        timeframe: '১৯৯৮–বর্তমান',
        khatianNo: '৭৮৮',
        dagNo: '১৫৪১',
        originalCsDagRef: 'সাবেক আরএস ১১২৫',
        recordedOwner: 'খোকন মিয়া, ফোরকান মিয়া, ইমান হোসেন গং',
        fatherName: 'মৃত জাহের মিয়া ও সিরাজ আলী বংশধর',
        shareFraction: '১.০০০০',
        landClass: 'বাড়ি ও নাল',
        areaDecimal: 80,
        areaText: '০.৮০ একর (৮০ শতক)',
        evidenceRef: 'বিআরএস খতিয়ান নং ৭৮৮',
        evidenceId: 'EVD-000017',
        status: 'VERIFIED',
        legalNotes: 'বর্তমান বংশধরদের পাকা ও আধা-পাকা বসতঘর, সীমানা প্রাচীর ও প্রত্যক্ষ দখল বিদ্যমান।',
        isIntruder: false,
      },
      {
        surveyPeriod: 'Current Record',
        surveyNameBengali: 'বর্তমান বাস্তব দখল (২০২৬)',
        timeframe: 'চলতি বছর ২০২৬',
        khatianNo: '৭৮৮',
        dagNo: '১৫৪১',
        originalCsDagRef: 'সিএস ৬৫৪',
        recordedOwner: 'সিরাজ আলীর সকল জীবিত ওয়ারিশ ও পরিবারবর্গ',
        fatherName: 'মৃত সফর আলী বংশলতিকা',
        shareFraction: 'নিরঙ্কুশ প্রত্যক্ষ দখল',
        landClass: 'বসতবাড়ি / ভিটাবাড়ি',
        areaDecimal: 80,
        areaText: '০.৮০ একর (৮০ শতক)',
        evidenceRef: 'বিদ্যুৎ বিল, হোল্ডিং ট্যাক্স ও ইউপি ওয়ারিশান',
        evidenceId: 'EVD-000023',
        status: 'VERIFIED',
        legalNotes: 'শতবর্ষীয় নিরবচ্ছিন্ন শান্তিপূর্ণ বসবাস। কোনো তৃতীয় পক্ষের অনুপ্রবেশ ঘটেনি।',
        isIntruder: false,
      },
    ],
    timelineAnalysis: [
      {
        fromSurvey: 'CS (১৯১৫)',
        toSurvey: 'SA (১৯৬২)',
        areaDifferenceDecimal: 0,
        differenceText: '০.০০ শতক গরমিল (১০০% অবিকৃত)',
        changeCategory: 'NO_CHANGE',
        analysis: 'সিএস ৬৫৪ দাগের ৮০ শতক পৈতৃক ভিটাবাড়ি সম্পূর্ণভাবে এসএ ৭৭৫ দাগে প্রতিফলিত।',
      },
      {
        fromSurvey: 'SA (১৯৬২)',
        toSurvey: 'RS (১৯৮৫)',
        areaDifferenceDecimal: 0,
        differenceText: '০.০০ শতক গরমিল (১০০% অবিকৃত)',
        changeCategory: 'NO_CHANGE',
        analysis: 'আরএস ১১২৫ দাগে সিরাজ আলীর ওয়ারিশদের নামে সম্পূর্ণ ৮০ শতক বহাল থাকে।',
      },
      {
        fromSurvey: 'RS (১৯৮৫)',
        toSurvey: 'BS/BRS',
        areaDifferenceDecimal: 0,
        differenceText: '০.০০ শতক গরমিল (১০০% অবিকৃত)',
        changeCategory: 'NO_CHANGE',
        analysis: 'বিআরএস ১৫৪১ দাগে সম্পূর্ণ ৮০ শতক জমি বর্তমান বংশধরদের নামে অবিকৃতভাবে প্রস্তুত।',
      },
    ],
    statutoryRemedy: {
      recommendedCourt: 'সংরক্ষণমূলক দলিল (Special Homestead Asset Protection)',
      suitType: 'দেওয়ানী আরজির তপশিল "খ"-তে পৈতৃক দখলি প্রমাণ হিসেবে অন্তর্ভুক্তি',
      governingLaws: ['Specific Relief Act 1877 (Section 54 Permanent Injunction)', 'Evidence Act 1872 (Section 110)'],
      prayers: [
        '১. কোনো বহিরাগত বিবাদী যাতে এই শতবর্ষীয় ভিটাবাড়ির শান্তিময় দখলে অবৈধ হস্তক্ষেপ করতে না পারে সেজন্য স্থায়ী নিষেধাজ্ঞা।',
      ],
    },
  },
};

export const DagSideBySideComparisonView: React.FC<DagSideBySideComparisonViewProps> = ({
  initialDag = '651',
  onBack,
  onNavigateToPlaint,
  records = [],
}) => {
  const [selectedDagKey, setSelectedDagKey] = useState<string>(initialDag);
  const [customSearchDag, setCustomSearchDag] = useState<string>('');
  const [activeSubTab, setActiveSubTab] = useState<'columns' | 'analysis' | 'remedy'>('columns');
  const [isExporting, setIsExporting] = useState(false);

  // Active comparison dataset
  const activeComparison: DagComparisonData = useMemo(() => {
    if (PRESET_DAG_COMPARISONS[selectedDagKey]) {
      return PRESET_DAG_COMPARISONS[selectedDagKey];
    }

    // Dynamic fallback for any arbitrary searched Dag
    const matchedRecords = MULTI_MOUZA_SURVEY_CHAIN_RECORDS.filter((r) =>
      r.dagNo.toLowerCase().includes(selectedDagKey.toLowerCase())
    );

    if (matchedRecords.length > 0) {
      const first = matchedRecords[0];
      return {
        dagKey: selectedDagKey,
        displayTitle: `দাগ নং ${selectedDagKey} — জরিপভিত্তিক ইতিহাস ও তুলনামূলক ধারাবাহিকতা`,
        mouza: first.mouza,
        jlNo: first.jlNo,
        upazila: first.upazila,
        district: first.district,
        primarySubject: first.recordedOwner,
        summaryNote: `খতিয়ান চেইন ডাটাবেস হতে সংগৃহীত দাগ ${selectedDagKey}-এর জরিপভিত্তিক তুলনামূলক বিশ্লেষণ।`,
        totalCsAreaDecimal: first.areaDecimal || 0,
        totalCurrentRecordedDecimal: matchedRecords[matchedRecords.length - 1].areaDecimal || 0,
        netAreaDiscrepancyDecimal:
          (matchedRecords[matchedRecords.length - 1].areaDecimal || 0) - (first.areaDecimal || 0),
        discrepancyType:
          first.areaDecimal !== matchedRecords[matchedRecords.length - 1].areaDecimal
            ? 'CRITICAL_MISSING_LAND'
            : 'NO_DISCREPANCY',
        columns: matchedRecords.map((r) => ({
          surveyPeriod: r.surveyPeriod,
          surveyNameBengali: `${r.surveyPeriod} জরিপ`,
          timeframe: 'ঐতিহাসিক জরিপ রেকর্ড',
          khatianNo: r.khatianNo,
          dagNo: r.dagNo,
          originalCsDagRef: r.dagNo,
          recordedOwner: r.recordedOwner,
          fatherName: r.fatherName,
          shareFraction: r.share,
          landClass: 'নাল',
          areaDecimal: r.areaDecimal,
          areaText: r.totalArea,
          evidenceRef: r.documentaryEvidence,
          evidenceId: r.evidenceId,
          status: r.status,
          legalNotes: r.notes || '',
          isIntruder: r.status === 'CONTRADICTORY RECORDS',
        })),
        timelineAnalysis: [
          {
            fromSurvey: 'প্রাথমিক জরিপ',
            toSurvey: 'পরবর্তী জরিপ',
            areaDifferenceDecimal:
              (matchedRecords[matchedRecords.length - 1].areaDecimal || 0) - (first.areaDecimal || 0),
            differenceText: `${
              (matchedRecords[matchedRecords.length - 1].areaDecimal || 0) - (first.areaDecimal || 0)
            } শতক গরমিল`,
            changeCategory: 'AREA_LOSS',
            analysis: 'উপলব্ধ রেকর্ড অনুসারে জরিপ পরিবর্তন পর্যবেক্ষণ করা হয়েছে।',
          },
        ],
        statutoryRemedy: {
          recommendedCourt: 'বিজ্ঞ দেওয়ানী আদালত',
          suitType: 'স্বত্ব ঘোষণা ও রেকর্ড সংশোধনের মোকদ্দমা',
          governingLaws: ['SAT Act 1950', 'Specific Relief Act 1877'],
          prayers: ['রেকর্ড সংশোধন ও সঠিক জরিপ প্রতিফলন।'],
        },
      };
    }

    return PRESET_DAG_COMPARISONS['651'];
  }, [selectedDagKey]);

  // Handle direct custom search
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (customSearchDag.trim()) {
      setSelectedDagKey(customSearchDag.trim());
    }
  };

  // Export this specific side-by-side comparison to formatted Excel (.xlsx)
  const handleExportSideBySideExcel = () => {
    const wb = XLSX.utils.book_new();

    // Sheet 1: Side by Side Matrix
    const rows = [
      ['ক্ষেত্র / কলাম', ...activeComparison.columns.map((c) => c.surveyNameBengali)],
      ['জরিপ পর্যায়', ...activeComparison.columns.map((c) => c.surveyPeriod)],
      ['জরিপকাল / সন', ...activeComparison.columns.map((c) => c.timeframe)],
      ['খতিয়ান নং', ...activeComparison.columns.map((c) => c.khatianNo)],
      ['দাগ নং (হাল/সাবেক)', ...activeComparison.columns.map((c) => c.dagNo)],
      ['রেকর্ডীয় মালিক', ...activeComparison.columns.map((c) => c.recordedOwner)],
      ['পিতার নাম', ...activeComparison.columns.map((c) => c.fatherName)],
      ['হিস্যা / অংশ', ...activeComparison.columns.map((c) => c.shareFraction)],
      ['জমির শ্রেণি', ...activeComparison.columns.map((c) => c.landClass)],
      ['রেকর্ডীয় আয়তন (শতক)', ...activeComparison.columns.map((c) => c.areaDecimal)],
      ['রেকর্ডীয় আয়তন (বিবরণ)', ...activeComparison.columns.map((c) => c.areaText)],
      ['প্রামাণ্য দলিল ও এভিডেন্স', ...activeComparison.columns.map((c) => `${c.evidenceRef} (${c.evidenceId})`)],
      ['ফরেনসিক স্ট্যাটাস', ...activeComparison.columns.map((c) => c.status)],
      ['আইনি পর্যালোচনা ও অডিট', ...activeComparison.columns.map((c) => c.legalNotes)],
    ];

    const ws = XLSX.utils.aoa_to_sheet(rows);
    XLSX.utils.book_append_sheet(wb, ws, `Dag_${activeComparison.dagKey}_SideBySide`);

    // Sheet 2: Timeline Delta & Discrepancies
    const timelineData = activeComparison.timelineAnalysis.map((t, idx) => ({
      'ক্রমিক': idx + 1,
      'পূর্ববর্তী জরিপ': t.fromSurvey,
      'পরবর্তী জরিপ': t.toSurvey,
      'আয়তন পরিবর্তন (শতক)': t.areaDifferenceDecimal,
      'পরিবর্তন বিবরণ': t.differenceText,
      'পরিবর্তনের ধরণ': t.changeCategory,
      'ফরেনসিক কারণ ও আইনি ব্যাখ্যা': t.analysis,
      'আইনগত লংঘন': t.statutoryViolationNote || 'প্রযোজ্য নয়',
    }));
    const wsTimeline = XLSX.utils.json_to_sheet(timelineData);
    XLSX.utils.book_append_sheet(wb, wsTimeline, 'Timeline_Deltas');

    // Save workbook to local disk
    XLSX.writeFile(
      wb,
      `Dag_${activeComparison.dagKey}_Side_By_Side_Comparison_${new Date().toISOString().slice(0, 10)}.xlsx`
    );
  };

  // Export this comparison to print-ready PDF (.pdf)
  const handleExportSideBySidePdf = async () => {
    if (isExporting) return;
    setIsExporting(true);
    try {
      const rows = activeComparison.columns.map((col, idx) => ({
        sl: toBengaliNumber(idx + 1),
        survey: `${col.surveyNameBengali} (${col.timeframe})`,
        khatianDag: `খতিয়ান: ${col.khatianNo} | দাগ: ${col.dagNo}`,
        owner: `${col.recordedOwner} (পিতা: ${col.fatherName})`,
        area: `${col.areaText} [হিস্যা: ${col.shareFraction}]`,
        evidence: `${col.evidenceRef} [${col.evidenceId}]`,
        status: col.status,
        notes: col.legalNotes,
      }));

      await downloadForensicReportTablePdf({
        reportTitle: `দাগভিত্তিক পাশাপাশি জরিপ তুলনা ও গরমিল রিপোর্ট — দাগ ${activeComparison.dagKey}`,
        reportSubtitle: `মৌজা: ${activeComparison.mouza} (জেএল ${activeComparison.jlNo}), উপজেলা: ${activeComparison.upazila}, জেলা: ${activeComparison.district}`,
        headers: [
          { key: 'sl', label: 'ক্র.', width: 60 },
          { key: 'survey', label: 'জরিপ পর্যায়', width: 200 },
          { key: 'khatianDag', label: 'খতিয়ান ও দাগ', width: 200 },
          { key: 'owner', label: 'রেকর্ডীয় মালিক ও পিতা', width: 280 },
          { key: 'area', label: 'আয়তন ও হিস্যা', width: 200 },
          { key: 'evidence', label: 'প্রমাণ দলিল', width: 220 },
          { key: 'status', label: 'স্ট্যাটাস', width: 150 },
          { key: 'notes', label: 'ফরেনসিক বিশ্লেষণ', width: 350 },
        ],
        rows,
        fileNamePrefix: `Dag_${activeComparison.dagKey}_Survey_Comparison`,
      });
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="space-y-5 font-bengali">
      {/* Header and Dag Selector Bar */}
      <div className="bg-[#0e1627] border border-amber-500/40 rounded-xl p-4 sm:p-5 shadow-xl space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-slate-950 shadow-lg shadow-amber-950/60 shrink-0 ring-2 ring-amber-300/40">
              <Split className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[11px] font-bold uppercase tracking-wider text-amber-400 bg-amber-950/70 border border-amber-500/40 px-2 py-0.5 rounded">
                  Side-by-Side Dag Comparison Engine
                </span>
                <span className="text-[11px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded border border-slate-700">
                  CS → SA → RS → BRS → হাল মাঠদখল
                </span>
              </div>
              <h2 className="text-base sm:text-lg font-bold text-white mt-0.5">
                নির্দিষ্ট দাগের ধারাবাহিক জরিপ পরিবর্তন ও জমির আয়তন গরমিল বিশ্লেষণ
              </h2>
            </div>
          </div>

          {/* Export Action Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleExportSideBySidePdf}
              disabled={isExporting}
              className="px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-amber-400 to-yellow-400 hover:from-amber-300 hover:to-yellow-300 text-slate-950 font-bold text-xs shadow-md flex items-center gap-1.5 transition-all"
            >
              <Download className="w-3.5 h-3.5 text-slate-950 stroke-[2.5]" />
              <span>{isExporting ? 'তৈরি হচ্ছে...' : 'PDF ডাউনলোড (.pdf)'}</span>
            </button>

            <button
              onClick={handleExportSideBySideExcel}
              className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md flex items-center gap-1.5 transition-all"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>এক্সেল (.xlsx)</span>
            </button>

            <button
              onClick={() =>
                exportToJSON(activeComparison, `Dag_${activeComparison.dagKey}_SideBySide_Data`)
              }
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-all"
            >
              <FileJson className="w-3.5 h-3.5 text-amber-400" />
              <span>JSON</span>
            </button>

            {onBack && (
              <button
                onClick={onBack}
                className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 text-xs font-medium"
              >
                ফিরে যান
              </button>
            )}
          </div>
        </div>

        {/* Preset Dag Quick Selector Pills */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-800/80">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-xs text-slate-400 font-semibold mr-1">মূল বিরোধীয় ও পৈতৃক দাগসমূহ:</span>

            <button
              onClick={() => setSelectedDagKey('651')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                selectedDagKey === '651'
                  ? 'bg-red-500 text-white shadow-md shadow-red-950 ring-2 ring-red-400'
                  : 'bg-[#141d33] hover:bg-[#1a2642] text-red-300 border border-red-500/40'
              }`}
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>দাগ ৬৫১ (৮০ শতক উধাও তদন্ত)</span>
            </button>

            <button
              onClick={() => setSelectedDagKey('654')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                selectedDagKey === '654'
                  ? 'bg-amber-400 text-slate-950 shadow-md shadow-amber-950 ring-2 ring-amber-300'
                  : 'bg-[#141d33] hover:bg-[#1a2642] text-amber-300 border border-amber-500/40'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>দাগ ৬৫৪ (ভিটাবাড়ি / বসতবাড়ি)</span>
            </button>

            <button
              onClick={() => setSelectedDagKey('652')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                selectedDagKey === '652'
                  ? 'bg-emerald-500 text-slate-950 shadow-md ring-2 ring-emerald-300'
                  : 'bg-[#141d33] hover:bg-[#1a2642] text-emerald-300 border border-emerald-500/40'
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>দাগ ৬৫২ (১৫০ শতক নাল জমি)</span>
            </button>

            <button
              onClick={() => setSelectedDagKey('653')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                selectedDagKey === '653'
                  ? 'bg-emerald-500 text-slate-950 shadow-md ring-2 ring-emerald-300'
                  : 'bg-[#141d33] hover:bg-[#1a2642] text-emerald-300 border border-emerald-500/40'
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>দাগ ৬৫৩ (৯০ শতক বাগান ও নাল)</span>
            </button>
          </div>

          {/* Custom Dag Search Input */}
          <form onSubmit={handleSearchSubmit} className="flex items-center gap-1.5">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
              <input
                type="text"
                placeholder="অন্য দাগ লিখুন (যেমন ১৫৮৮, ৭৫০)..."
                value={customSearchDag}
                onChange={(e) => setCustomSearchDag(e.target.value)}
                className="pl-8 pr-3 py-1.5 bg-[#090d16] border border-slate-700 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 w-56 font-bengali"
              />
            </div>
            <button
              type="submit"
              className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-amber-300 rounded-lg text-xs font-bold transition-colors"
            >
              খুঁজুন
            </button>
          </form>
        </div>
      </div>

      {/* Selected Dag Title & Overview Banner */}
      <section className="bg-gradient-to-r from-[#141c2f] via-[#16223a] to-[#0f1728] border border-amber-500/30 rounded-xl p-4 sm:p-5 shadow-lg space-y-3">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="space-y-1 max-w-4xl">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-base sm:text-lg font-bold text-amber-300">
                {activeComparison.displayTitle}
              </h3>
              <span className="text-xs bg-slate-800 border border-slate-700 text-slate-300 px-2 py-0.5 rounded">
                মৌজা: {activeComparison.mouza} (জে.এল. {activeComparison.jlNo}), {activeComparison.upazila},{' '}
                {activeComparison.district}
              </span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              {activeComparison.summaryNote}
            </p>
          </div>

          {/* Quick Metrics Badge on Top Right */}
          <div className="flex items-center gap-2 shrink-0">
            <div className="bg-[#0b101c] p-2.5 rounded-lg border border-slate-800 text-center min-w-[100px]">
              <span className="text-[10px] text-slate-400">সিএস আদি আয়তন</span>
              <div className="text-sm font-bold text-amber-300">
                {toBengaliNumber(activeComparison.totalCsAreaDecimal)} শতক
              </div>
            </div>

            <div className="bg-[#0b101c] p-2.5 rounded-lg border border-slate-800 text-center min-w-[100px]">
              <span className="text-[10px] text-slate-400">হাল রেকর্ডীয়</span>
              <div className="text-sm font-bold text-slate-200">
                {toBengaliNumber(activeComparison.totalCurrentRecordedDecimal)} শতক
              </div>
            </div>

            <div
              className={`p-2.5 rounded-lg border text-center min-w-[110px] ${
                activeComparison.netAreaDiscrepancyDecimal < 0
                  ? 'bg-rose-950/40 border-rose-500/50 text-rose-300'
                  : 'bg-emerald-950/40 border-emerald-500/50 text-emerald-300'
              }`}
            >
              <span className="text-[10px] text-slate-300 font-medium">নিট গরমিল</span>
              <div className="text-sm font-bold font-mono">
                {activeComparison.netAreaDiscrepancyDecimal === 0
                  ? '০.০০ (অক্ষুণ্ণ)'
                  : `${toBengaliNumber(activeComparison.netAreaDiscrepancyDecimal)} শতক`}
              </div>
            </div>
          </div>
        </div>

        {/* Visual Waterfall Flow of Land Area (Timeline Bar) */}
        <div className="bg-[#0b101d] p-3 rounded-lg border border-slate-800/80 space-y-2">
          <div className="flex items-center justify-between text-[11px] text-slate-400">
            <span>জরিপভিত্তিক জমির আয়তন প্রবাহ (Area Trajectory Bar):</span>
            <span className="text-amber-400 font-mono text-[10px]">
              সিএস {activeComparison.totalCsAreaDecimal} শতক বেসলাইন
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-xs">
            {activeComparison.columns.map((c, i) => {
              const percentage = activeComparison.totalCsAreaDecimal > 0
                ? Math.min(100, Math.round((c.areaDecimal / activeComparison.totalCsAreaDecimal) * 100))
                : 100;
              return (
                <div key={i} className="bg-[#12192b] p-2 rounded border border-slate-800 space-y-1">
                  <div className="flex items-center justify-between text-[10px]">
                    <span className="font-bold text-amber-300">{c.surveyPeriod}</span>
                    <span className="text-slate-400">{toBengaliNumber(c.areaDecimal)} শতক</span>
                  </div>
                  <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        c.isIntruder
                          ? 'bg-rose-500'
                          : c.status === 'AREA MISMATCH'
                          ? 'bg-amber-500'
                          : 'bg-emerald-400'
                      }`}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-between text-[9px] text-slate-400">
                    <span className="truncate">দাগ {c.dagNo}</span>
                    <span>{percentage}%</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Sub Tabs Toggle (Side-by-Side Cards / Delta Analysis / Legal Strategy) */}
      <div className="flex items-center gap-1 bg-[#0b101d] p-1 rounded-lg border border-slate-800 text-xs w-fit">
        <button
          onClick={() => setActiveSubTab('columns')}
          className={`px-3 py-1.5 rounded-md font-bold transition-all flex items-center gap-1.5 ${
            activeSubTab === 'columns'
              ? 'bg-amber-400 text-slate-950 shadow'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Split className="w-3.5 h-3.5" />
          <span>পাশাপাশি কলাম ভিউ (Side-by-Side Columns)</span>
        </button>

        <button
          onClick={() => setActiveSubTab('analysis')}
          className={`px-3 py-1.5 rounded-md font-bold transition-all flex items-center gap-1.5 ${
            activeSubTab === 'analysis'
              ? 'bg-amber-400 text-slate-950 shadow'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <TrendingDown className="w-3.5 h-3.5" />
          <span>জরিপভিত্তিক গরমিল ট্র্যাকার (Delta Breakdown)</span>
        </button>

        <button
          onClick={() => setActiveSubTab('remedy')}
          className={`px-3 py-1.5 rounded-md font-bold transition-all flex items-center gap-1.5 ${
            activeSubTab === 'remedy'
              ? 'bg-amber-400 text-slate-950 shadow'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Scale className="w-3.5 h-3.5" />
          <span>আইনি প্রতিকার ও আরজি দাবি (Court Remedy)</span>
        </button>
      </div>

      {/* SUB-TAB 1: SIDE-BY-SIDE SURVEY COLUMNS (THE CORE VISUAL MATRIX) */}
      {activeSubTab === 'columns' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3.5 items-stretch">
            {activeComparison.columns.map((col, index) => {
              const isFirst = index === 0;
              const isLast = index === activeComparison.columns.length - 1;
              const prevCol = index > 0 ? activeComparison.columns[index - 1] : null;
              const areaDelta = prevCol ? col.areaDecimal - prevCol.areaDecimal : 0;

              return (
                <div
                  key={index}
                  className={`rounded-xl border flex flex-col justify-between transition-all relative overflow-hidden ${
                    col.isIntruder
                      ? 'bg-gradient-to-b from-[#241318] to-[#160c10] border-rose-500 shadow-xl shadow-rose-950/40 ring-1 ring-rose-500/60'
                      : col.status === 'AREA MISMATCH'
                      ? 'bg-gradient-to-b from-[#24190c] to-[#14100c] border-amber-500/60 shadow-lg'
                      : col.status === 'RECORD GAP'
                      ? 'bg-gradient-to-b from-[#1b1724] to-[#120f18] border-purple-500/50'
                      : 'bg-gradient-to-b from-[#11192a] to-[#0c121f] border-slate-700/80 hover:border-amber-500/40'
                  }`}
                >
                  {/* Top Header Badge */}
                  <div className="p-3 border-b border-slate-800 space-y-1">
                    <div className="flex items-center justify-between gap-1">
                      <span
                        className={`text-[11px] font-bold font-mono px-2 py-0.5 rounded ${
                          col.isIntruder
                            ? 'bg-rose-500 text-white'
                            : col.status === 'VERIFIED'
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                            : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                        }`}
                      >
                        {col.surveyPeriod}
                      </span>
                      <span className="text-[10px] text-slate-400 font-sans">{col.timeframe}</span>
                    </div>
                    <div className="text-xs font-bold text-white pt-0.5">{col.surveyNameBengali}</div>
                  </div>

                  {/* Inter-survey Transition Badge if Delta exists */}
                  {prevCol && (
                    <div className="px-3 py-1 bg-[#090d16] border-b border-slate-800 flex items-center justify-between text-[10px]">
                      <span className="text-slate-400">পূর্ববর্তী হতে পরিবর্তন:</span>
                      <span
                        className={`font-bold font-mono ${
                          areaDelta < 0
                            ? 'text-rose-400'
                            : areaDelta > 0
                            ? 'text-blue-400'
                            : 'text-emerald-400'
                        }`}
                      >
                        {areaDelta === 0
                          ? '০.০০ শতক (মিল)'
                          : `${toBengaliNumber(areaDelta)} শতক`}
                      </span>
                    </div>
                  )}

                  {/* Card Main Body */}
                  <div className="p-3.5 space-y-3 flex-1 text-xs">
                    {/* Dag & Khatian Numbers */}
                    <div className="bg-[#090d16] p-2.5 rounded-lg border border-slate-800 space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400 text-[11px]">দাগ নম্বর:</span>
                        <span
                          className={`font-bold font-mono text-sm ${
                            col.dagNo === 'RECORD GAP'
                              ? 'text-rose-400'
                              : 'text-amber-300'
                          }`}
                        >
                          {col.dagNo}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400 text-[11px]">খতিয়ান নম্বর:</span>
                        <span className="font-bold text-white font-mono">{col.khatianNo}</span>
                      </div>
                      <div className="flex items-center justify-between text-[10px] text-slate-500 pt-1 border-t border-slate-800">
                        <span>সাবেক সিএস রেফারেন্স:</span>
                        <span className="font-sans text-slate-400">{col.originalCsDagRef}</span>
                      </div>
                    </div>

                    {/* Recorded Owners */}
                    <div className="space-y-1">
                      <span className="text-slate-400 text-[11px] font-semibold">রেকর্ডীয় মালিক:</span>
                      <div
                        className={`font-bold leading-tight ${
                          col.isIntruder ? 'text-rose-300' : 'text-white'
                        }`}
                      >
                        {col.recordedOwner}
                      </div>
                      <div className="text-[11px] text-slate-400">পিতা: {col.fatherName}</div>
                      {col.intruderNames && (
                        <div className="mt-1 p-1.5 rounded bg-rose-950/80 border border-rose-500/50 text-[11px] text-rose-200">
                          <strong>অনধিকার দখলদার:</strong> {col.intruderNames}
                        </div>
                      )}
                    </div>

                    {/* Area & Classification */}
                    <div className="space-y-1 pt-1 border-t border-slate-800/80">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400 text-[11px]">রেকর্ডীয় আয়তন:</span>
                        <span
                          className={`font-bold font-mono ${
                            col.isIntruder ? 'text-rose-300' : 'text-emerald-300'
                          }`}
                        >
                          {col.areaText}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-[11px] text-slate-400">
                        <span>হিস্যা (অংশ):</span>
                        <span className="text-slate-200">{col.shareFraction}</span>
                      </div>
                      <div className="flex items-center justify-between text-[11px] text-slate-400">
                        <span>জমির শ্রেণি:</span>
                        <span className="text-slate-200">{col.landClass}</span>
                      </div>
                    </div>

                    {/* Documentary Evidence */}
                    <div className="space-y-1 pt-1 border-t border-slate-800/80">
                      <span className="text-slate-400 text-[11px] font-semibold">প্রামাণ্য দলিল / উৎস:</span>
                      <div className="text-[11px] text-slate-300 leading-tight">
                        {col.evidenceRef}
                      </div>
                      <div className="text-[10px] font-mono text-amber-400">{col.evidenceId}</div>
                    </div>

                    {/* Status & Forensic Review Notes */}
                    <div className="space-y-1 pt-1 border-t border-slate-800/80">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] text-slate-400">ফরেনসিক স্থিতি:</span>
                        <span
                          className={`px-1.5 py-0.5 rounded text-[10px] font-bold border ${
                            col.status === 'VERIFIED'
                              ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                              : col.status === 'AREA MISMATCH'
                              ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                              : col.status === 'CONTRADICTORY RECORDS'
                              ? 'bg-rose-950 text-rose-200 border-rose-500'
                              : 'bg-purple-950 text-purple-300 border-purple-500/40'
                          }`}
                        >
                          {col.status}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-300 italic bg-[#090d16]/70 p-2 rounded border border-slate-800 leading-relaxed">
                        {col.legalNotes}
                      </p>
                    </div>
                  </div>

                  {/* Card Bottom Accent Indicator */}
                  <div
                    className={`h-1.5 w-full ${
                      col.isIntruder
                        ? 'bg-rose-500'
                        : col.status === 'AREA MISMATCH'
                        ? 'bg-amber-500'
                        : col.status === 'RECORD GAP'
                        ? 'bg-purple-500'
                        : 'bg-emerald-400'
                    }`}
                  />
                </div>
              );
            })}
          </div>

          {/* Quick Guidance Note */}
          <div className="bg-[#0f172a] p-3.5 rounded-xl border border-slate-800 flex items-start gap-2.5 text-xs text-slate-300">
            <Info className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <p className="leading-relaxed">
              <strong>আইনি নোট:</strong> সিএস জরিপের আদি স্বত্বাধিকারী সফর আলীর পর থেকে ওয়ারিশান সূত্রে সিরাজ আলী ও কামদার আলীর ধারাবাহিক হিস্যা অপরিবর্তিত থাকে। কোনো বৈধ রেজিঃ হস্তান্তর দলিল বা অধিগ্রহণ ব্যতীত এসএ ও বিআরএস রেকর্ডে আয়তন হ্রাস বা তৃতীয় পক্ষের নাম অন্তর্ভুক্ত হওয়া আইনত অবৈধ ও এখতিয়ারবিহীন (Ultra Vires)।
            </p>
          </div>
        </div>
      )}

      {/* SUB-TAB 2: DELTA BREAKDOWN (SURVEY TO SURVEY ANOMALY AUDIT) */}
      {activeSubTab === 'analysis' && (
        <div className="space-y-4">
          <div className="bg-[#0e1627] border border-slate-800 rounded-xl p-5 space-y-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <TrendingDown className="w-4 h-4 text-amber-400" />
              <span>ধাপভিত্তিক জরিপ রূপান্তর ও জমির আয়তন হ্রাস-বৃদ্ধি অডিট (Survey Step-by-Step Transition)</span>
            </h3>

            <div className="space-y-3">
              {activeComparison.timelineAnalysis.map((step, idx) => (
                <div
                  key={idx}
                  className={`p-4 rounded-xl border flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                    step.changeCategory === 'AREA_LOSS'
                      ? 'bg-rose-950/20 border-rose-500/40'
                      : step.changeCategory === 'THIRD_PARTY_GRAB'
                      ? 'bg-red-950/30 border-red-500'
                      : step.changeCategory === 'PARTITION'
                      ? 'bg-amber-950/20 border-amber-500/30'
                      : 'bg-[#121a2d] border-slate-800'
                  }`}
                >
                  <div className="space-y-1.5 max-w-3xl">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-bold text-amber-300 font-mono">
                        ধাপ {toBengaliNumber(idx + 1)}: {step.fromSurvey}
                      </span>
                      <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                      <span className="text-xs font-bold text-amber-300 font-mono">
                        {step.toSurvey}
                      </span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                          step.changeCategory === 'AREA_LOSS' || step.changeCategory === 'THIRD_PARTY_GRAB'
                            ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                            : step.changeCategory === 'PARTITION'
                            ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                            : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                        }`}
                      >
                        {step.differenceText}
                      </span>
                    </div>

                    <p className="text-xs text-slate-200 leading-relaxed">{step.analysis}</p>

                    {step.statutoryViolationNote && (
                      <div className="text-[11px] text-rose-300 flex items-center gap-1.5 pt-1">
                        <AlertTriangle className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                        <span>আইনগত লংঘন: {step.statutoryViolationNote}</span>
                      </div>
                    )}
                  </div>

                  <div className="shrink-0 text-right font-mono">
                    <div className="text-xs text-slate-400">আয়তন তারতম্য:</div>
                    <div
                      className={`text-lg font-bold ${
                        step.areaDifferenceDecimal < 0
                          ? 'text-rose-400'
                          : step.areaDifferenceDecimal > 0
                          ? 'text-blue-400'
                          : 'text-emerald-400'
                      }`}
                    >
                      {step.areaDifferenceDecimal === 0
                        ? '০.০০ শতক'
                        : `${toBengaliNumber(step.areaDifferenceDecimal)} শতক`}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Formula Reconciliation Box */}
            <div className="bg-[#101726] p-4 rounded-xl border border-slate-800 space-y-2 text-xs">
              <span className="text-amber-400 font-bold flex items-center gap-1.5">
                <Info className="w-3.5 h-3.5" />
                <span>ফরেনসিক রিকনসিলিয়েশন সূত্র (Forensic Reconciliation Formula):</span>
              </span>
              <div className="font-mono bg-[#090d16] p-3 rounded-lg border border-slate-800 text-slate-200 overflow-x-auto text-xs">
                অমীমাংসিত গরমিল = সিএস আয়তন ({activeComparison.totalCsAreaDecimal} শতক) - বৈধ রেজিস্ট্রি বিক্রয় (০ শতক) - ফারায়েজ বণ্টন ({activeComparison.columns[2]?.areaDecimal || 0} শতক) - হাল স্বত্বহীন তৃতীয় পক্ষ ({activeComparison.columns[3]?.areaDecimal || 0} শতক)
              </div>
              <p className="text-slate-400">
                ফলাফল: সাবেক সিএস ৬৫১ দাগ হতে এসএ ও বিআরএস পর্যায়ে মোট ৮০ শতক জমি বেআইনিভাবে কর্তন করা হয়েছে।
              </p>
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 3: LEGAL STATUTORY REMEDY & COURT ACTION */}
      {activeSubTab === 'remedy' && (
        <div className="space-y-4">
          <div className="bg-[#0e1627] border border-slate-800 rounded-xl p-5 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Scale className="w-4 h-4 text-amber-400" />
                  <span>দাগভিত্তিক দেওয়ানী আদালতের আইনি মোকদ্দমা কৌশল ও প্রতিকার প্রার্থনা</span>
                </h3>
                <p className="text-xs text-slate-400">
                  আদালতে দাখিলযোগ্য আরজির প্রয়োজনীয় দাবি ও ধারাভিত্তিক আইনি ভিত্তি।
                </p>
              </div>

              {onNavigateToPlaint && (
                <button
                  onClick={onNavigateToPlaint}
                  className="px-3.5 py-1.5 bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs rounded-lg flex items-center gap-1.5 transition-all"
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>পূর্ণাঙ্গ কোর্ট-রেডি দেওয়ানী আরজি দেখুন</span>
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="bg-[#12192b] p-4 rounded-xl border border-slate-800 space-y-2">
                <span className="text-amber-300 font-bold">এখতিয়ারবান বিজ্ঞ আদালত ও মোকদ্দমার ধরণ:</span>
                <div className="text-white font-semibold">{activeComparison.statutoryRemedy.recommendedCourt}</div>
                <div className="text-slate-300">{activeComparison.statutoryRemedy.suitType}</div>
              </div>

              <div className="bg-[#12192b] p-4 rounded-xl border border-slate-800 space-y-2">
                <span className="text-amber-300 font-bold">প্রযোজ্য আইনি সংবিধিবদ্ধ ধারা:</span>
                <ul className="space-y-1 text-slate-300">
                  {activeComparison.statutoryRemedy.governingLaws.map((law, idx) => (
                    <li key={idx} className="flex items-center gap-1.5">
                      <ChevronRight className="w-3 h-3 text-amber-400 shrink-0" />
                      <span>{law}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="bg-[#12192b] p-4 rounded-xl border border-slate-800 space-y-2.5 text-xs">
              <span className="text-amber-300 font-bold">বিজ্ঞ আদালতের নিকট প্রার্থীত প্রতিকারসমূহ (Prayers):</span>
              <div className="space-y-2 text-slate-200">
                {activeComparison.statutoryRemedy.prayers.map((prayer, idx) => (
                  <div key={idx} className="p-2.5 rounded-lg bg-[#0a0f1d] border border-slate-800/80 flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span className="leading-relaxed">{prayer}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
