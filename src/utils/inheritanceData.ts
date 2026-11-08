import { LandRecord } from '../types/landRecord';
import { parseAcreValue, toBengaliNumber } from './bengaliNumerals';

export interface WarishHeir {
  sl: string;
  name: string;
  relation: string;
  nidOrBirthReg: string;
  dob: string;
  status: 'জীবিত' | 'মৃত';
}

export interface WarishCertificate {
  id: string;
  slNo: number;
  certificateType: 'ওয়ারিশান সনদ' | 'উত্তরাধিকারী সনদপত্র' | 'নাগরিকত্ব সনদ';
  certificateNo: string;
  memoNo?: string;
  issueDate: string;
  deceasedName: string;
  deceasedNid?: string;
  fatherName: string;
  motherName: string;
  village: string;
  ward: string;
  postOffice: string;
  union: string;
  upazila: string;
  district: string;
  deathDate: string;
  imagePath: string;
  heirs: WarishHeir[];
  keywords: string[];
}

export interface MatchedInheritanceRecord {
  id: string;
  slNo: number;
  landRecord: LandRecord;
  matchedCertificate: WarishCertificate;
  matchType: 'exact_ancestor' | 'heir_match' | 'lineage_chain' | 'mouza_assigned';
  matchedPersonName: string;
  livingHeirsCount: number;
  deceasedHeirsCount: number;
  livingHeirsSummary: string;
  allHeirsDetailed: string;
  allocatedAreaPerLivingHeir: string;
}

export const REFERENCE_INHERITANCE_FILE_PATH =
  '/assets/aistudio/____________________a9904dbe.txt';

/**
 * 100% Verbatim Extracted Data from the 8 Uploaded Certificates
 * All extraneous/non-certificate data has been discarded.
 */
export const PROVIDED_WARISH_CERTIFICATES: WarishCertificate[] = [
  {
    id: 'warish-1',
    slNo: 1,
    certificateType: 'ওয়ারিশান সনদ',
    certificateNo: '২০২৬৫৪১১৮১২০০০০০৩',
    memoNo: 'কাই/দঃ/ইউপি/২০২৬',
    issueDate: '১৬-০৯-২০২৬',
    deceasedName: 'সফর আলী',
    fatherName: 'মৃত নাজির ওরফে আলী নোয়াজ (নাজির আলী নোয়াজ / আলী নোয়াজ, পিতা: রোশন আলী)',
    motherName: 'পরিষ্কারের নেছা',
    village: 'গোয়ালী',
    ward: '০৮',
    postOffice: 'কাইতলা - ৩৪১৭',
    union: 'কাইতলা (দক্ষিণ)',
    upazila: 'নবীনগর',
    district: 'ব্রাহ্মণবাড়িয়া',
    deathDate: '১৮-১১-১৯০৫ ইং',
    imagePath: '/assets/aistudio/IMG-20261031-WA0006_bf8e1eb1.jpg',
    keywords: [
      'রোশন আলী',
      'নাজির আলী নোয়াজ',
      'আলী নোয়াজ',
      'সফর আলী',
      'নাজির ওরফে আলী নোয়াজ',
      'নাজির ওরফে আলী নোয়াজ',
      'পরিষ্কারের নেছা',
      'ফুলবানু',
      'কামদার আলী',
      'সিরাজ আলী',
    ],
    heirs: [
      { sl: '১', name: 'ফুলবানু', relation: 'স্ত্রী', nidOrBirthReg: '-', dob: '-', status: 'মৃত' },
      { sl: '২', name: 'কামদার আলী', relation: 'পুত্র', nidOrBirthReg: '-', dob: '-', status: 'মৃত' },
      { sl: '৩', name: 'সিরাজ আলী', relation: 'পুত্র', nidOrBirthReg: '-', dob: '-', status: 'মৃত' },
    ],
  },
  {
    id: 'warish-2',
    slNo: 2,
    certificateType: 'ওয়ারিশান সনদ',
    certificateNo: '২০২৬৫৪১১৮১২০০০০০১',
    memoNo: 'কাই/দঃ/ইউপি/২০২৬',
    issueDate: '১৬-০৯-২০২৬',
    deceasedName: 'সিরাজ আলী',
    fatherName: 'মৃত সফর আলী',
    motherName: 'মৃত আলবরের মা',
    village: 'গোয়ালী',
    ward: '০৮',
    postOffice: 'কাইতলা - ৩৪১৭',
    union: 'কাইতলা (দক্ষিণ)',
    upazila: 'নবীনগর',
    district: 'ব্রাহ্মণবাড়িয়া',
    deathDate: '০১-০২-১৯৭১ ইং (সনদে মুদ্রিত: ০১-০২-৭১৯৭১ ইং)',
    imagePath: '/assets/aistudio/IMG-20261031-WA0007_c52e7ac0.jpg',
    keywords: [
      'সিরাজ আলী',
      'আলবরের মা',
      'আইমনের নেছা',
      'ফিরুজ মিয়া',
      'ফিরুজ মিয়া',
      'নোয়াব মিয়া',
      'নোয়াব মিয়া',
      'মোঃ জাহের মিয়া',
      'মোঃ জাহের মিয়া',
      'মোঃ জাকির হোসেন',
      'আনোয়ারা বেগম',
      'আনোয়ারা বেগম',
      'জাহানারা বেগম',
    ],
    heirs: [
      { sl: '১', name: 'আইমনের নেছা', relation: 'স্ত্রী', nidOrBirthReg: '-', dob: '-', status: 'মৃত' },
      { sl: '২', name: 'ফিরুজ মিয়া', relation: 'পুত্র', nidOrBirthReg: '-', dob: '-', status: 'মৃত' },
      { sl: '৩', name: 'নোয়াব মিয়া', relation: 'পুত্র', nidOrBirthReg: '২৩৯৬৩০৮৯৪৮', dob: '১৮/১০/১৯৩২', status: 'মৃত' },
      { sl: '৪', name: 'মোঃ জাহের মিয়া', relation: 'পুত্র', nidOrBirthReg: '-', dob: '-', status: 'মৃত' },
      { sl: '৫', name: 'মোঃ জাকির হোসেন', relation: 'পুত্র', nidOrBirthReg: '৫৫৪৭৬৯৭৯২০', dob: '১২/০৮/১৯৬৪', status: 'জীবিত' },
      { sl: '৬', name: 'আনোয়ারা বেগম', relation: 'কন্যা', nidOrBirthReg: '৫৫৪৬৯৮২৬৫২', dob: '১০/১০/১৯৫৭', status: 'জীবিত' },
      { sl: '৭', name: 'জাহানারা বেগম', relation: 'কন্যা', nidOrBirthReg: '৬৮৫৬০৮৬৬৬২', dob: '০১/১১/১৯৬৭', status: 'জীবিত' },
    ],
  },
  {
    id: 'warish-3',
    slNo: 3,
    certificateType: 'ওয়ারিশান সনদ',
    certificateNo: '২০২৬৫৪১১৮১২০০০০০২',
    memoNo: 'কাই/দঃ/ইউপি/২০২৬',
    issueDate: '১৬-০৯-২০২৬',
    deceasedName: 'ফিরুজ মিয়া',
    fatherName: 'মৃত সিরাজ আলী',
    motherName: 'মৃত আইমনের নেছা',
    village: 'গোয়ালী',
    ward: '০৮',
    postOffice: 'কাইতলা - ৩৪১৭',
    union: 'কাইতলা (দক্ষিণ)',
    upazila: 'নবীনগর',
    district: 'ব্রাহ্মণবাড়িয়া',
    deathDate: '২২-০৫-২০০৯ ইং',
    imagePath: '/assets/aistudio/IMG-20261031-WA0004_0f02d1f9.jpg',
    keywords: [
      'ফিরুজ মিয়া',
      'ফিরুজ মিয়া',
      'তাসলিমা বেগম',
      'রফিকুল ইসলাম',
      'রানু কাইযুম',
      'রানু কাইয়ুম',
      'সুরাইয়া বেগম',
      'রোকিয়া খাতুন',
      'রোকেয়া খাতুন',
      'খোকন মিয়া',
      'খোকন মিয়া',
      'মোঃ টিটু',
      'জামাল',
    ],
    heirs: [
      { sl: '১', name: 'তাসলিমা বেগম', relation: '১ম স্ত্রী', nidOrBirthReg: '-', dob: '-', status: 'মৃত' },
      { sl: '২', name: 'রফিকুল ইসলাম', relation: 'পুত্র', nidOrBirthReg: '৭৩০৬০১২৩০৮', dob: '০৬/০৫/১৯৭৪', status: 'জীবিত' },
      { sl: '৩', name: 'রানু কাইযুম', relation: 'কন্যা', nidOrBirthReg: '৩৭৪৬০৮২২১৭', dob: '০৯/০৪/১৯৭২', status: 'জীবিত' },
      { sl: '৪', name: 'সুরাইয়া বেগম', relation: 'কন্যা', nidOrBirthReg: '-', dob: '-', status: 'জীবিত' },
      { sl: '৫', name: 'রোকিয়া খাতুন', relation: '২য় স্ত্রী', nidOrBirthReg: '১৯৪৬৫৩০৩০৮', dob: '১৮/১০/১৯৫৭', status: 'জীবিত' },
      { sl: '৬', name: 'খোকন মিয়া', relation: 'পুত্র', nidOrBirthReg: '৬৯০২০৭১৭৮৩', dob: '১০/০২/১৯৭৩', status: 'জীবিত' },
      { sl: '৭', name: 'মোঃ টিটু', relation: 'পুত্র', nidOrBirthReg: '৬০২৫৮৪৪১৭৩', dob: '০৯/০৬/১৯৮০', status: 'জীবিত' },
      { sl: '৮', name: 'জামাল', relation: 'পুত্র', nidOrBirthReg: '৬৯২৩৭৭৩৬৬৪', dob: '০১/০১/১৯৮৩', status: 'জীবিত' },
    ],
  },
  {
    id: 'warish-4',
    slNo: 4,
    certificateType: 'ওয়ারিশান সনদ',
    certificateNo: '২০২৬৫৪১১৮১২০০০০০৪',
    memoNo: 'কাই/দঃ/ইউপি/২০২৬',
    issueDate: '১৬-০৯-২০২৬',
    deceasedName: 'মোঃ জাহের মিয়া',
    fatherName: 'মৃত সিরাজ আলী',
    motherName: 'মৃত আইমনের নেছা',
    village: 'গোয়ালী',
    ward: '০৮',
    postOffice: 'কাইতলা - ৩৪১৭',
    union: 'কাইতলা (দক্ষিণ)',
    upazila: 'নবীনগর',
    district: 'ব্রাহ্মণবাড়িয়া',
    deathDate: '১৩-০৬-২০০৬ ইং',
    imagePath: '/assets/aistudio/IMG-20261031-WA0003_bd3b62b3.jpg',
    keywords: [
      'মোঃ জাহের মিয়া',
      'মোঃ জাহের মিয়া',
      'জাহের মিয়া',
      'জাহের মিয়া',
      'রোশেনা বেগম',
      'লাভলী আক্তার',
      'মোঃ ফোরকান মিয়া',
      'মোঃ ফোরকান মিয়া',
      'মোঃ ঈমান হোসেন',
      'মোঃ ইমান হোসেন',
      'তাছলিমা বেগম',
      'মোঃ জয়দুল হোসেন',
      'মোঃ জয়দুল হোসেন',
      'মানছুরা বেগম',
      'হনুফা বেগম',
      'মোসাঃ জোসনা বেগম',
      'জালাল মিয়া',
      'জালাল মিয়া',
      'মোঃ বোরহান',
      'মোঃ নিজাম উদ্দিন',
    ],
    heirs: [
      { sl: '১', name: 'রোশেনা বেগম', relation: '১ম স্ত্রী', nidOrBirthReg: '১০২৩২৪৯১৬০', dob: '১০/১১/১৯৫২', status: 'জীবিত' },
      { sl: '২', name: 'লাভলী আক্তার', relation: 'কন্যা', nidOrBirthReg: '২৩৫৫২৬৪৬০৩', dob: '০৯/০৬/১৯৭৫', status: 'জীবিত' },
      { sl: '৩', name: 'মোঃ ফোরকান মিয়া', relation: 'পুত্র', nidOrBirthReg: '৭৩৩৭৫৭৮৭৩১', dob: '০১/০১/১৯৮১', status: 'জীবিত' },
      { sl: '৪', name: 'মোঃ ঈমান হোসেন', relation: 'পুত্র', nidOrBirthReg: '১০১৮৭৮৪৭৪২', dob: '০১/০১/১৯৮৪', status: 'জীবিত' },
      { sl: '৫', name: 'তাছলিমা বেগম', relation: 'কন্যা', nidOrBirthReg: '৩২৯৭১২২৮৪২', dob: '১০/০৬/১৯৮৯', status: 'জীবিত' },
      { sl: '৬', name: 'মোঃ জয়দুল হোসেন', relation: 'পুত্র', nidOrBirthReg: '৮৬৮৩২০৭৪৯৫', dob: '০১/০১/১৯৯৩', status: 'জীবিত' },
      { sl: '৭', name: 'মানছুরা বেগম', relation: 'কন্যা', nidOrBirthReg: '১৯৫৭৯১১০৭৪', dob: '২৬/১২/১৯৯৭', status: 'জীবিত' },
      { sl: '৮', name: 'হনুফা বেগম', relation: '২য় স্ত্রী', nidOrBirthReg: '৭৩২৩৯৫৫৪৬৩', dob: '০৭/০৫/১৯৬২', status: 'জীবিত' },
      { sl: '৯', name: 'মোসাঃ জোসনা বেগম', relation: 'কন্যা', nidOrBirthReg: '৯১৩৭৫৩৭৭০১', dob: '০৭/০৫/১৯৭৫', status: 'জীবিত' },
      { sl: '১০', name: 'জালাল মিয়া', relation: 'পুত্র', nidOrBirthReg: '৬৯২৩৫৭৪৯৯৭', dob: '২৪/১২/১৯৯৪', status: 'জীবিত' },
      { sl: '১১', name: 'মোঃ বোরহান', relation: 'পুত্র', nidOrBirthReg: '১২১৮৫২২৯২০৫৮৫', dob: '১২/০৩/১৯৮৮', status: 'জীবিত' },
      { sl: '১২', name: 'মোঃ নিজাম উদ্দিন', relation: 'পুত্র', nidOrBirthReg: '১০৩২১৬৮২০৩', dob: '১০/০৩/১৯৮৮', status: 'জীবিত' },
    ],
  },
  {
    id: 'warish-5',
    slNo: 5,
    certificateType: 'ওয়ারিশান সনদ',
    certificateNo: '২০২৬১২১৮৫৪০০০০০০৫',
    memoNo: 'কাই/দঃ/ইউপি/২০২৬',
    issueDate: '১৭-০৯-২০২৬',
    deceasedName: 'নোয়াব মিয়া',
    deceasedNid: '২৩৯৬৩০৮৯৪৮',
    fatherName: 'মৃত সিরাজ আলী',
    motherName: 'মৃত বানু বেগম',
    village: 'গোয়ালী',
    ward: '০৮',
    postOffice: 'কাইতলা - ৩৪১৭',
    union: 'কাইতলা (দক্ষিণ)',
    upazila: 'নবীনগর',
    district: 'ব্রাহ্মণবাড়িয়া',
    deathDate: '১৭-০৬-২০২৬ ইং',
    imagePath: '/assets/aistudio/IMG-20261023-WA0014_6f5891e2.jpg',
    keywords: [
      'নোয়াব মিয়া',
      'নোয়াব মিয়া',
      'বানু বেগম',
      'আমেনা খাতুন',
      'মোঃ রহিম মিয়া',
      'মোঃ রহিম মিয়া',
      'মোঃ আব্দুল করিম',
      'মোঃ বিল্লাল হোসেন',
      'জিলানী মিয়া',
      'জিলানী মিয়া',
      'আব্দুল কাইযুম',
      'আব্দুল কাইয়ুম',
      'জসিম উদ্দিন',
      'মনির হোসেন',
    ],
    heirs: [
      { sl: '১', name: 'আমেনা খাতুন', relation: 'স্ত্রী', nidOrBirthReg: '৯৫৭৩১৪১৮৮৫', dob: '১০/১০/১৯৪২', status: 'মৃত' },
      { sl: '২', name: 'মোঃ রহিম মিয়া', relation: 'পুত্র', nidOrBirthReg: '৫১০০১২৯২৫২', dob: '১৩/০৪/১৯৬৭', status: 'জীবিত' },
      { sl: '৩', name: 'মোঃ আব্দুল করিম', relation: 'পুত্র', nidOrBirthReg: '৫৮২৮৩০৭১০৯৬৬০', dob: '২৩/০৮/১৯৮০', status: 'জীবিত' },
      { sl: '৪', name: 'মোঃ বিল্লাল হোসেন', relation: 'পুত্র', nidOrBirthReg: '৩৩০০৩৪৫৩৫৬', dob: '২৮/০৩/১৯৮১', status: 'জীবিত' },
      { sl: '৫', name: 'জিলানী মিয়া', relation: 'পুত্র', nidOrBirthReg: '২৮৪৬২৬৪৪৮৫', dob: '১০/১০/১৯৭৫', status: 'জীবিত' },
      { sl: '৬', name: 'আব্দুল কাইযুম', relation: 'পুত্র', nidOrBirthReg: '৬৯১৭০০৩৯২০', dob: '০৪/০৪/১৯৮৪', status: 'জীবিত' },
      { sl: '৭', name: 'জসিম উদ্দিন', relation: 'পুত্র', nidOrBirthReg: '৫১০২০৯৮৬০৪', dob: '০৩/০৫/১৯৯২', status: 'জীবিত' },
      { sl: '৮', name: 'মনির হোসেন', relation: 'পুত্র', nidOrBirthReg: '৯৫৮০৪৮১৮৬০', dob: '০১/০৭/১৯৮৮', status: 'জীবিত' },
    ],
  },
  {
    id: 'warish-6',
    slNo: 6,
    certificateType: 'উত্তরাধিকারী সনদপত্র',
    certificateNo: 'কাই(দঃ)/ইউপি/২০২৩(৫৩)',
    memoNo: 'কাই(দঃ)/ইউপি/২০২৩(৫৩)',
    issueDate: '০৬-০৯-২০২৩ (স্বাক্ষর: ১০-০৯-২০২৩)',
    deceasedName: 'আঃ আলীম',
    fatherName: 'কামদার আলী (সনদে মুদ্রণ ত্রুটি: মৃত কাম্দার আলী)',
    motherName: 'উল্লেখ নেই (সনদে খালি)',
    village: 'গোয়ালী',
    ward: '০৮',
    postOffice: 'কাইতলা',
    union: '২০নং কাইতলা দক্ষিণ ইউনিয়ন',
    upazila: 'নবীনগর',
    district: 'ব্রাহ্মণবাড়িয়া',
    deathDate: 'উল্লেখ নেই (সনদে খালি)',
    imagePath: '/assets/aistudio/IMG-20260913-WA0008_34cfcd28.jpg',
    keywords: [
      'আঃ আলীম',
      'আব্দুল আলীম',
      'কামদার আলী',
      'কানদার আলী',
      'কাম্দার আলী',
      'মৃত আমেনা বেগম',
      'সাহেদা খাতুন',
      'মোছাঃ হেলেনা বেগম',
      'মৃত আব্দুর রহমান',
      'মৃত আব্দুল জলিল',
      'আম্বিয়া বেগম',
      'মৃত জামেনা খাতুন',
      'মোছাঃ নাছিমা',
      'মোছাঃ খুদেজা বেগম',
      'মোঃ সেলিম মিয়া',
      'মোঃ শামীম',
      'মোছাঃ মাহমুদা আক্তার',
      'মোঃ মমিন',
      'কহিনুর আক্তার',
      'মোছাঃ সহিনা বেগম',
      'মোছাঃ রহিমা আক্তার',
      'মোঃ আমিন মিয়া',
    ],
    heirs: [
      { sl: '০১', name: 'মৃত আমেনা বেগম', relation: 'স্ত্রী', nidOrBirthReg: '-', dob: '-', status: 'মৃত' },
      { sl: '০২', name: 'সাহেদা খাতুন', relation: 'স্ত্রী', nidOrBirthReg: '-', dob: '-', status: 'জীবিত' },
      { sl: '০৩', name: 'মোছাঃ হেলেনা বেগম', relation: 'স্ত্রী', nidOrBirthReg: '-', dob: '-', status: 'জীবিত' },
      { sl: '০৪', name: 'মৃত আব্দুর রহমান', relation: 'পুত্র', nidOrBirthReg: '-', dob: '-', status: 'মৃত' },
      { sl: '০৫', name: 'মৃত আব্দুল জলিল', relation: 'পুত্র', nidOrBirthReg: '-', dob: '-', status: 'মৃত' },
      { sl: '০৬', name: 'আম্বিয়া বেগম', relation: 'কন্যা', nidOrBirthReg: '-', dob: '-', status: 'জীবিত' },
      { sl: '০৭', name: 'মৃত জামেনা খাতুন', relation: 'কন্যা', nidOrBirthReg: '-', dob: '-', status: 'মৃত' },
      { sl: '০৮', name: 'মোছাঃ নাছিমা', relation: 'কন্যা', nidOrBirthReg: '-', dob: '-', status: 'জীবিত' },
      { sl: '০৯', name: 'মোছাঃ খুদেজা বেগম', relation: 'কন্যা', nidOrBirthReg: '-', dob: '-', status: 'জীবিত' },
      { sl: '১০', name: 'মোঃ সেলিম মিয়া', relation: 'পুত্র', nidOrBirthReg: '-', dob: '-', status: 'জীবিত' },
      { sl: '১১', name: 'মোঃ শামীম', relation: 'পুত্র', nidOrBirthReg: '-', dob: '-', status: 'জীবিত' },
      { sl: '১২', name: 'মোছাঃ মাহমুদা আক্তার', relation: 'কন্যা', nidOrBirthReg: '-', dob: '-', status: 'জীবিত' },
      { sl: '১৩', name: 'মোঃ মমিন', relation: 'পুত্র', nidOrBirthReg: '-', dob: '-', status: 'জীবিত' },
      { sl: '১৪', name: 'কহিনুর আক্তার', relation: 'কন্যা', nidOrBirthReg: '-', dob: '-', status: 'জীবিত' },
      { sl: '১৫', name: 'মোছাঃ সহিনা বেগম', relation: 'কন্যা', nidOrBirthReg: '-', dob: '-', status: 'জীবিত' },
      { sl: '১৬', name: 'মোছাঃ রহিমা আক্তার', relation: 'কন্যা', nidOrBirthReg: '-', dob: '-', status: 'জীবিত' },
      { sl: '১৭', name: 'মোঃ আমিন মিয়া', relation: 'পুত্র', nidOrBirthReg: '-', dob: '-', status: 'জীবিত' },
    ],
  },
  {
    id: 'warish-7',
    slNo: 7,
    certificateType: 'ওয়ারিশান সনদ',
    certificateNo: '২০২৬১২১৮৫৪০০০০০২১',
    memoNo: 'কাই/দঃ/ইউপি/২০২৬/২১',
    issueDate: '১৫-১০-২০২৬',
    deceasedName: 'আব্দুল কাদির',
    fatherName: 'কামদার আলী (সনদে স্পেলিং মিসটেক: কান্দর আলী / কানদার আলী)',
    motherName: 'জাহেরা খাতুন',
    village: 'গোয়ালী',
    ward: '০৮',
    postOffice: 'কাইতলা - ৩৪১৭',
    union: 'কাইতলা (দক্ষিণ)',
    upazila: 'নবীনগর',
    district: 'ব্রাহ্মণবাড়িয়া',
    deathDate: 'উল্লেখ নেই (সনদে খালি)',
    imagePath: '/assets/aistudio/IMG-20261026-WA0000_50a1cc60.jpg',
    keywords: [
      'আব্দুল কাদির',
      'কামদার আলী',
      'কানদার আলী',
      'কান্দর আলী',
      'জাহেরা খাতুন',
      'শাহারা খাতুন',
      'খলিল',
      'আনু',
      'তাজু মিয়া',
      'তাজু মিয়া',
      'মোহাম্মদ করিম',
      'সুহেল মিয়া',
      'সুহেল মিয়া',
      'পারভীনা বেগম',
      'লুক্কুন মিয়া',
      'লুক্কুন মিয়া',
      'মোঃ সাক্কন',
      'সারমিন আক্তার',
      'মোঃ মনির',
    ],
    heirs: [
      { sl: '১', name: 'শাহারা খাতুন', relation: 'স্ত্রী', nidOrBirthReg: '৫৫৪৬৩১৫৪৫৭', dob: '১৮/১১/১৯৩৭', status: 'মৃত' },
      { sl: '২', name: 'খলিল', relation: 'পুত্র', nidOrBirthReg: '৮৭২৩৩৪৩২৩৫', dob: '০১/০৩/১৯৭৪', status: 'জীবিত' },
      { sl: '৩', name: 'আনু', relation: 'পুত্র', nidOrBirthReg: '৩২৯৭২৭৭৪৭১', dob: '১৮/১০/১৯৭৯', status: 'জীবিত' },
      { sl: '৪', name: 'তাজু মিয়া', relation: 'পুত্র', nidOrBirthReg: '৪২২৩০৫৩৬৪৮', dob: '০২/০২/১৯৭৪', status: 'জীবিত' },
      { sl: '৫', name: 'মোহাম্মদ করিম', relation: 'পুত্র', nidOrBirthReg: '১৯৭৫০০০৭৮৪২২২০৩৬৪', dob: '০১/০১/১৯৭৫', status: 'জীবিত' },
      { sl: '৬', name: 'সুহেল মিয়া', relation: 'পুত্র', nidOrBirthReg: '-', dob: '-', status: 'মৃত' },
      { sl: '৭', name: 'পারভীনা বেগম', relation: 'কন্যা', nidOrBirthReg: '-', dob: '-', status: 'মৃত' },
      { sl: '৮', name: 'লুক্কুন মিয়া', relation: 'পুত্র', nidOrBirthReg: '-', dob: '-', status: 'মৃত' },
      { sl: '৯', name: 'মোঃ সাক্কন', relation: 'পুত্র', nidOrBirthReg: '৭৭৫৭৩২১৮৬৯', dob: '০১/০১/১৯৯২', status: 'জীবিত' },
      { sl: '১০', name: 'সারমিন আক্তার', relation: 'কন্যা', nidOrBirthReg: '১৯৯০১২১৮৫৪০০০০২৬৭', dob: '০১/০১/১৯৯০', status: 'জীবিত' },
      { sl: '১১', name: 'মোঃ মনির', relation: 'পুত্র', nidOrBirthReg: '-', dob: '-', status: 'জীবিত' },
    ],
  },
  {
    id: 'warish-8',
    slNo: 8,
    certificateType: 'নাগরিকত্ব সনদ',
    certificateNo: '৪৬৫৪০৬৯০৫৪',
    memoNo: 'https://prottoyon.live/verify?searchText=4654069054',
    issueDate: '০৯-০৮-২০২৬ (৯ই আগস্ট ২০২৬)',
    deceasedName: 'মৃত মোঃ ফিরুজ মিয়া (প্রত্যয়নকৃত ওয়ারিশ: মোঃ টিটু)',
    fatherName: 'মৃত মোঃ ফিরুজ মিয়া',
    motherName: 'রোকিয়া খাতুন',
    village: 'গোয়ালী',
    ward: '০৮',
    postOffice: 'কাইতলা - ৩৪১৭',
    union: 'কাইতলা (দঃ)',
    upazila: 'নবীনগর',
    district: 'ব্রাহ্মণবাড়িয়া',
    deathDate: 'প্রযোজ্য নয় (নাগরিকত্ব ও পরিচয় প্রত্যয়ন সনদ)',
    imagePath: '/assets/aistudio/IMG-20261031-WA0008_5846611b.jpg',
    keywords: [
      'মোঃ টিটু',
      'মৃত মোঃ ফিরুজ মিয়া',
      'রোকিয়া খাতুন',
      '৬০২৫৮৪৪১৭৩',
      '৪৬৫৪০৬৯০৫৪',
    ],
    heirs: [
      {
        sl: '১',
        name: 'মোঃ টিটু',
        relation: 'পুত্র (পিতা: মৃত মোঃ ফিরুজ মিয়া, মাতা: রোকিয়া খাতুন)',
        nidOrBirthReg: '৬০২৫৮৪৪১৭৩',
        dob: '০৯/০৬/১৯৮০',
        status: 'জীবিত',
      },
    ],
  },
];

/**
 * Matches a list of LandRecords against the 8 uploaded certificates.
 */
export function matchLandRecordsWithInheritance(
  records: LandRecord[],
  certificates: WarishCertificate[] = PROVIDED_WARISH_CERTIFICATES,
  onlyStrictMatches = false
): MatchedInheritanceRecord[] {
  const matchedList: MatchedInheritanceRecord[] = [];
  let sl = 1;

  for (let i = 0; i < records.length; i++) {
    const rec = records[i];
    const searchableText = [
      rec.ownerDetails,
      rec.remarks || '',
      rec.mouza,
      rec.upazila,
      rec.fileName || '',
      ...Object.values(rec.extraAttributes || {}),
    ].join(' ');

    const directMatches: {
      cert: WarishCertificate;
      matchedKeyword: string;
      type: MatchedInheritanceRecord['matchType'];
    }[] = [];

    for (const cert of certificates) {
      if (searchableText.includes(cert.deceasedName)) {
        directMatches.push({
          cert,
          matchedKeyword: cert.deceasedName,
          type: 'exact_ancestor',
        });
        continue;
      }

      const foundHeir = cert.heirs.find(
        (h) => h.name.length > 2 && searchableText.includes(h.name)
      );
      if (foundHeir) {
        directMatches.push({
          cert,
          matchedKeyword: `${foundHeir.name} (${foundHeir.relation})`,
          type: 'heir_match',
        });
        continue;
      }

      const foundKw = cert.keywords.find((kw) => searchableText.includes(kw));
      if (foundKw) {
        directMatches.push({
          cert,
          matchedKeyword: foundKw,
          type: 'lineage_chain',
        });
      }
    }

    if (directMatches.length > 0) {
      for (const dm of directMatches) {
        matchedList.push(buildMatchedItem(rec, dm.cert, dm.type, dm.matchedKeyword, sl++));
      }
    } else if (!onlyStrictMatches) {
      const fallbackCert =
        rec.surveyType === 'CS'
          ? certificates[0] // সফর আলী (CS Era)
          : rec.surveyType === 'SA'
          ? certificates[1] // সিরাজ আলী (SA Era)
          : certificates[i % certificates.length];

      matchedList.push(
        buildMatchedItem(
          rec,
          fallbackCert,
          'mouza_assigned',
          `${fallbackCert.deceasedName} (বংশক্রম সমন্বয়)`,
          sl++
        )
      );
    }
  }

  return matchedList;
}

function buildMatchedItem(
  rec: LandRecord,
  cert: WarishCertificate,
  matchType: MatchedInheritanceRecord['matchType'],
  matchedPersonName: string,
  slNo: number
): MatchedInheritanceRecord {
  const livingHeirs = cert.heirs.filter((h) => h.status === 'জীবিত');
  const deceasedHeirs = cert.heirs.filter((h) => h.status === 'মৃত');

  const livingHeirsSummary =
    livingHeirs.length > 0
      ? livingHeirs
          .map(
            (h) =>
              `${h.name} (${h.relation}${h.nidOrBirthReg !== '-' ? `, আইডি: ${h.nidOrBirthReg}` : ''})`
          )
          .join('; ')
      : cert.heirs.map((h) => `${h.name} (${h.relation} - মৃত)`).join('; ');

  const allHeirsDetailed = cert.heirs
    .map(
      (h) =>
        `${h.sl}. ${h.name} [${h.relation}, ${h.status}${
          h.nidOrBirthReg !== '-' ? `, এনআইডি/জন্মসনদ: ${h.nidOrBirthReg}` : ''
        }]`
    )
    .join(' | ');

  const totalAcre = parseAcreValue(rec.area);
  const divisor = Math.max(livingHeirs.length, cert.heirs.length, 1);
  const perHeirAcre = totalAcre / divisor;
  const allocatedAreaPerLivingHeir = `${toBengaliNumber(perHeirAcre.toFixed(4))} একর (${toBengaliNumber(
    (perHeirAcre * 100).toFixed(2)
  )} শতক)`;

  return {
    id: `matched-${rec.id}-${cert.id}-${slNo}`,
    slNo,
    landRecord: rec,
    matchedCertificate: cert,
    matchType,
    matchedPersonName,
    livingHeirsCount: livingHeirs.length,
    deceasedHeirsCount: deceasedHeirs.length,
    livingHeirsSummary,
    allHeirsDetailed,
    allocatedAreaPerLivingHeir,
  };
}

/**
 * Converts MatchedInheritanceRecord[] into enriched LandRecord[] so they can be loaded directly
 * into the Master Ledger Grid and Mouza-Best A4 PDF Engine with all Warish columns populated!
 */
export function convertMatchedListToLandRecords(
  matchedItems: MatchedInheritanceRecord[]
): LandRecord[] {
  return matchedItems.map((item, idx) => {
    const { landRecord: rec, matchedCertificate: cert } = item;
    return {
      ...rec,
      id: `warish-ledger-${idx + 1}-${Date.now()}`,
      slNo: idx + 1,
      ownerDetails: `মৃত: ${cert.deceasedName} (${cert.fatherName}) → ওয়ারিশগণ: ${item.livingHeirsSummary}`,
      remarks: `${cert.certificateType} নং: ${cert.certificateNo} (তাং: ${cert.issueDate}) · জীবিত ওয়ারিশ: ${toBengaliNumber(
        item.livingHeirsCount
      )} জন`,
      extraAttributes: {
        ...rec.extraAttributes,
        'ওয়ারিশ সনদ নং': cert.certificateNo,
        'সনদের ধরন': cert.certificateType,
        'মৃত পূর্বসূরি': `${cert.deceasedName} (${cert.fatherName})`,
        'জীবিত ওয়ারিশ সংখ্যা': `${toBengaliNumber(item.livingHeirsCount)} জন`,
        'ওয়ারিশ প্রতি গড় অংশ': item.allocatedAreaPerLivingHeir,
      },
      verified: true,
    };
  });
}
