import { ArrowLeft, ArrowRight } from 'lucide-react';
import { Button } from '../ui/button';
import { cn } from '@/lib/utils';

export interface PaginationControlsProps {
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (newPage: number) => void;
  variant?: 'auto' | 'desktop' | 'mobile';
  className?: string;
}

export function PaginationControls({
  page,
  pageSize,
  total,
  onPageChange,
  variant = 'auto',
  className,
}: PaginationControlsProps) {
  const totalPages = Math.ceil(total / pageSize) || 1;
  const from = total > 0 ? (page - 1) * pageSize + 1 : 0;
  const to = Math.min(page * pageSize, total);

  const renderMobile = () => (
    <div
      className={cn(
        'bg-white border border-slate-200/80 rounded-2xl p-3 flex items-center justify-between shadow-sm',
        variant === 'auto' && 'md:hidden',
        className
      )}
    >
      <span className="text-xs font-medium text-slate-500">
        {from} - {to} of {total}
      </span>
      <div className="flex items-center gap-1.5">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(Math.max(1, page - 1))}
          disabled={page === 1}
          className="h-8 px-2.5 text-xs rounded-xl"
        >
          <ArrowLeft className="w-3.5 h-3.5 mr-1" />
          Prev
        </Button>
        <span className="text-xs font-semibold text-slate-700 px-1">
          {page}/{totalPages}
        </span>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(Math.min(totalPages, page + 1))}
          disabled={page === totalPages || total === 0}
          className="h-8 px-2.5 text-xs rounded-xl"
        >
          Next
          <ArrowRight className="w-3.5 h-3.5 ml-1" />
        </Button>
      </div>
    </div>
  );

  const renderDesktop = () => (
    <div
      className={cn(
        'border-t border-slate-200 px-6 py-4 flex items-center justify-between bg-white text-sm shrink-0',
        variant === 'auto' && 'hidden md:flex',
        className
      )}
    >
      <span className="text-slate-500 font-medium flex items-center gap-1.5">
        Showing <span className="text-slate-800 font-semibold">{from}</span> to{' '}
        <span className="text-slate-800 font-semibold">{to}</span> of{' '}
        <span className="text-slate-800 font-semibold">{total}</span>
      </span>
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="icon"
          onClick={() => onPageChange(Math.max(1, page - 1))}
          disabled={page === 1}
          className="h-8 w-8"
        >
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <span className="px-2 font-medium text-slate-700">
          Page {page} of {totalPages}
        </span>
        <Button
          variant="outline"
          size="icon"
          onClick={() => onPageChange(Math.min(totalPages, page + 1))}
          disabled={page === totalPages || total === 0}
          className="h-8 w-8"
        >
          <ArrowRight className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );

  if (variant === 'mobile') return renderMobile();
  if (variant === 'desktop') return renderDesktop();

  return (
    <>
      {renderMobile()}
      {renderDesktop()}
    </>
  );
}
