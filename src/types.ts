export interface Product {
  id: string;
  code: string;
  desc: string;
  category: string;
  unit: string;
  price: number; // Unit Cost / Catalog Price
  tax: number; // VAT %
  notes?: string;
}

export interface Customer {
  id: number;
  name: string;
  email?: string;
  phone?: string;
  address: string;
  trn?: string;
  emiratesId?: string;
  notes?: string;
}

export interface CategoryRowItem {
  id: string;
  productId?: string;
  productCode?: string;
  desc: string;
  qty: number;
  cost: number;
  unit?: string;
}

export interface ScopeCategory {
  id: string;
  name: string;
  rows: CategoryRowItem[];
}

export interface ScopeItem {
  id: string;
  name: string;
  description?: string; // Scope specifications/description for quotation
  qty: number;
  unit: string;
  clientPrice: number | null; // manual client unit price override; if null/undefined, uses suggested price
  photoUrl?: string; // Reference visual / 3D render / shop drawing / elevation photo for this specific scope
  photoCaption?: string; // Caption or drawing reference (e.g. "Elevation & Detail Drawing WD-01")
  categories: ScopeCategory[];
}

export type QuoteStatus = 'Draft' | 'Sent' | 'Approved' | 'Rejected';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: string;
  avatarInitials?: string;
  password?: string;
  isAdmin?: boolean;
  lastLogin?: string;
}

export interface PrintAuditLog {
  id: string;
  timestamp: string;
  quoteNo: string;
  customerName: string;
  project: string;
  totalAmount: number;
  currency: string;
  printedByUserId: string;
  printedByUserName: string;
  printedByUserEmail: string;
  actionType: 'print' | 'pdf_download';
  emailNotificationSent: boolean;
  emailNotificationError?: string;
}

export interface EmailSettings {
  smtpHost?: string;
  smtpPort?: number;
  smtpUser?: string;
  smtpPass?: string;
  smtpSecure?: boolean;
  recipientEmail?: string; // defaults to adel.tow.2026@gmail.com
  enableAlerts?: boolean;
}

export interface Quotation {
  id: string;
  quoteNo: string;
  customerId: number;
  customerName?: string;
  project: string;
  address: string;
  date: string;
  validUntil: string;
  salesPerson: string;
  currency: string;
  notes: string;
  paymentTerms?: string;
  completionTerms?: string;
  terms?: string;
  templatePhotoUrl?: string; // Reference drawing / 3D visual / key plan
  templatePhotoCaption?: string;
  scopes: ScopeItem[];
  subtotal: number;
  vatPct: number;
  vatAmount: number;
  total: number;
  status: QuoteStatus;
  createdAt: string;
  updatedAt: string;
}

export interface BankDetails {
  accountName: string;
  bankName: string;
  currency: string;
  iban: string;
  swift: string;
  accountNumber: string;
}

// ==========================================
// Project Document Suite (NOV Version)
// ==========================================

export type DocumentStatus = 'Draft' | 'Sent' | 'Signed';

export interface ContractTermsConfig {
  // Payment milestone percentages (Clause 4.1)
  stage1Pct: number; // default 60
  stage2Pct: number; // default 30
  stage3Pct: number; // default 10

  // Project & Operational Timelines (Editable per contract)
  clientItemsAdvanceDays: number; // Clause 1.2: 10 working days
  shopDrawingMinDays: number; // Clause 2.2: 10 working days
  shopDrawingMaxDays: number; // Clause 2.2: 15 working days
  includedRevisionRounds: number; // Clause 2.2: 2 rounds (Rev 01 & 02)
  sampleOptionsMin: number; // Clause 2.3: 2 options
  sampleOptionsMax: number; // Clause 2.3: 3 options
  sampleSignOffDays: number; // Clause 2.4 & 3.2: 3 working days
  otherDocsSignOffDays: number; // Clause 2.4: 4 working days
  finalNoticeDefaultDays: number; // Clause 2.4: 3 working days
  priceEscalationDelayDays: number; // Clause 3.2: 5 working days
  paymentSuspensionDays: number; // Clause 4.2: 7 calendar days
  completionMinDays: number; // Clause 6.1: 45 working days
  completionMaxDays: number; // Clause 6.1: 90 working days
  readinessConfirmDays: number; // Clause 6.3: 3 working days
  snagReportDays: number; // Clause 7.1 & 7.2: 3 working days
  snagRectificationDays: number; // Finish Certificate: 10 working days
  abandonmentDefaultDays: number; // Clause 10.3: 21 calendar days
  abandonmentFinalNoticeDays: number; // Clause 10.3: 7 days
  cancellationSettlementDays: number; // Clause 12.2: 7 calendar days
  disputeAmicableDays: number; // Clause 15.2: 30 days

  // Fixed Contractual Fees & Warranty (Admin-Only Protected)
  clientSuppliedMarkupPct: number; // Clause 1.2: 15%
  additionalRevisionFee: number; // Clause 2.2: AED 450
  extraSampleSessionFee: number; // Clause 2.3: AED 350
  extraCustomSampleFee: number; // Clause 2.3: AED 300
  sampleSiteDeliveryFee: number; // Clause 4.3: AED 200
  postAcceptanceCalloutFee: number; // Clause 4.3: AED 350
  abortedSiteVisitFee: number; // Clause 4.3: AED 850
  factoryStorageDailyFee: number; // Clause 4.3, 6.3, 10.3: AED 150
  factoryStorageFreeDays: number; // Clause 4.3, 6.3, 10.3: 7 calendar days
  voScopeCeiling: number; // Clause 9.2: AED 10,000
  warrantyYears: number; // Clause 11.1: 2 years
  cancellationFeePct: number; // Clause 12.2: 15%
  liabilityCapPct: number; // Clause 13.2: 15%
}

export interface ContractDocumentData {
  contractNo: string;
  projectCode: string;
  dateOfIssuance: string;
  quotationRef: string;
  clientName: string;
  emiratesId: string;
  siteLocation: string;
  mobileNo: string;
  officialEmail: string;
  contractValue: number; // inclusive of VAT
  vatPct: number;
  currency: string;
  contractorSignatoryName: string;
  contractorSignatoryTitle: string;
  contractorSignDate: string;
  clientSignDate: string;
  stage1ClearedDate?: string; // Clause 6.1(a): Stage 1 advance payment cleared date
  shopDrawingApprovedDate?: string; // Clause 6.1(b): Final shop drawings client sign-off date
  manualTargetCompletionDate?: string; // Optional manual override for target completion date
  status?: DocumentStatus;
  terms: ContractTermsConfig;
}

export interface SampleConfirmationRow {
  id: string;
  jyCode: string;
  roomArea: string;
  component: string;
  materialFinish: string;
  codeSlabId: string;
  technicalSpec: string;
  photoUrl?: string;
  photoFileName?: string;
  approvalNote: string;
}

export interface SampleConfirmationDocument {
  id: string;
  sampleId: string;
  drawingReference: string;
  dateIssued: string;
  deliveryMethod: 'office' | 'site' | 'none';
  deliveryDate: string;
  deliveryFee: number;
  rows: SampleConfirmationRow[];
  clientName: string;
  clientDate: string;
  contractorName: string;
  contractorPosition: string;
  contractorDate: string;
  status?: DocumentStatus;
  createdAt: string;
  updatedAt: string;
}

export interface VariationOrderItem {
  id: string;
  description: string;
}

export interface VariationOrderDocument {
  id: string;
  voNo: string;
  issuedBy: 'Contractor' | 'Client';
  dateIssued: string;
  originRequestedBy: 'Client' | 'Contractor';
  requestDate: string;
  referenceDrawings: string;
  items: VariationOrderItem[];
  voCostExclVat: number;
  vatPct: number;
  originalCompletionDate: string;
  additionalWorkingDays: number;
  revisedCompletionDate: string;
  notesAttachments: string;
  status: 'Draft' | 'Pending' | 'Approved';
  clientName: string;
  clientDate: string;
  contractorDate: string;
  createdAt: string;
  updatedAt: string;
}

export interface FinishCertificateWorkItem {
  id: string;
  reference: string;
  completed: boolean;
}

export interface DocumentPhotoItem {
  id: string;
  photoUrl: string;
  fileName?: string;
  caption: string;
  area?: string;
}

export interface FinishCertificateSnagItem {
  id: string;
  description: string;
  rectificationBy: string;
  responsible: 'Contractor' | 'Client';
  photoUrl?: string;
  photoFileName?: string;
}

export interface FinishCertificateDocument {
  id: string;
  fcNo: string;
  installationCompletionDate: string;
  completedWorks: FinishCertificateWorkItem[];
  snagItems: FinishCertificateSnagItem[];
  completionPhotos?: DocumentPhotoItem[];
  acceptanceMethod: 'none' | 'signed_emailed' | 'email' | 'whatsapp';
  acceptanceDate: string;
  acceptanceEvidence: string;
  clientName: string;
  clientDate: string;
  contractorName: string;
  contractorPosition: string;
  contractorDate: string;
  status?: DocumentStatus;
  createdAt: string;
  updatedAt: string;
}

export type ProgressionStage =
  | 'Shop Drawings'
  | 'Material Procurement'
  | 'Factory Production'
  | 'Painting & Finishing'
  | 'QC & Packing'
  | 'Site Delivery'
  | 'Site Installation'
  | 'Completed';

export interface ProjectProgressionRow {
  id: string;
  jyCode: string;
  roomArea: string;
  component: string;
  stage: ProgressionStage;
  progressPct: number;
  startDate: string;
  targetDate: string;
  remarks: string;
  photoUrl?: string;
  photoFileName?: string;
}

export interface ProjectProgressionDocument {
  id: string;
  reportNo: string;
  reportDate: string;
  reportPeriod: string;
  productionStartDate: string;
  siteInstallationStartDate: string;
  targetCompletionDate: string;
  overallStatus:
    | 'Engineering & Drawings'
    | 'In Production'
    | 'Ready for Dispatch'
    | 'Site Installation'
    | 'Finishing & Snagging'
    | 'Completed';
  executiveSummary: string;
  rows: ProjectProgressionRow[];
  progressPhotos?: DocumentPhotoItem[];
  preparedByName: string;
  preparedByPosition: string;
  preparedDate: string;
  status?: DocumentStatus;
  createdAt: string;
  updatedAt: string;
}

export interface ProjectDocumentSuite {
  id: string;
  linkedQuotationId?: string;
  linkedQuotationIds?: string[];
  projectTitle: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  contract: ContractDocumentData;
  sampleConfirmations: SampleConfirmationDocument[];
  variationOrders: VariationOrderDocument[];
  finishCertificates: FinishCertificateDocument[];
  progressionReports?: ProjectProgressionDocument[];
}

export interface UaeHolidayItem {
  id: string;
  date: string; // YYYY-MM-DD
  name: string;
}

export interface CompanySettings {
  name: string;
  logoText?: string;
  logoUrl?: string;
  phone: string;
  email: string;
  address: string;
  trn?: string;
  website?: string;
  tax: number; // default VAT %
  currency: string; // default currency e.g. "AED"
  quotePrefix?: string; // default quotation prefix e.g. "QT" or "TOW-QT"
  overheadPct: number; // default 30%
  markupPct: number; // default 40%
  completionTerms?: string;
  paymentTerms?: string;
  bankDetails?: BankDetails;
  defaultNotes?: string;
  defaultTerms?: string;
  emailAlerts?: EmailSettings;
  authorizedSignatoryName?: string;
  authorizedSignatoryTitle?: string;
  contractDefaults?: Partial<ContractTermsConfig>;
  uaePublicHolidays?: UaeHolidayItem[];
}

export interface AppDatabase {
  customers: Customer[];
  library: Product[];
  quotes: Quotation[];
  draft: Quotation | null;
  settings: CompanySettings;
  users: UserProfile[];
  currentUserId: string;
  nextQuote: number;
  nextCustomer: number;
  nextContract?: number;
  documentSuites?: ProjectDocumentSuite[];
  printLogs?: PrintAuditLog[];
}

declare module 'html2pdf.js';

