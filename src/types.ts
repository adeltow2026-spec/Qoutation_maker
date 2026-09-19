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
  overheadPct: number; // default 30%
  markupPct: number; // default 40%
  completionTerms?: string;
  paymentTerms?: string;
  bankDetails?: BankDetails;
  defaultNotes?: string;
  defaultTerms?: string;
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
}

declare module 'html2pdf.js';
