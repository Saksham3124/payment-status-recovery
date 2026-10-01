'use client';

import React from 'react';
import { AlertTriangle, Info } from 'lucide-react';

export function SyntheticBanner() {
  return (
    <aside aria-label="Synthetic Demo Notice" className="bg-[#121824] border-b border-slate-800 text-slate-300 px-4 py-2 text-xs font-medium">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 text-center sm:text-left">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-[#F79E1B] animate-pulse shrink-0" />
          <span className="text-[11px] sm:text-xs tracking-wide">
            <strong className="font-bold text-white uppercase tracking-wider text-[10px] sm:text-[11px] bg-slate-900 px-1.5 py-0.5 rounded border border-slate-700 mr-1.5">
              Portfolio Prototype
            </strong>
            Synthetic Data Only &bull; Zero Real Payment Processing &bull; Independent Simulation Engine
          </span>
        </div>
        <div className="hidden md:flex items-center gap-2 text-slate-400 text-[11px] font-mono shrink-0">
          <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500" />
          <span>Local Simulation Environment</span>
        </div>
      </div>
    </aside>
  );
}
