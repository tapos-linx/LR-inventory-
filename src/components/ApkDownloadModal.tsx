import React, { useState } from 'react';
import {
  Download,
  Smartphone,
  Github,
  CheckCircle2,
  AlertTriangle,
  X,
  ExternalLink,
  Shield,
  FileCode,
  Copy,
  Check,
} from 'lucide-react';

interface ApkDownloadModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ApkDownloadModal: React.FC<ApkDownloadModalProps> = ({ isOpen, onClose }) => {
  const [repoUrl, setRepoUrl] = useState(
    'https://github.com/tapos-cpl/lr-master-ledger-studio'
  );
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const downloadApkUrl = `${repoUrl}/releases/latest/download/LR_Master_Ledger_v1.0.apk`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(downloadApkUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSimulatedDownload = () => {
    // Generate a dummy helper file / trigger direct download
    const apkManifest = JSON.stringify(
      {
        appName: 'LR Master Ledger & Inventory Studio',
        version: '1.0.0',
        platform: 'Android APK',
        package: 'com.govtech.lrmasterledger',
        downloadUrl: downloadApkUrl,
        instructions:
          'Download and open LR_Master_Ledger_v1.0.apk on your Android device. Enable Install Unknown Sources in Settings.',
      },
      null,
      2
    );

    const blob = new Blob([apkManifest], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'LR_Master_Ledger_v1.0_APK_Manifest.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    // Also attempt window open for real github release url
    window.open(downloadApkUrl, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm font-bengali">
      <div className="bg-[#121827] border border-amber-500/30 rounded-xl max-w-xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-[#161f32]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
              <Smartphone className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-white">
                অ্যান্ড্রয়েড APK ডাউনলোড (Android Mobile APK)
              </h2>
              <p className="text-xs text-slate-400 font-sans">
                GitHub Repository Release · Offline Mobile Companion
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

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-4 text-xs">
          {/* Main Action Box */}
          <div className="bg-gradient-to-br from-[#162136] to-[#0d1320] border border-amber-500/30 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Github className="w-5 h-5 text-amber-400" />
                <span className="font-semibold text-white text-sm">
                  অফিসিয়াল APK রিলিজ প্যাকেজ
                </span>
              </div>
              <span className="text-[11px] font-mono bg-amber-500/20 text-amber-300 border border-amber-500/40 px-2 py-0.5 rounded">
                v1.0.0 Stable
              </span>
            </div>

            <p className="text-slate-300 leading-relaxed">
              সরাসরি যেকোনো অ্যান্ড্রয়েড ডিভাইসে ইনস্টল করে অফলাইনে ফিল্ডে বসে ভূমি রেকর্ড ও জিপ ফাইল ইনজেস্ট করুন এবং মৌজাভিত্তিক A4 PDF রিপোর্ট ডাউনলোড করুন।
            </p>

            {/* Direct Download Trigger */}
            <div className="pt-1 flex flex-col sm:flex-row gap-2">
              <button
                onClick={handleSimulatedDownload}
                className="flex-1 py-2.5 px-4 text-xs font-semibold text-slate-950 bg-gradient-to-r from-amber-400 via-amber-300 to-yellow-500 hover:from-amber-300 hover:to-yellow-400 active:scale-[0.98] rounded-lg shadow-lg shadow-amber-950/40 flex items-center justify-center gap-2 transition-all"
              >
                <Download className="w-4 h-4 text-slate-950 stroke-[2.5]" />
                <span>APK সরাসরি ডাউনলোড করুন (.apk)</span>
              </button>

              <button
                onClick={handleCopyLink}
                className="py-2.5 px-3 bg-[#1e2a44] hover:bg-[#273757] border border-slate-700 text-slate-200 rounded-lg flex items-center justify-center gap-1.5 transition-colors"
                title="GitHub Download লিঙ্ক কপি করুন"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'কপি হয়েছে' : 'লিঙ্ক কপি'}</span>
              </button>
            </div>
          </div>

          {/* GitHub Repository Info */}
          <div className="space-y-1.5">
            <label className="text-slate-400 block text-[11px]">
              গিটহাব রিপোজিটরি রিলিজ ইউআরএল (GitHub Repository URL):
            </label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={repoUrl}
                onChange={(e) => setRepoUrl(e.target.value)}
                className="flex-1 bg-[#0b0f19] border border-slate-700 rounded-lg px-3 py-1.5 text-white font-mono text-xs focus:outline-none focus:border-amber-400"
              />
              <a
                href={repoUrl}
                target="_blank"
                rel="noreferrer"
                className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition-colors flex items-center"
              >
                <ExternalLink className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Installation Steps */}
          <div className="bg-[#0e1422] border border-slate-800 rounded-lg p-3.5 space-y-2">
            <div className="text-amber-400 font-semibold flex items-center gap-1.5 text-xs">
              <Shield className="w-3.5 h-3.5" />
              <span>মোবাইলে APK ইনস্টলেশন নির্দেশিকা:</span>
            </div>
            <ol className="list-decimal list-inside space-y-1 text-slate-300 text-[11px] leading-relaxed">
              <li>উপরে উল্লেখিত বাটনে ক্লিক করে <strong className="text-white">LR_Master_Ledger_v1.0.apk</strong> ডাউনলোড করুন।</li>
              <li>মোবাইলের <strong className="text-white">Settings &gt; Security &gt; Install Unknown Apps</strong> অপশনটি চালু (Enable) করুন।</li>
              <li>ডাউনলোড শেষ হলে ফাইলটিতে ট্যাপ করে <strong className="text-white">Install</strong> বাটনে চাপ দিন।</li>
              <li>ইনস্টল শেষে যেকোনো উপজেলা বা মৌজার মাস্টার জিপ আর্কাইভ অফলাইনে সরাসরি লোড করে প্রিন্ট-রেডি PDF লেজার প্রস্তুত করুন।</li>
            </ol>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-slate-800 bg-[#141b2c] flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-semibold text-slate-200 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors"
          >
            বন্ধ করুন
          </button>
        </div>
      </div>
    </div>
  );
};
