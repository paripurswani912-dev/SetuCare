'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useLanguage } from '@/lib/languageContext';
import { apiFetch } from '@/lib/api';
import { QueueItem } from '@/types';
import { PageHeader } from '@/components/PageHeader';
import { PriorityBadge } from '@/components/PriorityBadge';
import { LoadingSkeleton } from '@/components/LoadingSkeleton';
import { EmptyState } from '@/components/EmptyState';
import { Clock, RefreshCw, AlertOctagon, Filter, ArrowRight } from 'lucide-react';

export default function QueuePage() {
  const { t } = useLanguage();
  const router = useRouter();

  const [resourceType, setResourceType] = useState<string>('OPD');
  const [resourceId, setResourceId] = useState<string>('1');
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  const fetchQueue = async (showSpinner = false) => {
    if (showSpinner) setIsRefreshing(true);
    try {
      const data = await apiFetch<QueueItem[]>(
        `/referrals/queue?resource_type=${encodeURIComponent(resourceType)}&resource_id=${encodeURIComponent(resourceId)}`
      );
      setQueue(data || []);
    } catch {
      // handled
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchQueue();
  }, [resourceType, resourceId]);

  // Poll every 10s
  useEffect(() => {
    const interval = setInterval(() => {
      fetchQueue(false);
    }, 10000);
    return () => clearInterval(interval);
  }, [resourceType, resourceId]);

  return (
    <div className="space-y-6">
      <PageHeader
        title={t('pageLiveQueue')}
        description="Real-time checked-in patient queue prioritized by clinical severity. Auto-updates every 10s."
        action={
          <button
            onClick={() => fetchQueue(true)}
            disabled={isRefreshing}
            className="px-4 py-2.5 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 text-slate-700 font-bold text-xs flex items-center gap-1.5 shadow-2xs"
          >
            <RefreshCw className={`w-4 h-4 text-teal-700 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span>Refresh Queue</span>
          </button>
        }
      />

      {/* Resource Selection Filter */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-2xs flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
          <Filter className="w-4 h-4 text-teal-700" />
          <span>Queue Resource Selection:</span>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <label className="text-xs font-bold text-slate-600">Resource Type:</label>
            <select
              value={resourceType}
              onChange={(e) => setResourceType(e.target.value)}
              className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-teal-500"
            >
              <option value="OPD">OPD Consultation</option>
              <option value="ICU Bed">ICU Bed</option>
              <option value="Ambulance">Ambulance Service</option>
              <option value="Diagnostic">Diagnostic Lab / Scan</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <label className="text-xs font-bold text-slate-600">Resource ID:</label>
            <input
              type="text"
              value={resourceId}
              onChange={(e) => setResourceId(e.target.value)}
              placeholder="e.g. 1"
              className="w-20 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>
        </div>
      </div>

      {/* Main Queue List */}
      {isLoading ? (
        <LoadingSkeleton rows={5} type="table" />
      ) : queue.length === 0 ? (
        <EmptyState
          icon={<Clock className="w-10 h-10 text-slate-400" />}
          title="No Patients Checked In"
          description={`There are currently no patients checked in for '${resourceType}' (ID #${resourceId}).`}
        />
      ) : (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-2xs overflow-hidden">
          <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between text-xs font-bold text-slate-700">
            <span>Live Queue Priority List</span>
            <span className="px-2.5 py-0.5 bg-teal-100 text-teal-800 rounded-full font-mono">
              {queue.length} Patients Waiting
            </span>
          </div>

          <div className="divide-y divide-slate-100">
            {queue.map((item) => {
              const isEmergency = item.priority === 'EMERGENCY';

              return (
                <div
                  key={item.referral_id}
                  onClick={() => router.push(`/referrals/${item.referral_id}`)}
                  className={`p-4 flex items-center justify-between gap-4 cursor-pointer transition-colors ${
                    isEmergency
                      ? 'bg-rose-50/80 hover:bg-rose-100/80 border-l-4 border-l-rose-600'
                      : 'hover:bg-teal-50/50'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    {/* Position Badge */}
                    <div
                      className={`w-10 h-10 rounded-2xl flex items-center justify-center font-black text-sm font-mono shadow-2xs ${
                        isEmergency
                          ? 'bg-rose-600 text-white animate-pulse'
                          : 'bg-slate-900 text-white'
                      }`}
                    >
                      #{item.queue_position}
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-sm text-slate-900">
                          Referral #{item.referral_id}
                        </span>
                        <span className="text-xs text-slate-500 font-semibold">
                          (Patient #{item.patient_id})
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 font-medium">
                        Service: {item.service_required}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <PriorityBadge priority={item.priority} />
                    <ArrowRight className="w-4 h-4 text-slate-400" />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
