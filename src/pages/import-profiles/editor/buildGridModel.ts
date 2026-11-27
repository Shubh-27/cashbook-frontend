import type { ImportProfilePreview } from '@/types';
import type { SpreadsheetColumn, SpreadsheetRow } from '../components/StatementSpreadsheetGrid';

function inferColumnLayout(name: string): { width: number; align?: 'left' | 'right' } {
  const lower = name.trim().toLowerCase();
  if (/\b(date|dt)\b/.test(lower)) return { width: 108, align: 'left' };
  if (/\b(particular|narration|description|remark|detail)s?\b/.test(lower)) return { width: 188, align: 'left' };
  if (/\b(balance|bal)\b/.test(lower)) return { width: 96, align: 'right' };
  if (/\b(dr|cr|debit|credit|amount|amt|withdrawal|deposit)\b/.test(lower)) return { width: 82, align: 'right' };
  if (/\b(srl|sr|sno|no|chq|cheque|ref|sol)\b/.test(lower)) return { width: 58, align: 'left' };
  return { width: 90, align: 'left' };
}

export function buildGridModel(preview: ImportProfilePreview | undefined, headerRow?: number): { rows: SpreadsheetRow[]; columns: SpreadsheetColumn[] } {
  if (!preview) return { rows: [], columns: [] };
  const rows = [...preview.first_rows, ...preview.last_rows].map(row => Object.assign(
    { id: String(row.row_number), rowNumber: row.row_number },
    ...row.cells.map((cell, index) => ({ [`c${index}`]: cell })),
  ));
  const sampleRows = [...preview.first_rows, ...preview.last_rows];
  const headerCells = sampleRows.find(row => row.row_number === headerRow)?.cells ?? preview.first_rows[0]?.cells ?? [];
  return {
    rows,
    columns: headerCells.map((name, index) => {
      const displayName = name || `Column ${index + 1}`;
      const layout = inferColumnLayout(displayName);
      return { key: `c${index}`, name: displayName, width: layout.width, align: layout.align };
    }),
  };
}
