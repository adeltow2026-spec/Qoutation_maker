import React, { useState } from 'react';
import {
  CompanySettings,
  DocumentStatus,
  ProjectDocumentSuite,
} from '../types';
import {
  calculateProgressionOverallPct,
  calculateVoTotals,
} from '../utils/documentSuite';
import { formatMoney } from '../utils/formatters';
import { PrintableSuiteTarget } from './DocumentSuitePrintModal';
import {
  ChevronDown,
  ChevronRight,
  ClipboardCheck,
  FilePlus2,
  FileSignature,
  FileSpreadsheet,
  Folder,
  FolderOpen,
  Plus,
  Printer,
  TrendingUp,
} from 'lucide-react';

export type SuiteTabKey = 'contract' | 'samples' | 'vos' | 'finish' | 'progression';

interface ProjectFolderTreeProps {
  suite: ProjectDocumentSuite;
  settings: CompanySettings;
  mode: 'sidebar' | 'directory';
  activeTab?: SuiteTabKey;
  selectedSampleId?: string | null;
  selectedVoId?: string | null;
  selectedFcId?: string | null;
  selectedProgressId?: string | null;
  onSelectDocument: (tab: SuiteTabKey, docId?: string) => void;
  onPrintDocument: (suite: ProjectDocumentSuite, target: PrintableSuiteTarget) => void;
  onAddDocument?: (tab: Exclude<SuiteTabKey, 'contract'>) => void;
}

const getStatusStyle = (status?: DocumentStatus | 'Pending' | 'Approved' | string) => {
  switch (status) {
    case 'Signed':
    case 'Approved':
    case 'Completed':
      return { dot: 'bg-emerald-500', text: 'text-emerald-700', label: status };
    case 'Sent':
    case 'Pending':
    case 'Site Installation':
    case 'Finishing & Snagging':
      return { dot: 'bg-amber-500', text: 'text-amber-700', label: status };
    default:
      return { dot: 'bg-slate-400', text: 'text-slate-500', label: status || 'Draft' };
  }
};

export const ProjectFolderTree: React.FC<ProjectFolderTreeProps> = ({
  suite,
  settings,
  mode,
  activeTab,
  selectedSampleId,
  selectedVoId,
  selectedFcId,
  selectedProgressId,
  onSelectDocument,
  onPrintDocument,
  onAddDocument,
}) => {
  const [openFolders, setOpenFolders] = useState<Record<SuiteTabKey, boolean>>({
    contract: true,
    samples: true,
    vos: true,
    finish: true,
    progression: true,
  });

  const toggleFolder = (key: SuiteTabKey) => {
    setOpenFolders((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const currency = suite.contract.currency || settings.currency || 'AED';
  const progressList = suite.progressionReports || [];
  const totalSavedFiles =
    1 +
    suite.sampleConfirmations.length +
    suite.variationOrders.length +
    suite.finishCertificates.length +
    progressList.length;

  const contractStatus = getStatusStyle(suite.contract.status || 'Draft');

  const renderFolderHeader = (
    key: SuiteTabKey,
    folderNum: string,
    title: string,
    count: number,
    accentClass: string,
    canAdd?: boolean
  ) => {
    const isOpen = openFolders[key];
    return (
      <div className="flex items-center justify-between gap-1 group">
        <button
          type="button"
          onClick={() => toggleFolder(key)}
          className="flex-1 flex items-center gap-1.5 py-1.5 px-1.5 rounded-md hover:bg-slate-100 text-left cursor-pointer min-w-0"
        >
          {isOpen ? (
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          ) : (
            <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          )}
          {isOpen ? (
            <FolderOpen className={`w-3.5 h-3.5 shrink-0 ${accentClass}`} />
          ) : (
            <Folder className={`w-3.5 h-3.5 shrink-0 ${accentClass}`} />
          )}
          <span className="text-[11px] font-bold text-slate-800 truncate">
            {folderNum}. {title}
          </span>
          <span className="text-[10px] font-mono text-slate-400 ml-auto shrink-0">
            ({count})
          </span>
        </button>
        {canAdd && onAddDocument && key !== 'contract' && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onAddDocument(key);
            }}
            title={`New ${title}`}
            className="p-1 text-slate-400 hover:text-blue-700 hover:bg-blue-50 rounded cursor-pointer shrink-0"
          >
            <Plus className="w-3 h-3" />
          </button>
        )}
      </div>
    );
  };

  if (mode === 'directory') {
    return (
      <div className="bg-slate-50/90 border-t border-slate-200 px-5 py-4">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
            <FolderOpen className="w-4 h-4 text-amber-700" />
            <span>
              Project Filing Tree — <span className="font-mono text-blue-800">{suite.contract.contractNo}</span>
            </span>
            <span className="text-[11px] font-normal text-slate-500">
              ({totalSavedFiles} saved document{totalSavedFiles === 1 ? '' : 's'})
            </span>
          </div>
          <div className="text-[11px] text-slate-500">
            Click any document to open editor, or use the print icon for instant A4 PDF export
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
          {/* 01. Main Contract */}
          <div className="bg-white border border-slate-200 rounded-lg p-2.5 space-y-2">
            <div className="flex items-center gap-1.5 text-[11px] font-bold text-indigo-800 border-b border-slate-100 pb-1.5">
              <FileSignature className="w-3.5 h-3.5 shrink-0" />
              <span>01. Main Contract</span>
            </div>
            <div className="flex items-center justify-between gap-1.5 p-1.5 rounded bg-slate-50 hover:bg-indigo-50/60 transition-colors">
              <button
                type="button"
                onClick={() => onSelectDocument('contract')}
                className="text-left min-w-0 flex-1 cursor-pointer"
              >
                <div className="font-mono text-[11px] font-bold text-slate-900 truncate">
                  {suite.contract.contractNo}
                </div>
                <div className="flex items-center gap-1 text-[10px] text-slate-500">
                  <span className={`w-1.5 h-1.5 rounded-full ${contractStatus.dot}`} />
                  <span className={contractStatus.text}>{contractStatus.label}</span>
                  <span>·</span>
                  <span>{suite.contract.dateOfIssuance || '—'}</span>
                </div>
              </button>
              <button
                type="button"
                onClick={() => onPrintDocument(suite, { type: 'contract' })}
                title="Preview & Print Contract PDF"
                className="p-1 text-slate-500 hover:text-indigo-700 hover:bg-white rounded cursor-pointer shrink-0"
              >
                <Printer className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* 02. Sample Confirmations */}
          <div className="bg-white border border-slate-200 rounded-lg p-2.5 space-y-2">
            <div className="flex items-center justify-between text-[11px] font-bold text-amber-800 border-b border-slate-100 pb-1.5">
              <span className="flex items-center gap-1.5">
                <FileSpreadsheet className="w-3.5 h-3.5 shrink-0" />
                <span>02. Samples ({suite.sampleConfirmations.length})</span>
              </span>
            </div>
            {suite.sampleConfirmations.length === 0 ? (
              <div className="text-[11px] text-slate-400 italic py-1">No sample sheets</div>
            ) : (
              <div className="space-y-1 max-h-36 overflow-y-auto">
                {suite.sampleConfirmations.map((sc) => {
                  const st = getStatusStyle(sc.status || 'Draft');
                  return (
                    <div
                      key={sc.id}
                      className="flex items-center justify-between gap-1 p-1.5 rounded bg-slate-50 hover:bg-amber-50/70 transition-colors"
                    >
                      <button
                        type="button"
                        onClick={() => onSelectDocument('samples', sc.id)}
                        className="text-left min-w-0 flex-1 cursor-pointer"
                      >
                        <div className="font-mono text-[11px] font-bold text-slate-900 truncate">
                          {sc.sampleId} ({sc.rows.length} items)
                        </div>
                        <div className="flex items-center gap-1 text-[10px] text-slate-500">
                          <span className={`w-1.5 h-1.5 rounded-full ${st.dot}`} />
                          <span className={st.text}>{st.label}</span>
                          <span>·</span>
                          <span>{sc.dateIssued || '—'}</span>
                        </div>
                      </button>
                      <button
                        type="button"
                        onClick={() => onPrintDocument(suite, { type: 'sample', doc: sc })}
                        title={`Print ${sc.sampleId}`}
                        className="p-1 text-slate-500 hover:text-amber-800 hover:bg-white rounded cursor-pointer shrink-0"
                      >
                        <Printer className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* 03. Variation Orders */}
          <div className="bg-white border border-slate-200 rounded-lg p-2.5 space-y-2">
            <div className="flex items-center gap-1.5 text-[11px] font-bold text-rose-700 border-b border-slate-100 pb-1.5">
              <FilePlus2 className="w-3.5 h-3.5 shrink-0" />
              <span>03. Variation Orders ({suite.variationOrders.length})</span>
            </div>
            {suite.variationOrders.length === 0 ? (
              <div className="text-[11px] text-slate-400 italic py-1">No variation orders</div>
            ) : (
              <div className="space-y-1 max-h-36 overflow-y-auto">
                {suite.variationOrders.map((vo) => {
                  const st = getStatusStyle(vo.status);
                  const voTot = calculateVoTotals(vo).totalInclVat;
                  return (
                    <div
                      key={vo.id}
                      className="flex items-center justify-between gap-1 p-1.5 rounded bg-slate-50 hover:bg-rose-50/70 transition-colors"
                    >
                      <button
                        type="button"
                        onClick={() => onSelectDocument('vos', vo.id)}
                        className="text-left min-w-0 flex-1 cursor-pointer"
                      >
                        <div className="font-mono text-[11px] font-bold text-slate-900 truncate">
                          {vo.voNo} · {formatMoney(voTot)} {currency}
                        </div>
                        <div className="flex items-center gap-1 text-[10px] text-slate-500">
                          <span className={`w-1.5 h-1.5 rounded-full ${st.dot}`} />
                          <span className={st.text}>{st.label}</span>
                          <span>·</span>
                          <span>{vo.dateIssued || '—'}</span>
                        </div>
                      </button>
                      <button
                        type="button"
                        onClick={() => onPrintDocument(suite, { type: 'vo', doc: vo })}
                        title={`Print ${vo.voNo}`}
                        className="p-1 text-slate-500 hover:text-rose-700 hover:bg-white rounded cursor-pointer shrink-0"
                      >
                        <Printer className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* 04. Finish Certificates */}
          <div className="bg-white border border-slate-200 rounded-lg p-2.5 space-y-2">
            <div className="flex items-center gap-1.5 text-[11px] font-bold text-emerald-700 border-b border-slate-100 pb-1.5">
              <ClipboardCheck className="w-3.5 h-3.5 shrink-0" />
              <span>04. Finish Certs ({suite.finishCertificates.length})</span>
            </div>
            {suite.finishCertificates.length === 0 ? (
              <div className="text-[11px] text-slate-400 italic py-1">No finish certificates</div>
            ) : (
              <div className="space-y-1 max-h-36 overflow-y-auto">
                {suite.finishCertificates.map((fc) => {
                  const st = getStatusStyle(fc.status || 'Draft');
                  return (
                    <div
                      key={fc.id}
                      className="flex items-center justify-between gap-1 p-1.5 rounded bg-slate-50 hover:bg-emerald-50/70 transition-colors"
                    >
                      <button
                        type="button"
                        onClick={() => onSelectDocument('finish', fc.id)}
                        className="text-left min-w-0 flex-1 cursor-pointer"
                      >
                        <div className="font-mono text-[11px] font-bold text-slate-900 truncate">
                          {fc.fcNo} ({fc.snagItems.length} snag{fc.snagItems.length === 1 ? '' : 's'})
                        </div>
                        <div className="flex items-center gap-1 text-[10px] text-slate-500">
                          <span className={`w-1.5 h-1.5 rounded-full ${st.dot}`} />
                          <span className={st.text}>{st.label}</span>
                          <span>·</span>
                          <span>{fc.installationCompletionDate || '—'}</span>
                        </div>
                      </button>
                      <button
                        type="button"
                        onClick={() => onPrintDocument(suite, { type: 'finish', doc: fc })}
                        title={`Print ${fc.fcNo}`}
                        className="p-1 text-slate-500 hover:text-emerald-700 hover:bg-white rounded cursor-pointer shrink-0"
                      >
                        <Printer className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* 05. Project Progression */}
          <div className="bg-white border border-slate-200 rounded-lg p-2.5 space-y-2">
            <div className="flex items-center gap-1.5 text-[11px] font-bold text-cyan-800 border-b border-slate-100 pb-1.5">
              <TrendingUp className="w-3.5 h-3.5 shrink-0" />
              <span>05. Progression ({progressList.length})</span>
            </div>
            {progressList.length === 0 ? (
              <div className="text-[11px] text-slate-400 italic py-1">No progress reports</div>
            ) : (
              <div className="space-y-1 max-h-36 overflow-y-auto">
                {progressList.map((pr) => {
                  const pct = calculateProgressionOverallPct(pr.rows);
                  const st = getStatusStyle(pr.overallStatus);
                  return (
                    <div
                      key={pr.id}
                      className="flex items-center justify-between gap-1 p-1.5 rounded bg-slate-50 hover:bg-cyan-50/70 transition-colors"
                    >
                      <button
                        type="button"
                        onClick={() => onSelectDocument('progression', pr.id)}
                        className="text-left min-w-0 flex-1 cursor-pointer"
                      >
                        <div className="font-mono text-[11px] font-bold text-slate-900 truncate">
                          {pr.reportNo} · {pct}%
                        </div>
                        <div className="flex items-center gap-1 text-[10px] text-slate-500 truncate">
                          <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${st.dot}`} />
                          <span className="truncate">{pr.reportDate || '—'}</span>
                        </div>
                      </button>
                      <button
                        type="button"
                        onClick={() => onPrintDocument(suite, { type: 'progression', doc: pr })}
                        title={`Print ${pr.reportNo}`}
                        className="p-1 text-slate-500 hover:text-cyan-800 hover:bg-white rounded cursor-pointer shrink-0"
                      >
                        <Printer className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // SIDEBAR MODE (Active Suite Left Tree Panel)
  return (
    <aside className="bg-white rounded-xl border border-slate-200 p-3 space-y-2 h-fit lg:sticky lg:top-4">
      <div className="pb-2 border-b border-slate-100">
        <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900">
          <FolderOpen className="w-4 h-4 text-amber-700 shrink-0" />
          <span className="truncate">Project File Tree</span>
        </div>
        <div className="text-[10.5px] font-mono text-slate-500 mt-0.5 truncate">
          {suite.contract.contractNo} · {totalSavedFiles} file{totalSavedFiles === 1 ? '' : 's'}
        </div>
      </div>

      {/* 01. Main Contract */}
      <div>
        {renderFolderHeader('contract', '01', 'Main Contract', 1, 'text-indigo-700', false)}
        {openFolders.contract && (
          <div className="ml-4 pl-2 border-l border-slate-200 mt-0.5 space-y-0.5">
            <div
              className={`flex items-center justify-between gap-1 px-2 py-1.5 rounded-md transition-colors ${
                activeTab === 'contract'
                  ? 'bg-indigo-50 text-indigo-950 font-semibold'
                  : 'hover:bg-slate-50 text-slate-700'
              }`}
            >
              <button
                type="button"
                onClick={() => onSelectDocument('contract')}
                className="flex-1 text-left min-w-0 cursor-pointer"
              >
                <div className="font-mono text-[11px] font-bold truncate">
                  {suite.contract.contractNo}
                </div>
                <div className="flex items-center gap-1 text-[10px]">
                  <span className={`w-1.5 h-1.5 rounded-full ${contractStatus.dot}`} />
                  <span className={contractStatus.text}>{contractStatus.label}</span>
                </div>
              </button>
              <button
                type="button"
                onClick={() => onPrintDocument(suite, { type: 'contract' })}
                title="Print Main Contract PDF"
                className="p-1 text-slate-400 hover:text-indigo-700 rounded cursor-pointer shrink-0"
              >
                <Printer className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 02. Sample Confirmations */}
      <div>
        {renderFolderHeader(
          'samples',
          '02',
          'Sample Confirmations',
          suite.sampleConfirmations.length,
          'text-amber-600',
          true
        )}
        {openFolders.samples && (
          <div className="ml-4 pl-2 border-l border-slate-200 mt-0.5 space-y-0.5">
            {suite.sampleConfirmations.length === 0 ? (
              <div className="px-2 py-1 text-[10.5px] text-slate-400 italic">Empty folder</div>
            ) : (
              suite.sampleConfirmations.map((sc) => {
                const isSelected = activeTab === 'samples' && selectedSampleId === sc.id;
                const st = getStatusStyle(sc.status || 'Draft');
                return (
                  <div
                    key={sc.id}
                    className={`flex items-center justify-between gap-1 px-2 py-1.5 rounded-md transition-colors ${
                      isSelected
                        ? 'bg-amber-50 text-amber-950 font-semibold'
                        : 'hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => onSelectDocument('samples', sc.id)}
                      className="flex-1 text-left min-w-0 cursor-pointer"
                    >
                      <div className="font-mono text-[11px] font-bold truncate">
                        {sc.sampleId}{' '}
                        <span className="font-sans font-normal text-slate-400">
                          ({sc.rows.length})
                        </span>
                      </div>
                      <div className="flex items-center gap-1 text-[10px]">
                        <span className={`w-1.5 h-1.5 rounded-full ${st.dot}`} />
                        <span className={st.text}>{st.label}</span>
                        <span className="text-slate-300">·</span>
                        <span className="text-slate-400 truncate">{sc.dateIssued || '—'}</span>
                      </div>
                    </button>
                    <button
                      type="button"
                      onClick={() => onPrintDocument(suite, { type: 'sample', doc: sc })}
                      title={`Print ${sc.sampleId}`}
                      className="p-1 text-slate-400 hover:text-amber-700 rounded cursor-pointer shrink-0"
                    >
                      <Printer className="w-3.5 h-3.5" />
                    </button>
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>

      {/* 03. Variation Orders */}
      <div>
        {renderFolderHeader(
          'vos',
          '03',
          'Variation Orders',
          suite.variationOrders.length,
          'text-rose-600',
          true
        )}
        {openFolders.vos && (
          <div className="ml-4 pl-2 border-l border-slate-200 mt-0.5 space-y-0.5">
            {suite.variationOrders.length === 0 ? (
              <div className="px-2 py-1 text-[10.5px] text-slate-400 italic">Empty folder</div>
            ) : (
              suite.variationOrders.map((vo) => {
                const isSelected = activeTab === 'vos' && selectedVoId === vo.id;
                const st = getStatusStyle(vo.status);
                const voTot = calculateVoTotals(vo).totalInclVat;
                return (
                  <div
                    key={vo.id}
                    className={`flex items-center justify-between gap-1 px-2 py-1.5 rounded-md transition-colors ${
                      isSelected
                        ? 'bg-rose-50 text-rose-950 font-semibold'
                        : 'hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => onSelectDocument('vos', vo.id)}
                      className="flex-1 text-left min-w-0 cursor-pointer"
                    >
                      <div className="font-mono text-[11px] font-bold truncate">{vo.voNo}</div>
                      <div className="flex items-center gap-1 text-[10px]">
                        <span className={`w-1.5 h-1.5 rounded-full ${st.dot}`} />
                        <span className={st.text}>{st.label}</span>
                        <span className="text-slate-300">·</span>
                        <span className="font-mono text-slate-500 truncate">
                          {formatMoney(voTot)}
                        </span>
                      </div>
                    </button>
                    <button
                      type="button"
                      onClick={() => onPrintDocument(suite, { type: 'vo', doc: vo })}
                      title={`Print ${vo.voNo}`}
                      className="p-1 text-slate-400 hover:text-rose-700 rounded cursor-pointer shrink-0"
                    >
                      <Printer className="w-3.5 h-3.5" />
                    </button>
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>

      {/* 04. Finish Certificates */}
      <div>
        {renderFolderHeader(
          'finish',
          '04',
          'Finish Certificates',
          suite.finishCertificates.length,
          'text-emerald-600',
          true
        )}
        {openFolders.finish && (
          <div className="ml-4 pl-2 border-l border-slate-200 mt-0.5 space-y-0.5">
            {suite.finishCertificates.length === 0 ? (
              <div className="px-2 py-1 text-[10.5px] text-slate-400 italic">Empty folder</div>
            ) : (
              suite.finishCertificates.map((fc) => {
                const isSelected = activeTab === 'finish' && selectedFcId === fc.id;
                const st = getStatusStyle(fc.status || 'Draft');
                return (
                  <div
                    key={fc.id}
                    className={`flex items-center justify-between gap-1 px-2 py-1.5 rounded-md transition-colors ${
                      isSelected
                        ? 'bg-emerald-50 text-emerald-950 font-semibold'
                        : 'hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => onSelectDocument('finish', fc.id)}
                      className="flex-1 text-left min-w-0 cursor-pointer"
                    >
                      <div className="font-mono text-[11px] font-bold truncate">{fc.fcNo}</div>
                      <div className="flex items-center gap-1 text-[10px]">
                        <span className={`w-1.5 h-1.5 rounded-full ${st.dot}`} />
                        <span className={st.text}>{st.label}</span>
                        <span className="text-slate-300">·</span>
                        <span className="text-slate-400">
                          {fc.snagItems.length} snag{fc.snagItems.length === 1 ? '' : 's'}
                        </span>
                      </div>
                    </button>
                    <button
                      type="button"
                      onClick={() => onPrintDocument(suite, { type: 'finish', doc: fc })}
                      title={`Print ${fc.fcNo}`}
                      className="p-1 text-slate-400 hover:text-emerald-700 rounded cursor-pointer shrink-0"
                    >
                      <Printer className="w-3.5 h-3.5" />
                    </button>
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>

      {/* 05. Project Progression */}
      <div>
        {renderFolderHeader(
          'progression',
          '05',
          'Project Progression',
          progressList.length,
          'text-cyan-700',
          true
        )}
        {openFolders.progression && (
          <div className="ml-4 pl-2 border-l border-slate-200 mt-0.5 space-y-0.5">
            {progressList.length === 0 ? (
              <div className="px-2 py-1 text-[10.5px] text-slate-400 italic">Empty folder</div>
            ) : (
              progressList.map((pr) => {
                const isSelected = activeTab === 'progression' && selectedProgressId === pr.id;
                const pct = calculateProgressionOverallPct(pr.rows);
                return (
                  <div
                    key={pr.id}
                    className={`flex items-center justify-between gap-1 px-2 py-1.5 rounded-md transition-colors ${
                      isSelected
                        ? 'bg-cyan-50 text-cyan-950 font-semibold'
                        : 'hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => onSelectDocument('progression', pr.id)}
                      className="flex-1 text-left min-w-0 cursor-pointer"
                    >
                      <div className="font-mono text-[11px] font-bold truncate">
                        {pr.reportNo} · {pct}%
                      </div>
                      <div className="text-[10px] text-slate-500 truncate">
                        {pr.reportDate || '—'} · {pr.overallStatus}
                      </div>
                    </button>
                    <button
                      type="button"
                      onClick={() => onPrintDocument(suite, { type: 'progression', doc: pr })}
                      title={`Print ${pr.reportNo}`}
                      className="p-1 text-slate-400 hover:text-cyan-700 rounded cursor-pointer shrink-0"
                    >
                      <Printer className="w-3.5 h-3.5" />
                    </button>
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>
    </aside>
  );
};
