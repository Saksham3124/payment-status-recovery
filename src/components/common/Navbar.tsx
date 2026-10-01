'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { RefreshCw, Check, ArrowLeftRight, CreditCard } from 'lucide-react';
import { useTransactions } from '@/context/TransactionContext';
import { useSupport } from '@/context/SupportContext';
import { useAnalytics } from '@/context/AnalyticsContext';

export function Navbar() {
  const pathname = usePathname();
  const { resetToMockData } = useTransactions();
  const { resetCasesToDefault } = useSupport();
  const { resetAnalytics } = useAnalytics();
  const [resetFeedback, setResetFeedback] = useState(false);

  const handleResetAll = () => {
    resetToMockData();
    resetCasesToDefault();
    resetAnalytics(true);
    setResetFeedback(true);
    setTimeout(() => setResetFeedback(false), 1200);
  };

  return (
    <header className="bg-slate-950 border-b border-slate-800 sticky top-0 z-30 shadow-md backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-3 group transition-transform duration-200 hover:scale-[1.01]">
            {/* Payment Clearinghouse Brand Logo */}
            <div className="relative w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 via-teal-600 to-indigo-600 p-[1.5px] shadow-sm shrink-0 group-hover:shadow-emerald-500/20 transition-all duration-300">
              <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center text-emerald-400 group-hover:bg-slate-900 transition-colors">
                <ArrowLeftRight className="w-4 h-4 text-emerald-400 group-hover:rotate-180 transition-transform duration-500 ease-in-out" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-white text-sm sm:text-base tracking-tight group-hover:text-emerald-400 transition-colors duration-200">
                  PAYMENT STATUS RECOVERY
                </span>
                <span className="text-[10px] font-mono font-bold tracking-wider uppercase px-1.5 py-0.5 rounded bg-slate-900 text-emerald-400 border border-slate-800">
                  UPI UNCERTAINTY ENGINE
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-normal leading-none mt-0.5">
                Financial Clearinghouse Prototype &bull; Multi-Party Telemetry
              </p>
            </div>
          </Link>

          <nav className="hidden md:flex items-center gap-1.5 pl-6 border-l border-slate-800 text-xs sm:text-sm font-medium">
            <Link
              href="/"
              className={`px-3 py-1.5 rounded-md transition-all ${
                pathname === '/'
                  ? 'bg-slate-900 text-white font-semibold border border-slate-700/80 shadow-xs'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900/60'
              }`}
            >
              Transactions
            </Link>
            <Link
              href="/support"
              className={`px-3 py-1.5 rounded-md transition-all ${
                pathname.startsWith('/support')
                  ? 'bg-slate-900 text-white font-semibold border border-slate-700/80 shadow-xs'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900/60'
              }`}
            >
              Support Cases
            </Link>
            <Link
              href="/analytics"
              className={`px-3 py-1.5 rounded-md transition-all ${
                pathname.startsWith('/analytics')
                  ? 'bg-slate-900 text-white font-semibold border border-slate-700/80 shadow-xs'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900/60'
              }`}
            >
              Product Analytics
            </Link>
          </nav>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleResetAll}
            type="button"
            disabled={resetFeedback}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md border transition-all ${
              resetFeedback
                ? 'bg-emerald-950/80 text-emerald-300 border-emerald-700/70 shadow-xs'
                : 'text-slate-300 bg-slate-900 hover:bg-slate-850 hover:text-white border-slate-700 hover:border-slate-500'
            }`}
            title="Reset synthetic data to default state"
          >
            {resetFeedback ? (
              <Check className="w-3.5 h-3.5 text-emerald-400 animate-in zoom-in-50" />
            ) : (
              <RefreshCw className="w-3.5 h-3.5 text-slate-400" />
            )}
            <span>{resetFeedback ? 'Demo Data Restored' : 'Reset Demo Data'}</span>
          </button>
        </div>
      </div>
    </header>
  );
}
