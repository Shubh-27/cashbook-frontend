import { memo } from 'react';
import type { Description, StatementImportRow } from '@/types';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { DescriptionTagPicker } from './DescriptionTagPicker';
import { getRowType, splitRowIssues, type IndexedImportRow } from '../utils';

interface ImportReviewCardProps {
  row: StatementImportRow;
  index: number;
  descriptions: Description[];
  batchTag: string;
  onUpdateRow: (index: number, field: keyof StatementImportRow, value: string | boolean) => void;
  onSetRowType: (index: number, nextType: 'debit' | 'credit') => void;
  onSetRowAmount: (index: number, rawValue: string) => void;
}

const ImportReviewCard = memo(function ImportReviewCard({
  row,
  index,
  descriptions,
  batchTag,
  onUpdateRow,
  onSetRowType,
  onSetRowAmount,
}: ImportReviewCardProps) {
  const fieldIssues = splitRowIssues(row.issues);
  const rowType = getRowType(row);
  const isDuplicate = row.status === 'exact_duplicate' || row.status === 'possible_duplicate';

  return (
    <div
      className={`flex flex-col gap-3 rounded-2xl border p-4 shadow-sm ${
        row.issues.length ? 'border-rose-200 bg-rose-50/40' : 'border-slate-200/80 bg-white'
      }`}
    >
      <div className="flex items-center justify-between gap-2">
        <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer">
          <Checkbox
            checked={row.include}
            onCheckedChange={checked => onUpdateRow(index, 'include', checked === true)}
          />
          <span>Row {row.row_number}</span>
        </label>
        <div className="flex items-center gap-1.5">
          {isDuplicate && (
            <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-semibold text-amber-800">
              {row.status === 'exact_duplicate' ? 'Duplicate' : 'Possible duplicate'}
            </span>
          )}
          <span
            className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${
              row.issues.length
                ? 'bg-rose-100 text-rose-700'
                : row.include
                  ? 'bg-emerald-50 text-emerald-700'
                  : 'bg-slate-100 text-slate-500'
            }`}
          >
            {row.issues.length ? 'Needs attention' : row.include ? 'Ready' : 'Excluded'}
          </span>
        </div>
      </div>

      <div className="space-y-1">
        <Label className="text-[11px] font-semibold text-slate-500">Notes</Label>
        <Input
          value={row.notes ?? ''}
          onChange={e => onUpdateRow(index, 'notes', e.target.value)}
          placeholder="Notes (optional)"
          className="h-10 rounded-xl bg-slate-50/70 text-sm text-slate-700"
        />
      </div>

      <div className="space-y-1">
        <Label className="text-[11px] font-semibold text-slate-500">Description</Label>
        <div className="flex items-center gap-1.5">
          <div className="min-w-0 flex-1">
            <DescriptionTagPicker
              value={row.description ?? ''}
              descriptions={descriptions}
              onChange={val => onUpdateRow(index, 'description', val)}
              hasError={Boolean(fieldIssues.description)}
              triggerClassName="h-10 rounded-xl text-sm"
              ariaLabel={`Description for row ${row.row_number}`}
            />
          </div>
          {batchTag && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onUpdateRow(index, 'description', batchTag)}
              title={`Set description to "${batchTag}"`}
              aria-label={`Apply "${batchTag}" to row ${row.row_number}`}
              className="h-10 shrink-0 rounded-xl border-teal-200 bg-teal-50/70 px-3 text-xs font-medium text-teal-700 hover:bg-teal-100 hover:text-teal-800"
            >
              Set
            </Button>
          )}
        </div>
        <p
          className={`h-[14px] text-[11px] font-medium text-rose-600 leading-[14px] truncate transition-opacity duration-150 ${
            fieldIssues.description ? 'opacity-100' : 'opacity-0 select-none pointer-events-none'
          }`}
        >
          {fieldIssues.description || '\u00A0'}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-3">
        <div className="space-y-1">
          <Label className="text-[11px] font-semibold text-slate-500">Date</Label>
          <Input
            value={row.transaction_date?.slice(0, 10) ?? ''}
            onChange={e =>
              onUpdateRow(index, 'transaction_date', e.target.value ? `${e.target.value}T00:00:00.000Z` : '')
            }
            type="date"
            className={`h-10 rounded-xl ${fieldIssues.date ? 'border-rose-400 focus-visible:ring-rose-500' : ''}`}
          />
          <p
            className={`h-[14px] text-[11px] font-medium text-rose-600 leading-[14px] truncate transition-opacity duration-150 ${
              fieldIssues.date ? 'opacity-100' : 'opacity-0 select-none pointer-events-none'
            }`}
          >
            {fieldIssues.date || '\u00A0'}
          </p>
        </div>

        <div className="space-y-1">
          <Label className="text-[11px] font-semibold text-slate-500">Type</Label>
          <div className="inline-grid h-10 w-full grid-cols-2 rounded-xl border border-slate-200 bg-slate-100/70 p-0.5">
            <button
              type="button"
              onClick={() => onSetRowType(index, 'debit')}
              className={`rounded-lg px-2 text-xs font-semibold transition-colors ${
                rowType === 'debit'
                  ? 'bg-rose-50 text-rose-700 shadow-2xs ring-1 ring-rose-200'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Debit
            </button>
            <button
              type="button"
              onClick={() => onSetRowType(index, 'credit')}
              className={`rounded-lg px-2 text-xs font-semibold transition-colors ${
                rowType === 'credit'
                  ? 'bg-emerald-50 text-emerald-700 shadow-2xs ring-1 ring-emerald-200'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Credit
            </button>
          </div>
          <p className="h-[14px] text-[11px] leading-[14px] opacity-0 select-none pointer-events-none">{'\u00A0'}</p>
        </div>

        <div className="space-y-1">
          <Label className="text-[11px] font-semibold text-slate-500">Amount</Label>
          <Input
            value={(rowType === 'credit' ? row.credit : row.debit) ?? ''}
            onChange={e => onSetRowAmount(index, e.target.value)}
            type="number"
            min="0"
            placeholder="0.00"
            className={`h-10 rounded-xl text-right font-mono tabular-nums ${fieldIssues.amount ? 'border-rose-400 focus-visible:ring-rose-500' : ''}`}
          />
          <p
            className={`h-[14px] text-[11px] font-medium text-rose-600 text-right leading-[14px] truncate transition-opacity duration-150 ${
              fieldIssues.amount ? 'opacity-100' : 'opacity-0 select-none pointer-events-none'
            }`}
          >
            {fieldIssues.amount || '\u00A0'}
          </p>
        </div>
      </div>
    </div>
  );
});

interface ImportReviewCardFeedProps {
  rows: IndexedImportRow[];
  descriptions: Description[];
  batchTag: string;
  onUpdateRow: (index: number, field: keyof StatementImportRow, value: string | boolean) => void;
  onSetRowType: (index: number, nextType: 'debit' | 'credit') => void;
  onSetRowAmount: (index: number, rawValue: string) => void;
}

export function ImportReviewCardFeed({
  rows,
  descriptions,
  batchTag,
  onUpdateRow,
  onSetRowType,
  onSetRowAmount,
}: ImportReviewCardFeedProps) {
  return (
    <div className="flex flex-col gap-3">
      {rows.length === 0 ? (
        <div className="rounded-2xl border border-slate-200/80 bg-white px-4 py-10 text-center text-xs text-slate-500 shadow-sm">
          No rows match this filter.
        </div>
      ) : (
        rows.map(({ row, index }) => (
          <ImportReviewCard
            key={row.row_number}
            row={row}
            index={index}
            descriptions={descriptions}
            batchTag={batchTag}
            onUpdateRow={onUpdateRow}
            onSetRowType={onSetRowType}
            onSetRowAmount={onSetRowAmount}
          />
        ))
      )}
    </div>
  );
}
