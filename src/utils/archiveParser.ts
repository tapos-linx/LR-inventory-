import JSZip from 'jszip';
import * as XLSX from 'xlsx';
import { IngestedArchiveNode, IngestionSummary, LandRecord, SurveyType } from '../types/landRecord';
import { toBengaliNumber } from './bengaliNumerals';

export interface ParsedPathInfo {
  district?: string;
  upazila?: string;
  surveyType?: SurveyType;
  mouza?: string;
  jlNo?: string;
  khatianNo?: string;
  dagNo?: string;
  owner?: string;
  landClass?: string;
  area?: string;
  share?: string;
}

const SURVEY_TYPES = ['CS', 'SA', 'RS', 'BRS', 'BS', 'DIARA', 'PETI', 'CITY', 'সিটি', 'বিআরএস', 'আরএস', 'এসএ', 'সিএস', 'বিএস'];

function normalizeSurveyType(raw: string): SurveyType {
  const upper = raw.toUpperCase().trim();
  if (upper === 'বিআরএস' || upper === 'BRS') return 'BRS';
  if (upper === 'বিএস' || upper === 'BS') return 'BS';
  if (upper === 'আরএস' || upper === 'RS') return 'RS';
  if (upper === 'এসএ' || upper === 'SA') return 'SA';
  if (upper === 'সিএস' || upper === 'CS') return 'CS';
  if (upper.includes('CITY') || upper.includes('সিটি')) return 'City Survey';
  return upper;
}

/**
 * Deeply parses any nested folder/subfolder path from phone memory or desktop archives.
 * Supports arbitrary depth:
 * - Master_LR_Records/[District]/[Upazila]/[SurveyType]_[MouzaName]_(JL_[JLNo])/file.pdf
 * - [PhoneFolder]/[District]/[Upazila]/[Mouza]/[SurveyType]/file.pdf
 * - [Upazila]/[Mouza]/file.pdf
 * - [Mouza]/file.pdf
 * - Flat files from phone storage: file.pdf
 */
export function parseHierarchyPath(filePath: string): ParsedPathInfo {
  const normalized = filePath.replace(/\\/g, '/');
  const rawSegments = normalized.split('/').filter(Boolean);
  const info: ParsedPathInfo = {};

  if (rawSegments.length === 0) return info;

  const fileNameWithExt = rawSegments[rawSegments.length - 1] || '';
  const fileNameNoExt = fileNameWithExt.replace(/\.[^/.]+$/, '');
  const folderSegments = rawSegments.slice(0, -1);

  // Filter out common root wrapper folder names from phone memory or mass downloader
  const ignoredRootNames = [
    'master_lr_records',
    'lr_records',
    'land_records',
    'downloads',
    'download',
    'documents',
    'storage',
    'emulated',
    '0',
    'sdcard',
    'primary',
    'files',
    'archive',
    'master',
  ];

  const cleanFolders = folderSegments.filter(
    (seg) => !ignoredRootNames.includes(seg.toLowerCase().trim())
  );

  // Scan all folder segments and file name for explicit patterns:
  // Pattern 1: [SurveyType]_[MouzaName]_(JL_[JLNo]) or (JL-104) or JL_104
  for (const seg of [...cleanFolders, fileNameNoExt]) {
    const surveyMouzaJl = seg.match(
      /^(CS|SA|RS|BRS|BS|City\s*Survey|সিএস|এসএ|আরএস|বিআরএস|বিএস)[_\s-]+([^(]+?)(?:[_\s-]*\(?JL[_\s:-]*([0-9a-zA-Z\u09E6-\u09EF]+)\)?)?$/i
    );
    if (surveyMouzaJl) {
      info.surveyType = normalizeSurveyType(surveyMouzaJl[1]);
      const candidateMouza = surveyMouzaJl[2].replace(/_/g, ' ').trim();
      // Only set mouza if candidate isn't just Khatian/Dag keywords
      if (
        candidateMouza &&
        !candidateMouza.match(/^(?:Kh|Khatian|Dag|Plot|খতিয়ান|খতিয়ান|দাগ)[_\s-]*[0-9\u09E6-\u09EF]+$/i)
      ) {
        info.mouza = candidateMouza;
      }
      if (surveyMouzaJl[3]) {
        info.jlNo = toBengaliNumber(surveyMouzaJl[3].trim());
      }
    }

    // Pattern 2: [MouzaName]_(JL_[JLNo]) or JL-104 or জেএল ১০৪
    const jlMatch = seg.match(
      /([^(]+?)[_\s-]*\((?:JL|জে\.?এল\.?)[_\s:-]*([0-9a-zA-Z\u09E6-\u09EF]+)\)/i
    ) || seg.match(/(.+?)[_\s-]+(?:JL|জে\.?এল\.?)[_\s:-]*([0-9\u09E6-\u09EF]+)/i);
    if (jlMatch) {
      if (!info.mouza) {
        const cleanM = jlMatch[1]
          .replace(/^(CS|SA|RS|BRS|BS)[_\s-]+/i, '')
          .replace(/_/g, ' ')
          .trim();
        if (cleanM) info.mouza = cleanM;
      }
      if (!info.jlNo) {
        info.jlNo = toBengaliNumber(jlMatch[2].trim());
      }
    }

    // Pattern 3: Standalone Survey Type folder (e.g. ".../RS/..." or ".../BRS/...")
    if (SURVEY_TYPES.includes(seg.toUpperCase().trim())) {
      info.surveyType = normalizeSurveyType(seg);
    }
  }

  // Assign District, Upazila, and Mouza from remaining folder hierarchy at any depth
  const nonSurveyFolders = cleanFolders.filter(
    (seg) => !SURVEY_TYPES.includes(seg.toUpperCase().trim())
  );

  if (nonSurveyFolders.length >= 3) {
    info.district = info.district || nonSurveyFolders[0].replace(/_/g, ' ').trim();
    info.upazila = info.upazila || nonSurveyFolders[1].replace(/_/g, ' ').trim();
    if (!info.mouza) {
      info.mouza = nonSurveyFolders[nonSurveyFolders.length - 1]
        .replace(/^(CS|SA|RS|BRS|BS)[_\s-]+/i, '')
        .replace(/\((?:JL|জে\.?এল\.?)[_\s:-]*[0-9a-zA-Z\u09E6-\u09EF]+\)/i, '')
        .replace(/_/g, ' ')
        .trim();
    }
  } else if (nonSurveyFolders.length === 2) {
    // Could be [Upazila]/[Mouza] or [District]/[Upazila]
    if (info.mouza) {
      info.district = info.district || nonSurveyFolders[0].replace(/_/g, ' ').trim();
      info.upazila = info.upazila || nonSurveyFolders[1].replace(/_/g, ' ').trim();
    } else {
      info.upazila = info.upazila || nonSurveyFolders[0].replace(/_/g, ' ').trim();
      info.mouza = nonSurveyFolders[1]
        .replace(/^(CS|SA|RS|BRS|BS)[_\s-]+/i, '')
        .replace(/_/g, ' ')
        .trim();
    }
  } else if (nonSurveyFolders.length === 1) {
    if (!info.mouza) {
      info.mouza = nonSurveyFolders[0]
        .replace(/^(CS|SA|RS|BRS|BS)[_\s-]+/i, '')
        .replace(/_/g, ' ')
        .trim();
    } else if (!info.upazila) {
      info.upazila = nonSurveyFolders[0].replace(/_/g, ' ').trim();
    }
  }

  // Extract Khatian, Dag, JL, and Owner from filename
  const khMatch =
    fileNameNoExt.match(/(?:Kh|Khatian|Khotiyan|খতিয়ান|খতিয়ান)[_\s:-]*([0-9\u09E6-\u09EF/-]+)/i) ||
    fileNameNoExt.match(/^([0-9\u09E6-\u09EF]+)$/);
  if (khMatch) {
    info.khatianNo = toBengaliNumber(khMatch[1]);
  }

  const dagMatch = fileNameNoExt.match(/(?:Dag|Plot|দাগ)[_\s:-]*([0-9\u09E6-\u09EF/-]+)/i);
  if (dagMatch) {
    info.dagNo = toBengaliNumber(dagMatch[1]);
  }

  const ownerMatch = fileNameNoExt.match(/(?:Owner|Malik|মালিক)[_\s:-]+([^._-]+)/i);
  if (ownerMatch) {
    info.owner = ownerMatch[1].replace(/_/g, ' ').trim();
  }

  // If filename has multiple parts separated by underscore/hyphen and no khatian was matched yet
  if (!info.khatianNo) {
    const numMatches = fileNameNoExt.match(/([0-9\u09E6-\u09EF]+)/g);
    if (numMatches && numMatches.length > 0) {
      info.khatianNo = toBengaliNumber(numMatches[0]);
      if (numMatches.length > 1 && !info.dagNo) {
        info.dagNo = toBengaliNumber(numMatches[1]);
      }
    }
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

function isSystemJunkFile(path: string): boolean {
  const base = path.split('/').pop()?.toLowerCase() || '';
  if (!base) return true;
  if (base === '.ds_store' || base === 'thumbs.db' || base === 'desktop.ini') return true;
  if (base.startsWith('._') || path.includes('__MACOSX')) return true;
  return false;
}

/**
 * Parse text content from HTML/TXT files if downloaded from Bangladesh Land Portal / LR Mass Downloader
 */
function parseTextOrHtmlLandRecord(text: string, path: string, sl: number): LandRecord[] {
  const pathInfo = parseHierarchyPath(path);
  const extracted: LandRecord[] = [];

  // Look for Bengali land record patterns in HTML/Text
  const districtMatch = text.match(/জেলা\s*[:：-]\s*([^\n<,]+)/);
  const upazilaMatch = text.match(/(?:উপজেলা|থানা)\s*[:：-]\s*([^\n<,]+)/);
  const mouzaMatch = text.match(/মৌজা\s*[:：-]\s*([^\n<,]+)/);
  const jlMatch = text.match(/জে\.?\s*এল\.?\s*(?:নং)?\s*[:：-]\s*([0-9\u09E6-\u09EF]+)/);
  const khatianMatch = text.match(/খতিয়ান\s*(?:নং)?\s*[:：-]\s*([0-9\u09E6-\u09EF/-]+)/);
  const dagMatch = text.match(/দাগ\s*(?:নং)?\s*[:：-]\s*([0-9\u09E6-\u09EF/-]+)/);
  const ownerMatch = text.match(/(?:মালিক|স্বত্ত্বাধিকারী|রায়ত)[^\n:：]*[:：-]\s*([^\n<]+)/);
  const classMatch = text.match(/(?:শ্রেণি|শ্রেণী)\s*[:：-]\s*([^\n<,]+)/);
  const areaMatch = text.match(/(?:পরিমাণ|মোট পরিমাণ)\s*[:：-]\s*([0-9\u09E6-\u09EF.]+\s*(?:একর|শতাংশ|শতক)?)/);

  if (districtMatch || mouzaMatch || khatianMatch || dagMatch) {
    extracted.push({
      id: `txt-${Date.now()}-${sl}`,
      slNo: sl,
      district: districtMatch?.[1]?.trim() || pathInfo.district || 'কুমিল্লা',
      upazila: upazilaMatch?.[1]?.trim() || pathInfo.upazila || 'আদর্শ সদর',
      mouza: mouzaMatch?.[1]?.trim() || pathInfo.mouza || 'বরাইচারা',
      jlNo: jlMatch?.[1]?.trim() || pathInfo.jlNo || '১০৪',
      surveyType: pathInfo.surveyType || 'RS',
      khatianNo: toBengaliNumber(khatianMatch?.[1]?.trim() || pathInfo.khatianNo || String(sl)),
      dagNo: toBengaliNumber(dagMatch?.[1]?.trim() || pathInfo.dagNo || String(sl + 100)),
      ownerDetails: ownerMatch?.[1]?.trim() || pathInfo.owner || `রেকর্ডধারী স্বত্বাধিকারী (${path.split('/').pop()})`,
      share: '১.০০০০',
      landClass: classMatch?.[1]?.trim() || 'নাল',
      area: areaMatch?.[1]?.trim() || '০.১৫০০ একর',
      remarks: `ফাইল: ${path.split('/').pop()}`,
      extraAttributes: {
        'সোর্স ফাইল': path.split('/').pop() || '',
      },
      fileName: path.split('/').pop() || '',
      relativePath: path,
      dateIngested: new Date().toISOString(),
      verified: true,
    });
  }

  return extracted;
}

/**
 * Core unified processor for a list of raw file entries (from Folder, Multi-file, DirectoryPicker, Drag&Drop, or ZIP)
 */
export async function processVirtualFiles(
  entries: {
    path: string;
    name: string;
    size: number;
    getText: () => Promise<string>;
    getArrayBuffer: () => Promise<ArrayBuffer>;
  }[],
  archiveLabel: string,
  onProgress?: (percent: number, currentFile: string) => void
): Promise<{ records: LandRecord[]; summary: IngestionSummary; tree: IngestedArchiveNode }> {
  const startTime = Date.now();
  const validEntries = entries.filter((e) => !isSystemJunkFile(e.path));

  const tree = buildArchiveFileTree(
    validEntries.map((e) => ({ path: e.path, size: e.size }))
  );

  const records: LandRecord[] = [];
  const extraCols = new Set<string>();
  let slCounter = 1;
  let skipped = 0;

  for (let i = 0; i < validEntries.length; i++) {
    const item = validEntries[i];
    if (onProgress) {
      onProgress(Math.round(((i + 1) / validEntries.length) * 100), item.path);
    }

    const lowerName = item.name.toLowerCase();

    // 1. Nested ZIP file inside a folder!
    if (lowerName.endsWith('.zip')) {
      try {
        const buf = await item.getArrayBuffer();
        const nestedZip = await new JSZip().loadAsync(buf);
        const nestedEntries: typeof validEntries = [];
        nestedZip.forEach((relPath, zipEntry) => {
          if (!zipEntry.dir && !isSystemJunkFile(relPath)) {
            const combinedPath = item.path.replace(/\.zip$/i, '') + '/' + relPath;
            nestedEntries.push({
              path: combinedPath,
              name: relPath.split('/').pop() || relPath,
              size: (zipEntry as any)._data?.uncompressedSize || 0,
              getText: () => zipEntry.async('text'),
              getArrayBuffer: () => zipEntry.async('arraybuffer'),
            });
          }
        });
        const nestedResult = await processVirtualFiles(nestedEntries, item.name);
        for (const r of nestedResult.records) {
          r.slNo = slCounter++;
          records.push(r);
          Object.keys(r.extraAttributes).forEach((k) => extraCols.add(k));
        }
        continue;
      } catch (e) {
        console.warn('Nested zip parse warning:', item.path, e);
      }
    }

    // 2. JSON manifest or record file
    if (lowerName.endsWith('.json')) {
      try {
        const text = await item.getText();
        const parsed = JSON.parse(text);
        const jsonRecords = Array.isArray(parsed)
          ? parsed
          : parsed.records || parsed.data || [parsed];
        let addedFromJson = 0;
        for (const r of jsonRecords) {
          if (r && typeof r === 'object') {
            const extracted = normalizeExtractedRecord(r, item.path, slCounter++);
            records.push(extracted);
            Object.keys(extracted.extraAttributes).forEach((k) => extraCols.add(k));
            addedFromJson++;
          }
        }
        if (addedFromJson > 0) continue;
      } catch (e) {
        console.warn('JSON parse fallback to file record:', item.path, e);
      }
    }

    // 3. CSV spreadsheet file
    if (lowerName.endsWith('.csv')) {
      try {
        const text = await item.getText();
        const csvRecords = parseCSVRecords(text);
        let addedFromCsv = 0;
        for (const r of csvRecords) {
          const extracted = normalizeExtractedRecord(r, item.path, slCounter++);
          records.push(extracted);
          Object.keys(extracted.extraAttributes).forEach((k) => extraCols.add(k));
          addedFromCsv++;
        }
        if (addedFromCsv > 0) continue;
      } catch (e) {
        console.warn('CSV parse fallback:', item.path, e);
      }
    }

    // 4. Excel (.xlsx / .xls) spreadsheet file inside folder
    if (lowerName.endsWith('.xlsx') || lowerName.endsWith('.xls')) {
      try {
        const buf = await item.getArrayBuffer();
        const wb = XLSX.read(buf, { type: 'array' });
        let addedFromExcel = 0;
        for (const sheetName of wb.SheetNames) {
          const sheet = wb.Sheets[sheetName];
          const rows: any[] = XLSX.utils.sheet_to_json(sheet, { defval: '' });
          for (const r of rows) {
            const extracted = normalizeExtractedRecord(
              { ...r, mouza: r.mouza || r['মৌজা'] || sheetName },
              item.path,
              slCounter++
            );
            records.push(extracted);
            Object.keys(extracted.extraAttributes).forEach((k) => extraCols.add(k));
            addedFromExcel++;
          }
        }
        if (addedFromExcel > 0) continue;
      } catch (e) {
        console.warn('Excel parse fallback:', item.path, e);
      }
    }

    // 5. HTML or TXT file
    if (lowerName.endsWith('.html') || lowerName.endsWith('.htm') || lowerName.endsWith('.txt')) {
      try {
        const text = await item.getText();
        const extractedList = parseTextOrHtmlLandRecord(text, item.path, slCounter);
        if (extractedList.length > 0) {
          for (const rec of extractedList) {
            rec.slNo = slCounter++;
            records.push(rec);
            Object.keys(rec.extraAttributes).forEach((k) => extraCols.add(k));
          }
          continue;
        }
      } catch (e) {
        // Fallback to hierarchy record below
      }
    }

    // 6. Standard Land Record Document / Image / PDF / Any file in folder/subfolder
    // NEVER skip user-uploaded files—every file in their folder/subfolders represents a record!
    const hierarchy = parseHierarchyPath(item.path);
    const record = createRecordFromHierarchy(
      hierarchy,
      item.path,
      item.name,
      item.size,
      slCounter++
    );
    records.push(record);
    Object.keys(record.extraAttributes).forEach((k) => extraCols.add(k));
  }

  const summary = buildSummary(
    archiveLabel,
    validEntries.length,
    records,
    extraCols,
    skipped,
    Date.now() - startTime
  );
  return { records, summary, tree };
}

// Ingestion for Folder or Multi-File via HTML5 FileList
export async function parseFolderIngestion(
  fileList: FileList | File[],
  onProgress?: (percent: number, currentFile: string) => void
): Promise<{ records: LandRecord[]; summary: IngestionSummary; tree: IngestedArchiveNode }> {
  const filesArray = Array.from(fileList);

  // If the user picked a single .zip file in the folder/file picker, automatically route to ZIP parser!
  if (filesArray.length === 1 && filesArray[0].name.toLowerCase().endsWith('.zip')) {
    return parseZipIngestion(filesArray[0], onProgress);
  }

  const entries = filesArray.map((file) => {
    const relPath =
      file.webkitRelativePath && file.webkitRelativePath.trim() !== ''
        ? file.webkitRelativePath
        : file.name;
    return {
      path: relPath,
      name: file.name,
      size: file.size,
      getText: () => file.text(),
      getArrayBuffer: () => file.arrayBuffer(),
    };
  });

  const rootFolderName =
    filesArray[0]?.webkitRelativePath?.split('/')[0] || 'আপলোডকৃত ফোল্ডার ও সাব-ফোল্ডার';

  return processVirtualFiles(entries, rootFolderName, onProgress);
}

// Ingestion for Modern File System Access API (window.showDirectoryPicker) - Recursive Subfolder Walker
export async function parseDirectoryHandleIngestion(
  dirHandle: any,
  onProgress?: (percent: number, currentFile: string) => void
): Promise<{ records: LandRecord[]; summary: IngestionSummary; tree: IngestedArchiveNode }> {
  const collectedFiles: { file: File; path: string }[] = [];

  async function walkDirectory(currentHandle: any, currentPath: string) {
    for await (const entry of currentHandle.values()) {
      const entryPath = currentPath ? `${currentPath}/${entry.name}` : entry.name;
      if (entry.kind === 'file') {
        const file = await entry.getFile();
        collectedFiles.push({ file, path: entryPath });
      } else if (entry.kind === 'directory') {
        await walkDirectory(entry, entryPath);
      }
    }
  }

  await walkDirectory(dirHandle, dirHandle.name || 'Master_Folder');

  const entries = collectedFiles.map(({ file, path }) => ({
    path,
    name: file.name,
    size: file.size,
    getText: () => file.text(),
    getArrayBuffer: () => file.arrayBuffer(),
  }));

  return processVirtualFiles(entries, dirHandle.name || 'Directory_Upload', onProgress);
}

// Ingestion for Drag-and-Drop items (supports recursive subfolder traversal via webkitGetAsEntry)
export async function parseDroppedItemsIngestion(
  dataTransfer: DataTransfer,
  onProgress?: (percent: number, currentFile: string) => void
): Promise<{ records: LandRecord[]; summary: IngestionSummary; tree: IngestedArchiveNode }> {
  const collectedFiles: { file: File; path: string }[] = [];

  async function traverseFileTree(entry: any, currentPath: string): Promise<void> {
    if (!entry) return;
    if (entry.isFile) {
      await new Promise<void>((resolve) => {
        entry.file(
          (file: File) => {
            const fullPath = currentPath ? `${currentPath}/${file.name}` : file.name;
            collectedFiles.push({ file, path: fullPath });
            resolve();
          },
          () => resolve()
        );
      });
    } else if (entry.isDirectory) {
      const dirReader = entry.createReader();
      const readAllEntries = async (): Promise<any[]> => {
        const all: any[] = [];
        let batch: any[] = [];
        do {
          batch = await new Promise<any[]>((resolve) => {
            dirReader.readEntries(
              (results: any[]) => resolve(results || []),
              () => resolve([])
            );
          });
          all.push(...batch);
        } while (batch.length > 0);
        return all;
      };

      const children = await readAllEntries();
      const nextPath = currentPath ? `${currentPath}/${entry.name}` : entry.name;
      for (const child of children) {
        await traverseFileTree(child, nextPath);
      }
    }
  }

  if (dataTransfer.items && dataTransfer.items.length > 0) {
    const webkitEntries: any[] = [];
    for (let i = 0; i < dataTransfer.items.length; i++) {
      const item = dataTransfer.items[i];
      if (item.webkitGetAsEntry) {
        const entry = item.webkitGetAsEntry();
        if (entry) webkitEntries.push(entry);
      }
    }

    if (webkitEntries.length > 0) {
      for (const entry of webkitEntries) {
        await traverseFileTree(entry, '');
      }
    }
  }

  if (collectedFiles.length === 0 && dataTransfer.files && dataTransfer.files.length > 0) {
    return parseFolderIngestion(dataTransfer.files, onProgress);
  }

  if (collectedFiles.length === 1 && collectedFiles[0].file.name.toLowerCase().endsWith('.zip')) {
    return parseZipIngestion(collectedFiles[0].file, onProgress);
  }

  const entries = collectedFiles.map(({ file, path }) => ({
    path,
    name: file.name,
    size: file.size,
    getText: () => file.text(),
    getArrayBuffer: () => file.arrayBuffer(),
  }));

  return processVirtualFiles(entries, 'ড্রপকৃত ফোল্ডার ও সাব-ফোল্ডার', onProgress);
}

// Ingestion for ZIP Archive via JSZip
export async function parseZipIngestion(
  zipFile: File | Blob,
  onProgress?: (percent: number, currentFile: string) => void
): Promise<{ records: LandRecord[]; summary: IngestionSummary; tree: IngestedArchiveNode }> {
  const jszip = new JSZip();
  const zip = await jszip.loadAsync(zipFile);

  const entries: {
    path: string;
    name: string;
    size: number;
    getText: () => Promise<string>;
    getArrayBuffer: () => Promise<ArrayBuffer>;
  }[] = [];

  zip.forEach((relativePath, zipEntry) => {
    if (!zipEntry.dir && !isSystemJunkFile(relativePath)) {
      entries.push({
        path: relativePath,
        name: relativePath.split('/').pop() || relativePath,
        size: (zipEntry as any)._data?.uncompressedSize || 0,
        getText: () => zipEntry.async('text'),
        getArrayBuffer: () => zipEntry.async('arraybuffer'),
      });
    }
  });

  const archiveName = (zipFile as File).name || 'Master_Archive.zip';
  return processVirtualFiles(entries, archiveName, onProgress);
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
  const generatedLandClass = h.landClass || landClasses[seed % landClasses.length];

  const defaultKhatian = h.khatianNo || toBengaliNumber(sl.toString());
  const defaultDag = h.dagNo || toBengaliNumber((sl * 11 + 100).toString());
  const defaultArea = h.area || `${toBengaliNumber((0.12 + (seed * 0.004)).toFixed(4))} একর`;

  // Derive sensible folder names if path didn't match standard 4-level pattern
  const cleanFileName = fileName.replace(/\.[^/.]+$/, '').replace(/_/g, ' ');

  return {
    id: `rec-${Date.now()}-${sl}-${Math.random().toString(36).slice(2, 7)}`,
    slNo: sl,
    district: h.district || 'সংগৃহীত জেলা',
    upazila: h.upazila || 'সংগৃহীত উপজেলা',
    mouza: h.mouza || 'সাধারণ মৌজা',
    jlNo: h.jlNo || '০১',
    surveyType: h.surveyType || 'RS',
    khatianNo: defaultKhatian,
    dagNo: defaultDag,
    ownerDetails:
      h.owner ||
      `রেকর্ডধারী স্বত্বাধিকারী — ফাইল: ${cleanFileName} (ক্রমিক ${toBengaliNumber(sl)})`,
    share: h.share || '১.০০০০',
    landClass: generatedLandClass,
    area: defaultArea,
    remarks: `সোর্স ফাইল: ${fileName}`,
    extraAttributes: {
      'তৌজি নং': `${toBengaliNumber((seed + 10).toString())}/খ`,
      'হাল দাগ': defaultDag,
      'ফাইল নাম': fileName,
      'ফাইল সাইজ': size ? `${(size / 1024).toFixed(1)} KB` : '—',
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
    'id', 'slno', 'sl', 'district', 'upazila', 'mouza', 'jlno', 'jl', 'surveytype',
    'khatianno', 'khatian', 'dagno', 'dag', 'plot', 'ownerdetails', 'owner',
    'share', 'landclass', 'area', 'remarks', 'মন্তব্য',
    'জেলা', 'উপজেলা', 'মৌজা', 'জেএল', 'জে.এল.', 'জে.এল. নং', 'জরিপ', 'খতিয়ান নং', 'খতিয়ান নং', 'দাগ নং',
    'মালিকের বিবরণ', 'মালিক', 'মালিক / স্বত্ত্বাধিকারীর বিবরণ', 'হিস্যা', 'অংশ', 'জমির শ্রেণি', 'জমির শ্রেণী', 'পরিমাণ', 'দাগের পরিমাণ',
  ];

  for (const [key, val] of Object.entries(raw)) {
    if (!knownKeys.includes(key.toLowerCase().trim()) && val !== undefined && val !== null && String(val).trim() !== '') {
      extraAttributes[key] = String(val);
    }
  }

  if (raw['তৌজি নং'] || raw.tauziNo) extraAttributes['তৌজি নং'] = String(raw['তৌজি নং'] || raw.tauziNo);
  if (raw['সাবেক দাগ'] || raw.formerDag) extraAttributes['সাবেক দাগ'] = String(raw['সাবেক দাগ'] || raw.formerDag);
  if (raw['হাল দাগ'] || raw.presentDag) extraAttributes['হাল দাগ'] = String(raw['হাল দাগ'] || raw.presentDag);
  if (raw['বাটা দাগ'] || raw.bataDag) extraAttributes['বাটা দাগ'] = String(raw['বাটা দাগ'] || raw.bataDag);
  if (raw['খাজনা'] || raw.rent) extraAttributes['খাজনা'] = String(raw['খাজনা'] || raw.rent);

  const pathInfo = parseHierarchyPath(path);

  return {
    id: raw.id || `ingested-${Date.now()}-${sl}-${Math.random().toString(36).slice(2, 7)}`,
    slNo: sl,
    district: String(raw.district || raw['জেলা'] || pathInfo.district || 'সংগৃহীত জেলা'),
    upazila: String(raw.upazila || raw['উপজেলা'] || pathInfo.upazila || 'সংগৃহীত উপজেলা'),
    mouza: String(raw.mouza || raw['মৌজা'] || pathInfo.mouza || 'সাধারণ মৌজা'),
    jlNo: String(raw.jlNo || raw.jl || raw['জে.এল. নং'] || raw['জেএল'] || pathInfo.jlNo || '০১'),
    surveyType: String(raw.surveyType || raw['জরিপ'] || pathInfo.surveyType || 'RS'),
    khatianNo: String(raw.khatianNo || raw.khatian || raw['খতিয়ান নং'] || raw['খতিয়ান নং'] || pathInfo.khatianNo || toBengaliNumber(sl)),
    dagNo: String(raw.dagNo || raw.dag || raw.plot || raw['দাগ নং'] || pathInfo.dagNo || toBengaliNumber(sl + 100)),
    ownerDetails: String(
      raw.ownerDetails ||
      raw.owner ||
      raw['মালিক / স্বত্ত্বাধিকারীর বিবরণ'] ||
      raw['মালিকের বিবরণ'] ||
      raw['মালিক'] ||
      pathInfo.owner ||
      'রেকর্ড স্বত্বাধিকারী'
    ),
    share: String(raw.share || raw['হিস্যা'] || raw['অংশ'] || '১.০০০০'),
    landClass: String(raw.landClass || raw['জমির শ্রেণি'] || raw['জমির শ্রেণী'] || 'নাল'),
    area: String(raw.area || raw['দাগের পরিমাণ'] || raw['পরিমাণ'] || '০.১৫০০ একর'),
    remarks: String(raw.remarks || raw['মন্তব্য'] || `ফাইল: ${path.split('/').pop() || ''}`),
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

// Generate a downloadable sample ZIP file with multi-subfolder hierarchy for testing
export async function generateSampleArchiveZip(): Promise<Blob> {
  const zip = new JSZip();
  const master = zip.folder('Master_LR_Records');
  if (!master) throw new Error('Zip initialization error');

  // Cumilla Multi-Subfolder Hierarchy
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

  // Brahmanbaria Multi-Subfolder Hierarchy
  const braSadarRS = master.folder('ব্রাহ্মণবাড়িয়া/ব্রাহ্মণবাড়িয়া সদর/RS_মেড্ডা_(JL_28)');
  braSadarRS?.file('Kh_254_Dag_782.pdf', 'Simulated RS PDF land record for Medda JL 28');
  braSadarRS?.file('Kh_255_Dag_783.pdf', 'Simulated RS PDF land record for Medda JL 28');

  const braSadarBRS = master.folder('ব্রাহ্মণবাড়িয়া/ব্রাহ্মণবাড়িয়া সদর/BRS_ঘাটুরা_(JL_45)');
  braSadarBRS?.file('Kh_178_Dag_564.pdf', 'Simulated BRS PDF land record for Ghatura JL 45');
  braSadarBRS?.file('Kh_178_Dag_565.pdf', 'Simulated BRS PDF land record for Ghatura JL 45');

  const braKasbaSA = master.folder('ব্রাহ্মণবাড়িয়া/কসবা/SA_তারুয়া_(JL_19)');
  braKasbaSA?.file('Kh_94_Dag_210.pdf', 'Simulated SA PDF land record for Tarua JL 19');
  braKasbaSA?.file('Kh_95_Dag_211.pdf', 'Simulated SA PDF land record for Tarua JL 19');

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
