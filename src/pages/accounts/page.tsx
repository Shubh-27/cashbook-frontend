import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { DeleteConfirmModal } from '@/components/DeleteConfirmModal';
import { useAppStore } from '@/store';
import { api } from '@/services/api';
import { rules, validateField, ValidationError } from '@/utils/validation';
import {
  createColumnHelper,
} from '@tanstack/react-table';
import { DataTable, SearchInput, PaginationControls, MobileSortSheet, type MobileSortOption } from '@/components/common';
import { getAccountSortField } from '@/utils/sort';
import { AccountCardFeed } from './components/AccountCardFeed';
import { AccountModal } from './components/AccountModal';
import type { VwAccountList } from '@/types';
import { Pencil, Trash2, Plus, Building, ArrowUpRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { DEFAULT_PAGE_SIZE } from '@/config/constants';

import { buildTransactionsUrl } from '@/config/routes';

const columnHelper = createColumnHelper<VwAccountList>();

export function AccountManager() {
  const fetchGlobalAccounts = useAppStore(state => state.fetchAccounts);
  const navigate = useNavigate();
  const [data, setData] = useState<VwAccountList[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const limit = DEFAULT_PAGE_SIZE;

  const [sortBy, setSortBy] = useState<string>('AccountName');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  const [isEditing, setIsEditing] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [name, setName] = useState('');
  const [bankName, setBankName] = useState('');
  const [accNumber, setAccNumber] = useState('');
  const [deleteTargetSid, setDeleteTargetSid] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [errors, setErrors] = useState<Record<string, string | null>>({});

  const validationRules = {
    name: [rules.required('Account name is required'), rules.minLength(3)],
    bankName: [rules.required('Bank name is required')],
    accNumber: [rules.required('Account number is required'), rules.numeric('Account number must be numeric')]
  };

  const handleAccountClick = useCallback((sid: string) => {
    navigate(buildTransactionsUrl({ accountSid: sid }));
  }, [navigate]);

  const abortControllerRef = useRef<AbortController | null>(null);

  const loadData = useCallback(async () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    try {
      const res = await api.listAccounts({
        search,
        page,
        page_size: limit,
        sort_by: sortBy,
        sort_order: sortOrder
      }, abortController.signal);

      if (!abortController.signal.aborted) {
        setData(res.data);
        setTotal(res.total_count);
      }
    } catch (e) {
      if ((e instanceof Error && e.name === 'AbortError') || abortController.signal.aborted) {
        return;
      }
      console.error('Failed to load accounts:', e);
    }
  }, [page, sortBy, sortOrder, search, limit]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  const resetForm = () => {
    setName(''); setBankName(''); setAccNumber('');
    setIsEditing(null); setIsAdding(false);
    setErrors({});
  };

  const openAdd = () => {
    resetForm();
    setIsAdding(true);
  };

  const handleEdit = (acc: VwAccountList) => {
    setIsAdding(false);
    setIsEditing(acc.account_sid);
    setName(acc.account_name);
    setBankName(acc.bank_name || '');
    setAccNumber(acc.account_number?.toString() || '');
    setErrors({});
  };

  const handleSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmedName = name.trim();
    const trimmedBankName = bankName.trim();
    const trimmedAccNumber = accNumber.trim();

    const newErrors = {
      account_name: validateField(trimmedName, validationRules.name),
      bank_name: validateField(trimmedBankName, validationRules.bankName),
      account_number: validateField(trimmedAccNumber, validationRules.accNumber)
    };

    if (newErrors.account_name || newErrors.bank_name || newErrors.account_number) {
      setErrors(newErrors);
      return;
    }

    try {
      if (isEditing) {
        await api.updateAccount(isEditing, { account_name: trimmedName, bank_name: trimmedBankName, account_number: trimmedAccNumber });
      } else {
        await api.addAccount({ account_name: trimmedName, bank_name: trimmedBankName, account_number: trimmedAccNumber });
      }

      resetForm();
      await loadData();
      await fetchGlobalAccounts();
    } catch (e) {
      if (e instanceof ValidationError) {
        const backendErrors: Record<string, string | null> = {};
        for (const key in e.errors) {
          const k = key.toLowerCase();
          if (k.includes('bank')) {
            backendErrors['bank_name'] = e.errors[key][0];
          } else if (k.includes('number')) {
            backendErrors['account_number'] = e.errors[key][0];
          } else if (k.includes('name')) {
            backendErrors['account_name'] = e.errors[key][0];
          } else {
            backendErrors[key] = e.errors[key][0];
          }
        }
        setErrors(backendErrors);
      } else {
        console.error('Failed to save account:', e);
        toast.error(e instanceof Error ? e.message : 'Failed to save account');
      }
    }
  };

  const handleDelete = async () => {
    if (!deleteTargetSid) return;
    try {
      await api.deleteAccount(deleteTargetSid);
      setDeleteTargetSid(null);
      await loadData();
      await fetchGlobalAccounts();
    } catch (e) {
      console.error('Failed to delete account:', e);
      toast.error(e instanceof Error ? e.message : 'Failed to delete account');
    }
  };

  const columns = useMemo(() => [
    columnHelper.display({
      id: 'sr',
      header: 'SR',
      cell: (info) => <span className="text-slate-400 font-medium">{(page - 1) * limit + info.row.index + 1}</span>,
    }),
    columnHelper.accessor('account_name', {
      header: 'NAME',
      cell: info => (
        <div className="font-semibold text-slate-800 flex items-center gap-2">
          <Building className="w-4 h-4 text-slate-400" /> {info.getValue()}
        </div>
      ),
    }),
    columnHelper.accessor('bank_name', {
      header: 'BANK NAME',
      cell: info => <span className="text-slate-600">{info.getValue() || '-'}</span>,
    }),
    columnHelper.accessor('account_number', {
      header: 'ACCOUNT NO.',
      cell: info => {
        const val = info.getValue();
        return <span className="text-slate-600">{val ? `****${val.toString().slice(-4)}` : '-'}</span>;
      },
    }),
    columnHelper.accessor('transaction_count', {
      header: 'TRANSACTION COUNT',
      cell: info => <span className="text-slate-600">{info.getValue() || '-'}</span>,
    }),
    columnHelper.display({
      id: 'actions',
      header: () => <div className="text-right">ACTIONS</div>,
      cell: info => (
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={() => handleAccountClick(info.row.original.account_sid)} aria-label="View activity" className="h-8 w-8 text-slate-400 hover:text-teal-600 hover:bg-teal-50"><ArrowUpRight className="w-4 h-4" /></Button>
          <Button variant="ghost" size="icon" onClick={() => handleEdit(info.row.original)} aria-label="Edit account" className="text-slate-400 hover:text-teal-600 hover:bg-teal-50 rounded-lg transition-colors"><Pencil className="w-4 h-4" /></Button>
          <Button variant="ghost" size="icon" onClick={() => setDeleteTargetSid(info.row.original.account_sid)} aria-label="Delete account" className="text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"><Trash2 className="w-4 h-4" /></Button>
        </div>
      ),
    })
  ], [page, limit, handleAccountClick]);

  const handleSort = (columnId: string) => {
    const backendField = getAccountSortField(columnId);
    if (sortBy === backendField) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(backendField);
      setSortOrder('asc');
    }
  };

  const accountSortOptions: MobileSortOption[] = useMemo(() => [
    { id: 'name-asc', label: 'Account Name: A → Z', field: getAccountSortField('account_name'), order: 'asc' },
    { id: 'name-desc', label: 'Account Name: Z → A', field: getAccountSortField('account_name'), order: 'desc' },
    { id: 'bank-asc', label: 'Bank Name: A → Z', field: getAccountSortField('bank_name'), order: 'asc' },
    { id: 'bank-desc', label: 'Bank Name: Z → A', field: getAccountSortField('bank_name'), order: 'desc' },
    { id: 'num-asc', label: 'Account No: Ascending', field: getAccountSortField('account_number'), order: 'asc' },
    { id: 'num-desc', label: 'Account No: Descending', field: getAccountSortField('account_number'), order: 'desc' },
  ], []);

  const handleMobileSortChange = useCallback((field: string, order: 'asc' | 'desc') => {
    setSortBy(field);
    setSortOrder(order);
  }, []);

  return (
    <div className="flex flex-col gap-4 md:gap-6 animate-in fade-in duration-300 md:h-full flex-1 min-h-0">
      {/* Header with Search and Add button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
        <div className="hidden md:block">
          <h1 className="text-xl md:text-2xl font-bold text-slate-800">Accounts</h1>
          <p className="text-xs md:text-sm text-slate-500 mt-0.5">Manage your bank accounts and financial institutions.</p>
        </div>

        <div className="flex items-center gap-2.5 w-full sm:w-auto">
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder="Search..."
            className="flex-1 sm:w-64 sm:flex-none"
          />
          <div className="md:hidden">
            <MobileSortSheet
              options={accountSortOptions}
              currentField={sortBy}
              currentOrder={sortOrder}
              onSortChange={handleMobileSortChange}
              ariaLabel="Sort accounts"
            />
          </div>
          <Button
            onClick={openAdd}
            className="rounded-xl font-medium shrink-0 h-10 sm:h-9 px-3 sm:px-3.5 bg-teal-600 hover:bg-teal-700 text-white"
            aria-label="Add account"
          >
            <Plus className="w-4 h-4 sm:mr-1.5" />
            <span className="hidden sm:inline">Add Account</span>
          </Button>
        </div>
      </div>

      {/* Mobile Card Feed (< md) */}
      <AccountCardFeed
        data={data}
        page={page}
        pageSize={limit}
        total={total}
        onPageChange={setPage}
        onAccountClick={handleAccountClick}
        onEdit={handleEdit}
        onDelete={setDeleteTargetSid}
      />

      {/* Desktop Table View (>= md) */}
      <DataTable<VwAccountList>
        data={data}
        columns={columns}
        sortBy={sortBy}
        sortOrder={sortOrder}
        onSort={handleSort}
        colWidths={['w-[6%]', 'w-[28%]', 'w-[22%]', 'w-[15%]', 'w-[17%]', 'w-[12%]']}
        sortableColumns={['account_name', 'bank_name', 'account_number']}
        getSortField={getAccountSortField}
        emptyMessage="No accounts found. Click &quot;Add Account&quot; to create your first bank account."
        getRowId={(row) => row.account_sid}
        footer={
          <PaginationControls
            variant="desktop"
            page={page}
            pageSize={limit}
            total={total}
            onPageChange={setPage}
          />
        }
      />

      {/* Unified Account Modal for Edit and Add */}
      <AccountModal
        open={isAdding || !!isEditing}
        onOpenChange={(open) => {
          if (!open) resetForm();
        }}
        isEditing={!!isEditing}
        name={name}
        bankName={bankName}
        accNumber={accNumber}
        onNameChange={(val) => {
          setName(val);
          setErrors(prev => ({ ...prev, account_name: null }));
        }}
        onBankNameChange={(val) => {
          setBankName(val);
          setErrors(prev => ({ ...prev, bank_name: null }));
        }}
        onAccNumberChange={(val) => {
          setAccNumber(val);
          setErrors(prev => ({ ...prev, account_number: null }));
        }}
        onSubmit={handleSave}
        errors={errors}
      />

      <DeleteConfirmModal
        open={!!deleteTargetSid}
        onOpenChange={(open) => !open && setDeleteTargetSid(null)}
        onConfirm={handleDelete}
        title="Delete Account"
        description="Are you sure you want to delete this account? This will delete all transactions associated with it! This action is irreversible."
      />
    </div>
  );
}
