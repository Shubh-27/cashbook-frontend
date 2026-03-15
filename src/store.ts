import { create } from 'zustand';
import { api } from './api';
import type { Account } from './types';

interface AppState {
  accounts: Account[];
  totalBalance: number;
  fetchAccountsAndBalance: () => Promise<void>;
  
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
  totalBalance: 0,
  
  fetchAccountsAndBalance: async () => {
    const balance = await api.getTotalBalance();
    const accounts = await api.getAccountBalances();
    set({ totalBalance: balance, accounts });
  },

  selectedAccountSid: null,
  setSelectedAccount: (sid: string | null) => set({ selectedAccountSid: sid }),
  
  globalSearch: '',
  setGlobalSearch: (s: string) => set({ globalSearch: s }),
  
  quickAddOpen: false,
  setQuickAddOpen: (open: boolean) => set({ quickAddOpen: open }),
}));
