import React, { useState, useEffect } from 'react';
import { Quotation, CompanySettings, Customer } from '../types';
import {
  formatMoney,
  getScopeFinalUnitPrice,
  calculateScopeLineTotal,
  numberToWords,
} from '../utils/formatters';
import { Landmark, Clock, FileCheck2, Image as ImageIcon, CheckCircle2 } from 'lucide-react';
import { FormattedDescription } from './FormattedDescription';

interface PrintQuotationProps {
  quotation: Quotation;
  customer?: Customer;
  settings: CompanySettings;
  showBankDetails?: boolean;
  showTerms?: boolean;
  showPhotos?: boolean;
}

export const PrintQuotation: React.FC<PrintQuotationProps> = ({
  quotation,
  customer,
  settings,
  showBankDetails = true,
  showTerms = true,
  showPhotos = true,
}) => {
  const [logoSrc, setLogoSrc] = useState<string>(
    settings.logoUrl || '/touch_of_wood_logo.jpg'
  );
  const [hasLogoError, setHasLogoError] = useState<boolean>(false);

  useEffect(() => {
    setLogoSrc(settings.logoUrl || '/touch_of_wood_logo.jpg');
    setHasLogoError(false);
  }, [settings.logoUrl]);

  const handleLogoError = () => {
    // If the configured logo failed, try alternative uploaded logo names
    if (logoSrc !== '/logo.jpg') {
      setLogoSrc('/logo.jpg');
    } else if (logoSrc !== '/touch_of_wood_logo.jpg') {
      setLogoSrc('/touch_of_wood_logo.jpg');
    } else {
      setHasLogoError(true);
    }
  };

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

  const amountInWords = numberToWords(quotation.total, quotation.currency || 'AED');

  const termsList = (
    quotation.terms ||
    settings.defaultTerms ||
    `1. Our offer covers only the scope of works mentioned in the quotation based on the above Bill of Quantities and Any Additional items required and not mentioned above will be considered as a variation order.
2. This Quotation Based on your key plan, If any Different on site actual dimension it will Affect price.
3. This Quotation Based on your design, If any Different on the design will Affect price.
4. Excluded All civil works.
5. We should have 24/7 access to the project site and our team should be allowed to work at all hours.
6. The above proposal includes Supply and Installations.
7. Quotation Include Only Walnut, Oak, Ash, Beech Veneer and Another Select Veneer Extra Charge as per sample.
8. All Electrical Work Extra Charge as per Site Condition.
9. Charging for delivery Sample and Pickup Sample (200 AED).
10. The accountability of the approval laminate sheet is on the client. Sample has to be confirmed for this work.
11. Please read the contract carefully.`
  )
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);

  const halfIndex = Math.ceil(termsList.length / 2);
  const termsCol1 = termsList.slice(0, halfIndex);
  const termsCol2 = termsList.slice(halfIndex);

  return (
    <div
      id="print-area"
      className="p-6 sm:p-10 bg-white text-slate-900 font-['Plus_Jakarta_Sans',sans-serif] leading-normal text-xs print:p-0"
    >
      {/* Letterhead Header */}
      <div className="flex justify-between items-start border-b-2 border-amber-900/40 pb-5 mb-6 print-avoid-break">
        <div className="flex items-start gap-4">
          {/* Company Official Logo */}
          {!hasLogoError && logoSrc ? (
            <div className="h-20 w-24 sm:h-22 sm:w-28 flex-shrink-0 flex items-center justify-center p-1 bg-white rounded-lg border border-slate-200 shadow-2xs overflow-hidden">
              <img
                src={logoSrc}
                alt={settings.name || 'Touch Of Wood'}
                className="w-full h-full object-contain"
                referrerPolicy="no-referrer"
                onError={handleLogoError}
              />
            </div>
          ) : (
            <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-amber-900 to-amber-950 text-amber-100 flex flex-col items-center justify-center shadow-xs flex-shrink-0 border border-amber-800">
              <span className="text-sm font-black tracking-widest text-amber-200">TOW</span>
              <span className="text-[8px] uppercase tracking-tighter opacity-80">WOOD</span>
            </div>
          )}

          <div>
            <h1 className="text-lg sm:text-xl font-black tracking-tight text-slate-900 uppercase leading-none">
              {settings.name || 'Touch Of Wood Decoration Works LLC'}
            </h1>
            <p className="text-[11px] font-semibold text-amber-900 tracking-wide mt-1 uppercase">
              Interior Decoration &amp; Architectural Joinery Contractor
            </p>
            {settings.trn && (
              <div className="text-[11px] font-bold text-slate-700 mt-0.5">
                TRN: <span className="font-mono text-amber-950 font-black">{settings.trn}</span>
              </div>
            )}
            {settings.address && (
              <div className="text-[10.5px] text-slate-600 mt-0.5 max-w-md">
                {settings.address}
              </div>
            )}
            <div className="text-[10px] text-slate-500 mt-1 flex flex-wrap gap-x-4 gap-y-0.5 font-medium">
              {settings.phone && <span>Tel: {settings.phone}</span>}
              {settings.email && <span>Email: {settings.email}</span>}
              {settings.website && <span>Web: {settings.website}</span>}
            </div>
          </div>
        </div>

        {/* Quotation Meta Badge */}
        <div className="text-right flex-shrink-0">
          <div className="inline-block px-3 py-1 bg-amber-950 text-amber-100 font-black text-xs tracking-wider uppercase rounded shadow-2xs">
            QUOTATION
          </div>
          <div className="text-base sm:text-lg font-mono font-black text-slate-900 mt-1.5">
            {quotation.quoteNo}
          </div>
          <div className="text-[11px] text-slate-600 mt-1">
            Date: <span className="font-bold text-slate-900">{quotation.date}</span>
          </div>
          <div className="text-[11px] text-slate-600">
            Valid Until: <span className="font-bold text-slate-900">{quotation.validUntil}</span>
          </div>
          {quotation.status && (
            <div className="mt-1">
              <span className="inline-block px-2 py-0.5 text-[9.5px] font-extrabold uppercase rounded bg-slate-100 text-slate-700 border border-slate-200">
                Status: {quotation.status}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Bill To & Project Info Box */}
      <div className="grid grid-cols-2 gap-4 mb-6 bg-slate-50/90 p-4 rounded-xl border border-slate-200 print-avoid-break">
        <div>
          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
            Bill To / Client
          </div>
          <div className="text-sm font-black text-slate-900">
            {customer?.name || quotation.customerName || 'Valued Client'}
          </div>
          <div className="text-[11px] text-slate-700 mt-0.5">
            Client TRN:{' '}
            <span className="font-mono font-bold text-slate-900">
              {customer?.trn || '—'}
            </span>
          </div>
          <div className="text-[11px] text-slate-600 mt-0.5 whitespace-pre-line leading-relaxed">
            {quotation.address || customer?.address || 'Site Address as per contract'}
          </div>
          {customer?.phone && (
            <div className="text-[11px] text-slate-600 mt-1">Contact: {customer.phone}</div>
          )}
        </div>

        <div className="text-right sm:text-left sm:pl-6 sm:border-l sm:border-slate-200">
          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
            Project &amp; Commercial Reference
          </div>
          <div className="text-[11px] text-slate-700">
            <span className="text-slate-500 font-medium">Project:</span>{' '}
            <span className="font-bold text-slate-900">
              {quotation.project || 'Interior Fit-out & Joinery Package'}
            </span>
          </div>
          <div className="text-[11px] text-slate-700 mt-1">
            <span className="text-slate-500 font-medium">Sales Rep / Estimator:</span>{' '}
            <span className="font-semibold text-slate-900">
              {quotation.salesPerson || 'Adel / Estimating Dept'}
            </span>
          </div>
          <div className="text-[11px] text-slate-700 mt-1">
            <span className="text-slate-500 font-medium">Currency:</span>{' '}
            <span className="font-bold text-amber-950 bg-amber-100/70 px-1.5 py-0.5 rounded border border-amber-200">
              {quotation.currency || 'AED'}
            </span>
          </div>
          <div className="text-[10px] text-slate-500 mt-1.5 font-medium">
            Scope: Supply, Fabrication &amp; On-Site Installation
          </div>
        </div>
      </div>

      {/* BOQ Line Items Table */}
      <div className="mb-6">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-y-2 border-slate-900 bg-slate-100 text-[10.5px] font-extrabold uppercase tracking-wider text-slate-800">
              <th className="py-2.5 px-3 w-10 text-center">#</th>
              <th className="py-2.5 px-3">Scope &amp; Technical Specifications</th>
              <th className="py-2.5 px-3 w-14 text-center">Qty</th>
              <th className="py-2.5 px-3 w-14 text-center">Unit</th>
              <th className="py-2.5 px-3 w-28 text-right">Unit Rate ({quotation.currency})</th>
              <th className="py-2.5 px-3 w-32 text-right">Amount ({quotation.currency})</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 text-xs">
            {quotation.scopes.map((scope, index) => {
              const unitPrice = getScopeFinalUnitPrice(scope, overheadPct, markupPct);
              const lineTotal = calculateScopeLineTotal(scope, overheadPct, markupPct);
              return (
                <tr key={scope.id || index} className="align-top print-avoid-break">
                  <td className="py-3 px-3 text-center font-bold text-slate-500">{index + 1}</td>
                  <td className="py-3 px-3">
                    <div className="font-bold text-slate-900 text-xs sm:text-[12.5px] leading-snug">
                      {scope.name}
                    </div>

                    <FormattedDescription description={scope.description || ''} isPrint={true} />

                    {/* Reference Visual / Technical Drawing */}
                    {showPhotos && scope.photoUrl && (
                      <div className="mt-2.5 p-2 bg-slate-50 rounded-lg border border-slate-200/90 inline-block max-w-xs print-avoid-break">
                        <div className="max-h-36 w-auto overflow-hidden rounded border border-slate-200 bg-white flex items-center justify-center p-1">
                          <img
                            src={scope.photoUrl}
                            alt={scope.photoCaption || `${scope.name} Reference Drawing`}
                            className="max-h-32 w-auto max-w-full object-contain mx-auto rounded"
                            referrerPolicy="no-referrer"
                          />
                        </div>
                        {scope.photoCaption && (
                          <div className="text-[9.5px] font-medium text-slate-600 mt-1 text-center flex items-center justify-center gap-1">
                            <ImageIcon className="w-3 h-3 text-slate-400" />
                            <span>{scope.photoCaption}</span>
                          </div>
                        )}
                      </div>
                    )}
                  </td>
                  <td className="py-3 px-3 text-center font-bold text-slate-800">{scope.qty}</td>
                  <td className="py-3 px-3 text-center text-slate-600 font-medium">{scope.unit}</td>
                  <td className="py-3 px-3 text-right font-mono font-semibold text-slate-700">
                    {formatMoney(unitPrice)}
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

      {/* Financial Summary & Amount in Words Block */}
      <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 mb-6 print-avoid-break items-start">
        {/* Left: Amount in Words */}
        <div className="sm:col-span-7 bg-slate-50/80 p-3.5 rounded-xl border border-slate-200 flex items-start gap-2.5">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
          <div>
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
              Total Amount in Words:
            </div>
            <div className="text-xs font-bold text-slate-900 mt-0.5 leading-snug">
              {amountInWords || `${quotation.currency} ${formatMoney(quotation.total)} Only`}
            </div>
            <div className="text-[10px] text-slate-500 mt-1">
              All rates inclusive of fabrication, finishing, and site installation as detailed.
            </div>
          </div>
        </div>

        {/* Right: Calculations breakdown */}
        <div className="sm:col-span-5 bg-slate-50/90 p-4 rounded-xl border border-slate-200 space-y-2">
          <div className="flex justify-between text-xs text-slate-600">
            <span>Subtotal:</span>
            <span className="font-mono font-bold text-slate-900">
              {formatMoney(quotation.subtotal)} {quotation.currency}
            </span>
          </div>
          <div className="flex justify-between text-xs text-slate-600">
            <span>VAT ({quotation.vatPct}%):</span>
            <span className="font-mono font-bold text-slate-900">
              {formatMoney(quotation.vatAmount)} {quotation.currency}
            </span>
          </div>
          <div className="border-t-2 border-slate-900 pt-2 flex justify-between items-baseline font-bold text-slate-900">
            <span className="text-xs uppercase tracking-wide">Grand Total:</span>
            <span className="text-base sm:text-lg font-mono text-amber-950 font-black">
              {formatMoney(quotation.total)} {quotation.currency}
            </span>
          </div>
        </div>
      </div>

      {/* Custom Commercial Notes (If entered by estimator) */}
      {quotation.notes && quotation.notes.trim() && (
        <div className="mb-6 p-4 rounded-xl bg-blue-50/50 border border-blue-200/80 text-xs space-y-1.5 print-avoid-break">
          <div className="font-bold text-blue-950 uppercase text-[10.5px] tracking-wider flex items-center gap-1.5">
            <span>Commercial Notes &amp; Special Project Conditions</span>
          </div>
          <div className="text-[11px] text-slate-800 leading-relaxed whitespace-pre-line">
            {quotation.notes}
          </div>
        </div>
      )}

      {/* Payment Terms & Bank Wire Details Dual Box */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6 print-avoid-break">
        {/* Payment & Completion */}
        <div className="bg-amber-50/60 border border-amber-200/80 rounded-xl p-3.5 text-xs space-y-2">
          <div className="font-bold text-amber-950 flex items-center gap-1.5 uppercase text-[10.5px] tracking-wider">
            <Clock className="w-3.5 h-3.5 text-amber-800" />
            Payment Terms &amp; Completion Schedule
          </div>
          <div className="text-[10.5px] text-slate-800 space-y-1">
            <p className="pl-1">
              1. <strong>60%</strong> Advance Payment along with signed quotation &amp; order confirmation
            </p>
            <p className="pl-1">
              2. <strong>30%</strong> Upon completion of factory joinery fabrication &amp; progressive painting
            </p>
            <p className="pl-1">
              3. <strong>10%</strong> Prior to final site delivery and handover
            </p>
          </div>
          <div className="pt-1.5 border-t border-amber-200/60 text-[10px] text-slate-800 leading-normal">
            <span className="font-bold text-amber-950">Completion of Works:</span>{' '}
            20 Working Days from receipt of Advance Payment, approved shop drawings, and final site dimensions.
          </div>
        </div>

        {/* Bank Wire Details */}
        {showBankDetails && (
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 text-xs space-y-1">
            <div className="font-bold text-slate-900 flex items-center gap-1.5 uppercase text-[10.5px] tracking-wider">
              <Landmark className="w-3.5 h-3.5 text-blue-700" />
              Official Bank Wire Details
            </div>
            <div className="text-[10.5px] space-y-0.5 text-slate-700 leading-snug">
              <div>
                <span className="text-slate-500">Beneficiary:</span>{' '}
                <span className="font-bold text-slate-900">{bank.accountName}</span>
              </div>
              <div>
                <span className="text-slate-500">Bank Name:</span>{' '}
                <span className="font-bold text-slate-900">{bank.bankName}</span>
              </div>
              <div>
                <span className="text-slate-500">Account No:</span>{' '}
                <span className="font-mono font-bold text-slate-900">{bank.accountNumber}</span> ({bank.currency})
              </div>
              <div>
                <span className="text-slate-500">IBAN:</span>{' '}
                <span className="font-mono font-bold text-amber-950 bg-amber-50 px-1 py-0.2 rounded border border-amber-200">
                  {bank.iban}
                </span>
              </div>
              <div>
                <span className="text-slate-500">BIC / SWIFT:</span>{' '}
                <span className="font-mono font-bold text-slate-900">{bank.swift}</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Terms and Conditions */}
      {showTerms && (
        <div className="mb-6 border border-slate-200 rounded-xl p-4 bg-white print-avoid-break">
          <div className="text-[10.5px] font-bold uppercase tracking-wider text-slate-800 mb-2 flex items-center gap-1.5">
            <FileCheck2 className="w-3.5 h-3.5 text-slate-700" />
            Standard Terms &amp; Conditions
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1.5 text-[9.5px] text-slate-600 leading-relaxed">
            <div className="space-y-1.5">
              {termsCol1.map((term, i) => (
                <p key={i}>{term}</p>
              ))}
            </div>
            <div className="space-y-1.5">
              {termsCol2.map((term, i) => (
                <p key={i}>{term}</p>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Signatures & Official Stamp Block */}
      <div className="grid grid-cols-2 gap-12 pt-5 border-t-2 border-slate-900 text-xs print-avoid-break">
        <div>
          <div className="font-bold text-slate-900 text-xs">Prepared &amp; Approved By:</div>
          <p className="text-[11px] font-semibold text-amber-950 mb-12 mt-0.5">
            {settings.name || 'Touch Of Wood Decoration Works LLC'}
          </p>
          <div className="border-t border-dashed border-slate-400 pt-1.5 text-slate-500 text-[10px]">
            Authorized Signatory &amp; Official Company Stamp
          </div>
        </div>

        <div>
          <div className="font-bold text-slate-900 text-xs">Customer Acceptance:</div>
          <p className="text-[11px] font-semibold text-slate-700 mb-12 mt-0.5">
            Confirmed &amp; Accepted by {customer?.name || quotation.customerName || 'Client'}
          </p>
          <div className="border-t border-dashed border-slate-400 pt-1.5 text-slate-500 text-[10px]">
            Client Signature, Full Name &amp; Date
          </div>
        </div>
      </div>

      {/* Footer running banner */}
      <div className="mt-8 pt-3 border-t border-slate-200 text-center text-[9px] text-slate-400 print-avoid-break">
        Touch Of Wood Decoration Works LLC • Industrial Area - Musaffah ICAD, Abu Dhabi, UAE • Computer-Generated Quotation Ref: {quotation.quoteNo}
      </div>
    </div>
  );
};
