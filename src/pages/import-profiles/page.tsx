import { useCallback, useEffect, useState } from 'react';
import { Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { api } from '@/api';
import type { ImportProfile } from '@/types';
import { Button } from '@/components/ui/button';
import { SearchInput } from '@/components/common';
import { DeleteConfirmModal } from '@/components/DeleteConfirmModal';
import { ImportProfileList } from './components/ImportProfileList';
import { ROUTES } from '@/config/routes';
import { DEFAULT_PAGE_SIZE } from '@/config/constants';

export function ImportProfiles() {
  const [profiles, setProfiles] = useState<ImportProfile[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [deleteTarget, setDeleteTarget] = useState<ImportProfile | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const navigate = useNavigate();
  const pageSize = DEFAULT_PAGE_SIZE;

  const loadProfiles = useCallback(async () => {
    try {
      const result = await api.listImportProfiles({
        page,
        page_size: pageSize,
        search: search.trim() || undefined,
      });
      setProfiles(result.data);
      setTotalCount(result.total_count);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Unable to load import profiles.');
    }
  }, [page, pageSize, search]);

  useEffect(() => { loadProfiles(); }, [loadProfiles]);

  const openCreate = () => navigate(ROUTES.IMPORT_PROFILE_NEW);
  const openEdit = (profile: ImportProfile) => navigate(ROUTES.IMPORT_PROFILE_EDIT.replace(':profileSID', profile.import_profile_sid));

  const handleDeleteProfile = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      await api.deleteImportProfile(deleteTarget.import_profile_sid);
      toast.success(`${deleteTarget.name} was deleted.`);
      setDeleteTarget(null);
      await loadProfiles();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Unable to delete this profile.');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleSearchChange = (value: string) => {
    setSearch(value);
    setPage(1);
  };

  return <div className="flex flex-1 min-h-0 flex-col gap-3 animate-in fade-in duration-300 md:h-full md:gap-6">
    <div className="flex shrink-0 flex-col justify-between gap-3 sm:flex-row sm:items-center">
      <div className="hidden md:block">
        <h1 className="text-xl font-bold text-slate-800 md:text-2xl">Import Profiles</h1>
        <p className="mt-0.5 text-xs text-slate-500 md:text-sm">Create reusable rules from sample bank statements, then use them from Transactions.</p>
      </div>
      <div className="flex w-full items-center gap-2.5 sm:w-auto">
        <SearchInput
          value={search}
          onChange={handleSearchChange}
          placeholder="Search..."
          className="flex-1 sm:w-64 sm:flex-none"
        />
        <Button className="h-10 shrink-0 rounded-xl bg-teal-600 px-3 font-medium text-white hover:bg-teal-700 sm:h-9 sm:px-3.5" onClick={openCreate} aria-label="Create profile" title="Create import profile">
          <Plus className="h-4 w-4 sm:mr-1.5" />
          <span className="hidden sm:inline">Create Profile</span>
        </Button>
      </div>
    </div>
    <ImportProfileList profiles={profiles} page={page} pageSize={pageSize} total={totalCount} onPageChange={setPage} hasSearch={Boolean(search.trim())} onEdit={openEdit} onDelete={setDeleteTarget} />

    <DeleteConfirmModal
      open={Boolean(deleteTarget)}
      onOpenChange={open => !open && setDeleteTarget(null)}
      onConfirm={handleDeleteProfile}
      title="Delete Import Profile"
      description={`Are you sure you want to delete "${deleteTarget?.name ?? ''}"? Past imported transactions will not be affected.`}
      isDeleting={isDeleting}
    />
  </div>;
}

export default ImportProfiles;
