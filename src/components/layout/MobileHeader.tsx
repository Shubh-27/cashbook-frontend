import { useLocation, useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Settings } from 'lucide-react';
import { Logo } from '@/components/Logo';
import { Button } from '@/components/ui/button';
import { useAppStore } from '@/store';
import { getMobileHeaderMeta } from '@/config/navigation';
import { ROUTES } from '@/config/routes';

export function MobileHeader() {
  const location = useLocation();
  const navigate = useNavigate();
  const setQuickAddOpen = useAppStore(state => state.setQuickAddOpen);

  const isSettings = location.pathname === ROUTES.SETTINGS;
  const { eyebrow, title, backTo } = getMobileHeaderMeta(location.pathname);

  return (
    <header className="md:hidden sticky top-0 left-0 right-0 z-30 glass-header border-b border-slate-200/80 px-4 pt-safe">
      <div className="h-14 flex items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2.5">
          {backTo ? (
            <Button
              size="icon"
              variant="ghost"
              onClick={() => navigate(backTo)}
              className="h-8 w-8 shrink-0 rounded-xl text-slate-600 hover:bg-slate-100 hover:text-slate-900"
              aria-label={`Back to ${eyebrow}`}
              title={`Back to ${eyebrow}`}
            >
              <ArrowLeft className="w-4 h-4" />
            </Button>
          ) : (
            <div className="w-8 h-8 shrink-0 rounded-xl bg-teal-500/10 flex items-center justify-center text-teal-600">
              <Logo className="w-5 h-5" />
            </div>
          )}
          <div className="min-w-0">
            <div className="text-[11px] font-bold uppercase tracking-wider text-teal-600 leading-none truncate">
              {eyebrow}
            </div>
            <h1 className="text-base font-bold text-slate-800 leading-tight truncate">
              {title}
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <Button
            size="icon"
            onClick={() => setQuickAddOpen(true)}
            className="h-9 w-9 rounded-xl bg-teal-600 text-white hover:bg-teal-700 shadow-xs transition-colors active:scale-95"
            aria-label="Add Transaction"
            title="Add Transaction"
          >
            <Plus className="w-5 h-5" />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            onClick={() => navigate(ROUTES.SETTINGS)}
            className={`h-9 w-9 rounded-xl transition-colors active:scale-95 ${
              isSettings ? 'bg-teal-50 text-teal-600' : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100'
            }`}
            aria-label="Settings"
            title="Settings"
          >
            <Settings className="w-5 h-5" />
          </Button>
        </div>
      </div>
    </header>
  );
}
