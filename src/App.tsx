import { lazy, Suspense } from 'react';
import { useKeyboardShortcut } from './hooks/useKeyboardShortcut';
import { HashRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from 'sonner';
import { useAppStore } from './store';
import { Layout } from './components/layout';
import { AddTransactionModal } from './components/AddTransactionModal';
import { UpdateNotifier } from './components/UpdateNotifier';
import { PageLoadingFallback } from './components/common/PageLoadingFallback';

import { ROUTES } from './config/routes';

const Dashboard = lazy(() => import('./pages/dashboard/page').then(m => ({ default: m.Dashboard })));
const Transaction = lazy(() => import('./pages/transactions/page').then(m => ({ default: m.Transaction })));
const StatementImportPage = lazy(() => import('./pages/transactions/import/page').then(m => ({ default: m.StatementImportPage })));
const AccountManager = lazy(() => import('./pages/accounts/page').then(m => ({ default: m.AccountManager })));
const Descriptions = lazy(() => import('./pages/descriptions/page').then(m => ({ default: m.Descriptions })));
const ImportProfiles = lazy(() => import('./pages/import-profiles/page').then(m => ({ default: m.ImportProfiles })));
const ImportProfileEditorPage = lazy(() => import('./pages/import-profiles/editor/page').then(m => ({ default: m.ImportProfileEditorPage })));
const SettingsPage = lazy(() => import('./pages/settings/page').then(m => ({ default: m.SettingsPage })));

function App() {
  const setQuickAddOpen = useAppStore(state => state.setQuickAddOpen);

  useKeyboardShortcut('mod+shift+enter', () => {
    setQuickAddOpen(true);
  });


  return (
    <Router>
      <Toaster richColors position="top-right" />
      <Suspense fallback={<PageLoadingFallback />}>
        <Routes>
          <Route element={<Layout />}>
            <Route path={ROUTES.DASHBOARD} element={<Dashboard />} />
            <Route path={ROUTES.TRANSACTIONS} element={<Transaction />} />
            <Route path={ROUTES.TRANSACTIONS_IMPORT} element={<StatementImportPage />} />
            <Route path={ROUTES.ACCOUNTS} element={<AccountManager />} />
            <Route path={ROUTES.DESCRIPTIONS} element={<Descriptions />} />
            <Route path={ROUTES.IMPORT_PROFILES} element={<ImportProfiles />} />
            <Route path={ROUTES.IMPORT_PROFILE_NEW} element={<ImportProfileEditorPage />} />
            <Route path={ROUTES.IMPORT_PROFILE_EDIT} element={<ImportProfileEditorPage />} />
            <Route path={ROUTES.SETTINGS} element={<SettingsPage />} />
          </Route>
        </Routes>
      </Suspense>
      <AddTransactionModal />
      <UpdateNotifier />
    </Router>
  );
}

export default App;

