import { Plus } from 'lucide-react';
import { useAppStore } from '@/store';
import { Button } from '@/components/ui/button';

export function Topbar() {
  const setQuickAddOpen = useAppStore(state => state.setQuickAddOpen);

  return (
    <header className="hidden md:flex h-16 bg-white/80 backdrop-blur-md border-b border-slate-200 flex-shrink-0 items-center justify-between px-8 z-20 sticky top-0">
      <div className="flex-1" />

      <div className="flex items-center gap-4">
        <Button
          onClick={() => setQuickAddOpen(true)}
          className="rounded-xl font-medium"
        >
          <Plus className="w-4 h-4" />
          New Transaction
        </Button>
      </div>
    </header>
  );
}
