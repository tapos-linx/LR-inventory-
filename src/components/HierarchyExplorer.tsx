import React, { useState } from 'react';
import {
  ChevronRight,
  ChevronDown,
  MapPin,
  Building2,
  Search,
  Layers,
  Download,
} from 'lucide-react';
import { LandRecord } from '../types/landRecord';
import { toBengaliNumber } from '../utils/bengaliNumerals';

interface HierarchyExplorerProps {
  records: LandRecord[];
  selectedDistrict: string;
  selectedUpazila: string;
  selectedMouza: string;
  onSelectNode: (district: string, upazila: string, mouza: string) => void;
  onClearFilter: () => void;
  onQuickExportMouza?: (upazila: string, mouza: string) => void;
}

interface MouzaNode {
  name: string;
  jlNo: string;
  surveyTypes: string[];
  count: number;
}

interface UpazilaNode {
  name: string;
  count: number;
  mouzas: Map<string, MouzaNode>;
}

interface DistrictNode {
  name: string;
  count: number;
  upazilas: Map<string, UpazilaNode>;
}

export const HierarchyExplorer: React.FC<HierarchyExplorerProps> = ({
  records,
  selectedDistrict,
  selectedUpazila,
  selectedMouza,
  onSelectNode,
  onClearFilter,
  onQuickExportMouza,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedDistricts, setExpandedDistricts] = useState<Record<string, boolean>>({
    কুমিল্লা: true,
    ব্রাহ্মণবাড়িয়া: true,
  });
  const [expandedUpazilas, setExpandedUpazilas] = useState<Record<string, boolean>>({
    'কুমিল্লা_আদর্শ সদর': true,
    'ব্রাহ্মণবাড়িয়া_ব্রাহ্মণবাড়িয়া সদর': true,
    'ব্রাহ্মণবাড়িয়া_নবীনগর': true,
  });

  const hierarchy = new Map<string, DistrictNode>();

  for (const r of records) {
    const dist = r.district || 'অন্যান্য';
    const upz = r.upazila || 'অন্যান্য';
    const mouz = r.mouza || 'অন্যান্য';

    if (!hierarchy.has(dist)) {
      hierarchy.set(dist, { name: dist, count: 0, upazilas: new Map() });
    }
    const distNode = hierarchy.get(dist)!;
    distNode.count++;

    if (!distNode.upazilas.has(upz)) {
      distNode.upazilas.set(upz, { name: upz, count: 0, mouzas: new Map() });
    }
    const upzNode = distNode.upazilas.get(upz)!;
    upzNode.count++;

    if (!upzNode.mouzas.has(mouz)) {
      upzNode.mouzas.set(mouz, {
        name: mouz,
        jlNo: r.jlNo,
        surveyTypes: [r.surveyType],
        count: 0,
      });
    }
    const mouzNode = upzNode.mouzas.get(mouz)!;
    mouzNode.count++;
    if (!mouzNode.surveyTypes.includes(r.surveyType)) {
      mouzNode.surveyTypes.push(r.surveyType);
    }
  }

  const toggleDistrict = (dist: string) => {
    setExpandedDistricts((prev) => ({ ...prev, [dist]: !prev[dist] }));
  };

  const toggleUpazila = (key: string) => {
    setExpandedUpazilas((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const isFiltering = !!(selectedDistrict || selectedUpazila || selectedMouza);

  return (
    <div className="surface-3d flex flex-col h-full overflow-hidden">
      <div className="p-3.5 border-b border-[var(--border-subtle)] flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs font-bold text-[var(--text-primary)] font-bengali">
          <Layers className="w-4 h-4 text-[var(--accent-gold)]" />
          <span>প্রশাসনিক হায়ারার্কি</span>
        </div>
        {isFiltering && (
          <button
            type="button"
            onClick={onClearFilter}
            className="text-[11px] text-[var(--accent-gold)] font-bengali hover:underline transition-colors cursor-pointer"
          >
            রিসেট
          </button>
        )}
      </div>

      <div className="p-2.5 border-b border-[var(--border-subtle)]">
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-[var(--text-muted)] absolute left-2.5 top-2.5" />
          <input
            type="text"
            placeholder="জেলা, উপজেলা বা মৌজা..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-[var(--surface-input)] border border-[var(--border-subtle)] rounded-xl pl-8 pr-3 py-1.5 text-xs text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--border-accent)] font-bengali"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-2 space-y-1 text-xs">
        <button
          type="button"
          onClick={onClearFilter}
          className={`w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-left transition-colors font-bengali cursor-pointer ${
            !isFiltering
              ? 'bg-emerald-500/15 text-[var(--accent-emerald)] font-semibold'
              : 'text-[var(--text-secondary)] hover:bg-[var(--surface-input)]'
          }`}
        >
          <span className="flex items-center gap-2">
            <Layers className="w-3.5 h-3.5 text-[var(--accent-gold)]" />
            <span>সকল রেকর্ড (সার্বিক ভিউ)</span>
          </span>
          <span className="text-[11px] font-mono-num text-[var(--text-muted)]">
            {toBengaliNumber(records.length)}
          </span>
        </button>

        {Array.from(hierarchy.entries()).map(([distName, distNode]) => {
          if (
            searchTerm &&
            !distName.toLowerCase().includes(searchTerm.toLowerCase()) &&
            !Array.from(distNode.upazilas.keys()).some((u) =>
              u.toLowerCase().includes(searchTerm.toLowerCase())
            )
          ) {
            return null;
          }

          const isDistExpanded = expandedDistricts[distName] ?? true;
          const isDistSelected = selectedDistrict === distName && !selectedUpazila;

          return (
            <div key={distName} className="space-y-0.5">
              <div
                className={`flex items-center justify-between px-2 py-1.5 rounded-xl transition-colors ${
                  isDistSelected
                    ? 'bg-emerald-500/15 text-[var(--accent-emerald)] font-semibold'
                    : 'text-[var(--text-primary)] hover:bg-[var(--surface-input)]'
                }`}
              >
                <div className="flex items-center gap-1.5 flex-1 min-w-0">
                  <button
                    type="button"
                    onClick={() => toggleDistrict(distName)}
                    className="p-0.5 text-[var(--text-muted)] hover:text-[var(--text-primary)] cursor-pointer"
                  >
                    {isDistExpanded ? (
                      <ChevronDown className="w-3.5 h-3.5 text-[var(--accent-gold)]" />
                    ) : (
                      <ChevronRight className="w-3.5 h-3.5" />
                    )}
                  </button>
                  <MapPin className="w-3.5 h-3.5 text-[var(--accent-gold)] shrink-0" />
                  <button
                    type="button"
                    onClick={() => onSelectNode(distName, '', '')}
                    className="text-left font-semibold truncate font-bengali cursor-pointer"
                  >
                    জেলা: {distName}
                  </button>
                </div>
                <span className="text-[11px] font-mono-num text-[var(--text-muted)] ml-2 shrink-0">
                  {toBengaliNumber(distNode.count)}
                </span>
              </div>

              {isDistExpanded && (
                <div className="pl-4 space-y-0.5 ml-3 mt-0.5">
                  {Array.from(distNode.upazilas.entries()).map(([upzName, upzNode]) => {
                    const upzKey = `${distName}_${upzName}`;
                    const isUpzExpanded = expandedUpazilas[upzKey] ?? true;
                    const isUpzSelected =
                      selectedDistrict === distName &&
                      selectedUpazila === upzName &&
                      !selectedMouza;

                    return (
                      <div key={upzName} className="space-y-0.5">
                        <div
                          className={`flex items-center justify-between px-2 py-1 rounded-lg transition-colors ${
                            isUpzSelected
                              ? 'bg-emerald-500/15 text-[var(--accent-emerald)] font-semibold'
                              : 'text-[var(--text-secondary)] hover:bg-[var(--surface-input)]'
                          }`}
                        >
                          <div className="flex items-center gap-1.5 flex-1 min-w-0">
                            <button
                              type="button"
                              onClick={() => toggleUpazila(upzKey)}
                              className="p-0.5 text-[var(--text-muted)] hover:text-[var(--text-primary)] cursor-pointer"
                            >
                              {isUpzExpanded ? (
                                <ChevronDown className="w-3 h-3" />
                              ) : (
                                <ChevronRight className="w-3 h-3" />
                              )}
                            </button>
                            <Building2 className="w-3 h-3 text-[var(--text-muted)] shrink-0" />
                            <button
                              type="button"
                              onClick={() => onSelectNode(distName, upzName, '')}
                              className="text-left truncate font-bengali text-[11px] cursor-pointer"
                            >
                              উপজেলা: {upzName}
                            </button>
                          </div>
                          <span className="text-[10px] font-mono-num text-[var(--text-muted)] ml-1 shrink-0">
                            {toBengaliNumber(upzNode.count)}
                          </span>
                        </div>

                        {isUpzExpanded && (
                          <div className="pl-4 space-y-0.5 ml-2 mt-0.5">
                            {Array.from(upzNode.mouzas.entries()).map(([mouzName, mouzNode]) => {
                              const isMouzSelected =
                                selectedDistrict === distName &&
                                selectedUpazila === upzName &&
                                selectedMouza === mouzName;

                              return (
                                <div
                                  key={mouzName}
                                  className={`w-full flex items-center justify-between px-2 py-1 rounded-lg text-left transition-colors font-bengali text-[11px] group ${
                                    isMouzSelected
                                      ? 'bg-amber-400/20 text-[var(--accent-gold)] font-semibold'
                                      : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-input)]'
                                  }`}
                                >
                                  <button
                                    type="button"
                                    onClick={() => onSelectNode(distName, upzName, mouzName)}
                                    className="flex items-center gap-1.5 truncate flex-1 text-left cursor-pointer"
                                  >
                                    <span
                                      className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                                        isMouzSelected ? 'bg-amber-400' : 'bg-emerald-500/50'
                                      }`}
                                    />
                                    <span className="truncate">
                                      {mouzName}
                                      {mouzNode.jlNo && (
                                        <span className="text-[10px] text-[var(--text-muted)] font-mono-num ml-1">
                                          (JL {mouzNode.jlNo})
                                        </span>
                                      )}
                                    </span>
                                  </button>
                                  <div className="flex items-center gap-1.5 ml-1 shrink-0">
                                    <span className="text-[10px] font-mono-num text-[var(--text-muted)]">
                                      {toBengaliNumber(mouzNode.count)}
                                    </span>
                                    {onQuickExportMouza && (
                                      <button
                                        type="button"
                                        onClick={() => onQuickExportMouza(upzName, mouzName)}
                                        className="opacity-0 group-hover:opacity-100 focus:opacity-100 p-1 rounded hover:bg-amber-400/20 text-[var(--accent-gold)] transition-opacity cursor-pointer"
                                        title={`${mouzName} মৌজা এক্সপোর্ট সেন্টারে খুলুন`}
                                        aria-label={`${mouzName} মৌজা এক্সপোর্ট`}
                                      >
                                        <Download className="w-3 h-3" />
                                      </button>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
