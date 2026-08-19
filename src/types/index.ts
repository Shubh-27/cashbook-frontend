export interface Account {
  account_sid: string;
  account_name: string;
  account_number: number | null;
  bank_name: string | null;
  last_modified_date_time?: string | null;
  last_modified_by_user_id?: number | null;
  status?: number;
  transaction_count?: number;
  balance?: number | null;
}

export interface Description {
  description_sid: string;
  description_name: string;
  created_date_time?: string | null;
  created_by_user_id?: number | null;
  last_modified_date_time?: string | null;
  last_modified_by_user_id?: number | null;
  status?: number;
  usage_count?: number;
}

export interface Transaction {
  transaction_sid: string;
  transaction_date: string;
  account_sid?: string | null;
  account_name?: string | null;
  description_sid?: string | null;
  description_name?: string | null;
  description?: Description;
  account?: Account;
  debit: number | null;
  credit: number | null;
  balance?: number | null;
  notes: string | null;
  status?: number;
}

// Generic Search & List Types
export type FilterValue = string | number | boolean | (string | number)[] | null;

export interface FilterRequest {
  key: string;
  condition: 'equals' | 'contains' | 'greater_than' | 'less_than' | 'between' | 'in';
  value?: FilterValue;
  from?: string | number | Date | null;
  to?: string | number | Date | null;
  type?: string;
}

export interface SearchRequest {
  search?: string;
  page: number;
  page_size: number;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
  filters?: FilterRequest[];
}

export interface PagedResult<T> {
  data: T[];
  total_count: number;
  page: number;
  page_size: number;
}

export interface VwTransactionList {
  transaction_sid: string;
  transaction_date: string;
  debit: number;
  credit: number;
  balance: number;
  notes: string | null;
  status: number;
  account_sid: string | null;
  account_name: string | null;
  description_sid: string | null;
  description_name: string | null;
  account_number?: number | null;
  bank_name?: string | null;
}

export interface VwAccountList {
  account_sid: string;
  account_name: string;
  bank_name: string | null;
  account_number: number | null;
  transaction_count: number;
  status: number;
}

export interface VwDescriptionList {
  description_sid: string;
  description_name: string;
  usage_count: number;
  status: number;
}

// Request DTOs
export interface CreateAccountDto {
  account_name: string;
  bank_name?: string | null;
  account_number?: string | null;
}

export interface UpdateAccountDto {
  account_name: string;
  bank_name?: string | null;
  account_number?: string | null;
}

export interface CreateDescriptionDto {
  description_name: string;
}

export interface UpdateDescriptionDto {
  description_name: string;
}

export interface CreateTransactionDto {
  account_sid: string;
  transaction_date: string;
  description_sid?: string | null;
  description_name?: string | null;
  debit?: number | null;
  credit?: number | null;
  notes?: string | null;
}

export interface UpdateTransactionDto {
  account_sid?: string | null;
  transaction_date?: string;
  description_sid?: string | null;
  description_name?: string | null;
  debit?: number | null;
  credit?: number | null;
  notes?: string | null;
}

export interface ExportTransactionsDto extends SearchRequest {
  export_type?: 'excel' | 'csv' | string;
  separate_sheets?: boolean;
  excel_name?: string;
  account_sid?: string | null;
  description_sid?: string | null;
  merge_accounts?: boolean;
  merge_descriptions?: boolean;
}

export interface DeleteResponse {
  success: boolean;
}

export interface DatabaseImportResponse {
  message: string;
}

