import { useMemo } from 'react';
import { FileSpreadsheet, Pencil, Trash2 } from 'lucide-react';
import { createColumnHelper } from '@tanstack/react-table';
import type { ImportProfile } from '@/types';
import { Button } from '@/components/ui/button';
import { DataTable, PaginationControls } from '@/components/common';

interface ImportProfileListProps {
  profiles: ImportProfile[];
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (page: number) => void;
  hasSearch?: boolean;
  onEdit: (profile: ImportProfile) => void;
  onDelete: (profile: ImportProfile) => void;
}

const columnHelper = createColumnHelper<ImportProfile>();

export function ImportProfileList({ profiles, page, pageSize, total, onPageChange, hasSearch = false, onEdit, onDelete }: ImportProfileListProps) {
  const columns = useMemo(() => [
    columnHelper.display({
      id: 'sr',
      header: 'SR',
      cell: info => <span className="font-medium text-slate-400">{(page - 1) * pageSize + info.row.index + 1}</span>,
    }),
    columnHelper.accessor('name', {
      header: 'NAME',
      cell: info => <div className="flex min-w-0 items-center gap-2 font-semibold text-slate-800"><FileSpreadsheet className="h-4 w-4 shrink-0 text-slate-400" /><span className="truncate">{info.getValue()}</span></div>,
    }),
    columnHelper.accessor('file_type', {
      header: 'FILE TYPE',
      cell: info => <span className="text-slate-600">{info.getValue().toUpperCase()}</span>,
    }),
    columnHelper.accessor('worksheet_name', {
      header: 'WORKSHEET',
      cell: info => <span className="text-slate-600">{info.getValue() || 'Default sheet'}</span>,
    }),
    columnHelper.accessor('header_row', {
      header: 'HEADER ROW',
      cell: info => <span className="text-slate-600">{info.getValue()}</span>,
    }),
    columnHelper.display({
      id: 'actions',
      header: () => <div className="text-right">ACTIONS</div>,
      cell: info => <div className="flex items-center gap-1">
        <Button variant="ghost" size="icon" onClick={() => onEdit(info.row.original)} aria-label="Edit profile" title="Edit profile" className="h-8 w-8 rounded-lg text-slate-400 transition-colors hover:bg-teal-100/70 hover:text-teal-600"><Pencil className="h-4 w-4" /></Button>
        <Button variant="ghost" size="icon" onClick={() => onDelete(info.row.original)} aria-label="Delete profile" title="Delete profile" className="h-8 w-8 rounded-lg text-slate-400 transition-colors hover:bg-rose-50 hover:text-rose-600"><Trash2 className="h-4 w-4" /></Button>
      </div>,
    }),
  ], [page, pageSize, onEdit, onDelete]);

  return <>
    <div className="flex flex-1 flex-col gap-3 md:hidden">
      {profiles.length === 0 ? (
        <div className="py-12 px-4 text-center bg-white rounded-2xl border border-slate-200/80 shadow-sm">
          <FileSpreadsheet className="mx-auto mb-2 h-10 w-10 text-slate-300" />
          <p className="text-sm font-semibold text-slate-700">{hasSearch ? 'No profiles found' : 'No import profiles yet'}</p>
          <p className="mt-1 text-xs text-slate-400">{hasSearch ? 'Try a different search term.' : 'Tap "+" to create your first profile.'}</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {profiles.map(profile => (
            <div key={profile.import_profile_sid} className="bg-white rounded-2xl px-4 pt-4 pb-2.5 border border-slate-200/80 shadow-sm flex flex-col gap-3">
              <div className="flex items-start justify-between gap-3">
                <div className="flex min-w-0 items-center gap-3">
                  <div className="shrink-0 rounded-xl bg-teal-50 p-2.5 text-teal-600">
                    <FileSpreadsheet className="h-5 w-5" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="truncate text-base font-bold text-slate-800">{profile.name}</h3>
                    <div className="mt-0.5 flex flex-wrap items-center gap-2">
                      <span className="text-[11px] font-semibold uppercase tracking-wider bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md">
                        {profile.file_type}
                      </span>
                      <span className="truncate text-xs text-slate-500">
                        {profile.worksheet_name || 'Default sheet'} · Header {profile.header_row}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-end gap-1 border-t border-slate-100 pt-2">
                <Button variant="ghost" size="sm" onClick={() => onEdit(profile)} aria-label="Edit profile" className="h-8 rounded-lg px-2.5 text-xs text-slate-500 hover:bg-teal-100/70 hover:text-teal-600">
                  <Pencil className="mr-1 h-3.5 w-3.5" />Edit
                </Button>
                <Button variant="ghost" size="sm" onClick={() => onDelete(profile)} aria-label="Delete profile" className="h-8 rounded-lg px-2.5 text-xs text-slate-500 hover:bg-rose-50 hover:text-rose-600">
                  <Trash2 className="mr-1 h-3.5 w-3.5" />Delete
                </Button>
              </div>
            </div>
          ))}
          <PaginationControls variant="mobile" page={page} pageSize={pageSize} total={total} onPageChange={onPageChange} />
        </div>
      )}
    </div>
    <DataTable<ImportProfile>
      data={profiles}
      columns={columns}
      colWidths={['w-[6%]', 'w-[34%]', 'w-[14%]', 'w-[22%]', 'w-[12%]', 'w-[12%]']}
      getRowId={profile => profile.import_profile_sid}
      emptyMessage={hasSearch ? 'No import profiles found.' : 'No import profiles found. Click "Create Profile" to add one.'}
      footer={<PaginationControls variant="desktop" page={page} pageSize={pageSize} total={total} onPageChange={onPageChange} />}
    />
  </>;
}
