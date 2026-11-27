import { useCallback, useDeferredValue, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  FileSpreadsheet,
  Loader2,
  Plus,
  RotateCcw,
  SlidersHorizontal,
  Tag,
  Upload,
} from 'lucide-react';
import { InnerPageHeader, SearchInput } from '@/components/common';
import { useIsMobile } from '@/hooks/useIsMobile';
import { useOverlayScrollbars } from '@/hooks/useOverlayScrollbars';
import { toast } from 'sonner';
import { api } from '@/api';
import { useAppStore } from '@/store';
import { DEFAULT_PAGE_SIZE } from '@/config/constants';
import { ROUTES } from '@/config/routes';
import { ValidationError } from '@/utils/validation';
import { statementDateFormats } from '@/lib/statement-import';
import type {
  ImportProfile,
  StatementColumnMapping,
  StatementImportAnalysis,
  StatementImportRow,
} from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { DescriptionTagPicker } from './components/DescriptionTagPicker';
import { ImportReviewCardFeed } from './components/ImportReviewCardFeed';
import { ImportReviewTable } from './components/ImportReviewTable';
import { getRowType, mappingFields, revalidateRow, type ReviewFilter } from './utils';

const PAGE_SIZE = DEFAULT_PAGE_SIZE;

export function StatementImportPage() {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const tableScrollRef = useRef<HTMLDivElement>(null);
  const accounts = useAppStore(state => state.accounts);
  const descriptions = useAppStore(state => state.descriptions);
  const fetchAccounts = useAppStore(state => state.fetchAccounts);
  const fetchDescriptions = useAppStore(state => state.fetchDescriptions);
  const ensureAccountsLoaded = useAppStore(state => state.ensureAccountsLoaded);
  const ensureDescriptionsLoaded = useAppStore(state => state.ensureDescriptionsLoaded);
  const refreshTransactions = useAppStore(state => state.refreshTransactions);
  const setStatementImportInProgress = useAppStore(state => state.setStatementImportInProgress);

  const [file, setFile] = useState<File | null>(null);
  const [analysis, setAnalysis] = useState<StatementImportAnalysis | null>(null);
  const [profiles, setProfiles] = useState<ImportProfile[]>([]);
  const [profileSID, setProfileSID] = useState('');
  const [accountSID, setAccountSID] = useState('');
  const [dateFormat, setDateFormat] = useState('');
  const [mapping, setMapping] = useState<StatementColumnMapping>({});
  const [rows, setRows] = useState<StatementImportRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [showOverrides, setShowOverrides] = useState(false);
  const [filter, setFilter] = useState<ReviewFilter>('all');
  const [notesSearch, setNotesSearch] = useState('');
  const deferredNotesSearch = useDeferredValue(notesSearch);
  const [page, setPage] = useState(1);
  const [batchDescription, setBatchDescription] = useState('');
  const [overwriteDialogOpen, setOverwriteDialogOpen] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    api.getImportProfiles().then(setProfiles).catch(() => toast.error('Could not load import profiles.'));
    void ensureAccountsLoaded();
    void ensureDescriptionsLoaded();
  }, [ensureAccountsLoaded, ensureDescriptionsLoaded]);

  useEffect(() => {
    setStatementImportInProgress(Boolean(analysis) || loading);
  }, [analysis, loading, setStatementImportInProgress]);

  useEffect(() => {
    return () => setStatementImportInProgress(false);
  }, [setStatementImportInProgress]);

  useEffect(() => {
    if (accounts.length === 1 && !accountSID) {
      setAccountSID(accounts[0].account_sid);
    }
  }, [accounts, accountSID]);

  const counts = useMemo(() => {
    let ready = 0;
    let needsAttention = 0;
    let invalid = 0;
    let excluded = 0;
    let duplicates = 0;
    let selected = 0;
    for (const row of rows) {
      const hasIssues = row.issues.length > 0;
      if (row.include) selected++;
      else excluded++;
      if (hasIssues) {
        needsAttention++;
        if (row.include) invalid++;
      } else if (row.include) {
        ready++;
      }
      if (row.status === 'exact_duplicate' || row.status === 'possible_duplicate') {
        duplicates++;
      }
    }
    return { ready, needsAttention, invalid, excluded, duplicates, selected };
  }, [rows]);

  const filteredRows = useMemo(() => {
    const query = deferredNotesSearch.trim().toLowerCase();
    return rows
      .map((row, index) => ({ row, index }))
      .filter(({ row }) => {
        if (filter === 'ready' && !(row.include && row.issues.length === 0)) return false;
        if (filter === 'invalid' && row.issues.length === 0) return false;
        if (filter === 'excluded' && row.include) return false;
        if (filter === 'duplicates' && row.status !== 'exact_duplicate' && row.status !== 'possible_duplicate') return false;
        if (query) {
          const notesText = (row.notes ?? '').toLowerCase();
          const descText = (row.description ?? '').toLowerCase();
          if (!notesText.includes(query) && !descText.includes(query)) return false;
        }
        return true;
      });
  }, [rows, filter, deferredNotesSearch]);

  useEffect(() => {
    setPage(1);
  }, [filter, deferredNotesSearch, analysis]);

  const totalPages = Math.max(1, Math.ceil(filteredRows.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pagedRows = useMemo(
    () => filteredRows.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE),
    [filteredRows, currentPage],
  );

  const getTableScrollElement = useCallback(() => tableScrollRef.current, []);
  const overlayScrollbar = useOverlayScrollbars(getTableScrollElement, [pagedRows, analysis, isMobile], {
    topInset: 40,
    bottomInset: 10,
    leftInset: 10,
    rightInset: 12,
  });

  const analyze = async (
    overrides: Partial<{
      sheetName: string;
      headerRow: number;
      profileSID: string;
      dateFormat: string;
      mapping: StatementColumnMapping;
    }> = {},
  ) => {
    if (!file) return;
    setLoading(true);
    try {
      const result = await api.analyzeStatement(file, {
        sheetName: overrides.sheetName ?? analysis?.selected_sheet,
        headerRow: overrides.headerRow ?? analysis?.header_row,
        transactionEndRow: analysis?.transaction_end_row ?? undefined,
        profileSID: (overrides.profileSID ?? profileSID) || undefined,
        dateFormat: (overrides.dateFormat ?? dateFormat) || undefined,
        mapping: overrides.mapping ?? (Object.keys(mapping).length ? mapping : undefined),
        accountSID,
      });
      setAnalysis(result);
      setRows(result.rows);
      setMapping(result.mapping);
      const nextDateFormat = result.date_format ?? dateFormat;
      setDateFormat(nextDateFormat);
      setProfileSID(result.suggested_profile_sid ?? profileSID);
      setFilter('all');
      if (!nextDateFormat) {
        setShowOverrides(true);
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Unable to read this statement.');
    } finally {
      setLoading(false);
    }
  };

  const batchTargets = useMemo(() => {
    let alreadySetCount = 0;
    let emptyCount = 0;
    for (const { row } of filteredRows) {
      if (row.description?.trim()) alreadySetCount++;
      else emptyCount++;
    }
    return {
      total: filteredRows.length,
      alreadySetCount,
      emptyCount,
    };
  }, [filteredRows]);

  const applyBatchDescription = useCallback(
    (mode: 'empty_only' | 'overwrite') => {
      const tag = batchDescription.trim();
      if (!tag) return;
      const visibleIndexes = new Set(filteredRows.map(item => item.index));
      let updatedCount = 0;
      setRows(current =>
        current.map((row, index) => {
          if (!visibleIndexes.has(index)) return row;
          const hasDescription = Boolean(row.description?.trim());
          if (mode === 'empty_only' && hasDescription) return row;
          updatedCount++;
          return revalidateRow({ ...row, description: tag });
        }),
      );
      setOverwriteDialogOpen(false);
      toast.success(`Updated ${updatedCount} ${updatedCount === 1 ? 'row' : 'rows'} with "${tag}".`);
    },
    [batchDescription, filteredRows],
  );

  const handleBatchApplyClick = useCallback(() => {
    if (!batchDescription.trim() || filteredRows.length === 0) return;
    if (batchTargets.alreadySetCount > 0) {
      setOverwriteDialogOpen(true);
      return;
    }
    applyBatchDescription('overwrite');
  }, [applyBatchDescription, batchDescription, batchTargets.alreadySetCount, filteredRows.length]);

  const updateRow = useCallback(
    (index: number, field: keyof StatementImportRow, value: string | boolean) =>
      setRows(current =>
        current.map((row, i) => {
          if (i !== index) return row;
          const next = {
            ...row,
            [field]:
              field === 'debit' || field === 'credit' || field === 'balance'
                ? value === ''
                  ? null
                  : Number(value)
                : value,
          } as StatementImportRow;
          return revalidateRow(next, field === 'include');
        }),
      ),
    [],
  );

  const setRowType = useCallback(
    (index: number, nextType: 'debit' | 'credit') =>
      setRows(current =>
        current.map((row, i) => {
          if (i !== index) return row;
          const amount = (row.debit ?? 0) > 0 ? row.debit : (row.credit ?? null);
          const next: StatementImportRow = {
            ...row,
            debit: nextType === 'debit' ? amount : null,
            credit: nextType === 'credit' ? amount : null,
          };
          return revalidateRow(next);
        }),
      ),
    [],
  );

  const setRowAmount = useCallback(
    (index: number, rawValue: string) =>
      setRows(current =>
        current.map((row, i) => {
          if (i !== index) return row;
          const activeType = getRowType(row);
          const parsed = rawValue === '' ? null : Number(rawValue);
          const next: StatementImportRow = {
            ...row,
            debit: activeType === 'debit' ? parsed : null,
            credit: activeType === 'credit' ? parsed : null,
          };
          return revalidateRow(next);
        }),
      ),
    [],
  );

  const toggleSelectAllFiltered = useCallback(
    (checked: boolean) => {
      const visibleIndexes = new Set(filteredRows.map(item => item.index));
      setRows(current =>
        current.map((row, idx) => (visibleIndexes.has(idx) ? revalidateRow({ ...row, include: checked }, true) : row)),
      );
    },
    [filteredRows],
  );

  const selectedFilteredCount = filteredRows.filter(({ row }) => row.include).length;
  const allFilteredSelected = filteredRows.length > 0 && selectedFilteredCount === filteredRows.length;
  const someFilteredSelected = selectedFilteredCount > 0 && !allFilteredSelected;

  const commit = async () => {
    if (!analysis || !accountSID) {
      toast.error('Select the CashBook account that receives these transactions.');
      return;
    }
    if (!dateFormat) {
      toast.error('Select the statement date format before importing.');
      setShowOverrides(true);
      return;
    }
    if (counts.invalid > 0) {
      toast.error('Fix or exclude invalid rows before importing.');
      return;
    }
    setLoading(true);
    try {
      const result = await api.commitStatementImport({
        account_sid: accountSID,
        file_name: analysis.file_name,
        file_type: analysis.file_type,
        file_hash: analysis.file_hash,
        profile_sid: profileSID || null,
        metadata: analysis.metadata,
        rows,
      });
      toast.success(
        `${result.imported_rows} transactions imported${
          result.skipped_duplicate_rows ? `; ${result.skipped_duplicate_rows} duplicates skipped` : ''
        }.`,
      );
      await Promise.all([fetchAccounts(), fetchDescriptions(), refreshTransactions()]);
      navigate(ROUTES.TRANSACTIONS);
    } catch (error) {
      if (error instanceof ValidationError) {
        const firstError = Object.values(error.errors).flat()[0];
        toast.error(firstError ?? error.message);
      } else {
        toast.error(error instanceof Error ? error.message : 'Import failed. No transactions were changed.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-1 min-w-0 flex-col gap-5 pb-4 md:pb-24">
      <InnerPageHeader
        breadcrumbs={[{ label: 'Transactions', to: ROUTES.TRANSACTIONS }]}
        title="Import bank statement"
        subtitle="Upload, review, and import transactions. Your source file is processed locally and is not saved."
        actions={
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => navigate(ROUTES.IMPORT_PROFILE_NEW)}
            className="rounded-xl border-slate-200 text-slate-700 hover:border-teal-300 hover:bg-teal-50 hover:text-teal-700"
          >
            <Plus className="h-4 w-4" />New import profile
          </Button>
        }
      />

      <section className="min-w-0 rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)_minmax(0,1fr)_auto] md:items-end">
          <div className="min-w-0 space-y-1.5">
            <Label htmlFor="statement-file" className="text-xs font-semibold text-slate-600">
              Statement file *
            </Label>
            <Input
              ref={fileInputRef}
              id="statement-file"
              type="file"
              accept=".csv,.xls,.xlsx"
              onChange={e => {
                const next = e.target.files?.[0] ?? null;
                setFile(next);
                setAnalysis(null);
                setRows([]);
                setMapping({});
                setDateFormat('');
              }}
              className="sr-only"
            />
            <div className="flex h-10 items-center overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xs">
              {file ? (
                <>
                  <button
                    type="button"
                    className="inline-flex h-full shrink-0 cursor-pointer items-center gap-1.5 border-r border-slate-200 bg-slate-50 px-3 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-100 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-teal-500"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Upload className="h-3.5 w-3.5 text-slate-500" />
                    Replace file
                  </button>
                  <span className="min-w-0 flex-1 truncate px-3 text-sm text-slate-700" title={file.name}>
                    {file.name}
                  </span>
                </>
              ) : (
                <span className="min-w-0 truncate px-3 text-sm text-muted-foreground">No file selected</span>
              )}
            </div>
          </div>

          <div className="min-w-0 space-y-1.5">
            <Label htmlFor="import-account" className="text-xs font-semibold text-slate-600">
              CashBook account *
            </Label>
            <Select value={accountSID} onValueChange={setAccountSID}>
              <SelectTrigger
                id="import-account"
                aria-label="CashBook account *"
                className="h-10 w-full min-w-0 rounded-xl border-slate-200 bg-white text-sm text-slate-900 shadow-xs *:data-[slot=select-value]:min-w-0 *:data-[slot=select-value]:truncate"
              >
                <SelectValue placeholder="Select account" />
              </SelectTrigger>
              <SelectContent>
                {accounts.map(account => (
                  <SelectItem key={account.account_sid} value={account.account_sid}>
                    {account.account_name} {account.bank_name ? `(${account.bank_name})` : ''}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="min-w-0 space-y-1.5">
            <Label htmlFor="profile" className="text-xs font-semibold text-slate-600">
              Import profile *
            </Label>
            <Select
              value={profileSID}
              onValueChange={value => {
                setProfileSID(value);
                setMapping({});
                setDateFormat('');
              }}
            >
              <SelectTrigger
                id="profile"
                aria-label="Import profile *"
                className="h-10 w-full min-w-0 rounded-xl border-slate-200 bg-white text-sm text-slate-900 shadow-xs *:data-[slot=select-value]:min-w-0 *:data-[slot=select-value]:truncate"
              >
                <SelectValue placeholder="Select profile" />
              </SelectTrigger>
              <SelectContent>
                {profiles.map(p => (
                  <SelectItem key={p.import_profile_sid} value={p.import_profile_sid}>
                    {p.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Button
            type="button"
            disabled={!file || !accountSID || !profileSID || loading}
            onClick={() => analyze()}
            className="h-10 rounded-xl bg-teal-600 px-4 text-white hover:bg-teal-700"
          >
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
            Analyze statement
          </Button>
        </div>
      </section>

      {!analysis && (
        <section
          aria-label="Upload bank statement by dragging and dropping or browsing"
          onDragOver={event => {
            event.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={event => {
            event.preventDefault();
            setIsDragging(false);
            const dropped = event.dataTransfer.files?.[0] ?? null;
            if (dropped) {
              setFile(dropped);
              setAnalysis(null);
              setRows([]);
              setMapping({});
              setDateFormat('');
            }
          }}
          className={`rounded-2xl border-2 border-dashed px-6 py-7 text-center shadow-sm transition-colors ${
            isDragging
              ? 'border-teal-600 bg-teal-50/60'
              : 'border-slate-300 bg-white'
          }`}
        >
          <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-2xl bg-teal-50 text-teal-700">
            <FileSpreadsheet className="h-5 w-5" />
          </div>
          <h2 className="mt-3 break-words text-base font-semibold text-slate-900">
            {file
              ? `${file.name} selected — click Analyze statement above`
              : 'Drag & drop your bank statement, or browse'}
          </h2>
          <p className="mt-1 text-xs text-slate-500">CSV, XLS, or XLSX · Up to 10 MB</p>
          <div className="mt-4">
            <Button
              type="button"
              onClick={event => {
                event.stopPropagation();
                fileInputRef.current?.click();
              }}
              className="h-10 rounded-xl bg-teal-600 px-4 font-medium text-white hover:bg-teal-700"
            >
              <Upload className="mr-2 h-4 w-4" />
              Browse files
            </Button>
          </div>
        </section>
      )}

      {analysis && (
        <section className="space-y-4">
          <div className="rounded-2xl border border-slate-200 bg-white shadow-xs">
            <button
              type="button"
              onClick={() => setShowOverrides(prev => !prev)}
              aria-expanded={showOverrides}
              className="flex w-full items-center justify-between px-4 py-3 text-left text-sm font-medium text-slate-700 hover:bg-slate-50/80"
            >
              <span className="flex items-center gap-2">
                <SlidersHorizontal className="h-4 w-4 text-slate-500" />
                Layout &amp; mapping overrides
                {!dateFormat && (
                  <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-semibold text-amber-800">
                    Date format required
                  </span>
                )}
              </span>
              {showOverrides ? (
                <ChevronDown className="h-4 w-4 text-slate-400" />
              ) : (
                <ChevronRight className="h-4 w-4 text-slate-400" />
              )}
            </button>

            {showOverrides && (
              <div className="space-y-4 border-t border-slate-100 p-4">
                <div className="grid gap-3 md:grid-cols-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="override-sheet" className="text-xs font-semibold text-slate-600">
                      Sheet
                    </Label>
                    <Select
                      value={analysis.selected_sheet}
                      onValueChange={sheet => analyze({ sheetName: sheet, headerRow: 1 })}
                    >
                      <SelectTrigger
                        id="override-sheet"
                        aria-label="Sheet"
                        className="h-10 w-full rounded-xl border-slate-200 bg-white text-sm text-slate-900 shadow-xs"
                      >
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {analysis.sheets.map(sheet => (
                          <SelectItem key={sheet} value={sheet}>
                            {sheet}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="override-header-row" className="text-xs font-semibold text-slate-600">
                      Transaction header row
                    </Label>
                    <Select
                      value={String(analysis.header_row)}
                      onValueChange={val => analyze({ headerRow: Number(val) })}
                    >
                      <SelectTrigger
                        id="override-header-row"
                        aria-label="Transaction header row"
                        className="h-10 w-full rounded-xl border-slate-200 bg-white text-sm text-slate-900 shadow-xs"
                      >
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {analysis.header_candidates.map(candidate => (
                          <SelectItem key={candidate.row_number} value={String(candidate.row_number)}>
                            Row {candidate.row_number} — {candidate.values.filter(Boolean).slice(0, 3).join(' · ')}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="override-date-format" className="text-xs font-semibold text-slate-600">
                      Date appearance in statement
                    </Label>
                    <Select value={dateFormat} onValueChange={setDateFormat}>
                      <SelectTrigger
                        id="override-date-format"
                        aria-label="Date appearance in statement"
                        className="h-10 w-full rounded-xl border-slate-200 bg-white text-sm text-slate-900 shadow-xs"
                      >
                        <SelectValue placeholder="Select date format" />
                      </SelectTrigger>
                      <SelectContent>
                        {statementDateFormats.map(option => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <p className="text-xs text-slate-500">
                  This profile stops after row {analysis.transaction_end_row ?? 'the detected transaction block'}.
                </p>

                <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-3">
                  <div className="mb-2.5 text-xs font-semibold text-slate-700">Column mapping</div>
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                    {mappingFields.map(([field, label, required]) => (
                      <div key={field} className="space-y-1">
                        <Label htmlFor={`map-${field}`} className="text-xs text-slate-600">
                          {label}
                          {required ? ' *' : ''}
                        </Label>
                        <Select
                          value={mapping[field] ?? '__none__'}
                          onValueChange={val =>
                            setMapping(current => ({
                              ...current,
                              [field]: val === '__none__' ? null : val,
                            }))
                          }
                        >
                          <SelectTrigger
                            id={`map-${field}`}
                            aria-label={label}
                            className="h-10 w-full rounded-xl border-slate-200 bg-white text-sm text-slate-900 shadow-xs"
                          >
                            <SelectValue placeholder="Not mapped" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="__none__">Not mapped</SelectItem>
                            {analysis.headers.map(header => (
                              <SelectItem key={header} value={header}>
                                {header}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    ))}
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => analyze({ mapping, dateFormat })}
                    disabled={loading}
                    className="mt-3 rounded-xl bg-white"
                  >
                    <RotateCcw className="mr-1.5 h-3.5 w-3.5" />
                    Refresh preview
                  </Button>
                </div>

                {Object.keys(analysis.metadata).length > 0 && (
                  <details className="rounded-xl bg-slate-50 p-3 text-xs text-slate-500">
                    <summary className="cursor-pointer font-medium text-slate-700">
                      Statement details (contains personal data)
                    </summary>
                    <p className="mt-2">
                      {Object.entries(analysis.metadata)
                        .map(([key, value]) => `${key}: ${value}`)
                        .join(' · ')}
                    </p>
                  </details>
                )}
              </div>
            )}
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs space-y-3">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-700">
              <Tag className="h-3.5 w-3.5 text-teal-600" />
              Batch assign description
            </div>
            <div className="grid gap-2.5 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] md:items-end">
              <div className="space-y-1">
                <Label className="text-xs font-semibold text-slate-600">Description (tag)</Label>
                <DescriptionTagPicker
                  value={batchDescription}
                  descriptions={descriptions}
                  onChange={setBatchDescription}
                  placeholder="Select or type description"
                  triggerClassName="h-10 rounded-xl text-sm"
                  ariaLabel="Batch description tag"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="notes-search" className="text-xs font-semibold text-slate-600">
                  Search notes
                </Label>
                <SearchInput
                  id="notes-search"
                  value={notesSearch}
                  onChange={setNotesSearch}
                  placeholder="Filter by notes..."
                  inputClassName="h-10 sm:h-10"
                />
              </div>
              <Button
                type="button"
                onClick={handleBatchApplyClick}
                disabled={!batchDescription.trim() || filteredRows.length === 0}
                className="h-10 rounded-xl bg-teal-600 px-4 text-white hover:bg-teal-700"
              >
                Apply to matching ({filteredRows.length})
              </Button>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-1.5">
              {(
                [
                  ['all', `All (${rows.length})`],
                  ['ready', `Ready (${counts.ready})`],
                  ['invalid', `Needs attention (${counts.needsAttention})`],
                  ...(counts.duplicates > 0 ? [['duplicates', `Duplicates (${counts.duplicates})`] as const] : []),
                  ['excluded', `Excluded (${counts.excluded})`],
                ] as const
              ).map(([key, label]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setFilter(key)}
                  className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                    filter === key
                      ? 'bg-teal-600 text-white'
                      : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
            <p className="text-xs text-slate-500">
              {rows.length} rows found · <span className="text-emerald-700">{counts.ready} ready</span>
              {counts.excluded > 0 && <> · {counts.excluded} excluded</>}
            </p>
          </div>

          {isMobile ? (
            <ImportReviewCardFeed
              rows={pagedRows}
              descriptions={descriptions}
              batchTag={batchDescription.trim()}
              onUpdateRow={updateRow}
              onSetRowType={setRowType}
              onSetRowAmount={setRowAmount}
            />
          ) : (
            <ImportReviewTable
              rows={pagedRows}
              totalFilteredCount={filteredRows.length}
              descriptions={descriptions}
              batchTag={batchDescription.trim()}
              allFilteredSelected={allFilteredSelected}
              someFilteredSelected={someFilteredSelected}
              onToggleSelectAllFiltered={toggleSelectAllFiltered}
              onUpdateRow={updateRow}
              onSetRowType={setRowType}
              onSetRowAmount={setRowAmount}
              tableScrollRef={tableScrollRef}
              overlayScrollbar={overlayScrollbar}
            />
          )}

          {filteredRows.length > PAGE_SIZE && (
            <div className="flex items-center justify-between gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs text-slate-600 shadow-2xs">
              <span>
                Showing <strong>{(currentPage - 1) * PAGE_SIZE + 1}</strong>–
                <strong>{Math.min(currentPage * PAGE_SIZE, filteredRows.length)}</strong> of{' '}
                <strong>{filteredRows.length}</strong>
              </span>
              <div className="flex items-center gap-1.5">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={currentPage <= 1}
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  className="h-8 rounded-lg px-2.5 text-xs"
                >
                  <ChevronLeft className="mr-1 h-3.5 w-3.5" />
                  Prev
                </Button>
                <span className="px-2 font-medium text-slate-700">
                  {currentPage} / {totalPages}
                </span>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={currentPage >= totalPages}
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  className="h-8 rounded-lg px-2.5 text-xs"
                >
                  Next
                  <ChevronRight className="ml-1 h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          )}

          <div className="md:sticky md:bottom-4 z-20 flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white/95 px-4 py-3 shadow-md backdrop-blur">
            <div className="text-sm text-slate-700">
              <strong>{counts.selected}</strong> selected
              {counts.invalid > 0 && (
                <>
                  {' '}
                  · <strong className="text-rose-700">{counts.invalid}</strong> need attention
                </>
              )}
              {counts.excluded > 0 && <> · {counts.excluded} excluded</>}
            </div>
            <Button
              type="button"
              onClick={commit}
              disabled={loading || !accountSID || counts.invalid > 0 || counts.selected === 0}
              className="w-full sm:w-auto h-11 sm:h-10 rounded-xl bg-teal-600 text-white hover:bg-teal-700"
            >
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Import transactions
            </Button>
          </div>
          <Dialog open={overwriteDialogOpen} onOpenChange={setOverwriteDialogOpen}>
            <DialogContent className="w-[95vw] sm:max-w-md rounded-3xl p-5 sm:p-6">
              <DialogHeader>
                <DialogTitle>Some rows already have a description</DialogTitle>
                <DialogDescription>
                  {batchTargets.alreadySetCount} of {batchTargets.total} matching rows already have a description set.
                  Choose whether to only fill untagged rows or overwrite all matching rows with &ldquo;{batchDescription.trim()}&rdquo;.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter className="flex-col sm:flex-row gap-2 pt-2">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setOverwriteDialogOpen(false)}
                  className="rounded-xl text-slate-500"
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => applyBatchDescription('overwrite')}
                  className="rounded-xl border-amber-300 text-amber-800 hover:bg-amber-50"
                >
                  Overwrite all ({batchTargets.total})
                </Button>
                {batchTargets.emptyCount > 0 && (
                  <Button
                    type="button"
                    onClick={() => applyBatchDescription('empty_only')}
                    className="rounded-xl bg-teal-600 text-white hover:bg-teal-700"
                  >
                    Fill empty only ({batchTargets.emptyCount})
                  </Button>
                )}
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </section>
      )}
    </div>
  );
}

export default StatementImportPage;
