import React, { useState, useRef } from 'react';
import { CompanySettings, BankDetails } from '../types';
import {
  Building2,
  Percent,
  Save,
  RotateCcw,
  Landmark,
  Clock,
  FileCheck2,
  Upload,
  Image as ImageIcon,
  Trash2,
  Users,
  UserCheck,
} from 'lucide-react';

interface SettingsViewProps {
  settings: CompanySettings;
  onSaveSettings: (settings: CompanySettings) => void;
  onResetAllData: () => void;
  onOpenUserModal?: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  settings,
  onSaveSettings,
  onResetAllData,
  onOpenUserModal,
}) => {
  const [formData, setFormData] = useState<CompanySettings>(settings);
  const [logoError, setLogoError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const bank: BankDetails = formData.bankDetails || {
    accountName: 'Touch of Wood Decoration Works LLC',
    bankName: 'Wio Bank P.J.S.C.',
    currency: 'AED',
    iban: 'AE420860000009234574205',
    swift: 'WIOBAEADXXX',
    accountNumber: '9234574205',
  };

  const handleBankChange = (field: keyof BankDetails, value: string) => {
    setFormData((prev) => ({
      ...prev,
      bankDetails: {
        ...(prev.bankDetails || bank),
        [field]: value,
      },
    }));
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        setLogoError('Please select an image smaller than 2MB.');
        return;
      }
      setLogoError(null);
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          setFormData((prev) => ({ ...prev, logoUrl: reader.result as string }));
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveSettings(formData);
  };

  return (
    <div className="p-4 sm:p-6 max-w-5xl mx-auto space-y-6">
      {/* Estimators & User Profiles Management Banner */}
      {onOpenUserModal && (
        <div className="bg-gradient-to-r from-slate-900 to-blue-950 text-white rounded-xl p-5 shadow-sm border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-blue-600/30 border border-blue-400/30 flex items-center justify-center text-blue-400">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-white">Estimators &amp; Team User Management</h4>
              <p className="text-xs text-slate-300 mt-0.5">
                Manage estimators (Adel, Tariq, Sarah), assign active sales persons, and configure user permissions.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onOpenUserModal}
            className="whitespace-nowrap px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-lg shadow-sm transition-colors flex items-center gap-2 cursor-pointer"
          >
            <UserCheck className="w-4 h-4" />
            Manage Users &amp; Switch Estimator
          </button>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Company Identity & Contact Info */}
        <section className="bg-white rounded-xl border border-slate-200 shadow-xs p-5 sm:p-6 space-y-5">
          <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
            <div className="p-2 bg-amber-50 text-amber-800 rounded-lg">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Company Letterhead &amp; Brand Identity
              </h3>
              <p className="text-xs text-slate-500">
                Official details displayed across all printable quotations, PDFs, and client proposals
              </p>
            </div>
          </div>

          {/* Logo Upload Section */}
          <div className="bg-slate-50/70 p-4 rounded-xl border border-slate-200 flex flex-col sm:flex-row items-center gap-4">
            <div className="w-24 h-24 rounded-xl bg-white border border-slate-200 flex items-center justify-center overflow-hidden shadow-xs relative">
              {formData.logoUrl ? (
                <img
                  src={formData.logoUrl}
                  alt="Company Logo"
                  className="w-full h-full object-contain p-2"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="text-center p-2">
                  <div className="w-10 h-10 mx-auto rounded-lg bg-amber-900 text-amber-100 flex items-center justify-center font-bold text-xs">
                    TOW
                  </div>
                  <span className="text-[9px] text-slate-400 mt-1 block">Default Motif</span>
                </div>
              )}
            </div>

            <div className="flex-1 space-y-2 text-center sm:text-left">
              <div className="text-xs font-bold text-slate-900">Official Company Logo</div>
              <p className="text-[11px] text-slate-500">
                Upload your PNG, SVG, or JPEG logo to appear on quotation headers.
              </p>
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleLogoUpload}
                  accept="image/png,image/jpeg,image/svg+xml,image/webp"
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-3 py-1.5 text-xs font-bold text-slate-700 bg-white hover:bg-slate-100 border border-slate-300 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Upload className="w-3.5 h-3.5 text-blue-600" />
                  Upload Custom Logo
                </button>
                {formData.logoUrl && (
                  <button
                    type="button"
                    onClick={() => setFormData((prev) => ({ ...prev, logoUrl: '' }))}
                    className="px-3 py-1.5 text-xs font-bold text-red-600 hover:bg-red-50 border border-red-200 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Remove Logo
                  </button>
                )}
              </div>
              {logoError && (
                <p className="text-[11px] text-red-600 font-semibold">{logoError}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Company Name
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g. Touch Of Wood Decoration Works LLC"
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                TRN / Tax Registration Number
              </label>
              <input
                type="text"
                value={formData.trn || ''}
                onChange={(e) => setFormData({ ...formData, trn: e.target.value })}
                placeholder="e.g. 100519825200003"
                className="w-full px-3 py-2 text-xs font-mono bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Phone Number
              </label>
              <input
                type="text"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="+971 2 550 1234"
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Email Address
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="tow@touchofwood.ae"
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Website
              </label>
              <input
                type="text"
                value={formData.website || ''}
                onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                placeholder="Touchofwood.ae"
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Company Physical Address / Location
              </label>
              <input
                type="text"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                placeholder="Musaffah ICAD, Abu Dhabi, UAE"
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
              />
            </div>
          </div>
        </section>

        {/* Bank Details for Wire Transfers */}
        <section className="bg-white rounded-xl border border-slate-200 shadow-xs p-5 sm:p-6 space-y-5">
          <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
            <div className="p-2 bg-blue-50 text-blue-700 rounded-lg">
              <Landmark className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Official Bank Wire Transfer Details
              </h3>
              <p className="text-xs text-slate-500">
                Printed on quotations for client wire and direct deposit settlements
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Account Name
              </label>
              <input
                type="text"
                value={bank.accountName}
                onChange={(e) => handleBankChange('accountName', e.target.value)}
                placeholder="Touch of Wood Decoration Works LLC"
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Bank Name
              </label>
              <input
                type="text"
                value={bank.bankName}
                onChange={(e) => handleBankChange('bankName', e.target.value)}
                placeholder="Wio Bank P.J.S.C."
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                IBAN Number
              </label>
              <input
                type="text"
                value={bank.iban}
                onChange={(e) => handleBankChange('iban', e.target.value)}
                placeholder="AE420860000009234574205"
                className="w-full px-3 py-2 text-xs font-mono bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Account Number
              </label>
              <input
                type="text"
                value={bank.accountNumber}
                onChange={(e) => handleBankChange('accountNumber', e.target.value)}
                placeholder="9234574205"
                className="w-full px-3 py-2 text-xs font-mono bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                BIC / SWIFT Code
              </label>
              <input
                type="text"
                value={bank.swift}
                onChange={(e) => handleBankChange('swift', e.target.value)}
                placeholder="WIOBAEADXXX"
                className="w-full px-3 py-2 text-xs font-mono bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Account Currency
              </label>
              <input
                type="text"
                value={bank.currency}
                onChange={(e) => handleBankChange('currency', e.target.value)}
                placeholder="AED"
                className="w-full px-3 py-2 text-xs font-mono bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
              />
            </div>
          </div>
        </section>

        {/* Costing & Formula Defaults */}
        <section className="bg-white rounded-xl border border-slate-200 shadow-xs p-5 sm:p-6 space-y-5">
          <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
              <Percent className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Costing Formulas &amp; Defaults
              </h3>
              <p className="text-xs text-slate-500">
                Default markup %, overheads %, and standard UAE VAT rates
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Default Currency
              </label>
              <select
                value={formData.currency}
                onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                className="w-full px-3 py-2 text-xs font-semibold bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
              >
                <option value="AED">AED — UAE Dirham</option>
                <option value="USD">USD — US Dollar ($)</option>
                <option value="EUR">EUR — Euro (€)</option>
                <option value="GBP">GBP — British Pound (£)</option>
                <option value="SAR">SAR — Saudi Riyal</option>
                <option value="QAR">QAR — Qatari Riyal</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Default VAT %
              </label>
              <input
                type="number"
                dir="ltr"
                min="0"
                step="0.1"
                value={formData.tax}
                onChange={(e) =>
                  setFormData({ ...formData, tax: Math.max(0, parseFloat(e.target.value) || 0) })
                }
                className="w-full px-3 py-2 text-xs font-mono text-left bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Overheads Rate %
              </label>
              <input
                type="number"
                dir="ltr"
                min="0"
                step="0.5"
                value={formData.overheadPct}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    overheadPct: Math.max(0, parseFloat(e.target.value) || 0),
                  })
                }
                className="w-full px-3 py-2 text-xs font-mono text-left bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
              />
              <span className="text-[10px] text-slate-400 mt-1 block">Default: 30%</span>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Profit Margin / Markup %
              </label>
              <input
                type="number"
                dir="ltr"
                min="0"
                step="0.5"
                value={formData.markupPct}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    markupPct: Math.max(0, parseFloat(e.target.value) || 0),
                  })
                }
                className="w-full px-3 py-2 text-xs font-mono text-left bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
              />
              <span className="text-[10px] text-slate-400 mt-1 block">Default: 40%</span>
            </div>
          </div>
        </section>

        {/* Quotation Numbering & Prefix Settings */}
        <section className="bg-white rounded-xl border border-slate-200 shadow-xs p-5 sm:p-6 space-y-5">
          <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
            <div className="p-2 bg-blue-50 text-blue-700 rounded-lg">
              <FileCheck2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Quotation Numbering &amp; Identification
              </h3>
              <p className="text-xs text-slate-500">
                Configure your company's official quotation numbering prefix and reference formatting
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Quotation Number Prefix
              </label>
              <input
                type="text"
                value={formData.quotePrefix || 'QT'}
                onChange={(e) => setFormData({ ...formData, quotePrefix: e.target.value.toUpperCase() })}
                placeholder="e.g. QT or TOW-QT"
                className="w-full px-3 py-2 text-xs font-mono font-bold uppercase bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
              />
              <span className="text-[10px] text-slate-500 mt-1 block">
                Standard prefix appearing at the start of generated quote numbers.
              </span>
            </div>

            <div className="bg-slate-50 p-3.5 rounded-lg border border-slate-200 flex flex-col justify-center">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">
                Live Sample Output:
              </span>
              <div className="font-mono font-bold text-sm text-blue-900 mt-1">
                {(formData.quotePrefix || 'QT').trim()}-{new Date().getFullYear()}-00045
              </div>
              <span className="text-[10px] text-slate-500 mt-0.5">
                Each new quotation can also be freely customized or edited in the quotation editor.
              </span>
            </div>
          </div>
        </section>

        {/* Payment Terms & Completion Defaults */}
        <section className="bg-white rounded-xl border border-slate-200 shadow-xs p-5 sm:p-6 space-y-5">
          <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
            <div className="p-2 bg-amber-50 text-amber-900 rounded-lg">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Payment Terms &amp; Work Completion
              </h3>
              <p className="text-xs text-slate-500">
                Standard payment milestones and production timelines
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Standard Payment Milestones
              </label>
              <textarea
                rows={3}
                value={formData.paymentTerms || ''}
                onChange={(e) => setFormData({ ...formData, paymentTerms: e.target.value })}
                placeholder="• 60% in advance along with order confirmation&#10;• 30% progressive painting works&#10;• 10% progressive bill prior delivery"
                className="w-full p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 leading-relaxed"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Completion of Works Timeline
              </label>
              <textarea
                rows={3}
                value={formData.completionTerms || ''}
                onChange={(e) => setFormData({ ...formData, completionTerms: e.target.value })}
                placeholder="20 Working Days from the date of Advance Payment, after all measurements are taken from the site and approved Drawings."
                className="w-full p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 leading-relaxed"
              />
            </div>
          </div>
        </section>

        {/* Standard 11 Terms & Conditions */}
        <section className="bg-white rounded-xl border border-slate-200 shadow-xs p-5 sm:p-6 space-y-5">
          <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
            <div className="p-2 bg-emerald-50 text-emerald-700 rounded-lg">
              <FileCheck2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Standard Terms &amp; Conditions (Contract Clauses)
              </h3>
              <p className="text-xs text-slate-500">
                Clauses printed in the footer and terms section of all quotations
              </p>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Terms &amp; Conditions Text (Numbered Clauses)
            </label>
            <textarea
              rows={8}
              value={formData.defaultTerms || ''}
              onChange={(e) => setFormData({ ...formData, defaultTerms: e.target.value })}
              placeholder="1. Our offer covers only the scope of works...&#10;2. This Quotation Based on your key plan..."
              className="w-full p-3 text-xs font-mono bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 leading-relaxed"
            />
          </div>
        </section>

        {/* Action Controls */}
        <div className="flex items-center justify-between pt-2">
          <button
            type="button"
            onClick={onResetAllData}
            className="px-4 py-2 text-xs font-bold text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 border border-red-200 rounded-lg transition-colors cursor-pointer"
          >
            Reset All Sample Data
          </button>

          <button
            type="submit"
            className="inline-flex items-center gap-2 px-6 py-2.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-md shadow-blue-500/20 transition-colors cursor-pointer"
          >
            <Save className="w-4 h-4" />
            Save Settings &amp; Brand Profile
          </button>
        </div>
      </form>
    </div>
  );
};

