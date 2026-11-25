import { useReducer } from 'react';
import type { ImportProfilePreview, StatementColumnMapping } from '@/types';
import { detectDateFormat, inferProfileName, suggestColumnMapping } from './suggestMapping';

export type EditorColumnMapping = Partial<Record<keyof StatementColumnMapping, number>>;
export type AmountMappingMode = 'single' | 'split';

export interface EditorState {
  profileName?: string;
  preview?: ImportProfilePreview;
  previewNonce?: number;
  headerRow?: number;
  endRow?: number;
  columnMap: EditorColumnMapping;
  autoMappedFields?: Array<keyof StatementColumnMapping>;
  amountMode?: AmountMappingMode;
  activeField?: keyof StatementColumnMapping;
  dateFormat?: string;
  autoHeaderRow?: number;
  autoEndRow?: number;
  showPreHeaderRows?: boolean;
  isDirty?: boolean;
  undo?: Pick<EditorState, 'headerRow' | 'endRow'>;
}

type Action =
  | { type: 'preview'; preview: ImportProfilePreview; preserveMappings?: boolean }
  | { type: 'load'; preview: ImportProfilePreview; profileName: string; headerRow: number; endRow: number; columnMap: EditorColumnMapping; dateFormat?: string }
  | { type: 'profile-name'; value: string }
  | { type: 'header'; row: number }
  | { type: 'end'; row: number }
  | { type: 'map'; field: keyof StatementColumnMapping; column?: number }
  | { type: 'amount-mode'; mode: AmountMappingMode }
  | { type: 'active'; field?: keyof StatementColumnMapping }
  | { type: 'date-format'; value?: string }
  | { type: 'toggle-pre-header' }
  | { type: 'undo' }
  | { type: 'reset' };

function getPreviewAutoState(preview: ImportProfilePreview) {
  const headerRow = preview.detected_header_row ?? undefined;
  const endRow = preview.footer_candidate_rows[0] ? preview.footer_candidate_rows[0] - 1 : undefined;
  const allRows = [...preview.first_rows, ...preview.last_rows];
  const headerCells = headerRow !== undefined
    ? (allRows.find(r => r.row_number === headerRow)?.cells ?? [])
    : [];
  const suggested = headerCells.length > 0
    ? suggestColumnMapping(headerCells)
    : { mapping: {}, autoMappedFields: [] as Array<keyof StatementColumnMapping>, amountMode: 'split' as AmountMappingMode };

  let dateFormat: string | undefined;
  if (suggested.mapping.date !== undefined && headerRow !== undefined) {
    const dateIdx = suggested.mapping.date;
    const dateSamples = allRows
      .filter(r => r.row_number > headerRow && (endRow === undefined || r.row_number <= endRow))
      .map(r => r.cells[dateIdx] ?? '')
      .filter(Boolean);
    dateFormat = detectDateFormat(dateSamples).format;
  }

  const inferredName = inferProfileName(allRows, headerRow, preview.file_type);

  return { headerRow, endRow, suggested, dateFormat, inferredName };
}

export function editorReducer(state: EditorState, action: Action): EditorState {
  if (action.type === 'profile-name') return { ...state, profileName: action.value, isDirty: true };

  if (action.type === 'preview') {
    const { headerRow, endRow, suggested, dateFormat, inferredName } = getPreviewAutoState(action.preview);
    const keepExisting = Boolean(action.preserveMappings);
    return {
      ...state,
      preview: action.preview,
      previewNonce: (state.previewNonce ?? 0) + 1,
      profileName: state.profileName?.trim() ? state.profileName : inferredName,
      columnMap: keepExisting ? state.columnMap : suggested.mapping,
      autoMappedFields: keepExisting ? (state.autoMappedFields ?? []) : suggested.autoMappedFields,
      amountMode: keepExisting ? (state.amountMode ?? 'split') : suggested.amountMode,
      activeField: undefined,
      dateFormat: keepExisting ? (state.dateFormat ?? dateFormat) : dateFormat,
      headerRow,
      endRow,
      autoHeaderRow: headerRow,
      autoEndRow: endRow,
      showPreHeaderRows: false,
      isDirty: true,
      undo: undefined,
    };
  }

  if (action.type === 'load') {
    const amountMode: AmountMappingMode =
      action.columnMap.amount !== undefined && action.columnMap.debit === undefined && action.columnMap.credit === undefined
        ? 'single'
        : 'split';
    return {
      ...state,
      preview: action.preview,
      previewNonce: (state.previewNonce ?? 0) + 1,
      profileName: action.profileName,
      headerRow: action.headerRow,
      endRow: action.endRow,
      autoHeaderRow: action.headerRow,
      autoEndRow: action.endRow,
      columnMap: action.columnMap,
      autoMappedFields: [],
      amountMode,
      activeField: undefined,
      dateFormat: action.dateFormat,
      showPreHeaderRows: false,
      isDirty: false,
      undo: undefined,
    };
  }

  if (action.type === 'header' || action.type === 'end') {
    return {
      ...state,
      isDirty: true,
      undo: { headerRow: state.headerRow, endRow: state.endRow },
      [action.type === 'header' ? 'headerRow' : 'endRow']: action.row,
    };
  }

  if (action.type === 'map') {
    const next = { ...state.columnMap };
    (Object.keys(next) as Array<keyof StatementColumnMapping>).forEach(key => {
      if (key !== action.field && next[key] === action.column) next[key] = undefined;
    });
    next[action.field] = action.column;
    const autoMappedFields = (state.autoMappedFields ?? []).filter(f => f !== action.field);
    return { ...state, columnMap: next, autoMappedFields, isDirty: true };
  }

  if (action.type === 'amount-mode') {
    const next = { ...state.columnMap };
    if (action.mode === 'single') {
      next.debit = undefined;
      next.credit = undefined;
    } else {
      next.amount = undefined;
    }
    const autoMappedFields = (state.autoMappedFields ?? []).filter(f =>
      action.mode === 'single' ? f !== 'debit' && f !== 'credit' : f !== 'amount'
    );
    return { ...state, amountMode: action.mode, columnMap: next, autoMappedFields, activeField: undefined, isDirty: true };
  }

  if (action.type === 'active') return { ...state, activeField: action.field };
  if (action.type === 'date-format') return { ...state, dateFormat: action.value, isDirty: true };
  if (action.type === 'toggle-pre-header') return { ...state, showPreHeaderRows: !state.showPreHeaderRows };
  if (action.type === 'undo') return state.undo ? { ...state, ...state.undo, undo: undefined, isDirty: true } : state;

  return { ...state, headerRow: state.autoHeaderRow, endRow: state.autoEndRow, undo: undefined };
}

export function useImportProfileEditor() {
  return useReducer(editorReducer, {
    profileName: '',
    columnMap: {},
    amountMode: 'split',
    autoMappedFields: [],
    previewNonce: 0,
    showPreHeaderRows: false,
    isDirty: false,
  });
}
