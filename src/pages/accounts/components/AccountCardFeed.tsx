import type { VwAccountList } from '@/types';
import { Building, Landmark, Pencil, Trash2, ArrowUpRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PaginationControls } from '@/components/common/PaginationControls';

export interface AccountCardFeedProps {
  data: VwAccountList[];
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (newPage: number) => void;
  onAccountClick: (sid: string) => void;
  onEdit: (account: VwAccountList) => void;
  onDelete: (sid: string) => void;
}

export function AccountCardFeed({
  data,
  page,
  pageSize,
  total,
  onPageChange,
  onAccountClick,
  onEdit,
  onDelete,
}: AccountCardFeedProps) {
  return (
    <div className="md:hidden flex flex-col gap-3 flex-1">
      {data.length === 0 ? (
        <div className="py-12 px-4 text-center bg-white rounded-2xl border border-slate-200/80 shadow-sm">
          <Building className="w-10 h-10 text-slate-300 mx-auto mb-2" />
          <p className="text-sm font-semibold text-slate-700">No accounts found</p>
          <p className="text-xs text-slate-400 mt-1">Tap "+ Add Account" to create your first one.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {data.map((acc) => (
            <div
              key={acc.account_sid}
              className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-sm flex flex-col gap-3"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-teal-50 rounded-xl text-teal-600">
                    <Landmark className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-800 text-base">
                      {acc.account_name}
                    </h3>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[11px] font-semibold uppercase tracking-wider bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md">
                        {acc.bank_name || 'Bank'}
                      </span>
                      <span className="text-xs text-slate-400 font-mono">
                        {acc.account_number ? `•••• ${acc.account_number.toString().slice(-4)}` : 'No Acc Number'}
                      </span>
                    </div>
                  </div>
                </div>

                <span className="text-[11px] font-semibold bg-teal-50 text-teal-700 px-2 py-1 rounded-lg shrink-0">
                  {acc.transaction_count || 0} tx
                </span>
              </div>

              <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onAccountClick(acc.account_sid)}
                  aria-label="View activity"
                  className="h-8 px-2.5 text-xs text-teal-600 hover:bg-teal-50 rounded-lg font-medium flex items-center gap-1"
                >
                  <ArrowUpRight className="w-3.5 h-3.5" />
                  View Activity
                </Button>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onEdit(acc)}
                    aria-label="Edit account"
                    className="h-8 px-2.5 text-xs text-slate-500 hover:text-teal-600 hover:bg-teal-50 rounded-lg"
                  >
                    <Pencil className="w-3.5 h-3.5 mr-1" />
                    Edit
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onDelete(acc.account_sid)}
                    aria-label="Delete account"
                    className="h-8 px-2.5 text-xs text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg"
                  >
                    <Trash2 className="w-3.5 h-3.5 mr-1" />
                    Delete
                  </Button>
                </div>
              </div>
            </div>
          ))}
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
