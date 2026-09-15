import React, { useState, useMemo } from 'react';
import { Product } from '../types';
import { formatMoney } from '../utils/formatters';
import { Search, Plus, Check, Package, X, Filter } from 'lucide-react';

interface ProductPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  products: Product[];
  onSelectProducts: (selected: Product[]) => void;
  targetCategoryName?: string;
  onOpenNewProductModal?: () => void;
  currency?: string;
}

export const ProductPickerModal: React.FC<ProductPickerModalProps> = ({
  isOpen,
  onClose,
  products,
  onSelectProducts,
  targetCategoryName = 'Category',
  onOpenNewProductModal,
  currency = 'AED',
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedProductIds, setSelectedProductIds] = useState<Set<string>>(new Set());

  // Extract unique product categories
  const categories = useMemo(() => {
    const set = new Set<string>();
    products.forEach((p) => {
      if (p.category) set.add(p.category);
    });
    return ['All', ...Array.from(set).sort()];
  }, [products]);

  // Filtered product list
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchesCat = selectedCategory === 'All' || p.category === selectedCategory;
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        p.desc.toLowerCase().includes(q) ||
        p.code.toLowerCase().includes(q) ||
        (p.category && p.category.toLowerCase().includes(q)) ||
        (p.notes && p.notes.toLowerCase().includes(q));
      return matchesCat && matchesSearch;
    });
  }, [products, selectedCategory, searchQuery]);

  const toggleSelect = (product: Product) => {
    const next = new Set(selectedProductIds);
    if (next.has(product.id)) {
      next.delete(product.id);
    } else {
      next.add(product.id);
    }
    setSelectedProductIds(next);
  };

  const handleSelectAllFiltered = () => {
    const next = new Set(selectedProductIds);
    filteredProducts.forEach((p) => next.add(p.id));
    setSelectedProductIds(next);
  };

  const handleClearSelection = () => {
    setSelectedProductIds(new Set());
  };

  const handleConfirm = () => {
    const selectedItems = products.filter((p) => selectedProductIds.has(p.id));
    if (selectedItems.length > 0) {
      onSelectProducts(selectedItems);
      setSelectedProductIds(new Set());
      onClose();
    }
  };

  const handleQuickAddSingle = (product: Product) => {
    onSelectProducts([product]);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/70">
          <div>
            <div className="flex items-center gap-2">
              <Package className="w-5 h-5 text-blue-600" />
              <h2 className="text-lg font-bold text-slate-900">Add from Product / Item Library</h2>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Select items to insert into <span className="font-semibold text-blue-700">{targetCategoryName}</span>. Unit costs will be automatically filled.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search & Category Filter Bar */}
        <div className="p-4 border-b border-slate-100 bg-white space-y-3">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by product code, description, or keyword..."
                className="w-full pl-9 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                autoFocus
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600"
                >
                  Clear
                </button>
              )}
            </div>

            {onOpenNewProductModal && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenNewProductModal();
                }}
                className="inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg transition-colors whitespace-nowrap"
              >
                <Plus className="w-3.5 h-3.5" />
                New Library Item
              </button>
            )}
          </div>

          {/* Category Chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs no-scrollbar">
            <span className="text-slate-400 flex items-center gap-1 pr-1 font-medium">
              <Filter className="w-3 h-3" /> Category:
            </span>
            {categories.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`px-2.5 py-1 rounded-full whitespace-nowrap font-medium transition-colors ${
                  selectedCategory === cat
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Product Items Table */}
        <div className="flex-1 overflow-y-auto divide-y divide-slate-100 p-0">
          {filteredProducts.length === 0 ? (
            <div className="py-12 text-center text-slate-500 px-4">
              <Package className="w-10 h-10 mx-auto text-slate-300 mb-2" />
              <p className="font-semibold text-slate-700">No matching products found</p>
              <p className="text-xs text-slate-500 mt-1">
                Try searching for a different term or clear your category filter.
              </p>
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead className="bg-slate-50/80 sticky top-0 border-b border-slate-200 text-[11px] font-bold text-slate-600 uppercase tracking-wider z-10">
                <tr>
                  <th className="py-2.5 px-4 w-10">
                    <input
                      type="checkbox"
                      checked={
                        filteredProducts.length > 0 &&
                        filteredProducts.every((p) => selectedProductIds.has(p.id))
                      }
                      onChange={(e) => {
                        if (e.target.checked) handleSelectAllFiltered();
                        else handleClearSelection();
                      }}
                      className="rounded text-blue-600 focus:ring-blue-500"
                    />
                  </th>
                  <th className="py-2.5 px-3 w-28">Item Code</th>
                  <th className="py-2.5 px-3">Description &amp; Details</th>
                  <th className="py-2.5 px-3 w-28">Category</th>
                  <th className="py-2.5 px-3 w-20">Unit</th>
                  <th className="py-2.5 px-3 w-28 text-right">Unit Cost ({currency})</th>
                  <th className="py-2.5 px-4 w-24 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
                {filteredProducts.map((p) => {
                  const isSelected = selectedProductIds.has(p.id);
                  return (
                    <tr
                      key={p.id}
                      onClick={() => toggleSelect(p)}
                      className={`cursor-pointer transition-colors ${
                        isSelected ? 'bg-blue-50/80' : 'hover:bg-slate-50/90'
                      }`}
                    >
                      <td className="py-3 px-4" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleSelect(p)}
                          className="rounded text-blue-600 focus:ring-blue-500"
                        />
                      </td>
                      <td className="py-3 px-3 font-mono font-semibold text-slate-800">
                        {p.code}
                      </td>
                      <td className="py-3 px-3">
                        <div className="font-medium text-slate-900">{p.desc}</div>
                        {p.notes && (
                          <div className="text-[11px] text-slate-500 mt-0.5 line-clamp-1">
                            {p.notes}
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-3">
                        <span className="inline-block px-2 py-0.5 rounded bg-slate-100 text-slate-600 text-[11px] font-medium">
                          {p.category || 'General'}
                        </span>
                      </td>
                      <td className="py-3 px-3 font-medium text-slate-600">{p.unit}</td>
                      <td className="py-3 px-3 text-right font-mono font-bold text-slate-900">
                        {formatMoney(p.price)}
                      </td>
                      <td className="py-3 px-4 text-center" onClick={(e) => e.stopPropagation()}>
                        <button
                          type="button"
                          onClick={() => handleQuickAddSingle(p)}
                          className="px-2.5 py-1 text-[11px] font-semibold text-blue-700 bg-blue-50 hover:bg-blue-600 hover:text-white border border-blue-200 rounded transition-colors"
                        >
                          Insert
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Footer with Multi-Select Actions */}
        <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <div className="text-xs text-slate-600">
            {selectedProductIds.size > 0 ? (
              <span className="font-medium text-blue-700">
                {selectedProductIds.size} item{selectedProductIds.size > 1 ? 's' : ''} selected
              </span>
            ) : (
              <span className="text-slate-500">
                Click any row or checkbox to select multiple items
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              disabled={selectedProductIds.size === 0}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed rounded-lg shadow-sm transition-colors"
            >
              <Check className="w-4 h-4" />
              Add Selected ({selectedProductIds.size})
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
