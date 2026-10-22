import React from 'react';
import { Quotation, Product, ScopeItem, CategoryRowItem } from '../types';
import {
  formatMoney,
  calculateCategoryTotal,
  calculateScopeDirectCost,
  calculateScopeOverhead,
  calculateScopeProductionCost,
  calculateScopeSuggestedPrice,
} from '../utils/formatters';
import {
  Layers,
  Plus,
  Trash2,
  Package,
  Tag,
  AlignLeft,
  Image as ImageIcon,
  Upload,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

interface InternalCostingSpreadsheetProps {
  quote: Quotation;
  products: Product[];
  overheadPct: number;
  setOverheadPct: (pct: number) => void;
  markupPct: number;
  setMarkupPct: (pct: number) => void;
  expandedSpecs: Record<number, boolean>;
  toggleScopeSpecs: (scopeIndex: number) => void;
  onOpenPickerForCategory: (scopeIndex: number, catIndex: number) => void;
  onAddScope: () => void;
  onDeleteScope: (scopeIndex: number) => void;
  onUpdateScopeField: (scopeIndex: number, field: keyof ScopeItem, value: any) => void;
  onScopePhotoUpload: (scopeIndex: number, e: React.ChangeEvent<HTMLInputElement>) => void;
  onRemoveScopePhoto: (scopeIndex: number) => void;
  onAddCategory: (scopeIndex: number) => void;
  onDeleteCategory: (scopeIndex: number, catIndex: number) => void;
  onUpdateCategoryName: (scopeIndex: number, catIndex: number, name: string) => void;
  onAddBlankRow: (scopeIndex: number, catIndex: number) => void;
  onDeleteRow: (scopeIndex: number, catIndex: number, rowIndex: number) => void;
  onUpdateRowField: (
    scopeIndex: number,
    catIndex: number,
    rowIndex: number,
    field: keyof CategoryRowItem,
    value: any
  ) => void;
  onSelectProductForRow: (
    scopeIndex: number,
    catIndex: number,
    rowIndex: number,
    productId: string
  ) => void;
}

export const InternalCostingSpreadsheet: React.FC<InternalCostingSpreadsheetProps> = ({
  quote,
  products,
  overheadPct,
  setOverheadPct,
  markupPct,
  setMarkupPct,
  expandedSpecs,
  toggleScopeSpecs,
  onOpenPickerForCategory,
  onAddScope,
  onDeleteScope,
  onUpdateScopeField,
  onScopePhotoUpload,
  onRemoveScopePhoto,
  onAddCategory,
  onDeleteCategory,
  onUpdateCategoryName,
  onAddBlankRow,
  onDeleteRow,
  onUpdateRowField,
  onSelectProductForRow,
}) => {
  // Total direct cost across all scopes
  const totalDirectCost = quote.scopes.reduce(
    (acc, s) => acc + calculateScopeDirectCost(s),
    0
  );

  return (
    <div className="p-3 sm:p-5 md:p-6 space-y-4 sm:space-y-6 max-w-full overflow-hidden">
      {/* Scope Command & Margin Ribbon (Mobile-Responsive) */}
      <div className="bg-slate-900 text-white rounded-xl p-3 sm:p-4 shadow-sm border border-slate-800 space-y-3 sm:space-y-0 sm:flex sm:flex-wrap sm:items-center sm:justify-between sm:gap-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg bg-blue-600/30 border border-blue-400/40 text-blue-300 flex items-center justify-center font-bold shrink-0">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-xs sm:text-sm text-white tracking-wide">
                Scope Internal Costing Spreadsheet
              </span>
              <span className="text-[10px] font-mono bg-blue-500/20 text-blue-300 px-1.5 py-0.5 rounded border border-blue-500/30">
                Scope Hierarchy
              </span>
            </div>
            <p className="text-[10px] sm:text-[11px] text-slate-400 mt-0.5">
              Breakdown by Scope Packages, Trades &amp; Materials
            </p>
          </div>
        </div>

        {/* Editable Overheads & Markup Controls (Mobile 2-column grid, Desktop flex) */}
        <div className="grid grid-cols-2 sm:flex sm:items-center gap-2 sm:gap-3">
          {/* Overheads */}
          <div className="flex items-center justify-between sm:justify-start gap-1.5 bg-slate-800/90 px-2.5 py-1.5 rounded-lg border border-slate-700 text-xs">
            <span className="text-[10px] sm:text-[11px] text-slate-300 font-semibold">Overhead:</span>
            <div className="flex items-center">
              <input
                type="number"
                min="0"
                max="100"
                value={overheadPct}
                onChange={(e) => setOverheadPct(Math.max(0, parseFloat(e.target.value) || 0))}
                className="w-12 sm:w-14 px-1 py-0.5 text-xs font-mono font-bold text-center bg-slate-900 text-blue-400 border border-slate-600 rounded focus:border-blue-400 focus:outline-none"
              />
              <span className="text-xs font-bold text-slate-400 ml-1">%</span>
            </div>
          </div>

          {/* Markup */}
          <div className="flex items-center justify-between sm:justify-start gap-1.5 bg-slate-800/90 px-2.5 py-1.5 rounded-lg border border-emerald-900/60 text-xs">
            <span className="text-[10px] sm:text-[11px] text-emerald-300 font-bold">Markup:</span>
            <div className="flex items-center">
              <input
                type="number"
                min="0"
                max="500"
                value={markupPct}
                onChange={(e) => setMarkupPct(Math.max(0, parseFloat(e.target.value) || 0))}
                className="w-12 sm:w-14 px-1 py-0.5 text-xs font-mono font-bold text-center bg-slate-900 text-emerald-400 border border-emerald-600 rounded focus:border-emerald-400 focus:outline-none"
                title="Adjust markup percentage for this quotation"
              />
              <span className="text-xs font-bold text-emerald-400 ml-1">%</span>
            </div>
          </div>

          {/* Total Direct Cost Badge */}
          <div className="col-span-2 sm:col-span-1 flex items-center justify-between sm:justify-end gap-2 bg-slate-800/90 px-3 py-1.5 rounded-lg border border-slate-700">
            <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">
              Direct Cost:
            </span>
            <span className="font-mono font-bold text-xs text-slate-200">
              {formatMoney(totalDirectCost)} {quote.currency}
            </span>
          </div>

          {/* Add Scope Button */}
          <button
            type="button"
            onClick={onAddScope}
            className="col-span-2 sm:col-span-1 flex items-center justify-center gap-1.5 px-3 py-1.5 sm:px-3.5 sm:py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 rounded-lg transition-colors shadow-sm cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Scope</span>
          </button>
        </div>
      </div>

      {/* List of Scope Items */}
      <div className="space-y-5 sm:space-y-6">
        {quote.scopes.map((scope, scopeIndex) => {
          const directCost = calculateScopeDirectCost(scope);
          const overheadCost = calculateScopeOverhead(scope, overheadPct);
          const productionCost = calculateScopeProductionCost(scope, overheadPct);
          const suggestedPrice = calculateScopeSuggestedPrice(scope, overheadPct, markupPct);
          const isSpecsExpanded = Boolean(expandedSpecs[scopeIndex]);
          const hasSpecs = Boolean(scope.description && scope.description.trim().length > 0);
          const hasPhoto = Boolean(scope.photoUrl);

          const scopeCode = `${scopeIndex + 1}.0`;

          return (
            <div
              key={scope.id}
              className="bg-white rounded-xl border border-slate-300 shadow-sm overflow-hidden"
            >
              {/* Level 1: Scope Master Header Bar (Mobile-Responsive Stack) */}
              <div className="bg-slate-900 text-white p-3 sm:px-4 sm:py-3 border-b border-slate-800 space-y-2.5 sm:space-y-0 sm:flex sm:items-center sm:justify-between sm:gap-3">
                {/* Scope Label & Name */}
                <div className="flex items-center gap-2 sm:gap-3 flex-1">
                  <span className="px-2 py-0.5 sm:px-2.5 sm:py-1 rounded bg-blue-600 text-white font-mono font-bold text-xs shrink-0 shadow-xs">
                    Scope {scopeCode}
                  </span>
                  <input
                    type="text"
                    value={scope.name}
                    onChange={(e) => onUpdateScopeField(scopeIndex, 'name', e.target.value)}
                    placeholder="Scope Title (e.g. Bespoke Joinery Package)"
                    className="font-bold text-xs sm:text-sm text-white bg-slate-800/80 hover:bg-slate-800 border border-slate-700 focus:border-blue-400 focus:bg-slate-950 px-2 py-1 rounded-lg focus:outline-none flex-1 min-w-0 transition-colors"
                  />
                  {/* Delete Scope button for mobile right in header line */}
                  <button
                    type="button"
                    onClick={() => onDeleteScope(scopeIndex)}
                    title="Delete Scope Package"
                    className="sm:hidden p-1.5 text-slate-400 hover:text-red-400 rounded-lg transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                {/* Scope Controls Row */}
                <div className="flex items-center justify-between sm:justify-end gap-2 flex-wrap">
                  {/* Scope Qty & Unit */}
                  <div className="flex items-center gap-1 bg-slate-800 px-2 py-1 rounded-lg border border-slate-700 text-xs text-slate-300">
                    <span className="text-[10px] text-slate-400">Qty:</span>
                    <input
                      type="number"
                      dir="ltr"
                      min="0"
                      step="0.1"
                      value={scope.qty}
                      onChange={(e) =>
                        onUpdateScopeField(
                          scopeIndex,
                          'qty',
                          Math.max(0, parseFloat(e.target.value) || 0)
                        )
                      }
                      className="w-12 sm:w-14 px-1 py-0.5 text-xs font-mono font-bold text-right text-white bg-slate-900 border border-slate-600 rounded focus:border-blue-400 focus:outline-none"
                    />
                    <input
                      type="text"
                      value={scope.unit}
                      onChange={(e) => onUpdateScopeField(scopeIndex, 'unit', e.target.value)}
                      placeholder="Unit"
                      className="w-12 sm:w-14 px-1 py-0.5 text-xs font-bold text-white bg-slate-900 border border-slate-600 rounded focus:border-blue-400 focus:outline-none text-center"
                    />
                  </div>

                  {/* Toggle Button for Scope Specs & Photo (Preserved as requested!) */}
                  <button
                    type="button"
                    onClick={() => toggleScopeSpecs(scopeIndex)}
                    className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-bold rounded-lg border transition-all cursor-pointer ${
                      isSpecsExpanded
                        ? 'bg-blue-600 text-white border-blue-500 shadow-xs'
                        : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
                    }`}
                    title="Click to view/edit technical specifications, construction details, and reference drawing"
                  >
                    <AlignLeft className="w-3.5 h-3.5 text-blue-300" />
                    <span className="text-[11px] sm:text-xs">Specs &amp; Drawing</span>
                    {(hasSpecs || hasPhoto) && (
                      <span className="w-2 h-2 rounded-full bg-emerald-400 ring-2 ring-slate-900" />
                    )}
                    {isSpecsExpanded ? (
                      <ChevronUp className="w-3.5 h-3.5 ml-0.5 opacity-80" />
                    ) : (
                      <ChevronDown className="w-3.5 h-3.5 ml-0.5 opacity-80" />
                    )}
                  </button>

                  {/* Scope Quoted Total Preview */}
                  <div className="flex items-center gap-1.5 bg-slate-800/90 px-2 py-1 rounded-lg border border-slate-700 text-xs font-mono">
                    <span className="text-[10px] text-emerald-400">Total:</span>
                    <span className="font-bold text-emerald-300 text-xs">
                      {formatMoney(suggestedPrice)}
                    </span>
                  </div>

                  {/* Desktop Delete Scope Button */}
                  <button
                    type="button"
                    onClick={() => onDeleteScope(scopeIndex)}
                    title="Delete Scope Package"
                    className="hidden sm:block p-1.5 text-slate-400 hover:text-red-400 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Collapsible Scope Specs & Drawing Drawer (Toggle Preserved) */}
              {isSpecsExpanded && (
                <div className="bg-slate-50 border-b border-slate-300 p-3 sm:p-4 space-y-3 animate-in fade-in duration-150">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 border-b border-slate-200 pb-2">
                    <div className="flex items-center gap-2">
                      <AlignLeft className="w-4 h-4 text-blue-600 shrink-0" />
                      <span className="font-bold text-xs text-slate-800">
                        Scope {scopeCode} Description, Technical Specs &amp; Reference Visual
                      </span>
                    </div>
                    <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full self-start sm:self-auto">
                      ✓ Reflected on Client Quotation &amp; PDF Letterhead
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4">
                    {/* Left: Scope Technical Specifications */}
                    <div className="md:col-span-2 space-y-1.5">
                      <label className="block text-[11px] font-bold text-slate-700">
                        Technical Description / Specifications:
                      </label>
                      <textarea
                        rows={3}
                        value={scope.description || ''}
                        onChange={(e) => onUpdateScopeField(scopeIndex, 'description', e.target.value)}
                        placeholder="Type construction details, dimensions, finishes, joinery substrate, hardware brand..."
                        className="w-full p-2.5 text-xs text-slate-800 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 leading-relaxed placeholder:text-slate-400"
                      />
                      <p className="text-[10px] text-slate-500 italic">
                        * All work executed as per approved 2D shop drawings, specifications, and approved physical control samples.
                      </p>
                    </div>

                    {/* Right: Scope Drawing Visual & Caption */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="text-[11px] font-bold text-slate-700 flex items-center gap-1">
                          <ImageIcon className="w-3.5 h-3.5 text-amber-600" />
                          <span>Reference Drawing / Photo</span>
                        </label>
                        {scope.photoUrl && (
                          <button
                            type="button"
                            onClick={() => onRemoveScopePhoto(scopeIndex)}
                            className="text-[10px] text-red-600 hover:underline cursor-pointer"
                          >
                            Remove
                          </button>
                        )}
                      </div>

                      {scope.photoUrl ? (
                        <div className="relative group rounded-lg overflow-hidden border border-slate-300 bg-white h-24 flex items-center justify-center">
                          <img
                            src={scope.photoUrl}
                            alt="Scope visual"
                            className="max-h-full max-w-full object-contain p-1"
                          />
                          <div className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1.5">
                            <label className="px-2 py-1 bg-white text-slate-900 rounded text-[10px] font-bold cursor-pointer hover:bg-slate-100">
                              Change
                              <input
                                type="file"
                                onChange={(e) => onScopePhotoUpload(scopeIndex, e)}
                                accept="image/*"
                                className="hidden"
                              />
                            </label>
                          </div>
                        </div>
                      ) : (
                        <label className="border-2 border-dashed border-slate-300 hover:border-blue-500 bg-white hover:bg-blue-50/50 rounded-lg h-24 flex flex-col items-center justify-center text-center cursor-pointer transition-colors">
                          <Upload className="w-4 h-4 text-slate-400 mb-1" />
                          <span className="text-[10px] font-bold text-slate-600">Attach Drawing / 3D Visual</span>
                          <input
                            type="file"
                            onChange={(e) => onScopePhotoUpload(scopeIndex, e)}
                            accept="image/*"
                            className="hidden"
                          />
                        </label>
                      )}

                      <input
                        type="text"
                        value={scope.photoCaption || ''}
                        onChange={(e) => onUpdateScopeField(scopeIndex, 'photoCaption', e.target.value)}
                        placeholder="Caption: e.g. DWG-01 Architectural Detail"
                        className="w-full px-2 py-1 text-[11px] bg-white border border-slate-300 rounded focus:border-blue-600 focus:outline-none"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* 1. DESKTOP & TABLET VIEW: Wide Excel Spreadsheet Table (≥ 768px) */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-100 text-[11px] font-bold text-slate-700 uppercase tracking-wider border-b border-slate-300">
                      <th className="py-2 px-3 w-16 text-center border-r border-slate-200">Scope</th>
                      <th className="py-2 px-3 border-r border-slate-200">Item / Material / Labor Description</th>
                      <th className="py-2 px-3 w-40 border-r border-slate-200">Catalog Library</th>
                      <th className="py-2 px-3 w-20 border-r border-slate-200 text-center">Unit</th>
                      <th className="py-2 px-3 w-24 border-r border-slate-200 text-right">Qty</th>
                      <th className="py-2 px-3 w-32 border-r border-slate-200 text-right">Unit Rate ({quote.currency})</th>
                      <th className="py-2 px-3 w-36 border-r border-slate-200 text-right">Total Cost ({quote.currency})</th>
                      <th className="py-2 px-2 w-10 text-center"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 text-xs">
                    {scope.categories.map((cat, catIndex) => {
                      const catTotal = calculateCategoryTotal(cat);
                      const catCode = `${scopeIndex + 1}.${catIndex + 1}`;

                      return (
                        <React.Fragment key={cat.id}>
                          {/* Level 2: Category Section Divider Row */}
                          <tr className="bg-slate-100/90 font-bold border-t-2 border-b border-slate-300">
                            <td className="py-2 px-3 text-center font-mono text-[11px] text-blue-900 border-r border-slate-200">
                              {catCode}
                            </td>
                            <td className="py-1.5 px-3 border-r border-slate-200" colSpan={2}>
                              <div className="flex items-center gap-2">
                                <Tag className="w-3.5 h-3.5 text-blue-700 shrink-0" />
                                <input
                                  type="text"
                                  value={cat.name}
                                  onChange={(e) =>
                                    onUpdateCategoryName(scopeIndex, catIndex, e.target.value)
                                  }
                                  placeholder="Trade Category Name"
                                  className="font-bold text-xs text-slate-900 bg-transparent hover:bg-white focus:bg-white border-b border-transparent hover:border-slate-300 focus:border-blue-600 px-1.5 py-0.5 rounded transition-colors flex-1"
                                />
                              </div>
                            </td>
                            <td className="py-1.5 px-3 text-center text-slate-400 border-r border-slate-200 text-[10px]">
                              Subtotal
                            </td>
                            <td className="py-1.5 px-3 border-r border-slate-200" colSpan={2}></td>
                            <td className="py-1.5 px-3 text-right font-mono font-extrabold text-blue-950 border-r border-slate-200 text-xs bg-blue-50/50">
                              {formatMoney(catTotal)} {quote.currency}
                            </td>
                            <td className="py-1.5 px-2 text-center">
                              <div className="flex items-center justify-center gap-1">
                                <button
                                  type="button"
                                  onClick={() => onAddBlankRow(scopeIndex, catIndex)}
                                  title="Add Item Row"
                                  className="p-1 text-blue-700 hover:bg-blue-100 rounded transition-colors cursor-pointer"
                                >
                                  <Plus className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => onDeleteCategory(scopeIndex, catIndex)}
                                  title="Delete Category"
                                  className="p-1 text-slate-400 hover:text-red-600 rounded transition-colors cursor-pointer"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>

                          {/* Level 3: Line Item Rows */}
                          {cat.rows.map((row, rowIndex) => {
                            const rowTotal =
                              Math.max(0, Number(row.qty) || 0) *
                              Math.max(0, Number(row.cost) || 0);
                            const itemCode = `${catCode}.${rowIndex + 1}`;

                            return (
                              <tr
                                key={row.id}
                                className="hover:bg-blue-50/30 transition-colors group"
                              >
                                <td className="py-1.5 px-3 text-center text-slate-500 font-mono text-[11px] border-r border-slate-200 bg-slate-50/50">
                                  {itemCode}
                                </td>

                                <td className="py-1.5 px-3 border-r border-slate-200">
                                  <input
                                    type="text"
                                    value={row.desc}
                                    onChange={(e) =>
                                      onUpdateRowField(
                                        scopeIndex,
                                        catIndex,
                                        rowIndex,
                                        'desc',
                                        e.target.value
                                      )
                                    }
                                    placeholder="e.g. 18mm MR MDF Core Board / Soft-close Hinge"
                                    className="w-full px-2 py-1 text-xs text-slate-900 bg-transparent hover:bg-white focus:bg-white border border-transparent hover:border-slate-300 focus:border-blue-600 rounded focus:outline-none transition-colors"
                                  />
                                </td>

                                <td className="py-1.5 px-2 border-r border-slate-200">
                                  <select
                                    value={row.productId || ''}
                                    onChange={(e) => {
                                      if (e.target.value) {
                                        onSelectProductForRow(
                                          scopeIndex,
                                          catIndex,
                                          rowIndex,
                                          e.target.value
                                        );
                                      }
                                    }}
                                    className="w-full px-1.5 py-1 text-[11px] text-slate-600 bg-slate-50 hover:bg-white border border-slate-200 rounded focus:border-blue-600 focus:outline-none truncate cursor-pointer"
                                  >
                                    <option value="">＋ Catalog Picker...</option>
                                    {products.map((p) => (
                                      <option key={p.id} value={p.id}>
                                        {p.code ? `[${p.code}] ` : ''}
                                        {p.desc} ({formatMoney(p.price)} {quote.currency})
                                      </option>
                                    ))}
                                  </select>
                                </td>

                                <td className="py-1.5 px-2 border-r border-slate-200 text-center">
                                  <input
                                    type="text"
                                    value={row.unit || 'pcs'}
                                    onChange={(e) =>
                                      onUpdateRowField(
                                        scopeIndex,
                                        catIndex,
                                        rowIndex,
                                        'unit',
                                        e.target.value
                                      )
                                    }
                                    className="w-16 px-1.5 py-1 text-xs text-center text-slate-700 bg-transparent hover:bg-white focus:bg-white border border-transparent hover:border-slate-300 focus:border-blue-600 rounded focus:outline-none"
                                  />
                                </td>

                                <td className="py-1.5 px-2 border-r border-slate-200 text-right">
                                  <input
                                    type="number"
                                    dir="ltr"
                                    min="0"
                                    step="0.1"
                                    value={row.qty}
                                    onChange={(e) =>
                                      onUpdateRowField(
                                        scopeIndex,
                                        catIndex,
                                        rowIndex,
                                        'qty',
                                        Math.max(0, parseFloat(e.target.value) || 0)
                                      )
                                    }
                                    className="w-20 px-2 py-1 text-xs font-mono font-semibold text-right bg-transparent hover:bg-white focus:bg-white border border-transparent hover:border-slate-300 focus:border-blue-600 rounded focus:outline-none"
                                  />
                                </td>

                                <td className="py-1.5 px-2 border-r border-slate-200 text-right">
                                  <input
                                    type="number"
                                    dir="ltr"
                                    min="0"
                                    step="0.01"
                                    value={row.cost}
                                    onChange={(e) =>
                                      onUpdateRowField(
                                        scopeIndex,
                                        catIndex,
                                        rowIndex,
                                        'cost',
                                        Math.max(0, parseFloat(e.target.value) || 0)
                                      )
                                    }
                                    className="w-24 px-2 py-1 text-xs font-mono font-bold text-right text-blue-900 bg-transparent hover:bg-white focus:bg-white border border-transparent hover:border-slate-300 focus:border-blue-600 rounded focus:outline-none"
                                  />
                                </td>

                                <td className="py-1.5 px-3 text-right font-mono font-bold text-slate-900 border-r border-slate-200">
                                  {formatMoney(rowTotal)}
                                </td>

                                <td className="py-1.5 px-2 text-center">
                                  <button
                                    type="button"
                                    onClick={() =>
                                      onDeleteRow(scopeIndex, catIndex, rowIndex)
                                    }
                                    className="text-slate-300 hover:text-red-600 transition-colors p-1"
                                    title="Delete Item"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </td>
                              </tr>
                            );
                          })}

                          {/* Quick inline category helper buttons */}
                          <tr className="bg-slate-50/40 border-b border-slate-200">
                            <td className="border-r border-slate-200"></td>
                            <td colSpan={7} className="py-1.5 px-3">
                              <div className="flex items-center gap-2">
                                <button
                                  type="button"
                                  onClick={() => onAddBlankRow(scopeIndex, catIndex)}
                                  className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-700 hover:text-blue-900 hover:underline cursor-pointer"
                                >
                                  <Plus className="w-3 h-3" /> Add Item Row
                                </button>
                                <span className="text-slate-300">&bull;</span>
                                <button
                                  type="button"
                                  onClick={() => onOpenPickerForCategory(scopeIndex, catIndex)}
                                  className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-600 hover:text-blue-700 hover:underline cursor-pointer"
                                >
                                  <Package className="w-3.5 h-3.5 text-blue-600" /> ＋ From Product Library
                                </button>
                              </div>
                            </td>
                          </tr>
                        </React.Fragment>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* 2. MOBILE VIEW: Touch-Friendly Responsive Cards (< 768px) */}
              <div className="block md:hidden divide-y divide-slate-200">
                {scope.categories.map((cat, catIndex) => {
                  const catTotal = calculateCategoryTotal(cat);
                  const catCode = `${scopeIndex + 1}.${catIndex + 1}`;

                  return (
                    <div key={cat.id} className="p-3 bg-white space-y-3">
                      {/* Category Header Card */}
                      <div className="flex items-center justify-between bg-slate-100 p-2.5 rounded-lg border border-slate-200">
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          <span className="font-mono font-bold text-xs bg-blue-600 text-white px-1.5 py-0.5 rounded shrink-0">
                            {catCode}
                          </span>
                          <input
                            type="text"
                            value={cat.name}
                            onChange={(e) =>
                              onUpdateCategoryName(scopeIndex, catIndex, e.target.value)
                            }
                            placeholder="Category Name"
                            className="font-bold text-xs text-slate-900 bg-transparent border-b border-transparent focus:border-blue-600 focus:bg-white px-1 py-0.5 rounded flex-1 min-w-0"
                          />
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <span className="font-mono font-bold text-xs text-blue-900">
                            {formatMoney(catTotal)}
                          </span>
                          <button
                            type="button"
                            onClick={() => onDeleteCategory(scopeIndex, catIndex)}
                            className="p-1 text-slate-400 hover:text-red-600"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Items List in this Category */}
                      <div className="space-y-2">
                        {cat.rows.map((row, rowIndex) => {
                          const rowTotal =
                            Math.max(0, Number(row.qty) || 0) *
                            Math.max(0, Number(row.cost) || 0);
                          const itemCode = `${catCode}.${rowIndex + 1}`;

                          return (
                            <div
                              key={row.id}
                              className="p-2.5 rounded-lg border border-slate-200 bg-slate-50/60 space-y-2"
                            >
                              {/* Row 1: Item Code & Description */}
                              <div className="flex items-center gap-2">
                                <span className="font-mono text-[10px] text-slate-500 font-bold bg-white px-1.5 py-0.5 rounded border border-slate-200 shrink-0">
                                  {itemCode}
                                </span>
                                <input
                                  type="text"
                                  value={row.desc}
                                  onChange={(e) =>
                                    onUpdateRowField(
                                      scopeIndex,
                                      catIndex,
                                      rowIndex,
                                      'desc',
                                      e.target.value
                                    )
                                  }
                                  placeholder="Item Description"
                                  className="w-full px-2 py-1 text-xs text-slate-900 bg-white border border-slate-200 rounded focus:border-blue-600 focus:outline-none"
                                />
                              </div>

                              {/* Row 2: Catalog Picker */}
                              <select
                                value={row.productId || ''}
                                onChange={(e) => {
                                  if (e.target.value) {
                                    onSelectProductForRow(
                                      scopeIndex,
                                      catIndex,
                                      rowIndex,
                                      e.target.value
                                    );
                                  }
                                }}
                                className="w-full px-2 py-1 text-[11px] text-slate-600 bg-white border border-slate-200 rounded focus:border-blue-600 focus:outline-none truncate"
                              >
                                <option value="">＋ Pick from Product Catalog...</option>
                                {products.map((p) => (
                                  <option key={p.id} value={p.id}>
                                    {p.code ? `[${p.code}] ` : ''}
                                    {p.desc} ({formatMoney(p.price)} {quote.currency})
                                  </option>
                                ))}
                              </select>

                              {/* Row 3: Touch Numeric Inputs Grid (Qty, Unit, Unit Cost) */}
                              <div className="grid grid-cols-3 gap-2">
                                <div>
                                  <label className="block text-[10px] font-semibold text-slate-500 mb-0.5">
                                    Qty
                                  </label>
                                  <input
                                    type="number"
                                    min="0"
                                    step="0.1"
                                    value={row.qty}
                                    onChange={(e) =>
                                      onUpdateRowField(
                                        scopeIndex,
                                        catIndex,
                                        rowIndex,
                                        'qty',
                                        Math.max(0, parseFloat(e.target.value) || 0)
                                      )
                                    }
                                    className="w-full px-2 py-1 text-xs font-mono font-bold text-center bg-white border border-slate-200 rounded focus:border-blue-600"
                                  />
                                </div>

                                <div>
                                  <label className="block text-[10px] font-semibold text-slate-500 mb-0.5">
                                    Unit
                                  </label>
                                  <input
                                    type="text"
                                    value={row.unit || 'pcs'}
                                    onChange={(e) =>
                                      onUpdateRowField(
                                        scopeIndex,
                                        catIndex,
                                        rowIndex,
                                        'unit',
                                        e.target.value
                                      )
                                    }
                                    className="w-full px-2 py-1 text-xs text-center bg-white border border-slate-200 rounded focus:border-blue-600"
                                  />
                                </div>

                                <div>
                                  <label className="block text-[10px] font-semibold text-slate-500 mb-0.5">
                                    Unit Cost ({quote.currency})
                                  </label>
                                  <input
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    value={row.cost}
                                    onChange={(e) =>
                                      onUpdateRowField(
                                        scopeIndex,
                                        catIndex,
                                        rowIndex,
                                        'cost',
                                        Math.max(0, parseFloat(e.target.value) || 0)
                                      )
                                    }
                                    className="w-full px-2 py-1 text-xs font-mono font-bold text-right text-blue-900 bg-white border border-slate-200 rounded focus:border-blue-600"
                                  />
                                </div>
                              </div>

                              {/* Row 4: Total & Delete Action */}
                              <div className="flex items-center justify-between pt-1 border-t border-slate-200/80">
                                <div className="text-xs">
                                  <span className="text-[10px] text-slate-500 font-semibold mr-1">
                                    Line Total:
                                  </span>
                                  <span className="font-mono font-extrabold text-slate-900">
                                    {formatMoney(rowTotal)} {quote.currency}
                                  </span>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => onDeleteRow(scopeIndex, catIndex, rowIndex)}
                                  className="text-slate-400 hover:text-red-600 p-1 flex items-center gap-1 text-[11px]"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                  <span>Remove</span>
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      {/* Add Buttons inside Category for Mobile */}
                      <div className="flex items-center gap-2 pt-1">
                        <button
                          type="button"
                          onClick={() => onAddBlankRow(scopeIndex, catIndex)}
                          className="flex-1 py-1.5 px-2 bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-bold rounded-lg border border-blue-200 flex items-center justify-center gap-1"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Add Item</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => onOpenPickerForCategory(scopeIndex, catIndex)}
                          className="flex-1 py-1.5 px-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg border border-slate-300 flex items-center justify-center gap-1"
                        >
                          <Package className="w-3.5 h-3.5 text-blue-600" />
                          <span>From Library</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Bottom Action: Add Category to Scope */}
              <div className="px-3 py-2.5 sm:px-4 sm:py-2.5 bg-slate-50/70 border-t border-slate-200 flex items-center justify-between flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => onAddCategory(scopeIndex)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-slate-700 bg-white hover:bg-slate-100 border border-slate-300 rounded-lg shadow-2xs transition-colors cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5 text-blue-600" />
                  <span>Add Trade Category</span>
                </button>

                <div className="text-[11px] sm:text-xs text-slate-500 font-medium">
                  {scope.categories.length} trade groups in Scope {scopeCode}
                </div>
              </div>

              {/* Scope Financial Calculation Ribbon (Mobile 2x3 Grid, Desktop 6-Column) */}
              <div className="bg-slate-50 border-t-2 border-slate-300 p-3 sm:p-4 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 sm:gap-3 text-xs">
                <div className="bg-white p-2 sm:p-2.5 rounded-lg border border-slate-200">
                  <div className="text-[9px] sm:text-[10px] text-slate-500 uppercase tracking-wider font-semibold">
                    1. Direct Cost
                  </div>
                  <div className="font-mono font-bold text-slate-900 text-xs sm:text-sm mt-0.5">
                    {formatMoney(directCost)} {quote.currency}
                  </div>
                </div>

                <div className="bg-white p-2 sm:p-2.5 rounded-lg border border-slate-200">
                  <div className="text-[9px] sm:text-[10px] text-slate-500 uppercase tracking-wider font-semibold">
                    2. Overheads ({overheadPct}%)
                  </div>
                  <div className="font-mono font-bold text-blue-900 text-xs sm:text-sm mt-0.5">
                    +{formatMoney(overheadCost)} {quote.currency}
                  </div>
                </div>

                <div className="bg-white p-2 sm:p-2.5 rounded-lg border border-slate-200">
                  <div className="text-[9px] sm:text-[10px] text-slate-500 uppercase tracking-wider font-semibold">
                    3. Base Production
                  </div>
                  <div className="font-mono font-extrabold text-slate-900 text-xs sm:text-sm mt-0.5">
                    {formatMoney(productionCost)} {quote.currency}
                  </div>
                </div>

                <div className="bg-emerald-50/80 p-2 sm:p-2.5 rounded-lg border border-emerald-200">
                  <div className="text-[9px] sm:text-[10px] text-emerald-800 uppercase tracking-wider font-bold">
                    4. Markup (+{markupPct}%)
                  </div>
                  <div className="font-mono font-extrabold text-emerald-700 text-xs sm:text-sm mt-0.5">
                    +{formatMoney(suggestedPrice - productionCost)}
                  </div>
                </div>

                <div className="bg-white p-2 sm:p-2.5 rounded-lg border border-slate-200">
                  <div className="text-[9px] sm:text-[10px] text-slate-500 uppercase tracking-wider font-semibold">
                    Unit Rate ({scope.unit})
                  </div>
                  <div className="font-mono font-bold text-slate-800 text-xs sm:text-sm mt-0.5">
                    {formatMoney(scope.qty > 0 ? suggestedPrice / scope.qty : suggestedPrice)}
                  </div>
                </div>

                <div className="bg-blue-600 text-white p-2 sm:p-2.5 rounded-lg border border-blue-700 shadow-2xs col-span-2 sm:col-span-1">
                  <div className="text-[9px] sm:text-[10px] text-blue-200 uppercase tracking-wider font-bold">
                    Scope Total ({quote.currency})
                  </div>
                  <div className="font-mono font-black text-xs sm:text-sm mt-0.5">
                    {formatMoney(suggestedPrice)} {quote.currency}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Bottom Add Scope Package Button */}
      <div className="pt-2">
        <button
          type="button"
          onClick={onAddScope}
          className="w-full py-3.5 sm:py-4 border-2 border-dashed border-blue-300 hover:border-blue-500 bg-blue-50/30 hover:bg-blue-50 text-blue-700 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>＋ Add New Scope Package (Scope {quote.scopes.length + 1}.0)</span>
        </button>
      </div>
    </div>
  );
};
