import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  CompanySettings,
  ContractTermsConfig,
  Customer,
  DocumentPhotoItem,
  DocumentStatus,
  FinishCertificateDocument,
  ProjectDocumentSuite,
  ProjectProgressionDocument,
  ProjectProgressionRow,
  ProgressionStage,
  Quotation,
  SampleConfirmationDocument,
  SampleConfirmationRow,
  UserProfile,
  VariationOrderDocument,
} from '../types';
import { formatMoney } from '../utils/formatters';
import {
  CONTRACT_PAYMENT_PRESETS,
  DEFAULT_CONTRACT_TERMS,
  MANAGEMENT_ADMIN_EMAIL,
  PROGRESSION_STAGE_PRESETS,
  addWorkingDays,
  calculateProgressionOverallPct,
  calculateProjectTimeline,
  calculateSuiteFinancials,
  calculateVoTotals,
  canEditLockedContractTerms,
  compressImageFile,
  createBlankFinishCertificate,
  createBlankProgressionRow,
  createBlankProjectProgression,
  createBlankSampleConfirmation,
  createBlankSampleRow,
  createBlankVariationOrder,
  createDocumentSuiteFromQuotations,
  createStandaloneDocumentSuite,
  extractJyRowsFromSamples,
  extractMergedScopesFromQuotations,
  getLinkedQuotationIds,
  resolveHolidayDates,
  syncSuiteWithLinkedQuotations,
} from '../utils/documentSuite';
import { PrintableSuiteTarget } from '../components/DocumentSuitePrintModal';
import { ProjectFolderTree, SuiteTabKey } from '../components/ProjectFolderTree';
import { PrivateTimelineTab } from '../components/PrivateTimelineTab';
import {
  AlertTriangle,
  ArrowLeft,
  CalendarClock,
  Camera,
  ChevronDown,
  ChevronRight,
  ClipboardCheck,
  Copy,
  FilePlus2,
  FileSignature,
  FileSpreadsheet,
  FolderOpen,
  FolderTree,
  Layers,
  Lock,
  Plus,
  Printer,
  RefreshCw,
  RotateCcw,
  Search,
  ShieldCheck,
  Trash2,
  TrendingUp,
  Upload,
  X,
} from 'lucide-react';

interface DocumentSuiteViewProps {
  suites: ProjectDocumentSuite[];
  quotes: Quotation[];
  customers: Customer[];
  settings: CompanySettings;
  currentUser: UserProfile;
  nextContractSeq: number;
  initialActiveSuiteId?: string | null;
  onClearInitialSuite?: () => void;
  onSaveSuite: (suite: ProjectDocumentSuite, isNew?: boolean) => void;
  onDeleteSuite: (suiteId: string) => void;
  onPrintDocument: (suite: ProjectDocumentSuite, target: PrintableSuiteTarget) => void;
}

type SuiteTab = 'contract' | 'samples' | 'vos' | 'finish' | 'progression';

const CleanNumberInput: React.FC<{
  value: number;
  onChange: (val: number) => void;
  disabled?: boolean;
  step?: string;
  placeholder?: string;
  className?: string;
}> = ({ value, onChange, disabled, placeholder = '0', className = '' }) => {
  const [text, setText] = useState<string>(() => (value === 0 ? '' : String(value)));
  const focusedRef = useRef(false);

  useEffect(() => {
    if (!focusedRef.current) {
      setText(value === 0 ? '' : String(value));
    }
  }, [value]);

  return (
    <input
      type="text"
      inputMode="decimal"
      dir="ltr"
      disabled={disabled}
      placeholder={placeholder}
      value={text}
      onFocus={(e) => {
        focusedRef.current = true;
        e.target.select();
      }}
      onBlur={() => {
        focusedRef.current = false;
        const parsed = parseFloat(text.replace(/,/g, ''));
        const safe = isNaN(parsed) || parsed < 0 ? 0 : parsed;
        onChange(safe);
        setText(safe === 0 ? '' : String(safe));
      }}
      onChange={(e) => {
        const raw = e.target.value;
        setText(raw);
        if (raw.trim() === '') {
          onChange(0);
          return;
        }
        const parsed = parseFloat(raw.replace(/,/g, ''));
        if (!isNaN(parsed) && parsed >= 0) {
          onChange(parsed);
        }
      }}
      className={className}
    />
  );
};

export const DocumentSuiteView: React.FC<DocumentSuiteViewProps> = ({
  suites,
  quotes,
  customers,
  settings,
  currentUser,
  nextContractSeq,
  initialActiveSuiteId,
  onClearInitialSuite,
  onSaveSuite,
  onDeleteSuite,
  onPrintDocument,
}) => {
  const canEditManagementLocks = canEditLockedContractTerms(currentUser);

  const [activeSuiteId, setActiveSuiteId] = useState<string | null>(initialActiveSuiteId || null);
  const [activeTab, setActiveTab] = useState<SuiteTab>('contract');
  const [search, setSearch] = useState('');

  // Private Management Timeline Tab (Strictly adel.tow.2026@gmail.com + account password protected)
  const [directoryViewMode, setDirectoryViewMode] = useState<'projects' | 'timeline'>('projects');
  const [isTimelineUnlocked, setIsTimelineUnlocked] = useState<boolean>(false);

  // Re-lock and reset private tab immediately if active user switches
  useEffect(() => {
    setIsTimelineUnlocked(false);
    if (!canEditManagementLocks) {
      setDirectoryViewMode('projects');
    }
  }, [currentUser.id, canEditManagementLocks]);

  const holidayDates = useMemo(() => resolveHolidayDates(settings), [settings]);

  // Create modal state (supports selecting 1 or multiple quotations to merge into 1 contract)
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [quoteSearch, setQuoteSearch] = useState('');
  const [selectedQuoteIdsForCreate, setSelectedQuoteIdsForCreate] = useState<string[]>([]);

  // Manage / Merge Quotations modal inside an existing active suite
  const [showManageQuotesModal, setShowManageQuotesModal] = useState(false);
  const [manageQuoteSearch, setManageQuoteSearch] = useState('');
  const [selectedQuoteIdsForMerge, setSelectedQuoteIdsForMerge] = useState<string[]>([]);

  // Folder Tree state (Directory expandable rows + Active Suite left tree sidebar)
  const [expandedDirectorySuiteIds, setExpandedDirectorySuiteIds] = useState<Record<string, boolean>>({});
  const [showSuiteTreeSidebar, setShowSuiteTreeSidebar] = useState(true);

  // Selected sub-document indices inside the active suite
  const [selectedSampleId, setSelectedSampleId] = useState<string | null>(null);
  const [selectedVoId, setSelectedVoId] = useState<string | null>(null);
  const [selectedFcId, setSelectedFcId] = useState<string | null>(null);
  const [selectedProgressId, setSelectedProgressId] = useState<string | null>(null);

  // Sync external navigation into a specific suite
  useEffect(() => {
    if (initialActiveSuiteId) {
      setActiveSuiteId(initialActiveSuiteId);
      setActiveTab('contract');
      if (onClearInitialSuite) onClearInitialSuite();
    }
  }, [initialActiveSuiteId, onClearInitialSuite]);

  const activeSuite = useMemo(
    () => suites.find((s) => s.id === activeSuiteId) || null,
    [suites, activeSuiteId]
  );

  // Ensure sub-document selections always point to a valid item when activeSuite changes
  useEffect(() => {
    if (!activeSuite) return;
    if (
      activeSuite.sampleConfirmations.length > 0 &&
      !activeSuite.sampleConfirmations.some((s) => s.id === selectedSampleId)
    ) {
      setSelectedSampleId(activeSuite.sampleConfirmations[0].id);
    }
    if (
      activeSuite.variationOrders.length > 0 &&
      !activeSuite.variationOrders.some((v) => v.id === selectedVoId)
    ) {
      setSelectedVoId(activeSuite.variationOrders[0].id);
    }
    if (
      activeSuite.finishCertificates.length > 0 &&
      !activeSuite.finishCertificates.some((f) => f.id === selectedFcId)
    ) {
      setSelectedFcId(activeSuite.finishCertificates[0].id);
    }
    const progList = activeSuite.progressionReports || [];
    if (progList.length > 0 && !progList.some((p) => p.id === selectedProgressId)) {
      setSelectedProgressId(progList[0].id);
    }
  }, [activeSuite, selectedSampleId, selectedVoId, selectedFcId, selectedProgressId]);

  const updateSuite = (updater: (prev: ProjectDocumentSuite) => ProjectDocumentSuite) => {
    if (!activeSuite) return;
    const next: ProjectDocumentSuite = {
      ...updater(activeSuite),
      updatedAt: new Date().toISOString(),
    };
    onSaveSuite(next, false);
  };

  const handleCreateFromQuotations = (selectedQuotes: Quotation[]) => {
    if (!selectedQuotes || selectedQuotes.length === 0) return;
    const created = createDocumentSuiteFromQuotations(
      selectedQuotes,
      customers,
      settings,
      nextContractSeq,
      currentUser
    );
    onSaveSuite(created, true);
    setActiveSuiteId(created.id);
    setActiveTab('contract');
    setShowCreateModal(false);
    setQuoteSearch('');
    setSelectedQuoteIdsForCreate([]);
  };

  const toggleQuoteForCreate = (quoteId: string) => {
    setSelectedQuoteIdsForCreate((prev) =>
      prev.includes(quoteId) ? prev.filter((id) => id !== quoteId) : [...prev, quoteId]
    );
  };

  const toggleDirectorySuiteTree = (suiteId: string) => {
    setExpandedDirectorySuiteIds((prev) => ({ ...prev, [suiteId]: !prev[suiteId] }));
  };

  const openDocumentFromDirectoryTree = (suiteId: string, tab: SuiteTabKey, docId?: string) => {
    setActiveSuiteId(suiteId);
    setActiveTab(tab);
    if (tab === 'samples' && docId) setSelectedSampleId(docId);
    if (tab === 'vos' && docId) setSelectedVoId(docId);
    if (tab === 'finish' && docId) setSelectedFcId(docId);
    if (tab === 'progression' && docId) setSelectedProgressId(docId);
  };

  const handleCreateStandalone = () => {
    const created = createStandaloneDocumentSuite(settings, nextContractSeq, currentUser);
    onSaveSuite(created, true);
    setActiveSuiteId(created.id);
    setActiveTab('contract');
    setShowCreateModal(false);
    setQuoteSearch('');
    setSelectedQuoteIdsForCreate([]);
  };

  // Portfolio metrics for directory header
  const portfolioStats = useMemo(() => {
    let totalContracts = 0;
    let totalVos = 0;
    suites.forEach((s) => {
      const f = calculateSuiteFinancials(s);
      totalContracts += f.originalContract;
      totalVos += f.totalVoAll;
    });
    return {
      count: suites.length,
      totalContracts,
      totalVos,
      combined: totalContracts + totalVos,
    };
  }, [suites]);

  const filteredSuites = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return suites;
    return suites.filter(
      (s) =>
        s.contract.contractNo.toLowerCase().includes(q) ||
        s.contract.projectCode.toLowerCase().includes(q) ||
        s.contract.clientName.toLowerCase().includes(q) ||
        s.contract.quotationRef.toLowerCase().includes(q) ||
        s.projectTitle.toLowerCase().includes(q)
    );
  }, [suites, search]);

  const filteredQuotesForModal = useMemo(() => {
    const q = quoteSearch.toLowerCase().trim();
    const sorted = [...quotes].reverse();
    if (!q) return sorted;
    return sorted.filter((item) => {
      const cust = customers.find((c) => c.id === item.customerId);
      return (
        item.quoteNo.toLowerCase().includes(q) ||
        (item.project || '').toLowerCase().includes(q) ||
        (cust?.name || item.customerName || '').toLowerCase().includes(q)
      );
    });
  }, [quotes, customers, quoteSearch]);

  // ==============================================================
  // VIEW 1: PROJECT DOCUMENT SUITES DIRECTORY (+ PRIVATE TIMELINE TAB FOR ADEL ONLY)
  // ==============================================================
  if (!activeSuite) {
    const handleUpdateSuiteMilestoneDates = (
      suiteId: string,
      patch: {
        stage1ClearedDate?: string;
        shopDrawingApprovedDate?: string;
        manualTargetCompletionDate?: string;
      }
    ) => {
      const target = suites.find((s) => s.id === suiteId);
      if (!target) return;
      onSaveSuite(
        {
          ...target,
          contract: {
            ...target.contract,
            ...patch,
          },
          updatedAt: new Date().toISOString(),
        },
        false
      );
    };

    return (
      <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6">
        {/* Top Mode Switcher — Private Management Timeline Tab ONLY visible to adel.tow.2026@gmail.com */}
        {canEditManagementLocks && (
          <div className="flex flex-wrap items-center justify-between gap-3 bg-white border border-slate-200 rounded-xl p-2 shadow-2xs">
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setDirectoryViewMode('projects')}
                className={`inline-flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-lg transition-colors cursor-pointer ${
                  directoryViewMode === 'projects'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <FolderOpen className="w-4 h-4" />
                <span>Projects Directory ({suites.length})</span>
              </button>
              <button
                type="button"
                onClick={() => setDirectoryViewMode('timeline')}
                className={`inline-flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-lg transition-colors cursor-pointer ${
                  directoryViewMode === 'timeline'
                    ? 'bg-slate-900 text-amber-300 shadow-xs'
                    : 'text-slate-700 bg-amber-50/70 hover:bg-amber-100 border border-amber-200'
                }`}
              >
                {isTimelineUnlocked ? (
                  <CalendarClock className="w-4 h-4" />
                ) : (
                  <Lock className="w-3.5 h-3.5" />
                )}
                <span>Timeline Control (Private)</span>
              </button>
            </div>
            <span className="text-[11px] text-slate-500 px-2 hidden sm:inline">
              Private tab visible strictly to <strong className="font-mono text-slate-700">{MANAGEMENT_ADMIN_EMAIL}</strong>
            </span>
          </div>
        )}

        {canEditManagementLocks && directoryViewMode === 'timeline' ? (
          <PrivateTimelineTab
            suites={suites}
            settings={settings}
            currentUser={currentUser}
            isUnlocked={isTimelineUnlocked}
            onUnlock={() => setIsTimelineUnlocked(true)}
            onLock={() => setIsTimelineUnlocked(false)}
            onOpenSuite={(suiteId) => {
              setActiveSuiteId(suiteId);
              setActiveTab('contract');
            }}
            onUpdateSuiteDates={handleUpdateSuiteMilestoneDates}
          />
        ) : (
        <>
        {/* KPI Strip */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white border border-slate-200 rounded-xl p-4">
            <div className="text-xs font-medium text-slate-500">Project Document Suites</div>
            <div className="text-2xl font-bold font-mono tabular-nums text-slate-900 mt-1">
              {portfolioStats.count}
            </div>
            <div className="text-[11px] text-slate-500 mt-1">Active contracts &amp; submittals</div>
          </div>
          <div className="bg-white border border-slate-200 rounded-xl p-4">
            <div className="text-xs font-medium text-slate-500">Original Contract Value</div>
            <div className="text-xl sm:text-2xl font-bold font-mono tabular-nums text-slate-900 mt-1">
              {formatMoney(portfolioStats.totalContracts)}{' '}
              <span className="text-xs font-semibold text-slate-500">{settings.currency}</span>
            </div>
            <div className="text-[11px] text-slate-500 mt-1">Base agreed contracts (incl. VAT)</div>
          </div>
          <div className="bg-white border border-slate-200 rounded-xl p-4">
            <div className="text-xs font-medium text-slate-500">Variation Orders Total</div>
            <div className="text-xl sm:text-2xl font-bold font-mono tabular-nums text-amber-800 mt-1">
              +{formatMoney(portfolioStats.totalVos)}{' '}
              <span className="text-xs font-semibold text-slate-500">{settings.currency}</span>
            </div>
            <div className="text-[11px] text-slate-500 mt-1">Across all project VOs (incl. VAT)</div>
          </div>
          <div className="bg-white border border-slate-200 rounded-xl p-4">
            <div className="text-xs font-medium text-slate-500">Revised Portfolio Value</div>
            <div className="text-xl sm:text-2xl font-bold font-mono tabular-nums text-blue-700 mt-1">
              {formatMoney(portfolioStats.combined)}{' '}
              <span className="text-xs font-semibold text-slate-500">{settings.currency}</span>
            </div>
            <div className="text-[11px] text-slate-500 mt-1">Original contracts + VOs</div>
          </div>
        </div>

        {/* Directory Table Card */}
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="p-5 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-50/50">
            <div>
              <h2 className="text-base font-bold text-slate-900">Project Document Suites</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Generate and manage Main Contracts, Sample Confirmations, Variation Orders, and Finish Certificates
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2.5">
              {filteredSuites.length > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    const allExpanded = filteredSuites.every((s) => expandedDirectorySuiteIds[s.id]);
                    const next: Record<string, boolean> = {};
                    if (!allExpanded) {
                      filteredSuites.forEach((s) => {
                        next[s.id] = true;
                      });
                    }
                    setExpandedDirectorySuiteIds(next);
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors cursor-pointer whitespace-nowrap shrink-0"
                >
                  <FolderTree className="w-3.5 h-3.5 text-amber-700" />
                  {filteredSuites.every((s) => expandedDirectorySuiteIds[s.id])
                    ? 'Collapse All Trees'
                    : 'Expand File Trees'}
                </button>
              )}
              <div className="relative w-full sm:w-64">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search contract, project, client..."
                  className="w-full pl-9 pr-3 py-2 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                />
              </div>
              <button
                type="button"
                onClick={() => {
                  setSelectedQuoteIdsForCreate([]);
                  setShowCreateModal(true);
                }}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors cursor-pointer whitespace-nowrap shrink-0"
              >
                <Plus className="w-4 h-4" />
                New Project Suite
              </button>
            </div>
          </div>

          {filteredSuites.length === 0 ? (
            <div className="p-12 text-center">
              <FolderOpen className="w-10 h-10 mx-auto text-slate-300 mb-3" />
              <p className="text-sm font-bold text-slate-800">
                {search ? 'No matching project suites found' : 'No project document suites yet'}
              </p>
              <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
                {search
                  ? 'Try adjusting your search query.'
                  : 'Create a Project Document Suite from one or multiple merged quotations, or start standalone to generate Contracts, Sample Confirmations, VOs, Finish Certificates, and Progress Reports.'}
              </p>
              {!search && (
                <button
                  type="button"
                  onClick={() => {
                    setSelectedQuoteIdsForCreate([]);
                    setShowCreateModal(true);
                  }}
                  className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  Create First Project Suite
                </button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 text-[11px] font-semibold text-slate-500 border-b border-slate-200">
                    <th className="py-3 pl-4 pr-2 w-8"></th>
                    <th className="py-3 px-3">Contract / Project</th>
                    <th className="py-3 px-4">Client &amp; Scope</th>
                    <th className="py-3 px-4">Quotation Ref(s).</th>
                    <th className="py-3 px-4">Saved Files Tree</th>
                    <th className="py-3 px-4 text-right">Original Contract</th>
                    <th className="py-3 px-4 text-right">VOs</th>
                    <th className="py-3 px-4 text-right">Revised Total</th>
                    <th className="py-3 px-4 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {filteredSuites.map((suite) => {
                    const fin = calculateSuiteFinancials(suite);
                    const cur = suite.contract.currency || settings.currency || 'AED';
                    const isExpanded = Boolean(expandedDirectorySuiteIds[suite.id]);
                    const linkedIds = getLinkedQuotationIds(suite);
                    return (
                      <React.Fragment key={suite.id}>
                        <tr className={`transition-colors ${isExpanded ? 'bg-slate-50/90' : 'hover:bg-slate-50/70'}`}>
                          <td className="py-3.5 pl-4 pr-1">
                            <button
                              type="button"
                              onClick={() => toggleDirectorySuiteTree(suite.id)}
                              title={isExpanded ? 'Hide saved files tree' : 'Expand saved files tree'}
                              className="p-1 text-slate-500 hover:text-slate-900 hover:bg-slate-200/70 rounded cursor-pointer"
                            >
                              {isExpanded ? (
                                <ChevronDown className="w-4 h-4" />
                              ) : (
                                <ChevronRight className="w-4 h-4" />
                              )}
                            </button>
                          </td>
                          <td className="py-3.5 px-3">
                            <button
                              type="button"
                              onClick={() => {
                                setActiveSuiteId(suite.id);
                                setActiveTab('contract');
                              }}
                              className="font-mono font-bold text-blue-700 hover:text-blue-900 hover:underline cursor-pointer text-left"
                            >
                              {suite.contract.contractNo}
                            </button>
                            <div className="text-[11px] font-mono text-slate-500 mt-0.5">
                              {suite.contract.projectCode}
                            </div>
                          </td>
                          <td className="py-3.5 px-4">
                            <div className="font-bold text-slate-900">
                              {suite.contract.clientName || 'Unnamed Client'}
                            </div>
                            <div className="text-[11px] text-slate-500 line-clamp-1">
                              {suite.projectTitle}
                            </div>
                          </td>
                          <td className="py-3.5 px-4 font-mono text-slate-600 max-w-[200px]">
                            <div className="truncate" title={suite.contract.quotationRef || 'Standalone'}>
                              {suite.contract.quotationRef || 'Standalone'}
                            </div>
                            {linkedIds.length > 1 && (
                              <div className="text-[10px] font-sans font-semibold text-indigo-700 mt-0.5">
                                {linkedIds.length} Quotations Merged
                              </div>
                            )}
                          </td>
                          <td className="py-3.5 px-4 text-[11px] text-slate-600">
                            <button
                              type="button"
                              onClick={() => toggleDirectorySuiteTree(suite.id)}
                              className="text-left hover:text-blue-700 cursor-pointer"
                              title="Click to inspect saved documents tree"
                            >
                              <span>1 Contract</span>
                              <span className="mx-1.5 text-slate-300">·</span>
                              <span>
                                {suite.sampleConfirmations.length} Sample
                                {suite.sampleConfirmations.length === 1 ? '' : 's'}
                              </span>
                              <span className="mx-1.5 text-slate-300">·</span>
                              <span>
                                {suite.variationOrders.length} VO
                                {suite.variationOrders.length === 1 ? '' : 's'}
                              </span>
                              <span className="mx-1.5 text-slate-300">·</span>
                              <span>{suite.finishCertificates.length} FC</span>
                              <span className="mx-1.5 text-slate-300">·</span>
                              <span>{(suite.progressionReports || []).length} Progress</span>
                            </button>
                          </td>
                          <td className="py-3.5 px-4 text-right font-mono tabular-nums text-slate-700">
                            {formatMoney(fin.originalContract)} {cur}
                          </td>
                          <td className="py-3.5 px-4 text-right font-mono tabular-nums text-amber-800">
                            {fin.totalVoAll > 0 ? `+${formatMoney(fin.totalVoAll)}` : '—'}
                          </td>
                          <td className="py-3.5 px-4 text-right font-mono tabular-nums font-bold text-slate-900">
                            {formatMoney(fin.revisedTotalAll)} {cur}
                          </td>
                          <td className="py-3.5 px-4">
                            <div className="flex items-center justify-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => {
                                  setActiveSuiteId(suite.id);
                                  setActiveTab('contract');
                                }}
                                className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-md transition-colors cursor-pointer"
                              >
                                Open
                              </button>
                              <button
                                type="button"
                                onClick={() => onPrintDocument(suite, { type: 'contract' })}
                                title="Preview & Print Contract"
                                className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-md transition-colors cursor-pointer"
                              >
                                <Printer className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => onDeleteSuite(suite.id)}
                                title="Delete Project Suite"
                                className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                        {isExpanded && (
                          <tr>
                            <td colSpan={9} className="p-0">
                              <ProjectFolderTree
                                suite={suite}
                                settings={settings}
                                mode="directory"
                                onSelectDocument={(tab, docId) =>
                                  openDocumentFromDirectoryTree(suite.id, tab, docId)
                                }
                                onPrintDocument={onPrintDocument}
                              />
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
        </>
        )}

        {/* Create New Project Suite Modal (Single or Merged Quotations) */}
        {showCreateModal && (() => {
          const selectedQuotes = selectedQuoteIdsForCreate
            .map((id) => quotes.find((q) => q.id === id))
            .filter((q): q is Quotation => Boolean(q));
          const combinedSelectedTotal =
            Math.round(selectedQuotes.reduce((sum, q) => sum + (Number(q.total) || 0), 0) * 100) /
            100;
          const modalCurrency = selectedQuotes[0]?.currency || settings.currency || 'AED';

          return (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
              <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden flex flex-col max-h-[88vh]">
                <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
                  <div>
                    <h3 className="text-base font-bold text-slate-900">Create Project Document Suite</h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Select one quotation — or check multiple quotations to merge them into a single combined Contract
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setShowCreateModal(false);
                      setSelectedQuoteIdsForCreate([]);
                    }}
                    className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-lg cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="p-6 space-y-5 overflow-y-auto flex-1">
                  {/* Standalone option */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl border border-slate-200 bg-slate-50/70">
                    <div>
                      <div className="text-sm font-bold text-slate-900">Start Standalone Project Suite</div>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Manually enter client details, contract value, and project specifications from scratch.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={handleCreateStandalone}
                      className="px-4 py-2 text-xs font-bold text-slate-800 bg-white hover:bg-slate-100 border border-slate-300 rounded-lg transition-colors cursor-pointer whitespace-nowrap shrink-0"
                    >
                      Create Standalone
                    </button>
                  </div>

                  {/* Import / Merge from Quotations */}
                  <div className="space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div>
                        <div className="text-sm font-bold text-slate-900">
                          Import or Merge Saved Quotations
                        </div>
                        <div className="text-[11px] text-slate-500">
                          Check 2 or more quotations to sum their totals and list all quotation numbers in Annex A
                        </div>
                      </div>
                      <div className="relative w-full sm:w-56 shrink-0">
                        <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                          type="text"
                          value={quoteSearch}
                          onChange={(e) => setQuoteSearch(e.target.value)}
                          placeholder="Filter by quote no. or client..."
                          className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                        />
                      </div>
                    </div>

                    {filteredQuotesForModal.length === 0 ? (
                      <div className="p-8 text-center border border-dashed border-slate-200 rounded-xl text-xs text-slate-500">
                        No saved quotations found. Save a quotation first or create a standalone suite above.
                      </div>
                    ) : (
                      <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden max-h-72 overflow-y-auto">
                        {filteredQuotesForModal.map((q) => {
                          const cust = customers.find((c) => c.id === q.customerId);
                          const existingSuite = suites.find((s) =>
                            getLinkedQuotationIds(s).includes(q.id)
                          );
                          const isChecked = selectedQuoteIdsForCreate.includes(q.id);
                          return (
                            <div
                              key={q.id}
                              onClick={() => toggleQuoteForCreate(q.id)}
                              className={`p-3.5 flex items-center justify-between gap-3 transition-colors cursor-pointer ${
                                isChecked ? 'bg-blue-50/70' : 'hover:bg-slate-50'
                              }`}
                            >
                              <div className="flex items-start gap-3 min-w-0">
                                <input
                                  type="checkbox"
                                  checked={isChecked}
                                  onChange={() => {}}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    toggleQuoteForCreate(q.id);
                                  }}
                                  className="mt-1 w-4 h-4 rounded border-slate-300 text-blue-600 cursor-pointer shrink-0"
                                />
                                <div className="min-w-0">
                                  <div className="flex items-center gap-2 text-xs">
                                    <span className="font-mono font-bold text-blue-700">{q.quoteNo}</span>
                                    <span className="text-slate-300">·</span>
                                    <span className="font-bold text-slate-900 truncate">
                                      {cust?.name || q.customerName || 'Client'}
                                    </span>
                                  </div>
                                  <div className="text-[11px] text-slate-500 truncate mt-0.5">
                                    {q.project || 'Joinery Package'} · {q.date}
                                    {existingSuite ? ` · Linked to ${existingSuite.contract.contractNo}` : ''}
                                  </div>
                                </div>
                              </div>
                              <div className="flex items-center gap-3 shrink-0">
                                <div className="text-right font-mono tabular-nums text-xs font-bold text-slate-900">
                                  {formatMoney(q.total)} {q.currency}
                                </div>
                                {selectedQuoteIdsForCreate.length === 0 && (
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleCreateFromQuotations([q]);
                                    }}
                                    className="px-3 py-1.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors cursor-pointer"
                                  >
                                    Use Quote
                                  </button>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>

                {/* Sticky Multi-Quote Merge Action Bar */}
                {selectedQuotes.length > 0 && (
                  <div className="px-6 py-3.5 border-t border-slate-200 bg-indigo-50/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-indigo-950 flex items-center gap-1.5">
                        <Layers className="w-4 h-4 text-indigo-700 shrink-0" />
                        <span>
                          {selectedQuotes.length === 1
                            ? `1 Quotation Selected: ${selectedQuotes[0].quoteNo}`
                            : `${selectedQuotes.length} Quotations Ready to Merge`}
                        </span>
                      </div>
                      <div className="text-[11px] text-indigo-900/80 truncate mt-0.5">
                        Annex A: <span className="font-mono font-semibold">{selectedQuotes.map((q) => q.quoteNo).join(', ')}</span>
                        {' · '}Combined Total:{' '}
                        <strong className="font-mono">
                          {formatMoney(combinedSelectedTotal)} {modalCurrency}
                        </strong>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => setSelectedQuoteIdsForCreate([])}
                        className="px-3 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-white border border-slate-300 rounded-lg cursor-pointer"
                      >
                        Clear
                      </button>
                      <button
                        type="button"
                        onClick={() => handleCreateFromQuotations(selectedQuotes)}
                        className="px-4 py-2 text-xs font-bold text-white bg-indigo-700 hover:bg-indigo-800 rounded-lg transition-colors cursor-pointer whitespace-nowrap"
                      >
                        {selectedQuotes.length > 1
                          ? `Merge ${selectedQuotes.length} Quotes into 1 Contract`
                          : 'Create Contract Suite'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })()}
      </div>
    );
  }

  // ==============================================================
  // VIEW 2: ACTIVE PROJECT SUITE WORKSPACE (5 DOCUMENTS + TREE)
  // ==============================================================
  const c = activeSuite.contract;
  const t = c.terms;
  const currency = c.currency || settings.currency || 'AED';
  const fin = calculateSuiteFinancials(activeSuite);
  const linkedQuoteIds = getLinkedQuotationIds(activeSuite);
  const linkedQuotes = linkedQuoteIds
    .map((id) => quotes.find((q) => q.id === id))
    .filter((q): q is Quotation => Boolean(q));

  const updateContract = (patch: Partial<typeof c>) => {
    updateSuite((prev) => ({
      ...prev,
      contract: { ...prev.contract, ...patch },
    }));
  };

  const updateContractTerms = (patch: Partial<ContractTermsConfig>) => {
    updateSuite((prev) => ({
      ...prev,
      contract: {
        ...prev.contract,
        terms: { ...prev.contract.terms, ...patch },
      },
    }));
  };

  const handleSyncFromLinkedQuotes = () => {
    if (linkedQuotes.length === 0) return;
    updateSuite((prev) => syncSuiteWithLinkedQuotations(prev, quotes, customers));
  };

  const handleOpenManageQuotesModal = () => {
    setSelectedQuoteIdsForMerge(linkedQuoteIds);
    setManageQuoteSearch('');
    setShowManageQuotesModal(true);
  };

  const handleApplyMergedQuotes = (alsoUpdateFinishScopes: boolean) => {
    const matched = selectedQuoteIdsForMerge
      .map((id) => quotes.find((q) => q.id === id))
      .filter((q): q is Quotation => Boolean(q));

    updateSuite((prev) => {
      const synced = syncSuiteWithLinkedQuotations(prev, quotes, customers, selectedQuoteIdsForMerge);
      if (alsoUpdateFinishScopes && matched.length > 0 && synced.finishCertificates.length > 0) {
        const mergedWorks = extractMergedScopesFromQuotations(matched);
        return {
          ...synced,
          finishCertificates: synced.finishCertificates.map((fc, idx) =>
            idx === 0
              ? {
                  ...fc,
                  completedWorks: mergedWorks.map((ref, i) => ({
                    id: `fcw_m_${i}_${Date.now()}`,
                    reference: ref,
                    completed: true,
                  })),
                  updatedAt: new Date().toISOString(),
                }
              : fc
          ),
        };
      }
      return synced;
    });
    setShowManageQuotesModal(false);
  };

  // Active sub-documents
  const currentSample: SampleConfirmationDocument | null =
    activeSuite.sampleConfirmations.find((s) => s.id === selectedSampleId) ||
    activeSuite.sampleConfirmations[0] ||
    null;

  const currentVo: VariationOrderDocument | null =
    activeSuite.variationOrders.find((v) => v.id === selectedVoId) ||
    activeSuite.variationOrders[0] ||
    null;

  const currentFc: FinishCertificateDocument | null =
    activeSuite.finishCertificates.find((f) => f.id === selectedFcId) ||
    activeSuite.finishCertificates[0] ||
    null;

  const progressionReports = activeSuite.progressionReports || [];
  const currentProgress: ProjectProgressionDocument | null =
    progressionReports.find((p) => p.id === selectedProgressId) ||
    progressionReports[0] ||
    null;

  // Sub-document mutation helpers
  const updateSample = (sampleId: string, updater: (s: SampleConfirmationDocument) => SampleConfirmationDocument) => {
    updateSuite((prev) => ({
      ...prev,
      sampleConfirmations: prev.sampleConfirmations.map((s) =>
        s.id === sampleId ? { ...updater(s), updatedAt: new Date().toISOString() } : s
      ),
    }));
  };

  const handleAddSampleSheet = () => {
    const nextSeq = activeSuite.sampleConfirmations.length + 1;
    const created = createBlankSampleConfirmation(nextSeq, c.clientName, settings, currentUser);
    created.deliveryFee = c.terms.sampleSiteDeliveryFee;
    updateSuite((prev) => ({
      ...prev,
      sampleConfirmations: [...prev.sampleConfirmations, created],
    }));
    setSelectedSampleId(created.id);
  };

  const handleDuplicateSampleSheet = (source: SampleConfirmationDocument) => {
    const nextSeq = activeSuite.sampleConfirmations.length + 1;
    const dup: SampleConfirmationDocument = {
      ...source,
      id: 'sc_' + Math.random().toString(36).substring(2, 9) + Date.now().toString(36),
      sampleId: `S-${String(nextSeq).padStart(3, '0')}`,
      rows: source.rows.map((r) => ({
        ...r,
        id: 'srow_' + Math.random().toString(36).substring(2, 9),
      })),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    updateSuite((prev) => ({
      ...prev,
      sampleConfirmations: [...prev.sampleConfirmations, dup],
    }));
    setSelectedSampleId(dup.id);
  };

  const handleDeleteSampleSheet = (sampleId: string) => {
    updateSuite((prev) => ({
      ...prev,
      sampleConfirmations: prev.sampleConfirmations.filter((s) => s.id !== sampleId),
    }));
  };

  const handleSamplePhotoUpload = async (
    sampleId: string,
    rowId: string,
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const compressed = await compressImageFile(file, 640, 0.82);
      updateSample(sampleId, (s) => ({
        ...s,
        rows: s.rows.map((r) =>
          r.id === rowId ? { ...r, photoUrl: compressed, photoFileName: file.name } : r
        ),
      }));
    } catch (err) {
      console.error('Failed to process sample photo:', err);
    } finally {
      e.target.value = '';
    }
  };

  const updateVo = (voId: string, updater: (v: VariationOrderDocument) => VariationOrderDocument) => {
    updateSuite((prev) => ({
      ...prev,
      variationOrders: prev.variationOrders.map((v) =>
        v.id === voId ? { ...updater(v), updatedAt: new Date().toISOString() } : v
      ),
    }));
  };

  const activeTimeline = calculateProjectTimeline(activeSuite, holidayDates);

  const handleAddVo = () => {
    const nextSeq = activeSuite.variationOrders.length + 1;
    const defaultOrigCompletion =
      activeTimeline.effectiveTargetDate ||
      activeTimeline.revisedMaxCompletionDate ||
      activeTimeline.autoMaxCompletionDate ||
      '';
    const created = createBlankVariationOrder(
      nextSeq,
      c.clientName,
      settings,
      defaultOrigCompletion
    );
    updateSuite((prev) => ({
      ...prev,
      variationOrders: [...prev.variationOrders, created],
    }));
    setSelectedVoId(created.id);
  };

  const handleDeleteVo = (voId: string) => {
    updateSuite((prev) => ({
      ...prev,
      variationOrders: prev.variationOrders.filter((v) => v.id !== voId),
    }));
  };

  const updateFc = (fcId: string, updater: (f: FinishCertificateDocument) => FinishCertificateDocument) => {
    updateSuite((prev) => ({
      ...prev,
      finishCertificates: prev.finishCertificates.map((f) =>
        f.id === fcId ? { ...updater(f), updatedAt: new Date().toISOString() } : f
      ),
    }));
  };

  const handleAddFc = () => {
    const nextSeq = activeSuite.finishCertificates.length + 1;
    const initialWorks =
      linkedQuotes.length > 0 ? extractMergedScopesFromQuotations(linkedQuotes) : undefined;
    const created = createBlankFinishCertificate(nextSeq, c.clientName, settings, currentUser, initialWorks);
    updateSuite((prev) => ({
      ...prev,
      finishCertificates: [...prev.finishCertificates, created],
    }));
    setSelectedFcId(created.id);
  };

  const handleDeleteFc = (fcId: string) => {
    updateSuite((prev) => ({
      ...prev,
      finishCertificates: prev.finishCertificates.filter((f) => f.id !== fcId),
    }));
  };

  const handleSnagPhotoUpload = async (
    fcId: string,
    snagId: string,
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const compressed = await compressImageFile(file, 640, 0.82);
      updateFc(fcId, (f) => ({
        ...f,
        snagItems: f.snagItems.map((s) =>
          s.id === snagId ? { ...s, photoUrl: compressed, photoFileName: file.name } : s
        ),
      }));
    } catch (err) {
      console.error('Failed to process snag photo:', err);
    } finally {
      e.target.value = '';
    }
  };

  const handleFcCompletionPhotosUpload = async (
    fcId: string,
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const files: File[] = e.target.files ? Array.from(e.target.files) : [];
    if (files.length === 0) return;
    try {
      const processed: DocumentPhotoItem[] = [];
      for (const file of files) {
        const compressed = await compressImageFile(file, 760, 0.82);
        processed.push({
          id: 'fcph_' + Math.random().toString(36).substring(2, 9) + Date.now().toString(36),
          photoUrl: compressed,
          fileName: file.name,
          caption: file.name.replace(/\.[^.]+$/, '').replace(/[_-]+/g, ' '),
          area: '',
        });
      }
      updateFc(fcId, (f) => ({
        ...f,
        completionPhotos: [...(f.completionPhotos || []), ...processed],
      }));
    } catch (err) {
      console.error('Failed to process Finish Certificate photos:', err);
    } finally {
      e.target.value = '';
    }
  };

  // Project Progression helpers
  const updateProgress = (
    reportId: string,
    updater: (r: ProjectProgressionDocument) => ProjectProgressionDocument
  ) => {
    updateSuite((prev) => ({
      ...prev,
      progressionReports: (prev.progressionReports || []).map((r) =>
        r.id === reportId ? { ...updater(r), updatedAt: new Date().toISOString() } : r
      ),
    }));
  };

  const handleAddProgressReport = () => {
    const nextSeq = (activeSuite.progressionReports || []).length + 1;
    const created = createBlankProjectProgression(nextSeq, activeSuite, settings, currentUser);
    updateSuite((prev) => ({
      ...prev,
      progressionReports: [...(prev.progressionReports || []), created],
    }));
    setSelectedProgressId(created.id);
  };

  const handleDeleteProgressReport = (reportId: string) => {
    updateSuite((prev) => ({
      ...prev,
      progressionReports: (prev.progressionReports || []).filter((r) => r.id !== reportId),
    }));
  };

  const handleProgressRowPhotoUpload = async (
    reportId: string,
    rowId: string,
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const compressed = await compressImageFile(file, 640, 0.82);
      updateProgress(reportId, (r) => ({
        ...r,
        rows: r.rows.map((row) =>
          row.id === rowId ? { ...row, photoUrl: compressed, photoFileName: file.name } : row
        ),
      }));
    } catch (err) {
      console.error('Failed to process progress row photo:', err);
    } finally {
      e.target.value = '';
    }
  };

  const handleProgressGalleryUpload = async (
    reportId: string,
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const files: File[] = e.target.files ? Array.from(e.target.files) : [];
    if (files.length === 0) return;
    try {
      const processed: DocumentPhotoItem[] = [];
      for (const file of files) {
        const compressed = await compressImageFile(file, 760, 0.82);
        processed.push({
          id: 'prph_' + Math.random().toString(36).substring(2, 9) + Date.now().toString(36),
          photoUrl: compressed,
          fileName: file.name,
          caption: file.name.replace(/\.[^.]+$/, '').replace(/[_-]+/g, ' '),
          area: '',
        });
      }
      updateProgress(reportId, (r) => ({
        ...r,
        progressPhotos: [...(r.progressPhotos || []), ...processed],
      }));
    } catch (err) {
      console.error('Failed to process progress gallery photos:', err);
    } finally {
      e.target.value = '';
    }
  };

  const stageTotalPct = (Number(t.stage1Pct) || 0) + (Number(t.stage2Pct) || 0) + (Number(t.stage3Pct) || 0);
  const stage1Amt = Math.round(((fin.originalContract * t.stage1Pct) / 100) * 100) / 100;
  const stage2Amt = Math.round(((fin.originalContract * t.stage2Pct) / 100) * 100) / 100;
  const stage3Amt = Math.round(((fin.originalContract * t.stage3Pct) / 100) * 100) / 100;

  // Checklist metrics for quick overview strip
  const signedSamplesCount = activeSuite.sampleConfirmations.filter(
    (s) => s.status === 'Signed'
  ).length;
  const approvedVosCount = activeSuite.variationOrders.filter((v) => v.status === 'Approved').length;
  const signedFcsCount = activeSuite.finishCertificates.filter((f) => f.status === 'Signed').length;
  const latestProgressPct =
    progressionReports.length > 0
      ? calculateProgressionOverallPct(progressionReports[progressionReports.length - 1].rows)
      : null;

  const handleTreeSelect = (tab: SuiteTabKey, docId?: string) => {
    setActiveTab(tab);
    if (tab === 'samples' && docId) setSelectedSampleId(docId);
    if (tab === 'vos' && docId) setSelectedVoId(docId);
    if (tab === 'finish' && docId) setSelectedFcId(docId);
    if (tab === 'progression' && docId) setSelectedProgressId(docId);
  };

  const handleTreeAdd = (tab: Exclude<SuiteTabKey, 'contract'>) => {
    setActiveTab(tab);
    if (tab === 'samples') handleAddSampleSheet();
    if (tab === 'vos') handleAddVo();
    if (tab === 'finish') handleAddFc();
    if (tab === 'progression') handleAddProgressReport();
  };

  return (
    <div className="p-4 sm:p-6 max-w-[1440px] mx-auto space-y-5">
      {/* Breadcrumb & Project Financial Header */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 sm:p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div className="flex items-start sm:items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={() => setActiveSuiteId(null)}
              className="p-2 text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer shrink-0"
              title="Back to Document Suites Directory"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                <span>Document Suite</span>
                <span>/</span>
                <span className="font-mono font-bold text-slate-900">{c.contractNo}</span>
                <span>·</span>
                <span className="font-mono text-slate-600">{c.projectCode}</span>
                {linkedQuotes.length > 1 && (
                  <>
                    <span>·</span>
                    <span className="font-semibold text-indigo-700">
                      {linkedQuotes.length} Quotations Merged
                    </span>
                  </>
                )}
              </div>
              <input
                type="text"
                value={activeSuite.projectTitle}
                onChange={(e) => updateSuite((prev) => ({ ...prev, projectTitle: e.target.value }))}
                className="text-base sm:text-lg font-bold text-slate-900 bg-transparent border-b border-transparent hover:border-slate-300 focus:border-blue-600 focus:outline-none w-full mt-0.5"
                placeholder="Project Title"
              />
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => setShowSuiteTreeSidebar((prev) => !prev)}
              className={`inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg border transition-colors cursor-pointer ${
                showSuiteTreeSidebar
                  ? 'text-amber-900 bg-amber-50 border-amber-200 hover:bg-amber-100'
                  : 'text-slate-700 bg-white border-slate-200 hover:bg-slate-100'
              }`}
              title="Toggle Project File Tree sidebar"
            >
              <FolderTree className="w-3.5 h-3.5" />
              {showSuiteTreeSidebar ? 'Hide Tree' : 'File Tree'}
            </button>
            <button
              type="button"
              onClick={handleOpenManageQuotesModal}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-indigo-800 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-lg transition-colors cursor-pointer"
              title="Merge multiple quotations into this contract or manage linked quotations"
            >
              <Layers className="w-3.5 h-3.5" />
              {linkedQuotes.length > 0
                ? `Merged Quotes (${linkedQuotes.length})`
                : 'Link / Merge Quotes'}
            </button>
            {linkedQuotes.length > 0 && (
              <button
                type="button"
                onClick={handleSyncFromLinkedQuotes}
                className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
                title={`Recalculate latest contract value from ${linkedQuotes.map((q) => q.quoteNo).join(', ')}`}
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Sync {linkedQuotes.length > 1 ? `${linkedQuotes.length} Quotes` : linkedQuotes[0].quoteNo}
              </button>
            )}
            <button
              type="button"
              onClick={() => {
                if (activeTab === 'contract') {
                  onPrintDocument(activeSuite, { type: 'contract' });
                } else if (activeTab === 'samples' && currentSample) {
                  onPrintDocument(activeSuite, { type: 'sample', doc: currentSample });
                } else if (activeTab === 'vos' && currentVo) {
                  onPrintDocument(activeSuite, { type: 'vo', doc: currentVo });
                } else if (activeTab === 'finish' && currentFc) {
                  onPrintDocument(activeSuite, { type: 'finish', doc: currentFc });
                } else if (activeTab === 'progression' && currentProgress) {
                  onPrintDocument(activeSuite, { type: 'progression', doc: currentProgress });
                }
              }}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer whitespace-nowrap"
            >
              <Printer className="w-4 h-4" />
              Preview &amp; Print Active Document
            </button>
          </div>
        </div>

        {/* Original Contract + VOs = Revised Project Value Strip */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1">
          <div>
            <div className="text-[11px] font-medium text-slate-500">Original Contract Value (incl. VAT)</div>
            <div className="text-lg font-bold font-mono tabular-nums text-slate-900 mt-0.5">
              {formatMoney(fin.originalContract)} <span className="text-xs text-slate-500">{currency}</span>
            </div>
          </div>
          <div className="sm:border-l sm:border-slate-200 sm:pl-4">
            <div className="text-[11px] font-medium text-slate-500">
              Variation Orders ({activeSuite.variationOrders.length} total · Approved: {formatMoney(fin.totalVoApproved)} {currency})
            </div>
            <div className="text-lg font-bold font-mono tabular-nums text-amber-800 mt-0.5">
              +{formatMoney(fin.totalVoAll)} <span className="text-xs text-slate-500">{currency}</span>
            </div>
          </div>
          <div className="sm:border-l sm:border-slate-200 sm:pl-4">
            <div className="text-[11px] font-medium text-slate-500">Revised Project Value (Contract + VOs)</div>
            <div className="text-lg font-bold font-mono tabular-nums text-blue-700 mt-0.5">
              {formatMoney(fin.revisedTotalAll)} <span className="text-xs text-slate-500">{currency}</span>
            </div>
          </div>
        </div>

        {/* Signed / Pending Document Checklist Strip */}
        <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center gap-x-5 gap-y-2 text-[11px]">
          <span className="font-bold text-slate-500 uppercase tracking-wide text-[10px]">
            Project Checklist:
          </span>
          <button
            type="button"
            onClick={() => setActiveTab('contract')}
            className="inline-flex items-center gap-1.5 hover:underline cursor-pointer"
          >
            <span
              className={`w-2 h-2 rounded-full ${
                c.status === 'Signed'
                  ? 'bg-emerald-500'
                  : c.status === 'Sent'
                    ? 'bg-amber-500'
                    : 'bg-slate-400'
              }`}
            />
            <span className="font-semibold text-slate-700">Contract:</span>
            <span className="text-slate-600">{c.status || 'Draft'}</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('samples')}
            className="inline-flex items-center gap-1.5 hover:underline cursor-pointer"
          >
            <span
              className={`w-2 h-2 rounded-full ${
                activeSuite.sampleConfirmations.length > 0 &&
                signedSamplesCount === activeSuite.sampleConfirmations.length
                  ? 'bg-emerald-500'
                  : 'bg-amber-500'
              }`}
            />
            <span className="font-semibold text-slate-700">Samples:</span>
            <span className="text-slate-600">
              {signedSamplesCount}/{activeSuite.sampleConfirmations.length} Signed
            </span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('vos')}
            className="inline-flex items-center gap-1.5 hover:underline cursor-pointer"
          >
            <span
              className={`w-2 h-2 rounded-full ${
                activeSuite.variationOrders.length === 0
                  ? 'bg-slate-300'
                  : approvedVosCount === activeSuite.variationOrders.length
                    ? 'bg-emerald-500'
                    : 'bg-amber-500'
              }`}
            />
            <span className="font-semibold text-slate-700">VOs:</span>
            <span className="text-slate-600">
              {approvedVosCount}/{activeSuite.variationOrders.length} Approved
            </span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('finish')}
            className="inline-flex items-center gap-1.5 hover:underline cursor-pointer"
          >
            <span
              className={`w-2 h-2 rounded-full ${
                activeSuite.finishCertificates.length > 0 &&
                signedFcsCount === activeSuite.finishCertificates.length
                  ? 'bg-emerald-500'
                  : 'bg-slate-400'
              }`}
            />
            <span className="font-semibold text-slate-700">Finish Certs:</span>
            <span className="text-slate-600">
              {signedFcsCount}/{activeSuite.finishCertificates.length} Signed
            </span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('progression')}
            className="inline-flex items-center gap-1.5 hover:underline cursor-pointer"
          >
            <span
              className={`w-2 h-2 rounded-full ${
                latestProgressPct === 100
                  ? 'bg-emerald-500'
                  : latestProgressPct !== null
                    ? 'bg-cyan-600'
                    : 'bg-slate-300'
              }`}
            />
            <span className="font-semibold text-slate-700">Progression:</span>
            <span className="text-slate-600">
              {latestProgressPct !== null
                ? `${latestProgressPct}% (${progressionReports.length} report${progressionReports.length === 1 ? '' : 's'})`
                : 'Not started'}
            </span>
          </button>
        </div>
      </div>

      {/* Main Split Layout: Optional Left Project Folder Tree + Right 5-Tab Workspace */}
      <div className="flex flex-col lg:flex-row gap-5 items-start">
        {showSuiteTreeSidebar && (
          <div className="w-full lg:w-68 xl:w-72 shrink-0">
            <ProjectFolderTree
              suite={activeSuite}
              settings={settings}
              mode="sidebar"
              activeTab={activeTab}
              selectedSampleId={currentSample?.id || null}
              selectedVoId={currentVo?.id || null}
              selectedFcId={currentFc?.id || null}
              selectedProgressId={currentProgress?.id || null}
              onSelectDocument={handleTreeSelect}
              onPrintDocument={onPrintDocument}
              onAddDocument={handleTreeAdd}
            />
          </div>
        )}

      {/* 5-Document Workspace Tabs (High-Visibility Color-Coded Navigation) */}
      <div className="flex-1 min-w-0 w-full bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="flex border-b border-slate-200 bg-slate-100/80 p-2.5 gap-2 overflow-x-auto">
          {[
            {
              id: 'contract' as SuiteTab,
              num: '1',
              label: 'Main Contract',
              count: c.contractNo,
              icon: FileSignature,
              activeClass: 'bg-indigo-700 text-white border-indigo-700 shadow-sm',
              idleClass: 'bg-indigo-50 text-indigo-900 border-indigo-200 hover:bg-indigo-100',
              badgeActive: 'bg-white/20 text-white',
              badgeIdle: 'bg-indigo-600 text-white',
            },
            {
              id: 'samples' as SuiteTab,
              num: '2',
              label: 'Sample Confirmations',
              count: String(activeSuite.sampleConfirmations.length),
              icon: FileSpreadsheet,
              activeClass: 'bg-amber-600 text-white border-amber-600 shadow-sm',
              idleClass: 'bg-amber-50 text-amber-950 border-amber-200 hover:bg-amber-100',
              badgeActive: 'bg-white/20 text-white',
              badgeIdle: 'bg-amber-600 text-white',
            },
            {
              id: 'vos' as SuiteTab,
              num: '3',
              label: 'Variation Orders (VO)',
              count: String(activeSuite.variationOrders.length),
              icon: FilePlus2,
              activeClass: 'bg-rose-600 text-white border-rose-600 shadow-sm',
              idleClass: 'bg-rose-50 text-rose-950 border-rose-200 hover:bg-rose-100',
              badgeActive: 'bg-white/20 text-white',
              badgeIdle: 'bg-rose-600 text-white',
            },
            {
              id: 'finish' as SuiteTab,
              num: '4',
              label: 'Finish Certificate',
              count: String(activeSuite.finishCertificates.length),
              icon: ClipboardCheck,
              activeClass: 'bg-emerald-600 text-white border-emerald-600 shadow-sm',
              idleClass: 'bg-emerald-50 text-emerald-950 border-emerald-200 hover:bg-emerald-100',
              badgeActive: 'bg-white/20 text-white',
              badgeIdle: 'bg-emerald-600 text-white',
            },
            {
              id: 'progression' as SuiteTab,
              num: '5',
              label: 'Project Progression',
              count: String(progressionReports.length),
              icon: TrendingUp,
              activeClass: 'bg-cyan-700 text-white border-cyan-700 shadow-sm',
              idleClass: 'bg-cyan-50 text-cyan-950 border-cyan-200 hover:bg-cyan-100',
              badgeActive: 'bg-white/20 text-white',
              badgeIdle: 'bg-cyan-700 text-white',
            },
          ].map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-3.5 py-2.5 text-xs font-bold border rounded-lg transition-all whitespace-nowrap shrink-0 cursor-pointer ${
                  active ? tab.activeClass : tab.idleClass
                }`}
              >
                <span
                  className={`w-5 h-5 rounded-md flex items-center justify-center text-[11px] font-mono font-extrabold ${
                    active ? tab.badgeActive : tab.badgeIdle
                  }`}
                >
                  {tab.num}
                </span>
                <Icon className="w-4 h-4 shrink-0" />
                <span>{tab.label}</span>
                <span
                  className={`text-[11px] font-mono ${
                    active ? 'text-white/85' : 'opacity-70'
                  }`}
                >
                  ({tab.count})
                </span>
              </button>
            );
          })}
        </div>

        {/* ============================================================ */}
        {/* TAB 1: MAIN CONTRACT EDITOR                                  */}
        {/* ============================================================ */}
        {activeTab === 'contract' && (
          <div className="p-5 sm:p-6 space-y-6">
            {/* Section A: Header & Client Info */}
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-slate-100">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Contract Reference &amp; Client Details</h3>
                  <p className="text-xs text-slate-500">
                    Auto-populated from linked quotation and customer profile — all fields editable
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <select
                    value={c.status || 'Draft'}
                    onChange={(e) => updateContract({ status: e.target.value as DocumentStatus })}
                    title="Contract Signing Status"
                    className="px-2.5 py-2 text-xs font-semibold bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-600 cursor-pointer"
                  >
                    <option value="Draft">Status: Draft</option>
                    <option value="Sent">Status: Sent to Client</option>
                    <option value="Signed">Status: Signed</option>
                  </select>
                  <button
                    type="button"
                    onClick={() => onPrintDocument(activeSuite, { type: 'contract' })}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white bg-indigo-700 hover:bg-indigo-800 rounded-lg cursor-pointer"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    Generate &amp; Print Contract
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Contract No.</label>
                  <input
                    type="text"
                    value={c.contractNo}
                    onChange={(e) => updateContract({ contractNo: e.target.value })}
                    className="w-full px-3 py-2 text-xs font-mono font-bold bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:border-blue-600"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Project Code</label>
                  <input
                    type="text"
                    value={c.projectCode}
                    onChange={(e) => updateContract({ projectCode: e.target.value })}
                    className="w-full px-3 py-2 text-xs font-mono font-bold bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:border-blue-600"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Quotation Ref. (Annex A)</label>
                  <input
                    type="text"
                    value={c.quotationRef}
                    onChange={(e) => updateContract({ quotationRef: e.target.value })}
                    className="w-full px-3 py-2 text-xs font-mono font-bold bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:border-blue-600"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Date of Issuance</label>
                  <input
                    type="date"
                    value={c.dateOfIssuance}
                    onChange={(e) => updateContract({ dateOfIssuance: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:border-blue-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Client Full Name</label>
                  <input
                    type="text"
                    value={c.clientName}
                    onChange={(e) => updateContract({ clientName: e.target.value })}
                    placeholder="Client / Authorized Representative"
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:border-blue-600"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Emirates ID</label>
                  <input
                    type="text"
                    value={c.emiratesId}
                    onChange={(e) => updateContract({ emiratesId: e.target.value })}
                    placeholder="784-XXXX-XXXXXXX-X"
                    className="w-full px-3 py-2 text-xs font-mono bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:border-blue-600"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Mobile No. (Official WhatsApp)</label>
                  <input
                    type="text"
                    value={c.mobileNo}
                    onChange={(e) => updateContract({ mobileNo: e.target.value })}
                    placeholder="+971 5X XXX XXXX"
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:border-blue-600"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Official Email</label>
                  <input
                    type="email"
                    value={c.officialEmail}
                    onChange={(e) => updateContract({ officialEmail: e.target.value })}
                    placeholder="client@email.com"
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:border-blue-600"
                  />
                </div>
                <div className="sm:col-span-2 lg:col-span-4">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Site Location</label>
                  <input
                    type="text"
                    value={c.siteLocation}
                    onChange={(e) => updateContract({ siteLocation: e.target.value })}
                    placeholder="Villa / Building, Community, Emirate, UAE"
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:border-blue-600"
                  />
                </div>
              </div>
            </div>

            {/* Section B: Contract Value & Stage Payment Schedule (Clause 3 & 4.1) */}
            <div className="pt-4 border-t border-slate-200 space-y-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Contract Value &amp; Stage Payment Schedule (Clauses 3.1 &amp; 4.1)
                </h3>
                <p className="text-xs text-slate-500">
                  Stage amounts are automatically calculated into the printed contract table
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Total Contract Value (incl. VAT)
                  </label>
                  <CleanNumberInput
                    value={c.contractValue}
                    onChange={(val) => updateContract({ contractValue: val })}
                    className="w-full px-3 py-2 text-sm font-mono font-bold text-blue-800 bg-blue-50/40 border border-blue-200 rounded-lg focus:bg-white focus:outline-none focus:border-blue-600"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">UAE VAT (%)</label>
                  <CleanNumberInput
                    value={c.vatPct}
                    onChange={(val) => updateContract({ vatPct: val })}
                    className="w-full px-3 py-2 text-sm font-mono bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:border-blue-600"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Currency</label>
                  <input
                    type="text"
                    value={c.currency}
                    onChange={(e) => updateContract({ currency: e.target.value.toUpperCase() })}
                    className="w-full px-3 py-2 text-sm font-mono font-bold bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:border-blue-600"
                  />
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-[11px] font-semibold text-slate-500 mr-1">Quick Presets:</span>
                {CONTRACT_PAYMENT_PRESETS.map((preset) => {
                  const isActive =
                    Math.abs((t.stage1Pct || 0) - preset.stage1Pct) < 0.01 &&
                    Math.abs((t.stage2Pct || 0) - preset.stage2Pct) < 0.01 &&
                    Math.abs((t.stage3Pct || 0) - preset.stage3Pct) < 0.01;
                  return (
                    <button
                      key={preset.label}
                      type="button"
                      onClick={() =>
                        updateContractTerms({
                          stage1Pct: preset.stage1Pct,
                          stage2Pct: preset.stage2Pct,
                          stage3Pct: preset.stage3Pct,
                        })
                      }
                      className={`px-2.5 py-1 text-[11px] rounded-md border font-semibold transition-colors cursor-pointer ${
                        isActive
                          ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                          : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-300'
                      }`}
                    >
                      {preset.label}
                    </button>
                  );
                })}
                <span className="text-[11px] text-slate-400 ml-auto">
                  Any 0% stage is automatically hidden on the printed Contract.
                </span>
              </div>

              <div className="overflow-x-auto border border-slate-200 rounded-lg">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                      <th className="py-2.5 px-3">Milestone Stage</th>
                      <th className="py-2.5 px-3 w-32">Percentage (%)</th>
                      <th className="py-2.5 px-3 text-right w-44">Calculated Amount</th>
                      <th className="py-2.5 px-3">Contractual Trigger</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    <tr className={(t.stage1Pct || 0) <= 0 ? 'opacity-50 bg-slate-50/50' : ''}>
                      <td className="py-2.5 px-3 font-bold text-slate-900">
                        {(t.stage2Pct || 0) <= 0 && (t.stage3Pct || 0) <= 0
                          ? 'Stage 1 — Full Advance'
                          : 'Stage 1 — Advance'}
                        {(t.stage1Pct || 0) <= 0 && (
                          <span className="ml-2 text-[10px] font-medium text-slate-500">
                            (Hidden on print)
                          </span>
                        )}
                      </td>
                      <td className="py-2.5 px-3">
                        <CleanNumberInput
                          value={t.stage1Pct}
                          onChange={(val) => updateContractTerms({ stage1Pct: val })}
                          className="w-20 px-2 py-1 font-mono font-bold bg-slate-50 border border-slate-300 rounded"
                        />
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono tabular-nums font-bold text-slate-900">
                        {formatMoney(stage1Amt)} {currency}
                      </td>
                      <td className="py-2.5 px-3 text-slate-600">
                        {(t.stage2Pct || 0) <= 0 && (t.stage3Pct || 0) <= 0
                          ? 'Due in full upon signing / Effective Date'
                          : 'Due upon signing / Effective Date'}
                      </td>
                    </tr>
                    <tr className={(t.stage2Pct || 0) <= 0 ? 'opacity-50 bg-slate-50/50' : ''}>
                      <td className="py-2.5 px-3 font-bold text-slate-900">
                        {(t.stage3Pct || 0) <= 0 && (t.stage2Pct || 0) > 0
                          ? 'Stage 2 — Final'
                          : 'Stage 2 — Progress'}
                        {(t.stage2Pct || 0) <= 0 && (
                          <span className="ml-2 text-[10px] font-medium text-slate-500">
                            (Hidden on print)
                          </span>
                        )}
                      </td>
                      <td className="py-2.5 px-3">
                        <CleanNumberInput
                          value={t.stage2Pct}
                          onChange={(val) => updateContractTerms({ stage2Pct: val })}
                          className="w-20 px-2 py-1 font-mono font-bold bg-slate-50 border border-slate-300 rounded"
                        />
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono tabular-nums font-bold text-slate-900">
                        {formatMoney(stage2Amt)} {currency}
                      </td>
                      <td className="py-2.5 px-3 text-slate-600">
                        {(t.stage3Pct || 0) <= 0 && (t.stage2Pct || 0) > 0
                          ? 'Upon workshop fabrication, prior to final site delivery & handover'
                          : 'Upon workshop fabrication, prior to dispatch'}
                      </td>
                    </tr>
                    <tr className={(t.stage3Pct || 0) <= 0 ? 'opacity-50 bg-slate-50/50' : ''}>
                      <td className="py-2.5 px-3 font-bold text-slate-900">
                        Stage 3 — Final
                        {(t.stage3Pct || 0) <= 0 && (
                          <span className="ml-2 text-[10px] font-medium text-slate-500">
                            (Hidden on print)
                          </span>
                        )}
                      </td>
                      <td className="py-2.5 px-3">
                        <CleanNumberInput
                          value={t.stage3Pct}
                          onChange={(val) => updateContractTerms({ stage3Pct: val })}
                          className="w-20 px-2 py-1 font-mono font-bold bg-slate-50 border border-slate-300 rounded"
                        />
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono tabular-nums font-bold text-slate-900">
                        {formatMoney(stage3Amt)} {currency}
                      </td>
                      <td className="py-2.5 px-3 text-slate-600">Immediately upon Finish Certificate / handover</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              {Math.abs(stageTotalPct - 100) > 0.01 && (
                <div className="flex items-center gap-2 text-xs text-amber-800 bg-amber-50 border border-amber-200 px-3 py-2 rounded-lg">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>
                    Stage percentages currently sum to <strong>{stageTotalPct}%</strong> (standard total is 100%).
                  </span>
                </div>
              )}
            </div>

            {/* Section C: Editable Project Timelines & Approval Windows */}
            <div className="pt-4 border-t border-slate-200 space-y-4">
              {/* Auto-Calculated Production Clock & Completion Date Card (Clause 6.1) */}
              <div className="rounded-xl border border-blue-200 bg-blue-50/50 p-4 space-y-3.5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <h4 className="text-xs font-extrabold text-slate-900 flex items-center gap-1.5">
                      <CalendarClock className="w-4 h-4 text-blue-700" />
                      Clause 6.1 Auto-Calculated Completion Schedule (Mon–Sat Working Days)
                    </h4>
                    <p className="text-[11px] text-slate-600 mt-0.5">
                      Automatically counts working days from the latest of Stage 1 payment cleared, Shop Drawings approved, or Sample Confirmation signed (skipping Sundays &amp; {holidayDates.length} UAE holidays).
                    </p>
                  </div>
                  {activeTimeline.effectiveTargetDate ? (
                    <span className="px-2.5 py-1 rounded-lg bg-blue-700 text-white text-[11px] font-bold font-mono">
                      Target: {activeTimeline.effectiveTargetDate}
                    </span>
                  ) : (
                    <span className="px-2.5 py-1 rounded-lg bg-amber-100 text-amber-900 border border-amber-300 text-[11px] font-bold">
                      Awaiting Start Trigger Date
                    </span>
                  )}
                </div>

                {/* 3 Clause 6.1 Trigger Inputs + Manual Override */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      (a) Stage 1 Advance Cleared
                    </label>
                    <input
                      type="date"
                      value={c.stage1ClearedDate || ''}
                      onChange={(e) => updateContract({ stage1ClearedDate: e.target.value })}
                      className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-blue-600"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      (b) Shop Drawings Approved
                    </label>
                    <input
                      type="date"
                      value={c.shopDrawingApprovedDate || ''}
                      onChange={(e) => updateContract({ shopDrawingApprovedDate: e.target.value })}
                      className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-blue-600"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1 flex items-center justify-between">
                      <span>(c) Sample Confirmed (Auto)</span>
                      <button
                        type="button"
                        onClick={() => setActiveTab('samples')}
                        className="text-[10px] font-bold text-blue-700 hover:underline cursor-pointer"
                      >
                        Edit in Samples →
                      </button>
                    </label>
                    <div className="px-2.5 py-1.5 text-xs font-mono font-bold rounded-lg border border-emerald-200 bg-emerald-50/70 text-emerald-900 flex items-center justify-between">
                      <span>{activeTimeline.sampleConfirmedDate || 'Not signed yet'}</span>
                      {activeTimeline.sampleConfirmedId && (
                        <span className="text-[10px] font-semibold text-emerald-700">
                          {activeTimeline.sampleConfirmedId}
                        </span>
                      )}
                    </div>
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      Manual Completion Override (Optional)
                    </label>
                    <input
                      type="date"
                      value={c.manualTargetCompletionDate || ''}
                      onChange={(e) => updateContract({ manualTargetCompletionDate: e.target.value })}
                      className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-blue-600"
                    />
                  </div>
                </div>

                {/* Live Computed Results Strip */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 pt-1">
                  <div className="bg-white border border-slate-200 rounded-lg p-2.5">
                    <div className="text-[10px] font-semibold uppercase text-slate-500">Production Clock Start</div>
                    <div className="text-xs font-mono font-bold text-slate-900 mt-0.5">
                      {activeTimeline.productionStartDate || '—'}
                    </div>
                    <div className="text-[10px] text-slate-500 truncate">{activeTimeline.productionStartSource}</div>
                  </div>
                  <div className="bg-white border border-slate-200 rounded-lg p-2.5">
                    <div className="text-[10px] font-semibold uppercase text-slate-500">
                      Earliest (+{activeTimeline.minWorkingDays}{activeTimeline.approvedVoDays > 0 ? `+${activeTimeline.approvedVoDays}` : ''} wd)
                    </div>
                    <div className="text-xs font-mono font-bold text-slate-900 mt-0.5">
                      {activeTimeline.revisedMinCompletionDate || activeTimeline.autoMinCompletionDate || '—'}
                    </div>
                    <div className="text-[10px] text-slate-500">Min contractual window</div>
                  </div>
                  <div className="bg-white border border-blue-200 rounded-lg p-2.5">
                    <div className="text-[10px] font-semibold uppercase text-blue-700">
                      Deadline (+{activeTimeline.maxWorkingDays}{activeTimeline.approvedVoDays > 0 ? `+${activeTimeline.approvedVoDays}` : ''} wd)
                    </div>
                    <div className="text-xs font-mono font-extrabold text-blue-800 mt-0.5">
                      {activeTimeline.revisedMaxCompletionDate || activeTimeline.autoMaxCompletionDate || '—'}
                    </div>
                    <div className="text-[10px] text-slate-500">
                      {activeTimeline.approvedVoDays > 0
                        ? `Includes +${activeTimeline.approvedVoDays} approved VO wd`
                        : 'Base contract max period'}
                    </div>
                  </div>
                  <div className="bg-white border border-slate-200 rounded-lg p-2.5">
                    <div className="text-[10px] font-semibold uppercase text-slate-500">Working Days Status</div>
                    <div className="text-xs font-bold text-slate-900 mt-0.5">
                      {activeTimeline.status === 'Completed'
                        ? `Completed (${activeTimeline.actualCompletionDate})`
                        : activeTimeline.workingDaysRemaining === null
                        ? 'Pending Triggers'
                        : activeTimeline.workingDaysRemaining < 0
                        ? `Overdue by ${Math.abs(activeTimeline.workingDaysRemaining)} wd`
                        : activeTimeline.workingDaysRemaining === 0
                        ? 'Due Today'
                        : `${activeTimeline.workingDaysRemaining} wd remaining`}
                    </div>
                    <div className="text-[10px] text-slate-500">Auto-synced to VOs &amp; Progression</div>
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    Project Timelines, Quotas &amp; Approval Windows (Editable)
                  </h3>
                  <p className="text-xs text-slate-500">
                    Pre-filled with Touch Of Wood NOV Version timelines; adjust per project as required
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    updateContractTerms({
                      clientItemsAdvanceDays: DEFAULT_CONTRACT_TERMS.clientItemsAdvanceDays,
                      shopDrawingMinDays: DEFAULT_CONTRACT_TERMS.shopDrawingMinDays,
                      shopDrawingMaxDays: DEFAULT_CONTRACT_TERMS.shopDrawingMaxDays,
                      includedRevisionRounds: DEFAULT_CONTRACT_TERMS.includedRevisionRounds,
                      sampleOptionsMin: DEFAULT_CONTRACT_TERMS.sampleOptionsMin,
                      sampleOptionsMax: DEFAULT_CONTRACT_TERMS.sampleOptionsMax,
                      sampleSignOffDays: DEFAULT_CONTRACT_TERMS.sampleSignOffDays,
                      otherDocsSignOffDays: DEFAULT_CONTRACT_TERMS.otherDocsSignOffDays,
                      finalNoticeDefaultDays: DEFAULT_CONTRACT_TERMS.finalNoticeDefaultDays,
                      priceEscalationDelayDays: DEFAULT_CONTRACT_TERMS.priceEscalationDelayDays,
                      paymentSuspensionDays: DEFAULT_CONTRACT_TERMS.paymentSuspensionDays,
                      completionMinDays: DEFAULT_CONTRACT_TERMS.completionMinDays,
                      completionMaxDays: DEFAULT_CONTRACT_TERMS.completionMaxDays,
                      readinessConfirmDays: DEFAULT_CONTRACT_TERMS.readinessConfirmDays,
                      snagReportDays: DEFAULT_CONTRACT_TERMS.snagReportDays,
                      snagRectificationDays: DEFAULT_CONTRACT_TERMS.snagRectificationDays,
                      abandonmentDefaultDays: DEFAULT_CONTRACT_TERMS.abandonmentDefaultDays,
                      abandonmentFinalNoticeDays: DEFAULT_CONTRACT_TERMS.abandonmentFinalNoticeDays,
                      cancellationSettlementDays: DEFAULT_CONTRACT_TERMS.cancellationSettlementDays,
                      disputeAmicableDays: DEFAULT_CONTRACT_TERMS.disputeAmicableDays,
                    })
                  }
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  Reset Timelines to Defaults
                </button>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
                {[
                  { label: 'Completion Min (W. Days · Cl 6.1)', key: 'completionMinDays' as const },
                  { label: 'Completion Max (W. Days · Cl 6.1)', key: 'completionMaxDays' as const },
                  { label: 'Shop Drawings Min (W. Days · Cl 2.2)', key: 'shopDrawingMinDays' as const },
                  { label: 'Shop Drawings Max (W. Days · Cl 2.2)', key: 'shopDrawingMaxDays' as const },
                  { label: 'Included Revisions (Cl 2.2)', key: 'includedRevisionRounds' as const },
                  { label: 'Client Items Advance (W. Days · Cl 1.2)', key: 'clientItemsAdvanceDays' as const },
                  { label: 'Sample Options Min (Cl 2.3)', key: 'sampleOptionsMin' as const },
                  { label: 'Sample Options Max (Cl 2.3)', key: 'sampleOptionsMax' as const },
                  { label: 'Sample Sign-Off (W. Days · Cl 2.4)', key: 'sampleSignOffDays' as const },
                  { label: 'Other Docs Sign-Off (W. Days · Cl 2.4)', key: 'otherDocsSignOffDays' as const },
                  { label: 'Final Default Notice (W. Days · Cl 2.4)', key: 'finalNoticeDefaultDays' as const },
                  { label: 'Price Escalation Delay (W. Days · Cl 3.2)', key: 'priceEscalationDelayDays' as const },
                  { label: 'Payment Suspension (Cal. Days · Cl 4.2)', key: 'paymentSuspensionDays' as const },
                  { label: 'Readiness Confirm (W. Days · Cl 6.3)', key: 'readinessConfirmDays' as const },
                  { label: 'Snag Report Window (W. Days · Cl 7.1)', key: 'snagReportDays' as const },
                  { label: 'Snag Rectification (W. Days · FC)', key: 'snagRectificationDays' as const },
                  { label: 'Abandonment Default (Cal. Days · Cl 10.3)', key: 'abandonmentDefaultDays' as const },
                  { label: 'Final Abandonment Notice (Days · Cl 10.3)', key: 'abandonmentFinalNoticeDays' as const },
                  { label: 'Cancel Settlement (Cal. Days · Cl 12.2)', key: 'cancellationSettlementDays' as const },
                  { label: 'Amicable Dispute Window (Days · Cl 15.2)', key: 'disputeAmicableDays' as const },
                ].map((field) => (
                  <div key={field.key}>
                    <label className="block text-[11px] font-medium text-slate-600 mb-1 truncate" title={field.label}>
                      {field.label}
                    </label>
                    <CleanNumberInput
                      value={t[field.key]}
                      onChange={(val) => updateContractTerms({ [field.key]: val })}
                      className="w-full px-2.5 py-1.5 text-xs font-mono font-bold bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:border-blue-600"
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Section D: Management-Only Fixed Contractual Fees & Warranty */}
            <div className="pt-4 border-t border-slate-200 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  {canEditManagementLocks ? (
                    <ShieldCheck className="w-4 h-4 text-emerald-700" />
                  ) : (
                    <Lock className="w-4 h-4 text-amber-700" />
                  )}
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">
                      Fixed Contractual Fees &amp; Workmanship Warranty
                    </h3>
                    <p className="text-xs text-slate-500">
                      {canEditManagementLocks
                        ? `Management access verified (${MANAGEMENT_ADMIN_EMAIL}) — you may edit fixed fees and warranty.`
                        : `Locked for sales team — only Management (${MANAGEMENT_ADMIN_EMAIL}) is permitted to modify fixed fees or warranty.`}
                    </p>
                  </div>
                </div>
                {!canEditManagementLocks && (
                  <span className="text-xs font-semibold text-amber-800">
                    Locked · Management Only ({MANAGEMENT_ADMIN_EMAIL})
                  </span>
                )}
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3.5">
                {[
                  { label: `Workmanship Warranty (Years · Cl 11.1)`, key: 'warrantyYears' as const },
                  { label: `Client-Supplied Markup (% · Cl 1.2)`, key: 'clientSuppliedMarkupPct' as const },
                  { label: `Additional Revision Fee (${currency} · Cl 2.2)`, key: 'additionalRevisionFee' as const },
                  { label: `Extra Sample Session (${currency} · Cl 2.3)`, key: 'extraSampleSessionFee' as const },
                  { label: `Extra Custom Sample (${currency} · Cl 2.3)`, key: 'extraCustomSampleFee' as const },
                  { label: `Sample Site Delivery (${currency} · Cl 4.3)`, key: 'sampleSiteDeliveryFee' as const },
                  { label: `Post-Acceptance Call-Out (${currency} · Cl 4.3)`, key: 'postAcceptanceCalloutFee' as const },
                  { label: `Aborted Site Standby (${currency} · Cl 4.3)`, key: 'abortedSiteVisitFee' as const },
                  { label: `Factory Storage / Day (${currency} · Cl 4.3)`, key: 'factoryStorageDailyFee' as const },
                  { label: `Complimentary Storage (Days · Cl 4.3)`, key: 'factoryStorageFreeDays' as const },
                  { label: `VO Scope Ceiling (${currency} · Cl 9.2)`, key: 'voScopeCeiling' as const },
                  { label: `Cancellation Fee (% · Cl 12.2)`, key: 'cancellationFeePct' as const },
                  { label: `Liability Cap (% · Cl 13.2)`, key: 'liabilityCapPct' as const },
                ].map((field) => (
                  <div key={field.key}>
                    <label className="block text-[11px] font-medium text-slate-600 mb-1 truncate" title={field.label}>
                      {field.label}
                    </label>
                    <CleanNumberInput
                      value={t[field.key]}
                      disabled={!canEditManagementLocks}
                      onChange={(val) => {
                        if (!canEditManagementLocks) return;
                        updateContractTerms({ [field.key]: val });
                      }}
                      className={`w-full px-2.5 py-1.5 text-xs font-mono font-bold border rounded-lg ${
                        canEditManagementLocks
                          ? 'bg-slate-50 border-slate-200 focus:bg-white focus:outline-none focus:border-blue-600 text-slate-900'
                          : 'bg-slate-100 border-slate-200 text-slate-500 cursor-not-allowed'
                      }`}
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Section E: Signatory Details (Clause 16) */}
            <div className="pt-4 border-t border-slate-200 space-y-3">
              <h3 className="text-sm font-bold text-slate-900">Clause 16 — Signatory Details</h3>
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Contractor Signatory Name</label>
                  <input
                    type="text"
                    value={c.contractorSignatoryName}
                    onChange={(e) => updateContract({ contractorSignatoryName: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:border-blue-600"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Signatory Title</label>
                  <input
                    type="text"
                    value={c.contractorSignatoryTitle}
                    onChange={(e) => updateContract({ contractorSignatoryTitle: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:border-blue-600"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Contractor Sign Date</label>
                  <input
                    type="date"
                    value={c.contractorSignDate}
                    onChange={(e) => updateContract({ contractorSignDate: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:border-blue-600"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Client Sign Date (optional)</label>
                  <input
                    type="date"
                    value={c.clientSignDate}
                    onChange={(e) => updateContract({ clientSignDate: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:border-blue-600"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ============================================================ */}
        {/* TAB 2: SAMPLE CONFIRMATIONS (UNLIMITED BATCHES + PHOTOS)     */}
        {/* ============================================================ */}
        {activeTab === 'samples' && (
          <div className="p-5 sm:p-6 space-y-5">
            {/* Multi-sheet switcher bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-200">
              <div className="flex flex-wrap items-center gap-1.5">
                {activeSuite.sampleConfirmations.map((sc) => (
                  <button
                    key={sc.id}
                    type="button"
                    onClick={() => setSelectedSampleId(sc.id)}
                    className={`px-3 py-1.5 text-xs font-mono font-bold rounded-lg border transition-colors cursor-pointer ${
                      currentSample?.id === sc.id
                        ? 'bg-slate-900 text-white border-slate-900'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    {sc.sampleId} ({sc.rows.length})
                  </button>
                ))}
                <button
                  type="button"
                  onClick={handleAddSampleSheet}
                  className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg transition-colors cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  New Sample Confirmation
                </button>
              </div>

              {currentSample && (
                <div className="flex flex-wrap items-center gap-2">
                  <select
                    value={currentSample.status || 'Draft'}
                    onChange={(e) =>
                      updateSample(currentSample.id, (s) => ({
                        ...s,
                        status: e.target.value as DocumentStatus,
                      }))
                    }
                    title="Sample Confirmation Status"
                    className="px-2.5 py-1.5 text-xs font-semibold bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-amber-600 cursor-pointer"
                  >
                    <option value="Draft">Draft</option>
                    <option value="Sent">Sent</option>
                    <option value="Signed">Signed</option>
                  </select>
                  <button
                    type="button"
                    onClick={() => handleDuplicateSampleSheet(currentSample)}
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg cursor-pointer"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    Duplicate
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeleteSampleSheet(currentSample.id)}
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-red-600 bg-red-50 hover:bg-red-100 rounded-lg cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Delete
                  </button>
                  <button
                    type="button"
                    onClick={() => onPrintDocument(activeSuite, { type: 'sample', doc: currentSample })}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 rounded-lg cursor-pointer"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    Generate &amp; Print {currentSample.sampleId}
                  </button>
                </div>
              )}
            </div>

            {!currentSample ? (
              <div className="p-10 text-center border border-dashed border-slate-200 rounded-xl">
                <p className="text-sm font-bold text-slate-800">No Sample Confirmations created yet</p>
                <p className="text-xs text-slate-500 mt-1">
                  Create as many Sample Confirmation sheets as needed for different rooms, batches, or revisions.
                </p>
                <button
                  type="button"
                  onClick={handleAddSampleSheet}
                  className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  Create Sample Confirmation S-001
                </button>
              </div>
            ) : (
              <div className="space-y-5">
                {/* Header metadata */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Sample ID</label>
                    <input
                      type="text"
                      value={currentSample.sampleId}
                      onChange={(e) =>
                        updateSample(currentSample.id, (s) => ({ ...s, sampleId: e.target.value }))
                      }
                      className="w-full px-3 py-2 text-xs font-mono font-bold bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:border-blue-600 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Drawing Reference</label>
                    <input
                      type="text"
                      value={currentSample.drawingReference}
                      onChange={(e) =>
                        updateSample(currentSample.id, (s) => ({ ...s, drawingReference: e.target.value }))
                      }
                      placeholder="TOW-DW-2026-001 Rev 0"
                      className="w-full px-3 py-2 text-xs font-mono bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:border-blue-600 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Date Issued</label>
                    <input
                      type="date"
                      value={currentSample.dateIssued}
                      onChange={(e) =>
                        updateSample(currentSample.id, (s) => ({ ...s, dateIssued: e.target.value }))
                      }
                      className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:border-blue-600 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Client Name</label>
                    <input
                      type="text"
                      value={currentSample.clientName}
                      onChange={(e) =>
                        updateSample(currentSample.id, (s) => ({ ...s, clientName: e.target.value }))
                      }
                      placeholder={c.clientName || 'Client Name'}
                      className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:border-blue-600 focus:outline-none"
                    />
                  </div>
                </div>

                {/* Interactive Sample Table */}
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-slate-900">
                      Sample Description Table ({currentSample.rows.length} item{currentSample.rows.length === 1 ? '' : 's'})
                    </h4>
                    <button
                      type="button"
                      onClick={() =>
                        updateSample(currentSample.id, (s) => ({
                          ...s,
                          rows: [...s.rows, createBlankSampleRow(s.rows.length + 1)],
                        }))
                      }
                      className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Add Sample Row
                    </button>
                  </div>

                  <div className="overflow-x-auto border border-slate-200 rounded-xl">
                    <table className="w-full text-left border-collapse text-xs min-w-[980px]">
                      <thead>
                        <tr className="bg-amber-50/90 border-b border-slate-200 text-[11px] font-bold text-slate-800">
                          <th className="py-2.5 px-2 w-24">JY Code</th>
                          <th className="py-2.5 px-2 w-32">Room Area</th>
                          <th className="py-2.5 px-2 w-32">Component</th>
                          <th className="py-2.5 px-2 w-36">Material / Finish</th>
                          <th className="py-2.5 px-2 w-32">Code / Slab ID</th>
                          <th className="py-2.5 px-2 w-40">Technical Spec</th>
                          <th className="py-2.5 px-2 w-36">Photo</th>
                          <th className="py-2.5 px-2 w-36">Approval Note</th>
                          <th className="py-2.5 px-2 w-10 text-center"></th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {currentSample.rows.map((row) => {
                          const updateRow = (patch: Partial<SampleConfirmationRow>) => {
                            updateSample(currentSample.id, (s) => ({
                              ...s,
                              rows: s.rows.map((r) => (r.id === row.id ? { ...r, ...patch } : r)),
                            }));
                          };
                          return (
                            <tr key={row.id} className="align-top hover:bg-slate-50/50">
                              <td className="p-2">
                                <input
                                  type="text"
                                  value={row.jyCode}
                                  onChange={(e) => updateRow({ jyCode: e.target.value })}
                                  placeholder="JY-01"
                                  className="w-full px-2 py-1.5 text-xs font-mono font-bold bg-white border border-slate-200 rounded focus:outline-none focus:border-blue-600"
                                />
                              </td>
                              <td className="p-2">
                                <input
                                  type="text"
                                  value={row.roomArea}
                                  onChange={(e) => updateRow({ roomArea: e.target.value })}
                                  placeholder="Guest Bedroom"
                                  className="w-full px-2 py-1.5 text-xs bg-white border border-slate-200 rounded focus:outline-none focus:border-blue-600"
                                />
                              </td>
                              <td className="p-2">
                                <input
                                  type="text"
                                  value={row.component}
                                  onChange={(e) => updateRow({ component: e.target.value })}
                                  placeholder="Wall panel"
                                  className="w-full px-2 py-1.5 text-xs bg-white border border-slate-200 rounded focus:outline-none focus:border-blue-600"
                                />
                              </td>
                              <td className="p-2">
                                <input
                                  type="text"
                                  value={row.materialFinish}
                                  onChange={(e) => updateRow({ materialFinish: e.target.value })}
                                  placeholder="Laminate Tokyo Beige"
                                  className="w-full px-2 py-1.5 text-xs bg-white border border-slate-200 rounded focus:outline-none focus:border-blue-600"
                                />
                              </td>
                              <td className="p-2">
                                <input
                                  type="text"
                                  value={row.codeSlabId}
                                  onChange={(e) => updateRow({ codeSlabId: e.target.value })}
                                  placeholder="3731OXD"
                                  className="w-full px-2 py-1.5 text-xs font-mono bg-white border border-slate-200 rounded focus:outline-none focus:border-blue-600"
                                />
                              </td>
                              <td className="p-2">
                                <textarea
                                  rows={2}
                                  value={row.technicalSpec}
                                  onChange={(e) => updateRow({ technicalSpec: e.target.value })}
                                  placeholder="SS304 1.2mm Brushed PVD"
                                  className="w-full px-2 py-1 text-xs bg-white border border-slate-200 rounded focus:outline-none focus:border-blue-600 resize-none"
                                />
                              </td>
                              <td className="p-2">
                                <div className="space-y-1.5">
                                  {row.photoUrl ? (
                                    <div className="relative group w-24 h-16 rounded border border-slate-200 overflow-hidden bg-slate-50">
                                      <img
                                        src={row.photoUrl}
                                        alt={row.photoFileName || 'Sample'}
                                        className="w-full h-full object-cover"
                                        referrerPolicy="no-referrer"
                                      />
                                      <button
                                        type="button"
                                        onClick={() => updateRow({ photoUrl: '', photoFileName: '' })}
                                        title="Remove photo"
                                        className="absolute top-1 right-1 p-0.5 bg-red-600 text-white rounded shadow cursor-pointer"
                                      >
                                        <X className="w-3 h-3" />
                                      </button>
                                    </div>
                                  ) : null}
                                  <label className="inline-flex items-center gap-1 px-2 py-1 text-[11px] font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded cursor-pointer">
                                    <Upload className="w-3 h-3 text-blue-600" />
                                    <span>{row.photoUrl ? 'Change' : 'Upload Photo'}</span>
                                    <input
                                      type="file"
                                      accept="image/*"
                                      onChange={(e) => handleSamplePhotoUpload(currentSample.id, row.id, e)}
                                      className="hidden"
                                    />
                                  </label>
                                  <input
                                    type="text"
                                    value={row.photoFileName || ''}
                                    onChange={(e) => updateRow({ photoFileName: e.target.value })}
                                    placeholder="Photo ref / filename"
                                    className="w-full px-1.5 py-1 text-[10px] font-mono bg-white border border-slate-200 rounded focus:outline-none focus:border-blue-600"
                                  />
                                </div>
                              </td>
                              <td className="p-2">
                                <textarea
                                  rows={2}
                                  value={row.approvalNote}
                                  onChange={(e) => updateRow({ approvalNote: e.target.value })}
                                  placeholder="Approved / note"
                                  className="w-full px-2 py-1 text-xs bg-white border border-slate-200 rounded focus:outline-none focus:border-blue-600 resize-none"
                                />
                              </td>
                              <td className="p-2 text-center">
                                <button
                                  type="button"
                                  onClick={() =>
                                    updateSample(currentSample.id, (s) => ({
                                      ...s,
                                      rows: s.rows.filter((r) => r.id !== row.id),
                                    }))
                                  }
                                  className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded cursor-pointer"
                                  title="Remove row"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Delivery Method & Signatories */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 pt-3 border-t border-slate-200">
                  <div className="space-y-3">
                    <h4 className="text-xs font-bold text-slate-900">Delivery Method</h4>
                    <div className="space-y-2 text-xs">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name={`del_${currentSample.id}`}
                          checked={currentSample.deliveryMethod === 'office'}
                          onChange={() =>
                            updateSample(currentSample.id, (s) => ({ ...s, deliveryMethod: 'office' }))
                          }
                        />
                        <span>Collected from office (Complimentary)</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name={`del_${currentSample.id}`}
                          checked={currentSample.deliveryMethod === 'site'}
                          onChange={() =>
                            updateSample(currentSample.id, (s) => ({
                              ...s,
                              deliveryMethod: 'site',
                              deliveryFee: c.terms.sampleSiteDeliveryFee,
                            }))
                          }
                        />
                        <span>
                          Delivered to Client site ({currency} {formatMoney(c.terms.sampleSiteDeliveryFee)} delivery fee)
                        </span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name={`del_${currentSample.id}`}
                          checked={currentSample.deliveryMethod === 'none'}
                          onChange={() =>
                            updateSample(currentSample.id, (s) => ({ ...s, deliveryMethod: 'none' }))
                          }
                        />
                        <span>Leave blank for manual fill on print</span>
                      </label>
                    </div>
                    {currentSample.deliveryMethod !== 'none' && (
                      <div className="max-w-xs">
                        <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                          Collection / Delivery Date
                        </label>
                        <input
                          type="date"
                          value={currentSample.deliveryDate}
                          onChange={(e) =>
                            updateSample(currentSample.id, (s) => ({ ...s, deliveryDate: e.target.value }))
                          }
                          className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg"
                        />
                      </div>
                    )}
                  </div>

                  <div className="space-y-3">
                    <h4 className="text-xs font-bold text-slate-900">Contractor Representative</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-600 mb-1">Name</label>
                        <input
                          type="text"
                          value={currentSample.contractorName}
                          onChange={(e) =>
                            updateSample(currentSample.id, (s) => ({ ...s, contractorName: e.target.value }))
                          }
                          className="w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-600 mb-1">Position</label>
                        <input
                          type="text"
                          value={currentSample.contractorPosition}
                          onChange={(e) =>
                            updateSample(currentSample.id, (s) => ({ ...s, contractorPosition: e.target.value }))
                          }
                          className="w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-600 mb-1">Date</label>
                        <input
                          type="date"
                          value={currentSample.contractorDate}
                          onChange={(e) =>
                            updateSample(currentSample.id, (s) => ({ ...s, contractorDate: e.target.value }))
                          }
                          className="w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ============================================================ */}
        {/* TAB 3: VARIATION ORDERS (UNLIMITED + AUTO COST & TIME MATH)  */}
        {/* ============================================================ */}
        {activeTab === 'vos' && (
          <div className="p-5 sm:p-6 space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-200">
              <div className="flex flex-wrap items-center gap-1.5">
                {activeSuite.variationOrders.map((vo) => {
                  const voCalc = calculateVoTotals(vo);
                  return (
                    <button
                      key={vo.id}
                      type="button"
                      onClick={() => setSelectedVoId(vo.id)}
                      className={`px-3 py-1.5 text-xs font-mono font-bold rounded-lg border transition-colors cursor-pointer ${
                        currentVo?.id === vo.id
                          ? 'bg-slate-900 text-white border-slate-900'
                          : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      {vo.voNo} · {formatMoney(voCalc.totalInclVat)} {currency}
                    </button>
                  );
                })}
                <button
                  type="button"
                  onClick={handleAddVo}
                  className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg transition-colors cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  New Variation Order
                </button>
              </div>

              {currentVo && (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleDeleteVo(currentVo.id)}
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-red-600 bg-red-50 hover:bg-red-100 rounded-lg cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Delete
                  </button>
                  <button
                    type="button"
                    onClick={() => onPrintDocument(activeSuite, { type: 'vo', doc: currentVo })}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg cursor-pointer"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    Generate &amp; Print {currentVo.voNo}
                  </button>
                </div>
              )}
            </div>

            {!currentVo ? (
              <div className="p-10 text-center border border-dashed border-slate-200 rounded-xl">
                <p className="text-sm font-bold text-slate-800">No Variation Orders (VOs) on this contract</p>
                <p className="text-xs text-slate-500 mt-1">
                  Add a Variation Order whenever scope, materials, or drawings change under Clause 9.
                </p>
                <button
                  type="button"
                  onClick={handleAddVo}
                  className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  Create Variation Order VO-001
                </button>
              </div>
            ) : (
              (() => {
                const voCalc = calculateVoTotals(currentVo);
                const exceedsCeiling = voCalc.totalInclVat > c.terms.voScopeCeiling;
                return (
                  <div className="space-y-5">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">Variation Order No.</label>
                        <input
                          type="text"
                          value={currentVo.voNo}
                          onChange={(e) => updateVo(currentVo.id, (v) => ({ ...v, voNo: e.target.value }))}
                          className="w-full px-3 py-2 text-xs font-mono font-bold bg-slate-50 border border-slate-200 rounded-lg"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">Status</label>
                        <select
                          value={currentVo.status}
                          onChange={(e) =>
                            updateVo(currentVo.id, (v) => ({
                              ...v,
                              status: e.target.value as VariationOrderDocument['status'],
                            }))
                          }
                          className="w-full px-3 py-2 text-xs font-semibold bg-slate-50 border border-slate-200 rounded-lg"
                        >
                          <option value="Draft">Draft</option>
                          <option value="Pending">Pending Approval</option>
                          <option value="Approved">Approved &amp; Signed</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">Issued By</label>
                        <select
                          value={currentVo.issuedBy}
                          onChange={(e) =>
                            updateVo(currentVo.id, (v) => ({
                              ...v,
                              issuedBy: e.target.value as 'Contractor' | 'Client',
                            }))
                          }
                          className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg"
                        >
                          <option value="Contractor">Contractor</option>
                          <option value="Client">Client</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">Date Issued</label>
                        <input
                          type="date"
                          value={currentVo.dateIssued}
                          onChange={(e) => updateVo(currentVo.id, (v) => ({ ...v, dateIssued: e.target.value }))}
                          className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">Origin Requested By</label>
                        <select
                          value={currentVo.originRequestedBy}
                          onChange={(e) =>
                            updateVo(currentVo.id, (v) => ({
                              ...v,
                              originRequestedBy: e.target.value as 'Client' | 'Contractor',
                            }))
                          }
                          className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg"
                        >
                          <option value="Client">Client</option>
                          <option value="Contractor">Contractor</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">Request Date</label>
                        <input
                          type="date"
                          value={currentVo.requestDate}
                          onChange={(e) => updateVo(currentVo.id, (v) => ({ ...v, requestDate: e.target.value }))}
                          className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg"
                        />
                      </div>
                      <div className="sm:col-span-2">
                        <label className="block text-xs font-semibold text-slate-700 mb-1">Reference Drawing(s)</label>
                        <input
                          type="text"
                          value={currentVo.referenceDrawings}
                          onChange={(e) =>
                            updateVo(currentVo.id, (v) => ({ ...v, referenceDrawings: e.target.value }))
                          }
                          placeholder="e.g. TOW-DW-2026-004 Rev 2"
                          className="w-full px-3 py-2 text-xs font-mono bg-slate-50 border border-slate-200 rounded-lg"
                        />
                      </div>
                    </div>

                    {/* Itemized Description of Variation */}
                    <div className="space-y-2.5">
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs font-bold text-slate-900">Itemized Description of Variation</h4>
                        <button
                          type="button"
                          onClick={() =>
                            updateVo(currentVo.id, (v) => ({
                              ...v,
                              items: [
                                ...v.items,
                                { id: 'voi_' + Math.random().toString(36).substring(2, 8), description: '' },
                              ],
                            }))
                          }
                          className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg cursor-pointer"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          Add Change Item
                        </button>
                      </div>
                      <div className="space-y-2">
                        {currentVo.items.map((item, idx) => (
                          <div key={item.id} className="flex items-center gap-2">
                            <span className="w-7 text-center font-mono font-bold text-xs text-slate-500">
                              {idx + 1}.
                            </span>
                            <input
                              type="text"
                              value={item.description}
                              onChange={(e) =>
                                updateVo(currentVo.id, (v) => ({
                                  ...v,
                                  items: v.items.map((it) =>
                                    it.id === item.id ? { ...it, description: e.target.value } : it
                                  ),
                                }))
                              }
                              placeholder="Describe change in material, dimensions, hardware, or scope..."
                              className="flex-1 px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:border-blue-600 focus:outline-none"
                            />
                            <button
                              type="button"
                              onClick={() =>
                                updateVo(currentVo.id, (v) => ({
                                  ...v,
                                  items: v.items.filter((it) => it.id !== item.id),
                                }))
                              }
                              className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Cost Impact & Time Impact */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 pt-3 border-t border-slate-200">
                      <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
                        <h4 className="text-xs font-bold text-slate-900">Cost Impact</h4>
                        <div className="flex justify-between text-xs text-slate-600">
                          <span>Original Contract Value:</span>
                          <span className="font-mono tabular-nums font-bold text-slate-900">
                            {formatMoney(c.contractValue)} {currency}
                          </span>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                              VO Cost (excl. VAT)
                            </label>
                            <CleanNumberInput
                              value={currentVo.voCostExclVat}
                              onChange={(val) => updateVo(currentVo.id, (v) => ({ ...v, voCostExclVat: val }))}
                              className="w-full px-3 py-2 text-xs font-mono font-bold bg-white border border-slate-300 rounded-lg"
                            />
                          </div>
                          <div>
                            <label className="block text-[11px] font-semibold text-slate-600 mb-1">VAT (%)</label>
                            <CleanNumberInput
                              value={currentVo.vatPct}
                              onChange={(val) => updateVo(currentVo.id, (v) => ({ ...v, vatPct: val }))}
                              className="w-full px-3 py-2 text-xs font-mono bg-white border border-slate-300 rounded-lg"
                            />
                          </div>
                        </div>
                        <div className="flex justify-between text-xs text-slate-600 pt-1">
                          <span>VAT ({currentVo.vatPct}%):</span>
                          <span className="font-mono tabular-nums font-semibold text-slate-900">
                            {formatMoney(voCalc.vatAmount)} {currency}
                          </span>
                        </div>
                        <div className="flex justify-between items-baseline border-t border-slate-300 pt-2 text-sm font-bold text-slate-900">
                          <span>Total VO Cost (incl. VAT):</span>
                          <span className="font-mono tabular-nums text-blue-700">
                            {formatMoney(voCalc.totalInclVat)} {currency}
                          </span>
                        </div>
                        {exceedsCeiling && (
                          <div className="flex items-start gap-2 p-2.5 bg-amber-50 border border-amber-300 rounded-lg text-[11px] text-amber-900">
                            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-amber-700" />
                            <span>
                              <strong>Clause 9.2 Notice:</strong> This VO exceeds the{' '}
                              <strong>
                                {currency} {formatMoney(c.terms.voScopeCeiling)}
                              </strong>{' '}
                              standard ceiling. Consider issuing a separate independent Contract unless mutually agreed
                              in writing.
                            </span>
                          </div>
                        )}
                      </div>

                      <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <h4 className="text-xs font-bold text-slate-900">
                            Time Impact (Auto-Calculated Mon–Sat excl. UAE Holidays)
                          </h4>
                          {activeTimeline.effectiveTargetDate && (
                            <button
                              type="button"
                              onClick={() => {
                                const orig =
                                  activeTimeline.autoMaxCompletionDate ||
                                  activeTimeline.effectiveTargetDate;
                                const revised = addWorkingDays(
                                  orig,
                                  currentVo.additionalWorkingDays,
                                  holidayDates
                                );
                                updateVo(currentVo.id, (v) => ({
                                  ...v,
                                  originalCompletionDate: orig,
                                  revisedCompletionDate: revised,
                                }));
                              }}
                              className="inline-flex items-center gap-1 px-2 py-1 text-[10.5px] font-bold text-blue-700 bg-white hover:bg-blue-50 border border-blue-200 rounded-md cursor-pointer"
                            >
                              <RefreshCw className="w-3 h-3" />
                              Sync from Contract
                            </button>
                          )}
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                              Original Completion Date
                            </label>
                            <input
                              type="date"
                              value={currentVo.originalCompletionDate}
                              onChange={(e) => {
                                const orig = e.target.value;
                                const revised = addWorkingDays(
                                  orig,
                                  currentVo.additionalWorkingDays,
                                  holidayDates
                                );
                                updateVo(currentVo.id, (v) => ({
                                  ...v,
                                  originalCompletionDate: orig,
                                  revisedCompletionDate: revised,
                                }));
                              }}
                              className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg"
                            />
                          </div>
                          <div>
                            <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                              Additional Working Days (+)
                            </label>
                            <CleanNumberInput
                              value={currentVo.additionalWorkingDays}
                              onChange={(days) => {
                                const revised = addWorkingDays(
                                  currentVo.originalCompletionDate,
                                  days,
                                  holidayDates
                                );
                                updateVo(currentVo.id, (v) => ({
                                  ...v,
                                  additionalWorkingDays: days,
                                  revisedCompletionDate: revised || v.revisedCompletionDate,
                                }));
                              }}
                              className="w-full px-3 py-2 text-xs font-mono font-bold bg-white border border-slate-300 rounded-lg"
                            />
                          </div>
                        </div>
                        <div>
                          <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                            Revised Completion Date (auto-calculated, editable)
                          </label>
                          <input
                            type="date"
                            value={currentVo.revisedCompletionDate}
                            onChange={(e) =>
                              updateVo(currentVo.id, (v) => ({ ...v, revisedCompletionDate: e.target.value }))
                            }
                            className="w-full px-3 py-2 text-xs font-semibold bg-white border border-slate-300 rounded-lg"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                            Notes / Attachments Reference
                          </label>
                          <textarea
                            rows={2}
                            value={currentVo.notesAttachments}
                            onChange={(e) =>
                              updateVo(currentVo.id, (v) => ({ ...v, notesAttachments: e.target.value }))
                            }
                            className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg resize-none"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })()
            )}
          </div>
        )}

        {/* ============================================================ */}
        {/* TAB 4: FINISH CERTIFICATES (SCOPES + SNAG LIST TABLE)        */}
        {/* ============================================================ */}
        {activeTab === 'finish' && (
          <div className="p-5 sm:p-6 space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-200">
              <div className="flex flex-wrap items-center gap-1.5">
                {activeSuite.finishCertificates.map((fc) => (
                  <button
                    key={fc.id}
                    type="button"
                    onClick={() => setSelectedFcId(fc.id)}
                    className={`px-3 py-1.5 text-xs font-mono font-bold rounded-lg border transition-colors cursor-pointer ${
                      currentFc?.id === fc.id
                        ? 'bg-slate-900 text-white border-slate-900'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    {fc.fcNo}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={handleAddFc}
                  className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg transition-colors cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  New Finish Certificate
                </button>
              </div>

              {currentFc && (
                <div className="flex flex-wrap items-center gap-2">
                  <select
                    value={currentFc.status || 'Draft'}
                    onChange={(e) =>
                      updateFc(currentFc.id, (f) => ({
                        ...f,
                        status: e.target.value as DocumentStatus,
                      }))
                    }
                    title="Finish Certificate Status"
                    className="px-2.5 py-1.5 text-xs font-semibold bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-emerald-600 cursor-pointer"
                  >
                    <option value="Draft">Draft</option>
                    <option value="Sent">Sent</option>
                    <option value="Signed">Signed</option>
                  </select>
                  <button
                    type="button"
                    onClick={() => handleDeleteFc(currentFc.id)}
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-red-600 bg-red-50 hover:bg-red-100 rounded-lg cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Delete
                  </button>
                  <button
                    type="button"
                    onClick={() => onPrintDocument(activeSuite, { type: 'finish', doc: currentFc })}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg cursor-pointer"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    Generate &amp; Print {currentFc.fcNo}
                  </button>
                </div>
              )}
            </div>

            {!currentFc ? (
              <div className="p-10 text-center border border-dashed border-slate-200 rounded-xl">
                <p className="text-sm font-bold text-slate-800">No Finish Certificate created yet</p>
                <button
                  type="button"
                  onClick={handleAddFc}
                  className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  Create Finish Certificate FC-001
                </button>
              </div>
            ) : (
              <div className="space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Finish Certificate No.</label>
                    <input
                      type="text"
                      value={currentFc.fcNo}
                      onChange={(e) => updateFc(currentFc.id, (f) => ({ ...f, fcNo: e.target.value }))}
                      className="w-full px-3 py-2 text-xs font-mono font-bold bg-slate-50 border border-slate-200 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Installation Completion Date
                    </label>
                    <input
                      type="date"
                      value={currentFc.installationCompletionDate}
                      onChange={(e) =>
                        updateFc(currentFc.id, (f) => ({ ...f, installationCompletionDate: e.target.value }))
                      }
                      className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Client Name</label>
                    <input
                      type="text"
                      value={currentFc.clientName}
                      onChange={(e) => updateFc(currentFc.id, (f) => ({ ...f, clientName: e.target.value }))}
                      placeholder={c.clientName || 'Client Name'}
                      className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg"
                    />
                  </div>
                </div>

                {/* Scope of Works Completed */}
                <div className="space-y-2.5">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h4 className="text-xs font-bold text-slate-900">Scope of Works Completed (Drawings / Scopes)</h4>
                    <div className="flex items-center gap-2">
                      {linkedQuotes.length > 0 && (
                        <button
                          type="button"
                          onClick={() => {
                            const mergedRefs = extractMergedScopesFromQuotations(linkedQuotes);
                            updateFc(currentFc.id, (f) => ({
                              ...f,
                              completedWorks: mergedRefs.map((ref, i) => ({
                                id: `fcw_imp_${i}_${Date.now()}`,
                                reference: ref,
                                completed: true,
                              })),
                            }));
                          }}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg cursor-pointer"
                        >
                          <RefreshCw className="w-3 h-3" />
                          Pull Scopes from {linkedQuotes.length > 1 ? `${linkedQuotes.length} Quotes` : 'Quote'}
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() =>
                          updateFc(currentFc.id, (f) => ({
                            ...f,
                            completedWorks: [
                              ...f.completedWorks,
                              {
                                id: 'fcw_' + Math.random().toString(36).substring(2, 8),
                                reference: '',
                                completed: true,
                              },
                            ],
                          }))
                        }
                        className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        Add Completed Item
                      </button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    {currentFc.completedWorks.map((work) => (
                      <div key={work.id} className="flex items-center gap-2.5">
                        <input
                          type="checkbox"
                          checked={work.completed}
                          onChange={(e) =>
                            updateFc(currentFc.id, (f) => ({
                              ...f,
                              completedWorks: f.completedWorks.map((w) =>
                                w.id === work.id ? { ...w, completed: e.target.checked } : w
                              ),
                            }))
                          }
                          className="w-4 h-4 rounded border-slate-300 text-blue-600 cursor-pointer"
                        />
                        <input
                          type="text"
                          value={work.reference}
                          onChange={(e) =>
                            updateFc(currentFc.id, (f) => ({
                              ...f,
                              completedWorks: f.completedWorks.map((w) =>
                                w.id === work.id ? { ...w, reference: e.target.value } : w
                              ),
                            }))
                          }
                          placeholder="Drawing No. TOW-DW-2026-001 Rev 1 — Master Bedroom Wardrobe"
                          className="flex-1 px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:border-blue-600 focus:outline-none"
                        />
                        <button
                          type="button"
                          onClick={() =>
                            updateFc(currentFc.id, (f) => ({
                              ...f,
                              completedWorks: f.completedWorks.filter((w) => w.id !== work.id),
                            }))
                          }
                          className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Outstanding Snag Items Table */}
                <div className="space-y-2.5 pt-3 border-t border-slate-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-xs font-bold text-slate-900">Outstanding Snag Items (if any)</h4>
                      <p className="text-[11px] text-slate-500">
                        Leave empty to automatically print &quot;None&quot; on the official Finish Certificate
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        updateFc(currentFc.id, (f) => ({
                          ...f,
                          snagItems: [
                            ...f.snagItems,
                            {
                              id: 'snag_' + Math.random().toString(36).substring(2, 8),
                              description: '',
                              rectificationBy: addWorkingDays(
                                f.installationCompletionDate || new Date().toISOString().split('T')[0],
                                c.terms.snagRectificationDays
                              ),
                              responsible: 'Contractor',
                            },
                          ],
                        }))
                      }
                      className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-bold text-amber-800 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-lg cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Add Snag Item
                    </button>
                  </div>

                  {currentFc.snagItems.length === 0 ? (
                    <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-600">
                      No snag items recorded — certificate will display <strong>&quot;None&quot;</strong>.
                    </div>
                  ) : (
                    <div className="overflow-x-auto border border-slate-200 rounded-lg">
                      <table className="w-full text-left border-collapse text-xs">
                        <thead>
                          <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                            <th className="py-2 px-3">Snag Item Description</th>
                            <th className="py-2 px-3 w-36">Rectification By</th>
                            <th className="py-2 px-3 w-32">Responsible</th>
                            <th className="py-2 px-3 w-40">Snag Photo (1 / item)</th>
                            <th className="py-2 px-2 w-10"></th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {currentFc.snagItems.map((snag) => (
                            <tr key={snag.id} className="align-top">
                              <td className="p-2">
                                <input
                                  type="text"
                                  value={snag.description}
                                  onChange={(e) =>
                                    updateFc(currentFc.id, (f) => ({
                                      ...f,
                                      snagItems: f.snagItems.map((s) =>
                                        s.id === snag.id ? { ...s, description: e.target.value } : s
                                      ),
                                    }))
                                  }
                                  placeholder="e.g. Touch-up lacquer on wardrobe shutter hinge"
                                  className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded"
                                />
                              </td>
                              <td className="p-2">
                                <input
                                  type="date"
                                  value={snag.rectificationBy}
                                  onChange={(e) =>
                                    updateFc(currentFc.id, (f) => ({
                                      ...f,
                                      snagItems: f.snagItems.map((s) =>
                                        s.id === snag.id ? { ...s, rectificationBy: e.target.value } : s
                                      ),
                                    }))
                                  }
                                  className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded"
                                />
                              </td>
                              <td className="p-2">
                                <select
                                  value={snag.responsible}
                                  onChange={(e) =>
                                    updateFc(currentFc.id, (f) => ({
                                      ...f,
                                      snagItems: f.snagItems.map((s) =>
                                        s.id === snag.id
                                          ? { ...s, responsible: e.target.value as 'Contractor' | 'Client' }
                                          : s
                                      ),
                                    }))
                                  }
                                  className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded"
                                >
                                  <option value="Contractor">Contractor</option>
                                  <option value="Client">Client</option>
                                </select>
                              </td>
                              <td className="p-2">
                                <div className="space-y-1.5">
                                  {snag.photoUrl && (
                                    <div className="relative w-24 h-16 rounded border border-slate-200 overflow-hidden bg-slate-50">
                                      <img
                                        src={snag.photoUrl}
                                        alt={snag.photoFileName || 'Snag'}
                                        className="w-full h-full object-cover"
                                        referrerPolicy="no-referrer"
                                      />
                                      <button
                                        type="button"
                                        onClick={() =>
                                          updateFc(currentFc.id, (f) => ({
                                            ...f,
                                            snagItems: f.snagItems.map((s) =>
                                              s.id === snag.id ? { ...s, photoUrl: '', photoFileName: '' } : s
                                            ),
                                          }))
                                        }
                                        className="absolute top-1 right-1 p-0.5 bg-red-600 text-white rounded shadow cursor-pointer"
                                        title="Remove snag photo"
                                      >
                                        <X className="w-3 h-3" />
                                      </button>
                                    </div>
                                  )}
                                  <label className="inline-flex items-center gap-1 px-2 py-1 text-[11px] font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded cursor-pointer">
                                    <Camera className="w-3 h-3 text-emerald-700" />
                                    <span>{snag.photoUrl ? 'Replace Photo' : 'Upload Photo'}</span>
                                    <input
                                      type="file"
                                      accept="image/*"
                                      onChange={(e) => handleSnagPhotoUpload(currentFc.id, snag.id, e)}
                                      className="hidden"
                                    />
                                  </label>
                                </div>
                              </td>
                              <td className="p-2 text-center">
                                <button
                                  type="button"
                                  onClick={() =>
                                    updateFc(currentFc.id, (f) => ({
                                      ...f,
                                      snagItems: f.snagItems.filter((s) => s.id !== snag.id),
                                    }))
                                  }
                                  className="p-1 text-slate-400 hover:text-red-600 rounded cursor-pointer"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>

                {/* Completed Works / Handover Photo Gallery */}
                <div className="space-y-3 pt-3 border-t border-slate-200">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <h4 className="text-xs font-bold text-slate-900">
                        Finish Certificate — Completed Works Photo Gallery
                      </h4>
                      <p className="text-[11px] text-slate-500">
                        Upload photos of completed joinery installations. Automatically prints on Page 2+ with official A4 header &amp; footer.
                      </p>
                    </div>
                    <label className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg cursor-pointer">
                      <Upload className="w-3.5 h-3.5" />
                      <span>Upload Finished Photos</span>
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={(e) => handleFcCompletionPhotosUpload(currentFc.id, e)}
                        className="hidden"
                      />
                    </label>
                  </div>

                  {(currentFc.completionPhotos || []).length > 0 && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      {(currentFc.completionPhotos || []).map((photo) => (
                        <div
                          key={photo.id}
                          className="border border-slate-200 rounded-lg overflow-hidden bg-slate-50"
                        >
                          <div className="relative h-36 bg-slate-100">
                            <img
                              src={photo.photoUrl}
                              alt={photo.caption || 'Completed work'}
                              className="w-full h-full object-cover"
                              referrerPolicy="no-referrer"
                            />
                            <button
                              type="button"
                              onClick={() =>
                                updateFc(currentFc.id, (f) => ({
                                  ...f,
                                  completionPhotos: (f.completionPhotos || []).filter((p) => p.id !== photo.id),
                                }))
                              }
                              className="absolute top-2 right-2 p-1 bg-red-600 text-white rounded-md shadow cursor-pointer"
                              title="Delete photo"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                          <div className="p-2.5 space-y-1.5 bg-white">
                            <input
                              type="text"
                              value={photo.area || ''}
                              onChange={(e) =>
                                updateFc(currentFc.id, (f) => ({
                                  ...f,
                                  completionPhotos: (f.completionPhotos || []).map((p) =>
                                    p.id === photo.id ? { ...p, area: e.target.value } : p
                                  ),
                                }))
                              }
                              placeholder="Room / Area (e.g. Master Bedroom)"
                              className="w-full px-2 py-1 text-[11px] font-semibold bg-slate-50 border border-slate-200 rounded"
                            />
                            <input
                              type="text"
                              value={photo.caption}
                              onChange={(e) =>
                                updateFc(currentFc.id, (f) => ({
                                  ...f,
                                  completionPhotos: (f.completionPhotos || []).map((p) =>
                                    p.id === photo.id ? { ...p, caption: e.target.value } : p
                                  ),
                                }))
                              }
                              placeholder="Photo caption / joinery item"
                              className="w-full px-2 py-1 text-[11px] bg-slate-50 border border-slate-200 rounded"
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Method of Acceptance & Signatory */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 pt-3 border-t border-slate-200">
                  <div className="space-y-3">
                    <h4 className="text-xs font-bold text-slate-900">Method of Acceptance Recorded</h4>
                    <div className="space-y-2 text-xs">
                      {[
                        { value: 'signed_emailed', label: 'Signed printed certificate scanned and emailed' },
                        { value: 'email', label: 'Email confirmation received' },
                        { value: 'whatsapp', label: 'WhatsApp confirmation received' },
                        { value: 'none', label: 'Pending / leave blank for wet signature' },
                      ].map((opt) => (
                        <label key={opt.value} className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="radio"
                            name={`acc_${currentFc.id}`}
                            checked={currentFc.acceptanceMethod === opt.value}
                            onChange={() =>
                              updateFc(currentFc.id, (f) => ({
                                ...f,
                                acceptanceMethod: opt.value as FinishCertificateDocument['acceptanceMethod'],
                              }))
                            }
                          />
                          <span>{opt.label}</span>
                        </label>
                      ))}
                    </div>
                    {currentFc.acceptanceMethod !== 'none' && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[11px] font-semibold text-slate-600 mb-1">Date Received</label>
                          <input
                            type="date"
                            value={currentFc.acceptanceDate}
                            onChange={(e) =>
                              updateFc(currentFc.id, (f) => ({ ...f, acceptanceDate: e.target.value }))
                            }
                            className="w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                            Reference / Evidence Note
                          </label>
                          <input
                            type="text"
                            value={currentFc.acceptanceEvidence}
                            onChange={(e) =>
                              updateFc(currentFc.id, (f) => ({ ...f, acceptanceEvidence: e.target.value }))
                            }
                            placeholder="Email subject or WhatsApp ref"
                            className="w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg"
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="space-y-3">
                    <h4 className="text-xs font-bold text-slate-900">Contractor Representative</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-600 mb-1">Name</label>
                        <input
                          type="text"
                          value={currentFc.contractorName}
                          onChange={(e) =>
                            updateFc(currentFc.id, (f) => ({ ...f, contractorName: e.target.value }))
                          }
                          className="w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-600 mb-1">Position</label>
                        <input
                          type="text"
                          value={currentFc.contractorPosition}
                          onChange={(e) =>
                            updateFc(currentFc.id, (f) => ({ ...f, contractorPosition: e.target.value }))
                          }
                          className="w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-600 mb-1">Date</label>
                        <input
                          type="date"
                          value={currentFc.contractorDate}
                          onChange={(e) =>
                            updateFc(currentFc.id, (f) => ({ ...f, contractorDate: e.target.value }))
                          }
                          className="w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ============================================================ */}
        {/* TAB 5: PROJECT PROGRESSION REPORTS (AUTO + EDITABLE, INTERNAL) */}
        {/* ============================================================ */}
        {activeTab === 'progression' && (
          <div className="p-5 sm:p-6 space-y-5">
            {/* Report Switcher Strip */}
            <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-200">
              <div className="flex flex-wrap items-center gap-1.5">
                {progressionReports.map((rep) => {
                  const pct = calculateProgressionOverallPct(rep.rows);
                  return (
                    <button
                      key={rep.id}
                      type="button"
                      onClick={() => setSelectedProgressId(rep.id)}
                      className={`px-3 py-1.5 text-xs font-mono font-bold rounded-lg border transition-colors cursor-pointer ${
                        currentProgress?.id === rep.id
                          ? 'bg-cyan-700 text-white border-cyan-700'
                          : 'bg-white text-slate-700 border-slate-200 hover:bg-cyan-50'
                      }`}
                    >
                      {rep.reportNo} · {pct}%
                    </button>
                  );
                })}
                <button
                  type="button"
                  onClick={handleAddProgressReport}
                  className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-bold text-cyan-800 bg-cyan-50 hover:bg-cyan-100 border border-cyan-200 rounded-lg transition-colors cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  New Progress Report
                </button>
              </div>

              {currentProgress && (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleDeleteProgressReport(currentProgress.id)}
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-red-600 bg-red-50 hover:bg-red-100 rounded-lg cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Delete
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      onPrintDocument(activeSuite, { type: 'progression', doc: currentProgress })
                    }
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-white bg-cyan-700 hover:bg-cyan-800 rounded-lg cursor-pointer"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    Generate &amp; Print {currentProgress.reportNo}
                  </button>
                </div>
              )}
            </div>

            {!currentProgress ? (
              <div className="p-10 text-center border border-dashed border-cyan-200 bg-cyan-50/30 rounded-xl">
                <TrendingUp className="w-9 h-9 text-cyan-700 mx-auto mb-2" />
                <p className="text-sm font-bold text-slate-900">No Project Progression Report yet</p>
                <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
                  Auto-imports JY items from Sample Confirmations and tracks production start date, site installation start date, per-JY completion %, and progress photos.
                </p>
                <button
                  type="button"
                  onClick={handleAddProgressReport}
                  className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-cyan-700 hover:bg-cyan-800 rounded-lg cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  Create Progress Report PR-001
                </button>
              </div>
            ) : (
              (() => {
                const overallPct = calculateProgressionOverallPct(currentProgress.rows);
                return (
                  <div className="space-y-5">
                    {/* Auto-Calculated Overall Progress Banner */}
                    <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="space-y-1 flex-1">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-bold text-slate-900">
                            Overall Project Completion (Auto-calculated across {currentProgress.rows.length} JY items)
                          </span>
                          <span className="font-mono font-extrabold text-cyan-800 text-sm">
                            {overallPct}%
                          </span>
                        </div>
                        <div className="w-full h-2.5 bg-slate-200 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-cyan-600 transition-all duration-300"
                            style={{ width: `${overallPct}%` }}
                          />
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          const start =
                            activeTimeline.productionStartDate ||
                            currentProgress.productionStartDate ||
                            c.dateOfIssuance ||
                            new Date().toISOString().split('T')[0];
                          const maxDays =
                            (c.terms.completionMaxDays || c.terms.completionMinDays || 45) +
                            activeTimeline.approvedVoDays;
                          const target =
                            activeTimeline.effectiveTargetDate ||
                            addWorkingDays(start, maxDays, holidayDates);
                          updateProgress(currentProgress.id, (r) => ({
                            ...r,
                            productionStartDate: start,
                            siteInstallationStartDate: addWorkingDays(
                              start,
                              Math.max(10, Math.round(maxDays * 0.7)),
                              holidayDates
                            ),
                            targetCompletionDate: target,
                          }));
                        }}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg cursor-pointer shrink-0"
                        title="Recalculate Production Start, Site Start & Target Completion dates from Clause 6.1 triggers, VOs & UAE holidays"
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                        Auto-Calc Dates from Contract
                      </button>
                    </div>

                    {/* Report Metadata & Timeline Schedule */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">Report No.</label>
                        <input
                          type="text"
                          value={currentProgress.reportNo}
                          onChange={(e) =>
                            updateProgress(currentProgress.id, (r) => ({ ...r, reportNo: e.target.value }))
                          }
                          className="w-full px-3 py-2 text-xs font-mono font-bold bg-slate-50 border border-slate-200 rounded-lg"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">Report Date</label>
                        <input
                          type="date"
                          value={currentProgress.reportDate}
                          onChange={(e) =>
                            updateProgress(currentProgress.id, (r) => ({ ...r, reportDate: e.target.value }))
                          }
                          className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                          Reporting Period / Label
                        </label>
                        <input
                          type="text"
                          value={currentProgress.reportPeriod}
                          onChange={(e) =>
                            updateProgress(currentProgress.id, (r) => ({ ...r, reportPeriod: e.target.value }))
                          }
                          placeholder="e.g. Week 3 Update"
                          className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">Overall Status</label>
                        <select
                          value={currentProgress.overallStatus}
                          onChange={(e) =>
                            updateProgress(currentProgress.id, (r) => ({
                              ...r,
                              overallStatus: e.target.value as ProjectProgressionDocument['overallStatus'],
                            }))
                          }
                          className="w-full px-3 py-2 text-xs font-semibold bg-slate-50 border border-slate-200 rounded-lg"
                        >
                          <option value="Engineering & Drawings">Engineering &amp; Drawings</option>
                          <option value="In Production">In Production</option>
                          <option value="Ready for Dispatch">Ready for Dispatch</option>
                          <option value="Site Installation">Site Installation</option>
                          <option value="Finishing & Snagging">Finishing &amp; Snagging</option>
                          <option value="Completed">Completed</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                          Production Start Date
                        </label>
                        <input
                          type="date"
                          value={currentProgress.productionStartDate}
                          onChange={(e) =>
                            updateProgress(currentProgress.id, (r) => ({
                              ...r,
                              productionStartDate: e.target.value,
                            }))
                          }
                          className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                          Site Installation Start Date
                        </label>
                        <input
                          type="date"
                          value={currentProgress.siteInstallationStartDate}
                          onChange={(e) =>
                            updateProgress(currentProgress.id, (r) => ({
                              ...r,
                              siteInstallationStartDate: e.target.value,
                            }))
                          }
                          className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                          Target Completion Date
                        </label>
                        <input
                          type="date"
                          value={currentProgress.targetCompletionDate}
                          onChange={(e) =>
                            updateProgress(currentProgress.id, (r) => ({
                              ...r,
                              targetCompletionDate: e.target.value,
                            }))
                          }
                          className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                          Prepared By (Contractor)
                        </label>
                        <input
                          type="text"
                          value={currentProgress.preparedByName}
                          onChange={(e) =>
                            updateProgress(currentProgress.id, (r) => ({
                              ...r,
                              preparedByName: e.target.value,
                            }))
                          }
                          className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Executive Summary / Workshop &amp; Site Update Notes
                      </label>
                      <textarea
                        rows={2}
                        value={currentProgress.executiveSummary}
                        onChange={(e) =>
                          updateProgress(currentProgress.id, (r) => ({
                            ...r,
                            executiveSummary: e.target.value,
                          }))
                        }
                        placeholder="Summarize workshop fabrication status, pending site readiness, and next milestone..."
                        className="w-full p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:border-cyan-600"
                      />
                    </div>

                    {/* JY Progress Table */}
                    <div className="space-y-2.5">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div>
                          <h4 className="text-xs font-bold text-slate-900">
                            Joinery (JY) Progress Breakdown Table
                          </h4>
                          <p className="text-[11px] text-slate-500">
                            Selecting a stage auto-fills its percentage (fully editable). Upload progress photos per JY row.
                          </p>
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                          <button
                            type="button"
                            onClick={() =>
                              updateProgress(currentProgress.id, (r) => ({
                                ...r,
                                rows: extractJyRowsFromSamples(
                                  activeSuite.sampleConfirmations,
                                  r.rows,
                                  r.productionStartDate,
                                  r.targetCompletionDate
                                ),
                              }))
                            }
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-amber-900 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-lg cursor-pointer"
                          >
                            <RefreshCw className="w-3.5 h-3.5" />
                            Auto-Import JY from Samples
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              updateProgress(currentProgress.id, (r) => ({
                                ...r,
                                rows: [
                                  ...r.rows,
                                  createBlankProgressionRow(r.rows.length + 1, {
                                    startDate: r.productionStartDate,
                                    targetDate: r.targetCompletionDate,
                                  }),
                                ],
                              }))
                            }
                            className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-bold text-cyan-800 bg-cyan-50 hover:bg-cyan-100 border border-cyan-200 rounded-lg cursor-pointer"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            Add JY Row
                          </button>
                        </div>
                      </div>

                      <div className="overflow-x-auto border border-slate-200 rounded-lg">
                        <table className="w-full text-left border-collapse text-xs min-w-[980px]">
                          <thead>
                            <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                              <th className="py-2 px-2 w-24">JY Code</th>
                              <th className="py-2 px-2 w-32">Room / Area</th>
                              <th className="py-2 px-2 w-36">Component</th>
                              <th className="py-2 px-2 w-40">Current Stage</th>
                              <th className="py-2 px-2 w-28">Progress %</th>
                              <th className="py-2 px-2 w-36">Start / Target</th>
                              <th className="py-2 px-2 w-36">Progress Photo</th>
                              <th className="py-2 px-2">Remarks</th>
                              <th className="py-2 px-2 w-10"></th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {currentProgress.rows.map((row) => {
                              const updateRow = (patch: Partial<ProjectProgressionRow>) =>
                                updateProgress(currentProgress.id, (r) => ({
                                  ...r,
                                  rows: r.rows.map((item) =>
                                    item.id === row.id ? { ...item, ...patch } : item
                                  ),
                                }));

                              return (
                                <tr key={row.id} className="align-top">
                                  <td className="p-2">
                                    <input
                                      type="text"
                                      value={row.jyCode}
                                      onChange={(e) => updateRow({ jyCode: e.target.value })}
                                      placeholder="JY-01"
                                      className="w-full px-2 py-1.5 text-xs font-mono font-bold bg-white border border-slate-200 rounded"
                                    />
                                  </td>
                                  <td className="p-2">
                                    <input
                                      type="text"
                                      value={row.roomArea}
                                      onChange={(e) => updateRow({ roomArea: e.target.value })}
                                      placeholder="Master Bedroom"
                                      className="w-full px-2 py-1.5 text-xs bg-white border border-slate-200 rounded"
                                    />
                                  </td>
                                  <td className="p-2">
                                    <input
                                      type="text"
                                      value={row.component}
                                      onChange={(e) => updateRow({ component: e.target.value })}
                                      placeholder="Wardrobe / Wall Panel"
                                      className="w-full px-2 py-1.5 text-xs bg-white border border-slate-200 rounded"
                                    />
                                  </td>
                                  <td className="p-2">
                                    <select
                                      value={row.stage}
                                      onChange={(e) => {
                                        const nextStage = e.target.value as ProgressionStage;
                                        const preset = PROGRESSION_STAGE_PRESETS.find(
                                          (p) => p.stage === nextStage
                                        );
                                        updateRow({
                                          stage: nextStage,
                                          progressPct: preset ? preset.defaultPct : row.progressPct,
                                        });
                                      }}
                                      className="w-full px-2 py-1.5 text-xs font-semibold bg-white border border-slate-200 rounded"
                                    >
                                      {PROGRESSION_STAGE_PRESETS.map((opt) => (
                                        <option key={opt.stage} value={opt.stage}>
                                          {opt.stage}
                                        </option>
                                      ))}
                                    </select>
                                  </td>
                                  <td className="p-2">
                                    <div className="space-y-1">
                                      <div className="flex items-center gap-1">
                                        <CleanNumberInput
                                          value={row.progressPct}
                                          onChange={(val) =>
                                            updateRow({ progressPct: Math.min(100, Math.max(0, Math.round(val))) })
                                          }
                                          className="w-16 px-2 py-1 text-xs font-mono font-bold bg-white border border-slate-200 rounded"
                                        />
                                        <span className="text-slate-500 font-bold">%</span>
                                      </div>
                                      <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
                                        <div
                                          className="h-full bg-cyan-600"
                                          style={{ width: `${Math.min(100, Math.max(0, row.progressPct))}%` }}
                                        />
                                      </div>
                                    </div>
                                  </td>
                                  <td className="p-2 space-y-1">
                                    <input
                                      type="date"
                                      value={row.startDate}
                                      onChange={(e) => updateRow({ startDate: e.target.value })}
                                      title="Start Date"
                                      className="w-full px-1.5 py-1 text-[11px] bg-white border border-slate-200 rounded"
                                    />
                                    <input
                                      type="date"
                                      value={row.targetDate}
                                      onChange={(e) => updateRow({ targetDate: e.target.value })}
                                      title="Target Date"
                                      className="w-full px-1.5 py-1 text-[11px] bg-white border border-slate-200 rounded"
                                    />
                                  </td>
                                  <td className="p-2">
                                    <div className="space-y-1.5">
                                      {row.photoUrl && (
                                        <div className="relative w-24 h-16 rounded border border-slate-200 overflow-hidden bg-slate-50">
                                          <img
                                            src={row.photoUrl}
                                            alt={row.photoFileName || row.jyCode}
                                            className="w-full h-full object-cover"
                                            referrerPolicy="no-referrer"
                                          />
                                          <button
                                            type="button"
                                            onClick={() => updateRow({ photoUrl: '', photoFileName: '' })}
                                            className="absolute top-1 right-1 p-0.5 bg-red-600 text-white rounded shadow cursor-pointer"
                                          >
                                            <X className="w-3 h-3" />
                                          </button>
                                        </div>
                                      )}
                                      <label className="inline-flex items-center gap-1 px-2 py-1 text-[11px] font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded cursor-pointer">
                                        <Camera className="w-3 h-3 text-cyan-700" />
                                        <span>{row.photoUrl ? 'Change' : 'Upload Photo'}</span>
                                        <input
                                          type="file"
                                          accept="image/*"
                                          onChange={(e) =>
                                            handleProgressRowPhotoUpload(currentProgress.id, row.id, e)
                                          }
                                          className="hidden"
                                        />
                                      </label>
                                    </div>
                                  </td>
                                  <td className="p-2">
                                    <textarea
                                      rows={2}
                                      value={row.remarks}
                                      onChange={(e) => updateRow({ remarks: e.target.value })}
                                      placeholder="Workshop / site remarks"
                                      className="w-full px-2 py-1 text-xs bg-white border border-slate-200 rounded resize-none"
                                    />
                                  </td>
                                  <td className="p-2 text-center">
                                    <button
                                      type="button"
                                      onClick={() =>
                                        updateProgress(currentProgress.id, (r) => ({
                                          ...r,
                                          rows: r.rows.filter((item) => item.id !== row.id),
                                        }))
                                      }
                                      className="p-1 text-slate-400 hover:text-red-600 rounded cursor-pointer"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    {/* Additional Workshop & Site Photo Updates Gallery */}
                    <div className="space-y-3 pt-3 border-t border-slate-200">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div>
                          <h4 className="text-xs font-bold text-slate-900">
                            Additional Production &amp; Site Progress Photos
                          </h4>
                          <p className="text-[11px] text-slate-500">
                            Upload additional workshop or site installation photos to attach cleanly to the report.
                          </p>
                        </div>
                        <label className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-cyan-800 bg-cyan-50 hover:bg-cyan-100 border border-cyan-200 rounded-lg cursor-pointer">
                          <Upload className="w-3.5 h-3.5" />
                          <span>Upload Progress Photos</span>
                          <input
                            type="file"
                            accept="image/*"
                            multiple
                            onChange={(e) => handleProgressGalleryUpload(currentProgress.id, e)}
                            className="hidden"
                          />
                        </label>
                      </div>

                      {(currentProgress.progressPhotos || []).length > 0 && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                          {(currentProgress.progressPhotos || []).map((photo) => (
                            <div
                              key={photo.id}
                              className="border border-slate-200 rounded-lg overflow-hidden bg-slate-50"
                            >
                              <div className="relative h-36 bg-slate-100">
                                <img
                                  src={photo.photoUrl}
                                  alt={photo.caption || 'Progress'}
                                  className="w-full h-full object-cover"
                                  referrerPolicy="no-referrer"
                                />
                                <button
                                  type="button"
                                  onClick={() =>
                                    updateProgress(currentProgress.id, (r) => ({
                                      ...r,
                                      progressPhotos: (r.progressPhotos || []).filter(
                                        (p) => p.id !== photo.id
                                      ),
                                    }))
                                  }
                                  className="absolute top-2 right-2 p-1 bg-red-600 text-white rounded-md shadow cursor-pointer"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                              <div className="p-2.5 space-y-1.5 bg-white">
                                <input
                                  type="text"
                                  value={photo.area || ''}
                                  onChange={(e) =>
                                    updateProgress(currentProgress.id, (r) => ({
                                      ...r,
                                      progressPhotos: (r.progressPhotos || []).map((p) =>
                                        p.id === photo.id ? { ...p, area: e.target.value } : p
                                      ),
                                    }))
                                  }
                                  placeholder="Area / JY Code (e.g. Workshop — JY-02)"
                                  className="w-full px-2 py-1 text-[11px] font-semibold bg-slate-50 border border-slate-200 rounded"
                                />
                                <input
                                  type="text"
                                  value={photo.caption}
                                  onChange={(e) =>
                                    updateProgress(currentProgress.id, (r) => ({
                                      ...r,
                                      progressPhotos: (r.progressPhotos || []).map((p) =>
                                        p.id === photo.id ? { ...p, caption: e.target.value } : p
                                      ),
                                    }))
                                  }
                                  placeholder="Progress note / caption"
                                  className="w-full px-2 py-1 text-[11px] bg-slate-50 border border-slate-200 rounded"
                                />
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })()
            )}
          </div>
        )}
      </div>
      </div>

      {/* Manage / Merge Quotations Modal inside Active Contract Suite */}
      {showManageQuotesModal && (() => {
        const qSearch = manageQuoteSearch.toLowerCase().trim();
        const list = [...quotes].reverse().filter((item) => {
          if (!qSearch) return true;
          const cust = customers.find((cm) => cm.id === item.customerId);
          return (
            item.quoteNo.toLowerCase().includes(qSearch) ||
            (item.project || '').toLowerCase().includes(qSearch) ||
            (cust?.name || item.customerName || '').toLowerCase().includes(qSearch)
          );
        });
        const selectedList = selectedQuoteIdsForMerge
          .map((id) => quotes.find((q) => q.id === id))
          .filter((q): q is Quotation => Boolean(q));
        const combinedTotal =
          Math.round(selectedList.reduce((sum, q) => sum + (Number(q.total) || 0), 0) * 100) / 100;

        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
            <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden flex flex-col max-h-[85vh]">
              <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    Link &amp; Merge Quotations into {c.contractNo}
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Select one or more quotations to combine into Annex A and automatically sum their Contract Value
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowManageQuotesModal(false)}
                  className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-lg cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-5 space-y-4 overflow-y-auto flex-1">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={manageQuoteSearch}
                    onChange={(e) => setManageQuoteSearch(e.target.value)}
                    placeholder="Search quotations by number, client, or project..."
                    className="w-full pl-8 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
                  />
                </div>

                {list.length === 0 ? (
                  <div className="p-8 text-center border border-dashed border-slate-200 rounded-xl text-xs text-slate-500">
                    No saved quotations match your filter.
                  </div>
                ) : (
                  <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden max-h-72 overflow-y-auto">
                    {list.map((q) => {
                      const cust = customers.find((cm) => cm.id === q.customerId);
                      const isChecked = selectedQuoteIdsForMerge.includes(q.id);
                      const toggleItem = () => {
                        setSelectedQuoteIdsForMerge((prev) =>
                          prev.includes(q.id) ? prev.filter((id) => id !== q.id) : [...prev, q.id]
                        );
                      };
                      return (
                        <div
                          key={q.id}
                          onClick={toggleItem}
                          className={`p-3.5 flex items-center justify-between gap-3 cursor-pointer transition-colors ${
                            isChecked ? 'bg-indigo-50/70' : 'hover:bg-slate-50'
                          }`}
                        >
                          <div className="flex items-start gap-3 min-w-0">
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => {}}
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleItem();
                              }}
                              className="mt-1 w-4 h-4 rounded border-slate-300 text-indigo-600 cursor-pointer shrink-0"
                            />
                            <div className="min-w-0">
                              <div className="flex items-center gap-2 text-xs">
                                <span className="font-mono font-bold text-indigo-700">{q.quoteNo}</span>
                                <span className="text-slate-300">·</span>
                                <span className="font-bold text-slate-900 truncate">
                                  {cust?.name || q.customerName || 'Client'}
                                </span>
                              </div>
                              <div className="text-[11px] text-slate-500 truncate mt-0.5">
                                {q.project || 'Joinery Package'} · {q.date}
                              </div>
                            </div>
                          </div>
                          <div className="font-mono tabular-nums text-xs font-bold text-slate-900 shrink-0">
                            {formatMoney(q.total)} {q.currency}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="text-xs text-slate-700">
                  <div>
                    <strong>{selectedList.length}</strong> quotation{selectedList.length === 1 ? '' : 's'} selected
                    {selectedList.length > 0 && (
                      <>
                        {' · '}Combined Value:{' '}
                        <strong className="font-mono text-indigo-800">
                          {formatMoney(combinedTotal)} {currency}
                        </strong>
                      </>
                    )}
                  </div>
                  {selectedList.length > 0 && (
                    <div className="text-[11px] font-mono text-slate-500 truncate max-w-md mt-0.5">
                      Annex A: {selectedList.map((q) => q.quoteNo).join(', ')}
                    </div>
                  )}
                </div>
                <div className="flex flex-wrap items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => setShowManageQuotesModal(false)}
                    className="px-3 py-2 text-xs font-semibold text-slate-600 bg-white border border-slate-300 rounded-lg hover:bg-slate-100 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => handleApplyMergedQuotes(false)}
                    className="px-3.5 py-2 text-xs font-bold text-indigo-800 bg-indigo-100 hover:bg-indigo-200 rounded-lg cursor-pointer"
                  >
                    Update Contract Value Only
                  </button>
                  <button
                    type="button"
                    onClick={() => handleApplyMergedQuotes(true)}
                    className="px-4 py-2 text-xs font-bold text-white bg-indigo-700 hover:bg-indigo-800 rounded-lg cursor-pointer"
                  >
                    Merge &amp; Update Scopes
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
};
