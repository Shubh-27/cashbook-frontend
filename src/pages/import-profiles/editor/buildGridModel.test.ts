import { describe, expect, it } from 'vitest';
import { buildGridModel } from './buildGridModel';

describe('buildGridModel', () => {
  it('keeps real row numbers and derives columns from the selected header', () => {
    const model = buildGridModel({ cell_value_format: 'formatted_text', file_type: 'csv', worksheets: ['CSV'], selected_worksheet: 'CSV', first_rows: [{ row_number: 1, cells: ['Metadata'] }, { row_number: 2, cells: ['Date', ''] }], last_rows: [{ row_number: 480, cells: ['02-04-2024', 'Coffee'] }], divider_after_row: 2, total_rows: 480, detected_header_row: 2, footer_candidate_rows: [], secondary_table_candidate_rows: [], has_ambiguous_date_format: false }, 2);
    expect(model.rows.map(row => row.rowNumber)).toEqual([1, 2, 480]);
    expect(model.columns).toMatchObject([{ key: 'c0', name: 'Date' }, { key: 'c1', name: 'Column 2' }]);
  });
});
