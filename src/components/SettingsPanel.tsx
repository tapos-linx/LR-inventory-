import React, { useState } from 'react';
import {
  X,
  Sun,
  Moon,
  Monitor,
  Smartphone,
  RotateCcw,
  FolderTree,
  Trash2,
  FileArchive,
  Sparkles,
  Loader2,
  ExternalLink,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
} from 'lucide-react';
import { DynamicColumn, IngestedArchiveNode, IngestionSummary, LandRecord } from '../types/landRecord';
import { REPOSITORY_CONFIG } from '../config/repository';
import { generateSampleArchiveZip, parseZipIngestion } from '../utils/archiveParser';
import { toBengaliNumber } from '../utils/bengaliNumerals';
import { ArchiveTreeView } from './ArchiveTreeView';

export type ThemeMode = 'dark' | 'light' | 'system';

interface SettingsPanelProps {
  isOpen: boolean;
  onClose: () => void;
  themeMode: ThemeMode;
  onChangeTheme: (mode: ThemeMode) => void;
  onOpenApkModal: () => void;
  onIngestionComplete: (
    records: LandRecord[],
    summary: IngestionSummary,
    tree: IngestedArchiveNode,
    replaceExisting: boolean
  ) => void;
  onResetToSample: () => void;
  archiveTree: IngestedArchiveNode | null;
  records: LandRecord[];
  onSelectRecord: (rec: LandRecord) => void;
  onOpenIngestModal: () => void;
  onPurgeCacheNow: () => Promise<void>;
  generatedCacheCount: number;
  columns: DynamicColumn[];
}

export const SettingsPanel: React.FC<SettingsPanelProps> = ({
  isOpen,
  onClose,
  themeMode,
  onChangeTheme,
  onOpenApkModal,
  onIngestionComplete,
  onResetToSample,
  archiveTree,
  records,
  onSelectRecord,
  onOpenIngestModal,
  onPurgeCacheNow,
  generatedCacheCount,
}) => {
  const [isBusySample, setIsBusySample] = useState(false);
  const [showArchiveInspector, setShowArchiveInspector] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const showTempMsg = (msg: string) => {
    setFeedbackMsg(msg);
    setTimeout(() => setFeedbackMsg(null), 5000);
  };

  const handleLoadSampleArchive = async () => {
    if (isBusySample) return;
    setIsBusySample(true);
    try {
      const zipBlob = await generateSampleArchiveZip();
      const file = new File([zipBlob], 'Bangladesh_Land_Records_Sample_Archive.zip', {
        type: 'application/zip',
      });
      const res = await parseZipIngestion(file);
      onIngestionComplete(res.records, res.summary, res.tree, true);
      showTempMsg(
        `নমুনা আর্কাইভ থেকে ${toBengaliNumber(res.records.length)} টি রেকর্ড সফলভাবে লোড হয়েছে!`
      );
    } finally {
      setIsBusySample(false);
    }
  };

  const handleDownloadSampleZip = async () => {
    if (isBusySample) return;
    setIsBusySample(true);
    try {
      const zipBlob = await generateSampleArchiveZip();
      const url = URL.createObjectURL(zipBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'LR_Sample_Land_Archive.zip';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      showTempMsg('নমুনা আর্কাইভ .ZIP ডাউনলোড হয়েছে।');
    } finally {
      setIsBusySample(false);
    }
  };

  const handleReset = () => {
    onResetToSample();
    showTempMsg('ডিফল্ট নমুনা মাস্টার লেজার ডাটা রিসেট করা হয়েছে।');
  };

  const handlePurgeCache = async () => {
    await onPurgeCacheNow();
    showTempMsg('অ্যাপের সকল জেনারেটেড ক্যাশ ফাইল সফলভাবে মুছে ফেলা হয়েছে।');
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/55 backdrop-blur-sm no-print font-bengali">
      <div className="fixed inset-0" onClick={onClose} aria-hidden="true" />

      <aside className="relative z-10 w-full max-w-lg h-full glass-surface border-l border-[var(--border-subtle)] shadow-2xl flex flex-col overflow-hidden">
        <div className="px-5 py-4 border-b border-[var(--border-subtle)] flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-[var(--text-primary)]">
              সেটিংস ও অ্যাপ ইউটিলিটিজ
            </h2>
            <p className="text-xs text-[var(--text-muted)]">
              থিম, অ্যান্ড্রয়েড APK, নমুনা ডাটা, আর্কাইভ ট্রি ও ক্যাশ ব্যবস্থাপনা
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-[var(--surface-input)] text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors cursor-pointer"
            aria-label="সেটিংস বন্ধ করুন"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {feedbackMsg && (
            <div className="surface-3d-subtle px-3.5 py-2.5 border-[var(--border-accent)] flex items-center gap-2 text-xs font-semibold text-[var(--accent-emerald)]">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{feedbackMsg}</span>
            </div>
          )}

          {/* 1. Theme Mode Selector */}
          <section className="surface-3d-subtle p-4 space-y-3">
            <div className="text-xs font-bold text-[var(--text-primary)]">
              ইন্টারফেস থিম (Light / Dark Mode)
            </div>
            <div className="grid grid-cols-3 gap-2 p-1 rounded-xl bg-[var(--surface-input)] border border-[var(--border-subtle)] text-xs">
              <button
                type="button"
                onClick={() => onChangeTheme('dark')}
                className={`py-2 px-2 rounded-lg font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
                  themeMode === 'dark'
                    ? 'bg-emerald-500 text-slate-950'
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                }`}
              >
                <Moon className="w-3.5 h-3.5" />
                <span>ডার্ক</span>
              </button>
              <button
                type="button"
                onClick={() => onChangeTheme('light')}
                className={`py-2 px-2 rounded-lg font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
                  themeMode === 'light'
                    ? 'bg-amber-400 text-slate-950'
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                }`}
              >
                <Sun className="w-3.5 h-3.5" />
                <span>লাইট</span>
              </button>
              <button
                type="button"
                onClick={() => onChangeTheme('system')}
                className={`py-2 px-2 rounded-lg font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
                  themeMode === 'system'
                    ? 'bg-emerald-500 text-slate-950'
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                }`}
              >
                <Monitor className="w-3.5 h-3.5" />
                <span>সিস্টেম</span>
              </button>
            </div>
          </section>

          {/* 2. Android APK & Offline Mobile App */}
          <section className="surface-3d-subtle p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-bold text-[var(--text-primary)]">
                <Smartphone className="w-4 h-4 text-[var(--accent-gold)]" />
                <span>অ্যান্ড্রয়েড APK ও অফলাইন মোবাইল অ্যাপ</span>
              </div>
              <span className="font-mono-num text-[11px] text-[var(--text-muted)]">
                {REPOSITORY_CONFIG.currentVersion}
              </span>
            </div>
            <p className="text-xs text-[var(--text-secondary)]">
              মোবাইলে অফলাইনে ব্যবহার করতে নেটিভ অ্যান্ড্রয়েড APK ডাউনলোড বা PWA ইনস্টল হাব খুলুন।
            </p>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenApkModal();
                }}
                className="flex-1 btn-3d px-3.5 py-2.5 rounded-xl bg-gradient-to-r from-amber-400 to-yellow-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Smartphone className="w-3.5 h-3.5" />
                <span>APK ডাউনলোড ও ইনস্টল হাব</span>
              </button>
              <a
                href={REPOSITORY_CONFIG.fallbackApkDownloadUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3.5 py-2.5 rounded-xl bg-[var(--surface-input)] hover:bg-emerald-500/15 border border-[var(--border-subtle)] text-xs font-semibold text-[var(--text-primary)] flex items-center gap-1.5 transition-colors"
              >
                <ExternalLink className="w-3.5 h-3.5 text-[var(--accent-emerald)]" />
                <span>GitHub .APK</span>
              </a>
            </div>
          </section>

          {/* 3. Sample & Demo Data Tools */}
          <section className="surface-3d-subtle p-4 space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold text-[var(--text-primary)]">
              <Sparkles className="w-4 h-4 text-[var(--accent-emerald)]" />
              <span>নমুনা ও ডেমো ডাটা টুলস</span>
            </div>
            <p className="text-xs text-[var(--text-secondary)]">
              অ্যাপের সকল ফিচার দ্রুত পরীক্ষা করতে নমুনা আর্কাইভ ইনজেস্ট, ডাউনলোড অথবা রিসেট করুন।
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <button
                type="button"
                onClick={handleLoadSampleArchive}
                disabled={isBusySample}
                className="px-3 py-2.5 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 border border-[var(--border-accent)] text-xs font-semibold text-[var(--accent-emerald)] flex items-center justify-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
              >
                {isBusySample ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Sparkles className="w-3.5 h-3.5" />
                )}
                <span>১-ক্লিকে নমুনা ইনজেস্ট</span>
              </button>

              <button
                type="button"
                onClick={handleDownloadSampleZip}
                disabled={isBusySample}
                className="px-3 py-2.5 rounded-xl bg-[var(--surface-input)] hover:bg-amber-500/15 border border-[var(--border-subtle)] text-xs font-semibold text-[var(--text-primary)] flex items-center justify-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
              >
                <FileArchive className="w-3.5 h-3.5 text-[var(--accent-gold)]" />
                <span>নমুনা ZIP ডাউনলোড</span>
              </button>
            </div>
            <button
              type="button"
              onClick={handleReset}
              className="w-full px-3 py-2 rounded-xl bg-[var(--surface-input)] hover:bg-rose-500/10 border border-[var(--border-subtle)] text-xs font-semibold text-[var(--text-secondary)] hover:text-rose-400 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>ডিফল্ট নমুনা ডাটায় রিসেট করুন</span>
            </button>
          </section>

          {/* 4. Archive Tree Inspector */}
          <section className="surface-3d-subtle p-4 space-y-3">
            <button
              type="button"
              onClick={() => setShowArchiveInspector(!showArchiveInspector)}
              className="w-full flex items-center justify-between text-xs font-bold text-[var(--text-primary)] cursor-pointer"
            >
              <span className="flex items-center gap-2">
                <FolderTree className="w-4 h-4 text-[var(--accent-gold)]" />
                <span>আর্কাইভ ফাইল ট্রি ইন্সপেক্টর (Archive Tree)</span>
              </span>
              {showArchiveInspector ? (
                <ChevronDown className="w-4 h-4 text-[var(--text-muted)]" />
              ) : (
                <ChevronRight className="w-4 h-4 text-[var(--text-muted)]" />
              )}
            </button>

            {showArchiveInspector && (
              <div className="pt-2 border-t border-[var(--border-subtle)] max-h-[380px] overflow-y-auto">
                <ArchiveTreeView
                  tree={archiveTree}
                  records={records}
                  onSelectRecord={(rec) => {
                    onClose();
                    onSelectRecord(rec);
                  }}
                  onOpenIngest={() => {
                    onClose();
                    onOpenIngestModal();
                  }}
                />
              </div>
            )}
          </section>

          {/* 5. Auto-Exit Cache Purge */}
          <section className="surface-3d-subtle p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-bold text-[var(--text-primary)]">
                <Trash2 className="w-4 h-4 text-rose-400" />
                <span>অটো-এক্সিট ক্যাশ ক্লিনার</span>
              </div>
              <span className="font-mono-num text-xs text-[var(--text-muted)]">
                ট্র্যাককৃত: {toBengaliNumber(generatedCacheCount)}
              </span>
            </div>
            <p className="text-xs text-[var(--text-secondary)]">
              অ্যাপ বন্ধ করলে সকল জেনারেটেড টেম্প ফাইল ও Blob URL স্বয়ংক্রিয়ভাবে মুছে যায়।
            </p>
            <button
              type="button"
              onClick={handlePurgeCache}
              className="w-full px-3 py-2.5 rounded-xl bg-rose-500/12 hover:bg-rose-500/20 border border-rose-500/35 text-xs font-semibold text-rose-400 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>তাৎক্ষণিক ক্যাশ মুছুন</span>
            </button>
          </section>

          <section className="px-1 text-[11px] text-[var(--text-muted)] flex items-center justify-between">
            <span>{REPOSITORY_CONFIG.owner}/{REPOSITORY_CONFIG.repo}</span>
            <span className="font-mono-num">{REPOSITORY_CONFIG.currentVersion}</span>
          </section>
        </div>
      </aside>
    </div>
  );
};
