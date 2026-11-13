import React, { useState } from 'react';
import {
  Layers,
  Search,
  Settings,
  ArrowLeft,
  X,
  MapPin,
  Building2,
} from 'lucide-react';
import { toBengaliNumber } from '../utils/bengaliNumerals';

export type WorkspaceView = 'home' | 'browse' | 'match' | 'export' | 'print';

interface HeaderProps {
  totalRecords: number;
  mouzaCount: number;
  activeView: WorkspaceView;
  onNavigateHome: () => void;
  onQuickSearchJump: (query: string, upazila?: string, mouza?: string) => void;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  availableUpazilas: string[];
  availableMouzas: { mouza: string; upazila: string; count: number }[];
  onOpenSettings: () => void;
  generatedCacheCount?: number;
}

const VIEW_LABELS: Record<WorkspaceView, string> = {
  home: 'হোম ড্যাশবোর্ড',
  browse: 'মাস্টার লেজার ও হায়ারার্কি',
  match: 'ওয়ারিশ, ফরেনসিক ও SLULIS ম্যাচিং',
  export: 'রিপোর্ট ও এক্সপোর্ট সেন্টার',
  print: 'A4 প্রিন্ট স্টুডিও',
};

export const Header: React.FC<HeaderProps> = ({
  totalRecords,
  mouzaCount,
  activeView,
  onNavigateHome,
  onQuickSearchJump,
  searchQuery,
  setSearchQuery,
  availableUpazilas,
  availableMouzas,
  onOpenSettings,
  generatedCacheCount = 0,
}) => {
  const [isSearchFocused, setIsSearchFocused] = useState(false);

  const q = searchQuery.trim().toLowerCase();
  const matchingUpazilas = q
    ? availableUpazilas.filter((u) => u.toLowerCase().includes(q)).slice(0, 4)
    : availableUpazilas.slice(0, 3);
  const matchingMouzas = q
    ? availableMouzas
        .filter(
          (m) =>
            m.mouza.toLowerCase().includes(q) || m.upazila.toLowerCase().includes(q)
        )
        .slice(0, 5)
    : availableMouzas.slice(0, 4);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSearchFocused(false);
    onQuickSearchJump(searchQuery);
  };

  return (
    <header className="sticky top-0 z-40 glass-surface border-b border-[var(--border-subtle)] px-3 sm:px-6 lg:px-8 py-3 no-print transition-colors">
      <div className="max-w-[1600px] mx-auto flex items-center justify-between gap-3">
        {/* Zone 1: Brand Wordmark + Back to Home when in sub-workspace */}
        <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
          {activeView !== 'home' && (
            <button
              type="button"
              onClick={onNavigateHome}
              className="px-2.5 py-1.5 rounded-xl bg-[var(--surface-input)] hover:bg-emerald-500/15 border border-[var(--border-subtle)] hover:border-[var(--border-accent)] text-xs font-semibold text-[var(--text-primary)] flex items-center gap-1.5 transition-all shrink-0 font-bengali cursor-pointer"
              title="হোম স্ক্রিনে ফিরুন"
            >
              <ArrowLeft className="w-3.5 h-3.5 text-emerald-500 dark:text-emerald-400" />
              <span className="hidden sm:inline">হোম</span>
            </button>
          )}

          <button
            type="button"
            onClick={onNavigateHome}
            className="flex items-center gap-2.5 text-left group cursor-pointer min-w-0"
          >
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 via-teal-500 to-amber-500 flex items-center justify-center shadow-lg icon-3d shrink-0">
              <Layers className="w-5 h-5 text-slate-950 stroke-[2.2]" />
            </div>
            <div className="flex flex-col min-w-0">
              <div className="text-sm sm:text-base font-bold tracking-tight text-[var(--text-primary)] flex items-center gap-2 truncate font-bengali">
                <span className="truncate">ভূমি রেকর্ড মাস্টার লেজার</span>
                {activeView !== 'home' && (
                  <span className="hidden md:inline text-xs font-medium text-[var(--accent-emerald)]">
                    · {VIEW_LABELS[activeView]}
                  </span>
                )}
              </div>
              <div className="text-[11px] text-[var(--text-muted)] font-bengali truncate">
                <span className="font-mono-num">{toBengaliNumber(totalRecords)}</span> টি রেকর্ড
                <span aria-hidden="true" className="mx-1.5 opacity-60">·</span>
                <span className="font-mono-num">{toBengaliNumber(mouzaCount)}</span> টি মৌজা
                <span aria-hidden="true" className="mx-1.5 hidden sm:inline opacity-60">·</span>
                <span className="hidden sm:inline">১০০% অফলাইন ক্লায়েন্ট-সাইড</span>
              </div>
            </div>
          </button>
        </div>

        {/* Zone 2: Upazila / Mouza Quick Search */}
        <div className="relative flex-1 max-w-md mx-2">
          <form onSubmit={handleSubmit} className="relative">
            <Search className="w-4 h-4 text-[var(--text-muted)] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onFocus={() => setIsSearchFocused(true)}
              onBlur={() => setTimeout(() => setIsSearchFocused(false), 180)}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="উপজেলা, মৌজা, খতিয়ান বা দাগ খুঁজুন..."
              className="w-full pl-9 pr-8 py-2 rounded-xl bg-[var(--surface-input)] border border-[var(--border-subtle)] focus:border-[var(--border-accent)] focus:outline-none text-xs sm:text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] font-bengali transition-colors"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text-primary)] p-0.5 cursor-pointer"
                title="সার্চ মুছুন"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </form>

          {isSearchFocused && (matchingUpazilas.length > 0 || matchingMouzas.length > 0) && (
            <div className="absolute left-0 right-0 mt-2 surface-3d p-2 z-50 font-bengali text-xs shadow-2xl">
              {matchingUpazilas.length > 0 && (
                <div className="mb-1.5">
                  <div className="px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                    উপজেলা দ্রুত ফিল্টার
                  </div>
                  {matchingUpazilas.map((u) => (
                    <button
                      key={u}
                      type="button"
                      onMouseDown={() => {
                        setIsSearchFocused(false);
                        onQuickSearchJump('', u, '');
                      }}
                      className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-emerald-500/12 text-[var(--text-primary)] flex items-center justify-between transition-colors cursor-pointer"
                    >
                      <span className="flex items-center gap-2">
                        <Building2 className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400" />
                        <span>{u} উপজেলা</span>
                      </span>
                      <span className="text-[11px] text-[var(--text-muted)]">লেজার দেখুন →</span>
                    </button>
                  ))}
                </div>
              )}

              {matchingMouzas.length > 0 && (
                <div>
                  <div className="px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                    মৌজা দ্রুত নির্বাচন
                  </div>
                  {matchingMouzas.map((m) => (
                    <button
                      key={`${m.upazila}_${m.mouza}`}
                      type="button"
                      onMouseDown={() => {
                        setIsSearchFocused(false);
                        onQuickSearchJump('', m.upazila, m.mouza);
                      }}
                      className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-emerald-500/12 text-[var(--text-primary)] flex items-center justify-between transition-colors cursor-pointer"
                    >
                      <span className="flex items-center gap-2 truncate">
                        <MapPin className="w-3.5 h-3.5 text-emerald-500 dark:text-emerald-400 shrink-0" />
                        <span className="truncate font-medium">{m.mouza}</span>
                        <span className="text-[11px] text-[var(--text-muted)] truncate">
                          ({m.upazila})
                        </span>
                      </span>
                      <span className="font-mono-num text-[11px] text-[var(--accent-emerald)] shrink-0">
                        {toBengaliNumber(m.count)} রেকর্ড
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Zone 3: Settings Gear Icon ONLY */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={onOpenSettings}
            aria-label="সেটিংস ও ইউটিলিটিজ খুলুন"
            title="সেটিংস (থিম, APK ডাউনলোড, নমুনা ডাটা, আর্কাইভ ট্রি ও ক্যাশ ক্লিন)"
            className="relative p-2.5 rounded-xl bg-[var(--surface-input)] hover:bg-emerald-500/15 border border-[var(--border-subtle)] hover:border-[var(--border-accent)] text-[var(--text-primary)] transition-all cursor-pointer flex items-center gap-2"
          >
            <Settings className="w-4 h-4 text-[var(--accent-gold)]" />
            <span className="hidden md:inline text-xs font-semibold font-bengali">সেটিংস</span>
            {generatedCacheCount > 0 && (
              <span
                className="w-2 h-2 rounded-full bg-emerald-400"
                title={`ক্যাশ ট্র্যাকিং সক্রিয় (${toBengaliNumber(generatedCacheCount)})`}
              />
            )}
          </button>
        </div>
      </div>
    </header>
  );
};
