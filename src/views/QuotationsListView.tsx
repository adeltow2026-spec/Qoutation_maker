import React, { useState, useMemo } from 'react';
import { Quotation, Customer } from '../types';
import { formatMoney } from '../utils/formatters';
import { Search, Plus, Printer, Edit, Trash2, Copy, FileText } from 'lucide-react';

interface QuotationsListViewProps {
  quotes: Quotation[];
  customers: Customer[];
  onNewQuotation: () => void;
  onOpenQuote: (quote: Quotation) => void;
  onDuplicateQuote: (quote: Quotation) => void;
  onDeleteQuote: (id: string) => void;
  onPrintQuote: (quote: Quotation) => void;
}

export const QuotationsListView: React.FC<QuotationsListViewProps> = ({
  quotes,
  customers,
  onNewQuotation,
  onOpenQuote,
  onDuplicateQuote,
  onDeleteQuote,
  onPrintQuote,
}) => {
  const [search, setSearch] = useState('');

  const filteredQuotes = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return [...quotes].reverse();
    return quotes
      .filter((item) => {
        const cust = customers.find((c) => c.id === item.customerId);
        return (
          item.quoteNo.toLowerCase().includes(q) ||
          (item.project && item.project.toLowerCase().includes(q)) ||
          (cust?.name && cust.name.toLowerCase().includes(q)) ||
          (item.salesPerson && item.salesPerson.toLowerCase().includes(q))
        );
      })
      .reverse();
  }, [quotes, customers, search]);

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        {/* Header & Search */}
        <div className="p-5 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-50/50">
          <div>
            <h2 className="text-base font-bold text-slate-900">All Saved Quotations</h2>
            <p className="text-xs text-slate-500">
              Search, duplicate, export, or print finalized customer quotations
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative w-64">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search quotes by number, client..."
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
              />
            </div>

            <button
              type="button"
              onClick={onNewQuotation}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors cursor-pointer whitespace-nowrap"
            >
              <Plus className="w-3.5 h-3.5" />
              New Quotation
            </button>
          </div>
        </div>

        {/* Quotes List Table */}
        {filteredQuotes.length === 0 ? (
          <div className="p-12 text-center text-slate-400">
            <FileText className="w-10 h-10 mx-auto text-slate-300 mb-2" />
            <p className="font-semibold text-slate-700 text-sm">No quotations found</p>
            <p className="text-xs text-slate-500 mt-1">
              {search ? 'Try clearing your search query.' : 'Create a new quotation to get started.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 text-[11px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200">
                  <th className="py-3 px-4">Quote No.</th>
                  <th className="py-3 px-4">Client / Customer</th>
                  <th className="py-3 px-4">Project</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Sales Person</th>
                  <th className="py-3 px-4 text-right">Grand Total</th>
                  <th className="py-3 px-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {filteredQuotes.map((q) => {
                  const cust = customers.find((c) => c.id === q.customerId);
                  return (
                    <tr key={q.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-bold text-blue-700">
                        {q.quoteNo}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900">{cust?.name || q.customerName || '—'}</div>
                        <div className="text-[11px] text-slate-500 line-clamp-1">{q.address}</div>
                      </td>
                      <td className="py-3.5 px-4 text-slate-700 font-medium">
                        {q.project || 'General'}
                      </td>
                      <td className="py-3.5 px-4 text-slate-600">{q.date}</td>
                      <td className="py-3.5 px-4 text-slate-600">{q.salesPerson || 'Admin'}</td>
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
                            Open
                          </button>
                          <button
                            type="button"
                            onClick={() => onPrintQuote(q)}
                            title="Preview & Print PDF"
                            className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded transition-colors cursor-pointer"
                          >
                            <Printer className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => onDuplicateQuote(q)}
                            title="Duplicate Quote"
                            className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors cursor-pointer"
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => onDeleteQuote(q.id)}
                            title="Delete Quote"
                            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors cursor-pointer"
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
