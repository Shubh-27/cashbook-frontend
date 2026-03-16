export interface Account {
  account_sid: string;
  account_name: string;
  account_number: string | null;
  bank_name: string | null;
  last_modified_date_time: string;
  last_modified_by_user_id?: number | null;
  status?: number;
}

export interface Description {
  description_sid: string;
  description_name: string;
  created_date_time: string | null;
  created_by_user_id?: number | null;
  last_modified_date_time: string | null;
  last_modified_by_user_id?: number | null;
  status?: number;
}

export interface Transaction {
  transaction_sid: string;
  transaction_date: string;
  account_sid?: string;
  description_sid?: string;
  description?: Description;
  debit: number | null;
  credit: number | null;
  notes: string | null;
}

// Generic Search & List Types
export interface FilterRequest {
  key: string;
  condition: 'equals' | 'contains' | 'greater_than' | 'less_than' | 'between';
  value?: any;
  from?: any;
  to?: any;
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
