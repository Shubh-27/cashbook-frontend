import React, { useState } from 'react';
import { Download, Upload, Database, AlertTriangle, Smartphone, CheckCircle2, Share, PlusSquare, Sparkles, MoreVertical, Info } from 'lucide-react';
import { api } from '@/services/api';
import { useAppStore } from '@/store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { usePwaInstall } from '@/hooks/usePwaInstall';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

export function SettingsPage() {
  const { isElectron, isStandalone, isIOS, isAndroid, hasNativePrompt, isInstalling, installApp } = usePwaInstall();
  const fetchAccounts = useAppStore(state => state.fetchAccounts);
  const refreshTransactions = useAppStore(state => state.refreshTransactions);
  const [showInstallGuide, setShowInstallGuide] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [showConfirmRestore, setShowConfirmRestore] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const handleInstallClick = async () => {
    if (hasNativePrompt) {
      const res = await installApp();
      if (res.outcome === 'accepted') {
        setMessage({ text: 'CashBook installed successfully!', type: 'success' });
      } else if (res.outcome === 'manual') {
        setShowInstallGuide(true);
      }
    } else {
      setShowInstallGuide(true);
    }
  };

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
      await fetchAccounts();
      refreshTransactions();
      setMessage({ text: 'Database restored successfully! Cache has been refreshed.', type: 'success' });
    } catch (error) {
      console.error('Import failed:', error);
      setMessage({ text: error instanceof Error ? error.message : 'Failed to restore database.', type: 'error' });
    } finally {
      setIsImporting(false);
      setSelectedFile(null);
    }
  };

  return (
    <div className="flex flex-col gap-4 md:gap-6 animate-in fade-in duration-300">
      <div className="hidden md:flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-slate-800">Settings</h1>
          <p className="text-xs md:text-sm text-slate-500 mt-0.5">Manage data backups and app configuration.</p>
        </div>
      </div>

      <div className="grid gap-6">
        {/* PWA App Installation Section - Only shown when NOT running in Electron */}
        {!isElectron && (
          <section className="bg-white p-5 sm:p-6 rounded-2xl shadow-sm border border-slate-200/80">
            <div className="flex items-center gap-3 mb-5">
              <div className="p-2.5 bg-teal-50 rounded-xl border border-teal-100/80 text-teal-600">
                <Smartphone className="w-5 h-5 md:w-6 md:h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base md:text-lg font-bold text-slate-900">Install CashBook App</h2>
                  <span className="text-[10px] uppercase font-bold tracking-wider bg-teal-50 text-teal-700 px-2 py-0.5 rounded-full border border-teal-100/80">
                    PWA
                  </span>
                </div>
                <p className="text-slate-500 text-xs md:text-sm">
                  Add CashBook to your home screen for an offline-ready, full-screen standalone app.
                </p>
              </div>
            </div>

            {isStandalone ? (
              <div className="flex items-center gap-3.5 p-4 bg-emerald-50 text-emerald-800 rounded-2xl border border-emerald-100">
                <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-700 shrink-0">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-emerald-900">CashBook is Running as an App</h4>
                  <p className="text-xs text-emerald-700/90 mt-0.5">
                    You are running CashBook in native standalone mode with offline cache support.
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 sm:p-5 bg-slate-50 rounded-2xl border border-slate-100">
                  <div className="flex items-center gap-3.5">
                    <img src="/pwa-icon.svg" alt="CashBook Icon" className="w-12 h-12 rounded-2xl shadow-sm shrink-0" />
                    <div>
                      <h3 className="font-bold text-slate-900 text-sm md:text-base">
                        {isIOS ? 'CashBook for iOS' : isAndroid ? 'CashBook for Android' : 'CashBook Web App'}
                      </h3>
                      <p className="text-slate-500 text-xs mt-0.5">
                        Launch directly from your home screen with zero browser bars.
                      </p>
                    </div>
                  </div>

                  <Button
                    onClick={handleInstallClick}
                    disabled={isInstalling}
                    className="bg-teal-600 hover:bg-teal-700 active:scale-95 text-white rounded-xl px-6 h-11 shadow-sm font-semibold flex items-center justify-center gap-2 shrink-0 transition-all"
                  >
                    <Download className="w-4 h-4" />
                    {isInstalling ? 'Installing...' : 'Install App'}
                  </Button>
                </div>

                {/* Platform Quick Guidance */}
                <div className="p-3.5 bg-teal-50/60 rounded-2xl border border-teal-100/70 flex items-start gap-2.5 text-xs text-teal-900">
                  <Info className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    {isIOS ? (
                      <p className="leading-relaxed">
                        <strong>iOS (Safari):</strong> Tap the <strong>Share</strong> button (<Share className="w-3 h-3 inline text-teal-700" />), scroll down, and select <strong>"Add to Home Screen"</strong>.
                      </p>
                    ) : isAndroid ? (
                      <p className="leading-relaxed">
                        <strong>Android (Chrome):</strong> Tap <strong>Install App</strong> above, or open Chrome's menu (<MoreVertical className="w-3 h-3 inline text-teal-700" />) and tap <strong>"Install app"</strong> or <strong>"Add to Home screen"</strong>.
                      </p>
                    ) : (
                      <p className="leading-relaxed">
                        <strong>Desktop:</strong> Click <strong>Install App</strong> above or click the install icon (<Download className="w-3 h-3 inline text-teal-700" />) in your browser address bar.
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}
          </section>
        )}

        <section className="bg-white p-5 sm:p-6 rounded-2xl shadow-sm border border-slate-200/80">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2.5 bg-teal-50 rounded-xl border border-teal-100/80 text-teal-600">
              <Database className="w-5 h-5 md:w-6 md:h-6" />
            </div>
            <div>
              <h2 className="text-base md:text-lg font-bold text-slate-900">Database Management</h2>
              <p className="text-slate-500 text-xs md:text-sm">Backup and restore your financial database.</p>
            </div>
          </div>

          <div className="space-y-6">
            <div className="flex flex-col gap-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 md:p-5 bg-slate-50 rounded-2xl border border-slate-100 transition-all hover:bg-slate-100/50">
                <div>
                  <h3 className="font-semibold text-slate-900 text-sm md:text-base">Export Database</h3>
                  <p className="text-slate-500 text-xs md:text-sm">Download a complete SQLite backup of your data.</p>
                </div>
                <Button 
                  onClick={handleExport} 
                  disabled={isExporting}
                  className="bg-teal-600 hover:bg-teal-700 text-white rounded-xl px-5 h-10 shadow-sm shrink-0 font-medium"
                >
                  <Download className="w-4 h-4 mr-2" />
                  {isExporting ? 'Exporting...' : 'Export Database'}
                </Button>
              </div>

              <div className="flex flex-col gap-4 p-4 md:p-5 bg-slate-50 rounded-2xl border border-slate-100">
                <div>
                  <h3 className="font-semibold text-slate-900 text-sm md:text-base">Import / Restore Database</h3>
                  <p className="text-slate-500 text-xs md:text-sm">Restore data from a previously exported .db file.</p>
                </div>
                
                <div className="flex flex-col sm:flex-row sm:items-end gap-3">
                  <div className="flex-1">
                    <Label htmlFor="db-file" className="mb-1.5 block text-xs md:text-sm font-semibold text-slate-700">
                      Select Backup File (.db)
                    </Label>
                    <Input 
                      id="db-file" 
                      type="file" 
                      accept=".db"
                      onChange={handleFileChange}
                      className="rounded-xl border-slate-200 cursor-pointer bg-white file:bg-slate-50 file:text-teal-700 file:font-semibold text-xs md:text-sm h-10"
                    />
                  </div>
                  <Button 
                    onClick={handleImportClick} 
                    disabled={!selectedFile || isImporting}
                    variant="destructive"
                    className="rounded-xl px-5 h-10 shadow-sm shrink-0 font-medium"
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    {isImporting ? 'Importing...' : 'Restore DB'}
                  </Button>
                </div>
                
                <div className="flex items-start gap-2.5 text-amber-700 bg-amber-50/70 p-3.5 rounded-xl border border-amber-200/80 text-xs md:text-sm">
                  <AlertTriangle className="w-4 h-4 md:w-5 md:h-5 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold block mb-0.5">Warning: Destructive Action</span>
                    <p className="text-amber-800/90 leading-relaxed">Restoring a database will completely overwrite all existing records. Export a backup beforehand if needed.</p>
                  </div>
                </div>
              </div>
            </div>

            {message && (
              <div className={`p-4 rounded-xl border flex items-center justify-between gap-3 animate-in fade-in slide-in-from-top-2 duration-300 ${
                message.type === 'success' 
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-100' 
                  : 'bg-red-50 text-red-700 border-red-100'
              }`}>
                <div className="flex items-center gap-3">
                  <div className={`w-2 h-2 rounded-full shrink-0 ${message.type === 'success' ? 'bg-emerald-500' : 'bg-red-500'}`} />
                  <p className="font-medium text-xs md:text-sm">{message.text}</p>
                </div>
                {message.type === 'success' && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => window.location.reload()}
                    className="h-8 px-3 text-xs font-semibold rounded-lg border-emerald-200 text-emerald-800 hover:bg-emerald-100/60 shrink-0"
                  >
                    Reload Page
                  </Button>
                )}
              </div>
            )}
          </div>
        </section>
      </div>

      <Dialog open={showConfirmRestore} onOpenChange={setShowConfirmRestore}>
        <DialogContent className="w-[95vw] sm:max-w-md max-h-[92vh] overflow-y-auto rounded-3xl p-5 sm:p-6 shadow-2xl border border-slate-200/80 bg-white">
          <DialogHeader className="flex flex-col items-center gap-2 text-center sm:text-left sm:items-start">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 border border-rose-100 flex items-center justify-center mb-1 text-rose-600">
              <AlertTriangle className="w-6 h-6 text-rose-600" />
            </div>
            <DialogTitle className="text-lg md:text-xl text-slate-900 font-bold">
              Confirm Database Restore
            </DialogTitle>
            <DialogDescription className="text-xs md:text-sm text-slate-500 space-y-2 block text-left">
              <p>Are you sure you want to restore the database from:</p>
              <div className="bg-slate-50 p-2.5 rounded-xl font-mono text-xs md:text-sm break-all font-semibold text-slate-800 border border-slate-200">
                {selectedFile?.name}
              </div>
              <p className="font-medium text-slate-600">
                This will completely replace all transactions, accounts, and descriptions. <span className="text-rose-600 font-bold">This action cannot be undone.</span>
              </p>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex flex-row items-center justify-end gap-2 pt-3 border-t mt-2">
            <Button
              variant="ghost"
              type="button"
              onClick={() => setShowConfirmRestore(false)}
              className="rounded-xl flex-1 sm:flex-none"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleConfirmRestore}
              className="bg-rose-600 hover:bg-rose-700 text-white rounded-xl flex-1 sm:flex-none font-semibold shadow-sm"
            >
              Yes, Restore Data
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* PWA Install Instructions Modal */}
      <Dialog open={showInstallGuide} onOpenChange={setShowInstallGuide}>
        <DialogContent className="w-[95vw] sm:max-w-md max-h-[92vh] overflow-y-auto rounded-3xl p-5 sm:p-6 shadow-2xl border border-slate-200/80 bg-white">
          <DialogHeader className="flex flex-col items-center gap-2 text-center sm:text-left sm:items-start">
            <div className="w-12 h-12 rounded-2xl bg-teal-50 border border-teal-100 flex items-center justify-center mb-1 text-teal-600">
              <Smartphone className="w-6 h-6 text-teal-600" />
            </div>
            <DialogTitle className="text-lg md:text-xl text-slate-900 font-bold">
              How to Install CashBook
            </DialogTitle>
            <DialogDescription className="text-xs md:text-sm text-slate-500">
              Follow these simple steps in your browser to add CashBook as a standalone app on your device.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {isIOS ? (
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 space-y-3 text-xs text-slate-700">
                <div className="font-bold text-slate-900 text-xs mb-1">Safari on iOS:</div>
                <div className="flex items-center gap-3">
                  <span className="font-bold text-teal-700 bg-white w-6 h-6 rounded-full flex items-center justify-center text-xs shrink-0 border border-teal-200 shadow-2xs">1</span>
                  <span>Tap the <strong>Share</strong> button (<Share className="w-3.5 h-3.5 inline text-teal-600 -mt-0.5" />) in Safari's bottom bar.</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-bold text-teal-700 bg-white w-6 h-6 rounded-full flex items-center justify-center text-xs shrink-0 border border-teal-200 shadow-2xs">2</span>
                  <span>Scroll down and tap <strong>"Add to Home Screen"</strong> (<PlusSquare className="w-3.5 h-3.5 inline text-teal-600 -mt-0.5" />).</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-bold text-teal-700 bg-white w-6 h-6 rounded-full flex items-center justify-center text-xs shrink-0 border border-teal-200 shadow-2xs">3</span>
                  <span>Tap <strong>Add</strong> in the top right corner.</span>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {/* Edge Android */}
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 space-y-2.5 text-xs text-slate-700">
                  <div className="font-bold text-slate-900 text-xs flex items-center justify-between">
                    <span>Microsoft Edge (Android):</span>
                    <span className="text-[10px] bg-slate-200/70 text-slate-700 px-2 py-0.5 rounded-md font-semibold">Edge</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-bold text-teal-700 bg-white w-6 h-6 rounded-full flex items-center justify-center text-xs shrink-0 border border-teal-200 shadow-2xs">1</span>
                    <span>Tap the <strong>☰ (Menu)</strong> icon in Edge's bottom bar (bottom right).</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-bold text-teal-700 bg-white w-6 h-6 rounded-full flex items-center justify-center text-xs shrink-0 border border-teal-200 shadow-2xs">2</span>
                    <span>Tap <strong>"Add to phone"</strong> or <strong>"Add to Home screen"</strong>.</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-bold text-teal-700 bg-white w-6 h-6 rounded-full flex items-center justify-center text-xs shrink-0 border border-teal-200 shadow-2xs">3</span>
                    <span>Tap <strong>Add / Install</strong> to create your home screen app.</span>
                  </div>
                </div>

                {/* Chrome Android */}
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 space-y-2.5 text-xs text-slate-700">
                  <div className="font-bold text-slate-900 text-xs flex items-center justify-between">
                    <span>Google Chrome (Android):</span>
                    <span className="text-[10px] bg-slate-200/70 text-slate-700 px-2 py-0.5 rounded-md font-semibold">Chrome</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-bold text-teal-700 bg-white w-6 h-6 rounded-full flex items-center justify-center text-xs shrink-0 border border-teal-200 shadow-2xs">1</span>
                    <span>Tap the <strong>⋮ (three dots menu)</strong> in Chrome's top right corner.</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-bold text-teal-700 bg-white w-6 h-6 rounded-full flex items-center justify-center text-xs shrink-0 border border-teal-200 shadow-2xs">2</span>
                    <span>Select <strong>"Install app"</strong> or <strong>"Add to Home screen"</strong>.</span>
                  </div>
                </div>
              </div>
            )}

            <div className="p-3 bg-teal-50 rounded-xl border border-teal-100 flex items-center gap-2.5 text-xs text-teal-800">
              <Sparkles className="w-4 h-4 text-teal-600 shrink-0" />
              <span>Once added to your home screen, CashBook runs in native full-screen mode with offline caching!</span>
            </div>
          </div>

          <DialogFooter className="pt-2 border-t">
            <Button
              onClick={() => setShowInstallGuide(false)}
              className="w-full bg-teal-600 hover:bg-teal-700 text-white rounded-xl font-semibold shadow-sm"
            >
              Got it!
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
