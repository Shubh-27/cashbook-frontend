import { describe, expect, it } from 'vitest';
import { previewErrorMessages } from './previewErrors';

describe('previewErrorMessages', () => {
  it('explains how to convert HTML spreadsheets', () => {
    expect(previewErrorMessages.html_spreadsheet).toContain('save it as .xlsx or .csv');
  });
});
