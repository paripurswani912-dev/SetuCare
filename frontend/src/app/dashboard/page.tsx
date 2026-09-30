'use client';

import React, { useState, useEffect } from 'react';
import { useLanguage } from '@/lib/languageContext';
import { apiFetch } from '@/lib/api';
import { DashboardSummary, SLABreach, Notification } from '@/types';
import { PageHeader } from '@/components/PageHeader';
import { PriorityBadge } from '@/components/PriorityBadge';
import { LoadingSkeleton } from '@/components/LoadingSkeleton';
import { toast } from '@/lib/toast';
import {
  LayoutDashboard,
  RefreshCw,
  AlertTriangle,
  Zap,
  Activity,
  CheckCircle2,
  Clock,
  Bell,
  ArrowUpRight,
  BarChart2,
  PieChart as PieIcon,
  Building,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';

export default function DashboardPage() {
  const { t } = useLanguage();

  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [breaches, setBreaches] = useState<SLABreach[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [isEscalating, setIsEscalating] = useState<boolean>(false);

  const fetchDashboardData = async (showSpinner = false) => {
    if (showSpinner) setIsRefreshing(true);
    try {
      const [sumData, breachData, notifData] = await Promise.all([
        apiFetch<DashboardSummary>('/dashboard/summary'),
        apiFetch<SLABreach[]>('/dashboard/sla-breaches'),
        apiFetch<Notification[]>('/notifications?recipient=DISTRICT&limit=20'),
      ]);

      setSummary(sumData);
      setBreaches(breachData || []);
      setNotifications(notifData || []);
    } catch {
      // handled
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  // Auto refresh every 20s
  useEffect(() => {
    const interval = setInterval(() => {
      fetchDashboardData(false);
    }, 20000);
    return () => clearInterval(interval);
  }, []);

  const handleRunSlaCheck = async () => {
    setIsEscalating(true);
    try {
      const res = await apiFetch<any>('/sla/check', { method: 'POST' });
      toast.success('SLA Check Executed', `${res.count || 0} unacknowledged referrals escalated.`);
      fetchDashboardData();
    } catch {
      // handled
    } finally {
      setIsEscalating(false);
    }
  };

  if (isLoading || !summary) {
    return (
      <div className="space-y-6">
        <PageHeader title="Loading District Dashboard..." />
        <LoadingSkeleton type="cards" />
        <LoadingSkeleton type="table" />
      </div>
    );
  }

  // Prepare chart data
  const statusOrder = [
    'CREATED',
    'ACKNOWLEDGED',
    'APPOINTMENT',
    'CHECKED_IN',
    'IN_CONSULTATION',
    'TREATMENT',
    'COUNTER_REFERRAL',
    'FOLLOW_UP',
    'COMPLETED',
  ];

  const statusChartData = statusOrder.map((st) => ({
    name: st.replace(/_/g, ' '),
    count: summary.by_status[st as keyof typeof summary.by_status] || 0,
  }));

  const priorityChartData = [
    { name: 'EMERGENCY', value: summary.by_priority.EMERGENCY || 0, color: '#e11d48' },
    { name: 'URGENT', value: summary.by_priority.URGENT || 0, color: '#f59e0b' },
    { name: 'ROUTINE', value: summary.by_priority.ROUTINE || 0, color: '#0f766e' },
  ];

  const facilityChartData = Object.entries(summary.by_facility || {}).map(([facility, count]) => ({
    facility,
    count,
  }));

  return (
    <div className="space-y-8">
      <PageHeader
        title={t('pageDistrictDashboard')}
        description="District Health Officer monitoring console. Live SLA compliance tracking & automated escalation dispatch."
        action={
          <div className="flex items-center gap-2">
            <button
              onClick={() => fetchDashboardData(true)}
              disabled={isRefreshing}
              className="p-2.5 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 text-slate-700 font-bold text-xs flex items-center gap-1.5 shadow-2xs"
            >
              <RefreshCw className={`w-4 h-4 text-teal-700 ${isRefreshing ? 'animate-spin' : ''}`} />
              <span>Refresh Data</span>
            </button>

            <button
              onClick={handleRunSlaCheck}
              disabled={isEscalating}
              className="px-4 py-2.5 bg-rose-600 text-white font-extrabold text-xs rounded-xl hover:bg-rose-700 shadow-md flex items-center gap-1.5"
            >
              <Zap className={`w-4 h-4 ${isEscalating ? 'animate-spin' : ''}`} />
              <span>Run SLA Check & Escalate</span>
            </button>
          </div>
        }
      />

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {/* Card 1 */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-2xs space-y-2">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Total Referrals</span>
          <div className="text-2xl font-black text-slate-900 font-mono">{summary.total_referrals}</div>
          <span className="text-[11px] text-slate-500 font-medium">Recorded in District</span>
        </div>

        {/* Card 2 */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-2xs space-y-2">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Completion Rate</span>
          <div className="text-2xl font-black text-emerald-600 font-mono">{summary.completion_rate}%</div>
          <span className="text-[11px] text-slate-500 font-medium">{summary.completed} Closed Journeys</span>
        </div>

        {/* Card 3 */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-2xs space-y-2">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">SLA Compliance</span>
          <div className="text-2xl font-black text-teal-700 font-mono">{summary.sla_compliance_rate}%</div>
          <span className="text-[11px] text-slate-500 font-medium">Ack Within Target SLA</span>
        </div>

        {/* Card 4 */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-2xs space-y-2">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Avg Ack Time</span>
          <div className="text-2xl font-black text-indigo-900 font-mono">{summary.avg_ack_minutes}m</div>
          <span className="text-[11px] text-slate-500 font-medium">Intake Response Speed</span>
        </div>

        {/* Card 5 */}
        <div className="bg-white p-5 rounded-3xl border-2 border-rose-400 shadow-xs space-y-2">
          <span className="text-xs font-bold text-rose-700 uppercase tracking-wider block">SLA Breaches</span>
          <div className="text-2xl font-black text-rose-600 font-mono">{summary.sla_breached}</div>
          <span className="text-[11px] text-rose-800 font-semibold">Unacknowledged Overdue</span>
        </div>

        {/* Card 6 */}
        <div className="bg-white p-5 rounded-3xl border border-amber-300 shadow-2xs space-y-2">
          <span className="text-xs font-bold text-amber-700 uppercase tracking-wider block">Escalated</span>
          <div className="text-2xl font-black text-amber-600 font-mono">{summary.escalated}</div>
          <span className="text-[11px] text-amber-800 font-semibold">Flagged to DHO</span>
        </div>
      </div>

      {/* Analytics Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Chart 1: Lifecycle Funnel (Status Drop-offs) */}
        <div className="lg:col-span-2 bg-white rounded-3xl p-6 border border-slate-200 shadow-2xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <BarChart2 className="w-4 h-4 text-teal-700" />
              Referral Lifecycle Drop-Off Funnel
            </h3>
            <span className="text-xs text-slate-400 font-mono">Status Count</span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={statusChartData} margin={{ top: 10, right: 10, left: -20, bottom: 40 }}>
                <XAxis dataKey="name" angle={-35} textAnchor="end" tick={{ fontSize: 10, fill: '#64748b' }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 10, fill: '#64748b' }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderRadius: '12px', color: '#fff', fontSize: '12px' }}
                />
                <Bar dataKey="count" fill="#0f766e" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Priority Distribution Donut */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-2xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <PieIcon className="w-4 h-4 text-teal-700" />
              Priority Distribution
            </h3>
          </div>

          <div className="h-64 w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={priorityChartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {priorityChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderRadius: '12px', color: '#fff', fontSize: '12px' }}
                />
                <Legend verticalAlign="bottom" height={36} iconType="circle" />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* SLA Breaches Table & Notifications Feed Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* SLA Breaches Table */}
        <div className="lg:col-span-2 bg-white rounded-3xl p-6 border border-slate-200 shadow-2xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-600" />
              SLA Breached Referrals Requiring Immediate Action
            </h3>
            <span className="px-2.5 py-0.5 rounded-full bg-rose-100 text-rose-800 font-mono font-bold text-xs">
              {breaches.length} Breaches
            </span>
          </div>

          {breaches.length === 0 ? (
            <div className="text-xs text-slate-500 italic p-6 bg-slate-50 rounded-2xl text-center border border-slate-200">
              No active SLA breaches! All incoming referrals acknowledged on target time.
            </div>
          ) : (
            <div className="overflow-x-auto divide-y divide-slate-100 border border-slate-200 rounded-2xl">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-50 text-[11px] font-bold text-slate-500 uppercase">
                    <th className="p-3">Referral ID</th>
                    <th className="p-3">Facility</th>
                    <th className="p-3">Priority</th>
                    <th className="p-3">SLA Deadline</th>
                    <th className="p-3">Overdue</th>
                    <th className="p-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {breaches.map((b) => (
                    <tr key={b.referral_id} className="hover:bg-rose-50/50">
                      <td className="p-3 font-mono font-extrabold text-teal-900">#{b.referral_id}</td>
                      <td className="p-3 font-bold text-slate-900">{b.to_facility}</td>
                      <td className="p-3"><PriorityBadge priority={b.priority} size="sm" /></td>
                      <td className="p-3 font-mono text-slate-500">
                        {b.sla_deadline ? new Date(b.sla_deadline).toLocaleTimeString() : 'N/A'}
                      </td>
                      <td className="p-3 font-bold text-rose-700 font-mono">{b.hours_overdue}h Overdue</td>
                      <td className="p-3">
                        {b.escalated ? (
                          <span className="px-2 py-0.5 bg-amber-100 text-amber-800 font-bold rounded text-[10px]">
                            ESCALATED
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 bg-rose-100 text-rose-800 font-bold rounded text-[10px]">
                            UNACKNOWLEDGED
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Live Notifications Feed */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-2xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Bell className="w-4 h-4 text-teal-700" />
              District Escalation Feed
            </h3>
          </div>

          {notifications.length === 0 ? (
            <div className="text-xs text-slate-500 italic p-6 bg-slate-50 rounded-2xl text-center">
              No recent notifications dispatched to DISTRICT.
            </div>
          ) : (
            <div className="space-y-3 max-h-[350px] overflow-y-auto pr-1">
              {notifications.map((n) => (
                <div key={n.notification_id} className="p-3 bg-slate-50 rounded-2xl border border-slate-200 space-y-1 text-xs">
                  <div className="flex items-center justify-between font-bold text-slate-900">
                    <span className="px-1.5 py-0.5 bg-rose-100 text-rose-800 rounded font-mono text-[10px]">
                      {n.channel}
                    </span>
                    <span className="text-slate-400 font-normal font-mono text-[10px]">
                      {new Date(n.created_at).toLocaleTimeString()}
                    </span>
                  </div>
                  <p className="text-slate-800 font-medium leading-tight">{n.message}</p>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
