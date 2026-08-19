import { useState, useEffect } from 'react';

export type MobilePlatform = 'ios' | 'android';

export function getMobilePlatform(): MobilePlatform {
  if (typeof navigator === 'undefined') return 'ios';

  const ua = navigator.userAgent || navigator.vendor || (typeof window !== 'undefined' ? window.opera : '') || '';

  // Android detection
  if (/Android/i.test(ua)) {
    return 'android';
  }

  // iOS detection (including iPadOS on newer iOS Safari where platform is MacIntel with multi-touch)
  const isIOS = 
    /iPad|iPhone|iPod/.test(ua) || 
    (typeof navigator !== 'undefined' && navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);

  if (isIOS) {
    return 'ios';
  }

  // Default to iOS styling for generic mobile browsers / desktop responsive mode
  return 'ios';
}

export function usePlatform(): {
  platform: MobilePlatform;
  isIOS: boolean;
  isAndroid: boolean;
} {
  const [platform, setPlatform] = useState<MobilePlatform>(getMobilePlatform);

  useEffect(() => {
    setPlatform(getMobilePlatform());
  }, []);

  return {
    platform,
    isIOS: platform === 'ios',
    isAndroid: platform === 'android',
  };
}
