export const DEFAULT_API_PORT = 5050;
export const DEFAULT_API_BASE_URL = `${window.location.protocol}//${window.location.hostname}:${DEFAULT_API_PORT}/api`;
export const API_BASE_URL = import.meta.env.VITE_API_URL || DEFAULT_API_BASE_URL;

export const DEFAULT_PAGE_SIZE = 50;
