'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useLanguage } from '@/lib/languageContext';
import { apiFetch, ApiError } from '@/lib/api';
import { Patient, Consent } from '@/types';
import { PageHeader } from '@/components/PageHeader';
import { StatusBadge } from '@/components/StatusBadge';
import { LoadingSkeleton } from '@/components/LoadingSkeleton';
import { toast } from '@/lib/toast';
import {
  UserPlus,
  Search,
  ShieldCheck,
  ArrowRight,
  CheckCircle2,
  AlertTriangle,
  UserCheck,
  Phone,
  CreditCard,
} from 'lucide-react';

function RegisterPatientContent() {
  const { t } = useLanguage();
  const router = useRouter();
  const searchParams = useSearchParams();

  // Search state
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [searchResults, setSearchResults] = useState<Patient[]>([]);
  const [isSearching, setIsSearching] = useState<boolean>(false);

  // Form state
  const [name, setName] = useState<string>('');
  const [age, setAge] = useState<string>('');
  const [gender, setGender] = useState<string>('Female');
  const [phone, setPhone] = useState<string>('');
  const [abhaId, setAbhaId] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Registered/Selected patient state
  const [activePatient, setActivePatient] = useState<Patient | null>(null);
  const [duplicateWarning, setDuplicateWarning] = useState<{ message: string; patient_id: number } | null>(null);

  // Consent state
  const [consents, setConsents] = useState<Consent[]>([]);
  const [consentGranted, setConsentGranted] = useState<boolean>(true);
  const [purpose, setPurpose] = useState<string>('REFERRAL');
  const [validDays, setValidDays] = useState<number>(365);
  const [isGrantingConsent, setIsGrantingConsent] = useState<boolean>(false);
  const [isLoadingConsents, setIsLoadingConsents] = useState<boolean>(false);

  // Check URL query param patient_id
  useEffect(() => {
    const pid = searchParams.get('patient_id');
    if (pid) {
      fetchPatientById(parseInt(pid, 10));
    }
  }, [searchParams]);

  const fetchPatientById = async (pid: number) => {
    try {
      const data = await apiFetch<Patient>(`/patients/${pid}`);
      setActivePatient(data);
      fetchPatientConsents(data.patient_id);
    } catch {
      // ignore
    }
  };

  const fetchPatientConsents = async (pid: number) => {
    setIsLoadingConsents(true);
    try {
      const data = await apiFetch<Consent[]>(`/consents/patient/${pid}`);
      setConsents(data || []);
    } catch {
      setConsents([]);
    } finally {
      setIsLoadingConsents(false);
    }
  };

  // Auto format ABHA ID as 12-3456-7890-1234
  const handleAbhaChange = (val: string) => {
    const cleaned = val.replace(/\D/g, '').slice(0, 14);
    let formatted = cleaned;
    if (cleaned.length > 2 && cleaned.length <= 6) {
      formatted = `${cleaned.slice(0, 2)}-${cleaned.slice(2)}`;
    } else if (cleaned.length > 6 && cleaned.length <= 10) {
      formatted = `${cleaned.slice(0, 2)}-${cleaned.slice(2, 6)}-${cleaned.slice(6)}`;
    } else if (cleaned.length > 10) {
      formatted = `${cleaned.slice(0, 2)}-${cleaned.slice(2, 6)}-${cleaned.slice(6, 10)}-${cleaned.slice(10)}`;
    }
    setAbhaId(formatted);
  };

  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!searchQuery.trim()) return;
    setIsSearching(true);
    try {
      const data = await apiFetch<Patient[]>(`/patients/?q=${encodeURIComponent(searchQuery)}`);
      setSearchResults(data || []);
    } catch {
      // handled
    } finally {
      setIsSearching(false);
    }
  };

  const handleRegisterPatient = async (e: React.FormEvent) => {
    e.preventDefault();
    setDuplicateWarning(null);

    if (!name.trim()) return toast.warning('Validation', 'Please enter patient name');
    const parsedAge = parseInt(age, 10);
    if (isNaN(parsedAge) || parsedAge < 0 || parsedAge > 120) {
      return toast.warning('Validation', 'Please enter valid age (0-120)');
    }
    const cleanPhone = phone.replace(/\D/g, '');
    if (cleanPhone.length !== 10) {
      return toast.warning('Validation', 'Phone number must be exactly 10 digits');
    }

    const cleanAbha = abhaId.replace(/\D/g, '');

    setIsSubmitting(true);
    try {
      const payload = {
        name: name.trim(),
        age: parsedAge,
        gender,
        phone: cleanPhone,
        abha_id: cleanAbha.length === 14 ? abhaId : undefined,
      };

      const newPatient = await apiFetch<Patient>('/patients/', {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      toast.success('Patient Registered', `Patient ID #${newPatient.patient_id} created successfully.`);
      setActivePatient(newPatient);
      fetchPatientConsents(newPatient.patient_id);
    } catch (err: any) {
      if (err instanceof ApiError && err.status === 409) {
        const detail = err.detail;
        if (detail && typeof detail === 'object' && detail.patient_id) {
          setDuplicateWarning({
            message: detail.message || 'Already registered - use existing record',
            patient_id: detail.patient_id,
          });
          toast.warning('Duplicate Patient Found', detail.message);
        }
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReuseExisting = async (pid: number) => {
    setDuplicateWarning(null);
    await fetchPatientById(pid);
    toast.info('Patient Loaded', `Using existing patient record #${pid}`);
  };

  const handleGrantConsent = async () => {
    if (!activePatient) return;
    setIsGrantingConsent(true);
    try {
      const payload = {
        patient_id: activePatient.patient_id,
        purpose,
        granted_to: 'ALL_FACILITIES',
        valid_days: validDays,
      };

      await apiFetch<Consent>('/consents/', {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      toast.success('Consent Granted', 'Patient consent recorded for referral data sharing.');
      fetchPatientConsents(activePatient.patient_id);
    } catch {
      // handled
    } finally {
      setIsGrantingConsent(false);
    }
  };

  const handleRevokeConsent = async (consentId: number) => {
    try {
      await apiFetch<Consent>(`/consents/${consentId}/revoke`, {
        method: 'PATCH',
      });
      toast.info('Consent Revoked', `Consent #${consentId} revoked successfully.`);
      if (activePatient) fetchPatientConsents(activePatient.patient_id);
    } catch {
      // handled
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <PageHeader
        title={t('pageRegisterPatient')}
        description="Register frontline patient, prevent duplicate records via ABDM / ABHA ID check, and authorize digital referral consent."
      />

      {/* 1. Search Patient Bar */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-2xs space-y-4">
        <h2 className="text-sm font-bold text-slate-800 flex items-center gap-2">
          <Search className="w-4 h-4 text-teal-700" />
          Lookup Existing Patient (Prevent Duplicates)
        </h2>

        <form onSubmit={handleSearch} className="flex gap-2">
          <div className="relative flex-1">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by Name, 10-digit Phone, or ABHA ID..."
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 font-medium"
            />
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          </div>
          <button
            type="submit"
            disabled={isSearching}
            className="px-5 py-2.5 bg-slate-900 text-white font-bold text-sm rounded-xl hover:bg-slate-800 disabled:opacity-50 shadow-2xs"
          >
            {isSearching ? 'Searching...' : 'Search'}
          </button>
        </form>

        {searchResults.length > 0 && (
          <div className="border border-slate-200 rounded-2xl overflow-hidden divide-y divide-slate-100 mt-3">
            {searchResults.map((p) => (
              <div key={p.patient_id} className="p-3.5 bg-slate-50/50 flex items-center justify-between hover:bg-teal-50/40 transition-colors">
                <div className="space-y-0.5">
                  <div className="font-bold text-sm text-slate-900 flex items-center gap-2">
                    <span>{p.name}</span>
                    <span className="text-xs font-normal text-slate-500">
                      ({p.age} yrs, {p.gender})
                    </span>
                  </div>
                  <div className="text-xs text-slate-600 flex items-center gap-4">
                    <span>📞 {p.phone}</span>
                    {p.abha_id && <span className="font-mono text-teal-800 bg-teal-100/70 px-1.5 py-0.2 rounded">ABHA: {p.abha_id}</span>}
                  </div>
                </div>
                <button
                  onClick={() => handleReuseExisting(p.patient_id)}
                  className="px-3 py-1.5 bg-teal-700 text-white font-bold text-xs rounded-lg hover:bg-teal-800 shadow-2xs"
                >
                  Select Patient #{p.patient_id}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 2. Duplicate Warning Card (409) */}
      {duplicateWarning && (
        <div className="bg-amber-50 border-2 border-amber-300 rounded-3xl p-6 shadow-md animate-in fade-in duration-200 space-y-3">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-6 h-6 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <h3 className="font-extrabold text-amber-950 text-base">Already Registered Record Detected</h3>
              <p className="text-xs text-amber-900 mt-1">{duplicateWarning.message}</p>
            </div>
          </div>
          <div className="pt-2 flex items-center gap-3">
            <button
              onClick={() => handleReuseExisting(duplicateWarning.patient_id)}
              className="px-4 py-2 bg-amber-600 text-white font-bold text-xs rounded-xl hover:bg-amber-700 shadow-sm flex items-center gap-2"
            >
              <UserCheck className="w-4 h-4" /> Continue with Patient Record #{duplicateWarning.patient_id}
            </button>
            <button
              onClick={() => setDuplicateWarning(null)}
              className="px-3 py-2 bg-amber-100 text-amber-900 font-semibold text-xs rounded-xl hover:bg-amber-200"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      {/* 3. Register Patient Form */}
      <form onSubmit={handleRegisterPatient} className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-2xs space-y-6">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <UserPlus className="w-5 h-5 text-teal-700" />
            Patient Registration Form
          </h2>
          <span className="text-xs text-slate-500 font-medium">* Required Fields</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700">Patient Full Name *</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Sunita Devi"
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 font-medium"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700">Age (years) *</label>
              <input
                type="number"
                min="0"
                max="120"
                required
                value={age}
                onChange={(e) => setAge(e.target.value)}
                placeholder="e.g. 28"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 font-medium"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700">Gender *</label>
              <select
                value={gender}
                onChange={(e) => setGender(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 font-medium"
              >
                <option value="Female">Female</option>
                <option value="Male">Male</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700">Phone Number (10 Digits) *</label>
            <div className="relative">
              <input
                type="tel"
                maxLength={10}
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                placeholder="9876543210"
                className="w-full pl-9 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 font-mono font-medium"
              />
              <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            </div>
          </div>

          <div className="space-y-1">
            <div className="flex justify-between">
              <label className="text-xs font-bold text-slate-700">ABHA ID (14 Digits)</label>
              <span className="text-[10px] text-teal-700 font-bold">ABDM Interop</span>
            </div>
            <div className="relative">
              <input
                type="text"
                value={abhaId}
                onChange={(e) => handleAbhaChange(e.target.value)}
                placeholder="12-3456-7890-1234"
                className="w-full pl-9 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 font-mono font-bold text-teal-900"
              />
              <CreditCard className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            </div>
          </div>
        </div>

        <div className="pt-2 flex justify-end">
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-6 py-3 bg-teal-700 text-white font-bold text-sm rounded-xl hover:bg-teal-800 disabled:opacity-50 shadow-md flex items-center gap-2"
          >
            <UserPlus className="w-4 h-4" />
            {isSubmitting ? 'Registering Patient...' : 'Register Patient & Proceed'}
          </button>
        </div>
      </form>

      {/* 4. Active Patient Summary & Consent Card */}
      {activePatient && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border-2 border-teal-500/40 shadow-md space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full bg-teal-100 text-teal-800 font-bold text-xs font-mono">
                  Patient #{activePatient.patient_id}
                </span>
                <h3 className="text-lg font-bold text-slate-900">{activePatient.name}</h3>
              </div>
              <p className="text-xs text-slate-600">
                {activePatient.age} years • {activePatient.gender} • 📞 {activePatient.phone}
                {activePatient.abha_id && ` • ABHA: ${activePatient.abha_id}`}
              </p>
            </div>

            <button
              onClick={() => router.push(`/referrals/new?patient_id=${activePatient.patient_id}`)}
              className="px-5 py-2.5 bg-teal-700 text-white font-bold text-xs rounded-xl hover:bg-teal-800 shadow-md flex items-center gap-2 shrink-0"
            >
              Create Referral For This Patient <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200 space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-teal-700" />
                ABDM Digital Health Data Sharing Consent
              </h4>
              <span className="text-xs font-semibold text-slate-500">Valid for 365 Days</span>
            </div>

            <label className="flex items-start gap-3 p-3 bg-white rounded-xl border border-slate-200 cursor-pointer">
              <input
                type="checkbox"
                checked={consentGranted}
                onChange={(e) => setConsentGranted(e.target.checked)}
                className="mt-1 w-4 h-4 text-teal-600 rounded focus:ring-teal-500"
              />
              <div className="text-xs text-slate-700 leading-relaxed">
                <span className="font-bold text-slate-900 block mb-0.5">
                  Patient consents to share medical history & referral records across all participating health facilities.
                </span>
                Authorizes referring doctors, receiving specialists, and ASHA field workers to view clinical notes and prescriptions.
              </div>
            </label>

            <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
              <div className="flex items-center gap-3 text-xs">
                <span className="font-semibold text-slate-600">Purpose:</span>
                <span className="px-2 py-0.5 bg-slate-200 rounded font-mono font-bold text-slate-800">{purpose}</span>
                <span className="font-semibold text-slate-600">Granted To:</span>
                <span className="px-2 py-0.5 bg-slate-200 rounded font-mono font-bold text-slate-800">ALL_FACILITIES</span>
              </div>

              <button
                onClick={handleGrantConsent}
                disabled={!consentGranted || isGrantingConsent}
                className="px-4 py-2 bg-slate-900 text-white font-bold text-xs rounded-xl hover:bg-slate-800 disabled:opacity-50 shadow-2xs flex items-center gap-1.5"
              >
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                {isGrantingConsent ? 'Confirming...' : 'Record & Grant Consent'}
              </button>
            </div>

            <div className="pt-3 border-t border-slate-200 space-y-2">
              <h5 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Active Consents Record</h5>
              {isLoadingConsents ? (
                <div className="text-xs text-slate-500 italic">Loading consent history...</div>
              ) : consents.length === 0 ? (
                <div className="text-xs text-slate-500 italic p-3 bg-white rounded-xl border border-slate-200 text-center">
                  No consent records found for this patient yet.
                </div>
              ) : (
                <div className="divide-y divide-slate-200 bg-white rounded-xl border border-slate-200 overflow-hidden">
                  {consents.map((c) => (
                    <div key={c.consent_id} className="p-3 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-3">
                        <StatusBadge status={c.status} size="sm" />
                        <div>
                          <span className="font-bold text-slate-900">Consent #{c.consent_id}</span>
                          <span className="text-slate-500 text-[11px] block">
                            Purpose: {c.purpose} • Target: {c.granted_to}
                          </span>
                        </div>
                      </div>

                      {c.status === 'GRANTED' && (
                        <button
                          onClick={() => handleRevokeConsent(c.consent_id)}
                          className="px-2.5 py-1 bg-rose-50 text-rose-700 font-bold text-[11px] rounded-lg border border-rose-200 hover:bg-rose-100 transition-colors"
                        >
                          Revoke
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function RegisterPatientPage() {
  return (
    <Suspense fallback={<LoadingSkeleton type="cards" />}>
      <RegisterPatientContent />
    </Suspense>
  );
}
