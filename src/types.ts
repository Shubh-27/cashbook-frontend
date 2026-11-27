export interface Account {
  account_sid: string;
  account_name: string;
  account_number: number | null;
  bank_name: string | null;
  last_modified_date_time?: string | null;
  last_modified_by_user_id?: number | null;
  status?: number;
  balance?: number | null;
}

export interface Description {
  description_sid: string;
  description_name: string;
  last_modified_date_time?: string | null;
  status?: number;
}

export interface Transaction {
  transaction_sid: string;
  transaction_date: string;
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
  transaction_date: string | null;
  debit: number | null;
  credit: number | null;
  balance: number | null;
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

export interface StatementColumnMapping {
  date?: string | null;
  description?: string | null;
  debit?: string | null;
  credit?: string | null;
  amount?: string | null;
  balance?: string | null;
  notes?: string | null;
}

export interface StatementImportRow {
  row_number: number;
  transaction_date: string | null;
  description: string | null;
  debit: number | null;
  credit: number | null;
  balance: number | null;
  notes: string | null;
  include: boolean;
  status: 'new' | 'invalid' | 'exact_duplicate' | 'possible_duplicate' | string;
  issues: string[];
}

export interface StatementHeaderCandidate {
  row_number: number;
  score: number;
  values: string[];
}

export interface StatementProfileSampleRow {
  row_number: number;
  values: string[];
}

export interface StatementProfileSample {
  top_rows: StatementProfileSampleRow[];
  bottom_rows: StatementProfileSampleRow[];
  transaction_end_row?: number | null;
  footer_marker?: string | null;
}

export interface StatementImportAnalysis {
  file_name: string;
  file_type: string;
  file_hash: string;
  sheets: string[];
  selected_sheet: string;
  header_row: number;
  transaction_end_row: number | null;
  header_candidates: StatementHeaderCandidate[];
  headers: string[];
  mapping: StatementColumnMapping;
  date_format: string | null;
  rows: StatementImportRow[];
  metadata: Record<string, string>;
  suggested_profile_sid: string | null;
  sample: StatementProfileSample;
}

export interface SaveImportProfileDto {
  name: string;
  file_type: string;
  worksheet_name?: string | null;
  header_row: number;
  transaction_end_row?: number | null;
  headers: string[];
  mapping: StatementColumnMapping;
  date_format?: string | null;
  sample?: StatementProfileSample | null;
}

export interface CommitStatementImportDto {
  account_sid: string;
  file_name: string;
  file_type: string;
  file_hash?: string | null;
  profile_sid?: string | null;
  save_profile?: SaveImportProfileDto | null;
  metadata?: Record<string, string>;
  rows: StatementImportRow[];
}

export interface StatementImportCommitResult {
  import_batch_sid: string;
  imported_rows: number;
  skipped_duplicate_rows: number;
  invalid_rows: number;
}

export interface ImportProfile extends SaveImportProfileDto {
  import_profile_sid: string;
}

export interface ImportBatch {
  import_batch_sid: string;
  source_file_name: string;
  profile_name?: string | null;
  account_name?: string | null;
  total_rows: number;
  imported_rows: number;
  skipped_duplicate_rows: number;
  invalid_rows: number;
  created_date_time?: string | null;
  undone_date_time?: string | null;
}

export interface ImportProfilePreviewRow { row_number: number; cells: string[]; }
export interface ImportProfilePreview {
  cell_value_format: 'formatted_text';
  file_type: string;
  worksheets: string[];
  selected_worksheet: string;
  first_rows: ImportProfilePreviewRow[];
  last_rows: ImportProfilePreviewRow[];
  divider_after_row: number | null;
  total_rows: number;
  detected_header_row: number | null;
  footer_candidate_rows: number[];
  secondary_table_candidate_rows: number[];
  has_ambiguous_date_format: boolean;
}

export interface VersionedImportProfileRule {
  name: string;
  worksheet_name?: string | null;
  header_row: number;
  end_row: number;
  date_format?: string | null;
  date?: number;
  description?: number;
  debit?: number;
  credit?: number;
  amount?: number;
  balance?: number;
  notes?: number;
  secondary_table_marker_row?: number;
}

export interface VersionedImportProfileResult {
  import_profile_sid: string;
  version_number: number;
}

export interface VersionedImportProfile extends VersionedImportProfileRule {
  import_profile_sid: string;
  version_number: number;
  file_type: string;
  sample: StatementProfileSample;
}

export interface TransactionFormValues {
  type: 'DEBIT' | 'CREDIT';
  account_sid: string;
  transaction_date: string; // YYYY-MM-DD
  amount: string;
  description_name: string;
  description_sid?: string;
  notes?: string;
  fastEntry?: boolean;
}

export interface FilterOption {
  value: string;
  label: string;
  subLabel?: string;
}


