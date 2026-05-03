import { useState, useEffect, useMemo, useCallback } from 'react';
import { DeleteConfirmModal } from '../../components/DeleteConfirmModal';
import { useAppStore } from '../../store';
import { api } from '../../api';
import { rules, validateField, ValidationError } from '../../utils/validation';
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from '@tanstack/react-table';
import type { VwAccountList } from '../../types';
import { Pencil, Trash2, Check, X, Plus, Building, ArrowUpDown, ArrowUp, ArrowDown, ArrowLeft, ArrowRight, Search, ArrowUpRight } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { useNavigate } from 'react-router-dom';

const columnHelper = createColumnHelper<VwAccountList>();

export function AccountManager() {
  const fetchGlobalAccounts = useAppStore(state => state.fetchAccounts);
  const navigate = useNavigate();
  const [data, setData] = useState<VwAccountList[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const limit = 50;

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
    accNumber: [rules.numeric('Account number must be numeric')]
  };

  const handleAccountClick = (sid: string) => {
    navigate(`/transaction?account_sid=${sid}`);
  };

  const loadData = useCallback(async () => {
    try {
      const res = await api.listAccounts({
        search,
        page,
        page_size: limit,
        sort_by: sortBy,
        sort_order: sortOrder
      });
      setData(res.data);
      setTotal(res.total_count);
    } catch (e) {
      console.error(e);
    }
  }, [page, sortBy, sortOrder, search]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const resetForm = () => {
    setName(''); setBankName(''); setAccNumber('');
    setIsEditing(null); setIsAdding(false);
    setErrors({});
  };

  const handleSave = async () => {
    const newErrors = {
      account_name: validateField(name, validationRules.name),
      account_number: validateField(accNumber, validationRules.accNumber)
    };

    if (newErrors.account_name || newErrors.account_number) {
      setErrors(newErrors);
      return;
    }

    try {
      if (isEditing) {
        await api.updateAccount(isEditing, { account_name: name, bank_name: bankName, account_number: accNumber });
      } else {
        await api.addAccount({ account_name: name, bank_name: bankName, account_number: accNumber });
      }

      resetForm();
      await loadData();
      await fetchGlobalAccounts();
    } catch (e) {
      if (e instanceof ValidationError) {
        const backendErrors: Record<string, string | null> = {};
        for (const key in e.errors) {
          backendErrors[key] = e.errors[key][0];
        }
        setErrors(backendErrors);
      } else {
        console.error(e);
      }
    }
  };

  const handleEdit = (acc: VwAccountList) => {
    setIsEditing(acc.account_sid);
    setIsAdding(false);
    setName(acc.account_name);
    setBankName(acc.bank_name || '');
    setAccNumber(acc.account_number?.toString() || '');
  };

  const handleDelete = async () => {
    if (!deleteTargetSid) return;
    await api.deleteAccount(deleteTargetSid);
    setDeleteTargetSid(null);
    await loadData();
    await fetchGlobalAccounts();
  };

  const columns = useMemo(() => [
    columnHelper.accessor('account_name', {
      header: 'ACCOUNT NAME',
      cell: info => (
        <div className="flex items-center gap-3 font-medium text-slate-800">
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
        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button variant="ghost" size="icon" onClick={() => handleAccountClick(info.row.original.account_sid)} className="h-8 w-8 text-slate-400 hover:text-teal-600 hover:bg-teal-50"><ArrowUpRight className="w-4 h-4" /></Button>
          <Button variant="ghost" size="icon" onClick={() => handleEdit(info.row.original)} className="text-slate-400 hover:text-teal-600 hover:bg-teal-50 rounded-lg transition-colors"><Pencil className="w-4 h-4" /></Button>
          <Button variant="ghost" size="icon" onClick={() => setDeleteTargetSid(info.row.original.account_sid)} className="text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"><Trash2 className="w-4 h-4" /></Button>
        </div>
      ),
    })
  ], []);

  const handleSort = (columnId: string) => {
    let backendField = columnId;
    if (columnId === 'account_name') backendField = 'AccountName';
    if (columnId === 'bank_name') backendField = 'BankName';
    if (columnId === 'account_number') backendField = 'AccountNumber';

    if (sortBy === backendField) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(backendField);
      setSortOrder('asc');
    }
  };

  const getSortIcon = (columnId: string) => {
    let backendField = columnId;
    if (columnId === 'account_name') backendField = 'AccountName';
    if (columnId === 'bank_name') backendField = 'BankName';
    if (columnId === 'account_number') backendField = 'AccountNumber';

    if (sortBy !== backendField) return <ArrowUpDown className="w-3.5 h-3.5 ml-1.5 text-slate-300" />;
    return sortOrder === 'asc' ? 
      <ArrowUp className="w-3.5 h-3.5 ml-1.5 text-teal-600" /> : 
      <ArrowDown className="w-3.5 h-3.5 ml-1.5 text-teal-600" />;
  };

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-300 h-full">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h1 className="text-2xl font-bold text-slate-800">Accounts</h1>
          <div className="relative group w-64 ml-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-teal-500 transition-colors z-10" />
            <Input
              placeholder="Search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 bg-white border-slate-200 rounded-xl focus:bg-white h-9"
            />
          </div>
        </div>
        <Button
          onClick={() => { resetForm(); setIsAdding(true); }}
          className="rounded-xl font-medium"
        >
          <Plus className="w-4 h-4" /> Add Account
        </Button>
      </div>

      <div className="bg-white border border-slate-200 shadow-sm rounded-2xl flex-1 flex flex-col overflow-hidden">
        <div className="overflow-x-auto flex-1">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-slate-50 sticky top-0 z-10 border-b border-slate-200">
              {table.getHeaderGroups().map(headerGroup => (
                <tr key={headerGroup.id}>
                  {headerGroup.headers.map(header => {
                    const isSortable = ['account_name', 'bank_name', 'account_number'].includes(header.id);
                    return (
                      <th 
                        key={header.id} 
                        className={`px-6 py-4 font-semibold text-slate-500 uppercase tracking-wider text-xs ${isSortable ? 'cursor-pointer hover:bg-slate-100 transition-colors' : ''}`}
                        onClick={isSortable ? () => handleSort(header.id) : undefined}
                      >
                        <div className={`flex items-center`}>
                          {flexRender(header.column.columnDef.header, header.getContext())}
                          {isSortable && getSortIcon(header.id)}
                        </div>
                      </th>
                    );
                  })}
                </tr>
              ))}
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isAdding && (
                <tr className="bg-teal-50/30">
                  <td className="px-6 py-3">
                    <div className="flex flex-col gap-1">
                      <Input autoFocus value={name} onChange={e => { setName(e.target.value); setErrors(prev => ({ ...prev, account_name: null })); }} placeholder="e.g. Savings" className={`h-9 ${errors.account_name ? 'border-red-500 focus-visible:ring-red-500' : ''}`} />
                      {errors.account_name && <span className="text-[10px] text-red-500 font-medium">{errors.account_name}</span>}
                    </div>
                  </td>
                  <td className="px-6 py-3">
                    <div className="flex flex-col gap-1">
                      <Input value={bankName} onChange={e => setBankName(e.target.value)} placeholder="e.g. HDFC" className="h-9" />
                    </div>
                  </td>
                  <td className="px-6 py-3">
                    <div className="flex flex-col gap-1">
                      <Input value={accNumber} onChange={e => { setAccNumber(e.target.value); setErrors(prev => ({ ...prev, account_number: null })); }} placeholder="Last 4 digits" className={`h-9 ${errors.account_number ? 'border-red-500 focus-visible:ring-red-500' : ''}`} />
                      {errors.account_number && <span className="text-[10px] text-red-500 font-medium">{errors.account_number}</span>}
                    </div>
                  </td>
                  <td className="px-6 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button variant="ghost" size="icon" onClick={handleSave} className="text-teal-600 hover:text-teal-700 hover:bg-teal-100"><Check className="w-5 h-5" /></Button>
                      <Button variant="ghost" size="icon" onClick={resetForm} className="text-slate-400 hover:bg-slate-100"><X className="w-5 h-5" /></Button>
                    </div>
                  </td>
                </tr>
              )}

              {table.getRowModel().rows.map(row => {
                if (isEditing === row.original.account_sid) {
                  return (
                    <tr key={row.original.account_sid} className="bg-teal-50/30">
                      <td className="px-6 py-3">
                        <div className="flex flex-col gap-1">
                          <Input value={name} onChange={e => { setName(e.target.value); setErrors(prev => ({ ...prev, account_name: null })); }} className={`h-9 ${errors.account_name ? 'border-red-500 focus-visible:ring-red-500' : ''}`} />
                          {errors.account_name && <span className="text-[10px] text-red-500 font-medium">{errors.account_name}</span>}
                        </div>
                      </td>
                      <td className="px-6 py-3">
                        <Input value={bankName} onChange={e => setBankName(e.target.value)} className="h-9" />
                      </td>
                      <td className="px-6 py-3">
                        <div className="flex flex-col gap-1">
                          <Input value={accNumber} onChange={e => { setAccNumber(e.target.value); setErrors(prev => ({ ...prev, account_number: null })); }} className={`h-9 ${errors.account_number ? 'border-red-500 focus-visible:ring-red-500' : ''}`} />
                          {errors.account_number && <span className="text-[10px] text-red-500 font-medium">{errors.account_number}</span>}
                        </div>
                      </td>
                      <td className="px-6 py-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button variant="ghost" size="icon" onClick={handleSave} className="text-teal-600 hover:text-teal-700 hover:bg-teal-100"><Check className="w-5 h-5" /></Button>
                          <Button variant="ghost" size="icon" onClick={resetForm} className="text-slate-400 hover:bg-slate-100"><X className="w-5 h-5" /></Button>
                        </div>
                      </td>
                    </tr>
                  )
                }

                return (
                  <tr key={row.original.account_sid} className="hover:bg-slate-50 transition-colors group">
                    {row.getVisibleCells().map(cell => (
                      <td key={cell.id} className="px-6 py-3.5">
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </td>
                    ))}
                  </tr>
                )
              })}

              {data.length === 0 && !isAdding && (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-slate-500">
                    No accounts found. Click "Add Account" to create your first bank account.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="border-t border-slate-200 px-6 py-4 flex items-center justify-between bg-white text-sm">
          <span className="text-slate-500 font-medium flex items-center gap-2">
            Showing <span className="text-slate-800">{data.length > 0 ? (page - 1) * limit + 1 : 0}</span> to <span className="text-slate-800">{Math.min(page * limit, total)}</span> of <span className="text-slate-800">{total}</span>
          </span>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="h-8 w-8"
            >
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <span className="px-2 font-medium text-slate-700">Page {page} of {totalPages || 1}</span>
            <Button
              variant="outline"
              size="icon"
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages || totalPages === 0}
              className="h-8 w-8"
            >
              <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

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
