'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { EvaluatedTransaction } from '@/context/TransactionContext';
import { useSupport } from '@/context/SupportContext';
import { useAnalytics } from '@/context/AnalyticsContext';
import { CaseCategory } from '@/support/types';
import {
  suggestCaseCategory,
  CATEGORY_METADATA,
} from '@/support/category-suggestions';
import {
  X,
  FileQuestion,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  ShieldAlert,
  Loader2,
  ExternalLink,
} from 'lucide-react';

interface CreateCaseModalProps {
  tx: EvaluatedTransaction;
  isOpen: boolean;
  onClose: () => void;
}

export function CreateCaseModal({ tx, isOpen, onClose }: CreateCaseModalProps) {
  const { createCase, isSubmitting } = useSupport();
  const { trackEvent } = useAnalytics();

  // Suggest initial category and draft subject based on evaluated state
  const suggestion = suggestCaseCategory(
    tx.guidance.canonicalState,
    tx.amount,
    tx.counterparty
  );

  const [category, setCategory] = useState<CaseCategory>(suggestion.category);
  const [subject, setSubject] = useState(suggestion.defaultSubject);
  const [description, setDescription] = useState('');
  const [isReviewStep, setIsReviewStep] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [createdCaseId, setCreatedCaseId] = useState<string | null>(null);

  // Track when creation flow starts
  useEffect(() => {
    if (isOpen && !createdCaseId) {
      trackEvent(
        'SUPPORT_CASE_FLOW_STARTED',
        {
          suggestedCategory: suggestion.category,
          canonicalState: tx.guidance.canonicalState,
        },
        tx.id
      );
    }
  }, [isOpen, createdCaseId, suggestion.category, trackEvent, tx.id, tx.guidance.canonicalState]);

  if (!isOpen) return null;

  const handleNextToReview = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (subject.trim().length < 5) {
      setErrorMessage('Subject must be at least 5 characters.');
      return;
    }

    if (description.trim().length < 10) {
      setErrorMessage('Please provide at least 10 characters describing the issue.');
      return;
    }

    setIsReviewStep(true);
  };

  const handleFinalSubmit = async () => {
    setErrorMessage(null);

    const result = await createCase({
      transactionId: tx.id,
      utr: tx.utr,
      category,
      subject,
      description,
    });

    if (result.success && result.caseId) {
      setCreatedCaseId(result.caseId);
      trackEvent(
        'SUPPORT_CASE_CREATED',
        {
          selectedCategory: category,
          isSuggestedCategory: category === suggestion.category,
        },
        tx.id,
        result.caseId
      );
    } else {
      setErrorMessage(result.error || 'Failed to create case. Please try again.');
    }
  };

  const resetAndClose = () => {
    // If closed without completing, track explicit cancellation
    if (!createdCaseId) {
      trackEvent('SUPPORT_CASE_CANCELLED', { exitStep: isReviewStep ? 'REVIEW' : 'DRAFT' }, tx.id);
    }
    setIsReviewStep(false);
    setErrorMessage(null);
    setCreatedCaseId(null);
    setDescription('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xl max-w-lg w-full overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950 text-white">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-slate-850 text-[#F79E1B] flex items-center justify-center font-bold border border-slate-700">
              <FileQuestion className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-white text-sm">
                {createdCaseId
                  ? 'Case Created Successfully'
                  : isReviewStep
                  ? 'Review & Confirm Case Details'
                  : 'Raise Simulated Support Case'}
              </h3>
              <p className="text-[11px] text-slate-400 font-mono">
                Pre-filled reference: <span className="font-bold text-slate-200">{tx.id}</span>
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={resetAndClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6">
          {/* Success State */}
          {createdCaseId ? (
            <div className="text-center py-4 space-y-4">
              <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-2xs">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div>
                <h4 className="text-base font-bold text-slate-950">
                  Synthetic Dispute Case Recorded
                </h4>
                <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto leading-relaxed">
                  Your simulated dispute has been registered under reference{' '}
                  <span className="font-mono font-bold text-slate-950 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-300">
                    {createdCaseId}
                  </span>.
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-left text-xs space-y-1.5 font-medium">
                <div className="flex justify-between">
                  <span className="text-slate-500">Linked UTR:</span>
                  <span className="font-mono font-bold text-slate-900 tabular-nums">{tx.utr}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Category:</span>
                  <span className="font-bold text-slate-900">
                    {CATEGORY_METADATA[category]?.label || category}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Initial Status:</span>
                  <span className="font-bold text-blue-700">OPEN</span>
                </div>
              </div>

              <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-2">
                <Link
                  href={`/support/${createdCaseId}`}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-slate-950 hover:bg-slate-850 rounded-lg shadow-2xs transition-colors border border-slate-800"
                >
                  <span>View Case Tracker</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
                <button
                  type="button"
                  onClick={resetAndClose}
                  className="w-full sm:w-auto px-4 py-2 text-xs font-semibold text-slate-700 hover:text-slate-950 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors border border-slate-200"
                >
                  Close
                </button>
              </div>
            </div>
          ) : isReviewStep ? (
            /* Review Step */
            <div className="space-y-4">
              <div className="p-3.5 rounded-xl bg-amber-50/70 border border-amber-200/80 text-xs text-amber-950">
                Please review your synthetic claim details before confirming submission.
              </div>

              <div className="divide-y divide-slate-100 text-xs space-y-2.5">
                <div className="flex justify-between pt-2">
                  <span className="text-slate-500 font-medium">Transaction ID:</span>
                  <span className="font-mono font-bold text-slate-950">{tx.id}</span>
                </div>
                <div className="flex justify-between pt-2">
                  <span className="text-slate-500 font-medium">Bank UTR:</span>
                  <span className="font-mono font-bold text-slate-950 tabular-nums">{tx.utr}</span>
                </div>
                <div className="flex justify-between pt-2">
                  <span className="text-slate-500 font-medium">Counterparty:</span>
                  <span className="font-bold text-slate-950">{tx.counterparty}</span>
                </div>
                <div className="flex justify-between pt-2">
                  <span className="text-slate-500 font-medium">Category:</span>
                  <span className="font-bold text-slate-900">
                    {CATEGORY_METADATA[category]?.label}
                  </span>
                </div>
                <div className="pt-2">
                  <span className="text-slate-500 block font-medium">Subject:</span>
                  <span className="font-bold text-slate-950 block mt-0.5">{subject}</span>
                </div>
                <div className="pt-2">
                  <span className="text-slate-500 block font-medium">Description:</span>
                  <p className="text-slate-700 bg-slate-50 p-3 rounded-lg border border-slate-200 mt-1 whitespace-pre-wrap leading-relaxed">
                    {description}
                  </p>
                </div>
              </div>

              {errorMessage && (
                <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700 font-medium">
                  {errorMessage}
                </div>
              )}

              <div className="pt-4 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsReviewStep(false)}
                  disabled={isSubmitting}
                  className="px-3.5 py-2 text-xs font-semibold text-slate-700 hover:text-slate-950 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors border border-slate-200"
                >
                  Back to Edit
                </button>
                <button
                  type="button"
                  onClick={handleFinalSubmit}
                  disabled={isSubmitting}
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-slate-950 hover:bg-slate-850 rounded-lg shadow-2xs transition-colors disabled:opacity-50 border border-slate-800"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Creating Case...</span>
                    </>
                  ) : (
                    <span>Confirm &amp; Create Case</span>
                  )}
                </button>
              </div>
            </div>
          ) : (
            /* Input Step */
            <form onSubmit={handleNextToReview} className="space-y-4">
              {/* Context Summary */}
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600 flex items-center justify-between">
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold tracking-wider">
                    Attached Evidence
                  </span>
                  <span className="font-bold text-slate-900">
                    {tx.counterparty} &bull; <span className="font-mono tabular-nums">₹{tx.amount.toLocaleString('en-IN')}</span>
                  </span>
                </div>
                <span className="font-mono text-[11px] font-bold text-slate-700 bg-white px-2 py-0.5 rounded border border-slate-200 tabular-nums">
                  UTR: {tx.utr}
                </span>
              </div>

              {/* Category Dropdown */}
              <div>
                <label
                  htmlFor="case-category"
                  className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1"
                >
                  Dispute Category
                </label>
                <select
                  id="case-category"
                  value={category}
                  onChange={(e) => setCategory(e.target.value as CaseCategory)}
                  className="w-full text-xs font-semibold py-2 px-3 bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-hidden focus:border-slate-800 focus:ring-2 focus:ring-slate-900/10 cursor-pointer shadow-2xs"
                >
                  {Object.entries(CATEGORY_METADATA).map(([catKey, meta]) => (
                    <option key={catKey} value={catKey}>
                      {meta.label}
                    </option>
                  ))}
                </select>
                <p className="text-[11px] text-slate-500 mt-1">
                  Suggested automatically based on recovery state: <em className="font-mono text-slate-700 font-semibold">{tx.guidance.canonicalState}</em>
                </p>
              </div>

              {/* Subject */}
              <div>
                <label
                  htmlFor="case-subject"
                  className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1"
                >
                  Subject / Summary
                </label>
                <input
                  id="case-subject"
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="Brief summary of the issue..."
                  className="w-full text-xs py-2 px-3 bg-white border border-slate-300 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:border-slate-800 focus:ring-2 focus:ring-slate-900/10 font-medium"
                />
              </div>

              {/* Description */}
              <div>
                <label
                  htmlFor="case-description"
                  className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1"
                >
                  Issue Description
                </label>
                <textarea
                  id="case-description"
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Detail what happened (e.g. money debited from account, cashier stated soundbox was silent, no receipt provided)..."
                  className="w-full text-xs py-2 px-3 bg-white border border-slate-300 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:border-slate-800 focus:ring-2 focus:ring-slate-900/10 font-medium"
                />
                <span className="text-[10px] text-slate-400 font-medium">Minimum 10 characters</span>
              </div>

              {errorMessage && (
                <div className="p-2.5 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700 font-medium">
                  {errorMessage}
                </div>
              )}

              {/* Disclaimer */}
              <div className="text-[11px] text-slate-400 italic">
                * Simulated support demo. No real banking dispute or external complaint is created.
              </div>

              {/* Action Buttons */}
              <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={resetAndClose}
                  className="px-3.5 py-2 text-xs font-semibold text-slate-700 hover:text-slate-950 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors border border-slate-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-slate-950 hover:bg-slate-850 rounded-lg shadow-2xs transition-colors border border-slate-800"
                >
                  <span>Review Case</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
