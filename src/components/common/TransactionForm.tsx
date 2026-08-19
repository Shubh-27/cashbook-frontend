import { useState, useEffect, useRef, useImperativeHandle, forwardRef, type FormEvent } from 'react';
import { Check, ChevronsUpDown } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Checkbox } from '../ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '../ui/popover';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '../ui/command';
import { SegmentedControl } from './SegmentedControl';
import { TRANSACTION_TYPE_OPTIONS } from './segmented-control-options';
import { rules, validateField, ValidationError } from '@/utils/validation';
import type { Account, Description, VwAccountList } from '@/types';
import { cn } from '@/lib/utils';

export interface TransactionFormValues {
  type: 'DEBIT' | 'CREDIT';
  account_sid: string;
  transaction_date: string; // YYYY-MM-DD
  amount: string;
  description_name: string;
  description_sid?: string;
  notes?: string;
  fastEntry?: boolean;
}

export interface TransactionFormHandle {
  focusFirstInput: () => void;
  resetForm: () => void;
  setFieldError: (field: string, message: string | null) => void;
  submitForm: () => void;
}

export interface TransactionFormProps {
  mode?: 'add' | 'edit';
  initialValues?: Partial<TransactionFormValues>;
  accounts: (Account | VwAccountList)[];
  descriptions: Description[];
  isSubmitting?: boolean;
  onSubmit: (values: TransactionFormValues) => void | Promise<void>;
  onCancel?: () => void;
  showFastEntry?: boolean;
  submitButtonText?: string;
  className?: string;
}

const validationRules = {
  account: [rules.required('Please select an account')],
  date: [rules.required('Transaction date is required')],
  amount: [rules.required('Amount is required'), rules.minAmount(0.01, 'Amount must be greater than 0')],
  description: [rules.required('Description is required')],
};

export const TransactionForm = forwardRef<TransactionFormHandle, TransactionFormProps>(
  (
    {
      mode = 'add',
      initialValues,
      accounts,
      descriptions,
      isSubmitting = false,
      onSubmit,
      onCancel,
      showFastEntry = false,
      submitButtonText,
      className,
    },
    ref
  ) => {
    const getInitialDate = () => {
      if (initialValues?.transaction_date) {
        return initialValues.transaction_date.split('T')[0];
      }
      return new Date().toISOString().split('T')[0];
    };

    const [type, setType] = useState<'DEBIT' | 'CREDIT'>(initialValues?.type || 'DEBIT');
    const [accountSid, setAccountSid] = useState<string>(initialValues?.account_sid || '');
    const [date, setDate] = useState<string>(getInitialDate);
    const [amount, setAmount] = useState<string>(initialValues?.amount?.toString() || '');
    const [descriptionName, setDescriptionName] = useState<string>(initialValues?.description_name || '');
    const [descriptionSid, setDescriptionSid] = useState<string>(initialValues?.description_sid || '');
    const [notes, setNotes] = useState<string>(initialValues?.notes || '');
    const [fastEntry, setFastEntry] = useState<boolean>(initialValues?.fastEntry || false);

    const [openCombobox, setOpenCombobox] = useState(false);
    const [errors, setErrors] = useState<Record<string, string | null>>({});

    const typeDebitButtonRef = useRef<HTMLButtonElement>(null);
    const amountInputRef = useRef<HTMLInputElement>(null);
    const internalFormRef = useRef<HTMLFormElement>(null);

    // Sync with initialValues when they change (e.g. editing a different transaction)
    useEffect(() => {
      if (initialValues) {
        setType(initialValues.type || 'DEBIT');
        setAccountSid(initialValues.account_sid || (accounts.length > 0 ? accounts[0].account_sid : ''));
        setDate(initialValues.transaction_date ? initialValues.transaction_date.split('T')[0] : new Date().toISOString().split('T')[0]);
        setAmount(initialValues.amount !== undefined ? initialValues.amount.toString() : '');
        setDescriptionName(initialValues.description_name || '');
        setDescriptionSid(initialValues.description_sid || '');
        setNotes(initialValues.notes || '');
        setFastEntry(initialValues.fastEntry || false);
        setErrors({});
      }
    }, [initialValues, accounts]);

    // Set default account if none selected
    useEffect(() => {
      if (!accountSid && accounts.length > 0) {
        setAccountSid(accounts[0].account_sid);
      }
    }, [accounts, accountSid]);

    const resetForm = () => {
      setType('DEBIT');
      setAmount('');
      setDescriptionName('');
      setDescriptionSid('');
      setNotes('');
      setDate(new Date().toISOString().split('T')[0]);
      setErrors({});
      if (accounts.length > 0) {
        setAccountSid(accounts[0].account_sid);
      }
    };

    useImperativeHandle(ref, () => ({
      focusFirstInput: () => {
        typeDebitButtonRef.current?.focus();
      },
      resetForm,
      setFieldError: (field, message) => {
        setErrors((prev) => ({ ...prev, [field]: message }));
      },
      submitForm: () => {
        internalFormRef.current?.requestSubmit();
      },
    }));

    const handleSubmit = async (e: FormEvent) => {
      e.preventDefault();

      const newErrors = {
        account_sid: validateField(accountSid, validationRules.account),
        transaction_date: validateField(date, validationRules.date),
        amount: validateField(amount, validationRules.amount),
        description: validateField(descriptionName, validationRules.description),
      };

      if (newErrors.account_sid || newErrors.transaction_date || newErrors.amount || newErrors.description) {
        setErrors(newErrors);
        return;
      }

      try {
        // Resolve description SID if matched by name
        let finalDescriptionSid = descriptionSid;
        if (!finalDescriptionSid) {
          const matched = descriptions.find(
            (d) => d.description_name.toLowerCase() === descriptionName.trim().toLowerCase()
          );
          if (matched) {
            finalDescriptionSid = matched.description_sid;
          }
        }

        await onSubmit({
          type,
          account_sid: accountSid,
          transaction_date: date,
          amount,
          description_name: descriptionName.trim(),
          description_sid: finalDescriptionSid,
          notes: notes.trim(),
          fastEntry,
        });

        if (mode === 'add' && fastEntry) {
          resetForm();
          setTimeout(() => {
            typeDebitButtonRef.current?.focus();
          }, 100);
        }
      } catch (err) {
        if (err instanceof ValidationError) {
          const backendErrors: Record<string, string | null> = {};
          for (const key in err.errors) {
            backendErrors[key] = err.errors[key][0];
          }
          setErrors(backendErrors);
        } else {
          throw err;
        }
      }
    };

    return (
      <form ref={internalFormRef} onSubmit={handleSubmit} noValidate className={cn('flex flex-col gap-2.5 py-1', className)}>
        {/* Transaction Type Segmented Control */}
        <div className="space-y-1">
          <Label className="text-xs font-semibold text-slate-600">Transaction Type</Label>
          <SegmentedControl
            value={type}
            onChange={(val) => setType(val)}
            options={[
              {
                ...TRANSACTION_TYPE_OPTIONS[0],
                buttonRef: typeDebitButtonRef,
              },
              TRANSACTION_TYPE_OPTIONS[1],
            ]}
          />
        </div>

        {/* Account Selector */}
        <div className="space-y-1">
          <Label htmlFor="tx-account" className="text-xs font-semibold text-slate-600">
            Account
          </Label>
          <Select
            value={accountSid || undefined}
            onValueChange={(val) => {
              setAccountSid(val);
              setErrors((prev) => ({ ...prev, account_sid: null }));
            }}
          >
            <SelectTrigger
              id="tx-account"
              className={cn(
                'w-full h-11 rounded-xl bg-white border-slate-200 text-sm shadow-xs',
                errors.account_sid && 'border-red-500 focus:ring-red-500'
              )}
            >
              <SelectValue placeholder="Select Account" />
            </SelectTrigger>
            <SelectContent className="rounded-xl">
              {accounts.map((acc) => (
                <SelectItem key={acc.account_sid} value={acc.account_sid}>
                  {acc.account_name} {acc.account_number ? `(${acc.account_number})` : ''}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className={cn(
            'text-[11px] font-medium text-red-500 min-h-[16px] leading-tight transition-opacity duration-150',
            errors.account_sid ? 'opacity-100' : 'opacity-0 select-none pointer-events-none'
          )}>
            {errors.account_sid || '\u00A0'}
          </p>
        </div>

        {/* Amount & Date 2-Column Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-1">
            <Label htmlFor="tx-amount" className="text-xs font-semibold text-slate-600">
              Amount (₹)
            </Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-semibold text-sm">₹</span>
              <Input
                ref={amountInputRef}
                id="tx-amount"
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                value={amount}
                onChange={(e) => {
                  setAmount(e.target.value);
                  setErrors((prev) => ({ ...prev, amount: null }));
                }}
                className={cn(
                  'pl-7 h-11 rounded-xl bg-white border-slate-200 font-mono font-medium text-base shadow-xs',
                  errors.amount && 'border-red-500 focus-visible:ring-red-500'
                )}
              />
            </div>
            <p className={cn(
              'text-[11px] font-medium text-red-500 min-h-[16px] leading-tight transition-opacity duration-150',
              errors.amount ? 'opacity-100' : 'opacity-0 select-none pointer-events-none'
            )}>
              {errors.amount || '\u00A0'}
            </p>
          </div>

          <div className="space-y-1">
            <Label htmlFor="tx-date" className="text-xs font-semibold text-slate-600">
              Date
            </Label>
            <Input
              id="tx-date"
              type="date"
              value={date}
              onChange={(e) => {
                setDate(e.target.value);
                setErrors((prev) => ({ ...prev, transaction_date: null }));
              }}
              className={cn(
                'h-11 rounded-xl bg-white border-slate-200 text-sm uppercase shadow-xs',
                errors.transaction_date && 'border-red-500 focus-visible:ring-red-500'
              )}
            />
            <p className={cn(
              'text-[11px] font-medium text-red-500 min-h-[16px] leading-tight transition-opacity duration-150',
              errors.transaction_date ? 'opacity-100' : 'opacity-0 select-none pointer-events-none'
            )}>
              {errors.transaction_date || '\u00A0'}
            </p>
          </div>
        </div>

        {/* Description / Tag Combobox */}
        <div className="space-y-1 flex flex-col">
          <Label htmlFor="tx-description" className="text-xs font-semibold text-slate-600">
            Description / Tag
          </Label>
          <Popover open={openCombobox} onOpenChange={setOpenCombobox}>
            <PopoverTrigger asChild>
              <Button
                id="tx-description"
                variant="outline"
                role="combobox"
                aria-expanded={openCombobox}
                className={cn(
                  'w-full justify-between h-11 rounded-xl bg-white font-normal border-slate-200 text-left text-sm shadow-xs',
                  errors.description && 'border-red-500 focus-visible:ring-red-500'
                )}
              >
                <span className="truncate">{descriptionName || 'Select or enter description...'}</span>
                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent
              className="w-[var(--radix-popover-trigger-width)] p-0 rounded-2xl border border-slate-200/80 bg-white shadow-xl overflow-hidden pointer-events-auto"
              align="start"
              onWheel={(e) => e.stopPropagation()}
              onTouchMove={(e) => e.stopPropagation()}
            >
              <Command>
                <CommandInput
                  placeholder="Search or enter description..."
                  value={descriptionName}
                  onValueChange={(val) => {
                    setDescriptionName(val);
                    setDescriptionSid('');
                    setErrors((prev) => ({ ...prev, description: null }));
                  }}
                />
                <CommandList>
                  <CommandEmpty className="py-2 px-4 text-xs text-slate-500">
                    No matching tags.
                    {descriptionName && (
                      <div className="mt-1.5 pt-1.5 border-t border-slate-100 text-teal-700 uppercase text-[10px] font-bold">
                        Will use: "{descriptionName}"
                      </div>
                    )}
                  </CommandEmpty>
                  <CommandGroup>
                    {descriptions.map((desc) => {
                      const isSelected =
                        descriptionName.toLowerCase() === desc.description_name.toLowerCase();
                      return (
                        <CommandItem
                          key={desc.description_sid}
                          value={desc.description_name}
                          onSelect={(currentValue) => {
                            setDescriptionName(currentValue);
                            setDescriptionSid(desc.description_sid);
                            setErrors((prev) => ({ ...prev, description: null }));
                            setOpenCombobox(false);
                          }}
                        >
                          <Check
                            className={cn('mr-2 h-4 w-4 text-teal-600', isSelected ? 'opacity-100' : 'opacity-0')}
                          />
                          {desc.description_name}
                        </CommandItem>
                      );
                    })}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
          <p className={cn(
            'text-[11px] font-medium text-red-500 min-h-[16px] leading-tight transition-opacity duration-150',
            errors.description ? 'opacity-100' : 'opacity-0 select-none pointer-events-none'
          )}>
            {errors.description || '\u00A0'}
          </p>
        </div>

        {/* Notes Textarea */}
        <div className="space-y-1.5">
          <Label htmlFor="tx-notes" className="text-xs font-semibold text-slate-600">
            Notes (Optional)
          </Label>
          <Textarea
            id="tx-notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Additional details..."
            className="min-h-[70px] resize-none rounded-xl bg-white border-slate-200 text-sm shadow-xs"
          />
        </div>

        {/* Fast Entry Checkbox for Add Mode */}
        {showFastEntry && mode === 'add' && (
          <div className="flex items-center space-x-2 pt-1">
            <Checkbox
              id="tx-fast-entry"
              checked={fastEntry}
              onCheckedChange={(checked) => setFastEntry(checked === true)}
            />
            <Label
              htmlFor="tx-fast-entry"
              className="text-xs font-medium text-slate-600 cursor-pointer select-none"
            >
              Fast Entry (Keep open after saving)
            </Label>
          </div>
        )}

        {/* Action Footer */}
        <div className="flex flex-row items-center justify-between pt-3 border-t border-slate-100 mt-1">
          <div />
          <div className="flex items-center gap-2 w-full sm:w-auto">
            {onCancel && (
              <Button
                variant="ghost"
                type="button"
                onClick={onCancel}
                disabled={isSubmitting}
                className="rounded-xl flex-1 sm:flex-none text-slate-500 hover:text-slate-700"
              >
                Cancel
              </Button>
            )}
            <Button
              type="submit"
              disabled={isSubmitting}
              className="bg-teal-600 hover:bg-teal-700 text-white rounded-xl flex-1 sm:flex-none font-semibold shadow-sm px-5"
            >
              {submitButtonText || (mode === 'add' ? 'Add Transaction' : 'Save Changes')}
            </Button>
          </div>
        </div>
      </form>
    );
  }
);

TransactionForm.displayName = 'TransactionForm';
