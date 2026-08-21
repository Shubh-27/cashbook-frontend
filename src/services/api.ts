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
import { API_ENDPOINTS } from '@/config/endpoints';

const API_URL = API_BASE_URL;

async function requestRaw(path: string, options: RequestInit = {}): Promise<Response> {
  const url = `${API_URL}${path}`;
  const res = await fetch(url, options);

  if (!res.ok) {
    let errorData: { message?: string; errors?: Record<string, string[] | string> } | undefined;
    let textError = '';
    try {
      const text = await res.text();
      try {
        errorData = JSON.parse(text);
      } catch {
        textError = text;
      }
    } catch {
      // ignore read error
    }

    if (res.status === 400 && errorData?.errors) {
      const formattedErrors: Record<string, string[]> = {};
      for (const key in errorData.errors) {
        const val = errorData.errors[key];
        formattedErrors[key] = Array.isArray(val) ? val : [val.toString()];
      }
      throw new ValidationError(errorData.message || 'Validation failed', formattedErrors);
    }

    throw new Error(errorData?.message || textError || res.statusText || 'API Request failed');
  }

  return res;
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  const res = await requestRaw(path, { ...options, headers });
  try {
    return await res.json();
  } catch {
    return {} as T;
  }
}

function extractFilenameFromHeader(disposition: string | null, defaultFilename: string): string {
  if (!disposition || !disposition.includes('attachment')) {
    return defaultFilename;
  }

  // 1. Check for RFC 5987 encoded filename: filename*=charset'lang'encoded-value
  const rfc5987Match = disposition.match(/filename\*=(?:UTF-8|utf-8)?''([^;]+)/i);
  if (rfc5987Match && rfc5987Match[1]) {
    try {
      return decodeURIComponent(rfc5987Match[1].trim());
    } catch {
      // Fallback to standard match if decode fails
    }
  }

  // 2. Check for standard filename: filename="value" or filename=value
  const standardMatch = disposition.match(/filename="?([^";]+)"?/i);
  if (standardMatch && standardMatch[1]) {
    return standardMatch[1].trim();
  }

  return defaultFilename;
}

async function downloadBlobResponse(res: Response, defaultFilename: string): Promise<void> {
  const blob = await res.blob();
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.style.display = 'none';
  a.href = url;
  a.download = extractFilenameFromHeader(res.headers.get('content-disposition'), defaultFilename);

  document.body.appendChild(a);
  try {
    a.click();
  } finally {
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  }
}

export const api = {
  // Accounts
  listAccounts: (data: SearchRequest, signal?: AbortSignal): Promise<PagedResult<VwAccountList>> =>
    request<PagedResult<VwAccountList>>(API_ENDPOINTS.ACCOUNTS.LIST, { method: 'POST', body: JSON.stringify(data), signal }),

  addAccount: (data: CreateAccountDto, signal?: AbortSignal): Promise<Account> =>
    request<Account>(API_ENDPOINTS.ACCOUNTS.BASE, { method: 'POST', body: JSON.stringify(data), signal }),

  updateAccount: (sid: string, data: UpdateAccountDto, signal?: AbortSignal): Promise<Account> =>
    request<Account>(API_ENDPOINTS.ACCOUNTS.BY_ID(sid), { method: 'PUT', body: JSON.stringify(data), signal }),

  deleteAccount: (sid: string, signal?: AbortSignal): Promise<DeleteResponse> =>
    request<DeleteResponse>(API_ENDPOINTS.ACCOUNTS.BY_ID(sid), { method: 'DELETE', signal }),

  // Descriptions
  listDescriptions: (data: SearchRequest, signal?: AbortSignal): Promise<PagedResult<VwDescriptionList>> =>
    request<PagedResult<VwDescriptionList>>(API_ENDPOINTS.DESCRIPTIONS.LIST, { method: 'POST', body: JSON.stringify(data), signal }),

  getDescriptions: (signal?: AbortSignal): Promise<Description[]> =>
    request<Description[]>(API_ENDPOINTS.DESCRIPTIONS.BASE, { signal }),

  addDescription: (data: CreateDescriptionDto, signal?: AbortSignal): Promise<Description> =>
    request<Description>(API_ENDPOINTS.DESCRIPTIONS.BASE, { method: 'POST', body: JSON.stringify(data), signal }),

  updateDescription: (sid: string, data: UpdateDescriptionDto, signal?: AbortSignal): Promise<Description> =>
    request<Description>(API_ENDPOINTS.DESCRIPTIONS.BY_ID(sid), { method: 'PUT', body: JSON.stringify(data), signal }),

  deleteDescription: (sid: string, signal?: AbortSignal): Promise<DeleteResponse> =>
    request<DeleteResponse>(API_ENDPOINTS.DESCRIPTIONS.BY_ID(sid), { method: 'DELETE', signal }),

  // Transactions
  listTransactions: (data: SearchRequest, signal?: AbortSignal): Promise<PagedResult<VwTransactionList>> =>
    request<PagedResult<VwTransactionList>>(API_ENDPOINTS.TRANSACTIONS.LIST, { method: 'POST', body: JSON.stringify(data), signal }),

  addTransaction: (data: CreateTransactionDto, signal?: AbortSignal): Promise<Transaction> =>
    request<Transaction>(API_ENDPOINTS.TRANSACTIONS.BASE, { method: 'POST', body: JSON.stringify(data), signal }),

  updateTransaction: (sid: string, data: UpdateTransactionDto, signal?: AbortSignal): Promise<Transaction> =>
    request<Transaction>(API_ENDPOINTS.TRANSACTIONS.BY_ID(sid), { method: 'PUT', body: JSON.stringify(data), signal }),

  deleteTransaction: (sid: string, accountSid: string, signal?: AbortSignal): Promise<DeleteResponse> =>
    request<DeleteResponse>(API_ENDPOINTS.TRANSACTIONS.DELETE_WITH_ACCOUNT(sid, accountSid), { method: 'DELETE', signal }),

  exportTransactions: async (data: ExportTransactionsDto, signal?: AbortSignal): Promise<void> => {
    const res = await requestRaw(API_ENDPOINTS.TRANSACTIONS.EXPORT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
      signal,
    });

    let defaultFilename = 'Cashbook_Export.xlsx';
    if (data.export_type === 'csv') defaultFilename = 'Cashbook_Export.csv';

    const contentType = res.headers.get('content-type');
    if (contentType === 'application/zip') {
      defaultFilename = 'Cashbook_Export.zip';
    }

    await downloadBlobResponse(res, defaultFilename);
  },

  // Database
  exportDatabase: async (signal?: AbortSignal): Promise<void> => {
    const res = await requestRaw(API_ENDPOINTS.DATABASE.EXPORT, { signal });
    const defaultFilename = `bank_backup_${new Date().toISOString().split('T')[0]}.db`;
    await downloadBlobResponse(res, defaultFilename);
  },

  importDatabase: async (file: File, signal?: AbortSignal): Promise<DatabaseImportResponse> => {
    const formData = new FormData();
    formData.append('file', file);
    const res = await requestRaw(API_ENDPOINTS.DATABASE.IMPORT, {
      method: 'POST',
      body: formData,
      signal,
    });
    return res.json() as Promise<DatabaseImportResponse>;
  }
};
