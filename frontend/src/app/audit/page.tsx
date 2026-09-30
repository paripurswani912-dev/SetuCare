'use client';

import React, { useState, useEffect } from 'react';
import { useLanguage } from '@/lib/languageContext';
import { apiFetch } from '@/lib/api';
import { AuditLog } from '@/types';
import { PageHeader } from '@/components/PageHeader';
import { LoadingSkeleton } from '@/components/LoadingSkeleton';
import { EmptyState } from '@/components/EmptyState';
import { toast } from '@/lib/toast';
import { ShieldCheck, Download, Search, RefreshCw, Filter } from 'lucide-react';

export default function AuditPage() {
  const { t } = useLanguage();

  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filterReferralId, setFilterReferralId] = useState<string>('');
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  const fetchAuditLogs = async (showSpinner = false) => {
    if (showSpinner) setIsRefreshing(true);
    try {
      const queryStr = filterReferralId ? `?referral_id=${encodeURIComponent(filterReferralId)}&limit=100` : '?limit=100';
      const data = await apiFetch<AuditLog[]>(`/audit-logs${queryStr}`);
      setLogs(data || []);
    } catch {
      // handled
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchAuditLogs();
  }, [filterReferralId]);

  // Client-side search filtering
  const filteredLogs = logs.filter((log) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      log.action.toLowerCase().includes(q) ||
      log.actor.toLowerCase().includes(q) ||
      log.role.toLowerCase().includes(q) ||
      (log.details && log.details.toLowerCase().includes(q)) ||
      (log.referral_id && log.referral_id.toString().includes(q))
    );
  });

  const handleExportCSV = () => {
    if (filteredLogs.length === 0) return toast.warning('No Data', 'No logs to export.');

    const headers = ['Log ID', 'Timestamp', 'Referral ID', 'Action', 'Actor', 'Role', 'Details'];
    const rows = filteredLogs.map((l) => [
      l.log_id,
      new Date(l.created_at).toLocaleString(),
      l.referral_id || 'N/A',
      l.action,
      l.actor,
      l.role,
      `"${(l.details || '').replace(/"/g, '""')}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `SetuCare_AuditLog_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast.success('Export Complete', 'Audit log exported to CSV.');
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title={t('pageAuditLog')}
        description="Immutable system audit trail tracking all referral status transitions, ABDM consent events, and user actions."
        action={
          <div className="flex items-center gap-2">
            <button
              onClick={() => fetchAuditLogs(true)}
              disabled={isRefreshing}
              className="p-2.5 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 text-slate-700 font-bold text-xs flex items-center gap-1.5 shadow-2xs"
            >
              <RefreshCw className={`w-4 h-4 text-teal-700 ${isRefreshing ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>

            <button
              onClick={handleExportCSV}
              className="px-4 py-2.5 bg-slate-900 text-white font-bold text-xs rounded-xl hover:bg-slate-800 flex items-center gap-1.5 shadow-md"
            >
              <Download className="w-4 h-4" /> Export CSV
            </button>
          </div>
        }
      />

      {/* Filter & Search Bar */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-2xs flex flex-wrap items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search action, actor, role or details..."
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-teal-500"
          />
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
        </div>

        <div className="flex items-center gap-2">
          <label className="text-xs font-bold text-slate-600">Referral ID Filter:</label>
          <input
            type="text"
            value={filterReferralId}
            onChange={(e) => setFilterReferralId(e.target.value)}
            placeholder="e.g. 101"
            className="w-28 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-teal-500"
          />
        </div>
      </div>

      {/* Table */}
      {isLoading ? (
        <LoadingSkeleton rows={8} type="table" />
      ) : filteredLogs.length === 0 ? (
        <EmptyState
          icon={<ShieldCheck className="w-10 h-10 text-slate-400" />}
          title="No Audit Logs Found"
          description="No system audit records match your query."
        />
      ) : (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-2xs overflow-hidden">
          <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between text-xs font-bold text-slate-700">
            <span>Audit Records ({filteredLogs.length})</span>
            <span className="text-slate-400 font-normal">Last 100 System Events</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  <th className="py-3.5 px-4">Log ID</th>
                  <th className="py-3.5 px-4">Timestamp</th>
                  <th className="py-3.5 px-4">Referral ID</th>
                  <th className="py-3.5 px-4">Action</th>
                  <th className="py-3.5 px-4">Actor</th>
                  <th className="py-3.5 px-4">Role</th>
                  <th className="py-3.5 px-4">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {filteredLogs.map((l) => (
                  <tr key={l.log_id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-400">#{l.log_id}</td>
                    <td className="py-3.5 px-4 font-mono text-slate-500 text-[11px]">
                      {new Date(l.created_at).toLocaleString()}
                    </td>
                    <td className="py-3.5 px-4 font-mono font-extrabold text-teal-900">
                      {l.referral_id ? `#${l.referral_id}` : '-'}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="px-2 py-0.5 rounded bg-teal-100 text-teal-800 font-bold font-mono text-[11px]">
                        {l.action}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-bold text-slate-900">{l.actor}</td>
                    <td className="py-3.5 px-4 text-slate-600 font-semibold">{l.role}</td>
                    <td className="py-3.5 px-4 font-mono text-slate-600 max-w-xs truncate">
                      {l.details || '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
