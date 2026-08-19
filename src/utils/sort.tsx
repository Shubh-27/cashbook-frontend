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
