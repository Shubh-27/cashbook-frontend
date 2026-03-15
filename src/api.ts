const API_URL = 'http://localhost:5000/api';

export const api = {
  getAccounts: async () => {
    const res = await fetch(`${API_URL}/accounts`);
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
  getTotalBalance: async () => {
    const res = await fetch(`${API_URL}/balance/total`);
    return res.json();
  },
  getAccountBalances: async () => {
    const res = await fetch(`${API_URL}/accounts/balances`);
    return res.json();
  },
  getDescriptions: async () => {
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
  getTransactions: async (options: { accountId?: string, search?: string, page?: number, limit?: number }) => {
    const query = new URLSearchParams();
    if (options.accountId) query.append('accountId', options.accountId);
    if (options.search) query.append('search', options.search);
    if (options.page) query.append('page', options.page.toString());
    if (options.limit) query.append('limit', options.limit.toString());
    
    const res = await fetch(`${API_URL}/transactions?${query.toString()}`);
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
  seedData: async () => {
    const res = await fetch(`${API_URL}/seed`, { method: 'POST' });
    return res.json();
  },
  exportDb: async () => {
    // For a file download, we trigger it via window location or a blob fetch
    window.location.href = `${API_URL}/export`;
    return { success: true };
  }
};
