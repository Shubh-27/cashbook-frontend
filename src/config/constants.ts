export const DEFAULT_API_PORT = 5050;

function getDefaultApiBaseUrl(): string {
  if (typeof window === 'undefined' || window.location.protocol === 'file:' || !window.location.hostname) {
    return `http://localhost:${DEFAULT_API_PORT}/api`;
  }
  return `${window.location.protocol}//${window.location.hostname}:${DEFAULT_API_PORT}/api`;
}

export const DEFAULT_API_BASE_URL = getDefaultApiBaseUrl();
export const API_BASE_URL = import.meta.env.VITE_API_URL || DEFAULT_API_BASE_URL;

export const DEFAULT_PAGE_SIZE = 50;

