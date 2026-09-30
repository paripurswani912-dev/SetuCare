import React from 'react';

export const LoadingSkeleton: React.FC<{ rows?: number; type?: 'table' | 'cards' | 'detail' }> = ({
  rows = 4,
  type = 'table',
}) => {
  if (type === 'cards') {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 my-4 animate-pulse">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="p-5 bg-white rounded-2xl border border-slate-200 space-y-3">
            <div className="h-4 bg-slate-200 rounded w-1/3"></div>
            <div className="h-6 bg-slate-200 rounded w-3/4"></div>
            <div className="h-4 bg-slate-100 rounded w-1/2"></div>
            <div className="pt-2 flex justify-between">
              <div className="h-5 bg-slate-200 rounded-full w-20"></div>
              <div className="h-5 bg-slate-200 rounded-full w-24"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (type === 'detail') {
    return (
      <div className="space-y-6 animate-pulse my-4">
        <div className="p-6 bg-white rounded-2xl border border-slate-200 space-y-4">
          <div className="h-8 bg-slate-200 rounded w-1/3"></div>
          <div className="h-4 bg-slate-100 rounded w-2/3"></div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-12 bg-slate-100 rounded-xl"></div>
            ))}
          </div>
        </div>
        <div className="h-20 bg-white rounded-2xl border border-slate-200"></div>
        <div className="h-48 bg-white rounded-2xl border border-slate-200"></div>
      </div>
    );
  }

  return (
    <div className="w-full bg-white rounded-2xl border border-slate-200 overflow-hidden my-4 animate-pulse">
      <div className="h-12 bg-slate-100 border-b border-slate-200"></div>
      <div className="divide-y divide-slate-100">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="p-4 flex items-center justify-between gap-4">
            <div className="h-4 bg-slate-200 rounded w-1/6"></div>
            <div className="h-4 bg-slate-200 rounded w-1/4"></div>
            <div className="h-4 bg-slate-200 rounded w-1/5"></div>
            <div className="h-6 bg-slate-200 rounded-full w-20"></div>
          </div>
        ))}
      </div>
    </div>
  );
};
