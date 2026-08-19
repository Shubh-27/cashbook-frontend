import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { DeleteConfirmModal } from '@/components/DeleteConfirmModal';
import { useAppStore } from '@/store';
import { api } from '@/services/api';
import { rules, validateField, ValidationError } from '@/utils/validation';
import {
  createColumnHelper,
} from '@tanstack/react-table';
import { DataTable } from '@/components/common/DataTable';
import { SearchInput } from '@/components/common/SearchInput';
import { PaginationControls } from '@/components/common/PaginationControls';
import { DescriptionCardFeed } from './components/DescriptionCardFeed';
import { DescriptionModal } from './components/DescriptionModal';
import type { VwDescriptionList } from '@/types';
import { Pencil, Trash2, ArrowUpRight, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { DEFAULT_PAGE_SIZE } from '@/config/constants';

const columnHelper = createColumnHelper<VwDescriptionList>();

export function Descriptions() {
  const fetchGlobalDescriptions = useAppStore(state => state.fetchDescriptions);
  const navigate = useNavigate();
  const [data, setData] = useState<VwDescriptionList[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const limit = DEFAULT_PAGE_SIZE;

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

  const handleDescriptionClick = useCallback((sid: string) => {
    navigate(`/transactions?description_sid=${sid}`);
  }, [navigate]);

  const abortControllerRef = useRef<AbortController | null>(null);

  const loadData = useCallback(async () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    try {
      const res = await api.listDescriptions({
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
      console.error('Failed to load descriptions:', e);
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

  useEffect(() => {
    if (isAdding) {
      setNewName('');
      setErrors({});
    }
  }, [isAdding]);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await api.deleteDescription(deleteTarget.description_sid);
      setDeleteTarget(null);
      await loadData();
      await fetchGlobalDescriptions();
    } catch (e) {
      console.error('Failed to delete description:', e);
      toast.error(e instanceof Error ? e.message : 'Failed to delete description');
    }
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
      await loadData();
      await fetchGlobalDescriptions();
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
      await loadData();
      await fetchGlobalDescriptions();
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
        <div className="flex gap-1">
          <Button variant="ghost" size="icon" onClick={() => handleDescriptionClick(info.row.original.description_sid)} aria-label="View activity" className="h-8 w-8 text-slate-400 hover:text-teal-600 hover:bg-teal-50"><ArrowUpRight className="w-4 h-4" /></Button>
          <Button variant="ghost" size="icon" onClick={() => setEditingDesc(info.row.original)} aria-label="Edit description" className="h-8 w-8 text-slate-400 hover:text-teal-600 hover:bg-teal-50"><Pencil className="w-4 h-4" /></Button>
          <Button variant="ghost" size="icon" onClick={() => setDeleteTarget(info.row.original)} aria-label="Delete description" className="h-8 w-8 text-slate-400 hover:text-rose-600 hover:bg-rose-50"><Trash2 className="w-4 h-4" /></Button>
        </div>
      ),
    })
  ], [page, limit, handleDescriptionClick]);

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

  const getSortField = (columnId: string) => {
    if (columnId === 'description_name') return 'DescriptionName';
    if (columnId === 'usage_count') return 'UsageCount';
    return columnId;
  };

  return (
    <div className="flex flex-col gap-4 md:gap-6 animate-in fade-in duration-300 md:h-full flex-1 min-h-0">
      {/* Header with Search and Add button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
        <div className="hidden md:block">
          <h1 className="text-xl md:text-2xl font-bold text-slate-800">Descriptions</h1>
          <p className="text-xs md:text-sm text-slate-500 mt-0.5">Organize and manage transaction category tags.</p>
        </div>

        <div className="flex items-center gap-2.5 w-full sm:w-auto">
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder="Search..."
            className="flex-1 sm:w-64 sm:flex-none"
          />
          <Button
            onClick={() => setIsAdding(true)}
            className="rounded-xl font-medium shrink-0 h-10 sm:h-9 bg-teal-600 hover:bg-teal-700 text-white"
          >
            <Plus className="w-4 h-4 mr-1" /> Add Description
          </Button>
        </div>
      </div>

      {/* Mobile Card Feed (< md) */}
      <DescriptionCardFeed
        data={data}
        page={page}
        pageSize={limit}
        total={total}
        onPageChange={setPage}
        onDescriptionClick={handleDescriptionClick}
        onEdit={setEditingDesc}
        onDelete={setDeleteTarget}
      />

      {/* Desktop Table View (>= md) */}
      <DataTable<VwDescriptionList>
        data={data}
        columns={columns}
        sortBy={sortBy}
        sortOrder={sortOrder}
        onSort={handleSort}
        colWidths={['w-[6%]', 'w-[60%]', 'w-[19%]', 'w-[15%]']}
        sortableColumns={['description_name', 'usage_count']}
        getSortField={getSortField}
        emptyMessage="No descriptions found. Use the button above to add one."
        getRowId={(row) => row.description_sid}
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

      {/* Unified Description Modal for Edit and Add */}
      <DescriptionModal
        open={!!editingDesc}
        onOpenChange={(open) => {
          if (!open) {
            setEditingDesc(null);
            setErrors({});
          }
        }}
        isEditing={true}
        value={editingDesc?.description_name || ''}
        onChange={(val) => {
          if (editingDesc) {
            setEditingDesc({ ...editingDesc, description_name: val });
            setErrors({});
          }
        }}
        onSubmit={handleEditSave}
        error={errors.description_name}
      />

      <DescriptionModal
        open={isAdding}
        onOpenChange={(open) => {
          setIsAdding(open);
          if (!open) setErrors({});
        }}
        isEditing={false}
        value={newName}
        onChange={(val) => {
          setNewName(val);
          setErrors({});
        }}
        onSubmit={handleAddSubmit}
        error={errors.description_name}
      />

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
