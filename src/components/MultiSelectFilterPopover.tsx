import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { Button } from './ui/button';
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

export interface FilterOption {
  value: string;
  label: string;
  subLabel?: string;
}

export interface MultiSelectFilterPopoverProps {
  options: FilterOption[];
  selectedValues: string[];
  onChange: (selectedValues: string[]) => void;
  allLabel: string;
  searchPlaceholder?: string;
  emptyText?: string;
  formatTriggerLabel?: (selectedCount: number) => string;
  triggerClassName?: string;
  contentClassName?: string;
  align?: 'start' | 'center' | 'end';
}

export function MultiSelectFilterPopover({
  options,
  selectedValues,
  onChange,
  allLabel,
  searchPlaceholder = 'Search...',
  emptyText = 'No items found.',
  formatTriggerLabel,
  triggerClassName,
  contentClassName = 'w-[250px] p-0',
  align = 'start',
}: MultiSelectFilterPopoverProps) {
  const isAllSelected = selectedValues.length === 0;

  const handleSelectAll = () => {
    onChange([]);
  };

  const handleToggleOption = (value: string) => {
    if (selectedValues.includes(value)) {
      onChange(selectedValues.filter(v => v !== value));
    } else {
      onChange([...selectedValues, value]);
    }
  };

  const defaultTriggerLabel = isAllSelected
    ? allLabel
    : formatTriggerLabel
      ? formatTriggerLabel(selectedValues.length)
      : `${selectedValues.length} selected`;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          className={cn(
            'h-9 justify-between bg-white border-slate-200 hover:bg-slate-50 font-normal',
            selectedValues.length > 0 && 'border-teal-500 text-teal-700 bg-teal-50/50',
            triggerClassName
          )}
        >
          <span className="truncate">{defaultTriggerLabel}</span>
          <ChevronsUpDown className="ml-1 h-3.5 w-3.5 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className={cn('p-0 rounded-2xl border border-slate-200/80 bg-white shadow-xl overflow-hidden', contentClassName)} align={align}>
        <Command>
          <CommandInput placeholder={searchPlaceholder} />
          <CommandList>
            <CommandEmpty>{emptyText}</CommandEmpty>
            <CommandGroup>
              <CommandItem onSelect={handleSelectAll} className="cursor-pointer">
                <div
                  className={cn(
                    'mr-2.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-[4px] border transition-all',
                    isAllSelected
                      ? 'bg-teal-600 border-teal-600 text-white shadow-2xs'
                      : 'border-slate-300 bg-white'
                  )}
                >
                  {isAllSelected && <Check className="h-3 w-3 stroke-[3] text-white" />}
                </div>
                <span className="font-medium text-slate-800">{allLabel}</span>
              </CommandItem>
              {options.map(opt => {
                const isSelected = selectedValues.includes(opt.value);
                return (
                  <CommandItem
                    key={opt.value}
                    onSelect={() => handleToggleOption(opt.value)}
                    className="cursor-pointer"
                  >
                    <div
                      className={cn(
                        'mr-2.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-[4px] border transition-all',
                        isSelected
                          ? 'bg-teal-600 border-teal-600 text-white shadow-2xs'
                          : 'border-slate-300 bg-white'
                      )}
                    >
                      {isSelected && <Check className="h-3 w-3 stroke-[3] text-white" />}
                    </div>
                    <span className={cn('text-slate-700', isSelected && 'font-medium text-slate-900')}>
                      {opt.label} {opt.subLabel ? <span className="text-xs text-slate-400 font-mono">({opt.subLabel})</span> : ''}
                    </span>
                  </CommandItem>
                );
              })}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
