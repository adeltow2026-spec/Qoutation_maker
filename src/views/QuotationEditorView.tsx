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
} from 'lucide-react';

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
  const [quote, setQuote] = useState<Quotation>(initialQuotation);
  const [activeTab, setActiveTab] = useState<'internal' | 'client'>('internal');
  
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
    setQuote(initialQuotation);
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

  const overheadPct = settings.overheadPct ?? 30;
  const markupPct = settings.markupPct ?? 40;
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
    onSaveQuotation(payload);
  };

  const handleDraft = () => {
    const payload = getCurrentQuotationPayload();
    onSaveDraft(payload);
  };

  const handlePrint = () => {
    const payload = getCurrentQuotationPayload();
    onPrintQuote(payload);
  };

  const targetCategoryName =
    pickerTarget !== null
      ? `${quote.scopes[pickerTarget.scopeIndex]?.name || 'Scope'} → ${
          quote.scopes[pickerTarget.scopeIndex]?.categories[pickerTarget.catIndex]?.name || 'Category'
        }`
      : 'Category';

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Quotation Header & Master Details Card */}
      <section className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 space-y-5">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-blue-50 text-blue-600 border border-blue-200 flex items-center justify-center font-bold">
              QT
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Quotation Information</h2>
              <p className="text-xs text-slate-500">Customer reference and validity details</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-500">Quotation No:</span>
            <span className="px-3 py-1 bg-slate-100 text-slate-800 font-mono font-bold text-xs rounded-lg border border-slate-200">
              {quote.quoteNo}
            </span>
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
        <div className="flex border-b border-slate-200 bg-slate-50/70 px-6 pt-3">
          <button
            type="button"
            onClick={() => setActiveTab('internal')}
            className={`flex items-center gap-2 px-5 py-3 text-xs font-bold border-b-2 transition-all cursor-pointer ${
              activeTab === 'internal'
                ? 'border-blue-600 text-blue-700 bg-white rounded-t-lg shadow-xs'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-[10px] font-extrabold">
              1
            </span>
            Internal Costing &amp; Estimation (Sales &amp; Production)
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('client')}
            className={`flex items-center gap-2 px-5 py-3 text-xs font-bold border-b-2 transition-all cursor-pointer ${
              activeTab === 'client'
                ? 'border-blue-600 text-blue-700 bg-white rounded-t-lg shadow-xs'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-[10px] font-extrabold">
              2
            </span>
            Client Quotation (Final Review &amp; Client Pricing)
          </button>
        </div>

        {/* Tab 1: Internal Costing & Estimation */}
        {activeTab === 'internal' && (
          <div className="p-6 space-y-6">
            <div className="bg-blue-50/60 border border-blue-200/80 rounded-lg p-3.5 flex items-start gap-3 text-xs text-blue-900">
              <Layers className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">
                  Two-Click Product Library Integration &amp; Cost Auto-Calculation:
                </p>
                <p className="text-[11px] text-blue-700/90 mt-0.5">
                  Click <span className="font-bold underline">“＋ Add from Product Library”</span>{' '}
                  inside any category to pick items from your catalog with standard unit costs auto-filled.
                  Direct costs automatically compound with <strong>{overheadPct}% Overheads</strong> and{' '}
                  <strong>{markupPct}% Markup</strong>.
                </p>
              </div>
            </div>

            {/* List of Scope Items */}
            <div className="space-y-6">
              {quote.scopes.map((scope, scopeIndex) => {
                const directCost = calculateScopeDirectCost(scope);
                const overheadCost = calculateScopeOverhead(scope, overheadPct);
                const productionCost = calculateScopeProductionCost(scope, overheadPct);
                const suggestedPrice = calculateScopeSuggestedPrice(scope, overheadPct, markupPct);
                const finalUnitPrice = getScopeFinalUnitPrice(scope, overheadPct, markupPct);
                const scopeTotal = calculateScopeLineTotal(scope, overheadPct, markupPct);

                return (
                  <div
                    key={scope.id}
                    className="bg-slate-50/50 rounded-xl border border-slate-300 p-5 space-y-4 shadow-xs"
                  >
                    {/* Scope Header */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3.5 rounded-lg border border-slate-200">
                      <div className="flex-1 flex items-center gap-3">
                        <span className="w-7 h-7 rounded-md bg-slate-900 text-white flex items-center justify-center text-xs font-bold font-mono">
                          {scopeIndex + 1}
                        </span>
                        <input
                          type="text"
                          value={scope.name}
                          onChange={(e) =>
                            handleUpdateScopeField(scopeIndex, 'name', e.target.value)
                          }
                          placeholder="Scope Title (e.g. Aluminium Windows Package)"
                          className="font-bold text-sm text-slate-900 bg-transparent border-b border-dashed border-slate-300 focus:border-blue-600 focus:outline-none px-1 py-0.5 flex-1 min-w-[200px]"
                        />
                      </div>

                      <div className="flex items-center gap-3 flex-wrap sm:flex-nowrap">
                        <div className="flex items-center gap-1.5 text-xs text-slate-600 bg-slate-50 px-2.5 py-1 rounded border border-slate-200">
                          <span className="font-semibold">Scope Qty:</span>
                          <input
                            type="number"
                            dir="ltr"
                            min="0"
                            step="0.1"
                            value={scope.qty}
                            onChange={(e) =>
                              handleUpdateScopeField(
                                scopeIndex,
                                'qty',
                                Math.max(0, parseFloat(e.target.value) || 0)
                              )
                            }
                            className="w-16 px-1.5 py-0.5 text-xs font-mono font-bold text-left bg-white border border-slate-300 rounded"
                          />
                        </div>

                        <div className="flex items-center gap-1.5 text-xs text-slate-600 bg-slate-50 px-2.5 py-1 rounded border border-slate-200">
                          <span className="font-semibold">Unit:</span>
                          <input
                            type="text"
                            value={scope.unit}
                            onChange={(e) =>
                              handleUpdateScopeField(scopeIndex, 'unit', e.target.value)
                            }
                            placeholder="Lot / m²"
                            className="w-16 px-1.5 py-0.5 text-xs font-bold text-slate-800 bg-white border border-slate-300 rounded"
                          />
                        </div>

                        <button
                          type="button"
                          onClick={() => handleDeleteScope(scopeIndex)}
                          title="Delete Scope"
                          className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Scope Description & Specifications Panel (Reflected in Quotation) */}
                    <div className="bg-white rounded-lg border border-slate-200 p-3.5 space-y-2.5 shadow-2xs">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                          <AlignLeft className="w-4 h-4 text-blue-600" />
                          <span>Scope Description / Technical Specifications</span>
                        </label>
                        <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                          Printed on Client Quotation
                        </span>
                      </div>

                      <textarea
                        rows={3}
                        value={scope.description || ''}
                        onChange={(e) =>
                          handleUpdateScopeField(scopeIndex, 'description', e.target.value)
                        }
                        placeholder="Type your custom item description, construction details, dimensions, finishes, etc..."
                        className="w-full p-2.5 text-xs text-slate-800 bg-slate-50/70 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 leading-relaxed placeholder:text-slate-400"
                      />

                      {/* Always included compliance standard */}
                      <div className="flex items-start gap-1.5 text-[11px] text-slate-600 bg-slate-50 px-2.5 py-1.5 rounded-md border border-slate-200/70">
                        <span className="font-semibold text-slate-700 shrink-0">Included on Quotation:</span>
                        <span className="italic text-slate-600">
                          All work executed as per approved 2D shop drawings, specifications, and approved physical control samples.
                        </span>
                      </div>
                    </div>

                    {/* Per-Scope Reference Visual / Photo Section */}
                    <div className="bg-white rounded-lg border border-slate-200 p-3.5 space-y-3 shadow-2xs">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="p-1 bg-amber-50 text-amber-800 rounded">
                            <ImageIcon className="w-3.5 h-3.5" />
                          </div>
                          <div>
                            <span className="text-xs font-bold text-slate-800">
                              Scope Reference Photo &amp; Detail Drawing
                            </span>
                            <span className="text-[10px] text-slate-500 ml-2 hidden sm:inline">
                              (Specific to {scope.name || `Scope ${scopeIndex + 1}`} — printed on client proposal)
                            </span>
                          </div>
                        </div>

                        {scope.photoUrl && (
                          <button
                            type="button"
                            onClick={() => handleRemoveScopePhoto(scopeIndex)}
                            className="text-[11px] text-red-600 hover:text-red-700 flex items-center gap-1 font-semibold cursor-pointer bg-red-50 hover:bg-red-100 px-2 py-0.5 rounded border border-red-200 transition-colors"
                          >
                            <Trash2 className="w-3 h-3" /> Remove Photo
                          </button>
                        )}
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-start bg-slate-50/70 p-3 rounded-lg border border-slate-200/80">
                        {/* Scope Photo Box */}
                        <div className="sm:col-span-1">
                          {scope.photoUrl ? (
                            <div className="relative group rounded-lg overflow-hidden border border-slate-300 bg-white h-32 flex items-center justify-center shadow-xs">
                              <img
                                src={scope.photoUrl}
                                alt={scope.photoCaption || `${scope.name} Reference Visual`}
                                className="max-h-full max-w-full object-contain p-1"
                                referrerPolicy="no-referrer"
                              />
                              <div className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1.5">
                                <label className="px-2 py-1 bg-white text-slate-900 rounded text-[11px] font-bold hover:bg-slate-100 shadow-md cursor-pointer">
                                  Change
                                  <input
                                    type="file"
                                    onChange={(e) => handleScopePhotoUpload(scopeIndex, e)}
                                    accept="image/png,image/jpeg,image/webp"
                                    className="hidden"
                                  />
                                </label>
                                <button
                                  type="button"
                                  onClick={() => handleRemoveScopePhoto(scopeIndex)}
                                  className="px-2 py-1 bg-red-600 text-white rounded text-[11px] font-bold hover:bg-red-700 shadow-md cursor-pointer"
                                >
                                  Delete
                                </button>
                              </div>
                            </div>
                          ) : (
                            <label className="border-2 border-dashed border-slate-300 hover:border-blue-500 bg-white hover:bg-blue-50/50 rounded-lg h-32 flex flex-col items-center justify-center p-2.5 text-center cursor-pointer transition-colors group">
                              <div className="w-8 h-8 rounded-full bg-slate-100 group-hover:bg-blue-100 flex items-center justify-center text-slate-500 group-hover:text-blue-600 transition-colors mb-1">
                                <Upload className="w-4 h-4" />
                              </div>
                              <span className="text-[11px] font-bold text-slate-700 group-hover:text-blue-700">
                                Attach Scope Photo
                              </span>
                              <span className="text-[9px] text-slate-400 mt-0.5">
                                3D render / CAD elevation / site photo
                              </span>
                              <input
                                type="file"
                                onChange={(e) => handleScopePhotoUpload(scopeIndex, e)}
                                accept="image/png,image/jpeg,image/webp"
                                className="hidden"
                              />
                            </label>
                          )}
                        </div>

                        {/* Caption & Scope Reference Note */}
                        <div className="sm:col-span-2 space-y-2">
                          <div>
                            <label className="block text-[11px] font-bold text-slate-700 mb-1">
                              Drawing Caption / Specification Reference Note
                            </label>
                            <input
                              type="text"
                              value={scope.photoCaption || ''}
                              onChange={(e) =>
                                handleUpdateScopeField(scopeIndex, 'photoCaption', e.target.value)
                              }
                              placeholder="e.g. Approved 3D concept render / Architectural submittal drawing DWG-01"
                              className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                            />
                            <p className="text-[10px] text-slate-500 mt-1.5 leading-relaxed">
                              This photo is attached directly to <strong>{scope.name || `Scope ${scopeIndex + 1}`}</strong> and will print in its line item section on the client quotation letterhead.
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Scope Categories */}
                    <div className="space-y-4">
                      {scope.categories.map((cat, catIndex) => {
                        const theme = CATEGORY_THEMES[catIndex % CATEGORY_THEMES.length];
                        const catTotal = calculateCategoryTotal(cat);

                        return (
                          <div
                            key={cat.id}
                            className="bg-white rounded-lg border border-slate-200 overflow-hidden shadow-xs"
                          >
                            {/* Category Header Bar */}
                            <div
                              className={`px-4 py-2.5 border-b border-slate-200 flex items-center justify-between ${theme.bg}`}
                            >
                              <div className="flex items-center gap-2">
                                <Tag className="w-3.5 h-3.5 text-slate-500" />
                                <input
                                  type="text"
                                  value={cat.name}
                                  onChange={(e) =>
                                    handleUpdateCategoryName(scopeIndex, catIndex, e.target.value)
                                  }
                                  placeholder="Category Name"
                                  className="font-bold text-xs text-slate-900 bg-transparent border-b border-transparent hover:border-slate-400 focus:border-blue-600 focus:bg-white px-1.5 py-0.5 rounded transition-colors"
                                />
                              </div>

                              <div className="flex items-center gap-3">
                                <span className="text-xs font-semibold text-slate-600">
                                  Category Subtotal:{' '}
                                  <span className="font-mono font-bold text-slate-900">
                                    {formatMoney(catTotal)} {quote.currency}
                                  </span>
                                </span>

                                <button
                                  type="button"
                                  onClick={() => handleDeleteCategory(scopeIndex, catIndex)}
                                  className="text-slate-400 hover:text-red-600 p-1 rounded"
                                  title="Delete Category"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>

                            {/* Category Items Table */}
                            <div className="overflow-x-auto">
                              <table className="w-full text-left border-collapse">
                                <thead>
                                  <tr className="bg-slate-50 text-[11px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200">
                                    <th className="py-2 px-3 w-10 text-center">#</th>
                                    <th className="py-2 px-3">Item Description</th>
                                    <th className="py-2 px-3 w-28">Quick Catalog Picker</th>
                                    <th className="py-2 px-3 w-20">Unit</th>
                                    <th className="py-2 px-3 w-24">Qty</th>
                                    <th className="py-2 px-3 w-28 text-left">
                                      Unit Cost ({quote.currency})
                                    </th>
                                    <th className="py-2 px-3 w-28 text-right">Total Cost</th>
                                    <th className="py-2 px-3 w-10 text-center"></th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 text-xs">
                                  {cat.rows.map((row, rowIndex) => {
                                    const rowTotal =
                                      Math.max(0, Number(row.qty) || 0) *
                                      Math.max(0, Number(row.cost) || 0);

                                    return (
                                      <tr
                                        key={row.id}
                                        className="hover:bg-slate-50/60 transition-colors"
                                      >
                                        <td className="py-2 px-3 text-center text-slate-400 font-mono">
                                          {rowIndex + 1}
                                        </td>

                                        {/* Description */}
                                        <td className="py-2 px-3">
                                          <input
                                            type="text"
                                            value={row.desc}
                                            onChange={(e) =>
                                              handleUpdateRowField(
                                                scopeIndex,
                                                catIndex,
                                                rowIndex,
                                                'desc',
                                                e.target.value
                                              )
                                            }
                                            placeholder="Item description or specification..."
                                            className="w-full px-2 py-1 bg-transparent border border-transparent hover:border-slate-300 focus:border-blue-600 focus:bg-white rounded text-xs text-slate-900"
                                          />
                                        </td>

                                        {/* Catalog Quick Dropdown */}
                                        <td className="py-2 px-3">
                                          <select
                                            value={row.productId || ''}
                                            onChange={(e) =>
                                              handleSelectProductForRow(
                                                scopeIndex,
                                                catIndex,
                                                rowIndex,
                                                e.target.value
                                              )
                                            }
                                            className="w-full px-2 py-1 text-[11px] bg-slate-100/80 hover:bg-white border border-slate-200 rounded text-slate-700 cursor-pointer"
                                          >
                                            <option value="">Choose item...</option>
                                            {products.map((p) => (
                                              <option key={p.id} value={p.id}>
                                                {p.code} — {p.desc.slice(0, 30)}... ({p.price}{' '}
                                                {quote.currency})
                                              </option>
                                            ))}
                                          </select>
                                        </td>

                                        {/* Unit */}
                                        <td className="py-2 px-3">
                                          <input
                                            type="text"
                                            value={row.unit || 'pcs'}
                                            onChange={(e) =>
                                              handleUpdateRowField(
                                                scopeIndex,
                                                catIndex,
                                                rowIndex,
                                                'unit',
                                                e.target.value
                                              )
                                            }
                                            className="w-16 px-1.5 py-1 text-xs text-slate-700 bg-transparent border border-transparent hover:border-slate-300 focus:border-blue-600 focus:bg-white rounded"
                                          />
                                        </td>

                                        {/* Quantity */}
                                        <td className="py-2 px-3">
                                          <input
                                            type="number"
                                            dir="ltr"
                                            min="0"
                                            step="0.1"
                                            value={row.qty}
                                            onChange={(e) =>
                                              handleUpdateRowField(
                                                scopeIndex,
                                                catIndex,
                                                rowIndex,
                                                'qty',
                                                Math.max(0, parseFloat(e.target.value) || 0)
                                              )
                                            }
                                            className="w-20 px-2 py-1 text-xs font-mono text-left bg-white border border-slate-300 rounded focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
                                          />
                                        </td>

                                        {/* Unit Cost (Auto-filled or manual) */}
                                        <td className="py-2 px-3">
                                          <input
                                            type="number"
                                            dir="ltr"
                                            min="0"
                                            step="0.01"
                                            value={row.cost}
                                            onChange={(e) =>
                                              handleUpdateRowField(
                                                scopeIndex,
                                                catIndex,
                                                rowIndex,
                                                'cost',
                                                Math.max(0, parseFloat(e.target.value) || 0)
                                              )
                                            }
                                            className="w-24 px-2 py-1 text-xs font-mono font-semibold text-left text-blue-900 bg-white border border-slate-300 rounded focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
                                          />
                                        </td>

                                        {/* Total */}
                                        <td className="py-2 px-3 text-right font-mono font-bold text-slate-800">
                                          {formatMoney(rowTotal)}
                                        </td>

                                        {/* Delete */}
                                        <td className="py-2 px-3 text-center">
                                          <button
                                            type="button"
                                            onClick={() =>
                                              handleDeleteRow(scopeIndex, catIndex, rowIndex)
                                            }
                                            className="text-slate-300 hover:text-red-600 transition-colors p-1"
                                            title="Delete Row"
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

                            {/* Category Action Buttons */}
                            <div className="p-3 bg-slate-50/50 border-t border-slate-100 flex flex-wrap items-center gap-2">
                              {/* Prominent Button to Add from Product Library */}
                              <button
                                type="button"
                                onClick={() =>
                                  handleOpenPickerForCategory(scopeIndex, catIndex)
                                }
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg transition-colors cursor-pointer"
                              >
                                <Package className="w-3.5 h-3.5" />
                                ＋ Add from Product Library
                              </button>

                              {/* Button to Add Custom Blank Row */}
                              <button
                                type="button"
                                onClick={() => handleAddBlankRow(scopeIndex, catIndex)}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-300 rounded-lg transition-colors cursor-pointer"
                              >
                                <Plus className="w-3.5 h-3.5" />
                                ＋ Add Custom Row
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Add Category to this Scope */}
                    <div className="pt-1">
                      <button
                        type="button"
                        onClick={() => handleAddCategory(scopeIndex)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 rounded-lg shadow-xs transition-colors"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        ＋ Add Cost Category
                      </button>
                    </div>

                    {/* Scope Cost Breakdown & Margin Formula Bar (Direct Cost merged with +30% Over Head) */}
                    <div className="bg-white rounded-lg border border-slate-200 p-4 grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                      <div className="space-y-0.5">
                        <div className="text-slate-600 font-semibold">
                          1. Direct Cost + {overheadPct}% Over Head:
                        </div>
                        <div className="font-mono font-black text-slate-900 text-sm">
                          {formatMoney(productionCost)} {quote.currency}
                        </div>
                        <div className="text-[10px] text-slate-500 font-medium">
                          Direct: {formatMoney(directCost)} + {overheadPct}% OH ({formatMoney(overheadCost)} {quote.currency})
                        </div>
                      </div>

                      <div className="space-y-0.5">
                        <div className="text-slate-600 font-semibold">
                          2. Production Unit Cost:
                        </div>
                        <div className="font-mono font-bold text-slate-900 text-sm">
                          {formatMoney(scope.qty > 0 ? productionCost / scope.qty : productionCost)} {quote.currency} / {scope.unit}
                        </div>
                        <div className="text-[10px] text-slate-500">
                          Consolidated base cost per unit
                        </div>
                      </div>

                      <div className="space-y-0.5 bg-emerald-50 p-2.5 rounded-lg border border-emerald-200">
                        <div className="text-emerald-800 font-bold">
                          Suggested Client Price (+{markupPct}% Markup):
                        </div>
                        <div className="font-mono font-black text-emerald-700 text-sm">
                          {formatMoney(suggestedPrice)} {quote.currency}
                        </div>
                        <div className="text-[10px] text-emerald-600 font-mono">
                          Rate: {formatMoney(scope.qty > 0 ? suggestedPrice / scope.qty : suggestedPrice)} / {scope.unit}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Add New Scope Button */}
            <div className="pt-2">
              <button
                type="button"
                onClick={handleAddScope}
                className="w-full py-3.5 border-2 border-dashed border-blue-300 hover:border-blue-500 bg-blue-50/40 hover:bg-blue-50 text-blue-700 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                ＋ Add New Scope Item
              </button>
            </div>
          </div>
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
              {/* Client Items Table */}
              <div className="lg:col-span-2 overflow-x-auto">
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
              </div>
            </div>
          </div>
        )}
      </section>

      {/* Notes & Terms Section */}
      <section className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 space-y-3">
        <label className="block text-xs font-bold text-slate-700">
          Commercial Notes &amp; Payment Terms (Printed on Quotation)
        </label>
        <textarea
          rows={4}
          value={quote.notes}
          onChange={(e) => setQuote({ ...quote, notes: e.target.value })}
          placeholder="Enter payment milestones, delivery terms, warranty, and validity conditions..."
          className="w-full p-3 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
        />
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
