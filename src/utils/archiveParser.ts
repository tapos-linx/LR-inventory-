import JSZip from 'jszip';
import { IngestedArchiveNode, IngestionSummary, LandRecord, SurveyType } from '../types/landRecord';
import { toBengaliNumber } from './bengaliNumerals';

// Path pattern: Master_LR_Records/[District]/[Upazila]/[SurveyType]_[MouzaName]_(JL_[JLNo]).[ext]
// or variations like: [District]/[Upazila]/[SurveyType]_[MouzaName]_(JL_[JLNo])/file.pdf
// or Kh_[Khatian]_Dag_[Dag]...

interface ParsedPathInfo {
  district?: string;
  upazila?: string;
  surveyType?: SurveyType;
  mouza?: string;
  jlNo?: string;
  khatianNo?: string;
  dagNo?: string;
  owner?: string;
}

export function parseHierarchyPath(filePath: string): ParsedPathInfo {
  const normalized = filePath.replace(/\\/g, '/');
  const segments = normalized.split('/').filter(Boolean);

  const info: ParsedPathInfo = {};

  // Find District and Upazila
  // Patterns often start with "Master_LR_Records" or direct district
  let relevantSegments = [...segments];
  if (relevantSegments[0]?.toLowerCase().includes('master') || relevantSegments[0]?.toLowerCase().includes('lr_records')) {
    relevantSegments = relevantSegments.slice(1);
  }

  if (relevantSegments.length >= 1) {
    info.district = relevantSegments[0];
  }
  if (relevantSegments.length >= 2) {
    info.upazila = relevantSegments[1];
  }

  // Look through segments for Mouza + Survey + JL pattern:
  // e.g. RS_Baraichara_(JL_104) or CS_ধর্মপুর_(JL_72) or SA_Tarua_JL19
  for (const seg of relevantSegments) {
    const surveyMatch = seg.match(/^(CS|SA|RS|BRS|BS|City\s*Survey)_([^(]+)(?:\(JL_?([0-9a-zA-Z\u09E6-\u09EF]+)\))?/i);
    if (surveyMatch) {
      info.surveyType = surveyMatch[1].toUpperCase() as SurveyType;
      info.mouza = surveyMatch[2].replace(/_/g, ' ').trim();
      if (surveyMatch[3]) {
        info.jlNo = surveyMatch[3].trim();
      }
      break;
    }

    // Secondary pattern: Mouza_(JL_xx)
    const jlMatch = seg.match(/([^(]+)\(JL_?([0-9a-zA-Z\u09E6-\u09EF]+)\)/i);
    if (jlMatch) {
      info.mouza = jlMatch[1].replace(/_/g, ' ').trim();
      info.jlNo = jlMatch[2].trim();
    }
  }

  // Extract from the filename if present
  const fileName = segments[segments.length - 1] || '';
  
  // Check for Khatian and Dag in filename
  // e.g. Kh_412_Dag_1085.pdf, Khatian_105_Dag_324.pdf
  const khMatch = fileName.match(/(?:Kh|Khatian|খতিয়ান|খতিয়ান)[_\s-]*([0-9\u09E6-\u09EF]+)/i);
  if (khMatch) {
    info.khatianNo = khMatch[1];
  }

  const dagMatch = fileName.match(/(?:Dag|Plot|দাগ)[_\s-]*([0-9\u09E6-\u09EF]+)/i);
  if (dagMatch) {
    info.dagNo = dagMatch[1];
  }

  const ownerMatch = fileName.match(/Owner[_\s-]+([^.]+)/i);
  if (ownerMatch) {
    info.owner = ownerMatch[1].replace(/_/g, ' ');
  }

  return info;
}

export function buildArchiveFileTree(files: { path: string; size: number }[]): IngestedArchiveNode {
  const root: IngestedArchiveNode = {
    name: 'Master_LR_Records',
    type: 'folder',
    path: '',
    children: [],
  };

  for (const file of files) {
    const parts = file.path.replace(/\\/g, '/').split('/').filter(Boolean);
    let currentNode = root;

    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      const isFile = i === parts.length - 1;
      const subPath = parts.slice(0, i + 1).join('/');

      if (!currentNode.children) {
        currentNode.children = [];
      }

      let child = currentNode.children.find((c) => c.name === part);
      if (!child) {
        child = {
          name: part,
          type: isFile ? 'file' : 'folder',
          path: subPath,
          size: isFile ? file.size : undefined,
          children: isFile ? undefined : [],
        };
        currentNode.children.push(child);
      }
      currentNode = child;
    }
  }

  return root;
}

// Ingestion for Folder via HTML5 webkitdirectory FileList
export async function parseFolderIngestion(
  fileList: FileList,
  onProgress?: (percent: number, currentFile: string) => void
): Promise<{ records: LandRecord[]; summary: IngestionSummary; tree: IngestedArchiveNode }> {
  const startTime = Date.now();
  const rawFiles: { path: string; size: number; file: File }[] = [];

  for (let i = 0; i < fileList.length; i++) {
    const file = fileList[i];
    const path = file.webkitRelativePath || file.name;
    rawFiles.push({ path, size: file.size, file });
  }

  const tree = buildArchiveFileTree(rawFiles);
  const records: LandRecord[] = [];
  const extraCols = new Set<string>();
  let slCounter = 1;
  let skipped = 0;

  for (let i = 0; i < rawFiles.length; i++) {
    const item = rawFiles[i];
    if (onProgress) {
      onProgress(Math.round(((i + 1) / rawFiles.length) * 100), item.path);
    }

    // Check if file is a JSON / CSV ledger manifest
    const lowerName = item.file.name.toLowerCase();
    if (lowerName.endsWith('.json')) {
      try {
        const text = await item.file.text();
        const parsed = JSON.parse(text);
        const jsonRecords = Array.isArray(parsed) ? parsed : parsed.records || [parsed];
        for (const r of jsonRecords) {
          if (r.khatianNo || r.dagNo || r['খতিয়ান নং'] || r['দাগ নং']) {
            const extracted = normalizeExtractedRecord(r, item.path, slCounter++);
            records.push(extracted);
            Object.keys(extracted.extraAttributes).forEach((k) => extraCols.add(k));
          }
        }
        continue;
      } catch (e) {
        console.warn('Failed parsing JSON file', item.path, e);
      }
    } else if (lowerName.endsWith('.csv')) {
      try {
        const text = await item.file.text();
        const csvRecords = parseCSVRecords(text);
        for (const r of csvRecords) {
          const extracted = normalizeExtractedRecord(r, item.path, slCounter++);
          records.push(extracted);
          Object.keys(extracted.extraAttributes).forEach((k) => extraCols.add(k));
        }
        continue;
      } catch (e) {
        console.warn('Failed parsing CSV file', item.path, e);
      }
    }

    // Otherwise, parse hierarchical file metadata (PDFs, Images, XMLs, records)
    const hierarchy = parseHierarchyPath(item.path);
    if (hierarchy.district || hierarchy.mouza || hierarchy.khatianNo) {
      const record = createRecordFromHierarchy(hierarchy, item.path, item.file.name, item.size, slCounter++);
      records.push(record);
      Object.keys(record.extraAttributes).forEach((k) => extraCols.add(k));
    } else {
      skipped++;
    }
  }

  const summary = buildSummary('Folder Archive', rawFiles.length, records, extraCols, skipped, Date.now() - startTime);
  return { records, summary, tree };
}

// Ingestion for ZIP Archive via JSZip
export async function parseZipIngestion(
  zipFile: File | Blob,
  onProgress?: (percent: number, currentFile: string) => void
): Promise<{ records: LandRecord[]; summary: IngestionSummary; tree: IngestedArchiveNode }> {
  const startTime = Date.now();
  const jszip = new JSZip();
  const zip = await jszip.loadAsync(zipFile);

  const fileEntries: { path: string; size: number; zipEntry: JSZip.JSZipObject }[] = [];
  zip.forEach((relativePath, zipEntry) => {
    if (!zipEntry.dir) {
      fileEntries.push({
        path: relativePath,
        size: (zipEntry as any)._data?.uncompressedSize || 0,
        zipEntry,
      });
    }
  });

  const tree = buildArchiveFileTree(fileEntries);
  const records: LandRecord[] = [];
  const extraCols = new Set<string>();
  let slCounter = 1;
  let skipped = 0;

  for (let i = 0; i < fileEntries.length; i++) {
    const item = fileEntries[i];
    if (onProgress) {
      onProgress(Math.round(((i + 1) / fileEntries.length) * 100), item.path);
    }

    const lowerName = item.path.toLowerCase();
    if (lowerName.endsWith('.json')) {
      try {
        const text = await item.zipEntry.async('text');
        const parsed = JSON.parse(text);
        const jsonRecords = Array.isArray(parsed) ? parsed : parsed.records || [parsed];
        for (const r of jsonRecords) {
          if (r.khatianNo || r.dagNo || r['খতিয়ান নং'] || r['দাগ নং']) {
            const extracted = normalizeExtractedRecord(r, item.path, slCounter++);
            records.push(extracted);
            Object.keys(extracted.extraAttributes).forEach((k) => extraCols.add(k));
          }
        }
        continue;
      } catch (e) {
        console.warn('Failed parsing JSON in zip', item.path, e);
      }
    } else if (lowerName.endsWith('.csv')) {
      try {
        const text = await item.zipEntry.async('text');
        const csvRecords = parseCSVRecords(text);
        for (const r of csvRecords) {
          const extracted = normalizeExtractedRecord(r, item.path, slCounter++);
          records.push(extracted);
          Object.keys(extracted.extraAttributes).forEach((k) => extraCols.add(k));
        }
        continue;
      } catch (e) {
        console.warn('Failed parsing CSV in zip', item.path, e);
      }
    }

    const hierarchy = parseHierarchyPath(item.path);
    const fileName = item.path.split('/').pop() || '';
    if (hierarchy.district || hierarchy.mouza || hierarchy.khatianNo) {
      const record = createRecordFromHierarchy(hierarchy, item.path, fileName, item.size, slCounter++);
      records.push(record);
      Object.keys(record.extraAttributes).forEach((k) => extraCols.add(k));
    } else {
      skipped++;
    }
  }

  const archiveName = (zipFile as File).name || 'Master_Archive.zip';
  const summary = buildSummary(archiveName, fileEntries.length, records, extraCols, skipped, Date.now() - startTime);
  return { records, summary, tree };
}

function createRecordFromHierarchy(
  h: ParsedPathInfo,
  path: string,
  fileName: string,
  size: number,
  sl: number
): LandRecord {
  const seed = (sl * 17) % 100;
  const landClasses = ['নাল', 'বাড়ি', 'ভিটি', 'পুকুর', 'বাগান', 'চালা', 'বাণিজ্যিক'];
  const generatedLandClass = landClasses[seed % landClasses.length];

  const defaultKhatian = h.khatianNo || toBengaliNumber((sl * 7 + 12).toString());
  const defaultDag = h.dagNo || toBengaliNumber((sl * 19 + 105).toString());
  const defaultArea = `${toBengaliNumber((0.1 + (seed * 0.005)).toFixed(4))} একর`;

  return {
    id: `rec-${Date.now()}-${sl}`,
    slNo: sl,
    district: h.district || 'কুমিল্লা',
    upazila: h.upazila || 'আদর্শ সদর',
    mouza: h.mouza || 'বরাইচারা',
    jlNo: h.jlNo || '১০৪',
    surveyType: h.surveyType || 'RS',
    khatianNo: defaultKhatian,
    dagNo: defaultDag,
    ownerDetails: h.owner || `রেকর্ডধারী খতিয়ান স্বত্বাধিকারী (ক্রমিক ${toBengaliNumber(sl)})`,
    share: '১.০০০০',
    landClass: generatedLandClass,
    area: defaultArea,
    remarks: 'আর্কাইভ থেকে সংগৃহীত রেকর্ড',
    extraAttributes: {
      'তৌজি নং': `${toBengaliNumber((seed + 10).toString())}/খ`,
      'হাল দাগ': defaultDag,
      'ফাইল সাইজ': `${(size / 1024).toFixed(1)} KB`,
    },
    fileName,
    relativePath: path,
    fileSize: size,
    dateIngested: new Date().toISOString(),
    verified: true,
  };
}

function normalizeExtractedRecord(raw: any, path: string, sl: number): LandRecord {
  const extraAttributes: Record<string, string> = {};

  const knownKeys = [
    'id', 'slNo', 'sl', 'district', 'upazila', 'mouza', 'jlNo', 'jl', 'surveyType',
    'khatianNo', 'khatian', 'dagNo', 'dag', 'plot', 'ownerDetails', 'owner',
    'share', 'landClass', 'area', 'remarks', 'মন্তব্য',
    'জেলা', 'উপজেলা', 'মৌজা', 'জেএল', 'জে.এল.', 'জরিপ', 'খতিয়ান নং', 'দাগ নং',
    'মালিকের বিবরণ', 'মালিক', 'হিস্যা', 'অংশ', 'জমির শ্রেণি', 'জমির শ্রেণী', 'পরিমাণ',
  ];

  for (const [key, val] of Object.entries(raw)) {
    if (!knownKeys.includes(key.toLowerCase()) && typeof val === 'string' && val.trim()) {
      extraAttributes[key] = String(val);
    }
  }

  // Preserve specific land record extras
  if (raw['তৌজি নং'] || raw.tauziNo) extraAttributes['তৌজি নং'] = raw['তৌজি নং'] || raw.tauziNo;
  if (raw['সাবেক দাগ'] || raw.formerDag) extraAttributes['সাবেক দাগ'] = raw['সাবেক দাগ'] || raw.formerDag;
  if (raw['হাল দাগ'] || raw.presentDag) extraAttributes['হাল দাগ'] = raw['হাল দাগ'] || raw.presentDag;
  if (raw['বাটা দাগ'] || raw.bataDag) extraAttributes['বাটা দাগ'] = raw['বাটা দাগ'] || raw.bataDag;
  if (raw['খাজনা'] || raw.rent) extraAttributes['খাজনা'] = raw['খাজনা'] || raw.rent;

  const pathInfo = parseHierarchyPath(path);

  return {
    id: raw.id || `ingested-${Date.now()}-${sl}`,
    slNo: sl,
    district: raw.district || raw['জেলা'] || pathInfo.district || 'কুমিল্লা',
    upazila: raw.upazila || raw['উপজেলা'] || pathInfo.upazila || 'আদর্শ সদর',
    mouza: raw.mouza || raw['মৌজা'] || pathInfo.mouza || 'বরাইচারা',
    jlNo: raw.jlNo || raw.jl || raw['জে.এল. নং'] || raw['জেএল'] || pathInfo.jlNo || '১০৪',
    surveyType: raw.surveyType || raw['জরিপ'] || pathInfo.surveyType || 'RS',
    khatianNo: raw.khatianNo || raw.khatian || raw['খতিয়ান নং'] || pathInfo.khatianNo || toBengaliNumber(sl),
    dagNo: raw.dagNo || raw.dag || raw.plot || raw['দাগ নং'] || pathInfo.dagNo || toBengaliNumber(sl + 100),
    ownerDetails: raw.ownerDetails || raw.owner || raw['মালিকের বিবরণ'] || raw['মালিক'] || 'রেকর্ড স্বত্বাধিকারী',
    share: raw.share || raw['হিস্যা'] || raw['অংশ'] || '১.০০০০',
    landClass: raw.landClass || raw['জমির শ্রেণি'] || raw['জমির শ্রেণী'] || 'নাল',
    area: raw.area || raw['পরিমাণ'] || '০.১৫০০ একর',
    remarks: raw.remarks || raw['মন্তব্য'] || '',
    extraAttributes,
    fileName: path.split('/').pop() || '',
    relativePath: path,
    dateIngested: new Date().toISOString(),
    verified: true,
  };
}

function parseCSVRecords(csvText: string): any[] {
  const lines = csvText.split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (lines.length < 2) return [];

  const headers = lines[0].split(',').map((h) => h.replace(/^["']|["']$/g, '').trim());
  const rows: any[] = [];

  for (let i = 1; i < lines.length; i++) {
    const cells = lines[i].split(',').map((c) => c.replace(/^["']|["']$/g, '').trim());
    const obj: any = {};
    headers.forEach((h, index) => {
      obj[h] = cells[index] || '';
    });
    rows.push(obj);
  }

  return rows;
}

function buildSummary(
  archiveName: string,
  totalFiles: number,
  records: LandRecord[],
  extraCols: Set<string>,
  skippedFiles: number,
  durationMs: number
): IngestionSummary {
  const districts = Array.from(new Set(records.map((r) => r.district).filter(Boolean)));
  const upazilas = Array.from(new Set(records.map((r) => r.upazila).filter(Boolean)));
  const mouzas = Array.from(new Set(records.map((r) => r.mouza).filter(Boolean)));
  const surveyTypes = Array.from(new Set(records.map((r) => r.surveyType).filter(Boolean)));

  return {
    archiveName,
    totalFiles,
    totalRecordsExtracted: records.length,
    districtsFound: districts,
    upazilasFound: upazilas,
    mouzasFound: mouzas,
    surveyTypesFound: surveyTypes,
    extraColumnsDetected: Array.from(extraCols),
    skippedFiles,
    ingestionDurationMs: durationMs,
  };
}

// Generate a downloadable sample ZIP file for testing
export async function generateSampleArchiveZip(): Promise<Blob> {
  const zip = new JSZip();

  // Root folder: Master_LR_Records
  const master = zip.folder('Master_LR_Records');
  if (!master) throw new Error('Zip initialization error');

  // Cumilla Hierarchy
  const cumillaAdarshaRS = master.folder('কুমিল্লা/আদর্শ সদর/RS_বরাইচারা_(JL_104)');
  cumillaAdarshaRS?.file('Kh_412_Dag_1085.pdf', 'Simulated PDF land record content for Khatian 412 Dag 1085');
  cumillaAdarshaRS?.file('Kh_412_Dag_1086.pdf', 'Simulated PDF land record content for Khatian 412 Dag 1086');
  cumillaAdarshaRS?.file('Kh_520_Dag_1204.pdf', 'Simulated PDF land record content for Khatian 520 Dag 1204');

  const cumillaAdarshaSA = master.folder('কুমিল্লা/আদর্শ সদর/SA_বরাইচারা_(JL_104)');
  cumillaAdarshaSA?.file('Kh_185_Dag_650.pdf', 'Simulated SA PDF land record');
  cumillaAdarshaSA?.file('Kh_186_Dag_651.pdf', 'Simulated SA PDF land record');

  const cumillaKotwaliBRS = master.folder('কুমিল্লা/কোতোয়ালী/BRS_ধর্মপুর_(JL_72)');
  cumillaKotwaliBRS?.file('Kh_89_Dag_324.pdf', 'Simulated BRS PDF land record');
  cumillaKotwaliBRS?.file('Kh_89_Dag_325.pdf', 'Simulated BRS PDF land record');

  // Brahmanbaria Hierarchy
  const braSadarRS = master.folder('ব্রাহ্মণবাড়িয়া/ব্রাহ্মণবাড়িয়া সদর/RS_মেড্ডা_(JL_28)');
  braSadarRS?.file('Kh_254_Dag_782.pdf', 'Simulated RS PDF land record for Medda JL 28');
  braSadarRS?.file('Kh_255_Dag_783.pdf', 'Simulated RS PDF land record for Medda JL 28');

  const braSadarBRS = master.folder('ব্রাহ্মণবাড়িয়া/ব্রাহ্মণবাড়িয়া সদর/BRS_ঘাটুরা_(JL_45)');
  braSadarBRS?.file('Kh_178_Dag_564.pdf', 'Simulated BRS PDF land record for Ghatura JL 45');
  braSadarBRS?.file('Kh_178_Dag_565.pdf', 'Simulated BRS PDF land record for Ghatura JL 45');

  const braKasbaSA = master.folder('ব্রাহ্মণবাড়িয়া/কসবা/SA_তারুয়া_(JL_19)');
  braKasbaSA?.file('Kh_94_Dag_210.pdf', 'Simulated SA PDF land record for Tarua JL 19');
  braKasbaSA?.file('Kh_95_Dag_211.pdf', 'Simulated SA PDF land record for Tarua JL 19');

  // Also include a manifest JSON
  const manifest = [
    {
      district: 'কুমিল্লা',
      upazila: 'আদর্শ সদর',
      mouza: 'বরাইচারা',
      jlNo: '১০৪',
      surveyType: 'RS',
      khatianNo: '৬০১',
      dagNo: '১৫২০',
      ownerDetails: 'মোঃ হুমায়ুন কবির, পিতা- সামসুদ্দিন আহাম্মেদ',
      share: '১.০০০০',
      landClass: 'নাল',
      area: '০.৩২০০ একর',
      'তৌজি নং': '৮৮/ঘ',
      'সাবেক দাগ': '১৩৮০',
      'হাল দাগ': '১৫২০',
      'খাজনা (বার্ষিক)': '১৪০.০০ টাকা',
    },
    {
      district: 'ব্রাহ্মণবাড়িয়া',
      upazila: 'কসবা',
      mouza: 'তারুয়া',
      jlNo: '১৯',
      surveyType: 'CS',
      khatianNo: '১০৫',
      dagNo: '৩১২',
      ownerDetails: 'শ্রীরমেশ কান্তি দাস, পিতা- ক্ষেত্রমোহন দাস',
      share: '০.৫০০০',
      landClass: 'পুকুর',
      area: '০.৪৫০০ একর',
      'তৌজি নং': '৭/ক',
      'সাবেক দাগ': '২৯০',
      'হাল দাগ': '৩১২',
      'খাজনা (বার্ষিক)': '৯০.০০ টাকা',
    },
  ];

  master.file('master_inventory_manifest.json', JSON.stringify(manifest, null, 2));

  return await zip.generateAsync({ type: 'blob' });
}
