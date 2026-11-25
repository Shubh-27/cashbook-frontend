import type { StatementColumnMapping } from '@/types';
import { excelSerialToIso, formatStatementDate } from './parsing';
import type { EditorColumnMapping } from './useImportProfileEditor';

export interface SuggestedMappingResult {
  mapping: EditorColumnMapping;
  autoMappedFields: Array<keyof StatementColumnMapping>;
  amountMode: 'single' | 'split';
}

export interface DetectedDateFormatResult {
  format?: string;
  ambiguous: boolean;
  confirmed: boolean;
  sampleRaw?: string;
  sampleFormatted?: string;
}

const DATE_ALIASES = new Set(['date', 'tran date', 'txn date', 'transaction date', 'value date', 'posting date']);
const DESCRIPTION_ALIASES = new Set(['particulars', 'narration', 'description', 'remarks', 'details']);
const DEBIT_ALIASES = new Set(['dr', 'debit', 'withdrawal', 'withdrawals', 'withdrawal amt']);
const CREDIT_ALIASES = new Set(['cr', 'credit', 'deposit', 'deposits', 'deposit amt']);
const AMOUNT_ALIASES = new Set(['amount', 'amt']);
const BALANCE_ALIASES = new Set(['balance', 'bal']);

function normalizeHeader(header: string): string {
  return header.trim().toLowerCase().replace(/\s+/g, ' ');
}

export function suggestColumnMapping(headers: string[]): SuggestedMappingResult {
  const mapping: EditorColumnMapping = {};
  const autoMappedFields: Array<keyof StatementColumnMapping> = [];
  const usedColumns = new Set<number>();

  const claimFirst = (field: keyof StatementColumnMapping, aliases: Set<string>) => {
    const index = headers.findIndex((header, idx) => !usedColumns.has(idx) && aliases.has(normalizeHeader(header)));
    if (index >= 0) {
      mapping[field] = index;
      usedColumns.add(index);
      autoMappedFields.push(field);
    }
  };

  claimFirst('date', DATE_ALIASES);
  claimFirst('description', DESCRIPTION_ALIASES);
  claimFirst('debit', DEBIT_ALIASES);
  claimFirst('credit', CREDIT_ALIASES);

  const hasSplit = mapping.debit !== undefined || mapping.credit !== undefined;
  if (!hasSplit) {
    claimFirst('amount', AMOUNT_ALIASES);
  }
  claimFirst('balance', BALANCE_ALIASES);

  return {
    mapping,
    autoMappedFields,
    amountMode: hasSplit || mapping.amount === undefined ? 'split' : 'single',
  };
}

const MONTH_NAME_RE = /^\d{1,2}\s+[A-Za-z]{3}\s+\d{4}$/;
const ISO_RE = /^\d{4}-\d{2}-\d{2}$/;
const SLASH_RE = /^(\d{1,2})\/(\d{1,2})\/(\d{2,4})$/;
const DASH_RE = /^(\d{1,2})-(\d{1,2})-(\d{2,4})$/;
const SERIAL_RE = /^\d{5}(\.\d+)?$/;

export function formatSampleDatePreview(rawValue: string | undefined, format?: string): string | undefined {
  if (!rawValue || !rawValue.trim()) return undefined;
  const trimmed = rawValue.trim();
  if (format === 'excel_serial' || SERIAL_RE.test(trimmed)) {
    const iso = excelSerialToIso(Number(trimmed));
    return iso ? formatStatementDate(iso) : undefined;
  }
  return formatStatementDate(trimmed, format);
}

export function detectDateFormat(values: string[]): DetectedDateFormatResult {
  const samples = values.map(v => v.trim()).filter(Boolean);
  if (samples.length === 0) return { ambiguous: false, confirmed: false };

  const sampleRaw = samples[0];

  if (samples.every(v => ISO_RE.test(v))) {
    return { format: 'yyyy-MM-dd', ambiguous: false, confirmed: true, sampleRaw, sampleFormatted: formatSampleDatePreview(sampleRaw, 'yyyy-MM-dd') };
  }

  if (samples.every(v => MONTH_NAME_RE.test(v))) {
    return { format: 'dd MMM yyyy', ambiguous: false, confirmed: true, sampleRaw, sampleFormatted: formatSampleDatePreview(sampleRaw, 'dd MMM yyyy') };
  }

  if (samples.every(v => SERIAL_RE.test(v))) {
    return { format: 'excel_serial', ambiguous: false, confirmed: true, sampleRaw, sampleFormatted: formatSampleDatePreview(sampleRaw, 'excel_serial') };
  }

  const detectDelimited = (re: RegExp, dmy4: string, dmy2: string, mdy4: string): DetectedDateFormatResult | null => {
    const matches = samples.map(v => v.match(re));
    if (!matches.every(Boolean)) return null;
    const parts = matches.map(m => [Number(m![1]), Number(m![2]), m![3].length]);
    const twoDigitYear = parts.some(([, , len]) => len === 2);
    const hasFirstOver12 = parts.some(([first]) => first > 12);
    const hasSecondOver12 = parts.some(([, second]) => second > 12);

    if (hasFirstOver12 && !hasSecondOver12) {
      const fmt = twoDigitYear ? dmy2 : dmy4;
      return { format: fmt, ambiguous: false, confirmed: true, sampleRaw, sampleFormatted: formatSampleDatePreview(sampleRaw, fmt) };
    }
    if (hasSecondOver12 && !hasFirstOver12 && !twoDigitYear) {
      return { format: mdy4, ambiguous: false, confirmed: true, sampleRaw, sampleFormatted: formatSampleDatePreview(sampleRaw, mdy4) };
    }
    return { ambiguous: true, confirmed: false, sampleRaw };
  };

  const slashResult = detectDelimited(SLASH_RE, 'dd/MM/yyyy', 'dd/MM/yy', 'MM/dd/yyyy');
  if (slashResult) return slashResult;

  const dashResult = detectDelimited(DASH_RE, 'dd-MM-yyyy', 'dd-MM-yy', 'MM/dd/yyyy');
  if (dashResult) return dashResult;

  return { ambiguous: false, confirmed: false, sampleRaw };
}

const KNOWN_BANKS: Array<[RegExp, string]> = [
  [/\bhdfc\b/i, 'HDFC Bank'],
  [/\baxis\b/i, 'Axis Bank'],
  [/\bicici\b/i, 'ICICI Bank'],
  [/\b(?:sbi|state bank of india)\b/i, 'SBI'],
  [/\bkotak\b/i, 'Kotak Bank'],
  [/\byes\s*bank\b/i, 'Yes Bank'],
  [/\bidfc\b/i, 'IDFC First Bank'],
  [/\bindusind\b/i, 'IndusInd Bank'],
  [/\bcanara\b/i, 'Canara Bank'],
  [/\bbank of baroda\b|\bbob\b/i, 'Bank of Baroda'],
  [/\bpunjab national bank\b|\bpnb\b/i, 'PNB'],
];

export function inferProfileName(rows: Array<{ row_number: number; cells: string[] }>, headerRow: number | undefined, fileType?: string): string {
  const metadataText = rows
    .filter(r => headerRow === undefined || r.row_number < headerRow)
    .slice(0, 20)
    .map(r => r.cells.join(' '))
    .join(' ');

  for (const [pattern, bankName] of KNOWN_BANKS) {
    if (pattern.test(metadataText)) {
      return fileType ? `${bankName} ${fileType.toUpperCase()}` : bankName;
    }
  }
  return '';
}
