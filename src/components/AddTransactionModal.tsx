import { useState, useRef } from 'react';
import { useKeyboardShortcut } from '@/hooks/useKeyboardShortcut';
import { useAppStore } from '@/store';
import { api } from '@/services/api';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';
import { TransactionForm } from './common/TransactionForm';
import type { TransactionFormHandle, TransactionFormValues } from './common/TransactionForm';

export function AddTransactionModal() {
  const open = useAppStore(state => state.quickAddOpen);
  const setOpen = useAppStore(state => state.setQuickAddOpen);
  const accounts = useAppStore(state => state.accounts);
  const descriptions = useAppStore(state => state.descriptions);
  const fetchAccounts = useAppStore(state => state.fetchAccounts);
  const fetchDescriptions = useAppStore(state => state.fetchDescriptions);
  const refreshTransactions = useAppStore(state => state.refreshTransactions);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const formRef = useRef<TransactionFormHandle>(null);

  useKeyboardShortcut('mod+enter', () => {
    if (open) {
      formRef.current?.submitForm();
    }
  }, { enabled: open });

  const handleAdd = async (values: TransactionFormValues) => {
    setIsSubmitting(true);
    try {
      const val = parseFloat(values.amount);
      const [year, month, day] = values.transaction_date.split('-').map(Number);
      const dateObj = new Date(year, month - 1, day);
      const currentDate = new Date();
      dateObj.setHours(currentDate.getHours(), currentDate.getMinutes(), currentDate.getSeconds());

      await api.addTransaction({
        account_sid: values.account_sid,
        transaction_date: dateObj.toISOString(),
        description_name: values.description_name,
        description_sid: values.description_sid || '',
        debit: values.type === 'DEBIT' ? val : 0,
        credit: values.type === 'CREDIT' ? val : 0,
        notes: values.notes || ''
      });

      await fetchAccounts();
      await fetchDescriptions();
      await refreshTransactions();

      if (!values.fastEntry) {
        setOpen(false);
      }
    } catch (e) {
      console.error('Failed to save transaction:', e);
      toast.error(e instanceof Error ? e.message : 'Failed to save transaction');
      throw e;
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="w-[95vw] sm:max-w-md max-h-[92vh] overflow-y-auto rounded-3xl p-5 sm:p-6 shadow-2xl border border-slate-200/80 bg-white">
        <DialogHeader>
          <DialogTitle className="text-lg md:text-xl font-bold text-slate-800">New Transaction</DialogTitle>
          <DialogDescription className="text-xs md:text-sm text-slate-500">
            Record a new expense or income entry.
          </DialogDescription>
        </DialogHeader>

        <TransactionForm
          ref={formRef}
          mode="add"
          showFastEntry={true}
          accounts={accounts}
          descriptions={descriptions}
          isSubmitting={isSubmitting}
          onSubmit={handleAdd}
          onCancel={() => setOpen(false)}
          submitButtonText="Save Transaction"
        />
      </DialogContent>
    </Dialog>
  );
}
