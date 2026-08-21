import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Download } from 'lucide-react';
import { useAppStore } from '@/store';
import { api } from '@/services/api';
import type { VwTransactionList, FilterRequest } from '@/types';
import type { TransactionFormValues } from '@/components/common/TransactionForm';
import { isValid } from 'date-fns';
import { Button } from '@/components/ui/button';
import { SearchInput, MobileSortSheet, type MobileSortOption } from '@/components/common';
import type { DateRange } from '@/utils/date';
import { presets, formatDateForPayload } from '@/utils/date';
import { toast } from 'sonner';

import { getTransactionSortField } from '@/utils/sort';

import { TransactionTable } from './components/TransactionTable';
import { TransactionCardFeed } from './components/TransactionCardFeed';
import { TransactionEditModal } from './components/TransactionEditModal';
import { TransactionExportModal } from './components/TransactionExportModal';
import { DeleteConfirmModal } from '@/components/DeleteConfirmModal';
import { TransactionFilterPanel } from './components/TransactionFilterPanel';
import { DEFAULT_PAGE_SIZE } from '@/config/constants';

import { QUERY_PARAMS } from '@/config/routes';

export function Transaction() {
  const [searchParams, setSearchParams] = useSearchParams();
  const accounts = useAppStore(state => state.accounts);
  const descriptions = useAppStore(state => state.descriptions);
  const fetchAccounts = useAppStore(state => state.fetchAccounts);
  const fetchDescriptions = useAppStore(state => state.fetchDescriptions);
  const lastTransactionUpdate = useAppStore(state => state.lastTransactionUpdate);
  const refreshTransactions = useAppStore(state => state.refreshTransactions);

  const selectedAccountSids = useMemo(() => searchParams.getAll(QUERY_PARAMS.ACCOUNT_SID), [searchParams]);
  const selectedDescriptionSids = useMemo(() => searchParams.getAll(QUERY_PARAMS.DESCRIPTION_SID), [searchParams]);
  const search = searchParams.get(QUERY_PARAMS.SEARCH) || '';
  const startDateParam = searchParams.get(QUERY_PARAMS.START_DATE);
  const endDateParam = searchParams.get(QUERY_PARAMS.END_DATE);
  const isAllTime = searchParams.get(QUERY_PARAMS.ALL) === 'true';

  const dateRange = useMemo<DateRange | null>(() => {
    if (startDateParam && endDateParam) {
      const from = new Date(startDateParam);
      const to = new Date(endDateParam);
      if (isValid(from) && isValid(to)) {
        return { from, to };
      }
    }
    return null;
  }, [startDateParam, endDateParam]);

  // Set default FY whenever no dates are provided and not explicitly set to All Time
  useEffect(() => {
    if (!startDateParam && !endDateParam && !isAllTime) {
      const defaultFY = presets.currentFY();
      setSearchParams(prev => {
        const next = new URLSearchParams(prev);
        next.set(QUERY_PARAMS.START_DATE, defaultFY.from.toISOString());
        next.set(QUERY_PARAMS.END_DATE, defaultFY.to.toISOString());
        return next;
      }, { replace: true });
    }
  }, [startDateParam, endDateParam, isAllTime, setSearchParams]);

  const [data, setData] = useState<VwTransactionList[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);

  const [editingTx, setEditingTx] = useState<VwTransactionList | null>(null);
  const [deleteTargetTx, setDeleteTargetTx] = useState<VwTransactionList | null>(null);
  const [isExporting, setIsExporting] = useState(false);

  // Export Modal State
  const [exportModalOpen, setExportModalOpen] = useState(false);
  const [exportType, setExportType] = useState<'excel' | 'csv'>('excel');
  const [excelName, setExcelName] = useState('');
  const [separateSheets, setSeparateSheets] = useState(false);
  const [mergeAccounts, setMergeAccounts] = useState(true);
  const [mergeDescriptions, setMergeDescriptions] = useState(true);

  const [sortBy, setSortBy] = useState('TransactionDate');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const abortControllerRef = useRef<AbortController | null>(null);

  const loadData = useCallback(async () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    try {
      const filters: FilterRequest[] = [];

      if (selectedAccountSids.length > 0) {
        filters.push({ key: 'AccountSID', condition: 'in', value: selectedAccountSids });
      }

      if (selectedDescriptionSids.length > 0) {
        filters.push({ key: 'DescriptionSID', condition: 'in', value: selectedDescriptionSids });
      }

      if (dateRange) {
        filters.push({
          key: 'TransactionDate',
          condition: 'between',
          from: formatDateForPayload(dateRange.from),
          to: formatDateForPayload(dateRange.to)
        });
      }

      const res = await api.listTransactions({
        search,
        page,
        page_size: DEFAULT_PAGE_SIZE,
        sort_by: sortBy,
        sort_order: sortOrder,
        filters
      }, abortController.signal);

      if (!abortController.signal.aborted) {
        setData(res.data);
        setTotal(res.total_count);
      }
    } catch (e) {
      if ((e instanceof Error && e.name === 'AbortError') || abortController.signal.aborted) {
        return;
      }
      console.error('Failed to load transactions:', e);
    }
  }, [selectedAccountSids, selectedDescriptionSids, search, page, sortBy, sortOrder, dateRange]);

  useEffect(() => {
    loadData();
  }, [loadData, lastTransactionUpdate]);

  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  useEffect(() => {
    setPage(1);
  }, [selectedAccountSids, selectedDescriptionSids, search, dateRange]);

  const handleSort = (columnId: string) => {
    const backendField = getTransactionSortField(columnId);
    if (sortBy === backendField) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(backendField);
      setSortOrder('asc');
    }
  };

  const transactionSortOptions: MobileSortOption[] = useMemo(() => [
    { id: 'date-desc', label: 'Date: Newest first', field: getTransactionSortField('transaction_date'), order: 'desc' },
    { id: 'date-asc', label: 'Date: Oldest first', field: getTransactionSortField('transaction_date'), order: 'asc' },
    { id: 'account-asc', label: 'Account Name: A → Z', field: getTransactionSortField('account_name'), order: 'asc' },
    { id: 'account-desc', label: 'Account Name: Z → A', field: getTransactionSortField('account_name'), order: 'desc' },
    { id: 'desc-asc', label: 'Description: A → Z', field: getTransactionSortField('description_name'), order: 'asc' },
    { id: 'desc-desc', label: 'Description: Z → A', field: getTransactionSortField('description_name'), order: 'desc' },
    { id: 'debit-desc', label: 'Debit (Expense): High → Low', field: getTransactionSortField('debit'), order: 'desc' },
    { id: 'credit-desc', label: 'Credit (Income): High → Low', field: getTransactionSortField('credit'), order: 'desc' },
  ], []);

  const handleMobileSortChange = useCallback((field: string, order: 'asc' | 'desc') => {
    setSortBy(field);
    setSortOrder(order);
  }, []);


  const handleDelete = async () => {
    if (!deleteTargetTx) return;
    try {
      await api.deleteTransaction(deleteTargetTx.transaction_sid, deleteTargetTx.account_sid ?? '');
      setDeleteTargetTx(null);
      loadData();
      fetchAccounts();
      refreshTransactions();
    } catch (e) {
      console.error('Failed to delete transaction:', e);
      alert(e instanceof Error ? e.message : 'Failed to delete transaction');
    }
  };

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const filters: FilterRequest[] = [];
      if (selectedAccountSids.length > 0) {
        filters.push({ key: 'AccountSID', condition: 'in', value: selectedAccountSids });
      }
      if (selectedDescriptionSids.length > 0) {
        filters.push({ key: 'DescriptionSID', condition: 'in', value: selectedDescriptionSids });
      }
      if (dateRange) {
        filters.push({
          type: 'date',
          key: 'TransactionDate',
          condition: 'between',
          from: formatDateForPayload(dateRange.from),
          to: formatDateForPayload(dateRange.to)
        });
      }

      await api.exportTransactions({
        search,
        page: 1,
        page_size: DEFAULT_PAGE_SIZE,
        sort_by: sortBy,
        sort_order: sortOrder,
        export_type: exportType,
        separate_sheets: separateSheets,
        merge_accounts: selectedAccountSids.length > 1 ? mergeAccounts : false,
        merge_descriptions: separateSheets ? mergeDescriptions : false,
        account_sid: selectedAccountSids.length === 1 ? selectedAccountSids[0] : null,
        description_sid: selectedDescriptionSids.length === 1 ? selectedDescriptionSids[0] : null,
        excel_name: excelName.trim(),
        filters
      });
      setExportModalOpen(false);
    } catch (e) {
      console.error(e);
    } finally {
      setIsExporting(false);
    }
  };

  const handleEditSave = async (values: TransactionFormValues) => {
    if (!editingTx) return;

    try {
      const amount = parseFloat(values.amount);
      const origDateStr = editingTx.transaction_date;
      const newTransactionDate = (origDateStr && origDateStr.includes('T'))
        ? `${values.transaction_date}T${origDateStr.substring(origDateStr.indexOf('T') + 1)}`
        : `${values.transaction_date}T00:00:00.000Z`;

      await api.updateTransaction(editingTx.transaction_sid, {
        account_sid: values.account_sid,
        transaction_date: newTransactionDate,
        description_sid: values.description_sid || '',
        description_name: values.description_name,
        debit: values.type === 'DEBIT' ? amount : 0,
        credit: values.type === 'CREDIT' ? amount : 0,
        notes: values.notes || null
      });
      setEditingTx(null);
      loadData();
      fetchAccounts();
      fetchDescriptions();
      refreshTransactions();
    } catch (err) {
      console.error('Failed to update transaction:', err);
      toast.error(err instanceof Error ? err.message : 'Failed to update transaction');
      throw err;
    }
  };

  const isDateActive = useMemo(() => {
    return !!dateRange && !isAllTime;
  }, [dateRange, isAllTime]);

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (isDateActive) count++;
    if (selectedAccountSids.length > 0) count++;
    if (selectedDescriptionSids.length > 0) count++;
    return count;
  }, [isDateActive, selectedAccountSids.length, selectedDescriptionSids.length]);

  const handleApplyFilters = useCallback((filters: {
    dateRange: DateRange | null;
    accountSids: string[];
    descriptionSids: string[];
  }) => {
    setSearchParams(prev => {
      const next = new URLSearchParams(prev);
      if (filters.dateRange) {
        next.delete(QUERY_PARAMS.ALL);
        next.set(QUERY_PARAMS.START_DATE, filters.dateRange.from.toISOString());
        next.set(QUERY_PARAMS.END_DATE, filters.dateRange.to.toISOString());
      } else {
        next.delete(QUERY_PARAMS.START_DATE);
        next.delete(QUERY_PARAMS.END_DATE);
        next.set(QUERY_PARAMS.ALL, 'true');
      }

      next.delete(QUERY_PARAMS.ACCOUNT_SID);
      filters.accountSids.forEach(id => next.append(QUERY_PARAMS.ACCOUNT_SID, id));

      next.delete(QUERY_PARAMS.DESCRIPTION_SID);
      filters.descriptionSids.forEach(id => next.append(QUERY_PARAMS.DESCRIPTION_SID, id));

      return next;
    });
  }, [setSearchParams]);

  const handleClearAllFilters = useCallback(() => {
    setSearchParams(prev => {
      const next = new URLSearchParams(prev);
      next.delete(QUERY_PARAMS.START_DATE);
      next.delete(QUERY_PARAMS.END_DATE);
      next.set(QUERY_PARAMS.ALL, 'true');
      next.delete(QUERY_PARAMS.ACCOUNT_SID);
      next.delete(QUERY_PARAMS.DESCRIPTION_SID);
      return next;
    });
  }, [setSearchParams]);

  const handleSearchChange = useCallback((val: string) => {
    setSearchParams(prev => {
      if (val) prev.set(QUERY_PARAMS.SEARCH, val);
      else prev.delete(QUERY_PARAMS.SEARCH);
      return prev;
    });
  }, [setSearchParams]);

  const handleClearSearch = useCallback(() => {
    setSearchParams(prev => {
      prev.delete(QUERY_PARAMS.SEARCH);
      return prev;
    });
  }, [setSearchParams]);

  const totalPages = Math.ceil(total / DEFAULT_PAGE_SIZE);

  return (
    <div className="flex flex-col gap-4 md:gap-6 animate-in fade-in duration-300 md:h-full flex-1 min-h-0">
      {/* Header with Search, Filters, and Export */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
        <div className="hidden md:block">
          <h1 className="text-xl md:text-2xl font-bold text-slate-800">Transactions</h1>
          <p className="text-xs md:text-sm text-slate-500 mt-0.5">View, filter, and export your transaction records.</p>
        </div>

        <div className="flex items-center gap-2.5 w-full sm:w-auto">
          <SearchInput
            placeholder="Search..."
            value={search}
            onChange={handleSearchChange}
            onClear={handleClearSearch}
            className="flex-1 sm:w-64 sm:flex-none"
          />

          <div className="md:hidden">
            <MobileSortSheet
              options={transactionSortOptions}
              currentField={sortBy}
              currentOrder={sortOrder}
              onSortChange={handleMobileSortChange}
              ariaLabel="Sort transactions"
            />
          </div>

          <div className="md:hidden">
            <TransactionFilterPanel
              isMobile
              accounts={accounts}
              descriptions={descriptions}
              dateRange={dateRange}
              isAllTime={isAllTime}
              selectedAccountSids={selectedAccountSids}
              selectedDescriptionSids={selectedDescriptionSids}
              activeFilterCount={activeFilterCount}
              onApplyFilters={handleApplyFilters}
              onClearAll={handleClearAllFilters}
            />
          </div>
          <div className="hidden md:block">
            <TransactionFilterPanel
              accounts={accounts}
              descriptions={descriptions}
              dateRange={dateRange}
              isAllTime={isAllTime}
              selectedAccountSids={selectedAccountSids}
              selectedDescriptionSids={selectedDescriptionSids}
              activeFilterCount={activeFilterCount}
              onApplyFilters={handleApplyFilters}
              onClearAll={handleClearAllFilters}
            />
          </div>

          <Button
            variant="outline"
            onClick={() => setExportModalOpen(true)}
            className="shrink-0 h-10 sm:h-9 px-3 sm:px-3.5 rounded-xl border-slate-200 text-slate-600 hover:text-teal-600 hover:bg-teal-50"
            aria-label="Export transactions"
          >
            <Download className="w-4 h-4 sm:mr-1.5 text-slate-500" />
            <span className="hidden sm:inline">Export</span>
          </Button>
        </div>
      </div>

      {/* Mobile Transaction Card Feed (< md) */}
      <TransactionCardFeed
        data={data}
        total={total}
        page={page}
        pageSize={DEFAULT_PAGE_SIZE}
        totalPages={totalPages}
        onPageChange={setPage}
        onEdit={setEditingTx}
        onDelete={setDeleteTargetTx}
      />

      {/* Desktop Table View (>= md) */}
      <TransactionTable
        data={data}
        total={total}
        page={page}
        pageSize={DEFAULT_PAGE_SIZE}
        totalPages={totalPages}
        sortBy={sortBy}
        sortOrder={sortOrder}
        onSort={handleSort}
        onPageChange={setPage}
        onEdit={setEditingTx}
        onDelete={setDeleteTargetTx}
      />

      {/* Edit Transaction Modal */}
      <TransactionEditModal
        editingTx={editingTx}
        accounts={accounts}
        descriptions={descriptions}
        onClose={() => setEditingTx(null)}
        onSave={handleEditSave}
      />

      {/* Export Modal */}
      <TransactionExportModal
        open={exportModalOpen}
        onOpenChange={setExportModalOpen}
        exportType={exportType}
        onExportTypeChange={setExportType}
        excelName={excelName}
        onExcelNameChange={setExcelName}
        separateSheets={separateSheets}
        onSeparateSheetsChange={setSeparateSheets}
        mergeAccounts={mergeAccounts}
        onMergeAccountsChange={setMergeAccounts}
        mergeDescriptions={mergeDescriptions}
        onMergeDescriptionsChange={setMergeDescriptions}
        selectedAccountSids={selectedAccountSids}
        accounts={accounts}
        isExporting={isExporting}
        onExport={handleExport}
      />

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        open={!!deleteTargetTx}
        onOpenChange={(open) => !open && setDeleteTargetTx(null)}
        onConfirm={handleDelete}
        title="Delete Transaction"
        description="Are you sure you want to delete this transaction record?"
      />
    </div>
  );
}
