import { useState } from 'react';
import { useAppStore } from '../store';
import { api } from '../api';
import { Zap } from 'lucide-react';

export function QuickAdd() {
  const [input, setInput] = useState('');
  const accounts = useAppStore(state => state.accounts);
  const selectedAccountSid = useAppStore(state => state.selectedAccountSid) || accounts[0]?.account_sid;
  const fetchAccountsAndBalance = useAppStore(state => state.fetchAccountsAndBalance);

  const handleKeyDown = async (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && input.trim()) {
      if (!selectedAccountSid) {
        alert("Please create an account first.");
        return;
      }

      const text = input.trim();
      let isCredit = false;
      let amountStr = '';
      let descStr = '';

      if (text.startsWith('+')) {
        isCredit = true;
        const match = text.match(/^\+([\d.]+)\s+(.*)/);
        if (match) {
          amountStr = match[1];
          descStr = match[2];
        } else {
          alert("Invalid Quick Add format. Example: +5000 salary");
          return;
        }
      } else {
        const match = text.match(/^([\d.]+)\s+(.*)/);
        if (match) {
          amountStr = match[1];
          descStr = match[2];
        } else {
          alert("Invalid Quick Add format. Example: 500 tea");
          return;
        }
      }

      const amount = parseFloat(amountStr);
      if (isNaN(amount) || amount <= 0) return;

      const date = new Date().toISOString();

      await api.addTransaction({
        account_sid: selectedAccountSid,
        transaction_date: date,
        description_name: descStr,
        debit: isCredit ? 0 : amount,
        credit: isCredit ? amount : 0,
        notes: "Quick Add entry"
      });

      setInput('');
      fetchAccountsAndBalance();
      // Dispatch custom event to let Transaction table refresh immediately
      window.dispatchEvent(new Event('transaction-added'));
    }
  };

  return (
    <div className="relative group flex items-center">
      <Zap className="absolute left-3 w-4 h-4 text-amber-500" />
      <input
        type="text"
        placeholder="Quick Add (e.g. '500 tea')"
        value={input}
        onChange={e => setInput(e.target.value)}
        onKeyDown={handleKeyDown}
        className="w-64 bg-amber-50/50 border border-amber-200/50 text-amber-900 rounded-xl py-2 pl-9 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 focus:bg-white transition-all placeholder:text-amber-500/70"
      />
    </div>
  );
}
