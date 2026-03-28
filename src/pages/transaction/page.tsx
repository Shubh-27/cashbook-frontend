import { useState, useEffect, useMemo, useCallback } from 'react';
import { DeleteConfirmModal } from '../../components/DeleteConfirmModal';
import { useAppStore } from '../../store';
import { api } from '../../api';
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from '@tanstack/react-table';
import type { Transaction, Description, VwTransactionList, FilterRequest } from '../../types';
import { format, parseISO, isValid } from 'date-fns';
import { Pencil, Trash2, ArrowLeft, ArrowRight, ArrowUpDown, ArrowUp, ArrowDown, Search, Download, Check, ChevronsUpDown } from 'lucide-react';
import { cn } from '../../lib/utils';
import { Button } from '../../components/ui/button';
import { DateRangePicker } from '../../components/DateRangePicker';
import type { DateRange } from '../../utils/date';
import { presets, formatDateForPayload } from '../../utils/date';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '../../components/ui/dialog';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Textarea } from '../../components/ui/textarea';
import { Checkbox } from '../../components/ui/checkbox';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '../../components/ui/popover';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '../../components/ui/command';

import { useSearchParams } from 'react-router-dom';

const columnHelper = createColumnHelper<VwTransactionList>();

export function Transaction() {
  const [searchParams, setSearchParams] = useSearchParams();
  const open = useAppStore(state => state.quickAddOpen);
  const accounts = useAppStore(state => state.accounts);
  const fetchAccounts = useAppStore(state => state.fetchAccounts);

  const selectedAccountSid = searchParams.get('account_sid') || 'all';
  const selectedDescriptionSid = searchParams.get('description_sid') || 'all';
  const search = searchParams.get('search') || '';
  const startDateParam = searchParams.get('start_date');
  const endDateParam = searchParams.get('end_date');

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

  // Set default FY on mount if no dates provided
  useEffect(() => {
    if (!startDateParam && !endDateParam) {
      const defaultFY = presets.currentFY();
      setSearchParams(prev => {
        prev.set('start_date', defaultFY.from.toISOString());
        prev.set('end_date', defaultFY.to.toISOString());
        return prev;
      }, { replace: true });
    }
  }, []); // Only run on mount

  const [descriptions, setDescriptions] = useState<Description[]>([]);
  const [data, setData] = useState<VwTransactionList[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const limit = 50;

  const [editingTx, setEditingTx] = useState<VwTransactionList | null>(null);
  const [openCombobox, setOpenCombobox] = useState(false);
  const [deleteTargetTx, setDeleteTargetTx] = useState<VwTransactionList | null>(null);

  const [exportModalOpen, setExportModalOpen] = useState(false);
  const [exportType, setExportType] = useState<'excel' | 'csv'>('excel');
  const [separateSheets, setSeparateSheets] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [excelName, setExcelName] = useState('');

  const [sortBy, setSortBy] = useState<string>('TransactionDate');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const loadData = useCallback(async () => {
    try {
      const filters: FilterRequest[] = [];

      if (selectedAccountSid && selectedAccountSid !== 'all') {
        filters.push({ key: 'AccountSID', condition: 'equals', value: selectedAccountSid });
      }

      if (selectedDescriptionSid && selectedDescriptionSid !== 'all') {
        filters.push({ key: 'DescriptionSID', condition: 'equals', value: selectedDescriptionSid });
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
        page_size: limit,
        sort_by: sortBy,
        sort_order: sortOrder,
        filters
      });
      setData(res.data);
      setTotal(res.total_count);
    } catch (e) {
      console.error(e);
    }
  }, [selectedAccountSid, selectedDescriptionSid, search, page, sortBy, sortOrder, dateRange]);

  useEffect(() => {
    if (open) return;
    api.listDescriptions({ page: 1, page_size: -1 }).then(res => setDescriptions(res.data as any));
  }, [open]);

  useEffect(() => {
    loadData();
    const handleAdd = () => loadData();
    window.addEventListener('transaction-added', handleAdd);
    return () => window.removeEventListener('transaction-added', handleAdd);
  }, [loadData]);

  // Reset page when search or filters change
  useEffect(() => {
    setPage(1);
  }, [selectedAccountSid, selectedDescriptionSid, search, dateRange]);

  const handleDelete = async () => {
    if (!deleteTargetTx) return;
    await api.deleteTransaction(deleteTargetTx.transaction_sid, deleteTargetTx.account_sid ?? '');
    setDeleteTargetTx(null);
    loadData();
    fetchAccounts();
  };

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const filters: FilterRequest[] = [];
      if (selectedAccountSid && selectedAccountSid !== 'all') {
        filters.push({ key: 'AccountSID', condition: 'equals', value: selectedAccountSid });
      }
      if (selectedDescriptionSid && selectedDescriptionSid !== 'all') {
        filters.push({ key: 'DescriptionSID', condition: 'equals', value: selectedDescriptionSid });
      }
      if (dateRange) {
        filters.push({
          key: 'TransactionDate',
          condition: 'between',
          from: formatDateForPayload(dateRange.from),
          to: formatDateForPayload(dateRange.to)
        });
        // We also pass type: 'date' so backend properly calculates FY strings
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
        page_size: limit,
        sort_by: sortBy,
        sort_order: sortOrder,
        export_type: exportType,
        separate_sheets: separateSheets,
        account_sid: selectedAccountSid && selectedAccountSid !== 'all' ? selectedAccountSid : null,
        description_sid: selectedDescriptionSid && selectedDescriptionSid !== 'all' ? selectedDescriptionSid : null,
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

  const handleEditSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTx) return;

    const amount = Math.max(editingTx.debit, editingTx.credit);
    const type = editingTx.debit > 0 ? 'DEBIT' : (editingTx.credit > 0 ? 'CREDIT' : 'DEBIT');

    await api.updateTransaction(editingTx.transaction_sid, {
      account_sid: editingTx.account_sid,
      transaction_date: editingTx.transaction_date,
      description_sid: editingTx.description_sid,
      description_name: editingTx.description_name,
      debit: type === 'DEBIT' ? amount : 0,
      credit: type === 'CREDIT' ? amount : 0,
      notes: editingTx.notes
    });
    setEditingTx(null);
    loadData();
    fetchAccounts();
  };

  const columns = useMemo(() => [
    columnHelper.display({
      id: 'sr',
      header: 'SR',
      cell: (info) => <span className="text-slate-400 font-medium">{(page - 1) * limit + info.row.index + 1}</span>,
    }),
    columnHelper.accessor('transaction_date', {
      header: 'DATE',
      cell: info => <span className="font-medium">{format(parseISO(info.getValue()), 'dd MMM yyyy')}</span>,
    }),
    columnHelper.accessor('account_name', {
      header: 'ACCOUNT',
      cell: info => <span className="text-slate-800 font-medium">{info.getValue() ?? '-'}</span>,
    }),
    columnHelper.accessor('description_name', {
      header: 'DESCRIPTION',
      cell: info => <span className="text-slate-800 font-medium">{info.getValue() ?? '-'}</span>,
    }),
    columnHelper.accessor('debit', {
      header: 'DEBIT',
      cell: info => (info.getValue() ?? 0) > 0 ? <span className="text-rose-600 font-medium">{(info.getValue() ?? 0).toFixed(2)}</span> : '-',
    }),
    columnHelper.accessor('credit', {
      header: 'CREDIT',
      cell: info => (info.getValue() ?? 0) > 0 ? <span className="text-teal-600 font-medium">{(info.getValue() ?? 0).toFixed(2)}</span> : '-',
    }),
    columnHelper.accessor('notes', {
      header: 'NOTES',
      cell: info => <span className="text-slate-500 text-sm">{info.getValue() || '-'}</span>,
    }),
    columnHelper.display({
      id: 'actions',
      header: 'Actions',
      cell: info => (
        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button variant="ghost" size="icon" onClick={() => setEditingTx(info.row.original)} className="h-8 w-8 text-slate-400 hover:text-teal-600 hover:bg-teal-50"><Pencil className="w-4 h-4" /></Button>
          <Button variant="ghost" size="icon" onClick={() => setDeleteTargetTx(info.row.original)} className="h-8 w-8 text-slate-400 hover:text-rose-600 hover:bg-rose-50"><Trash2 className="w-4 h-4" /></Button>
        </div>
      ),
    })
  ], [page, limit, sortBy, sortOrder]);

  const handleSort = (columnId: string) => {
    let backendField = columnId;
    // Map column IDs to backend field names if they differ
    if (columnId === 'transaction_date') backendField = 'TransactionDate';
    if (columnId === 'account_name') backendField = 'AccountName';
    if (columnId === 'description_name') backendField = 'DescriptionName';
    if (columnId === 'debit') backendField = 'Debit';
    if (columnId === 'credit') backendField = 'Credit';

    if (sortBy === backendField) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(backendField);
      setSortOrder('asc');
    }
  };

  const getSortIcon = (columnId: string) => {
    let backendField = columnId;
    if (columnId === 'transaction_date') backendField = 'TransactionDate';
    if (columnId === 'description_name') backendField = 'DescriptionName';
    if (columnId === 'debit') backendField = 'Debit';
    if (columnId === 'credit') backendField = 'Credit';

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
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-2xl font-bold text-slate-800 shrink-0">Transaction View</h1>
        <div className="flex-1 min-w-0" />
        <div className="relative group w-100 shrink-0">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-teal-500 transition-colors z-10" />
          <Input
            placeholder="Search..."
            value={search}
            onChange={(e) => {
              const val = e.target.value;
              setSearchParams(prev => {
                if (val) prev.set('search', val);
                else prev.delete('search');
                return prev;
              });
            }}
            className="w-full pl-10 bg-white border-slate-200 rounded-xl focus:bg-white h-9"
          />
        </div>
        <Button
          variant="outline"
          onClick={() => setExportModalOpen(true)}
          className="shrink-0 h-9 rounded-xl border-slate-200 text-slate-600 hover:text-teal-600 hover:bg-teal-50"
        >
          <Download className="w-4 h-4 mr-2" />
          Export
        </Button>
      </div>
      <div className="flex justify-end gap-x-10 gap-y-2">
        <div className="flex items-center gap-2 shrink-0">
          <Label className="text-[10px] font-bold uppercase tracking-wide text-slate-500 whitespace-nowrap">
            Date Range:
          </Label>
          <DateRangePicker
            range={dateRange}
            onChange={(newRange) => {
              setSearchParams(prev => {
                if (newRange) {
                  prev.set('start_date', newRange.from.toISOString());
                  prev.set('end_date', newRange.to.toISOString());
                } else {
                  prev.delete('start_date');
                  prev.delete('end_date');
                }
                return prev;
              });
            }}
          />
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Label className="text-[10px] font-bold uppercase tracking-wide text-slate-500 whitespace-nowrap">
            Account:
          </Label>
          <Select
            value={selectedAccountSid}
            onValueChange={(val) => {
              setSearchParams(prev => {
                if (val && val !== 'all') prev.set('account_sid', val);
                else prev.delete('account_sid');
                return prev;
              });
            }}
          >
            <SelectTrigger className="w-[250px] bg-white h-9 border-slate-200">
              <SelectValue placeholder="All Accounts" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Accounts</SelectItem>
              {accounts.map(acc => (
                <SelectItem key={acc.account_sid} value={acc.account_sid}>
                  {acc.account_name} {(acc.account_number)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Label className="text-[10px] font-bold uppercase tracking-wide text-slate-500 whitespace-nowrap">
            Description:
          </Label>
          <Select
            value={selectedDescriptionSid}
            onValueChange={(val) => {
              setSearchParams(prev => {
                if (val && val !== 'all') prev.set('description_sid', val);
                else prev.delete('description_sid');
                return prev;
              });
            }}
          >
            <SelectTrigger className="w-[200px] bg-white h-9 border-slate-200">
              <SelectValue placeholder="All Descriptions" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Descriptions</SelectItem>
              {descriptions.map(desc => (
                <SelectItem key={desc.description_sid} value={desc.description_sid}>
                  {desc.description_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="bg-white border border-slate-200 shadow-sm rounded-2xl flex-1 flex flex-col overflow-hidden">
        <div className="overflow-x-auto flex-1">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-slate-50 sticky top-0 z-10 border-b border-slate-200">
              {table.getHeaderGroups().map(headerGroup => (
                <tr key={headerGroup.id}>
                  {headerGroup.headers.map(header => {
                    const isSortable = ['transaction_date', 'account_name', 'description_name', 'debit', 'credit'].includes(header.id);
                    return (
                      <th
                        key={header.id}
                        className={`px-6 py-4 font-semibold text-slate-500 uppercase tracking-wider text-xs ${isSortable ? 'cursor-pointer hover:bg-slate-100 transition-colors' : ''}`}
                        onClick={isSortable ? () => handleSort(header.id) : undefined}
                      >
                        <div className="flex items-center">
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
              {table.getRowModel().rows.length > 0 ? (
                table.getRowModel().rows.map(row => (
                  <tr key={row.original.transaction_sid} className="hover:bg-slate-50 transition-colors group">
                    {row.getVisibleCells().map(cell => (
                      <td key={cell.id} className="px-6 py-3.5">
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </td>
                    ))}
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={columns.length} className="px-6 py-12 text-center text-slate-500">
                    No transactions found.
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

      {/* Edit Modal */}
      <Dialog open={!!editingTx} onOpenChange={(open) => !open && setEditingTx(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Transaction</DialogTitle>
          </DialogHeader>

          {editingTx && (
            <form onSubmit={handleEditSave} className="flex flex-col gap-5 py-4">
              <div className="space-y-2">
                <Label htmlFor="edit-account">Account</Label>
                <Select value={editingTx.account_sid || undefined} onValueChange={(val) => setEditingTx({ ...editingTx, account_sid: val })}>
                  <SelectTrigger id="edit-account" className="w-full h-10">
                    <SelectValue placeholder="Select Account" />
                  </SelectTrigger>
                  <SelectContent>
                    {accounts.map(acc => (
                      <SelectItem key={acc.account_sid} value={acc.account_sid}>
                        {acc.account_name} {acc.account_number ? `(${acc.account_number})` : ''}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Type</Label>
                  <div className="flex rounded-lg overflow-hidden border border-input p-1 bg-muted/30 h-10">
                    <button
                      type="button"
                      onClick={() => {
                        const amount = Math.max(editingTx.debit, editingTx.credit);
                        setEditingTx({ ...editingTx, debit: amount, credit: 0 });
                      }}
                      className={`flex-1 text-sm font-medium rounded-md transition-all outline-none focus-visible:ring-2 focus-visible:ring-primary ${editingTx.debit > 0 || (editingTx.debit === 0 && editingTx.credit === 0) ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                    >
                      Debit
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const amount = Math.max(editingTx.debit, editingTx.credit);
                        setEditingTx({ ...editingTx, credit: amount, debit: 0 });
                      }}
                      className={`flex-1 text-sm font-medium rounded-md transition-all ${editingTx.credit > 0 ? 'bg-background shadow-sm text-teal-600' : 'text-muted-foreground hover:text-foreground'}`}
                    >
                      Credit
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit-date">Date</Label>
                  <Input
                    id="edit-date"
                    type="date"
                    value={editingTx.transaction_date.split('T')[0]}
                    onChange={e => {
                      const newDate = new Date(editingTx.transaction_date);
                      const parts = e.target.value.split('-');
                      newDate.setFullYear(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
                      setEditingTx({ ...editingTx, transaction_date: newDate.toISOString() });
                    }}
                    className="uppercase h-10"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="col-span-1 space-y-2">
                  <Label htmlFor="edit-amount">Amount (₹)</Label>
                  <Input
                    id="edit-amount"
                    type="number"
                    step="0.01"
                    value={Math.max(editingTx.debit, editingTx.credit) || ''}
                    onChange={e => {
                      const val = parseFloat(e.target.value) || 0;
                      if (editingTx.credit > 0) {
                        setEditingTx({ ...editingTx, credit: val, debit: 0 });
                      } else {
                        setEditingTx({ ...editingTx, debit: val, credit: 0 });
                      }
                    }}
                    placeholder="0.00"
                    className="h-10"
                    required
                  />
                </div>
                <div className="col-span-2 space-y-2 flex flex-col">
                  <Label htmlFor="edit-description">Description <span className="text-red-500">*</span></Label>
                  <Popover open={openCombobox} onOpenChange={setOpenCombobox}>
                    <PopoverTrigger asChild>
                      <Button
                        id="edit-description"
                        variant="outline"
                        role="combobox"
                        aria-expanded={openCombobox}
                        className="w-full justify-between h-10 font-normal border-input"
                      >
                        {editingTx.description_name || "Select description..."}
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
                      <Command>
                        <CommandInput
                          placeholder="Search description..."
                          onValueChange={(val) => {
                            setEditingTx({ ...editingTx, description_name: val, description_sid: '' });
                          }}
                        />
                        <CommandList>
                          <CommandEmpty className="py-2 px-4 text-sm">
                            No description found.
                            {editingTx.description_name && (
                              <div className="mt-2 pt-2 border-t text-muted-foreground uppercase text-xs font-semibold">
                                Will use: "{editingTx.description_name}"
                              </div>
                            )}
                          </CommandEmpty>
                          <CommandGroup>
                            {descriptions.map((desc) => (
                              <CommandItem
                                key={desc.description_sid}
                                value={desc.description_name}
                                onSelect={(currentValue) => {
                                  setEditingTx({ ...editingTx, description_name: currentValue, description_sid: desc.description_sid });
                                  setOpenCombobox(false);
                                }}
                              >
                                <Check
                                  className={cn(
                                    "mr-2 h-4 w-4",
                                    editingTx.description_name?.toLowerCase() === desc.description_name.toLowerCase() ? "opacity-100" : "opacity-0"
                                  )}
                                />
                                {desc.description_name}
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-notes">Notes (Optional)</Label>
                <Textarea
                  id="edit-notes"
                  value={editingTx.notes ?? ''}
                  onChange={e => setEditingTx({ ...editingTx, notes: e.target.value })}
                  placeholder="Additional details..."
                  className="min-h-[80px] resize-none"
                />
              </div>

              <DialogFooter className="sm:justify-end gap-3 pt-4 border-t">
                <Button variant="ghost" type="button" onClick={() => setEditingTx(null)}>
                  Cancel
                </Button>
                <Button type="submit">
                  Save Changes
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* Export Modal */}
      <Dialog open={exportModalOpen} onOpenChange={setExportModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Export Transactions</DialogTitle>
          </DialogHeader>

          <div className="flex flex-col gap-6 py-4">
            <div className="space-y-3">
              <Label className="text-sm font-semibold text-slate-700">Format</Label>
              <Select value={exportType} onValueChange={(val: 'excel' | 'csv') => setExportType(val)}>
                <SelectTrigger className="w-full h-10 border-slate-200 focus:ring-teal-500">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="excel">Excel (.xlsx)</SelectItem>
                  <SelectItem value="csv">CSV (.csv)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-3">
              <Label className="text-sm font-semibold text-slate-700">File Name (Optional)</Label>
              <Input
                placeholder="Custom file name (e.g. My_Export)"
                value={excelName}
                onChange={(e) => setExcelName(e.target.value)}
                className="h-10 border-slate-200 focus-visible:ring-teal-500"
              />
            </div>

            {exportType === 'excel' && (
              <div className="flex items-start space-x-3 bg-slate-50 p-4 rounded-xl border border-slate-100">
                <Checkbox
                  id="separate-sheets"
                  checked={separateSheets}
                  onCheckedChange={(checked) => setSeparateSheets(checked as boolean)}
                  className="mt-1 data-[state=checked]:bg-teal-600 data-[state=checked]:border-teal-600"
                />
                <div className="space-y-1 leading-none">
                  <label
                    htmlFor="separate-sheets"
                    className="text-sm font-medium text-slate-700 cursor-pointer"
                  >
                    Separate Sheets
                  </label>
                  <p className="text-xs text-slate-500">
                    If multiple accounts are exported, group them into their own individual sheets.
                  </p>
                </div>
              </div>
            )}
            {exportType === 'csv' && (
              <p className="text-xs text-slate-500 italic bg-amber-50 text-amber-700 p-3 rounded-xl border border-amber-100">
                CSV formatting does not support grouping features or multiple sheets. Data will be flattened.
              </p>
            )}
            {selectedAccountSid !== 'all' && exportType === 'excel' && (
              <p className="text-xs text-slate-500 italic bg-blue-50 text-blue-700 p-3 rounded-xl border border-blue-100">
                Note: Exporting a single selected account will naturally only use one sheet.
              </p>
            )}
          </div>

          <DialogFooter className="sm:justify-end gap-3 pt-4 border-t">
            <Button variant="ghost" onClick={() => setExportModalOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleExport}
              disabled={isExporting}
              className="bg-teal-600 hover:bg-teal-700 text-white"
            >
              {isExporting ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Exporting...
                </>
              ) : (
                'Download File'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
