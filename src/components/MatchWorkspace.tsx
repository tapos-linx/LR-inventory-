import React, { useState } from 'react';
import { Users, Fingerprint, Scale } from 'lucide-react';
import { DynamicColumn, LandRecord } from '../types/landRecord';
import { LedgerAuditVersionEntry } from '../types/forensic';
import { InheritanceMatcherView } from './InheritanceMatcherView';
import { ForensicAuditView, ReportTabId } from './ForensicAuditView';
import { SingleLineageInvestigationView, SlulisTabId } from './SingleLineageInvestigationView';
import { SlulisStatusSummary } from './SlulisStatusSummary';
import { downloadMasterSlulisPackage } from '../utils/slulisMasterBundleEngine';
import { PROVIDED_WARISH_CERTIFICATES } from '../utils/inheritanceData';
import { toBengaliNumber } from '../utils/bengaliNumerals';

export type MatchWorkspaceTab = 'inheritance' | 'forensic' | 'slulis';

interface MatchWorkspaceProps {
  records: LandRecord[];
  columns: DynamicColumn[];
  initialTab?: MatchWorkspaceTab;
  forensicInitialTab?: ReportTabId;
  slulisInitialTab?: SlulisTabId;
  onBackHome: () => void;
  onApplyMatchedListToLedger: (matchedRecords: LandRecord[], openPrintAfter?: boolean) => void;
  onApproveLedgerProposal: (
    updatedRecords: LandRecord[],
    auditEntry: LedgerAuditVersionEntry
  ) => void;
  onRollbackLedgerVersion: (versionEntry: LedgerAuditVersionEntry) => void;
  versionHistory: LedgerAuditVersionEntry[];
}

export const MatchWorkspace: React.FC<MatchWorkspaceProps> = ({
  records,
  columns,
  initialTab = 'inheritance',
  forensicInitialTab = 'report2',
  slulisInitialTab = 'summary',
  onBackHome,
  onApplyMatchedListToLedger,
  onApproveLedgerProposal,
  onRollbackLedgerVersion,
  versionHistory,
}) => {
  const [activeTab, setActiveTab] = useState<MatchWorkspaceTab>(initialTab);
  const [forensicTab, setForensicTab] = useState<ReportTabId>(forensicInitialTab);
  const [slulisTab, setSlulisTab] = useState<SlulisTabId>(slulisInitialTab);
  const [isDownloadingBundle, setIsDownloadingBundle] = useState(false);

  const handleDownloadSlulisBundle = async () => {
    if (isDownloadingBundle) return;
    setIsDownloadingBundle(true);
    try {
      await downloadMasterSlulisPackage(records);
    } finally {
      setIsDownloadingBundle(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col font-bengali">
      <div className="no-print border-b border-[var(--border-subtle)] bg-[var(--surface-card)]/90 px-3 sm:px-6 lg:px-8 py-3">
        <div className="max-w-[1600px] mx-auto flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-wider text-[var(--accent-emerald)]">
              পিলার ৩ · সমন্বিত ম্যাচিং ও ফরেনসিক তদন্ত
            </div>
            <h1 className="text-base sm:text-lg font-bold text-[var(--text-primary)]">
              ওয়ারিশ ম্যাচিং, ১১-ধাপ ফরেনসিক অডিট ও SLULIS মোকদ্দমা স্টুডিও
            </h1>
          </div>

          <div
            role="tablist"
            aria-label="ম্যাচিং ওয়ার্কস্পেস ট্যাব"
            className="flex flex-wrap items-center gap-1.5 p-1 rounded-2xl bg-[var(--surface-input)] border border-[var(--border-subtle)]"
          >
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'inheritance'}
              onClick={() => setActiveTab('inheritance')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                activeTab === 'inheritance'
                  ? 'bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 shadow-md'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>
                ওয়ারিশ ম্যাচিং ({toBengaliNumber(PROVIDED_WARISH_CERTIFICATES.length)} সনদ)
              </span>
            </button>

            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'forensic'}
              onClick={() => setActiveTab('forensic')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                activeTab === 'forensic'
                  ? 'bg-gradient-to-r from-amber-400 to-yellow-400 text-slate-950 shadow-md'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
            >
              <Fingerprint className="w-3.5 h-3.5" />
              <span>ফরেনসিক অডিট (১১-ধাপ ও রিপোর্ট ১–১০)</span>
            </button>

            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'slulis'}
              onClick={() => setActiveTab('slulis')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                activeTab === 'slulis'
                  ? 'bg-gradient-to-r from-amber-400 to-amber-500 text-slate-950 shadow-md'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
            >
              <Scale className="w-3.5 h-3.5" />
              <span>SLULIS: সফর আলী মোকদ্দমা ও দাগ ৬৫১</span>
            </button>
          </div>
        </div>
      </div>

      {activeTab === 'inheritance' && (
        <InheritanceMatcherView
          records={records}
          columns={columns}
          onBack={onBackHome}
          onApplyMatchedListToLedger={onApplyMatchedListToLedger}
          embedded
        />
      )}

      {activeTab === 'forensic' && (
        <ForensicAuditView
          records={records}
          onBack={onBackHome}
          onApproveLedgerProposal={onApproveLedgerProposal}
          onRollbackLedgerVersion={onRollbackLedgerVersion}
          versionHistory={versionHistory}
          initialTab={forensicTab}
          embedded
        />
      )}

      {activeTab === 'slulis' && (
        <div className="flex-1 flex flex-col">
          <div className="max-w-[1600px] w-full mx-auto px-3 sm:px-6 pt-4 no-print">
            <SlulisStatusSummary
              records={records}
              onNavigateToSlulis={(t) => {
                if (t) setSlulisTab(t as SlulisTabId);
              }}
              onNavigateToForensic={(t) => {
                if (t) setForensicTab(t as ReportTabId);
                setActiveTab('forensic');
              }}
              onNavigateToSideBySide={() => setSlulisTab('compare')}
              onDownloadMasterBundle={handleDownloadSlulisBundle}
              isDownloadingMasterBundle={isDownloadingBundle}
            />
          </div>
          <SingleLineageInvestigationView
            key={slulisTab}
            records={records}
            onBack={onBackHome}
            onNavigateToForensic={(t) => {
              if (t) setForensicTab(t as ReportTabId);
              setActiveTab('forensic');
            }}
            initialTab={slulisTab}
            embedded
          />
        </div>
      )}
    </div>
  );
};
