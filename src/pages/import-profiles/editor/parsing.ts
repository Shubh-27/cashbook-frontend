import type { EditorColumnMapping } from './useImportProfileEditor';

export interface PreviewSourceRow { rowNumber: number; isDivider?: boolean; [columnKey: string]: string | number | boolean | null | undefined; }
export interface LivePreview { date: string; description: string; debit: string; credit: string; }
export interface ParsedTransactionRow { rowNumber: number; date: string; description: string; debit: string; credit: string; }
export type RowStatus = 'header' | 'valid' | 'excluded' | 'badDate' | 'badAmount' | 'blankDate' | 'bothDebitAndCredit';
export interface ClassifiedRows {
  rows: Array<{ rowNumber: number; status: RowStatus; reason?: string }>;
  counts: Record<RowStatus, number>;
}

const empty = (value?: string) => !value || value.trim() === '' || value.trim() === '-';
const cell = (row: PreviewSourceRow, column?: number) => column === undefined ? '' : String(row[`c${column}`] ?? '');

const STATUS_REASONS: Partial<Record<RowStatus, string>> = {
  blankDate: 'Missing date',
  badDate: 'Invalid date format',
  badAmount: 'Missing debit/credit amount',
  bothDebitAndCredit: 'Both debit and credit present',
};

export function parseStatementAmount(value?: string): number | undefined {
  if (empty(value)) return undefined;
  const text = value!.trim(); const negative = /^\(/.test(text) || /\bdr\b/i.test(text) || /^-/.test(text); const numeric = Number(text.replace(/[^0-9.]/g, ''));
  return Number.isFinite(numeric) && numeric > 0 ? (negative ? -numeric : numeric) : undefined;
}

export function excelSerialToIso(serial: number): string | undefined {
  if (!Number.isFinite(serial) || serial < 20000 || serial > 80000) return undefined;
  const epoch = Date.UTC(1899, 11, 30);
  const date = new Date(epoch + Math.round(serial) * 86400000);
  return Number.isNaN(date.valueOf()) ? undefined : date.toISOString().slice(0, 10);
}

export function formatStatementDate(value?: string, format?: string): string | undefined {
  if (empty(value)) return undefined;
  const text = value!.trim();
  if (format === 'excel_serial' || /^\d{5}(\.\d+)?$/.test(text)) {
    const isoSerial = excelSerialToIso(Number(text));
    if (isoSerial) return formatStatementDate(isoSerial);
  }
  const isoText = text.slice(0, 10);
  const iso = /^\d{4}-\d{2}-\d{2}$/.test(isoText) ? new Date(`${isoText}T00:00:00Z`) : undefined;
  if (iso && !Number.isNaN(iso.valueOf())) return iso.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', timeZone: 'UTC' });
  const monthMatch = text.match(/^(\d{1,2})\s+([A-Za-z]{3})\s+(\d{4})$/);
  if (monthMatch) {
    const parsed = new Date(`${monthMatch[1]} ${monthMatch[2]} ${monthMatch[3]} UTC`);
    if (!Number.isNaN(parsed.valueOf())) return parsed.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', timeZone: 'UTC' });
  }
  const match = text.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{2,4})$/); if (!match || !format) return undefined;
  const year = match[3].length === 2 ? 2000 + Number(match[3]) : Number(match[3]);
  const [first, second] = [Number(match[1]), Number(match[2])]; const dayFirst = format.startsWith('dd'); const date = new Date(Date.UTC(year, (dayFirst ? second : first) - 1, dayFirst ? first : second));
  return Number.isNaN(date.valueOf()) || date.getUTCDate() !== (dayFirst ? first : second) ? undefined : date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', timeZone: 'UTC' });
}

export function buildLivePreview(row: PreviewSourceRow | undefined, mapping: EditorColumnMapping, dateFormat?: string): LivePreview | null {
  if (!row) return null;
  const date = formatStatementDate(cell(row, mapping.date), dateFormat); const description = cell(row, mapping.description).trim(); if (!date || !description) return null;
  const debit = parseStatementAmount(cell(row, mapping.debit)); const credit = parseStatementAmount(cell(row, mapping.credit)); const amount = parseStatementAmount(cell(row, mapping.amount));
  if (debit !== undefined && credit !== undefined || amount === undefined && debit === undefined && credit === undefined) return null;
  const actualDebit = amount !== undefined ? amount < 0 ? Math.abs(amount) : undefined : debit === undefined ? undefined : Math.abs(debit); const actualCredit = amount !== undefined ? amount > 0 ? amount : undefined : credit === undefined ? undefined : Math.abs(credit);
  return { date, description, debit: actualDebit === undefined ? '—' : `₹${actualDebit.toFixed(2)}`, credit: actualCredit === undefined ? '—' : `₹${actualCredit.toFixed(2)}` };
}

export function buildParsedRows(
  rows: PreviewSourceRow[],
  headerRow: number | undefined,
  endRow: number | undefined,
  mapping: EditorColumnMapping,
  dateFormat?: string,
  limit = 5,
): ParsedTransactionRow[] {
  const result: ParsedTransactionRow[] = [];
  for (const row of rows) {
    if (row.isDivider || row.rowNumber < 1) continue;
    if (headerRow !== undefined && row.rowNumber <= headerRow) continue;
    if (endRow !== undefined && row.rowNumber > endRow) continue;
    const preview = buildLivePreview(row, mapping, dateFormat);
    if (preview) {
      result.push({ rowNumber: row.rowNumber, ...preview });
      if (result.length >= limit) break;
    }
  }
  return result;
}

export function classifyRows(rows: PreviewSourceRow[], headerRow?: number, endRow?: number, mapping: EditorColumnMapping = {}, dateFormat?: string): ClassifiedRows {
  const counts: Record<RowStatus, number> = { header: 0, valid: 0, excluded: 0, badDate: 0, badAmount: 0, blankDate: 0, bothDebitAndCredit: 0 };
  const classified = rows
    .filter(row => !row.isDivider && row.rowNumber >= 1)
    .map(row => {
      let status: RowStatus;
      if (row.rowNumber === headerRow) status = 'header';
      else if ((headerRow !== undefined && row.rowNumber < headerRow) || (endRow !== undefined && row.rowNumber > endRow)) status = 'excluded';
      else if (empty(cell(row, mapping.date))) status = 'blankDate';
      else if (!formatStatementDate(cell(row, mapping.date), dateFormat)) status = 'badDate';
      else {
        const debit = parseStatementAmount(cell(row, mapping.debit));
        const credit = parseStatementAmount(cell(row, mapping.credit));
        const amount = parseStatementAmount(cell(row, mapping.amount));
        status = debit !== undefined && credit !== undefined ? 'bothDebitAndCredit' : amount === undefined && debit === undefined && credit === undefined ? 'badAmount' : 'valid';
      }
      counts[status]++;
      return { rowNumber: row.rowNumber, status, reason: STATUS_REASONS[status] };
    });
  return { rows: classified, counts };
}
