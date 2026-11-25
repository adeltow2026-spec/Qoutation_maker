import React, { useMemo, useState } from 'react';
import { CompanySettings, ProjectDocumentSuite, UserProfile } from '../types';
import {
  MANAGEMENT_ADMIN_EMAIL,
  ProjectTimelineStatus,
  calculateProjectTimeline,
  canEditLockedContractTerms,
  resolveHolidayDates,
} from '../utils/documentSuite';
import {
  AlertTriangle,
  CalendarClock,
  CheckCircle2,
  Clock,
  Download,
  ExternalLink,
  Eye,
  EyeOff,
  Loader2,
  Lock,
  Printer,
  Search,
  ShieldCheck,
  Unlock,
  X,
} from 'lucide-react';
import html2pdf from 'html2pdf.js';

interface PrivateTimelineTabProps {
  suites: ProjectDocumentSuite[];
  settings: CompanySettings;
  currentUser: UserProfile;
  isUnlocked: boolean;
  onUnlock: () => void;
  onLock: () => void;
  onOpenSuite: (suiteId: string) => void;
  onUpdateSuiteDates: (
    suiteId: string,
    patch: {
      stage1ClearedDate?: string;
      shopDrawingApprovedDate?: string;
      manualTargetCompletionDate?: string;
    }
  ) => void;
}

const formatShortDate = (iso?: string): string => {
  if (!iso) return '—';
  const d = new Date(`${iso}T00:00:00`);
  if (isNaN(d.getTime())) return iso;
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
};

export const PrivateTimelineTab: React.FC<PrivateTimelineTabProps> = ({
  suites,
  settings,
  currentUser,
  isUnlocked,
  onUnlock,
  onLock,
  onOpenSuite,
  onUpdateSuiteDates,
}) => {
  const isAuthorizedEmail = canEditLockedContractTerms(currentUser);
  const [passwordInput, setPasswordInput] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  const [statusFilter, setStatusFilter] = useState<'ALL' | ProjectTimelineStatus>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);
  const [printFeedback, setPrintFeedback] = useState<string | null>(null);

  // Hard security guard: strictly invisible & inaccessible for any email other than adel.tow.2026@gmail.com
  if (!isAuthorizedEmail) {
    return null;
  }

  const expectedPassword = currentUser.password || 'Adel@2026';

  const handleVerifyPassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordInput === expectedPassword) {
      setAuthError(null);
      setPasswordInput('');
      onUnlock();
    } else {
      setAuthError('Incorrect account password. Please enter your management account password.');
    }
  };

  const holidayDates = useMemo(() => resolveHolidayDates(settings), [settings]);

  const rows = useMemo(() => {
    return suites.map((suite) => ({
      suite,
      timeline: calculateProjectTimeline(suite, holidayDates),
    }));
  }, [suites, holidayDates]);

  const stats = useMemo(() => {
    return {
      total: rows.length,
      inProgress: rows.filter((r) => r.timeline.status === 'In Progress').length,
      dueSoon: rows.filter((r) => r.timeline.status === 'Due Soon').length,
      overdue: rows.filter((r) => r.timeline.status === 'Overdue').length,
      pending: rows.filter((r) => r.timeline.status === 'Pending Triggers').length,
      completed: rows.filter((r) => r.timeline.status === 'Completed').length,
    };
  }, [rows]);

  const filteredRows = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return rows.filter(({ suite, timeline }) => {
      if (statusFilter !== 'ALL' && timeline.status !== statusFilter) return false;
      if (!q) return true;
      return (
        (suite.contract.contractNo || '').toLowerCase().includes(q) ||
        (suite.contract.projectCode || '').toLowerCase().includes(q) ||
        (suite.projectTitle || '').toLowerCase().includes(q) ||
        (suite.contract.clientName || '').toLowerCase().includes(q) ||
        (suite.contract.quotationRef || '').toLowerCase().includes(q)
      );
    });
  }, [rows, statusFilter, searchQuery]);

  const handleExportCsv = () => {
    const headers = [
      'Contract No.',
      'Project Code',
      'Project Title',
      'Client Name',
      'Quotation Ref(s)',
      'Contract Signed',
      'Stage 1 Cleared',
      'Shop Drawings Approved',
      'Sample Confirmed',
      'Production Start (Clause 6.1)',
      'Start Trigger Source',
      'Min Working Days',
      'Max Working Days',
      'Approved VO Days',
      'Pending VO Days',
      'Earliest Completion',
      'Revised Contractual Deadline',
      'Manual Override Date',
      'Effective Target Date',
      'Actual Completion (FC)',
      'Progress %',
      'Working Days Remaining',
      'Status',
    ];

    const escapeCsv = (val: string | number | null | undefined) => {
      const s = val === null || val === undefined ? '' : String(val);
      return `"${s.replace(/"/g, '""')}"`;
    };

    const csvLines = [
      headers.map(escapeCsv).join(','),
      ...filteredRows.map(({ suite, timeline }) =>
        [
          suite.contract.contractNo,
          suite.contract.projectCode,
          suite.projectTitle,
          suite.contract.clientName,
          suite.contract.quotationRef,
          timeline.contractSignedDate,
          timeline.stage1ClearedDate,
          timeline.shopDrawingApprovedDate,
          timeline.sampleConfirmedDate,
          timeline.productionStartDate,
          timeline.productionStartSource,
          timeline.minWorkingDays,
          timeline.maxWorkingDays,
          timeline.approvedVoDays,
          timeline.pendingVoDays,
          timeline.revisedMinCompletionDate || timeline.autoMinCompletionDate,
          timeline.revisedMaxCompletionDate || timeline.autoMaxCompletionDate,
          timeline.manualOverrideDate,
          timeline.effectiveTargetDate,
          timeline.actualCompletionDate,
          `${timeline.latestProgressPct}%`,
          timeline.workingDaysRemaining !== null ? timeline.workingDaysRemaining : '',
          timeline.status,
        ]
          .map(escapeCsv)
          .join(',')
      ),
    ];

    const blob = new Blob([csvLines.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `docusuit-v2-management-timeline-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      URL.revokeObjectURL(url);
      if (a.parentNode) a.parentNode.removeChild(a);
    }, 1000);
  };

  const handleDownloadTimelinePdf = async () => {
    const targetEl = document.getElementById('private-timeline-print-area');
    if (!targetEl) return;
    setIsDownloadingPdf(true);
    setPrintFeedback(null);
    const filename = `docusuit-v2-management-timeline-${new Date().toISOString().split('T')[0]}.pdf`;
    try {
      const opt = {
        margin: [8, 8, 8, 8] as [number, number, number, number],
        filename,
        image: { type: 'jpeg' as const, quality: 0.96 },
        html2canvas: { scale: 2, useCORS: true, letterRendering: true, logging: false },
        jsPDF: { unit: 'mm' as const, format: 'a4', orientation: 'landscape' as const },
      };
      await html2pdf().set(opt).from(targetEl).save();
      setPrintFeedback(`${filename} downloaded successfully.`);
    } catch (err) {
      console.error('Timeline PDF export error:', err);
      setPrintFeedback('PDF export failed — try Print or Export CSV instead.');
    } finally {
      setIsDownloadingPdf(false);
    }
  };

  const handlePrintFromModal = () => {
    const targetEl = document.getElementById('private-timeline-print-area');
    if (!targetEl) return;
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8" />
          <title>Management Timeline Control — DocuSuit V2</title>
          <style>
            @page { size: A4 landscape; margin: 10mm; }
            body { font-family: 'Candara', 'Calibri', 'Segoe UI', Arial, sans-serif; color: #111; margin: 0; background: #fff; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
            table { width: 100%; border-collapse: collapse; }
            th, td { border: 1px solid #d6cfc7; padding: 5px 6px; font-size: 8.5pt; text-align: left; vertical-align: top; }
            th { background: #3e2723 !important; color: #fff !important; font-weight: 700; }
            tr:nth-child(even) td { background: #faf8f5 !important; }
          </style>
        </head>
        <body>
          ${targetEl.innerHTML}
          <script>setTimeout(function(){ window.focus(); window.print(); }, 350);</script>
        </body>
      </html>
    `;
    try {
      const win = window.open('', '_blank');
      if (win) {
        win.document.open();
        win.document.write(html);
        win.document.close();
        return;
      }
    } catch {
      // Fall through to native print
    }
    try {
      window.print();
    } catch {
      setPrintFeedback('Browser blocked print pop-up. Click "Download PDF" to save and print directly.');
    }
  };

  // PASSWORD LOCK GATE
  if (!isUnlocked) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-8 sm:p-12 flex items-center justify-center">
        <div className="w-full max-w-md space-y-5">
          <div className="text-center space-y-2">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-slate-900 text-amber-300 flex items-center justify-center shadow-md border border-slate-700">
              <Lock className="w-7 h-7" />
            </div>
            <h2 className="text-lg font-extrabold text-slate-900">
              Management Timeline Control
            </h2>
            <p className="text-xs text-slate-500 leading-relaxed">
              This private executive timeline extract is restricted exclusively to{' '}
              <span className="font-mono font-bold text-slate-800">{MANAGEMENT_ADMIN_EMAIL}</span>.
              Enter your account password to unlock the full cross-project schedule table.
            </p>
          </div>

          <form onSubmit={handleVerifyPassword} className="space-y-4">
            {authError && (
              <div className="flex items-start gap-2 p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{authError}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Management Account Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  autoFocus
                  value={passwordInput}
                  onChange={(e) => {
                    setPasswordInput(e.target.value);
                    if (authError) setAuthError(null);
                  }}
                  placeholder="Enter your account password..."
                  className="w-full pl-9 pr-10 py-2.5 text-xs font-medium text-slate-900 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-900/15 focus:border-slate-900"
                />
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="p-1 text-slate-400 hover:text-slate-700 absolute right-2.5 top-2 cursor-pointer"
                  title={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={!passwordInput.trim()}
              className="w-full py-2.5 px-4 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl shadow-sm flex items-center justify-center gap-2 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Unlock className="w-4 h-4 text-amber-300" />
              <span>Unlock Private Timeline Table</span>
            </button>
          </form>
        </div>
      </div>
    );
  }

  const getStatusBadge = (status: ProjectTimelineStatus, daysRemaining: number | null, actualDate: string) => {
    if (status === 'Completed') {
      return (
        <div className="space-y-0.5">
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-200 text-[10.5px] font-bold">
            <CheckCircle2 className="w-3 h-3" />
            Completed
          </span>
          {actualDate && (
            <div className="text-[10px] text-slate-500">{formatShortDate(actualDate)}</div>
          )}
        </div>
      );
    }
    if (status === 'Overdue') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-red-100 text-red-800 border border-red-200 text-[10.5px] font-bold">
          <AlertTriangle className="w-3 h-3" />
          Overdue {Math.abs(daysRemaining || 0)} wd
        </span>
      );
    }
    if (status === 'Due Soon') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-amber-100 text-amber-900 border border-amber-300 text-[10.5px] font-bold">
          <Clock className="w-3 h-3" />
          {daysRemaining === 0 ? 'Due Today' : `${daysRemaining} wd left`}
        </span>
      );
    }
    if (status === 'In Progress') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-blue-50 text-blue-800 border border-blue-200 text-[10.5px] font-bold">
          <CalendarClock className="w-3 h-3" />
          {daysRemaining} wd left
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200 text-[10.5px] font-semibold">
        Pending Triggers
      </span>
    );
  };

  return (
    <div className="space-y-5">
      {/* Executive Confidential Banner */}
      <div className="bg-slate-900 text-white rounded-xl p-4 sm:p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4 border border-slate-800">
        <div className="flex items-start gap-3">
          <div className="p-2.5 rounded-xl bg-amber-500/20 border border-amber-400/30 text-amber-300 shrink-0">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-sm sm:text-base font-extrabold tracking-tight">
                Management Timeline Control — Full Project Extract
              </h2>
              <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded bg-amber-500/20 text-amber-300 border border-amber-400/30">
                Private · {MANAGEMENT_ADMIN_EMAIL}
              </span>
            </div>
            <p className="text-[11px] text-slate-300 mt-1">
              Clause 6.1 Auto-Calculator: Monday–Saturday working days (excluding Sundays &amp;{' '}
              <strong className="text-white">{holidayDates.length} UAE public holidays</strong> configured in Settings).
              Production clock starts automatically from the latest of Stage 1 cleared, Shop Drawings approved, or Sample Confirmation signed.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={handleExportCsv}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-slate-900 bg-white hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-emerald-700" />
            Export CSV
          </button>
          <button
            type="button"
            onClick={() => {
              setPrintFeedback(null);
              setShowPrintModal(true);
            }}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" />
            Print / PDF Table
          </button>
          <button
            type="button"
            onClick={onLock}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-amber-200 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg transition-colors cursor-pointer"
            title="Re-lock this private timeline tab with password"
          >
            <Lock className="w-3.5 h-3.5" />
            Lock Tab
          </button>
        </div>
      </div>

      {/* KPI Summary Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="bg-white border border-slate-200 rounded-xl p-3.5">
          <div className="text-[11px] font-semibold text-slate-500">All Projects</div>
          <div className="text-xl font-black font-mono text-slate-900 mt-0.5">{stats.total}</div>
        </div>
        <div className="bg-white border border-blue-200 rounded-xl p-3.5">
          <div className="text-[11px] font-semibold text-blue-700">In Progress</div>
          <div className="text-xl font-black font-mono text-blue-800 mt-0.5">{stats.inProgress}</div>
        </div>
        <div className="bg-white border border-amber-300 rounded-xl p-3.5">
          <div className="text-[11px] font-semibold text-amber-800">Due Soon (≤5 wd)</div>
          <div className="text-xl font-black font-mono text-amber-800 mt-0.5">{stats.dueSoon}</div>
        </div>
        <div className="bg-white border border-red-200 rounded-xl p-3.5">
          <div className="text-[11px] font-semibold text-red-700">Overdue</div>
          <div className="text-xl font-black font-mono text-red-700 mt-0.5">{stats.overdue}</div>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-3.5">
          <div className="text-[11px] font-semibold text-slate-500">Pending Triggers</div>
          <div className="text-xl font-black font-mono text-slate-700 mt-0.5">{stats.pending}</div>
        </div>
        <div className="bg-white border border-emerald-200 rounded-xl p-3.5">
          <div className="text-[11px] font-semibold text-emerald-700">Completed</div>
          <div className="text-xl font-black font-mono text-emerald-700 mt-0.5">{stats.completed}</div>
        </div>
      </div>

      {/* Filter & Search Bar + Full Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-3 bg-slate-50/70">
          <div className="flex flex-wrap items-center gap-1.5">
            {(
              [
                { id: 'ALL', label: `All (${stats.total})` },
                { id: 'In Progress', label: `In Progress (${stats.inProgress})` },
                { id: 'Due Soon', label: `Due Soon (${stats.dueSoon})` },
                { id: 'Overdue', label: `Overdue (${stats.overdue})` },
                { id: 'Pending Triggers', label: `Pending (${stats.pending})` },
                { id: 'Completed', label: `Completed (${stats.completed})` },
              ] as Array<{ id: 'ALL' | ProjectTimelineStatus; label: string }>
            ).map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => setStatusFilter(f.id)}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg border transition-colors cursor-pointer ${
                  statusFilter === f.id
                    ? 'bg-slate-900 text-white border-slate-900'
                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          <div className="relative w-full md:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Filter contract, project, client..."
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-blue-600"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs min-w-[1180px]">
            <thead>
              <tr className="bg-slate-100/90 text-[11px] font-bold text-slate-600 border-b border-slate-200">
                <th className="py-3 px-3.5">Contract / Client</th>
                <th className="py-3 px-2.5">Contract Signed</th>
                <th className="py-3 px-2.5">Stage 1 Cleared</th>
                <th className="py-3 px-2.5">Drawings Approved</th>
                <th className="py-3 px-2.5">Sample Confirmed</th>
                <th className="py-3 px-3">Production Clock Start</th>
                <th className="py-3 px-2.5">Period + VO</th>
                <th className="py-3 px-3">Auto Completion Window</th>
                <th className="py-3 px-2.5 text-center">Progress</th>
                <th className="py-3 px-3">Countdown / Status</th>
                <th className="py-3 px-2.5 text-center">Open</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredRows.length === 0 ? (
                <tr>
                  <td colSpan={11} className="py-12 text-center text-slate-500">
                    No project timelines match the current filter.
                  </td>
                </tr>
              ) : (
                filteredRows.map(({ suite, timeline }) => {
                  const minTarget = timeline.revisedMinCompletionDate || timeline.autoMinCompletionDate;
                  const maxTarget = timeline.effectiveTargetDate;
                  return (
                    <tr key={suite.id} className="hover:bg-slate-50/80 align-top">
                      <td className="py-3 px-3.5">
                        <div className="font-mono font-bold text-blue-700">
                          {suite.contract.contractNo}
                        </div>
                        <div className="font-semibold text-slate-900 truncate max-w-[190px]" title={suite.projectTitle}>
                          {suite.projectTitle}
                        </div>
                        <div className="text-[10.5px] text-slate-500 truncate max-w-[190px]">
                          {suite.contract.clientName || 'Unnamed Client'}
                        </div>
                      </td>

                      <td className="py-3 px-2.5 whitespace-nowrap font-medium text-slate-700">
                        {formatShortDate(timeline.contractSignedDate)}
                      </td>

                      <td className="py-3 px-2.5">
                        <input
                          type="date"
                          value={timeline.stage1ClearedDate}
                          onChange={(e) =>
                            onUpdateSuiteDates(suite.id, { stage1ClearedDate: e.target.value })
                          }
                          title="Edit Stage 1 Advance Cleared Date (Clause 6.1a)"
                          className="px-2 py-1 text-[11px] bg-slate-50 hover:bg-white border border-slate-200 rounded focus:bg-white focus:border-blue-600 focus:outline-none w-[126px]"
                        />
                      </td>

                      <td className="py-3 px-2.5">
                        <input
                          type="date"
                          value={timeline.shopDrawingApprovedDate}
                          onChange={(e) =>
                            onUpdateSuiteDates(suite.id, { shopDrawingApprovedDate: e.target.value })
                          }
                          title="Edit Final Shop Drawings Approved Date (Clause 6.1b)"
                          className="px-2 py-1 text-[11px] bg-slate-50 hover:bg-white border border-slate-200 rounded focus:bg-white focus:border-blue-600 focus:outline-none w-[126px]"
                        />
                      </td>

                      <td className="py-3 px-2.5 whitespace-nowrap">
                        {timeline.sampleConfirmedDate ? (
                          <div>
                            <div className="font-semibold text-emerald-800">
                              {formatShortDate(timeline.sampleConfirmedDate)}
                            </div>
                            <div className="text-[10px] font-mono text-slate-500">
                              {timeline.sampleConfirmedId || 'Confirmed'}
                            </div>
                          </div>
                        ) : (
                          <span className="text-[11px] text-amber-700 font-medium">Awaiting Sample</span>
                        )}
                      </td>

                      <td className="py-3 px-3 whitespace-nowrap">
                        {timeline.productionStartDate ? (
                          <div>
                            <div className="font-bold text-slate-900">
                              {formatShortDate(timeline.productionStartDate)}
                            </div>
                            <div className="text-[10px] text-slate-500">
                              {timeline.productionStartSource}
                            </div>
                          </div>
                        ) : (
                          <span className="text-[11px] text-slate-400">Not started</span>
                        )}
                      </td>

                      <td className="py-3 px-2.5 whitespace-nowrap">
                        <div className="font-mono font-bold text-slate-800">
                          {timeline.minWorkingDays}–{timeline.maxWorkingDays} wd
                        </div>
                        {timeline.approvedVoDays > 0 && (
                          <div className="text-[10px] font-bold text-amber-800">
                            +{timeline.approvedVoDays} wd (Approved VO)
                          </div>
                        )}
                        {timeline.pendingVoDays > 0 && (
                          <div className="text-[10px] text-slate-500">
                            (+{timeline.pendingVoDays} wd pending VO)
                          </div>
                        )}
                      </td>

                      <td className="py-3 px-3 whitespace-nowrap">
                        {maxTarget ? (
                          <div className="space-y-0.5">
                            <div className="text-[11px] text-slate-600">
                              Min: <span className="font-semibold text-slate-800">{formatShortDate(minTarget)}</span>
                            </div>
                            <div className="text-[11px] font-bold text-slate-900">
                              Max: <span className="text-blue-800">{formatShortDate(maxTarget)}</span>
                            </div>
                            {timeline.manualOverrideDate && (
                              <span className="inline-block text-[9.5px] px-1.5 py-0.2 rounded bg-purple-100 text-purple-800 font-bold">
                                Manual Override
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-[11px] text-slate-400">Pending start trigger</span>
                        )}
                      </td>

                      <td className="py-3 px-2.5 text-center">
                        <div className="font-mono font-bold text-slate-800 text-[11px] mb-1">
                          {timeline.latestProgressPct}%
                        </div>
                        <div className="w-16 h-1.5 bg-slate-200 rounded-full overflow-hidden mx-auto">
                          <div
                            className={`h-full rounded-full ${
                              timeline.latestProgressPct >= 100
                                ? 'bg-emerald-600'
                                : timeline.latestProgressPct >= 60
                                ? 'bg-blue-600'
                                : 'bg-amber-500'
                            }`}
                            style={{ width: `${timeline.latestProgressPct}%` }}
                          />
                        </div>
                      </td>

                      <td className="py-3 px-3 whitespace-nowrap">
                        {getStatusBadge(
                          timeline.status,
                          timeline.workingDaysRemaining,
                          timeline.actualCompletionDate
                        )}
                      </td>

                      <td className="py-3 px-2.5 text-center">
                        <button
                          type="button"
                          onClick={() => onOpenSuite(suite.id)}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 text-[11px] font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg cursor-pointer"
                          title={`Open ${suite.contract.contractNo}`}
                        >
                          <ExternalLink className="w-3 h-3" />
                          Open
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Landscape A4 Print & PDF Preview Modal (Reliable inside iframes & browsers) */}
      {showPrintModal && (
        <div className="fixed inset-0 z-50 flex flex-col bg-slate-900/90 backdrop-blur-xs overflow-y-auto">
          <div className="sticky top-0 z-20 bg-slate-950 border-b border-slate-800 text-white px-4 sm:px-6 py-3 shadow-xl">
            <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="text-sm font-bold">
                  Management Project Timeline Extract — Print &amp; PDF Preview (A4 Landscape)
                </div>
                <div className="text-[11px] text-slate-400">
                  {filteredRows.length} project(s) · Confidential ({MANAGEMENT_ADMIN_EMAIL})
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={handleDownloadTimelinePdf}
                  disabled={isDownloadingPdf}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg cursor-pointer disabled:opacity-50"
                >
                  {isDownloadingPdf ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Download className="w-4 h-4" />
                  )}
                  <span>{isDownloadingPdf ? 'Compiling PDF...' : 'Download PDF'}</span>
                </button>
                <button
                  type="button"
                  onClick={handlePrintFromModal}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg cursor-pointer"
                >
                  <Printer className="w-4 h-4" />
                  <span>Print</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowPrintModal(false)}
                  className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg cursor-pointer"
                  title="Close preview"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            {printFeedback && (
              <div className="max-w-7xl mx-auto mt-2 px-3 py-1.5 rounded-lg bg-emerald-950/80 border border-emerald-600/60 text-emerald-200 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{printFeedback}</span>
              </div>
            )}
          </div>

          <div className="p-4 sm:p-8 flex-1 flex justify-center items-start overflow-x-auto">
            <div
              id="private-timeline-print-area"
              className="bg-white text-slate-900 shadow-2xl border border-slate-200"
              style={{
                width: '281mm',
                minHeight: '190mm',
                padding: '10mm',
                boxSizing: 'border-box',
                fontFamily: "'Candara', 'Optima', 'Calibri', 'Segoe UI', Arial, sans-serif",
              }}
            >
              <div
                style={{
                  borderBottom: '2px solid #5c3d22',
                  paddingBottom: '6px',
                  marginBottom: '10px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-end',
                }}
              >
                <div>
                  <div style={{ fontSize: '13.5pt', fontWeight: 700, color: '#3e2723' }}>
                    {(settings.name || 'Touch Of Wood Decoration Works LLC').toUpperCase()} — MANAGEMENT TIMELINE EXTRACT
                  </div>
                  <div style={{ fontSize: '8.5pt', color: '#4b5563', fontStyle: 'italic', marginTop: '2px' }}>
                    DocuSuit V2 · Confidential ({MANAGEMENT_ADMIN_EMAIL}) · Mon–Sat Working Days ({holidayDates.length} UAE public holidays excluded)
                  </div>
                </div>
                <div style={{ fontSize: '8.5pt', color: '#374151', textAlign: 'right' }}>
                  Generated: <strong>{formatShortDate(new Date().toISOString().split('T')[0])}</strong>
                </div>
              </div>

              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '8.3pt' }}>
                <thead>
                  <tr style={{ backgroundColor: '#3e2723', color: '#ffffff' }}>
                    <th style={{ border: '1px solid #3e2723', padding: '5px 6px', textAlign: 'left' }}>Contract / Project</th>
                    <th style={{ border: '1px solid #3e2723', padding: '5px 6px', textAlign: 'left' }}>Client</th>
                    <th style={{ border: '1px solid #3e2723', padding: '5px 6px', textAlign: 'left' }}>Signed</th>
                    <th style={{ border: '1px solid #3e2723', padding: '5px 6px', textAlign: 'left' }}>Stage 1</th>
                    <th style={{ border: '1px solid #3e2723', padding: '5px 6px', textAlign: 'left' }}>Drawings</th>
                    <th style={{ border: '1px solid #3e2723', padding: '5px 6px', textAlign: 'left' }}>Sample</th>
                    <th style={{ border: '1px solid #3e2723', padding: '5px 6px', textAlign: 'left' }}>Clock Start</th>
                    <th style={{ border: '1px solid #3e2723', padding: '5px 6px', textAlign: 'left' }}>Period + VO</th>
                    <th style={{ border: '1px solid #3e2723', padding: '5px 6px', textAlign: 'left' }}>Completion Window</th>
                    <th style={{ border: '1px solid #3e2723', padding: '5px 6px', textAlign: 'center' }}>Progress</th>
                    <th style={{ border: '1px solid #3e2723', padding: '5px 6px', textAlign: 'left' }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRows.length === 0 ? (
                    <tr>
                      <td
                        colSpan={11}
                        style={{ border: '1px solid #d6cfc7', padding: '14px', textAlign: 'center', color: '#6b7280' }}
                      >
                        No projects match the selected filter.
                      </td>
                    </tr>
                  ) : (
                    filteredRows.map(({ suite, timeline }, idx) => {
                      const minDate = timeline.revisedMinCompletionDate || timeline.autoMinCompletionDate;
                      const maxDate = timeline.effectiveTargetDate;
                      const countdownText =
                        timeline.status === 'Completed'
                          ? `Completed (${formatShortDate(timeline.actualCompletionDate)})`
                          : timeline.workingDaysRemaining === null
                          ? 'Pending Triggers'
                          : timeline.workingDaysRemaining < 0
                          ? `Overdue ${Math.abs(timeline.workingDaysRemaining)} wd`
                          : timeline.workingDaysRemaining === 0
                          ? 'Due Today'
                          : `${timeline.workingDaysRemaining} wd left`;

                      return (
                        <tr
                          key={suite.id}
                          style={{ backgroundColor: idx % 2 === 1 ? '#faf8f5' : '#ffffff' }}
                        >
                          <td style={{ border: '1px solid #d6cfc7', padding: '5px 6px', verticalAlign: 'top' }}>
                            <strong>{suite.contract.contractNo}</strong>
                            <div style={{ fontSize: '7.8pt', color: '#4b5563' }}>{suite.projectTitle}</div>
                          </td>
                          <td style={{ border: '1px solid #d6cfc7', padding: '5px 6px', verticalAlign: 'top' }}>
                            {suite.contract.clientName || '—'}
                          </td>
                          <td style={{ border: '1px solid #d6cfc7', padding: '5px 6px', verticalAlign: 'top', whiteSpace: 'nowrap' }}>
                            {formatShortDate(timeline.contractSignedDate)}
                          </td>
                          <td style={{ border: '1px solid #d6cfc7', padding: '5px 6px', verticalAlign: 'top', whiteSpace: 'nowrap' }}>
                            {formatShortDate(timeline.stage1ClearedDate)}
                          </td>
                          <td style={{ border: '1px solid #d6cfc7', padding: '5px 6px', verticalAlign: 'top', whiteSpace: 'nowrap' }}>
                            {formatShortDate(timeline.shopDrawingApprovedDate)}
                          </td>
                          <td style={{ border: '1px solid #d6cfc7', padding: '5px 6px', verticalAlign: 'top', whiteSpace: 'nowrap' }}>
                            {formatShortDate(timeline.sampleConfirmedDate)}
                          </td>
                          <td style={{ border: '1px solid #d6cfc7', padding: '5px 6px', verticalAlign: 'top' }}>
                            <strong>{formatShortDate(timeline.productionStartDate)}</strong>
                            <div style={{ fontSize: '7.5pt', color: '#4b5563' }}>{timeline.productionStartSource}</div>
                          </td>
                          <td style={{ border: '1px solid #d6cfc7', padding: '5px 6px', verticalAlign: 'top', whiteSpace: 'nowrap' }}>
                            {timeline.minWorkingDays}–{timeline.maxWorkingDays} wd
                            {timeline.approvedVoDays > 0 && (
                              <div style={{ fontSize: '7.5pt', color: '#92400e', fontWeight: 700 }}>
                                +{timeline.approvedVoDays} VO wd
                              </div>
                            )}
                          </td>
                          <td style={{ border: '1px solid #d6cfc7', padding: '5px 6px', verticalAlign: 'top', whiteSpace: 'nowrap' }}>
                            {maxDate ? (
                              <>
                                {formatShortDate(minDate)} → <strong>{formatShortDate(maxDate)}</strong>
                              </>
                            ) : (
                              '—'
                            )}
                          </td>
                          <td style={{ border: '1px solid #d6cfc7', padding: '5px 6px', textAlign: 'center', fontWeight: 700, verticalAlign: 'top' }}>
                            {timeline.latestProgressPct}%
                          </td>
                          <td style={{ border: '1px solid #d6cfc7', padding: '5px 6px', verticalAlign: 'top', fontWeight: 700, whiteSpace: 'nowrap' }}>
                            {countdownText}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
