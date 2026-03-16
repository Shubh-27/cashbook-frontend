import { NavLink } from 'react-router-dom';
import { LayoutDashboard, ReceiptText, Building2, Download, FileText } from 'lucide-react';
import { api } from '../api';
import { Button } from './ui/button';

export function Sidebar() {
  const navItems = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard },
    { name: 'Transaction', path: '/transaction', icon: ReceiptText },
    { name: 'Accounts', path: '/accounts', icon: Building2 },
    { name: 'Descriptions', path: '/descriptions', icon: FileText },
  ];

  const handleExport = async () => {
    await api.exportDb();
    // exportDb handles redirection, so we don't necessarily need an alert here
  };

  return (
    <div className="w-64 bg-white border-r border-slate-200 flex flex-col shadow-sm z-10">
      <div className="h-16 flex items-center px-6 border-b border-slate-100">
        <div className="flex items-center gap-2 text-teal-600 font-bold text-xl tracking-tight">
          <ReceiptText className="w-6 h-6 stroke-[2.5]" />
          <span>CashBook</span>
        </div>
      </div>

      <div className="flex-1 py-6 px-4 flex flex-col gap-1">
        <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 px-3">Menu</div>
        {navItems.map((item) => (
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

      <div className="p-4 border-t border-slate-100 flex flex-col gap-2"> 
        <Button
          variant="outline"
          onClick={handleExport}
          className="w-full justify-center rounded-xl"
        >
          <Download className="w-4 h-4" />
          Export Data
        </Button>
      </div>
    </div>
  );
}
