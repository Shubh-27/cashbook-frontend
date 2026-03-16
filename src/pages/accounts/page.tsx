import { useState } from 'react';
import { DeleteConfirmModal } from '../../components/DeleteConfirmModal';
import { useAppStore } from '../../store';
import { api } from '../../api';
import { Pencil, Trash2, Check, X, Plus, Building } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';

export function AccountManager() {
  const accounts = useAppStore(state => state.accounts);
  const fetchAccounts = useAppStore(state => state.fetchAccounts);

  const [isEditing, setIsEditing] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [name, setName] = useState('');
  const [bankName, setBankName] = useState('');
  const [accNumber, setAccNumber] = useState('');
  const [deleteTargetSid, setDeleteTargetSid] = useState<string | null>(null);

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
    await fetchAccounts();
  };

  const handleEdit = (acc: any) => {
    setIsEditing(acc.account_sid);
    setIsAdding(false);
    setName(acc.account_name);
    setBankName(acc.bank_name || '');
    setAccNumber(acc.account_number || '');
  };

  const handleDelete = async () => {
    if (!deleteTargetSid) return;
    await api.deleteAccount(deleteTargetSid);
    setDeleteTargetSid(null);
    await fetchAccounts();
  };

  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-300">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-800">Account Manager</h1>
        <Button
          onClick={() => { resetForm(); setIsAdding(true); }}
          className="rounded-xl font-medium"
        >
          <Plus className="w-4 h-4" /> Add Account
        </Button>
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
                  <Input autoFocus value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Savings" className="h-9" />
                </td>
                <td className="px-6 py-3">
                  <Input value={bankName} onChange={e => setBankName(e.target.value)} placeholder="e.g. HDFC" className="h-9" />
                </td>
                <td className="px-6 py-3">
                  <Input value={accNumber} onChange={e => setAccNumber(e.target.value)} placeholder="Last 4 digits" className="h-9" />
                </td>
                <td className="px-6 py-3 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <Button variant="ghost" size="icon" onClick={handleSave} className="text-teal-600 hover:text-teal-700 hover:bg-teal-100"><Check className="w-5 h-5" /></Button>
                    <Button variant="ghost" size="icon" onClick={resetForm} className="text-slate-400 hover:bg-slate-100"><X className="w-5 h-5" /></Button>
                  </div>
                </td>
              </tr>
            )}

            {accounts.map(acc => {
              if (isEditing === acc.account_sid) {
                return (
                  <tr key={acc.account_sid} className="bg-teal-50/30">
                    <td className="px-6 py-3">
                      <Input value={name} onChange={e => setName(e.target.value)} className="h-9" />
                    </td>
                    <td className="px-6 py-3">
                      <Input value={bankName} onChange={e => setBankName(e.target.value)} className="h-9" />
                    </td>
                    <td className="px-6 py-3">
                      <Input value={accNumber} onChange={e => setAccNumber(e.target.value)} className="h-9" />
                    </td>
                    <td className="px-6 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button variant="ghost" size="icon" onClick={handleSave} className="text-teal-600 hover:text-teal-700 hover:bg-teal-100"><Check className="w-5 h-5" /></Button>
                        <Button variant="ghost" size="icon" onClick={resetForm} className="text-slate-400 hover:bg-slate-100"><X className="w-5 h-5" /></Button>
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
                      <Button variant="ghost" size="icon" onClick={() => handleEdit(acc)} className="text-slate-400 hover:text-teal-600 hover:bg-teal-50 rounded-lg transition-colors"><Pencil className="w-4 h-4" /></Button>
                      <Button variant="ghost" size="icon" onClick={() => setDeleteTargetSid(acc.account_sid)} className="text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"><Trash2 className="w-4 h-4" /></Button>
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

      <DeleteConfirmModal
        open={!!deleteTargetSid}
        onOpenChange={(open) => !open && setDeleteTargetSid(null)}
        onConfirm={handleDelete}
        title="Delete Account"
        description="Are you sure you want to delete this account? This will delete all transactions associated with it! This action is irreversible."
      />
    </div>
  );
}
