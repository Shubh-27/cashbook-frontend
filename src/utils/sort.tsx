import type { ReactNode } from 'react';
import { ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';

export function getSortIcon(
  columnId: string,
  sortBy?: string,
  sortOrder?: 'asc' | 'desc',
  getSortField?: (id: string) => string
): ReactNode {
  const backendField = getSortField ? getSortField(columnId) : columnId;
  const isSorted = !!sortBy && sortBy.toLowerCase() === backendField.toLowerCase();

  if (!isSorted) {
    return <ArrowUpDown className="w-3.5 h-3.5 ml-1.5 text-slate-300 shrink-0" />;
  }

  return sortOrder === 'asc' ? (
    <ArrowUp className="w-3.5 h-3.5 ml-1.5 text-teal-600 shrink-0" />
  ) : (
    <ArrowDown className="w-3.5 h-3.5 ml-1.5 text-teal-600 shrink-0" />
  );
}

export function getTransactionSortField(columnId: string): string {
  if (columnId === 'transaction_date') return 'TransactionDate';
  if (columnId === 'account_name') return 'AccountName';
  if (columnId === 'description_name') return 'DescriptionName';
  if (columnId === 'debit') return 'Debit';
  if (columnId === 'credit') return 'Credit';
  return columnId;
}

export function getAccountSortField(columnId: string): string {
  if (columnId === 'account_name') return 'AccountName';
  if (columnId === 'bank_name') return 'BankName';
  if (columnId === 'account_number') return 'AccountNumber';
  return columnId;
}

export function getDescriptionSortField(columnId: string): string {
  if (columnId === 'description_name') return 'DescriptionName';
  if (columnId === 'usage_count') return 'UsageCount';
  return columnId;
}
