import { create } from 'zustand';
import { api } from '@/services/api';
import type { VwAccountList, VwDescriptionList } from '@/types';

interface AppState {
  accounts: VwAccountList[];
  accountsError: string | null;
  fetchAccounts: () => Promise<void>;

  descriptions: VwDescriptionList[];
  descriptionsError: string | null;
  fetchDescriptions: () => Promise<void>;

  lastTransactionUpdate: number;
  refreshTransactions: () => void;

  quickAddOpen: boolean;
  setQuickAddOpen: (open: boolean) => void;
}

export const useAppStore = create<AppState>((set) => ({
  accounts: [],
  accountsError: null,

  fetchAccounts: async () => {
    try {
      const res = await api.listAccounts({ 
        page: 1, 
        page_size: -1, 
        sort_by: 'AccountName', 
        sort_order: 'asc' 
      });
      set({ accounts: res.data, accountsError: null });
    } catch (e) {
      console.error('Failed to fetch accounts:', e);
      set({ accountsError: e instanceof Error ? e.message : 'Failed to fetch accounts' });
    }
  },

  descriptions: [],
  descriptionsError: null,

  fetchDescriptions: async () => {
    try {
      const res = await api.listDescriptions({
        page: 1,
        page_size: -1,
        sort_by: 'DescriptionName',
        sort_order: 'asc',
      });
      set({ descriptions: res.data, descriptionsError: null });
    } catch (e) {
      console.error('Failed to fetch descriptions:', e);
      set({ descriptionsError: e instanceof Error ? e.message : 'Failed to fetch descriptions' });
    }
  },

  lastTransactionUpdate: 0,
  refreshTransactions: () => set((state) => ({ lastTransactionUpdate: state.lastTransactionUpdate + 1 })),

  quickAddOpen: false,
  setQuickAddOpen: (open: boolean) => set({ quickAddOpen: open }),
}));
