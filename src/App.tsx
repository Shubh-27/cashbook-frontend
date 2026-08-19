import { useEffect } from 'react';
import { useKeyboardShortcut } from './hooks/useKeyboardShortcut';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from 'sonner';
import { useAppStore } from './store';
import { Layout } from './components/layout';
import { Dashboard } from './pages/dashboard/page';
import { Transaction } from './pages/transactions/page';
import { AccountManager } from './pages/accounts/page';
import { Descriptions } from './pages/descriptions/page';
import { SettingsPage } from './pages/settings/page';
import { AddTransactionModal } from './components/AddTransactionModal';
import { UpdateNotifier } from './components/UpdateNotifier';

function App() {
  const fetchAccounts = useAppStore(state => state.fetchAccounts);
  const fetchDescriptions = useAppStore(state => state.fetchDescriptions);
  const setQuickAddOpen = useAppStore(state => state.setQuickAddOpen);

  useEffect(() => {
    fetchAccounts();
    fetchDescriptions();
  }, [fetchAccounts, fetchDescriptions]);

  useKeyboardShortcut('mod+shift+enter', () => {
    setQuickAddOpen(true);
  });


  return (
    <Router>
      <Toaster richColors position="top-right" />
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/transactions" element={<Transaction />} />
          <Route path="/accounts" element={<AccountManager />} />
          <Route path="/descriptions" element={<Descriptions />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Route>
      </Routes>
      <AddTransactionModal />
      <UpdateNotifier />
    </Router>
  );
}

export default App;

