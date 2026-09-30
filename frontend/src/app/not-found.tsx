'use client';

import React from 'react';
import Link from 'next/link';
import { useLanguage } from '@/lib/languageContext';
import { FileQuestion, Home, Inbox, UserPlus, ArrowLeft, Activity } from 'lucide-react';

export default function NotFound() {
  const { t } = useLanguage();

  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center p-4 text-center">
      <div className="max-w-md w-full bg-white rounded-3xl p-8 border border-slate-200 shadow-xl space-y-6">
        
        {/* Animated 404 Badge & Icon */}
        <div className="relative mx-auto w-20 h-20 bg-teal-50 rounded-3xl border border-teal-200 flex items-center justify-center shadow-inner">
          <FileQuestion className="w-10 h-10 text-teal-700 animate-pulse" />
          <span className="absolute -top-2 -right-2 px-2 py-0.5 bg-rose-600 text-white text-[10px] font-mono font-extrabold rounded-full shadow-sm">
            404
          </span>
        </div>

        {/* Content */}
        <div className="space-y-2">
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Page or Record Not Found
          </h1>
          <p className="text-xs text-slate-500 leading-relaxed max-w-sm mx-auto">
            The page, referral journey, or patient record you are searching for does not exist or may have been transferred.
          </p>
        </div>

        {/* Quick Action Buttons */}
        <div className="space-y-2 pt-2">
          <Link
            href="/"
            className="w-full py-3 px-4 bg-teal-700 hover:bg-teal-800 text-white font-bold text-xs rounded-xl shadow-md flex items-center justify-center gap-2 transition-all"
          >
            <Home className="w-4 h-4" /> Return to Home Platform
          </Link>

          <div className="grid grid-cols-2 gap-2 pt-1">
            <Link
              href="/referrals"
              className="py-2.5 px-3 bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold text-xs rounded-xl border border-slate-200 flex items-center justify-center gap-1.5"
            >
              <Inbox className="w-3.5 h-3.5 text-teal-700" /> Referral Inbox
            </Link>

            <Link
              href="/patients/new"
              className="py-2.5 px-3 bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold text-xs rounded-xl border border-slate-200 flex items-center justify-center gap-1.5"
            >
              <UserPlus className="w-3.5 h-3.5 text-teal-700" /> Register Patient
            </Link>
          </div>
        </div>

        {/* System Branding Footer */}
        <div className="pt-4 border-t border-slate-100 flex items-center justify-center gap-1.5 text-[11px] text-slate-400 font-medium">
          <Activity className="w-3.5 h-3.5 text-teal-700" />
          <span>SetuCare Interoperable Health Network</span>
        </div>

      </div>
    </div>
  );
}
