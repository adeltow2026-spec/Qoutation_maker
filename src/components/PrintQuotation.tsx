import React, { useState, useEffect } from 'react';
import { Quotation, CompanySettings, Customer } from '../types';
import {
  formatMoney,
  getScopeFinalUnitPrice,
  calculateScopeLineTotal,
  numberToWords,
  parsePaymentMilestones,
} from '../utils/formatters';
import { Landmark, Clock, FileCheck2, Image as ImageIcon, CheckCircle2 } from 'lucide-react';
import { FormattedDescription } from './FormattedDescription';
import officialMainLogo from '../assets/images/touch_of_wood_logo_1788191099643.png';

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
  const resolveInitialLogo = (url?: string) => {
    if (!url || url === '/touch_of_wood_logo.jpg' || url === '/logo.jpg') {
      return officialMainLogo;
    }
    return url;
  };

  const [logoSrc, setLogoSrc] = useState<string>(resolveInitialLogo(settings.logoUrl));
  const [hasLogoError, setHasLogoError] = useState<boolean>(false);

  useEffect(() => {
    setLogoSrc(resolveInitialLogo(settings.logoUrl));
    setHasLogoError(false);
  }, [settings.logoUrl]);

  const handleLogoError = () => {
    // If a custom configured logo failed, fall back cleanly to the bundled official logo
    if (logoSrc !== officialMainLogo) {
      setLogoSrc(officialMainLogo);
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

  const completionSchedule = (
    quotation.completionTerms ||
    settings.completionTerms ||
    'The timeline will be explained in the contract.'
  ).trim();

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
          {/* Company Official Logo (1.6x Enlarged) */}
          {!hasLogoError && logoSrc ? (
            <div className="h-32 w-40 sm:h-36 sm:w-44 flex-shrink-0 flex items-center justify-center p-1 bg-white overflow-hidden">
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

      {/* Unified Financial Summary, Amount in Words & Payment Timeline Box */}
      {(() => {
        const milestones = parsePaymentMilestones(quotation.paymentTerms || settings.paymentTerms, quotation.total);
        return (
          <div className="mb-6 rounded-xl border border-slate-300 bg-slate-50/90 p-4 print-avoid-break space-y-3.5 shadow-2xs">
            {/* Top Row: Amount in Words (Left) and Total Calculation (Right) */}
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-start pb-3 border-b border-slate-200">
              {/* Left Column: Total Amount in Words */}
              <div className="sm:col-span-7 flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                <div className="space-y-0.5">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                    Total Amount in Words:
                  </div>
                  <div className="text-xs font-bold text-slate-900 leading-snug">
                    {amountInWords || `${quotation.currency} ${formatMoney(quotation.total)} Only`}
                  </div>
                  <div className="text-[10px] text-slate-500 pt-0.5">
                    All rates inclusive of fabrication, finishing, and site installation as detailed.
                  </div>
                </div>
              </div>

              {/* Right Column: Subtotal, VAT, Grand Total */}
              <div className="sm:col-span-5 sm:pl-4 sm:border-l sm:border-slate-200 space-y-1.5">
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
                <div className="border-t-2 border-slate-900 pt-1.5 flex justify-between items-baseline font-bold text-slate-900">
                  <span className="text-xs uppercase tracking-wide">Grand Total:</span>
                  <span className="text-base sm:text-lg font-mono text-amber-950 font-black">
                    {formatMoney(quotation.total)} {quotation.currency}
                  </span>
                </div>
              </div>
            </div>

            {/* Payment Terms & Milestone Breakdown */}
            {milestones.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-[10px] font-extrabold uppercase tracking-wider text-slate-500">
                  <span className="flex items-center gap-1.5 text-slate-700">
                    <Clock className="w-3.5 h-3.5 text-amber-800" />
                    Payment Terms &amp; Milestone Breakdown
                  </span>
                  <span>Calculated Milestone Amount</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  {milestones.map((m, idx) => (
                    <div
                      key={idx}
                      className="bg-white p-2.5 rounded-lg border border-slate-200 flex flex-col justify-between"
                    >
                      <div className="flex items-start gap-1.5 mb-1.5">
                        <span className="font-mono text-amber-950 font-black bg-amber-100 border border-amber-300 px-1.5 py-0.2 rounded text-[10px] shrink-0">
                          {m.percent}%
                        </span>
                        <span className="text-[11px] font-semibold text-slate-800 leading-snug">
                          {m.label}
                        </span>
                      </div>
                      <div className="text-right pt-1 border-t border-slate-100">
                        <span className="font-mono font-black text-amber-950 text-xs sm:text-[13px]">
                          {formatMoney(m.amount)} {quotation.currency}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Payment Terms & Milestone Breakdown cards */}
              </div>
            )}
          </div>
        );
      })()}

      {/* Custom Commercial Notes (If entered by estimator) */}
      {quotation.notes && quotation.notes.trim() && (
        <div className="mb-6 p-4 rounded-xl bg-blue-50/60 border border-blue-200/90 text-xs space-y-2 print-avoid-break">
          <div className="font-bold text-blue-950 uppercase text-[10.5px] tracking-wider flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-blue-600 inline-block"></span>
            <span>Commercial Notes &amp; Special Project Conditions</span>
          </div>
          <div className="text-[11px] text-slate-800 leading-relaxed space-y-1.5">
            {quotation.notes.split('\n').map((line, idx) => {
              const trimmed = line.trim();
              if (!trimmed) return <div key={idx} className="h-1" />;
              const colonIdx = trimmed.indexOf(':');
              if ((trimmed.startsWith('•') || trimmed.startsWith('-') || /^\d+[.)]/.test(trimmed)) && colonIdx > 1) {
                const title = trimmed.substring(0, colonIdx + 1);
                const rest = trimmed.substring(colonIdx + 1);
                return (
                  <p key={idx} className="pl-1 leading-snug">
                    <strong className="text-blue-950 font-bold">{title}</strong>
                    <span>{rest}</span>
                  </p>
                );
              }
              return (
                <p key={idx} className="pl-1 leading-snug">
                  {trimmed}
                </p>
              );
            })}
          </div>
        </div>
      )}

      {/* Project Completion Schedule & Official Bank Wire Details Dual Box */}
      <div className={`grid ${showBankDetails ? 'grid-cols-1 sm:grid-cols-2' : 'grid-cols-1'} gap-4 mb-6 print-avoid-break`}>
        {/* Project Delivery & Completion Schedule */}
        <div className="bg-amber-50/60 border border-amber-200/80 rounded-xl p-3.5 text-xs space-y-2 flex flex-col justify-between">
          <div>
            <div className="font-bold text-amber-950 flex items-center gap-1.5 uppercase text-[10.5px] tracking-wider">
              <Clock className="w-3.5 h-3.5 text-amber-800" />
              Project Delivery &amp; Completion Schedule
            </div>
            <div className="text-[10.5px] text-slate-800 space-y-1.5 pt-1.5">
              <div className="leading-snug">
                <span className="font-bold text-amber-950">Completion Timeline: </span>
                <span className="text-slate-900 font-semibold">{completionSchedule}</span>
              </div>
              <p className="leading-snug text-slate-600 text-[10px]">
                <strong className="text-slate-800">Mobilization:</strong> Commences upon receipt of confirmed advance payment, signed approval, and final site dimensions.
              </p>
              <p className="leading-snug text-slate-600 text-[10px]">
                <strong className="text-slate-800">Site Handover:</strong> Uninterrupted site access is required for on-schedule delivery and installation.
              </p>
            </div>
          </div>
          <div className="pt-2 border-t border-amber-200/60 text-[9.5px] text-amber-900/80 italic">
            Schedule is subject to prompt client approvals and confirmed site readiness.
          </div>
        </div>

        {/* Official Bank Wire Details - Beautiful Compact Vertical Layout */}
        {showBankDetails && (
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 text-xs space-y-1.5">
            <div className="font-bold text-slate-900 flex items-center gap-1.5 uppercase text-[10.5px] tracking-wider">
              <Landmark className="w-3.5 h-3.5 text-blue-700" />
              Official Bank Wire Details
            </div>
            <div className="text-[10.5px] space-y-1 text-slate-700 leading-snug pt-0.5">
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
                <span className="font-mono font-bold text-slate-900">{bank.accountNumber}</span>{' '}
                <span className="text-slate-500 text-[10px]">({bank.currency})</span>
              </div>
              <div>
                <span className="text-slate-500">IBAN:</span>{' '}
                <span className="font-mono font-bold text-amber-950 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200 text-xs inline-block">
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
