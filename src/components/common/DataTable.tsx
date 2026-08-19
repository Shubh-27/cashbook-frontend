import type { ReactNode } from 'react';
import {
  flexRender,
  getCoreRowModel,
  useReactTable,
  type ColumnDef,
} from '@tanstack/react-table';
import { getSortIcon } from '@/utils/sort';
import { cn } from '@/lib/utils';

export interface DataTableProps<T> {
  data: T[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  columns: ColumnDef<T, any>[];
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  onSort?: (columnId: string) => void;
  sortableColumns?: string[] | ((columnId: string) => boolean);
  getSortField?: (columnId: string) => string;
  colWidths?: string[];
  emptyMessage?: ReactNode;
  className?: string;
  getRowId?: (row: T, index: number) => string;
  footer?: ReactNode;
  children?: ReactNode;
}

export function DataTable<T>({
  data,
  columns,
  sortBy,
  sortOrder,
  onSort,
  sortableColumns,
  getSortField,
  colWidths,
  emptyMessage = 'No records found.',
  className,
  getRowId,
  footer,
  children,
}: DataTableProps<T>) {
  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    ...(getRowId ? { getRowId } : {}),
  });

  const isColumnSortable = (columnId: string): boolean => {
    if (!onSort) return false;
    if (!sortableColumns) return true;
    if (typeof sortableColumns === 'function') {
      return sortableColumns(columnId);
    }
    return sortableColumns.includes(columnId);
  };

  const renderColGroup = () => {
    if (!colWidths || colWidths.length === 0) return null;
    return (
      <colgroup>
        {colWidths.map((width, idx) => {
          const isTailwindClass = width.startsWith('w-') || width.startsWith('min-w-') || width.startsWith('max-w-');
          return (
            <col
              key={idx}
              className={isTailwindClass ? width : undefined}
              style={!isTailwindClass ? { width } : undefined}
            />
          );
        })}
      </colgroup>
    );
  };

  return (
    <div
      className={cn(
        'hidden md:flex bg-white border border-slate-200 shadow-sm rounded-2xl flex-1 flex-col overflow-hidden min-h-0',
        className
      )}
    >
      {/* Fixed Header Row - Outside Scroll Container */}
      <div className="bg-slate-50 border-b border-slate-200 shrink-0">
        <table className="w-full text-left text-sm table-fixed">
          {renderColGroup()}
          <thead>
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  const sortable = isColumnSortable(header.id);
                  return (
                    <th
                      key={header.id}
                      className={cn(
                        'px-4 sm:px-5 py-3.5 font-semibold text-slate-500 uppercase tracking-wider text-xs',
                        sortable && 'cursor-pointer hover:bg-slate-100 transition-colors'
                      )}
                      onClick={sortable ? () => onSort?.(header.id) : undefined}
                    >
                      <div className="flex items-center">
                        {flexRender(header.column.columnDef.header, header.getContext())}
                        {sortable && getSortIcon(header.id, sortBy, sortOrder, getSortField)}
                      </div>
                    </th>
                  );
                })}
              </tr>
            ))}
          </thead>
        </table>
      </div>

      {/* Scrollable Body Container - Scrollbar ONLY exists here in tbody */}
      <div className="flex-1 overflow-y-auto min-h-0">
        <table className="w-full text-left text-sm table-fixed">
          {renderColGroup()}
          <tbody className="divide-y divide-slate-100">
            {table.getRowModel().rows.length > 0 ? (
              table.getRowModel().rows.map((row) => (
                <tr key={row.id} className="hover:bg-slate-50 transition-colors group">
                  {row.getVisibleCells().map((cell) => (
                    <td key={cell.id} className="px-4 sm:px-5 py-3.5">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={columns.length} className="px-4 sm:px-5 py-12 text-center text-slate-500">
                  {emptyMessage}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {footer}
      {children}
    </div>
  );
}
