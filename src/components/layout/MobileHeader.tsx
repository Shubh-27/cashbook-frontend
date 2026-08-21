import { useLocation, useNavigate } from 'react-router-dom';
import { Settings } from 'lucide-react';
import { Logo } from '@/components/Logo';
import { Button } from '@/components/ui/button';
import { getPageTitle } from '@/config/navigation';
import { ROUTES } from '@/config/routes';

export function MobileHeader() {
  const location = useLocation();
  const navigate = useNavigate();

  const isSettings = location.pathname === ROUTES.SETTINGS;

  return (
    <header className="md:hidden sticky top-0 left-0 right-0 z-30 glass-header border-b border-slate-200/80 px-4 pt-safe">
      <div className="h-14 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-teal-500/10 flex items-center justify-center text-teal-600">
            <Logo className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] font-bold uppercase tracking-wider text-teal-600 leading-none">
              CashBook
            </div>
            <h1 className="text-base font-bold text-slate-800 leading-tight">
              {getPageTitle(location.pathname)}
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            size="icon"
            variant="ghost"
            onClick={() => navigate(ROUTES.SETTINGS)}
            className={`h-9 w-9 rounded-xl transition-colors active:scale-95 ${
              isSettings ? 'bg-teal-50 text-teal-600' : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100'
            }`}
            aria-label="Settings"
          >
            <Settings className="w-5 h-5" />
          </Button>
        </div>
      </div>
    </header>
  );
}
