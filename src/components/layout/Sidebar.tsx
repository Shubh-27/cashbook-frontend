import { NavLink } from 'react-router-dom';
import { Logo } from '@/components/Logo';
import { SIDEBAR_NAV_ITEMS } from '@/config/navigation';

export function Sidebar() {
  return (
    <aside className="hidden md:flex w-64 bg-white border-r border-slate-200 flex-col shadow-sm z-10 shrink-0">
      <div className="h-16 flex items-center px-6 border-b border-slate-100">
        <div className="flex items-center gap-2 text-teal-600 font-bold text-xl tracking-tight">
          <Logo className="w-6 h-6" />
          <span>CashBook</span>
        </div>
      </div>

      <div className="flex-1 py-6 px-4 flex flex-col gap-1">
        <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 px-3">Menu</div>
        {SIDEBAR_NAV_ITEMS.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium transition-all duration-200 ${isActive
                ? 'bg-teal-50 text-teal-700 shadow-sm ring-1 ring-teal-100'
                : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`
            }
          >
            <item.icon className="w-5 h-5" />
            {item.name}
          </NavLink>
        ))}
      </div>
    </aside>
  );
}
