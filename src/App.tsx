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

  useEffect(() => {
    fetchAccountsAndBalance();
  }, [fetchAccountsAndBalance]);

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
