import type { Metadata } from 'next';
import './globals.css';
import { TransactionProvider } from '@/context/TransactionContext';
import { SupportProvider } from '@/context/SupportContext';
import { AnalyticsProvider } from '@/context/AnalyticsContext';
import { SyntheticBanner } from '@/components/common/SyntheticBanner';
import { Navbar } from '@/components/common/Navbar';

export const metadata: Metadata = {
  title: 'Payment Status Recovery | UPI Uncertainty Engine',
  description:
    'Product Management portfolio project modeling deterministic payment status recovery, multi-party telemetry, and double-debit prevention in UPI.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="antialiased bg-slate-50 text-slate-900 flex flex-col min-h-screen">
        <AnalyticsProvider>
          <TransactionProvider>
            <SupportProvider>
              <SyntheticBanner />
              <Navbar />
              <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {children}
              </main>
            <footer className="bg-slate-950 border-t border-slate-800 py-8 text-xs text-slate-400">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
                <div className="space-y-1">
                  <div className="flex items-center justify-center sm:justify-start gap-2">
                    <div className="w-5 h-5 rounded-md bg-gradient-to-tr from-emerald-600 to-indigo-600 flex items-center justify-center text-white shrink-0 shadow-sm">
                      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 21L3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5" />
                      </svg>
                    </div>
                    <span className="font-bold text-slate-200 tracking-tight">
                      Payment Status Recovery &bull; PM Case Study &amp; Working Engine
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Regulatory benchmark: RBI Harmonisation of Turn Around Time (TAT) &bull; Circular RBI/2019-20/67 DPSS.CO.PD No.629/02.01.014/2019-20.
                  </p>
                  <p className="text-[10px] text-slate-400">
                    Independent PM portfolio case study modeling real-time payment settlement telemetry. Simulated prototype with synthetic data. Zero live financial transactions.
                  </p>
                </div>
                <div className="text-[11px] font-mono text-slate-400 bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-lg shrink-0">
                  100% Synthetic Fixtures &bull; Zero Live UPI Integrations
                </div>
              </div>
            </footer>
          </SupportProvider>
        </TransactionProvider>
        </AnalyticsProvider>
      </body>
    </html>
  );
}
