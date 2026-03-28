import { useState, useEffect, useRef } from 'react';
import { useKeyboardShortcut } from '../hooks/useKeyboardShortcut';
import { useAppStore } from '../store';
import { api } from '../api';
import { rules, validateField, ValidationError } from '../utils/validation';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Checkbox } from './ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from './ui/popover';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from './ui/command';
import { Check, ChevronsUpDown } from 'lucide-react';
import { cn } from '../lib/utils';

export function AddTransactionModal() {
  const open = useAppStore(state => state.quickAddOpen);
  const setOpen = useAppStore(state => state.setQuickAddOpen);
  const accounts = useAppStore(state => state.accounts);
  const fetchAccounts = useAppStore(state => state.fetchAccounts);

  const [fastEntry, setFastEntry] = useState(false);
  const [accountSid, setAccountSid] = useState<string>('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [type, setType] = useState<'DEBIT' | 'CREDIT'>('DEBIT');
  const [notes, setNotes] = useState('');
  const [descriptionsList, setDescriptionsList] = useState<{ description_sid: string, description_name: string }[]>([]);
  const [openCombobox, setOpenCombobox] = useState(false);
  const [errors, setErrors] = useState<Record<string, string | null>>({});
  const typeDebitRef = useRef<HTMLButtonElement>(null);

  const validationRules = {
    account: [rules.required('Please select an account')],
    date: [rules.required('Transaction date is required')],
    amount: [rules.required('Amount is required'), rules.minAmount(0.01, 'Amount must be greater than 0')],
    description: [rules.required('Description is required')]
  };

  useEffect(() => {
    if (open) {
      setDescription('');
      setAmount('');
      setNotes('');
      setErrors({});
      setDate(new Date().toISOString().split('T')[0]);
      setType('DEBIT');

      // Set default account if not set
      if (accounts.length > 0 && !accountSid) {
        setAccountSid(accounts[0].account_sid);
      }
      
      api.getDescriptions().then(res => {
        setDescriptionsList(res);
      }).catch(console.error);
    }
    // Only run when opening the modal
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // Set default account when accounts become available while open
  useEffect(() => {
    if (open && accounts.length > 0 && !accountSid) {
      setAccountSid(accounts[0].account_sid);
    }
  }, [open, accounts, accountSid]);

  useKeyboardShortcut('mod+enter', () => {
    if (open) {
      handleSubmit({ preventDefault: () => { } } as React.FormEvent);
    }
  }, { enabled: open });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const newErrors = {
      account_sid: validateField(accountSid, validationRules.account),
      transaction_date: validateField(date, validationRules.date),
      amount: validateField(amount, validationRules.amount),
      description: validateField(description, validationRules.description)
    };

    if (newErrors.account_sid || newErrors.transaction_date || newErrors.amount || newErrors.description) {
      setErrors(newErrors);
      return;
    }

    try {
      const val = parseFloat(amount);
      const dateObj = new Date(date);
      const currentDate = new Date();
      dateObj.setHours(currentDate.getHours(), currentDate.getMinutes(), currentDate.getSeconds());

      const matchedDesc = descriptionsList.find(d => d.description_name.toLowerCase() === description.toLowerCase());

      await api.addTransaction({
        account_sid: accountSid,
        transaction_date: dateObj.toISOString(),
        description_name: description,
        description_sid: matchedDesc ? matchedDesc.description_sid : '',
        debit: type === 'DEBIT' ? val : 0,
        credit: type === 'CREDIT' ? val : 0,
        notes
      });

      fetchAccounts();
      window.dispatchEvent(new Event('transaction-added'));

      setDescription('');
      setAmount('');
      setNotes('');
      setType('DEBIT');
      setDate(new Date().toISOString().split('T')[0]);
      setErrors({});

      if (fastEntry) {
        // Return focus to Type buttons for fast keyboard entry
        setTimeout(() => {
          typeDebitRef.current?.focus();
        }, 100);
      } else {
        setOpen(false);
      }
    } catch (e) {
      if (e instanceof ValidationError) {
        const backendErrors: Record<string, string | null> = {};
        for (const key in e.errors) {
          backendErrors[key] = e.errors[key][0];
        }
        setErrors(backendErrors);
      } else {
        console.error(e);
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>New Transaction</DialogTitle>
          <DialogDescription>
            Record a new expense or income entries.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col gap-5 py-4">
          <div className="space-y-2">
            <Label htmlFor="account">Account</Label>
            <Select value={accountSid} onValueChange={(val) => { setAccountSid(val); setErrors(prev => ({ ...prev, account_sid: null })); }}>
              <SelectTrigger id="account" className={`w-full h-10 ${errors.account_sid ? 'border-red-500 focus:ring-red-500' : ''}`}>
                <SelectValue placeholder="Select Account" />
              </SelectTrigger>
              <SelectContent>
                {accounts.map(acc => (
                  <SelectItem key={acc.account_sid} value={acc.account_sid}>
                    {acc.account_name} {acc.account_number ? `(${acc.account_number})` : ''}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.account_sid && <p className="text-[11px] text-red-500 font-medium mt-1">{errors.account_sid}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Type</Label>
              <div className="flex rounded-lg overflow-hidden border border-input p-1 bg-muted/30 h-10">
                <button
                  ref={typeDebitRef}
                  type="button"
                  onClick={() => setType('DEBIT')}
                  className={`flex-1 text-sm font-medium rounded-md transition-all outline-none focus-visible:ring-2 focus-visible:ring-primary ${type === 'DEBIT' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                >
                  Debit
                </button>
                <button
                  type="button"
                  onClick={() => setType('CREDIT')}
                  className={`flex-1 text-sm font-medium rounded-md transition-all ${type === 'CREDIT' ? 'bg-background shadow-sm text-teal-600' : 'text-muted-foreground hover:text-foreground'}`}
                >
                  Credit
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="date">Date</Label>
              <Input
                id="date"
                type="date"
                value={date}
                onChange={e => { setDate(e.target.value); setErrors(prev => ({ ...prev, transaction_date: null })); }}
                className={`uppercase h-10 ${errors.transaction_date ? 'border-red-500 focus-visible:ring-red-500' : ''}`}
                required
              />
              {errors.transaction_date && <p className="text-[11px] text-red-500 font-medium mt-1">{errors.transaction_date}</p>}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="col-span-1 space-y-2">
              <Label htmlFor="amount">Amount (₹)</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                value={amount}
                onChange={e => { setAmount(e.target.value); setErrors(prev => ({ ...prev, amount: null })); }}
                placeholder="0.00"
                className={`h-10 ${errors.amount ? 'border-red-500 focus-visible:ring-red-500' : ''}`}
                required
              />
              {errors.amount && <p className="text-[11px] text-red-500 font-medium mt-1">{errors.amount}</p>}
            </div>
            <div className="col-span-2 space-y-2 flex flex-col">
              <Label htmlFor="description">Description <span className="text-red-500">*</span></Label>
              <Popover open={openCombobox} onOpenChange={setOpenCombobox}>
                <PopoverTrigger asChild>
                  <Button
                    id="description"
                    variant="outline"
                    role="combobox"
                    aria-expanded={openCombobox}
                    className={`w-full justify-between h-10 font-normal border-input ${errors.description ? 'border-red-500 ring-offset-background focus-visible:ring-red-500' : ''}`}
                  >
                    {description || "Select description..."}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
                  <Command>
                    <CommandInput
                      placeholder="Search description..."
                      onValueChange={(val) => {
                        setDescription(val);
                        setErrors(prev => ({ ...prev, description: null }));
                      }}
                    />
                    <CommandList>
                      <CommandEmpty className="py-2 px-4 text-sm">
                        No description found.
                        {description && (
                          <div className="mt-2 pt-2 border-t text-muted-foreground uppercase text-xs font-semibold">
                            Will create new: "{description}"
                          </div>
                        )}
                      </CommandEmpty>
                      <CommandGroup>
                        {descriptionsList.map((desc) => (
                          <CommandItem
                            key={desc.description_sid}
                            value={desc.description_name}
                            onSelect={(currentValue) => {
                              setDescription(currentValue)
                              setOpenCombobox(false)
                            }}
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                description.toLowerCase() === desc.description_name.toLowerCase() ? "opacity-100" : "opacity-0"
                              )}
                            />
                            {desc.description_name}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
              {errors.description && <p className="text-[11px] text-red-500 font-medium mt-1">{errors.description}</p>}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes (Optional)</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Additional details..."
              className="min-h-[80px] resize-none"
            />
          </div>

          <DialogFooter className="sm:justify-between items-center gap-3 pt-4 border-t">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="fast-entry"
                checked={fastEntry}
                onCheckedChange={(checked: boolean | "indeterminate") => setFastEntry(!!checked)}
              />
              <Label htmlFor="fast-entry" className="text-sm font-normal cursor-pointer">
                Fast Entry (keep open)
              </Label>
            </div>
            <div className="flex gap-3">
              <Button variant="ghost" type="button" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">
                Save Transaction
              </Button>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
