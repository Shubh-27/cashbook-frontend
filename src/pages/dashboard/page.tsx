import { useAppStore } from '../../store';
import { CreditCard, Landmark, Wallet } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export function Dashboard() {
  const accounts = useAppStore(state => state.accounts);
  const totalBalance = useAppStore(state => state.totalBalance);
  const setSelectedAccount = useAppStore(state => state.setSelectedAccount);
  const navigate = useNavigate();

  const handleAccountClick = (sid: string) => {
    setSelectedAccount(sid);
    navigate('/transaction');
  };

  const getIcon = (idx: number) => {
    const icons = [CreditCard, Landmark, Wallet];
    const Icon = icons[idx % icons.length];
    return <Icon className="w-5 h-5 text-teal-600" />;
  };

  const formatter = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' });

  return (
    <div className="flex flex-col gap-8 animate-in fade-in duration-300">

      <div className="bg-slate-900 rounded-3xl p-8 text-white relative overflow-hidden flex flex-col gap-2 shadow-lg">
        <div className="absolute top-0 right-0 w-64 h-64 bg-teal-500/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        <h1 className="text-slate-400 font-medium tracking-wide text-sm uppercase">Total Net Balance</h1>
        <div className="text-5xl font-bold tracking-tight mt-1 flex items-baseline gap-2">
          {formatter.format(totalBalance)}
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-slate-800">Your Accounts</h2>
          <button
            onClick={() => navigate('/accounts')}
            className="text-sm font-medium text-teal-600 hover:text-teal-700"
          >
            Manage Accounts &rarr;
          </button>
        </div>

        {accounts.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-3xl border border-slate-100 shadow-sm">
            <h3 className="text-lg font-medium text-slate-800 mb-2">No accounts found</h3>
            <p className="text-slate-500 mb-6">Create a bank account to start tracking transactions.</p>
            <button
              onClick={() => navigate('/accounts')}
              className="px-6 py-2.5 bg-slate-900 text-white rounded-xl font-medium hover:bg-slate-800 transition-all shadow-sm"
            >
              Add your first account
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {accounts.map((acc, idx) => (
              <div
                key={acc.account_sid}
                onClick={() => handleAccountClick(acc.account_sid)}
                className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm hover:shadow-md hover:border-teal-100 cursor-pointer transition-all active:scale-[0.98] group relative overflow-hidden"
              >
                <div className="absolute top-0 left-0 w-1 h-full bg-teal-500 opacity-0 group-hover:opacity-100 transition-opacity" />

                <div className="flex items-start justify-between mb-4">
                  <div className="p-2.5 bg-teal-50 rounded-xl group-hover:bg-teal-100 transition-colors">
                    {getIcon(idx)}
                  </div>
                  <div className="flex items-center gap-1 text-slate-400 text-xs font-semibold uppercase tracking-wider bg-slate-50 px-2 py-1 rounded-md">
                    {acc.bank_name || 'Bank'}
                  </div>
                </div>

                <h3 className="font-bold text-slate-800 text-lg">{acc.account_name}</h3>
                <p className="text-slate-500 font-medium text-sm mb-4">
                  {acc.account_number ? `****${acc.account_number.toString().slice(-4)}` : 'No Acc Number'}
                </p>

                <div className="pt-4 border-t border-slate-50 flex items-end justify-between">
                  <div>
                    <div className="text-xs font-medium text-slate-400 mb-1">Current Balance</div>
                    <div className="font-bold text-xl text-slate-900 tracking-tight">
                      {formatter.format(acc.balance || 0)}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
}
