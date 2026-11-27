import React from 'react';
import { LayoutDashboard, ArrowLeftRight, Building2, FileText, FileSpreadsheet, Settings, type LucideIcon } from 'lucide-react';
import { ROUTES } from './routes';

export type NavIcon = LucideIcon | React.ComponentType<{ className?: string; strokeWidth?: number | string }>;

export interface NavItem {
  name: string;
  shortName?: string;
  path: string;
  icon: NavIcon;
  showInBottomNav?: boolean;
  showInSidebar?: boolean;
}

/**
 * Shared Navigation Configuration
 * 
 * Note on Icon Discrepancy:
 * Sidebar previously used `Logo` for Transactions while BottomNav used `ArrowLeftRight`.
 * We have standardized on `ArrowLeftRight` as the route icon for Transactions.
 */
export const NAV_ITEMS: NavItem[] = [
  {
    name: 'Dashboard',
    path: ROUTES.DASHBOARD,
    icon: LayoutDashboard,
    showInBottomNav: true,
    showInSidebar: true,
  },
  {
    name: 'Transactions',
    path: ROUTES.TRANSACTIONS,
    icon: ArrowLeftRight,
    showInBottomNav: true,
    showInSidebar: true,
  },
  {
    name: 'Accounts',
    path: ROUTES.ACCOUNTS,
    icon: Building2,
    showInBottomNav: true,
    showInSidebar: true,
  },
  {
    name: 'Descriptions',
    path: ROUTES.DESCRIPTIONS,
    icon: FileText,
    showInBottomNav: true,
    showInSidebar: true,
  },
  {
    name: 'Import Profiles',
    shortName: 'Profiles',
    path: ROUTES.IMPORT_PROFILES,
    icon: FileSpreadsheet,
    showInBottomNav: true,
    showInSidebar: true,
  },
  {
    name: 'Settings',
    path: ROUTES.SETTINGS,
    icon: Settings,
    showInBottomNav: false,
    showInSidebar: true,
  },
];

export const SIDEBAR_NAV_ITEMS = NAV_ITEMS.filter(item => item.showInSidebar !== false);
export const BOTTOM_NAV_ITEMS = NAV_ITEMS.filter(item => item.showInBottomNav);

export const getPageTitle = (pathname: string): string => {
  if (pathname === ROUTES.TRANSACTIONS_IMPORT) return 'Import Statement';
  if (pathname === ROUTES.IMPORT_PROFILE_NEW) return 'Create Import Profile';
  if (pathname.startsWith(`${ROUTES.IMPORT_PROFILES}/`)) return 'Edit Import Profile';

  const match = NAV_ITEMS.find(
    item => item.path === pathname || (item.path !== '/' && pathname.startsWith(`${item.path}/`))
  );
  return match ? match.name : 'CashBook';
};

export const getMobileHeaderMeta = (pathname: string): { eyebrow: string; title: string; backTo?: string } => {
  if (pathname === ROUTES.TRANSACTIONS_IMPORT) {
    return { eyebrow: 'Transactions', title: 'Import Statement', backTo: ROUTES.TRANSACTIONS };
  }
  if (pathname === ROUTES.IMPORT_PROFILE_NEW) {
    return { eyebrow: 'Import Profiles', title: 'Create Import Profile', backTo: ROUTES.IMPORT_PROFILES };
  }
  if (pathname.startsWith(`${ROUTES.IMPORT_PROFILES}/`)) {
    return { eyebrow: 'Import Profiles', title: 'Edit Import Profile', backTo: ROUTES.IMPORT_PROFILES };
  }
  return { eyebrow: 'CashBook', title: getPageTitle(pathname) };
};
