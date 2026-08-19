import type { VwDescriptionList } from '@/types';
import { Pencil, Trash2, ArrowUpRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PaginationControls } from '@/components/common/PaginationControls';

export interface DescriptionCardFeedProps {
  data: VwDescriptionList[];
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (newPage: number) => void;
  onDescriptionClick: (sid: string) => void;
  onEdit: (desc: VwDescriptionList) => void;
  onDelete: (desc: VwDescriptionList) => void;
}

export function DescriptionCardFeed({
  data,
  page,
  pageSize,
  total,
  onPageChange,
  onDescriptionClick,
  onEdit,
  onDelete,
}: DescriptionCardFeedProps) {
  return (
    <div className="md:hidden flex flex-col gap-3 flex-1">
      {data.length === 0 ? (
        <div className="py-12 px-4 text-center bg-white rounded-2xl border border-slate-200/80 shadow-sm">
          <p className="text-sm font-semibold text-slate-700">No descriptions found</p>
          <p className="text-xs text-slate-400 mt-1">Tap "+ Add Description" to create one.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-2.5">
          {data.map((desc) => (
            <div
              key={desc.description_sid}
              className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-sm flex items-center justify-between gap-3"
            >
              <div className="min-w-0 flex-1">
                <h3 className="font-bold text-slate-800 text-sm truncate">
                  {desc.description_name}
                </h3>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs text-slate-400 font-medium">
                    {desc.usage_count > 0
                      ? `${desc.usage_count} transaction${desc.usage_count > 1 ? 's' : ''}`
                      : 'Not used yet'}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-1 shrink-0">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onDescriptionClick(desc.description_sid)}
                  aria-label="View activity"
                  className="h-8 px-2 text-xs text-teal-600 hover:bg-teal-50 rounded-lg font-medium"
                >
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onEdit(desc)}
                  aria-label="Edit description"
                  className="h-8 px-2 text-xs text-slate-500 hover:text-teal-600 hover:bg-teal-50 rounded-lg"
                >
                  <Pencil className="w-3.5 h-3.5" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onDelete(desc)}
                  aria-label="Delete description"
                  className="h-8 px-2 text-xs text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
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
