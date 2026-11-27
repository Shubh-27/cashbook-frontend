import { useMemo, type Dispatch } from 'react';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { statementDateFormats } from '@/lib/statement-import';
import { ColumnMappingPanel } from './ColumnMappingPanel';
import { ProfileRuleSummary } from './ProfileRuleSummary';
import type { SpreadsheetColumn, SpreadsheetRow } from './StatementSpreadsheetGrid';
import { isProfileValid } from '../editor/profileValidity';
import { detectDateFormat, formatSampleDatePreview } from '../editor/suggestMapping';
import type { EditorAction, EditorState } from '../editor/useImportProfileEditor';

export interface EditorSetupPanelProps {
  state: EditorState;
  dispatch: Dispatch<EditorAction>;
  rows: SpreadsheetRow[];
  columns: SpreadsheetColumn[];
  showErrors: boolean;
}

export function EditorSetupPanel({ state, dispatch, rows, columns, showErrors }: EditorSetupPanelProps) {
  const validity = useMemo(() => isProfileValid(state, state.preview), [state]);
  const mappedFields = useMemo(
    () => Object.entries(state.columnMap).filter(([, column]) => column !== undefined).map(([field]) => field),
    [state.columnMap]
  );

  const dateSamples = useMemo(() => {
    if (state.columnMap.date === undefined || state.headerRow === undefined) return [];
    const headerRow = state.headerRow;
    const colKey = `c${state.columnMap.date}`;
    return rows
      .filter(r => !r.isDivider && !r.isPreHeaderDivider && r.rowNumber > headerRow && (state.endRow === undefined || r.rowNumber <= state.endRow))
      .map(r => String(r[colKey] ?? '').trim())
      .filter(Boolean);
  }, [rows, state.columnMap.date, state.headerRow, state.endRow]);

  const dateDetection = useMemo(() => detectDateFormat(dateSamples), [dateSamples]);
  const sampleFormatted = useMemo(
    () => formatSampleDatePreview(dateDetection.sampleRaw, state.dateFormat),
    [dateDetection.sampleRaw, state.dateFormat]
  );
  const selectedFormatInfo = statementDateFormats.find(item => item.value === state.dateFormat);

  const hasAmount = state.columnMap.amount !== undefined || state.columnMap.debit !== undefined || state.columnMap.credit !== undefined;
  const checklist = [
    { label: 'Profile name', done: Boolean(state.profileName?.trim()) },
    { label: 'Date column', done: state.columnMap.date !== undefined },
    { label: 'Amount mapping', done: hasAmount },
  ];
  const isAmbiguous = Boolean(state.preview?.has_ambiguous_date_format || dateDetection.ambiguous);
  if (isAmbiguous) {
    checklist.push({ label: 'Date format', done: Boolean(state.dateFormat) });
  }

  return (
    <aside className="min-w-0 space-y-4 lg:sticky lg:top-4">
      <ColumnMappingPanel
        headers={columns.map(column => column.name)}
        mapping={state.columnMap}
        amountMode={state.amountMode ?? 'split'}
        onAmountModeChange={mode => dispatch({ type: 'amount-mode', mode })}
        autoMappedFields={state.autoMappedFields ?? []}
        activeField={state.activeField}
        onActiveFieldChange={field => dispatch({ type: 'active', field })}
        onMappingChange={next => {
          const field = Object.keys(next).find(key => next[key as keyof typeof next] !== state.columnMap[key as keyof typeof state.columnMap]);
          if (field) dispatch({ type: 'map', field: field as keyof typeof state.columnMap, column: next[field as keyof typeof next] });
        }}
      />

      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm space-y-1.5">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1">
            <Label htmlFor="date-format" className="text-xs font-semibold text-slate-600">Date format</Label>
            {isAmbiguous && <span aria-hidden="true" className="text-xs text-rose-600">*</span>}
          </div>
          {dateDetection.confirmed && state.dateFormat && (
            <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-medium text-emerald-800 border border-emerald-200">
              Confirmed from sample
            </span>
          )}
        </div>
        <Select
          value={state.dateFormat || '__none__'}
          onValueChange={value => dispatch({ type: 'date-format', value: value === '__none__' ? undefined : value })}
        >
          <SelectTrigger id="date-format" aria-label="Date format" className="h-10 w-full rounded-xl border-slate-200 bg-white text-sm text-slate-900 shadow-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="rounded-xl">
            <SelectItem value="__none__">Choose format</SelectItem>
            {statementDateFormats.map(option => (
              <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        {selectedFormatInfo && (
          <p className="text-xs text-slate-500">Example: {selectedFormatInfo.example}</p>
        )}
        {dateDetection.sampleRaw && sampleFormatted && (
          <p className="text-xs text-slate-600">
            Sample: <span className="font-mono text-slate-900">{dateDetection.sampleRaw}</span> → <span className="font-medium text-teal-700">{sampleFormatted}</span>
          </p>
        )}
        {isAmbiguous && !state.dateFormat && (
          <p className="text-xs text-amber-800">Ambiguous, please choose a date format before saving.</p>
        )}
      </section>

      <ProfileRuleSummary
        mappedFields={mappedFields}
        problems={validity.problems}
        checklist={checklist}
        showErrors={showErrors}
      />
    </aside>
  );
}
