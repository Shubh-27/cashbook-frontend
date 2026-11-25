import { useEffect, useMemo, useState } from 'react';
import { FileSpreadsheet, Loader2, RotateCcw, Upload } from 'lucide-react';
import { toast } from 'sonner';
import { api } from '@/services/api';
import { statementDateFormats } from '@/lib/statement-import';
import type { Account, ImportProfile, StatementColumnMapping, StatementImportAnalysis, StatementImportRow } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';

type Props = { open: boolean; onOpenChange: (open: boolean) => void; accounts: Account[]; onComplete: () => void };
const mappingFields: Array<[keyof StatementColumnMapping, string, boolean]> = [
  ['date', 'Transaction date', true], ['description', 'Description / narration', true], ['debit', 'Debit / withdrawal', false], ['credit', 'Credit / deposit', false], ['amount', 'Signed amount', false], ['balance', 'Balance', false], ['notes', 'Notes', false],
];

export function StatementImportWizard({ open, onOpenChange, accounts, onComplete }: Props) {
  const [file, setFile] = useState<File | null>(null);
  const [analysis, setAnalysis] = useState<StatementImportAnalysis | null>(null);
  const [profiles, setProfiles] = useState<ImportProfile[]>([]);
  const [profileSID, setProfileSID] = useState('');
  const [accountSID, setAccountSID] = useState('');
  const [dateFormat, setDateFormat] = useState('');
  const [mapping, setMapping] = useState<StatementColumnMapping>({});
  const [rows, setRows] = useState<StatementImportRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<1 | 2 | 3>(1);

  useEffect(() => { if (open) api.getImportProfiles().then(setProfiles).catch(() => toast.error('Could not load import profiles.')); }, [open]);
  useEffect(() => { if (accounts.length === 1 && !accountSID) setAccountSID(accounts[0].account_sid); }, [accounts, accountSID]);
  const counts = useMemo(() => ({ ready: rows.filter(row => row.include && row.issues.length === 0).length, invalid: rows.filter(row => row.include && row.issues.length > 0).length, excluded: rows.filter(row => !row.include).length, selected: rows.filter(row => row.include).length }), [rows]);

  const reset = () => { setFile(null); setAnalysis(null); setRows([]); setMapping({}); setProfileSID(''); setDateFormat(''); setStep(1); };
  const close = (value: boolean) => { if (!value) reset(); onOpenChange(value); };
  const analyze = async (overrides: Partial<{ sheetName: string; headerRow: number; profileSID: string; dateFormat: string; mapping: StatementColumnMapping }> = {}) => {
    if (!file) return;
    setLoading(true);
    try {
      const result = await api.analyzeStatement(file, { sheetName: overrides.sheetName ?? analysis?.selected_sheet, headerRow: overrides.headerRow ?? analysis?.header_row, transactionEndRow: analysis?.transaction_end_row ?? undefined, profileSID: (overrides.profileSID ?? profileSID) || undefined, dateFormat: (overrides.dateFormat ?? dateFormat) || undefined, mapping: overrides.mapping ?? (Object.keys(mapping).length ? mapping : undefined), accountSID });
      setAnalysis(result); setRows(result.rows); setMapping(result.mapping); setDateFormat(result.date_format ?? dateFormat); setProfileSID(result.suggested_profile_sid ?? profileSID); setStep(2);
    } catch (error) { toast.error(error instanceof Error ? error.message : 'Unable to read this statement.'); }
    finally { setLoading(false); }
  };
  const updateRow = (index: number, field: keyof StatementImportRow, value: string | boolean) => setRows(current => current.map((row, i) => {
    if (i !== index) return row;
    const next = { ...row, [field]: field === 'debit' || field === 'credit' || field === 'balance' ? (value === '' ? null : Number(value)) : value } as StatementImportRow;
    const issues: string[] = [];
    if (!next.transaction_date) issues.push('Transaction date is required.');
    if (!next.description?.trim()) issues.push('Description is required.');
    if ((next.debit ?? 0) <= 0 && (next.credit ?? 0) <= 0) issues.push('A debit or credit amount is required.');
    if ((next.debit ?? 0) > 0 && (next.credit ?? 0) > 0) issues.push('A row cannot contain both debit and credit.');
    return { ...next, issues, status: issues.length ? 'invalid' : 'new', include: field === 'include' ? Boolean(value) : issues.length === 0 ? next.include : false };
  }));
  const commit = async () => {
    if (!analysis || !accountSID) { toast.error('Select the CashBook account that receives these transactions.'); return; }
    if (!dateFormat) { toast.error('Select the statement date format before importing.'); return; }
    if (counts.invalid > 0) { toast.error('Fix or exclude invalid rows before importing.'); return; }
    setLoading(true);
    try {
      const result = await api.commitStatementImport({ account_sid: accountSID, file_name: analysis.file_name, file_type: analysis.file_type, file_hash: analysis.file_hash, profile_sid: profileSID || null, metadata: analysis.metadata, rows });
      toast.success(`${result.imported_rows} transactions imported${result.skipped_duplicate_rows ? `; ${result.skipped_duplicate_rows} duplicates skipped` : ''}.`);
      close(false); onComplete();
    } catch (error) { toast.error(error instanceof Error ? error.message : 'Import failed. No transactions were changed.'); }
    finally { setLoading(false); }
  };

  return <Dialog open={open} onOpenChange={close}>
    <DialogContent className="max-w-6xl max-h-[92vh] overflow-y-auto rounded-3xl">
      <DialogHeader><DialogTitle className="flex items-center gap-2"><FileSpreadsheet className="w-5 h-5 text-teal-600" />Import bank statement</DialogTitle><DialogDescription>Upload, map, review, then import. Your source file is processed locally and is not saved.</DialogDescription></DialogHeader>
      <div className="flex items-center gap-2 text-xs font-semibold text-slate-500"><span className={step >= 1 ? 'text-teal-700' : ''}>1 Upload</span><span>→</span><span className={step >= 2 ? 'text-teal-700' : ''}>2 Detect & map</span><span>→</span><span className={step >= 3 ? 'text-teal-700' : ''}>3 Review</span></div>
      {step === 1 && <div className="space-y-5 py-3"><div><Label htmlFor="statement-file">Statement file</Label><Input id="statement-file" type="file" accept=".csv,.xls,.xlsx" onChange={e => { const next = e.target.files?.[0] ?? null; setFile(next); setAnalysis(null); setMapping({}); setDateFormat(''); }} className="mt-2" /><p className="mt-1 text-xs text-slate-500">CSV, XLS, and XLSX files are supported.</p></div><div><Label htmlFor="import-account">CashBook account *</Label><select id="import-account" value={accountSID} onChange={e => setAccountSID(e.target.value)} className="mt-2 w-full h-10 rounded-xl border border-slate-200 px-3 text-sm"><option value="">Choose account for duplicate checks</option>{accounts.map(account => <option key={account.account_sid} value={account.account_sid}>{account.account_name} {account.bank_name ? `(${account.bank_name})` : ''}</option>)}</select></div><div><Label htmlFor="profile">Import profile *</Label><select id="profile" value={profileSID} onChange={e => { setProfileSID(e.target.value); setMapping({}); setDateFormat(''); }} className="mt-2 w-full h-10 rounded-xl border border-slate-200 px-3 text-sm"><option value="">Choose a saved profile</option>{profiles.map(p => <option key={p.import_profile_sid} value={p.import_profile_sid}>{p.name}</option>)}</select><p className="mt-1 text-xs text-slate-500">Create a new layout from Import Profiles before importing transactions.</p></div><Button disabled={!file || !accountSID || !profileSID || loading} onClick={() => analyze()} className="bg-teal-600 hover:bg-teal-700 rounded-xl">{loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Upload className="w-4 h-4 mr-2" />}Analyze statement</Button></div>}
      {analysis && step >= 2 && <div className="space-y-5 py-2"><div className="grid md:grid-cols-3 gap-3"><div><Label>Sheet</Label><select value={analysis.selected_sheet} onChange={e => analyze({ sheetName: e.target.value, headerRow: 1 })} className="mt-1 w-full h-10 rounded-xl border border-slate-200 px-3 text-sm">{analysis.sheets.map(sheet => <option key={sheet}>{sheet}</option>)}</select></div><div><Label>Transaction header row</Label><select value={analysis.header_row} onChange={e => analyze({ headerRow: Number(e.target.value) })} className="mt-1 w-full h-10 rounded-xl border border-slate-200 px-3 text-sm">{analysis.header_candidates.map(candidate => <option key={candidate.row_number} value={candidate.row_number}>Row {candidate.row_number} — {candidate.values.filter(Boolean).slice(0, 3).join(' · ')}</option>)}</select></div><div><Label>Date appearance in statement</Label><select value={dateFormat} onChange={e => { setDateFormat(e.target.value); }} className="mt-1 w-full h-10 rounded-xl border border-slate-200 px-3 text-sm"><option value="">Choose date appearance</option>{statementDateFormats.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}</select></div></div><p className="text-xs text-slate-500">This profile stops after row {analysis.transaction_end_row ?? 'the detected transaction block'}.</p>
        <div className="rounded-2xl border border-slate-200 p-4"><div className="font-semibold text-sm text-slate-800 mb-3">Column mapping</div><div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">{mappingFields.map(([field, label, required]) => <div key={field}><Label className="text-xs">{label}{required ? ' *' : ''}</Label><select value={mapping[field] ?? ''} onChange={e => setMapping(current => ({ ...current, [field]: e.target.value || null }))} className="mt-1 w-full h-9 rounded-lg border border-slate-200 px-2 text-sm"><option value="">Not mapped</option>{analysis.headers.map(header => <option key={header} value={header}>{header}</option>)}</select></div>)}</div><Button variant="outline" size="sm" onClick={() => analyze({ mapping, dateFormat })} disabled={loading} className="mt-4 rounded-xl"><RotateCcw className="w-3.5 h-3.5 mr-2" />Refresh preview</Button></div>
        {Object.keys(analysis.metadata).length > 0 && <details className="rounded-xl bg-slate-50 p-3 text-xs text-slate-500"><summary className="cursor-pointer font-medium text-slate-700">Statement details (contains personal data)</summary><p className="mt-2">{Object.entries(analysis.metadata).map(([key, value]) => `${key}: ${value}`).join(' · ')}</p></details>}
        <div className="flex justify-between items-center"><p className="text-sm text-slate-600">{rows.length} rows found. <span className="text-emerald-700">{counts.ready} ready</span>{counts.excluded > 0 && <> · <span className="text-slate-500">{counts.excluded} excluded</span></>}</p><Button onClick={() => setStep(3)} disabled={!dateFormat} className="bg-teal-600 hover:bg-teal-700 rounded-xl">Review import</Button></div></div>}
      {analysis && step === 3 && <div className="space-y-4 py-2"><div className="flex justify-between items-center"><p className="text-sm text-slate-600">Select an account and correct or exclude any invalid rows.</p><Button variant="outline" onClick={() => setStep(2)} className="rounded-xl">Back to mapping</Button></div><div><Label>CashBook account *</Label><select value={accountSID} onChange={e => setAccountSID(e.target.value)} className="mt-1 w-full h-10 rounded-xl border border-slate-200 px-3 text-sm"><option value="">Choose account</option>{accounts.map(account => <option key={account.account_sid} value={account.account_sid}>{account.account_name} {account.bank_name ? `(${account.bank_name})` : ''}</option>)}</select></div>
        <div className="border rounded-2xl overflow-x-auto max-h-[360px]"><table className="w-full text-xs"><thead className="sticky top-0 bg-slate-50 text-slate-500"><tr><th className="p-2 text-left">Import</th><th className="p-2 text-left">Date</th><th className="p-2 text-left">Description</th><th className="p-2 text-left">Debit</th><th className="p-2 text-left">Credit</th><th className="p-2 text-left">Issues</th></tr></thead><tbody>{rows.map((row, index) => <tr key={row.row_number} className={row.issues.length ? 'bg-rose-50/50' : 'border-t border-slate-100'}><td className="p-2"><Checkbox checked={row.include} onCheckedChange={checked => updateRow(index, 'include', checked === true)} /></td><td className="p-2"><Input value={row.transaction_date?.slice(0, 10) ?? ''} onChange={e => updateRow(index, 'transaction_date', e.target.value ? `${e.target.value}T00:00:00.000Z` : '')} type="date" className="h-8 min-w-32" /></td><td className="p-2"><Input value={row.description ?? ''} onChange={e => updateRow(index, 'description', e.target.value)} className="h-8 min-w-44" /></td><td className="p-2"><Input value={row.debit ?? ''} onChange={e => updateRow(index, 'debit', e.target.value)} type="number" min="0" className="h-8 min-w-24" /></td><td className="p-2"><Input value={row.credit ?? ''} onChange={e => updateRow(index, 'credit', e.target.value)} type="number" min="0" className="h-8 min-w-24" /></td><td className="p-2 text-rose-700">{row.issues.join(' ')}</td></tr>)}</tbody></table></div><div className="flex items-center justify-between bg-slate-50 rounded-2xl p-4"><div className="text-sm"><strong>{counts.selected}</strong> selected{counts.invalid > 0 && <> · <strong>{counts.invalid}</strong> need attention</>}</div><Button onClick={commit} disabled={loading || !accountSID || counts.invalid > 0 || counts.selected === 0} className="bg-teal-600 hover:bg-teal-700 rounded-xl">{loading && <Loader2 className="w-4 h-4 animate-spin mr-2" />}Import transactions</Button></div></div>}
    </DialogContent>
  </Dialog>;
}
