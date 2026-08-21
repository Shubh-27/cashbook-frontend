export const ROUTES = {
  HOME: '/',
  DASHBOARD: '/',
  TRANSACTIONS: '/transactions',
  ACCOUNTS: '/accounts',
  DESCRIPTIONS: '/descriptions',
  SETTINGS: '/settings',
} as const;

export type AppRoute = typeof ROUTES[keyof typeof ROUTES];

export const QUERY_PARAMS = {
  ACCOUNT_SID: 'account_sid',
  DESCRIPTION_SID: 'description_sid',
  SEARCH: 'search',
  START_DATE: 'start_date',
  END_DATE: 'end_date',
  ALL: 'all',
} as const;

export interface TransactionsUrlParams {
  accountSid?: string;
  descriptionSid?: string;
  search?: string;
  startDate?: string;
  endDate?: string;
  all?: boolean;
}

/**
 * Builds a type-safe URL for the /transactions route with optional query parameters.
 * Preserves query parameter keys and exact URL semantics.
 */
export function buildTransactionsUrl(params?: TransactionsUrlParams): string {
  if (!params) return ROUTES.TRANSACTIONS;

  const query = new URLSearchParams();

  if (params.accountSid !== undefined) {
    query.set(QUERY_PARAMS.ACCOUNT_SID, params.accountSid);
  }
  if (params.descriptionSid !== undefined) {
    query.set(QUERY_PARAMS.DESCRIPTION_SID, params.descriptionSid);
  }
  if (params.search !== undefined) {
    query.set(QUERY_PARAMS.SEARCH, params.search);
  }
  if (params.startDate !== undefined) {
    query.set(QUERY_PARAMS.START_DATE, params.startDate);
  }
  if (params.endDate !== undefined) {
    query.set(QUERY_PARAMS.END_DATE, params.endDate);
  }
  if (params.all !== undefined) {
    query.set(QUERY_PARAMS.ALL, params.all ? 'true' : 'false');
  }

  const queryString = query.toString();
  return queryString ? `${ROUTES.TRANSACTIONS}?${queryString}` : ROUTES.TRANSACTIONS;
}
