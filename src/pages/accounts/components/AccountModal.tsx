import type { FormEvent } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export interface AccountModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isEditing: boolean;
  name: string;
  bankName: string;
  accNumber: string;
  onNameChange: (value: string) => void;
  onBankNameChange: (value: string) => void;
  onAccNumberChange: (value: string) => void;
  onSubmit: (e: FormEvent) => void;
  errors: Record<string, string | null>;
}

export function AccountModal({
  open,
  onOpenChange,
  isEditing,
  name,
  bankName,
  accNumber,
  onNameChange,
  onBankNameChange,
  onAccNumberChange,
  onSubmit,
  errors,
}: AccountModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] sm:max-w-md max-h-[92vh] overflow-y-auto rounded-3xl p-5 sm:p-6 shadow-2xl border border-slate-200/80 bg-white">
        <DialogHeader>
          <DialogTitle className="text-lg md:text-xl font-bold text-slate-900">
            {isEditing ? 'Edit Account' : 'Add Bank Account'}
          </DialogTitle>
          <DialogDescription className="text-xs md:text-sm text-slate-500">
            {isEditing
              ? 'Update account details and bank information.'
              : 'Connect a new bank account or wallet to track.'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit} noValidate className="flex flex-col gap-2.5 py-1">
          <div className="space-y-1">
            <Label htmlFor="acc-name" className="text-xs font-semibold text-slate-600">
              Account Name
            </Label>
            <Input
              id="acc-name"
              value={name}
              onChange={e => onNameChange(e.target.value)}
              placeholder="e.g. Salary Account, Savings"
              className={cn(
                'h-11 rounded-xl bg-white border-slate-200 text-sm shadow-xs',
                errors.account_name && 'border-red-500 focus-visible:ring-red-500'
              )}
            />
            <p className={cn(
              'text-[11px] font-medium text-red-500 min-h-[16px] leading-tight transition-opacity duration-150',
              errors.account_name ? 'opacity-100' : 'opacity-0 select-none pointer-events-none'
            )}>
              {errors.account_name || '\u00A0'}
            </p>
          </div>

          <div className="space-y-1">
            <Label htmlFor="bank-name" className="text-xs font-semibold text-slate-600">
              Bank Name
            </Label>
            <Input
              id="bank-name"
              value={bankName}
              onChange={e => onBankNameChange(e.target.value)}
              placeholder="e.g. HDFC, Chase, ICICI, SBI"
              className={cn(
                'h-11 rounded-xl bg-white border-slate-200 text-sm shadow-xs',
                errors.bank_name && 'border-red-500 focus-visible:ring-red-500'
              )}
            />
            <p className={cn(
              'text-[11px] font-medium text-red-500 min-h-[16px] leading-tight transition-opacity duration-150',
              errors.bank_name ? 'opacity-100' : 'opacity-0 select-none pointer-events-none'
            )}>
              {errors.bank_name || '\u00A0'}
            </p>
          </div>

          <div className="space-y-1">
            <Label htmlFor="acc-number" className="text-xs font-semibold text-slate-600">
              Account Number
            </Label>
            <Input
              id="acc-number"
              value={accNumber}
              onChange={e => onAccNumberChange(e.target.value)}
              placeholder="e.g. Last 4 digits or full number"
              className={cn(
                'h-11 rounded-xl bg-white border-slate-200 font-mono text-sm shadow-xs',
                errors.account_number && 'border-red-500 focus-visible:ring-red-500'
              )}
            />
            <p className={cn(
              'text-[11px] font-medium text-red-500 min-h-[16px] leading-tight transition-opacity duration-150',
              errors.account_number ? 'opacity-100' : 'opacity-0 select-none pointer-events-none'
            )}>
              {errors.account_number || '\u00A0'}
            </p>
          </div>

          <DialogFooter className="flex flex-row items-center justify-end gap-2 pt-3 border-t mt-1">
            <Button variant="ghost" type="button" onClick={() => onOpenChange(false)} className="rounded-xl flex-1 sm:flex-none">
              Cancel
            </Button>
            <Button type="submit" className="bg-teal-600 hover:bg-teal-700 text-white rounded-xl flex-1 sm:flex-none font-semibold shadow-sm">
              {isEditing ? 'Save Changes' : 'Create Account'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
