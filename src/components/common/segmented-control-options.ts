import type { SegmentedControlOption } from './SegmentedControl';

/** Pre-configured option presets for standard Transaction Type (Expense/Income) */
export const TRANSACTION_TYPE_OPTIONS: SegmentedControlOption<'DEBIT' | 'CREDIT'>[] = [
  {
    value: 'DEBIT',
    label: 'Expense (Debit)',
    activeClassName: 'bg-rose-50 text-rose-700 shadow-sm border border-rose-200',
    inactiveClassName: 'text-slate-500 hover:text-slate-800',
  },
  {
    value: 'CREDIT',
    label: 'Income (Credit)',
    activeClassName: 'bg-teal-50 text-teal-700 shadow-sm border border-teal-200',
    inactiveClassName: 'text-slate-500 hover:text-slate-800',
  },
];
