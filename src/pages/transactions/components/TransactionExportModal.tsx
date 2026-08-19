import type { Account } from '@/types';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';

export interface TransactionExportModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  exportType: 'excel' | 'csv';
  onExportTypeChange: (type: 'excel' | 'csv') => void;
  excelName: string;
  onExcelNameChange: (name: string) => void;
  separateSheets: boolean;
  onSeparateSheetsChange: (val: boolean) => void;
  mergeAccounts: boolean;
  onMergeAccountsChange: (val: boolean) => void;
  mergeDescriptions: boolean;
  onMergeDescriptionsChange: (val: boolean) => void;
  selectedAccountSids: string[];
  accounts: Account[];
  isExporting: boolean;
  onExport: () => void;
}

export function TransactionExportModal({
  open,
  onOpenChange,
  exportType,
  onExportTypeChange,
  excelName,
  onExcelNameChange,
  separateSheets,
  onSeparateSheetsChange,
  mergeAccounts,
  onMergeAccountsChange,
  mergeDescriptions,
  onMergeDescriptionsChange,
  selectedAccountSids,
  accounts,
  isExporting,
  onExport,
}: TransactionExportModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] sm:max-w-md max-h-[92vh] overflow-y-auto rounded-3xl p-5 sm:p-6 shadow-2xl border border-slate-200/80 bg-white">
        <DialogHeader>
          <DialogTitle className="text-lg md:text-xl font-bold text-slate-900">Export Transactions</DialogTitle>
          <DialogDescription className="text-xs md:text-sm text-slate-500">
            Download your transactions to Excel (.xlsx) or CSV.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4 py-2">
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-slate-600">Export Format</Label>
            <Select value={exportType} onValueChange={onExportTypeChange}>
              <SelectTrigger className="w-full h-11 rounded-xl bg-white border-slate-200">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="rounded-xl">
                <SelectItem value="excel">Excel (.xlsx)</SelectItem>
                <SelectItem value="csv">CSV (.csv)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-slate-600">File Name (Optional)</Label>
            <Input
              placeholder="e.g. My_Cashbook_Export"
              value={excelName}
              onChange={(e) => onExcelNameChange(e.target.value)}
              className="h-11 rounded-xl bg-white border-slate-200 text-sm"
            />
          </div>

          {exportType === 'excel' && (
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-slate-600">Sheet Layout</Label>
              <div role="radiogroup" aria-label="Sheet Layout" className="flex rounded-xl overflow-hidden border border-slate-200 p-1 bg-slate-100/70 h-11">
                <button
                  type="button"
                  role="radio"
                  aria-checked={separateSheets}
                  onClick={() => onSeparateSheetsChange(true)}
                  className={`flex-1 text-sm font-semibold rounded-lg transition-all outline-none ${separateSheets ? 'bg-white shadow-sm text-teal-700 border border-slate-200/50' : 'text-slate-500 hover:text-slate-700'}`}
                >
                  Separate Sheets
                </button>
                <button
                  type="button"
                  role="radio"
                  aria-checked={!separateSheets}
                  onClick={() => onSeparateSheetsChange(false)}
                  className={`flex-1 text-sm font-semibold rounded-lg transition-all outline-none ${!separateSheets ? 'bg-white shadow-sm text-teal-700 border border-slate-200/50' : 'text-slate-500 hover:text-slate-700'}`}
                >
                  Single Sheet
                </button>
              </div>
              <p className="text-[11px] text-slate-500 px-1 mt-0.5">
                {separateSheets 
                  ? "Groups accounts and descriptions into individual sheets." 
                  : "Combines everything into one continuous sheet with separate tables."}
              </p>
            </div>
          )}
          {exportType === 'excel' && separateSheets && (
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-slate-600">Description Grouping</Label>
              <div role="radiogroup" aria-label="Description Grouping" className="flex rounded-xl overflow-hidden border border-slate-200 p-1 bg-slate-100/70 h-11">
                <button
                  type="button"
                  role="radio"
                  aria-checked={!mergeDescriptions}
                  onClick={() => onMergeDescriptionsChange(false)}
                  className={`flex-1 text-sm font-semibold rounded-lg transition-all outline-none ${!mergeDescriptions ? 'bg-white shadow-sm text-teal-700 border border-slate-200/50' : 'text-slate-500 hover:text-slate-700'}`}
                >
                  Separate Sheet
                </button>
                <button
                  type="button"
                  role="radio"
                  aria-checked={mergeDescriptions}
                  onClick={() => onMergeDescriptionsChange(true)}
                  className={`flex-1 text-sm font-semibold rounded-lg transition-all outline-none ${mergeDescriptions ? 'bg-white shadow-sm text-teal-700 border border-slate-200/50' : 'text-slate-500 hover:text-slate-700'}`}
                >
                  Merge Sheet
                </button>
              </div>
              <p className="text-[11px] text-slate-500 px-1 mt-0.5">
                {mergeDescriptions
                  ? 'All descriptions combined into a single "Descriptions" sheet.'
                  : 'Each description gets its own individual sheet.'}
              </p>
            </div>
          )}
          {exportType === 'csv' && (
            <p className="text-xs text-amber-800 bg-amber-50 p-3 rounded-xl border border-amber-200/80">
              CSV formatting does not support multi-sheet grouping. Data will be exported as a clean single sheet.
            </p>
          )}
          {exportType === 'excel' && selectedAccountSids.length > 1 && (
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-slate-600">Account Grouping</Label>
              <div role="radiogroup" aria-label="Account Grouping" className="flex rounded-xl overflow-hidden border border-slate-200 p-1 bg-slate-100/70 h-11">
                <button
                  type="button"
                  role="radio"
                  aria-checked={mergeAccounts}
                  onClick={() => onMergeAccountsChange(true)}
                  className={`flex-1 text-sm font-semibold rounded-lg transition-all outline-none ${mergeAccounts ? 'bg-white shadow-sm text-teal-700 border border-slate-200/50' : 'text-slate-500 hover:text-slate-700'}`}
                >
                  Single File
                </button>
                <button
                  type="button"
                  role="radio"
                  aria-checked={!mergeAccounts}
                  onClick={() => onMergeAccountsChange(false)}
                  className={`flex-1 text-sm font-semibold rounded-lg transition-all outline-none ${!mergeAccounts ? 'bg-white shadow-sm text-teal-700 border border-slate-200/50' : 'text-slate-500 hover:text-slate-700'}`}
                >
                  ZIP (Per Account)
                </button>
              </div>
            </div>
          )}
          {selectedAccountSids.length > 0 ? (
            <div className="bg-teal-50/70 p-3 rounded-xl border border-teal-100 space-y-1">
              <p className="text-xs text-teal-800 font-semibold">
                {selectedAccountSids.length} account{selectedAccountSids.length > 1 ? 's' : ''} selected:
              </p>
              <p className="text-[11px] text-teal-700 truncate">
                {accounts.filter(a => selectedAccountSids.includes(a.account_sid)).map(a => `${a.account_name} (${a.account_number || 'N/A'})`).join(', ')}
              </p>
            </div>
          ) : (
            exportType === 'excel' && (
              <p className="text-xs text-teal-700 bg-teal-50/70 p-3 rounded-xl border border-teal-100 font-medium">
                Note: All accounts will be exported.
              </p>
            )
          )}
        </div>

        <DialogFooter className="flex flex-row items-center justify-end gap-2 pt-3 border-t mt-1">
          <Button variant="ghost" onClick={() => onOpenChange(false)} className="rounded-xl flex-1 sm:flex-none">
            Cancel
          </Button>
          <Button
            onClick={onExport}
            disabled={isExporting}
            className="bg-teal-600 hover:bg-teal-700 text-white rounded-xl flex-1 sm:flex-none font-semibold shadow-sm"
          >
            {isExporting ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Exporting...
              </>
            ) : (
              exportType === 'excel' && selectedAccountSids.length > 1 && !mergeAccounts
                ? 'Download ZIP'
                : 'Download File'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
