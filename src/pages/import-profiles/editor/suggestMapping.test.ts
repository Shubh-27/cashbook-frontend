import { describe, expect, it } from 'vitest';
import { detectDateFormat, formatSampleDatePreview, inferProfileName, suggestColumnMapping } from './suggestMapping';

describe('suggestColumnMapping', () => {
  it('auto-maps HDFC/Axis/SBI-style headers (Tran Date / CHQNO / PARTICULARS / DR / CR / BAL)', () => {
    const result = suggestColumnMapping(['SRL NO', 'Tran Date', 'CHQNO', 'PARTICULARS', 'DR', 'CR', 'BAL']);
    expect(result.mapping).toEqual({
      date: 1,
      description: 3,
      debit: 4,
      credit: 5,
      balance: 6,
    });
    expect(result.amountMode).toBe('split');
    expect(result.autoMappedFields).toEqual(['date', 'description', 'debit', 'credit', 'balance']);
  });

  it('chooses single amount mode when signed amount is present without debit/credit', () => {
    const result = suggestColumnMapping(['Posting Date', 'Remarks', 'Amount']);
    expect(result.mapping).toEqual({ date: 0, description: 1, amount: 2 });
    expect(result.amountMode).toBe('single');
    expect(result.autoMappedFields).toEqual(['date', 'description', 'amount']);
  });

  it('matches trimmed case-insensitive withdrawal/deposit aliases', () => {
    const result = suggestColumnMapping(['  Value Date ', ' Details ', ' Withdrawal Amt ', ' Deposit Amt ']);
    expect(result.mapping).toEqual({ date: 0, description: 1, debit: 2, credit: 3 });
    expect(result.amountMode).toBe('split');
  });
});

describe('detectDateFormat', () => {
  it('detects unambiguous dd/MM/yyyy and formats a live preview', () => {
    const result = detectDateFormat(['01/04/2026', '15/04/2026', '23/04/2026']);
    expect(result.format).toBe('dd/MM/yyyy');
    expect(result.ambiguous).toBe(false);
    expect(result.confirmed).toBe(true);
    expect(result.sampleRaw).toBe('01/04/2026');
    expect(result.sampleFormatted).toBe('01 Apr 2026');
  });

  it('detects yyyy-MM-dd and dd-MM-yyyy', () => {
    expect(detectDateFormat(['2026-04-01', '2026-04-15'])).toMatchObject({ format: 'yyyy-MM-dd', ambiguous: false, confirmed: true, sampleFormatted: '01 Apr 2026' });
    expect(detectDateFormat(['01-04-2026', '19-04-2026'])).toMatchObject({ format: 'dd-MM-yyyy', ambiguous: false, confirmed: true, sampleFormatted: '01 Apr 2026' });
  });

  it('detects Excel serial numbers', () => {
    const result = detectDateFormat(['46113', '46114']);
    expect(result.format).toBe('excel_serial');
    expect(result.ambiguous).toBe(false);
    expect(result.confirmed).toBe(true);
    expect(result.sampleFormatted).toBe('01 Apr 2026');
  });

  it('flags ambiguous day/month dates when no value exceeds 12', () => {
    const result = detectDateFormat(['03/04/2026', '05/06/2026']);
    expect(result.format).toBeUndefined();
    expect(result.ambiguous).toBe(true);
    expect(result.confirmed).toBe(false);
    expect(result.sampleRaw).toBe('03/04/2026');
    expect(formatSampleDatePreview('03/04/2026', 'dd/MM/yyyy')).toBe('03 Apr 2026');
  });
});

describe('inferProfileName', () => {
  it('infers known bank name from pre-header metadata without including account numbers', () => {
    const rows = [
      { row_number: 1, cells: ['Axis Bank Statement Account No 922010044968634'] },
      { row_number: 2, cells: ['Tran Date', 'PARTICULARS', 'DR', 'CR'] },
    ];
    const name = inferProfileName(rows, 2, 'xls');
    expect(name).toBe('Axis Bank XLS');
    expect(name).not.toContain('922010044968634');
  });

  it('returns empty string when no bank can be inferred', () => {
    expect(inferProfileName([{ row_number: 1, cells: ['Account holder: Example'] }], 2, 'csv')).toBe('');
  });
});
