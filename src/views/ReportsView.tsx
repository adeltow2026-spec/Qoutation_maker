import React from 'react';
import { Quotation, Customer, Product } from '../types';
import { formatMoney } from '../utils/formatters';
import { Download, Upload, BarChart3, Database, FileSpreadsheet, ShieldCheck } from 'lucide-react';

interface ReportsViewProps {
  quotes: Quotation[];
  customers: Customer[];
  products: Product[];
  currency: string;
  onExportBackup: () => void;
  onImportBackup: (importedData: any) => void;
}

export const ReportsView: React.FC<ReportsViewProps> = ({
  quotes,
  customers,
  products,
  currency,
  onExportBackup,
  onImportBackup,
}) => {
  const totalValue = quotes.reduce((sum, q) => sum + (Number(q.total) || 0), 0);
  const totalVat = quotes.reduce((sum, q) => sum + (Number(q.vatAmount) || 0), 0);
  const totalSubtotal = quotes.reduce((sum, q) => sum + (Number(q.subtotal) || 0), 0);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        if (json && Array.isArray(json.library) && Array.isArray(json.customers)) {
          onImportBackup(json);
        } else {
          alert('Invalid backup file format.');
        }
      } catch (err) {
        alert('Failed to parse JSON file.');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Financial Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-2">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Total Quotations Value
          </span>
          <div className="text-2xl font-bold font-mono text-blue-700">
            {formatMoney(totalValue)} <span className="text-xs font-sans text-slate-500">{currency}</span>
          </div>
          <p className="text-[11px] text-slate-500">Gross pipeline across all saved estimates</p>
        </div>

        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-2">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Net Subtotal Quoted
          </span>
          <div className="text-2xl font-bold font-mono text-slate-900">
            {formatMoney(totalSubtotal)} <span className="text-xs font-sans text-slate-500">{currency}</span>
          </div>
          <p className="text-[11px] text-slate-500">Excluding value added tax</p>
        </div>

        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-2">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Total Projected VAT
          </span>
          <div className="text-2xl font-bold font-mono text-emerald-700">
            {formatMoney(totalVat)} <span className="text-xs font-sans text-slate-500">{currency}</span>
          </div>
          <p className="text-[11px] text-slate-500">Total estimated tax liability</p>
        </div>
      </div>

      {/* Backup and Data Management */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-6 space-y-5">
        <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
          <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
            <Database className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900">Data Backup &amp; Portability</h3>
            <p className="text-xs text-slate-500">
              Download your entire product catalog, customer database, and quotation history as a JSON backup
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
          <div className="border border-slate-200 rounded-xl p-5 space-y-3 bg-slate-50/50">
            <div className="flex items-center gap-2 text-sm font-bold text-slate-900">
              <Download className="w-4 h-4 text-blue-600" />
              Export Full Database Backup
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Export all {quotes.length} quotations, {products.length} product items, and {customers.length} customer records to an offline JSON file.
            </p>
            <button
              type="button"
              onClick={onExportBackup}
              className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm transition-colors cursor-pointer"
            >
              <Download className="w-4 h-4" />
              Download JSON Backup
            </button>
          </div>

          <div className="border border-slate-200 rounded-xl p-5 space-y-3 bg-slate-50/50">
            <div className="flex items-center gap-2 text-sm font-bold text-slate-900">
              <Upload className="w-4 h-4 text-emerald-600" />
              Restore Database from File
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Load previously exported JSON backup files to restore your records on any device or browser.
            </p>
            <label className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold text-slate-700 bg-white hover:bg-slate-100 border border-slate-300 rounded-lg shadow-xs transition-colors cursor-pointer">
              <Upload className="w-4 h-4" />
              Choose Backup JSON File
              <input
                type="file"
                accept=".json"
                onChange={handleFileUpload}
                className="hidden"
              />
            </label>
          </div>
        </div>
      </div>
    </div>
  );
};
