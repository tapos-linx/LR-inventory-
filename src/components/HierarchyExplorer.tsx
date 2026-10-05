import React, { useState } from 'react';
import {
  ChevronRight,
  ChevronDown,
  MapPin,
  Building2,
  FileText,
  Search,
  CheckSquare,
  Square,
  Folder,
  Layers,
  Filter,
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
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedDistricts, setExpandedDistricts] = useState<Record<string, boolean>>({
    কুমিল্লা: true,
    ব্রাহ্মণবাড়িয়া: true,
  });
  const [expandedUpazilas, setExpandedUpazilas] = useState<Record<string, boolean>>({
    'কুমিল্লা_আদর্শ সদর': true,
    'ব্রাহ্মণবাড়িয়া_ব্রাহ্মণবাড়িয়া সদর': true,
  });

  // Build hierarchical map from current records
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
    <div className="bg-[#121827] border border-amber-500/20 rounded-xl flex flex-col h-full overflow-hidden shadow-lg shadow-black/40">
      {/* Sidebar Header */}
      <div className="p-3.5 border-b border-slate-800 bg-[#151c2d] flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs font-bold text-white font-bengali">
          <Layers className="w-4 h-4 text-amber-400" />
          <span>প্রশাসনিক হায়ারার্কি ব্রাউজার</span>
        </div>
        {isFiltering && (
          <button
            onClick={onClearFilter}
            className="text-[11px] text-amber-400 hover:text-amber-300 font-bengali hover:underline transition-colors"
          >
            ফিল্টার রিসেট
          </button>
        )}
      </div>

      {/* Quick Search */}
      <div className="p-2.5 border-b border-slate-800 bg-[#0e1422]">
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-2.5" />
          <input
            type="text"
            placeholder="জেলা, উপজেলা বা মৌজা খুঁজুন..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-[#151d30] border border-slate-700/80 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-amber-400 font-bengali"
          />
        </div>
      </div>

      {/* Tree Content */}
      <div className="flex-1 overflow-y-auto p-2 space-y-1 text-xs">
        {/* All Records Node */}
        <button
          onClick={onClearFilter}
          className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-left transition-colors font-bengali ${
            !isFiltering
              ? 'bg-amber-500/20 text-amber-200 border border-amber-500/40 font-medium'
              : 'text-slate-300 hover:bg-slate-800/60'
          }`}
        >
          <div className="flex items-center gap-2">
            <Layers className="w-3.5 h-3.5 text-amber-400" />
            <span>সকল রেকর্ড (সার্বিক ভিউ)</span>
          </div>
          <span className="text-[10px] font-mono-num bg-slate-800 text-slate-300 px-1.5 py-0.5 rounded">
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
              {/* District Row */}
              <div
                className={`flex items-center justify-between px-2 py-1.5 rounded-lg transition-colors group ${
                  isDistSelected
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                    : 'text-slate-200 hover:bg-slate-800/50'
                }`}
              >
                <div className="flex items-center gap-1.5 flex-1 min-w-0">
                  <button
                    onClick={() => toggleDistrict(distName)}
                    className="p-0.5 text-slate-400 hover:text-white"
                  >
                    {isDistExpanded ? (
                      <ChevronDown className="w-3.5 h-3.5 text-amber-400" />
                    ) : (
                      <ChevronRight className="w-3.5 h-3.5 text-slate-500" />
                    )}
                  </button>
                  <MapPin className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  <button
                    onClick={() => onSelectNode(distName, '', '')}
                    className="text-left font-semibold truncate font-bengali hover:text-amber-300"
                  >
                    জেলা: {distName}
                  </button>
                </div>
                <span className="text-[10px] font-mono-num text-slate-400 ml-2">
                  {toBengaliNumber(distNode.count)}
                </span>
              </div>

              {/* Upazilas Under District */}
              {isDistExpanded && (
                <div className="pl-4 space-y-0.5 border-l border-slate-800/80 ml-3 mt-0.5">
                  {Array.from(distNode.upazilas.entries()).map(([upzName, upzNode]) => {
                    const upzKey = `${distName}_${upzName}`;
                    const isUpzExpanded = expandedUpazilas[upzKey] ?? true;
                    const isUpzSelected =
                      selectedDistrict === distName &&
                      selectedUpazila === upzName &&
                      !selectedMouza;

                    return (
                      <div key={upzName} className="space-y-0.5">
                        {/* Upazila Row */}
                        <div
                          className={`flex items-center justify-between px-2 py-1 rounded-md transition-colors ${
                            isUpzSelected
                              ? 'bg-amber-500/15 text-amber-300 font-medium'
                              : 'text-slate-300 hover:bg-slate-800/40'
                          }`}
                        >
                          <div className="flex items-center gap-1.5 flex-1 min-w-0">
                            <button
                              onClick={() => toggleUpazila(upzKey)}
                              className="p-0.5 text-slate-500 hover:text-white"
                            >
                              {isUpzExpanded ? (
                                <ChevronDown className="w-3 h-3 text-slate-400" />
                              ) : (
                                <ChevronRight className="w-3 h-3 text-slate-500" />
                              )}
                            </button>
                            <Building2 className="w-3 h-3 text-slate-400 shrink-0" />
                            <button
                              onClick={() => onSelectNode(distName, upzName, '')}
                              className="text-left truncate font-bengali hover:text-amber-300 text-[11px]"
                            >
                              উপজেলা: {upzName}
                            </button>
                          </div>
                          <span className="text-[10px] font-mono-num text-slate-500 ml-1">
                            {toBengaliNumber(upzNode.count)}
                          </span>
                        </div>

                        {/* Mouzas Under Upazila */}
                        {isUpzExpanded && (
                          <div className="pl-4 space-y-0.5 border-l border-slate-800/60 ml-2 mt-0.5">
                            {Array.from(upzNode.mouzas.entries()).map(([mouzName, mouzNode]) => {
                              const isMouzSelected =
                                selectedDistrict === distName &&
                                selectedUpazila === upzName &&
                                selectedMouza === mouzName;

                              return (
                                <button
                                  key={mouzName}
                                  onClick={() => onSelectNode(distName, upzName, mouzName)}
                                  className={`w-full flex items-center justify-between px-2 py-1 rounded text-left transition-colors font-bengali text-[11px] ${
                                    isMouzSelected
                                      ? 'bg-amber-400/20 text-amber-200 border-l-2 border-amber-400 font-medium'
                                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/30'
                                  }`}
                                >
                                  <div className="flex items-center gap-1.5 truncate">
                                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400/60 shrink-0" />
                                    <span className="truncate">
                                      {mouzName}
                                      {mouzNode.jlNo && (
                                        <span className="text-[10px] text-slate-500 font-mono-num ml-1">
                                          (JL {mouzNode.jlNo})
                                        </span>
                                      )}
                                    </span>
                                  </div>
                                  <span className="text-[10px] font-mono-num text-slate-400 ml-1">
                                    {toBengaliNumber(mouzNode.count)}
                                  </span>
                                </button>
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
