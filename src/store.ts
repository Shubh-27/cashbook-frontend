import { create } from 'zustand';
import { api } from './api';
import type { Account } from './types';

interface AppState {
  accounts: Account[];
  fetchAccounts: () => Promise<void>;

  // Navigation / UI State
  selectedAccountSid: string | null;
  setSelectedAccount: (sid: string | null) => void;

  globalSearch: string;
  setGlobalSearch: (s: string) => void;

  quickAddOpen: boolean;
  setQuickAddOpen: (open: boolean) => void;
}

export const useAppStore = create<AppState>((set) => ({
  accounts: [],

  fetchAccounts: async () => {
    const res = await api.listAccounts({ page: 1, page_size: 1000 });
    set({ accounts: res.data as any }); // Cast for now as Account and VwAccountList are similar but slightly different
  },

  selectedAccountSid: null,
  setSelectedAccount: (sid: string | null) => set({ selectedAccountSid: sid }),

  globalSearch: '',
  setGlobalSearch: (s: string) => set({ globalSearch: s }),

  quickAddOpen: false,
  setQuickAddOpen: (open: boolean) => set({ quickAddOpen: open }),
}));
