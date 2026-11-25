import { describe, expect, it } from 'vitest';
import { buildLivePreview, classifyRows, formatStatementDate, parseStatementAmount } from './parsing';
import { editorReducer } from './useImportProfileEditor';

describe('import profile editor reducer', () => {
  it('sets rows, undoes and resets detection', () => {
    let state = editorReducer({ columnMap: {} }, { type: 'preview', preview: { cell_value_format: 'formatted_text', file_type: 'csv', worksheets: ['CSV'], selected_worksheet: 'CSV', first_rows: [], last_rows: [], divider_after_row: null, total_rows: 0, detected_header_row: 2, footer_candidate_rows: [9], secondary_table_candidate_rows: [], has_ambiguous_date_format: false } });
    state = editorReducer(state, { type: 'header', row: 3 }); state = editorReducer(state, { type: 'end', row: 7 }); expect(state.endRow).toBe(7);
    state = editorReducer(state, { type: 'undo' }); expect(state.endRow).toBe(8);
    state = editorReducer(state, { type: 'reset' }); expect(state.headerRow).toBe(2);
  });
  it('swaps duplicate mappings and changes format', () => {
    let state = editorReducer({ columnMap: { date: 0 } }, { type: 'map', field: 'description', column: 0 });
    expect(state.columnMap.date).toBeUndefined(); expect(state.columnMap.description).toBe(0);
    state = editorReducer(state, { type: 'date-format', value: 'dd/MM/yyyy' }); expect(state.dateFormat).toBe('dd/MM/yyyy');
  });
  it('clears the previous field when a mapped column is reassigned', () => {
    const state = editorReducer({ columnMap: { debit: 2, credit: 3 } }, { type: 'map', field: 'amount', column: 2 });
    expect(state.columnMap.debit).toBeUndefined(); expect(state.columnMap.amount).toBe(2);
  });
  it('keeps unrelated mappings when resolving a column conflict', () => {
    const state = editorReducer({ columnMap: { date: 0, description: 1 } }, { type: 'map', field: 'notes', column: 0 });
    expect(state.columnMap).toMatchObject({ date: undefined, description: 1, notes: 0 });
  });
});

describe('statement parsers', () => {
  it('parses amounts and dates', () => {
    expect(parseStatementAmount('₹1,200.50')).toBe(1200.5); expect(parseStatementAmount('(350.00)')).toBe(-350); expect(parseStatementAmount('250 Cr')).toBe(250);
    expect(formatStatementDate('02-04-2024', 'dd-MM-yyyy')).toBe('02 Apr 2024'); expect(formatStatementDate('2024-04-02')).toBe('02 Apr 2024');
  });
});

describe('live preview and row classification', () => {
  const mapping = { date: 0, description: 1, debit: 2, credit: 3, amount: 4 };
  it.each([
    [{ rowNumber: 1, c0: '02-04-2024', c1: 'Coffee', c2: '₹350', c3: '-' }, 'dd-MM-yyyy', '₹350.00', '—'],
    [{ rowNumber: 1, c0: '2024-04-02T00:00:00', c1: 'Salary', c2: '-', c3: '1,000' }, undefined, '—', '₹1000.00'],
    [{ rowNumber: 1, c0: '02/04/2024', c1: 'Fee', c4: '(250)' }, 'dd/MM/yyyy', '₹250.00', '—'],
    [{ rowNumber: 1, c0: '02-04-2024', c1: 'Refund', c4: '250 Cr' }, 'dd-MM-yyyy', '—', '₹250.00'],
  ])('builds preview variants', (row, format, debit, credit) => { const preview = buildLivePreview(row, mapping, format); expect(preview?.debit).toBe(debit); expect(preview?.credit).toBe(credit); });
  it('returns null for no valid row', () => expect(buildLivePreview({ rowNumber: 1, c0: '', c1: 'x' }, mapping, 'dd-MM-yyyy')).toBeNull());
  it('classifies all transaction states', () => {
    const result = classifyRows([
      { rowNumber: 1, c0: 'Date', c1: 'Description' }, { rowNumber: 2, c0: '', c1: 'x', c2: '1' }, { rowNumber: 3, c0: 'bogus', c1: 'x', c2: '1' }, { rowNumber: 4, c0: '02-04-2024', c1: 'x' }, { rowNumber: 5, c0: '02-04-2024', c1: 'x', c2: '1', c3: '1' }, { rowNumber: 6, c0: '02-04-2024', c1: 'x', c2: '1' }, { rowNumber: 7, c0: '02-04-2024', c1: 'x', c2: '1' },
    ], 1, 6, mapping, 'dd-MM-yyyy');
    expect(result.counts).toMatchObject({ header: 1, blankDate: 1, badDate: 1, badAmount: 1, bothDebitAndCredit: 1, valid: 1, excluded: 1 });
  });
});
