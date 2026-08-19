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

export interface DescriptionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isEditing: boolean;
  value: string;
  onChange: (value: string) => void;
  onSubmit: (e: FormEvent) => void;
  error?: string | null;
}

export function DescriptionModal({
  open,
  onOpenChange,
  isEditing,
  value,
  onChange,
  onSubmit,
  error,
}: DescriptionModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] sm:max-w-md max-h-[92vh] overflow-y-auto rounded-3xl p-5 sm:p-6 shadow-2xl border border-slate-200/80 bg-white">
        <DialogHeader>
          <DialogTitle className="text-lg md:text-xl font-bold text-slate-900">
            {isEditing ? 'Edit Description' : 'New Description'}
          </DialogTitle>
          <DialogDescription className="text-xs md:text-sm text-slate-500">
            {isEditing
              ? 'Update description tag name across your transactions.'
              : 'Create a reusable tag to categorize your transactions.'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit} noValidate className="flex flex-col gap-2.5 py-1">
          <div className="space-y-1">
            <Label htmlFor="desc-name" className="text-xs font-semibold text-slate-600">
              Description Name
            </Label>
            <Input
              id="desc-name"
              type="text"
              value={value}
              onChange={e => onChange(e.target.value)}
              className={cn(
                'h-11 rounded-xl bg-white border-slate-200 text-sm shadow-xs',
                error && 'border-red-500 focus-visible:ring-red-500'
              )}
              placeholder={isEditing ? undefined : 'e.g. Salary, Rent, Groceries'}
            />
            <p className={cn(
              'text-[11px] font-medium text-red-500 min-h-[16px] leading-tight transition-opacity duration-150',
              error ? 'opacity-100' : 'opacity-0 select-none pointer-events-none'
            )}>
              {error || '\u00A0'}
            </p>
          </div>
          <DialogFooter className="flex flex-row items-center justify-end gap-2 pt-3 border-t mt-1">
            <Button variant="ghost" type="button" onClick={() => onOpenChange(false)} className="rounded-xl flex-1 sm:flex-none">
              Cancel
            </Button>
            <Button type="submit" className="bg-teal-600 hover:bg-teal-700 text-white rounded-xl flex-1 sm:flex-none font-semibold shadow-sm">
              {isEditing ? 'Save Changes' : 'Add Description'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
