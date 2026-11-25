import React, { useState, useEffect } from 'react';
import {
  AppDatabase,
  Quotation,
  Customer,
  Product,
  CompanySettings,
  UserProfile,
  PrintAuditLog,
  ProjectDocumentSuite,
} from './types';
import {
  loadDatabase,
  saveDatabase,
  fetchServerDatabase,
  saveServerDatabase,
  exportDatabaseBackup,
  sanitizeCompletionTerms,
  sanitizeCompanyPhone,
} from './utils/storage';
import {
  generateQuoteNumber,
  createBlankScope,
  calculateQuotationTotals,
} from './utils/formatters';
import {
  createDocumentSuiteFromQuotation,
  canEditLockedContractTerms,
  getLinkedQuotationIds,
} from './utils/documentSuite';
import { Sidebar, PageId } from './components/Sidebar';
import { Header } from './components/Header';
import { ToastContainer, ToastMessage } from './components/Toast';
import { CustomerModal } from './components/CustomerModal';
import { ProductModal } from './components/ProductModal';
import { UserModal } from './components/UserModal';
import { LoginScreen } from './components/LoginScreen';
import { GoogleDriveSyncModal } from './components/GoogleDriveSyncModal';
import { PrintPreviewModal } from './components/PrintPreviewModal';
import {
  DocumentSuitePrintModal,
  PrintableSuiteTarget,
} from './components/DocumentSuitePrintModal';
import { ConfirmModal } from './components/ConfirmModal';
import { DashboardView } from './views/DashboardView';
import { QuotationEditorView } from './views/QuotationEditorView';
import { QuotationsListView } from './views/QuotationsListView';
import { DocumentSuiteView } from './views/DocumentSuiteView';
import { CustomersView } from './views/CustomersView';
import { ProductsView } from './views/ProductsView';
import { ReportsView } from './views/ReportsView';
import { SettingsView } from './views/SettingsView';
import { INITIAL_DATABASE } from './data/seedData';

export default function App() {
  const [db, setDb] = useState<AppDatabase>(() => loadDatabase());
  const [currentPage, setCurrentPage] = useState<PageId>('new');
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return window.innerWidth >= 1024;
    }
    return true;
  });

  // Modals state
  const [customerModalOpen, setCustomerModalOpen] = useState(false);
  const [customerToEdit, setCustomerToEdit] = useState<Customer | null>(null);

  const [productModalOpen, setProductModalOpen] = useState(false);
  const [productToEdit, setProductToEdit] = useState<Product | null>(null);

  const [driveModalOpen, setDriveModalOpen] = useState(false);
  const [userModalOpen, setUserModalOpen] = useState(false);

  // In-app non-blocking confirmation dialog state (replaces iframe-blocked native confirm)
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    confirmText?: string;
    confirmVariant?: 'danger' | 'primary' | 'warning';
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
  });

  // User Authentication state
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    try {
      return Boolean(localStorage.getItem('quotepro_authenticated_user_id'));
    } catch {
      return true;
    }
  });

  // Active user profile
  const currentUser: UserProfile =
    db.users?.find((u) => u.id === db.currentUserId) ||
    db.users?.[0] || {
      id: 'usr_adel',
      name: 'Adel',
      role: 'Managing Estimator',
      email: 'adel.tow.2026@gmail.com',
      avatarInitials: 'AD',
      password: 'Adel@2026',
      isAdmin: true,
    };

  const handleLoginSuccess = (user: UserProfile) => {
    try {
      localStorage.setItem('quotepro_authenticated_user_id', user.id);
    } catch {}
    setDb((prev) => ({ ...prev, currentUserId: user.id }));
    setIsAuthenticated(true);
    addToast('success', 'Authentication Successful', `Welcome, ${user.name}`);
  };

  const handleLogout = () => {
    try {
      localStorage.removeItem('quotepro_authenticated_user_id');
    } catch {}
    setIsAuthenticated(false);
    addToast('info', 'Logged Out', 'You have been signed out safely.');
  };

  const handleRecordPrintLog = (log: PrintAuditLog) => {
    setDb((prev) => ({
      ...prev,
      printLogs: [log, ...(prev.printLogs || [])],
    }));
  };

  const handleSelectUser = (userId: string) => {
    setDb((prev) => ({ ...prev, currentUserId: userId }));
    const target = db.users?.find((u) => u.id === userId);
    addToast('info', 'Active Estimator Switched', target ? `Switched to ${target.name}` : undefined);
  };

  const handleSaveUser = (user: UserProfile) => {
    setDb((prev) => {
      const usersList = prev.users || [];
      const idx = usersList.findIndex((u) => u.id === user.id);
      let nextUsers = [...usersList];
      if (idx >= 0) {
        nextUsers[idx] = user;
      } else {
        nextUsers.push(user);
      }
      return { ...prev, users: nextUsers };
    });
    addToast('success', 'User Profile Saved', user.name);
  };

  const handleDeleteUser = (userId: string) => {
    if ((db.users || []).length <= 1) {
      addToast('warning', 'Action Blocked', 'At least one estimator user profile must remain in the system.');
      return;
    }
    const userToDelete = (db.users || []).find((u) => u.id === userId);
    setConfirmModal({
      isOpen: true,
      title: 'Remove Team Member?',
      message: `Remove "${userToDelete?.name || 'this member'}" from the estimators list?`,
      confirmText: 'Remove Member',
      confirmVariant: 'danger',
      onConfirm: () => {
        setDb((prev) => {
          const remaining = (prev.users || []).filter((u) => u.id !== userId);
          const nextActiveId = prev.currentUserId === userId ? remaining[0].id : prev.currentUserId;
          return { ...prev, users: remaining, currentUserId: nextActiveId };
        });
        addToast('info', 'Estimator Removed', userToDelete?.name);
      },
    });
  };

  // Active quotation in editor
  const createNewEmptyQuote = (): Quotation => {
    const today = new Date().toISOString().split('T')[0];
    const nextMonth = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split('T')[0];
    const firstCust = db.customers[0];
    const quoteNo = generateQuoteNumber(db.nextQuote, new Date().getFullYear(), db.settings.quotePrefix || 'QT');
    const initialScopes = [
      createBlankScope(
        '1. Custom Wood Joinery & Wall Cladding Package',
        'Supply, fabrication, and installation of custom veneer wall panelling in approved Walnut/Oak finish, matching architectural submittal drawings, acoustic backing, and concealed sub-frame fixings.'
      ),
      createBlankScope(
        '2. Decorative Reception Counter & Feature Joinery',
        'Supply and installation of bespoke reception counter with solid wood edging, approved laminate sheet finish, internal storage shelving, and cable management ports.'
      ),
    ];
    const initialTotals = calculateQuotationTotals(
      initialScopes,
      db.settings.tax,
      db.settings.overheadPct,
      db.settings.markupPct
    );

    return {
      id: 'q_' + Math.random().toString(36).substring(2, 9) + Date.now().toString(36),
      quoteNo,
      customerId: firstCust ? firstCust.id : 1,
      customerName: firstCust ? firstCust.name : '',
      project: 'Interior Joinery & Fit-out Package',
      address: firstCust ? firstCust.address : '',
      date: today,
      validUntil: nextMonth,
      salesPerson: currentUser?.name || 'Adel',
      currency: db.settings.currency || 'AED',
      notes: db.settings.defaultNotes || '',
      paymentTerms:
        db.settings.paymentTerms ||
        '1. 60% Advance Payment along with signed quotation & order confirmation\n2. 30% Upon completion of factory joinery fabrication & progressive painting\n3. 10% Prior to final site delivery and handover',
      completionTerms:
        db.settings.completionTerms ||
        'The timeline will be explained in the contract.',
      terms: db.settings.defaultTerms || '',
      scopes: initialScopes,
      subtotal: initialTotals.subtotal,
      vatPct: initialTotals.vatPct,
      vatAmount: initialTotals.vatAmount,
      total: initialTotals.grandTotal,
      status: 'Draft',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  };

  const [activeQuotation, setActiveQuotation] = useState<Quotation>(() => {
    return db.draft || createNewEmptyQuote();
  });

  // Print view state
  const [printingQuote, setPrintingQuote] = useState<Quotation | null>(null);

  // Document Suite state
  const [initialActiveSuiteId, setInitialActiveSuiteId] = useState<string | null>(null);
  const [printingSuite, setPrintingSuite] = useState<{
    suite: ProjectDocumentSuite;
    target: PrintableSuiteTarget;
  } | null>(null);

  // Auto-sync with central server across all devices
  const isServerInitialized = React.useRef(false);
  const isRemoteSyncRef = React.useRef(false);

  useEffect(() => {
    let isMounted = true;

    const syncFromServer = async () => {
      const serverDb = await fetchServerDatabase();
      if (!isMounted) return;

      if (serverDb && serverDb.settings) {
        setDb((prevLocal) => {
          // Keep current logged-in user session stable on this device
          const currentLocalUserId = prevLocal.currentUserId;

          // Merge quotes: combine quotes from server and local state so staff quotes on other devices are never lost
          const serverQuotes = Array.isArray(serverDb.quotes) ? serverDb.quotes : [];
          const localQuotes = Array.isArray(prevLocal.quotes) ? prevLocal.quotes : [];
          const quoteMap = new Map<string, Quotation>();

          // Insert server quotes
          serverQuotes.forEach((q) => quoteMap.set(q.id, q));

          // Merge local quotes if newer or not yet synchronized to server
          localQuotes.forEach((lq) => {
            const sq = quoteMap.get(lq.id);
            if (!sq) {
              quoteMap.set(lq.id, lq);
            } else {
              const lqTime = new Date(lq.updatedAt || 0).getTime();
              const sqTime = new Date(sq.updatedAt || 0).getTime();
              if (lqTime > sqTime) {
                quoteMap.set(lq.id, lq);
              }
            }
          });

          // Sort descending by date/creation
          const mergedQuotes = Array.from(quoteMap.values()).sort((a, b) => {
            const tA = new Date(a.updatedAt || a.createdAt || 0).getTime();
            const tB = new Date(b.updatedAt || b.createdAt || 0).getTime();
            return tB - tA;
          });

          // Merge document suites across devices by id & updatedAt
          const serverSuites = Array.isArray(serverDb.documentSuites) ? serverDb.documentSuites : [];
          const localSuites = Array.isArray(prevLocal.documentSuites) ? prevLocal.documentSuites : [];
          const suiteMap = new Map<string, ProjectDocumentSuite>();
          serverSuites.forEach((s) => suiteMap.set(s.id, s));
          localSuites.forEach((ls) => {
            const ss = suiteMap.get(ls.id);
            if (!ss) {
              suiteMap.set(ls.id, ls);
            } else {
              const lsTime = new Date(ls.updatedAt || 0).getTime();
              const ssTime = new Date(ss.updatedAt || 0).getTime();
              if (lsTime > ssTime) {
                suiteMap.set(ls.id, ls);
              }
            }
          });
          const mergedSuites = Array.from(suiteMap.values()).sort((a, b) => {
            const tA = new Date(a.updatedAt || a.createdAt || 0).getTime();
            const tB = new Date(b.updatedAt || b.createdAt || 0).getTime();
            return tB - tA;
          });

          // Check if server data actually has any differences before returning a new state object
          if (isServerInitialized.current) {
            const sameQuotes =
              mergedQuotes.length === (prevLocal.quotes?.length || 0) &&
              (mergedQuotes[0]?.id === prevLocal.quotes?.[0]?.id) &&
              (mergedQuotes[0]?.updatedAt === prevLocal.quotes?.[0]?.updatedAt);
            const sameSuites =
              mergedSuites.length === (prevLocal.documentSuites?.length || 0) &&
              (mergedSuites[0]?.id === prevLocal.documentSuites?.[0]?.id) &&
              (mergedSuites[0]?.updatedAt === prevLocal.documentSuites?.[0]?.updatedAt);
            const sameUsers =
              (serverDb.users?.length || 0) === (prevLocal.users?.length || 0);
            const sameLibrary =
              (serverDb.library?.length || 0) === (prevLocal.library?.length || 0);

            if (sameQuotes && sameSuites && sameUsers && sameLibrary) {
              return prevLocal; // No changes! Keep same object reference so React does not trigger child re-renders!
            }
          }

          const updatedDb = {
            ...serverDb,
            settings: {
              ...serverDb.settings,
              phone: sanitizeCompanyPhone(serverDb.settings.phone),
              completionTerms: sanitizeCompletionTerms(serverDb.settings.completionTerms),
            },
            quotes: mergedQuotes.map((q) => ({
              ...q,
              completionTerms: sanitizeCompletionTerms(q.completionTerms),
            })),
            documentSuites: mergedSuites,
            nextContract: Math.max(serverDb.nextContract || 1, prevLocal.nextContract || 1),
            currentUserId: currentLocalUserId || serverDb.currentUserId,
          };

          isRemoteSyncRef.current = true;
          saveDatabase(updatedDb);
          isServerInitialized.current = true;
          return updatedDb;
        });
      } else if (!serverDb && !isServerInitialized.current) {
        // If server is not initialized yet, seed it with the current database
        saveServerDatabase(db);
        isServerInitialized.current = true;
      }
    };

    // 1. Initial sync
    syncFromServer();

    // 2. Periodic sync every 5 seconds so quotes from other devices appear in real-time
    const interval = setInterval(syncFromServer, 5000);

    // 3. Tab focus sync
    const handleFocus = () => {
      syncFromServer();
    };
    window.addEventListener('focus', handleFocus);

    return () => {
      isMounted = false;
      clearInterval(interval);
      window.removeEventListener('focus', handleFocus);
    };
  }, []);

  // Save changes to local storage & central server
  useEffect(() => {
    saveDatabase(db);
    if (isRemoteSyncRef.current) {
      isRemoteSyncRef.current = false;
      return;
    }
    saveServerDatabase(db);
  }, [db]);

  const addToast = (type: ToastMessage['type'], title: string, message?: string) => {
    const newToast: ToastMessage = {
      id: 'toast_' + Math.random().toString(36).substring(2, 9),
      type,
      title,
      message,
    };
    setToasts((prev) => [...prev, newToast]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== newToast.id));
    }, 3200);
  };

  const dismissToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Quotation Editor Actions
  const handleSaveQuotation = (quoteToSave: Quotation) => {
    setDb((prev) => {
      const quotes = prev.quotes || [];
      const existingIndex = quotes.findIndex((q) => q.id === quoteToSave.id);
      let updatedQuotes = [...quotes];

      if (existingIndex >= 0) {
        updatedQuotes[existingIndex] = quoteToSave;
      } else {
        updatedQuotes.unshift(quoteToSave);
      }

      const nextDb = {
        ...prev,
        quotes: updatedQuotes,
        draft: null, // Clear active draft once finalized
        nextQuote: existingIndex >= 0 ? prev.nextQuote : prev.nextQuote + 1,
      };

      saveDatabase(nextDb);
      saveServerDatabase(nextDb); // Instant push to server so Admin immediately receives it

      return nextDb;
    });

    addToast(
      'success',
      'Quotation Saved Successfully',
      `${quoteToSave.quoteNo} is synchronized and stored in your quotations directory.`
    );
  };

  const handleSaveDraft = (quoteDraft: Quotation) => {
    setDb((prev) => ({
      ...prev,
      draft: quoteDraft,
    }));
    addToast('info', 'Draft Saved', 'Your progress is stored in local storage.');
  };

  const handleResetQuotation = () => {
    setConfirmModal({
      isOpen: true,
      title: 'Start New Quotation?',
      message: 'Any unsaved edits to the active quotation will be discarded.',
      confirmText: 'Start New',
      confirmVariant: 'warning',
      onConfirm: () => {
        const newQ = createNewEmptyQuote();
        setActiveQuotation(newQ);
        setDb((prev) => ({ ...prev, draft: null }));
        addToast('info', 'New Quotation Initialized');
      },
    });
  };

  const handleOpenQuoteInEditor = (quote: Quotation) => {
    setActiveQuotation(quote);
    setCurrentPage('new');
    addToast('info', 'Quotation Loaded', `Editing ${quote.quoteNo}`);
  };

  const handleDuplicateQuote = (quote: Quotation) => {
    const duplicated: Quotation = {
      ...quote,
      id: 'q_' + Math.random().toString(36).substring(2, 9) + Date.now().toString(36),
      quoteNo: generateQuoteNumber(db.nextQuote, new Date().getFullYear(), db.settings.quotePrefix || 'QT'),
      date: new Date().toISOString().split('T')[0],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setActiveQuotation(duplicated);
    setDb((prev) => ({
      ...prev,
      nextQuote: prev.nextQuote + 1,
    }));
    setCurrentPage('new');
    addToast('success', 'Quotation Duplicated', `Created new draft ${duplicated.quoteNo}`);
  };

  const handleDeleteQuote = (id: string) => {
    const target = db.quotes.find((q) => q.id === id);
    setConfirmModal({
      isOpen: true,
      title: 'Delete Quotation?',
      message: `Are you sure you want to delete ${target?.quoteNo || 'this quotation'}? This action cannot be undone.`,
      confirmText: 'Delete Quotation',
      confirmVariant: 'danger',
      onConfirm: () => {
        setDb((prev) => ({
          ...prev,
          quotes: prev.quotes.filter((q) => q.id !== id),
        }));
        addToast('info', 'Quotation Deleted', target?.quoteNo);
      },
    });
  };

  // Customer Management
  const handleSaveCustomer = (customerData: Omit<Customer, 'id'>, editId?: number) => {
    if (editId) {
      setDb((prev) => ({
        ...prev,
        customers: prev.customers.map((c) => (c.id === editId ? { ...customerData, id: editId } : c)),
      }));
      addToast('success', 'Customer Updated', customerData.name);
    } else {
      const newId = db.nextCustomer;
      setDb((prev) => ({
        ...prev,
        customers: [...prev.customers, { ...customerData, id: newId }],
        nextCustomer: prev.nextCustomer + 1,
      }));
      addToast('success', 'Customer Added', customerData.name);
    }
  };

  const handleDeleteCustomer = (id: number) => {
    if (db.customers.length <= 1) {
      addToast('warning', 'Action Blocked', 'You must keep at least one customer in your directory.');
      return;
    }
    const cust = db.customers.find((c) => c.id === id);
    setConfirmModal({
      isOpen: true,
      title: 'Delete Customer?',
      message: `Remove "${cust?.name || 'this customer'}" from your directory?`,
      confirmText: 'Delete Customer',
      confirmVariant: 'danger',
      onConfirm: () => {
        setDb((prev) => ({
          ...prev,
          customers: prev.customers.filter((c) => c.id !== id),
        }));
        addToast('info', 'Customer Deleted', cust?.name);
      },
    });
  };

  // Product Library Management
  const handleSaveProduct = (productData: Omit<Product, 'id'>, editId?: string) => {
    if (editId) {
      setDb((prev) => ({
        ...prev,
        library: prev.library.map((p) => (p.id === editId ? { ...productData, id: editId } : p)),
      }));
      addToast('success', 'Product Updated in Library', productData.desc);
    } else {
      const newProduct: Product = {
        ...productData,
        id: 'p_' + Math.random().toString(36).substring(2, 9) + Date.now().toString(36),
      };
      setDb((prev) => ({
        ...prev,
        library: [...prev.library, newProduct],
      }));
      addToast('success', 'Product Added to Library', productData.desc);
    }
  };

  const handleDeleteProduct = (id: string) => {
    const prod = db.library.find((p) => p.id === id);
    setConfirmModal({
      isOpen: true,
      title: 'Delete Product?',
      message: `Remove "${prod?.desc || 'this item'}" from your product library?`,
      confirmText: 'Delete Product',
      confirmVariant: 'danger',
      onConfirm: () => {
        setDb((prev) => ({
          ...prev,
          library: prev.library.filter((p) => p.id !== id),
        }));
        addToast('info', 'Product Removed from Library', prod?.desc);
      },
    });
  };

  const handleImportGoogleDriveProducts = (importedProducts: Product[], mode: 'replace' | 'merge') => {
    if (mode === 'replace') {
      setDb((prev) => ({
        ...prev,
        library: importedProducts,
      }));
      addToast(
        'success',
        'Product Library Replaced',
        `Imported ${importedProducts.length} items from Google Drive.`
      );
    } else {
      // Merge by matching item code or description
      setDb((prev) => {
        const existing = [...prev.library];
        importedProducts.forEach((newProd) => {
          const matchIdx = existing.findIndex(
            (p) =>
              (p.code && newProd.code && p.code.toLowerCase() === newProd.code.toLowerCase()) ||
              p.desc.toLowerCase() === newProd.desc.toLowerCase()
          );
          if (matchIdx >= 0) {
            existing[matchIdx] = { ...existing[matchIdx], ...newProd, id: existing[matchIdx].id };
          } else {
            existing.push(newProd);
          }
        });
        return {
          ...prev,
          library: existing,
        };
      });
      addToast(
        'success',
        'Google Drive Sync Completed',
        `Updated and synced ${importedProducts.length} items from Google Sheet.`
      );
    }
  };

  // Settings
  const handleSaveSettings = (newSettings: CompanySettings) => {
    setDb((prev) => ({
      ...prev,
      settings: newSettings,
    }));
    addToast('success', 'Settings Saved', 'Letterhead and defaults updated.');
  };

  const handleResetAllData = () => {
    setConfirmModal({
      isOpen: true,
      title: 'Reset All Data to Defaults?',
      message: 'This will reset all sample products, customers, and quotations to fresh factory defaults. Any custom entries will be replaced.',
      confirmText: 'Reset Everything',
      confirmVariant: 'danger',
      onConfirm: () => {
        setDb(INITIAL_DATABASE);
        setActiveQuotation(createNewEmptyQuote());
        addToast('info', 'All Data Reset to Initial Factory Defaults');
      },
    });
  };

  // Document Suite Management
  const handleSaveDocumentSuite = (suiteToSave: ProjectDocumentSuite, isNew?: boolean) => {
    setDb((prev) => {
      const existingList = prev.documentSuites || [];
      const idx = existingList.findIndex((s) => s.id === suiteToSave.id);
      const updatedSuites = [...existingList];
      if (idx >= 0) {
        updatedSuites[idx] = suiteToSave;
      } else {
        updatedSuites.unshift(suiteToSave);
      }

      const nextDb: AppDatabase = {
        ...prev,
        documentSuites: updatedSuites,
        nextContract: isNew || idx < 0 ? (prev.nextContract || 1) + 1 : prev.nextContract || 1,
      };
      saveDatabase(nextDb);
      saveServerDatabase(nextDb);
      return nextDb;
    });

    if (isNew) {
      addToast('success', 'Document Suite Created', suiteToSave.contract.contractNo);
    }
  };

  const handleDeleteDocumentSuite = (suiteId: string) => {
    const target = (db.documentSuites || []).find((s) => s.id === suiteId);
    setConfirmModal({
      isOpen: true,
      title: 'Delete Project Document Suite?',
      message: `Remove "${target?.projectTitle || target?.contract.contractNo || 'this project suite'}" including all its Sample Confirmations, VOs, Finish Certificates, and Progress Reports?`,
      confirmText: 'Delete Suite',
      confirmVariant: 'danger',
      onConfirm: () => {
        setDb((prev) => {
          const nextDb: AppDatabase = {
            ...prev,
            documentSuites: (prev.documentSuites || []).filter((s) => s.id !== suiteId),
          };
          saveDatabase(nextDb);
          saveServerDatabase(nextDb);
          return nextDb;
        });
        addToast('info', 'Document Suite Deleted', target?.contract.contractNo);
      },
    });
  };

  const handleOpenOrCreateSuiteFromQuote = (quote: Quotation) => {
    const existing = (db.documentSuites || []).find((s) =>
      getLinkedQuotationIds(s).includes(quote.id)
    );
    if (existing) {
      setInitialActiveSuiteId(existing.id);
      setCurrentPage('documents');
      addToast('info', 'Opened Linked Document Suite', existing.contract.contractNo);
      return;
    }

    const cust = db.customers.find((c) => c.id === quote.customerId);
    const created = createDocumentSuiteFromQuotation(
      quote,
      cust,
      db.settings,
      db.nextContract || 1,
      currentUser
    );
    handleSaveDocumentSuite(created, true);
    setInitialActiveSuiteId(created.id);
    setCurrentPage('documents');
  };

  const handlePrintDocumentSuite = (
    suite: ProjectDocumentSuite,
    target: PrintableSuiteTarget
  ) => {
    setPrintingSuite({ suite, target });
  };

  // Trigger Print
  const handlePrintQuote = (quote: Quotation) => {
    setPrintingQuote(quote);
  };

  const closePrintModal = () => {
    setPrintingQuote(null);
  };

  const targetCustomerForPrint = printingQuote
    ? db.customers.find((c) => c.id === printingQuote.customerId)
    : undefined;

  if (!isAuthenticated) {
    return (
      <>
        <LoginScreen
          users={db.users || []}
          settings={db.settings}
          onLoginSuccess={handleLoginSuccess}
        />
        <ToastContainer toasts={toasts} onDismiss={dismissToast} />
      </>
    );
  }

  return (
    <>
      <div
        id="app-root-shell"
        className={`flex min-h-screen bg-slate-100 text-slate-900 font-['Plus_Jakarta_Sans',sans-serif] ${
          printingQuote || printingSuite ? 'no-print' : ''
        }`}
      >
      {/* Sidebar Navigation */}
      <Sidebar
        currentPage={currentPage}
        onNavigate={(page) => setCurrentPage(page)}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        draftCount={db.draft ? 1 : 0}
        quotesCount={db.quotes.length}
        documentSuitesCount={(db.documentSuites || []).length}
        productsCount={db.library.length}
        customersCount={db.customers.length}
        logoUrl={db.settings.logoUrl}
        currentUser={currentUser}
        onOpenUserModal={() => setUserModalOpen(true)}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        <Header
          currentPage={currentPage}
          onNewQuotation={() => {
            setActiveQuotation(createNewEmptyQuote());
            setCurrentPage('new');
          }}
          onOpenLibraryModal={() => {
            setProductToEdit(null);
            setProductModalOpen(true);
          }}
          isSidebarOpen={isSidebarOpen}
          onToggleSidebar={() => setIsSidebarOpen((prev) => !prev)}
          currentUser={currentUser}
          onOpenUserModal={() => setUserModalOpen(true)}
        />

        <main className="flex-1 pb-16">
          {currentPage === 'dashboard' && (
            <DashboardView
              quotes={db.quotes}
              customers={db.customers}
              products={db.library}
              draft={db.draft}
              currency={db.settings.currency}
              onNewQuotation={() => {
                setActiveQuotation(createNewEmptyQuote());
                setCurrentPage('new');
              }}
              onOpenQuote={handleOpenQuoteInEditor}
              onDeleteQuote={handleDeleteQuote}
              onPrintQuote={handlePrintQuote}
              onNavigateToDraft={() => {
                if (db.draft) {
                  setActiveQuotation(db.draft);
                  setCurrentPage('new');
                }
              }}
            />
          )}

          {currentPage === 'new' && (
            <QuotationEditorView
              initialQuotation={activeQuotation}
              customers={db.customers}
              products={db.library}
              settings={db.settings}
              users={db.users}
              currentUserId={db.currentUserId}
              onOpenUserModal={() => setUserModalOpen(true)}
              onSaveQuotation={handleSaveQuotation}
              onSaveDraft={handleSaveDraft}
              onReset={handleResetQuotation}
              onOpenCustomerModal={() => {
                setCustomerToEdit(null);
                setCustomerModalOpen(true);
              }}
              onOpenProductModal={() => {
                setProductToEdit(null);
                setProductModalOpen(true);
              }}
              onPrintQuote={handlePrintQuote}
            />
          )}

          {currentPage === 'quotations' && (
            <QuotationsListView
              quotes={db.quotes}
              customers={db.customers}
              linkedQuoteIds={
                new Set(
                  (db.documentSuites || []).flatMap((s) => getLinkedQuotationIds(s))
                )
              }
              onNewQuotation={() => {
                setActiveQuotation(createNewEmptyQuote());
                setCurrentPage('new');
              }}
              onOpenQuote={handleOpenQuoteInEditor}
              onDuplicateQuote={handleDuplicateQuote}
              onDeleteQuote={handleDeleteQuote}
              onPrintQuote={handlePrintQuote}
              onCreateDocumentSuite={handleOpenOrCreateSuiteFromQuote}
            />
          )}

          {currentPage === 'documents' && (
            <DocumentSuiteView
              suites={db.documentSuites || []}
              quotes={db.quotes}
              customers={db.customers}
              settings={db.settings}
              currentUser={currentUser}
              nextContractSeq={db.nextContract || 1}
              initialActiveSuiteId={initialActiveSuiteId}
              onClearInitialSuite={() => setInitialActiveSuiteId(null)}
              onSaveSuite={handleSaveDocumentSuite}
              onDeleteSuite={handleDeleteDocumentSuite}
              onPrintDocument={handlePrintDocumentSuite}
            />
          )}

          {currentPage === 'customers' && (
            <CustomersView
              customers={db.customers}
              quotes={db.quotes}
              onAddCustomer={() => {
                setCustomerToEdit(null);
                setCustomerModalOpen(true);
              }}
              onEditCustomer={(cust) => {
                setCustomerToEdit(cust);
                setCustomerModalOpen(true);
              }}
              onDeleteCustomer={handleDeleteCustomer}
            />
          )}

          {currentPage === 'products' && (
            <ProductsView
              products={db.library}
              currency={db.settings.currency}
              onAddProduct={() => {
                setProductToEdit(null);
                setProductModalOpen(true);
              }}
              onEditProduct={(prod) => {
                setProductToEdit(prod);
                setProductModalOpen(true);
              }}
              onDeleteProduct={handleDeleteProduct}
              onOpenGoogleDriveSync={() => setDriveModalOpen(true)}
            />
          )}

          {currentPage === 'reports' && (
            <ReportsView
              quotes={db.quotes}
              customers={db.customers}
              products={db.library}
              currency={db.settings.currency}
              onExportBackup={() => exportDatabaseBackup(db)}
              onImportBackup={(imported) => {
                setDb(imported);
                addToast('success', 'Database Restored from Backup');
              }}
            />
          )}

          {currentPage === 'settings' && (
            <SettingsView
              settings={db.settings}
              canEditContractLocks={canEditLockedContractTerms(currentUser)}
              onSaveSettings={handleSaveSettings}
              onResetAllData={handleResetAllData}
              onOpenUserModal={() => setUserModalOpen(true)}
            />
          )}
        </main>
      </div>

      {/* Customer Modal */}
      <CustomerModal
        isOpen={customerModalOpen}
        onClose={() => setCustomerModalOpen(false)}
        onSave={handleSaveCustomer}
        customerToEdit={customerToEdit}
      />

      {/* Product Modal */}
      <ProductModal
        isOpen={productModalOpen}
        onClose={() => setProductModalOpen(false)}
        onSave={handleSaveProduct}
        productToEdit={productToEdit}
        currency={db.settings.currency}
      />

      {/* Google Drive & Sheets Sync Modal */}
      <GoogleDriveSyncModal
        isOpen={driveModalOpen}
        onClose={() => setDriveModalOpen(false)}
        onImportProducts={handleImportGoogleDriveProducts}
        currentProductCount={db.library.length}
      />

      {/* User / Estimator Team Management Modal */}
      <UserModal
        isOpen={userModalOpen}
        onClose={() => setUserModalOpen(false)}
        users={db.users || []}
        currentUserId={db.currentUserId || 'u-1'}
        settings={db.settings}
        printLogs={db.printLogs || []}
        onSelectUser={handleSelectUser}
        onSaveUser={handleSaveUser}
        onDeleteUser={handleDeleteUser}
        onSaveSettings={handleSaveSettings}
        onLogout={handleLogout}
      />
    </div>

    {/* Print / PDF Fullscreen Modal Overlay - rendered as sibling outside #app-root-shell */}
    {printingQuote && (
      <PrintPreviewModal
        quotation={printingQuote}
        customer={targetCustomerForPrint}
        settings={db.settings}
        currentUser={currentUser}
        onRecordPrintLog={handleRecordPrintLog}
        onClose={closePrintModal}
      />
    )}

    {/* Document Suite Print / PDF Fullscreen Modal Overlay */}
    {printingSuite && (
      <DocumentSuitePrintModal
        suite={printingSuite.suite}
        target={printingSuite.target}
        settings={db.settings}
        onClose={() => setPrintingSuite(null)}
      />
    )}

    {/* Global In-App Confirmation Modal */}
    <ConfirmModal
      isOpen={confirmModal.isOpen}
      title={confirmModal.title}
      message={confirmModal.message}
      confirmText={confirmModal.confirmText}
      confirmVariant={confirmModal.confirmVariant}
      onConfirm={confirmModal.onConfirm}
      onCancel={() => setConfirmModal((prev) => ({ ...prev, isOpen: false }))}
    />

    {/* Global Toast Notifications */}
    <ToastContainer toasts={toasts} onDismiss={dismissToast} />
  </>
  );
}
