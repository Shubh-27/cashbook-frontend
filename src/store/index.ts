import { create } from 'zustand';
import { api } from '@/services/api';
import type { VwAccountList, VwDescriptionList } from '@/types';

interface AppState {
  accounts: VwAccountList[];
  accountsLoaded: boolean;
  accountsError: string | null;
  fetchAccounts: () => Promise<void>;
  ensureAccountsLoaded: () => Promise<void>;

  descriptions: VwDescriptionList[];
  descriptionsLoaded: boolean;
  descriptionsError: string | null;
  fetchDescriptions: () => Promise<void>;
  ensureDescriptionsLoaded: () => Promise<void>;

  lastTransactionUpdate: number;
  refreshTransactions: () => void;

  quickAddOpen: boolean;
  setQuickAddOpen: (open: boolean) => void;
}

let accountsInFlight: Promise<void> | null = null;
let descriptionsInFlight: Promise<void> | null = null;

export const useAppStore = create<AppState>((set, get) => ({
  accounts: [],
  accountsLoaded: false,
  accountsError: null,

  fetchAccounts: async () => {
    const request = (async () => {
      try {
        const res = await api.listAccounts({ 
          page: 1, 
          page_size: -1, 
          sort_by: 'AccountName', 
          sort_order: 'asc' 
        });
        set({ accounts: res.data, accountsLoaded: true, accountsError: null });
      } catch (e) {
        console.error('Failed to fetch accounts:', e);
        set({ accountsError: e instanceof Error ? e.message : 'Failed to fetch accounts' });
      } finally {
        accountsInFlight = null;
      }
    })();
    accountsInFlight = request;
    return request;
  },

  ensureAccountsLoaded: async () => {
    if (get().accountsLoaded) return;
    if (accountsInFlight) return accountsInFlight;
    return get().fetchAccounts();
  },

  descriptions: [],
  descriptionsLoaded: false,
  descriptionsError: null,

  fetchDescriptions: async () => {
    const request = (async () => {
      try {
        const res = await api.listDescriptions({
          page: 1,
          page_size: -1,
          sort_by: 'DescriptionName',
          sort_order: 'asc',
        });
        set({ descriptions: res.data, descriptionsLoaded: true, descriptionsError: null });
      } catch (e) {
        console.error('Failed to fetch descriptions:', e);
        set({ descriptionsError: e instanceof Error ? e.message : 'Failed to fetch descriptions' });
      } finally {
        descriptionsInFlight = null;
      }
    })();
    descriptionsInFlight = request;
    return request;
  },

  ensureDescriptionsLoaded: async () => {
    if (get().descriptionsLoaded) return;
    if (descriptionsInFlight) return descriptionsInFlight;
    return get().fetchDescriptions();
  },

  lastTransactionUpdate: 0,
  refreshTransactions: () => set((state) => ({ lastTransactionUpdate: state.lastTransactionUpdate + 1 })),

  quickAddOpen: false,
  setQuickAddOpen: (open: boolean) => set({ quickAddOpen: open }),
}));
