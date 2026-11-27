import type { ImportProfilePreview, StatementColumnMapping } from '@/types';
import type { EditorState } from './useImportProfileEditor';

export interface ProfileValidity {
  valid: boolean;
  problems: string[];
}

const mapped = (state: EditorState, field: keyof StatementColumnMapping) => state.columnMap[field] !== undefined;

export function isProfileValid(state: EditorState, preview: Pick<ImportProfilePreview, 'has_ambiguous_date_format'> | undefined): ProfileValidity {
  const problems: string[] = [];
  if (!state.profileName?.trim()) problems.push('Enter a profile name.');
  if (state.headerRow === undefined) problems.push('Select a header row.');
  if (state.endRow === undefined) problems.push('Select where transactions end.');
  if (state.headerRow !== undefined && state.endRow !== undefined && state.endRow <= state.headerRow) problems.push('Transactions must end after the header row.');
  if (!mapped(state, 'date')) problems.push('Map the Date column.');

  const hasAmount = mapped(state, 'amount');
  const hasDebitOrCredit = mapped(state, 'debit') || mapped(state, 'credit');
  if (hasAmount && hasDebitOrCredit) problems.push('Use either Amount or Debit/Credit columns, not both.');
  if (!hasAmount && !hasDebitOrCredit) problems.push('Map an Amount, Debit, or Credit column.');

  if (preview?.has_ambiguous_date_format && !state.dateFormat) problems.push('Choose a date format for ambiguous dates.');
  const indices = Object.values(state.columnMap).filter((value): value is number => value !== undefined);
  if (new Set(indices).size !== indices.length) problems.push('Each mapped field must use a different column.');
  return { valid: problems.length === 0, problems };
}
