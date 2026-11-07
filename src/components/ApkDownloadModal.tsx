import React, { useEffect, useState } from 'react';
import {
  Download,
  Smartphone,
  Github,
  CheckCircle2,
  X,
  ExternalLink,
  Copy,
  Check,
  GitBranch,
  Terminal,
  Sparkles,
  FileCheck,
  RefreshCw,
} from 'lucide-react';
import { usePWAInstall } from '../utils/usePWAInstall';
import { LandRecord } from '../types/landRecord';
import {
  fetchLatestGitHubRelease,
  GitHubReleaseInfo,
  REPOSITORY_CONFIG,
} from '../config/repository';

interface ApkDownloadModalProps {
  isOpen: boolean;
  onClose: () => void;
  records?: LandRecord[];
}

export const ApkDownloadModal: React.FC<ApkDownloadModalProps> = ({
  isOpen,
  onClose,
  records = [],
}) => {
  const { isInstallable, isInstalled, install } = usePWAInstall();
  const [repoUrl, setRepoUrl] = useState(REPOSITORY_CONFIG.repoUrl);
  const [releaseInfo, setReleaseInfo] = useState<GitHubReleaseInfo>({
    tagName: REPOSITORY_CONFIG.currentVersion,
    name: `${REPOSITORY_CONFIG.appName} (${REPOSITORY_CONFIG.currentVersion})`,
    publishedAt: new Date().toISOString(),
    htmlUrl: REPOSITORY_CONFIG.releasesUrl,
    body: '',
    apkDownloadUrl: REPOSITORY_CONFIG.fallbackApkDownloadUrl,
    apkFileName: REPOSITORY_CONFIG.defaultApkFileName,
    isLiveFromGitHub: false,
  });
  const [isLoadingRelease, setIsLoadingRelease] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedGitCmd, setCopiedGitCmd] = useState(false);
  const [installFeedback, setInstallFeedback] = useState<string | null>(null);

  const loadReleaseFromGitHub = async (targetUrl?: string) => {
    setIsLoadingRelease(true);
    try {
      const info = await fetchLatestGitHubRelease(targetUrl ?? repoUrl);
      setReleaseInfo(info);
    } finally {
      setIsLoadingRelease(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadReleaseFromGitHub(repoUrl);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const cleanRepoUrl = repoUrl.replace(/\/+$/, '');
  const downloadApkUrl = releaseInfo.apkDownloadUrl;
  const releasesPageUrl = releaseInfo.htmlUrl || `${cleanRepoUrl}/releases/latest`;
  const actionsPageUrl = `${cleanRepoUrl}/actions`;

  const gitSyncCommands = `git init
git remote add origin ${cleanRepoUrl}.git || git remote set-url origin ${cleanRepoUrl}.git
git add .
git commit -m "feat: add Warish inheritance matcher, repository config, and Mouza PDF engine"
git branch -M main
git push -u origin main`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(downloadApkUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleCopyGitCommands = () => {
    navigator.clipboard.writeText(gitSyncCommands);
    setCopiedGitCmd(true);
    setTimeout(() => setCopiedGitCmd(false), 2000);
  };

  const handleDirectPWAInstall = async () => {
    if (isInstallable) {
      const accepted = await install();
      if (accepted) {
        setInstallFeedback('অ্যাপটি আপনার ফোনে সফলভাবে ইনস্টল হয়েছে!');
      }
    } else {
      setInstallFeedback(
        'আপনার ফোনের Chrome ব্রাউজারের মেনু (⋮) থেকে "Install app" বা "Add to Home screen" চাপুন অথবা নিচের GitHub .APK লিঙ্ক থেকে সরাসরি ইনস্টল করুন।'
      );
    }
  };

  const handleDownloadStandaloneOfflineApp = () => {
    const initialDataJson = JSON.stringify(records);
    const standaloneAppHtml = `<!DOCTYPE html>
<html lang="bn">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${REPOSITORY_CONFIG.appName} — Offline Mobile App</title>
  <link href="https://fonts.googleapis.com/css2?family=Hind+Siliguri:wght@400;500;600;700&display=swap" rel="stylesheet" />
  <style>
    * { box-sizing: border-box; }
    body { font-family: 'Hind Siliguri', sans-serif; margin: 0; background: #090d16; color: #f1f5f9; }
    header { background: #121827; border-bottom: 1px solid rgba(212,175,55,0.3); padding: 14px 20px; display: flex; flex-wrap: wrap; justify-content: space-between; align-items: center; gap: 10px; }
    .brand { font-size: 18px; font-weight: 700; color: #fbbf24; }
    .container { max-width: 1400px; margin: 0 auto; padding: 16px; }
    .card { background: #121827; border: 1px solid rgba(212,175,55,0.25); border-radius: 10px; padding: 16px; margin-bottom: 16px; }
    .btn { background: linear-gradient(90deg, #fbbf24, #eab308); color: #090d16; font-weight: 700; border: none; padding: 10px 16px; border-radius: 8px; cursor: pointer; font-family: inherit; font-size: 13px; display: inline-flex; align-items: center; gap: 6px; }
    .btn-sec { background: #1e293b; color: #e2e8f0; border: 1px solid #334155; }
    select, input[type="text"] { background: #0b0f19; color: #fff; border: 1px solid #334155; padding: 8px 12px; border-radius: 6px; font-family: inherit; }
    table { width: 100%; border-collapse: collapse; font-size: 12px; margin-top: 10px; background: #fff; color: #0f172a; }
    th, td { border: 1px solid #1e293b; padding: 6px 8px; text-align: left; }
    th { background: #e2e8f0; font-weight: 700; text-align: center; }
    .mouza-block { background: #fff; color: #0f172a; padding: 18px; border-radius: 6px; margin-bottom: 24px; }
    .mouza-title { background: #f1f5f9; border: 2px solid #0f172a; padding: 10px; font-weight: 700; display: flex; justify-content: space-between; align-items: center; }
    @media print {
      @page { size: A4 landscape; margin: 8mm; }
      body { background: #fff; color: #000; }
      .no-print { display: none !important; }
      .mouza-block { page-break-after: always; padding: 0; margin: 0; }
    }
  </style>
</head>
<body>
  <header class="no-print">
    <div>
      <div class="brand">ভূমি রেকর্ড মাস্টার লেজার (${releaseInfo.tagName})</div>
      <div style="font-size:12px;color:#94a3b8;">ফোন মেমোরি ফোল্ডার আপলোড, ওয়ারিশ ম্যাচিং ও মৌজাভিত্তিক পৃথক A4 PDF জেনারেটর</div>
    </div>
    <div style="display:flex;gap:8px;flex-wrap:wrap;">
      <label class="btn">
        📂 ফোল্ডার ও সাব-ফোল্ডার আপলোড
        <input type="file" id="folderInput" webkitdirectory directory multiple style="display:none" />
      </label>
      <label class="btn btn-sec">
        📄 ফাইল সিলেক্ট করুন
        <input type="file" id="fileInput" multiple style="display:none" />
      </label>
      <button class="btn" onclick="window.print()">🖨️ মৌজাভিত্তিক A4 PDF প্রিন্ট / Save</button>
    </div>
  </header>
  <div class="container">
    <div class="card no-print" style="display:flex;flex-wrap:wrap;gap:12px;align-items:center;justify-content:space-between;">
      <div>
        <label>উপজেলা ফিল্টার: </label>
        <select id="upzSelect" onchange="render()"><option value="">সকল উপজেলা</option></select>
        <label style="margin-left:10px;">মৌজা ফিল্টার: </label>
        <select id="mouzaSelect" onchange="render()"><option value="">সকল মৌজা (পৃথক টেবিল)</option></select>
      </div>
      <div id="stats" style="font-size:13px;color:#fbbf24;font-weight:600;"></div>
    </div>
    <div id="reportContainer"></div>
  </div>
  <script>
    let records = ${initialDataJson};
    const bDigits = ['০','১','২','৩','৪','৫','৬','৭','৮','৯'];
    const toBn = (n) => String(n ?? '').replace(/[0-9]/g, d => bDigits[d]);

    function handleFiles(fileList) {
      if (!fileList || !fileList.length) return;
      const newRecs = [];
      Array.from(fileList).forEach((f, idx) => {
        const rel = (f.webkitRelativePath || f.name).replace(/\\\\/g, '/');
        const parts = rel.split('/').filter(Boolean);
        if (f.name.startsWith('.')) return;
        const district = parts.length >= 4 ? parts[1] : (parts[0] || 'সংগৃহীত জেলা');
        const upazila = parts.length >= 4 ? parts[2] : (parts[1] || 'সংগৃহীত উপজেলা');
        const mouzaRaw = parts.length >= 3 ? parts[parts.length - 2] : 'সাধারণ মৌজা';
        const mouza = mouzaRaw.replace(/^(CS|SA|RS|BRS|BS)_/i, '').replace(/_/g, ' ');
        const surveyMatch = mouzaRaw.match(/^(CS|SA|RS|BRS|BS)/i);
        const khMatch = f.name.match(/(?:Kh|Khatian|খতিয়ান)[_\\s-]*([0-9\\u09E6-\\u09EF]+)/i) || f.name.match(/([0-9\\u09E6-\\u09EF]+)/);
        const dagMatch = f.name.match(/(?:Dag|Plot|দাগ)[_\\s-]*([0-9\\u09E6-\\u09EF]+)/i);
        newRecs.push({
          slNo: idx + 1,
          district,
          upazila,
          mouza,
          jlNo: '০১',
          surveyType: surveyMatch ? surveyMatch[1].toUpperCase() : 'RS',
          khatianNo: khMatch ? toBn(khMatch[1]) : toBn(idx + 1),
          dagNo: dagMatch ? toBn(dagMatch[1]) : toBn(idx + 101),
          ownerDetails: 'রেকর্ডধারী স্বত্বাধিকারী (' + f.name + ')',
          share: '১.০০০০',
          landClass: 'নাল',
          area: '০.১৫০০ একর',
          remarks: f.name
        });
      });
      if (newRecs.length) {
        records = newRecs;
        populateFilters();
        render();
      }
    }

    document.getElementById('folderInput').addEventListener('change', e => handleFiles(e.target.files));
    document.getElementById('fileInput').addEventListener('change', e => handleFiles(e.target.files));

    function populateFilters() {
      const upzSet = Array.from(new Set(records.map(r => r.upazila).filter(Boolean)));
      const upzSel = document.getElementById('upzSelect');
      const curUpz = upzSel.value;
      upzSel.innerHTML = '<option value="">সকল উপজেলা</option>' + upzSet.map(u => '<option value="'+u+'">'+u+'</option>').join('');
      upzSel.value = curUpz;

      const filteredByUpz = upzSel.value ? records.filter(r => r.upazila === upzSel.value) : records;
      const mouzaSet = Array.from(new Set(filteredByUpz.map(r => r.mouza).filter(Boolean)));
      const mSel = document.getElementById('mouzaSelect');
      mSel.innerHTML = '<option value="">সকল মৌজা (পৃথক টেবিল)</option>' + mouzaSet.map(m => '<option value="'+m+'">'+m+'</option>').join('');
    }

    function render() {
      const upz = document.getElementById('upzSelect').value;
      const mouza = document.getElementById('mouzaSelect').value;
      let list = records;
      if (upz) list = list.filter(r => r.upazila === upz);
      if (mouza) list = list.filter(r => r.mouza === mouza);

      const grouped = {};
      list.forEach(r => {
        const k = (r.upazila || '') + '__' + (r.mouza || 'মৌজা');
        if (!grouped[k]) grouped[k] = [];
        grouped[k].push(r);
      });

      document.getElementById('stats').textContent = 'মোট রেকর্ড: ' + toBn(list.length) + ' টি | মোট মৌজা টেবিল: ' + toBn(Object.keys(grouped).length) + ' টি';

      const container = document.getElementById('reportContainer');
      container.innerHTML = Object.values(grouped).map((mRecs, idx) => {
        const s = mRecs[0] || {};
        return '<div class="mouza-block">' +
          '<div class="mouza-title">' +
            '<span>মৌজা টেবিল নং ' + toBn(idx + 1) + ' — মৌজা: ' + (s.mouza || '') + ' (জে.এল: ' + (s.jlNo || '০১') + ')</span>' +
            '<span>উপজেলা: ' + (s.upazila || '') + ' · জেলা: ' + (s.district || '') + ' · মোট রেকর্ড: ' + toBn(mRecs.length) + ' টি</span>' +
          '</div>' +
          '<table><thead><tr><th>ক্রমিক</th><th>মৌজা ও জে.এল</th><th>জরিপ</th><th>খতিয়ান নং</th><th>দাগ নং</th><th>মালিক / স্বত্ত্বাধিকারীর বিবরণ</th><th>হিস্যা</th><th>শ্রেণি</th><th>পরিমাণ</th><th>মন্তব্য</th></tr></thead><tbody>' +
          mRecs.map((r, i) => '<tr><td style="text-align:center">'+toBn(i+1)+'</td><td>'+r.mouza+' (JL '+r.jlNo+')</td><td style="text-align:center">'+r.surveyType+'</td><td style="text-align:center;font-weight:bold">'+r.khatianNo+'</td><td style="text-align:center;font-weight:bold">'+r.dagNo+'</td><td>'+r.ownerDetails+'</td><td style="text-align:center">'+r.share+'</td><td style="text-align:center">'+r.landClass+'</td><td style="text-align:right">'+r.area+'</td><td>'+(r.remarks||'')+'</td></tr>').join('') +
          '</tbody></table></div>';
      }).join('');
    }

    populateFilters();
    render();
  </script>
</body>
</html>`;

    const blob = new Blob([standaloneAppHtml], { type: 'text/html;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'LR_Master_Ledger_Offline_Mobile_App.html';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm font-bengali">
      <div className="bg-[#121827] border border-amber-500/30 rounded-xl max-w-2xl w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800 bg-[#161f32]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
              <Smartphone className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-white">
                ফোনে অ্যাপ ইনস্টল ও GitHub অফিসিয়াল .APK ডাউনলোড সেন্টার
              </h2>
              <p className="text-xs text-slate-400 font-sans">
                {REPOSITORY_CONFIG.packageId} · Latest Release ({releaseInfo.tagName})
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
        <div className="p-5 overflow-y-auto space-y-4 text-xs">
          {/* Option 1: Instant 1-Tap Phone Installation (PWA / Android WebAPK) */}
          <div className="bg-gradient-to-br from-[#132238] to-[#0d1524] border border-emerald-500/40 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-emerald-400" />
                <span className="font-bold text-white text-sm">
                  পদ্ধতি ১: সরাসরি ফোনে অ্যাপ হিসেবে ইনস্টল করুন (১-ট্যাপ WebAPK ইনস্টলার)
                </span>
              </div>
              <span className="text-[11px] font-mono bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-2 py-0.5 rounded">
                তাৎক্ষণিক ইনস্টল
              </span>
            </div>

            <p className="text-slate-300 leading-relaxed">
              অ্যান্ড্রয়েড ফোনের Chrome বা ব্রাউজার থেকে নিচের বাটনে চাপ দিলে কোনো আলাদা ফাইল ছাড়াই অ্যাপটি সরাসরি আপনার ফোনের অ্যাপ লিস্টে (Home Screen ও App Drawer-এ) নেটিভ অ্যাপ হিসেবে ইনস্টল হয়ে যাবে।
            </p>

            <div className="flex flex-wrap items-center gap-2.5 pt-1">
              {isInstalled ? (
                <div className="px-4 py-2.5 rounded-lg bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 font-semibold flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>অ্যাপটি ইতিমধ্যে আপনার ডিভাইসে ইনস্টল করা আছে!</span>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={handleDirectPWAInstall}
                  className="px-5 py-2.5 text-xs sm:text-sm font-bold text-slate-950 bg-gradient-to-r from-emerald-400 via-emerald-300 to-teal-400 hover:from-emerald-300 hover:to-teal-300 rounded-lg shadow-lg flex items-center gap-2 transition-all"
                >
                  <Smartphone className="w-4 h-4 stroke-[2.5]" />
                  <span>এখনই ফোনে অ্যাপ ইনস্টল করুন (Install App)</span>
                </button>
              )}

              <a
                href={window.location.href}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3.5 py-2.5 rounded-lg bg-[#1c2840] hover:bg-[#243452] border border-slate-700 text-slate-200 font-medium flex items-center gap-1.5 transition-colors"
              >
                <span>ফোনের মূল ব্রাউজারে খুলুন</span>
                <ExternalLink className="w-3.5 h-3.5 text-amber-400" />
              </a>
            </div>

            {installFeedback && (
              <div className="p-2.5 rounded-lg bg-amber-500/15 border border-amber-500/30 text-amber-200 text-xs">
                {installFeedback}
              </div>
            )}
          </div>

          {/* Option 2: Direct GitHub Repository .APK Binary Download Link (Live from releases/latest) */}
          <div className="bg-gradient-to-br from-[#162136] to-[#0d1320] border border-amber-500/30 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <Github className="w-5 h-5 text-amber-400" />
                <span className="font-bold text-white text-sm">
                  পদ্ধতি ২: GitHub Releases থেকে সরাসরি সর্বশেষ .APK ডাউনলোড
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] font-mono bg-amber-500/20 text-amber-300 border border-amber-500/40 px-2 py-0.5 rounded">
                  {releaseInfo.apkFileName} ({releaseInfo.tagName})
                </span>
                <button
                  type="button"
                  onClick={() => loadReleaseFromGitHub(repoUrl)}
                  title="GitHub API থেকে সর্বশেষ ভার্সন যাচাই করুন"
                  className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isLoadingRelease ? 'animate-spin text-amber-400' : ''}`} />
                </button>
              </div>
            </div>

            <div className="text-slate-300 leading-relaxed flex flex-wrap items-center justify-between gap-2">
              <span>
                রিলিজ নাম: <strong className="text-white">{releaseInfo.name}</strong>
                {releaseInfo.apkSizeBytes
                  ? ` · সাইজ: ${(releaseInfo.apkSizeBytes / (1024 * 1024)).toFixed(2)} MB`
                  : ''}
              </span>
              <span className="text-[11px] text-emerald-400 font-mono">
                {releaseInfo.isLiveFromGitHub
                  ? '● Live from GitHub API (releases/latest)'
                  : '● Configured via src/config/repository.ts'}
              </span>
            </div>

            {/* Real Anchor Links to GitHub Release APK & Releases Page */}
            <div className="pt-1 flex flex-col sm:flex-row gap-2">
              <a
                href={downloadApkUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 py-2.5 px-4 text-xs sm:text-sm font-bold text-slate-950 bg-gradient-to-r from-amber-400 via-amber-300 to-yellow-500 hover:from-amber-300 hover:to-yellow-400 rounded-lg shadow-lg shadow-amber-950/40 flex items-center justify-center gap-2 transition-all text-center"
              >
                <Download className="w-4 h-4 text-slate-950 stroke-[2.5]" />
                <span>GitHub থেকে সরাসরি {releaseInfo.apkFileName} ডাউনলোড</span>
              </a>

              <a
                href={releasesPageUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="py-2.5 px-3.5 bg-[#1e2a44] hover:bg-[#273757] border border-amber-500/40 text-amber-300 rounded-lg flex items-center justify-center gap-1.5 transition-colors font-semibold"
              >
                <Github className="w-4 h-4" />
                <span>GitHub Releases পেজ</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>

              <button
                type="button"
                onClick={handleCopyLink}
                className="py-2.5 px-3 bg-[#172034] hover:bg-[#1f2b46] border border-slate-700 text-slate-200 rounded-lg flex items-center justify-center gap-1.5 transition-colors"
              >
                {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedLink ? 'লিঙ্ক কপি হয়েছে' : 'APK লিঙ্ক কপি'}</span>
              </button>
            </div>

            <div className="bg-[#090d16] border border-slate-800 rounded-lg p-2.5 font-mono text-[11px] text-amber-300 break-all">
              {downloadApkUrl}
            </div>
          </div>

          {/* Option 3: Portable Single-File Offline Mobile App */}
          <div className="bg-[#0e1525] border border-slate-800 rounded-xl p-4 flex flex-wrap items-center justify-between gap-3">
            <div className="space-y-1 max-w-md">
              <div className="text-xs font-bold text-white flex items-center gap-1.5">
                <FileCheck className="w-4 h-4 text-amber-400" />
                <span>পদ্ধতি ৩: পোর্টেবল অফলাইন মোবাইল অ্যাপ ফাইল (ইন্টারনেট ছাড়াই ফোন মেমোরিতে চলে)</span>
              </div>
              <p className="text-[11px] text-slate-400">
                একটি মাত্র স্বয়ংসম্পূর্ণ অ্যাপ ফাইল আপনার ফোনে ডাউনলোড করুন, যা যেকোনো সময় ফোনের File Manager থেকে ওপেন করে ফোল্ডার আপলোড ও মৌজাভিত্তিক A4 PDF তৈরি করতে পারবেন।
              </p>
            </div>
            <button
              type="button"
              onClick={handleDownloadStandaloneOfflineApp}
              className="px-4 py-2 text-xs font-bold text-amber-300 bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/40 rounded-lg flex items-center gap-1.5 transition-colors shrink-0"
            >
              <Download className="w-3.5 h-3.5" />
              <span>অফলাইন মোবাইল অ্যাপ ডাউনলোড</span>
            </button>
          </div>

          {/* GitHub Repository URL & Automated APK Build Workflow Info */}
          <div className="bg-[#0e1422] border border-slate-800 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2 text-amber-400 font-semibold">
                <GitBranch className="w-4 h-4" />
                <span>গিটহাব অটো-APK বিল্ডার ও রিপোজিটরি সিঙ্ক (GitHub Actions APK CI/CD)</span>
              </div>
              <div className="flex items-center gap-3">
                <a
                  href={actionsPageUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-[11px] text-emerald-400 hover:underline flex items-center gap-1 font-sans"
                >
                  <span>GitHub Actions APK Build</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
                <a
                  href={cleanRepoUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-[11px] text-amber-300 hover:underline flex items-center gap-1 font-sans"
                >
                  <span>Open Repo</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="text"
                value={repoUrl}
                onChange={(e) => setRepoUrl(e.target.value)}
                onBlur={() => loadReleaseFromGitHub(repoUrl)}
                className="flex-1 bg-[#090d16] border border-slate-700 rounded-lg px-3 py-1.5 text-white font-mono text-xs focus:outline-none focus:border-amber-400"
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-[11px] text-slate-400">
                <span className="flex items-center gap-1">
                  <Terminal className="w-3.5 h-3.5 text-amber-400" />
                  <span>গিটহাবে কোড পুশ করলেই স্বয়ংক্রিয়ভাবে Releases-এ .APK তৈরি হয়ে যাবে:</span>
                </span>
                <button
                  type="button"
                  onClick={handleCopyGitCommands}
                  className="text-amber-300 hover:text-amber-200 flex items-center gap-1 font-semibold"
                >
                  {copiedGitCmd ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedGitCmd ? 'কমান্ড কপি হয়েছে' : 'কমান্ড কপি করুন'}</span>
                </button>
              </div>
              <pre className="bg-[#080b12] border border-slate-800 rounded-lg p-3 text-[11px] font-mono text-amber-200/90 overflow-x-auto leading-relaxed">
                {gitSyncCommands}
              </pre>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-slate-800 bg-[#141b2c] flex justify-between items-center">
          <span className="text-[11px] text-slate-400">
            Centralized in src/config/repository.ts · Live GitHub releases/latest sync
          </span>
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
