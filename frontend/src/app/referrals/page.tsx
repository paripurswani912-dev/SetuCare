'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useLanguage } from '@/lib/languageContext';
import { apiFetch } from '@/lib/api';
import { Referral, Priority, ReferralStatus } from '@/types';
import { PageHeader } from '@/components/PageHeader';
import { StatusBadge } from '@/components/StatusBadge';
import { PriorityBadge } from '@/components/PriorityBadge';
import { LoadingSkeleton } from '@/components/LoadingSkeleton';
import { EmptyState } from '@/components/EmptyState';
import {
  Inbox,
  Filter,
  RefreshCw,
  Clock,
  AlertTriangle,
  ArrowRight,
  Building,
  Search,
} from 'lucide-react';

export default function ReferralInboxPage() {
  const { t } = useLanguage();
  const router = useRouter();

  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [filterStatus, setFilterStatus] = useState<string>('');
  const [filterPriority, setFilterPriority] = useState<string>('');
  const [filterFacility, setFilterFacility] = useState<string>('');
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  const fetchReferrals = async (showSpinner = false) => {
    if (showSpinner) setIsRefreshing(true);
    try {
      const params = new URLSearchParams();
      if (filterStatus) params.append('status', filterStatus);
      if (filterPriority) params.append('priority', filterPriority);
      if (filterFacility) params.append('facility', filterFacility);

      const queryStr = params.toString() ? `?${params.toString()}` : '';
      const data = await apiFetch<Referral[]>(`/referrals/${queryStr}`);

      // Sort EMERGENCY first, then newest referral_id
      const priorityWeight: Record<string, number> = { EMERGENCY: 1, URGENT: 2, ROUTINE: 3 };
      const sorted = (data || []).sort((a, b) => {
        const pA = priorityWeight[a.priority?.toUpperCase()] || 3;
        const pB = priorityWeight[b.priority?.toUpperCase()] || 3;
        if (pA !== pB) return pA - pB;
        return b.referral_id - a.referral_id;
      });

      setReferrals(sorted);
    } catch {
      // handled
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchReferrals();
  }, [filterStatus, filterPriority, filterFacility]);

  // Auto-refresh every 15s
  useEffect(() => {
    const interval = setInterval(() => {
      fetchReferrals(false);
    }, 15000);
    return () => clearInterval(interval);
  }, [filterStatus, filterPriority, filterFacility]);

  // SLA Overdue calculator
  const isOverdue = (r: Referral) => {
    if (!r.sla_deadline || r.status !== 'CREATED') return false;
    return new Date() > new Date(r.sla_deadline);
  };

  const getSlaText = (r: Referral) => {
    if (!r.sla_deadline) return 'No SLA';
    const now = new Date();
    const deadline = new Date(r.sla_deadline);
    const diffMs = deadline.getTime() - now.getTime();

    if (r.status !== 'CREATED') {
      return 'On Track';
    }

    if (diffMs < 0) {
      const hoursOver = Math.abs(Math.round(diffMs / (1000 * 60 * 60)));
      return `Overdue ${hoursOver}h`;
    }

    const minsLeft = Math.round(diffMs / (1000 * 60));
    if (minsLeft < 60) return `${minsLeft}m left`;
    const hoursLeft = Math.round(minsLeft / 60);
    return `${hoursLeft}h left`;
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title={t('pageReferralInbox')}
        description="Live referral queue sorted by emergency triage level. Auto-refreshes every 15s."
        action={
          <div className="flex items-center gap-2">
            <button
              onClick={() => fetchReferrals(true)}
              disabled={isRefreshing}
              className="p-2.5 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 text-slate-700 font-bold text-xs flex items-center gap-1.5 shadow-2xs"
            >
              <RefreshCw className={`w-4 h-4 text-teal-700 ${isRefreshing ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>
            <Link
              href="/referrals/new"
              className="px-4 py-2.5 bg-teal-700 text-white font-bold text-xs rounded-xl hover:bg-teal-800 shadow-md flex items-center gap-1.5"
            >
              + New Referral
            </Link>
          </div>
        }
      />

      {/* Filter Bar */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-2xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
          <Filter className="w-4 h-4 text-teal-700" />
          <span>Filters:</span>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Status filter */}
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-teal-500"
          >
            <option value="">All Statuses</option>
            <option value="CREATED">CREATED</option>
            <option value="ACKNOWLEDGED">ACKNOWLEDGED</option>
            <option value="APPOINTMENT">APPOINTMENT</option>
            <option value="CHECKED_IN">CHECKED_IN</option>
            <option value="IN_CONSULTATION">IN_CONSULTATION</option>
            <option value="TREATMENT">TREATMENT</option>
            <option value="COUNTER_REFERRAL">COUNTER_REFERRAL</option>
            <option value="FOLLOW_UP">FOLLOW_UP</option>
            <option value="COMPLETED">COMPLETED</option>
          </select>

          {/* Priority filter */}
          <select
            value={filterPriority}
            onChange={(e) => setFilterPriority(e.target.value)}
            className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-teal-500"
          >
            <option value="">All Priorities</option>
            <option value="EMERGENCY">EMERGENCY</option>
            <option value="URGENT">URGENT</option>
            <option value="ROUTINE">ROUTINE</option>
          </select>

          {/* Facility filter */}
          <input
            type="text"
            value={filterFacility}
            onChange={(e) => setFilterFacility(e.target.value)}
            placeholder="Filter by facility..."
            className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-teal-500"
          />

          {(filterStatus || filterPriority || filterFacility) && (
            <button
              onClick={() => {
                setFilterStatus('');
                setFilterPriority('');
                setFilterFacility('');
              }}
              className="text-xs text-rose-600 hover:underline font-bold"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Main Content */}
      {isLoading ? (
        <LoadingSkeleton rows={5} type="table" />
      ) : referrals.length === 0 ? (
        <EmptyState
          icon={<Inbox className="w-10 h-10 text-slate-400" />}
          title="No referrals found"
          description="No referral records match your active search filters."
          action={
            <Link
              href="/referrals/new"
              className="px-4 py-2 bg-teal-700 text-white font-bold text-xs rounded-xl hover:bg-teal-800 shadow-xs"
            >
              Create New Referral
            </Link>
          }
        />
      ) : (
        <>
          {/* Desktop Table View (md+) */}
          <div className="hidden md:block bg-white rounded-3xl border border-slate-200 shadow-2xs overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  <th className="py-3.5 px-4">Referral ID</th>
                  <th className="py-3.5 px-4">Patient</th>
                  <th className="py-3.5 px-4">Route (From ➔ To)</th>
                  <th className="py-3.5 px-4">Service</th>
                  <th className="py-3.5 px-4">Priority</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4">SLA State</th>
                  <th className="py-3.5 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {referrals.map((r) => {
                  const overdue = isOverdue(r);

                  return (
                    <tr
                      key={r.referral_id}
                      onClick={() => router.push(`/referrals/${r.referral_id}`)}
                      className={`hover:bg-teal-50/50 cursor-pointer transition-colors ${
                        r.priority === 'EMERGENCY' ? 'bg-rose-50/30' : ''
                      }`}
                    >
                      <td className="py-4 px-4 font-mono font-extrabold text-teal-900">
                        #{r.referral_id}
                      </td>

                      <td className="py-4 px-4 font-bold text-slate-900">
                        Patient #{r.patient_id}
                      </td>

                      <td className="py-4 px-4 text-slate-700 font-medium">
                        <div className="flex items-center gap-1.5">
                          <span className="truncate max-w-[120px]">{r.from_facility}</span>
                          <span className="text-slate-400">➔</span>
                          <span className="font-bold text-slate-900 truncate max-w-[140px]">{r.to_facility}</span>
                        </div>
                      </td>

                      <td className="py-4 px-4 text-slate-600 truncate max-w-[150px]">
                        {r.service_required}
                      </td>

                      <td className="py-4 px-4">
                        <PriorityBadge priority={r.priority} />
                      </td>

                      <td className="py-4 px-4">
                        <StatusBadge status={r.status} />
                      </td>

                      <td className="py-4 px-4">
                        <div className="flex items-center gap-1.5">
                          {overdue ? (
                            <span className="px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 font-extrabold text-[11px] animate-pulse flex items-center gap-1">
                              <AlertTriangle className="w-3 h-3" /> Overdue
                            </span>
                          ) : r.escalated ? (
                            <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 font-bold text-[11px] flex items-center gap-1">
                              <AlertTriangle className="w-3 h-3" /> Escalated
                            </span>
                          ) : (
                            <span className="text-slate-500 font-mono text-[11px]">
                              {getSlaText(r)}
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="py-4 px-4 text-right">
                        <span className="text-teal-700 font-bold text-xs hover:underline inline-flex items-center gap-1">
                          Track <ArrowRight className="w-3.5 h-3.5" />
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards View (<md) */}
          <div className="md:hidden space-y-3">
            {referrals.map((r) => {
              const overdue = isOverdue(r);

              return (
                <div
                  key={r.referral_id}
                  onClick={() => router.push(`/referrals/${r.referral_id}`)}
                  className={`p-4 bg-white rounded-2xl border border-slate-200 shadow-2xs space-y-3 active:bg-slate-50 ${
                    r.priority === 'EMERGENCY' ? 'border-l-4 border-l-rose-500' : ''
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-extrabold text-sm text-teal-800">
                      Referral #{r.referral_id}
                    </span>
                    <PriorityBadge priority={r.priority} size="sm" />
                  </div>

                  <div className="text-xs text-slate-800 font-semibold flex items-center justify-between">
                    <span>Patient #{r.patient_id}</span>
                    <StatusBadge status={r.status} size="sm" />
                  </div>

                  <div className="text-xs text-slate-600 space-y-1 bg-slate-50 p-2.5 rounded-xl">
                    <div className="flex items-center gap-1 font-medium">
                      <Building className="w-3.5 h-3.5 text-slate-400" />
                      <span>{r.from_facility} ➔ {r.to_facility}</span>
                    </div>
                    <div className="text-[11px] text-slate-500 font-normal">
                      Service: {r.service_required}
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-1 border-t border-slate-100 text-xs">
                    <div>
                      {overdue ? (
                        <span className="text-rose-700 font-bold flex items-center gap-1">
                          <AlertTriangle className="w-3.5 h-3.5" /> SLA Overdue
                        </span>
                      ) : (
                        <span className="text-slate-500 font-mono">{getSlaText(r)}</span>
                      )}
                    </div>

                    <span className="text-teal-700 font-bold flex items-center gap-1">
                      View Journey <ArrowRight className="w-3.5 h-3.5" />
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
