import React, { useState, useEffect, useRef } from 'react';
import {
  Quotation,
  ScopeItem,
  ScopeCategory,
  CategoryRowItem,
  Customer,
  Product,
  CompanySettings,
  UserProfile,
} from '../types';
import {
  formatMoney,
  createBlankScope,
  createBlankCategory,
  createBlankRow,
  calculateScopeDirectCost,
  calculateScopeOverhead,
  calculateScopeProductionCost,
  calculateScopeSuggestedPrice,
  getScopeFinalUnitPrice,
  calculateScopeLineTotal,
  calculateQuotationTotals,
  calculateCategoryTotal,
  CATEGORY_THEMES,
} from '../utils/formatters';
import { ProductPickerModal } from '../components/ProductPickerModal';
import { FormattedDescription } from '../components/FormattedDescription';
import { InternalCostingSpreadsheet } from '../components/InternalCostingSpreadsheet';
import {
  Plus,
  Trash2,
  Package,
  Layers,
  FileDown,
  Save,
  RotateCcw,
  Building2,
  Calendar,
  DollarSign,
  User,
  HelpCircle,
  ArrowRight,
  Printer,
  ChevronRight,
  Tag,
  AlignLeft,
  Image as ImageIcon,
  Upload,
  Check,
  UserCheck,
  Clock,
  FileCheck2,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

export const DEFAULT_COMMERCIAL_CLAUSE =
  '• Material Availability & Market Fluctuation: Market availability is highly fluctuated; please decide promptly on existing materials.\n• Price Validity & Delay in Confirmation: If the client\'s decision or confirmation is delayed, the contractor shall adjust the price according to prevailing market rates upon contract signing, due to high market price fluctuations and supplier stock availability.\n• Design & Sample Approvals: Delays in confirming the design and approved physical samples directly cause an increase in the quotation invoice and affect delivery schedules.';

interface QuotationEditorViewProps {
  initialQuotation: Quotation;
  customers: Customer[];
  products: Product[];
  settings: CompanySettings;
  users?: UserProfile[];
  currentUserId?: string;
  onOpenUserModal?: () => void;
  onSaveQuotation: (quote: Quotation) => void;
  onSaveDraft: (quote: Quotation) => void;
  onReset: () => void;
  onOpenCustomerModal: () => void;
  onOpenProductModal: () => void;
  onPrintQuote: (quote: Quotation) => void;
}

export const QuotationEditorView: React.FC<QuotationEditorViewProps> = ({
  initialQuotation,
  customers,
  products,
  settings,
  users = [],
  currentUserId,
  onOpenUserModal,
  onSaveQuotation,
  onSaveDraft,
  onReset,
  onOpenCustomerModal,
  onOpenProductModal,
  onPrintQuote,
}) => {
  const resolveQuoteDefaults = (sourceQuote: Quotation): Quotation => {
    const hasDuplicatePaymentText = Boolean(
      sourceQuote.notes &&
        (sourceQuote.notes.includes('Payment Terms:') || sourceQuote.notes.includes('60% in advance')) &&
        sourceQuote.notes.includes('Completion of Works')
    );

    const cleanNotes = hasDuplicatePaymentText
      ? (settings.defaultNotes || DEFAULT_COMMERCIAL_CLAUSE)
      : (sourceQuote.notes ?? settings.defaultNotes ?? DEFAULT_COMMERCIAL_CLAUSE);

    return {
      ...sourceQuote,
      notes: cleanNotes,
      paymentTerms:
        sourceQuote.paymentTerms ??
        settings.paymentTerms ??
        '1. 60% Advance Payment along with signed quotation & order confirmation\n2. 30% Upon completion of factory joinery fabrication & progressive painting\n3. 10% Prior to final site delivery and handover',
      completionTerms:
        sourceQuote.completionTerms ??
        settings.completionTerms ??
        '20 Working Days from receipt of Advance Payment, approved shop drawings, and final site dimensions.',
      terms: sourceQuote.terms ?? settings.defaultTerms ?? '',
    };
  };

  const [quote, setQuote] = useState<Quotation>(() => resolveQuoteDefaults(initialQuotation));
  const [activeTab, setActiveTab] = useState<'internal' | 'client'>('internal');
  const [showCustomTerms, setShowCustomTerms] = useState(false);
  
  // Salesperson state
  const defaultSalesPerson =
    users.find((u) => u.id === currentUserId)?.name ||
    initialQuotation.salesPerson ||
    'Adel';

  const [salesPersonMode, setSalesPersonMode] = useState<string>(
    initialQuotation.salesPerson || defaultSalesPerson
  );
  const [salesPersonCustom, setSalesPersonCustom] = useState<string>('');

  // Modal for adding from library
  const [pickerModalOpen, setPickerModalOpen] = useState(false);
  const [pickerTarget, setPickerTarget] = useState<{ scopeIndex: number; catIndex: number } | null>(null);

  // Sync when initial quote changes (e.g. loaded from list)
  useEffect(() => {
    setQuote(resolveQuoteDefaults(initialQuotation));
    const existingUser = users.find((u) => u.name === initialQuotation.salesPerson);
    if (existingUser) {
      setSalesPersonMode(existingUser.name);
      setSalesPersonCustom('');
    } else if (
      initialQuotation.salesPerson === 'Adel' ||
      initialQuotation.salesPerson === 'Sales Team' ||
      initialQuotation.salesPerson === 'Admin User'
    ) {
      setSalesPersonMode(initialQuotation.salesPerson);
      setSalesPersonCustom('');
    } else if (initialQuotation.salesPerson) {
      setSalesPersonMode('Other');
      setSalesPersonCustom(initialQuotation.salesPerson);
    } else {
      const activeName = users.find((u) => u.id === currentUserId)?.name || 'Adel';
      setSalesPersonMode(activeName);
      setSalesPersonCustom('');
    }
  }, [initialQuotation, users, currentUserId]);

  // Per-scope photo upload handlers
  const handleScopePhotoUpload = (scopeIndex: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      alert('Please select an image under 5MB.');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        handleUpdateScopeField(scopeIndex, 'photoUrl', reader.result as string);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveScopePhoto = (scopeIndex: number) => {
    setQuote((prev) => {
      const nextScopes = [...prev.scopes];
      nextScopes[scopeIndex] = {
        ...nextScopes[scopeIndex],
        photoUrl: '',
        photoCaption: '',
      };
      return { ...prev, scopes: nextScopes };
    });
  };

  const [overheadPct, setOverheadPct] = useState<number>(settings.overheadPct ?? 30);
  const [markupPct, setMarkupPct] = useState<number>(settings.markupPct ?? 40);
  const [expandedSpecs, setExpandedSpecs] = useState<Record<number, boolean>>({});

  const toggleScopeSpecs = (idx: number) => {
    setExpandedSpecs((prev) => ({ ...prev, [idx]: !prev[idx] }));
  };

  const vatPct = quote.vatPct ?? settings.tax ?? 5;

  // Calculate live financial summary
  const totals = calculateQuotationTotals(quote.scopes, vatPct, overheadPct, markupPct);

  // Update customer and auto-populate address if customer changes
  const handleCustomerChange = (customerId: number) => {
    const cust = customers.find((c) => c.id === customerId);
    setQuote((prev) => ({
      ...prev,
      customerId,
      customerName: cust?.name || '',
      address: cust?.address || prev.address,
    }));
  };

  // Scope mutations
  const handleAddScope = () => {
    const newScope = createBlankScope(`Scope Item ${quote.scopes.length + 1}`);
    setQuote((prev) => ({
      ...prev,
      scopes: [...prev.scopes, newScope],
    }));
  };

  const handleDeleteScope = (scopeIndex: number) => {
    if (quote.scopes.length <= 1) {
      alert('A quotation must contain at least one scope item.');
      return;
    }
    setQuote((prev) => ({
      ...prev,
      scopes: prev.scopes.filter((_, i) => i !== scopeIndex),
    }));
  };

  const handleUpdateScopeField = (
    scopeIndex: number,
    field: keyof ScopeItem,
    value: any
  ) => {
    setQuote((prev) => {
      const nextScopes = [...prev.scopes];
      nextScopes[scopeIndex] = {
        ...nextScopes[scopeIndex],
        [field]: value,
      };
      return { ...prev, scopes: nextScopes };
    });
  };

  // Category mutations
  const handleAddCategory = (scopeIndex: number) => {
    setQuote((prev) => {
      const nextScopes = [...prev.scopes];
      const targetScope = { ...nextScopes[scopeIndex] };
      targetScope.categories = [
        ...targetScope.categories,
        createBlankCategory(`Category ${targetScope.categories.length + 1}`),
      ];
      nextScopes[scopeIndex] = targetScope;
      return { ...prev, scopes: nextScopes };
    });
  };

  const handleDeleteCategory = (scopeIndex: number, catIndex: number) => {
    setQuote((prev) => {
      const nextScopes = [...prev.scopes];
      const targetScope = { ...nextScopes[scopeIndex] };
      if (targetScope.categories.length <= 1) {
        alert('Each scope must have at least one category.');
        return prev;
      }
      targetScope.categories = targetScope.categories.filter((_, i) => i !== catIndex);
      nextScopes[scopeIndex] = targetScope;
      return { ...prev, scopes: nextScopes };
    });
  };

  const handleUpdateCategoryName = (scopeIndex: number, catIndex: number, name: string) => {
    setQuote((prev) => {
      const nextScopes = [...prev.scopes];
      const targetScope = { ...nextScopes[scopeIndex] };
      const targetCats = [...targetScope.categories];
      targetCats[catIndex] = { ...targetCats[catIndex], name };
      targetScope.categories = targetCats;
      nextScopes[scopeIndex] = targetScope;
      return { ...prev, scopes: nextScopes };
    });
  };

  // Row mutations
  const handleAddBlankRow = (scopeIndex: number, catIndex: number) => {
    setQuote((prev) => {
      const nextScopes = [...prev.scopes];
      const targetScope = { ...nextScopes[scopeIndex] };
      const targetCats = [...targetScope.categories];
      const targetRows = [...targetCats[catIndex].rows, createBlankRow('', 1, 0, 'pcs')];
      targetCats[catIndex] = { ...targetCats[catIndex], rows: targetRows };
      targetScope.categories = targetCats;
      nextScopes[scopeIndex] = targetScope;
      return { ...prev, scopes: nextScopes };
    });
  };

  const handleDeleteRow = (scopeIndex: number, catIndex: number, rowIndex: number) => {
    setQuote((prev) => {
      const nextScopes = [...prev.scopes];
      const targetScope = { ...nextScopes[scopeIndex] };
      const targetCats = [...targetScope.categories];
      if (targetCats[catIndex].rows.length <= 1) {
        // keep at least one row or reset it
        targetCats[catIndex].rows = [createBlankRow('', 1, 0, 'pcs')];
      } else {
        targetCats[catIndex].rows = targetCats[catIndex].rows.filter((_, i) => i !== rowIndex);
      }
      targetScope.categories = targetCats;
      nextScopes[scopeIndex] = targetScope;
      return { ...prev, scopes: nextScopes };
    });
  };

  const handleUpdateRowField = (
    scopeIndex: number,
    catIndex: number,
    rowIndex: number,
    field: keyof CategoryRowItem,
    value: any
  ) => {
    setQuote((prev) => {
      const nextScopes = [...prev.scopes];
      const targetScope = { ...nextScopes[scopeIndex] };
      const targetCats = [...targetScope.categories];
      const targetRows = [...targetCats[catIndex].rows];
      targetRows[rowIndex] = {
        ...targetRows[rowIndex],
        [field]: value,
      };
      targetCats[catIndex] = { ...targetCats[catIndex], rows: targetRows };
      targetScope.categories = targetCats;
      nextScopes[scopeIndex] = targetScope;
      return { ...prev, scopes: nextScopes };
    });
  };

  // Select item from library for a row (auto-fills description, unit, and unit cost!)
  const handleSelectProductForRow = (
    scopeIndex: number,
    catIndex: number,
    rowIndex: number,
    productId: string
  ) => {
    const prod = products.find((p) => p.id === productId);
    if (!prod) return;

    setQuote((prev) => {
      const nextScopes = [...prev.scopes];
      const targetScope = { ...nextScopes[scopeIndex] };
      const targetCats = [...targetScope.categories];
      const targetRows = [...targetCats[catIndex].rows];

      targetRows[rowIndex] = {
        ...targetRows[rowIndex],
        productId: prod.id,
        productCode: prod.code,
        desc: prod.desc,
        unit: prod.unit || 'pcs',
        cost: prod.price, // Automatically fill unit cost!
      };

      targetCats[catIndex] = { ...targetCats[catIndex], rows: targetRows };
      targetScope.categories = targetCats;
      nextScopes[scopeIndex] = targetScope;
      return { ...prev, scopes: nextScopes };
    });
  };

  // Open modal to add multiple library products into a category
  const handleOpenPickerForCategory = (scopeIndex: number, catIndex: number) => {
    setPickerTarget({ scopeIndex, catIndex });
    setPickerModalOpen(true);
  };

  // Handle items selected from the modal
  const handleInsertSelectedProducts = (selectedProducts: Product[]) => {
    if (!pickerTarget || selectedProducts.length === 0) return;
    const { scopeIndex, catIndex } = pickerTarget;

    setQuote((prev) => {
      const nextScopes = [...prev.scopes];
      const targetScope = { ...nextScopes[scopeIndex] };
      const targetCats = [...targetScope.categories];
      const currentRows = [...targetCats[catIndex].rows];

      // Filter out a single initial empty row if user hasn't typed anything
      const cleanedRows =
        currentRows.length === 1 && !currentRows[0].desc && currentRows[0].cost === 0
          ? []
          : currentRows;

      const newRows: CategoryRowItem[] = selectedProducts.map((prod) => ({
        id: 'row_' + Math.random().toString(36).substring(2, 9),
        productId: prod.id,
        productCode: prod.code,
        desc: prod.desc,
        qty: 1,
        cost: prod.price, // Auto-populated unit cost
        unit: prod.unit || 'pcs',
      }));

      targetCats[catIndex] = {
        ...targetCats[catIndex],
        rows: [...cleanedRows, ...newRows],
      };
      targetScope.categories = targetCats;
      nextScopes[scopeIndex] = targetScope;
      return { ...prev, scopes: nextScopes };
    });
  };

  // Form submission / saves
  const getCurrentQuotationPayload = (): Quotation => {
    const activeSalesPerson =
      salesPersonMode === 'Other' ? salesPersonCustom.trim() || 'Admin User' : salesPersonMode;

    return {
      ...quote,
      salesPerson: activeSalesPerson,
      subtotal: totals.subtotal,
      vatPct: totals.vatPct,
      vatAmount: totals.vatAmount,
      total: totals.grandTotal,
      updatedAt: new Date().toISOString(),
    };
  };

  const handleSave = () => {
    const payload = getCurrentQuotationPayload();
    if (!payload.quoteNo.trim()) {
      const prefix = settings.quotePrefix || 'QT';
      const seq = Math.floor(1000 + Math.random() * 9000);
      payload.quoteNo = `${prefix}-${new Date().getFullYear()}-${String(seq).padStart(5, '0')}`;
    }
    onSaveQuotation(payload);
  };

  const handleDraft = () => {
    const payload = getCurrentQuotationPayload();
    if (!payload.quoteNo.trim()) {
      const prefix = settings.quotePrefix || 'QT';
      const seq = Math.floor(1000 + Math.random() * 9000);
      payload.quoteNo = `${prefix}-${new Date().getFullYear()}-${String(seq).padStart(5, '0')}`;
    }
    onSaveDraft(payload);
  };

  const handlePrint = () => {
    const payload = getCurrentQuotationPayload();
    if (!payload.quoteNo.trim()) {
      const prefix = settings.quotePrefix || 'QT';
      const seq = Math.floor(1000 + Math.random() * 9000);
      payload.quoteNo = `${prefix}-${new Date().getFullYear()}-${String(seq).padStart(5, '0')}`;
    }
    onPrintQuote(payload);
  };

  const targetCategoryName =
    pickerTarget !== null
      ? `${quote.scopes[pickerTarget.scopeIndex]?.name || 'Scope'} → ${
          quote.scopes[pickerTarget.scopeIndex]?.categories[pickerTarget.catIndex]?.name || 'Category'
        }`
      : 'Category';

  return (
    <div className="p-2.5 sm:p-5 md:p-6 max-w-7xl mx-auto space-y-4 sm:space-y-6">
      {/* Quotation Header & Master Details Card */}
      <section className="bg-white rounded-xl shadow-sm border border-slate-200 p-3.5 sm:p-5 md:p-6 space-y-4 sm:space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 pb-3 sm:pb-4 gap-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-blue-50 text-blue-600 border border-blue-200 flex items-center justify-center font-bold">
              QT
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Quotation Information</h2>
              <p className="text-xs text-slate-500">Customer reference and validity details</p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center gap-1.5 sm:gap-2.5 bg-blue-50/70 px-3 py-1.5 rounded-xl border border-blue-200">
            <label htmlFor="quotation-number-input" className="text-xs font-bold text-blue-950 flex items-center gap-1 shrink-0">
              <span>Quotation No:</span>
              <span className="text-red-500">*</span>
            </label>
            <div className="flex items-center gap-1.5">
              <input
                id="quotation-number-input"
                type="text"
                value={quote.quoteNo}
                onChange={(e) => setQuote({ ...quote, quoteNo: e.target.value })}
                placeholder="e.g. QT-2026-00045"
                className="px-2.5 py-1 text-xs sm:text-sm font-mono font-extrabold text-blue-900 bg-white border border-blue-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-600 shadow-2xs min-w-[150px] sm:min-w-[170px]"
                title="Click to edit quotation reference number"
              />
              <button
                type="button"
                onClick={() => {
                  const seq = Math.floor(1000 + Math.random() * 9000);
                  const prefix = settings.quotePrefix || 'QT';
                  const generated = `${prefix}-${new Date().getFullYear()}-${String(seq).padStart(5, '0')}`;
                  setQuote({ ...quote, quoteNo: generated });
                }}
                title="Regenerate standard quotation number sequence"
                className="p-1.5 text-slate-500 hover:text-blue-700 hover:bg-blue-100 rounded-lg border border-blue-200 bg-white transition-colors cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Customer Selection */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold text-slate-700">
                Customer <span className="text-red-500">*</span>
              </label>
              <button
                type="button"
                onClick={onOpenCustomerModal}
                className="text-[11px] font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1"
              >
                <Plus className="w-3 h-3" /> New Customer
              </button>
            </div>
            <select
              value={quote.customerId}
              onChange={(e) => handleCustomerChange(Number(e.target.value))}
              className="w-full px-3 py-2 text-xs font-medium bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
            >
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Project Reference */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Project / Job Reference
            </label>
            <input
              type="text"
              value={quote.project}
              onChange={(e) => setQuote({ ...quote, project: e.target.value })}
              placeholder="e.g. Marina Bay Tower - Glazing Package"
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
            />
          </div>

          {/* Currency */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">Currency</label>
            <select
              value={quote.currency}
              onChange={(e) => setQuote({ ...quote, currency: e.target.value })}
              className="w-full px-3 py-2 text-xs font-semibold bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
            >
              <option value="AED">AED — United Arab Emirates Dirham</option>
              <option value="USD">USD — US Dollar ($)</option>
              <option value="EUR">EUR — Euro (€)</option>
              <option value="GBP">GBP — British Pound (£)</option>
              <option value="SAR">SAR — Saudi Riyal</option>
              <option value="QAR">QAR — Qatari Riyal</option>
            </select>
          </div>

          {/* Address */}
          <div className="md:col-span-2">
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Customer Billing Address
            </label>
            <textarea
              rows={2}
              value={quote.address}
              onChange={(e) => setQuote({ ...quote, address: e.target.value })}
              placeholder="Street address, building, city, country..."
              className="w-full p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 resize-none"
            />
          </div>

          {/* Dates & Sales Rep */}
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">Quote Date</label>
                <input
                  type="date"
                  value={quote.date}
                  onChange={(e) => setQuote({ ...quote, date: e.target.value })}
                  className="w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">Valid Until</label>
                <input
                  type="date"
                  value={quote.validUntil}
                  onChange={(e) => setQuote({ ...quote, validUntil: e.target.value })}
                  className="w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-[11px] font-bold text-slate-600">Estimator / Sales Person</label>
                {onOpenUserModal && (
                  <button
                    type="button"
                    onClick={onOpenUserModal}
                    className="text-[10px] text-blue-600 hover:text-blue-800 font-semibold cursor-pointer"
                  >
                    Manage Team
                  </button>
                )}
              </div>
              <div className="flex gap-2">
                <select
                  value={salesPersonMode}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val === '__manage__') {
                      if (onOpenUserModal) onOpenUserModal();
                      return;
                    }
                    setSalesPersonMode(val);
                    if (val !== 'Other') {
                      setQuote((prev) => ({ ...prev, salesPerson: val }));
                    } else if (salesPersonCustom) {
                      setQuote((prev) => ({ ...prev, salesPerson: salesPersonCustom }));
                    }
                  }}
                  className="w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg font-medium"
                >
                  {users && users.length > 0 ? (
                    users.map((u) => (
                      <option key={u.id} value={u.name}>
                        {u.name} ({u.role})
                      </option>
                    ))
                  ) : (
                    <>
                      <option value="Adel">Adel (Managing Estimator)</option>
                      <option value="Touch Of Wood Sales Team">Touch Of Wood Sales Team</option>
                    </>
                  )}
                  <option value="Other">Custom Estimator Name...</option>
                  <option value="__manage__">⚙ Manage Team Members...</option>
                </select>
                {salesPersonMode === 'Other' && (
                  <input
                    type="text"
                    value={salesPersonCustom}
                    onChange={(e) => {
                      const val = e.target.value;
                      setSalesPersonCustom(val);
                      setQuote((prev) => ({ ...prev, salesPerson: val }));
                    }}
                    placeholder="Enter name"
                    className="w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg"
                  />
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Costing Workspace Tabs */}
      <section className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        {/* Tab Switcher */}
        <div className="flex border-b border-slate-200 bg-slate-50/70 px-2 sm:px-6 pt-2 sm:pt-3 overflow-x-auto no-scrollbar">
          <button
            type="button"
            onClick={() => setActiveTab('internal')}
            className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-5 py-2.5 sm:py-3 text-xs font-bold border-b-2 transition-all cursor-pointer shrink-0 ${
              activeTab === 'internal'
                ? 'border-blue-600 text-blue-700 bg-white rounded-t-lg shadow-xs'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-[10px] font-extrabold shrink-0">
              1
            </span>
            <span className="hidden sm:inline">Internal Costing &amp; Estimation (Sales &amp; Production)</span>
            <span className="sm:hidden">1. Scope Costing</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('client')}
            className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-5 py-2.5 sm:py-3 text-xs font-bold border-b-2 transition-all cursor-pointer shrink-0 ${
              activeTab === 'client'
                ? 'border-blue-600 text-blue-700 bg-white rounded-t-lg shadow-xs'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-[10px] font-extrabold shrink-0">
              2
            </span>
            <span className="hidden sm:inline">Client Quotation (Final Review &amp; Client Pricing)</span>
            <span className="sm:hidden">2. Client Quote</span>
          </button>
        </div>

        {/* Tab 1: Internal Costing & Estimation (Option 1: Classic Hierarchical WBS Excel Sheet) */}
        {activeTab === 'internal' && (
          <InternalCostingSpreadsheet
            quote={quote}
            products={products}
            overheadPct={overheadPct}
            setOverheadPct={setOverheadPct}
            markupPct={markupPct}
            setMarkupPct={setMarkupPct}
            expandedSpecs={expandedSpecs}
            toggleScopeSpecs={toggleScopeSpecs}
            onOpenPickerForCategory={handleOpenPickerForCategory}
            onAddScope={handleAddScope}
            onDeleteScope={handleDeleteScope}
            onUpdateScopeField={handleUpdateScopeField}
            onScopePhotoUpload={handleScopePhotoUpload}
            onRemoveScopePhoto={handleRemoveScopePhoto}
            onAddCategory={handleAddCategory}
            onDeleteCategory={handleDeleteCategory}
            onUpdateCategoryName={handleUpdateCategoryName}
            onAddBlankRow={handleAddBlankRow}
            onDeleteRow={handleDeleteRow}
            onUpdateRowField={handleUpdateRowField}
            onSelectProductForRow={handleSelectProductForRow}
          />
        )}

        {/* Tab 2: Client Quotation (Consolidated Line Items & Pricing) */}
        {activeTab === 'client' && (
          <div className="p-6 space-y-6">
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
              <h3 className="text-sm font-bold text-slate-900">Client-Facing Line Items</h3>
              <p className="text-xs text-slate-500 mt-1">
                Each internal scope is automatically consolidated into a professional line item.
                Your salesperson can accept the suggested price (inc. {overheadPct}% overheads and{' '}
                {markupPct}% markup) or manually override the final client rate below.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Client Items Table & Direct Commercial Notes in Tab 2 */}
              <div className="lg:col-span-2 space-y-4">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse bg-white rounded-lg border border-slate-200">
                  <thead>
                    <tr className="bg-slate-50 text-[11px] font-bold text-slate-600 uppercase tracking-wider border-b border-slate-200">
                      <th className="py-3 px-3 w-10 text-center">#</th>
                      <th className="py-3 px-3">Scope Description</th>
                      <th className="py-3 px-2 w-16 text-center">Qty</th>
                      <th className="py-3 px-2 w-16 text-center">Unit</th>
                      <th className="py-3 px-3 w-32 text-right">
                        Suggested Unit Price
                        <span className="block text-[10px] text-slate-400 font-normal">
                          (+{markupPct}% markup)
                        </span>
                      </th>
                      <th className="py-3 px-3 w-36 text-left">
                        Final Client Price
                        <span className="block text-[10px] text-emerald-600 font-normal">
                          (Manual Override)
                        </span>
                      </th>
                      <th className="py-3 px-3 w-28 text-right">Total ({quote.currency})</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs">
                    {quote.scopes.map((scope, scopeIndex) => {
                      const suggestedPrice = calculateScopeSuggestedPrice(
                        scope,
                        overheadPct,
                        markupPct
                      );
                      const finalUnitPrice = getScopeFinalUnitPrice(scope, overheadPct, markupPct);
                      const lineTotal = calculateScopeLineTotal(scope, overheadPct, markupPct);

                      return (
                        <tr key={scope.id} className="hover:bg-slate-50/70 transition-colors">
                          <td className="py-3 px-3 text-center font-bold text-slate-500">
                            {scopeIndex + 1}
                          </td>
                          <td className="py-3 px-3">
                            <div className="font-bold text-slate-900">{scope.name}</div>
                            {scope.description ? (
                              <div className="bg-slate-50/80 p-2 rounded-lg border border-slate-200/70 mt-1">
                                <FormattedDescription description={scope.description} />
                              </div>
                            ) : (
                              <div className="text-[11px] text-slate-400 italic mt-0.5">
                                No technical description added (will only print title)
                              </div>
                            )}

                            {/* Scope Photo Attached Preview in Tab 2 */}
                            {scope.photoUrl && (
                              <div className="mt-2 flex items-center gap-3 p-2 bg-slate-50/90 rounded-lg border border-slate-200 max-w-sm">
                                <div className="w-14 h-14 bg-white rounded border border-slate-200 overflow-hidden shrink-0 flex items-center justify-center p-0.5 shadow-2xs">
                                  <img
                                    src={scope.photoUrl}
                                    alt={scope.photoCaption || scope.name}
                                    className="max-h-full max-w-full object-contain"
                                    referrerPolicy="no-referrer"
                                  />
                                </div>
                                <div className="text-[10px] text-slate-600 min-w-0">
                                  <div className="font-bold text-slate-800 flex items-center gap-1">
                                    <ImageIcon className="w-3 h-3 text-amber-700 shrink-0" />
                                    Scope Visual Attached
                                  </div>
                                  <div className="text-slate-500 truncate mt-0.5" title={scope.photoCaption}>
                                    {scope.photoCaption || 'Reference drawing / photo'}
                                  </div>
                                </div>
                              </div>
                            )}

                            <div className="text-[10px] text-slate-400 mt-1.5 flex items-center gap-1">
                              <span className="font-semibold">Categories:</span>
                              {scope.categories.map((c) => c.name).filter(Boolean).join(' • ')}
                            </div>
                          </td>
                          <td className="py-3 px-2 text-center font-semibold text-slate-800">
                            {scope.qty}
                          </td>
                          <td className="py-3 px-2 text-center text-slate-600">{scope.unit}</td>
                          <td className="py-3 px-3 text-right font-mono text-slate-500">
                            {formatMoney(suggestedPrice)}
                          </td>
                          <td className="py-3 px-3">
                            <input
                              type="number"
                              dir="ltr"
                              min="0"
                              step="0.01"
                              value={
                                scope.clientPrice !== null && scope.clientPrice !== undefined
                                  ? scope.clientPrice
                                  : Number(suggestedPrice.toFixed(2))
                              }
                              onChange={(e) => {
                                const val = e.target.value;
                                handleUpdateScopeField(
                                  scopeIndex,
                                  'clientPrice',
                                  val === '' ? null : Math.max(0, parseFloat(val) || 0)
                                );
                              }}
                              placeholder={formatMoney(suggestedPrice)}
                              className="w-full px-2.5 py-1 text-xs font-mono font-bold text-left text-emerald-700 bg-emerald-50/50 border border-emerald-300 rounded focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                            />
                          </td>
                          <td className="py-3 px-3 text-right font-mono font-bold text-slate-900">
                            {formatMoney(lineTotal)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                  </table>
                </div>

                {/* Direct Commercial Notes Editor in Client Quotation Tab */}
                <div className="bg-blue-50/40 rounded-xl border border-blue-200/90 p-4 space-y-2.5">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <label className="text-xs font-bold text-blue-950 flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-blue-600"></span>
                      Commercial Notes &amp; Special Conditions (Printed on Client Quotation)
                    </label>
                    <span className="text-[10px] text-blue-700 font-bold bg-white px-2 py-0.5 rounded border border-blue-200">
                      Syncs with Print &amp; Bottom Section
                    </span>
                  </div>
                  <textarea
                    rows={4}
                    value={quote.notes}
                    onChange={(e) => setQuote({ ...quote, notes: e.target.value })}
                    placeholder="Enter special scope notes, market fluctuation conditions, sample approval remarks, site access requirements, or client instructions..."
                    className="w-full p-3 text-xs bg-white border border-blue-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 leading-relaxed text-slate-800 font-normal"
                  />
                  <div className="flex flex-wrap items-center justify-between gap-2 pt-0.5">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="text-[10px] text-slate-500 font-semibold">Quick Presets:</span>
                      <button
                        type="button"
                        onClick={() => setQuote((prev) => ({ ...prev, notes: DEFAULT_COMMERCIAL_CLAUSE }))}
                        className="px-2.5 py-1 text-[11px] bg-blue-600 hover:bg-blue-700 text-white rounded font-medium cursor-pointer shadow-2xs transition-colors"
                      >
                        Market Fluctuation &amp; Delay Clause
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          setQuote((prev) => ({
                            ...prev,
                            notes:
                              '• Material Availability: Market availability is highly fluctuated; please decide promptly on existing materials with supplier re-check.\n• Approval Timeline: Delay in confirming shop drawings and finish samples will cause price adjustments according to current supplier rates.',
                          }))
                        }
                        className="px-2 py-1 text-[11px] bg-white hover:bg-slate-100 text-slate-700 rounded border border-slate-300 font-medium cursor-pointer transition-colors"
                      >
                        Material &amp; Sample Notice
                      </button>
                    </div>
                    {quote.notes && (
                      <button
                        type="button"
                        onClick={() => setQuote((prev) => ({ ...prev, notes: '' }))}
                        className="text-[11px] text-red-600 hover:text-red-800 font-medium cursor-pointer"
                      >
                        Clear Notes
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Financial Calculation Summary Card */}
              <div className="bg-slate-50 rounded-xl border border-slate-200 p-5 space-y-4 h-fit">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Financial Summary
                </h4>

                <div className="space-y-2.5 text-xs">
                  <div className="flex justify-between text-slate-600">
                    <span>Subtotal:</span>
                    <span className="font-mono font-semibold text-slate-900">
                      {formatMoney(totals.subtotal)} {quote.currency}
                    </span>
                  </div>

                  <div className="flex justify-between items-center text-slate-600">
                    <div className="flex items-center gap-1.5">
                      <span>VAT:</span>
                      <input
                        type="number"
                        dir="ltr"
                        min="0"
                        step="0.1"
                        value={quote.vatPct}
                        onChange={(e) =>
                          setQuote({
                            ...quote,
                            vatPct: Math.max(0, parseFloat(e.target.value) || 0),
                          })
                        }
                        className="w-12 px-1.5 py-0.5 text-xs text-left font-mono bg-white border border-slate-300 rounded"
                      />
                      <span>%</span>
                    </div>
                    <span className="font-mono font-semibold text-slate-900">
                      {formatMoney(totals.vatAmount)} {quote.currency}
                    </span>
                  </div>

                  <div className="border-t-2 border-slate-300 pt-3 flex justify-between items-baseline font-bold text-slate-900">
                    <span className="text-sm">Grand Total:</span>
                    <div className="text-right">
                      <span className="text-xl font-mono text-blue-700">
                        {formatMoney(totals.grandTotal)}
                      </span>
                      <span className="text-xs text-slate-500 ml-1 font-semibold">
                        {quote.currency}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    type="button"
                    onClick={handlePrint}
                    className="w-full py-2.5 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-lg flex items-center justify-center gap-2 shadow-sm transition-colors cursor-pointer"
                  >
                    <Printer className="w-4 h-4" />
                    Preview &amp; Print Quotation
                  </button>
                </div>

                {/* Quick Commercial Notes & Terms Status in Tab 2 */}
                <div className="pt-2 border-t border-slate-200 space-y-1.5 text-xs">
                  <div className="flex items-center justify-between text-slate-700 font-bold">
                    <span className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-amber-600" />
                      Commercial Terms on Print
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        document.getElementById('commercial-terms-section')?.scrollIntoView({ behavior: 'smooth' });
                      }}
                      className="text-[10.5px] text-blue-600 hover:text-blue-800 font-semibold cursor-pointer"
                    >
                      Edit Below ↓
                    </button>
                  </div>
                  <div className="bg-white p-2.5 rounded-lg border border-slate-200 text-[11px] text-slate-600 space-y-1">
                    <div>
                      <span className="font-semibold text-slate-800">Payment: </span>
                      {quote.paymentTerms ? quote.paymentTerms.split('\n')[0] : 'Standard terms'}
                    </div>
                    <div>
                      <span className="font-semibold text-slate-800">Timeline: </span>
                      <span className="truncate inline-block max-w-[200px] align-bottom">
                        {quote.completionTerms || '20 Working Days'}
                      </span>
                    </div>
                    {quote.notes && (
                      <div className="truncate text-blue-800 font-medium">
                        <span className="font-semibold">Notes: </span>
                        {quote.notes}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </section>

      {/* Commercial Terms & Notes Section */}
      <section id="commercial-terms-section" className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="bg-slate-50 border-b border-slate-200 px-6 py-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-blue-50 text-blue-700 rounded-lg">
              <FileCheck2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Commercial Notes, Payment Terms &amp; Contract Conditions
              </h3>
              <p className="text-xs text-slate-500">
                All details entered here are directly printed onto the official quotation document &amp; PDF
              </p>
            </div>
          </div>

          {/* Quick Reset to Company Defaults */}
          <button
            type="button"
            onClick={() => {
              setQuote((prev) => ({
                ...prev,
                paymentTerms:
                  settings.paymentTerms ||
                  '1. 60% Advance Payment along with signed quotation & order confirmation\n2. 30% Upon completion of factory joinery fabrication & progressive painting\n3. 10% Prior to final site delivery and handover',
                completionTerms:
                  settings.completionTerms ||
                  '20 Working Days from receipt of Advance Payment, approved shop drawings, and final site dimensions.',
                notes: settings.defaultNotes || prev.notes,
                terms: settings.defaultTerms || prev.terms,
              }));
            }}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-300 rounded-lg shadow-2xs transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
            Reset to Company Defaults
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Box 1: Commercial Notes & Special Conditions */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-600"></span>
                  Commercial Notes &amp; Special Project Conditions
                </label>
                <span className="text-[10px] text-blue-700 uppercase font-bold bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                  Printed in Commercial Box
                </span>
              </div>

              {/* Warning banner if duplicate payment text is detected in notes */}
              {quote.notes &&
                (quote.notes.includes('Payment Terms:') || quote.notes.includes('60% in advance')) &&
                quote.notes.includes('Completion of Works') && (
                  <div className="p-2.5 bg-amber-50 border border-amber-300 rounded-lg flex items-center justify-between text-xs text-amber-900 gap-2">
                    <span>
                      <strong>Notice:</strong> Old duplicate payment terms found in this notes field.
                    </span>
                    <button
                      type="button"
                      onClick={() => setQuote((prev) => ({ ...prev, notes: DEFAULT_COMMERCIAL_CLAUSE }))}
                      className="px-2.5 py-1 text-[11px] bg-amber-600 hover:bg-amber-700 text-white font-bold rounded cursor-pointer whitespace-nowrap shadow-2xs"
                    >
                      Replace with Market Fluctuation Clause
                    </button>
                  </div>
                )}

              <textarea
                rows={5}
                value={quote.notes}
                onChange={(e) => setQuote({ ...quote, notes: e.target.value })}
                placeholder="Enter special scope notes, market fluctuation conditions, sample approval remarks, site access requirements, or client instructions..."
                className="w-full p-3 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 leading-relaxed font-normal"
              />

              {/* Quick Presets for Commercial Notes */}
              <div className="flex flex-wrap items-center justify-between gap-1.5 pt-0.5">
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="text-[10px] text-slate-400 font-semibold mr-0.5">Quick Presets:</span>
                  <button
                    type="button"
                    onClick={() => setQuote((prev) => ({ ...prev, notes: DEFAULT_COMMERCIAL_CLAUSE }))}
                    className="px-2.5 py-0.5 text-[10.5px] bg-blue-50 hover:bg-blue-100 text-blue-800 rounded border border-blue-300 font-semibold cursor-pointer shadow-2xs transition-colors"
                  >
                    Market Fluctuation &amp; Delay Clause
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setQuote((prev) => ({
                        ...prev,
                        notes:
                          '• Material Availability: Market availability is highly fluctuated; please decide promptly on existing materials with supplier re-check.\n• Approval Timeline: Delay in confirming shop drawings and finish samples will cause price adjustments according to current supplier rates.',
                      }))
                    }
                    className="px-2 py-0.5 text-[10.5px] bg-slate-100 hover:bg-slate-200 text-slate-700 rounded border border-slate-300 font-medium cursor-pointer transition-colors"
                  >
                    Material &amp; Sample Notice
                  </button>
                </div>
                {quote.notes && (
                  <button
                    type="button"
                    onClick={() => setQuote((prev) => ({ ...prev, notes: '' }))}
                    className="text-[10.5px] text-red-600 hover:text-red-800 font-medium cursor-pointer"
                  >
                    Clear Notes
                  </button>
                )}
              </div>
              <p className="text-[11px] text-slate-500">
                Custom commercial notes are highlighted in an elegant blue box on official quotation prints and PDFs.
              </p>
            </div>

            {/* Box 2: Payment Terms & Milestones */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-amber-600" />
                  Payment Terms &amp; Milestones
                </label>
                <span className="text-[10px] text-amber-700 uppercase font-bold bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                  Printed in Payment Box
                </span>
              </div>
              <textarea
                rows={5}
                value={quote.paymentTerms || ''}
                onChange={(e) => setQuote({ ...quote, paymentTerms: e.target.value })}
                placeholder="1. 60% Advance Payment...&#10;2. 30% Fabrication...&#10;3. 10% Delivery & Handover..."
                className="w-full p-3 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-600 leading-relaxed font-mono"
              />
              {/* Quick Presets */}
              <div className="flex flex-wrap items-center gap-1.5 pt-1">
                <span className="text-[10px] text-slate-400 font-semibold mr-1">Quick Presets:</span>
                <button
                  type="button"
                  onClick={() =>
                    setQuote((prev) => ({
                      ...prev,
                      paymentTerms:
                        '1. 60% Advance Payment along with signed quotation & order confirmation\n2. 30% Upon completion of factory joinery fabrication & progressive painting\n3. 10% Prior to final site delivery and handover',
                    }))
                  }
                  className="px-2 py-0.5 text-[10.5px] bg-slate-100 hover:bg-slate-200 text-slate-700 rounded border border-slate-300 font-medium cursor-pointer"
                >
                  60 / 30 / 10%
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setQuote((prev) => ({
                      ...prev,
                      paymentTerms:
                        '1. 50% Advance Payment upon contract signing & shop drawing approval\n2. 40% Progressive payment upon delivery of joinery items to project site\n3. 10% Final handover and completion certificate',
                    }))
                  }
                  className="px-2 py-0.5 text-[10.5px] bg-slate-100 hover:bg-slate-200 text-slate-700 rounded border border-slate-300 font-medium cursor-pointer"
                >
                  50 / 40 / 10%
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setQuote((prev) => ({
                      ...prev,
                      paymentTerms:
                        '1. 70% Advance Payment upon signed quotation confirmation\n2. 30% Prior to final site delivery and handover',
                    }))
                  }
                  className="px-2 py-0.5 text-[10.5px] bg-slate-100 hover:bg-slate-200 text-slate-700 rounded border border-slate-300 font-medium cursor-pointer"
                >
                  70 / 30%
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setQuote((prev) => ({
                      ...prev,
                      paymentTerms: '1. 100% Advance Payment along with confirmed purchase order.',
                    }))
                  }
                  className="px-2 py-0.5 text-[10.5px] bg-slate-100 hover:bg-slate-200 text-slate-700 rounded border border-slate-300 font-medium cursor-pointer"
                >
                  100% Advance
                </button>
              </div>
            </div>
          </div>

          {/* Box 3: Work Completion Timeline */}
          <div className="bg-amber-50/50 p-4 rounded-xl border border-amber-200/80 space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-amber-950 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-amber-700" />
                Completion of Works Schedule &amp; Production Timeline
              </label>
              <span className="text-[10px] text-amber-800 font-semibold">Printed on Bottom of Payment Box</span>
            </div>
            <input
              type="text"
              value={quote.completionTerms || ''}
              onChange={(e) => setQuote({ ...quote, completionTerms: e.target.value })}
              placeholder="e.g. 20 Working Days from receipt of Advance Payment, approved shop drawings, and final site dimensions."
              className="w-full px-3 py-2 text-xs bg-white border border-amber-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-600 text-slate-800 font-medium"
            />
          </div>

          {/* Box 4: Standard Contract Clauses & Terms */}
          <div className="border border-slate-200 rounded-xl overflow-hidden bg-slate-50/50">
            <button
              type="button"
              onClick={() => setShowCustomTerms((prev) => !prev)}
              className="w-full px-4 py-3 bg-slate-50 hover:bg-slate-100 text-left flex items-center justify-between cursor-pointer border-b border-slate-200/60"
            >
              <div className="flex items-center gap-2">
                <FileCheck2 className="w-4 h-4 text-slate-600" />
                <span className="text-xs font-bold text-slate-800">
                  Standard Terms &amp; Conditions (11 Contract Clauses)
                </span>
                <span className="text-[10px] px-2 py-0.5 bg-slate-200/80 text-slate-700 font-bold rounded">
                  {showCustomTerms ? 'Hide Customizer' : 'Click to Customize for this Quote'}
                </span>
              </div>
              {showCustomTerms ? <ChevronUp className="w-4 h-4 text-slate-500" /> : <ChevronDown className="w-4 h-4 text-slate-500" />}
            </button>

            {showCustomTerms && (
              <div className="p-4 bg-white space-y-2 border-t border-slate-200">
                <p className="text-[11px] text-slate-500">
                  Edit or add clauses specifically for this customer/quotation. Defaults to company standard terms.
                </p>
                <textarea
                  rows={8}
                  value={quote.terms || ''}
                  onChange={(e) => setQuote({ ...quote, terms: e.target.value })}
                  placeholder="1. Our offer covers only the scope of works...&#10;2. This Quotation Based on your key plan..."
                  className="w-full p-3 text-xs font-mono bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 leading-relaxed"
                />
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Sticky Bottom Action Bar */}
      <div className="sticky bottom-4 z-20 bg-white/95 backdrop-blur-md p-4 rounded-xl border border-slate-200 shadow-xl flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onReset}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
          >
            Cancel / New
          </button>
          <button
            type="button"
            onClick={handleDraft}
            className="px-4 py-2 text-xs font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg transition-colors cursor-pointer"
          >
            Save Draft
          </button>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handlePrint}
            className="px-4 py-2 text-xs font-bold text-slate-800 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" />
            Print / PDF
          </button>

          <button
            type="button"
            onClick={handleSave}
            className="px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-md shadow-blue-500/20 flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Save className="w-4 h-4" />
            Save &amp; Finalize Quotation
          </button>
        </div>
      </div>

      {/* Product Picker Modal */}
      <ProductPickerModal
        isOpen={pickerModalOpen}
        onClose={() => setPickerModalOpen(false)}
        products={products}
        onSelectProducts={handleInsertSelectedProducts}
        targetCategoryName={targetCategoryName}
        onOpenNewProductModal={onOpenProductModal}
        currency={quote.currency}
      />
    </div>
  );
};
