import React, { useState } from 'react';
import {
  Folder,
  FolderOpen,
  FileText,
  FileArchive,
  ChevronRight,
  ChevronDown,
  Layers,
  FileCheck,
  Search,
  Download,
  FileSpreadsheet,
  FileJson,
  Loader2,
} from 'lucide-react';
import { IngestedArchiveNode, LandRecord } from '../types/landRecord';
import { toBengaliNumber } from '../utils/bengaliNumerals';
import {
  exportGenericTableToCSV,
  exportGenericTableToExcel,
  exportToJSON,
  flattenArchiveTreeRows,
} from '../utils/exportUtils';
import { DEFAULT_COLUMNS } from '../utils/mockData';
import {
  downloadForensicReportTablePdf,
  downloadMouzaLandRecordsPdf,
} from '../utils/pdfDownloadEngine';

interface ArchiveTreeViewProps {
  tree: IngestedArchiveNode | null;
  records: LandRecord[];
  onSelectRecord: (record: LandRecord) => void;
  onOpenIngest: () => void;
}

const ARCHIVE_TREE_HEADERS = [
  { key: 'slNo', label: 'ক্রমিক', width: 80 },
  { key: 'nodeType', label: 'ধরণ (Folder/File)', width: 140 },
  { key: 'name', label: 'ফোল্ডার / ফাইলের নাম', width: 240 },
  { key: 'relativePath', label: 'সম্পূর্ণ রিলেটিভ পাথ (Relative Path)', width: 340 },
  { key: 'fileSize', label: 'আকার (Size)', width: 110 },
  { key: 'mouzaAndJl', label: 'ম্যাপকৃত মৌজা ও জে.এল.', width: 190 },
  { key: 'surveyKhatianDag', label: 'জরিপ, খতিয়ান ও দাগ নং', width: 210 },
  { key: 'ownerAndArea', label: 'মালিক ও জমির পরিমাণ', width: 290 },
];

export const ArchiveTreeView: React.FC<ArchiveTreeViewProps> = ({
  tree,
  records,
  onSelectRecord,
  onOpenIngest,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);
  const [downloadingNodePath, setDownloadingNodePath] = useState<string | null>(null);
  const [expandedPaths, setExpandedPaths] = useState<Record<string, boolean>>({
    '': true,
    'Master_LR_Records': true,
    'Master_LR_Records/কুমিল্লা': true,
    'Master_LR_Records/ব্রাহ্মণবাড়িয়া': true,
  });

  const toggleExpand = (path: string) => {
    setExpandedPaths((prev) => ({ ...prev, [path]: !prev[path] }));
  };

  const handleDownloadNodePdf = async (
    node: IngestedArchiveNode,
    matchedRecord: LandRecord | null
  ) => {
    if (downloadingNodePath) return;
    const nodeKey = node.path || node.name;
    setDownloadingNodePath(nodeKey);
    try {
      if (matchedRecord) {
        await downloadMouzaLandRecordsPdf(
          [matchedRecord],
          DEFAULT_COLUMNS,
          `Record_${matchedRecord.mouza}_Kh_${matchedRecord.khatianNo}_Dag_${matchedRecord.dagNo}`
        );
      } else {
        const rows = flattenArchiveTreeRows(node, records);
        await downloadForensicReportTablePdf({
          reportTitle: `ARCHIVE NODE MANIFEST: ${node.name}`,
          reportSubtitle: `পাথ: ${node.path || '/'} | মোট আইটেম: ${toBengaliNumber(rows.length)} টি`,
          headers: ARCHIVE_TREE_HEADERS,
          rows,
          fileNamePrefix: `Archive_Node_${node.name.replace(/[^a-zA-Z0-9\u0980-\u09FF_-]/g, '_')}`,
        });
      }
    } finally {
      setDownloadingNodePath(null);
    }
  };

  const handleDownloadNodeJson = (
    node: IngestedArchiveNode,
    matchedRecord: LandRecord | null
  ) => {
    if (matchedRecord) {
      exportToJSON(
        matchedRecord,
        `Record_${matchedRecord.mouza}_Kh_${matchedRecord.khatianNo}_Dag_${matchedRecord.dagNo}`
      );
    } else {
      exportToJSON(
        {
          nodeName: node.name,
          nodePath: node.path,
          flattenedRows: flattenArchiveTreeRows(node, records),
        },
        `Archive_Node_${node.name.replace(/[^a-zA-Z0-9\u0980-\u09FF_-]/g, '_')}`
      );
    }
  };

  const handleDownloadTreePdf = async () => {
    if (!tree || isDownloadingPdf) return;
    setIsDownloadingPdf(true);
    try {
      const rows = flattenArchiveTreeRows(tree, records);
      await downloadForensicReportTablePdf({
        reportTitle: 'ARCHIVE FILE-TREE & RECORD MAPPING MANIFEST (আর্কাইভ ফোল্ডার ও ফাইল ট্রি ম্যানিফেস্ট)',
        reportSubtitle: `সর্বমোট সক্রিয় খতিয়ান রেকর্ড: ${toBengaliNumber(records.length)} টি | ফোল্ডার ও ফাইল ম্যাপিং তালিকা`,
        headers: ARCHIVE_TREE_HEADERS,
        rows,
        fileNamePrefix: 'LR_Archive_File_Tree_Manifest',
      });
    } finally {
      setIsDownloadingPdf(false);
    }
  };

  const handleDownloadTreeExcel = () => {
    if (!tree) return;
    const rows = flattenArchiveTreeRows(tree, records);
    exportGenericTableToExcel(
      ARCHIVE_TREE_HEADERS,
      rows,
      'LR_Archive_File_Tree_Manifest',
      'আর্কাইভ ফাইল ট্রি'
    );
  };

  const handleDownloadTreeCsv = () => {
    if (!tree) return;
    const rows = flattenArchiveTreeRows(tree, records);
    exportGenericTableToCSV(ARCHIVE_TREE_HEADERS, rows, 'LR_Archive_File_Tree_Manifest');
  };

  const handleDownloadTreeJson = () => {
    if (!tree) return;
    exportToJSON(
      {
        generatedAt: new Date().toISOString(),
        totalMappedRecords: records.length,
        archiveTree: tree,
        flattenedManifest: flattenArchiveTreeRows(tree, records),
      },
      'LR_Archive_File_Tree_Manifest'
    );
  };

  const renderNode = (node: IngestedArchiveNode, depth = 0) => {
    const isExpanded = expandedPaths[node.path] ?? depth < 2;
    const isFolder = node.type === 'folder' || (node.children && node.children.length > 0);

    // Matching record for files
    const matchedRecord = !isFolder
      ? records.find(
          (r) =>
            r.relativePath === node.path ||
            r.fileName === node.name ||
            node.path.endsWith(r.fileName || '___')
        ) || null
      : null;

    if (
      searchTerm &&
      !node.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
      !node.children?.some((c) => c.name.toLowerCase().includes(searchTerm.toLowerCase()))
    ) {
      return null;
    }

    const nodeKey = node.path || node.name;

    return (
      <div key={nodeKey} className="select-none text-xs">
        <div
          className={`flex items-center justify-between py-1 px-2 rounded-md hover:bg-slate-800/60 transition-colors group ${
            matchedRecord ? 'cursor-pointer hover:bg-amber-500/10' : ''
          }`}
          style={{ paddingLeft: `${depth * 16 + 8}px` }}
          onClick={() => {
            if (isFolder) {
              toggleExpand(node.path);
            } else if (matchedRecord) {
              onSelectRecord(matchedRecord);
            }
          }}
        >
          <div className="flex items-center gap-2 flex-1 min-w-0">
            {isFolder ? (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  toggleExpand(node.path);
                }}
                className="p-0.5 text-slate-400 hover:text-white"
              >
                {isExpanded ? (
                  <ChevronDown className="w-3.5 h-3.5 text-amber-400" />
                ) : (
                  <ChevronRight className="w-3.5 h-3.5 text-slate-500" />
                )}
              </button>
            ) : (
              <span className="w-3.5" />
            )}

            {isFolder ? (
              isExpanded ? (
                <FolderOpen className="w-4 h-4 text-amber-400 shrink-0" />
              ) : (
                <Folder className="w-4 h-4 text-amber-500/80 shrink-0" />
              )
            ) : node.name.endsWith('.pdf') ? (
              <FileText className="w-4 h-4 text-rose-400 shrink-0" />
            ) : node.name.endsWith('.json') || node.name.endsWith('.csv') ? (
              <FileCheck className="w-4 h-4 text-emerald-400 shrink-0" />
            ) : (
              <FileArchive className="w-4 h-4 text-slate-400 shrink-0" />
            )}

            <span
              className={`truncate font-mono-num ${
                isFolder ? 'text-slate-200 font-semibold' : 'text-slate-300'
              }`}
            >
              {node.name}
            </span>

            {matchedRecord && (
              <span className="text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/30 px-1.5 py-0.2 rounded font-bengali">
                খতিয়ান {matchedRecord.khatianNo} (দাগ {matchedRecord.dagNo})
              </span>
            )}
          </div>

          <div className="flex items-center gap-1.5 text-[10px] text-slate-500 font-mono-num ml-2 shrink-0">
            {node.size && <span>{(node.size / 1024).toFixed(1)} KB</span>}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleDownloadNodePdf(node, matchedRecord);
              }}
              disabled={downloadingNodePath === nodeKey}
              className="px-1.5 py-0.5 rounded bg-emerald-950/60 hover:bg-emerald-900/80 border border-emerald-500/40 text-emerald-300 font-bold flex items-center gap-0.5 font-bengali transition-colors"
              title="এই আইটেমটি PDF হিসেবে সরাসরি লোকাল ডিস্কে ডাউনলোড করুন"
            >
              {downloadingNodePath === nodeKey ? (
                <Loader2 className="w-2.5 h-2.5 animate-spin" />
              ) : (
                <Download className="w-2.5 h-2.5" />
              )}
              <span>Download .PDF</span>
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleDownloadNodeJson(node, matchedRecord);
              }}
              className="px-1.5 py-0.5 rounded bg-purple-950/50 hover:bg-purple-900/70 border border-purple-500/30 text-purple-300 font-semibold flex items-center gap-0.5 font-bengali transition-colors"
              title="এই আইটেমটি JSON হিসেবে লোকাল ডিস্কে ডাউনলোড করুন"
            >
              <FileJson className="w-2.5 h-2.5" />
              <span>.JSON</span>
            </button>
            {matchedRecord && (
              <span className="text-amber-400 group-hover:inline hidden font-bengali">
                বিবরণ দেখুন →
              </span>
            )}
          </div>
        </div>

        {isFolder && isExpanded && node.children && (
          <div className="border-l border-slate-800/60 ml-4">
            {node.children.map((child) => renderNode(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="flex-1 flex flex-col bg-[#121827] border border-amber-500/20 rounded-xl overflow-hidden shadow-xl shadow-black/40 font-bengali">
      {/* Header */}
      <div className="p-3.5 border-b border-slate-800 bg-[#151c2d] flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
            <Layers className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-xs sm:text-sm font-bold text-white">
              ইনজেস্টেড আর্কাইভ ফাইল ট্রি ইন্সপেক্টর ও ম্যানিফেস্ট (File-Tree Manifest)
            </h2>
            <p className="text-[11px] text-slate-400">
              ফোল্ডার কাঠামো ও প্রতিটি খতিয়ান ফাইলের সাথে ডাটাবেজ রেকর্ডের ম্যাপিং — লোকাল ডিস্কে সেভ করুন
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-2.5" />
            <input
              type="text"
              placeholder="ফাইলের নাম সার্চ..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-[#0c101c] border border-slate-700/80 rounded-lg pl-8 pr-2.5 py-1 text-xs text-slate-200 focus:outline-none focus:border-amber-400"
            />
          </div>

          {tree && (
            <>
              <button
                onClick={handleDownloadTreePdf}
                disabled={isDownloadingPdf}
                className="px-3 py-1.5 text-xs font-bold text-slate-950 bg-gradient-to-r from-amber-400 to-yellow-400 hover:from-amber-300 hover:to-yellow-300 rounded-lg flex items-center gap-1 shadow transition-all"
                title="আর্কাইভ ফাইল ট্রি ম্যানিফেস্ট PDF হিসেবে লোকাল ডিস্কে সেভ করুন"
              >
                {isDownloadingPdf ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Download className="w-3.5 h-3.5 stroke-[2.5]" />
                )}
                <span>ট্রি ম্যানিফেস্ট PDF (.pdf)</span>
              </button>

              <button
                onClick={handleDownloadTreeExcel}
                className="px-2.5 py-1.5 text-xs font-semibold text-emerald-300 bg-emerald-950/50 hover:bg-emerald-900/60 border border-emerald-500/40 rounded-lg flex items-center gap-1 transition-colors"
                title="আর্কাইভ ফাইল ট্রি ম্যানিফেস্ট Excel হিসেবে লোকাল ডিস্কে সেভ করুন"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
                <span>Excel (.xlsx)</span>
              </button>

              <button
                onClick={handleDownloadTreeCsv}
                className="px-2.5 py-1.5 text-xs font-semibold text-sky-300 bg-sky-950/50 hover:bg-sky-900/60 border border-sky-500/40 rounded-lg flex items-center gap-1 transition-colors"
                title="আর্কাইভ ফাইল ট্রি ম্যানিফেস্ট CSV হিসেবে লোকাল ডিস্কে সেভ করুন"
              >
                <FileText className="w-3.5 h-3.5 text-sky-400" />
                <span>CSV</span>
              </button>

              <button
                onClick={handleDownloadTreeJson}
                className="px-2.5 py-1.5 text-xs font-semibold text-purple-300 bg-purple-950/50 hover:bg-purple-900/60 border border-purple-500/40 rounded-lg flex items-center gap-1 transition-colors"
                title="আর্কাইভ ফাইল ট্রি ম্যানিফেস্ট JSON হিসেবে লোকাল ডিস্কে সেভ করুন"
              >
                <FileJson className="w-3.5 h-3.5 text-purple-400" />
                <span>JSON</span>
              </button>
            </>
          )}

          <button
            onClick={onOpenIngest}
            className="px-3 py-1.5 text-xs font-semibold text-amber-200 bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/40 rounded-lg transition-colors flex items-center gap-1"
          >
            <span>নতুন আর্কাইভ যোগ করুন</span>
          </button>
        </div>
      </div>

      {/* Tree Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-1">
        {tree ? (
          renderNode(tree)
        ) : (
          <div className="p-12 text-center text-slate-400 space-y-3">
            <Folder className="w-12 h-12 text-slate-600 mx-auto" />
            <p className="text-sm font-medium text-slate-300">কোনো আর্কাইভ ট্রি ইনজেস্ট করা নেই</p>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              মাস্টার ZIP ফাইল অথবা ফোল্ডার ইনজেস্ট করলে সম্পূর্ণ ডিরেক্টরি ট্রি এবং ফাইলের সাথে খতিয়ান ডাটা এখানে প্রদর্শিত হবে।
            </p>
            <button
              onClick={onOpenIngest}
              className="px-4 py-2 text-xs font-semibold text-slate-950 bg-amber-400 hover:bg-amber-300 rounded-lg transition-colors"
            >
              আর্কাইভ আপলোড করুন
            </button>
          </div>
        )}
      </div>

      {/* Bottom Summary Bar */}
      <div className="p-3 border-t border-slate-800 bg-[#151c2d] flex items-center justify-between text-xs text-slate-400 font-mono-num">
        <span>রেকর্ড ম্যাপিং কাউন্টার: {toBengaliNumber(records.length)} টি খতিয়ান সক্রিয়</span>
        <span className="text-amber-400/80">হায়ারার্কি আর্কিটেকচার: LR Mass Downloader Compliant</span>
      </div>
    </div>
  );
};
