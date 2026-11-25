/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import { api } from '@/services/api';
import type { ImportProfilePreview, VersionedImportProfile, VersionedImportProfileRule } from '@/types';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { AlertCircle, ArrowLeft, FileSpreadsheet, RotateCcw, Save, ShieldCheck, Upload } from 'lucide-react';
import { ColumnMappingPanel } from '../components/ColumnMappingPanel';
import { ImportValidationSummary } from '../components/ImportValidationSummary';
import { ProfileRuleSummary } from '../components/ProfileRuleSummary';
import { SpreadsheetToolbar } from '../components/SpreadsheetToolbar';
import { StatementSpreadsheetGrid } from '../components/StatementSpreadsheetGrid';
import { buildGridModel } from './buildGridModel';
import { buildParsedRows, classifyRows } from './parsing';
import { previewErrorMessages } from './previewErrors';
import { isProfileValid } from './profileValidity';
import { detectDateFormat, formatSampleDatePreview } from './suggestMapping';
import { useImportProfileEditor } from './useImportProfileEditor';
import type { EditorState } from './useImportProfileEditor';
import { ROUTES } from '@/config/routes';
import { statementDateFormats } from '@/lib/statement-import';

function ErrorBanner({ error, onRetry }: { error?: string; onRetry?: () => void }) {
  if (!error) return null;
  return (
    <div role="alert" className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
      <div className="flex items-center gap-2">
        <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" aria-hidden="true" />
        <span>{error}</span>
      </div>
      {onRetry && (
        <Button type="button" size="xs" variant="outline" onClick={onRetry} className="border-rose-300 bg-white text-rose-800 hover:bg-rose-100">
          Choose another file
        </Button>
      )}
    </div>
  );
}

function PreviewSkeleton() {
  return (
    <div className="space-y-4 animate-pulse" aria-busy="true" aria-label="Loading statement preview">
      <div className="h-16 rounded-2xl bg-slate-200/70" />
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="h-[460px] rounded-2xl bg-slate-200/70" />
        <div className="space-y-4">
          <div className="h-64 rounded-2xl bg-slate-200/70" />
          <div className="h-32 rounded-2xl bg-slate-200/70" />
        </div>
      </div>
    </div>
  );
}

function previewFromSavedProfile(profile: VersionedImportProfile): ImportProfilePreview {
  const first_rows = profile.sample.top_rows.map(row => ({ row_number: row.row_number, cells: row.values }));
  const last_rows = profile.sample.bottom_rows.map(row => ({ row_number: row.row_number, cells: row.values }));
  const lastFirstRow = first_rows.at(-1)?.row_number;
  const firstLastRow = last_rows[0]?.row_number;
  return {
    cell_value_format: 'formatted_text',
    file_type: profile.file_type,
    worksheets: [profile.worksheet_name || 'Statement'],
    selected_worksheet: profile.worksheet_name || 'Statement',
    first_rows,
    last_rows,
    divider_after_row: lastFirstRow && firstLastRow && firstLastRow > lastFirstRow + 1 ? lastFirstRow : null,
    total_rows: Math.max(profile.end_row, first_rows.at(-1)?.row_number ?? 0, last_rows.at(-1)?.row_number ?? 0),
    detected_header_row: profile.header_row,
    footer_candidate_rows: [profile.end_row + 1],
    secondary_table_candidate_rows: [],
    has_ambiguous_date_format: false,
  };
}

function profileRuleFromState(state: EditorState): VersionedImportProfileRule {
  return {
    name: state.profileName?.trim() ?? '',
    worksheet_name: state.preview?.selected_worksheet,
    header_row: state.headerRow ?? 0,
    end_row: state.endRow ?? 0,
    date_format: state.dateFormat,
    date: state.columnMap.date,
    description: state.columnMap.description,
    debit: state.columnMap.debit,
    credit: state.columnMap.credit,
    amount: state.columnMap.amount,
    balance: state.columnMap.balance,
    notes: state.columnMap.notes,
  };
}

function GridSection({ rows, columns, state, dispatch, selected, setSelected, mapped, layoutLocked }: any) {
  const [focusRow, setFocusRow] = useState<number>();
  const [focusNonce, setFocusNonce] = useState(0);
  const [filterInvalid, setFilterInvalid] = useState(false);

  useEffect(() => {
    if (state.preview?.detected_header_row) {
      setFocusRow(state.preview.detected_header_row);
      setFocusNonce(n => n + 1);
    }
    setFilterInvalid(false);
  }, [state.previewNonce, state.preview?.detected_header_row]);

  const classified = useMemo(
    () => classifyRows(rows, state.headerRow, state.endRow, state.columnMap, state.dateFormat),
    [rows, state.headerRow, state.endRow, state.columnMap, state.dateFormat]
  );

  const rowReasons = useMemo(() => {
    const map: Record<number, string> = {};
    for (const item of classified.rows) {
      if (item.reason && item.status !== 'valid' && item.status !== 'excluded') {
        map[item.rowNumber] = item.reason;
      }
    }
    return map;
  }, [classified.rows]);

  const invalidCount = classified.counts.badDate + classified.counts.blankDate + classified.counts.badAmount + classified.counts.bothDebitAndCredit;
  const hasCoreMappings = state.columnMap.date !== undefined && state.columnMap.description !== undefined && (state.columnMap.amount !== undefined || state.columnMap.debit !== undefined || state.columnMap.credit !== undefined);

  useEffect(() => {
    if (invalidCount === 0 && filterInvalid) {
      setFilterInvalid(false);
    }
  }, [invalidCount, filterInvalid]);

  const parsedRows = useMemo(
    () => buildParsedRows(rows, state.headerRow, state.endRow, state.columnMap, state.dateFormat, 5),
    [rows, state.headerRow, state.endRow, state.columnMap, state.dateFormat]
  );

  const gridRows = useMemo(() => {
    if (filterInvalid) {
      return rows.filter((row: any) => row.rowNumber === state.headerRow || Boolean(rowReasons[row.rowNumber]));
    }
    const showPreHeader = state.showPreHeaderRows ?? false;
    const headerRow = state.headerRow;
    const preHeaderRows = headerRow && headerRow > 1 ? rows.filter((row: any) => row.rowNumber < headerRow) : [];
    const bodyRows = headerRow && headerRow > 1 ? rows.filter((row: any) => row.rowNumber >= headerRow) : rows;

    const firstRows = state.preview.divider_after_row === null ? bodyRows : bodyRows.filter((row: any) => row.rowNumber <= state.preview.divider_after_row);
    const lastRows = state.preview.divider_after_row === null ? [] : bodyRows.filter((row: any) => row.rowNumber > state.preview.divider_after_row);
    const hiddenCount = Math.max(0, state.preview.total_rows - rows.length);
    const divider = lastRows.length > 0 ? [{ id: 'preview-gap-divider', rowNumber: -1, c0: `… ${hiddenCount} rows hidden …`, isDivider: true }] : [];

    const preHeaderSection = preHeaderRows.length > 0
      ? showPreHeader
        ? [...preHeaderRows, { id: 'pre-header-divider', rowNumber: -2, isPreHeaderDivider: true, preHeaderCount: preHeaderRows.length }]
        : [{ id: 'pre-header-divider', rowNumber: -2, isPreHeaderDivider: true, preHeaderCount: preHeaderRows.length }]
      : [];

    return [...preHeaderSection, ...firstRows, ...divider, ...lastRows];
  }, [rows, state.preview.divider_after_row, state.preview.total_rows, state.headerRow, state.showPreHeaderRows, filterInvalid, rowReasons]);

  const focusDetectedRow = (row?: number) => {
    if (row) {
      setSelected(row);
      setFocusRow(row);
      setFocusNonce(n => n + 1);
    }
  };

  const canSetHeader = !layoutLocked && selected !== undefined && (state.endRow === undefined || selected < state.endRow);
  const canSetEnd = !layoutLocked && selected !== undefined && (state.headerRow === undefined || selected > state.headerRow);
  const headerDisabledReason = layoutLocked
    ? 'Upload a new sample file to change the header row'
    : selected !== undefined && state.endRow !== undefined && selected >= state.endRow
      ? 'Header row must be above the last transaction row'
      : undefined;
  const endDisabledReason = layoutLocked
    ? 'Upload a new sample file to change the end row'
    : selected !== undefined && state.headerRow !== undefined && selected <= state.headerRow
      ? 'Last transaction row must be below the header row'
      : undefined;

  const gridProps = {
    columns,
    mappingBadges: mapped,
    isPickingColumn: Boolean(state.activeField),
    focusRowNumber: focusRow,
    focusNonce,
    selectedRowId: selected ? String(selected) : undefined,
    headerRowId: state.headerRow ? String(state.headerRow) : undefined,
    lastTransactionRowId: state.endRow ? String(state.endRow) : undefined,
    isRowAboveHeader: (row: any) => !row.isDivider && !row.isPreHeaderDivider && Boolean(state.headerRow && row.rowNumber < state.headerRow),
    isRowExcluded: (row: any) => !row.isDivider && !row.isPreHeaderDivider && Boolean(state.endRow && row.rowNumber > state.endRow),
    getRowClassName: (row: any) => row.isDivider ? 'bg-slate-100 font-semibold text-slate-600' : undefined,
    onRowClick: (row: any) => {
      if (!row.isDivider && !row.isPreHeaderDivider) {
        setSelected((prev: number | undefined) => prev === row.rowNumber ? undefined : row.rowNumber);
      }
    },
    onColumnHeaderClick: (key: string) => {
      if (state.activeField) {
        dispatch({ type: 'map', field: state.activeField, column: Number(key.slice(1)) });
        dispatch({ type: 'active', field: undefined });
      }
    },
    showPreHeaderRows: state.showPreHeaderRows ?? false,
    onTogglePreHeaderRows: () => dispatch({ type: 'toggle-pre-header' }),
    rowReasons,
    selectedRowNumber: selected,
    onSetHeader: (row: number) => {
      dispatch({ type: 'header', row });
      setSelected(undefined);
    },
    onSetEnd: (row: number) => {
      dispatch({ type: 'end', row });
      setSelected(undefined);
    },
    canSetHeader,
    canSetEnd,
    headerDisabledReason,
    endDisabledReason,
    onDismissRowPopover: () => setSelected(undefined),
  };

  const handleToggleFilterInvalid = () => {
    const next = !filterInvalid;
    setFilterInvalid(next);
    if (next) {
      const firstInvalidRow = classified.rows.find(item => item.status !== 'valid' && item.status !== 'excluded');
      if (firstInvalidRow) {
        setFocusRow(firstInvalidRow.rowNumber);
        setFocusNonce(n => n + 1);
      }
    }
  };

  return (
    <section className="space-y-4">
      {(state.autoHeaderRow || state.autoEndRow) ? (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-teal-200 bg-teal-50/70 px-4 py-3">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-slate-700">
            <span className="font-semibold text-teal-950">Detected ✓</span>
            {state.autoHeaderRow && (
              <span className="inline-flex items-center gap-1.5">
                Header: row {state.headerRow ?? state.autoHeaderRow}
                <Button size="xs" variant="outline" onClick={() => focusDetectedRow(state.headerRow ?? state.autoHeaderRow)}>
                  View row
                </Button>
              </span>
            )}
            {state.autoEndRow && (
              <span className="inline-flex items-center gap-1.5">
                Transactions end: row {state.endRow ?? state.autoEndRow}
                <Button size="xs" variant="outline" onClick={() => focusDetectedRow(state.endRow ?? state.autoEndRow)}>
                  View row
                </Button>
              </span>
            )}
          </div>
          {!layoutLocked && (
            <Button
              size="xs"
              variant="ghost"
              onClick={() => {
                setSelected(undefined);
                dispatch({ type: 'reset' });
              }}
              className="text-teal-800 hover:bg-teal-100/70 hover:text-teal-950"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Reset to detected
            </Button>
          )}
        </div>
      ) : !state.headerRow ? (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          Header row could not be detected automatically. Click any row in the preview below and choose <strong>Set as header</strong>.
        </div>
      ) : null}

      <div className="space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
          <span>
            {layoutLocked
              ? 'Upload a new sample file above to change header or end rows.'
              : 'Click any row to set header or transaction end row.'}
          </span>
          {filterInvalid && (
            <button
              type="button"
              onClick={() => setFilterInvalid(false)}
              className="font-medium text-rose-700 underline underline-offset-2 hover:text-rose-900"
            >
              Showing rows needing attention · Show all rows
            </button>
          )}
        </div>
        <StatementSpreadsheetGrid rows={gridRows} {...gridProps} />
        <p className="text-xs text-slate-500">
          Showing first and final 100 rows; rows in the middle gap are excluded from manual selection.
        </p>
      </div>

      {hasCoreMappings && (
        <div className="space-y-4">
          <ImportValidationSummary
            validRows={classified.counts.valid}
            excludedRows={classified.counts.excluded}
            invalidRows={invalidCount}
            duplicateRows={0}
            onFilterInvalid={handleToggleFilterInvalid}
            filterInvalidActive={filterInvalid}
          />
          <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm" aria-labelledby="parsed-result-heading">
            <div className="flex items-baseline justify-between gap-2">
              <h2 id="parsed-result-heading" className="text-sm font-semibold text-slate-900">Parsed result</h2>
              <p className="text-xs text-slate-500">First {parsedRows.length} parsed transactions</p>
            </div>
            {parsedRows.length > 0 ? (
              <div className="mt-3 overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-500">
                      <th className="pb-2 pr-3 font-medium">Date</th>
                      <th className="pb-2 pr-3 font-medium">Description</th>
                      <th className="pb-2 pr-3 text-right font-medium">Debit</th>
                      <th className="pb-2 text-right font-medium">Credit</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {parsedRows.map(item => (
                      <tr key={item.rowNumber}>
                        <td className="whitespace-nowrap py-2 pr-3 font-mono text-slate-900">{item.date}</td>
                        <td className="max-w-[220px] truncate py-2 pr-3 text-slate-700" title={item.description}>{item.description}</td>
                        <td className="whitespace-nowrap py-2 pr-3 text-right font-mono tabular-nums text-rose-700">{item.debit}</td>
                        <td className="whitespace-nowrap py-2 text-right font-mono tabular-nums text-emerald-700">{item.credit}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="mt-3 text-xs text-slate-500">No valid transactions match the current mapping and date format.</p>
            )}
          </section>
        </div>
      )}
    </section>
  );
}

function SetupPanel({ state, dispatch, rows, columns, showErrors }: any) {
  const validity = useMemo(() => isProfileValid(state, state.preview), [state]);
  const mappedFields = useMemo(
    () => Object.entries(state.columnMap).filter(([, column]) => column !== undefined).map(([field]) => field),
    [state.columnMap]
  );

  const dateSamples = useMemo(() => {
    if (state.columnMap.date === undefined || state.headerRow === undefined) return [];
    const colKey = `c${state.columnMap.date}`;
    return rows
      .filter((r: any) => !r.isDivider && !r.isPreHeaderDivider && r.rowNumber > state.headerRow && (state.endRow === undefined || r.rowNumber <= state.endRow))
      .map((r: any) => String(r[colKey] ?? '').trim())
      .filter(Boolean);
  }, [rows, state.columnMap.date, state.headerRow, state.endRow]);

  const dateDetection = useMemo(() => detectDateFormat(dateSamples), [dateSamples]);
  const sampleFormatted = useMemo(
    () => formatSampleDatePreview(dateDetection.sampleRaw, state.dateFormat),
    [dateDetection.sampleRaw, state.dateFormat]
  );
  const selectedFormatInfo = statementDateFormats.find(item => item.value === state.dateFormat);

  const hasAmount = state.columnMap.amount !== undefined || state.columnMap.debit !== undefined || state.columnMap.credit !== undefined;
  const checklist = [
    { label: 'Profile name', done: Boolean(state.profileName?.trim()) },
    { label: 'Date column', done: state.columnMap.date !== undefined },
    { label: 'Description column', done: state.columnMap.description !== undefined },
    { label: 'Amount mapping', done: hasAmount },
  ];
  const isAmbiguous = Boolean(state.preview?.has_ambiguous_date_format || dateDetection.ambiguous);
  if (isAmbiguous) {
    checklist.push({ label: 'Date format', done: Boolean(state.dateFormat) });
  }

  return (
    <aside className="space-y-4 lg:sticky lg:top-4">
      <ColumnMappingPanel
        headers={columns.map((column: any) => column.name)}
        mapping={state.columnMap}
        amountMode={state.amountMode ?? 'split'}
        onAmountModeChange={mode => dispatch({ type: 'amount-mode', mode })}
        autoMappedFields={state.autoMappedFields ?? []}
        activeField={state.activeField}
        onActiveFieldChange={field => dispatch({ type: 'active', field })}
        onMappingChange={next => {
          const field = Object.keys(next).find(key => next[key as keyof typeof next] !== state.columnMap[key as keyof typeof state.columnMap]);
          if (field) dispatch({ type: 'map', field: field as keyof typeof state.columnMap, column: next[field as keyof typeof next] });
        }}
      />

      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm space-y-1.5">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1">
            <Label htmlFor="date-format" className="text-xs font-semibold text-slate-600">Date format</Label>
            {isAmbiguous && <span aria-hidden="true" className="text-xs text-rose-600">*</span>}
          </div>
          {dateDetection.confirmed && state.dateFormat && (
            <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-medium text-emerald-800 border border-emerald-200">
              Confirmed from sample
            </span>
          )}
        </div>
        <Select
          value={state.dateFormat || '__none__'}
          onValueChange={value => dispatch({ type: 'date-format', value: value === '__none__' ? undefined : value })}
        >
          <SelectTrigger id="date-format" aria-label="Date format" className="h-10 w-full rounded-xl border-slate-200 bg-white text-sm text-slate-900 shadow-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="rounded-xl">
            <SelectItem value="__none__">Choose format</SelectItem>
            {statementDateFormats.map(option => (
              <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        {selectedFormatInfo && (
          <p className="text-xs text-slate-500">Example: {selectedFormatInfo.example}</p>
        )}
        {dateDetection.sampleRaw && sampleFormatted && (
          <p className="text-xs text-slate-600">
            Sample: <span className="font-mono text-slate-900">{dateDetection.sampleRaw}</span> → <span className="font-medium text-teal-700">{sampleFormatted}</span>
          </p>
        )}
        {isAmbiguous && !state.dateFormat && (
          <p className="text-xs text-amber-800">Ambiguous, please choose a date format before saving.</p>
        )}
      </section>

      <ProfileRuleSummary
        mappedFields={mappedFields}
        problems={validity.problems}
        checklist={checklist}
        showErrors={showErrors}
      />
    </aside>
  );
}

export function ImportProfileEditorPage() {
  const { profileSID } = useParams();
  const [searchParams] = useSearchParams();
  const duplicateSID = !profileSID ? searchParams.get('duplicate') : null;
  const sourceProfileSID = profileSID ?? duplicateSID;
  const navigate = useNavigate();
  const [state, dispatch] = useImportProfileEditor();
  const [file, setFile] = useState<File>();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string>();
  const [selected, setSelected] = useState<number>();
  const [nameTouched, setNameTouched] = useState(false);
  const [attemptedSave, setAttemptedSave] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const profileNameInputRef = useRef<HTMLInputElement | null>(null);

  const loadPreview = async (next?: File, sheet?: string, preserveMappings = false) => {
    if (!next) return;
    setLoading(true);
    setError(undefined);
    try {
      const preview = await api.previewImportProfile(next, sheet);
      dispatch({ type: 'preview', preview, preserveMappings });
      setSelected(undefined);
    } catch (reason) {
      const exception = reason as Error & { code?: string };
      setError(previewErrorMessages[exception.code ?? ''] ?? (exception.message || 'Unable to read this file.'));
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelected = (next: File | null) => {
    if (!next) return;
    let preserveMappings = false;
    if (file && state.isDirty && Object.values(state.columnMap).some(value => value !== undefined)) {
      preserveMappings = !window.confirm('Replace file and reset column mappings? Click Cancel to keep current mappings.');
    }
    setFile(next);
    void loadPreview(next, undefined, preserveMappings);
  };

  useEffect(() => {
    if (state.preview && !state.profileName && !loading) {
      profileNameInputRef.current?.focus();
    }
  }, [state.previewNonce]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!state.isDirty || saving) return;
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = '';
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [state.isDirty, saving]);

  useEffect(() => {
    if (!sourceProfileSID) return;
    let active = true;
    setLoading(true);
    setError(undefined);
    void api.getVersionedImportProfile(sourceProfileSID).then(profile => {
      if (!active) return;
      dispatch({
        type: 'load',
        preview: previewFromSavedProfile(profile),
        profileName: duplicateSID ? `${profile.name} (Copy)` : profile.name,
        headerRow: profile.header_row,
        endRow: profile.end_row,
        dateFormat: profile.date_format ?? undefined,
        columnMap: {
          date: profile.date,
          description: profile.description,
          debit: profile.debit,
          credit: profile.credit,
          amount: profile.amount,
          balance: profile.balance,
          notes: profile.notes,
        },
      });
    }).catch(reason => {
      if (active) setError(reason instanceof Error ? reason.message : 'Unable to load this import profile.');
    }).finally(() => {
      if (active) setLoading(false);
    });
    return () => { active = false; };
  }, [sourceProfileSID, duplicateSID, dispatch]);

  const { rows, columns } = useMemo(() => buildGridModel(state.preview, state.headerRow), [state.preview, state.headerRow]);
  const mapped = useMemo(
    () => Object.fromEntries(Object.entries(state.columnMap).filter(([, column]) => column !== undefined).map(([field, column]) => [column!, field])),
    [state.columnMap]
  );
  const validity = isProfileValid(state, state.preview);
  const saveDisabled = saving || !state.preview || !validity.valid || (!profileSID && !file);
  const saveDisabledReason = !state.preview
    ? 'Upload a sample statement first.'
    : !validity.valid
      ? validity.problems.join(' • ')
      : !profileSID && !file
        ? 'Upload a sample statement first.'
        : undefined;

  const missingCount = validity.problems.length;
  const footerStatusText = !state.preview
    ? 'Upload a sample statement to continue'
    : missingCount === 0
      ? 'Ready to save'
      : missingCount === 1
        ? `1 requirement left: ${validity.problems[0].replace(/\.$/, '').toLowerCase()}`
        : `${missingCount} requirements left: ${validity.problems.map(p => p.replace(/\.$/, '').toLowerCase()).join(', ')}`;

  const save = async () => {
    setAttemptedSave(true);
    if (saveDisabled) return;
    setSaving(true);
    setError(undefined);
    try {
      const result = profileSID
        ? await api.updateVersionedImportProfile(profileSID, profileRuleFromState(state), file)
        : await api.createVersionedImportProfile(file!, profileRuleFromState(state));
      toast.success(`Profile saved as version ${result.version_number}.`);
      navigate(ROUTES.IMPORT_PROFILES);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Unable to save this import profile.');
    } finally {
      setSaving(false);
    }
  };

  const handleBack = () => {
    if (state.isDirty && !window.confirm('You have unsaved changes. Leave without saving?')) {
      return;
    }
    navigate(ROUTES.IMPORT_PROFILES);
  };

  const layoutLocked = Boolean(profileSID && !file);

  return (
    <div className="flex flex-1 flex-col gap-5 pb-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-teal-700">Import profiles</p>
          <h1 className="text-xl font-bold text-slate-800 md:text-2xl">{profileSID ? 'Edit import profile' : 'Create import profile'}</h1>
        </div>
        <Button type="button" variant="outline" size="sm" onClick={handleBack} className="rounded-xl border-slate-200 text-slate-700 hover:text-slate-900">
          <ArrowLeft className="h-4 w-4" />Back to profiles
        </Button>
      </div>

      <SpreadsheetToolbar
        profileName={state.profileName ?? ''}
        onProfileNameChange={value => dispatch({ type: 'profile-name', value })}
        onProfileNameBlur={() => setNameTouched(true)}
        profileNameInputRef={profileNameInputRef}
        selectedFileName={file?.name}
        onFileSelected={handleFileSelected}
        sheets={state.preview?.worksheets ?? []}
        selectedSheet={state.preview?.selected_worksheet ?? ''}
        onSelectedSheetChange={sheet => void loadPreview(file, sheet)}
        fileRequired={!profileSID}
      />

      <ErrorBanner error={error} onRetry={() => document.getElementById('sample-file')?.click()} />

      {!state.preview && !loading && (
        <section
          role="button"
          tabIndex={0}
          aria-label="Upload sample bank statement by dragging and dropping or browsing"
          onClick={() => document.getElementById('sample-file')?.click()}
          onKeyDown={event => {
            if (event.key === 'Enter' || event.key === ' ') {
              event.preventDefault();
              document.getElementById('sample-file')?.click();
            }
          }}
          onDragOver={event => {
            event.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={event => {
            event.preventDefault();
            setIsDragging(false);
            const dropped = event.dataTransfer.files?.[0] ?? null;
            handleFileSelected(dropped);
          }}
          className={`cursor-pointer rounded-2xl border-2 border-dashed px-6 py-7 text-center shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 ${
            isDragging ? 'border-teal-600 bg-teal-50/60' : 'border-slate-300 bg-white hover:border-teal-500 hover:bg-slate-50/50'
          }`}
        >
          <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-2xl bg-teal-50 text-teal-700">
            <FileSpreadsheet className="h-5 w-5" />
          </div>
          <h2 className="mt-3 text-base font-semibold text-slate-900">Drag & drop your sample statement, or browse</h2>
          <p className="mt-1 text-xs text-slate-500">CSV, XLS, or XLSX · Up to 10 MB</p>
          <div className="mt-4">
            <Button
              type="button"
              onClick={event => {
                event.stopPropagation();
                document.getElementById('sample-file')?.click();
              }}
              className="h-10 rounded-xl bg-teal-600 px-4 font-medium text-white hover:bg-teal-700"
            >
              <Upload className="mr-2 h-4 w-4" />
              Browse files
            </Button>
          </div>
          <div className="mx-auto mt-5 flex max-w-2xl flex-wrap items-center justify-center gap-x-4 gap-y-2 text-xs text-slate-600">
            <span><strong className="text-teal-800">1.</strong> Name it</span>
            <span aria-hidden="true" className="text-slate-300">→</span>
            <span><strong className="text-teal-800">2.</strong> Upload a sample</span>
            <span aria-hidden="true" className="text-slate-300">→</span>
            <span><strong className="text-teal-800">3.</strong> Confirm the rules</span>
          </div>
          <p className="mt-4 inline-flex items-center gap-1.5 text-xs text-slate-500">
            <ShieldCheck className="h-3.5 w-3.5 text-teal-700" aria-hidden="true" />
            Processed locally on your CashBook backend to mask personal identifiers — never saved to disk or browser storage.
          </p>
        </section>
      )}

      {loading && <PreviewSkeleton />}

      {state.preview && !loading && (
        <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
          <GridSection
            rows={rows}
            columns={columns}
            state={state}
            dispatch={dispatch}
            selected={selected}
            setSelected={setSelected}
            mapped={mapped}
            layoutLocked={layoutLocked}
          />
          <SetupPanel
            state={state}
            dispatch={dispatch}
            rows={rows}
            columns={columns}
            showErrors={attemptedSave || nameTouched}
          />
        </div>
      )}

      <footer className="sticky bottom-3 z-20 mt-auto rounded-2xl border border-slate-200 bg-white/95 px-4 py-3 shadow-md backdrop-blur-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className={`text-sm ${missingCount === 0 && state.preview ? 'font-medium text-emerald-700' : 'text-slate-600'}`}>
            {footerStatusText}
          </p>
          <span title={saveDisabled ? saveDisabledReason : undefined}>
            <Button
              type="button"
              onClick={() => void save()}
              disabled={saveDisabled}
              className="h-10 rounded-xl bg-teal-600 px-4 font-medium text-white hover:bg-teal-700 disabled:bg-slate-200 disabled:text-slate-500 disabled:opacity-100"
            >
              <Save className="mr-2 h-4 w-4" />
              {saving ? 'Saving…' : 'Save profile'}
            </Button>
          </span>
        </div>
      </footer>
    </div>
  );
}
