import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';
import { MobileHeader } from './MobileHeader';
import { BottomNav } from './BottomNav';
import { ErrorBoundary } from '@/components/ErrorBoundary';

export function Layout() {
  return (
    <div className="flex h-[100dvh] w-full bg-slate-100 text-slate-900 font-sans overflow-hidden selection:bg-teal-200">
      {/* Desktop Sidebar */}
      <Sidebar />

      <div className="flex flex-col flex-1 h-full w-full overflow-hidden relative">
        {/* Mobile Header (sticky top on mobile) */}
        <MobileHeader />

        {/* Desktop Topbar */}
        <Topbar />

        {/* Main Content Area — Mobile scrolls outer, Desktop tables scroll internally */}
        <div className="flex-1 overflow-x-hidden overflow-y-auto md:overflow-hidden w-full mobile-scroll">
          <main className="w-full p-4 sm:p-6 md:p-8 max-w-7xl mx-auto min-h-full md:h-full flex flex-col min-h-0">
            <ErrorBoundary>
              <Outlet />
            </ErrorBoundary>
          </main>
        </div>

        {/* Mobile Bottom Navigation Bar with Integrated Add Action */}
        <BottomNav />
      </div>
    </div>
  );
}

