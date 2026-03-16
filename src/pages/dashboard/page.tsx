import { useAppStore } from '../../store';
import { CreditCard, Landmark, Wallet } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../../components/ui/button';

export function Dashboard() {
  const accounts = useAppStore(state => state.accounts);
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

  return (
    <div className="flex flex-col gap-8 animate-in fade-in duration-300">

      <div>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-slate-800">Your Accounts</h2>
          <Button
            variant="link"
            onClick={() => navigate('/accounts')}
            className="text-teal-600 hover:text-teal-700 p-0 h-auto font-medium"
          >
            Manage Accounts &rarr;
          </Button>
        </div>

        {accounts.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-3xl border border-slate-100 shadow-sm">
            <h3 className="text-lg font-medium text-slate-800 mb-2">No accounts found</h3>
            <p className="text-slate-500 mb-6">Create a bank account to start tracking transactions.</p>
            <Button
              onClick={() => navigate('/accounts')}
              className="px-6 rounded-xl font-medium"
            >
              Add your first account
            </Button>
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
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
}
