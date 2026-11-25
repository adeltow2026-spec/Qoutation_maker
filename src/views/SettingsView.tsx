import React, { useState, useRef } from 'react';
import { CompanySettings, BankDetails, ContractTermsConfig, UaeHolidayItem } from '../types';
import {
  DEFAULT_CONTRACT_TERMS,
  DEFAULT_UAE_PUBLIC_HOLIDAYS,
  MANAGEMENT_ADMIN_EMAIL,
} from '../utils/documentSuite';
import {
  Building2,
  Calendar,
  Percent,
  Plus,
  Save,
  RotateCcw,
  Landmark,
  Clock,
  FileCheck2,
  Upload,
  Trash2,
  Users,
  UserCheck,
  FileSignature,
  Lock,
  ShieldCheck,
} from 'lucide-react';

interface SettingsViewProps {
  settings: CompanySettings;
  canEditContractLocks?: boolean;
  onSaveSettings: (settings: CompanySettings) => void;
  onResetAllData: () => void;
  onOpenUserModal?: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  settings,
  canEditContractLocks = false,
  onSaveSettings,
  onResetAllData,
  onOpenUserModal,
}) => {
  const [formData, setFormData] = useState<CompanySettings>(settings);
  const [logoError, setLogoError] = useState<string | null>(null);
  const [newHolidayDate, setNewHolidayDate] = useState('');
  const [newHolidayName, setNewHolidayName] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const uaeHolidays: UaeHolidayItem[] = Array.isArray(formData.uaePublicHolidays)
    ? formData.uaePublicHolidays
    : DEFAULT_UAE_PUBLIC_HOLIDAYS;

  const handleAddHoliday = () => {
    if (!newHolidayDate || !newHolidayName.trim()) return;
    const item: UaeHolidayItem = {
      id: 'hol_' + Math.random().toString(36).substring(2, 8) + Date.now().toString(36),
      date: newHolidayDate,
      name: newHolidayName.trim(),
    };
    const next = [...uaeHolidays, item].sort((a, b) => a.date.localeCompare(b.date));
    setFormData((prev) => ({ ...prev, uaePublicHolidays: next }));
    setNewHolidayDate('');
    setNewHolidayName('');
  };

  const handleRemoveHoliday = (id: string) => {
    setFormData((prev) => ({
      ...prev,
      uaePublicHolidays: uaeHolidays.filter((h) => h.id !== id),
    }));
  };

  const handleResetHolidays = () => {
    setFormData((prev) => ({
      ...prev,
      uaePublicHolidays: [...DEFAULT_UAE_PUBLIC_HOLIDAYS],
    }));
  };

  const contractDefaults: ContractTermsConfig = {
    ...DEFAULT_CONTRACT_TERMS,
    ...(formData.contractDefaults || {}),
  };

  const handleContractDefaultChange = <K extends keyof ContractTermsConfig>(
    field: K,
    value: ContractTermsConfig[K]
  ) => {
    if (!canEditContractLocks) return;
    setFormData((prev) => ({
      ...prev,
      contractDefaults: {
        ...DEFAULT_CONTRACT_TERMS,
        ...(prev.contractDefaults || {}),
        [field]: value,
      },
    }));
  };

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
                placeholder="+97126504708"
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

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Authorized Signatory Name (Contracts &amp; Certificates)
              </label>
              <input
                type="text"
                value={formData.authorizedSignatoryName || ''}
                onChange={(e) =>
                  setFormData({ ...formData, authorizedSignatoryName: e.target.value })
                }
                placeholder="e.g. Adel"
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Authorized Signatory Position / Title
              </label>
              <input
                type="text"
                value={formData.authorizedSignatoryTitle || ''}
                onChange={(e) =>
                  setFormData({ ...formData, authorizedSignatoryTitle: e.target.value })
                }
                placeholder="e.g. Managing Director"
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
                value={formData.tax === 0 ? '' : formData.tax}
                placeholder="0"
                onFocus={(e) => e.target.select()}
                onChange={(e) => {
                  const v = e.target.value;
                  setFormData({ ...formData, tax: v === '' ? 0 : Math.max(0, parseFloat(v) || 0) });
                }}
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
                value={formData.overheadPct === 0 ? '' : formData.overheadPct}
                placeholder="0"
                onFocus={(e) => e.target.select()}
                onChange={(e) => {
                  const v = e.target.value;
                  setFormData({
                    ...formData,
                    overheadPct: v === '' ? 0 : Math.max(0, parseFloat(v) || 0),
                  });
                }}
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
                value={formData.markupPct === 0 ? '' : formData.markupPct}
                placeholder="0"
                onFocus={(e) => e.target.select()}
                onChange={(e) => {
                  const v = e.target.value;
                  setFormData({
                    ...formData,
                    markupPct: v === '' ? 0 : Math.max(0, parseFloat(v) || 0),
                  });
                }}
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
                placeholder="1. 60% Advance Payment along with signed quotation & order confirmation&#10;2. 30% Upon completion of factory joinery fabrication & progressive painting&#10;3. 10% Prior to final site delivery and handover"
                className="w-full p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 leading-relaxed font-mono"
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
                placeholder="The timeline will be explained in the contract."
                className="w-full p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 leading-relaxed"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Default Commercial Notes &amp; Special Project Conditions
            </label>
            <textarea
              rows={3}
              value={formData.defaultNotes || ''}
              onChange={(e) => setFormData({ ...formData, defaultNotes: e.target.value })}
              placeholder="e.g. Quotation includes supply, fabrication, and installation. Excludes civil works and MEP modifications..."
              className="w-full p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 leading-relaxed"
            />
            <span className="text-[10px] text-slate-500 mt-1 block">
              Pre-fills new quotations automatically in the Commercial Notes &amp; Special Conditions box.
            </span>
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

        {/* Document Suite Contract Fixed Fees & Warranty Defaults (Admin-Only) */}
        <section className="bg-white rounded-xl border border-slate-200 shadow-xs p-5 sm:p-6 space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-slate-900 text-amber-300 rounded-lg">
                <FileSignature className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  Contract Fixed Fees &amp; Warranty Defaults (NOV Version)
                </h3>
                <p className="text-xs text-slate-500">
                  Pre-fills all new Contracts &amp; Sample Confirmations. Protected by Admin permission.
                </p>
              </div>
            </div>

            {canEditContractLocks ? (
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-emerald-700">
                  <ShieldCheck className="w-4 h-4" />
                  Management Unlocked ({MANAGEMENT_ADMIN_EMAIL})
                </span>
                <button
                  type="button"
                  onClick={() =>
                    setFormData((prev) => ({
                      ...prev,
                      contractDefaults: { ...DEFAULT_CONTRACT_TERMS },
                    }))
                  }
                  className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-md transition-colors cursor-pointer"
                >
                  <RotateCcw className="w-3 h-3" />
                  Restore NOV Defaults
                </button>
              </div>
            ) : (
              <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-amber-800">
                <Lock className="w-3.5 h-3.5" />
                Locked — Management Only ({MANAGEMENT_ADMIN_EMAIL})
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3.5">
            {(
              [
                { key: 'warrantyYears', label: 'Workmanship Warranty (Years)' },
                { key: 'clientSuppliedMarkupPct', label: 'Client-Supplied Markup (%)' },
                { key: 'additionalRevisionFee', label: 'Extra 2D Revision Fee (AED)' },
                { key: 'extraSampleSessionFee', label: 'Sample Session Fee (AED)' },
                { key: 'extraCustomSampleFee', label: 'Custom Sample Fee (AED)' },
                { key: 'sampleSiteDeliveryFee', label: 'Sample Site Delivery (AED)' },
                { key: 'postAcceptanceCalloutFee', label: 'Site Call-Out Fee (AED)' },
                { key: 'abortedSiteVisitFee', label: 'Standby Daily Rate (AED/day)' },
                { key: 'factoryStorageFreeDays', label: 'Free Storage Grace (Days)' },
                { key: 'factoryStorageDailyFee', label: 'Storage Daily Fee (AED/day)' },
                { key: 'voScopeCeiling', label: 'Minor VO Ceiling (AED)' },
                { key: 'cancellationFeePct', label: 'Cancellation Admin Fee (%)' },
                { key: 'liabilityCapPct', label: 'Liability Cap (%)' },
                { key: 'stage1Pct', label: 'Default Stage 1 Advance (%)' },
                { key: 'stage2Pct', label: 'Default Stage 2 Progress (%)' },
                { key: 'stage3Pct', label: 'Default Stage 3 Final (%)' },
              ] as Array<{ key: keyof ContractTermsConfig; label: string }>
            ).map((field) => {
              const val = Number(contractDefaults[field.key] ?? 0);
              return (
                <div key={field.key}>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    {field.label}
                  </label>
                  <input
                    type="number"
                    dir="ltr"
                    min="0"
                    step="any"
                    disabled={!canEditContractLocks}
                    value={val === 0 ? '' : val}
                    placeholder="0"
                    onFocus={(e) => e.target.select()}
                    onChange={(e) => {
                      const raw = e.target.value;
                      handleContractDefaultChange(
                        field.key,
                        (raw === '' ? 0 : Math.max(0, parseFloat(raw) || 0)) as never
                      );
                    }}
                    className={`w-full px-3 py-2 text-xs font-mono tabular-nums rounded-lg border focus:outline-none ${
                      canEditContractLocks
                        ? 'bg-slate-50 border-slate-200 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 text-slate-900'
                        : 'bg-slate-100 border-slate-200 text-slate-500 cursor-not-allowed'
                    }`}
                  />
                </div>
              );
            })}
          </div>
        </section>

        {/* UAE Public Holidays Calendar (Clause 6.1 Working-Day Calculation) */}
        <section className="bg-white rounded-xl border border-slate-200 shadow-xs p-5 sm:p-6 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-emerald-50 text-emerald-700 rounded-lg">
                <Calendar className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  UAE Public Holidays (Working-Day Calendar)
                </h3>
                <p className="text-xs text-slate-500">
                  Contract timelines count Monday–Saturday working days (Clause 6.1), automatically skipping Sundays and the UAE holidays below.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleResetHolidays}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Reset UAE Defaults
            </button>
          </div>

          <div className="flex flex-col sm:flex-row gap-2.5">
            <input
              type="date"
              value={newHolidayDate}
              onChange={(e) => setNewHolidayDate(e.target.value)}
              className="px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:border-blue-600 focus:outline-none sm:w-44"
            />
            <input
              type="text"
              value={newHolidayName}
              onChange={(e) => setNewHolidayName(e.target.value)}
              placeholder="Holiday name (e.g. Eid Al Fitr Day 1, UAE National Day...)"
              className="flex-1 px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:border-blue-600 focus:outline-none"
            />
            <button
              type="button"
              onClick={handleAddHoliday}
              disabled={!newHolidayDate || !newHolidayName.trim()}
              className="inline-flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
            >
              <Plus className="w-3.5 h-3.5" />
              Add Holiday
            </button>
          </div>

          {uaeHolidays.length === 0 ? (
            <p className="text-xs text-slate-400 italic">
              No public holidays listed — only Sundays will be excluded when calculating working days.
            </p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 max-h-56 overflow-y-auto pr-1">
              {uaeHolidays.map((h) => (
                <div
                  key={h.id}
                  className="flex items-center justify-between gap-2 px-3 py-2 rounded-lg border border-slate-200 bg-slate-50/70 text-xs"
                >
                  <div className="min-w-0">
                    <div className="font-mono font-bold text-slate-800 text-[11px]">{h.date}</div>
                    <div className="text-slate-600 truncate" title={h.name}>
                      {h.name}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemoveHoliday(h.id)}
                    title="Remove holiday"
                    className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded cursor-pointer shrink-0"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
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

