import { useCallback, useEffect, useMemo, useRef } from 'react';
import { DataGrid, type CellMouseArgs, type Column, type ColumnWidths, type DataGridHandle, type RenderCellProps, type RenderHeaderCellProps } from 'react-data-grid';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useOverlayScrollbars } from '@/hooks/useOverlayScrollbars';

export interface SpreadsheetRow {
  id: string;
  rowNumber: number;
  isDivider?: boolean;
  isPreHeaderDivider?: boolean;
  preHeaderCount?: number;
  [columnKey: string]: string | number | boolean | null | undefined;
}

export interface SpreadsheetColumn {
  key: string;
  name: string;
  width?: number;
  align?: 'left' | 'right';
}

interface StatementSpreadsheetGridProps {
  columns: SpreadsheetColumn[];
  rows: SpreadsheetRow[];
  selectedRowId?: string;
  selectedCell?: { rowId: string; columnKey: string };
  headerRowId?: string;
  lastTransactionRowId?: string;
  isRowExcluded?: (row: SpreadsheetRow) => boolean;
  isRowAboveHeader?: (row: SpreadsheetRow) => boolean;
  getRowClassName?: (row: SpreadsheetRow) => string | undefined;
  onRowClick?: (row: SpreadsheetRow) => void;
  onSelectedCellChange?: (selection: { rowId: string; columnKey: string }) => void;
  onColumnHeaderClick?: (columnKey: string) => void;
  onColumnWidthsChange?: (columnWidths: ColumnWidths) => void;
  mappingBadges?: Record<number, string>;
  isPickingColumn?: boolean;
  focusRowNumber?: number;
  focusNonce?: number;
  showPreHeaderRows?: boolean;
  onTogglePreHeaderRows?: () => void;
  rowReasons?: Record<number, string>;
  // Row-anchored popover actions
  selectedRowNumber?: number;
  onSetHeader?: (row: number) => void;
  onSetEnd?: (row: number) => void;
  canSetHeader?: boolean;
  canSetEnd?: boolean;
  headerDisabledReason?: string;
  endDisabledReason?: string;
  onDismissRowPopover?: () => void;
}

const BADGE_STYLES: Record<string, { label: string; className: string }> = {
  date: { label: 'Date', className: 'bg-violet-100 text-violet-800 border-violet-200' },
  description: { label: 'Description', className: 'bg-blue-100 text-blue-800 border-blue-200' },
  debit: { label: 'Debit', className: 'bg-rose-100 text-rose-800 border-rose-200' },
  credit: { label: 'Credit', className: 'bg-emerald-100 text-emerald-800 border-emerald-200' },
  amount: { label: 'Amount', className: 'bg-indigo-100 text-indigo-800 border-indigo-200' },
  balance: { label: 'Balance', className: 'bg-amber-100 text-amber-800 border-amber-200' },
  notes: { label: 'Notes', className: 'bg-slate-200 text-slate-800 border-slate-300' },
};

function HeaderCell({ column, onColumnHeaderClick, badge, isPickingColumn }: RenderHeaderCellProps<SpreadsheetRow> & Pick<StatementSpreadsheetGridProps, 'onColumnHeaderClick' | 'isPickingColumn'> & { badge?: string }) {
  const badgeStyle = badge ? BADGE_STYLES[badge] : undefined;
  const colName = typeof column.name === 'string' ? column.name : '';
  return (
    <button
      type="button"
      onClick={() => onColumnHeaderClick?.(column.key)}
      title={isPickingColumn ? `Click to map ${colName}` : colName}
      className={`flex h-full w-full cursor-pointer items-center gap-1.5 truncate px-1.5 text-left font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 ${
        isPickingColumn
          ? 'rounded bg-teal-50/90 text-teal-900 ring-1 ring-inset ring-teal-400 hover:bg-teal-100'
          : 'text-slate-700 hover:text-teal-700'
      }`}
    >
      {badgeStyle && (
        <span className={`shrink-0 rounded border px-1.5 py-0.5 text-[10px] font-semibold leading-none ${badgeStyle.className}`}>
          {badgeStyle.label}
        </span>
      )}
      <span className="truncate">{column.name}</span>
    </button>
  );
}

export function StatementSpreadsheetGrid({
  columns,
  rows,
  selectedRowId,
  selectedCell,
  headerRowId,
  lastTransactionRowId,
  isRowExcluded,
  isRowAboveHeader,
  getRowClassName,
  onRowClick,
  onSelectedCellChange,
  onColumnHeaderClick,
  onColumnWidthsChange,
  mappingBadges = {},
  isPickingColumn = false,
  focusRowNumber,
  focusNonce,
  showPreHeaderRows = false,
  onTogglePreHeaderRows,
  rowReasons = {},
  selectedRowNumber,
  onSetHeader,
  onSetEnd,
  canSetHeader = false,
  canSetEnd = false,
  headerDisabledReason,
  endDisabledReason,
  onDismissRowPopover,
}: StatementSpreadsheetGridProps) {
  const gridRef = useRef<DataGridHandle>(null);

  const HEADER_HEIGHT = 35;
  const FROZEN_COL_WIDTH = 82;
  const getGridElement = useCallback(() => gridRef.current?.element, []);
  const {
    scrollMetrics,
    draggingAxis,
    isScrolling,
    isHoveringScrollbar,
    setIsHoveringScrollbar,
    startThumbDrag,
    topInset: V_TRACK_TOP,
    bottomInset: V_TRACK_BOTTOM,
    leftInset: H_TRACK_LEFT,
    rightInset: H_TRACK_RIGHT,
  } = useOverlayScrollbars(getGridElement, [rows, columns], {
    topInset: HEADER_HEIGHT + 4,
    bottomInset: 10,
    leftInset: FROZEN_COL_WIDTH + 4,
    rightInset: 12,
  });

  useEffect(() => {
    if (focusRowNumber === undefined) return;
    const rowIdx = rows.findIndex(row => row.rowNumber === focusRowNumber);
    if (rowIdx < 0) return;
    const frame = requestAnimationFrame(() => {
      const container = gridRef.current?.element;
      if (container) {
        container.scrollTop = rowIdx <= 1 ? 0 : Math.max(0, (rowIdx - 1) * 35);
        return;
      }
      if (typeof HTMLElement !== 'undefined' && typeof HTMLElement.prototype.scrollIntoView === 'function') {
        gridRef.current?.scrollToCell({ rowIdx, idx: 0 });
      }
    });
    return () => cancelAnimationFrame(frame);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [focusRowNumber, focusNonce]);

  const gridColumns: Column<SpreadsheetRow>[] = useMemo(() => [
    {
      key: 'rowNumber',
      name: '#',
      width: 82,
      minWidth: 68,
      frozen: true,
      resizable: false,
      cellClass: 'bg-slate-50 font-mono text-xs text-slate-500',
      headerCellClass: 'bg-slate-100 text-right text-slate-600',
      renderCell: ({ row }: RenderCellProps<SpreadsheetRow>) => {
        if (row.isPreHeaderDivider) {
          return (
            <div className="flex h-full items-center justify-end pr-1 text-slate-400">
              {showPreHeaderRows ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
            </div>
          );
        }
        if (row.rowNumber < 0) return null;
        const isHeader = row.id === headerRowId;
        const isLast = row.id === lastTransactionRowId;
        const reason = rowReasons[row.rowNumber];
        return (
          <div className="flex h-full items-center justify-end gap-1.5 pr-1" title={reason}>
            {isHeader && <span className="rounded bg-teal-700 px-1.5 py-0.5 font-sans text-[10px] font-semibold leading-none text-white">Header</span>}
            {isLast && <span className="rounded bg-amber-600 px-1.5 py-0.5 font-sans text-[10px] font-semibold leading-none text-white">Last</span>}
            {reason && !isHeader && !isLast && <span className="h-2 w-2 rounded-full bg-rose-600" aria-label={reason} />}
            <span>{row.rowNumber}</span>
          </div>
        );
      },
    },
    ...columns.map((column, colIndex) => {
      const mappedRole = mappingBadges[Number(column.key.slice(1))];
      const isRightAligned = column.align === 'right' || mappedRole === 'debit' || mappedRole === 'credit' || mappedRole === 'amount' || mappedRole === 'balance';
      return {
        key: column.key,
        name: column.name,
        width: column.width ?? 120,
        minWidth: 70,
        resizable: true,
        cellClass: (row: SpreadsheetRow) => {
          const classes: string[] = [];
          if (isRightAligned && !row.isDivider && !row.isPreHeaderDivider) classes.push('text-right tabular-nums');
          if (row.id === selectedCell?.rowId && column.key === selectedCell.columnKey && !row.isPreHeaderDivider) {
            classes.push('ring-2 ring-inset ring-teal-500');
          }
          return classes.join(' ') || undefined;
        },
        renderCell: ({ row }: RenderCellProps<SpreadsheetRow>) => {
          if (row.isPreHeaderDivider) {
            if (colIndex !== 0) return null;
            return (
              <button
                type="button"
                aria-expanded={showPreHeaderRows}
                onClick={event => {
                  event.stopPropagation();
                  onTogglePreHeaderRows?.();
                }}
                className="flex h-full items-center gap-1.5 text-xs font-medium text-teal-800 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500"
              >
                <span>{row.preHeaderCount} rows above header · {showPreHeaderRows ? 'Hide' : 'Show'}</span>
              </button>
            );
          }
          const text = String(row[column.key] ?? '');
          const reason = rowReasons[row.rowNumber];
          return (
            <div
              className={`truncate ${isRightAligned && !row.isDivider ? 'text-right tabular-nums' : ''}`}
              title={reason ? `${reason}${text ? ` — ${text}` : ''}` : (text || undefined)}
            >
              {text}
            </div>
          );
        },
        renderHeaderCell: (props: RenderHeaderCellProps<SpreadsheetRow>) => (
          <HeaderCell
            {...props}
            onColumnHeaderClick={onColumnHeaderClick}
            badge={mappedRole}
            isPickingColumn={isPickingColumn}
          />
        ),
      };
    }),
  ], [columns, selectedCell, onColumnHeaderClick, mappingBadges, isPickingColumn, headerRowId, lastTransactionRowId, showPreHeaderRows, onTogglePreHeaderRows, rowReasons]);

  const lastRowId = rows[rows.length - 1]?.id;

  const rowClass = (row: SpreadsheetRow) => {
    const classes = ['border-b border-slate-100'];
    if (row.id === lastRowId) classes.push('rdg-last-row');
    if (row.isPreHeaderDivider) {
      classes.push('bg-slate-50/90 text-slate-600');
      return classes.join(' ');
    }
    if (row.id === selectedRowId) classes.push('bg-teal-50');
    if (row.id === headerRowId) classes.push('bg-teal-50/90 border-l-[3px] border-l-teal-700 font-semibold text-slate-900');
    if (row.id === lastTransactionRowId) classes.push('border-b-2 border-teal-500 bg-amber-50');
    if (isRowAboveHeader?.(row)) classes.push('bg-slate-50/70 text-slate-400');
    if (isRowExcluded?.(row)) classes.push('bg-slate-50 text-slate-400');
    if (rowReasons[row.rowNumber] && row.id !== headerRowId) classes.push('bg-rose-50/40');
    const customClass = getRowClassName?.(row);
    if (customClass) classes.push(customClass);
    return classes.join(' ');
  };

  const handleCellClick = ({ row, column }: CellMouseArgs<SpreadsheetRow>) => {
    if (row.isPreHeaderDivider || row.isDivider) return;
    onRowClick?.(row);
    onSelectedCellChange?.({ rowId: row.id, columnKey: column.key });
  };

  return (
    <div className="relative max-h-[60vh] overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm" data-testid="statement-spreadsheet-grid">
      {selectedRowNumber !== undefined && (onSetHeader || onSetEnd) && (() => {
        const selectedIdx = rows.findIndex(r => r.rowNumber === selectedRowNumber);
        const scrollTop = gridRef.current?.element?.scrollTop ?? 0;
        const containerHeight = gridRef.current?.element?.clientHeight ?? 440;
        const rawTop = selectedIdx >= 0 ? 38 + (selectedIdx + 1) * 35 - scrollTop + 4 : containerHeight - 52;
        const clampedTop = Math.min(Math.max(44, rawTop), Math.max(44, containerHeight - 48));
        return (
          <div
            role="dialog"
            aria-label={`Row ${selectedRowNumber} actions`}
            style={{ top: `${clampedTop}px` }}
            className="absolute left-2 right-2 sm:left-24 sm:right-auto z-20 flex flex-wrap items-center gap-2 rounded-xl border border-slate-200 bg-white/95 px-3 py-1.5 shadow-lg backdrop-blur"
          >
          <span className="text-xs font-semibold text-slate-700">Row {selectedRowNumber}</span>
          <span title={headerDisabledReason}>
            <Button
              size="xs"
              disabled={!canSetHeader}
              className="rounded-lg bg-teal-600 text-white hover:bg-teal-700 disabled:bg-slate-200 disabled:text-slate-500 disabled:opacity-100"
              onClick={() => { onSetHeader?.(selectedRowNumber); onDismissRowPopover?.(); }}
            >
              Set as header
            </Button>
          </span>
          <span title={endDisabledReason}>
            <Button
              size="xs"
              variant="outline"
              disabled={!canSetEnd}
              className="rounded-lg border-slate-200 disabled:opacity-40"
              onClick={() => { onSetEnd?.(selectedRowNumber); onDismissRowPopover?.(); }}
            >
              Transactions end here
            </Button>
          </span>
          <button
            type="button"
            onClick={onDismissRowPopover}
            aria-label="Close row actions"
            className="ml-1 rounded px-1.5 py-0.5 text-xs text-slate-500 hover:bg-slate-100 hover:text-slate-800"
          >
            ✕
          </button>
        </div>
        );
      })()}
      <DataGrid
        ref={gridRef}
        aria-label="Statement spreadsheet preview"
        columns={gridColumns}
        rows={rows}
        enableVirtualization={false}
        rowKeyGetter={row => row.id}
        rowClass={rowClass}
        onCellClick={handleCellClick}
        onColumnWidthsChange={onColumnWidthsChange}
        defaultColumnOptions={{ resizable: true }}
        headerRowClass="!bg-slate-100 sticky top-0 z-10"
        className="rdg-light h-auto max-h-[calc(60vh-2px)] !border-0 text-sm [--rdg-background-color:#ffffff] [--rdg-border-color:#e2e8f0] [--rdg-header-background-color:#f8fafc] [--rdg-selection-color:#0d9488]"
      />
      {scrollMetrics.showV && (
        <div
          aria-hidden="true"
          style={{ top: `${V_TRACK_TOP}px`, bottom: `${V_TRACK_BOTTOM}px` }}
          className={`pointer-events-none absolute right-1 z-10 w-1 transition-opacity duration-200 ${
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
              draggingAxis === 'v'
                ? 'bg-teal-600/80'
                : 'bg-slate-500/40 hover:bg-teal-600/70'
            }`}
          />
        </div>
      )}
      {scrollMetrics.showH && (
        <div
          aria-hidden="true"
          style={{ left: `${H_TRACK_LEFT}px`, right: `${H_TRACK_RIGHT}px` }}
          className={`pointer-events-none absolute bottom-1 z-10 h-1 transition-opacity duration-200 ${
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
              draggingAxis === 'h'
                ? 'bg-teal-600/80'
                : 'bg-slate-500/40 hover:bg-teal-600/70'
            }`}
          />
        </div>
      )}
    </div>
  );
}
