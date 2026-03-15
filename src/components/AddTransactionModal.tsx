import { useState, useEffect } from 'react';
import { useAppStore } from '../store';
import { api } from '../api';
import { X } from 'lucide-react';

export function AddTransactionModal() {
  const open = useAppStore(state => state.quickAddOpen);
  const setOpen = useAppStore(state => state.setQuickAddOpen);
  const accounts = useAppStore(state => state.accounts);
  const fetchAccountsAndBalance = useAppStore(state => state.fetchAccountsAndBalance);

  const [accountSid, setAccountSid] = useState<string>('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [type, setType] = useState<'DEBIT' | 'CREDIT'>('DEBIT');
  const [notes, setNotes] = useState('');
  const [descriptionsList, setDescriptionsList] = useState<{ description_sid: string, description_name: string }[]>([]);

  useEffect(() => {
    if (open) {
      if (accounts.length > 0 && !accountSid) {
        setAccountSid(accounts[0].account_sid);
      }
      api.getDescriptions().then(res => {
        setDescriptionsList(res);
      }).catch(console.error);
    }
  }, [open, accounts, accountSid]);

  if (!open) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accountSid || !amount) return;

    const val = parseFloat(amount);

    // Make sure we have a time component, since the DB allows full datetime sorting
    const dateObj = new Date(date);
    const currentDate = new Date();
    dateObj.setHours(currentDate.getHours(), currentDate.getMinutes(), currentDate.getSeconds());

    // Try to find matching description sid from our list
    const matchedDesc = descriptionsList.find(d => d.description_name.toLowerCase() === description.toLowerCase());

    await api.addTransaction({
      account_sid: accountSid,
      transaction_date: dateObj.toISOString(),
      description_name: description,
      description_sid: matchedDesc ? matchedDesc.description_sid : undefined,
      debit: type === 'DEBIT' ? val : 0,
      credit: type === 'CREDIT' ? val : 0,
      notes
    });

    fetchAccountsAndBalance();
    window.dispatchEvent(new Event('transaction-added'));

    // Reset and close
    setDescription('');
    setAmount('');
    setNotes('');
    setOpen(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-800">New Transaction</h2>
          <button onClick={() => setOpen(false)} className="text-slate-400 hover:text-slate-600 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Account</label>
            <select
              value={accountSid}
              onChange={e => setAccountSid(e.target.value)}
              className="w-full border border-slate-200 rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all bg-white"
              required
            >
              <option value="" disabled>Select Account</option>
              {accounts.map(acc => (
                <option key={acc.account_sid} value={acc.account_sid}>{acc.account_name} {acc.account_number ? `(${acc.account_number})` : ''}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Type</label>
              <div className="flex rounded-xl overflow-hidden border border-slate-200 p-1 bg-slate-50">
                <button
                  type="button"
                  onClick={() => setType('DEBIT')}
                  className={`flex-1 py-1.5 text-sm font-medium rounded-lg transition-all ${type === 'DEBIT' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500 hover:text-slate-700'}`}
                >
                  Debit
                </button>
                <button
                  type="button"
                  onClick={() => setType('CREDIT')}
                  className={`flex-1 py-1.5 text-sm font-medium rounded-lg transition-all ${type === 'CREDIT' ? 'bg-white shadow-sm text-teal-600' : 'text-slate-500 hover:text-slate-700'}`}
                >
                  Credit
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Date</label>
              <input
                type="date"
                value={date}
                onChange={e => setDate(e.target.value)}
                className="w-full border border-slate-200 rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all text-slate-700 uppercase"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="col-span-1">
              <label className="block text-sm font-medium text-slate-700 mb-1">Amount (₹)</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={amount}
                onChange={e => setAmount(e.target.value)}
                className="w-full border border-slate-200 rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all"
                required
                placeholder="0.00"
              />
            </div>
            <div className="col-span-2 relative">
              <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
              <input
                type="text"
                value={description}
                onChange={e => setDescription(e.target.value)}
                list="descriptions-list"
                className="w-full border border-slate-200 rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all"
                required
                placeholder="Store, bill, salary..."
                autoComplete="off"
              />
              <datalist id="descriptions-list">
                {descriptionsList.map(desc => (
                  <option key={desc.description_sid} value={desc.description_name} />
                ))}
              </datalist>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Notes (Optional)</label>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              className="w-full border border-slate-200 rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all min-h-[60px] resize-none"
              placeholder="Additional details..."
            />
          </div>

          <div className="pt-2 mt-2 border-t border-slate-100 flex justify-end gap-3">
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-sm font-medium bg-slate-900 text-white rounded-xl hover:bg-slate-800 shadow-sm hover:shadow active:scale-[0.98] transition-all"
            >
              Save Transaction
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
