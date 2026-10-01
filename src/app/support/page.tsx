'use client';

import React from 'react';
import Link from 'next/link';
import { useSupport } from '@/context/SupportContext';
import { CaseStatus } from '@/support/types';
import { CATEGORY_METADATA } from '@/support/category-suggestions';
import { CaseStatusBadge } from '@/components/support/CaseStatusBadge';
import { formatDateTime } from '@/lib/formatters';
import {
  FileQuestion,
  Search,
  X,
  Filter,
  ArrowUpRight,
  ShieldCheck,
  SearchX,
  PlusCircle,
} from 'lucide-react';

const STATUS_FILTERS: { label: string; value: 'ALL' | CaseStatus }[] = [
  { label: 'All Cases', value: 'ALL' },
  { label: 'Open', value: 'OPEN' },
  { label: 'Under Review', value: 'UNDER_REVIEW' },
  { label: 'Resolved', value: 'RESOLVED' },
  { label: 'Closed', value: 'CLOSED' },
];

export default function SupportCaseListPage() {
  const {
    cases,
    filteredCases,
    searchQuery,
    setSearchQuery,
    statusFilter,
    setStatusFilter,
    clearFilters,
  } = useSupport();

  const isFiltered = searchQuery !== '' || statusFilter !== 'ALL';

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-3 border-b border-slate-200 animate-fade-in">
        <div>
          <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full text-xs font-mono font-semibold bg-slate-900 text-slate-200 border border-slate-800 mb-2 shadow-2xs">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse shrink-0" />
            <span>SIMULATED DISPUTE &amp; SUPPORT TRACKING</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-950 tracking-tight">
            Support Cases &amp; Dispute Inquiries
          </h1>
          <p className="text-sm text-slate-600 mt-1 max-w-2xl leading-relaxed">
            Customer support escalation lifecycle for uncertain or failed transactions. Inquiries operate strictly within local simulation and do not mutate core banking ledger telemetry.
          </p>
        </div>

        <Link
          href="/"
          className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-slate-900 bg-white hover:bg-slate-50 border border-slate-300 rounded-lg shadow-2xs transition-all duration-200 hover:scale-[1.02] active:scale-95 shrink-0"
        >
          <span>Find Transaction to Dispute</span>
          <ArrowUpRight className="w-3.5 h-3.5 text-slate-500" />
        </Link>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-xl border border-slate-200/90 p-4 shadow-2xs space-y-3 animate-fade-in animate-delay-1">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by Case ID (CASE-1...), Transaction ID, UTR, or keywords..."
              className="w-full pl-9 pr-9 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:bg-white focus:border-slate-800 focus:ring-2 focus:ring-slate-900/10 transition-all font-medium"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Status Filter Segmented Control */}
          <div className="inline-flex rounded-lg border border-slate-200 p-0.5 bg-slate-100 text-xs shrink-0 shadow-inner">
            {STATUS_FILTERS.map((f) => (
              <button
                key={f.value}
                type="button"
                onClick={() => setStatusFilter(f.value)}
                className={`px-3 py-1.5 rounded-md font-semibold transition-all duration-200 ease-out transform active:scale-95 ${
                  statusFilter === f.value
                    ? 'bg-slate-900 text-white shadow-xs scale-[1.02]'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          {isFiltered && (
            <button
              type="button"
              onClick={clearFilters}
              className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-bold text-red-600 bg-red-50 hover:bg-red-100 rounded-lg border border-red-200/80 transition-all duration-200 hover:scale-[1.02] active:scale-95 shrink-0 shadow-2xs"
            >
              <X className="w-3.5 h-3.5" />
              <span>Clear</span>
            </button>
          )}
        </div>

        <div className="flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-100">
          <div>
            Showing <span className="font-mono font-bold text-slate-900 tabular-nums">{filteredCases.length}</span> of{' '}
            <span className="font-mono font-bold text-slate-900 tabular-nums">{cases.length}</span> simulated cases
          </div>
          {isFiltered && (
            <div className="text-amber-500 font-bold flex items-center gap-1 text-[11px] uppercase tracking-wider">
              <Filter className="w-3 h-3" />
              <span>Filtered</span>
            </div>
          )}
        </div>
      </div>

      {/* Cases List */}
      {filteredCases.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200/90 p-12 text-center shadow-2xs">
          <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
            <SearchX className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-slate-900">No support cases found</h3>
          <p className="text-xs sm:text-sm text-slate-500 max-w-sm mx-auto mt-1 leading-relaxed">
            No synthetic cases match your current filters. Adjust your query or view transactions to create a new dispute case.
          </p>
          <div className="mt-4 flex items-center justify-center gap-2">
            {isFiltered && (
              <button
                type="button"
                onClick={clearFilters}
                className="px-3.5 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors border border-slate-200"
              >
                Reset Filters
              </button>
            )}
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white bg-slate-950 hover:bg-slate-850 rounded-lg shadow-2xs transition-colors"
            >
              <span>Go to Transactions</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200/90 shadow-2xs overflow-hidden animate-fade-in animate-delay-2">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-[#121824] border-b border-slate-800 text-[11px] font-bold text-slate-300 uppercase tracking-wider">
                <tr>
                  <th scope="col" className="px-5 py-3.5">Case Reference</th>
                  <th scope="col" className="px-5 py-3.5">Linked Transaction &amp; UTR</th>
                  <th scope="col" className="px-5 py-3.5">Category &amp; Subject</th>
                  <th scope="col" className="px-5 py-3.5">Status</th>
                  <th scope="col" className="px-5 py-3.5">Created</th>
                  <th scope="col" className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredCases.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50/90 transition-all duration-200">
                    <td className="px-5 py-4 align-top whitespace-nowrap">
                      <div className="font-mono text-xs font-bold text-slate-950">{c.id}</div>
                      <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">Simulated Case</span>
                    </td>

                    <td className="px-5 py-4 align-top whitespace-nowrap">
                      <Link
                        href={`/tx/${c.transactionId}`}
                        className="font-mono text-xs font-bold text-slate-900 hover:text-amber-600 underline flex items-center gap-1 transition-colors"
                      >
                        <span>{c.transactionId}</span>
                        <ArrowUpRight className="w-3 h-3 text-slate-400" />
                      </Link>
                      <div className="text-[11px] font-mono text-slate-500 tabular-nums mt-0.5">
                        UTR: {c.utr}
                      </div>
                    </td>

                    <td className="px-5 py-4 align-top max-w-sm">
                      <span className="inline-block text-[10px] font-bold uppercase tracking-wider text-slate-700 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                        {CATEGORY_METADATA[c.category]?.label || c.category}
                      </span>
                      <h4 className="font-bold text-slate-900 text-xs mt-1 line-clamp-1" title={c.subject}>
                        {c.subject}
                      </h4>
                      <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-1 leading-relaxed">
                        {c.description}
                      </p>
                    </td>

                    <td className="px-5 py-4 align-top whitespace-nowrap">
                      <CaseStatusBadge status={c.status} />
                    </td>

                    <td className="px-5 py-4 align-top whitespace-nowrap text-xs font-mono text-slate-500 tabular-nums">
                      {formatDateTime(c.createdAt)}
                    </td>

                    <td className="px-5 py-4 align-top text-right whitespace-nowrap">
                      <Link
                        href={`/support/${c.id}`}
                        className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-bold text-white bg-slate-950 hover:bg-slate-850 rounded-lg shadow-2xs transition-all duration-200 hover:scale-[1.02] active:scale-95 border border-slate-800"
                      >
                        <span>View Details</span>
                        <ArrowUpRight className="w-3.5 h-3.5" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
