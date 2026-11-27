import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach } from 'vitest';

afterEach(cleanup);

class ResizeObserverMock {
  observe() {}
  unobserve() {}
  disconnect() {}
}

globalThis.ResizeObserver = ResizeObserverMock;

class StorageMock implements Storage {
  private values = new Map<string, string>();

  get length() { return this.values.size; }
  clear() { this.values.clear(); }
  getItem(key: string) { return this.values.get(key) ?? null; }
  key(index: number) { return [...this.values.keys()][index] ?? null; }
  removeItem(key: string) { this.values.delete(key); }
  setItem(key: string, value: string) { this.values.set(String(key), String(value)); }
}

if (!window.Storage) Object.defineProperty(window, 'Storage', { value: StorageMock });
if (!window.localStorage) Object.defineProperty(window, 'localStorage', { value: new StorageMock() });
if (!window.sessionStorage) Object.defineProperty(window, 'sessionStorage', { value: new StorageMock() });
