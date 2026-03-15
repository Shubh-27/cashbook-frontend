import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';
import { AddTransactionModal } from './AddTransactionModal';

export function Layout() {
  return (
    <div className="flex h-screen w-full bg-slate-100 text-slate-900 font-sans overflow-hidden selection:bg-teal-200">
      <Sidebar />
      <div className="flex flex-col flex-1 h-full w-full overflow-hidden relative">
        <Topbar />
        <main className="flex-1 overflow-x-hidden overflow-y-auto w-full p-8 max-w-7xl mx-auto">
          <Outlet />
        </main>
      </div>
      <AddTransactionModal />
    </div>
  );
}
