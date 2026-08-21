import { useMemo } from 'react';
import type { VwTransactionList } from '@/types';
import { format, parseISO, isValid } from 'date-fns';
import { Pencil, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PaginationControls } from '@/components/common/PaginationControls';
import { useAppStore } from '@/store';

export interface TransactionCardFeedProps {
  data: VwTransactionList[];
  total: number;
  page: number;
  pageSize: number;
  totalPages?: number;
  onPageChange: (newPage: number) => void;
  onEdit: (tx: VwTransactionList) => void;
  onDelete: (tx: VwTransactionList) => void;
}

export function TransactionCardFeed({
  data,
  total,
  page,
  pageSize,
  onPageChange,
  onEdit,
  onDelete,
}: TransactionCardFeedProps) {
  const formatTxDate = (rawDate?: string | null) => {
    if (!rawDate) return '—';
    const parsed = parseISO(rawDate);
    return isValid(parsed) ? format(parsed, 'dd MMM yyyy') : '—';
  };
  const accounts = useAppStore(state => state.accounts);
  const accountMap = useMemo(() => new Map(accounts.map(acc => [acc.account_sid, acc])), [accounts]);

  return (
    <div className="md:hidden flex flex-col gap-3 flex-1">
      {data.length === 0 ? (
        <div className="py-12 px-4 text-center bg-white rounded-2xl border border-slate-200/80 shadow-sm">
          <p className="text-sm font-semibold text-slate-700">No transactions found</p>
          <p className="text-xs text-slate-400 mt-1">Try adjusting your filters or date range.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {data.map((tx) => {
            const isDebit = tx.debit > 0;
            const amount = isDebit ? tx.debit : tx.credit;
            const acc = tx.account_sid ? accountMap.get(tx.account_sid) : undefined;

            return (
              <div
                key={tx.transaction_sid}
                className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-sm flex flex-col gap-3 transition-all"
              >
                {/* Top Row: Description & Amount */}
                <div className="flex items-center justify-between gap-3">
                  <div className="font-bold text-slate-800 text-base truncate flex-1">
                    {tx.description_name || 'Transaction'}
                  </div>
                  <div
                    className={`font-bold font-mono text-base shrink-0 ${
                      isDebit ? 'text-rose-600' : 'text-teal-600'
                    }`}
                  >
                    {isDebit ? `- ₹${amount.toFixed(2)}` : `+ ₹${amount.toFixed(2)}`}
                  </div>
                </div>

                {/* Sub Row: Account Badge & Date (Full width) */}
                <div className="flex items-center gap-2 text-xs text-slate-400 min-w-0">
                  <span className="font-medium text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md inline-flex items-center min-w-0 shrink max-w-[220px]">
                    <span className="truncate">{tx.account_name || 'Account'}</span>
                    {acc?.account_number && (
                      <span className="shrink-0 whitespace-nowrap ml-1 font-mono text-[11px] text-slate-500">
                        ({acc.account_number.toString().slice(-4)})
                      </span>
                    )}
                  </span>
                  <span className="shrink-0 text-slate-300">•</span>
                  <span className="whitespace-nowrap shrink-0 font-medium text-slate-500">
                    {formatTxDate(tx.transaction_date)}
                  </span>
                </div>

                {tx.notes && (
                  <div className="text-xs text-slate-500 bg-slate-50 rounded-xl p-2 font-normal border border-slate-100">
                    {tx.notes}
                  </div>
                )}

                <div className="pt-2 border-t border-slate-100 flex items-center justify-end gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onEdit(tx)}
                    aria-label="Edit transaction"
                    className="h-8 px-2.5 text-xs text-slate-500 hover:text-teal-600 hover:bg-teal-50 rounded-lg"
                  >
                    <Pencil className="w-3.5 h-3.5 mr-1" />
                    Edit
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onDelete(tx)}
                    aria-label="Delete transaction"
                    className="h-8 px-2.5 text-xs text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg"
                  >
                    <Trash2 className="w-3.5 h-3.5 mr-1" />
                    Delete
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Mobile Pagination */}
      <PaginationControls
        variant="mobile"
        page={page}
        pageSize={pageSize}
        total={total}
        onPageChange={onPageChange}
        className="mt-2"
      />
    </div>
  );
}
