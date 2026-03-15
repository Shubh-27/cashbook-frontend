import { Search, Plus } from 'lucide-react';
import { useAppStore } from '../store';
import { QuickAdd } from './QuickAdd';

export function Topbar() {
  const setQuickAddOpen = useAppStore(state => state.setQuickAddOpen);
  const globalSearch = useAppStore(state => state.globalSearch);
  const setGlobalSearch = useAppStore(state => state.setGlobalSearch);

  return (
    <div className="h-16 bg-white/80 backdrop-blur-md border-b border-slate-200 flex flex-shrink-0 items-center justify-between px-8 z-20 sticky top-0">
      
      <div className="flex-1 max-w-xl">
        <div className="relative group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-teal-500 transition-colors" />
          <input 
            type="text" 
            placeholder="Search transactions..."
            value={globalSearch}
            onChange={(e) => setGlobalSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-100/50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 focus:bg-white transition-all placeholder:text-slate-400"
          />
        </div>
      </div>

      <div className="flex items-center gap-4 ml-8">
        <QuickAdd />
        
        <button 
          onClick={() => setQuickAddOpen(true)}
          className="flex items-center gap-2 bg-slate-900 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-slate-800 hover:shadow-md transition-all active:scale-95"
        >
          <Plus className="w-4 h-4" />
          New Transaction
        </button>
      </div>

    </div>
  );
}
