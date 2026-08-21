import { Loader2 } from 'lucide-react';

export function PageLoadingFallback() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] w-full gap-3 text-slate-500 animate-in fade-in duration-200">
      <Loader2 className="w-8 h-8 animate-spin text-teal-600" />
      <span className="text-sm font-medium text-slate-500">Loading...</span>
    </div>
  );
}
