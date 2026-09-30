'use client';

import React, { useState, useEffect } from 'react';
import { useLanguage } from '@/lib/languageContext';
import { apiFetch } from '@/lib/api';
import { Resource } from '@/types';
import { PageHeader } from '@/components/PageHeader';
import { StatusBadge } from '@/components/StatusBadge';
import { LoadingSkeleton } from '@/components/LoadingSkeleton';
import { EmptyState } from '@/components/EmptyState';
import { toast } from '@/lib/toast';
import { Boxes, Plus, RefreshCw, Building, Edit2, Check } from 'lucide-react';

export default function ResourcePage() {
  const { t } = useLanguage();

  const [resources, setResources] = useState<Resource[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [filterFacility, setFilterFacility] = useState<string>('');
  const [filterType, setFilterType] = useState<string>('');

  // New Resource Form
  const [showForm, setShowForm] = useState<boolean>(false);
  const [facilityName, setFacilityName] = useState<string>('CHC Bavla');
  const [resourceType, setResourceType] = useState<string>('ICU Bed');
  const [resourceName, setResourceName] = useState<string>('Ventilator Bed');
  const [quantity, setQuantity] = useState<number>(5);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Editing quantity state
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editQty, setEditQty] = useState<number>(0);

  useEffect(() => {
    fetchResources();
  }, [filterFacility, filterType]);

  const fetchResources = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (filterFacility) params.append('facility_name', filterFacility);
      if (filterType) params.append('resource_type', filterType);
      const queryStr = params.toString() ? `?${params.toString()}` : '';

      const data = await apiFetch<Resource[]>(`/resources/${queryStr}`);
      setResources(data || []);
    } catch {
      // handled
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateResource = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const payload = {
        facility_name: facilityName.trim(),
        resource_type: resourceType,
        resource_name: resourceName.trim(),
        quantity,
      };

      await apiFetch<Resource>('/resources/', {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      toast.success('Resource Added', `Added ${quantity} ${resourceName} at ${facilityName}`);
      setShowForm(false);
      fetchResources();
    } catch {
      // handled
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateQuantity = async (id: number) => {
    if (editQty < 0) return toast.warning('Invalid Quantity', 'Quantity cannot be negative');
    try {
      await apiFetch<Resource>(`/resources/${id}/quantity?quantity=${editQty}`, {
        method: 'PATCH',
      });
      toast.success('Quantity Updated', `Resource quantity updated to ${editQty}`);
      setEditingId(null);
      fetchResources();
    } catch {
      // handled
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title={t('pageResourceAvailability')}
        description="Manage ICU beds, ambulance fleets, and diagnostic equipment capacity across district health facilities."
        action={
          <button
            onClick={() => setShowForm(!showForm)}
            className="px-4 py-2.5 bg-teal-700 text-white font-bold text-xs rounded-xl hover:bg-teal-800 flex items-center gap-1.5 shadow-md"
          >
            <Plus className="w-4 h-4" /> Add Facility Resource
          </button>
        }
      />

      {/* New Resource Form Modal/Card */}
      {showForm && (
        <form onSubmit={handleCreateResource} className="bg-white rounded-3xl p-6 border-2 border-teal-500 shadow-md space-y-4 animate-in fade-in duration-200">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Boxes className="w-4 h-4 text-teal-700" />
              Register New Health Resource
            </h3>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="text-xs text-slate-400 hover:text-slate-600"
            >
              Cancel
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700">Facility Name *</label>
              <input
                type="text"
                required
                value={facilityName}
                onChange={(e) => setFacilityName(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700">Resource Type *</label>
              <select
                value={resourceType}
                onChange={(e) => setResourceType(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold"
              >
                <option value="ICU Bed">ICU Bed</option>
                <option value="Ambulance">Ambulance Service</option>
                <option value="Diagnostic">Diagnostic Lab / Scan</option>
                <option value="OPD">OPD Consultation</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700">Resource Name *</label>
              <input
                type="text"
                required
                value={resourceName}
                onChange={(e) => setResourceName(e.target.value)}
                placeholder="e.g. Ventilator Bed #2"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700">Available Quantity *</label>
              <input
                type="number"
                min="0"
                required
                value={quantity}
                onChange={(e) => setQuantity(parseInt(e.target.value, 10) || 0)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold font-mono"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2.5 bg-teal-700 text-white font-bold text-xs rounded-xl hover:bg-teal-800 disabled:opacity-50 shadow-2xs"
            >
              {isSubmitting ? 'Saving...' : 'Save Resource'}
            </button>
          </div>
        </form>
      )}

      {/* Filters */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-2xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
          <Building className="w-4 h-4 text-teal-700" />
          <span>Filter Resources:</span>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <input
            type="text"
            value={filterFacility}
            onChange={(e) => setFilterFacility(e.target.value)}
            placeholder="Facility name..."
            className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium"
          />

          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold"
          >
            <option value="">All Resource Types</option>
            <option value="ICU Bed">ICU Bed</option>
            <option value="Ambulance">Ambulance Service</option>
            <option value="Diagnostic">Diagnostic Lab / Scan</option>
            <option value="OPD">OPD Consultation</option>
          </select>
        </div>
      </div>

      {/* Resources Table */}
      {isLoading ? (
        <LoadingSkeleton rows={5} type="table" />
      ) : resources.length === 0 ? (
        <EmptyState
          icon={<Boxes className="w-10 h-10 text-slate-400" />}
          title="No Resources Found"
          description="No resource items recorded for selected filters."
        />
      ) : (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-2xs overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <th className="py-3.5 px-4">Resource ID</th>
                <th className="py-3.5 px-4">Facility Name</th>
                <th className="py-3.5 px-4">Type</th>
                <th className="py-3.5 px-4">Resource Name</th>
                <th className="py-3.5 px-4">Quantity</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-right">Inline Update</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {resources.map((r) => (
                <tr key={r.resource_id} className="hover:bg-slate-50 transition-colors">
                  <td className="py-4 px-4 font-mono font-bold text-slate-900">#{r.resource_id}</td>
                  <td className="py-4 px-4 font-bold text-slate-900">{r.facility_name}</td>
                  <td className="py-4 px-4 font-medium text-slate-600">{r.resource_type}</td>
                  <td className="py-4 px-4 text-slate-800 font-semibold">{r.resource_name}</td>
                  <td className="py-4 px-4">
                    {editingId === r.resource_id ? (
                      <input
                        type="number"
                        min="0"
                        value={editQty}
                        onChange={(e) => setEditQty(parseInt(e.target.value, 10) || 0)}
                        className="w-16 px-2 py-1 bg-slate-50 border border-slate-300 rounded font-mono font-bold text-xs"
                      />
                    ) : (
                      <span className="font-mono font-extrabold text-sm text-slate-900">{r.quantity}</span>
                    )}
                  </td>
                  <td className="py-4 px-4">
                    <StatusBadge status={r.status} />
                  </td>
                  <td className="py-4 px-4 text-right">
                    {editingId === r.resource_id ? (
                      <button
                        onClick={() => handleUpdateQuantity(r.resource_id)}
                        className="px-2.5 py-1 bg-emerald-600 text-white font-bold text-xs rounded-lg hover:bg-emerald-700"
                      >
                        Save
                      </button>
                    ) : (
                      <button
                        onClick={() => {
                          setEditingId(r.resource_id);
                          setEditQty(r.quantity);
                        }}
                        className="text-teal-700 font-bold hover:underline flex items-center gap-1 text-xs ml-auto"
                      >
                        <Edit2 className="w-3.5 h-3.5" /> Edit Qty
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
