'use client';

import React, { useState, useEffect } from 'react';
import { useLanguage } from '@/lib/languageContext';
import { apiFetch, getCurrentUser } from '@/lib/api';
import { MedicineInventory } from '@/types';
import { PageHeader } from '@/components/PageHeader';
import { StatusBadge } from '@/components/StatusBadge';
import { LoadingSkeleton } from '@/components/LoadingSkeleton';
import { EmptyState } from '@/components/EmptyState';
import { toast } from '@/lib/toast';
import { Pill, Plus, Search, Building, PackageCheck, Send } from 'lucide-react';

export default function MedicinesPage() {
  const { t } = useLanguage();

  const [inventory, setInventory] = useState<MedicineInventory[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [filterFacility, setFilterFacility] = useState<string>('');

  // Search Lookup State
  const [searchMedName, setSearchMedName] = useState<string>('');
  const [searchFacName, setSearchFacName] = useState<string>('CHC Bavla');
  const [lookupResult, setLookupResult] = useState<MedicineInventory | null>(null);

  // New Stock Form
  const [showAddForm, setShowAddForm] = useState<boolean>(false);
  const [newMedName, setNewMedName] = useState<string>('Amoxicillin 500mg');
  const [newFacName, setNewFacName] = useState<string>('CHC Bavla');
  const [newQty, setNewQty] = useState<number>(100);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Dispense Dialog State
  const [dispenseItem, setDispenseItem] = useState<MedicineInventory | null>(null);
  const [prescriptionId, setPrescriptionId] = useState<string>('1');
  const [dispenseQty, setDispenseQty] = useState<number>(10);
  const [isDispensing, setIsDispensing] = useState<boolean>(false);

  useEffect(() => {
    fetchInventory();
  }, [filterFacility]);

  const fetchInventory = async () => {
    setIsLoading(true);
    try {
      const queryStr = filterFacility ? `?facility_name=${encodeURIComponent(filterFacility)}` : '';
      const data = await apiFetch<MedicineInventory[]>(`/medicine-inventory/all${queryStr}`);
      setInventory(data || []);
    } catch {
      // handled
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddMedicine = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const payload = {
        medicine_name: newMedName.trim(),
        facility_name: newFacName.trim(),
        quantity: newQty,
      };

      await apiFetch<MedicineInventory>('/medicine-inventory/', {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      toast.success('Medicine Stock Added', `Added ${newQty} units of ${newMedName} at ${newFacName}`);
      setShowAddForm(false);
      fetchInventory();
    } catch {
      // handled
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLookup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchMedName.trim() || !searchFacName.trim()) return;
    try {
      const res = await apiFetch<MedicineInventory>(
        `/medicine-inventory/?medicine_name=${encodeURIComponent(searchMedName.trim())}&facility_name=${encodeURIComponent(searchFacName.trim())}`
      );
      setLookupResult(res);
    } catch {
      // handled
    }
  };

  const handleDispenseMedicine = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!dispenseItem) return;
    setIsDispensing(true);
    try {
      const user = getCurrentUser();
      const pId = parseInt(prescriptionId, 10);

      const res = await apiFetch<any>(
        `/medicine-inventory/${dispenseItem.inventory_id}/dispense?prescription_id=${pId}&quantity=${dispenseQty}&dispensed_by=${encodeURIComponent(user)}`,
        { method: 'PATCH' }
      );

      toast.success(
        'Medicine Dispensed',
        `Dispensed ${dispenseQty} units. Remaining stock: ${res.remaining_stock}`
      );
      setDispenseItem(null);
      fetchInventory();
    } catch {
      // handled
    } finally {
      setIsDispensing(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title={t('pageMedicineInventory')}
        description="e-Aushadhi DVDMS Drug Management System integration for tracking essential medicine availability and prescription dispensing."
        action={
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="px-4 py-2.5 bg-teal-700 text-white font-bold text-xs rounded-xl hover:bg-teal-800 flex items-center gap-1.5 shadow-md"
          >
            <Plus className="w-4 h-4" /> Add Drug Inventory
          </button>
        }
      />

      {/* Lookup & Add Form Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Lookup Box */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-2xs space-y-4">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
            <Search className="w-4 h-4 text-teal-700" />
            Quick Medicine Stock Lookup
          </h3>
          <form onSubmit={handleLookup} className="space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <input
                type="text"
                placeholder="Medicine Name..."
                value={searchMedName}
                onChange={(e) => setSearchMedName(e.target.value)}
                className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold"
              />
              <input
                type="text"
                placeholder="Facility Name..."
                value={searchFacName}
                onChange={(e) => setSearchFacName(e.target.value)}
                className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold"
              />
            </div>
            <button
              type="submit"
              className="w-full py-2 bg-slate-900 text-white font-bold text-xs rounded-xl hover:bg-slate-800"
            >
              Lookup e-Aushadhi Stock
            </button>
          </form>

          {lookupResult && (
            <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 space-y-1 text-xs">
              <div className="flex items-center justify-between font-bold text-slate-900">
                <span>{lookupResult.medicine_name}</span>
                <StatusBadge status={lookupResult.status} size="sm" />
              </div>
              <div className="text-slate-600">Facility: {lookupResult.facility_name}</div>
              <div className="font-mono font-bold text-teal-900">Quantity Available: {lookupResult.quantity}</div>
            </div>
          )}
        </div>

        {/* Add Form Card */}
        {showAddForm && (
          <form onSubmit={handleAddMedicine} className="bg-white rounded-3xl p-6 border-2 border-teal-500 shadow-md space-y-3">
            <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2">
              Add New Medicine Stock
            </h3>
            <div className="space-y-2">
              <input
                type="text"
                required
                placeholder="Medicine Name (e.g. Paracetamol 500mg)"
                value={newMedName}
                onChange={(e) => setNewMedName(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold"
              />
              <input
                type="text"
                required
                placeholder="Facility Name (e.g. CHC Bavla)"
                value={newFacName}
                onChange={(e) => setNewFacName(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold"
              />
              <input
                type="number"
                min="0"
                required
                placeholder="Quantity"
                value={newQty}
                onChange={(e) => setNewQty(parseInt(e.target.value, 10) || 0)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="px-3 py-1.5 text-xs text-slate-500 hover:text-slate-700"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-4 py-1.5 bg-teal-700 text-white font-bold text-xs rounded-xl hover:bg-teal-800 disabled:opacity-50"
              >
                {isSubmitting ? 'Saving...' : 'Add Stock'}
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Filter Bar */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-2xs flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
          <Building className="w-4 h-4 text-teal-700" />
          <span>Filter Stock by Facility:</span>
        </div>
        <input
          type="text"
          value={filterFacility}
          onChange={(e) => setFilterFacility(e.target.value)}
          placeholder="e.g. CHC Bavla..."
          className="px-3.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold w-64"
        />
      </div>

      {/* Table */}
      {isLoading ? (
        <LoadingSkeleton rows={5} type="table" />
      ) : inventory.length === 0 ? (
        <EmptyState
          icon={<Pill className="w-10 h-10 text-slate-400" />}
          title="No Medicine Inventory Records"
          description="No drug stock records match your facility filter."
        />
      ) : (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-2xs overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <th className="py-3.5 px-4">Inventory ID</th>
                <th className="py-3.5 px-4">Medicine Name</th>
                <th className="py-3.5 px-4">Facility Name</th>
                <th className="py-3.5 px-4">In-Stock Qty</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {inventory.map((inv) => (
                <tr key={inv.inventory_id} className="hover:bg-slate-50 transition-colors">
                  <td className="py-4 px-4 font-mono font-bold text-slate-900">#{inv.inventory_id}</td>
                  <td className="py-4 px-4 font-bold text-slate-900">{inv.medicine_name}</td>
                  <td className="py-4 px-4 font-semibold text-slate-700">{inv.facility_name}</td>
                  <td className="py-4 px-4 font-mono font-extrabold text-sm text-teal-900">{inv.quantity}</td>
                  <td className="py-4 px-4">
                    <StatusBadge status={inv.status} />
                  </td>
                  <td className="py-4 px-4 text-right">
                    <button
                      onClick={() => setDispenseItem(inv)}
                      disabled={inv.quantity === 0}
                      className="px-3 py-1.5 bg-slate-900 text-white font-bold text-xs rounded-xl hover:bg-slate-800 disabled:opacity-40 shadow-2xs"
                    >
                      Dispense Medicine
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Dispense Modal */}
      {dispenseItem && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <form onSubmit={handleDispenseMedicine} className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-extrabold text-slate-900 text-base flex items-center gap-2">
                <PackageCheck className="w-5 h-5 text-teal-700" /> Dispense Medicine Stock
              </h3>
              <button
                type="button"
                onClick={() => setDispenseItem(null)}
                className="text-xs text-slate-400 hover:text-slate-600"
              >
                Close
              </button>
            </div>

            <div className="bg-slate-50 p-3.5 rounded-2xl space-y-1 text-xs">
              <div className="font-bold text-slate-900 text-sm">{dispenseItem.medicine_name}</div>
              <div className="text-slate-600">Facility: {dispenseItem.facility_name}</div>
              <div className="font-mono font-bold text-teal-900">Current Stock: {dispenseItem.quantity} units</div>
            </div>

            <div className="space-y-3">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Prescription ID *</label>
                <input
                  type="number"
                  required
                  value={prescriptionId}
                  onChange={(e) => setPrescriptionId(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Quantity to Dispense *</label>
                <input
                  type="number"
                  min="1"
                  max={dispenseItem.quantity}
                  required
                  value={dispenseQty}
                  onChange={(e) => setDispenseQty(parseInt(e.target.value, 10) || 1)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDispenseItem(null)}
                className="px-4 py-2 bg-slate-100 text-slate-700 font-bold text-xs rounded-xl"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isDispensing}
                className="px-5 py-2 bg-teal-700 text-white font-bold text-xs rounded-xl hover:bg-teal-800 disabled:opacity-50"
              >
                {isDispensing ? 'Dispensing...' : 'Confirm Dispense'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
