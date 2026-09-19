import React from 'react';
import { Quotation, Customer, Product } from '../types';
import { formatMoney } from '../utils/formatters';
import {
  FileText,
  Users,
  Package,
  FileCheck2,
  TrendingUp,
  Plus,
  ArrowRight,
  Clock,
  Printer,
  Edit,
  Trash2,
  ExternalLink,
} from 'lucide-react';

interface DashboardViewProps {
  quotes: Quotation[];
  customers: Customer[];
  products: Product[];
  draft: Quotation | null;
  currency: string;
  onNewQuotation: () => void;
  onOpenQuote: (quote: Quotation) => void;
  onDeleteQuote: (id: string) => void;
  onPrintQuote: (quote: Quotation) => void;
  onNavigateToDraft: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  quotes,
  customers,
  products,
  draft,
  currency,
  onNewQuotation,
  onOpenQuote,
  onDeleteQuote,
  onPrintQuote,
  onNavigateToDraft,
}) => {
  const totalQuotedValue = quotes.reduce((sum, q) => sum + (Number(q.total) || 0), 0);
  const recentQuotes = [...quotes].reverse().slice(0, 5);

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Draft Notification Banner */}
      {draft && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-100 text-amber-800 rounded-lg">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-bold text-amber-900">
                You have an uncommitted quotation draft in progress
              </div>
              <div className="text-[11px] text-amber-700 mt-0.5">
                Quote No: {draft.quoteNo} • Total: {formatMoney(draft.total)} {draft.currency}
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={onNavigateToDraft}
            className="px-3.5 py-1.5 text-xs font-bold text-amber-900 bg-amber-200/80 hover:bg-amber-200 rounded-lg transition-colors cursor-pointer"
          >
            Resume Editing Draft →
          </button>
        </div>
      )}

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold uppercase tracking-wider">Total Saved Quotes</span>
            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
              <FileText className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900">{quotes.length}</div>
          <div className="text-[11px] text-slate-500 font-medium">Ready for PDF / Client delivery</div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold uppercase tracking-wider">Total Quoted Value</span>
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900 font-mono">
            {formatMoney(totalQuotedValue)} <span className="text-xs font-sans text-slate-500">{currency}</span>
          </div>
          <div className="text-[11px] text-slate-500 font-medium">Across all finalized estimates</div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold uppercase tracking-wider">Customer Directory</span>
            <div className="p-2 bg-purple-50 text-purple-600 rounded-lg">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900">{customers.length}</div>
          <div className="text-[11px] text-slate-500 font-medium">Active corporate client records</div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold uppercase tracking-wider">Product Library</span>
            <div className="p-2 bg-amber-50 text-amber-600 rounded-lg">
              <Package className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900">{products.length}</div>
          <div className="text-[11px] text-slate-500 font-medium">Catalog items with auto-rates</div>
        </div>
      </div>

      {/* Recent Quotations Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900">Recent Quotations</h2>
            <p className="text-xs text-slate-500">Recently generated quotes and estimates</p>
          </div>
          <button
            type="button"
            onClick={onNewQuotation}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            New Quotation
          </button>
        </div>

        {recentQuotes.length === 0 ? (
          <div className="p-12 text-center text-slate-400">
            <FileText className="w-10 h-10 mx-auto text-slate-300 mb-2" />
            <p className="font-semibold text-slate-700 text-sm">No quotations saved yet</p>
            <p className="text-xs text-slate-500 mt-1 mb-4">
              Click &quot;New Quotation&quot; to build your first estimation with product library integration.
            </p>
            <button
              type="button"
              onClick={onNewQuotation}
              className="px-4 py-2 text-xs font-bold text-blue-700 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors cursor-pointer"
            >
              Create First Quotation
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 text-[11px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200">
                  <th className="py-3 px-4">Quote No.</th>
                  <th className="py-3 px-4">Customer</th>
                  <th className="py-3 px-4">Project</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4 text-right">Grand Total</th>
                  <th className="py-3 px-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {recentQuotes.map((q) => {
                  const cust = customers.find((c) => c.id === q.customerId);
                  return (
                    <tr key={q.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3.5 px-4">
                        <button
                          type="button"
                          onClick={() => onOpenQuote(q)}
                          className="font-mono font-bold text-blue-700 hover:text-blue-900 hover:underline cursor-pointer flex items-center gap-1 group text-left"
                          title={`Open Quotation ${q.quoteNo}`}
                        >
                          <span>{q.quoteNo}</span>
                          <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity text-blue-500" />
                        </button>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900">{cust?.name || q.customerName || '—'}</div>
                        <div className="text-[11px] text-slate-500 line-clamp-1">{q.address}</div>
                      </td>
                      <td className="py-3.5 px-4 text-slate-700 font-medium">
                        {q.project || 'General Project'}
                      </td>
                      <td className="py-3.5 px-4 text-slate-600">{q.date}</td>
                      <td className="py-3.5 px-4 text-right font-mono font-bold text-slate-900">
                        {formatMoney(q.total)} {q.currency}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => onOpenQuote(q)}
                            className="px-2.5 py-1 text-[11px] font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded transition-colors cursor-pointer"
                          >
                            Open / Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => onPrintQuote(q)}
                            title="Print / PDF"
                            className="p-1 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded transition-colors cursor-pointer"
                          >
                            <Printer className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => onDeleteQuote(q.id)}
                            title="Delete"
                            className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
