import { useState } from 'react';
import { useAppStore } from '../../store';
import { api } from '../../api';
import { Pencil, Trash2, Check, X, Plus, Building } from 'lucide-react';

export function AccountManager() {
  const accounts = useAppStore(state => state.accounts);
  const fetchAccountsAndBalance = useAppStore(state => state.fetchAccountsAndBalance);

  const [isEditing, setIsEditing] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [name, setName] = useState('');
  const [bankName, setBankName] = useState('');
  const [accNumber, setAccNumber] = useState('');

  const resetForm = () => {
    setName(''); setBankName(''); setAccNumber('');
    setIsEditing(null); setIsAdding(false);
  };

  const handleSave = async () => {
    if (!name.trim()) return;

    if (isEditing) {
      await api.updateAccount(isEditing, { account_name: name, bank_name: bankName, account_number: accNumber });
    } else {
      await api.addAccount({ account_name: name, bank_name: bankName, account_number: accNumber });
    }

    resetForm();
    await fetchAccountsAndBalance();
  };

  const handleEdit = (acc: any) => {
    setIsEditing(acc.account_sid);
    setIsAdding(false);
    setName(acc.account_name);
    setBankName(acc.bank_name || '');
    setAccNumber(acc.account_number || '');
  };

  const handleDelete = async (sid: string) => {
    if (confirm("Are you sure? This will delete all transactions for this account!")) {
      await api.deleteAccount(sid);
      await fetchAccountsAndBalance();
    }
  };

  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-300">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-800">Account Manager</h1>
        <button
          onClick={() => { resetForm(); setIsAdding(true); }}
          className="flex items-center gap-2 bg-slate-900 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-slate-800 transition-all shadow-sm"
        >
          <Plus className="w-4 h-4" /> Add Account
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 text-xs uppercase tracking-wider">
              <th className="px-6 py-4 font-semibold">Account Name</th>
              <th className="px-6 py-4 font-semibold">Bank Name</th>
              <th className="px-6 py-4 font-semibold">Account No.</th>
              <th className="px-6 py-4 font-semibold text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {isAdding && (
              <tr className="bg-teal-50/30">
                <td className="px-6 py-3">
                  <input autoFocus value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Savings" className="w-full border border-slate-200 rounded px-3 py-1.5 focus:outline-teal-500" />
                </td>
                <td className="px-6 py-3">
                  <input value={bankName} onChange={e => setBankName(e.target.value)} placeholder="e.g. HDFC" className="w-full border border-slate-200 rounded px-3 py-1.5 focus:outline-teal-500" />
                </td>
                <td className="px-6 py-3">
                  <input value={accNumber} onChange={e => setAccNumber(e.target.value)} placeholder="Last 4 digits" className="w-full border border-slate-200 rounded px-3 py-1.5 focus:outline-teal-500" />
                </td>
                <td className="px-6 py-3 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <button onClick={handleSave} className="p-1.5 text-teal-600 hover:bg-teal-100 rounded-lg"><Check className="w-5 h-5" /></button>
                    <button onClick={resetForm} className="p-1.5 text-slate-400 hover:bg-slate-100 rounded-lg"><X className="w-5 h-5" /></button>
                  </div>
                </td>
              </tr>
            )}

            {accounts.map(acc => {
              if (isEditing === acc.account_sid) {
                return (
                  <tr key={acc.account_sid} className="bg-teal-50/30">
                    <td className="px-6 py-3">
                      <input value={name} onChange={e => setName(e.target.value)} className="w-full border border-slate-200 rounded px-3 py-1.5 focus:outline-teal-500" />
                    </td>
                    <td className="px-6 py-3">
                      <input value={bankName} onChange={e => setBankName(e.target.value)} className="w-full border border-slate-200 rounded px-3 py-1.5 focus:outline-teal-500" />
                    </td>
                    <td className="px-6 py-3">
                      <input value={accNumber} onChange={e => setAccNumber(e.target.value)} className="w-full border border-slate-200 rounded px-3 py-1.5 focus:outline-teal-500" />
                    </td>
                    <td className="px-6 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button onClick={handleSave} className="p-1.5 text-teal-600 hover:bg-teal-100 rounded-lg"><Check className="w-5 h-5" /></button>
                        <button onClick={resetForm} className="p-1.5 text-slate-400 hover:bg-slate-100 rounded-lg"><X className="w-5 h-5" /></button>
                      </div>
                    </td>
                  </tr>
                )
              }

              return (
                <tr key={acc.account_sid} className="hover:bg-slate-50 transition-colors group">
                  <td className="px-6 py-4 text-slate-800 font-medium flex items-center gap-3">
                    <Building className="w-4 h-4 text-slate-400" /> {acc.account_name}
                  </td>
                  <td className="px-6 py-4 text-slate-600">{acc.bank_name || '-'}</td>
                  <td className="px-6 py-4 text-slate-600">{acc.account_number ? `****${acc.account_number.toString().slice(-4)}` : '-'}</td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => handleEdit(acc)} className="p-1.5 text-slate-400 hover:text-teal-600 hover:bg-teal-50 rounded-lg transition-colors"><Pencil className="w-4 h-4" /></button>
                      <button onClick={() => handleDelete(acc.account_sid)} className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </td>
                </tr>
              )
            })}

            {accounts.length === 0 && !isAdding && (
              <tr>
                <td colSpan={4} className="px-6 py-8 text-center text-slate-500">
                  No accounts found. Click "Add Account" to create your first bank account.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
