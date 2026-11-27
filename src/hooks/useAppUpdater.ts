import { useCallback, useEffect, useState } from 'react';
import type { UpdaterEventPayload, UpdaterState } from '@/electron';
import {
  checkForAppUpdates,
  getAppVersion,
  installAppUpdate,
  isElectronUpdaterAvailable,
  openAppReleasePage,
  subscribeToAppUpdateState,
} from '@/lib/updater';

export interface AppUpdaterSnapshot {
  state: UpdaterState;
  version: string;
  percent: number;
  message: string | null;
  manualOnly: boolean;
  url: string | null;
  upToDate: boolean;
}

export function useAppUpdater() {
  const isElectron = isElectronUpdaterAvailable();
  const [appVersion, setAppVersion] = useState<string | null>(null);
  const [isRestarting, setIsRestarting] = useState(false);
  const [snapshot, setSnapshot] = useState<AppUpdaterSnapshot>({
    state: 'idle',
    version: '',
    percent: 0,
    message: null,
    manualOnly: false,
    url: null,
    upToDate: false,
  });

  useEffect(() => {
    if (!isElectron) return;

    let active = true;
    void getAppVersion()
      .then((ver) => {
        if (active && ver) {
          setAppVersion(ver);
        }
      })
      .catch(() => {
        // Ignore version lookup failures
      });

    const unsubscribe = subscribeToAppUpdateState((payload: UpdaterEventPayload) => {
      setSnapshot((prev) => ({
        state: payload.state,
        version: payload.version ?? prev.version,
        percent:
          payload.state === 'downloading'
            ? Math.round(payload.percent ?? prev.percent)
            : payload.state === 'downloaded'
              ? 100
              : 0,
        message: payload.state === 'error' ? (payload.message ?? 'Update failed.') : null,
        manualOnly:
          payload.state === 'available'
            ? Boolean(payload.manualOnly)
            : payload.state === 'idle' || payload.state === 'checking' || payload.state === 'error'
              ? false
              : prev.manualOnly,
        url: payload.url ?? (payload.state === 'available' ? prev.url : null),
        upToDate: payload.state === 'idle' ? Boolean(payload.upToDate) : false,
      }));
    });

    return () => {
      active = false;
      unsubscribe();
    };
  }, [isElectron]);

  const check = useCallback(async () => {
    if (!isElectron) return;
    setSnapshot((prev) => ({
      ...prev,
      state: 'checking',
      message: null,
      upToDate: false,
    }));
    try {
      await checkForAppUpdates();
      setSnapshot((prev) =>
        prev.state === 'checking' ? { ...prev, state: 'idle' } : prev
      );
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unable to check for updates.';
      setSnapshot((prev) => ({
        ...prev,
        state: 'error',
        message: msg,
        upToDate: false,
      }));
    }
  }, [isElectron]);

  const install = useCallback(async () => {
    if (!isElectron || isRestarting) return;
    setIsRestarting(true);
    try {
      await installAppUpdate();
    } catch (err) {
      setIsRestarting(false);
      const msg = err instanceof Error ? err.message : 'Failed to restart and install update.';
      setSnapshot((prev) => ({
        ...prev,
        state: 'error',
        message: msg,
      }));
    }
  }, [isElectron, isRestarting]);

  const openDownloadPage = useCallback(async () => {
    if (!isElectron || !snapshot.url) return;
    try {
      await openAppReleasePage(snapshot.url);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to open download page.';
      setSnapshot((prev) => ({
        ...prev,
        state: 'error',
        message: msg,
      }));
    }
  }, [isElectron, snapshot.url]);

  return {
    isElectron,
    appVersion,
    state: snapshot.state,
    version: snapshot.version,
    percent: snapshot.percent,
    message: snapshot.message,
    manualOnly: snapshot.manualOnly,
    url: snapshot.url,
    upToDate: snapshot.upToDate,
    isRestarting,
    check,
    install,
    openDownloadPage,
  };
}
