import { NavLink } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { useAppStore } from '@/store';
import { BOTTOM_NAV_ITEMS, type NavItem } from '@/config/navigation';
import { cn } from '@/lib/utils';

export function BottomNav() {
  const setQuickAddOpen = useAppStore(state => state.setQuickAddOpen);

  const firstHalf = BOTTOM_NAV_ITEMS.slice(0, 2);
  const secondHalf = BOTTOM_NAV_ITEMS.slice(2);

  const renderNavTab = (item: NavItem) => (
    <NavLink
      key={item.path}
      to={item.path}
      className="flex flex-col items-center justify-center flex-1 py-1 px-1 select-none active:scale-95 transition-transform duration-150"
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
              "text-[10px] mt-0.5 tracking-tight transition-colors duration-200",
              isActive ? "text-teal-700 font-semibold" : "text-slate-500 font-medium"
            )}
          >
            {item.name}
          </span>
        </>
      )}
    </NavLink>
  );

  return (
    <div
      role="navigation"
      aria-label="Mobile Navigation"
      className="md:hidden fixed bottom-3 left-3 right-3 sm:left-6 sm:right-6 max-w-md mx-auto z-40 pointer-events-none pb-[env(safe-area-inset-bottom,0px)]"
    >
      <nav className="rounded-[28px] border border-white/80 bg-white/80 backdrop-blur-xl px-2.5 py-1.5 flex items-center justify-between pointer-events-auto shadow-[0_8px_32px_rgba(0,0,0,0.08),0_2px_8px_rgba(15,118,110,0.06)]">
        {firstHalf.map(renderNavTab)}

        {/* Center Floating Action Button */}
        <div className="flex flex-col items-center justify-center px-1.5 -mt-6">
          <button
            type="button"
            onClick={() => setQuickAddOpen(true)}
            className="w-12 h-12 rounded-full text-white bg-gradient-to-tr from-teal-700 via-teal-600 to-teal-500 border-[3.5px] border-slate-100 ring-2 ring-white/70 shadow-[0_6px_20px_rgba(13,148,136,0.45)] flex items-center justify-center transition-all duration-150 active:scale-90 hover:scale-105 focus:outline-none cursor-pointer"
            aria-label="Add Transaction"
          >
            <Plus className="w-6 h-6 stroke-[2.8]" />
          </button>
          <span className="text-[10px] font-semibold text-teal-800 mt-0.5">Add</span>
        </div>

        {secondHalf.map(renderNavTab)}
      </nav>
    </div>
  );
}
