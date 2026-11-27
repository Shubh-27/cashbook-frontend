export type UpdaterState =
  | 'idle'
  | 'checking'
  | 'available'
  | 'downloading'
  | 'downloaded'
  | 'error';

export interface UpdaterEventPayload {
  state: UpdaterState;
  version?: string;
  percent?: number;
  message?: string;
  manualOnly?: boolean;
  url?: string;
  upToDate?: boolean;
}

export interface ElectronAPI {
  getVersion: () => Promise<string>;
  checkForUpdates: () => Promise<unknown>;
  installUpdate: () => Promise<void>;
  openReleasePage: (url: string) => Promise<void>;
  onUpdateState: (callback: (payload: UpdaterEventPayload) => void) => () => void;
}

export interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

declare global {
  interface Window {
    electronAPI?: ElectronAPI;
    MSStream?: unknown;
    opera?: string;
  }

  interface Navigator {
    standalone?: boolean;
  }

  interface WindowEventMap {
    beforeinstallprompt: BeforeInstallPromptEvent;
  }
}
