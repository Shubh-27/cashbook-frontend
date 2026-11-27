import { memo, type RefObject } from 'react';
import type { Description, StatementImportRow } from '@/types';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { DescriptionTagPicker } from './DescriptionTagPicker';
import { getRowType, splitRowIssues, type IndexedImportRow } from '../utils';

interface ImportReviewTableRowProps {
  row: StatementImportRow;
  index: number;
  descriptions: Description[];
  batchTag: string;
  onUpdateRow: (index: number, field: keyof StatementImportRow, value: string | boolean) => void;
  onSetRowType: (index: number, nextType: 'debit' | 'credit') => void;
  onSetRowAmount: (index: number, rawValue: string) => void;
}

const ImportReviewTableRow = memo(function ImportReviewTableRow({
  row,
  index,
  descriptions,
  batchTag,
  onUpdateRow,
  onSetRowType,
  onSetRowAmount,
}: ImportReviewTableRowProps) {
  const fieldIssues = splitRowIssues(row.issues);
  const rowType = getRowType(row);
  const isDuplicate = row.status === 'exact_duplicate' || row.status === 'possible_duplicate';

  return (
    <tr
      className={
        row.issues.length
          ? 'border-t border-rose-100 bg-rose-50/40'
          : isDuplicate
            ? 'border-t border-amber-100 bg-amber-50/30'
            : 'border-t border-slate-100'
      }
    >
      <td className="px-2.5 pt-3.5 pb-2 text-center align-top">
        <div className="flex flex-col items-center gap-1">
          <Checkbox
            checked={row.include}
            onCheckedChange={checked => onUpdateRow(index, 'include', checked === true)}
          />
          {isDuplicate && (
            <span
              title={
                row.status === 'exact_duplicate'
                  ? 'Matches an existing transaction — check to allow import'
                  : 'Possible duplicate'
              }
              className="rounded bg-amber-100 px-1 py-0.5 text-[9px] font-semibold leading-none text-amber-800"
            >
              Dup
            </span>
          )}
        </div>
      </td>
      <td className="px-2.5 pt-2 pb-1 align-top">
        <Input
          value={row.transaction_date?.slice(0, 10) ?? ''}
          onChange={e =>
            onUpdateRow(index, 'transaction_date', e.target.value ? `${e.target.value}T00:00:00.000Z` : '')
          }
          type="date"
          className={`h-8 w-full ${fieldIssues.date ? 'border-rose-400 focus-visible:ring-rose-500' : ''}`}
        />
        <p
          title={fieldIssues.date || undefined}
          className={`mt-0.5 h-[14px] truncate text-[11px] font-medium text-rose-600 leading-[14px] transition-opacity duration-150 ${
            fieldIssues.date ? 'opacity-100' : 'opacity-0 select-none pointer-events-none'
          }`}
        >
          {fieldIssues.date || '\u00A0'}
        </p>
      </td>
      <td className="px-2.5 pt-2 pb-1 align-top">
        <Input
          value={row.notes ?? ''}
          onChange={e => onUpdateRow(index, 'notes', e.target.value)}
          placeholder="Notes (optional)"
          title={row.notes ?? undefined}
          className="h-8 w-full bg-slate-50/60 text-slate-700"
        />
        <p className="mt-0.5 h-[14px] text-[11px] leading-[14px] opacity-0 select-none pointer-events-none">
          {'\u00A0'}
        </p>
      </td>
      <td className="px-2.5 pt-2 pb-1 align-top">
        <div className="flex items-center gap-1.5">
          <div className="min-w-0 flex-1">
            <DescriptionTagPicker
              value={row.description ?? ''}
              descriptions={descriptions}
              onChange={val => onUpdateRow(index, 'description', val)}
              hasError={Boolean(fieldIssues.description)}
              triggerClassName="h-8 rounded-md px-2.5 text-xs"
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
              className="h-8 shrink-0 rounded-md border-teal-200 bg-teal-50/70 px-2 text-xs font-medium text-teal-700 hover:bg-teal-100 hover:text-teal-800"
            >
              Set
            </Button>
          )}
        </div>
        <p
          title={fieldIssues.description || undefined}
          className={`mt-0.5 h-[14px] truncate text-[11px] font-medium text-rose-600 leading-[14px] transition-opacity duration-150 ${
            fieldIssues.description ? 'opacity-100' : 'opacity-0 select-none pointer-events-none'
          }`}
        >
          {fieldIssues.description || '\u00A0'}
        </p>
      </td>
      <td className="px-2.5 pt-2 pb-1 align-top">
        <div className="inline-grid h-8 w-full grid-cols-2 rounded-lg border border-slate-200 bg-slate-100/70 p-0.5">
          <button
            type="button"
            onClick={() => onSetRowType(index, 'debit')}
            className={`rounded-md px-1.5 text-[11px] font-semibold transition-colors ${
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
            className={`rounded-md px-1.5 text-[11px] font-semibold transition-colors ${
              rowType === 'credit'
                ? 'bg-emerald-50 text-emerald-700 shadow-2xs ring-1 ring-emerald-200'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Credit
          </button>
        </div>
      </td>
      <td className="px-2.5 pt-2 pb-1 align-top">
        <Input
          value={(rowType === 'credit' ? row.credit : row.debit) ?? ''}
          onChange={e => onSetRowAmount(index, e.target.value)}
          type="number"
          min="0"
          placeholder="0.00"
          className={`h-8 w-full text-right font-mono tabular-nums ${fieldIssues.amount ? 'border-rose-400 focus-visible:ring-rose-500' : ''}`}
        />
        <p
          title={fieldIssues.amount || undefined}
          className={`mt-0.5 h-[14px] truncate text-[11px] font-medium text-rose-600 text-right leading-[14px] transition-opacity duration-150 ${
            fieldIssues.amount ? 'opacity-100' : 'opacity-0 select-none pointer-events-none'
          }`}
        >
          {fieldIssues.amount || '\u00A0'}
        </p>
      </td>
    </tr>
  );
});

interface OverlayScrollbarProps {
  scrollMetrics: {
    showV: boolean;
    showH: boolean;
    vThumbSize: number;
    vThumbPos: number;
    hThumbSize: number;
    hThumbPos: number;
  };
  draggingAxis: 'v' | 'h' | null;
  isScrolling: boolean;
  isHoveringScrollbar: boolean;
  setIsHoveringScrollbar: (value: boolean) => void;
  startThumbDrag: (axis: 'v' | 'h', event: React.MouseEvent) => void;
  topInset: number;
  bottomInset: number;
  leftInset: number;
  rightInset: number;
}

interface ImportReviewTableProps {
  rows: IndexedImportRow[];
  totalFilteredCount: number;
  descriptions: Description[];
  batchTag: string;
  allFilteredSelected: boolean;
  someFilteredSelected: boolean;
  onToggleSelectAllFiltered: (checked: boolean) => void;
  onUpdateRow: (index: number, field: keyof StatementImportRow, value: string | boolean) => void;
  onSetRowType: (index: number, nextType: 'debit' | 'credit') => void;
  onSetRowAmount: (index: number, rawValue: string) => void;
  tableScrollRef: RefObject<HTMLDivElement | null>;
  overlayScrollbar: OverlayScrollbarProps;
}

export function ImportReviewTable({
  rows,
  totalFilteredCount,
  descriptions,
  batchTag,
  allFilteredSelected,
  someFilteredSelected,
  onToggleSelectAllFiltered,
  onUpdateRow,
  onSetRowType,
  onSetRowAmount,
  tableScrollRef,
  overlayScrollbar,
}: ImportReviewTableProps) {
  const {
    scrollMetrics,
    draggingAxis,
    isScrolling,
    isHoveringScrollbar,
    setIsHoveringScrollbar,
    startThumbDrag,
    topInset,
    bottomInset,
    leftInset,
    rightInset,
  } = overlayScrollbar;

  return (
    <div className="relative overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xs">
      <div ref={tableScrollRef} className="max-h-[55vh] overflow-auto no-scrollbar">
        <table className="w-full table-fixed text-xs">
          <thead className="sticky top-0 z-10 border-b border-slate-200 bg-slate-50 text-slate-600">
            <tr>
              <th className="w-10 p-2.5 text-center font-semibold">
                <Checkbox
                  aria-label="Select all rows"
                  checked={allFilteredSelected ? true : someFilteredSelected ? 'indeterminate' : false}
                  onCheckedChange={checked => onToggleSelectAllFiltered(checked === true)}
                  disabled={totalFilteredCount === 0}
                />
              </th>
              <th className="w-[144px] p-2.5 text-left font-semibold">Date</th>
              <th className="p-2.5 text-left font-semibold">Notes</th>
              <th className="w-[210px] p-2.5 text-left font-semibold">Description</th>
              <th className="w-[116px] p-2.5 text-left font-semibold">Type</th>
              <th className="w-[120px] p-2.5 text-right font-semibold">Amount</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={6} className="p-8 text-center text-slate-500">
                  No rows match this filter.
                </td>
              </tr>
            ) : (
              rows.map(({ row, index }) => (
                <ImportReviewTableRow
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
          </tbody>
        </table>
      </div>

      {scrollMetrics.showV && (
        <div
          aria-hidden="true"
          style={{ top: `${topInset}px`, bottom: `${bottomInset}px` }}
          className={`pointer-events-none absolute right-1 z-20 w-1 transition-opacity duration-200 ${
            isScrolling || draggingAxis === 'v' || isHoveringScrollbar ? 'opacity-100' : 'opacity-0'
          }`}
        >
          <div
            onMouseDown={e => startThumbDrag('v', e)}
            onMouseEnter={() => setIsHoveringScrollbar(true)}
            onMouseLeave={() => setIsHoveringScrollbar(false)}
            style={{
              height: `${scrollMetrics.vThumbSize}px`,
              transform: `translateY(${scrollMetrics.vThumbPos}px)`,
            }}
            className={`pointer-events-auto w-full cursor-pointer rounded-full transition-colors ${
              draggingAxis === 'v' ? 'bg-teal-600/80' : 'bg-slate-500/40 hover:bg-teal-600/70'
            }`}
          />
        </div>
      )}

      {scrollMetrics.showH && (
        <div
          aria-hidden="true"
          style={{ left: `${leftInset}px`, right: `${rightInset}px` }}
          className={`pointer-events-none absolute bottom-1 z-20 h-1 transition-opacity duration-200 ${
            isScrolling || draggingAxis === 'h' || isHoveringScrollbar ? 'opacity-100' : 'opacity-0'
          }`}
        >
          <div
            onMouseDown={e => startThumbDrag('h', e)}
            onMouseEnter={() => setIsHoveringScrollbar(true)}
            onMouseLeave={() => setIsHoveringScrollbar(false)}
            style={{
              width: `${scrollMetrics.hThumbSize}px`,
              transform: `translateX(${scrollMetrics.hThumbPos}px)`,
            }}
            className={`pointer-events-auto h-full cursor-pointer rounded-full transition-colors ${
              draggingAxis === 'h' ? 'bg-teal-600/80' : 'bg-slate-500/40 hover:bg-teal-600/70'
            }`}
          />
        </div>
      )}
    </div>
  );
}
