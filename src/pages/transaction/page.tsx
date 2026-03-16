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
import { format, parseISO } from 'date-fns';
import { Pencil, Trash2, ArrowLeft, ArrowRight } from 'lucide-react';
import { Button } from '../../components/ui/button';
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

const columnHelper = createColumnHelper<VwTransactionList>();

export function Transaction() {
  const open = useAppStore(state => state.quickAddOpen);
  const accounts = useAppStore(state => state.accounts);
  const selectedAccountSid = useAppStore(state => state.selectedAccountSid);
  const setSelectedAccount = useAppStore(state => state.setSelectedAccount);
  const globalSearch = useAppStore(state => state.globalSearch);
  const fetchAccounts = useAppStore(state => state.fetchAccounts);

  const [descriptions, setDescriptions] = useState<Description[]>([]);
  const [selectedDescriptionSid, setSelectedDescriptionSid] = useState<string>('all');
  const [data, setData] = useState<VwTransactionList[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const limit = 50;

  const [editingTx, setEditingTx] = useState<VwTransactionList | null>(null);
  const [deleteTargetTx, setDeleteTargetTx] = useState<VwTransactionList | null>(null);

  const loadData = useCallback(async () => {
    try {
      const filters: FilterRequest[] = [];

      if (selectedAccountSid && selectedAccountSid !== 'all') {
        filters.push({ key: 'AccountSID', condition: 'equals', value: selectedAccountSid });
      }

      if (selectedDescriptionSid && selectedDescriptionSid !== 'all') {
        filters.push({ key: 'DescriptionSID', condition: 'equals', value: selectedDescriptionSid });
      }

      const res = await api.listTransactions({
        search: globalSearch,
        page,
        page_size: limit,
        sort_by: 'TransactionDate',
        sort_order: 'desc',
        filters
      });
      setData(res.data);
      setTotal(res.total_count);
    } catch (e) {
      console.error(e);
    }
  }, [selectedAccountSid, selectedDescriptionSid, globalSearch, page]);

  useEffect(() => {
    if (open) return;
    api.listDescriptions({ page: 1, page_size: 1000 }).then(res => setDescriptions(res.data as any));
  }, [open]);

  useEffect(() => {
    loadData();
    const handleAdd = () => loadData();
    window.addEventListener('transaction-added', handleAdd);
    return () => window.removeEventListener('transaction-added', handleAdd);
  }, [loadData]);

  // Reset page when search or account/description changes
  useEffect(() => {
    setPage(1);
  }, [selectedAccountSid, selectedDescriptionSid, globalSearch]);

  const handleDelete = async () => {
    if (!deleteTargetTx) return;
    await api.deleteTransaction(deleteTargetTx.transaction_sid, deleteTargetTx.account_sid ?? '');
    setDeleteTargetTx(null);
    loadData();
    fetchAccounts();
  };

  const handleEditSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTx) return;
    await api.updateTransaction(editingTx.transaction_sid, {
      account_sid: editingTx.account_sid,
      transaction_date: editingTx.transaction_date,
      description_sid: editingTx.description_sid,
      description_name: editingTx.description_name,
      debit: editingTx.debit,
      credit: editingTx.credit,
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
  ], [page, limit]);

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-300 h-full">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-800">Transaction View</h1>
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-3">
            <Label className="text-sm font-medium text-slate-500">Account:</Label>
            <Select
              value={selectedAccountSid || 'all'}
              onValueChange={setSelectedAccount}
            >
              <SelectTrigger className="w-[180px] bg-white h-9">
                <SelectValue placeholder="All Accounts" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Accounts</SelectItem>
                {accounts.map(acc => (
                  <SelectItem key={acc.account_sid} value={acc.account_sid}>{acc.account_name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-3">
            <Label className="text-sm font-medium text-slate-500">Description:</Label>
            <Select
              value={selectedDescriptionSid}
              onValueChange={setSelectedDescriptionSid}
            >
              <SelectTrigger className="w-[180px] bg-white h-9">
                <SelectValue placeholder="All Descriptions" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Descriptions</SelectItem>
                {descriptions.map(desc => (
                  <SelectItem key={desc.description_sid} value={desc.description_sid}>{desc.description_name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <div className="bg-white border border-slate-200 shadow-sm rounded-2xl flex-1 flex flex-col overflow-hidden">
        <div className="overflow-x-auto flex-1">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-slate-50 sticky top-0 z-10 border-b border-slate-200">
              {table.getHeaderGroups().map(headerGroup => (
                <tr key={headerGroup.id}>
                  {headerGroup.headers.map(header => (
                    <th key={header.id} className="px-6 py-4 font-semibold text-slate-500 uppercase tracking-wider text-xs">
                      {flexRender(header.column.columnDef.header, header.getContext())}
                    </th>
                  ))}
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
            <form onSubmit={handleEditSave} className="flex flex-col gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
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
                    className="h-10"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-description">Description</Label>
                  <Input
                    id="edit-description"
                    type="text"
                    value={editingTx.description_name ?? ''}
                    onChange={e => setEditingTx({ ...editingTx, description_name: e.target.value, description_sid: null })}
                    className="h-10"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-debit">Debit</Label>
                  <Input
                    id="edit-debit"
                    type="number"
                    step="0.01"
                    value={editingTx.debit ?? 0}
                    onChange={e => setEditingTx({ ...editingTx, debit: parseFloat(e.target.value) || 0, credit: 0 })}
                    className="h-10"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-credit">Credit</Label>
                  <Input
                    id="edit-credit"
                    type="number"
                    step="0.01"
                    value={editingTx.credit ?? 0}
                    onChange={e => setEditingTx({ ...editingTx, credit: parseFloat(e.target.value) || 0, debit: 0 })}
                    className="h-10"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-notes">Notes</Label>
                <Textarea
                  id="edit-notes"
                  value={editingTx.notes ?? ''}
                  onChange={e => setEditingTx({ ...editingTx, notes: e.target.value })}
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
