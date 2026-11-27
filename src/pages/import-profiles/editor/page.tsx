import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import { api } from '@/api';
import { useAppStore } from '@/store';
import type { ImportProfilePreview, VersionedImportProfile, VersionedImportProfileRule } from '@/types';
import { Button } from '@/components/ui/button';
import { AlertCircle, FileSpreadsheet, Save, ShieldCheck, Upload } from 'lucide-react';
import { InnerPageHeader } from '@/components/common';
import { EditorGridSection } from '../components/EditorGridSection';
import { EditorSetupPanel } from '../components/EditorSetupPanel';
import { SpreadsheetToolbar } from '../components/SpreadsheetToolbar';
import { buildGridModel } from './buildGridModel';
import { previewErrorMessages } from './previewErrors';
import { isProfileValid } from './profileValidity';
import { useImportProfileEditor } from './useImportProfileEditor';
import type { EditorState } from './useImportProfileEditor';
import { ROUTES } from '@/config/routes';
import { ValidationError } from '@/utils/validation';

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

export function ImportProfileEditorPage() {
  const { profileSID } = useParams();
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
  const sampleFileInputRef = useRef<HTMLInputElement | null>(null);

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

  const lastFocusedPreviewNonceRef = useRef<number | undefined>(undefined);
  useEffect(() => {
    if (
      state.preview &&
      state.previewNonce !== lastFocusedPreviewNonceRef.current &&
      !state.profileName &&
      !loading
    ) {
      lastFocusedPreviewNonceRef.current = state.previewNonce;
      profileNameInputRef.current?.focus();
    }
  }, [state.preview, state.previewNonce, state.profileName, loading]);

  const setUnsavedEdits = useAppStore(storeState => storeState.setUnsavedEdits);

  useEffect(() => {
    setUnsavedEdits(Boolean(state.isDirty && !saving));
  }, [state.isDirty, saving, setUnsavedEdits]);

  useEffect(() => {
    return () => setUnsavedEdits(false);
  }, [setUnsavedEdits]);

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
    if (!profileSID) return;
    let active = true;
    setLoading(true);
    setError(undefined);
    void api.getVersionedImportProfile(profileSID).then(profile => {
      if (!active) return;
      dispatch({
        type: 'load',
        preview: previewFromSavedProfile(profile),
        profileName: profile.name,
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
  }, [profileSID, dispatch]);

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
      if (reason instanceof ValidationError) {
        const firstError = Object.values(reason.errors).flat()[0];
        setError(firstError ?? reason.message);
      } else {
        setError(reason instanceof Error ? reason.message : 'Unable to save this import profile.');
      }
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
    <div className="flex flex-1 min-w-0 flex-col gap-5 pb-4 md:pb-6">
      <InnerPageHeader
        breadcrumbs={[{ label: 'Import profiles', onClick: handleBack }]}
        title={profileSID ? 'Edit import profile' : 'Create import profile'}
        subtitle={
          profileSID
            ? 'Update column mappings and row rules. Any sample file you upload stays local and is not saved.'
            : 'Upload a sample statement to map columns and set row rules. Your source file is processed locally and is not saved.'
        }
      />

      <SpreadsheetToolbar
        profileName={state.profileName ?? ''}
        onProfileNameChange={value => dispatch({ type: 'profile-name', value })}
        onProfileNameBlur={() => setNameTouched(true)}
        profileNameInputRef={profileNameInputRef}
        sampleFileInputRef={sampleFileInputRef}
        selectedFileName={file?.name}
        onFileSelected={handleFileSelected}
        sheets={state.preview?.worksheets ?? []}
        selectedSheet={state.preview?.selected_worksheet ?? ''}
        onSelectedSheetChange={sheet => void loadPreview(file, sheet)}
        fileRequired={!profileSID}
      />

      <ErrorBanner error={error} onRetry={() => sampleFileInputRef.current?.click()} />

      {!state.preview && !loading && (
        <section
          aria-label="Upload sample bank statement by dragging and dropping or browsing"
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
          className={`rounded-2xl border-2 border-dashed px-6 py-7 text-center shadow-sm transition-colors ${
            isDragging ? 'border-teal-600 bg-teal-50/60' : 'border-slate-300 bg-white'
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
                sampleFileInputRef.current?.click();
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
          <p className="mt-4 inline-flex items-start gap-1.5 text-left sm:items-center sm:text-center text-xs text-slate-500">
            <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-teal-700 sm:mt-0" aria-hidden="true" />
            Processed locally on your CashBook backend to mask personal identifiers — never saved to disk or browser storage.
          </p>
        </section>
      )}

      {loading && <PreviewSkeleton />}

      {state.preview && !loading && (
        <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
          <EditorGridSection
            rows={rows}
            columns={columns}
            state={state}
            dispatch={dispatch}
            selected={selected}
            setSelected={setSelected}
            mapped={mapped}
            layoutLocked={layoutLocked}
          />
          <EditorSetupPanel
            state={state}
            dispatch={dispatch}
            rows={rows}
            columns={columns}
            showErrors={attemptedSave || nameTouched}
          />
        </div>
      )}

      <footer className="md:sticky md:bottom-3 z-20 mt-auto rounded-2xl border border-slate-200 bg-white/95 px-4 py-3 shadow-md backdrop-blur-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <p className={`text-sm ${missingCount === 0 && state.preview ? 'font-medium text-emerald-700' : 'text-slate-600'}`}>
            {footerStatusText}
          </p>
          <span className="w-full sm:w-auto" title={saveDisabled ? saveDisabledReason : undefined}>
            <Button
              type="button"
              onClick={() => void save()}
              disabled={saveDisabled}
              className="w-full sm:w-auto h-11 sm:h-10 rounded-xl bg-teal-600 px-4 font-medium text-white hover:bg-teal-700 disabled:bg-slate-200 disabled:text-slate-500 disabled:opacity-100"
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

export default ImportProfileEditorPage;
