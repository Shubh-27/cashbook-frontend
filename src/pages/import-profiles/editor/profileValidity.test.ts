import { describe, expect, it } from 'vitest';
import type { EditorState } from './useImportProfileEditor';
import { isProfileValid } from './profileValidity';

const preview = { has_ambiguous_date_format: false } as const;
const validState = (): EditorState => ({ profileName: 'Axis CSV', headerRow: 2, endRow: 10, dateFormat: 'dd-MM-yyyy', columnMap: { date: 0, description: 1, debit: 2, credit: 3 } });

describe('isProfileValid', () => {
  it('accepts a complete profile', () => expect(isProfileValid(validState(), preview)).toEqual({ valid: true, problems: [] }));
  it('requires a profile name', () => { const state = validState(); state.profileName = ' '; expect(isProfileValid(state, preview).problems).toContain('Enter a profile name.'); });
  it('requires both row selections in the correct order', () => { const state = validState(); state.headerRow = undefined; state.endRow = 2; const problems = isProfileValid(state, preview).problems; expect(problems).toContain('Select a header row.'); state.headerRow = 3; expect(isProfileValid(state, preview).problems).toContain('Transactions must end after the header row.'); });
  it('requires Date and Description mappings', () => { const state = validState(); state.columnMap = { debit: 2 }; const problems = isProfileValid(state, preview).problems; expect(problems).toContain('Map the Date column.'); expect(problems).toContain('Map the Description column.'); });
  it('rejects mixed Amount and Debit/Credit mappings', () => { const state = validState(); state.columnMap.amount = 4; expect(isProfileValid(state, preview).problems).toContain('Use either Amount or Debit/Credit columns, not both.'); });
  it('requires an Amount or Debit/Credit mapping', () => { const state = validState(); state.columnMap = { date: 0, description: 1 }; expect(isProfileValid(state, preview).problems).toContain('Map an Amount, Debit, or Credit column.'); });
  it('requires a date format for ambiguous previews', () => { const state = validState(); state.dateFormat = undefined; expect(isProfileValid(state, { has_ambiguous_date_format: true }).problems).toContain('Choose a date format for ambiguous dates.'); });
  it('rejects duplicate column mappings', () => { const state = validState(); state.columnMap.description = 0; expect(isProfileValid(state, preview).problems).toContain('Each mapped field must use a different column.'); });
});
