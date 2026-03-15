export interface Account {
  account_sid: string;
  account_name: string;
  account_number: string | null;
  bank_name: string | null;
  last_modified_date_time: string;
  last_modified_by_user_id?: number | null;
  status?: number;
  balance?: number;
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
  balance: number | null;
  notes: string | null;
}
