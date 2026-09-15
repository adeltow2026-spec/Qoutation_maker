import React from 'react';
import { Quotation, CompanySettings, Customer } from '../types';
import { formatMoney, getScopeFinalUnitPrice, calculateScopeLineTotal } from '../utils/formatters';
import { Building, Landmark, Clock, FileCheck2, Image as ImageIcon } from 'lucide-react';
import { FormattedDescription } from './FormattedDescription';

interface PrintQuotationProps {
  quotation: Quotation;
  customer?: Customer;
  settings: CompanySettings;
}

export const PrintQuotation: React.FC<PrintQuotationProps> = ({
  quotation,
  customer,
  settings,
}) => {
  const overheadPct = settings.overheadPct ?? 30;
  const markupPct = settings.markupPct ?? 40;

  const bank = settings.bankDetails || {
    accountName: 'Touch of Wood Decoration Works LLC',
    bankName: 'Wio Bank P.J.S.C.',
    currency: 'AED',
    iban: 'AE420860000009234574205',
    swift: 'WIOBAEADXXX',
    accountNumber: '9234574205',
  };

  return (
    <div
      id="print-area"
      className="p-8 sm:p-12 max-w-4xl mx-auto bg-white text-slate-900 font-['Plus_Jakarta_Sans',sans-serif] leading-normal"
      style={{ minHeight: '1000px' }}
    >
      {/* Letterhead Header */}
      <div className="flex justify-between items-start border-b-2 border-amber-900/40 pb-6 mb-8">
        <div className="flex items-start gap-4">
          {/* Logo Badge */}
          {settings.logoUrl ? (
            <div className="h-20 w-20 flex-shrink-0 flex items-center justify-center p-1 bg-white rounded-lg border border-slate-200/80 shadow-xs">
              <img
                src={settings.logoUrl}
                alt={settings.name}
                className="max-h-full max-w-full object-contain"
                referrerPolicy="no-referrer"
              />
            </div>
          ) : (
            <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-amber-800 to-amber-950 text-amber-100 flex flex-col items-center justify-center shadow-md flex-shrink-0 border border-amber-700/50">
              <span className="text-xs font-black tracking-widest text-amber-200">TOW</span>
              <span className="text-[8px] uppercase tracking-tighter opacity-80">WOOD</span>
            </div>
          )}

          <div>
            <div className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 uppercase">
              {settings.name || 'Touch Of Wood Decoration Works LLC'}
            </div>
            {settings.trn && (
              <div className="text-xs font-bold text-slate-700 mt-1">
                TRN: <span className="font-mono text-amber-900">{settings.trn}</span>
              </div>
            )}
            {settings.address && (
              <div className="text-xs text-slate-600 mt-0.5 max-w-md">{settings.address}</div>
            )}
            <div className="text-xs text-slate-500 mt-1 flex flex-wrap gap-x-4 gap-y-0.5">
              {settings.phone && <span>Tel: {settings.phone}</span>}
              {settings.email && <span>Email: {settings.email}</span>}
              {settings.website && <span>Web: {settings.website}</span>}
            </div>
          </div>
        </div>

        <div className="text-right flex-shrink-0">
          <div className="inline-block px-3.5 py-1 bg-amber-950 text-amber-100 font-extrabold text-sm tracking-wider uppercase rounded shadow-xs">
            QUOTATION
          </div>
          <div className="text-lg font-mono font-black text-slate-900 mt-2">
            {quotation.quoteNo}
          </div>
          <div className="text-xs text-slate-600 mt-1">
            Date: <span className="font-semibold text-slate-900">{quotation.date}</span>
          </div>
          <div className="text-xs text-slate-600">
            Valid Until: <span className="font-semibold text-slate-900">{quotation.validUntil}</span>
          </div>
        </div>
      </div>

      {/* Bill To & Project Info */}
      <div className="grid grid-cols-2 gap-8 mb-8 bg-slate-50/80 p-4 rounded-xl border border-slate-200">
        <div>
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
            Bill To / Client
          </div>
          <div className="text-sm font-bold text-slate-900">
            {customer?.name || quotation.customerName || 'Valued Client'}
          </div>
          {customer?.trn && (
            <div className="text-xs text-slate-600 mt-0.5">
              Client TRN: <span className="font-mono">{customer.trn}</span>
            </div>
          )}
          <div className="text-xs text-slate-600 mt-1 whitespace-pre-line">
            {quotation.address || customer?.address || '—'}
          </div>
          {customer?.phone && (
            <div className="text-xs text-slate-600 mt-1">Contact: {customer.phone}</div>
          )}
        </div>

        <div className="text-right sm:text-left sm:pl-8 sm:border-l sm:border-slate-200">
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
            Project &amp; Sales Reference
          </div>
          <div className="text-xs text-slate-700">
            <span className="text-slate-500 font-medium">Project:</span>{' '}
            <span className="font-bold text-slate-900">{quotation.project || 'Interior Fit-out & Joinery'}</span>
          </div>
          <div className="text-xs text-slate-700 mt-1">
            <span className="text-slate-500 font-medium">Sales Rep:</span>{' '}
            <span className="font-semibold text-slate-900">{quotation.salesPerson || 'Adel / Sales Team'}</span>
          </div>
          <div className="text-xs text-slate-700 mt-1">
            <span className="text-slate-500 font-medium">Currency:</span>{' '}
            <span className="font-bold text-amber-900">{quotation.currency || 'AED'}</span>
          </div>
        </div>
      </div>

      {/* Line Items Table */}
      <div className="mb-8">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-y-2 border-slate-900 bg-slate-100 text-[11px] font-extrabold uppercase tracking-wider text-slate-800">
              <th className="py-2.5 px-3 w-10 text-center">#</th>
              <th className="py-2.5 px-3">Scope &amp; Technical Description</th>
              <th className="py-2.5 px-3 w-16 text-center">Qty</th>
              <th className="py-2.5 px-3 w-16 text-center">Unit</th>
              <th className="py-2.5 px-3 w-28 text-right">Unit Rate ({quotation.currency})</th>
              <th className="py-2.5 px-3 w-32 text-right">Amount ({quotation.currency})</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 text-xs">
            {quotation.scopes.map((scope, index) => {
              const unitPrice = getScopeFinalUnitPrice(scope, overheadPct, markupPct);
              const lineTotal = calculateScopeLineTotal(scope, overheadPct, markupPct);
              return (
                <tr key={scope.id || index} className="align-top">
                  <td className="py-3.5 px-3 text-center font-bold text-slate-500">{index + 1}</td>
                  <td className="py-3.5 px-3">
                    <div className="font-bold text-slate-900 text-xs">{scope.name}</div>
                    <FormattedDescription description={scope.description || ''} isPrint={true} />
                    {/* Per-Scope Reference Drawing / Photo in Official Quotation */}
                    {scope.photoUrl && (
                      <div className="mt-2.5 p-2 bg-slate-50/80 rounded-lg border border-slate-200/90 max-w-sm">
                        <div className="max-h-48 w-full overflow-hidden rounded border border-slate-200 bg-white flex items-center justify-center p-1">
                          <img
                            src={scope.photoUrl}
                            alt={scope.photoCaption || `${scope.name} Reference Visual`}
                            className="max-h-44 w-auto max-w-full object-contain mx-auto rounded"
                            referrerPolicy="no-referrer"
                          />
                        </div>
                        {scope.photoCaption && (
                          <div className="text-[10px] font-semibold text-slate-600 mt-1 text-center flex items-center justify-center gap-1">
                            <ImageIcon className="w-3 h-3 text-slate-400" />
                            <span className="text-slate-400 font-normal">Drawing / Ref:</span> {scope.photoCaption}
                          </div>
                        )}
                      </div>
                    )}
                    {/* Category summary tags */}
                    <div className="text-[10px] text-slate-500 mt-1.5 font-medium">
                      <span className="font-semibold text-slate-600">Breakdown: </span>
                      {scope.categories.map((c) => c.name).filter(Boolean).join(' • ')}
                    </div>
                  </td>
                  <td className="py-3.5 px-3 text-center font-semibold text-slate-800">{scope.qty}</td>
                  <td className="py-3.5 px-3 text-center text-slate-600">{scope.unit}</td>
                  <td className="py-3.5 px-3 text-right font-mono font-medium text-slate-700">
                    {formatMoney(unitPrice)}
                  </td>
                  <td className="py-3.5 px-3 text-right font-mono font-bold text-slate-900">
                    {formatMoney(lineTotal)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Financial Summary */}
      <div className="flex justify-end mb-8">
        <div className="w-80 bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2.5">
          <div className="flex justify-between text-xs text-slate-600">
            <span>Subtotal:</span>
            <span className="font-mono font-semibold text-slate-900">
              {formatMoney(quotation.subtotal)} {quotation.currency}
            </span>
          </div>
          <div className="flex justify-between text-xs text-slate-600">
            <span>VAT ({quotation.vatPct}%):</span>
            <span className="font-mono font-semibold text-slate-900">
              {formatMoney(quotation.vatAmount)} {quotation.currency}
            </span>
          </div>
          <div className="border-t-2 border-slate-900 pt-2 flex justify-between items-baseline font-bold text-slate-900">
            <span className="text-sm">Grand Total (Incl. VAT):</span>
            <span className="text-lg font-mono text-amber-900 font-black">
              {formatMoney(quotation.total)} {quotation.currency}
            </span>
          </div>
        </div>
      </div>

      {/* Payment Terms, Work Completion & Bank Details Dual Box */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
        {/* Payment & Completion */}
        <div className="bg-amber-50/60 border border-amber-200/80 rounded-xl p-4 text-xs space-y-2.5">
          <div className="font-bold text-amber-950 flex items-center gap-1.5 uppercase text-[11px] tracking-wider">
            <Clock className="w-3.5 h-3.5 text-amber-800" />
            Payment Terms &amp; Completion
          </div>
          <div className="text-[11px] text-slate-800 space-y-1">
            <div className="font-semibold text-slate-900">Milestone Schedule:</div>
            <p className="pl-2">1. <strong>60%</strong> in advance along with order confirmation</p>
            <p className="pl-2">2. <strong>30%</strong> progressive painting works</p>
            <p className="pl-2">3. <strong>10%</strong> progressive bill prior delivery</p>
          </div>
          <div className="pt-1.5 border-t border-amber-200/60 text-[11px] text-slate-800">
            <span className="font-semibold text-amber-950">Completion of Works:</span>{' '}
            20 Working Days from the date of Advance Payment, after all measurements are taken from the site and approved Drawings.
          </div>
        </div>

        {/* Bank Account Wire Details */}
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-xs space-y-1.5">
          <div className="font-bold text-slate-900 flex items-center gap-1.5 uppercase text-[11px] tracking-wider">
            <Landmark className="w-3.5 h-3.5 text-blue-700" />
            Official Bank Wire Details
          </div>
          <div className="text-[11px] space-y-1 text-slate-700">
            <div>
              <span className="text-slate-500">Account Name:</span>{' '}
              <span className="font-semibold text-slate-900">{bank.accountName}</span>
            </div>
            <div>
              <span className="text-slate-500">Bank Name:</span>{' '}
              <span className="font-semibold text-slate-900">{bank.bankName}</span>
            </div>
            <div>
              <span className="text-slate-500">Account No / Currency:</span>{' '}
              <span className="font-mono font-bold text-slate-900">{bank.accountNumber}</span> ({bank.currency})
            </div>
            <div>
              <span className="text-slate-500">IBAN:</span>{' '}
              <span className="font-mono font-bold text-amber-950 bg-amber-50 px-1 py-0.5 rounded border border-amber-200">
                {bank.iban}
              </span>
            </div>
            <div>
              <span className="text-slate-500">BIC / SWIFT:</span>{' '}
              <span className="font-mono font-bold text-slate-900">{bank.swift}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Standard Terms & Conditions (11 clauses) */}
      <div className="mb-10 border border-slate-200 rounded-xl p-4 bg-white">
        <div className="text-[11px] font-bold uppercase tracking-wider text-slate-800 mb-2 flex items-center gap-1.5">
          <FileCheck2 className="w-3.5 h-3.5 text-slate-700" />
          Standard Terms &amp; Conditions
        </div>
        <div className="text-[10px] text-slate-700 leading-relaxed whitespace-pre-line columns-1 sm:columns-2 gap-6 space-y-1">
          {settings.defaultTerms ||
            `1. Our offer covers only the scope of works mentioned in the quotation based on the above Bill of Quantities and Any Additional items required and not mentioned above will be considered as a variation order.
2. This Quotation Based on your key plan, If any Different on site actual dimension it will Affect price.
3. This Quotation Based on your design, If any Different on the design will Affect price.
4. Excluded All civil works.
5. We should have 24/7 access to the project site and our team should be allowed to work at all hours.
6. The above proposal includes Supply and Installations.
7. Quotation Include Only Walnut, Oak, Ash, Beach Veneer and Another Select Veneer Extra Charge as per sample.
8. All Electrical Work Extra Charge as per Site Condition.
9. Charging for delivery Sample and Pickup Sample (200 AED).
10. The accountability of the approval laminate sheet is on the client. Sample has to be confirmed for this work.
11. Please read the contract carefully.`}
        </div>
      </div>

      {/* Signatures and Acceptance Block */}
      <div className="grid grid-cols-2 gap-16 pt-6 border-t-2 border-slate-900 text-xs">
        <div>
          <div className="font-bold text-slate-900 mb-0.5">Prepared &amp; Approved By:</div>
          <p className="text-[11px] font-medium text-amber-950 mb-10">
            {settings.name || 'Touch Of Wood Decoration Works LLC'}
          </p>
          <div className="border-t border-dashed border-slate-400 pt-1.5 text-slate-500 text-[10px]">
            Authorized Signature &amp; Official Stamp
          </div>
        </div>
        <div>
          <div className="font-bold text-slate-900 mb-0.5">Customer Acceptance:</div>
          <p className="text-[11px] font-medium text-slate-700 mb-10">
            Confirmed &amp; Accepted by {customer?.name || quotation.customerName || 'Client'}
          </p>
          <div className="border-t border-dashed border-slate-400 pt-1.5 text-slate-500 text-[10px]">
            Authorized Signature &amp; Date
          </div>
        </div>
      </div>
    </div>
  );
};

