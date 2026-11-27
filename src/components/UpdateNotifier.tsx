import React, { useEffect, useState } from 'react';
import { AlertTriangle } from 'lucide-react';
import { useAppUpdater } from '@/hooks/useAppUpdater';
import { useAppStore } from '@/store';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

export const UpdateNotifier: React.FC = () => {
  const {
    isElectron,
    state,
    version,
    percent,
    message,
    manualOnly,
    isRestarting,
    install,
    openDownloadPage,
  } = useAppUpdater();

  const statementImportInProgress = useAppStore((s) => s.statementImportInProgress);
  const unsavedEdits = useAppStore((s) => s.unsavedEdits);

  const [dismissed, setDismissed] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  useEffect(() => {
    if (state === 'checking') {
      setDismissed(false);
    }
  }, [state]);

  if (!isElectron || dismissed) return null;

  const isDownloading = state === 'downloading';
  const isDownloaded = state === 'downloaded';
  const isManualAvailable = state === 'available' && manualOnly;
  const isError = state === 'error';

  if (!isDownloading && !isDownloaded && !isManualAvailable && !isError) {
    return null;
  }

  const handleRestartClick = () => {
    if (statementImportInProgress || unsavedEdits) {
      setConfirmOpen(true);
      return;
    }
    void install();
  };

  const handleConfirmRestart = () => {
    setConfirmOpen(false);
    void install();
  };

  return (
    <>
      <div className="fixed bottom-4 right-4 z-50 p-4 bg-white dark:bg-slate-800 rounded-lg shadow-xl border border-slate-200 dark:border-slate-700 max-w-xs w-full transition-all animate-in slide-in-from-bottom-5">
        <h3 className={`text-sm font-semibold mb-1 ${isError ? 'text-red-600' : 'text-slate-900 dark:text-slate-100'}`}>
          {isError
            ? 'Update Error'
            : isDownloaded
              ? 'Update Ready'
              : isManualAvailable
                ? 'New Update Available'
                : 'Downloading Update'}
        </h3>

        <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">
          {isError
            ? message || 'Unable to update right now.'
            : isDownloaded
              ? `Version ${version} is ready to install.`
              : isManualAvailable
                ? `Version ${version} is available to download.`
                : `Downloading version ${version}... ${percent}%`}
        </p>

        {isError ? (
          <button
            type="button"
            onClick={() => setDismissed(true)}
            className="w-full py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-medium rounded transition-colors"
          >
            Dismiss
          </button>
        ) : isManualAvailable ? (
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => void openDownloadPage()}
              className="flex-1 py-2 px-3 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded transition-colors"
            >
              Open download page
            </button>
            <button
              type="button"
              onClick={() => setDismissed(true)}
              className="py-2 px-3 bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-medium rounded transition-colors"
            >
              Later
            </button>
          </div>
        ) : isDownloaded ? (
          <div className="flex gap-2">
            <button
              type="button"
              disabled={isRestarting}
              onClick={handleRestartClick}
              className="flex-1 py-2 px-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-medium rounded transition-colors"
            >
              {isRestarting ? 'Restarting...' : 'Restart now'}
            </button>
            <button
              type="button"
              disabled={isRestarting}
              onClick={() => setDismissed(true)}
              className="py-2 px-3 bg-slate-200 hover:bg-slate-300 disabled:opacity-50 disabled:cursor-not-allowed text-slate-700 text-xs font-medium rounded transition-colors"
            >
              Later
            </button>
          </div>
        ) : (
          <div className="w-full bg-slate-100 dark:bg-slate-700 rounded-full h-1.5 overflow-hidden">
            <div
              className="bg-blue-600 h-full transition-all duration-300"
              style={{ width: `${percent}%` }}
            />
          </div>
        )}
      </div>

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent className="w-[95vw] sm:max-w-md max-h-[92vh] overflow-y-auto rounded-3xl p-5 sm:p-6 shadow-2xl border border-slate-200/80 bg-white">
          <DialogHeader className="flex flex-col items-center gap-2 text-center sm:text-left sm:items-start">
            <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-100 flex items-center justify-center mb-1 text-amber-600">
              <AlertTriangle className="w-6 h-6 text-amber-600" />
            </div>
            <DialogTitle className="text-lg md:text-xl text-slate-900 font-bold">
              Unsaved Work in Progress
            </DialogTitle>
            <DialogDescription className="text-xs md:text-sm text-slate-500">
              {statementImportInProgress
                ? 'A statement import is currently in progress. Restarting now to install the update will discard your current import progress.'
                : 'You have unsaved edits. Restarting now to install the update will discard your unsaved changes.'}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex flex-row items-center justify-end gap-2 pt-3 border-t mt-2">
            <Button
              variant="ghost"
              type="button"
              onClick={() => setConfirmOpen(false)}
              className="rounded-xl flex-1 sm:flex-none"
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleConfirmRestart}
              className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl flex-1 sm:flex-none font-semibold shadow-sm"
            >
              Restart &amp; Update
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};
