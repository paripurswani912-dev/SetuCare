import React from 'react';
import { ReferralStatus } from '@/types';

interface StatusBadgeProps {
  status: string;
  size?: 'sm' | 'md' | 'lg';
  showPulse?: boolean;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = 'md', showPulse = false }) => {
  const normStatus = (status || '').toUpperCase();

  const getStyle = (s: string) => {
    switch (s) {
      case 'CREATED':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'ACKNOWLEDGED':
        return 'bg-indigo-100 text-indigo-800 border-indigo-300';
      case 'APPOINTMENT':
        return 'bg-purple-100 text-purple-800 border-purple-300';
      case 'CHECKED_IN':
        return 'bg-cyan-100 text-cyan-800 border-cyan-300';
      case 'IN_CONSULTATION':
        return 'bg-teal-100 text-teal-800 border-teal-300';
      case 'TREATMENT':
        return 'bg-emerald-100 text-emerald-800 border-emerald-300';
      case 'COUNTER_REFERRAL':
        return 'bg-orange-100 text-orange-800 border-orange-300';
      case 'FOLLOW_UP':
        return 'bg-sky-100 text-sky-800 border-sky-300';
      case 'COMPLETED':
        return 'bg-green-100 text-green-800 border-green-300';
      case 'AVAILABLE':
      case 'GRANTED':
        return 'bg-emerald-100 text-emerald-800 border-emerald-300';
      case 'UNAVAILABLE':
      case 'OUT_OF_STOCK':
      case 'REVOKED':
      case 'EXPIRED':
        return 'bg-rose-100 text-rose-800 border-rose-300';
      case 'NOT_FOUND':
        return 'bg-amber-100 text-amber-800 border-amber-300';
      default:
        return 'bg-slate-100 text-slate-800 border-slate-300';
    }
  };

  const formattedName = normStatus.replace(/_/g, ' ');

  const sizeStyles = {
    sm: 'px-2 py-0.5 text-xs font-semibold',
    md: 'px-2.5 py-1 text-xs font-semibold',
    lg: 'px-3 py-1.5 text-sm font-bold',
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border transition-colors ${getStyle(
        normStatus
      )} ${sizeStyles[size]}`}
    >
      {showPulse && (
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-current opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-current"></span>
        </span>
      )}
      <span>{formattedName}</span>
    </span>
  );
};
