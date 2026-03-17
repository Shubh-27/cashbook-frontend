import { create } from 'zustand';
import { api } from './api';
import type { Account } from './types';

interface AppState {
  accounts: Account[];
  fetchAccounts: () => Promise<void>;

  quickAddOpen: boolean;
  setQuickAddOpen: (open: boolean) => void;
}

export const useAppStore = create<AppState>((set) => ({
  accounts: [],

  fetchAccounts: async () => {
    const res = await api.listAccounts({ 
      page: 1, 
      page_size: -1, 
      sort_by: 'AccountName', 
      sort_order: 'asc' 
    });
    set({ accounts: res.data as any });
  },

  quickAddOpen: false,
  setQuickAddOpen: (open: boolean) => set({ quickAddOpen: open }),
}));
