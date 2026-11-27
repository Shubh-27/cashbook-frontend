import type { StatementColumnMapping, StatementImportRow } from '@/types';

export type ReviewFilter = 'all' | 'ready' | 'invalid' | 'excluded' | 'duplicates';

export interface IndexedImportRow {
  row: StatementImportRow;
  index: number;
}

export interface RowFieldIssues {
  date: string;
  description: string;
  amount: string;
}

export function splitRowIssues(issues: string[]): RowFieldIssues {
  const dateIssues: string[] = [];
  const descriptionIssues: string[] = [];
  const amountIssues: string[] = [];
  const otherIssues: string[] = [];

  for (const issue of issues) {
    const lower = issue.toLowerCase();
    if (lower.includes('date')) dateIssues.push(issue);
    else if (lower.includes('description')) descriptionIssues.push(issue);
    else if (lower.includes('amount') || lower.includes('debit') || lower.includes('credit')) amountIssues.push(issue);
    else otherIssues.push(issue);
  }

  return {
    date: dateIssues.join(' '),
    description: [...descriptionIssues, ...otherIssues].join(' '),
    amount: amountIssues.join(' '),
  };
}

export function getRowType(row: StatementImportRow): 'debit' | 'credit' {
  return (row.credit ?? 0) > 0 && (row.debit ?? 0) <= 0 ? 'credit' : 'debit';
}

export const mappingFields: Array<[keyof StatementColumnMapping, string, boolean]> = [
  ['date', 'Transaction date', true],
  ['notes', 'Notes / narration', false],
  ['description', 'Description / tag', false],
  ['debit', 'Debit / withdrawal', false],
  ['credit', 'Credit / deposit', false],
  ['amount', 'Signed amount', false],
  ['balance', 'Balance', false],
];

export function revalidateRow(next: StatementImportRow, preserveInclude = false): StatementImportRow {
  const issues: string[] = [];
  if (!next.transaction_date) issues.push('Transaction date is required.');
  if (!next.description?.trim()) issues.push('Description is required.');
  if ((next.debit ?? 0) <= 0 && (next.credit ?? 0) <= 0) issues.push('A debit or credit amount is required.');
  if ((next.debit ?? 0) > 0 && (next.credit ?? 0) > 0) issues.push('A row cannot contain both debit and credit.');
  const wasInvalid = next.status === 'invalid';
  const isNowValid = issues.length === 0;
  const nextStatus = !isNowValid
    ? 'invalid'
    : next.status === 'exact_duplicate' || next.status === 'possible_duplicate'
      ? next.status
      : 'new';
  return {
    ...next,
    issues,
    status: nextStatus,
    include: preserveInclude
      ? next.include
      : !isNowValid
        ? false
        : wasInvalid
          ? true
          : next.include,
  };
}
