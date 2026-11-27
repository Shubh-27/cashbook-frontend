import { NavLink } from 'react-router-dom';
import { BOTTOM_NAV_ITEMS, type NavItem } from '@/config/navigation';
import { cn } from '@/lib/utils';

export function BottomNav() {
  const renderNavTab = (item: NavItem) => (
    <NavLink
      key={item.path}
      to={item.path}
      className="flex min-w-0 flex-1 flex-col items-center justify-center py-1 px-0.5 select-none active:scale-95 transition-transform duration-150"
    >
      {({ isActive }) => (
        <>
          <div
            className={cn(
              "p-1.5 rounded-xl transition-all duration-200 ease-out",
              isActive
                ? "bg-teal-500/15 text-teal-700 ring-1 ring-teal-600/20 scale-105 shadow-2xs"
                : "text-slate-400 hover:text-slate-600"
            )}
          >
            <item.icon className="w-5 h-5" strokeWidth={isActive ? 2.4 : 1.8} />
          </div>
          <span
            className={cn(
              "max-w-full truncate text-[10px] mt-0.5 tracking-tight transition-colors duration-200",
              isActive ? "text-teal-700 font-semibold" : "text-slate-500 font-medium"
            )}
          >
            {item.shortName ?? item.name}
          </span>
        </>
      )}
    </NavLink>
  );

  return (
    <div
      role="navigation"
      aria-label="Mobile Navigation"
      className="md:hidden fixed bottom-[max(0.75rem,calc(env(safe-area-inset-bottom,0px)*0.55))] left-3 right-3 sm:left-6 sm:right-6 max-w-md mx-auto z-40 pointer-events-none"
    >
      <nav className="rounded-[28px] border border-white/80 bg-white/80 backdrop-blur-xl px-2 py-1.5 flex items-center justify-between pointer-events-auto shadow-[0_8px_32px_rgba(0,0,0,0.08),0_2px_8px_rgba(15,118,110,0.06)]">
        {BOTTOM_NAV_ITEMS.map(renderNavTab)}
      </nav>
    </div>
  );
}
