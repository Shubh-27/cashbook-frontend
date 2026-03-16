import { useEffect } from 'react';
import { HashRouter as Router, Routes, Route } from 'react-router-dom';
import { useAppStore } from './store';
import { Layout } from './components/Layout';
import { Dashboard } from './pages/dashboard/page';
import { Transaction } from './pages/transaction/page';
import { AccountManager } from './pages/accounts/page';
import { Descriptions } from './pages/descriptions/page';
import { AddTransactionModal } from './components/AddTransactionModal';

function App() {
  const fetchAccountsAndBalance = useAppStore(state => state.fetchAccountsAndBalance);
  const setQuickAddOpen = useAppStore(state => state.setQuickAddOpen);

  useEffect(() => {
    fetchAccountsAndBalance();
  }, [fetchAccountsAndBalance]);

  useEffect(() => {
  const handleKeyDown = (e : any) => {
    const isMac = navigator.platform.toUpperCase().includes("MAC");

    const modifierPressed = isMac ? e.metaKey : e.ctrlKey;

    if (
      modifierPressed &&
      e.shiftKey &&
      e.key === "Enter" &&
      !["INPUT", "TEXTAREA"].includes(e.target.tagName)
    ) {
      e.preventDefault();
      setQuickAddOpen(true);
    }
  };

  window.addEventListener("keydown", handleKeyDown);

  return () => window.removeEventListener("keydown", handleKeyDown);
}, [setQuickAddOpen]);


  return (
    <Router>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/transaction" element={<Transaction />} />
          <Route path="/accounts" element={<AccountManager />} />
          <Route path="/descriptions" element={<Descriptions />} />
        </Route>
      </Routes>
      <AddTransactionModal />
    </Router>
  );
}

export default App;
