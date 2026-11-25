import React from 'react';
import {
  CompanySettings,
  ContractDocumentData,
  DocumentPhotoItem,
  FinishCertificateDocument,
  ProjectDocumentSuite,
  ProjectProgressionDocument,
  ProjectProgressionRow,
  SampleConfirmationDocument,
  SampleConfirmationRow,
  VariationOrderDocument,
} from '../types';
import { formatMoney } from '../utils/formatters';
import {
  calculateProgressionOverallPct,
  calculateVoTotals,
  formatNumberWord,
  formatPercentWord,
} from '../utils/documentSuite';
import officialMainLogo from '../assets/images/touch_of_wood_logo_1788191099643.png';

const resolveOfficialLogo = (logoUrl?: string): string => {
  if (!logoUrl || logoUrl === '/touch_of_wood_logo.jpg' || logoUrl === '/logo.jpg') {
    return officialMainLogo;
  }
  return logoUrl;
};

const CANDARA_FONT = "'Candara', 'Optima', 'Calibri', 'Segoe UI', Arial, sans-serif";
const BRAND_BROWN = '#5c3d22';
const DARK_BROWN = '#3e2723';
const CREAM_BG = '#f5f0e8';
const HEADER_BEIGE = '#ece5da';

const formatDisplayDate = (dateStr?: string): string => {
  if (!dateStr) return '';
  const d = new Date(`${dateStr}T00:00:00`);
  if (isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
};

const dottedOrValue = (value?: string, minWidth = 110) => {
  if (value && value.trim()) {
    return <span style={{ color: '#111111', fontWeight: 600 }}>{value}</span>;
  }
  return (
    <span
      style={{
        display: 'inline-block',
        minWidth: `${minWidth}px`,
        borderBottom: '1px dotted #4b5563',
        height: '11px',
      }}
    />
  );
};

const RunningHeader: React.FC<{ settings: CompanySettings }> = ({ settings }) => {
  const companyUpper = (settings.name || 'TOUCH OF WOOD DECORATION WORKS LLC').toUpperCase();
  const address = settings.address || 'Musaffah ICAD, Abu Dhabi, UAE';
  const phone = settings.phone || '+97126504708';
  const email = settings.email || 'tow@touchofwood.ae';

  return (
    <div style={{ marginBottom: '10px', flexShrink: 0 }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          paddingBottom: '6px',
          borderBottom: `2px solid ${BRAND_BROWN}`,
        }}
      >
        <img
          src={resolveOfficialLogo(settings.logoUrl)}
          alt="Touch Of Wood"
          style={{ width: '36px', height: '36px', objectFit: 'contain', flexShrink: 0 }}
          referrerPolicy="no-referrer"
        />
        <div
          style={{
            fontFamily: CANDARA_FONT,
            fontStyle: 'normal',
            fontSize: '9.5pt',
            fontWeight: 700,
            color: '#111111',
            letterSpacing: '0.1px',
            lineHeight: 1.25,
          }}
        >
          {companyUpper}
          <span style={{ margin: '0 6px', color: '#6b7280', fontWeight: 400 }}>|</span>
          {address}
          <span style={{ margin: '0 6px', color: '#6b7280', fontWeight: 400 }}>|</span>
          {phone}
          <span style={{ margin: '0 6px', color: '#6b7280', fontWeight: 400 }}>|</span>
          {email}
        </div>
      </div>
    </div>
  );
};

const RunningFooter: React.FC<{
  pageNumber: number;
  totalPages: number;
  trn: string;
  contractNo: string;
  showClientSign?: boolean;
}> = ({ pageNumber, totalPages, trn, contractNo, showClientSign = true }) => (
  <div
    style={{
      marginTop: 'auto',
      paddingTop: '7px',
      borderTop: `2px solid ${BRAND_BROWN}`,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: '10px',
      fontFamily: CANDARA_FONT,
      fontStyle: 'italic',
      fontSize: '8.5pt',
      color: '#1f2937',
      flexShrink: 0,
    }}
  >
    <span style={{ whiteSpace: 'nowrap' }}>
      Page {pageNumber} of {totalPages}
    </span>
    <span style={{ whiteSpace: 'nowrap' }}>TRN: {trn || '100519825200003'}</span>
    {showClientSign && (
      <span
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '5px',
          whiteSpace: 'nowrap',
          fontWeight: 400,
          color: '#1f2937',
        }}
      >
        <span>Client Signature:</span>
        <span
          style={{
            display: 'inline-block',
            width: '86px',
            borderBottom: '1px solid #4b5563',
            height: '11px',
          }}
        />
      </span>
    )}
    <span style={{ whiteSpace: 'nowrap' }}>Contract Number: {contractNo || 'CON-2026-XXX'}</span>
  </div>
);

const A4PageSheet: React.FC<{
  settings: CompanySettings;
  contractNo: string;
  pageNumber: number;
  totalPages: number;
  showClientSign?: boolean;
  isLastPage?: boolean;
  children: React.ReactNode;
}> = ({
  settings,
  contractNo,
  pageNumber,
  totalPages,
  showClientSign = true,
  isLastPage = false,
  children,
}) => (
  <div
    className={`a4-sheet bg-white ${!isLastPage ? 'a4-page-break' : ''}`}
    style={{
      width: '210mm',
      minHeight: '296mm',
      boxSizing: 'border-box',
      padding: '10mm 15mm 10mm 15mm',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between',
      fontFamily: CANDARA_FONT,
      fontStyle: 'italic',
      color: '#111111',
      backgroundColor: '#ffffff',
      position: 'relative',
    }}
  >
    <RunningHeader settings={settings} />
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>{children}</div>
    <RunningFooter
      pageNumber={pageNumber}
      totalPages={totalPages}
      trn={settings.trn || '100519825200003'}
      contractNo={contractNo}
      showClientSign={showClientSign}
    />
  </div>
);

const ClauseHeading: React.FC<{ number: number; title: string }> = ({ number, title }) => (
  <div
    style={{
      marginTop: '11px',
      marginBottom: '6px',
      paddingBottom: '3px',
      borderBottom: '1px solid #d6cfc7',
      fontFamily: CANDARA_FONT,
      fontStyle: 'normal',
      fontSize: '9.8pt',
      fontWeight: 700,
      letterSpacing: '0.2px',
    }}
  >
    <span style={{ color: '#78716c' }}>CLAUSE {number} — </span>
    <span style={{ color: '#111111' }}>{title}</span>
  </div>
);

const bodyPStyle: React.CSSProperties = {
  fontFamily: CANDARA_FONT,
  fontSize: '9.5pt',
  lineHeight: 1.44,
  color: '#111111',
  margin: '0 0 6px 0',
  textAlign: 'justify',
  fontStyle: 'italic',
};

const bulletUlStyle: React.CSSProperties = {
  margin: '3px 0 7px 16px',
  padding: 0,
  listStyleType: 'disc',
  fontFamily: CANDARA_FONT,
  fontSize: '9.35pt',
  lineHeight: 1.42,
  color: '#111111',
  fontStyle: 'italic',
};

const bulletLiStyle: React.CSSProperties = {
  marginBottom: '4px',
  textAlign: 'justify',
};

function chunkArray<T>(arr: T[], size: number): T[][] {
  if (arr.length === 0) return [];
  const res: T[][] = [];
  for (let i = 0; i < arr.length; i += size) {
    res.push(arr.slice(i, i + size));
  }
  return res;
}

// =====================================================================
// 1. MAIN CONTRACT DOCUMENT (EXACT 8-PAGE A4 MATCH TO NOV VERSION PDF)
// =====================================================================
export const PrintContractDocument: React.FC<{
  contract: ContractDocumentData;
  settings: CompanySettings;
}> = ({ contract, settings }) => {
  const t = contract.terms;
  const currency = contract.currency || settings.currency || 'AED';
  const totalValue = Number(contract.contractValue) || 0;
  const stage1Amount = Math.round(((totalValue * (t.stage1Pct || 0)) / 100) * 100) / 100;
  const stage2Amount = Math.round(((totalValue * (t.stage2Pct || 0)) / 100) * 100) / 100;
  const stage3Amount = Math.round(((totalValue * (t.stage3Pct || 0)) / 100) * 100) / 100;

  const hasStage1 = (t.stage1Pct || 0) > 0;
  const hasStage2 = (t.stage2Pct || 0) > 0;
  const hasStage3 = (t.stage3Pct || 0) > 0;
  const isSingleFullAdvance = hasStage1 && !hasStage2 && !hasStage3;

  const activeStageRows: Array<{
    key: string;
    label: string;
    pct: number;
    amount: number;
    trigger: string;
  }> = [];

  if (hasStage1 || (!hasStage2 && !hasStage3)) {
    activeStageRows.push({
      key: 'stage1',
      label: isSingleFullAdvance ? 'Stage 1 — Full Advance' : 'Stage 1 — Advance',
      pct: t.stage1Pct || 0,
      amount: stage1Amount,
      trigger: isSingleFullAdvance
        ? 'Due in full upon signing / Effective Date. Condition precedent to initiating shop drawings, material procurement, production scheduling, and site installation.'
        : 'Due upon signing / Effective Date. Condition precedent to initiating shop drawings, material procurement, and production scheduling.',
    });
  }

  if (hasStage2) {
    activeStageRows.push({
      key: 'stage2',
      label: hasStage3 ? 'Stage 2 — Progress' : 'Stage 2 — Final',
      pct: t.stage2Pct || 0,
      amount: stage2Amount,
      trigger: hasStage3
        ? 'Due upon completion of workshop fabrication and strictly prior to dispatch to site. Delivery and installation proceed only after cleared receipt.'
        : 'Due upon completion of workshop fabrication and strictly prior to final site delivery, installation, and handover. Delivery and installation proceed only after cleared receipt.',
    });
  }

  if (hasStage3) {
    activeStageRows.push({
      key: 'stage3',
      label: 'Stage 3 — Final',
      pct: t.stage3Pct || 0,
      amount: stage3Amount,
      trigger:
        'Due immediately upon installation completion and issuance (or deemed issuance / beneficial use) of the Finish Certificate.',
    });
  }

  const companyName = settings.name || 'Touch of Wood Decoration Works LLC';
  const companyAddress = settings.address || 'Musaffah ICAD 1, Abu Dhabi, UAE';
  const companyTrn = settings.trn || '100519825200003';
  const companyPhone = settings.phone || '+97126504708';
  const companyEmail = settings.email || 'tow@touchofwood.ae';

  const isMultipleQuotes =
    (contract.quotationRef || '').includes(',') || (contract.quotationRef || '').includes('&');
  const quoteNoLabel = isMultipleQuotes ? 'Quotation Nos.' : 'Quotation No.';
  const revCount = Math.max(1, Number(t.includedRevisionRounds) || 2);
  const lastRevLabel = `Revision ${String(revCount).padStart(2, '0')}`;
  const revRangeText =
    revCount === 1
      ? 'Revision 01'
      : revCount === 2
        ? 'Revision 01 and Revision 02'
        : `Revision 01 through ${lastRevLabel}`;
  const warrantyTitlePrefix =
    t.warrantyYears === 2
      ? 'Two-Year'
      : t.warrantyYears === 1
        ? 'One-Year'
        : `${t.warrantyYears}-Year`;

  const TOTAL_PAGES = 8;

  const cellBase: React.CSSProperties = {
    border: '1px solid #d6cfc7',
    padding: '5px 8px',
    fontSize: '9.2pt',
    fontFamily: CANDARA_FONT,
    verticalAlign: 'middle',
  };

  return (
    <div
      id="print-area"
      className="doc-suite-a4-root flex flex-col gap-6 bg-transparent"
      style={{ fontFamily: CANDARA_FONT, fontStyle: 'italic' }}
    >
      {/* ===================== PAGE 1 of 8 ===================== */}
      <A4PageSheet
        settings={settings}
        contractNo={contract.contractNo}
        pageNumber={1}
        totalPages={TOTAL_PAGES}
        showClientSign
      >
        {/* Centered Large Brand Mark (1.6x Enlarged Official Logo) */}
        <div style={{ textAlign: 'center', margin: '2px 0 8px 0' }}>
          <img
            src={resolveOfficialLogo(settings.logoUrl)}
            alt={companyName}
            style={{
              height: '116px',
              maxWidth: '280px',
              objectFit: 'contain',
              margin: '0 auto 4px auto',
              display: 'block',
            }}
            referrerPolicy="no-referrer"
          />
          <h1
            style={{
              margin: '6px 0 0 0',
              fontSize: '13.5pt',
              fontWeight: 700,
              fontStyle: 'normal',
              letterSpacing: '0.4px',
              color: '#111111',
              textTransform: 'uppercase',
            }}
          >
            CUSTOM JOINERY &amp; INTERIOR FIT-OUT AGREEMENT
          </h1>
        </div>

        {/* Contract Metadata & Parties Table (Exact NOV Version Cream/Beige Styling) */}
        <table
          style={{
            width: '100%',
            borderCollapse: 'collapse',
            marginBottom: '12px',
          }}
        >
          <tbody>
            <tr style={{ backgroundColor: CREAM_BG }}>
              <td colSpan={2} style={cellBase}>
                <strong>Contract No.:</strong>{' '}
                {dottedOrValue(contract.contractNo, 95)}
              </td>
              <td colSpan={2} style={cellBase}>
                <strong>Date of Issuance:</strong>{' '}
                {dottedOrValue(formatDisplayDate(contract.dateOfIssuance), 115)}
              </td>
            </tr>
            <tr style={{ backgroundColor: '#ffffff' }}>
              <td colSpan={2} style={cellBase}>
                <strong>Project Code:</strong>{' '}
                {dottedOrValue(contract.projectCode, 95)}
              </td>
              <td colSpan={2} style={cellBase}>
                <strong>{isMultipleQuotes ? 'Quotation Refs. (Annex A):' : 'Quotation Ref. (Annex A):'}</strong>{' '}
                {dottedOrValue(contract.quotationRef, 95)}
              </td>
            </tr>
            <tr style={{ backgroundColor: HEADER_BEIGE }}>
              <td colSpan={2} style={{ ...cellBase, fontWeight: 700, fontStyle: 'normal', color: '#111111' }}>
                CONTRACTOR DETAILS
              </td>
              <td colSpan={2} style={{ ...cellBase, fontWeight: 700, fontStyle: 'normal', color: '#111111' }}>
                CLIENT DETAILS (Client&apos;s Designated Authorized Site Representative)
              </td>
            </tr>
            <tr>
              <td style={{ ...cellBase, width: '14%', color: '#374151' }}>Company:</td>
              <td style={{ ...cellBase, width: '36%', fontWeight: 700 }}>{companyName}</td>
              <td style={{ ...cellBase, width: '16%', color: '#374151' }}>Client Name:</td>
              <td style={{ ...cellBase, width: '34%' }}>{dottedOrValue(contract.clientName, 125)}</td>
            </tr>
            <tr>
              <td style={{ ...cellBase, color: '#374151' }}>Address:</td>
              <td style={{ ...cellBase, fontWeight: 700 }}>{companyAddress}</td>
              <td style={{ ...cellBase, color: '#374151' }}>Emirates ID:</td>
              <td style={cellBase}>{dottedOrValue(contract.emiratesId, 125)}</td>
            </tr>
            <tr>
              <td style={{ ...cellBase, color: '#374151' }}>TRN:</td>
              <td style={{ ...cellBase, fontWeight: 700 }}>{companyTrn}</td>
              <td style={{ ...cellBase, color: '#374151' }}>Site Location:</td>
              <td style={cellBase}>{dottedOrValue(contract.siteLocation, 125)}</td>
            </tr>
            <tr>
              <td style={{ ...cellBase, color: '#374151' }}>Phone:</td>
              <td style={{ ...cellBase, fontWeight: 700 }}>{companyPhone}</td>
              <td style={{ ...cellBase, color: '#374151' }}>Mobile No.:</td>
              <td style={cellBase}>{dottedOrValue(contract.mobileNo, 125)}</td>
            </tr>
            <tr>
              <td style={{ ...cellBase, color: '#374151' }}>Official Email:</td>
              <td style={{ ...cellBase, fontWeight: 700, color: '#1d4ed8', textDecoration: 'underline' }}>
                {companyEmail}
              </td>
              <td style={{ ...cellBase, color: '#374151' }}>Official Email:</td>
              <td style={cellBase}>{dottedOrValue(contract.officialEmail, 125)}</td>
            </tr>
          </tbody>
        </table>

        {/* Preamble */}
        <p style={bodyPStyle}>
          <strong>PREAMBLE &amp; AGREEMENT OVERVIEW:</strong> This Agreement is entered into between the
          Contractor and the Client to govern the engineering, procurement, fabrication, delivery, and
          installation of custom architectural joinery works at the Client&apos;s specified site, strictly in
          accordance with the terms below and the attached detailed{' '}
          {isMultipleQuotes ? 'quotations' : 'quotation'} (Annex A).
        </p>

        {/* CLAUSE 1 */}
        <ClauseHeading number={1} title="SCOPE OF WORK, SPECIFICATIONS & MATERIAL CHARACTERISTICS" />
        <p style={bodyPStyle}>
          <strong>1.1 Contractual Scope:</strong> The Contractor shall supply, fabricate, deliver, and install
          all custom joinery works for the Client&apos;s site strictly in accordance with the dimensions,
          quantities, materials, and finishes specified in Annex A ({quoteNoLabel}{' '}
          <strong>{contract.quotationRef || 'QTN-2026-_______'}</strong>), which forms an inseparable and
          integral part of this Agreement.
        </p>
        <p style={bodyPStyle}>
          <strong>1.2 Client-Supplied Items (Hardware, Appliances, Sanitary Ware &amp; Lighting):</strong>{' '}
          Where Annex A designates decorative hardware, handles, specialized mechanisms, appliances, sinks,
          mirrors, or lighting fixtures to be supplied by the Client (&apos;Client-Supplied Items&apos;):
        </p>
        <ul style={bulletUlStyle}>
          <li style={bulletLiStyle}>
            <strong>Advance Delivery:</strong> The Client shall deliver all approved Client-Supplied Items
            along with complete technical specification sheets to the Contractor&apos;s workshop at least{' '}
            <strong>{formatNumberWord(t.clientItemsAdvanceDays)}</strong> working days prior to scheduled
            workshop assembly.
          </li>
          <li style={bulletLiStyle}>
            <strong>Conversion to Variation Order:</strong> If the Client fails to supply such items on time
            or subsequently requests the Contractor to procure or supply them, such request shall strictly
            constitute a scope addition and shall be billed via a formal Variation Order (VO) at supplier
            invoice cost plus a mandatory{' '}
            <strong>{formatPercentWord(t.clientSuppliedMarkupPct)}</strong> Contractor procurement and
            handling markup. Sourcing shall not commence until the VO is executed and paid.
          </li>
          <li style={bulletLiStyle}>
            <strong>Timeline Impact:</strong> Any delay by the Client in delivering items, providing technical
            specifications, or executing the corresponding VO shall automatically extend the project
            completion timeline day-for-day.
          </li>
        </ul>
        <p style={bodyPStyle}>
          <strong>1.3 Natural Wood Tolerances &amp; Inherent Material Traits:</strong> The Client acknowledges
          that natural solid timber, wood veneers, and custom-stained finishes possess organic variations in
          grain figure, pore density, sapwood, mineral streaks, and light reflection. Minor natural grain
          deviations, subtle shade variations under ambient lighting, and hairline panel joints within
          recognized international architectural woodwork tolerances (AWI / BS standards) are natural
          characteristics of wood and shall not constitute defects, non-conformities, or grounds for rejection
          or payment withholding.
        </p>
      </A4PageSheet>

      {/* ===================== PAGE 2 of 8 ===================== */}
      <A4PageSheet
        settings={settings}
        contractNo={contract.contractNo}
        pageNumber={2}
        totalPages={TOTAL_PAGES}
        showClientSign
      >
        <ClauseHeading
          number={2}
          title="PROJECT DOCUMENTATION SUITE, REVISION QUOTAS & COMPULSORY SIGN-OFFS"
        />
        <p style={bodyPStyle}>
          <strong>2.1 Mandatory Governance Documents:</strong> Execution of this project is strictly governed
          by the formal written execution of the following instruments (the &apos;Project Documentation
          Suite&apos;): (a) Approved Shop Drawings; (b) Sample Confirmation Form; (c) Variation Orders (VO);
          and (d) Finish Certificate.
        </p>
        <p style={bodyPStyle}>
          <strong>2.2 Technical Drafting, Delivery Timeline &amp; Revision Limits:</strong> The Contractor
          shall prepare and submit the initial draft of the detailed shop drawings (Revision 00, referenced
          directly to this Contract Number) within <strong>{formatNumberWord(t.shopDrawingMinDays)}</strong>{' '}
          to <strong>{formatNumberWord(t.shopDrawingMaxDays)}</strong> working days, commencing exclusively
          from the date of occurrence of the later of: (a) Full clearance and credit of the{' '}
          {isSingleFullAdvance ? 'Stage 1 Full Advance Payment' : 'Stage 1 Advance Deposit'} ({t.stage1Pct}%)
          into the Contractor&apos;s account under Clause 4.1; and (b) Complete and unobstructed site access
          for physical laser measurement, verified following the completion of base civil works, plastering,
          and floor finishes by the Client or their main contractor.
        </p>
        <p style={bodyPStyle}>
          The Contract Value includes the initial submission (Revision 00) and up to a maximum of{' '}
          <strong>{formatNumberWord(revCount)}</strong> subsequent consolidated revision{' '}
          {revCount === 1 ? 'round' : 'rounds'} ({revRangeText}) within the original scope of Annex A:
        </p>
        <ul style={bulletUlStyle}>
          <li style={bulletLiStyle}>
            <strong>Consolidated Feedback:</strong> The Client must submit all revision comments as one single
            consolidated written batch per round. Piecemeal or fragmented requests shall each count as a
            separate revision round.
          </li>
          <li style={bulletLiStyle}>
            <strong>Additional Revision Fee:</strong> Any drawing revision requested beyond {lastRevLabel}, or
            requested after written sign-off has already been granted, shall incur a non-negotiable drafting
            fee of{' '}
            <strong>
              {currency} {formatMoney(t.additionalRevisionFee)}
            </strong>{' '}
            per revision round, billed via a Variation Order.
          </li>
          <li style={bulletLiStyle}>
            <strong>Design Overhauls:</strong> Any revision altering layout configurations, structural
            concepts, or dimensional footprints beyond Annex A shall constitute a scope variation requiring a
            formal VO and price adjustment under Clause 9.
          </li>
        </ul>

        <p style={bodyPStyle}>
          <strong>2.3 Material Sample Quotas, Presentation Session &amp; Surcharges:</strong> For each
          distinct material or finish specified in Annex A, the Contractor shall prepare and submit a maximum
          of <strong>{formatNumberWord(t.sampleOptionsMin)}</strong> to{' '}
          <strong>{formatNumberWord(t.sampleOptionsMax)}</strong> sample options (stain shades, sheen levels,
          or edge profiles) for selection:
        </p>
        <ul style={bulletUlStyle}>
          <li style={bulletLiStyle}>
            <strong>Single Presentation Session:</strong> The Contractor shall conduct one (1) consolidated
            presentation and explanation session to review all submitted samples. Any additional consultation
            or repeated explanation sessions requested by the Client shall incur a fee of{' '}
            <strong>
              {currency} {formatMoney(t.extraSampleSessionFee)}
            </strong>{' '}
            per session.
          </li>
          <li style={bulletLiStyle}>
            <strong>Extra Custom Samples:</strong> If the Client rejects the included sample allowance and
            requests custom color-matching, special stain formulations, or bespoke CNC profile strike-offs,
            each additional sample piece shall be billed at{' '}
            <strong>
              {currency} {formatMoney(t.extraCustomSampleFee)}
            </strong>{' '}
            via an immediate VO. Full-scale prototypes or mock-ups shall be quoted separately.
          </li>
        </ul>

        <p style={bodyPStyle}>
          <strong>2.4 Compulsory Client Sign-Off &amp; Breach for Refusal:</strong> The Client shall formally
          sign and return the <strong>Sample Confirmation Form</strong> within{' '}
          <strong>{formatNumberWord(t.sampleSignOffDays)}</strong> working days of sample presentation or
          delivery, and all other Project Documentation Suite items (Shop Drawings, Variation Orders, and
          Finish Certificate) within <strong>{formatNumberWord(t.otherDocsSignOffDays)}</strong> working days
          of submission. No fabrication or material ordering shall commence until the final drawing revision
          and Sample Confirmation Form are signed by the Client:
        </p>
        <ul style={bulletUlStyle}>
          <li style={bulletLiStyle}>
            <strong>Immediate Suspension &amp; Price-Lock Expiry:</strong> If the Client fails, delays, or
            refuses to sign within the applicable timeframe above, all manufacturing, procurement, and site
            activities shall immediately pause without liability to the Contractor, and raw material price
            locks and stock reservations shall immediately expire.
          </li>
          <li style={bulletLiStyle}>
            <strong>Material Breach &amp; Termination Right:</strong> If the Client fails or refuses to sign
            any required document within <strong>{formatNumberWord(t.finalNoticeDefaultDays)}</strong> working
            days after receiving a formal written Final Notice of Default from the Contractor, such refusal
            shall constitute a material breach of contract, entitling the Contractor to unilaterally terminate
            this Agreement under Clause 12 (Cancellation, Termination &amp; Revocation of Discounts).
          </li>
        </ul>
      </A4PageSheet>

      {/* ===================== PAGE 3 of 8 ===================== */}
      <A4PageSheet
        settings={settings}
        contractNo={contract.contractNo}
        pageNumber={3}
        totalPages={TOTAL_PAGES}
        showClientSign
      >
        <ClauseHeading number={3} title="CONTRACT VALUE & PRICE ESCALATION PROTECTION" />
        <p style={bodyPStyle}>
          <strong>3.1 Total Contract Value:</strong> The total agreed price for the joinery works detailed in
          Annex A ({quoteNoLabel} <strong>{contract.quotationRef || 'QTN-2026-_______'}</strong>) is{' '}
          <strong>
            {currency} {totalValue > 0 ? formatMoney(totalValue) : '_____________________'}
          </strong>{' '}
          (inclusive of {contract.vatPct}% UAE VAT). Any additional works, upgrades, or variations outside
          Annex A require a signed Variation Order and adjustment to the Contract Value.
        </p>
        <p style={bodyPStyle}>
          <strong>3.2 Price Escalation Resulting from Client Delays:</strong> The Contract Value is calculated
          on raw material and supplier rates current at the Date of Issuance and is strictly conditional upon
          the Client meeting the approval deadlines in Clause 2. If Sample Confirmation approval exceeds{' '}
          <strong>{formatNumberWord(t.sampleSignOffDays)}</strong> working days, or if technical drawings,
          site readiness, or milestone payments are delayed by the Client by more than{' '}
          <strong>{formatNumberWord(t.priceEscalationDelayDays)}</strong> working days:
        </p>
        <ul style={bulletUlStyle}>
          <li style={bulletLiStyle}>
            <strong>Re-Pricing Right:</strong> The Contractor reserves the right to re-evaluate raw material,
            timber, veneer, lacquer, and hardware costs against current market prices on the date approval is
            finally granted.
          </li>
          <li style={bulletLiStyle}>
            <strong>Compulsory Variation Order:</strong> Any net price increases or supplier cost escalations
            incurred shall be borne 100% by the Client and billed via a mandatory Variation Order. Upon
            request, the Contractor shall substantiate such price escalation solely by presenting supplier
            price notices or vendor quotations reflecting the net market cost difference, without any
            obligation to disclose internal labor rates, overhead, or profit margins. Procurement and
            fabrication shall remain suspended until the VO is signed and the cost difference is settled.
          </li>
        </ul>

        <ClauseHeading number={4} title="PAYMENT MILESTONES & OPERATIONAL CHARGES" />
        <p style={bodyPStyle}>
          <strong>4.1 Stage Payment Schedule:</strong> The total Contract Value stated in Clause 3.1
          (inclusive of {contract.vatPct}% VAT) shall be paid into the Contractor&apos;s designated corporate
          bank account according to the following milestones:
        </p>

        {/* Exact Dark Brown Header Milestone Table */}
        <table
          style={{
            width: '100%',
            borderCollapse: 'collapse',
            margin: '6px 0 10px 0',
            fontFamily: CANDARA_FONT,
            fontSize: '9.2pt',
          }}
        >
          <thead>
            <tr style={{ backgroundColor: DARK_BROWN, color: '#ffffff', fontStyle: 'normal' }}>
              <th
                style={{
                  border: `1px solid ${DARK_BROWN}`,
                  padding: '6px 8px',
                  textAlign: 'left',
                  width: '24%',
                  fontWeight: 700,
                }}
              >
                Milestone Stage
              </th>
              <th
                style={{
                  border: `1px solid ${DARK_BROWN}`,
                  padding: '6px 8px',
                  textAlign: 'left',
                  width: '22%',
                  fontWeight: 700,
                }}
              >
                Percentage / Amount
              </th>
              <th
                style={{
                  border: `1px solid ${DARK_BROWN}`,
                  padding: '6px 8px',
                  textAlign: 'left',
                  fontWeight: 700,
                }}
              >
                Trigger &amp; Contractual Condition
              </th>
            </tr>
          </thead>
          <tbody>
            {activeStageRows.map((row, idx) => (
              <tr
                key={row.key}
                style={idx % 2 === 1 ? { backgroundColor: '#faf8f5' } : undefined}
              >
                <td style={{ border: '1px solid #d6cfc7', padding: '7px 8px', fontWeight: 700 }}>
                  {row.label}
                </td>
                <td style={{ border: '1px solid #d6cfc7', padding: '7px 8px', fontWeight: 700 }}>
                  <div>{row.pct}%</div>
                  <div>
                    {currency} {totalValue > 0 ? formatMoney(row.amount) : '____________'}
                  </div>
                </td>
                <td style={{ border: '1px solid #d6cfc7', padding: '7px 8px', lineHeight: 1.38 }}>
                  {row.trigger}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <p style={bodyPStyle}>
          <strong>4.2 Payment Suspension Right:</strong> Work, procurement, and site mobilization shall pause
          immediately without penalty to the Contractor if any payment milestone or approved Variation Order
          is delayed by more than <strong>{formatNumberWord(t.paymentSuspensionDays)}</strong> calendar days.
        </p>

        <p style={bodyPStyle}>
          <strong>4.3 Standard Operational &amp; Incidental Charges:</strong>
        </p>
        <ul style={bulletUlStyle}>
          <li style={bulletLiStyle}>
            <strong>Sample Site Delivery:</strong> Sample review at the Contractor&apos;s office is
            complimentary. Dispatch of samples to the Client&apos;s location incurs a delivery fee of{' '}
            <strong>
              {currency} {formatMoney(t.sampleSiteDeliveryFee)}
            </strong>{' '}
            per trip.
          </li>
          <li style={bulletLiStyle}>
            <strong>Post-Acceptance Call-Out Fee:</strong> Any non-warranty site visit requested by the Client
            after final acceptance shall be charged at{' '}
            <strong>
              {currency} {formatMoney(t.postAcceptanceCalloutFee)}
            </strong>{' '}
            per visit.
          </li>
          <li style={bulletLiStyle}>
            <strong>Aborted Site Visit / Standby Fee:</strong> If the Contractor&apos;s installation crew
            arrives on the confirmed installation date and cannot work due to site unreadiness, missing
            permits, lack of power/water, or obstruction by other trades, a fee of{' '}
            <strong>
              {currency} {formatMoney(t.abortedSiteVisitFee)}
            </strong>{' '}
            per aborted day shall apply.
          </li>
          <li style={bulletLiStyle}>
            <strong>Factory Storage Charges:</strong> If completed goods cannot be delivered due to Client
            site delays or {hasStage2 ? 'non-payment of Stage 2' : 'non-payment of due milestones'}, storage at
            the Contractor&apos;s facility after{' '}
            <strong>{formatNumberWord(t.factoryStorageFreeDays)}</strong> complimentary calendar days shall be
            charged at{' '}
            <strong>
              {currency} {formatMoney(t.factoryStorageDailyFee)}
            </strong>{' '}
            per calendar day.
          </li>
        </ul>
      </A4PageSheet>

      {/* ===================== PAGE 4 of 8 ===================== */}
      <A4PageSheet
        settings={settings}
        contractNo={contract.contractNo}
        pageNumber={4}
        totalPages={TOTAL_PAGES}
        showClientSign
      >
        <ClauseHeading number={5} title="CONTRACT EFFECTIVE DATE" />
        <p style={bodyPStyle}>
          <strong>5.1 Contract Effective Date:</strong> This Agreement becomes legally binding and effective
          on the date (the &apos;Effective Date&apos;) when both of the following conditions have occurred:
          (a) the Stage 1 advance deposit has cleared in full into the Contractor&apos;s corporate bank
          account; and (b) both Parties have formally signed this Agreement. Contractual timelines run
          strictly from the Effective Date.
        </p>

        <ClauseHeading
          number={6}
          title="PROJECT TIMELINE, MATERIAL AVAILABILITY & INSTALLATION SCHEDULING"
        />
        <p style={bodyPStyle}>
          <strong>6.1 Estimated Completion Period:</strong> The estimated fabrication, delivery, and
          installation period shall range between <strong>{formatNumberWord(t.completionMinDays)}</strong> to{' '}
          <strong>{formatNumberWord(t.completionMaxDays)}</strong> working days (Monday to Saturday, excluding
          UAE public holidays), commencing strictly on the latest of: (a) cleared receipt of Stage 1 payment;
          (b) Client&apos;s signed approval of final shop drawings; or (c) Client&apos;s signed approval of
          the Sample Confirmation Form.
        </p>
        <p style={bodyPStyle}>
          <strong>6.2 Material Stock Depletion &amp; Supply Chain Disruptions:</strong> Commercial inventories
          of imported veneers, boards, finishes, and hardware fluctuate rapidly. The Contractor does not
          purchase or reserve materials prior to cleared receipt of Stage 1 payment and signed sample
          confirmation. If a specified material becomes depleted, discontinued, or back-ordered by suppliers:
        </p>
        <ul style={bulletUlStyle}>
          <li style={bulletLiStyle}>
            <strong>Equivalent Substitution:</strong> The Contractor shall promptly notify the Client and
            submit equivalent alternative materials of comparable quality and aesthetic standard for
            confirmation.
          </li>
          <li style={bulletLiStyle}>
            <strong>Timeline &amp; Cost Adjustment:</strong> The project timeline shall automatically extend
            by the sourcing lead time of the alternative material, and any price differential resulting from
            Client approval delays exceeding Clause 2 timeframes shall be adjusted via VO. Third-party stock
            depletion shall not constitute Contractor default.
          </li>
        </ul>

        <p style={bodyPStyle}>
          <strong>6.3 Installation Readiness Notice, Crew Allocation &amp; Queue Rescheduling:</strong> Upon
          completion of workshop fabrication, the Contractor shall issue a formal Notice of Installation
          Readiness to the Client:
        </p>
        <ul style={bulletUlStyle}>
          <li style={bulletLiStyle}>
            <strong>{t.readinessConfirmDays}-Day Readiness Confirmation:</strong> The Client must confirm full
            site readiness, access clearance, and utility availability within{' '}
            <strong>{formatNumberWord(t.readinessConfirmDays)}</strong> working days of receiving the Notice.
          </li>
          <li style={bulletLiStyle}>
            <strong>Crew Re-Allocation &amp; Production Queue:</strong> Because the Contractor maintains
            synchronized commitments across multiple concurrent projects, installation slots are allocated on
            a strict schedule. If the Client fails to respond within{' '}
            <strong>{formatNumberWord(t.readinessConfirmDays)}</strong> working days, or if the site is
            unready on the scheduled date, the Contractor reserves the right to immediately re-allocate its
            installation crew to other active projects without liability.
          </li>
          <li style={bulletLiStyle}>
            <strong>Rescheduling &amp; Storage:</strong> A new installation date shall be assigned strictly
            based on the Contractor&apos;s next available operational calendar slot. The project timeline
            shall automatically extend by the rescheduling gap, and factory storage charges ({currency}{' '}
            {formatMoney(t.factoryStorageDailyFee)}/day after {t.factoryStorageFreeDays} free days) shall
            apply.
          </li>
        </ul>

        <p style={bodyPStyle}>
          <strong>6.4 Excusable Delays &amp; Force Majeure:</strong> The project timeline excludes and
          automatically extends day-for-day for delays caused by Client approval delays, site access
          restrictions, civil/MEP works by others, Variation Orders, customs/port clearance delays, or Force
          Majeure events outside the Contractor&apos;s control.
        </p>

        <ClauseHeading number={7} title="FINAL ACCEPTANCE" />
        <p style={bodyPStyle}>
          <strong>7.1 Joint Inspection &amp; Finish Certificate:</strong> Upon completion of site
          installation, the Parties shall inspect the works and record completion on the Contractor&apos;s{' '}
          <strong>Finish Certificate</strong>. Any minor outstanding snag items must be recorded directly
          under the &quot;Outstanding Snag Items&quot; section of the Finish Certificate within{' '}
          <strong>{formatNumberWord(t.snagReportDays)}</strong> working days of installation completion.
          Secondary or piecemeal snagging requests submitted thereafter shall not be accepted.
        </p>
      </A4PageSheet>

      {/* ===================== PAGE 5 of 8 ===================== */}
      <A4PageSheet
        settings={settings}
        contractNo={contract.contractNo}
        pageNumber={5}
        totalPages={TOTAL_PAGES}
        showClientSign
      >
        <p style={bodyPStyle}>
          <strong>
            {hasStage3
              ? '7.2 Trigger of Final Acceptance & Stage 3 Payment:'
              : hasStage2
                ? '7.2 Trigger of Final Acceptance & Stage 2 Final Payment:'
                : '7.2 Trigger of Final Acceptance:'}
          </strong>{' '}
          The works shall be deemed fully and irrevocably accepted, and{' '}
          {hasStage3
            ? 'Stage 3 final payment immediately due'
            : hasStage2
              ? 'any unpaid Stage 2 final payment immediately due'
              : 'any remaining approved Variation Order or incidental balances immediately due'}{' '}
          in accordance with Clause 4, upon the earliest occurrence of:
        </p>
        <ul style={bulletUlStyle}>
          <li style={bulletLiStyle}>
            <strong>Recorded Acceptance:</strong> Execution of the Finish Certificate by the Client, or
            recorded acceptance via scanned signed certificate, email confirmation, or WhatsApp confirmation
            as documented on the Finish Certificate;
          </li>
          <li style={bulletLiStyle}>
            <strong>Expiry of Inspection Window:</strong> Failure by the Client to inspect or record written
            snag items on the Finish Certificate within{' '}
            <strong>{formatNumberWord(t.snagReportDays)}</strong> working days of installation completion
            notice; or
          </li>
          <li style={bulletLiStyle}>
            <strong>Beneficial Use / Occupancy:</strong> The Client, their family, tenants, or other
            contractors placing items into, loading appliances into, occupying, or utilizing the installed
            joinery.
          </li>
        </ul>

        <ClauseHeading number={8} title="CLIENT SITE RESPONSIBILITIES, HVAC CLIMATE RULES & CONCEALED MEP" />
        <p style={bodyPStyle}>
          <strong>8.1 Site Readiness, Utilities &amp; Access:</strong> The Client shall ensure: (a) clear,
          safe, and unobstructed site access between 8:00 AM and 6:00 PM; (b) continuous, uninterrupted 220V
          electrical power and potable water; (c) completion of all civil, flooring, ceiling, and MEP works
          prior to installation; (d) issuance of all community/building security permits; and (e) site
          security and property insurance.
        </p>
        <p style={bodyPStyle}>
          <strong>8.2 Mandatory HVAC &amp; Environmental Climate Control:</strong> Architectural joinery,
          veneers, and lacquers require stable climate conditions. The Client must ensure that the
          installation premises are fully enclosed and continuously air-conditioned (operational HVAC
          maintaining 20°C–24°C ambient temperature and relative humidity below 60%) prior to, during, and
          after installation. Any installation executed at the Client&apos;s request without functional HVAC
          shall operate as an immediate, total waiver of the workmanship warranty for warping, veneer
          bubbling, joint separation, or lacquer blushing.
        </p>
        <p style={bodyPStyle}>
          <strong>8.3 Concealed MEP &amp; Wall Drilling Liability:</strong> The Client warrants that
          accurate, up-to-date MEP as-built drawings showing all concealed water pipes, electrical conduits,
          gas lines, and AC drains behind walls, ceilings, and floors have been provided prior to
          installation. In the absence of accurate as-built drawings, all anchoring and drilling is performed
          at the Client&apos;s sole risk, and the Contractor disclaims all liability for puncturing unmapped
          concealed utilities or resulting water/electrical damage.
        </p>
        <p style={bodyPStyle}>
          <strong>8.4 Dust Control &amp; Third-Party Site Interference:</strong> The installation area must
          be completely free of wet trades, plastering, tile cutting, and painting. The Contractor may suspend
          installation if active site dust threatens joinery finishes. If instructed to proceed under dusty
          conditions, buffing, cleaning, and surface repair costs shall be charged to the Client, and finish
          warranties for surface contamination shall be void.
        </p>

        <ClauseHeading number={9} title="VARIATIONS & CHANGE ORDERS" />
        <p style={bodyPStyle}>
          <strong>9.1 Written Variation Orders:</strong> Any modification to approved drawings, dimensions,
          materials, hardware, or scope in Annex A must be requested in writing and formalized through a
          signed Variation Order (VO) specifying the price adjustment, payment terms, and schedule impact
          prior to execution. Verbal instructions shall not be binding, and affected work shall remain paused
          until the VO is signed by both Parties and paid in full (100% upon VO approval).
        </p>
        <p style={bodyPStyle}>
          <strong>
            9.2 Scope Ceiling for Variation Orders ({currency} {formatMoney(t.voScopeCeiling)} Limit):
          </strong>{' '}
          Variation Orders apply strictly to minor modifications or additions not exceeding{' '}
          <strong>
            {currency} {formatMoney(t.voScopeCeiling)}
          </strong>{' '}
          (inclusive of VAT). Any additional scope exceeding {currency} {formatMoney(t.voScopeCeiling)}, or
          involving new standalone rooms or joinery packages, shall be executed as a separate independent
          Contract with its own quotation, payment milestones, and completion timeline (unless otherwise
          mutually agreed in the VO).
        </p>
      </A4PageSheet>

      {/* ===================== PAGE 6 of 8 ===================== */}
      <A4PageSheet
        settings={settings}
        contractNo={contract.contractNo}
        pageNumber={6}
        totalPages={TOTAL_PAGES}
        showClientSign
      >
        <ClauseHeading number={10} title="RETENTION OF TITLE & RIGHT OF REPOSSESSION" />
        <p style={bodyPStyle}>
          <strong>10.1 Ownership Retention:</strong> Legal title and ownership of all fabricated joinery,
          panels, fixtures, and hardware shall remain exclusively with the Contractor until the total Contract
          Value, including all approved Variation Orders and incidental charges, has been paid in full. Risk
          of loss or damage transfers to the Client immediately upon delivery to the site.
        </p>
        <p style={bodyPStyle}>
          <strong>10.2 Retention of Title &amp; Default Remedies:</strong> Title, ownership, and property in
          all fabricated joinery, materials, and loose or unfixed components shall remain solely with the
          Contractor until all due amounts under this Agreement have been paid in full by the Client. In the
          event the Client fails to pay any due payment milestone: (a) The Contractor shall have the lawful
          right to exercise a lien and withhold delivery of any items remaining in its factory, workshops, or
          custody; (b) The Contractor may immediately suspend site delivery, ongoing assembly, and
          installation works without liability for project delay; and (c) The Contractor shall be entitled to
          initiate expedited legal proceedings, including applying for an urgent Payment Order (Amr Ada&apos;a)
          or interim protective orders before the competent Abu Dhabi Courts to attach, secure, or recover
          unfixed goods and claim outstanding balances, storage costs, and associated legal expenses.
        </p>
        <p style={bodyPStyle}>
          <strong>10.3 Uncollected Goods, Deemed Abandonment &amp; Right of Resale:</strong> (a) Where
          fabricated items remain at the Contractor&apos;s workshop due to the Client&apos;s failure to{' '}
          {hasStage2 ? 'settle the Stage 2 payment' : 'settle due payments'}, confirm site readiness, or accept
          delivery, standard factory storage charges of{' '}
          <strong>
            {currency} {formatMoney(t.factoryStorageDailyFee)}
          </strong>{' '}
          per calendar day shall accrue after{' '}
          <strong>{formatNumberWord(t.factoryStorageFreeDays)}</strong> complimentary days under Clause 4.3.
          (b) If the Client fails to pay the outstanding balance or accept delivery within{' '}
          <strong>{formatNumberWord(t.abandonmentDefaultDays)}</strong> calendar days following the issuance
          of a formal written Notice of Default, the Contractor shall issue a Final{' '}
          {t.abandonmentFinalNoticeDays}-Day Notice of Abandonment. (c) If the Client fails to cure the
          default upon expiry of the Final Notice, this Agreement shall be deemed terminated for Client
          default under Clause 12. Legal title having remained with the Contractor under Clause 10.1, the
          items shall be deemed legally abandoned property. (d) The Contractor shall have the full contractual
          right to dismantle, repurpose, scrap, or sell the items at its sole discretion to mitigate its
          losses, recover accumulated storage charges, and offset unpaid manufacturing costs. Net proceeds
          realized from any resale shall be credited against the Client&apos;s liability, and the Contractor
          retains the right to claim any remaining deficiency, costs, and damages from the Client.
        </p>

        <ClauseHeading number={11} title="CONTRACTOR RESPONSIBILITIES & WORKMANSHIP WARRANTY" />
        <p style={bodyPStyle}>
          <strong>11.1 {warrantyTitlePrefix} Workmanship Warranty:</strong> The Contractor warrants that all
          items delivered and installed shall conform to Annex A and the final approved shop drawings, and
          provides a <strong>{formatNumberWord(t.warrantyYears)}</strong>-year workmanship warranty commencing
          from the date of the Finish Certificate (or Deemed Acceptance), covering fabrication and
          installation defects directly attributable to the Contractor.
        </p>
        <p style={bodyPStyle}>
          <strong>11.2 Warranty Exclusions:</strong> This warranty strictly excludes: (a) misuse, neglect,
          improper care, or abrasive cleaning agents; (b) water leaks, standing moisture, flooding, or
          non-air-conditioned high humidity (breaching Clause 8.2); (c) natural wood expansion, contraction,
          grain checking, or color aging; (d) alterations, modifications, or repairs performed by the Client
          or third parties; and (e) physical damage caused by other site trades, movers, or pests.
        </p>

        <ClauseHeading number={12} title="CANCELLATION, TERMINATION & REVOCATION OF DISCOUNTS" />
        <p style={bodyPStyle}>
          <strong>12.1 Revocation of Commercial Discounts Ab Initio:</strong> Any promotional discount,
          package reduction, or commercial fee concession granted in the Contract Value is strictly contingent
          upon full project completion and full payment of all milestones. In the event of early termination,
          cancellation, or Client breach under Clause 2.4:
        </p>
        <ul style={bulletUlStyle}>
          <li style={bulletLiStyle}>
            <strong>Voiding of Discounts:</strong> All discounts, credits, and concessions shall be deemed
            immediately void and revoked ab initio (from inception).
          </li>
          <li style={bulletLiStyle}>
            <strong>Gross Rate Valuation:</strong> All engineering/drafting work, administrative overhead,
            material procurement, factory fabrication, and labor executed up to the termination date shall be
            valued and billed at the Contractor&apos;s standard, non-discounted gross unit rates.
          </li>
        </ul>
      </A4PageSheet>

      {/* ===================== PAGE 7 of 8 ===================== */}
      <A4PageSheet
        settings={settings}
        contractNo={contract.contractNo}
        pageNumber={7}
        totalPages={TOTAL_PAGES}
        showClientSign
      >
        <p style={bodyPStyle}>
          <strong>12.2 Cancellation Deductions &amp; Settlement:</strong> Upon cancellation or termination:
          (a) a non-negotiable <strong>{formatPercentWord(t.cancellationFeePct)}</strong> cancellation fee
          calculated on the gross non-discounted contract value shall apply; (b) the Contractor shall deduct
          all gross-valued work completed, non-recoverable materials purchased, and custom items fabricated;
          (c) custom-manufactured joinery and specially ordered materials are strictly non-refundable; and
          (d) any balance owed to the Contractor exceeding amounts already paid shall be settled by the Client
          within <strong>{formatNumberWord(t.cancellationSettlementDays)}</strong> calendar days.
        </p>

        <ClauseHeading number={13} title="LIMITATION OF LIABILITY" />
        <p style={bodyPStyle}>
          <strong>13.1</strong> Subject to Clause 13.3, neither Party shall be liable to the other for any
          indirect, incidental, special, or consequential damages, including loss of profit, loss of revenue,
          loss of business, or loss of anticipated savings, arising under or in connection with this
          Agreement.
        </p>
        <p style={bodyPStyle}>
          <strong>13.2</strong> Subject to Clause 13.3, the Contractor&apos;s total cumulative liability
          arising out of or related to the performance or non-performance of this Agreement, whether in
          contract, indemnity, or otherwise, shall be strictly capped at{' '}
          <strong>{formatPercentWord(t.liabilityCapPct)} of the net Contract Value</strong> (excluding VAT).
        </p>
        <p style={bodyPStyle}>
          <strong>13.3 Statutory Exceptions:</strong> Nothing in this Agreement shall operate to limit or
          exclude the Contractor&apos;s or Client&apos;s liability for: (a) Fraud, fraudulent
          misrepresentation, or willful misconduct; (b) Gross negligence (al-khata&apos; al-jasim); or (c)
          Direct physical damage caused to the Client&apos;s existing real property or third-party property
          arising from a harmful act (fi&apos;l dar) during installation works, to the extent mandated by
          Article 257 and Article 334 of the UAE Civil Transactions Law.
        </p>

        <ClauseHeading number={14} title="FORMAL COMMUNICATION PROTOCOL" />
        <p style={bodyPStyle}>
          <strong>14.1 Official Channels:</strong> All binding contractual notices, shop drawing approvals,
          sample confirmations, Variation Orders, and termination notices must be transmitted via registered
          corporate email or <strong>delivered as a formal PDF/image bearing the Client&apos;s signature on the Contractor&apos;s official forms, sent exclusively from the Client&apos;s designated Mobile Number stated on Page 1 to the Contractor&apos;s official business WhatsApp or email.</strong>{' '}
          Casual chat texts, voice notes, emojis, or messages from third-party numbers shall not constitute
          binding contractual approvals, variations, or snagging submissions.
        </p>

        <ClauseHeading number={15} title="GOVERNING LAW & DISPUTE RESOLUTION" />
        <p style={bodyPStyle}>
          <strong>15.1</strong> This Agreement, its interpretation, and any dispute arising out of or in
          connection with it shall be governed by and construed in accordance with the Federal Laws of the
          United Arab Emirates, including{' '}
          <strong>Federal Decree by Law No. (25) of 2025 Promulgating the Civil Transactions Law</strong>, and
          the local laws of the Emirate of Abu Dhabi to the extent they do not conflict with Federal Law.
        </p>
        <p style={bodyPStyle}>
          <strong>15.2</strong> The Parties agree that any dispute, controversy, or claim arising out of or
          relating to this Agreement, which cannot be amicably settled within{' '}
          <strong>{formatNumberWord(t.disputeAmicableDays)}</strong> days of written notice, shall be
          submitted to the exclusive jurisdiction of the Courts of the Abu Dhabi Judicial Department.
        </p>
      </A4PageSheet>

      {/* ===================== PAGE 8 of 8 ===================== */}
      <A4PageSheet
        settings={settings}
        contractNo={contract.contractNo}
        pageNumber={8}
        totalPages={TOTAL_PAGES}
        showClientSign
        isLastPage
      >
        <ClauseHeading number={16} title="ACCEPTANCE & EXECUTION" />
        <p style={bodyPStyle}>
          Electronic, digital, or mobile-screen signatures affixed to this Agreement or any Project Document
          and transmitted from the Client&apos;s designated Mobile Number on Page 1 shall carry the exact same
          legal force as original wet-ink signatures, and shall constitute full acceptance of the complete,
          unedited multi-page document transmitted by the Contractor.
        </p>
        <p style={{ ...bodyPStyle, marginTop: '8px' }}>
          IN WITNESS WHEREOF, the Parties confirm that they have read, understood, and accepted all sixteen
          (16) clauses of this Agreement and its Annexes, and have executed this Agreement as of the dates set
          forth below:
        </p>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '34px',
            marginTop: '36px',
            fontFamily: CANDARA_FONT,
            fontSize: '9.5pt',
          }}
        >
          {/* Contractor Signatory */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div style={{ fontWeight: 700, textTransform: 'uppercase', color: '#111111' }}>
              FOR AND ON BEHALF OF CONTRACTOR:
            </div>
            <div style={{ fontWeight: 700, color: '#111111', marginBottom: '4px' }}>
              {companyName.toUpperCase()}
            </div>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'baseline' }}>
              <span style={{ minWidth: '118px' }}>Authorized Signatory:</span>
              {dottedOrValue(contract.contractorSignatoryName, 125)}
            </div>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'baseline' }}>
              <span style={{ minWidth: '118px' }}>Name:</span>
              {dottedOrValue(contract.contractorSignatoryName, 125)}
            </div>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'baseline' }}>
              <span style={{ minWidth: '118px' }}>Title:</span>
              {dottedOrValue(contract.contractorSignatoryTitle, 125)}
            </div>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'baseline' }}>
              <span style={{ minWidth: '118px' }}>Date:</span>
              {dottedOrValue(formatDisplayDate(contract.contractorSignDate), 125)}
            </div>
            <div style={{ marginTop: '14px' }}>
              <div style={{ marginBottom: '48px' }}>Signature &amp; Official Company Stamp:</div>
              <div style={{ borderBottom: '1px dotted #4b5563', width: '90%' }} />
            </div>
          </div>

          {/* Client Signatory */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div style={{ fontWeight: 700, textTransform: 'uppercase', color: '#111111' }}>
              FOR AND ON BEHALF OF CLIENT:
            </div>
            <div style={{ height: '18px', marginBottom: '4px' }} />
            <div style={{ display: 'flex', gap: '8px', alignItems: 'baseline' }}>
              <span style={{ minWidth: '96px' }}>Client Full Name:</span>
              {dottedOrValue(contract.clientName, 130)}
            </div>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'baseline' }}>
              <span style={{ minWidth: '96px' }}>Emirates ID:</span>
              {dottedOrValue(contract.emiratesId, 130)}
            </div>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'baseline' }}>
              <span style={{ minWidth: '96px' }}>Mobile No.:</span>
              {dottedOrValue(contract.mobileNo, 130)}
            </div>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'baseline' }}>
              <span style={{ minWidth: '96px' }}>Date:</span>
              {dottedOrValue(formatDisplayDate(contract.clientSignDate), 130)}
            </div>
            <div style={{ marginTop: '14px' }}>
              <div style={{ marginBottom: '48px' }}>Client Signature:</div>
              <div style={{ borderBottom: '1px dotted #4b5563', width: '90%' }} />
            </div>
          </div>
        </div>
      </A4PageSheet>
    </div>
  );
};

// =====================================================================
// 2. SAMPLE CONFIRMATION DOCUMENT (EXACT MATCH TO NOV VERSION PDF)
// =====================================================================
export const PrintSampleConfirmationDocument: React.FC<{
  suite: ProjectDocumentSuite;
  sample: SampleConfirmationDocument;
  settings: CompanySettings;
}> = ({ suite, sample, settings }) => {
  const c = suite.contract;
  const t = c.terms;
  const currency = c.currency || settings.currency || 'AED';
  const rows: SampleConfirmationRow[] =
    sample.rows && sample.rows.length > 0
      ? sample.rows
      : [
          {
            id: 'empty',
            jyCode: '',
            roomArea: '',
            component: '',
            materialFinish: '',
            codeSlabId: '',
            technicalSpec: '',
            approvalNote: '',
          },
        ];

  // Paginate cleanly: Page 1 holds up to 5 rows + notes/signatures (or 7 rows if multi-page)
  const needsMultiPage = rows.length > 5;
  const rowPages: SampleConfirmationRow[][] = needsMultiPage
    ? [rows.slice(0, 8), ...chunkArray(rows.slice(8), 9)]
    : [rows];
  // If the last row page has more than 4 rows when multi-page, put confirmation/signatures on a clean final page
  const putFooterBlockOnSeparatePage = needsMultiPage && rowPages[rowPages.length - 1].length > 4;
  const totalPages = rowPages.length + (putFooterBlockOnSeparatePage ? 1 : 0);

  const renderSampleTable = (pageRows: SampleConfirmationRow[], startIdx: number) => (
    <table
      style={{
        width: '100%',
        borderCollapse: 'collapse',
        marginTop: '6px',
        marginBottom: '12px',
        fontFamily: CANDARA_FONT,
        fontSize: '8.6pt',
      }}
    >
      <thead>
        <tr style={{ backgroundColor: '#ffff00', color: '#000000', fontStyle: 'normal' }}>
          <th style={{ border: '1px solid #374151', padding: '5px 5px', width: '8%', textAlign: 'center', fontWeight: 700 }}>
            JY Code
          </th>
          <th style={{ border: '1px solid #374151', padding: '5px 5px', width: '12%', textAlign: 'center', fontWeight: 700 }}>
            Room Area
          </th>
          <th style={{ border: '1px solid #374151', padding: '5px 5px', width: '12%', textAlign: 'center', fontWeight: 700 }}>
            Component
          </th>
          <th style={{ border: '1px solid #374151', padding: '5px 5px', width: '14%', textAlign: 'center', fontWeight: 700 }}>
            Material / Finish
          </th>
          <th style={{ border: '1px solid #374151', padding: '5px 5px', width: '11%', textAlign: 'center', fontWeight: 700 }}>
            Code / Slab ID
          </th>
          <th style={{ border: '1px solid #374151', padding: '5px 5px', width: '17%', textAlign: 'center', fontWeight: 700 }}>
            Technical Spec
          </th>
          <th style={{ border: '1px solid #374151', padding: '5px 5px', width: '14%', textAlign: 'center', fontWeight: 700 }}>
            Photo
          </th>
          <th style={{ border: '1px solid #374151', padding: '5px 5px', width: '12%', textAlign: 'center', fontWeight: 700 }}>
            Approval Note
          </th>
        </tr>
      </thead>
      <tbody>
        {pageRows.map((row, idx) => {
          const globalIndex = startIdx + idx;
          const isShaded = globalIndex % 2 === 0;
          return (
            <tr
              key={row.id || globalIndex}
              style={{ backgroundColor: isShaded ? '#d9d9d9' : '#ffffff' }}
            >
              <td style={{ border: '1px solid #4b5563', padding: '5px', fontWeight: 700, verticalAlign: 'top' }}>
                {row.jyCode || '—'}
              </td>
              <td style={{ border: '1px solid #4b5563', padding: '5px', verticalAlign: 'top' }}>
                {row.roomArea || '—'}
              </td>
              <td style={{ border: '1px solid #4b5563', padding: '5px', verticalAlign: 'top' }}>
                {row.component || '—'}
              </td>
              <td style={{ border: '1px solid #4b5563', padding: '5px', verticalAlign: 'top' }}>
                {row.materialFinish || '—'}
              </td>
              <td style={{ border: '1px solid #4b5563', padding: '5px', verticalAlign: 'top' }}>
                {row.codeSlabId || '—'}
              </td>
              <td style={{ border: '1px solid #4b5563', padding: '5px', verticalAlign: 'top' }}>
                {row.technicalSpec || '—'}
              </td>
              <td style={{ border: '1px solid #4b5563', padding: '4px', verticalAlign: 'top', textAlign: 'center' }}>
                {row.photoUrl ? (
                  <div>
                    <img
                      src={row.photoUrl}
                      alt={row.photoFileName || row.jyCode}
                      style={{
                        width: '70px',
                        height: '52px',
                        objectFit: 'cover',
                        borderRadius: '2px',
                        border: '1px solid #9ca3af',
                        display: 'block',
                        margin: '0 auto 2px auto',
                      }}
                      referrerPolicy="no-referrer"
                    />
                    {row.photoFileName && (
                      <div style={{ fontSize: '7pt', color: '#374151', wordBreak: 'break-all' }}>
                        {row.photoFileName}
                      </div>
                    )}
                  </div>
                ) : (
                  <span style={{ fontSize: '8pt', color: '#374151' }}>{row.photoFileName || '—'}</span>
                )}
              </td>
              <td style={{ border: '1px solid #4b5563', padding: '5px', verticalAlign: 'top' }}>
                {row.approvalNote || '—'}
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );

  const renderConfirmationAndSignatures = () => (
    <div>
      <div style={{ fontWeight: 700, fontSize: '9.5pt', marginBottom: '4px' }}>Delivery Method</div>
      <ul style={bulletUlStyle}>
        <li style={bulletLiStyle}>
          {sample.deliveryMethod === 'office' ? '☑ ' : '☐ '}
          Collected from office on:{' '}
          {sample.deliveryMethod === 'office' && sample.deliveryDate
            ? formatDisplayDate(sample.deliveryDate)
            : '[date]'}
        </li>
        <li style={bulletLiStyle}>
          {sample.deliveryMethod === 'site' ? '☑ ' : '☐ '}
          Delivered to Client site on:{' '}
          {sample.deliveryMethod === 'site' && sample.deliveryDate
            ? formatDisplayDate(sample.deliveryDate)
            : '[date]'}{' '}
          (Delivery fee: {currency} {formatMoney(sample.deliveryFee || t.sampleSiteDeliveryFee)} if applicable)
        </li>
      </ul>

      <p style={{ ...bodyPStyle, marginTop: '8px' }}>
        <strong>Client Confirmation:</strong> By signing below, the Client confirms acceptance of the above
        sample for procurement and fabrication under Contract No. <strong>{c.contractNo}</strong>.
      </p>

      <div style={{ fontWeight: 700, fontSize: '9.5pt', marginTop: '6px', marginBottom: '4px' }}>Note:</div>
      <ul style={bulletUlStyle}>
        <li style={bulletLiStyle}>
          <strong>Physical Inspection &amp; Approval:</strong> By signing below, the Client confirms having
          physically inspected and approved the tangible material samples, finish swatches, and/or physical
          mock-ups corresponding to the items and codes listed above, and acknowledges that digital
          photographs or screen displays are illustrative only.
        </li>
        <li style={bulletLiStyle}>
          <strong>Natural Materials:</strong> Natural variations in wood grain, veneer shade, figure, and
          texture are inherent to natural timber and stone materials and are not considered defects under
          Articles 448 and 497 of the UAE Civil Transactions Law. Any premium or special materials
          subsequently requested by the Client may incur additional charges.
        </li>
        <li style={bulletLiStyle}>
          <strong>Approval Deadline &amp; Price Locks:</strong> Failure to sign and return this Sample
          Confirmation within <strong>{formatNumberWord(t.sampleSignOffDays)}</strong> working days of
          presentation/delivery releases all material price locks and stock reservations under Clause 2.4 and
          Clause 3.2 of the Main Contract, and any resulting supplier price escalation or lead-time delay
          shall be borne by the Client.
        </li>
      </ul>

      {/* Two-Column Signatures */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '32px',
          marginTop: '18px',
          fontSize: '9.3pt',
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{ fontWeight: 700 }}>Client:</div>
          <div>Name: {dottedOrValue(sample.clientName || c.clientName, 140)}</div>
          <div>Date: {dottedOrValue(formatDisplayDate(sample.clientDate), 140)}</div>
          <div style={{ marginTop: '10px' }}>Signature: {dottedOrValue('', 130)}</div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{ fontWeight: 700 }}>
            Contractor ({settings.name || 'Touch of Wood Decoration Works LLC'})
          </div>
          <div>Name: {dottedOrValue(sample.contractorName, 140)}</div>
          <div>Position: {dottedOrValue(sample.contractorPosition, 132)}</div>
          <div>Date: {dottedOrValue(formatDisplayDate(sample.contractorDate), 140)}</div>
          <div style={{ marginTop: '4px' }}>Signature: {dottedOrValue('', 130)}</div>
        </div>
      </div>
    </div>
  );

  let runningRowOffset = 0;

  return (
    <div
      id="print-area"
      className="doc-suite-a4-root flex flex-col gap-6 bg-transparent"
      style={{ fontFamily: CANDARA_FONT, fontStyle: 'italic' }}
    >
      {rowPages.map((pageRows, pageIdx) => {
        const startOffset = runningRowOffset;
        runningRowOffset += pageRows.length;
        const isLastRowPage = pageIdx === rowPages.length - 1;
        const includeFooterOnThisPage = isLastRowPage && !putFooterBlockOnSeparatePage;

        return (
          <A4PageSheet
            key={pageIdx}
            settings={settings}
            contractNo={c.contractNo}
            pageNumber={pageIdx + 1}
            totalPages={totalPages}
            showClientSign
            isLastPage={includeFooterOnThisPage}
          >
            {pageIdx === 0 ? (
              <>
                <h1
                  style={{
                    fontSize: '13pt',
                    fontWeight: 700,
                    fontStyle: 'normal',
                    margin: '2px 0 8px 0',
                    color: '#111111',
                  }}
                >
                  Sample Confirmation
                </h1>
                <div style={{ fontSize: '9.4pt', lineHeight: 1.65, marginBottom: '6px' }}>
                  <div>
                    <strong>Contract No.:</strong> {c.contractNo}
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: '16px' }}>
                    <span>
                      <strong>Project No.:</strong> {dottedOrValue(c.projectCode, 110)}
                    </span>
                    <span>
                      <strong>Client:</strong> {dottedOrValue(sample.clientName || c.clientName, 130)}
                    </span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' }}>
                    <span>
                      <strong>Sample ID:</strong> {sample.sampleId || 'S-001'}
                    </span>
                    <span>
                      <strong>Drawing Reference:</strong> {sample.drawingReference || '[TOW-DW-xxx Rev x]'}
                    </span>
                    <span>
                      <strong>Date Issued:</strong> {dottedOrValue(formatDisplayDate(sample.dateIssued), 95)}
                    </span>
                  </div>
                  <div>
                    <strong>Reference Clause:</strong> Clause 2 (Design Drawings &amp; Sample Quotas) &amp;
                    Clause 4 (Payment Milestones)
                  </div>
                </div>
                <div style={{ fontWeight: 700, fontSize: '9.5pt', marginTop: '4px' }}>
                  Sample Description:
                </div>
              </>
            ) : (
              <div style={{ fontWeight: 700, fontSize: '10pt', marginBottom: '6px' }}>
                Sample Confirmation ({sample.sampleId}) — Continued
              </div>
            )}

            {renderSampleTable(pageRows, startOffset)}
            {includeFooterOnThisPage && renderConfirmationAndSignatures()}
          </A4PageSheet>
        );
      })}

      {putFooterBlockOnSeparatePage && (
        <A4PageSheet
          settings={settings}
          contractNo={c.contractNo}
          pageNumber={totalPages}
          totalPages={totalPages}
          showClientSign
          isLastPage
        >
          <div style={{ fontWeight: 700, fontSize: '10.5pt', marginBottom: '10px' }}>
            Sample Confirmation ({sample.sampleId}) — Delivery &amp; Acceptance
          </div>
          {renderConfirmationAndSignatures()}
        </A4PageSheet>
      )}
    </div>
  );
};

// =====================================================================
// 3. VARIATION ORDER (VO) DOCUMENT (EXACT MATCH TO NOV VERSION PDF)
// =====================================================================
export const PrintVariationOrderDocument: React.FC<{
  suite: ProjectDocumentSuite;
  vo: VariationOrderDocument;
  settings: CompanySettings;
}> = ({ suite, vo, settings }) => {
  const c = suite.contract;
  const currency = c.currency || settings.currency || 'AED';
  const calc = calculateVoTotals(vo);

  return (
    <div
      id="print-area"
      className="doc-suite-a4-root flex flex-col gap-6 bg-transparent"
      style={{ fontFamily: CANDARA_FONT, fontStyle: 'italic' }}
    >
      <A4PageSheet
        settings={settings}
        contractNo={c.contractNo}
        pageNumber={1}
        totalPages={1}
        showClientSign
        isLastPage
      >
        <h1
          style={{
            fontSize: '13pt',
            fontWeight: 700,
            fontStyle: 'normal',
            margin: '4px 0 14px 0',
            color: '#111111',
          }}
        >
          Variation Order (VO)
        </h1>

        <div style={{ fontSize: '9.5pt', lineHeight: 1.85, marginBottom: '12px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: '16px' }}>
            <span>
              <strong>Variation Order No.:</strong> {vo.voNo || 'VO-001'}
            </span>
            <span>
              <strong>Contract No.:</strong> {c.contractNo}
            </span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: '16px' }}>
            <span>
              <strong>Project No.:</strong> {dottedOrValue(c.projectCode, 90)}
            </span>
            <span>
              <strong>Issued By:</strong> {vo.issuedBy || 'Contractor'}
            </span>
            <span>
              <strong>Date Issued:</strong> {dottedOrValue(formatDisplayDate(vo.dateIssued), 95)}
            </span>
          </div>
          <div>
            <strong>Reference Clause:</strong> Clause 9 — Variations &amp; Change Orders
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: '16px' }}>
            <span>
              <strong>Origin of Variation:</strong> Requested by: {vo.originRequestedBy || 'Client'}
            </span>
            <span>
              <strong>Request Date:</strong> {dottedOrValue(formatDisplayDate(vo.requestDate), 100)}
            </span>
          </div>
          <div>
            <strong>Reference Drawing(s):</strong> {dottedOrValue(vo.referenceDrawings, 190)}
          </div>
        </div>

        {/* Description of Variation */}
        <div style={{ marginBottom: '12px' }}>
          <div style={{ fontSize: '9.5pt', marginBottom: '6px' }}>
            <strong>Description of Variation:</strong> Provide a clear, itemized description of the change(s):
          </div>
          <ol
            style={{
              margin: '0 0 0 22px',
              padding: 0,
              fontSize: '9.5pt',
              lineHeight: 1.65,
            }}
          >
            {(vo.items && vo.items.length > 0 ? vo.items : [{ id: '1', description: '' }]).map((item) => (
              <li key={item.id} style={{ marginBottom: '4px' }}>
                {item.description || '____________________________________________________________'}
              </li>
            ))}
          </ol>
        </div>

        {/* Cost Impact */}
        <div style={{ marginBottom: '12px' }}>
          <div style={{ fontWeight: 700, fontSize: '9.6pt', marginBottom: '5px' }}>Cost Impact</div>
          <ul style={bulletUlStyle}>
            <li style={bulletLiStyle}>
              Original Contract Value: {currency} {formatMoney(c.contractValue)}
            </li>
            <li style={bulletLiStyle}>
              VO Cost (materials/labor/other): {currency} {formatMoney(calc.base)} (excluding VAT)
            </li>
            <li style={bulletLiStyle}>
              VAT ({vo.vatPct}%): {currency} {formatMoney(calc.vatAmount)}
            </li>
            <li style={bulletLiStyle}>
              <strong>
                Total VO Cost (incl. VAT): {currency} {formatMoney(calc.totalInclVat)}
              </strong>
            </li>
          </ul>
        </div>

        {/* Time Impact */}
        <div style={{ marginBottom: '12px' }}>
          <div style={{ fontWeight: 700, fontSize: '9.6pt', marginBottom: '5px' }}>Time Impact</div>
          <ul style={bulletUlStyle}>
            <li style={bulletLiStyle}>
              Original Completion Date: {dottedOrValue(formatDisplayDate(vo.originalCompletionDate), 120)}
            </li>
            <li style={bulletLiStyle}>
              Additional Time Required:{' '}
              <strong>
                +{vo.additionalWorkingDays || 0} working{' '}
                {(vo.additionalWorkingDays || 0) === 1 ? 'day' : 'days'}
              </strong>
            </li>
            <li style={bulletLiStyle}>
              Revised Completion Date (if approved):{' '}
              {dottedOrValue(formatDisplayDate(vo.revisedCompletionDate), 120)}
            </li>
          </ul>
        </div>

        <p style={{ ...bodyPStyle, marginBottom: '12px' }}>
          Work on the affected items will remain paused until this VO is{' '}
          <strong>signed by both parties and paid in full (100% upon VO approval)</strong>. Upon cleared
          receipt of payment, the Contractor will proceed as per the revised scope and schedule.
        </p>

        {/* Client Approval */}
        <div style={{ marginBottom: '14px' }}>
          <div style={{ fontWeight: 700, fontSize: '9.6pt', marginBottom: '4px' }}>Client Approval</div>
          <p style={bodyPStyle}>
            By signing below, both parties confirm their agreement to all terms and annexes. Where this
            Variation Order introduces new materials or finishes, the Client confirms having physically
            inspected and approved the tangible material samples/swatches corresponding thereto, and not
            solely digital representations.
          </p>
        </div>

        {/* Signatures */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '34px',
            marginTop: '14px',
            marginBottom: '22px',
            fontSize: '9.5pt',
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '9px' }}>
            <div style={{ fontWeight: 700 }}>Client:</div>
            <div>Name: {dottedOrValue(vo.clientName || c.clientName, 145)}</div>
            <div>Date: {dottedOrValue(formatDisplayDate(vo.clientDate), 145)}</div>
            <div style={{ marginTop: '10px' }}>Signature: {dottedOrValue('', 135)}</div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '9px' }}>
            <div style={{ fontWeight: 700 }}>Contractor:</div>
            <div style={{ fontWeight: 600 }}>{settings.name || 'Touch of Wood Decoration Works LLC'}</div>
            <div>Date: {dottedOrValue(formatDisplayDate(vo.contractorDate), 145)}</div>
            <div style={{ marginTop: '10px' }}>Signature: {dottedOrValue('', 135)}</div>
          </div>
        </div>

        {/* Notes / Attachments */}
        <div>
          <div style={{ fontWeight: 700, fontSize: '9.5pt', marginBottom: '4px' }}>Notes / Attachments</div>
          <ul style={bulletUlStyle}>
            <li style={bulletLiStyle}>
              {vo.notesAttachments ||
                'Attach revised drawings, material samples, cost breakdowns, and any correspondence (email/WhatsApp screenshots) that confirm approval.'}
            </li>
          </ul>
        </div>
      </A4PageSheet>
    </div>
  );
};

// =====================================================================
// 4. FINISH CERTIFICATE DOCUMENT (NOV PDF + SNAG PHOTOS + COMPLETION PHOTOS)
// =====================================================================
const PhotoGridPage: React.FC<{
  settings: CompanySettings;
  contractNo: string;
  title: string;
  subtitle?: string;
  photos: DocumentPhotoItem[];
  pageNumber: number;
  totalPages: number;
  showClientSign?: boolean;
  isLastPage?: boolean;
}> = ({
  settings,
  contractNo,
  title,
  subtitle,
  photos,
  pageNumber,
  totalPages,
  showClientSign = true,
  isLastPage = false,
}) => (
  <A4PageSheet
    settings={settings}
    contractNo={contractNo}
    pageNumber={pageNumber}
    totalPages={totalPages}
    showClientSign={showClientSign}
    isLastPage={isLastPage}
  >
    <h2 style={{ fontSize: '12pt', fontWeight: 700, fontStyle: 'normal', margin: '2px 0 4px 0', color: '#111111' }}>
      {title}
    </h2>
    {subtitle && (
      <p style={{ fontSize: '9pt', color: '#4b5563', margin: '0 0 12px 0' }}>{subtitle}</p>
    )}
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '12px',
      }}
    >
      {photos.map((photo, idx) => (
        <div
          key={photo.id || idx}
          style={{
            border: '1px solid #d6cfc7',
            borderRadius: '3px',
            overflow: 'hidden',
            backgroundColor: '#ffffff',
          }}
        >
          <div
            style={{
              height: '64mm',
              backgroundColor: '#f8fafc',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              overflow: 'hidden',
            }}
          >
            <img
              src={photo.photoUrl}
              alt={photo.caption || `Photo ${idx + 1}`}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              referrerPolicy="no-referrer"
            />
          </div>
          <div style={{ padding: '5px 8px', fontSize: '8.5pt', borderTop: '1px solid #e5e7eb' }}>
            {photo.area && <div style={{ fontWeight: 700, color: DARK_BROWN }}>{photo.area}</div>}
            <div style={{ color: '#1f2937' }}>{photo.caption || photo.fileName || `Site Photo #${idx + 1}`}</div>
          </div>
        </div>
      ))}
    </div>
  </A4PageSheet>
);

export const PrintFinishCertificateDocument: React.FC<{
  suite: ProjectDocumentSuite;
  fc: FinishCertificateDocument;
  settings: CompanySettings;
}> = ({ suite, fc, settings }) => {
  const c = suite.contract;
  const t = c.terms;
  const hasStage2 = (t.stage2Pct || 0) > 0;
  const hasStage3 = (t.stage3Pct || 0) > 0;
  const completedWorks = (fc.completedWorks || []).filter((w) => w.completed && w.reference.trim());
  const snagItems = (fc.snagItems || []).filter((s) => s.description.trim() || s.photoUrl);
  const completionPhotos = (fc.completionPhotos || []).filter((p) => p.photoUrl);
  const hasAnySnagPhoto = snagItems.some((s) => Boolean(s.photoUrl));

  const isMultipleQuotes =
    (c.quotationRef || '').includes(',') || (c.quotationRef || '').includes('&');
  const quoteNoLabel = isMultipleQuotes ? 'Quotation Nos.' : 'Quotation No.';
  const completionPhotoPages = chunkArray(completionPhotos, 6);
  const totalPages = 1 + completionPhotoPages.length;

  return (
    <div
      id="print-area"
      className="doc-suite-a4-root flex flex-col gap-6 bg-transparent"
      style={{ fontFamily: CANDARA_FONT, fontStyle: 'italic' }}
    >
      <A4PageSheet
        settings={settings}
        contractNo={c.contractNo}
        pageNumber={1}
        totalPages={totalPages}
        showClientSign
        isLastPage={completionPhotoPages.length === 0}
      >
        <h1
          style={{
            fontSize: '13pt',
            fontWeight: 700,
            fontStyle: 'normal',
            margin: '4px 0 12px 0',
            color: '#111111',
          }}
        >
          Finish Certificate
        </h1>

        <div style={{ fontSize: '9.4pt', lineHeight: 1.75, marginBottom: '10px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px' }}>
            <span>
              <strong>Finish Certificate No.:</strong> {fc.fcNo || 'FC-001'}
            </span>
            <span>
              <strong>Contract No.:</strong> {c.contractNo}
            </span>
            <span>
              <strong>Project No.:</strong> {dottedOrValue(c.projectCode, 65)}
            </span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px' }}>
            <span>
              <strong>Client:</strong> {dottedOrValue(fc.clientName || c.clientName, 125)}
            </span>
            <span>
              <strong>Site Address:</strong> {dottedOrValue(c.siteLocation, 170)}
            </span>
          </div>
          <div>
            <strong>Contractor:</strong> {settings.name || 'Touch of Wood Decoration Works LLC'}
          </div>
          <div>
            <strong>Installation Completion Date:</strong>{' '}
            {dottedOrValue(formatDisplayDate(fc.installationCompletionDate), 130)}
          </div>
          <div>
            <strong>Reference:</strong> Annex A — {quoteNoLabel}{' '}
            <strong>{c.quotationRef || 'QTN-2026-XXX'}</strong>; Contract Clause 7 (Final Acceptance)
          </div>
        </div>

        {/* Scope of Works Completed */}
        <div style={{ marginBottom: '10px' }}>
          <div style={{ fontWeight: 700, fontSize: '9.6pt', marginBottom: '4px' }}>
            Scope of Works Completed:
          </div>
          <p style={bodyPStyle}>
            The Contractor confirms that the following works described in Annex A under Contract No.{' '}
            <strong>{c.contractNo}</strong> have been completed on site:
          </p>
          <ul style={bulletUlStyle}>
            {completedWorks.length > 0 ? (
              completedWorks.map((w) => (
                <li key={w.id} style={bulletLiStyle}>
                  {w.reference}
                </li>
              ))
            ) : (
              <li style={bulletLiStyle}>All custom joinery and fit-out works per Annex A.</li>
            )}
          </ul>
        </div>

        {/* Outstanding Snag Items (with 1 Photo per Snag Item when uploaded) */}
        <div style={{ marginBottom: '10px' }}>
          <div style={{ fontWeight: 700, fontSize: '9.6pt', marginBottom: '5px' }}>
            Outstanding Snag Items (if any)
          </div>
          {snagItems.length === 0 ? (
            <ul style={bulletUlStyle}>
              <li style={bulletLiStyle}>
                <strong>&quot;None&quot;</strong>
              </li>
            </ul>
          ) : hasAnySnagPhoto ? (
            <table
              style={{
                width: '100%',
                borderCollapse: 'collapse',
                fontSize: '8.8pt',
                marginBottom: '6px',
              }}
            >
              <thead>
                <tr style={{ backgroundColor: HEADER_BEIGE, color: '#111111', fontStyle: 'normal' }}>
                  <th style={{ border: '1px solid #9ca3af', padding: '4px 6px', width: '6%', textAlign: 'center' }}>
                    #
                  </th>
                  <th style={{ border: '1px solid #9ca3af', padding: '4px 6px', textAlign: 'left' }}>
                    Snag Item Description
                  </th>
                  <th style={{ border: '1px solid #9ca3af', padding: '4px 6px', width: '16%', textAlign: 'center' }}>
                    Rectification By
                  </th>
                  <th style={{ border: '1px solid #9ca3af', padding: '4px 6px', width: '14%', textAlign: 'center' }}>
                    Responsible
                  </th>
                  <th style={{ border: '1px solid #9ca3af', padding: '4px 6px', width: '18%', textAlign: 'center' }}>
                    Snag Photo
                  </th>
                </tr>
              </thead>
              <tbody>
                {snagItems.map((snag, idx) => (
                  <tr key={snag.id}>
                    <td style={{ border: '1px solid #9ca3af', padding: '4px 6px', textAlign: 'center', fontWeight: 700 }}>
                      {idx + 1}
                    </td>
                    <td style={{ border: '1px solid #9ca3af', padding: '4px 6px' }}>{snag.description || '—'}</td>
                    <td style={{ border: '1px solid #9ca3af', padding: '4px 6px', textAlign: 'center' }}>
                      {formatDisplayDate(snag.rectificationBy) || '—'}
                    </td>
                    <td style={{ border: '1px solid #9ca3af', padding: '4px 6px', textAlign: 'center' }}>
                      {snag.responsible}
                    </td>
                    <td style={{ border: '1px solid #9ca3af', padding: '4px', textAlign: 'center' }}>
                      {snag.photoUrl ? (
                        <img
                          src={snag.photoUrl}
                          alt={snag.photoFileName || `Snag ${idx + 1}`}
                          style={{
                            width: '72px',
                            height: '50px',
                            objectFit: 'cover',
                            borderRadius: '2px',
                            border: '1px solid #9ca3af',
                            display: 'block',
                            margin: '0 auto',
                          }}
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <span style={{ color: '#6b7280', fontSize: '8pt' }}>—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <ul style={bulletUlStyle}>
              {snagItems.map((snag) => (
                <li key={snag.id} style={bulletLiStyle}>
                  Item: {snag.description} — Rectification by:{' '}
                  {formatDisplayDate(snag.rectificationBy) || 'TBD'} — Responsible: {snag.responsible}
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Statement of Acceptance */}
        <div style={{ marginBottom: '10px' }}>
          <div style={{ fontWeight: 700, fontSize: '9.6pt', marginBottom: '4px' }}>
            Statement of Acceptance:
          </div>
          <p style={bodyPStyle}>
            By signing below, the Client confirms that the works listed above have been inspected and are
            accepted as completed to their satisfaction on the Installation Completion Date stated above,
            except for the outstanding items listed (if any).{' '}
            {hasStage3
              ? 'Final payment becomes due upon issuance of this Finish Certificate'
              : hasStage2
                ? 'Any remaining final payment becomes due'
                : 'Any remaining approved Variation Order or incidental balances become due upon issuance of this Finish Certificate'}{' '}
            in accordance with <strong>Clause 4.1 and Clause 7.2</strong> of the Main Contract. Minor aesthetic
            snag items that do not prevent the safe, functional, and beneficial use of the joinery shall not
            entitle the Client to withhold{' '}
            {hasStage3
              ? 'the Stage 3 payment'
              : hasStage2
                ? 'the Stage 2 final payment'
                : 'any due final or Variation Order payment'}
            . The Contractor undertakes to complete recorded snag items within{' '}
            <strong>{formatNumberWord(t.snagRectificationDays)}</strong> working days of this Certificate,
            subject to reasonable site access provided by the Client.
          </p>
        </div>

        {/* Method of Acceptance Recorded */}
        <div style={{ marginBottom: '12px' }}>
          <div style={{ fontWeight: 700, fontSize: '9.5pt', marginBottom: '4px' }}>
            Method of Acceptance Recorded (Select one and provide evidence)
          </div>
          <ul style={bulletUlStyle}>
            <li style={bulletLiStyle}>
              {fc.acceptanceMethod === 'signed_emailed' ? '☑ ' : '☐ '}
              Signed printed certificate scanned and emailed:{' '}
              {fc.acceptanceMethod === 'signed_emailed'
                ? dottedOrValue(
                    [formatDisplayDate(fc.acceptanceDate), fc.acceptanceEvidence].filter(Boolean).join(' — '),
                    140
                  )
                : dottedOrValue('', 140)}
            </li>
            <li style={bulletLiStyle}>
              {fc.acceptanceMethod === 'email' ? '☑ ' : '☐ '}
              Email confirmation received on:{' '}
              {fc.acceptanceMethod === 'email'
                ? dottedOrValue(
                    [formatDisplayDate(fc.acceptanceDate), fc.acceptanceEvidence].filter(Boolean).join(' — '),
                    140
                  )
                : dottedOrValue('', 140)}
            </li>
            <li style={bulletLiStyle}>
              {fc.acceptanceMethod === 'whatsapp' ? '☑ ' : '☐ '}
              WhatsApp confirmation received on:{' '}
              {fc.acceptanceMethod === 'whatsapp'
                ? dottedOrValue(
                    [formatDisplayDate(fc.acceptanceDate), fc.acceptanceEvidence].filter(Boolean).join(' — '),
                    140
                  )
                : dottedOrValue('', 140)}
            </li>
          </ul>
        </div>

        {/* Signatures */}
        <div>
          <div style={{ fontWeight: 700, fontSize: '9.6pt', marginBottom: '8px' }}>Signatures</div>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '32px',
              fontSize: '9.3pt',
            }}
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ fontWeight: 700 }}>Client:</div>
              <div>Name: {dottedOrValue(fc.clientName || c.clientName, 140)}</div>
              <div>Date: {dottedOrValue(formatDisplayDate(fc.clientDate), 140)}</div>
              <div style={{ marginTop: '10px' }}>Signature: {dottedOrValue('', 130)}</div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ fontWeight: 700 }}>
                Contractor ({settings.name || 'Touch of Wood Decoration Works LLC'})
              </div>
              <div>Name: {dottedOrValue(fc.contractorName, 140)}</div>
              <div>Position: {dottedOrValue(fc.contractorPosition, 132)}</div>
              <div>Date: {dottedOrValue(formatDisplayDate(fc.contractorDate), 140)}</div>
              <div style={{ marginTop: '4px' }}>Signature: {dottedOrValue('', 130)}</div>
            </div>
          </div>
        </div>
      </A4PageSheet>

      {/* Page 2+: Completed Works Photo Documentation (when photos uploaded) */}
      {completionPhotoPages.map((photoBatch, pIdx) => (
        <PhotoGridPage
          key={pIdx}
          settings={settings}
          contractNo={c.contractNo}
          title={`Finish Certificate (${fc.fcNo}) — Completed Works Photo Record`}
          subtitle={`Project: ${suite.projectTitle} · Completion Date: ${formatDisplayDate(fc.installationCompletionDate) || '—'}`}
          photos={photoBatch}
          pageNumber={2 + pIdx}
          totalPages={totalPages}
          showClientSign
          isLastPage={pIdx === completionPhotoPages.length - 1}
        />
      ))}
    </div>
  );
};

// =====================================================================
// 5. PROJECT PROGRESSION REPORT (CONTRACTOR-ONLY, NO CLIENT SIGNING)
// =====================================================================
export const PrintProjectProgressionDocument: React.FC<{
  suite: ProjectDocumentSuite;
  report: ProjectProgressionDocument;
  settings: CompanySettings;
}> = ({ suite, report, settings }) => {
  const c = suite.contract;
  const rows: ProjectProgressionRow[] = report.rows || [];
  const overallPct = calculateProgressionOverallPct(rows);
  const galleryPhotos = (report.progressPhotos || []).filter((p) => p.photoUrl);

  const rowPages: ProjectProgressionRow[][] =
    rows.length <= 6 ? [rows] : [rows.slice(0, 6), ...chunkArray(rows.slice(6), 8)];
  const galleryPages = chunkArray(galleryPhotos, 6);
  const totalPages = rowPages.length + galleryPages.length;

  const getPctBarColor = (pct: number) => {
    if (pct >= 100) return '#15803d';
    if (pct >= 70) return '#0369a1';
    if (pct >= 35) return '#b45309';
    return '#64748b';
  };

  const renderProgressTable = (pageRows: ProjectProgressionRow[], startIdx: number) => (
    <table
      style={{
        width: '100%',
        borderCollapse: 'collapse',
        marginTop: '6px',
        marginBottom: '12px',
        fontFamily: CANDARA_FONT,
        fontSize: '8.5pt',
      }}
    >
      <thead>
        <tr style={{ backgroundColor: DARK_BROWN, color: '#ffffff', fontStyle: 'normal' }}>
          <th style={{ border: `1px solid ${DARK_BROWN}`, padding: '5px', width: '9%', textAlign: 'center', fontWeight: 700 }}>
            JY Code
          </th>
          <th style={{ border: `1px solid ${DARK_BROWN}`, padding: '5px', width: '13%', textAlign: 'left', fontWeight: 700 }}>
            Room / Area
          </th>
          <th style={{ border: `1px solid ${DARK_BROWN}`, padding: '5px', width: '14%', textAlign: 'left', fontWeight: 700 }}>
            Component
          </th>
          <th style={{ border: `1px solid ${DARK_BROWN}`, padding: '5px', width: '14%', textAlign: 'center', fontWeight: 700 }}>
            Current Stage
          </th>
          <th style={{ border: `1px solid ${DARK_BROWN}`, padding: '5px', width: '12%', textAlign: 'center', fontWeight: 700 }}>
            Progress %
          </th>
          <th style={{ border: `1px solid ${DARK_BROWN}`, padding: '5px', width: '12%', textAlign: 'center', fontWeight: 700 }}>
            Start / Target
          </th>
          <th style={{ border: `1px solid ${DARK_BROWN}`, padding: '5px', width: '14%', textAlign: 'center', fontWeight: 700 }}>
            Photo
          </th>
          <th style={{ border: `1px solid ${DARK_BROWN}`, padding: '5px', width: '12%', textAlign: 'left', fontWeight: 700 }}>
            Remarks
          </th>
        </tr>
      </thead>
      <tbody>
        {pageRows.length === 0 ? (
          <tr>
            <td colSpan={8} style={{ border: '1px solid #d6cfc7', padding: '12px', textAlign: 'center', color: '#6b7280' }}>
              No joinery items listed yet.
            </td>
          </tr>
        ) : (
          pageRows.map((row, idx) => {
            const pct = Math.min(100, Math.max(0, Number(row.progressPct) || 0));
            const shaded = (startIdx + idx) % 2 === 1;
            return (
              <tr key={row.id || idx} style={{ backgroundColor: shaded ? '#f8f5f0' : '#ffffff' }}>
                <td style={{ border: '1px solid #cbd5e1', padding: '5px', textAlign: 'center', fontWeight: 700, verticalAlign: 'top' }}>
                  {row.jyCode || '—'}
                </td>
                <td style={{ border: '1px solid #cbd5e1', padding: '5px', verticalAlign: 'top' }}>
                  {row.roomArea || '—'}
                </td>
                <td style={{ border: '1px solid #cbd5e1', padding: '5px', verticalAlign: 'top' }}>
                  {row.component || '—'}
                </td>
                <td style={{ border: '1px solid #cbd5e1', padding: '5px', textAlign: 'center', fontWeight: 600, verticalAlign: 'top' }}>
                  {row.stage}
                </td>
                <td style={{ border: '1px solid #cbd5e1', padding: '5px', textAlign: 'center', verticalAlign: 'top' }}>
                  <div style={{ fontWeight: 700, marginBottom: '3px', color: getPctBarColor(pct) }}>{pct}%</div>
                  <div
                    style={{
                      width: '100%',
                      height: '6px',
                      backgroundColor: '#e5e7eb',
                      borderRadius: '3px',
                      overflow: 'hidden',
                    }}
                  >
                    <div
                      style={{
                        width: `${pct}%`,
                        height: '100%',
                        backgroundColor: getPctBarColor(pct),
                      }}
                    />
                  </div>
                </td>
                <td style={{ border: '1px solid #cbd5e1', padding: '5px', textAlign: 'center', fontSize: '7.8pt', verticalAlign: 'top' }}>
                  <div>{formatDisplayDate(row.startDate) || '—'}</div>
                  <div style={{ color: '#6b7280' }}>{formatDisplayDate(row.targetDate) || '—'}</div>
                </td>
                <td style={{ border: '1px solid #cbd5e1', padding: '4px', textAlign: 'center', verticalAlign: 'top' }}>
                  {row.photoUrl ? (
                    <img
                      src={row.photoUrl}
                      alt={row.photoFileName || row.jyCode}
                      style={{
                        width: '70px',
                        height: '50px',
                        objectFit: 'cover',
                        borderRadius: '2px',
                        border: '1px solid #9ca3af',
                        display: 'block',
                        margin: '0 auto',
                      }}
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <span style={{ color: '#9ca3af', fontSize: '8pt' }}>—</span>
                  )}
                </td>
                <td style={{ border: '1px solid #cbd5e1', padding: '5px', verticalAlign: 'top', fontSize: '8pt' }}>
                  {row.remarks || '—'}
                </td>
              </tr>
            );
          })
        )}
      </tbody>
    </table>
  );

  let rowOffset = 0;

  return (
    <div
      id="print-area"
      className="doc-suite-a4-root flex flex-col gap-6 bg-transparent"
      style={{ fontFamily: CANDARA_FONT, fontStyle: 'italic' }}
    >
      {rowPages.map((pageRows, pageIdx) => {
        const currentOffset = rowOffset;
        rowOffset += pageRows.length;
        const isLastRowPage = pageIdx === rowPages.length - 1;
        const isFinalOverallPage = isLastRowPage && galleryPages.length === 0;

        return (
          <A4PageSheet
            key={pageIdx}
            settings={settings}
            contractNo={c.contractNo}
            pageNumber={pageIdx + 1}
            totalPages={totalPages}
            showClientSign={false}
            isLastPage={isFinalOverallPage}
          >
            {pageIdx === 0 ? (
              <>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'baseline',
                    justifyContent: 'space-between',
                    borderBottom: '1px solid #d6cfc7',
                    paddingBottom: '6px',
                    marginBottom: '10px',
                  }}
                >
                  <div>
                    <h1
                      style={{
                        fontSize: '13.5pt',
                        fontWeight: 700,
                        fontStyle: 'normal',
                        margin: 0,
                        color: '#111111',
                      }}
                    >
                      Project Progression Report
                    </h1>
                    <div style={{ fontSize: '9pt', color: '#57534e', marginTop: '2px' }}>
                      Production &amp; Site Installation Status Update — {report.reportPeriod || report.reportNo}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right', fontSize: '9pt' }}>
                    <div>
                      <strong>Report No.:</strong> {report.reportNo}
                    </div>
                    <div>
                      <strong>Report Date:</strong> {formatDisplayDate(report.reportDate) || '—'}
                    </div>
                  </div>
                </div>

                {/* Project & Milestone Schedule Box */}
                <table
                  style={{
                    width: '100%',
                    borderCollapse: 'collapse',
                    marginBottom: '10px',
                    fontSize: '9pt',
                  }}
                >
                  <tbody>
                    <tr style={{ backgroundColor: CREAM_BG }}>
                      <td style={{ border: '1px solid #d6cfc7', padding: '5px 8px', width: '50%' }}>
                        <strong>Project:</strong> {suite.projectTitle}
                      </td>
                      <td style={{ border: '1px solid #d6cfc7', padding: '5px 8px', width: '25%' }}>
                        <strong>Project Code:</strong> {c.projectCode || '—'}
                      </td>
                      <td style={{ border: '1px solid #d6cfc7', padding: '5px 8px', width: '25%' }}>
                        <strong>Status:</strong> {report.overallStatus}
                      </td>
                    </tr>
                    <tr>
                      <td style={{ border: '1px solid #d6cfc7', padding: '5px 8px' }}>
                        <strong>Site Location:</strong> {c.siteLocation || '—'}
                      </td>
                      <td colSpan={2} style={{ border: '1px solid #d6cfc7', padding: '5px 8px' }}>
                        <strong>Contract No.:</strong> {c.contractNo} &nbsp;|&nbsp;{' '}
                        <strong>
                          {(c.quotationRef || '').includes(',') || (c.quotationRef || '').includes('&')
                            ? 'Quotation Refs.:'
                            : 'Quotation Ref.:'}
                        </strong>{' '}
                        {c.quotationRef || '—'}
                      </td>
                    </tr>
                  </tbody>
                </table>

                {/* 4-Metric Timeline & Overall Completion Strip */}
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr 1fr 1.2fr',
                    gap: '8px',
                    marginBottom: '10px',
                  }}
                >
                  <div style={{ border: '1px solid #d6cfc7', padding: '6px 8px', backgroundColor: '#faf8f5' }}>
                    <div style={{ fontSize: '7.6pt', color: '#57534e', fontWeight: 700, textTransform: 'uppercase' }}>
                      Production Start Date
                    </div>
                    <div style={{ fontSize: '10pt', fontWeight: 700, marginTop: '2px' }}>
                      {formatDisplayDate(report.productionStartDate) || 'TBD'}
                    </div>
                  </div>
                  <div style={{ border: '1px solid #d6cfc7', padding: '6px 8px', backgroundColor: '#faf8f5' }}>
                    <div style={{ fontSize: '7.6pt', color: '#57534e', fontWeight: 700, textTransform: 'uppercase' }}>
                      Site Installation Start
                    </div>
                    <div style={{ fontSize: '10pt', fontWeight: 700, marginTop: '2px' }}>
                      {formatDisplayDate(report.siteInstallationStartDate) || 'TBD'}
                    </div>
                  </div>
                  <div style={{ border: '1px solid #d6cfc7', padding: '6px 8px', backgroundColor: '#faf8f5' }}>
                    <div style={{ fontSize: '7.6pt', color: '#57534e', fontWeight: 700, textTransform: 'uppercase' }}>
                      Target Completion
                    </div>
                    <div style={{ fontSize: '10pt', fontWeight: 700, marginTop: '2px' }}>
                      {formatDisplayDate(report.targetCompletionDate) || 'TBD'}
                    </div>
                  </div>
                  <div style={{ border: `1px solid ${BRAND_BROWN}`, padding: '6px 8px', backgroundColor: CREAM_BG }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '7.8pt', fontWeight: 700 }}>
                      <span style={{ color: DARK_BROWN, textTransform: 'uppercase' }}>Overall Progress</span>
                      <span style={{ color: getPctBarColor(overallPct), fontSize: '10pt' }}>{overallPct}%</span>
                    </div>
                    <div
                      style={{
                        width: '100%',
                        height: '7px',
                        backgroundColor: '#e2e8f0',
                        borderRadius: '3px',
                        overflow: 'hidden',
                        marginTop: '5px',
                      }}
                    >
                      <div
                        style={{
                          width: `${overallPct}%`,
                          height: '100%',
                          backgroundColor: getPctBarColor(overallPct),
                        }}
                      />
                    </div>
                  </div>
                </div>

                {report.executiveSummary && (
                  <p style={{ ...bodyPStyle, marginBottom: '8px' }}>
                    <strong>Progress Summary:</strong> {report.executiveSummary}
                  </p>
                )}

                <div style={{ fontWeight: 700, fontSize: '9.5pt', marginBottom: '2px' }}>
                  Joinery Breakdown &amp; JY Progress Schedule:
                </div>
              </>
            ) : (
              <div style={{ fontWeight: 700, fontSize: '10pt', marginBottom: '6px' }}>
                Project Progression Report ({report.reportNo}) — Joinery Progress Continued
              </div>
            )}

            {renderProgressTable(pageRows, currentOffset)}

            {/* Contractor Prepared-By Block ONLY (No Client Signature Section) */}
            {isLastRowPage && (
              <div
                style={{
                  marginTop: '14px',
                  paddingTop: '10px',
                  borderTop: '1px solid #d6cfc7',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-end',
                  fontSize: '9.2pt',
                }}
              >
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <div style={{ fontWeight: 700, color: DARK_BROWN }}>
                    Issued By: {settings.name || 'Touch of Wood Decoration Works LLC'}
                  </div>
                  <div>
                    Prepared By: <strong>{report.preparedByName || settings.authorizedSignatoryName || '—'}</strong>
                    {report.preparedByPosition ? ` (${report.preparedByPosition})` : ''}
                  </div>
                  <div>Date Issued: {formatDisplayDate(report.preparedDate || report.reportDate) || '—'}</div>
                </div>
                <div style={{ textAlign: 'right', minWidth: '180px' }}>
                  <div style={{ marginBottom: '28px', fontSize: '8.8pt', color: '#4b5563' }}>
                    Contractor Signature / Stamp
                  </div>
                  <div style={{ borderBottom: '1px dotted #4b5563', width: '180px', marginLeft: 'auto' }} />
                </div>
              </div>
            )}
          </A4PageSheet>
        );
      })}

      {/* Optional Progress Photo Gallery Pages (No Client Sign in Footer) */}
      {galleryPages.map((photoBatch, pIdx) => (
        <PhotoGridPage
          key={pIdx}
          settings={settings}
          contractNo={c.contractNo}
          title={`Project Progression (${report.reportNo}) — Production & Site Photo Updates`}
          subtitle={`Project: ${suite.projectTitle} · Report Date: ${formatDisplayDate(report.reportDate) || '—'} · Overall Progress: ${overallPct}%`}
          photos={photoBatch}
          pageNumber={rowPages.length + 1 + pIdx}
          totalPages={totalPages}
          showClientSign={false}
          isLastPage={pIdx === galleryPages.length - 1}
        />
      ))}
    </div>
  );
};
