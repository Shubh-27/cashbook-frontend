import { useState, useEffect, useMemo } from 'react';
import { DeleteConfirmModal } from '../../components/DeleteConfirmModal';
import { api } from '../../api';
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from '@tanstack/react-table';
import type { VwDescriptionList } from '../../types';
import { Pencil, Trash2, Plus } from 'lucide-react';
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

const columnHelper = createColumnHelper<VwDescriptionList>();

export function Descriptions() {
  const [data, setData] = useState<VwDescriptionList[]>([]);
  const [editingDesc, setEditingDesc] = useState<VwDescriptionList | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [newName, setNewName] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<VwDescriptionList | null>(null);

  const loadData = async () => {
    try {
      const res = await api.listDescriptions({ page: 1, page_size: 1000, sort_by: 'DescriptionName', sort_order: 'asc' });
      setData(res.data as any);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    await api.deleteDescription(deleteTarget.description_sid);
    setDeleteTarget(null);
    loadData();
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
    columnHelper.accessor('usage_count', {
      header: 'USAGE COUNT',
      cell: info => info.getValue() ? <span className="text-slate-500">{info.getValue()}</span> : '-',
    }),
    columnHelper.display({
      id: 'actions',
      header: 'ACTIONS',
      cell: info => (
        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button variant="ghost" size="icon" onClick={() => setEditingDesc(info.row.original)} className="h-8 w-8 text-slate-400 hover:text-teal-600 hover:bg-teal-50"><Pencil className="w-4 h-4" /></Button>
          <Button variant="ghost" size="icon" onClick={() => setDeleteTarget(info.row.original)} className="h-8 w-8 text-slate-400 hover:text-rose-600 hover:bg-rose-50"><Trash2 className="w-4 h-4" /></Button>
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
        <Button
          onClick={() => setIsAdding(true)}
          className="rounded-xl font-medium"
        >
          <Plus className="w-4 h-4" />
          Add Description
        </Button>
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
      <Dialog open={!!editingDesc} onOpenChange={(open) => !open && setEditingDesc(null)}>
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
                  onChange={e => setEditingDesc({ ...editingDesc, description_name: e.target.value })}
                  className="h-10"
                  required
                />
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
      <Dialog open={isAdding} onOpenChange={setIsAdding}>
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
                onChange={e => setNewName(e.target.value)}
                className="h-10"
                placeholder="e.g. Salary, Rent, Groceries"
                required
              />
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
