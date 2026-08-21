import { useState, useEffect, useCallback, useRef } from 'react';
import { useAppStore } from '@/store';
import { api } from '@/services/api';
import type { VwTransactionList } from '@/types';
import {
  ArrowLeftRight,
  Building2,
  ChevronRight,
  TrendingDown,
  TrendingUp,
  Plus,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { format, parseISO, isValid } from 'date-fns';

import { ROUTES, buildTransactionsUrl } from '@/config/routes';

export function Dashboard() {
  const accounts = useAppStore(state => state.accounts);
  const setQuickAddOpen = useAppStore(state => state.setQuickAddOpen);
  const lastTransactionUpdate = useAppStore(state => state.lastTransactionUpdate);
  const navigate = useNavigate();
  const [recentTransactions, setRecentTransactions] = useState<VwTransactionList[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const abortControllerRef = useRef<AbortController | null>(null);

  const fetchRecent = useCallback(async () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    try {
      setIsLoading(true);
      const res = await api.listTransactions({
        page: 1,
        page_size: 6,
        sort_by: 'TransactionDate',
        sort_order: 'desc'
      }, abortController.signal);

      if (!abortController.signal.aborted) {
        setRecentTransactions(res.data || []);
      }
    } catch (e) {
      if ((e instanceof Error && e.name === 'AbortError') || abortController.signal.aborted) {
        return;
      }
      console.error('Failed to load recent transactions:', e);
    } finally {
      if (!abortController.signal.aborted) {
        setIsLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    fetchRecent();
  }, [fetchRecent, lastTransactionUpdate]);

  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  return (
    <div className="flex flex-col gap-6 md:gap-8 animate-in fade-in duration-300 pb-8 md:pb-12">
      {/* Mobile/Desktop Hero Overview */}
      <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-teal-950 text-white rounded-3xl p-6 md:p-8 shadow-md">
        <div className="absolute -right-12 -top-12 w-48 h-48 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -left-12 -bottom-12 w-48 h-48 bg-teal-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 text-teal-400 text-xs font-semibold uppercase tracking-wider mb-2">
              <span className="w-2 h-2 rounded-full bg-teal-400 animate-pulse" />
              CashBook Overview
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-white">
              Financial Dashboard
            </h1>
            <p className="text-slate-300 text-sm mt-1">
              Managing <span className="font-semibold text-white">{accounts.length}</span> bank account{accounts.length === 1 ? '' : 's'} with ease.
            </p>
          </div>

          {/* Quick Actions Bar */}
          <div className="flex flex-wrap items-center gap-2.5">
            <Button
              onClick={() => setQuickAddOpen(true)}
              className="bg-teal-500 hover:bg-teal-400 active:scale-95 text-slate-950 font-semibold rounded-2xl px-5 h-11 shadow-sm transition-all flex items-center gap-2"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>Add Transaction</span>
            </Button>
            <Button
              variant="outline"
              onClick={() => navigate(ROUTES.TRANSACTIONS)}
              className="bg-white/10 hover:bg-white/20 active:scale-95 text-white border-white/15 rounded-2xl px-4 h-11 backdrop-blur-md transition-all flex items-center gap-1.5"
            >
              <ArrowLeftRight className="w-4 h-4" />
              <span className="text-sm font-medium">Transactions</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Accounts Section */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg md:text-xl font-bold text-slate-800">Your Accounts</h2>
            <p className="text-xs text-slate-500">Tap any account to filter transactions</p>
          </div>
          <Button
            variant="ghost"
            onClick={() => navigate(ROUTES.ACCOUNTS)}
            className="text-teal-600 hover:text-teal-700 hover:bg-teal-50 p-2 h-auto text-xs md:text-sm font-semibold rounded-xl"
          >
            Manage Accounts &rarr;
          </Button>
        </div>

        {accounts.length === 0 ? (
          <div className="text-center py-10 px-4 bg-white rounded-3xl border border-slate-200/80 shadow-sm">
            <div className="w-12 h-12 rounded-2xl bg-teal-50 text-teal-600 flex items-center justify-center mx-auto mb-3">
              <Building2 className="w-6 h-6" />
            </div>
            <h3 className="text-base font-semibold text-slate-800 mb-1">No accounts added yet</h3>
            <p className="text-xs md:text-sm text-slate-500 mb-5 max-w-sm mx-auto">
              Create your first bank account to begin tracking your expenses and income.
            </p>
            <Button
              onClick={() => navigate(ROUTES.ACCOUNTS)}
              className="px-5 rounded-xl font-medium bg-teal-600 hover:bg-teal-700 text-white"
            >
              Add Your First Account
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {accounts.map((acc, idx) => (
              <div
                key={acc.account_sid}
                role="button"
                tabIndex={0}
                onClick={() => navigate(buildTransactionsUrl({ accountSid: acc.account_sid }))}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    navigate(buildTransactionsUrl({ accountSid: acc.account_sid }));
                  }
                }}
                className="group cursor-pointer bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm hover:shadow-md hover:border-teal-300 transition-all duration-200 flex flex-col justify-between focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-100 text-slate-700">
                      {acc.bank_name || 'Bank Account'}
                    </span>
                    <span className="text-xs text-slate-400">
                      #{idx + 1}
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-slate-900 group-hover:text-teal-600 transition-colors">
                    {acc.account_name}
                  </h3>
                  <p className="text-slate-500 font-mono text-xs mt-0.5">
                    {acc.account_number ? `•••• ${acc.account_number.toString().slice(-4)}` : 'No Acc Number'}
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-medium text-slate-400 group-hover:text-teal-600">
                  <span>View transactions</span>
                  <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Recent Transactions Section */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg md:text-xl font-bold text-slate-800">Recent Transactions</h2>
            <p className="text-xs text-slate-500">Latest recorded expenses and income</p>
          </div>
          <Button
            variant="ghost"
            onClick={() => navigate(ROUTES.TRANSACTIONS)}
            className="text-teal-600 hover:text-teal-700 hover:bg-teal-50 p-2 h-auto text-xs md:text-sm font-semibold rounded-xl"
          >
            All Transactions &rarr;
          </Button>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden divide-y divide-slate-100">
          {isLoading ? (
            <div className="p-8 text-center text-slate-400 text-sm">
              Loading recent transactions...
            </div>
          ) : recentTransactions.length === 0 ? (
            <div className="py-10 px-4 text-center">
              <div className="w-10 h-10 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-2">
                <ArrowLeftRight className="w-5 h-5" />
              </div>
              <p className="text-sm font-medium text-slate-600">No transactions recorded yet</p>
              <p className="text-xs text-slate-400 mt-0.5">Use the "+ Add Transaction" button to create one.</p>
            </div>
          ) : (
            recentTransactions.map((tx) => {
              const isDebit = tx.debit > 0;
              const amount = isDebit ? tx.debit : tx.credit;
              const acc = tx.account_sid ? accounts.find(a => a.account_sid === tx.account_sid) : undefined;

              return (
                <div
                  key={tx.transaction_sid}
                  role="button"
                  tabIndex={0}
                  onClick={() => navigate(ROUTES.TRANSACTIONS)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      navigate(ROUTES.TRANSACTIONS);
                    }
                  }}
                  className="p-4 hover:bg-slate-50/80 active:bg-slate-100/80 transition-colors flex items-center justify-between gap-3 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500"
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div
                      className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 ${isDebit ? 'bg-rose-50 text-rose-600' : 'bg-teal-50 text-teal-600'
                        }`}
                    >
                      {isDebit ? <TrendingDown className="w-5 h-5" /> : <TrendingUp className="w-5 h-5" />}
                    </div>

                    <div className="min-w-0">
                      <div className="font-semibold text-slate-800 text-sm truncate">
                        {tx.description_name || 'Transaction'}
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-slate-400 mt-0.5 min-w-0">
                        <span className="inline-flex items-center min-w-0 max-w-[140px] sm:max-w-[220px] shrink font-medium text-slate-600">
                          <span className="truncate">{tx.account_name || 'Account'}</span>
                          {acc?.account_number && (
                            <span className="shrink-0 whitespace-nowrap ml-1 font-mono text-[11px] text-slate-500">
                              ({acc.account_number})
                            </span>
                          )}
                        </span>
                        <span className="shrink-0 text-slate-300">•</span>
                        <span className="whitespace-nowrap shrink-0 text-slate-500">
                          {tx.transaction_date && isValid(parseISO(tx.transaction_date))
                            ? format(parseISO(tx.transaction_date), 'dd MMM yyyy')
                            : '—'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <div
                      className={`font-bold text-sm sm:text-base font-mono ${isDebit ? 'text-rose-600' : 'text-teal-600'
                        }`}
                    >
                      {isDebit ? `- ₹${amount.toFixed(2)}` : `+ ₹${amount.toFixed(2)}`}
                    </div>
                    {tx.notes && (
                      <div className="text-[11px] text-slate-400 truncate max-w-[120px] sm:max-w-[180px]">
                        {tx.notes}
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}

