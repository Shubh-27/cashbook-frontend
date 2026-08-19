import React from 'react';
import { LayoutDashboard, ArrowLeftRight, Building2, FileText, Settings, type LucideIcon } from 'lucide-react';

export type NavIcon = LucideIcon | React.ComponentType<{ className?: string; strokeWidth?: number | string }>;

export interface NavItem {
  name: string;
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
    path: '/',
    icon: LayoutDashboard,
    showInBottomNav: true,
    showInSidebar: true,
  },
  {
    name: 'Transactions',
    path: '/transactions',
    icon: ArrowLeftRight,
    showInBottomNav: true,
    showInSidebar: true,
  },
  {
    name: 'Accounts',
    path: '/accounts',
    icon: Building2,
    showInBottomNav: true,
    showInSidebar: true,
  },
  {
    name: 'Descriptions',
    path: '/descriptions',
    icon: FileText,
    showInBottomNav: true,
    showInSidebar: true,
  },
  {
    name: 'Settings',
    path: '/settings',
    icon: Settings,
    showInBottomNav: false,
    showInSidebar: true,
  },
];

export const SIDEBAR_NAV_ITEMS = NAV_ITEMS.filter(item => item.showInSidebar !== false);
export const BOTTOM_NAV_ITEMS = NAV_ITEMS.filter(item => item.showInBottomNav);

export const getPageTitle = (pathname: string): string => {
  const match = NAV_ITEMS.find(item => item.path === pathname);
  return match ? match.name : 'CashBook';
};
