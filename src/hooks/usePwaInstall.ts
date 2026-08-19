import { useState, useEffect, useCallback } from 'react';
import type { BeforeInstallPromptEvent } from '../types/electron';

// Global variable to capture event if it fired before hook mounted
let globalDeferredPrompt: BeforeInstallPromptEvent | null = null;

if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    globalDeferredPrompt = e;
    window.dispatchEvent(new Event('pwa-prompt-available'));
  });
}

export function isRunningInElectron(): boolean {
  if (typeof window === 'undefined') return false;
  return !!window.electronAPI || navigator.userAgent.toLowerCase().includes('electron');
}

export function usePwaInstall() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(globalDeferredPrompt);
  const [isInstalling, setIsInstalling] = useState<boolean>(false);

  const isElectron = isRunningInElectron();

  const isIOS = typeof navigator !== 'undefined' && 
    /iPad|iPhone|iPod/.test(navigator.userAgent) && 
    !window.MSStream;

  const isAndroid = typeof navigator !== 'undefined' && 
    /Android/i.test(navigator.userAgent);

  const isStandalone = typeof window !== 'undefined' && (
    window.matchMedia('(display-mode: standalone)').matches || 
    navigator.standalone === true ||
    document.referrer.includes('android-app://')
  );

  useEffect(() => {
    const handlePrompt = () => {
      setDeferredPrompt(globalDeferredPrompt);
    };

    const handleAppInstalled = () => {
      setDeferredPrompt(null);
      globalDeferredPrompt = null;
    };

    window.addEventListener('pwa-prompt-available', handlePrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('pwa-prompt-available', handlePrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const installApp = useCallback(async (): Promise<{ outcome: 'accepted' | 'dismissed' | 'manual' }> => {
    if (deferredPrompt) {
      setIsInstalling(true);
      try {
        await deferredPrompt.prompt();
        const choice = await deferredPrompt.userChoice;
        if (choice.outcome === 'accepted') {
          setDeferredPrompt(null);
          globalDeferredPrompt = null;
          return { outcome: 'accepted' };
        }
        return { outcome: 'dismissed' };
      } catch (err) {
        console.error('PWA install prompt error:', err);
        return { outcome: 'manual' };
      } finally {
        setIsInstalling(false);
      }
    }
    return { outcome: 'manual' };
  }, [deferredPrompt]);

  return {
    isElectron,
    isInstalled: isStandalone,
    isStandalone,
    isIOS,
    isAndroid,
    hasNativePrompt: !!deferredPrompt,
    isInstalling,
    installApp,
  };
}
