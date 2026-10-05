import React, { useRef, useState } from 'react';
import {
  UploadCloud,
  FolderArchive,
  FileArchive,
  CheckCircle2,
  AlertCircle,
  X,
  FileText,
  FolderTree,
  Download,
  Loader2,
  Sparkles,
} from 'lucide-react';
import { IngestedArchiveNode, IngestionSummary, LandRecord } from '../types/landRecord';
import { generateSampleArchiveZip, parseFolderIngestion, parseZipIngestion } from '../utils/archiveParser';
import { toBengaliNumber } from '../utils/bengaliNumerals';

interface IngestionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onIngestionComplete: (records: LandRecord[], summary: IngestionSummary, tree: IngestedArchiveNode) => void;
}

export const IngestionModal: React.FC<IngestionModalProps> = ({
  isOpen,
  onClose,
  onIngestionComplete,
}) => {
  const [activeTab, setActiveTab] = useState<'zip' | 'folder'>('zip');
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentStatus, setCurrentStatus] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [lastSummary, setLastSummary] = useState<IngestionSummary | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleZipFile = async (file: File) => {
    if (!file.name.toLowerCase().endsWith('.zip')) {
      setErrorMsg('অনুগ্রহ করে একটি বৈধ .zip ফাইল নির্বাচন করুন।');
      return;
    }
    setErrorMsg(null);
    setIsProcessing(true);
    setProgress(5);
    setCurrentStatus('ZIP আর্কাইভ আনপ্যাক ও ইনডেক্সিং শুরু হচ্ছে...');

    try {
      const result = await parseZipIngestion(file, (pct, path) => {
        setProgress(pct);
        setCurrentStatus(`পার্স করা হচ্ছে: ${path.split('/').pop()}`);
      });
      setLastSummary(result.summary);
      setIsProcessing(false);
      onIngestionComplete(result.records, result.summary, result.tree);
    } catch (err: any) {
      console.error(err);
      setErrorMsg(`আর্কাইভ পার্স করতে সমস্যা হয়েছে: ${err.message || 'অজ্ঞাত ত্রুটি'}`);
      setIsProcessing(false);
    }
  };

  const handleFolderUpload = async (files: FileList) => {
    if (!files || files.length === 0) return;
    setErrorMsg(null);
    setIsProcessing(true);
    setProgress(5);
    setCurrentStatus('মাস্টার ফোল্ডারের ফাইল স্ক্যান করা হচ্ছে...');

    try {
      const result = await parseFolderIngestion(files, (pct, path) => {
        setProgress(pct);
        setCurrentStatus(`স্ক্যান হচ্ছে: ${path.split('/').pop()}`);
      });
      setLastSummary(result.summary);
      setIsProcessing(false);
      onIngestionComplete(result.records, result.summary, result.tree);
    } catch (err: any) {
      console.error(err);
      setErrorMsg(`ফোল্ডার স্ক্যান করতে সমস্যা হয়েছে: ${err.message || 'অজ্ঞাত ত্রুটি'}`);
      setIsProcessing(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      const firstFile = files[0];
      if (firstFile.name.toLowerCase().endsWith('.zip')) {
        await handleZipFile(firstFile);
      } else {
        // Drop folder or multi-files
        await handleFolderUpload(files);
      }
    }
  };

  const handleGenerateSampleZip = async () => {
    setIsProcessing(true);
    setCurrentStatus('টেস্টিং এর জন্য নমুনা মাস্টার ZIP আর্কাইভ তৈরি হচ্ছে...');
    try {
      const zipBlob = await generateSampleArchiveZip();
      const testFile = new File([zipBlob], 'Master_LR_Records_Sample.zip', {
        type: 'application/zip',
      });
      await handleZipFile(testFile);
    } catch (err: any) {
      setErrorMsg(`নমুনা জিপ তৈরি ব্যর্থ: ${err.message}`);
      setIsProcessing(false);
    }
  };

  const handleDownloadSampleZip = async () => {
    try {
      const zipBlob = await generateSampleArchiveZip();
      const url = URL.createObjectURL(zipBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'Sample_Master_LR_Records.zip';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err: any) {
      alert(`নমুনা জিপ ডাউনলোড ব্যর্থ: ${err.message}`);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
      <div className="bg-[#121827] border border-amber-500/30 rounded-xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl shadow-black/80 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-[#161f32]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
              <UploadCloud className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-white font-bengali">
                আর্কাইভ ইনজেশন ইঞ্জিন (Master Ingestion Engine)
              </h2>
              <p className="text-xs text-slate-400 font-bengali">
                LR Mass Downloader এর Master Folder অথবা ZIP ফাইল সরাসরি ব্রাউজারে ইনডেক্স করুন
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
        <div className="p-6 overflow-y-auto space-y-5">
          {/* Mode Selector Tabs */}
          <div className="flex items-center gap-2 p-1 bg-[#0b0f19] border border-slate-800 rounded-lg">
            <button
              onClick={() => setActiveTab('zip')}
              className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs font-medium rounded-md transition-all font-bengali ${
                activeTab === 'zip'
                  ? 'bg-amber-500 text-slate-950 font-semibold shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <FileArchive className="w-4 h-4" />
              <span>মাস্টার ZIP ফাইল ইনজেস্ট</span>
            </button>
            <button
              onClick={() => setActiveTab('folder')}
              className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs font-medium rounded-md transition-all font-bengali ${
                activeTab === 'folder'
                  ? 'bg-amber-500 text-slate-950 font-semibold shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <FolderArchive className="w-4 h-4" />
              <span>মাস্টার ফোল্ডার ডিরেক্টরি</span>
            </button>
          </div>

          {/* Path pattern guidance */}
          <div className="bg-[#0e1422] border border-amber-500/20 rounded-lg p-3 text-xs text-slate-300 space-y-1">
            <div className="text-amber-400 font-medium font-bengali flex items-center gap-1.5">
              <span>সমর্থিত হায়ারার্কি ফরম্যাট:</span>
            </div>
            <code className="block bg-[#080c15] p-2 rounded text-[11px] font-mono-num text-amber-200/90 break-all border border-slate-800/80">
              Master_LR_Records/[District]/[Upazila]/[SurveyType]_[MouzaName]_(JL_[JLNo]).[ext]
            </code>
            <p className="text-[11px] text-slate-400 font-bengali">
              * ফোল্ডারের মধ্যকার সকল PDF, ছবি, JSON ও CSV রেজিস্ট্রি স্বয়ংক্রিয়ভাবে স্ক্যান ও কলামাইজ হবে।
            </p>
          </div>

          {/* Drag & Drop Zone */}
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`border-2 border-dashed rounded-xl p-8 text-center transition-all cursor-pointer ${
              isDragging
                ? 'border-amber-400 bg-amber-500/10 scale-[1.01]'
                : 'border-slate-700/70 hover:border-amber-500/50 bg-[#0d1322]'
            }`}
            onClick={() => {
              if (activeTab === 'zip') {
                fileInputRef.current?.click();
              } else {
                folderInputRef.current?.click();
              }
            }}
          >
            <input
              type="file"
              ref={fileInputRef}
              accept=".zip"
              className="hidden"
              onChange={(e) => {
                if (e.target.files?.[0]) handleZipFile(e.target.files[0]);
              }}
            />
            <input
              type="file"
              ref={folderInputRef}
              // @ts-ignore
              webkitdirectory=""
              directory=""
              multiple
              className="hidden"
              onChange={(e) => {
                if (e.target.files) handleFolderUpload(e.target.files);
              }}
            />

            <div className="flex flex-col items-center justify-center space-y-3">
              <div className="w-14 h-14 rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 group-hover:scale-110 transition-transform">
                {activeTab === 'zip' ? (
                  <FileArchive className="w-7 h-7 stroke-[1.5]" />
                ) : (
                  <FolderTree className="w-7 h-7 stroke-[1.5]" />
                )}
              </div>
              <div>
                <p className="text-sm font-semibold text-white font-bengali">
                  {activeTab === 'zip'
                    ? 'মাস্টার ZIP ফাইল এখানে ড্র্যাগ ও ড্রপ করুন, অথবা ক্লিক করে ব্রাউজ করুন'
                    : 'সম্পূর্ণ মাস্টার ফোল্ডার ড্র্যাগ ও ড্রপ করুন অথবা নির্বাচন করুন'}
                </p>
                <p className="text-xs text-slate-400 mt-1 font-bengali">
                  ১০০% ক্লায়েন্ট-সাইড এক্সিকিউশন — কোনো ফাইল সার্ভারে আপলোড হয় না
                </p>
              </div>
            </div>
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
            <div className="p-3 bg-red-950/30 border border-red-500/40 rounded-lg flex items-center gap-2.5 text-red-200 text-xs font-bengali">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Ingestion Report if completed */}
          {lastSummary && !isProcessing && (
            <div className="bg-[#0e1628] border border-emerald-500/30 rounded-lg p-4 space-y-2">
              <div className="flex items-center gap-2 text-emerald-400 text-xs font-semibold font-bengali">
                <CheckCircle2 className="w-4 h-4" />
                <span>আর্কাইভ ইনজেশন সফলভাবে সম্পন্ন হয়েছে!</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 text-xs">
                <div className="bg-[#141d33] p-2 rounded border border-slate-800">
                  <div className="text-slate-400 text-[11px] font-bengali">মোট ফাইল</div>
                  <div className="text-white font-mono-num font-semibold mt-0.5">
                    {toBengaliNumber(lastSummary.totalFiles)}
                  </div>
                </div>
                <div className="bg-[#141d33] p-2 rounded border border-slate-800">
                  <div className="text-slate-400 text-[11px] font-bengali">খতিয়ান রেকর্ড</div>
                  <div className="text-amber-400 font-mono-num font-semibold mt-0.5">
                    {toBengaliNumber(lastSummary.totalRecordsExtracted)}
                  </div>
                </div>
                <div className="bg-[#141d33] p-2 rounded border border-slate-800">
                  <div className="text-slate-400 text-[11px] font-bengali">উপজেলা সংখ্যা</div>
                  <div className="text-white font-mono-num font-semibold mt-0.5">
                    {toBengaliNumber(lastSummary.upazilasFound.length)}
                  </div>
                </div>
                <div className="bg-[#141d33] p-2 rounded border border-slate-800">
                  <div className="text-slate-400 text-[11px] font-bengali">মৌজা সংখ্যা</div>
                  <div className="text-white font-mono-num font-semibold mt-0.5">
                    {toBengaliNumber(lastSummary.mouzasFound.length)}
                  </div>
                </div>
              </div>

              {lastSummary.extraColumnsDetected.length > 0 && (
                <div className="text-[11px] text-slate-300 font-bengali pt-1">
                  <span className="text-amber-300">স্বয়ংক্রিয়ভাবে সনাক্তকৃত কলাম: </span>
                  {lastSummary.extraColumnsDetected.join(', ')}
                </div>
              )}
            </div>
          )}

          {/* Sample Testing Triggers */}
          <div className="pt-2 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-3">
            <div className="text-xs text-slate-400 font-bengali">
              টেস্ট করতে চান? প্রস্তুতকৃত নমুনা আর্কাইভ ব্যবহার করুন:
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleDownloadSampleZip}
                className="px-3 py-1.5 text-xs font-medium text-slate-300 bg-[#162035] hover:bg-[#1f2b46] border border-slate-700 rounded-lg transition-colors flex items-center gap-1.5 font-bengali"
              >
                <Download className="w-3.5 h-3.5 text-amber-400" />
                <span>নমুনা ZIP ডাউনলোড</span>
              </button>
              <button
                type="button"
                onClick={handleGenerateSampleZip}
                disabled={isProcessing}
                className="px-3 py-1.5 text-xs font-medium text-amber-950 bg-gradient-to-r from-amber-400 to-yellow-400 hover:from-amber-300 hover:to-yellow-300 rounded-lg shadow transition-all flex items-center gap-1.5 font-bengali disabled:opacity-50"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>১-ক্লিকে নমুনা ইনজেস্ট</span>
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-slate-800 bg-[#141b2c] flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-200 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors font-bengali"
          >
            বন্ধ করুন
          </button>
        </div>
      </div>
    </div>
  );
};
