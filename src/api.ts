import type { SearchRequest, PagedResult, VwTransactionList, VwAccountList, VwDescriptionList } from './types';
import { ValidationError } from './utils/validation';

const API_URL = 'http://localhost:5000/api';

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const url = `${API_URL}${path}`;
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  const res = await fetch(url, { ...options, headers });

  if (!res.ok) {
    let errorData;
    try {
      errorData = await res.json();
    } catch {
      throw new Error(res.statusText || 'API Request failed');
    }

    if (res.status === 400 && errorData.errors) {
      const formattedErrors: Record<string, string[]> = {};
      for (const key in errorData.errors) {
        const val = errorData.errors[key];
        formattedErrors[key] = Array.isArray(val) ? val : [val.toString()];
      }
      throw new ValidationError(errorData.message || 'Validation failed', formattedErrors);
    }

    throw new Error(errorData.message || res.statusText || 'API Request failed');
  }

  // Handle empty responses or non-JSON responses if needed, but for this app JSON is standard
  try {
    return await res.json();
  } catch {
    return {} as T;
  }
}

export const api = {
  // Accounts
  listAccounts: (data: SearchRequest) => 
    request<PagedResult<VwAccountList>>('/accounts/list', { method: 'POST', body: JSON.stringify(data) }),
  
  addAccount: (data: any) => 
    request<any>('/accounts', { method: 'POST', body: JSON.stringify(data) }),
  
  updateAccount: (sid: string, data: any) => 
    request<any>(`/accounts/${sid}`, { method: 'PUT', body: JSON.stringify(data) }),
  
  deleteAccount: (sid: string) => 
    request<any>(`/accounts/${sid}`, { method: 'DELETE' }),

  // Descriptions
  listDescriptions: (data: SearchRequest) => 
    request<PagedResult<VwDescriptionList>>('/descriptions/list', { method: 'POST', body: JSON.stringify(data) }),
  
  getDescriptions: () => 
    request<VwDescriptionList[]>('/descriptions'),
  
  addDescription: (data: any) => 
    request<any>('/descriptions', { method: 'POST', body: JSON.stringify(data) }),
  
  updateDescription: (sid: string, data: any) => 
    request<any>(`/descriptions/${sid}`, { method: 'PUT', body: JSON.stringify(data) }),
  
  deleteDescription: (sid: string) => 
    request<any>(`/descriptions/${sid}`, { method: 'DELETE' }),

  // Transactions
  listTransactions: (data: SearchRequest) => 
    request<PagedResult<VwTransactionList>>('/transactions/list', { method: 'POST', body: JSON.stringify(data) }),
  
  addTransaction: (data: any) => 
    request<any>('/transactions', { method: 'POST', body: JSON.stringify(data) }),
  
  updateTransaction: (sid: string, data: any) => 
    request<any>(`/transactions/${sid}`, { method: 'PUT', body: JSON.stringify(data) }),
  
  deleteTransaction: (sid: string, accountSid: string) => 
    request<any>(`/transactions/${sid}?accountSid=${accountSid}`, { method: 'DELETE' }),

  exportTransactions: async (data: any) => {
    const res = await fetch(`${API_URL}/transactions/export`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error('Export failed');
    const blob = await res.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    
    // Extract filename from Content-Disposition header if possible
    let filename = 'Cashbook_Export.xlsx';
    if (data.export_type === 'csv') filename = 'Cashbook_Export.csv';
    
    const disposition = res.headers.get('content-disposition');
    if (disposition && disposition.indexOf('attachment') !== -1) {
        const filenameMatch = disposition.match(/filename="?([^";]+)"?/);
        if (filenameMatch && filenameMatch.length === 2) {
            filename = filenameMatch[1];
        }
    }

    a.download = filename;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
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
