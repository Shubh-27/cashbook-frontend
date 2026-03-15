import { useState, useEffect, useMemo } from 'react';
import { api } from '../../api';
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from '@tanstack/react-table';
import type { Description } from '../../types';
import { format, parseISO } from 'date-fns';
import { Pencil, Trash2, X, Plus } from 'lucide-react';

const columnHelper = createColumnHelper<Description>();

export function Descriptions() {
  const [data, setData] = useState<Description[]>([]);
  const [editingDesc, setEditingDesc] = useState<Description | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [newName, setNewName] = useState('');

  const loadData = async () => {
    try {
      const res = await api.getDescriptions();
      setData(res);
    } catch(e) {
      console.error(e);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleDelete = async (desc: Description) => {
    if (confirm(`Delete description "${desc.description_name}"?`)) {
      await api.deleteDescription(desc.description_sid);
      loadData();
    }
  };

  const handleEditSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingDesc) return;
    await api.updateDescription(editingDesc.description_sid, {
      description_name: editingDesc.description_name
    });
    setEditingDesc(null);
    loadData();
  };

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName) return;
    await api.addDescription({
      description_name: newName
    });
    setIsAdding(false);
    setNewName('');
    loadData();
  };

  const columns = useMemo(() => [
    columnHelper.display({
      id: 'sr',
      header: 'SR',
      cell: (info) => <span className="text-slate-400 font-medium">{info.row.index + 1}</span>,
    }),
    columnHelper.accessor('description_name', {
      header: 'NAME',
      cell: info => <span className="font-medium text-slate-800">{info.getValue()}</span>,
    }),
    columnHelper.accessor('created_date_time', {
      header: 'CREATED',
      cell: info => info.getValue() ? <span className="text-slate-500">{format(parseISO(info.getValue()!), 'dd MMM yyyy, HH:mm')}</span> : '-',
    }),
    columnHelper.display({
      id: 'actions',
      header: '',
      cell: info => (
        <div className="flex gap-2 justify-end opacity-0 group-hover:opacity-100 transition-opacity">
          <button onClick={() => setEditingDesc(info.row.original)} className="p-1.5 text-slate-400 hover:text-teal-600 hover:bg-teal-50 rounded-lg"><Pencil className="w-4 h-4"/></button>
          <button onClick={() => handleDelete(info.row.original)} className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg"><Trash2 className="w-4 h-4"/></button>
        </div>
      ),
    })
  ], []);

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-300 h-full">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-800">Descriptions Manager</h1>
        <button 
          onClick={() => setIsAdding(true)}
          className="flex items-center gap-2 bg-slate-900 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-slate-800 transition-all shadow-sm"
        >
          <Plus className="w-4 h-4" />
          Add Description
        </button>
      </div>

      <div className="bg-white border border-slate-200 shadow-sm rounded-2xl flex-1 flex flex-col overflow-hidden">
        <div className="overflow-x-auto">
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
                  <tr key={row.original.description_sid} className="hover:bg-slate-50 transition-colors group">
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
                    No descriptions found. Use the button above to add one.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Modal */}
      {editingDesc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-800">Edit Description</h2>
              <button onClick={() => setEditingDesc(null)} className="text-slate-400 hover:text-slate-600 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleEditSave} className="p-6 flex flex-col gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Name</label>
                <input 
                  type="text" 
                  value={editingDesc.description_name}
                  onChange={e => setEditingDesc({ ...editingDesc, description_name: e.target.value })}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 outline-none font-medium text-sm"
                  required
                />
              </div>
              <div className="flex justify-end gap-3 mt-4 pt-4 border-t border-slate-100">
                <button type="button" onClick={() => setEditingDesc(null)} className="px-4 py-2 text-sm font-medium text-slate-600">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-teal-600 text-white rounded-xl text-sm font-medium hover:bg-teal-700">Save Changes</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Modal */}
      {isAdding && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-800">New Description</h2>
              <button onClick={() => setIsAdding(false)} className="text-slate-400 hover:text-slate-600 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleAddSubmit} className="p-6 flex flex-col gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Name</label>
                <input 
                  type="text" 
                  value={newName}
                  onChange={e => setNewName(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 outline-none font-medium text-sm"
                  placeholder="e.g. Salary, Rent, Groceries"
                  required
                />
              </div>
              <div className="flex justify-end gap-3 mt-4 pt-4 border-t border-slate-100">
                <button type="button" onClick={() => setIsAdding(false)} className="px-4 py-2 text-sm font-medium text-slate-600">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-slate-900 text-white rounded-xl text-sm font-medium hover:bg-slate-800">Add</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
