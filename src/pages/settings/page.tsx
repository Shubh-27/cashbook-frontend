import React, { useState } from 'react';
import { Download, Upload, Database, AlertTriangle } from 'lucide-react';
import { api } from '../../api';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../../components/ui/dialog';

export function SettingsPage() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [showConfirmRestore, setShowConfirmRestore] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const handleExport = async () => {
    setIsExporting(true);
    setMessage(null);
    try {
      await api.exportDatabase();
      setMessage({ text: 'Database exported successfully.', type: 'success' });
    } catch (error) {
      console.error('Export failed:', error);
      setMessage({ text: 'Failed to export database.', type: 'error' });
    } finally {
      setIsExporting(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (!file.name.endsWith('.db')) {
        setMessage({ text: 'Please select a valid .db file.', type: 'error' });
        setSelectedFile(null);
        return;
      }
      setSelectedFile(file);
      setMessage(null);
    }
  };

  const handleImportClick = () => {
    if (!selectedFile) return;
    setShowConfirmRestore(true);
  };

  const handleConfirmRestore = async () => {
    if (!selectedFile) return;
    setIsImporting(true);
    setShowConfirmRestore(false);
    setMessage(null);
    try {
      await api.importDatabase(selectedFile);
      setMessage({ text: 'Database restored successfully! The application will refresh.', type: 'success' });
      // Refresh the page after a brief delay to reload data
      setTimeout(() => {
        window.location.reload();
      }, 2000);
    } catch (error: any) {
      console.error('Import failed:', error);
      setMessage({ text: error.message || 'Failed to restore database.', type: 'error' });
    } finally {
      setIsImporting(false);
      setSelectedFile(null);
    }
  };

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold text-slate-900 mb-8 tracking-tight">Settings</h1>

      <div className="grid gap-8">
        <section className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-teal-50 rounded-xl border border-teal-100">
              <Database className="w-6 h-6 text-teal-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-slate-900">Database Management</h2>
              <p className="text-slate-500 text-sm">Backup and restore your financial data.</p>
            </div>
          </div>

          <div className="space-y-8">
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between p-5 bg-slate-50 rounded-2xl border border-slate-100 transition-all hover:bg-slate-100/50">
                <div>
                  <h3 className="font-semibold text-slate-900">Export Database</h3>
                  <p className="text-slate-500 text-sm">Download a copy of your current database.</p>
                </div>
                <Button 
                  onClick={handleExport} 
                  disabled={isExporting}
                  className="bg-teal-600 hover:bg-teal-700 text-white rounded-xl px-6 shadow-sm"
                >
                  <Download className="w-4 h-4 mr-2" />
                  {isExporting ? 'Exporting...' : 'Export DB'}
                </Button>
              </div>

              <div className="flex flex-col gap-4 p-5 bg-slate-50 rounded-2xl border border-slate-100">
                <div>
                  <h3 className="font-semibold text-slate-900">Import Database</h3>
                  <p className="text-slate-500 text-sm">Restore data from a previously exported .db file.</p>
                </div>
                
                <div className="grid gap-4 sm:flex sm:items-end">
                  <div className="flex-1">
                    <Label htmlFor="db-file" className="mb-2 block text-sm font-semibold text-slate-700">
                      Select Backup File (.db)
                    </Label>
                    <Input 
                      id="db-file" 
                      type="file" 
                      accept=".db"
                      onChange={handleFileChange}
                      className="rounded-xl border-slate-200 cursor-pointer bg-white file:bg-slate-50 file:text-teal-700 file:font-semibold"
                    />
                  </div>
                  <Button 
                    onClick={handleImportClick} 
                    disabled={!selectedFile || isImporting}
                    variant="destructive"
                    className="rounded-xl px-6 shadow-sm"
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    {isImporting ? 'Importing...' : 'Restore DB'}
                  </Button>
                </div>
                
                <div className="flex items-start gap-3 text-amber-600 bg-amber-50/50 p-4 rounded-xl border border-amber-100 text-sm">
                  <AlertTriangle className="w-5 h-5 flex-shrink-0" />
                  <div>
                    <span className="font-bold block mb-1">Warning: Destruction Action</span>
                    <p>Restoring a database will completely overwrite your current data. We recommend exporting your current data first.</p>
                  </div>
                </div>
              </div>
            </div>

            {message && (
              <div className={`p-4 rounded-xl border flex items-center gap-3 animate-in fade-in slide-in-from-top-2 duration-300 ${
                message.type === 'success' 
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-100' 
                  : 'bg-red-50 text-red-700 border-red-100'
              }`}>
                <div className={`w-2 h-2 rounded-full ${message.type === 'success' ? 'bg-emerald-500' : 'bg-red-500'}`} />
                <p className="font-medium">{message.text}</p>
              </div>
            )}
          </div>
        </section>
      </div>

      <Dialog open={showConfirmRestore} onOpenChange={setShowConfirmRestore}>
        <DialogContent className="rounded-2xl sm:max-w-md border-none shadow-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600 text-xl font-bold">
              <AlertTriangle className="w-6 h-6" />
              Confirm Database Restore
            </DialogTitle>
            <DialogDescription className="pt-4 text-slate-600 space-y-3 block">
              <p>Are you sure you want to restore the database from:</p>
              <div className="bg-slate-100 p-3 rounded-xl font-mono text-sm break-all font-semibold text-slate-900 border border-slate-200">
                {selectedFile?.name}
              </div>
              <p className="text-sm font-medium">This will completely replace all transactions, accounts, and descriptions. <span className="text-red-600 font-bold">This cannot be undone.</span></p>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-3 mt-6">
            <Button
              variant="outline"
              onClick={() => setShowConfirmRestore(false)}
              className="rounded-xl flex-1 border-slate-200 hover:bg-slate-50"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleConfirmRestore}
              className="rounded-xl flex-1"
            >
              Yes, Restore Data
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
