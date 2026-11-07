import { DynamicColumn, LandRecord } from '../types/landRecord';
import { MatchedInheritanceRecord, PROVIDED_WARISH_CERTIFICATES } from './inheritanceData';
import { formatAreaBengali, parseAcreValue, toBengaliNumber } from './bengaliNumerals';

// A4 Landscape dimensions at 150 DPI (High-clarity print resolution, fast mobile rendering)
const PAGE_WIDTH = 1754;
const PAGE_HEIGHT = 1240;
const MARGIN_X = 48;
const MARGIN_TOP = 44;
const MARGIN_BOTTOM = 54;
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN_X * 2;

const FONT_SANS = '"Hind Siliguri", "Noto Sans Bengali", system-ui, -apple-system, sans-serif';
const FONT_MONO = '"JetBrains Mono", "Hind Siliguri", monospace';

/**
 * Ensures web fonts (Hind Siliguri) are ready before rendering to canvas.
 */
async function ensureFontsLoaded(): Promise<void> {
  if (typeof document !== 'undefined' && 'fonts' in document) {
    try {
      await (document as any).fonts.ready;
    } catch {
      // Ignore font loading errors and fallback to system Bengali font
    }
  }
}

/**
 * Wraps text into lines that fit within maxWidth pixels on the given 2D canvas context.
 */
function wrapText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  if (!text) return ['—'];
  const paragraphs = String(text).split(/\r?\n/);
  const lines: string[] = [];

  for (const para of paragraphs) {
    const words = para.trim().split(/\s+/);
    if (words.length === 0 || (words.length === 1 && words[0] === '')) {
      continue;
    }
    let currentLine = words[0];

    for (let i = 1; i < words.length; i++) {
      const word = words[i];
      const testLine = `${currentLine} ${word}`;
      if (ctx.measureText(testLine).width <= maxWidth) {
        currentLine = testLine;
      } else {
        lines.push(currentLine);
        currentLine = word;
      }
    }
    lines.push(currentLine);
  }

  return lines.length > 0 ? lines : ['—'];
}

/**
 * Converts a data:image/jpeg;base64,... URL into a raw Uint8Array.
 */
function dataUrlToUint8Array(dataUrl: string): Uint8Array {
  const base64 = dataUrl.split(',')[1] || '';
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

/**
 * Packs an array of rendered A4 Landscape <canvas> pages into a genuine ISO-32000 %PDF-1.4 binary Blob.
 */
function buildPdfBlobFromCanvases(canvases: HTMLCanvasElement[]): Blob {
  const encoder = new TextEncoder();
  const chunks: Uint8Array[] = [];
  let offset = 0;

  const pushStr = (str: string) => {
    const bytes = encoder.encode(str);
    chunks.push(bytes);
    offset += bytes.length;
  };

  const pushBytes = (bytes: Uint8Array) => {
    chunks.push(bytes);
    offset += bytes.length;
  };

  const objectOffsets: number[] = [0]; // 1-indexed

  // PDF Header with binary comment bytes
  pushStr('%PDF-1.4\n%\xE2\xE3\xCF\xD3\n');

  // Object 1: Catalog
  objectOffsets[1] = offset;
  pushStr('1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n');

  // Reserve Object 2: Pages (we will write it after knowing page object IDs)
  const pageCount = canvases.length;
  const pageObjIds: number[] = [];
  for (let i = 0; i < pageCount; i++) {
    pageObjIds.push(3 + i * 3);
  }

  objectOffsets[2] = offset;
  pushStr(
    `2 0 obj\n<< /Type /Pages /Kids [${pageObjIds.map((id) => `${id} 0 R`).join(' ')}] /Count ${pageCount} >>\nendobj\n`
  );

  // Write each page's 3 objects: Page, ContentStream, and JPEG Image XObject
  for (let i = 0; i < pageCount; i++) {
    const canvas = canvases[i];
    const jpegBytes = dataUrlToUint8Array(canvas.toDataURL('image/jpeg', 0.92));

    const pageObjId = 3 + i * 3;
    const contentObjId = 4 + i * 3;
    const imageObjId = 5 + i * 3;

    // Page Object (A4 Landscape: 841.89 x 595.28 pt)
    objectOffsets[pageObjId] = offset;
    pushStr(
      `${pageObjId} 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 841.89 595.28] /Resources << /XObject << /Im0 ${imageObjId} 0 R >> >> /Contents ${contentObjId} 0 R >>\nendobj\n`
    );

    // Content Stream Object
    const contentStream = 'q 841.89 0 0 595.28 0 0 cm /Im0 Do Q';
    objectOffsets[contentObjId] = offset;
    pushStr(
      `${contentObjId} 0 obj\n<< /Length ${contentStream.length} >>\nstream\n${contentStream}\nendstream\nendobj\n`
    );

    // JPEG Image XObject
    objectOffsets[imageObjId] = offset;
    pushStr(
      `${imageObjId} 0 obj\n<< /Type /XObject /Subtype /Image /Width ${canvas.width} /Height ${canvas.height} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${jpegBytes.length} >>\nstream\n`
    );
    pushBytes(jpegBytes);
    pushStr('\nendstream\nendobj\n');
  }

  // Write xref table
  const totalObjects = 2 + pageCount * 3;
  const xrefStart = offset;
  pushStr(`xref\n0 ${totalObjects + 1}\n`);
  pushStr('0000000000 65535 f \n');
  for (let objId = 1; objId <= totalObjects; objId++) {
    const offStr = String(objectOffsets[objId] || 0).padStart(10, '0');
    pushStr(`${offStr} 00000 n \n`);
  }

  // Trailer
  pushStr(
    `trailer\n<< /Size ${totalObjects + 1} /Root 1 0 R >>\nstartxref\n${xrefStart}\n%%EOF`
  );

  return new Blob(chunks as BlobPart[], { type: 'application/pdf' });
}

/**
 * Triggers a browser file download for a PDF Blob.
 */
function triggerPdfDownload(blob: Blob, fileName: string): void {
  const safeName = fileName.endsWith('.pdf') ? fileName : `${fileName}.pdf`;
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', safeName);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(url), 5000);
}

/**
 * Creates a fresh white A4 Landscape canvas.
 */
function createPageCanvas(): { canvas: HTMLCanvasElement; ctx: CanvasRenderingContext2D } {
  const canvas = document.createElement('canvas');
  canvas.width = PAGE_WIDTH;
  canvas.height = PAGE_HEIGHT;
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, PAGE_WIDTH, PAGE_HEIGHT);
  ctx.textBaseline = 'top';
  return { canvas, ctx };
}

/**
 * Draws the official footer and page numbers on every rendered page canvas.
 */
function StampPageFooters(canvases: HTMLCanvasElement[], footerLeftText: string): void {
  const totalPages = canvases.length;
  const dateStr = new Date().toLocaleString('bn-BD');

  canvases.forEach((canvas, idx) => {
    const ctx = canvas.getContext('2d')!;
    const footerY = PAGE_HEIGHT - 38;

    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(MARGIN_X, footerY - 6);
    ctx.lineTo(PAGE_WIDTH - MARGIN_X, footerY - 6);
    ctx.stroke();

    ctx.font = `500 13px ${FONT_SANS}`;
    ctx.fillStyle = '#334155';
    ctx.textAlign = 'left';
    ctx.fillText(`${footerLeftText} | মুদ্রণ তারিখ: ${dateStr}`, MARGIN_X, footerY);

    ctx.font = `700 13px ${FONT_SANS}`;
    ctx.fillStyle = '#0f172a';
    ctx.textAlign = 'right';
    ctx.fillText(
      `পৃষ্ঠা ${toBengaliNumber(idx + 1)} / ${toBengaliNumber(totalPages)}`,
      PAGE_WIDTH - MARGIN_X,
      footerY
    );
    ctx.textAlign = 'left';
  });
}

/**
 * Generates and directly downloads the Matched Inheritance & Land Record New List as a multi-page A4 Landscape PDF.
 */
export async function downloadMatchedInheritancePdf(
  matchedList: MatchedInheritanceRecord[],
  fileNamePrefix = 'LR_Warish_Matched_New_List'
): Promise<void> {
  await ensureFontsLoaded();

  const totalHeirsCount = PROVIDED_WARISH_CERTIFICATES.reduce(
    (sum, c) => sum + c.heirs.length,
    0
  );
  const totalMatchedAcre = matchedList.reduce(
    (sum, item) => sum + parseAcreValue(item.landRecord.area),
    0
  );

  // Define table columns (Total width = CONTENT_WIDTH = 1658px)
  const cols = [
    { key: 'sl', label: 'ক্রমিক', width: 64, align: 'center' as const },
    { key: 'mouza', label: 'মৌজা, জে.এল. ও জরিপ', width: 175, align: 'left' as const },
    { key: 'khatianDag', label: 'খতিয়ান ও দাগ নং', width: 135, align: 'left' as const },
    { key: 'owner', label: 'খতিয়ানে লিপিবদ্ধ মালিকের বিবরণ', width: 280, align: 'left' as const },
    { key: 'area', label: 'শ্রেণি, অংশ ও জমির পরিমাণ', width: 185, align: 'left' as const },
    { key: 'ancestor', label: 'ম্যাচকৃত ওয়ারিশ সনদ ও মৃত পূর্বপুরুষ', width: 245, align: 'left' as const },
    { key: 'heirs', label: 'সনদভুক্ত ওয়ারিশগণের নামের তালিকা (সম্পর্ক ও জন্ম তারিখসহ)', width: 424, align: 'left' as const },
    { key: 'status', label: 'ম্যাচিং ধরন', width: 150, align: 'center' as const },
  ];

  const canvases: HTMLCanvasElement[] = [];
  let { canvas, ctx } = createPageCanvas();
  canvases.push(canvas);

  const drawMainHeader = (isFirstPage: boolean): number => {
    let y = MARGIN_TOP;

    // Top Gov Banner
    ctx.font = `600 13px ${FONT_SANS}`;
    ctx.fillStyle = '#475569';
    ctx.textAlign = 'left';
    ctx.fillText('বাংলাদেশ ফরম নং ৫৪৬২ (সংশোধিত)', MARGIN_X, y);

    ctx.textAlign = 'center';
    ctx.fillText(
      'গণপ্রজাতন্ত্রী বাংলাদেশ সরকার · ভূমি রেকর্ড ও ওয়ারিশ সনদ সমন্বয় প্রতিবেদন',
      PAGE_WIDTH / 2,
      y
    );

    ctx.textAlign = 'right';
    ctx.fillText('রেজিস্টার: ওয়ারিশ ও খতিয়ান-দাগ ম্যাচিং তালিকা', PAGE_WIDTH - MARGIN_X, y);
    ctx.textAlign = 'left';
    y += 22;

    // Main Title
    ctx.font = `700 24px ${FONT_SANS}`;
    ctx.fillStyle = '#0f172a';
    ctx.textAlign = 'center';
    ctx.fillText(
      'ওয়ারিশ সনদের সাথে ম্যাচকৃত ভূমি রেকর্ডের নতুন মাস্টার তালিকা (Matched Inheritance & Land Ledger)',
      PAGE_WIDTH / 2,
      y
    );
    y += 30;

    // Subtitle / Reference Address
    ctx.font = `600 14px ${FONT_SANS}`;
    ctx.fillStyle = '#1e293b';
    ctx.fillText(
      'রেফারেন্স ঠিকানা: গ্রাম/মৌজা: গোয়ালী, ওয়ার্ড নং: ০৮, ডাকঘর: কাইতলা - ৩৪৭৭, ইউনিয়ন: কাইতলা (দক্ষিণ), উপজেলা: নবীনগর, জেলা: ব্রাহ্মণবাড়িয়া',
      PAGE_WIDTH / 2,
      y
    );
    ctx.textAlign = 'left';
    y += 24;

    if (isFirstPage) {
      // Summary Statistics Strip Box
      ctx.fillStyle = '#f8fafc';
      ctx.strokeStyle = '#0f172a';
      ctx.lineWidth = 1.5;
      ctx.fillRect(MARGIN_X, y, CONTENT_WIDTH, 38);
      ctx.strokeRect(MARGIN_X, y, CONTENT_WIDTH, 38);

      ctx.font = `700 14px ${FONT_SANS}`;
      ctx.fillStyle = '#0f172a';
      const summaryItems = [
        `সংযুক্ত ওয়ারিশ সনদ: ${toBengaliNumber(PROVIDED_WARISH_CERTIFICATES.length)} টি`,
        `সর্বমোট ওয়ারিশ: ${toBengaliNumber(totalHeirsCount)} জন`,
        `ম্যাচকৃত ভূমি রেকর্ড: ${toBengaliNumber(matchedList.length)} টি`,
        `সর্বমোট জমির পরিমাণ: ${formatAreaBengali(totalMatchedAcre)} (${toBengaliNumber(
          (totalMatchedAcre * 100).toFixed(2)
        )} শতক)`,
      ];

      const colStep = CONTENT_WIDTH / summaryItems.length;
      summaryItems.forEach((txt, idx) => {
        ctx.fillText(txt, MARGIN_X + idx * colStep + 14, y + 10);
      });

      y += 50;
    } else {
      y += 8;
    }

    return y;
  };

  const drawTableHeader = (y: number): number => {
    const headerHeight = 38;
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(MARGIN_X, y, CONTENT_WIDTH, headerHeight);

    let x = MARGIN_X;
    ctx.font = `700 13px ${FONT_SANS}`;
    ctx.fillStyle = '#ffffff';

    for (const col of cols) {
      ctx.strokeStyle = '#334155';
      ctx.lineWidth = 1;
      ctx.strokeRect(x, y, col.width, headerHeight);
      ctx.fillText(col.label, x + 8, y + 10);
      x += col.width;
    }

    return y + headerHeight;
  };

  let currentY = drawMainHeader(true);
  currentY = drawTableHeader(currentY);

  const lineHeight = 18;
  const cellPadX = 8;
  const cellPadY = 8;
  const maxY = PAGE_HEIGHT - MARGIN_BOTTOM - 20;

  for (let idx = 0; idx < matchedList.length; idx++) {
    const item = matchedList[idx];
    const { landRecord: rec, matchedCertificate: cert } = item;
    const isDirect =
      item.matchType === 'exact_ancestor' ||
      item.matchType === 'heir_match' ||
      item.matchType === 'lineage_chain';

    // Prepare cell text strings for each column
    const heirsCompactText = cert.heirs
      .map(
        (h) =>
          `${h.sl}. ${h.name} (${h.relation}, ${h.status}${
            h.dob !== '-' ? `, জন্ম: ${h.dob}` : ''
          })`
      )
      .join(' | ');

    const cellTexts: Record<string, string> = {
      sl: toBengaliNumber(idx + 1),
      mouza: `মৌজা: ${rec.mouza}\nজে.এল: ${rec.jlNo} | জরিপ: ${rec.surveyType}\n${rec.upazila}, ${rec.district}`,
      khatianDag: `খতিয়ান: ${rec.khatianNo}\nদাগ নং: ${rec.dagNo}`,
      owner: rec.ownerDetails,
      area: `পরিমাণ: ${rec.area}\nশ্রেণি: ${rec.landClass} | হিস্যা: ${rec.share}\nওয়ারিশ গড়: ${item.allocatedAreaPerLivingHeir}`,
      ancestor: `সনদ: ${cert.certificateNo}\nমৃত: ${cert.deceasedName}\nপিতা: ${cert.fatherName}\nমাতা: ${cert.motherName}`,
      heirs: `মোট ওয়ারিশ: ${toBengaliNumber(cert.heirs.length)} জন (জীবিত: ${toBengaliNumber(
        item.livingHeirsCount
      )} জন)\n${heirsCompactText}`,
      status: `${isDirect ? 'সরাসরি বংশক্রম ম্যাচ' : 'মৌজা/বংশক্রম সমন্বিত'}\n(${item.matchedPersonName})`,
    };

    // Measure wrapped lines for every column to find row height
    ctx.font = `500 13px ${FONT_SANS}`;
    const wrappedCells: Record<string, string[]> = {};
    let maxLines = 1;

    for (const col of cols) {
      const lines = wrapText(ctx, cellTexts[col.key], col.width - cellPadX * 2);
      wrappedCells[col.key] = lines;
      if (lines.length > maxLines) {
        maxLines = lines.length;
      }
    }

    const rowHeight = Math.max(maxLines * lineHeight + cellPadY * 2, 42);

    // Check if we need a page break
    if (currentY + rowHeight > maxY) {
      const nextPage = createPageCanvas();
      canvas = nextPage.canvas;
      ctx = nextPage.ctx;
      canvases.push(canvas);
      currentY = drawMainHeader(false);
      currentY = drawTableHeader(currentY);
    }

    // Draw row background (alternating subtle zebra stripe)
    ctx.fillStyle = idx % 2 === 0 ? '#ffffff' : '#f8fafc';
    ctx.fillRect(MARGIN_X, currentY, CONTENT_WIDTH, rowHeight);

    // Draw cell borders and text
    let x = MARGIN_X;
    for (const col of cols) {
      ctx.strokeStyle = '#475569';
      ctx.lineWidth = 1;
      ctx.strokeRect(x, currentY, col.width, rowHeight);

      const lines = wrappedCells[col.key];
      ctx.font =
        col.key === 'sl' || col.key === 'khatianDag'
          ? `700 13px ${FONT_SANS}`
          : `500 13px ${FONT_SANS}`;
      ctx.fillStyle = '#0f172a';

      lines.forEach((line, lineIdx) => {
        ctx.fillText(line, x + cellPadX, currentY + cellPadY + lineIdx * lineHeight);
      });

      x += col.width;
    }

    currentY += rowHeight;
  }

  // Draw Official Signature Block at the bottom if room permits, or on a new page
  const sigHeight = 85;
  if (currentY + sigHeight > maxY) {
    const nextPage = createPageCanvas();
    canvas = nextPage.canvas;
    ctx = nextPage.ctx;
    canvases.push(canvas);
    currentY = drawMainHeader(false) + 20;
  } else {
    currentY += 32;
  }

  const sigCols = [
    'ওয়ারিশ ও রেকর্ড সমন্বয়কারী',
    'কানুনগো / যাচাইকারী কর্মকর্তা',
    'সহকারী কমিশনার (ভূমি) / কর্তৃপক্ষ',
  ];
  const sigWidth = CONTENT_WIDTH / 3;
  ctx.font = `700 13px ${FONT_SANS}`;
  ctx.fillStyle = '#1e293b';
  ctx.strokeStyle = '#475569';
  ctx.lineWidth = 1;

  sigCols.forEach((label, i) => {
    const centerX = MARGIN_X + i * sigWidth + sigWidth / 2;
    ctx.beginPath();
    ctx.moveTo(centerX - 110, currentY + 30);
    ctx.lineTo(centerX + 110, currentY + 30);
    ctx.stroke();

    ctx.textAlign = 'center';
    ctx.fillText(label, centerX, currentY + 38);
  });
  ctx.textAlign = 'left';

  StampPageFooters(
    canvases,
    'LR Master Ledger & Inventory Studio · ওয়ারিশ সনদ ও খতিয়ান-দাগ ম্যাচকৃত নতুন তালিকা'
  );

  const pdfBlob = buildPdfBlobFromCanvases(canvases);
  const dateTag = new Date().toISOString().slice(0, 10);
  triggerPdfDownload(pdfBlob, `${fileNamePrefix}_${dateTag}.pdf`);
}

/**
 * Generates and directly downloads Mouza-wise Land Record Tables as a multi-page A4 Landscape PDF.
 */
export async function downloadMouzaLandRecordsPdf(
  records: LandRecord[],
  columns: DynamicColumn[],
  scopeName = 'All_Mouzas'
): Promise<void> {
  await ensureFontsLoaded();

  const visibleCols = columns.filter((c) => c.visible).sort((a, b) => a.order - b.order);
  const totalWeight = visibleCols.reduce((sum, c) => sum + (c.width || 130), 0);
  const scaledCols = visibleCols.map((c) => ({
    ...c,
    pixelWidth: Math.max(Math.floor(((c.width || 130) / totalWeight) * CONTENT_WIDTH), 75),
  }));
  // Adjust last column width so sum equals CONTENT_WIDTH
  const usedWidth = scaledCols.reduce((sum, c) => sum + c.pixelWidth, 0);
  if (scaledCols.length > 0) {
    scaledCols[scaledCols.length - 1].pixelWidth += CONTENT_WIDTH - usedWidth;
  }

  // Group records by Mouza
  const mouzaGroups = new Map<string, LandRecord[]>();
  for (const r of records) {
    const key = `${r.upazila || '—'}__${r.mouza || '—'}__${r.jlNo || '—'}`;
    if (!mouzaGroups.has(key)) {
      mouzaGroups.set(key, []);
    }
    mouzaGroups.get(key)!.push(r);
  }

  const canvases: HTMLCanvasElement[] = [];
  let { canvas, ctx } = createPageCanvas();
  canvases.push(canvas);

  const totalAcreAll = records.reduce((s, r) => s + parseAcreValue(r.area), 0);

  const drawReportHeader = (isFirst: boolean): number => {
    let y = MARGIN_TOP;
    ctx.font = `600 13px ${FONT_SANS}`;
    ctx.fillStyle = '#475569';
    ctx.fillText('বাংলাদেশ ফরম নং ৫৪৬২ (সংশোধিত)', MARGIN_X, y);
    ctx.textAlign = 'center';
    ctx.fillText(
      'গণপ্রজাতন্ত্রী বাংলাদেশ সরকার · ভূমি রেকর্ড ও জরিপ অধিদপ্তর',
      PAGE_WIDTH / 2,
      y
    );
    ctx.textAlign = 'right';
    ctx.fillText('মৌজাভিত্তিক মাস্টার খতিয়ান ও দাগ লেজার', PAGE_WIDTH - MARGIN_X, y);
    ctx.textAlign = 'left';
    y += 22;

    ctx.font = `700 23px ${FONT_SANS}`;
    ctx.fillStyle = '#0f172a';
    ctx.textAlign = 'center';
    ctx.fillText(
      'মৌজাভিত্তিক মাস্টার ল্যান্ড রেকর্ড ও খতিয়ান-দাগ ইনভেন্টরি লেজার (Mouza-Best PDF)',
      PAGE_WIDTH / 2,
      y
    );
    ctx.textAlign = 'left';
    y += 30;

    if (isFirst) {
      ctx.fillStyle = '#f8fafc';
      ctx.strokeStyle = '#0f172a';
      ctx.lineWidth = 1.5;
      ctx.fillRect(MARGIN_X, y, CONTENT_WIDTH, 34);
      ctx.strokeRect(MARGIN_X, y, CONTENT_WIDTH, 34);

      ctx.font = `700 13px ${FONT_SANS}`;
      ctx.fillStyle = '#0f172a';
      ctx.fillText(
        `মোট মৌজা: ${toBengaliNumber(mouzaGroups.size)} টি   |   মোট রেকর্ড: ${toBengaliNumber(
          records.length
        )} টি (১০০% অন্তর্ভুক্ত)   |   সর্বমোট জমি: ${formatAreaBengali(totalAcreAll)}`,
        MARGIN_X + 14,
        y + 8
      );
      y += 44;
    } else {
      y += 6;
    }

    return y;
  };

  let currentY = drawReportHeader(true);
  const maxY = PAGE_HEIGHT - MARGIN_BOTTOM - 16;
  const lineHeight = 18;
  const padX = 7;
  const padY = 7;

  let mouzaIndex = 0;
  for (const [, mouzaRecords] of mouzaGroups.entries()) {
    mouzaIndex++;
    const sample = mouzaRecords[0];
    const mouzaAcre = mouzaRecords.reduce((s, r) => s + parseAcreValue(r.area), 0);

    // Ensure room for Mouza Header + Table Header + at least 1 row
    if (currentY + 120 > maxY) {
      const next = createPageCanvas();
      canvas = next.canvas;
      ctx = next.ctx;
      canvases.push(canvas);
      currentY = drawReportHeader(false);
    }

    // Mouza Banner
    ctx.fillStyle = '#e2e8f0';
    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 1.5;
    ctx.fillRect(MARGIN_X, currentY, CONTENT_WIDTH, 34);
    ctx.strokeRect(MARGIN_X, currentY, CONTENT_WIDTH, 34);

    ctx.font = `700 15px ${FONT_SANS}`;
    ctx.fillStyle = '#0f172a';
    ctx.fillText(
      `মৌজা টেবিল #${toBengaliNumber(mouzaIndex)}: মৌজা ${sample.mouza} (জে.এল. নং ${
        sample.jlNo
      }) · উপজেলা: ${sample.upazila} · জেলা: ${sample.district} · মোট রেকর্ড: ${toBengaliNumber(
        mouzaRecords.length
      )} টি (${formatAreaBengali(mouzaAcre)})`,
      MARGIN_X + 12,
      currentY + 8
    );
    currentY += 34;

    const drawColsHeader = (y: number): number => {
      const h = 34;
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(MARGIN_X, y, CONTENT_WIDTH, h);
      let x = MARGIN_X;
      ctx.font = `700 12px ${FONT_SANS}`;
      ctx.fillStyle = '#ffffff';
      for (const col of scaledCols) {
        ctx.strokeStyle = '#334155';
        ctx.strokeRect(x, y, col.pixelWidth, h);
        ctx.fillText(col.label, x + padX, y + 8);
        x += col.pixelWidth;
      }
      return y + h;
    };

    currentY = drawColsHeader(currentY);

    for (let rIdx = 0; rIdx < mouzaRecords.length; rIdx++) {
      const rec = mouzaRecords[rIdx];
      ctx.font = `500 12.5px ${FONT_SANS}`;

      const wrappedByCol: Record<string, string[]> = {};
      let maxLines = 1;

      for (const col of scaledCols) {
        let cellVal = '';
        if (col.id === 'slNo') cellVal = toBengaliNumber(rIdx + 1);
        else if (col.id === 'mouza') cellVal = `${rec.mouza} (JL ${rec.jlNo})`;
        else if (col.id in rec) cellVal = String((rec as any)[col.id] || '—');
        else if (rec.extraAttributes && col.id in rec.extraAttributes)
          cellVal = String(rec.extraAttributes[col.id] || '—');
        else cellVal = '—';

        const lines = wrapText(ctx, cellVal, col.pixelWidth - padX * 2);
        wrappedByCol[col.id] = lines;
        if (lines.length > maxLines) maxLines = lines.length;
      }

      const rowH = Math.max(maxLines * lineHeight + padY * 2, 34);

      if (currentY + rowH > maxY) {
        const next = createPageCanvas();
        canvas = next.canvas;
        ctx = next.ctx;
        canvases.push(canvas);
        currentY = drawReportHeader(false);
        currentY = drawColsHeader(currentY);
      }

      ctx.fillStyle = rIdx % 2 === 0 ? '#ffffff' : '#f8fafc';
      ctx.fillRect(MARGIN_X, currentY, CONTENT_WIDTH, rowH);

      let x = MARGIN_X;
      for (const col of scaledCols) {
        ctx.strokeStyle = '#64748b';
        ctx.lineWidth = 1;
        ctx.strokeRect(x, currentY, col.pixelWidth, rowH);

        ctx.fillStyle = '#0f172a';
        ctx.font =
          col.id === 'khatianNo' || col.id === 'dagNo'
            ? `700 12.5px ${FONT_SANS}`
            : `500 12.5px ${FONT_SANS}`;

        wrappedByCol[col.id].forEach((line, lIdx) => {
          ctx.fillText(line, x + padX, currentY + padY + lIdx * lineHeight);
        });
        x += col.pixelWidth;
      }

      currentY += rowH;
    }

    currentY += 20;
  }

  StampPageFooters(
    canvases,
    'LR Master Ledger & Inventory Studio · মৌজাভিত্তিক মাস্টার পিডিএফ রিপোর্ট'
  );

  const pdfBlob = buildPdfBlobFromCanvases(canvases);
  const dateTag = new Date().toISOString().slice(0, 10);
  const cleanScope = scopeName.replace(/\s+/g, '_');
  triggerPdfDownload(pdfBlob, `LR_Mouza_Ledger_${cleanScope}_${dateTag}.pdf`);
}

/**
 * Generates and directly downloads any Forensic Audit Report (Reports 1–10) as a multi-page A4 Landscape PDF
 * retaining all Evidence IDs, source references, and forensic classifications.
 */
export async function downloadForensicReportTablePdf(params: {
  reportTitle: string;
  reportSubtitle: string;
  headers: { key: string; label: string; width: number }[];
  rows: Record<string, string>[];
  fileNamePrefix: string;
}): Promise<void> {
  await ensureFontsLoaded();

  const { reportTitle, reportSubtitle, headers, rows, fileNamePrefix } = params;
  const totalRequestedWidth = headers.reduce((s, h) => s + h.width, 0) || 1;
  const scaledHeaders = headers.map((h) => ({
    ...h,
    pixelWidth: Math.floor((h.width / totalRequestedWidth) * CONTENT_WIDTH),
  }));
  const sumW = scaledHeaders.reduce((s, h) => s + h.pixelWidth, 0);
  if (scaledHeaders.length > 0) {
    scaledHeaders[scaledHeaders.length - 1].pixelWidth += CONTENT_WIDTH - sumW;
  }

  const canvases: HTMLCanvasElement[] = [];
  let { canvas, ctx } = createPageCanvas();
  canvases.push(canvas);

  const drawHeader = (isFirst: boolean): number => {
    let y = MARGIN_TOP;
    ctx.font = `600 13px ${FONT_SANS}`;
    ctx.fillStyle = '#475569';
    ctx.fillText(
      'BANGLADESH HISTORICAL LAND RECORD FORENSIC MATCHING & GENEALOGY ENGINE',
      MARGIN_X,
      y
    );
    ctx.textAlign = 'right';
    ctx.fillText(
      'বংশধারা নোঙর: রসন আলী → আলী নেওয়াজ → সফর আলী → কামদার আলী ও সিরাজ আলী',
      PAGE_WIDTH - MARGIN_X,
      y
    );
    ctx.textAlign = 'left';
    y += 22;

    ctx.font = `700 22px ${FONT_SANS}`;
    ctx.fillStyle = '#0f172a';
    ctx.fillText(reportTitle, MARGIN_X, y);
    y += 28;

    if (isFirst) {
      ctx.font = `500 13.5px ${FONT_SANS}`;
      ctx.fillStyle = '#334155';
      ctx.fillText(reportSubtitle, MARGIN_X, y);
      y += 24;
    }

    // Table header row
    const thHeight = 36;
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(MARGIN_X, y, CONTENT_WIDTH, thHeight);
    let x = MARGIN_X;
    ctx.font = `700 12.5px ${FONT_SANS}`;
    ctx.fillStyle = '#ffffff';
    for (const h of scaledHeaders) {
      ctx.strokeStyle = '#334155';
      ctx.strokeRect(x, y, h.pixelWidth, thHeight);
      ctx.fillText(h.label, x + 7, y + 9);
      x += h.pixelWidth;
    }
    return y + thHeight;
  };

  let currentY = drawHeader(true);
  const maxY = PAGE_HEIGHT - MARGIN_BOTTOM - 18;
  const lineHeight = 18;
  const padX = 7;
  const padY = 7;

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    ctx.font = `500 12.5px ${FONT_SANS}`;
    const wrapped: Record<string, string[]> = {};
    let maxLines = 1;

    for (const h of scaledHeaders) {
      const val = String(row[h.key] ?? '—');
      const lines = wrapText(ctx, val, h.pixelWidth - padX * 2);
      wrapped[h.key] = lines;
      if (lines.length > maxLines) maxLines = lines.length;
    }

    const rowH = Math.max(maxLines * lineHeight + padY * 2, 34);
    if (currentY + rowH > maxY) {
      const next = createPageCanvas();
      canvas = next.canvas;
      ctx = next.ctx;
      canvases.push(canvas);
      currentY = drawHeader(false);
    }

    ctx.fillStyle = i % 2 === 0 ? '#ffffff' : '#f8fafc';
    ctx.fillRect(MARGIN_X, currentY, CONTENT_WIDTH, rowH);

    let x = MARGIN_X;
    for (const h of scaledHeaders) {
      ctx.strokeStyle = '#64748b';
      ctx.lineWidth = 1;
      ctx.strokeRect(x, currentY, h.pixelWidth, rowH);

      ctx.fillStyle = '#0f172a';
      ctx.font = `500 12.5px ${FONT_SANS}`;
      wrapped[h.key].forEach((line, lIdx) => {
        ctx.fillText(line, x + padX, currentY + padY + lIdx * lineHeight);
      });
      x += h.pixelWidth;
    }

    currentY += rowH;
  }

  StampPageFooters(
    canvases,
    'LR Master Ledger & Forensic Audit Engine · Evidence-Linked Forensic Report (Traceable)'
  );

  const pdfBlob = buildPdfBlobFromCanvases(canvases);
  const dateTag = new Date().toISOString().slice(0, 10);
  triggerPdfDownload(pdfBlob, `${fileNamePrefix}_${dateTag}.pdf`);
}

