import { useEffect, useMemo, useRef, useState, type Dispatch, type SetStateAction } from 'react';
import { RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useIsMobile } from '@/hooks/useIsMobile';
import { ImportValidationSummary } from './ImportValidationSummary';
import { StatementSpreadsheetGrid, type SpreadsheetColumn, type SpreadsheetRow } from './StatementSpreadsheetGrid';
import { buildParsedRows, classifyRows } from '../editor/parsing';
import type { EditorAction, EditorState } from '../editor/useImportProfileEditor';

export interface EditorGridSectionProps {
  rows: SpreadsheetRow[];
  columns: SpreadsheetColumn[];
  state: EditorState;
  dispatch: Dispatch<EditorAction>;
  selected: number | undefined;
  setSelected: Dispatch<SetStateAction<number | undefined>>;
  mapped: Record<number, string>;
  layoutLocked: boolean;
}

export function EditorGridSection({
  rows,
  columns,
  state,
  dispatch,
  selected,
  setSelected,
  mapped,
  layoutLocked,
}: EditorGridSectionProps) {
  const isMobile = useIsMobile();
  const mobileListRef = useRef<HTMLDivElement>(null);
  const [focusRow, setFocusRow] = useState<number>();
  const [focusNonce, setFocusNonce] = useState(0);
  const [filterInvalid, setFilterInvalid] = useState(false);

  useEffect(() => {
    if (state.preview?.detected_header_row) {
      setFocusRow(state.preview.detected_header_row);
      setFocusNonce(n => n + 1);
    }
    setFilterInvalid(false);
  }, [state.previewNonce, state.preview?.detected_header_row]);

  const classified = useMemo(
    () => classifyRows(rows, state.headerRow, state.endRow, state.columnMap, state.dateFormat),
    [rows, state.headerRow, state.endRow, state.columnMap, state.dateFormat]
  );

  const rowReasons = useMemo(() => {
    const map: Record<number, string> = {};
    for (const item of classified.rows) {
      if (item.reason && item.status !== 'valid' && item.status !== 'excluded') {
        map[item.rowNumber] = item.reason;
      }
    }
    return map;
  }, [classified.rows]);

  const invalidCount = classified.counts.badDate + classified.counts.blankDate + classified.counts.badAmount + classified.counts.bothDebitAndCredit;
  const hasCoreMappings = state.columnMap.date !== undefined && (state.columnMap.amount !== undefined || state.columnMap.debit !== undefined || state.columnMap.credit !== undefined);

  useEffect(() => {
    if (invalidCount === 0 && filterInvalid) {
      setFilterInvalid(false);
    }
  }, [invalidCount, filterInvalid]);

  const parsedRows = useMemo(
    () => buildParsedRows(rows, state.headerRow, state.endRow, state.columnMap, state.dateFormat, 5),
    [rows, state.headerRow, state.endRow, state.columnMap, state.dateFormat]
  );

  const gridRows = useMemo<SpreadsheetRow[]>(() => {
    if (filterInvalid) {
      return rows.filter(row => row.rowNumber === state.headerRow || Boolean(rowReasons[row.rowNumber]));
    }
    const showPreHeader = state.showPreHeaderRows ?? false;
    const headerRow = state.headerRow;
    const preHeaderRows = headerRow && headerRow > 1 ? rows.filter(row => row.rowNumber < headerRow) : [];
    const bodyRows = headerRow && headerRow > 1 ? rows.filter(row => row.rowNumber >= headerRow) : rows;
    const dividerAfterRow = state.preview?.divider_after_row ?? null;
    const totalRows = state.preview?.total_rows ?? rows.length;

    const firstRows = dividerAfterRow === null ? bodyRows : bodyRows.filter(row => row.rowNumber <= dividerAfterRow);
    const lastRows = dividerAfterRow === null ? [] : bodyRows.filter(row => row.rowNumber > dividerAfterRow);
    const hiddenCount = Math.max(0, totalRows - rows.length);
    const divider: SpreadsheetRow[] = lastRows.length > 0
      ? [{ id: 'preview-gap-divider', rowNumber: -1, c0: `… ${hiddenCount} rows hidden …`, isDivider: true }]
      : [];

    const preHeaderSection: SpreadsheetRow[] = preHeaderRows.length > 0
      ? showPreHeader
        ? [...preHeaderRows, { id: 'pre-header-divider', rowNumber: -2, isPreHeaderDivider: true, preHeaderCount: preHeaderRows.length }]
        : [{ id: 'pre-header-divider', rowNumber: -2, isPreHeaderDivider: true, preHeaderCount: preHeaderRows.length }]
      : [];

    return [...preHeaderSection, ...firstRows, ...divider, ...lastRows];
  }, [rows, state.preview?.divider_after_row, state.preview?.total_rows, state.headerRow, state.showPreHeaderRows, filterInvalid, rowReasons]);

  const focusDetectedRow = (row?: number) => {
    if (row) {
      setSelected(row);
      setFocusRow(row);
      setFocusNonce(n => n + 1);
    }
  };

  const canSetHeader = !layoutLocked && selected !== undefined && (state.endRow === undefined || selected < state.endRow);
  const canSetEnd = !layoutLocked && selected !== undefined && (state.headerRow === undefined || selected > state.headerRow);
  const headerDisabledReason = layoutLocked
    ? 'Upload a new sample file to change the header row'
    : selected !== undefined && state.endRow !== undefined && selected >= state.endRow
      ? 'Header row must be above the last transaction row'
      : undefined;
  const endDisabledReason = layoutLocked
    ? 'Upload a new sample file to change the end row'
    : selected !== undefined && state.headerRow !== undefined && selected <= state.headerRow
      ? 'Last transaction row must be below the header row'
      : undefined;

  const gridProps = {
    columns,
    mappingBadges: mapped,
    isPickingColumn: Boolean(state.activeField),
    focusRowNumber: focusRow,
    focusNonce,
    selectedRowId: selected ? String(selected) : undefined,
    headerRowId: state.headerRow ? String(state.headerRow) : undefined,
    lastTransactionRowId: state.endRow ? String(state.endRow) : undefined,
    isRowAboveHeader: (row: SpreadsheetRow) => !row.isDivider && !row.isPreHeaderDivider && Boolean(state.headerRow && row.rowNumber < state.headerRow),
    isRowExcluded: (row: SpreadsheetRow) => !row.isDivider && !row.isPreHeaderDivider && Boolean(state.endRow && row.rowNumber > state.endRow),
    getRowClassName: (row: SpreadsheetRow) => row.isDivider ? 'bg-slate-100 font-semibold text-slate-600' : undefined,
    onRowClick: (row: SpreadsheetRow) => {
      if (!row.isDivider && !row.isPreHeaderDivider) {
        setSelected(prev => prev === row.rowNumber ? undefined : row.rowNumber);
      }
    },
    onColumnHeaderClick: (key: string) => {
      if (state.activeField) {
        dispatch({ type: 'map', field: state.activeField, column: Number(key.slice(1)) });
        dispatch({ type: 'active', field: undefined });
      }
    },
    showPreHeaderRows: state.showPreHeaderRows ?? false,
    onTogglePreHeaderRows: () => dispatch({ type: 'toggle-pre-header' }),
    rowReasons,
    selectedRowNumber: selected,
    onSetHeader: (row: number) => {
      dispatch({ type: 'header', row });
      setSelected(undefined);
    },
    onSetEnd: (row: number) => {
      dispatch({ type: 'end', row });
      setSelected(undefined);
    },
    canSetHeader,
    canSetEnd,
    headerDisabledReason,
    endDisabledReason,
    onDismissRowPopover: () => setSelected(undefined),
  };

  const handleToggleFilterInvalid = () => {
    const next = !filterInvalid;
    setFilterInvalid(next);
    if (next) {
      const firstInvalidRow = classified.rows.find(item => item.status !== 'valid' && item.status !== 'excluded');
      if (firstInvalidRow) {
        setFocusRow(firstInvalidRow.rowNumber);
        setFocusNonce(n => n + 1);
      }
    }
  };

  useEffect(() => {
    if (!isMobile || focusRow === undefined) return;
    const frame = requestAnimationFrame(() => {
      const target = mobileListRef.current?.querySelector<HTMLElement>(`[data-mobile-row="${focusRow}"]`);
      if (target && typeof target.scrollIntoView === 'function') {
        target.scrollIntoView({ block: 'center', behavior: 'smooth' });
      }
    });
    return () => cancelAnimationFrame(frame);
  }, [isMobile, focusRow, focusNonce]);

  return (
    <section className="min-w-0 space-y-4">
      {(state.autoHeaderRow || state.autoEndRow) ? (
        <div className="flex flex-col gap-3 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-teal-50 px-2.5 py-1 text-xs font-semibold text-teal-700">
              Detected ✓
            </span>
            {!layoutLocked && (
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  setSelected(undefined);
                  dispatch({ type: 'reset' });
                }}
                className="h-8 rounded-lg px-2.5 text-xs text-slate-500 hover:bg-teal-100/70 hover:text-teal-700"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                Reset to detected
              </Button>
            )}
          </div>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 text-xs">
            {state.autoHeaderRow && (
              <div className="flex items-center justify-between gap-2 rounded-xl bg-slate-50 px-3 py-2">
                <span className="text-slate-600">Header: <strong className="font-semibold text-slate-900">Row {state.headerRow ?? state.autoHeaderRow}</strong></span>
                <Button
                  size="xs"
                  variant="outline"
                  onClick={() => focusDetectedRow(state.headerRow ?? state.autoHeaderRow)}
                  className="h-7 rounded-lg border-slate-200 bg-white text-slate-700 hover:bg-teal-50 hover:text-teal-700 hover:border-teal-200"
                >
                  View row
                </Button>
              </div>
            )}
            {state.autoEndRow && (
              <div className="flex items-center justify-between gap-2 rounded-xl bg-slate-50 px-3 py-2">
                <span className="text-slate-600">End: <strong className="font-semibold text-slate-900">Row {state.endRow ?? state.autoEndRow}</strong></span>
                <Button
                  size="xs"
                  variant="outline"
                  onClick={() => focusDetectedRow(state.endRow ?? state.autoEndRow)}
                  className="h-7 rounded-lg border-slate-200 bg-white text-slate-700 hover:bg-teal-50 hover:text-teal-700 hover:border-teal-200"
                >
                  View row
                </Button>
              </div>
            )}
          </div>
        </div>
      ) : !state.headerRow ? (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          Header row could not be detected automatically. Click any row in the preview below and choose <strong>Set as header</strong>.
        </div>
      ) : null}

      <div className="space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
          <span>
            {layoutLocked
              ? 'Upload a new sample file above to change header or end rows.'
              : 'Click any row to set header or transaction end row.'}
          </span>
          {filterInvalid && (
            <button
              type="button"
              onClick={() => setFilterInvalid(false)}
              className="font-medium text-rose-700 underline underline-offset-2 hover:text-rose-900"
            >
              Showing rows needing attention · Show all rows
            </button>
          )}
        </div>
        {isMobile ? (
          <div ref={mobileListRef} className="space-y-2.5 max-h-[48vh] overflow-y-auto overflow-x-hidden rounded-2xl border border-slate-200 bg-slate-50/70 p-2.5">
            {gridRows.map(row => {
              if (row.isPreHeaderDivider) {
                return (
                  <button
                    key={row.id}
                    type="button"
                    onClick={() => gridProps.onTogglePreHeaderRows?.()}
                    className="w-full rounded-xl border border-dashed border-slate-300 bg-white px-3 py-2 text-left text-xs font-medium text-teal-700 hover:bg-teal-50/50"
                  >
                    {row.preHeaderCount} rows above header · {gridProps.showPreHeaderRows ? 'Hide' : 'Show'}
                  </button>
                );
              }
              if (row.isDivider || row.rowNumber < 0) return null;
              const isHeader = row.id === gridProps.headerRowId;
              const isLast = row.id === gridProps.lastTransactionRowId;
              const reason = gridProps.rowReasons?.[row.rowNumber];
              const canHeader = !layoutLocked && !row.isDivider && row.rowNumber >= 1 && (!state.endRow || row.rowNumber < state.endRow);
              const canEnd = !layoutLocked && !row.isDivider && (!state.headerRow || row.rowNumber > state.headerRow);
              const nonEmptyCells = columns
                .map(col => ({ key: col.key, label: col.name, value: String(row[col.key] ?? '').trim() }))
                .filter(cell => cell.value.length > 0)
                .slice(0, 6);

              return (
                <div
                  key={row.id}
                  data-mobile-row={row.rowNumber}
                  className={`min-w-0 overflow-hidden rounded-xl border p-3 shadow-2xs space-y-2 ${
                    isHeader
                      ? 'border-teal-500 bg-teal-50/70'
                      : isLast
                        ? 'border-amber-400 bg-amber-50/70'
                        : reason
                          ? 'border-rose-200 bg-rose-50/40'
                          : 'border-slate-200 bg-white'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono text-xs font-semibold text-slate-600">Row {row.rowNumber}</span>
                      {isHeader && <span className="rounded bg-teal-700 px-1.5 py-0.5 text-[10px] font-semibold text-white">Header</span>}
                      {isLast && <span className="rounded bg-amber-600 px-1.5 py-0.5 text-[10px] font-semibold text-white">Last</span>}
                      {reason && !isHeader && !isLast && (
                        <span className="rounded bg-rose-100 px-1.5 py-0.5 text-[10px] font-semibold text-rose-700">{reason}</span>
                      )}
                    </div>
                    {!layoutLocked && (
                      <div className="flex shrink-0 items-center gap-1">
                        {(canHeader || isHeader) && (
                          <Button
                            type="button"
                            size="xs"
                            variant={isHeader ? 'default' : 'outline'}
                            disabled={!canHeader}
                            onClick={() => dispatch({ type: 'header', row: row.rowNumber })}
                            className={isHeader ? 'bg-teal-600 text-white' : 'border-slate-200'}
                          >
                            Header
                          </Button>
                        )}
                        {(canEnd || isLast) && (
                          <Button
                            type="button"
                            size="xs"
                            variant={isLast ? 'default' : 'outline'}
                            disabled={!canEnd}
                            onClick={() => dispatch({ type: 'end', row: row.rowNumber })}
                            className={isLast ? 'bg-amber-600 text-white' : 'border-slate-200'}
                          >
                            End
                          </Button>
                        )}
                      </div>
                    )}
                  </div>
                  {nonEmptyCells.length > 0 && (
                    <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-xs">
                      {nonEmptyCells.map(cell => (
                        <div key={cell.key} className="min-w-0 truncate">
                          <span className="text-slate-400">{cell.label}: </span>
                          <span className="text-slate-700">{cell.value}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <StatementSpreadsheetGrid rows={gridRows} {...gridProps} />
        )}
        <p className="text-xs text-slate-500">
          Showing first and final 100 rows; rows in the middle gap are excluded from manual selection.
        </p>
      </div>

      {hasCoreMappings && (
        <div className="space-y-4">
          <ImportValidationSummary
            validRows={classified.counts.valid}
            excludedRows={classified.counts.excluded}
            invalidRows={invalidCount}
            duplicateRows={0}
            onFilterInvalid={handleToggleFilterInvalid}
            filterInvalidActive={filterInvalid}
          />
          <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm" aria-labelledby="parsed-result-heading">
            <div className="flex items-baseline justify-between gap-2">
              <h2 id="parsed-result-heading" className="text-sm font-semibold text-slate-900">Parsed result</h2>
              <p className="text-xs text-slate-500">First {parsedRows.length} parsed transactions</p>
            </div>
            {parsedRows.length > 0 ? (
              isMobile ? (
                <div className="mt-3 space-y-2">
                  {parsedRows.map(item => {
                    const hasDebit = Boolean(item.debit && item.debit !== '—');
                    const hasCredit = Boolean(item.credit && item.credit !== '—');
                    return (
                      <div key={item.rowNumber} className="rounded-xl border border-slate-100 bg-slate-50/70 p-3 text-xs space-y-1">
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-mono font-semibold text-slate-900">{item.date}</span>
                          <span className={`font-mono font-semibold ${hasDebit ? 'text-rose-700' : 'text-emerald-700'}`}>
                            {hasDebit ? `- ${item.debit}` : hasCredit ? `+ ${item.credit}` : '—'}
                          </span>
                        </div>
                        <p className="truncate text-slate-700">{item.description}</p>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="mt-3 overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-slate-200 text-slate-500">
                        <th className="pb-2 pr-3 font-medium">Date</th>
                        <th className="pb-2 pr-3 font-medium">Description</th>
                        <th className="pb-2 pr-3 text-right font-medium">Debit</th>
                        <th className="pb-2 text-right font-medium">Credit</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {parsedRows.map(item => (
                        <tr key={item.rowNumber}>
                          <td className="whitespace-nowrap py-2 pr-3 font-mono text-slate-900">{item.date}</td>
                          <td className="max-w-[220px] truncate py-2 pr-3 text-slate-700" title={item.description}>{item.description}</td>
                          <td className="whitespace-nowrap py-2 pr-3 text-right font-mono tabular-nums text-rose-700">{item.debit}</td>
                          <td className="whitespace-nowrap py-2 text-right font-mono tabular-nums text-emerald-700">{item.credit}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )
            ) : (
              <p className="mt-3 text-xs text-slate-500">No valid transactions match the current mapping and date format.</p>
            )}
          </section>
        </div>
      )}
    </section>
  );
}
