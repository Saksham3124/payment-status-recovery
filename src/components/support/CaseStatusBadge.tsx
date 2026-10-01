'use client';

import React from 'react';
import { CaseStatus } from '@/support/types';
import { Clock, ShieldAlert, CheckCircle2, Lock } from 'lucide-react';

export function CaseStatusBadge({ status }: { status: CaseStatus }) {
  switch (status) {
    case 'OPEN':
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-800 border border-blue-200/90 shadow-2xs">
          <Clock className="w-3.5 h-3.5 text-blue-600 shrink-0" />
          <span>Open</span>
        </span>
      );

    case 'UNDER_REVIEW':
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#F79E1B]/15 text-amber-950 border border-[#F79E1B]/40 shadow-2xs">
          <ShieldAlert className="w-3.5 h-3.5 text-[#F79E1B] shrink-0" />
          <span>Under Bank Review</span>
        </span>
      );

    case 'RESOLVED':
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200/90 shadow-2xs">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
          <span>Resolved</span>
        </span>
      );

    case 'CLOSED':
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-300 shadow-2xs">
          <Lock className="w-3.5 h-3.5 text-slate-500 shrink-0" />
          <span>Closed</span>
        </span>
      );
  }
}
