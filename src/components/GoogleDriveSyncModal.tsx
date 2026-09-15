import React, { useState, useEffect } from 'react';
import { Product } from '../types';
import {
  googleSignIn,
  initAuth,
  logoutGoogle,
  getCachedAccessToken,
  searchDriveFolders,
  searchSpreadsheets,
  getSpreadsheetDetails,
  fetchSheetValues,
  parseSheetToProducts,
  DriveFolder,
  DriveSpreadsheet,
  SheetTab,
  ColumnMapping,
} from '../utils/googleDriveService';
import { formatMoney } from '../utils/formatters';
import {
  Folder,
  FileSpreadsheet,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  X,
  ChevronRight,
  ShieldCheck,
  Sparkles,
  LogOut,
  SlidersHorizontal,
} from 'lucide-react';
import { User } from 'firebase/auth';

interface GoogleDriveSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportProducts: (products: Product[], mode: 'replace' | 'merge') => void;
  currentProductCount: number;
}

export const GoogleDriveSyncModal: React.FC<GoogleDriveSyncModalProps> = ({
  isOpen,
  onClose,
  onImportProducts,
}) => {
  const [step, setStep] = useState<'auth' | 'select-file' | 'select-tab' | 'preview'>('auth');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Authentication State
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);

  // Navigation State
  const [folders, setFolders] = useState<DriveFolder[]>([]);
  const [spreadsheets, setSpreadsheets] = useState<DriveSpreadsheet[]>([]);
  const [selectedSheetFile, setSelectedSheetFile] = useState<DriveSpreadsheet | null>(null);

  // Sheet Tabs
  const [tabs, setTabs] = useState<SheetTab[]>([]);
  const [selectedTab, setSelectedTab] = useState<string>('');

  // Extracted Data
  const [rawRows, setRawRows] = useState<string[][]>([]);
  const [sheetHeaders, setSheetHeaders] = useState<string[]>([]);
  const [columnMapping, setColumnMapping] = useState<ColumnMapping>({
    codeCol: 0,
    descCol: 1,
    priceCol: 8,
    unitCol: 7,
    catCol: 9,
    notesCol: -1,
  });
  const [showMappingConfig, setShowMappingConfig] = useState(false);
  const [parsedProducts, setParsedProducts] = useState<Product[]>([]);
  const [importMode, setImportMode] = useState<'replace' | 'merge'>('merge');

  // Manual Sheet ID fallback
  const [manualSheetId, setManualSheetId] = useState('');

  useEffect(() => {
    if (isOpen) {
      const activeToken = getCachedAccessToken();
      if (activeToken) {
        setToken(activeToken);
        setStep('select-file');
        loadDriveFiles(activeToken);
      } else {
        setStep('auth');
      }
      setError(null);

      const unsubscribe = initAuth(
        (user, token) => {
          setCurrentUser(user);
          setToken(token);
        },
        () => {
          setCurrentUser(null);
          setToken(null);
        }
      );

      return () => unsubscribe();
    }
  }, [isOpen]);

  const handleConnectGoogle = async () => {
    setLoading(true);
    setError(null);
    try {
      const authRes = await googleSignIn();
      if (authRes && authRes.accessToken) {
        setCurrentUser(authRes.user);
        setToken(authRes.accessToken);
        setStep('select-file');
        await loadDriveFiles(authRes.accessToken);
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Google sign-in popup was closed or encountered an error.');
    } finally {
      setLoading(false);
    }
  };

  const loadDriveFiles = async (accessToken: string) => {
    setLoading(true);
    setError(null);
    try {
      // 1. Search for folder called "library"
      const foundFolders = await searchDriveFolders(accessToken, 'library');
      setFolders(foundFolders);

      // 2. Search for spreadsheets inside the folder if found
      const targetFolder = foundFolders[0] || null;
      const foundSheets = await searchSpreadsheets(accessToken, targetFolder ? targetFolder.id : undefined);

      if (foundSheets.length === 0 && targetFolder) {
        // If specific folder didn't have spreadsheets, search all sheets across Drive
        const allSheets = await searchSpreadsheets(accessToken);
        setSpreadsheets(allSheets);
      } else {
        setSpreadsheets(foundSheets);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to list files from Google Drive. Please verify Drive permissions.');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectSpreadsheet = async (sheet: DriveSpreadsheet) => {
    if (!token) return;
    setSelectedSheetFile(sheet);
    setLoading(true);
    setError(null);
    try {
      const meta = await getSpreadsheetDetails(token, sheet.id);
      setTabs(meta.sheets);
      if (meta.sheets.length > 0) {
        const firstTab = meta.sheets[0].title;
        setSelectedTab(firstTab);
        await loadSheetData(sheet.id, firstTab);
      } else {
        setStep('select-tab');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to read spreadsheet tabs.');
    } finally {
      setLoading(false);
    }
  };

  const handleManualSheetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !manualSheetId.trim()) return;

    let cleanId = manualSheetId.trim();
    const match = cleanId.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
    if (match && match[1]) {
      cleanId = match[1];
    }

    setSelectedSheetFile({ id: cleanId, name: 'Custom Google Sheet' });
    setLoading(true);
    setError(null);
    try {
      const meta = await getSpreadsheetDetails(token, cleanId);
      setTabs(meta.sheets);
      if (meta.sheets.length > 0) {
        const firstTab = meta.sheets[0].title;
        setSelectedTab(firstTab);
        await loadSheetData(cleanId, firstTab);
      } else {
        setStep('select-tab');
      }
    } catch (err: any) {
      setError(`Cannot access sheet (${cleanId}): ` + (err.message || 'Please check permissions.'));
    } finally {
      setLoading(false);
    }
  };

  const loadSheetData = async (sheetId: string, tabName: string) => {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const rows = await fetchSheetValues(token, sheetId, tabName);
      if (rows.length === 0) {
        throw new Error('This spreadsheet tab contains no data rows.');
      }
      setRawRows(rows);
      const parsed = parseSheetToProducts(rows);
      if (parsed.products.length === 0) {
        throw new Error('Could not parse any product rows from this sheet.');
      }
      setSheetHeaders(parsed.headers);
      setColumnMapping(parsed.matchedColumns);
      setParsedProducts(parsed.products);
      setStep('preview');
    } catch (err: any) {
      setError(err.message || 'Failed to fetch rows from selected tab.');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateColumnMapping = (field: keyof ColumnMapping, colIdx: number) => {
    const updated = { ...columnMapping, [field]: colIdx };
    setColumnMapping(updated);
    if (rawRows.length > 0) {
      const parsed = parseSheetToProducts(rawRows, updated);
      setParsedProducts(parsed.products);
    }
  };

  const handleTabChange = async (tabName: string) => {
    setSelectedTab(tabName);
    if (selectedSheetFile) {
      await loadSheetData(selectedSheetFile.id, tabName);
    }
  };

  const handleFinishImport = () => {
    if (parsedProducts.length === 0) return;
    onImportProducts(parsedProducts, importMode);
    onClose();
  };

  const handleDisconnect = async () => {
    await logoutGoogle();
    setCurrentUser(null);
    setToken(null);
    setStep('auth');
    setFolders([]);
    setSpreadsheets([]);
    setSelectedSheetFile(null);
    setParsedProducts([]);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-3xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50/80 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                Sync Product Library with Google Drive
                <span className="text-[10px] font-bold px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-full">
                  Live Drive Sync
                </span>
              </h3>
              <p className="text-xs text-slate-500">
                Directly import items, specifications, and rates from your Google Drive &apos;library&apos; folder
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {currentUser && (
              <div className="flex items-center gap-2 mr-2">
                {currentUser.photoURL && (
                  <img
                    src={currentUser.photoURL}
                    alt={currentUser.displayName || ''}
                    className="w-6 h-6 rounded-full border border-slate-200"
                  />
                )}
                <span className="text-xs text-slate-600 font-medium hidden sm:inline">
                  {currentUser.email}
                </span>
                <button
                  type="button"
                  onClick={handleDisconnect}
                  className="inline-flex items-center gap-1 text-xs text-slate-400 hover:text-red-600 px-2 py-1 rounded transition-colors"
                  title="Sign out of Google"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Content */}
        <div className="p-6 overflow-y-auto flex-1 space-y-5">
          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3 text-xs text-red-700">
              <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
              <div className="flex-1">
                <span className="font-bold">Notice: </span>
                {error}
              </div>
            </div>
          )}

          {/* STEP 1: AUTHENTICATION */}
          {step === 'auth' && (
            <div className="text-center py-8 px-4 space-y-6 max-w-md mx-auto">
              <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mx-auto shadow-inner">
                <FileSpreadsheet className="w-8 h-8" />
              </div>

              <div className="space-y-2">
                <h4 className="text-base font-bold text-slate-900">
                  Connect your Google Account
                </h4>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Sign in with Google to allow this quotation app to read the spreadsheets inside your Google Drive <span className="font-bold text-slate-800">&quot;library&quot;</span> folder.
                </p>
              </div>

              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/80 text-left space-y-2">
                <div className="flex items-center gap-2 text-xs font-semibold text-slate-700">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  Read-Only Secure Connection
                </div>
                <p className="text-[11px] text-slate-500 leading-normal">
                  Your spreadsheets are read directly in your browser. We never modify, overwrite, or delete your Drive files.
                </p>
              </div>

              <button
                type="button"
                disabled={loading}
                onClick={handleConnectGoogle}
                className="w-full inline-flex items-center justify-center gap-3 px-5 py-3 text-xs font-bold text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 rounded-xl shadow-xs transition-all cursor-pointer"
              >
                {loading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin text-blue-600" />
                    Connecting with Google...
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" viewBox="0 0 48 48">
                      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
                      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
                      <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
                      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
                    </svg>
                    <span>Sign in with Google</span>
                  </>
                )}
              </button>
            </div>
          )}

          {/* STEP 2: SELECT FILE */}
          {step === 'select-file' && (
            <div className="space-y-5">
              {/* Folder Detection Banner */}
              {folders.length > 0 ? (
                <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3.5 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <Folder className="w-4 h-4 text-emerald-700 shrink-0" />
                    <span className="text-xs font-semibold text-emerald-900">
                      Found Google Drive Folder: <span className="font-bold">&quot;{folders[0].name}&quot;</span>
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => loadDriveFiles(token!)}
                    className="p-1 text-emerald-700 hover:text-emerald-900 hover:bg-emerald-100 rounded transition-colors"
                    title="Refresh folder items"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                  </button>
                </div>
              ) : (
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 flex items-center justify-between text-xs text-slate-600">
                  <div className="flex items-center gap-2">
                    <Folder className="w-4 h-4 text-slate-400" />
                    Scanning for &quot;library&quot; folder or all spreadsheets...
                  </div>
                  <button
                    type="button"
                    onClick={() => loadDriveFiles(token!)}
                    className="text-blue-600 hover:underline font-medium text-[11px]"
                  >
                    Re-scan
                  </button>
                </div>
              )}

              {/* Spreadsheets List */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-700">
                  Select your Product Catalog Spreadsheet:
                </label>

                {loading ? (
                  <div className="p-8 text-center text-slate-400 space-y-2">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto text-blue-600" />
                    <p className="text-xs">Fetching spreadsheets from Google Drive...</p>
                  </div>
                ) : spreadsheets.length === 0 ? (
                  <div className="p-6 text-center border-2 border-dashed border-slate-200 rounded-xl space-y-3">
                    <FileSpreadsheet className="w-8 h-8 text-slate-300 mx-auto" />
                    <p className="text-xs text-slate-600 font-medium">
                      No Google Sheets found inside your &quot;library&quot; folder.
                    </p>
                    <p className="text-[11px] text-slate-400">
                      You can paste your Google Sheet link or Sheet ID below directly.
                    </p>
                  </div>
                ) : (
                  <div className="border border-slate-200 rounded-xl divide-y divide-slate-100 max-h-56 overflow-y-auto">
                    {spreadsheets.map((sheet) => (
                      <button
                        key={sheet.id}
                        type="button"
                        onClick={() => handleSelectSpreadsheet(sheet)}
                        className="w-full p-3.5 flex items-center justify-between text-left hover:bg-blue-50/60 transition-colors group cursor-pointer"
                      >
                        <div className="flex items-center gap-3">
                          <FileSpreadsheet className="w-4 h-4 text-emerald-600 group-hover:scale-110 transition-transform" />
                          <div>
                            <div className="text-xs font-bold text-slate-900">{sheet.name}</div>
                            <div className="text-[10px] text-slate-400 font-mono">ID: {sheet.id}</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5 text-xs font-bold text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity">
                          Select &amp; Load <ChevronRight className="w-4 h-4" />
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Paste Direct Link / ID Fallback */}
              <div className="pt-2 border-t border-slate-100">
                <form onSubmit={handleManualSheetSubmit} className="space-y-2">
                  <span className="text-[11px] font-semibold text-slate-500 block">
                    Or paste Google Sheet Link / ID directly:
                  </span>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={manualSheetId}
                      onChange={(e) => setManualSheetId(e.target.value)}
                      placeholder="https://docs.google.com/spreadsheets/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/edit"
                      className="flex-1 px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 font-mono"
                    />
                    <button
                      type="submit"
                      disabled={!manualSheetId.trim() || loading}
                      className="px-4 py-2 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 disabled:opacity-40 rounded-lg transition-colors cursor-pointer"
                    >
                      Load Sheet
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* STEP 3 & 4: SELECT TAB & PREVIEW */}
          {(step === 'select-tab' || step === 'preview') && (
            <div className="space-y-5">
              {/* Sheet & Tab bar */}
              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                  <span className="text-xs font-bold text-slate-900">
                    {selectedSheetFile?.name}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-slate-500 font-semibold">Sheet Tab:</span>
                  <select
                    value={selectedTab}
                    onChange={(e) => handleTabChange(e.target.value)}
                    className="px-2.5 py-1 text-xs font-semibold bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  >
                    {tabs.map((t) => (
                      <option key={t.sheetId || t.title} value={t.title}>
                        {t.title}
                      </option>
                    ))}
                  </select>

                  <button
                    type="button"
                    onClick={() => setStep('select-file')}
                    className="text-[11px] font-semibold text-blue-600 hover:underline ml-2 cursor-pointer"
                  >
                    Change File
                  </button>
                </div>
              </div>

              {/* Data Preview */}
              {loading ? (
                <div className="p-8 text-center text-slate-400 space-y-2">
                  <RefreshCw className="w-6 h-6 animate-spin mx-auto text-blue-600" />
                  <p className="text-xs">Reading spreadsheet and calculating item rates...</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Top Action & Mode Bar */}
                  <div className="p-3.5 bg-emerald-50/80 border border-emerald-200 rounded-xl flex flex-wrap items-center justify-between gap-3 shadow-xs">
                    <div className="flex items-center gap-2.5">
                      <div className="p-1.5 bg-emerald-600 text-white rounded-lg">
                        <Sparkles className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-slate-900">
                          {parsedProducts.length} Items Ready to Import
                        </div>
                        <div className="text-[11px] text-slate-500">
                          Review preview below and select import method
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      {/* Import Mode: Replace vs Merge */}
                      <div className="flex items-center gap-3 bg-white px-3 py-1.5 rounded-lg border border-slate-200 text-xs">
                        <label className="flex items-center gap-1.5 cursor-pointer">
                          <input
                            type="radio"
                            name="importModeTop"
                            value="merge"
                            checked={importMode === 'merge'}
                            onChange={() => setImportMode('merge')}
                            className="text-blue-600"
                          />
                          <span className="text-slate-700 font-semibold text-xs">Merge</span>
                        </label>
                        <span className="text-slate-200">|</span>
                        <label className="flex items-center gap-1.5 cursor-pointer">
                          <input
                            type="radio"
                            name="importModeTop"
                            value="replace"
                            checked={importMode === 'replace'}
                            onChange={() => setImportMode('replace')}
                            className="text-blue-600"
                          />
                          <span className="text-slate-700 font-semibold text-xs">Replace</span>
                        </label>
                      </div>

                      <button
                        type="button"
                        id="btn-top-import-products"
                        disabled={parsedProducts.length === 0 || loading}
                        onClick={handleFinishImport}
                        className="inline-flex items-center gap-2 px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 rounded-lg shadow-sm transition-all cursor-pointer hover:shadow"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        Import to Library
                      </button>
                    </div>
                  </div>

                  {/* Column Mapping & Detection Info Bar */}
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                          Detected Sheet Columns:
                        </span>
                        <div className="flex flex-wrap gap-1.5 text-[10px]">
                          <span className="px-2 py-0.5 bg-blue-50 text-blue-800 border border-blue-200 rounded font-semibold">
                            Code: {sheetHeaders[columnMapping.codeCol] || `Col ${columnMapping.codeCol + 1}`} (Text)
                          </span>
                          <span className="px-2 py-0.5 bg-blue-50 text-blue-800 border border-blue-200 rounded font-semibold">
                            Desc: {sheetHeaders[columnMapping.descCol] || `Col ${columnMapping.descCol + 1}`} (Text)
                          </span>
                          <span className="px-2 py-0.5 bg-amber-50 text-amber-800 border border-amber-200 rounded font-semibold">
                            Unit: {sheetHeaders[columnMapping.unitCol] || `Col ${columnMapping.unitCol + 1}`} (Text)
                          </span>
                          <span className="px-2 py-0.5 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded font-bold">
                            Unit Cost: {sheetHeaders[columnMapping.priceCol] || `Col ${columnMapping.priceCol + 1}`} (Number)
                          </span>
                          <span className="px-2 py-0.5 bg-purple-50 text-purple-800 border border-purple-200 rounded font-semibold">
                            Category: {sheetHeaders[columnMapping.catCol] || `Col ${columnMapping.catCol + 1}`} (Text)
                          </span>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => setShowMappingConfig(!showMappingConfig)}
                        className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-600 hover:text-blue-800 cursor-pointer"
                      >
                        <SlidersHorizontal className="w-3.5 h-3.5" />
                        {showMappingConfig ? 'Hide Settings' : 'Adjust Columns'}
                      </button>
                    </div>

                    {/* Collapsible Column Adjustment Dropdowns */}
                    {showMappingConfig && (
                      <div className="pt-3 border-t border-slate-200 grid grid-cols-2 sm:grid-cols-5 gap-2.5">
                        <div>
                          <label className="block text-[10px] font-bold text-slate-600 mb-1">
                            Item Code (Text)
                          </label>
                          <select
                            value={columnMapping.codeCol}
                            onChange={(e) => handleUpdateColumnMapping('codeCol', Number(e.target.value))}
                            className="w-full px-2 py-1 text-xs bg-white border border-slate-200 rounded font-medium"
                          >
                            {sheetHeaders.map((h, idx) => (
                              <option key={idx} value={idx}>
                                {String.fromCharCode(65 + idx)}: {h}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="block text-[10px] font-bold text-slate-600 mb-1">
                            Description (Text)
                          </label>
                          <select
                            value={columnMapping.descCol}
                            onChange={(e) => handleUpdateColumnMapping('descCol', Number(e.target.value))}
                            className="w-full px-2 py-1 text-xs bg-white border border-slate-200 rounded font-medium"
                          >
                            {sheetHeaders.map((h, idx) => (
                              <option key={idx} value={idx}>
                                {String.fromCharCode(65 + idx)}: {h}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="block text-[10px] font-bold text-slate-600 mb-1">
                            Unit (Text)
                          </label>
                          <select
                            value={columnMapping.unitCol}
                            onChange={(e) => handleUpdateColumnMapping('unitCol', Number(e.target.value))}
                            className="w-full px-2 py-1 text-xs bg-white border border-slate-200 rounded font-medium"
                          >
                            {sheetHeaders.map((h, idx) => (
                              <option key={idx} value={idx}>
                                {String.fromCharCode(65 + idx)}: {h}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="block text-[10px] font-bold text-emerald-800 mb-1">
                            Unit Cost (Number)
                          </label>
                          <select
                            value={columnMapping.priceCol}
                            onChange={(e) => handleUpdateColumnMapping('priceCol', Number(e.target.value))}
                            className="w-full px-2 py-1 text-xs bg-white border border-emerald-300 rounded font-bold text-emerald-900"
                          >
                            {sheetHeaders.map((h, idx) => (
                              <option key={idx} value={idx}>
                                {String.fromCharCode(65 + idx)}: {h}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="block text-[10px] font-bold text-slate-600 mb-1">
                            Category (Text)
                          </label>
                          <select
                            value={columnMapping.catCol}
                            onChange={(e) => handleUpdateColumnMapping('catCol', Number(e.target.value))}
                            className="w-full px-2 py-1 text-xs bg-white border border-slate-200 rounded font-medium"
                          >
                            {sheetHeaders.map((h, idx) => (
                              <option key={idx} value={idx}>
                                {String.fromCharCode(65 + idx)}: {h}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Preview Table */}
                  <div className="border border-slate-200 rounded-xl overflow-hidden max-h-60 overflow-y-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead className="sticky top-0 bg-slate-100 font-bold text-slate-600 border-b border-slate-200 text-[11px] uppercase tracking-wider">
                        <tr>
                          <th className="py-2 px-3 w-28">Item Code (Text)</th>
                          <th className="py-2 px-3">Description (Text)</th>
                          <th className="py-2 px-3 w-28">Category (Text)</th>
                          <th className="py-2 px-3 w-20">Unit (Text)</th>
                          <th className="py-2 px-3 text-right w-32 text-emerald-800 font-black">
                            Unit Cost (Number)
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {parsedProducts.slice(0, 50).map((p, idx) => (
                          <tr key={idx} className="hover:bg-slate-50">
                            <td className="py-2 px-3 font-mono font-bold text-slate-800">{p.code}</td>
                            <td className="py-2 px-3 font-semibold text-slate-900">{p.desc}</td>
                            <td className="py-2 px-3 text-slate-500">
                              <span className="px-1.5 py-0.5 bg-slate-100 rounded text-[10px] font-medium">
                                {p.category}
                              </span>
                            </td>
                            <td className="py-2 px-3 text-slate-600 font-medium">{p.unit}</td>
                            <td className="py-2 px-3 text-right font-mono font-bold text-emerald-900 bg-emerald-50/30">
                              {Number(p.price).toFixed(3)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {parsedProducts.length > 50 && (
                    <p className="text-[11px] text-slate-400 text-right">
                      Showing first 50 of {parsedProducts.length} items. All {parsedProducts.length} items will be imported.
                    </p>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-200 bg-slate-50/90 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-800 rounded-lg hover:bg-slate-200/60 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            {parsedProducts.length > 0 && (
              <span className="text-xs text-slate-500 font-medium">
                {parsedProducts.length} items ready to import ({importMode === 'merge' ? 'Merge mode' : 'Replace mode'})
              </span>
            )}
          </div>

          {(step === 'preview' || parsedProducts.length > 0) && (
            <button
              type="button"
              id="btn-confirm-import-products"
              disabled={parsedProducts.length === 0 || loading}
              onClick={handleFinishImport}
              className="inline-flex items-center gap-2 px-6 py-2.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 rounded-xl shadow-md transition-all cursor-pointer hover:shadow-lg active:scale-98"
            >
              <CheckCircle2 className="w-4 h-4" />
              Import {parsedProducts.length} Products to Library
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
