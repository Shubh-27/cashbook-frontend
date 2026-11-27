import { useCallback, useEffect, useRef, useState } from 'react';
import { isElectronUpdaterAvailable } from '@/lib/updater';

export const PWA_NEED_REFRESH_EVENT = 'pwa:need-refresh';

type UpdateSWFn = (reloadPage?: boolean) => Promise<void>;

export function usePwaUpdate() {
  const isElectron = isElectronUpdaterAvailable();
  const [needRefresh, setNeedRefresh] = useState(false);
  const updateSwRef = useRef<UpdateSWFn | null>(null);

  useEffect(() => {
    if (isElectron) return;

    const handleNeedRefresh = (event: Event) => {
      const customEvent = event as CustomEvent<{ updateSW?: UpdateSWFn }>;
      if (customEvent.detail?.updateSW) {
        updateSwRef.current = customEvent.detail.updateSW;
      }
      setNeedRefresh(true);
    };

    window.addEventListener(PWA_NEED_REFRESH_EVENT, handleNeedRefresh);
    return () => {
      window.removeEventListener(PWA_NEED_REFRESH_EVENT, handleNeedRefresh);
    };
  }, [isElectron]);

  const reload = useCallback(() => {
    if (updateSwRef.current) {
      void updateSwRef.current(true);
    } else {
      window.location.reload();
    }
  }, []);

  return {
    needRefresh: !isElectron && needRefresh,
    reload,
  };
}
