import React from 'react';
import { Priority } from '@/types';
import { AlertOctagon, AlertTriangle, Clock } from 'lucide-react';

interface PriorityBadgeProps {
  priority: Priority | string;
  size?: 'sm' | 'md' | 'lg';
}

export const PriorityBadge: React.FC<PriorityBadgeProps> = ({ priority, size = 'md' }) => {
  const norm = (priority || 'ROUTINE').toUpperCase();

  const getStyle = () => {
    switch (norm) {
      case 'EMERGENCY':
        return {
          bg: 'bg-rose-100 text-rose-800 border-rose-300 animate-pulse-subtle font-bold',
          icon: <AlertOctagon className="w-3.5 h-3.5 text-rose-600 shrink-0" />,
        };
      case 'URGENT':
        return {
          bg: 'bg-amber-100 text-amber-800 border-amber-300 font-semibold',
          icon: <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />,
        };
      case 'ROUTINE':
      default:
        return {
          bg: 'bg-slate-100 text-slate-700 border-slate-300 font-medium',
          icon: <Clock className="w-3.5 h-3.5 text-slate-500 shrink-0" />,
        };
    }
  };

  const style = getStyle();

  const sizeStyles = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-1 text-xs',
    lg: 'px-3 py-1.5 text-sm',
  };

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border shadow-2xs ${style.bg} ${sizeStyles[size]}`}
    >
      {style.icon}
      <span>{norm}</span>
    </span>
  );
};
