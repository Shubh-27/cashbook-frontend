import React, { useEffect, useState } from 'react';

export const UpdateNotifier: React.FC = () => {
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [updateDownloaded, setUpdateDownloaded] = useState(false);
  const [version, setVersion] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // @ts-ignore
    const { electronAPI } = window;
    if (!electronAPI) return;

    electronAPI.onUpdateAvailable((info: any) => {
      setUpdateAvailable(true);
      setVersion(info.version);
    });

    electronAPI.onDownloadProgress((progress: any) => {
      setDownloadProgress(Math.round(progress.percent));
    });

    electronAPI.onUpdateDownloaded(() => {
      setUpdateAvailable(false);
      setUpdateDownloaded(true);
      setError(null);
    });

    electronAPI.onUpdateError((err: string) => {
      console.error('Update error:', err);
      setError(err);
      setUpdateAvailable(false);
    });
  }, []);

  if (!updateAvailable && !updateDownloaded && !error) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 p-4 bg-white dark:bg-slate-800 rounded-lg shadow-xl border border-slate-200 dark:border-slate-700 max-w-xs transition-all animate-in slide-in-from-bottom-5">
      <h3 className={`text-sm font-semibold mb-1 ${error ? 'text-red-600' : ''}`}>
        {error ? 'Update Error' : (updateDownloaded ? 'Update Ready' : 'New Update Available')}
      </h3>
      <p className="text-xs text-slate-500 mb-3">
        {error 
          ? error 
          : (updateDownloaded 
            ? `Version ${version} is ready to install.` 
            : `Downloading version ${version}... ${downloadProgress}%`)}
      </p>
      
      {error ? (
        <button
          onClick={() => {
            setError(null);
            setUpdateAvailable(false);
          }}
          className="w-full py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-medium rounded transition-colors"
        >
          Dismiss
        </button>
      ) : updateDownloaded ? (
        <button
          onClick={() => {
            // @ts-ignore
            window.electronAPI.quitAndInstall();
          }}
          className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded transition-colors"
        >
          Restart & Update
        </button>
      ) : (
        <div className="w-full bg-slate-100 dark:bg-slate-700 rounded-full h-1.5 overflow-hidden">
          <div 
            className="bg-blue-600 h-full transition-all duration-300" 
            style={{ width: `${downloadProgress}%` }}
          />
        </div>
      )}
    </div>
  );
};
