import { useRef } from 'react';
import { Upload } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface SpreadsheetToolbarProps {
  profileName: string;
  onProfileNameChange: (profileName: string) => void;
  onProfileNameBlur?: () => void;
  profileNameInputRef?: React.RefObject<HTMLInputElement | null>;
  sampleFileInputRef?: React.RefObject<HTMLInputElement | null>;
  selectedFileName?: string;
  onFileSelected: (file: File | null) => void;
  sheets: string[];
  selectedSheet: string;
  onSelectedSheetChange: (sheet: string) => void;
  fileRequired?: boolean;
}

export function SpreadsheetToolbar({
  profileName,
  onProfileNameChange,
  onProfileNameBlur,
  profileNameInputRef,
  sampleFileInputRef,
  selectedFileName,
  onFileSelected,
  sheets,
  selectedSheet,
  onSelectedSheetChange,
  fileRequired = true,
}: SpreadsheetToolbarProps) {
  const internalFileInputRef = useRef<HTMLInputElement>(null);
  const resolvedFileInputRef = sampleFileInputRef ?? internalFileInputRef;
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm" aria-label="Profile editor toolbar">
      <div className="grid gap-4 md:grid-cols-3 md:items-end">
        <div className="space-y-1.5">
          <div className="flex items-center gap-1">
            <Label htmlFor="profile-name" className="text-xs font-semibold text-slate-600">Profile name</Label>
            <span aria-hidden="true" className="text-xs text-rose-600">*</span>
          </div>
          <Input
            ref={profileNameInputRef}
            id="profile-name"
            value={profileName}
            onChange={event => onProfileNameChange(event.target.value)}
            onBlur={onProfileNameBlur}
            placeholder="e.g. Axis Bank XLS"
            className="h-10 rounded-xl border-slate-200 bg-white text-sm shadow-xs"
          />
        </div>
        <div className="space-y-1.5">
          <div className="flex items-center gap-1">
            <Label htmlFor="sample-file" className="text-xs font-semibold text-slate-600">Sample statement</Label>
            {fileRequired && <span aria-hidden="true" className="text-xs text-rose-600">*</span>}
          </div>
          <Input
            ref={resolvedFileInputRef}
            id="sample-file"
            type="file"
            accept=".csv,.xls,.xlsx"
            onChange={event => {
              onFileSelected(event.target.files?.[0] ?? null);
              event.target.value = '';
            }}
            className="sr-only"
          />
          <div className="flex h-10 items-center overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xs">
            {selectedFileName ? (
              <>
                <button
                  type="button"
                  className="inline-flex h-full shrink-0 cursor-pointer items-center gap-1.5 border-r border-slate-200 bg-slate-50 px-3 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-100 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-teal-500"
                  onClick={() => resolvedFileInputRef.current?.click()}
                >
                  <Upload className="h-3.5 w-3.5 text-slate-500" />
                  Replace file
                </button>
                <span className="min-w-0 flex-1 truncate px-3 text-sm text-slate-700" title={selectedFileName}>
                  {selectedFileName}
                </span>
              </>
            ) : (
              <span className="min-w-0 truncate px-3 text-sm text-muted-foreground">
                {fileRequired ? 'No file selected' : 'Optional'}
              </span>
            )}
          </div>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="sheet" className="text-xs font-semibold text-slate-600">
            Worksheet
          </Label>
          {sheets.length === 1 ? (
            <div
              id="sheet"
              className="flex h-10 w-full items-center rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm text-slate-700"
            >
              {sheets[0]}
            </div>
          ) : (
            <Select
              value={selectedSheet || undefined}
              disabled={sheets.length === 0}
              onValueChange={onSelectedSheetChange}
            >
              <SelectTrigger
                id="sheet"
                aria-label="Worksheet"
                className="h-10 w-full rounded-xl border-slate-200 bg-white text-sm shadow-xs disabled:bg-slate-50"
              >
                <SelectValue placeholder={sheets.length === 0 ? 'Select file first' : 'Select worksheet'} />
              </SelectTrigger>
              <SelectContent className="rounded-xl">
                {sheets.map(sheet => (
                  <SelectItem key={sheet} value={sheet}>{sheet}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
      </div>
    </section>
  );
}
