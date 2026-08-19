import type { Account, Description, VwTransactionList } from '@/types';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { TransactionForm } from '@/components/common/TransactionForm';
import type { TransactionFormValues } from '@/components/common/TransactionForm';

export interface TransactionEditModalProps {
  editingTx: VwTransactionList | null;
  accounts: Account[];
  descriptions: Description[];
  onClose: () => void;
  onSave: (values: TransactionFormValues) => void | Promise<void>;
  isSubmitting?: boolean;
}

function mapEditingTxToFormValues(
  tx: VwTransactionList | null
): Partial<TransactionFormValues> | undefined {
  if (!tx) return undefined;
  const type: 'DEBIT' | 'CREDIT' = tx.debit > 0 ? 'DEBIT' : 'CREDIT';
  const amount = Math.max(tx.debit, tx.credit).toString();
  return {
    type,
    account_sid: tx.account_sid || '',
    transaction_date: tx.transaction_date ? tx.transaction_date.split('T')[0] : '',
    amount,
    description_name: tx.description_name || '',
    description_sid: tx.description_sid || '',
    notes: tx.notes || '',
  };
}

export function TransactionEditModal({
  editingTx,
  accounts,
  descriptions,
  onClose,
  onSave,
  isSubmitting = false,
}: TransactionEditModalProps) {
  return (
    <Dialog open={!!editingTx} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="w-[95vw] sm:max-w-md max-h-[92vh] overflow-y-auto rounded-3xl p-5 sm:p-6 shadow-2xl border border-slate-200/80 bg-white">
        <DialogHeader>
          <DialogTitle className="text-lg md:text-xl font-bold text-slate-900">Edit Transaction</DialogTitle>
          <DialogDescription className="text-xs md:text-sm text-slate-500">
            Update transaction details, amount, or tag.
          </DialogDescription>
        </DialogHeader>

        {editingTx && (
          <TransactionForm
            mode="edit"
            initialValues={mapEditingTxToFormValues(editingTx)}
            accounts={accounts}
            descriptions={descriptions}
            isSubmitting={isSubmitting}
            onSubmit={onSave}
            onCancel={onClose}
            submitButtonText="Save Changes"
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
