import React, { useEffect, useState } from 'react';

export const UpdateNotifier: React.FC = () => {
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [updateDownloaded, setUpdateDownloaded] = useState(false);
  const [version, setVersion] = useState('');

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
    });
  }, []);

  if (!updateAvailable && !updateDownloaded) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 p-4 bg-white dark:bg-slate-800 rounded-lg shadow-xl border border-slate-200 dark:border-slate-700 max-w-xs transition-all animate-in slide-in-from-bottom-5">
      <h3 className="text-sm font-semibold mb-1">
        {updateDownloaded ? 'Update Ready' : 'New Update Available'}
      </h3>
      <p className="text-xs text-slate-500 mb-3">
        {updateDownloaded 
          ? `Version ${version} is ready to install.` 
          : `Downloading version ${version}... ${downloadProgress}%`}
      </p>
      
      {updateDownloaded ? (
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
