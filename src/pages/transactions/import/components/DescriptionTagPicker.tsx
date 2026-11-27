import { memo, useMemo, useState } from 'react';
import { Check, ChevronsUpDown, Plus } from 'lucide-react';
import type { Description } from '@/types';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';

interface DescriptionTagPickerProps {
  value: string;
  descriptions: Description[];
  onChange: (nextValue: string) => void;
  placeholder?: string;
  triggerClassName?: string;
  hasError?: boolean;
  ariaLabel?: string;
}

export const DescriptionTagPicker = memo(function DescriptionTagPicker({
  value,
  descriptions,
  onChange,
  placeholder = 'Select description',
  triggerClassName,
  hasError = false,
  ariaLabel,
}: DescriptionTagPickerProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');

  const lowerNames = useMemo(
    () => new Set(descriptions.map(d => d.description_name.toLowerCase())),
    [descriptions],
  );
  const trimmedQuery = query.trim();
  const showCustomOption = Boolean(trimmedQuery) && !lowerNames.has(trimmedQuery.toLowerCase());

  return (
    <Popover
      open={open}
      onOpenChange={nextOpen => {
        setOpen(nextOpen);
        if (nextOpen) setQuery(value);
      }}
    >
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          aria-label={ariaLabel}
          className={cn(
            'w-full justify-between bg-white font-normal border-slate-200 text-left shadow-xs',
            hasError && 'border-rose-400 focus-visible:ring-rose-500',
            triggerClassName,
          )}
        >
          <span className={cn('truncate', !value && 'text-muted-foreground')}>
            {value || placeholder}
          </span>
          <ChevronsUpDown className="ml-1.5 h-3.5 w-3.5 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-[max(var(--radix-popover-trigger-width),220px)] p-0 rounded-2xl border border-slate-200/80 bg-white shadow-xl overflow-hidden pointer-events-auto"
        align="start"
        onWheel={e => e.stopPropagation()}
        onTouchMove={e => e.stopPropagation()}
      >
        <Command>
          <CommandInput
            placeholder="Enter description..."
            value={query}
            onValueChange={setQuery}
          />
          <CommandList>
            <CommandEmpty className="p-2 text-xs text-slate-500">
              {trimmedQuery ? (
                <button
                  type="button"
                  onClick={() => {
                    onChange(trimmedQuery);
                    setOpen(false);
                  }}
                  className="w-full cursor-pointer rounded-xl bg-teal-50 px-2.5 py-2 text-left text-xs font-semibold text-teal-800 hover:bg-teal-100"
                >
                  Use &ldquo;{trimmedQuery}&rdquo;
                </button>
              ) : (
                <span className="block px-2 py-1">No descriptions found.</span>
              )}
            </CommandEmpty>
            <CommandGroup>
              {showCustomOption && (
                <CommandItem
                  value={`__custom__${trimmedQuery}`}
                  onSelect={() => {
                    onChange(trimmedQuery);
                    setOpen(false);
                  }}
                >
                  <Plus className="mr-2 h-3.5 w-3.5 text-teal-600" />
                  Use &ldquo;{trimmedQuery}&rdquo;
                </CommandItem>
              )}
              {descriptions.map(desc => {
                const isSelected = value.toLowerCase() === desc.description_name.toLowerCase();
                return (
                  <CommandItem
                    key={desc.description_sid}
                    value={desc.description_name}
                    onSelect={() => {
                      onChange(desc.description_name);
                      setOpen(false);
                    }}
                  >
                    <Check
                      className={cn('mr-2 h-3.5 w-3.5 text-teal-600', isSelected ? 'opacity-100' : 'opacity-0')}
                    />
                    <span className="truncate">{desc.description_name}</span>
                  </CommandItem>
                );
              })}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
});
