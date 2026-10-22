import { AppDatabase } from '../types';
import { INITIAL_DATABASE } from '../data/seedData';

const STORAGE_KEY = 'quotepro_app_db_v1';

export function loadDatabase(): AppDatabase {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      const isOldPlaceholder =
        !parsed.settings?.name ||
        parsed.settings?.name === 'Al Etihad Architectural Systems LLC' ||
        parsed.settings?.name === 'Your Company Name';

      const mergedSettings = isOldPlaceholder
        ? { ...INITIAL_DATABASE.settings, ...(parsed.settings || {}), ...INITIAL_DATABASE.settings }
        : {
            ...INITIAL_DATABASE.settings,
            ...(parsed.settings || {}),
            logoUrl: parsed.settings?.logoUrl || INITIAL_DATABASE.settings.logoUrl,
            bankDetails: parsed.settings?.bankDetails || INITIAL_DATABASE.settings.bankDetails,
            paymentTerms: parsed.settings?.paymentTerms || INITIAL_DATABASE.settings.paymentTerms,
            completionTerms: parsed.settings?.completionTerms || INITIAL_DATABASE.settings.completionTerms,
            defaultTerms: parsed.settings?.defaultTerms || INITIAL_DATABASE.settings.defaultTerms,
          };

      const isOldPaymentDuplicate = (notes?: string) =>
        Boolean(
          notes &&
            (notes.includes('Payment Terms:') || notes.includes('60% in advance')) &&
            notes.includes('Completion of Works')
        );

      if (isOldPaymentDuplicate(mergedSettings.defaultNotes)) {
        mergedSettings.defaultNotes = INITIAL_DATABASE.settings.defaultNotes;
      }

      const sanitizedQuotes = (parsed.quotes || []).map((q: any) => ({
        ...q,
        notes: isOldPaymentDuplicate(q.notes) ? INITIAL_DATABASE.settings.defaultNotes : q.notes,
        paymentTerms: q.paymentTerms || mergedSettings.paymentTerms,
        completionTerms: q.completionTerms || mergedSettings.completionTerms,
      }));

      const sanitizedDraft = parsed.draft
        ? {
            ...parsed.draft,
            notes: isOldPaymentDuplicate(parsed.draft.notes)
              ? INITIAL_DATABASE.settings.defaultNotes
              : parsed.draft.notes,
            paymentTerms: parsed.draft.paymentTerms || mergedSettings.paymentTerms,
            completionTerms: parsed.draft.completionTerms || mergedSettings.completionTerms,
          }
        : null;

      const mergedUsers = (parsed.users && parsed.users.length ? parsed.users : INITIAL_DATABASE.users).map((u: any) => {
        const seedMatch = INITIAL_DATABASE.users.find((s) => s.id === u.id || s.email === u.email);
        return {
          ...u,
          password: u.password || (seedMatch?.password || (u.name.toLowerCase().includes('adel') ? 'Adel@2026' : 'Tow@123')),
          isAdmin: u.isAdmin !== undefined ? u.isAdmin : (seedMatch?.isAdmin ?? u.name.toLowerCase().includes('adel')),
        };
      });

      return {
        ...INITIAL_DATABASE,
        ...parsed,
        settings: {
          ...mergedSettings,
          emailAlerts: {
            ...INITIAL_DATABASE.settings.emailAlerts,
            ...(parsed.settings?.emailAlerts || {}),
          },
        },
        quotes: sanitizedQuotes,
        draft: sanitizedDraft,
        customers: parsed.customers?.length ? parsed.customers : INITIAL_DATABASE.customers,
        library: parsed.library?.length ? parsed.library : INITIAL_DATABASE.library,
        users: mergedUsers,
        currentUserId: parsed.currentUserId || INITIAL_DATABASE.currentUserId,
        printLogs: parsed.printLogs || [],
      };
    }
  } catch (error) {
    console.error('Failed to load database from localStorage:', error);
  }
  return INITIAL_DATABASE;
}

export function saveDatabase(db: AppDatabase): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(db));
  } catch (error) {
    console.error('Failed to save database to localStorage:', error);
  }
}

export function exportDatabaseBackup(db: AppDatabase): void {
  const jsonStr = JSON.stringify(db, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `quotepro-backup-${new Date().toISOString().split('T')[0]}.json`;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    URL.revokeObjectURL(url);
    if (a.parentNode) a.parentNode.removeChild(a);
  }, 1000);
}
