import { useMemo } from 'react';
import { createColumnHelper } from '@tanstack/react-table';
import type { VwTransactionList } from '@/types';
import { format, parseISO, isValid } from 'date-fns';
import { Pencil, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DataTable } from '@/components/common/DataTable';
import { PaginationControls } from '@/components/common/PaginationControls';
import { getTransactionSortField } from '@/utils/sort';

const columnHelper = createColumnHelper<VwTransactionList>();

export interface TransactionTableProps {
  data: VwTransactionList[];
  total: number;
  page: number;
  pageSize: number;
  totalPages?: number;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
  onSort: (columnId: string) => void;
  onPageChange: (newPage: number) => void;
  onEdit: (tx: VwTransactionList) => void;
  onDelete: (tx: VwTransactionList) => void;
}

export function TransactionTable({
  data,
  total,
  page,
  pageSize,
  sortBy,
  sortOrder,
  onSort,
  onPageChange,
  onEdit,
  onDelete,
}: TransactionTableProps) {
  const columns = useMemo(() => [
    columnHelper.display({
      id: 'sr',
      header: 'SR',
      cell: (info) => (
        <span className="text-slate-400 font-medium">
          {(page - 1) * pageSize + info.row.index + 1}
        </span>
      ),
    }),
    columnHelper.accessor('transaction_date', {
      header: 'DATE',
      cell: (info) => {
        const rawDate = info.getValue();
        if (!rawDate) return <span className="text-slate-400 font-medium">—</span>;
        const parsed = parseISO(rawDate);
        if (!isValid(parsed)) return <span className="text-slate-400 font-medium">—</span>;
        return <span className="font-medium">{format(parsed, 'dd MMM yyyy')}</span>;
      },
    }),
    columnHelper.accessor('account_name', {
      header: 'ACCOUNT',
      cell: (info) => <span className="text-slate-800 font-medium truncate block max-w-[180px]">{info.getValue() ?? '-'}</span>,
    }),
    columnHelper.accessor('description_name', {
      header: 'DESCRIPTION',
      cell: (info) => <span className="text-slate-800 font-medium truncate block max-w-[180px]">{info.getValue() ?? '-'}</span>,
    }),
    columnHelper.accessor('debit', {
      header: 'DEBIT',
      cell: (info) => (info.getValue() ?? 0) > 0 ? (
        <span className="text-rose-600 font-medium">{(info.getValue() ?? 0).toFixed(2)}</span>
      ) : '-',
    }),
    columnHelper.accessor('credit', {
      header: 'CREDIT',
      cell: (info) => (info.getValue() ?? 0) > 0 ? (
        <span className="text-teal-600 font-medium">{(info.getValue() ?? 0).toFixed(2)}</span>
      ) : '-',
    }),
    columnHelper.accessor('notes', {
      header: 'NOTES',
      cell: (info) => <span className="text-slate-500 text-sm truncate block max-w-[160px]">{info.getValue() || '-'}</span>,
    }),
    columnHelper.display({
      id: 'actions',
      header: 'Actions',
      cell: (info) => (
        <div className="flex gap-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onEdit(info.row.original)}
            aria-label="Edit transaction"
            className="h-8 w-8 text-slate-400 hover:text-teal-600 hover:bg-teal-50"
          >
            <Pencil className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onDelete(info.row.original)}
            aria-label="Delete transaction"
            className="h-8 w-8 text-slate-400 hover:text-rose-600 hover:bg-rose-50"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      ),
    }),
  ], [page, pageSize, onEdit, onDelete]);

  return (
    <DataTable<VwTransactionList>
      data={data}
      columns={columns}
      sortBy={sortBy}
      sortOrder={sortOrder}
      onSort={onSort}
      colWidths={['w-[5%]', 'w-[11%]', 'w-[18%]', 'w-[20%]', 'w-[11%]', 'w-[11%]', 'w-[16%]', 'w-[8%]']}
      sortableColumns={['transaction_date', 'account_name', 'description_name', 'debit', 'credit']}
      getSortField={getTransactionSortField}
      emptyMessage="No transactions found."
      getRowId={(row) => row.transaction_sid}
      footer={
        <PaginationControls
          variant="desktop"
          page={page}
          pageSize={pageSize}
          total={total}
          onPageChange={onPageChange}
        />
      }
    />
  );
}
