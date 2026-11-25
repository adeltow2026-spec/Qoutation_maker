import {
  CompanySettings,
  ContractTermsConfig,
  Customer,
  FinishCertificateDocument,
  ProjectDocumentSuite,
  ProjectProgressionDocument,
  ProjectProgressionRow,
  ProgressionStage,
  Quotation,
  SampleConfirmationDocument,
  SampleConfirmationRow,
  UaeHolidayItem,
  UserProfile,
  VariationOrderDocument,
} from '../types';
import { parsePaymentMilestones } from './formatters';

export const MANAGEMENT_ADMIN_EMAIL = 'adel.tow.2026@gmail.com';

export function canEditLockedContractTerms(user?: UserProfile | null): boolean {
  return (user?.email || '').trim().toLowerCase() === MANAGEMENT_ADMIN_EMAIL;
}

export const PROGRESSION_STAGE_PRESETS: Array<{ stage: ProgressionStage; defaultPct: number }> = [
  { stage: 'Shop Drawings', defaultPct: 15 },
  { stage: 'Material Procurement', defaultPct: 30 },
  { stage: 'Factory Production', defaultPct: 55 },
  { stage: 'Painting & Finishing', defaultPct: 75 },
  { stage: 'QC & Packing', defaultPct: 85 },
  { stage: 'Site Delivery', defaultPct: 90 },
  { stage: 'Site Installation', defaultPct: 95 },
  { stage: 'Completed', defaultPct: 100 },
];

export const DEFAULT_CONTRACT_TERMS: ContractTermsConfig = {
  stage1Pct: 60,
  stage2Pct: 30,
  stage3Pct: 10,

  clientItemsAdvanceDays: 10,
  shopDrawingMinDays: 10,
  shopDrawingMaxDays: 15,
  includedRevisionRounds: 2,
  sampleOptionsMin: 2,
  sampleOptionsMax: 3,
  sampleSignOffDays: 3,
  otherDocsSignOffDays: 4,
  finalNoticeDefaultDays: 3,
  priceEscalationDelayDays: 5,
  paymentSuspensionDays: 7,
  completionMinDays: 45,
  completionMaxDays: 90,
  readinessConfirmDays: 3,
  snagReportDays: 3,
  snagRectificationDays: 10,
  abandonmentDefaultDays: 21,
  abandonmentFinalNoticeDays: 7,
  cancellationSettlementDays: 7,
  disputeAmicableDays: 30,

  // Admin-locked defaults (Fixed Fees & Warranty)
  clientSuppliedMarkupPct: 15,
  additionalRevisionFee: 450,
  extraSampleSessionFee: 350,
  extraCustomSampleFee: 300,
  sampleSiteDeliveryFee: 200,
  postAcceptanceCalloutFee: 350,
  abortedSiteVisitFee: 850,
  factoryStorageDailyFee: 150,
  factoryStorageFreeDays: 7,
  voScopeCeiling: 10000,
  warrantyYears: 2,
  cancellationFeePct: 15,
  liabilityCapPct: 15,
};

export interface ContractPaymentPreset {
  label: string;
  stage1Pct: number;
  stage2Pct: number;
  stage3Pct: number;
}

export const CONTRACT_PAYMENT_PRESETS: ContractPaymentPreset[] = [
  { label: '60 / 30 / 10%', stage1Pct: 60, stage2Pct: 30, stage3Pct: 10 },
  { label: '50 / 40 / 10%', stage1Pct: 50, stage2Pct: 40, stage3Pct: 10 },
  { label: '70 / 30%', stage1Pct: 70, stage2Pct: 30, stage3Pct: 0 },
  { label: '100% Advance', stage1Pct: 100, stage2Pct: 0, stage3Pct: 0 },
];

export function extractStagePercentagesFromQuote(
  paymentTermsText: string | undefined | null,
  fallback: { stage1Pct: number; stage2Pct: number; stage3Pct: number }
): { stage1Pct: number; stage2Pct: number; stage3Pct: number; matched: boolean } {
  const raw = (paymentTermsText || '').trim();
  if (!raw || !/\d+(?:\.\d+)?\s*%/.test(raw)) {
    return {
      stage1Pct: fallback.stage1Pct,
      stage2Pct: fallback.stage2Pct,
      stage3Pct: fallback.stage3Pct,
      matched: false,
    };
  }

  const milestones = parsePaymentMilestones(raw, 100);
  if (milestones.length === 0) {
    return {
      stage1Pct: fallback.stage1Pct,
      stage2Pct: fallback.stage2Pct,
      stage3Pct: fallback.stage3Pct,
      matched: false,
    };
  }

  if (milestones.length === 1) {
    return {
      stage1Pct: milestones[0].percent,
      stage2Pct: 0,
      stage3Pct: 0,
      matched: true,
    };
  }

  if (milestones.length === 2) {
    return {
      stage1Pct: milestones[0].percent,
      stage2Pct: milestones[1].percent,
      stage3Pct: 0,
      matched: true,
    };
  }

  return {
    stage1Pct: milestones[0].percent,
    stage2Pct: milestones[1].percent,
    stage3Pct: milestones[2].percent,
    matched: true,
  };
}

export function resolveContractTerms(settings: CompanySettings): ContractTermsConfig {
  return {
    ...DEFAULT_CONTRACT_TERMS,
    ...(settings.contractDefaults || {}),
  };
}

export function generateContractNumber(seq: number, year = new Date().getFullYear()): string {
  return `CON-${year}-${String(seq).padStart(3, '0')}`;
}

export function generateProjectCode(seq: number, year = new Date().getFullYear()): string {
  return `PJ-${year}-${String(seq).padStart(3, '0')}`;
}

export const DEFAULT_UAE_PUBLIC_HOLIDAYS: UaeHolidayItem[] = [
  { id: 'hol_2026_ny', date: '2026-01-01', name: "New Year's Day" },
  { id: 'hol_2026_fitr1', date: '2026-03-20', name: 'Eid Al Fitr (Day 1)' },
  { id: 'hol_2026_fitr2', date: '2026-03-21', name: 'Eid Al Fitr (Day 2)' },
  { id: 'hol_2026_fitr3', date: '2026-03-22', name: 'Eid Al Fitr (Day 3)' },
  { id: 'hol_2026_arafat', date: '2026-05-26', name: 'Arafat Day' },
  { id: 'hol_2026_adha1', date: '2026-05-27', name: 'Eid Al Adha (Day 1)' },
  { id: 'hol_2026_adha2', date: '2026-05-28', name: 'Eid Al Adha (Day 2)' },
  { id: 'hol_2026_adha3', date: '2026-05-29', name: 'Eid Al Adha (Day 3)' },
  { id: 'hol_2026_hijri', date: '2026-06-16', name: 'Islamic New Year' },
  { id: 'hol_2026_mawlid', date: '2026-08-25', name: "Prophet's Birthday" },
  { id: 'hol_2026_nat1', date: '2026-12-02', name: 'UAE National Day (Day 1)' },
  { id: 'hol_2026_nat2', date: '2026-12-03', name: 'UAE National Day (Day 2)' },
  { id: 'hol_2027_ny', date: '2027-01-01', name: "New Year's Day" },
];

export function resolveHolidayDates(settings?: CompanySettings): string[] {
  const list =
    Array.isArray(settings?.uaePublicHolidays)
      ? settings!.uaePublicHolidays
      : DEFAULT_UAE_PUBLIC_HOLIDAYS;
  return list.map((h) => h.date).filter(Boolean);
}

function toIsoDate(date: Date): string {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

function parseIsoDate(dateStr?: string): Date | null {
  if (!dateStr) return null;
  const parts = dateStr.split('-').map(Number);
  if (parts.length !== 3 || parts.some(isNaN)) return null;
  return new Date(parts[0], parts[1] - 1, parts[2]);
}

/**
 * Adds UAE working days (Monday–Saturday, skipping Sunday and configured UAE public holidays)
 * to a YYYY-MM-DD date string per Contract Clause 6.1.
 */
export function addWorkingDays(
  startDateStr: string,
  workingDays: number,
  holidayDates?: string[]
): string {
  if (!startDateStr || isNaN(workingDays) || workingDays <= 0) return startDateStr || '';
  const date = parseIsoDate(startDateStr);
  if (!date) return startDateStr;

  const holidaySet = new Set((holidayDates || []).filter(Boolean));
  let added = 0;
  let guard = 0;
  while (added < Math.floor(workingDays) && guard < 4000) {
    guard += 1;
    date.setDate(date.getDate() + 1);
    const iso = toIsoDate(date);
    if (date.getDay() !== 0 && !holidaySet.has(iso)) {
      // Skip Sunday & UAE public holidays (Clause 6.1: Mon–Sat)
      added += 1;
    }
  }
  return toIsoDate(date);
}

/**
 * Counts signed UAE working days (Mon–Sat, excl. holidays) from `fromDateStr` to `toDateStr`.
 * Positive = working days remaining; 0 = same day; Negative = working days overdue.
 */
export function countWorkingDaysBetween(
  fromDateStr: string,
  toDateStr: string,
  holidayDates?: string[]
): number | null {
  const start = parseIsoDate(fromDateStr);
  const end = parseIsoDate(toDateStr);
  if (!start || !end) return null;

  const startIso = toIsoDate(start);
  const endIso = toIsoDate(end);
  if (startIso === endIso) return 0;

  const holidaySet = new Set((holidayDates || []).filter(Boolean));
  const forward = end.getTime() > start.getTime();
  const cursor = new Date(forward ? start : end);
  const target = new Date(forward ? end : start);
  let count = 0;
  let guard = 0;

  while (cursor.getTime() < target.getTime() && guard < 4000) {
    guard += 1;
    cursor.setDate(cursor.getDate() + 1);
    const iso = toIsoDate(cursor);
    if (cursor.getDay() !== 0 && !holidaySet.has(iso)) {
      count += 1;
    }
  }
  return forward ? count : -count;
}

export type ProjectTimelineStatus =
  | 'Completed'
  | 'Overdue'
  | 'Due Soon'
  | 'In Progress'
  | 'Pending Triggers';

export interface ProjectTimelineSummary {
  contractSignedDate: string;
  stage1ClearedDate: string;
  shopDrawingApprovedDate: string;
  sampleConfirmedDate: string;
  sampleConfirmedId: string;
  productionStartDate: string;
  productionStartSource: string;
  minWorkingDays: number;
  maxWorkingDays: number;
  approvedVoDays: number;
  pendingVoDays: number;
  autoMinCompletionDate: string;
  autoMaxCompletionDate: string;
  revisedMinCompletionDate: string;
  revisedMaxCompletionDate: string;
  manualOverrideDate: string;
  effectiveTargetDate: string;
  actualCompletionDate: string;
  latestProgressPct: number;
  workingDaysRemaining: number | null;
  status: ProjectTimelineStatus;
}

/**
 * Computes Clause 6.1 automatic project timeline dates from Contract, Sample Confirmations,
 * Variation Orders, Project Progression, and Finish Certificates.
 */
export function calculateProjectTimeline(
  suite: ProjectDocumentSuite,
  holidayDates?: string[]
): ProjectTimelineSummary {
  const c = suite.contract;
  const t = c.terms || DEFAULT_CONTRACT_TERMS;
  const todayIso = toIsoDate(new Date());

  const contractSignedDate = c.clientSignDate || '';
  const stage1ClearedDate = c.stage1ClearedDate || '';
  const shopDrawingApprovedDate = c.shopDrawingApprovedDate || '';

  // Find latest confirmed Sample Confirmation date (prefer clientDate; fallback to contractorDate/dateIssued only if marked Signed)
  let sampleConfirmedDate = '';
  let sampleConfirmedId = '';
  (suite.sampleConfirmations || []).forEach((sc) => {
    const candidate =
      (sc.clientDate || '').trim() ||
      (sc.status === 'Signed' ? (sc.contractorDate || sc.dateIssued || '').trim() : '');
    if (candidate && (!sampleConfirmedDate || candidate > sampleConfirmedDate)) {
      sampleConfirmedDate = candidate;
      sampleConfirmedId = sc.sampleId;
    }
  });

  // Clause 6.1: Production clock commences on the LATEST of Stage 1 cleared, Shop Drawings approved, or Sample Confirmation signed
  const triggers: Array<{ label: string; date: string }> = [
    { label: 'Stage 1 Cleared', date: stage1ClearedDate },
    { label: 'Shop Drawings Approved', date: shopDrawingApprovedDate },
    {
      label: sampleConfirmedId ? `Sample ${sampleConfirmedId} Confirmed` : 'Sample Confirmed',
      date: sampleConfirmedDate,
    },
  ].filter((item) => Boolean(item.date));

  let productionStartDate = '';
  let productionStartSource = 'Awaiting Approvals';
  if (triggers.length > 0) {
    triggers.sort((a, b) => a.date.localeCompare(b.date));
    const latest = triggers[triggers.length - 1];
    productionStartDate = latest.date;
    productionStartSource = latest.label;
  }

  const minWorkingDays = Math.max(0, Number(t.completionMinDays) || 0);
  const maxWorkingDays = Math.max(minWorkingDays, Number(t.completionMaxDays) || 0);

  const approvedVoDays = (suite.variationOrders || [])
    .filter((vo) => vo.status === 'Approved')
    .reduce((sum, vo) => sum + Math.max(0, Number(vo.additionalWorkingDays) || 0), 0);

  const pendingVoDays = (suite.variationOrders || [])
    .filter((vo) => vo.status !== 'Approved')
    .reduce((sum, vo) => sum + Math.max(0, Number(vo.additionalWorkingDays) || 0), 0);

  const autoMinCompletionDate = productionStartDate
    ? addWorkingDays(productionStartDate, minWorkingDays, holidayDates)
    : '';
  const autoMaxCompletionDate = productionStartDate
    ? addWorkingDays(productionStartDate, maxWorkingDays, holidayDates)
    : '';
  const revisedMinCompletionDate = productionStartDate
    ? addWorkingDays(productionStartDate, minWorkingDays + approvedVoDays, holidayDates)
    : '';
  const revisedMaxCompletionDate = productionStartDate
    ? addWorkingDays(productionStartDate, maxWorkingDays + approvedVoDays, holidayDates)
    : '';

  const manualOverrideDate = (c.manualTargetCompletionDate || '').trim();
  const effectiveTargetDate = manualOverrideDate || revisedMaxCompletionDate || autoMaxCompletionDate || '';

  // Detect actual completion via signed Finish Certificate
  let actualCompletionDate = '';
  (suite.finishCertificates || []).forEach((fc) => {
    const isCompleted = fc.status === 'Signed' || Boolean(fc.clientDate);
    if (isCompleted) {
      const candidate = fc.installationCompletionDate || fc.clientDate || '';
      if (candidate && (!actualCompletionDate || candidate > actualCompletionDate)) {
        actualCompletionDate = candidate;
      }
    }
  });

  const reports = suite.progressionReports || [];
  let latestProgressPct = 0;
  if (actualCompletionDate) {
    latestProgressPct = 100;
  } else if (reports.length > 0) {
    const latestReport = reports[reports.length - 1];
    latestProgressPct = calculateProgressionOverallPct(latestReport.rows || []);
  }

  const workingDaysRemaining =
    effectiveTargetDate && !actualCompletionDate
      ? countWorkingDaysBetween(todayIso, effectiveTargetDate, holidayDates)
      : null;

  let status: ProjectTimelineStatus = 'Pending Triggers';
  if (actualCompletionDate) {
    status = 'Completed';
  } else if (workingDaysRemaining !== null) {
    if (workingDaysRemaining < 0) {
      status = 'Overdue';
    } else if (workingDaysRemaining <= 5) {
      status = 'Due Soon';
    } else {
      status = 'In Progress';
    }
  }

  return {
    contractSignedDate,
    stage1ClearedDate,
    shopDrawingApprovedDate,
    sampleConfirmedDate,
    sampleConfirmedId,
    productionStartDate,
    productionStartSource,
    minWorkingDays,
    maxWorkingDays,
    approvedVoDays,
    pendingVoDays,
    autoMinCompletionDate,
    autoMaxCompletionDate,
    revisedMinCompletionDate,
    revisedMaxCompletionDate,
    manualOverrideDate,
    effectiveTargetDate,
    actualCompletionDate,
    latestProgressPct,
    workingDaysRemaining,
    status,
  };
}

export function formatNumberWord(n: number): string {
  const map: Record<number, string> = {
    1: 'one',
    2: 'two',
    3: 'three',
    4: 'four',
    5: 'five',
    6: 'six',
    7: 'seven',
    8: 'eight',
    9: 'nine',
    10: 'ten',
    12: 'twelve',
    14: 'fourteen',
    15: 'fifteen',
    20: 'twenty',
    21: 'twenty-one',
    25: 'twenty-five',
    30: 'thirty',
    45: 'forty-five',
    50: 'fifty',
    60: 'sixty',
    90: 'ninety',
  };
  return map[n] ? `${map[n]} (${n})` : String(n);
}

export function formatPercentWord(n: number): string {
  const map: Record<number, string> = {
    5: 'five',
    10: 'ten',
    12: 'twelve',
    15: 'fifteen',
    20: 'twenty',
    25: 'twenty-five',
    30: 'thirty',
    40: 'forty',
    50: 'fifty',
    60: 'sixty',
    70: 'seventy',
    75: 'seventy-five',
    80: 'eighty',
    90: 'ninety',
    100: 'one hundred',
  };
  return map[n] ? `${map[n]} percent (${n}%)` : `${n}%`;
}

export function getLinkedQuotationIds(
  suite?: Pick<ProjectDocumentSuite, 'linkedQuotationId' | 'linkedQuotationIds'> | null
): string[] {
  if (!suite) return [];
  const ids: string[] = [];
  if (Array.isArray(suite.linkedQuotationIds)) {
    suite.linkedQuotationIds.forEach((id) => {
      if (id && !ids.includes(id)) ids.push(id);
    });
  }
  if (suite.linkedQuotationId && !ids.includes(suite.linkedQuotationId)) {
    ids.unshift(suite.linkedQuotationId);
  }
  return ids;
}

export function createBlankSampleRow(index = 1): SampleConfirmationRow {
  return {
    id: 'srow_' + Math.random().toString(36).substring(2, 9) + Date.now().toString(36),
    jyCode: `JY-${String(index).padStart(2, '0')}`,
    roomArea: '',
    component: '',
    materialFinish: '',
    codeSlabId: '',
    technicalSpec: '',
    photoUrl: '',
    photoFileName: '',
    approvalNote: '',
  };
}

export function createBlankSampleConfirmation(
  seq: number,
  clientName: string,
  settings: CompanySettings,
  currentUser?: UserProfile
): SampleConfirmationDocument {
  const today = new Date().toISOString().split('T')[0];
  const terms = resolveContractTerms(settings);
  return {
    id: 'sc_' + Math.random().toString(36).substring(2, 9) + Date.now().toString(36),
    sampleId: `S-${String(seq).padStart(3, '0')}`,
    drawingReference: `TOW-DW-${new Date().getFullYear()}-001 Rev 0`,
    dateIssued: today,
    deliveryMethod: 'office',
    deliveryDate: today,
    deliveryFee: terms.sampleSiteDeliveryFee,
    rows: [createBlankSampleRow(1)],
    clientName: clientName || '',
    clientDate: '',
    contractorName: settings.authorizedSignatoryName || currentUser?.name || 'Adel',
    contractorPosition: settings.authorizedSignatoryTitle || currentUser?.role || 'Managing Director',
    contractorDate: today,
    status: 'Draft',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

export function createBlankVariationOrder(
  seq: number,
  clientName: string,
  settings: CompanySettings,
  defaultOriginalCompletionDate = ''
): VariationOrderDocument {
  const today = new Date().toISOString().split('T')[0];
  return {
    id: 'vo_' + Math.random().toString(36).substring(2, 9) + Date.now().toString(36),
    voNo: `VO-${String(seq).padStart(3, '0')}`,
    issuedBy: 'Contractor',
    dateIssued: today,
    originRequestedBy: 'Client',
    requestDate: today,
    referenceDrawings: '',
    items: [
      {
        id: 'voi_' + Math.random().toString(36).substring(2, 8),
        description: '',
      },
    ],
    voCostExclVat: 0,
    vatPct: settings.tax ?? 5,
    originalCompletionDate: defaultOriginalCompletionDate,
    additionalWorkingDays: 0,
    revisedCompletionDate: defaultOriginalCompletionDate,
    notesAttachments:
      'Attach revised drawings, material samples, cost breakdowns, and any correspondence (email/WhatsApp screenshots) that confirm approval.',
    status: 'Draft',
    clientName: clientName || '',
    clientDate: '',
    contractorDate: today,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

export function createBlankFinishCertificate(
  seq: number,
  clientName: string,
  settings: CompanySettings,
  currentUser?: UserProfile,
  initialWorks?: string[]
): FinishCertificateDocument {
  const today = new Date().toISOString().split('T')[0];
  const works =
    initialWorks && initialWorks.length > 0
      ? initialWorks.map((ref, idx) => ({
          id: `fcw_${idx}_${Date.now().toString(36)}`,
          reference: ref,
          completed: true,
        }))
      : [
          {
            id: 'fcw_1_' + Date.now().toString(36),
            reference: `Drawing No. TOW-DW-${new Date().getFullYear()}-001 Rev 0`,
            completed: true,
          },
        ];

  return {
    id: 'fc_' + Math.random().toString(36).substring(2, 9) + Date.now().toString(36),
    fcNo: `FC-${String(seq).padStart(3, '0')}`,
    installationCompletionDate: today,
    completedWorks: works,
    snagItems: [],
    completionPhotos: [],
    acceptanceMethod: 'none',
    acceptanceDate: '',
    acceptanceEvidence: '',
    clientName: clientName || '',
    clientDate: '',
    contractorName: settings.authorizedSignatoryName || currentUser?.name || 'Adel',
    contractorPosition: settings.authorizedSignatoryTitle || currentUser?.role || 'Managing Director',
    contractorDate: today,
    status: 'Draft',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

export function createBlankProgressionRow(
  seq: number,
  overrides?: Partial<ProjectProgressionRow>
): ProjectProgressionRow {
  return {
    id: 'prow_' + Math.random().toString(36).substring(2, 9) + Date.now().toString(36),
    jyCode: `JY-${String(seq).padStart(2, '0')}`,
    roomArea: '',
    component: '',
    stage: 'Factory Production',
    progressPct: 55,
    startDate: '',
    targetDate: '',
    remarks: '',
    photoUrl: '',
    photoFileName: '',
    ...overrides,
  };
}

export function extractJyRowsFromSamples(
  samples: SampleConfirmationDocument[],
  existingRows: ProjectProgressionRow[] = [],
  defaultStartDate = '',
  defaultTargetDate = ''
): ProjectProgressionRow[] {
  const seenKeys = new Set<string>(
    existingRows.map(
      (r) =>
        `${(r.jyCode || '').trim().toLowerCase()}|${(r.roomArea || '').trim().toLowerCase()}|${(r.component || '').trim().toLowerCase()}`
    )
  );

  const imported: ProjectProgressionRow[] = [];
  let counter = existingRows.length + 1;

  (samples || []).forEach((sheet) => {
    (sheet.rows || []).forEach((row) => {
      const code = (row.jyCode || '').trim();
      const area = (row.roomArea || '').trim();
      const comp = (row.component || '').trim();
      if (!code && !area && !comp) return;
      const key = `${code.toLowerCase()}|${area.toLowerCase()}|${comp.toLowerCase()}`;
      if (seenKeys.has(key)) return;
      seenKeys.add(key);
      imported.push(
        createBlankProgressionRow(counter++, {
          jyCode: code || `JY-${String(counter - 1).padStart(2, '0')}`,
          roomArea: area,
          component: comp,
          stage: 'Factory Production',
          progressPct: 55,
          startDate: defaultStartDate,
          targetDate: defaultTargetDate,
          remarks: row.materialFinish ? `Material: ${row.materialFinish}` : '',
        })
      );
    });
  });

  return [...existingRows, ...imported];
}

export function calculateProgressionOverallPct(rows: ProjectProgressionRow[]): number {
  if (!rows || rows.length === 0) return 0;
  const total = rows.reduce((sum, r) => sum + Math.min(100, Math.max(0, Number(r.progressPct) || 0)), 0);
  return Math.round(total / rows.length);
}

export function createBlankProjectProgression(
  seq: number,
  suite: ProjectDocumentSuite,
  settings: CompanySettings,
  currentUser?: UserProfile
): ProjectProgressionDocument {
  const today = new Date().toISOString().split('T')[0];
  const holidayDates = resolveHolidayDates(settings);
  const timeline = calculateProjectTimeline(suite, holidayDates);
  const productionStartDate = timeline.productionStartDate || suite.contract.dateOfIssuance || today;
  const maxDays = suite.contract.terms?.completionMaxDays || suite.contract.terms?.completionMinDays || 45;
  const siteInstallStart = addWorkingDays(
    productionStartDate,
    Math.max(10, Math.round(maxDays * 0.7)),
    holidayDates
  );
  const targetCompletion =
    timeline.effectiveTargetDate || addWorkingDays(productionStartDate, maxDays, holidayDates);

  // Carry forward rows from previous report if available; otherwise auto-import from Sample Confirmations
  const previousReports = suite.progressionReports || [];
  let initialRows: ProjectProgressionRow[] = [];
  if (previousReports.length > 0) {
    const latest = previousReports[previousReports.length - 1];
    initialRows = latest.rows.map((r) => ({
      ...r,
      id: 'prow_' + Math.random().toString(36).substring(2, 9) + Date.now().toString(36),
    }));
  } else {
    initialRows = extractJyRowsFromSamples(
      suite.sampleConfirmations || [],
      [],
      productionStartDate,
      targetCompletion
    );
  }

  if (initialRows.length === 0) {
    initialRows = [
      createBlankProgressionRow(1, {
        startDate: productionStartDate,
        targetDate: targetCompletion,
      }),
    ];
  }

  return {
    id: 'pr_' + Math.random().toString(36).substring(2, 9) + Date.now().toString(36),
    reportNo: `PR-${String(seq).padStart(3, '0')}`,
    reportDate: today,
    reportPeriod: `Progress Update #${seq}`,
    productionStartDate,
    siteInstallationStartDate: siteInstallStart,
    targetCompletionDate: targetCompletion,
    overallStatus: 'In Production',
    executiveSummary:
      'Workshop joinery production and site installation schedule update per approved shop drawings and confirmed material samples.',
    rows: initialRows,
    progressPhotos: [],
    preparedByName: settings.authorizedSignatoryName || currentUser?.name || 'Adel',
    preparedByPosition: settings.authorizedSignatoryTitle || currentUser?.role || 'Project Management',
    preparedDate: today,
    status: 'Draft',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

export function extractMergedScopesFromQuotations(selectedQuotes: Quotation[]): string[] {
  const isMultiple = selectedQuotes.length > 1;
  const works: string[] = [];
  selectedQuotes.forEach((quote) => {
    (quote.scopes || []).forEach((sc, idx) => {
      const baseTitle = sc.photoCaption
        ? `${sc.name} (${sc.photoCaption})`
        : sc.name || `Scope ${idx + 1}.0`;
      works.push(isMultiple ? `[${quote.quoteNo}] ${baseTitle}` : baseTitle);
    });
  });
  return works;
}

export function createDocumentSuiteFromQuotations(
  selectedQuotes: Quotation[],
  customers: Customer[],
  settings: CompanySettings,
  seqNum: number,
  currentUser?: UserProfile
): ProjectDocumentSuite {
  if (!selectedQuotes || selectedQuotes.length === 0) {
    return createStandaloneDocumentSuite(settings, seqNum, currentUser);
  }

  const primaryQuote = selectedQuotes[0];
  const customer = customers.find((c) => c.id === primaryQuote.customerId);
  const today = new Date().toISOString().split('T')[0];
  const year = new Date().getFullYear();
  const baseTerms = resolveContractTerms(settings);

  const combinedTotal =
    Math.round(
      selectedQuotes.reduce((sum, q) => sum + (Number(q.total) || 0), 0) * 100
    ) / 100;

  // Derive stage percentages from primary quotation payment terms (supports 1, 2, or 3 milestones)
  const { stage1Pct, stage2Pct, stage3Pct } = extractStagePercentagesFromQuote(
    primaryQuote.paymentTerms || settings.paymentTerms,
    baseTerms
  );

  const clientName = customer?.name || primaryQuote.customerName || '';
  const uniqueProjectNames = Array.from(
    new Set(selectedQuotes.map((q) => (q.project || '').trim()).filter(Boolean))
  );
  const projectTitle =
    uniqueProjectNames.length > 0
      ? uniqueProjectNames.join(' + ')
      : `${clientName || 'Custom Joinery'} Project`;

  const quotationRef = selectedQuotes
    .map((q) => q.quoteNo)
    .filter(Boolean)
    .join(', ');

  const initialWorks = extractMergedScopesFromQuotations(selectedQuotes);
  const linkedIds = selectedQuotes.map((q) => q.id);

  return {
    id: 'suite_' + Math.random().toString(36).substring(2, 9) + Date.now().toString(36),
    linkedQuotationId: primaryQuote.id,
    linkedQuotationIds: linkedIds,
    projectTitle,
    createdBy: currentUser?.name || primaryQuote.salesPerson || 'Adel',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    contract: {
      contractNo: generateContractNumber(seqNum, year),
      projectCode: generateProjectCode(seqNum, year),
      dateOfIssuance: today,
      quotationRef,
      clientName,
      emiratesId: customer?.emiratesId || '',
      siteLocation: primaryQuote.address || customer?.address || '',
      mobileNo: customer?.phone || '',
      officialEmail: customer?.email || '',
      contractValue: combinedTotal,
      vatPct: primaryQuote.vatPct ?? settings.tax ?? 5,
      currency: primaryQuote.currency || settings.currency || 'AED',
      contractorSignatoryName: settings.authorizedSignatoryName || currentUser?.name || 'Adel',
      contractorSignatoryTitle:
        settings.authorizedSignatoryTitle || currentUser?.role || 'Managing Director',
      contractorSignDate: today,
      clientSignDate: '',
      status: 'Draft',
      terms: {
        ...baseTerms,
        stage1Pct,
        stage2Pct,
        stage3Pct,
      },
    },
    sampleConfirmations: [createBlankSampleConfirmation(1, clientName, settings, currentUser)],
    variationOrders: [],
    finishCertificates: [
      createBlankFinishCertificate(1, clientName, settings, currentUser, initialWorks),
    ],
    progressionReports: [],
  };
}

export function createDocumentSuiteFromQuotation(
  quote: Quotation,
  customer: Customer | undefined,
  settings: CompanySettings,
  seqNum: number,
  currentUser?: UserProfile
): ProjectDocumentSuite {
  return createDocumentSuiteFromQuotations(
    [quote],
    customer ? [customer] : [],
    settings,
    seqNum,
    currentUser
  );
}

export function syncSuiteWithLinkedQuotations(
  suite: ProjectDocumentSuite,
  allQuotes: Quotation[],
  customers: Customer[],
  overrideQuoteIds?: string[]
): ProjectDocumentSuite {
  const targetIds = overrideQuoteIds ?? getLinkedQuotationIds(suite);
  const matchedQuotes = targetIds
    .map((id) => allQuotes.find((q) => q.id === id))
    .filter((q): q is Quotation => Boolean(q));

  if (matchedQuotes.length === 0) {
    return {
      ...suite,
      linkedQuotationId: undefined,
      linkedQuotationIds: [],
    };
  }

  const primary = matchedQuotes[0];
  const cust = customers.find((item) => item.id === primary.customerId);
  const combinedTotal =
    Math.round(matchedQuotes.reduce((sum, q) => sum + (Number(q.total) || 0), 0) * 100) / 100;
  const quotationRef = matchedQuotes
    .map((q) => q.quoteNo)
    .filter(Boolean)
    .join(', ');

  const extractedStages = extractStagePercentagesFromQuote(
    primary.paymentTerms,
    suite.contract.terms
  );

  return {
    ...suite,
    linkedQuotationId: primary.id,
    linkedQuotationIds: matchedQuotes.map((q) => q.id),
    contract: {
      ...suite.contract,
      quotationRef,
      clientName: suite.contract.clientName || cust?.name || primary.customerName || '',
      emiratesId: suite.contract.emiratesId || cust?.emiratesId || '',
      siteLocation: suite.contract.siteLocation || primary.address || cust?.address || '',
      mobileNo: suite.contract.mobileNo || cust?.phone || '',
      officialEmail: suite.contract.officialEmail || cust?.email || '',
      contractValue: combinedTotal,
      vatPct: primary.vatPct ?? suite.contract.vatPct,
      currency: primary.currency || suite.contract.currency,
      terms: extractedStages.matched
        ? {
            ...suite.contract.terms,
            stage1Pct: extractedStages.stage1Pct,
            stage2Pct: extractedStages.stage2Pct,
            stage3Pct: extractedStages.stage3Pct,
          }
        : suite.contract.terms,
    },
  };
}

export function createStandaloneDocumentSuite(
  settings: CompanySettings,
  seqNum: number,
  currentUser?: UserProfile
): ProjectDocumentSuite {
  const today = new Date().toISOString().split('T')[0];
  const year = new Date().getFullYear();
  const baseTerms = resolveContractTerms(settings);

  return {
    id: 'suite_' + Math.random().toString(36).substring(2, 9) + Date.now().toString(36),
    linkedQuotationIds: [],
    projectTitle: 'New Joinery & Interior Fit-Out Project',
    createdBy: currentUser?.name || 'Adel',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    contract: {
      contractNo: generateContractNumber(seqNum, year),
      projectCode: generateProjectCode(seqNum, year),
      dateOfIssuance: today,
      quotationRef: `QTN-${year}-`,
      clientName: '',
      emiratesId: '',
      siteLocation: '',
      mobileNo: '',
      officialEmail: '',
      contractValue: 0,
      vatPct: settings.tax ?? 5,
      currency: settings.currency || 'AED',
      contractorSignatoryName: settings.authorizedSignatoryName || currentUser?.name || 'Adel',
      contractorSignatoryTitle:
        settings.authorizedSignatoryTitle || currentUser?.role || 'Managing Director',
      contractorSignDate: today,
      clientSignDate: '',
      status: 'Draft',
      terms: baseTerms,
    },
    sampleConfirmations: [createBlankSampleConfirmation(1, '', settings, currentUser)],
    variationOrders: [],
    finishCertificates: [createBlankFinishCertificate(1, '', settings, currentUser)],
    progressionReports: [],
  };
}

export function calculateVoTotals(vo: VariationOrderDocument) {
  const base = Math.max(0, Number(vo.voCostExclVat) || 0);
  const vatPct = Math.max(0, Number(vo.vatPct) || 0);
  const vatAmount = Math.round(base * (vatPct / 100) * 100) / 100;
  const totalInclVat = Math.round((base + vatAmount) * 100) / 100;
  return { base, vatAmount, totalInclVat };
}

export function calculateSuiteFinancials(suite: ProjectDocumentSuite) {
  const originalContract = Math.max(0, Number(suite.contract.contractValue) || 0);
  const totalVoAll = (suite.variationOrders || []).reduce(
    (sum, vo) => sum + calculateVoTotals(vo).totalInclVat,
    0
  );
  const totalVoApproved = (suite.variationOrders || [])
    .filter((vo) => vo.status === 'Approved')
    .reduce((sum, vo) => sum + calculateVoTotals(vo).totalInclVat, 0);
  const revisedTotalAll = Math.round((originalContract + totalVoAll) * 100) / 100;
  const revisedTotalApproved = Math.round((originalContract + totalVoApproved) * 100) / 100;
  return {
    originalContract,
    totalVoAll,
    totalVoApproved,
    revisedTotalAll,
    revisedTotalApproved,
  };
}

/**
 * Compresses an uploaded image file to a lightweight JPEG data URL for fast multi-device storage & crisp printing.
 */
export function compressImageFile(file: File, maxDimension = 640, quality = 0.82): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Failed to read image file.'));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error('Invalid image file.'));
      img.onload = () => {
        let { width, height } = img;
        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          } else {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(reader.result as string);
          return;
        }
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, width, height);
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', quality));
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  });
}
