import type { ReactNode, Ref } from 'react';
import { cn } from '@/lib/utils';

export interface SegmentedControlOption<T extends string | number> {
  value: T;
  label: ReactNode;
  activeClassName?: string;
  inactiveClassName?: string;
  disabled?: boolean;
  buttonRef?: Ref<HTMLButtonElement>;
}

export interface SegmentedControlProps<T extends string | number> {
  value: T;
  onChange: (value: T) => void;
  options: SegmentedControlOption<T>[];
  className?: string;
  buttonClassName?: string;
  disabled?: boolean;
  name?: string;
  'aria-label'?: string;
}

export function SegmentedControl<T extends string | number>({
  value,
  onChange,
  options,
  className,
  buttonClassName,
  disabled = false,
  name,
  'aria-label': ariaLabel,
}: SegmentedControlProps<T>) {
  return (
    <div
      role="radiogroup"
      aria-label={ariaLabel || name}
      className={cn(
        'flex rounded-xl overflow-hidden border border-slate-200 p-1 bg-slate-100/70 h-11',
        disabled && 'opacity-60 pointer-events-none',
        className
      )}
    >
      {options.map((option) => {
        const isSelected = option.value === value;
        const isDisabled = disabled || option.disabled;

        const defaultActiveStyle = 'bg-white text-slate-800 shadow-sm border border-slate-200/80';
        const defaultInactiveStyle = 'text-slate-500 hover:text-slate-800';

        return (
          <button
            key={String(option.value)}
            ref={option.buttonRef}
            type="button"
            role="radio"
            aria-checked={isSelected}
            disabled={isDisabled}
            onClick={() => onChange(option.value)}
            className={cn(
              'flex-1 text-sm font-semibold rounded-lg transition-all outline-none active:scale-95 flex items-center justify-center gap-1.5',
              isSelected
                ? option.activeClassName || defaultActiveStyle
                : option.inactiveClassName || defaultInactiveStyle,
              buttonClassName
            )}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
