import type {
  SearchRequest,
  PagedResult,
  VwTransactionList,
  VwAccountList,
  VwDescriptionList,
  Account,
  Description,
  Transaction,
  CreateAccountDto,
  UpdateAccountDto,
  CreateDescriptionDto,
  UpdateDescriptionDto,
  CreateTransactionDto,
  UpdateTransactionDto,
  ExportTransactionsDto,
  DeleteResponse,
  DatabaseImportResponse,
} from '@/types';
import { ValidationError } from '@/utils/validation';
import { API_BASE_URL } from '@/config/constants';

const API_URL = API_BASE_URL;

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const url = `${API_URL}${path}`;
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  const res = await fetch(url, { ...options, headers });

  if (!res.ok) {
    let errorData: { message?: string; errors?: Record<string, string[] | string> } | undefined;
    try {
      errorData = await res.json();
    } catch {
      throw new Error(res.statusText || 'API Request failed');
    }

    if (res.status === 400 && errorData?.errors) {
      const formattedErrors: Record<string, string[]> = {};
      for (const key in errorData.errors) {
        const val = errorData.errors[key];
        formattedErrors[key] = Array.isArray(val) ? val : [val.toString()];
      }
      throw new ValidationError(errorData.message || 'Validation failed', formattedErrors);
    }

    throw new Error(errorData?.message || res.statusText || 'API Request failed');
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
  listAccounts: (data: SearchRequest, signal?: AbortSignal): Promise<PagedResult<VwAccountList>> =>
    request<PagedResult<VwAccountList>>('/accounts/list', { method: 'POST', body: JSON.stringify(data), signal }),

  addAccount: (data: CreateAccountDto, signal?: AbortSignal): Promise<Account> =>
    request<Account>('/accounts', { method: 'POST', body: JSON.stringify(data), signal }),

  updateAccount: (sid: string, data: UpdateAccountDto, signal?: AbortSignal): Promise<Account> =>
    request<Account>(`/accounts/${sid}`, { method: 'PUT', body: JSON.stringify(data), signal }),

  deleteAccount: (sid: string, signal?: AbortSignal): Promise<DeleteResponse> =>
    request<DeleteResponse>(`/accounts/${sid}`, { method: 'DELETE', signal }),

  // Descriptions
  listDescriptions: (data: SearchRequest, signal?: AbortSignal): Promise<PagedResult<VwDescriptionList>> =>
    request<PagedResult<VwDescriptionList>>('/descriptions/list', { method: 'POST', body: JSON.stringify(data), signal }),

  getDescriptions: (signal?: AbortSignal): Promise<Description[]> =>
    request<Description[]>('/descriptions', { signal }),

  addDescription: (data: CreateDescriptionDto, signal?: AbortSignal): Promise<Description> =>
    request<Description>('/descriptions', { method: 'POST', body: JSON.stringify(data), signal }),

  updateDescription: (sid: string, data: UpdateDescriptionDto, signal?: AbortSignal): Promise<Description> =>
    request<Description>(`/descriptions/${sid}`, { method: 'PUT', body: JSON.stringify(data), signal }),

  deleteDescription: (sid: string, signal?: AbortSignal): Promise<boolean> =>
    request<boolean>(`/descriptions/${sid}`, { method: 'DELETE', signal }),

  // Transactions
  listTransactions: (data: SearchRequest, signal?: AbortSignal): Promise<PagedResult<VwTransactionList>> =>
    request<PagedResult<VwTransactionList>>('/transactions/list', { method: 'POST', body: JSON.stringify(data), signal }),

  addTransaction: (data: CreateTransactionDto, signal?: AbortSignal): Promise<Transaction> =>
    request<Transaction>('/transactions', { method: 'POST', body: JSON.stringify(data), signal }),

  updateTransaction: (sid: string, data: UpdateTransactionDto, signal?: AbortSignal): Promise<Transaction> =>
    request<Transaction>(`/transactions/${sid}`, { method: 'PUT', body: JSON.stringify(data), signal }),

  deleteTransaction: (sid: string, accountSid: string, signal?: AbortSignal): Promise<boolean> =>
    request<boolean>(`/transactions/${sid}?accountSid=${encodeURIComponent(accountSid)}`, { method: 'DELETE', signal }),

  exportTransactions: async (data: ExportTransactionsDto, signal?: AbortSignal): Promise<void> => {
    const res = await fetch(`${API_URL}/transactions/export`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data),
      signal
    });
    if (!res.ok) throw new Error('Export failed');
    const blob = await res.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;

    // Extract filename from Content-Disposition header if possible
    let filename = 'Cashbook_Export.xlsx';
    if (data.export_type === 'csv') filename = 'Cashbook_Export.csv';

    const contentType = res.headers.get('content-type');
    if (contentType === 'application/zip') {
      filename = 'Cashbook_Export.zip';
    }

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
  exportDatabase: async (signal?: AbortSignal): Promise<void> => {
    const res = await fetch(`${API_URL}/database/export`, { signal });
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

  importDatabase: async (file: File, signal?: AbortSignal): Promise<DatabaseImportResponse> => {
    const formData = new FormData();
    formData.append('file', file);
    const res = await fetch(`${API_URL}/database/import`, {
      method: 'POST',
      body: formData,
      signal
    });
    if (!res.ok) {
      const error = await res.text();
      throw new Error(error || 'Import failed');
    }
    return res.json() as Promise<DatabaseImportResponse>;
  }
};
