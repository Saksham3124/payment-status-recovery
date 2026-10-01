'use client';

import React, { createContext, useContext, useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { SYNTHETIC_TRANSACTIONS, SyntheticTransaction, getInitialSyntheticTransactions } from '@/mock/synthetic-transactions';
import { evaluateRecoveryGuidance } from '@/engine/recovery-engine';
import { CanonicalRecoveryState, RecoveryGuidance, TransactionType } from '@/engine/types';

export interface EvaluatedTransaction extends SyntheticTransaction {
  guidance: RecoveryGuidance;
}

export interface StatusCounts {
  total: number;
  settled: number;
  uncertain: number;
  reversals: number;
  failures: number;
}

interface TransactionContextType {
  transactions: EvaluatedTransaction[];
  filteredTransactions: EvaluatedTransaction[];
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  statusFilter: 'ALL' | CanonicalRecoveryState;
  setStatusFilter: (filter: 'ALL' | CanonicalRecoveryState) => void;
  typeFilter: 'ALL' | TransactionType;
  setTypeFilter: (filter: 'ALL' | TransactionType) => void;
  clearFilters: () => void;
  selectedTxId: string | null;
  selectTransaction: (id: string | null) => void;
  selectedTransaction: EvaluatedTransaction | null;
  isPolling: (txId: string) => boolean;
  simulateTelemetryPoll: (txId: string) => Promise<void>;
  resetToMockData: () => void;
  statusCounts: StatusCounts;
}

const TransactionContext = createContext<TransactionContextType | undefined>(undefined);

export function TransactionProvider({ children }: { children: React.ReactNode }) {
  const [rawTransactions, setRawTransactions] = useState<SyntheticTransaction[]>(() =>
    getInitialSyntheticTransactions()
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | CanonicalRecoveryState>('ALL');
  const [typeFilter, setTypeFilter] = useState<'ALL' | TransactionType>('ALL');
  const [selectedTxId, setSelectedTxId] = useState<string | null>(null);
  const [pollingIds, setPollingIds] = useState<Record<string, boolean>>({});

  // Active timers tracker to ensure clean unmounting without timer leaks
  const activeTimersRef = useRef<Map<string, NodeJS.Timeout>>(new Map());
  // Pending promise resolvers to unblock awaiting callers immediately upon reset
  const pendingResolversRef = useRef<Map<string, () => void>>(new Map());
  // Generation counter to immediately invalidate in-flight async operations upon reset
  const resetGenerationRef = useRef(0);

  useEffect(() => {
    const timers = activeTimersRef.current;
    const resolvers = pendingResolversRef.current;
    return () => {
      // Cleanup all ongoing polling timers and resolve pending callers on unmount
      timers.forEach((timer) => clearTimeout(timer));
      timers.clear();
      resolvers.forEach((resolve) => resolve());
      resolvers.clear();
    };
  }, []);

  // Compute evaluated transactions using the pure recovery engine
  const evaluatedTransactions: EvaluatedTransaction[] = useMemo(() => {
    return rawTransactions.map((tx) => {
      const guidance = evaluateRecoveryGuidance(tx.evidence);
      return {
        ...tx,
        guidance,
      };
    });
  }, [rawTransactions]);

  // Aggregate high-level PM counts for dashboard overview cards
  const statusCounts: StatusCounts = useMemo(() => {
    let settled = 0;
    let uncertain = 0;
    let reversals = 0;
    let failures = 0;

    for (const tx of evaluatedTransactions) {
      const state = tx.guidance.canonicalState;
      if (state === 'DEFINITIVE_SUCCESS') {
        settled++;
      } else if (state === 'DEFINITIVE_FAILURE_NO_DEBIT') {
        failures++;
      } else if (state === 'AUTO_REVERSAL_IN_PROGRESS') {
        reversals++;
      } else {
        uncertain++;
      }
    }

    return {
      total: evaluatedTransactions.length,
      settled,
      uncertain,
      reversals,
      failures,
    };
  }, [evaluatedTransactions]);

  // Filtered transactions based on search text and active filter pills
  const filteredTransactions = useMemo(() => {
    return evaluatedTransactions.filter((tx) => {
      // Status filter matching
      if (statusFilter !== 'ALL' && tx.guidance.canonicalState !== statusFilter) {
        return false;
      }

      // Type filter matching
      if (typeFilter !== 'ALL' && tx.type !== typeFilter) {
        return false;
      }

      // Search query matching across ID, UTR, counterparty, and VPA
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const matchesId = tx.id.toLowerCase().includes(query);
        const matchesUtr = tx.utr.toLowerCase().includes(query);
        const matchesCounterparty = tx.counterparty.toLowerCase().includes(query);
        const matchesVpa = tx.counterpartyVpa.toLowerCase().includes(query);
        const matchesState = tx.guidance.canonicalState.toLowerCase().includes(query);

        if (!matchesId && !matchesUtr && !matchesCounterparty && !matchesVpa && !matchesState) {
          return false;
        }
      }

      return true;
    });
  }, [evaluatedTransactions, searchQuery, statusFilter, typeFilter]);

  const clearFilters = useCallback(() => {
    setSearchQuery('');
    setStatusFilter('ALL');
    setTypeFilter('ALL');
  }, []);

  const selectTransaction = useCallback((id: string | null) => {
    setSelectedTxId(id);
  }, []);

  const selectedTransaction = useMemo(() => {
    if (!selectedTxId) return null;
    return evaluatedTransactions.find((tx) => tx.id === selectedTxId) || null;
  }, [evaluatedTransactions, selectedTxId]);

  const isPolling = useCallback((txId: string) => !!pollingIds[txId], [pollingIds]);

  /**
   * Simulates a localized telemetry poll for a single transaction.
   * Updates state through pure recovery engine evaluation.
   * Guaranteed safe: Cannot bypass safety invariants or authorize unauthorized retries.
   */
  const simulateTelemetryPoll = useCallback(async (txId: string): Promise<void> => {
    // If already polling, prevent double clicks
    if (activeTimersRef.current.has(txId)) return;

    setPollingIds((prev) => ({ ...prev, [txId]: true }));
    const currentGen = resetGenerationRef.current;

    return new Promise<void>((resolve) => {
      pendingResolversRef.current.set(txId, resolve);

      const timer = setTimeout(() => {
        pendingResolversRef.current.delete(txId);
        activeTimersRef.current.delete(txId);

        // Stale async callback guard: If reset occurred while polling, drop update
        if (currentGen !== resetGenerationRef.current) {
          resolve();
          return;
        }

        setRawTransactions((prev) =>
          prev.map((item) => {
            if (item.id !== txId) return item;

            // Increment simulated elapsed time by 1 minute
            const newElapsed = item.evidence.elapsedMinutes + 1;

            // If it was in-flight deemed success, simulate late bank settlement
            if (item.evidence.npciSwitch === 'DEEMED_SUCCESS') {
              return {
                ...item,
                evidence: {
                  ...item.evidence,
                  beneficiaryCredit: 'CREDITED',
                  elapsedMinutes: newElapsed,
                },
              };
            }

            return {
              ...item,
              evidence: {
                ...item.evidence,
                elapsedMinutes: newElapsed,
              },
            };
          })
        );

        setPollingIds((prev) => {
          const next = { ...prev };
          delete next[txId];
          return next;
        });

        resolve();
      }, 750); // 750ms realistic network latency simulation

      activeTimersRef.current.set(txId, timer);
    });
  }, []);

  const resetToMockData = useCallback(() => {
    resetGenerationRef.current += 1;
    activeTimersRef.current.forEach((timer) => clearTimeout(timer));
    activeTimersRef.current.clear();
    pendingResolversRef.current.forEach((resolve) => resolve());
    pendingResolversRef.current.clear();
    setPollingIds({});
    setRawTransactions(getInitialSyntheticTransactions());
    setSelectedTxId(null);
    setSearchQuery('');
    setStatusFilter('ALL');
    setTypeFilter('ALL');
  }, []);

  return (
    <TransactionContext.Provider
      value={{
        transactions: evaluatedTransactions,
        filteredTransactions,
        searchQuery,
        setSearchQuery,
        statusFilter,
        setStatusFilter,
        typeFilter,
        setTypeFilter,
        clearFilters,
        selectedTxId,
        selectTransaction,
        selectedTransaction,
        isPolling,
        simulateTelemetryPoll,
        resetToMockData,
        statusCounts,
      }}
    >
      {children}
    </TransactionContext.Provider>
  );
}

export function useTransactions() {
  const context = useContext(TransactionContext);
  if (!context) {
    throw new Error('useTransactions must be used within a TransactionProvider');
  }
  return context;
}
