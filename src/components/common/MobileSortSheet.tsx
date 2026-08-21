import { useState, type ReactNode } from 'react';
import { ArrowUpDown, Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

export interface MobileSortOption {
  id: string;
  label: string;
  field: string;
  order: 'asc' | 'desc';
  icon?: ReactNode;
}

export interface MobileSortSheetProps {
  options: MobileSortOption[];
  currentField: string;
  currentOrder: 'asc' | 'desc';
  onSortChange: (field: string, order: 'asc' | 'desc') => void;
  buttonClassName?: string;
  ariaLabel?: string;
  title?: string;
}

export function MobileSortSheet({
  options,
  currentField,
  currentOrder,
  onSortChange,
  buttonClassName,
  ariaLabel = 'Sort options',
  title = 'Sort by',
}: MobileSortSheetProps) {
  const [sheetOpen, setSheetOpen] = useState(false);

  const handleSelectOption = (option: MobileSortOption) => {
    onSortChange(option.field, option.order);
    setSheetOpen(false);
  };

  return (
    <>
      <Button
        type="button"
        variant="outline"
        onClick={() => setSheetOpen(true)}
        className={`relative shrink-0 h-10 px-3 rounded-xl border-slate-200 text-slate-700 hover:text-teal-700 hover:bg-teal-50 flex items-center justify-center ${buttonClassName || ''}`}
        aria-label={ariaLabel}
      >
        <ArrowUpDown className="w-4 h-4 text-slate-500" />
      </Button>

      {/* Mobile Sliding Bottom Sheet Modal */}
      {sheetOpen && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
            onClick={() => setSheetOpen(false)}
          />

          {/* Sheet Container */}
          <div className="relative z-10 bg-white rounded-t-[28px] border-t border-slate-200 shadow-2xl p-5 pb-[calc(1.5rem+env(safe-area-inset-bottom,0px))] max-h-[85vh] overflow-y-auto animate-in slide-in-from-bottom duration-250 flex flex-col gap-4">
            {/* Drag Handle */}
            <div className="w-10 h-1 bg-slate-300 rounded-full mx-auto -mt-1 mb-0.5" />

            {/* Header */}
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-teal-50 text-teal-600 rounded-lg">
                  <ArrowUpDown className="w-4 h-4" />
                </div>
                <h3 className="font-bold text-base text-slate-800">{title}</h3>
              </div>
              <button
                type="button"
                onClick={() => setSheetOpen(false)}
                aria-label="Close sort menu"
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Options List */}
            <div className="space-y-1.5 py-1">
              {options.map((opt) => {
                const isSelected =
                  opt.field.toLowerCase() === currentField.toLowerCase() &&
                  opt.order === currentOrder;

                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => handleSelectOption(opt)}
                    className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl border text-sm transition-all text-left ${
                      isSelected
                        ? 'bg-teal-50/80 border-teal-200 text-teal-900 font-semibold shadow-xs'
                        : 'bg-slate-50/70 hover:bg-slate-100/80 border-slate-200/60 text-slate-700 font-medium'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      {opt.icon}
                      <span>{opt.label}</span>
                    </div>
                    {isSelected && (
                      <Check className="w-4 h-4 text-teal-600 stroke-[2.5]" />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Cancel Button */}
            <div className="pt-2 border-t border-slate-100 flex justify-end">
              <Button
                variant="ghost"
                type="button"
                onClick={() => setSheetOpen(false)}
                className="w-full text-slate-500 hover:text-slate-700 h-10 font-medium text-sm rounded-xl"
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
