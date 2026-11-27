import type { StatementColumnMapping } from '@/types';
import type { AmountMappingMode, EditorColumnMapping } from '../editor/useImportProfileEditor';
import { ChevronDown } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';

interface ColumnMappingPanelProps {
  headers: string[];
  mapping: EditorColumnMapping;
  onMappingChange: (mapping: EditorColumnMapping) => void;
  amountMode?: AmountMappingMode;
  onAmountModeChange?: (mode: AmountMappingMode) => void;
  autoMappedFields?: Array<keyof StatementColumnMapping>;
  activeField?: keyof StatementColumnMapping;
  onActiveFieldChange?: (field: keyof StatementColumnMapping | undefined) => void;
}

const requiredFields: Array<[keyof StatementColumnMapping, string, boolean]> = [
  ['date', 'Transaction date', true],
  ['notes', 'Notes / narration', false],
  ['description', 'Description / tag', false],
];
const singleAmountFields: Array<[keyof StatementColumnMapping, string, boolean]> = [
  ['amount', 'Signed amount', true],
];
const splitAmountFields: Array<[keyof StatementColumnMapping, string, boolean]> = [
  ['debit', 'Debit / withdrawal', false],
  ['credit', 'Credit / deposit', false],
];
const additionalFields: Array<[keyof StatementColumnMapping, string, boolean]> = [
  ['balance', 'Balance', false],
];

export function ColumnMappingPanel({
  headers,
  mapping,
  onMappingChange,
  amountMode = 'split',
  onAmountModeChange,
  autoMappedFields = [],
  activeField,
  onActiveFieldChange,
}: ColumnMappingPanelProps) {
  const allFields = requiredFields.concat(singleAmountFields, splitAmountFields, additionalFields);

  const renderField = ([field, label, required]: [keyof StatementColumnMapping, string, boolean]) => {
    const isAuto = autoMappedFields.includes(field) && mapping[field] !== undefined;
    const isActive = activeField === field;
    const needsManualAttention = required && !isAuto && mapping[field] === undefined;
    return (
      <div key={field} className="space-y-1.5">
        <div className="flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={() => onActiveFieldChange?.(isActive ? undefined : field)}
            aria-pressed={isActive}
            className={`text-left text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 rounded ${
              isActive ? 'text-teal-700 underline underline-offset-4' : 'text-slate-600 hover:text-teal-700'
            }`}
          >
            {label}{required ? ' *' : ''}
          </button>
          {needsManualAttention && (
            <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-medium text-amber-800 border border-amber-200">
              Needs review
            </span>
          )}
        </div>
        <Select
          value={mapping[field] !== undefined ? String(mapping[field]) : '__none__'}
          onValueChange={value => onMappingChange({ ...mapping, [field]: value === '__none__' ? undefined : Number(value) })}
        >
          <SelectTrigger
            id={`mapping-${field}`}
            aria-label={`${label}${required ? ' *' : ''}`}
            className={cn(
              'h-10 w-full rounded-xl bg-white text-sm text-slate-900 shadow-xs',
              isActive ? 'border-teal-600 ring-[3px] ring-teal-500/20' : 'border-slate-200'
            )}
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="rounded-xl">
            <SelectItem value="__none__">Not mapped</SelectItem>
            {headers.map((header, index) => (
              <SelectItem key={`${header}-${index}`} value={String(index)}>
                {header || `Column ${index + 1}`}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    );
  };

  const amountFields = amountMode === 'single' ? singleAmountFields : splitAmountFields;
  const autoMappedCount = autoMappedFields.filter(field => mapping[field] !== undefined).length;
  const detectedExtrasCount = additionalFields.filter(([field]) => autoMappedFields.includes(field) && mapping[field] !== undefined).length;

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm" aria-labelledby="column-mapping-heading">
      <h2 id="column-mapping-heading" className="text-sm font-semibold text-slate-900">Column mapping</h2>
      <p className="mt-1 text-xs text-slate-600">
        {autoMappedCount > 0
          ? `${autoMappedCount} ${autoMappedCount === 1 ? 'field' : 'fields'} auto-mapped, please review.`
          : 'Click a field to pick its column in the preview, or choose from the dropdown.'}
      </p>
      {activeField && (
        <p className="mt-3 rounded-lg border border-teal-200 bg-teal-50 px-3 py-2 text-xs font-medium text-teal-900" role="status">
          Click a column in the preview for {allFields.find(([field]) => field === activeField)?.[1].toLowerCase()}.
        </p>
      )}
      <div className="mt-4 space-y-3.5">{requiredFields.map(renderField)}</div>
      <div className="mt-4 border-t border-slate-100 pt-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Amount mapping</p>
        <div
          role="radiogroup"
          aria-label="Amount mapping mode"
          className="mt-2 grid grid-cols-2 gap-1 rounded-xl bg-slate-100 p-1"
        >
          <button
            type="button"
            role="radio"
            aria-checked={amountMode === 'split'}
            onClick={() => onAmountModeChange?.('split')}
            className={`rounded-lg px-2.5 py-1.5 text-xs font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 ${
              amountMode === 'split' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Separate debit / credit
          </button>
          <button
            type="button"
            role="radio"
            aria-checked={amountMode === 'single'}
            onClick={() => onAmountModeChange?.('single')}
            className={`rounded-lg px-2.5 py-1.5 text-xs font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 ${
              amountMode === 'single' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Single signed amount
          </button>
        </div>
        <div className="mt-3.5 space-y-3.5">{amountFields.map(renderField)}</div>
      </div>
      <details className="mt-4 border-t border-slate-100 pt-3">
        <summary className="flex cursor-pointer list-none items-center gap-1 text-xs font-medium text-slate-700 hover:text-teal-800">
          <ChevronDown className="h-3.5 w-3.5" />
          Additional mappings{detectedExtrasCount > 0 ? ` (${detectedExtrasCount} detected)` : ''}
        </summary>
        <div className="mt-3 space-y-3">{additionalFields.map(renderField)}</div>
      </details>
    </section>
  );
}
