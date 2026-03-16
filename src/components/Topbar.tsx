import { Search, Plus } from 'lucide-react';
import { useAppStore } from '../store';
import { Button } from './ui/button';
import { Input } from './ui/input';

export function Topbar() {
  const setQuickAddOpen = useAppStore(state => state.setQuickAddOpen);
  const globalSearch = useAppStore(state => state.globalSearch);
  const setGlobalSearch = useAppStore(state => state.setGlobalSearch);

  return (
    <div className="h-16 bg-white/80 backdrop-blur-md border-b border-slate-200 flex flex-shrink-0 items-center justify-between px-8 z-20 sticky top-0">

      <div className="flex-1 max-w-xl">
        <div className="relative group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-teal-500 transition-colors z-10" />
          <Input
            placeholder="Search transactions..."
            value={globalSearch}
            onChange={(e) => setGlobalSearch(e.target.value)}
            className="w-full pl-10 bg-slate-100/50 border-slate-200 rounded-xl focus:bg-white"
          />
        </div>
      </div>

      <div className="flex items-center gap-4 ml-8">
        <Button
          onClick={() => setQuickAddOpen(true)}
          className="rounded-xl font-medium"
        >
          <Plus className="w-4 h-4" />
          New Transaction
        </Button>
      </div>

    </div>
  );
}
