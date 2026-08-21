import type { VwDescriptionList } from '@/types';
import { Tag, Pencil, Trash2, ArrowUpRight } from 'lucide-react';
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
          <Tag className="w-10 h-10 text-slate-300 mx-auto mb-2" />
          <p className="text-sm font-semibold text-slate-700">No descriptions found</p>
          <p className="text-xs text-slate-400 mt-1">Tap "+ Add Description" to create one.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {data.map((desc) => (
            <div
              key={desc.description_sid}
              className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-sm flex flex-col gap-3"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="p-2.5 bg-teal-50 rounded-xl text-teal-600 shrink-0">
                    <Tag className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-bold text-slate-800 text-base truncate">
                      {desc.description_name}
                    </h3>
                  </div>
                </div>

                <span className="text-[11px] font-semibold bg-teal-50 text-teal-700 px-2 py-1 rounded-lg shrink-0">
                  {desc.usage_count || 0} tx
                </span>
              </div>

              <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onDescriptionClick(desc.description_sid)}
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
                    onClick={() => onEdit(desc)}
                    aria-label="Edit description"
                    className="h-8 px-2.5 text-xs text-slate-500 hover:text-teal-600 hover:bg-teal-50 rounded-lg"
                  >
                    <Pencil className="w-3.5 h-3.5 mr-1" />
                    Edit
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onDelete(desc)}
                    aria-label="Delete description"
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
