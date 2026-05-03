import { useState, useEffect, useMemo, useCallback } from 'react';
import { DeleteConfirmModal } from '../../components/DeleteConfirmModal';
import { api } from '../../api';
import { rules, validateField, ValidationError } from '../../utils/validation';
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from '@tanstack/react-table';
import type { VwDescriptionList } from '../../types';
import { Pencil, Trash2, Plus, ArrowUpDown, ArrowUp, ArrowDown, ArrowLeft, ArrowRight, ArrowUpRight, Search } from 'lucide-react';
import { Button } from '../../components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '../../components/ui/dialog';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { useAppStore } from '@/store';
import { useNavigate } from 'react-router-dom';

const columnHelper = createColumnHelper<VwDescriptionList>();

export function Descriptions() {  
  const navigate = useNavigate();
  const [data, setData] = useState<VwDescriptionList[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const limit = 50;

  const [sortBy, setSortBy] = useState<string>('DescriptionName');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  const [editingDesc, setEditingDesc] = useState<VwDescriptionList | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [newName, setNewName] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<VwDescriptionList | null>(null);
  const [search, setSearch] = useState('');
  const [errors, setErrors] = useState<Record<string, string | null>>({});

  const validationRules = {
    name: [rules.required('Description name is required')]
  };

  const handleDescriptionClick = (sid: string) => {
    navigate(`/transaction?description_sid=${sid}`);
  };
  
  const loadData = useCallback(async () => {
    try {
      const res = await api.listDescriptions({
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

  useEffect(() => {
    if (isAdding) {
      setNewName('');
      setErrors({});
    }
  }, [isAdding]);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    await api.deleteDescription(deleteTarget.description_sid);
    setDeleteTarget(null);
    loadData();
  };

  const handleEditSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingDesc) return;

    const error = validateField(editingDesc.description_name, validationRules.name);
    if (error) {
      setErrors({ description_name: error });
      return;
    }

    try {
      await api.updateDescription(editingDesc.description_sid, {
        description_name: editingDesc.description_name
      });
      setEditingDesc(null);
      setErrors({});
      loadData();
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

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const error = validateField(newName, validationRules.name);
    if (error) {
      setErrors({ description_name: error });
      return;
    }

    try {
      await api.addDescription({
        description_name: newName
      });
      setIsAdding(false);
      setNewName('');
      setErrors({});
      loadData();
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

  const columns = useMemo(() => [
    columnHelper.display({
      id: 'sr',
      header: 'SR',
      cell: (info) => <span className="text-slate-400 font-medium">{(page - 1) * limit + info.row.index + 1}</span>,
    }),
    columnHelper.accessor('description_name', {
      header: 'NAME',
      cell: info => <span className="font-medium text-slate-800">{info.getValue()}</span>,
    }),
    columnHelper.accessor('usage_count', {
      header: 'USAGE COUNT',
      cell: info => info.getValue() > 0 ? <span className="text-slate-500">{info.getValue()}</span> : '-',
    }),
    columnHelper.display({
      id: 'actions',
      header: 'ACTIONS',
      cell: info => (
        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button variant="ghost" size="icon" onClick={() => handleDescriptionClick(info.row.original.description_sid)} className="h-8 w-8 text-slate-400 hover:text-teal-600 hover:bg-teal-50"><ArrowUpRight className="w-4 h-4" /></Button>
          <Button variant="ghost" size="icon" onClick={() => setEditingDesc(info.row.original)} className="h-8 w-8 text-slate-400 hover:text-teal-600 hover:bg-teal-50"><Pencil className="w-4 h-4" /></Button>
          <Button variant="ghost" size="icon" onClick={() => setDeleteTarget(info.row.original)} className="h-8 w-8 text-slate-400 hover:text-rose-600 hover:bg-rose-50"><Trash2 className="w-4 h-4" /></Button>
        </div>
      ),
    })
  ], [page]);

  const handleSort = (columnId: string) => {
    let backendField = columnId;
    if (columnId === 'description_name') backendField = 'DescriptionName';
    if (columnId === 'usage_count') backendField = 'UsageCount';

    if (sortBy === backendField) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(backendField);
      setSortOrder('asc');
    }
  };

  const getSortIcon = (columnId: string) => {
    let backendField = columnId;
    if (columnId === 'description_name') backendField = 'DescriptionName';
    if (columnId === 'usage_count') backendField = 'UsageCount';

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
          <h1 className="text-2xl font-bold text-slate-800">Descriptions</h1>
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
          onClick={() => setIsAdding(true)}
          className="rounded-xl font-medium"
        >
          <Plus className="w-4 h-4" />
          Add Description
        </Button>
      </div>

      <div className="bg-white border border-slate-200 shadow-sm rounded-2xl flex-1 flex flex-col overflow-hidden">
        <div className="overflow-x-auto flex-1">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-slate-50 sticky top-0 z-10 border-b border-slate-200">
              {table.getHeaderGroups().map(headerGroup => (
                <tr key={headerGroup.id}>
                  {headerGroup.headers.map(header => {
                    const isSortable = ['description_name', 'usage_count'].includes(header.id);
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
      <Dialog open={!!editingDesc} onOpenChange={(open) => { if (!open) { setEditingDesc(null); setErrors({}); } }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Description</DialogTitle>
          </DialogHeader>
          {editingDesc && (
            <form onSubmit={handleEditSave} className="flex flex-col gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="edit-desc-name">Name</Label>
                <Input
                  id="edit-desc-name"
                  type="text"
                  value={editingDesc.description_name}
                  onChange={e => { setEditingDesc({ ...editingDesc, description_name: e.target.value }); setErrors({}); }}
                  className={`h-10 ${errors.description_name ? 'border-red-500 focus-visible:ring-red-500' : ''}`}
                  required
                />
                {errors.description_name && <p className="text-[11px] text-red-500 font-medium mt-1">{errors.description_name}</p>}
              </div>
              <DialogFooter className="sm:justify-end gap-3 pt-4 border-t">
                <Button variant="ghost" type="button" onClick={() => setEditingDesc(null)}>
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

      {/* Add Modal */}
      <Dialog open={isAdding} onOpenChange={(open) => { setIsAdding(open); if (!open) setErrors({}); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>New Description</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAddSubmit} className="flex flex-col gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="new-desc-name">Name</Label>
              <Input
                id="new-desc-name"
                type="text"
                value={newName}
                onChange={e => { setNewName(e.target.value); setErrors({}); }}
                className={`h-10 ${errors.description_name ? 'border-red-500 focus-visible:ring-red-500' : ''}`}
                placeholder="e.g. Salary, Rent, Groceries"
                required
              />
              {errors.description_name && <p className="text-[11px] text-red-500 font-medium mt-1">{errors.description_name}</p>}
            </div>
            <DialogFooter className="sm:justify-end gap-3 pt-4 border-t">
              <Button variant="ghost" type="button" onClick={() => setIsAdding(false)}>
                Cancel
              </Button>
              <Button type="submit">
                Add
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <DeleteConfirmModal
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Delete Description"
        description="Are you sure you want to delete this description? This will affect existing transactions using it."
        itemName={deleteTarget?.description_name}
      />
    </div>
  );
}
