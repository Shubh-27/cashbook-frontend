import { useState, useEffect, useMemo, useCallback } from 'react';
import { useAppStore } from '../../store';
import { api } from '../../api';
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from '@tanstack/react-table';
import type { Transaction } from '../../types';
import { format, parseISO } from 'date-fns';
import { Pencil, Trash2, ArrowLeft, ArrowRight, X } from 'lucide-react';

const columnHelper = createColumnHelper<Transaction>();

export function Transaction() {
  const accounts = useAppStore(state => state.accounts);
  const selectedAccountSid = useAppStore(state => state.selectedAccountSid) || (accounts.length > 0 ? accounts[0].account_sid : null);
  const setSelectedAccount = useAppStore(state => state.setSelectedAccount);
  const globalSearch = useAppStore(state => state.globalSearch);
  const fetchAccountsAndBalance = useAppStore(state => state.fetchAccountsAndBalance);

  const [data, setData] = useState<Transaction[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const limit = 50;

  const [editingTx, setEditingTx] = useState<Transaction | null>(null);

  const loadData = useCallback(async () => {
    if (!selectedAccountSid) return;
    try {
      const res = await api.getTransactions({
        accountId: selectedAccountSid,
        search: globalSearch,
        page,
        limit
      });
      setData(res.data);
      setTotal(res.total);
    } catch (e) {
      console.error(e);
    }
  }, [selectedAccountSid, globalSearch, page]);

  useEffect(() => {
    loadData();
    const handleAdd = () => loadData();
    window.addEventListener('transaction-added', handleAdd);
    return () => window.removeEventListener('transaction-added', handleAdd);
  }, [loadData]);

  // Reset page when search or account changes
  useEffect(() => {
    setPage(1);
  }, [selectedAccountSid, globalSearch]);

  const handleDelete = async (tx: Transaction) => {
    if (confirm("Delete this transaction?")) {
      await api.deleteTransaction(tx.transaction_sid, tx.account_sid ?? '');
      loadData();
      fetchAccountsAndBalance();
    }
  };

  const handleEditSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTx) return;
    await api.updateTransaction(editingTx.transaction_sid, {
      account_sid: editingTx.account_sid,
      transaction_date: editingTx.transaction_date,
      description_sid: editingTx.description_sid,
      description_name: editingTx.description?.description_name,
      debit: editingTx.debit,
      credit: editingTx.credit,
      notes: editingTx.notes
    });
    setEditingTx(null);
    loadData();
    fetchAccountsAndBalance();
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
    columnHelper.accessor('description', {
      header: 'DESCRIPTION',
      cell: info => <span className="text-slate-800 font-medium">{info.getValue()?.description_name ?? '-'}</span>,
    }),
    columnHelper.accessor('debit', {
      header: 'DEBIT',
      cell: info => (info.getValue() ?? 0) > 0 ? <span className="text-rose-600 font-medium">{(info.getValue() ?? 0).toFixed(2)}</span> : '-',
    }),
    columnHelper.accessor('credit', {
      header: 'CREDIT',
      cell: info => (info.getValue() ?? 0) > 0 ? <span className="text-teal-600 font-medium">{(info.getValue() ?? 0).toFixed(2)}</span> : '-',
    }),
    columnHelper.accessor('balance', {
      header: 'BALANCE',
      cell: info => <span className="font-bold text-slate-800">{(info.getValue() ?? 0).toFixed(2)}</span>,
    }),
    columnHelper.accessor('notes', {
      header: 'NOTES',
      cell: info => <span className="text-slate-500 text-sm">{info.getValue() || '-'}</span>,
    }),
    columnHelper.display({
      id: 'actions',
      header: '',
      cell: info => (
        <div className="flex gap-2 justify-end opacity-0 group-hover:opacity-100 transition-opacity">
          <button onClick={() => setEditingTx(info.row.original)} className="p-1.5 text-slate-400 hover:text-teal-600 hover:bg-teal-50 rounded-lg"><Pencil className="w-4 h-4" /></button>
          <button onClick={() => handleDelete(info.row.original)} className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg"><Trash2 className="w-4 h-4" /></button>
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
        <div className="flex items-center gap-3">
          <label className="text-sm font-medium text-slate-500">Account Filter:</label>
          <select
            value={selectedAccountSid || ''}
            onChange={e => setSelectedAccount(e.target.value)}
            className="bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-sm outline-none focus:ring-2 focus:border-teal-500 min-w-[150px]"
          >
            {accounts.map(acc => (
              <option key={acc.account_sid} value={acc.account_sid}>{acc.account_name}</option>
            ))}
          </select>
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
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-50 transition-all font-medium"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <span className="px-2 font-medium text-slate-700">Page {page} of {totalPages || 1}</span>
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages || totalPages === 0}
              className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-50 transition-all font-medium"
            >
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Edit Modal */}
      {editingTx && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-800">Edit Transaction</h2>
              <button onClick={() => setEditingTx(null)} className="text-slate-400 hover:text-slate-600 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleEditSave} className="p-6 flex flex-col gap-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Date</label>
                  <input
                    type="date"
                    value={editingTx.transaction_date.split('T')[0]}
                    onChange={e => {
                      const newDate = new Date(editingTx.transaction_date);
                      const parts = e.target.value.split('-');
                      newDate.setFullYear(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
                      setEditingTx({ ...editingTx, transaction_date: newDate.toISOString() });
                    }}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 outline-none font-medium text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
                  <input
                    type="text"
                    value={editingTx.description?.description_name ?? ''}
                    onChange={e => setEditingTx({ ...editingTx, description: { ...editingTx.description, description_sid: editingTx.description?.description_sid ?? '', description_name: e.target.value, created_date_time: null, last_modified_date_time: null } })}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 outline-none font-medium text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Debit</label>
                  <input
                    type="number" step="0.01"
                    value={editingTx.debit ?? 0}
                    onChange={e => setEditingTx({ ...editingTx, debit: parseFloat(e.target.value) || 0, credit: 0 })}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 outline-none font-medium text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Credit</label>
                  <input
                    type="number" step="0.01"
                    value={editingTx.credit ?? 0}
                    onChange={e => setEditingTx({ ...editingTx, credit: parseFloat(e.target.value) || 0, debit: 0 })}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 outline-none font-medium text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Notes</label>
                <textarea
                  value={editingTx.notes ?? ''}
                  onChange={e => setEditingTx({ ...editingTx, notes: e.target.value })}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 outline-none font-medium text-sm min-h-[60px]"
                />
              </div>

              <div className="flex justify-end gap-3 mt-4 pt-4 border-t border-slate-100">
                <button type="button" onClick={() => setEditingTx(null)} className="px-4 py-2 text-sm font-medium text-slate-600">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-teal-600 text-white rounded-xl text-sm font-medium hover:bg-teal-700">Save Changes</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
