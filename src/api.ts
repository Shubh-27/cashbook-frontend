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
  StatementImportAnalysis,
  CommitStatementImportDto,
  StatementImportCommitResult,
  ImportProfile,
  ImportBatch,
  ImportProfilePreview,
  VersionedImportProfile,
  VersionedImportProfileResult,
  VersionedImportProfileRule,
} from '@/types';
import { ValidationError } from '@/utils/validation';
import { API_BASE_URL } from '@/config/constants';
import { API_ENDPOINTS } from '@/config/endpoints';

const API_URL = API_BASE_URL;

async function requestRaw(path: string, options: RequestInit = {}): Promise<Response> {
  const url = `${API_URL}${path}`;
  const res = await fetch(url, options);

  if (!res.ok) {
    let errorData: { message?: string; errors?: Record<string, string[] | string>; problems?: Array<{ message?: string }> } | undefined;
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

    const problems = errorData?.problems?.map(problem => problem.message).filter((message): message is string => Boolean(message));
    const error = new Error(errorData?.message || problems?.join(' ') || textError || res.statusText || 'API Request failed');
    Object.assign(error, { code: (errorData as { error?: string } | undefined)?.error });
    throw error;
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
  },

  analyzeStatement: async (file: File, options: { sheetName?: string; headerRow?: number; transactionEndRow?: number; profileSID?: string; dateFormat?: string; mapping?: import('@/types').StatementColumnMapping; accountSID?: string } = {}, signal?: AbortSignal): Promise<StatementImportAnalysis> => {
    const formData = new FormData();
    formData.append('file', file);
    if (options.sheetName) formData.append('sheetName', options.sheetName);
    if (options.headerRow) formData.append('headerRow', String(options.headerRow));
    if (options.transactionEndRow) formData.append('transactionEndRow', String(options.transactionEndRow));
    if (options.profileSID) formData.append('profileSID', options.profileSID);
    if (options.dateFormat) formData.append('dateFormat', options.dateFormat);
    if (options.mapping) formData.append('mappingJson', JSON.stringify(options.mapping));
    if (options.accountSID) formData.append('accountSID', options.accountSID);
    const res = await requestRaw(API_ENDPOINTS.STATEMENT_IMPORTS.ANALYZE, { method: 'POST', body: formData, signal });
    return res.json() as Promise<StatementImportAnalysis>;
  },

  previewImportProfile: async (file: File, worksheetName?: string, signal?: AbortSignal): Promise<ImportProfilePreview> => {
    const formData = new FormData();
    formData.append('file', file);
    if (worksheetName) formData.append('worksheetName', worksheetName);
    const res = await requestRaw(API_ENDPOINTS.IMPORT_PROFILES.PREVIEW, { method: 'POST', body: formData, signal });
    return res.json() as Promise<ImportProfilePreview>;
  },

  createVersionedImportProfile: async (file: File, rule: VersionedImportProfileRule, signal?: AbortSignal): Promise<VersionedImportProfileResult> => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('rule', JSON.stringify(rule));
    const res = await requestRaw(API_ENDPOINTS.IMPORT_PROFILES.BASE, { method: 'POST', body: formData, signal });
    return res.json() as Promise<VersionedImportProfileResult>;
  },

  updateVersionedImportProfile: async (sid: string, rule: VersionedImportProfileRule, file?: File, signal?: AbortSignal): Promise<VersionedImportProfileResult> => {
    const formData = new FormData();
    if (file) formData.append('file', file);
    formData.append('rule', JSON.stringify(rule));
    const res = await requestRaw(API_ENDPOINTS.IMPORT_PROFILES.BY_ID(sid), { method: 'PUT', body: formData, signal });
    return res.json() as Promise<VersionedImportProfileResult>;
  },

  getVersionedImportProfile: (sid: string, signal?: AbortSignal): Promise<VersionedImportProfile> =>
    request<VersionedImportProfile>(API_ENDPOINTS.IMPORT_PROFILES.BY_ID(sid), { signal }),

  commitStatementImport: (data: CommitStatementImportDto, signal?: AbortSignal): Promise<StatementImportCommitResult> =>
    request<StatementImportCommitResult>(API_ENDPOINTS.STATEMENT_IMPORTS.COMMIT, { method: 'POST', body: JSON.stringify(data), signal }),

  listImportProfiles: (data: SearchRequest, signal?: AbortSignal): Promise<PagedResult<ImportProfile>> =>
    request<PagedResult<ImportProfile>>(API_ENDPOINTS.IMPORT_PROFILES.LIST, { method: 'POST', body: JSON.stringify(data), signal }),
  getImportProfiles: (signal?: AbortSignal): Promise<ImportProfile[]> => request<ImportProfile[]>(API_ENDPOINTS.STATEMENT_IMPORTS.PROFILES, { signal }),
  deleteImportProfile: (sid: string, signal?: AbortSignal): Promise<DeleteResponse> => request<DeleteResponse>(API_ENDPOINTS.IMPORT_PROFILES.BY_ID(sid), { method: 'DELETE', signal }),
  getImportHistory: (signal?: AbortSignal): Promise<ImportBatch[]> => request<ImportBatch[]>(API_ENDPOINTS.STATEMENT_IMPORTS.HISTORY, { signal }),
  undoStatementImport: (sid: string, signal?: AbortSignal): Promise<DeleteResponse> => request<DeleteResponse>(API_ENDPOINTS.STATEMENT_IMPORTS.UNDO(sid), { method: 'POST', signal }),
};
