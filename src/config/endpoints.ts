export const API_ENDPOINTS = {
  ACCOUNTS: {
    LIST: '/accounts/list',
    BASE: '/accounts',
    BY_ID: (sid: string) => `/accounts/${encodeURIComponent(sid)}`,
  },
  DESCRIPTIONS: {
    LIST: '/descriptions/list',
    BASE: '/descriptions',
    BY_ID: (sid: string) => `/descriptions/${encodeURIComponent(sid)}`,
  },
  TRANSACTIONS: {
    LIST: '/transactions/list',
    BASE: '/transactions',
    BY_ID: (sid: string) => `/transactions/${encodeURIComponent(sid)}`,
    DELETE_WITH_ACCOUNT: (sid: string, accountSid: string) =>
      `/transactions/${encodeURIComponent(sid)}?accountSid=${encodeURIComponent(accountSid)}`,
    EXPORT: '/transactions/export',
  },
  DATABASE: {
    EXPORT: '/database/export',
    IMPORT: '/database/import',
  },
} as const;
