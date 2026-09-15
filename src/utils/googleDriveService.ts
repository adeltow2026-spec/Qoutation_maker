import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  signInWithPopup,
  GoogleAuthProvider,
  onAuthStateChanged,
  User,
  signOut,
} from 'firebase/auth';
import firebaseConfig from '../../firebase-applet-config.json';
import { Product } from '../types';

export const SCOPES = [
  'https://www.googleapis.com/auth/drive.readonly',
  'https://www.googleapis.com/auth/spreadsheets.readonly',
];

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
export const auth = getAuth(app);

const provider = new GoogleAuthProvider();
SCOPES.forEach((scope) => provider.addScope(scope));

let isSigningIn = false;
let cachedAccessToken: string | null = null;

export const initAuth = (
  onAuthSuccess?: (user: User, token: string) => void,
  onAuthFailure?: () => void
) => {
  return onAuthStateChanged(auth, async (user: User | null) => {
    if (user) {
      if (cachedAccessToken) {
        if (onAuthSuccess) onAuthSuccess(user, cachedAccessToken);
      } else if (!isSigningIn) {
        cachedAccessToken = null;
        if (onAuthFailure) onAuthFailure();
      }
    } else {
      cachedAccessToken = null;
      if (onAuthFailure) onAuthFailure();
    }
  });
};

export const googleSignIn = async (): Promise<{ user: User; accessToken: string } | null> => {
  try {
    isSigningIn = true;
    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (!credential?.accessToken) {
      throw new Error('Failed to obtain Google access token from authentication.');
    }

    cachedAccessToken = credential.accessToken;
    return { user: result.user, accessToken: cachedAccessToken };
  } catch (error: any) {
    console.error('Google Sign In Error:', error);
    throw error;
  } finally {
    isSigningIn = false;
  }
};

export const getCachedAccessToken = (): string | null => {
  return cachedAccessToken;
};

export const logoutGoogle = async () => {
  await signOut(auth);
  cachedAccessToken = null;
};

export interface DriveFolder {
  id: string;
  name: string;
}

export interface DriveSpreadsheet {
  id: string;
  name: string;
  modifiedTime?: string;
}

export interface SheetTab {
  sheetId: number;
  title: string;
}

/**
 * Searches for folders in Google Drive by name (e.g., 'library')
 */
export async function searchDriveFolders(token: string, folderName = 'library'): Promise<DriveFolder[]> {
  const query = encodeURIComponent(`mimeType = 'application/vnd.google-apps.folder' and name contains '${folderName}' and trashed = false`);
  const url = `https://www.googleapis.com/drive/v3/files?q=${query}&fields=files(id,name)&pageSize=20`;

  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Drive API error (${res.status}): ${errorText}`);
  }

  const data = await res.json();
  return data.files || [];
}

/**
 * Searches for Google Sheets (spreadsheets) inside a specific folder or across drive
 */
export async function searchSpreadsheets(token: string, folderId?: string): Promise<DriveSpreadsheet[]> {
  let queryParts = ["mimeType = 'application/vnd.google-apps.spreadsheet'", 'trashed = false'];
  if (folderId) {
    queryParts.push(`'${folderId}' in parents`);
  }
  const query = encodeURIComponent(queryParts.join(' and '));
  const url = `https://www.googleapis.com/drive/v3/files?q=${query}&fields=files(id,name,modifiedTime)&pageSize=30&orderBy=modifiedTime desc`;

  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Drive API error (${res.status}): ${errorText}`);
  }

  const data = await res.json();
  return data.files || [];
}

/**
 * Fetches sheet metadata (tabs/sheets) for a spreadsheet ID
 */
export async function getSpreadsheetDetails(token: string, spreadsheetId: string): Promise<{ title: string; sheets: SheetTab[] }> {
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}?fields=properties.title,sheets.properties(sheetId,title)`;

  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Sheets API error (${res.status}): ${errorText}`);
  }

  const data = await res.json();
  const title = data.properties?.title || 'Spreadsheet';
  const sheets: SheetTab[] = (data.sheets || []).map((s: any) => ({
    sheetId: s.properties?.sheetId,
    title: s.properties?.title || 'Sheet1',
  }));

  return { title, sheets };
}

/**
 * Reads values from a spreadsheet tab
 */
export async function fetchSheetValues(token: string, spreadsheetId: string, sheetTitle: string): Promise<string[][]> {
  // Fetch full sheet tab without arbitrary limits
  const range = encodeURIComponent(`'${sheetTitle}'`);
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${range}`;

  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Sheets API error (${res.status}): ${errorText}`);
  }

  const data = await res.json();
  return data.values || [];
}

export interface ColumnMapping {
  codeCol: number;
  descCol: number;
  priceCol: number;
  unitCol: number;
  catCol: number;
  notesCol: number;
}

/**
 * Auto-detects column indices from headers
 */
export function detectColumns(headers: string[]): ColumnMapping {
  const normalizedHeaders = headers.map((h) => (h || '').toString().toLowerCase().trim());

  let codeCol = normalizedHeaders.findIndex((h) =>
    h === 'item code' || h.includes('item code') || h === 'code' || h.includes('sku') || h.includes('item no') || h.includes('ref')
  );
  let descCol = normalizedHeaders.findIndex((h) =>
    h === 'description' || h.includes('desc') || h === 'item name' || h.includes('product') || h.includes('title') || h === 'item'
  );
  let priceCol = normalizedHeaders.findIndex((h) =>
    h === 'unit cost' || h === 'cost' || h.includes('cost') || h === 'unit price' || h.includes('price') || h.includes('rate') || h.includes('amount')
  );
  let unitCol = normalizedHeaders.findIndex((h) =>
    h === 'unit' || h.includes('unit') || h === 'uom' || h.includes('meas')
  );
  let catCol = normalizedHeaders.findIndex((h) =>
    h === 'category' || h.includes('cat') || h.includes('group') || h.includes('type') || h.includes('section')
  );
  let notesCol = normalizedHeaders.findIndex((h) =>
    h === 'notes' || h.includes('note') || h.includes('spec') || h.includes('remark') || h.includes('detail')
  );

  // Fallbacks if not explicitly found
  if (codeCol === -1 && headers.length > 0) codeCol = 0;
  if (descCol === -1 && headers.length > 1) descCol = 1;
  if (priceCol === -1 && headers.length > 2) priceCol = headers.length - 1;

  return { codeCol, descCol, priceCol, unitCol, catCol, notesCol };
}

/**
 * Parses raw 2D sheet data into Product objects with custom or auto-detected column mappings
 */
export function parseSheetToProducts(
  rows: string[][],
  customMapping?: Partial<ColumnMapping>
): {
  products: Product[];
  headers: string[];
  matchedColumns: ColumnMapping;
  headerRowIndex: number;
} {
  if (!rows || rows.length === 0) {
    return {
      products: [],
      headers: [],
      matchedColumns: { codeCol: -1, descCol: -1, priceCol: -1, unitCol: -1, catCol: -1, notesCol: -1 },
      headerRowIndex: 0,
    };
  }

  // Look for header row in the first 5 rows
  let headerRowIndex = 0;
  for (let i = 0; i < Math.min(5, rows.length); i++) {
    const rowStr = rows[i].join(' ').toLowerCase();
    if (
      rowStr.includes('item code') ||
      rowStr.includes('description') ||
      rowStr.includes('unit cost') ||
      rowStr.includes('unit') ||
      rowStr.includes('category') ||
      rowStr.includes('price') ||
      rowStr.includes('rate')
    ) {
      headerRowIndex = i;
      break;
    }
  }

  const rawHeaders = rows[headerRowIndex] || [];
  // Standardize headers array
  const headers = rawHeaders.map((h, idx) => (h && h.trim().length > 0 ? h.trim() : `Column ${String.fromCharCode(65 + idx)}`));

  const autoMapping = detectColumns(headers);
  const matchedColumns: ColumnMapping = {
    ...autoMapping,
    ...customMapping,
  };

  const { codeCol, descCol, priceCol, unitCol, catCol, notesCol } = matchedColumns;
  const products: Product[] = [];

  for (let r = headerRowIndex + 1; r < rows.length; r++) {
    const row = rows[r];
    if (!row || row.length === 0) continue;

    const desc = descCol >= 0 && row[descCol] ? String(row[descCol]).trim() : '';
    const code = codeCol >= 0 && row[codeCol] ? String(row[codeCol]).trim() : '';
    
    // Skip purely empty rows
    if (!desc && !code && (!row[0] || !row[1])) continue;

    // Parse numeric Unit Cost / Price (handles 6.500, 10.000, 17.825, 41.000, 50.000, commas, currency strings)
    const rawPrice = priceCol >= 0 ? String(row[priceCol] || '') : '0';
    const cleanPrice = parseFloat(rawPrice.replace(/[^0-9.-]+/g, '')) || 0;
    const unit = unitCol >= 0 && row[unitCol] ? String(row[unitCol]).trim() : 'Sheet';
    const category = catCol >= 0 && row[catCol] ? String(row[catCol]).trim() : 'MDF';
    const notes = notesCol >= 0 && row[notesCol] ? String(row[notesCol]).trim() : '';

    products.push({
      id: 'p_gdrive_' + Math.random().toString(36).substring(2, 9) + '_' + r,
      code: code || `PM ${r}`,
      desc: desc || `Item ${r}`,
      unit: unit || 'Sheet',
      price: cleanPrice,
      tax: 5,
      category: category || 'General',
      notes: notes,
    });
  }

  return {
    products,
    headers,
    matchedColumns,
    headerRowIndex,
  };
}
