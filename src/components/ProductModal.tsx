import React, { useState, useEffect } from 'react';
import { Product } from '../types';
import { Package, X } from 'lucide-react';

interface ProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (productData: Omit<Product, 'id'>, editId?: string) => void;
  productToEdit?: Product | null;
  currency?: string;
}

export const ProductModal: React.FC<ProductModalProps> = ({
  isOpen,
  onClose,
  onSave,
  productToEdit,
  currency = 'AED',
}) => {
  const [code, setCode] = useState('');
  const [desc, setDesc] = useState('');
  const [category, setCategory] = useState('Raw Materials');
  const [unit, setUnit] = useState('pcs');
  const [price, setPrice] = useState<string>('0');
  const [tax, setTax] = useState<string>('5');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (productToEdit) {
      setCode(productToEdit.code || '');
      setDesc(productToEdit.desc || '');
      setCategory(productToEdit.category || 'Raw Materials');
      setUnit(productToEdit.unit || 'pcs');
      setPrice(String(productToEdit.price ?? 0));
      setTax(String(productToEdit.tax ?? 5));
      setNotes(productToEdit.notes || '');
    } else {
      setCode(`PRD-${Math.floor(100 + Math.random() * 900)}`);
      setDesc('');
      setCategory('Raw Materials');
      setUnit('pcs');
      setPrice('0');
      setTax('5');
      setNotes('');
    }
    setError('');
  }, [productToEdit, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!desc.trim()) {
      setError('Description is required');
      return;
    }
    const numPrice = Math.max(0, parseFloat(price) || 0);
    const numTax = Math.max(0, parseFloat(tax) || 0);

    onSave(
      {
        code: code.trim() || `PRD-${Date.now().toString().slice(-4)}`,
        desc: desc.trim(),
        category: category.trim() || 'General',
        unit: unit.trim() || 'pcs',
        price: numPrice,
        tax: numTax,
        notes: notes.trim() || undefined,
      },
      productToEdit ? productToEdit.id : undefined
    );
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-blue-100 text-blue-700 rounded-lg">
              <Package className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                {productToEdit ? 'Edit Library Product' : 'Add Item to Product Library'}
              </h2>
              <p className="text-xs text-slate-500">
                Set standard descriptions, units, and catalog unit costs
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 text-xs bg-red-50 border border-red-200 text-red-700 rounded-lg">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Item Code</label>
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="e.g. WIN-001"
                className="w-full px-3 py-2 text-sm font-mono bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Category</label>
              <input
                type="text"
                list="category-suggestions"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                placeholder="e.g. Raw Materials"
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
              />
              <datalist id="category-suggestions">
                <option value="Raw Materials" />
                <option value="Windows & Facades" />
                <option value="Doors & Partitions" />
                <option value="Hardware & Fittings" />
                <option value="Labor & Services" />
                <option value="Consumables & Sealants" />
                <option value="Logistics & Transport" />
                <option value="Engineering & Consulting" />
              </datalist>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Description <span className="text-red-500">*</span>
            </label>
            <textarea
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
              placeholder="e.g. 10mm Clear Toughened Glass with Polished Edges"
              rows={2}
              className="w-full p-3 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
              autoFocus
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Unit</label>
              <input
                type="text"
                list="unit-suggestions"
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                placeholder="m², pcs, kg..."
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
              />
              <datalist id="unit-suggestions">
                <option value="pcs" />
                <option value="m²" />
                <option value="m" />
                <option value="kg" />
                <option value="set" />
                <option value="pair" />
                <option value="hours" />
                <option value="trip" />
                <option value="job" />
                <option value="Lot" />
              </datalist>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Unit Cost ({currency})
              </label>
              <input
                type="number"
                dir="ltr"
                min="0"
                step="0.01"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                className="w-full px-3 py-2 text-sm font-mono text-left bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">VAT %</label>
              <input
                type="number"
                dir="ltr"
                min="0"
                step="0.1"
                value={tax}
                onChange={(e) => setTax(e.target.value)}
                className="w-full px-3 py-2 text-sm font-mono text-left bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Specification / Notes (Optional)
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. RAL 7016 Matt, European standard EN 12150"
              className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
            />
          </div>

          <div className="pt-2 flex justify-end gap-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm transition-colors"
            >
              {productToEdit ? 'Save Product' : 'Add to Library'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
