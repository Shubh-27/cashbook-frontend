import { useMemo } from 'react';
import { Copy, FileSpreadsheet, Pencil, Trash2 } from 'lucide-react';
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
  onDuplicate: (profile: ImportProfile) => void;
  onArchive: (profile: ImportProfile) => void;
}

const columnHelper = createColumnHelper<ImportProfile>();

export function ImportProfileList({ profiles, page, pageSize, total, onPageChange, hasSearch = false, onEdit, onDuplicate, onArchive }: ImportProfileListProps) {
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
        <Button variant="ghost" size="icon" onClick={() => onEdit(info.row.original)} aria-label="Edit profile" title="Edit profile" className="h-8 w-8 text-slate-400 hover:bg-teal-50 hover:text-teal-600"><Pencil className="h-4 w-4" /></Button>
        <Button variant="ghost" size="icon" onClick={() => onDuplicate(info.row.original)} aria-label="Duplicate profile" title="Duplicate profile" className="h-8 w-8 text-slate-400 hover:bg-teal-50 hover:text-teal-600"><Copy className="h-4 w-4" /></Button>
        <Button variant="ghost" size="icon" onClick={() => onArchive(info.row.original)} aria-label="Archive profile" title="Archive profile" className="h-8 w-8 text-slate-400 hover:bg-rose-50 hover:text-rose-600"><Trash2 className="h-4 w-4" /></Button>
      </div>,
    }),
  ], [page, pageSize, onEdit, onDuplicate, onArchive]);

  if (profiles.length === 0) {
    return <div className="flex flex-1 items-center justify-center rounded-2xl border border-slate-200 bg-white p-10 text-center shadow-sm">
      <div>
        <FileSpreadsheet className="mx-auto mb-2 h-10 w-10 text-slate-300" />
        <p className="text-sm font-semibold text-slate-700">{hasSearch ? 'No profiles found' : 'No import profiles yet'}</p>
        <p className="mt-1 text-xs text-slate-400">{hasSearch ? 'Try a different search term.' : 'Create one from a sample bank statement.'}</p>
      </div>
    </div>;
  }

  return <>
    <div className="flex flex-1 flex-col gap-3 md:hidden">
      {profiles.map(profile => <div key={profile.import_profile_sid} className="flex flex-col gap-3 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm">
        <div className="flex min-w-0 items-start gap-3">
          <div className="shrink-0 rounded-xl bg-teal-50 p-2.5 text-teal-600"><FileSpreadsheet className="h-5 w-5" /></div>
          <div className="min-w-0">
            <h2 className="truncate text-base font-bold text-slate-800">{profile.name}</h2>
            <p className="mt-0.5 text-xs text-slate-500">{profile.file_type.toUpperCase()} · {profile.worksheet_name || 'Default sheet'} · Header row {profile.header_row}</p>
          </div>
        </div>
        <div className="flex items-center justify-end gap-1 border-t border-slate-100 pt-2">
          <Button variant="ghost" size="sm" onClick={() => onEdit(profile)} className="h-8 rounded-lg px-2.5 text-xs text-slate-500 hover:bg-teal-50 hover:text-teal-600"><Pencil className="mr-1 h-3.5 w-3.5" />Edit</Button>
          <Button variant="ghost" size="sm" onClick={() => onDuplicate(profile)} className="h-8 rounded-lg px-2.5 text-xs text-slate-500 hover:bg-teal-50 hover:text-teal-600"><Copy className="mr-1 h-3.5 w-3.5" />Duplicate</Button>
          <Button variant="ghost" size="sm" onClick={() => onArchive(profile)} className="h-8 rounded-lg px-2.5 text-xs text-slate-500 hover:bg-rose-50 hover:text-rose-600"><Trash2 className="mr-1 h-3.5 w-3.5" />Archive</Button>
        </div>
      </div>)}
      <PaginationControls variant="mobile" page={page} pageSize={pageSize} total={total} onPageChange={onPageChange} className="mt-2" />
    </div>
    <DataTable<ImportProfile>
      data={profiles}
      columns={columns}
      colWidths={['w-[6%]', 'w-[34%]', 'w-[14%]', 'w-[22%]', 'w-[12%]', 'w-[12%]']}
      getRowId={profile => profile.import_profile_sid}
      emptyMessage="No import profiles found."
      footer={<PaginationControls variant="desktop" page={page} pageSize={pageSize} total={total} onPageChange={onPageChange} />}
    />
  </>;
}
