import { CategoryRowItem, ScopeCategory, ScopeItem } from '../types';

export function uid(): string {
  return 'id_' + Math.random().toString(36).substring(2, 9) + Date.now().toString(36);
}

export function formatMoney(amount: number | string | undefined | null, decimals: number = 2): string {
  const num = Number(amount) || 0;
  return num.toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

export function generateQuoteNumber(seq: number, year: number = new Date().getFullYear()): string {
  return `QT-${year}-${String(seq).padStart(5, '0')}`;
}

export function createBlankRow(desc = '', qty = 1, cost = 0, unit = 'pcs'): CategoryRowItem {
  return {
    id: uid(),
    desc,
    qty,
    cost,
    unit,
  };
}

export function createBlankCategory(name = 'Materials'): ScopeCategory {
  return {
    id: uid(),
    name,
    rows: [createBlankRow('', 1, 0, 'pcs')],
  };
}

export function createBlankScope(name = 'Scope Item 1', description = ''): ScopeItem {
  return {
    id: uid(),
    name,
    description,
    qty: 1,
    unit: 'Lot',
    clientPrice: null,
    photoUrl: '',
    photoCaption: '',
    categories: [
      createBlankCategory('Materials'),
      createBlankCategory('Labor & Installation'),
    ],
  };
}

export function calculateCategoryTotal(cat: ScopeCategory): number {
  return cat.rows.reduce((sum, row) => {
    const q = Math.max(0, Number(row.qty) || 0);
    const c = Math.max(0, Number(row.cost) || 0);
    return sum + q * c;
  }, 0);
}

export function calculateScopeDirectCost(scope: ScopeItem): number {
  return scope.categories.reduce((sum, cat) => sum + calculateCategoryTotal(cat), 0);
}

export function calculateScopeOverhead(scope: ScopeItem, overheadPct = 30): number {
  const direct = calculateScopeDirectCost(scope);
  return direct * (overheadPct / 100);
}

export function calculateScopeProductionCost(scope: ScopeItem, overheadPct = 30): number {
  const direct = calculateScopeDirectCost(scope);
  const overhead = calculateScopeOverhead(scope, overheadPct);
  return direct + overhead;
}

export function calculateScopeSuggestedPrice(scope: ScopeItem, overheadPct = 30, markupPct = 40): number {
  const prodCost = calculateScopeProductionCost(scope, overheadPct);
  return prodCost * (1 + markupPct / 100);
}

export function getScopeFinalUnitPrice(scope: ScopeItem, overheadPct = 30, markupPct = 40): number {
  if (scope.clientPrice !== null && scope.clientPrice !== undefined && !isNaN(Number(scope.clientPrice))) {
    return Math.max(0, Number(scope.clientPrice));
  }
  return calculateScopeSuggestedPrice(scope, overheadPct, markupPct);
}

export function calculateScopeLineTotal(scope: ScopeItem, overheadPct = 30, markupPct = 40): number {
  const unitPrice = getScopeFinalUnitPrice(scope, overheadPct, markupPct);
  const qty = Math.max(0, Number(scope.qty) || 0);
  return unitPrice * qty;
}

export function calculateQuotationTotals(scopes: ScopeItem[], vatPct = 5, overheadPct = 30, markupPct = 40) {
  const subtotal = scopes.reduce((sum, sc) => sum + calculateScopeLineTotal(sc, overheadPct, markupPct), 0);
  const validVatPct = Math.max(0, Number(vatPct) || 0);
  const vatAmount = subtotal * (validVatPct / 100);
  const grandTotal = subtotal + vatAmount;
  return {
    subtotal,
    vatPct: validVatPct,
    vatAmount,
    grandTotal,
  };
}

export const CATEGORY_THEMES = [
  { name: 'Blue', bg: 'bg-blue-50/80', border: 'border-blue-200', text: 'text-blue-900', badge: 'bg-blue-100 text-blue-800' },
  { name: 'Amber', bg: 'bg-amber-50/80', border: 'border-amber-200', text: 'text-amber-900', badge: 'bg-amber-100 text-amber-800' },
  { name: 'Emerald', bg: 'bg-emerald-50/80', border: 'border-emerald-200', text: 'text-emerald-900', badge: 'bg-emerald-100 text-emerald-800' },
  { name: 'Purple', bg: 'bg-purple-50/80', border: 'border-purple-200', text: 'text-purple-900', badge: 'bg-purple-100 text-purple-800' },
  { name: 'Rose', bg: 'bg-rose-50/80', border: 'border-rose-200', text: 'text-rose-900', badge: 'bg-rose-100 text-rose-800' },
  { name: 'Cyan', bg: 'bg-cyan-50/80', border: 'border-cyan-200', text: 'text-cyan-900', badge: 'bg-cyan-100 text-cyan-800' },
];

export function numberToWords(amount: number, currency: string = 'AED'): string {
  const num = Math.round(amount * 100) / 100;
  if (isNaN(num) || num <= 0) return '';

  const units = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
    'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  function convertSection(n: number): string {
    if (n === 0) return '';
    if (n < 20) return units[n];
    if (n < 100) return tens[Math.floor(n / 10)] + (n % 10 !== 0 ? ' ' + units[n % 10] : '');
    return units[Math.floor(n / 100)] + ' Hundred' + (n % 100 !== 0 ? ' ' + convertSection(n % 100) : '');
  }

  const integerPart = Math.floor(num);
  const decimalPart = Math.round((num - integerPart) * 100);

  if (integerPart === 0 && decimalPart === 0) return 'Zero';

  let result = '';
  const billions = Math.floor(integerPart / 1000000000);
  const millions = Math.floor((integerPart % 1000000000) / 1000000);
  const thousands = Math.floor((integerPart % 1000000) / 1000);
  const remainder = integerPart % 1000;

  if (billions > 0) result += convertSection(billions) + ' Billion ';
  if (millions > 0) result += convertSection(millions) + ' Million ';
  if (thousands > 0) result += convertSection(thousands) + ' Thousand ';
  if (remainder > 0) result += convertSection(remainder) + ' ';

  const currencyNames: Record<string, { main: string; sub: string }> = {
    AED: { main: 'UAE Dirhams', sub: 'Fils' },
    USD: { main: 'US Dollars', sub: 'Cents' },
    EUR: { main: 'Euros', sub: 'Cents' },
    GBP: { main: 'Pounds Sterling', sub: 'Pence' },
    SAR: { main: 'Saudi Riyals', sub: 'Halalas' },
    QAR: { main: 'Qatari Riyals', sub: 'Dirhams' },
  };

  const curr = currencyNames[currency.toUpperCase()] || { main: currency, sub: 'Cents' };
  let formatted = `${curr.main} ${result.trim()}`;

  if (decimalPart > 0) {
    formatted += ` and ${convertSection(decimalPart)} ${curr.sub}`;
  }

  return formatted + ' Only';
}

