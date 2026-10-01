'use client';

import React, { createContext, useContext, useState, useMemo, useCallback } from 'react';
import { SupportCase, CaseStatus, CreateCaseInput } from '@/support/types';
import { validateCaseTransition } from '@/support/case-transitions';
import { INITIAL_SYNTHETIC_CASES, getInitialSyntheticCases } from '@/mock/synthetic-support-cases';
import { useTransactions } from '@/context/TransactionContext';

interface SupportContextType {
  cases: SupportCase[];
  filteredCases: SupportCase[];
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  statusFilter: 'ALL' | CaseStatus;
  setStatusFilter: (s: 'ALL' | CaseStatus) => void;
  clearFilters: () => void;
  isSubmitting: boolean;
  createCase: (input: CreateCaseInput) => Promise<{ success: boolean; caseId?: string; error?: string }>;
  transitionCaseStatus: (caseId: string, toStatus: CaseStatus, note: string) => { success: boolean; error?: string };
  getCaseById: (caseId: string) => SupportCase | undefined;
  getCasesForTransaction: (txId: string) => SupportCase[];
  resetCasesToDefault: () => void;
}

const SupportContext = createContext<SupportContextType | undefined>(undefined);

export function SupportProvider({ children }: { children: React.ReactNode }) {
  const [cases, setCases] = useState<SupportCase[]>(() => getInitialSyntheticCases());
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | CaseStatus>('ALL');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { transactions } = useTransactions();

  const getCaseById = useCallback(
    (caseId: string) => cases.find((c) => c.id === caseId),
    [cases]
  );

  const getCasesForTransaction = useCallback(
    (txId: string) => cases.filter((c) => c.transactionId === txId),
    [cases]
  );

  /**
   * Creates a synthetic support case.
   * - Prevents duplicate clicks via isSubmitting guard.
   * - Validates non-empty fields.
   * - Prevents orphan cases by verifying transaction exists.
   */
  const createCase = useCallback(
    async (input: CreateCaseInput): Promise<{ success: boolean; caseId?: string; error?: string }> => {
      if (isSubmitting) {
        return { success: false, error: 'A case creation request is already being processed.' };
      }

      // Input Validation
      if (!input.transactionId || !input.utr) {
        return { success: false, error: 'Transaction ID and UTR are required.' };
      }

      // Check transaction existence to prevent orphan cases
      const txExists = transactions.some((t) => t.id === input.transactionId);
      if (!txExists) {
        return {
          success: false,
          error: `Transaction ${input.transactionId} does not exist. Cannot create orphaned support case.`,
        };
      }

      if (!input.subject || input.subject.trim().length < 5) {
        return { success: false, error: 'Subject must be at least 5 characters.' };
      }

      if (!input.description || input.description.trim().length < 10) {
        return { success: false, error: 'Description must be at least 10 characters.' };
      }

      setIsSubmitting(true);

      // Simulate a realistic local delay (300ms)
      await new Promise((r) => setTimeout(r, 300));

      const now = new Date().toISOString();
      const newId = `CASE-${1000 + cases.length + 1}`;

      const newCase: SupportCase = {
        id: newId,
        transactionId: input.transactionId,
        utr: input.utr,
        category: input.category,
        subject: input.subject.trim(),
        description: input.description.trim(),
        status: 'OPEN',
        createdAt: now,
        updatedAt: now,
        isSimulated: true,
        history: [
          {
            id: `ACT-${newId}-1`,
            timestamp: now,
            action: 'CASE_CREATED',
            toStatus: 'OPEN',
            note: 'Customer initiated synthetic support inquiry referencing UTR.',
            actor: 'CUSTOMER',
          },
        ],
      };

      setCases((prev) => [newCase, ...prev]);
      setIsSubmitting(false);

      return { success: true, caseId: newId };
    },
    [cases.length, isSubmitting, transactions]
  );

  /**
   * Advances case status through pure lifecycle validator.
   */
  const transitionCaseStatus = useCallback(
    (caseId: string, toStatus: CaseStatus, note: string): { success: boolean; error?: string } => {
      const existing = cases.find((c) => c.id === caseId);
      if (!existing) {
        return { success: false, error: `Case ${caseId} not found.` };
      }

      const transition = validateCaseTransition(existing.status, toStatus);
      if (!transition.allowed) {
        return { success: false, error: transition.reason };
      }

      const now = new Date().toISOString();
      const activityId = `ACT-${caseId}-${existing.history.length + 1}`;

      setCases((prev) =>
        prev.map((c) => {
          if (c.id !== caseId) return c;
          return {
            ...c,
            status: toStatus,
            updatedAt: now,
            history: [
              ...c.history,
              {
                id: activityId,
                timestamp: now,
                action: 'STATUS_ADVANCED',
                fromStatus: existing.status,
                toStatus,
                note: note || `Case transitioned from ${existing.status} to ${toStatus}.`,
                actor: 'SUPPORT_AGENT',
              },
            ],
          };
        })
      );

      return { success: true };
    },
    [cases]
  );

  const resetCasesToDefault = useCallback(() => {
    setCases(getInitialSyntheticCases());
    setSearchQuery('');
    setStatusFilter('ALL');
    setIsSubmitting(false);
  }, []);

  const clearFilters = useCallback(() => {
    setSearchQuery('');
    setStatusFilter('ALL');
  }, []);

  // Filtered cases for list views
  const filteredCases = useMemo(() => {
    return cases.filter((c) => {
      if (statusFilter !== 'ALL' && c.status !== statusFilter) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesId = c.id.toLowerCase().includes(q);
        const matchesTxId = c.transactionId.toLowerCase().includes(q);
        const matchesUtr = c.utr.toLowerCase().includes(q);
        const matchesSubject = c.subject.toLowerCase().includes(q);
        const matchesCategory = c.category.toLowerCase().includes(q);

        if (!matchesId && !matchesTxId && !matchesUtr && !matchesSubject && !matchesCategory) {
          return false;
        }
      }
      return true;
    });
  }, [cases, searchQuery, statusFilter]);

  return (
    <SupportContext.Provider
      value={{
        cases,
        filteredCases,
        searchQuery,
        setSearchQuery,
        statusFilter,
        setStatusFilter,
        clearFilters,
        isSubmitting,
        createCase,
        transitionCaseStatus,
        getCaseById,
        getCasesForTransaction,
        resetCasesToDefault,
      }}
    >
      {children}
    </SupportContext.Provider>
  );
}

export function useSupport() {
  const context = useContext(SupportContext);
  if (!context) {
    throw new Error('useSupport must be used within a SupportProvider');
  }
  return context;
}
