import React, { useState } from 'react';
import {
  SlidersHorizontal,
  PanelLeftOpen,
  PanelLeftClose,
  X,
  FileDown,
} from 'lucide-react';
import { DynamicColumn, LandRecord } from '../types/landRecord';
import { HierarchyExplorer } from './HierarchyExplorer';
import { InventoryGrid } from './InventoryGrid';
import { toBengaliNumber } from '../utils/bengaliNumerals';

interface BrowseWorkspaceProps {
  records: LandRecord[];
  filteredRecords: LandRecord[];
  columns: DynamicColumn[];
  selectedIds: Set<string>;
  setSelectedIds: React.Dispatch<React.SetStateAction<Set<string>>>;
  selectedDistrict: string;
  selectedUpazila: string;
  selectedMouza: string;
  onSelectHierarchyNode: (dist: string, upz: string, mouz: string) => void;
  onClearHierarchyFilter: () => void;
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
  onOpenColumnCustomizer: () => void;
  onJumpToExportCenter: (upazila?: string, mouza?: string) => void;
}

export const BrowseWorkspace: React.FC<BrowseWorkspaceProps> = ({
  records,
  filteredRecords,
  columns,
  selectedIds,
  setSelectedIds,
  selectedDistrict,
  selectedUpazila,
  selectedMouza,
  onSelectHierarchyNode,
  onClearHierarchyFilter,
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
  onOpenColumnCustomizer,
  onJumpToExportCenter,
}) => {
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  const hasActiveScope = Boolean(selectedDistrict || selectedUpazila || selectedMouza);

  return (
    <main className="flex-1 max-w-[1600px] w-full mx-auto px-3 sm:px-6 lg:px-8 py-5 space-y-4 font-bengali">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setIsMobileSidebarOpen(true)}
            className="lg:hidden px-3 py-2 rounded-xl bg-[var(--surface-card)] border border-[var(--border-subtle)] text-xs font-semibold text-[var(--text-primary)] flex items-center gap-1.5 cursor-pointer"
          >
            <PanelLeftOpen className="w-4 h-4 text-[var(--accent-emerald)]" />
            <span>হায়ারার্কি ট্রি</span>
          </button>

          <div>
            <div className="text-[11px] font-semibold uppercase tracking-wider text-[var(--accent-emerald)]">
              পিলার ২ · মাস্টার লেজার ও হায়ারার্কি
            </div>
            <h1 className="text-lg sm:text-xl font-bold text-[var(--text-primary)]">
              মাস্টার লেজার ব্রাউজার ({toBengaliNumber(filteredRecords.length)} /{' '}
              {toBengaliNumber(records.length)} টি রেকর্ড)
            </h1>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {hasActiveScope && (
            <button
              type="button"
              onClick={onClearHierarchyFilter}
              className="px-3 py-1.5 rounded-xl bg-[var(--surface-input)] border border-[var(--border-subtle)] text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)] flex items-center gap-1.5 cursor-pointer"
            >
              <span>
                {[selectedDistrict, selectedUpazila, selectedMouza].filter(Boolean).join(' → ')}
              </span>
              <X className="w-3.5 h-3.5 text-rose-400" />
            </button>
          )}

          <button
            type="button"
            onClick={onOpenColumnCustomizer}
            className="px-3 py-2 rounded-xl bg-[var(--surface-card)] hover:bg-emerald-500/10 border border-[var(--border-subtle)] hover:border-[var(--border-accent)] text-xs font-semibold text-[var(--text-primary)] flex items-center gap-1.5 transition-colors cursor-pointer"
            title="টেবিলের কলাম দৃশ্যমানতা, ক্রম ও কাস্টম কলাম সেটিংস"
          >
            <SlidersHorizontal className="w-3.5 h-3.5 text-[var(--accent-gold)]" />
            <span>⚙️ কলাম সেটিংস</span>
          </button>

          <button
            type="button"
            onClick={() => onJumpToExportCenter(selectedUpazila, selectedMouza)}
            className="px-3 py-2 rounded-xl bg-amber-400/15 hover:bg-amber-400/25 border border-[var(--border-gold)] text-xs font-semibold text-[var(--accent-gold)] flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <FileDown className="w-3.5 h-3.5" />
            <span>এক্সপোর্ট সেন্টার</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start min-h-[640px]">
        <div className="hidden lg:block lg:col-span-3 h-[700px]">
          <HierarchyExplorer
            records={records}
            selectedDistrict={selectedDistrict}
            selectedUpazila={selectedUpazila}
            selectedMouza={selectedMouza}
            onSelectNode={onSelectHierarchyNode}
            onClearFilter={onClearHierarchyFilter}
            onQuickExportMouza={(upz, mouz) => onJumpToExportCenter(upz, mouz)}
          />
        </div>

        {isMobileSidebarOpen && (
          <div className="fixed inset-0 z-50 lg:hidden flex bg-black/60 backdrop-blur-sm">
            <div className="w-80 max-w-[85vw] h-full bg-[#0c111e] border-r border-slate-800 p-3 flex flex-col">
              <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800">
                <span className="text-xs font-bold text-white">হায়ারার্কি এক্সপ্লোরার</span>
                <button
                  type="button"
                  onClick={() => setIsMobileSidebarOpen(false)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white cursor-pointer"
                >
                  <PanelLeftClose className="w-4 h-4" />
                </button>
              </div>
              <div className="flex-1 min-h-0">
                <HierarchyExplorer
                  records={records}
                  selectedDistrict={selectedDistrict}
                  selectedUpazila={selectedUpazila}
                  selectedMouza={selectedMouza}
                  onSelectNode={(d, u, m) => {
                    onSelectHierarchyNode(d, u, m);
                    setIsMobileSidebarOpen(false);
                  }}
                  onClearFilter={() => {
                    onClearHierarchyFilter();
                    setIsMobileSidebarOpen(false);
                  }}
                  onQuickExportMouza={(upz, mouz) => {
                    setIsMobileSidebarOpen(false);
                    onJumpToExportCenter(upz, mouz);
                  }}
                />
              </div>
            </div>
            <div className="flex-1" onClick={() => setIsMobileSidebarOpen(false)} />
          </div>
        )}

        <div className="lg:col-span-9 h-[700px] flex flex-col">
          <InventoryGrid
            records={filteredRecords}
            columns={columns}
            selectedIds={selectedIds}
            setSelectedIds={setSelectedIds}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            selectedSurveyType={selectedSurveyType}
            setSelectedSurveyType={setSelectedSurveyType}
            selectedLandClass={selectedLandClass}
            setSelectedLandClass={setSelectedLandClass}
            onEditRecord={onEditRecord}
            onDeleteRecord={onDeleteRecord}
            onDeleteSelected={onDeleteSelected}
            onPrintSelected={onPrintSelected}
            onExportSelected={onExportSelected}
            onAddNewRecord={onAddNewRecord}
            onOpenColumnCustomizer={onOpenColumnCustomizer}
          />
        </div>
      </div>
    </main>
  );
};
