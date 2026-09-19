import React, { useState, useEffect } from 'react';
import {
  AppDatabase,
  Quotation,
  Customer,
  Product,
  CompanySettings,
  UserProfile,
} from './types';
import { loadDatabase, saveDatabase, exportDatabaseBackup } from './utils/storage';
import {
  generateQuoteNumber,
  createBlankScope,
  calculateQuotationTotals,
} from './utils/formatters';
import { Sidebar, PageId } from './components/Sidebar';
import { Header } from './components/Header';
import { ToastContainer, ToastMessage } from './components/Toast';
import { CustomerModal } from './components/CustomerModal';
import { ProductModal } from './components/ProductModal';
import { UserModal } from './components/UserModal';
import { GoogleDriveSyncModal } from './components/GoogleDriveSyncModal';
import { PrintPreviewModal } from './components/PrintPreviewModal';
import { DashboardView } from './views/DashboardView';
import { QuotationEditorView } from './views/QuotationEditorView';
import { QuotationsListView } from './views/QuotationsListView';
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

  // Active user profile
  const currentUser: UserProfile =
    db.users?.find((u) => u.id === db.currentUserId) ||
    db.users?.[0] || {
      id: 'usr_adel',
      name: 'Adel',
      role: 'Managing Estimator',
      email: 'adel.tow.2026@gmail.com',
      avatarInitials: 'AD',
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
      alert('At least one estimator user profile must remain in the system.');
      return;
    }
    setDb((prev) => {
      const remaining = (prev.users || []).filter((u) => u.id !== userId);
      const nextActiveId = prev.currentUserId === userId ? remaining[0].id : prev.currentUserId;
      return { ...prev, users: remaining, currentUserId: nextActiveId };
    });
    addToast('info', 'Estimator Removed');
  };

  // Active quotation in editor
  const createNewEmptyQuote = (): Quotation => {
    const today = new Date().toISOString().split('T')[0];
    const nextMonth = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split('T')[0];
    const firstCust = db.customers[0];
    const quoteNo = generateQuoteNumber(db.nextQuote);
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

  // Sync to database storage
  useEffect(() => {
    saveDatabase(db);
  }, [db]);

  const addToast = (type: 'success' | 'error' | 'info', title: string, message?: string) => {
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
    const existingIndex = db.quotes.findIndex((q) => q.id === quoteToSave.id);
    let updatedQuotes = [...db.quotes];

    if (existingIndex >= 0) {
      updatedQuotes[existingIndex] = quoteToSave;
    } else {
      updatedQuotes.push(quoteToSave);
    }

    setDb((prev) => ({
      ...prev,
      quotes: updatedQuotes,
      draft: null, // Clear active draft once finalized
      nextQuote: existingIndex >= 0 ? prev.nextQuote : prev.nextQuote + 1,
    }));

    addToast(
      'success',
      'Quotation Saved Successfully',
      `${quoteToSave.quoteNo} is stored in your quotations directory.`
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
    if (confirm('Start a new quotation? Any unsaved edits to the active form will be reset.')) {
      const newQ = createNewEmptyQuote();
      setActiveQuotation(newQ);
      setDb((prev) => ({ ...prev, draft: null }));
      addToast('info', 'New Quotation Initialized');
    }
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
      quoteNo: generateQuoteNumber(db.nextQuote),
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
    if (confirm('Are you sure you want to delete this quotation?')) {
      setDb((prev) => ({
        ...prev,
        quotes: prev.quotes.filter((q) => q.id !== id),
      }));
      addToast('info', 'Quotation Deleted');
    }
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
      alert('You must keep at least one customer in your directory.');
      return;
    }
    if (confirm('Delete this customer record?')) {
      setDb((prev) => ({
        ...prev,
        customers: prev.customers.filter((c) => c.id !== id),
      }));
      addToast('info', 'Customer Deleted');
    }
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
    if (confirm('Delete this product from your library?')) {
      setDb((prev) => ({
        ...prev,
        library: prev.library.filter((p) => p.id !== id),
      }));
      addToast('info', 'Product Removed from Library');
    }
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
    if (confirm('Reset ALL sample products, customers, and quotations to fresh defaults?')) {
      setDb(INITIAL_DATABASE);
      setActiveQuotation(createNewEmptyQuote());
      addToast('info', 'All Data Reset to Initial Factory Defaults');
    }
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

  return (
    <>
      <div
        id="app-root-shell"
        className={`flex min-h-screen bg-slate-100 text-slate-900 font-['Plus_Jakarta_Sans',sans-serif] ${
          printingQuote ? 'no-print' : ''
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
              onNewQuotation={() => {
                setActiveQuotation(createNewEmptyQuote());
                setCurrentPage('new');
              }}
              onOpenQuote={handleOpenQuoteInEditor}
              onDuplicateQuote={handleDuplicateQuote}
              onDeleteQuote={handleDeleteQuote}
              onPrintQuote={handlePrintQuote}
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
        currentUserId={db.currentUserId || 'usr_adel'}
        onSelectUser={handleSelectUser}
        onSaveUser={handleSaveUser}
        onDeleteUser={handleDeleteUser}
      />
    </div>

    {/* Print / PDF Fullscreen Modal Overlay - rendered as sibling outside #app-root-shell */}
    {printingQuote && (
      <PrintPreviewModal
        quotation={printingQuote}
        customer={targetCustomerForPrint}
        settings={db.settings}
        onClose={closePrintModal}
      />
    )}

    {/* Global Toast Notifications */}
    <ToastContainer toasts={toasts} onDismiss={dismissToast} />
  </>
  );
}
