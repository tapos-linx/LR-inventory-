import React, { useCallback, useState } from 'react';
import {
  UploadCloud,
  FolderArchive,
  FileArchive,
  CheckCircle2,
  AlertCircle,
  X,
  FolderTree,
  Download,
  Loader2,
  Smartphone,
  Files,
  Layers,
} from 'lucide-react';
import { IngestedArchiveNode, IngestionSummary, LandRecord } from '../types/landRecord';
import {
  parseDirectoryHandleIngestion,
  parseDroppedItemsIngestion,
  parseFolderIngestion,
  parseZipIngestion,
} from '../utils/archiveParser';
import { toBengaliNumber } from '../utils/bengaliNumerals';
import { DEFAULT_COLUMNS } from '../utils/mockData';
import { downloadMouzaLandRecordsPdf } from '../utils/pdfDownloadEngine';

interface IngestionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onIngestionComplete: (
    records: LandRecord[],
    summary: IngestionSummary,
    tree: IngestedArchiveNode,
    replaceExisting: boolean
  ) => void;
}

export const IngestionModal: React.FC<IngestionModalProps> = ({
  isOpen,
  onClose,
  onIngestionComplete,
}) => {
  const [activeTab, setActiveTab] = useState<'folder' | 'mobile' | 'zip'>('folder');
  const [replaceExisting, setReplaceExisting] = useState<boolean>(true);
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentStatus, setCurrentStatus] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [lastSummary, setLastSummary] = useState<IngestionSummary | null>(null);
  const [lastExtractedRecords, setLastExtractedRecords] = useState<LandRecord[]>([]);
  const [isPdfDownloading, setIsPdfDownloading] = useState<boolean>(false);

  // Callback ref to ensure webkitdirectory & directory attributes are natively attached in DOM
  const setFolderInputAttributes = useCallback((node: HTMLInputElement | null) => {
    if (node) {
      node.setAttribute('webkitdirectory', '');
      node.setAttribute('directory', '');
      node.setAttribute('mozdirectory', '');
      node.setAttribute('msdirectory', '');
      node.setAttribute('odirectory', '');
      node.setAttribute('multiple', '');
    }
  }, []);

  if (!isOpen) return null;

  const handleZipFile = async (file: File) => {
    setErrorMsg(null);
    setIsProcessing(true);
    setProgress(5);
    setCurrentStatus('ZIP আর্কাইভ ও সকল সাব-ফোল্ডার আনপ্যাক করা হচ্ছে...');

    try {
      const result = await parseZipIngestion(file, (pct, path) => {
        setProgress(pct);
        setCurrentStatus(`পার্স করা হচ্ছে: ${path.split('/').pop()}`);
      });
      setLastSummary(result.summary);
      setLastExtractedRecords(result.records);
      setIsProcessing(false);
      onIngestionComplete(result.records, result.summary, result.tree, replaceExisting);
    } catch (err: any) {
      console.error(err);
      setErrorMsg(`আর্কাইভ পার্স করতে সমস্যা হয়েছে: ${err.message || 'অজ্ঞাত ত্রুটি'}`);
      setIsProcessing(false);
    }
  };

  const handleFolderOrFilesUpload = async (files: FileList | File[]) => {
    if (!files || files.length === 0) return;
    setErrorMsg(null);
    setIsProcessing(true);
    setProgress(5);
    setCurrentStatus(`ফোল্ডার ও সাব-ফোল্ডারের ${toBengaliNumber(files.length)} টি ফাইল স্ক্যান করা হচ্ছে...`);

    try {
      const result = await parseFolderIngestion(files, (pct, path) => {
        setProgress(pct);
        setCurrentStatus(`স্ক্যান হচ্ছে: ${path.split('/').pop()}`);
      });
      setLastSummary(result.summary);
      setLastExtractedRecords(result.records);
      setIsProcessing(false);
      onIngestionComplete(result.records, result.summary, result.tree, replaceExisting);
    } catch (err: any) {
      console.error(err);
      setErrorMsg(`ফোল্ডার বা ফাইল স্ক্যান করতে সমস্যা হয়েছে: ${err.message || 'অজ্ঞাত ত্রুটি'}`);
      setIsProcessing(false);
    }
  };

  const handleNativeDirectoryPicker = async () => {
    setErrorMsg(null);
    try {
      if ('showDirectoryPicker' in window) {
        const dirHandle = await (window as any).showDirectoryPicker({ mode: 'read' });
        setIsProcessing(true);
        setProgress(5);
        setCurrentStatus('নির্বাচিত ফোল্ডার ও সাব-ফোল্ডার রিড করা হচ্ছে...');
        const result = await parseDirectoryHandleIngestion(dirHandle, (pct, path) => {
          setProgress(pct);
          setCurrentStatus(`স্ক্যান হচ্ছে: ${path.split('/').pop()}`);
        });
        setLastSummary(result.summary);
        setLastExtractedRecords(result.records);
        setIsProcessing(false);
        onIngestionComplete(result.records, result.summary, result.tree, replaceExisting);
      } else {
        setErrorMsg(
          'আপনার ব্রাউজারে ডিরেক্টরি পিকার ব্লক করা আছে। নিচের "ফোল্ডার ব্রাউজ করুন" অথবা "মোবাইল ফাইল সিলেক্ট" বাটনটি ব্যবহার করুন।'
        );
      }
    } catch (err: any) {
      if (err?.name === 'AbortError') return;
      setErrorMsg(
        'ফোন মেমোরি বা আইফ্রেম সীমাবদ্ধতার কারণে সরাসরি ফোল্ডার পিকারের বদলে নিচের "ফোল্ডার ও সাব-ফোল্ডার নির্বাচন" বা "মোবাইল মেমোরি ফাইল নির্বাচন" বাটনে ট্যাপ করুন।'
      );
      setIsProcessing(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    setErrorMsg(null);
    setIsProcessing(true);
    setProgress(5);
    setCurrentStatus('ড্রপকৃত ফোল্ডার ও সাব-ফোল্ডারসমূহ স্ক্যান করা হচ্ছে...');

    try {
      const result = await parseDroppedItemsIngestion(e.dataTransfer, (pct, path) => {
        setProgress(pct);
        setCurrentStatus(`স্ক্যান হচ্ছে: ${path.split('/').pop()}`);
      });
      setLastSummary(result.summary);
      setLastExtractedRecords(result.records);
      setIsProcessing(false);
      onIngestionComplete(result.records, result.summary, result.tree, replaceExisting);
    } catch (err: any) {
      console.error(err);
      setErrorMsg(`ড্রপকৃত ফোল্ডার স্ক্যান ব্যর্থ: ${err.message || 'অজ্ঞাত ত্রুটি'}`);
      setIsProcessing(false);
    }
  };

  const handleDirectDownloadIngestedPdf = async () => {
    if (lastExtractedRecords.length === 0 || isPdfDownloading) return;
    setIsPdfDownloading(true);
    try {
      await downloadMouzaLandRecordsPdf(
        lastExtractedRecords,
        DEFAULT_COLUMNS,
        'Uploaded_Master_Records'
      );
    } finally {
      setIsPdfDownloading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm">
      <div className="bg-[#121827] border border-amber-500/30 rounded-xl max-w-2xl w-full max-h-[92vh] flex flex-col shadow-2xl shadow-black/80 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800 bg-[#161f32]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
              <UploadCloud className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-white font-bengali">
                ফোন মেমোরি, মাস্টার ফোল্ডার ও সাব-ফোল্ডার আপলোড ইঞ্জিন
              </h2>
              <p className="text-xs text-slate-400 font-bengali">
                আপনার ডাউনলোডকৃত সম্পূর্ণ ফোল্ডার (সকল সাব-ফোল্ডারসহ), ফাইল বা ZIP সরাসরি ইনডেক্স করুন
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 overflow-y-auto space-y-4">
          {/* Mode Selector Tabs */}
          <div className="grid grid-cols-3 gap-1.5 p-1 bg-[#0b0f19] border border-slate-800 rounded-lg">
            <button
              type="button"
              onClick={() => setActiveTab('folder')}
              className={`flex items-center justify-center gap-1.5 py-2 px-2 text-xs font-medium rounded-md transition-all font-bengali ${
                activeTab === 'folder'
                  ? 'bg-amber-500 text-slate-950 font-semibold shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <FolderTree className="w-3.5 h-3.5 shrink-0" />
              <span>মাস্টার ফোল্ডার ও সাব-ফোল্ডার</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('mobile')}
              className={`flex items-center justify-center gap-1.5 py-2 px-2 text-xs font-medium rounded-md transition-all font-bengali ${
                activeTab === 'mobile'
                  ? 'bg-amber-500 text-slate-950 font-semibold shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Smartphone className="w-3.5 h-3.5 shrink-0" />
              <span>ফোন মেমোরি মাল্টি-ফাইল</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('zip')}
              className={`flex items-center justify-center gap-1.5 py-2 px-2 text-xs font-medium rounded-md transition-all font-bengali ${
                activeTab === 'zip'
                  ? 'bg-amber-500 text-slate-950 font-semibold shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <FileArchive className="w-3.5 h-3.5 shrink-0" />
              <span>মাস্টার ZIP আর্কাইভ</span>
            </button>
          </div>

          {/* Replace vs Append Toggle */}
          <div className="bg-[#0e1525] border border-amber-500/20 rounded-lg px-3.5 py-2.5 flex items-center justify-between gap-3">
            <label className="flex items-center gap-2.5 text-xs text-slate-200 cursor-pointer font-bengali select-none">
              <input
                type="checkbox"
                checked={replaceExisting}
                onChange={(e) => setReplaceExisting(e.target.checked)}
                className="w-4 h-4 rounded border-slate-600 text-amber-500 focus:ring-amber-400"
              />
              <span>
                পূর্বের নমুনা ডাটা সরিয়ে <strong className="text-amber-300">শুধুমাত্র আমার আপলোডকৃত ফোল্ডারের সকল রেকর্ড</strong> টেবিলে ও PDF-এ রাখুন
              </span>
            </label>
          </div>

          {/* Direct Native Label Upload Cards (100% Mobile & Desktop Compatible) */}
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`border-2 border-dashed rounded-xl p-5 text-center transition-all ${
              isDragging
                ? 'border-amber-400 bg-amber-500/10 scale-[1.01]'
                : 'border-amber-500/40 bg-[#0d1322]'
            }`}
          >
            {activeTab === 'folder' && (
              <div className="space-y-4">
                <div className="w-12 h-12 rounded-full bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 mx-auto">
                  <FolderTree className="w-6 h-6" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-sm font-bold text-white font-bengali">
                    সম্পূর্ণ ফোল্ডার ও সকল সাব-ফোল্ডার একসাথে আপলোড করুন
                  </h3>
                  <p className="text-xs text-slate-400 font-bengali max-w-lg mx-auto">
                    আপনার মেমোরিতে থাকা প্রধান ফোল্ডারটি সিলেক্ট করলে তার ভেতরের সকল জেলা, উপজেলা ও মৌজার সাব-ফোল্ডার স্বয়ংক্রিয়ভাবে স্ক্যান হবে (কোনো ফাইল বাদ পড়বে না)।
                  </p>
                </div>

                {/* Native <label> triggers so Mobile & Iframe never block file dialogs */}
                <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-1">
                  <label className="relative cursor-pointer px-5 py-3 rounded-lg bg-gradient-to-r from-amber-400 via-amber-300 to-yellow-500 hover:from-amber-300 hover:to-yellow-400 text-slate-950 font-bold text-xs sm:text-sm shadow-lg shadow-amber-950/50 flex items-center justify-center gap-2 transition-all w-full sm:w-auto font-bengali">
                    <FolderArchive className="w-4 h-4 stroke-[2.5]" />
                    <span>ফোল্ডার ও সাব-ফোল্ডার ব্রাউজ করুন</span>
                    <input
                      type="file"
                      ref={setFolderInputAttributes}
                      className="sr-only"
                      onChange={(e) => {
                        if (e.target.files && e.target.files.length > 0) {
                          handleFolderOrFilesUpload(e.target.files);
                          e.target.value = '';
                        }
                      }}
                    />
                  </label>

                  <button
                    type="button"
                    onClick={handleNativeDirectoryPicker}
                    className="px-4 py-3 rounded-lg bg-[#182238] hover:bg-[#202d4a] border border-amber-500/30 text-amber-300 font-semibold text-xs sm:text-sm flex items-center justify-center gap-2 transition-colors w-full sm:w-auto font-bengali"
                  >
                    <Layers className="w-4 h-4 text-amber-400" />
                    <span>ডিরেক্টরি পিকার (সাব-ফোল্ডার স্ক্যানার)</span>
                  </button>
                </div>

                <div className="pt-2 border-t border-slate-800/80 text-[11px] text-slate-400 font-bengali">
                  💡 <strong className="text-amber-300">মোবাইল ব্যবহারকারীদের জন্য টিপস:</strong> কিছু ফোনের ডিফল্ট ফাইল ম্যানেজারে ফোল্ডার সিলেক্ট অপশন লক করা থাকলে পাশের{' '}
                  <button
                    type="button"
                    onClick={() => setActiveTab('mobile')}
                    className="text-amber-400 underline font-semibold hover:text-amber-300"
                  >
                    "ফোন মেমোরি মাল্টি-ফাইল"
                  </button>{' '}
                  ট্যাব অথবা{' '}
                  <button
                    type="button"
                    onClick={() => setActiveTab('zip')}
                    className="text-amber-400 underline font-semibold hover:text-amber-300"
                  >
                    "মাস্টার ZIP আর্কাইভ"
                  </button>{' '}
                  ব্যবহার করুন।
                </div>
              </div>
            )}

            {activeTab === 'mobile' && (
              <div className="space-y-4">
                <div className="w-12 h-12 rounded-full bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mx-auto">
                  <Smartphone className="w-6 h-6" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-sm font-bold text-white font-bengali">
                    ফোন মেমোরি থেকে সরাসরি ফাইল / রেকর্ড আপলোড (Android / iOS)
                  </h3>
                  <p className="text-xs text-slate-400 font-bengali max-w-lg mx-auto">
                    ফোনের File Manager থেকে এক বা একাধিক PDF, ছবি (JPG/PNG), Excel (.xlsx), CSV, JSON অথবা ZIP ফাইল একসাথে সিলেক্ট করুন।
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-1">
                  <label className="relative cursor-pointer px-6 py-3 rounded-lg bg-gradient-to-r from-emerald-400 via-emerald-300 to-teal-400 hover:from-emerald-300 hover:to-teal-300 text-slate-950 font-bold text-xs sm:text-sm shadow-lg flex items-center justify-center gap-2 transition-all w-full sm:w-auto font-bengali">
                    <Files className="w-4 h-4 stroke-[2.5]" />
                    <span>ফোন মেমোরি থেকে সকল ফাইল সিলেক্ট করুন</span>
                    <input
                      type="file"
                      multiple
                      className="sr-only"
                      onChange={(e) => {
                        if (e.target.files && e.target.files.length > 0) {
                          handleFolderOrFilesUpload(e.target.files);
                          e.target.value = '';
                        }
                      }}
                    />
                  </label>
                </div>
              </div>
            )}

            {activeTab === 'zip' && (
              <div className="space-y-4">
                <div className="w-12 h-12 rounded-full bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 mx-auto">
                  <FileArchive className="w-6 h-6" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-sm font-bold text-white font-bengali">
                    মাস্টার ZIP ফাইল আপলোড (সকল নেস্টেড সাব-ফোল্ডারসহ)
                  </h3>
                  <p className="text-xs text-slate-400 font-bengali max-w-lg mx-auto">
                    ফোনে ডাউনলোড করা যেকোনো <code className="text-amber-300">.zip</code> ফাইল সিলেক্ট করুন। এটি ব্রাউজারেই আনজিপ হয়ে ভেতরের সকল জেলা, উপজেলা ও মৌজা সাব-ফোল্ডার হুবহু অক্ষুণ্ণ রাখবে।
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-1">
                  <label className="relative cursor-pointer px-6 py-3 rounded-lg bg-gradient-to-r from-amber-400 via-amber-300 to-yellow-500 hover:from-amber-300 hover:to-yellow-400 text-slate-950 font-bold text-xs sm:text-sm shadow-lg flex items-center justify-center gap-2 transition-all w-full sm:w-auto font-bengali">
                    <FileArchive className="w-4 h-4 stroke-[2.5]" />
                    <span>ফোন বা পিসি থেকে ZIP ফাইল নির্বাচন করুন</span>
                    <input
                      type="file"
                      accept=".zip,application/zip,application/x-zip-compressed,multipart/x-zip,*/*"
                      className="sr-only"
                      onChange={(e) => {
                        if (e.target.files?.[0]) {
                          handleZipFile(e.target.files[0]);
                          e.target.value = '';
                        }
                      }}
                    />
                  </label>
                </div>
              </div>
            )}
          </div>

          {/* Progress Indicator */}
          {isProcessing && (
            <div className="bg-[#0b0f1a] border border-amber-500/30 rounded-lg p-4 space-y-2.5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-300 font-bengali flex items-center gap-2">
                  <Loader2 className="w-3.5 h-3.5 text-amber-400 animate-spin" />
                  {currentStatus}
                </span>
                <span className="font-mono-num text-amber-400 font-medium">{progress}%</span>
              </div>
              <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-amber-500 to-yellow-400 transition-all duration-200"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}

          {/* Error Message */}
          {errorMsg && (
            <div className="p-3 bg-red-950/40 border border-red-500/40 rounded-lg flex items-center gap-2.5 text-red-200 text-xs font-bengali">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Ingestion Success Report + Direct Mouza PDF Action */}
          {lastSummary && !isProcessing && (
            <div className="bg-[#0e1a24] border border-emerald-500/40 rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2 text-emerald-400 text-xs sm:text-sm font-bold font-bengali">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>
                    সফলভাবে ইনডেক্স হয়েছে! একটিও রেকর্ড বাদ পড়েনি ({toBengaliNumber(lastSummary.totalRecordsExtracted)} টি রেকর্ড প্রস্তুত)
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                <div className="bg-[#141d33] p-2.5 rounded-lg border border-slate-800">
                  <div className="text-slate-400 text-[11px] font-bengali">মোট ফাইল স্ক্যান</div>
                  <div className="text-white font-mono-num font-bold text-sm mt-0.5">
                    {toBengaliNumber(lastSummary.totalFiles)} টি
                  </div>
                </div>
                <div className="bg-[#141d33] p-2.5 rounded-lg border border-slate-800">
                  <div className="text-slate-400 text-[11px] font-bengali">সংগৃহীত রেকর্ড</div>
                  <div className="text-amber-400 font-mono-num font-bold text-sm mt-0.5">
                    {toBengaliNumber(lastSummary.totalRecordsExtracted)} টি
                  </div>
                </div>
                <div className="bg-[#141d33] p-2.5 rounded-lg border border-slate-800">
                  <div className="text-slate-400 text-[11px] font-bengali">উপজেলা সংখ্যা</div>
                  <div className="text-white font-mono-num font-bold text-sm mt-0.5">
                    {toBengaliNumber(lastSummary.upazilasFound.length)} টি
                  </div>
                </div>
                <div className="bg-[#141d33] p-2.5 rounded-lg border border-slate-800">
                  <div className="text-slate-400 text-[11px] font-bengali">মৌজা সংখ্যা</div>
                  <div className="text-emerald-400 font-mono-num font-bold text-sm mt-0.5">
                    {toBengaliNumber(lastSummary.mouzasFound.length)} টি
                  </div>
                </div>
              </div>

              <div className="text-xs text-slate-300 font-bengali bg-[#111829] p-2.5 rounded-lg border border-slate-800/80">
                <span className="text-amber-300 font-semibold">সনাক্তকৃত মৌজাসমূহ: </span>
                {lastSummary.mouzasFound.join(', ') || 'সকল মৌজা'}
              </div>

              <div className="flex flex-wrap items-center justify-end gap-2.5 pt-1">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-xs font-semibold text-slate-200 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors font-bengali"
                >
                  লেজার টেবিলে দেখুন
                </button>
                {lastExtractedRecords.length > 0 && (
                  <button
                    type="button"
                    onClick={handleDirectDownloadIngestedPdf}
                    disabled={isPdfDownloading}
                    className="px-4 py-2 text-xs font-bold text-slate-950 bg-gradient-to-r from-amber-400 to-yellow-400 hover:from-amber-300 hover:to-yellow-300 disabled:opacity-50 rounded-lg shadow flex items-center gap-1.5 font-bengali"
                  >
                    {isPdfDownloading ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Download className="w-3.5 h-3.5" />
                    )}
                    <span>
                      {isPdfDownloading
                        ? 'PDF তৈরি হচ্ছে...'
                        : 'সরাসরি মৌজাভিত্তিক PDF ডাউনলোড (.pdf)'}
                    </span>
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-slate-800 bg-[#141b2c] flex justify-between items-center">
          <span className="text-[11px] text-slate-400 font-bengali">
            ১০০% অফলাইন ব্রাউজার প্রসেসিং · কোনো ফাইল সার্ভারে যায় না
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-semibold text-slate-200 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors font-bengali"
          >
            বন্ধ করুন
          </button>
        </div>
      </div>
    </div>
  );
};
