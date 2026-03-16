import type { SearchRequest, PagedResult, VwTransactionList, VwAccountList, VwDescriptionList } from './types';

const API_URL = 'http://localhost:5000/api';

export const api = {
  // Accounts
  // Accounts
  listAccounts: async (request: SearchRequest): Promise<PagedResult<VwAccountList>> => {
    const res = await fetch(`${API_URL}/accounts/list`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request)
    });
    return res.json();
  },
  addAccount: async (data: any) => {
    const res = await fetch(`${API_URL}/accounts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return res.json();
  },
  updateAccount: async (sid: string, data: any) => {
    const res = await fetch(`${API_URL}/accounts/${sid}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return res.json();
  },
  deleteAccount: async (sid: string) => {
    const res = await fetch(`${API_URL}/accounts/${sid}`, {
      method: 'DELETE'
    });
    return res.json();
  },

  // Descriptions
  listDescriptions: async (request: SearchRequest): Promise<PagedResult<VwDescriptionList>> => {
    const res = await fetch(`${API_URL}/descriptions/list`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request)
    });
    return res.json();
  },
  getDescriptions: async (): Promise<VwDescriptionList[]> => {
    const res = await fetch(`${API_URL}/descriptions`);
    return res.json();
  },
  addDescription: async (data: any) => {
    const res = await fetch(`${API_URL}/descriptions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return res.json();
  },
  updateDescription: async (sid: string, data: any) => {
    const res = await fetch(`${API_URL}/descriptions/${sid}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return res.json();
  },
  deleteDescription: async (sid: string) => {
    const res = await fetch(`${API_URL}/descriptions/${sid}`, {
      method: 'DELETE'
    });
    return res.json();
  },

  // Transactions
  listTransactions: async (request: SearchRequest): Promise<PagedResult<VwTransactionList>> => {
    const res = await fetch(`${API_URL}/transactions/list`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request)
    });
    return res.json();
  },
  addTransaction: async (data: any) => {
    const res = await fetch(`${API_URL}/transactions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return res.json();
  },
  updateTransaction: async (sid: string, data: any) => {
    const res = await fetch(`${API_URL}/transactions/${sid}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return res.json();
  },
  deleteTransaction: async (sid: string, accountSid: string) => {
    const res = await fetch(`${API_URL}/transactions/${sid}?accountSid=${accountSid}`, {
      method: 'DELETE'
    });
    return res.json();
  },

  // Database
  exportDatabase: async () => {
    const res = await fetch(`${API_URL}/database/export`);
    if (!res.ok) throw new Error('Export failed');
    const blob = await res.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `bank_backup_${new Date().toISOString().split('T')[0]}.db`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  },
  importDatabase: async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    const res = await fetch(`${API_URL}/database/import`, {
      method: 'POST',
      body: formData
    });
    if (!res.ok) {
      const error = await res.text();
      throw new Error(error || 'Import failed');
    }
    return res.json();
  }
};
