import React, { useState } from 'react';
import {
  Search,
  CheckSquare,
  Square,
  ArrowUpDown,
  MoreVertical,
  Edit,
  Trash2,
  FileSpreadsheet,
  Printer,
  ChevronLeft,
  ChevronRight,
  Filter,
  CheckCircle2,
  SlidersHorizontal,
  Plus,
  Maximize2,
  Minimize2,
} from 'lucide-react';
import { DynamicColumn, LandRecord } from '../types/landRecord';
import {
  convertAcreToBigha,
  convertAcreToKatha,
  formatAreaBengali,
  parseAcreValue,
  toBengaliNumber,
} from '../utils/bengaliNumerals';

interface InventoryGridProps {
  records: LandRecord[];
  columns: DynamicColumn[];
  selectedIds: Set<string>;
  setSelectedIds: React.Dispatch<React.SetStateAction<Set<string>>>;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  selectedSurveyType: string;
  setSelectedSurveyType: (s: string) => void;
  selectedLandClass: string;
  setSelectedLandClass: (c: string) => void;
  onEditRecord: (record: LandRecord) => void;
  onDeleteRecord: (id: string) => void;
  onDeleteSelected: () => void;
  onPrintSelected: () => void;
  onExportSelected: () => void;
  onAddNewRecord: () => void;
}

export const InventoryGrid: React.FC<InventoryGridProps> = ({
  records,
  columns,
  selectedIds,
  setSelectedIds,
  searchQuery,
  setSearchQuery,
  selectedSurveyType,
  setSelectedSurveyType,
  selectedLandClass,
  setSelectedLandClass,
  onEditRecord,
  onDeleteRecord,
  onDeleteSelected,
  onPrintSelected,
  onExportSelected,
  onAddNewRecord,
}) => {
  const [sortField, setSortField] = useState<string>('slNo');
  const [sortAsc, setSortAsc] = useState<boolean>(true);
  const [density, setDensity] = useState<'compact' | 'normal' | 'spacious'>('normal');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(25);

  const visibleColumns = columns.filter((c) => c.visible).sort((a, b) => a.order - b.order);

  // Sorting
  const sortedRecords = [...records].sort((a, b) => {
    let valA: any = (a as any)[sortField];
    let valB: any = (b as any)[sortField];

    if (valA === undefined && a.extraAttributes) valA = a.extraAttributes[sortField];
    if (valB === undefined && b.extraAttributes) valB = b.extraAttributes[sortField];

    if (valA === undefined) return 1;
    if (valB === undefined) return -1;

    if (typeof valA === 'number' && typeof valB === 'number') {
      return sortAsc ? valA - valB : valB - valA;
    }
    return sortAsc
      ? String(valA).localeCompare(String(valB), 'bn')
      : String(valB).localeCompare(String(valA), 'bn');
  });

  // Pagination
  const totalPages = Math.ceil(sortedRecords.length / pageSize) || 1;
  const paginatedRecords = sortedRecords.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  const handleSort = (colId: string) => {
    if (sortField === colId) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(colId);
      setSortAsc(true);
    }
  };

  const handleSelectAll = () => {
    if (selectedIds.size === paginatedRecords.length && paginatedRecords.length > 0) {
      setSelectedIds(new Set());
    } else {
      const newSet = new Set(selectedIds);
      paginatedRecords.forEach((r) => newSet.add(r.id));
      setSelectedIds(newSet);
    }
  };

  const toggleSelectOne = (id: string) => {
    const newSet = new Set(selectedIds);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setSelectedIds(newSet);
  };

  // Distinct survey types and land classes for quick filtering
  const surveyTypes = Array.from(new Set(records.map((r) => r.surveyType))).filter(Boolean);
  const landClasses = Array.from(new Set(records.map((r) => r.landClass))).filter(Boolean);

  const getDensityPadding = () => {
    switch (density) {
      case 'compact':
        return 'py-1.5 px-2.5 text-xs';
      case 'spacious':
        return 'py-3.5 px-3.5 text-sm';
      default:
        return 'py-2.5 px-3 text-xs';
    }
  };

  const getSurveyBadgeColor = (type: string) => {
    switch (type?.toUpperCase()) {
      case 'CS':
        return 'bg-amber-950/40 text-amber-300 border-amber-500/40';
      case 'SA':
        return 'bg-blue-950/40 text-blue-300 border-blue-500/40';
      case 'RS':
        return 'bg-emerald-950/40 text-emerald-300 border-emerald-500/40';
      case 'BRS':
      case 'BS':
        return 'bg-purple-950/40 text-purple-300 border-purple-500/40';
      default:
        return 'bg-slate-800 text-slate-300 border-slate-700';
    }
  };

  const getLandClassBadgeColor = (cls: string) => {
    switch (cls) {
      case 'নাল':
        return 'bg-emerald-950/30 text-emerald-300 border-emerald-500/30';
      case 'বাড়ি':
        return 'bg-amber-950/30 text-amber-300 border-amber-500/30';
      case 'পুকুর':
      case 'ডোবা':
        return 'bg-cyan-950/30 text-cyan-300 border-cyan-500/30';
      case 'বাগান':
        return 'bg-lime-950/30 text-lime-300 border-lime-500/30';
      case 'বাণিজ্যিক':
        return 'bg-rose-950/30 text-rose-300 border-rose-500/30';
      default:
        return 'bg-slate-800 text-slate-300 border-slate-700';
    }
  };

  return (
    <div className="flex-1 flex flex-col bg-[#121827] border border-amber-500/20 rounded-xl overflow-hidden shadow-xl shadow-black/40">
      {/* Search & Filter Toolbar */}
      <div className="p-3.5 border-b border-slate-800 bg-[#151c2d] flex flex-wrap items-center justify-between gap-3">
        {/* Search Input */}
        <div className="relative flex-1 min-w-[240px] max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="খতিয়ান নং, দাগ নং, মালিকের নাম বা মৌজা খুঁজুন..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#0d1322] border border-slate-700/80 rounded-lg pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-amber-400 font-bengali"
          />
        </div>

        {/* Survey & Land Class Filters */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Survey filter */}
          <select
            value={selectedSurveyType}
            onChange={(e) => setSelectedSurveyType(e.target.value)}
            className="bg-[#0d1322] border border-slate-700/80 rounded-lg px-2.5 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-amber-400 font-bengali"
          >
            <option value="">সকল জরিপ (CS, SA, RS, BRS)</option>
            {surveyTypes.map((st) => (
              <option key={st} value={st}>
                জরিপ: {st}
              </option>
            ))}
          </select>

          {/* Land Class filter */}
          <select
            value={selectedLandClass}
            onChange={(e) => setSelectedLandClass(e.target.value)}
            className="bg-[#0d1322] border border-slate-700/80 rounded-lg px-2.5 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-amber-400 font-bengali"
          >
            <option value="">সকল জমির শ্রেণি (নাল, বাড়ি...)</option>
            {landClasses.map((lc) => (
              <option key={lc} value={lc}>
                শ্রেণি: {lc}
              </option>
            ))}
          </select>

          {/* Density Switcher */}
          <div className="hidden sm:flex items-center bg-[#0d1322] border border-slate-700/80 rounded-lg p-0.5">
            <button
              onClick={() => setDensity('compact')}
              title="কমপ্যাক্ট ঘনত্ব"
              className={`px-2 py-1 text-[11px] rounded transition-colors ${
                density === 'compact' ? 'bg-amber-500/20 text-amber-300' : 'text-slate-400 hover:text-white'
              }`}
            >
              কমপ্যাক্ট
            </button>
            <button
              onClick={() => setDensity('normal')}
              title="স্বাভাবিক ঘনত্ব"
              className={`px-2 py-1 text-[11px] rounded transition-colors ${
                density === 'normal' ? 'bg-amber-500/20 text-amber-300' : 'text-slate-400 hover:text-white'
              }`}
            >
              স্বাভাবিক
            </button>
            <button
              onClick={() => setDensity('spacious')}
              title="প্রশস্ত ঘনত্ব"
              className={`px-2 py-1 text-[11px] rounded transition-colors ${
                density === 'spacious' ? 'bg-amber-500/20 text-amber-300' : 'text-slate-400 hover:text-white'
              }`}
            >
              প্রশস্ত
            </button>
          </div>

          {/* Add New Record Button */}
          <button
            onClick={onAddNewRecord}
            className="px-3 py-1.5 text-xs font-medium text-amber-300 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 rounded-lg transition-colors flex items-center gap-1 font-bengali"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>নতুন এন্ট্রি</span>
          </button>
        </div>
      </div>

      {/* Batch Selection Action Bar (Appears when items are selected) */}
      {selectedIds.size > 0 && (
        <div className="bg-[#1b253b] border-b border-amber-500/30 px-4 py-2 flex flex-wrap items-center justify-between gap-3 text-xs font-bengali transition-all">
          <div className="flex items-center gap-2 text-amber-300">
            <CheckSquare className="w-4 h-4 text-amber-400" />
            <span className="font-semibold">
              {toBengaliNumber(selectedIds.size)} টি রেকর্ড নির্বাচিত
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onPrintSelected}
              className="px-2.5 py-1 text-xs font-medium text-slate-200 bg-[#25324e] hover:bg-[#2d3d5e] border border-slate-600 rounded flex items-center gap-1.5 transition-colors"
            >
              <Printer className="w-3.5 h-3.5 text-amber-400" />
              <span>নির্বাচিত প্রিন্ট (A4)</span>
            </button>
            <button
              onClick={onExportSelected}
              className="px-2.5 py-1 text-xs font-medium text-emerald-300 bg-emerald-950/40 hover:bg-emerald-950/60 border border-emerald-500/40 rounded flex items-center gap-1.5 transition-colors"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
              <span>নির্বাচিত এক্সেল</span>
            </button>
            <button
              onClick={onDeleteSelected}
              className="px-2.5 py-1 text-xs font-medium text-red-300 bg-red-950/40 hover:bg-red-950/60 border border-red-500/40 rounded flex items-center gap-1.5 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5 text-red-400" />
              <span>মুছে ফেলুন</span>
            </button>
            <button
              onClick={() => setSelectedIds(new Set())}
              className="text-slate-400 hover:text-white px-2 py-1"
            >
              বাছাই বাতিল
            </button>
          </div>
        </div>
      )}

      {/* Main Table View */}
      <div className="flex-1 overflow-x-auto overflow-y-auto">
        {paginatedRecords.length === 0 ? (
          <div className="p-12 text-center text-slate-400 space-y-3 font-bengali">
            <div className="w-12 h-12 rounded-full bg-slate-800/80 mx-auto flex items-center justify-center text-slate-500">
              <Filter className="w-6 h-6" />
            </div>
            <p className="text-sm font-medium text-slate-300">কোনো রেকর্ড খুঁজে পাওয়া যায়নি</p>
            <p className="text-xs text-slate-500">
              সার্চ কোয়েরি বা ড্রপডাউন ফিল্টার পরিবর্তন করুন, অথবা নতুন রেকর্ড ইনজেস্ট করুন।
            </p>
          </div>
        ) : (
          <table className="w-full text-left border-collapse font-bengali">
            <thead>
              <tr className="bg-[#161f32] text-slate-300 border-b border-slate-700/80 sticky top-0 z-10 select-none text-xs">
                {/* Checkbox column */}
                <th className="py-2.5 px-3 w-10 text-center">
                  <button
                    onClick={handleSelectAll}
                    className="text-slate-400 hover:text-amber-400 p-0.5"
                    title="সব নির্বাচন করুন"
                  >
                    {selectedIds.size === paginatedRecords.length && paginatedRecords.length > 0 ? (
                      <CheckSquare className="w-4 h-4 text-amber-400" />
                    ) : (
                      <Square className="w-4 h-4 text-slate-500" />
                    )}
                  </button>
                </th>

                {/* Dynamic Visible Columns */}
                {visibleColumns.map((col) => (
                  <th
                    key={col.id}
                    onClick={() => handleSort(col.id)}
                    className="py-2.5 px-3 font-semibold text-slate-200 cursor-pointer hover:bg-slate-800/60 transition-colors whitespace-nowrap"
                    style={{ minWidth: col.width ? `${col.width}px` : undefined }}
                  >
                    <div className="flex items-center gap-1.5">
                      <span>{col.label}</span>
                      <ArrowUpDown className="w-3 h-3 text-slate-500 hover:text-amber-400" />
                    </div>
                  </th>
                ))}

                {/* Actions column */}
                <th className="py-2.5 px-3 text-right font-semibold text-slate-400 w-24">
                  অ্যাকশন
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/70 text-slate-300">
              {paginatedRecords.map((rec) => {
                const isSelected = selectedIds.has(rec.id);
                return (
                  <tr
                    key={rec.id}
                    className={`transition-colors group hover:bg-[#1a2337] ${
                      isSelected ? 'bg-[#18233a]' : 'odd:bg-[#101625] even:bg-[#131a2c]'
                    }`}
                  >
                    {/* Checkbox */}
                    <td className="py-2 px-3 text-center">
                      <button
                        onClick={() => toggleSelectOne(rec.id)}
                        className="text-slate-400 hover:text-amber-400 p-0.5"
                      >
                        {isSelected ? (
                          <CheckSquare className="w-4 h-4 text-amber-400" />
                        ) : (
                          <Square className="w-4 h-4 text-slate-600 group-hover:text-slate-400" />
                        )}
                      </button>
                    </td>

                    {/* Columns */}
                    {visibleColumns.map((col) => {
                      if (col.id === 'slNo') {
                        return (
                          <td key={col.id} className={`${getDensityPadding()} font-mono-num text-slate-400`}>
                            {toBengaliNumber(rec.slNo)}
                          </td>
                        );
                      }
                      if (col.id === 'mouza') {
                        return (
                          <td key={col.id} className={`${getDensityPadding()} font-medium text-white`}>
                            <div>{rec.mouza}</div>
                            <div className="text-[10px] text-slate-400 font-mono-num">
                              জে.এল. {toBengaliNumber(rec.jlNo)}
                            </div>
                          </td>
                        );
                      }
                      if (col.id === 'surveyType') {
                        return (
                          <td key={col.id} className={getDensityPadding()}>
                            <span
                              className={`inline-block px-2 py-0.5 text-[11px] font-bold rounded border ${getSurveyBadgeColor(
                                rec.surveyType
                              )}`}
                            >
                              {rec.surveyType}
                            </span>
                          </td>
                        );
                      }
                      if (col.id === 'khatianNo') {
                        return (
                          <td key={col.id} className={`${getDensityPadding()} font-mono-num font-bold text-amber-300 text-[13px]`}>
                            {rec.khatianNo}
                          </td>
                        );
                      }
                      if (col.id === 'dagNo') {
                        return (
                          <td key={col.id} className={`${getDensityPadding()} font-mono-num font-semibold text-slate-200`}>
                            {rec.dagNo}
                          </td>
                        );
                      }
                      if (col.id === 'ownerDetails') {
                        return (
                          <td key={col.id} className={`${getDensityPadding()} text-slate-300 max-w-[300px] truncate`} title={rec.ownerDetails}>
                            {rec.ownerDetails}
                          </td>
                        );
                      }
                      if (col.id === 'share') {
                        return (
                          <td key={col.id} className={`${getDensityPadding()} font-mono-num text-slate-400`}>
                            {rec.share}
                          </td>
                        );
                      }
                      if (col.id === 'landClass') {
                        return (
                          <td key={col.id} className={getDensityPadding()}>
                            <span
                              className={`inline-block px-2 py-0.5 text-[11px] font-medium rounded border ${getLandClassBadgeColor(
                                rec.landClass
                              )}`}
                            >
                              {rec.landClass}
                            </span>
                          </td>
                        );
                      }
                      if (col.id === 'area') {
                        return (
                          <td key={col.id} className={`${getDensityPadding()} font-mono-num text-amber-200/90 whitespace-nowrap`}>
                            {rec.area}
                          </td>
                        );
                      }
                      if (col.id === 'remarks') {
                        return (
                          <td key={col.id} className={`${getDensityPadding()} text-slate-400 max-w-[200px] truncate`}>
                            {rec.remarks || '—'}
                          </td>
                        );
                      }
                      if (col.formula === 'katha') {
                        const acreVal = parseAcreValue(rec.area);
                        return (
                          <td key={col.id} className={`${getDensityPadding()} font-mono-num text-emerald-300`}>
                            {convertAcreToKatha(acreVal)}
                          </td>
                        );
                      }
                      if (col.formula === 'bigha') {
                        const acreVal = parseAcreValue(rec.area);
                        return (
                          <td key={col.id} className={`${getDensityPadding()} font-mono-num text-cyan-300`}>
                            {convertAcreToBigha(acreVal)}
                          </td>
                        );
                      }
                      if (rec.extraAttributes && col.id in rec.extraAttributes) {
                        return (
                          <td key={col.id} className={`${getDensityPadding()} text-slate-300 font-mono-num`}>
                            {rec.extraAttributes[col.id] || '—'}
                          </td>
                        );
                      }
                      return (
                        <td key={col.id} className={getDensityPadding()}>
                          {(rec as any)[col.id] || '—'}
                        </td>
                      );
                    })}

                    {/* Actions */}
                    <td className="py-2 px-3 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => onEditRecord(rec)}
                          className="p-1 text-slate-400 hover:text-amber-300 rounded hover:bg-slate-800 transition-colors"
                          title="সম্পাদনা ও বিবরণ"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => onDeleteRecord(rec.id)}
                          className="p-1 text-slate-500 hover:text-red-400 rounded hover:bg-slate-800 transition-colors"
                          title="মুছে ফেলুন"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination & Summary Footer */}
      <div className="p-3 border-t border-slate-800 bg-[#151c2d] flex flex-wrap items-center justify-between gap-3 text-xs text-slate-400 font-bengali">
        <div className="flex items-center gap-2">
          <span>পৃষ্ঠা প্রতি রেকর্ড:</span>
          <select
            value={pageSize}
            onChange={(e) => {
              setPageSize(Number(e.target.value));
              setCurrentPage(1);
            }}
            className="bg-[#0e1422] border border-slate-700 rounded px-2 py-1 text-slate-300 text-xs focus:outline-none focus:border-amber-400 font-mono-num"
          >
            <option value={15}>১৫</option>
            <option value={25}>২৫</option>
            <option value={50}>৫০</option>
            <option value={100}>১০০</option>
          </select>
          <span className="text-slate-500">|</span>
          <span>
            সর্বমোট {toBengaliNumber(sortedRecords.length)} টির মধ্যে {toBengaliNumber(paginatedRecords.length)} টি প্রদর্শিত
          </span>
        </div>

        {/* Page Nav */}
        <div className="flex items-center gap-1.5 font-mono-num">
          <button
            onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
            disabled={currentPage === 1}
            className="p-1 rounded bg-[#0e1422] border border-slate-700 text-slate-300 hover:text-white disabled:opacity-30 disabled:hover:text-slate-300"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="px-2 text-slate-300 font-bengali">
            পৃষ্ঠা {toBengaliNumber(currentPage)} / {toBengaliNumber(totalPages)}
          </span>
          <button
            onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
            disabled={currentPage === totalPages}
            className="p-1 rounded bg-[#0e1422] border border-slate-700 text-slate-300 hover:text-white disabled:opacity-30 disabled:hover:text-slate-300"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
