'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { QRCodeSVG } from 'qrcode.react';
import { useLanguage } from '@/lib/languageContext';
import { apiFetch, ApiError } from '@/lib/api';
import { Patient, Priority, ResourceMatch, Referral } from '@/types';
import { PageHeader } from '@/components/PageHeader';
import { PriorityBadge } from '@/components/PriorityBadge';
import { LoadingSkeleton } from '@/components/LoadingSkeleton';
import { toast } from '@/lib/toast';
import {
  Send,
  Search,
  CheckCircle2,
  Boxes,
  Building,
  ArrowRight,
  ShieldAlert,
  Stethoscope,
  Sparkles,
  Clock,
  User,
} from 'lucide-react';

function CreateReferralContent() {
  const { t } = useLanguage();
  const router = useRouter();
  const searchParams = useSearchParams();

  // Patient selection state
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [patientSearch, setPatientSearch] = useState<string>('');
  const [searchResults, setSearchResults] = useState<Patient[]>([]);
  const [isSearchingPatient, setIsSearchingPatient] = useState<boolean>(false);

  // Form state
  const [fromFacility, setFromFacility] = useState<string>('PHC Sanand');
  const [toFacility, setToFacility] = useState<string>('CHC Bavla');
  const [reason, setReason] = useState<string>('Severe abdominal pain and acute fever requiring specialized diagnostic evaluation.');
  const [serviceRequired, setServiceRequired] = useState<string>('General Medicine / Ultrasound Diagnostic');
  const [priority, setPriority] = useState<Priority>('URGENT');
  const [priorityReason, setPriorityReason] = useState<string>('High fever with risk of complications');
  const [triageScore, setTriageScore] = useState<number>(6);
  const [resourceType, setResourceType] = useState<string>('OPD');
  const [resourceId, setResourceId] = useState<string>('');

  // Triage Helper checkboxes
  const [triageCheckboxes, setTriageCheckboxes] = useState({
    chestPain: false,
    breathingDiff: false,
    highFever: true,
    severeBleeding: false,
    pregnancyComp: false,
  });

  // Resource Match list
  const [matchedFacilities, setMatchedFacilities] = useState<ResourceMatch[]>([]);
  const [isMatchingResources, setIsMatchingResources] = useState<boolean>(false);

  // Status & Success state
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [consentErrorPatientId, setConsentErrorPatientId] = useState<number | null>(null);
  const [createdReferral, setCreatedReferral] = useState<Referral | null>(null);

  // Check URL query param patient_id
  useEffect(() => {
    const pid = searchParams.get('patient_id');
    if (pid) {
      fetchPatientById(parseInt(pid, 10));
    }
  }, [searchParams]);

  const fetchPatientById = async (pid: number) => {
    try {
      const p = await apiFetch<Patient>(`/patients/${pid}`);
      setSelectedPatient(p);
    } catch {
      // ignore
    }
  };

  const handlePatientSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!patientSearch.trim()) return;
    setIsSearchingPatient(true);
    try {
      const res = await apiFetch<Patient[]>(`/patients/?q=${encodeURIComponent(patientSearch)}`);
      setSearchResults(res || []);
    } catch {
      // handled
    } finally {
      setIsSearchingPatient(false);
    }
  };

  // When resource_type changes, fetch available facilities
  useEffect(() => {
    if (resourceType) {
      fetchMatchingResources(resourceType);
    }
  }, [resourceType]);

  const fetchMatchingResources = async (type: string) => {
    setIsMatchingResources(true);
    try {
      const res = await apiFetch<ResourceMatch[]>(`/resources/match?resource_type=${encodeURIComponent(type)}`);
      setMatchedFacilities(res || []);
    } catch {
      setMatchedFacilities([]);
    } finally {
      setIsMatchingResources(false);
    }
  };

  const handleTriageCheckboxChange = (key: keyof typeof triageCheckboxes) => {
    const updated = { ...triageCheckboxes, [key]: !triageCheckboxes[key] };
    setTriageCheckboxes(updated);

    let score = 2;
    if (updated.highFever) score += 2;
    if (updated.pregnancyComp) score += 3;
    if (updated.breathingDiff) score += 4;
    if (updated.chestPain) score += 5;
    if (updated.severeBleeding) score += 5;

    score = Math.min(score, 10);
    setTriageScore(score);

    if (score >= 8 || updated.chestPain || updated.severeBleeding) {
      setPriority('EMERGENCY');
      setPriorityReason('Critical clinical symptoms auto-triaged as Emergency');
    } else if (score >= 5 || updated.highFever || updated.pregnancyComp) {
      setPriority('URGENT');
      setPriorityReason('Moderate risk clinical symptoms triaged as Urgent');
    } else {
      setPriority('ROUTINE');
      setPriorityReason('Routine referral for outpatient evaluation');
    }
  };

  const handleSelectMatchedFacility = (m: ResourceMatch) => {
    setToFacility(m.facility_name);
    setResourceId(m.resource_id.toString());
    toast.info('Facility Selected', `Selected ${m.facility_name} (${m.available} ${resourceType}s available)`);
  };

  const handleSubmitReferral = async (e: React.FormEvent) => {
    e.preventDefault();
    setConsentErrorPatientId(null);

    if (!selectedPatient) {
      return toast.warning('Missing Patient', 'Please select or register a patient for referral.');
    }
    if (!toFacility.trim()) {
      return toast.warning('Missing Facility', 'Please enter receiving facility.');
    }

    setIsSubmitting(true);

    try {
      const payload = {
        patient_id: selectedPatient.patient_id,
        from_facility: fromFacility.trim(),
        to_facility: toFacility.trim(),
        reason: reason.trim(),
        service_required: serviceRequired.trim(),
        resource_type: resourceType,
        resource_id: resourceId ? resourceId : undefined,
        priority,
        priority_reason: priorityReason.trim(),
        triage_score: triageScore,
      };

      const result = await apiFetch<Referral>('/referrals/', {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      toast.success('Referral Created', `Referral #${result.referral_id} created with priority ${result.priority}.`);
      setCreatedReferral(result);
    } catch (err: any) {
      if (err instanceof ApiError && err.status === 403) {
        const detailStr = typeof err.detail === 'string' ? err.detail : JSON.stringify(err.detail);
        if (detailStr.toLowerCase().includes('consent')) {
          setConsentErrorPatientId(selectedPatient.patient_id);
        }
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const facilitySuggestions = [
    'PHC Sanand',
    'CHC Bavla',
    'District Hospital Ahmedabad',
    'Civil Hospital Ahmedabad',
    'Sub-District Hospital Dholka',
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <PageHeader
        title={t('pageNewReferral')}
        description="Create real-time referral, auto-match facility capacity, calculate triage scores, and enforce ABDM digital consent."
      />

      {/* Success Card with QR Code */}
      {createdReferral ? (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border-2 border-emerald-500 shadow-xl space-y-6 animate-in zoom-in-95 duration-200">
          <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
            <div className="p-3 bg-emerald-100 text-emerald-800 rounded-2xl">
              <CheckCircle2 className="w-8 h-8 text-emerald-600" />
            </div>
            <div>
              <span className="px-3 py-1 bg-emerald-100 text-emerald-900 rounded-full text-xs font-bold font-mono">
                Referral #{createdReferral.referral_id} Created
              </span>
              <h2 className="text-xl font-black text-slate-900 mt-1">
                Care Journey Initialized
              </h2>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2 space-y-3 text-sm">
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-600">Patient:</span>
                <span className="font-bold text-slate-900">
                  {selectedPatient?.name} (ID #{createdReferral.patient_id})
                </span>
              </div>

              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-600">Route:</span>
                <span className="font-semibold text-slate-800">
                  {createdReferral.from_facility} ➔ {createdReferral.to_facility}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-600">Priority:</span>
                <PriorityBadge priority={createdReferral.priority} />
              </div>

              <div className="flex items-center gap-2 text-rose-700 font-semibold text-xs">
                <Clock className="w-4 h-4" />
                <span>
                  SLA Deadline: {createdReferral.sla_deadline ? new Date(createdReferral.sla_deadline).toLocaleString() : 'N/A'}
                </span>
              </div>

              <p className="text-xs text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-200">
                <span className="font-bold block text-slate-800">Reason for Referral:</span>
                {createdReferral.reason}
              </p>
            </div>

            {/* QR Code Container */}
            <div className="flex flex-col items-center justify-center p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
              <div className="p-3 bg-white rounded-xl shadow-md border border-slate-200">
                {typeof window !== 'undefined' && (
                  <QRCodeSVG
                    value={`${window.location.origin}/track/${createdReferral.referral_id}`}
                    size={120}
                    level="H"
                  />
                )}
              </div>
              <span className="text-[11px] font-mono text-slate-500 font-bold">
                Scan for Public Patient Tracking
              </span>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
            <button
              onClick={() => {
                setCreatedReferral(null);
                setSelectedPatient(null);
              }}
              className="px-4 py-2.5 bg-slate-100 text-slate-700 font-bold text-xs rounded-xl hover:bg-slate-200"
            >
              + Create Another Referral
            </button>

            <button
              onClick={() => router.push(`/referrals/${createdReferral.referral_id}`)}
              className="px-6 py-3 bg-teal-700 text-white font-bold text-sm rounded-xl hover:bg-teal-800 shadow-md flex items-center gap-2"
            >
              Track Unified Referral Journey <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmitReferral} className="space-y-6">
          
          {/* 1. Patient Selection Box */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-2xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <User className="w-4 h-4 text-teal-700" />
                Select Patient For Referral
              </h2>
              {selectedPatient && (
                <button
                  type="button"
                  onClick={() => setSelectedPatient(null)}
                  className="text-xs text-rose-600 hover:text-rose-800 font-semibold"
                >
                  Change Patient
                </button>
              )}
            </div>

            {selectedPatient ? (
              <div className="p-4 bg-teal-50/60 rounded-2xl border border-teal-200 flex items-center justify-between">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2 font-bold text-slate-900 text-base">
                    <span>{selectedPatient.name}</span>
                    <span className="text-xs font-mono bg-teal-200 text-teal-900 px-2 py-0.5 rounded-full">
                      ID #{selectedPatient.patient_id}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600">
                    {selectedPatient.age} yrs • {selectedPatient.gender} • 📞 {selectedPatient.phone}
                    {selectedPatient.abha_id && ` • ABHA: ${selectedPatient.abha_id}`}
                  </p>
                </div>
                <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0" />
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={patientSearch}
                    onChange={(e) => setPatientSearch(e.target.value)}
                    placeholder="Search patient by Name, Phone, or ABHA ID..."
                    className="flex-1 px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 font-medium"
                  />
                  <button
                    type="button"
                    onClick={handlePatientSearch}
                    disabled={isSearchingPatient}
                    className="px-4 py-2.5 bg-slate-900 text-white font-bold text-xs rounded-xl hover:bg-slate-800 disabled:opacity-50"
                  >
                    {isSearchingPatient ? 'Searching...' : 'Search'}
                  </button>
                </div>

                {searchResults.length > 0 && (
                  <div className="border border-slate-200 rounded-2xl divide-y divide-slate-100 max-h-48 overflow-y-auto">
                    {searchResults.map((p) => (
                      <div
                        key={p.patient_id}
                        onClick={() => setSelectedPatient(p)}
                        className="p-3 hover:bg-teal-50 cursor-pointer flex justify-between items-center text-xs"
                      >
                        <div>
                          <span className="font-bold text-slate-900">{p.name}</span>
                          <span className="text-slate-500 ml-2">({p.phone})</span>
                        </div>
                        <span className="px-2 py-0.5 bg-teal-100 text-teal-800 font-bold rounded">Select</span>
                      </div>
                    ))}
                  </div>
                )}
                
                <div className="text-xs text-slate-500 flex items-center gap-1">
                  <span>Patient not registered yet?</span>
                  <button
                    type="button"
                    onClick={() => router.push('/patients/new')}
                    className="text-teal-700 font-bold hover:underline"
                  >
                    Register New Patient First ➔
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* 2. Consent Missing Error Card (403) */}
          {consentErrorPatientId && (
            <div className="bg-rose-50 border-2 border-rose-300 rounded-3xl p-6 shadow-md space-y-3">
              <div className="flex items-start gap-3">
                <ShieldAlert className="w-6 h-6 text-rose-600 shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-extrabold text-rose-950 text-base">Patient Consent Required Before Referral</h3>
                  <p className="text-xs text-rose-900 mt-1">
                    ABDM Interoperability protocol mandates active patient digital consent for facility data sharing.
                  </p>
                </div>
              </div>
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => router.push(`/patients/new?patient_id=${consentErrorPatientId}`)}
                  className="px-5 py-2.5 bg-rose-600 text-white font-bold text-xs rounded-xl hover:bg-rose-700 shadow-sm flex items-center gap-2"
                >
                  Authorize Consent Now at Patient Page ➔
                </button>
              </div>
            </div>
          )}

          {/* 3. Facilities & Resource Matching */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-2xs space-y-6">
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
              <Building className="w-4 h-4 text-teal-700" />
              Routing Facilities & Available Resource Match
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Referring Facility (From) *</label>
                <input
                  type="text"
                  required
                  value={fromFacility}
                  onChange={(e) => setFromFacility(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Required Resource Type *</label>
                <select
                  value={resourceType}
                  onChange={(e) => setResourceType(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-teal-500"
                >
                  <option value="OPD">OPD Consultation</option>
                  <option value="ICU Bed">ICU Bed</option>
                  <option value="Ambulance">Ambulance Service</option>
                  <option value="Diagnostic">Diagnostic Lab / Scan</option>
                </select>
              </div>
            </div>

            {/* Resource Match Cards */}
            <div className="space-y-2">
              <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <Boxes className="w-3.5 h-3.5 text-teal-700" />
                Facilities with Available &apos;{resourceType}&apos; Resources:
              </span>

              {isMatchingResources ? (
                <div className="text-xs text-slate-400 italic">Matching nearby facilities...</div>
              ) : matchedFacilities.length === 0 ? (
                <div className="text-xs text-slate-500 italic p-3 bg-slate-50 rounded-xl border border-slate-200">
                  No registered facility has extra &apos;{resourceType}&apos; capacity right now. Type receiving facility manually below.
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {matchedFacilities.map((m) => (
                    <div
                      key={m.resource_id}
                      onClick={() => handleSelectMatchedFacility(m)}
                      className={`p-3 rounded-2xl border cursor-pointer transition-all ${
                        toFacility === m.facility_name
                          ? 'border-teal-500 bg-teal-50 shadow-xs'
                          : 'border-slate-200 bg-white hover:border-teal-300'
                      }`}
                    >
                      <div className="font-bold text-xs text-slate-900">{m.facility_name}</div>
                      <div className="text-[11px] text-slate-500">{m.resource_name}</div>
                      <div className="mt-2 flex items-center justify-between text-[11px]">
                        <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold">
                          {m.available} Available
                        </span>
                        <span className="text-teal-700 font-bold text-[10px]">Click to Select</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* To Facility Input & Quick Suggestions */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700">Receiving Target Facility (To) *</label>
              <input
                type="text"
                required
                value={toFacility}
                onChange={(e) => setToFacility(e.target.value)}
                placeholder="e.g. District Hospital Ahmedabad"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500"
              />

              <div className="flex flex-wrap items-center gap-1.5 pt-1">
                <span className="text-[11px] text-slate-400 font-medium">Suggestions:</span>
                {facilitySuggestions.map((sug) => (
                  <button
                    key={sug}
                    type="button"
                    onClick={() => setToFacility(sug)}
                    className="px-2 py-0.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] rounded-md font-medium border border-slate-200"
                  >
                    {sug}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* 4. Clinical Details & Triage Helper */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-2xs space-y-6">
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
              <Stethoscope className="w-4 h-4 text-teal-700" />
              Clinical Reason & Automated Triage Assistant
            </h2>

            {/* Checkbox Triage Helper */}
            <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                  Quick Symptoms Triage Matrix:
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-slate-600">Calculated Score:</span>
                  <span className="px-2 py-0.5 bg-slate-900 text-white font-mono font-bold text-xs rounded-md">
                    {triageScore} / 10
                  </span>
                  <PriorityBadge priority={priority} />
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
                {[
                  { key: 'chestPain', label: 'Chest Pain / Angina' },
                  { key: 'breathingDiff', label: 'Breathing Difficulty' },
                  { key: 'highFever', label: 'High Fever (>102°F)' },
                  { key: 'severeBleeding', label: 'Severe Bleeding' },
                  { key: 'pregnancyComp', label: 'Pregnancy Complications' },
                ].map((item) => (
                  <label key={item.key} className="flex items-center gap-2 p-2 bg-white rounded-xl border border-slate-200 cursor-pointer text-slate-700 font-medium">
                    <input
                      type="checkbox"
                      checked={(triageCheckboxes as any)[item.key]}
                      onChange={() => handleTriageCheckboxChange(item.key as any)}
                      className="rounded text-teal-600 focus:ring-teal-500"
                    />
                    <span>{item.label}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Specialty Service Required *</label>
                <input
                  type="text"
                  required
                  value={serviceRequired}
                  onChange={(e) => setServiceRequired(e.target.value)}
                  placeholder="e.g. Obstetrics & Gynecology"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Priority Level *</label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as Priority)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-teal-500"
                >
                  <option value="ROUTINE">ROUTINE (24h SLA)</option>
                  <option value="URGENT">URGENT (6h SLA)</option>
                  <option value="EMERGENCY">EMERGENCY (2h SLA)</option>
                </select>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700">Clinical Reason & Observations *</label>
              <textarea
                rows={3}
                required
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Detailed medical summary..."
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-8 py-3.5 bg-teal-700 text-white font-extrabold text-sm rounded-xl hover:bg-teal-800 disabled:opacity-50 shadow-lg flex items-center gap-2"
            >
              <Send className="w-4 h-4" />
              {isSubmitting ? 'Creating Referral...' : 'Submit & Generate Digital Referral'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}

export default function CreateReferralPage() {
  return (
    <Suspense fallback={<LoadingSkeleton type="cards" />}>
      <CreateReferralContent />
    </Suspense>
  );
}
