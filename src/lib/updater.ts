import type { UpdaterEventPayload } from '@/electron';

export function isElectronUpdaterAvailable(): boolean {
  return typeof window !== 'undefined' && Boolean(window.electronAPI);
}

export async function getAppVersion(): Promise<string | null> {
  if (!isElectronUpdaterAvailable()) return null;
  return await window.electronAPI!.getVersion();
}

export async function checkForAppUpdates(): Promise<void> {
  if (!isElectronUpdaterAvailable()) return;
  await window.electronAPI!.checkForUpdates();
}

export async function installAppUpdate(): Promise<void> {
  if (!isElectronUpdaterAvailable()) return;
  await window.electronAPI!.installUpdate();
}

export async function openAppReleasePage(url: string): Promise<void> {
  if (!isElectronUpdaterAvailable()) return;
  await window.electronAPI!.openReleasePage(url);
}

export function subscribeToAppUpdateState(
  callback: (payload: UpdaterEventPayload) => void
): () => void {
  if (!isElectronUpdaterAvailable()) {
    return () => {};
  }
  return window.electronAPI!.onUpdateState(callback);
}
