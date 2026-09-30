'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useLanguage } from '@/lib/languageContext';
import { apiFetch, getCurrentRole } from '@/lib/api';
import {
  ReferralTimeline,
  ReferralStatus,
  Role,
  Prescription,
  AvailabilityResponse,
  MedicineDispense,
} from '@/types';
import { PageHeader } from '@/components/PageHeader';
import { StatusBadge } from '@/components/StatusBadge';
import { PriorityBadge } from '@/components/PriorityBadge';
import { LoadingSkeleton } from '@/components/LoadingSkeleton';
import { toast } from '@/lib/toast';
import {
  Check,
  Lock,
  Clock,
  MessageSquare,
  History,
  FileText,
  Pill,
  Send,
  Calendar,
  UserCheck,
  Stethoscope,
  CheckCircle2,
  AlertTriangle,
  ChevronRight,
  ShieldAlert,
  Building,
  Plus,
} from 'lucide-react';

const LIFECYCLE_STEPS: ReferralStatus[] = [
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

export default function ReferralDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { t } = useLanguage();

  const referralId = params.id as string;
  const [timeline, setTimeline] = useState<ReferralTimeline | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [currentRole, setCurrentRoleState] = useState<Role>('ADMIN');
  const [activeTab, setActiveTab] = useState<'events' | 'notifications'>('events');

  // Form states for contextual actions
  const [appointmentDate, setAppointmentDate] = useState<string>('');
  const [treatmentNotes, setTreatmentNotes] = useState<string>('');
  const [counterNotes, setCounterNotes] = useState<string>('');
  const [followUpDate, setFollowUpDate] = useState<string>('');
  const [followUpNotes, setFollowUpNotes] = useState<string>('');
  const [isExecutingAction, setIsExecutingAction] = useState<boolean>(false);

  // Prescription states
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [showPrescriptionForm, setShowPrescriptionForm] = useState<boolean>(false);
  const [medName, setMedName] = useState<string>('Paracetamol 500mg');
  const [dosage, setDosage] = useState<string>('1 tablet');
  const [frequency, setFrequency] = useState<string>('TDS (3 times daily)');
  const [duration, setDuration] = useState<string>('5 days');
  const [instructions, setInstructions] = useState<string>('Take after meals with water');
  const [isAddingPrescription, setIsAddingPrescription] = useState<boolean>(false);

  // Availability lookup & history per prescription
  const [availabilityMap, setAvailabilityMap] = useState<Record<number, AvailabilityResponse>>({});
  const [facilityLookup, setFacilityLookup] = useState<Record<number, string>>({});
  const [historyMap, setHistoryMap] = useState<Record<number, MedicineDispense[]>>({});

  useEffect(() => {
    setCurrentRoleState(getCurrentRole() as Role);
    fetchData();
  }, [referralId]);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const data = await apiFetch<ReferralTimeline>(`/referrals/${referralId}/timeline`);
      setTimeline(data);
      fetchPrescriptions();
    } catch {
      // handled
    } finally {
      setIsLoading(false);
    }
  };

  const fetchPrescriptions = async () => {
    try {
      const res = await apiFetch<Prescription[]>(`/prescriptions/by-referral/${referralId}`);
      setPrescriptions(res || []);
    } catch {
      // handled
    }
  };

  // Helper for role permissions per status
  const getRequiredRoleForStatus = (status: ReferralStatus): { roles: Role[]; name: string } => {
    switch (status) {
      case 'CREATED':
        return { roles: ['FACILITY_ADMIN', 'ADMIN'], name: 'FACILITY ADMIN' };
      case 'ACKNOWLEDGED':
        return { roles: ['FACILITY_ADMIN', 'ADMIN'], name: 'FACILITY ADMIN' };
      case 'APPOINTMENT':
        return { roles: ['FACILITY_ADMIN', 'ADMIN'], name: 'FACILITY ADMIN' };
      case 'CHECKED_IN':
        return { roles: ['DOCTOR', 'ADMIN'], name: 'DOCTOR' };
      case 'IN_CONSULTATION':
        return { roles: ['DOCTOR', 'ADMIN'], name: 'DOCTOR' };
      case 'TREATMENT':
        return { roles: ['DOCTOR', 'ADMIN'], name: 'DOCTOR' };
      case 'COUNTER_REFERRAL':
        return { roles: ['ASHA', 'DOCTOR', 'FACILITY_ADMIN', 'ADMIN'], name: 'ASHA / DOCTOR / ADMIN' };
      case 'FOLLOW_UP':
        return { roles: ['ASHA', 'DOCTOR', 'FACILITY_ADMIN', 'ADMIN'], name: 'ASHA / DOCTOR / ADMIN' };
      default:
        return { roles: ['ADMIN'], name: 'ADMIN' };
    }
  };

  // Handle Contextual Action Execution
  const handleAction = async (endpoint: string, method = 'PATCH', body?: any) => {
    setIsExecutingAction(true);
    try {
      await apiFetch(`/referrals/${referralId}/${endpoint}`, {
        method,
        body: body ? JSON.stringify(body) : undefined,
      });
      toast.success('Action Completed', `Referral status updated successfully.`);
      fetchData();
    } catch (err) {
      // error handled in apiFetch wrapper
    } finally {
      setIsExecutingAction(false);
    }
  };

  // Handle Prescription Submit
  const handleCreatePrescription = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsAddingPrescription(true);
    try {
      const payload = {
        referral_id: parseInt(referralId, 10),
        doctor_id: `DOC-${currentRole}`,
        medicine_name: medName.trim(),
        dosage: dosage.trim(),
        frequency: frequency.trim(),
        duration: duration.trim(),
        instructions: instructions.trim(),
      };

      await apiFetch<Prescription>('/prescriptions/', {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      toast.success('Prescription Added', `Added prescription for ${medName}`);
      setShowPrescriptionForm(false);
      fetchPrescriptions();
    } catch (err) {
      // handled
    } finally {
      setIsAddingPrescription(false);
    }
  };

  const handleCheckAvailability = async (pId: number, facName: string) => {
    if (!facName.trim()) return toast.warning('Missing Facility', 'Enter facility name to check medicine stock.');
    try {
      const res = await apiFetch<AvailabilityResponse>(`/prescriptions/${pId}/availability?facility_name=${encodeURIComponent(facName)}`);
      setAvailabilityMap((prev) => ({ ...prev, [pId]: res }));
    } catch (err) {
      // handled
    }
  };

  const handleFetchDispensingHistory = async (pId: number) => {
    try {
      const res = await apiFetch<MedicineDispense[]>(`/medicine-inventory/dispensing-history/${pId}`);
      setHistoryMap((prev) => ({ ...prev, [pId]: res || [] }));
    } catch (err) {
      // handled
    }
  };

  if (isLoading || !timeline) {
    return (
      <div className="max-w-5xl mx-auto space-y-6">
        <PageHeader title="Loading Referral Journey..." />
        <LoadingSkeleton type="detail" />
      </div>
    );
  }

  const { referral, patient, consent_active, sla_breached, events, notifications } = timeline;
  const currentStepIdx = LIFECYCLE_STEPS.indexOf(referral.status);
  const reqRoleInfo = getRequiredRoleForStatus(referral.status);
  const isRoleAllowed = currentRole === 'ADMIN' || reqRoleInfo.roles.includes(currentRole);

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      
      {/* Header */}
      <PageHeader
        title={`Referral #${referral.referral_id}`}
        description={`${referral.from_facility} ➔ ${referral.to_facility} • Service: ${referral.service_required}`}
        badge={
          <div className="flex items-center gap-2">
            <PriorityBadge priority={referral.priority} />
            <StatusBadge status={referral.status} showPulse />
            {sla_breached && (
              <span className="px-2.5 py-1 rounded-full bg-rose-100 text-rose-800 font-extrabold text-xs animate-bounce flex items-center gap-1 border border-rose-300">
                <AlertTriangle className="w-3.5 h-3.5" /> SLA Breached
              </span>
            )}
          </div>
        }
      />

      {/* Patient Card (Consent Active / Masked) */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-2xs">
        {consent_active ? (
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold text-xs flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Consent Active
                </span>
                <h3 className="text-lg font-bold text-slate-900">{patient.name}</h3>
              </div>
              <p className="text-xs text-slate-600">
                Patient #{patient.patient_id} • {patient.age} years • {patient.gender} • 📞 {patient.phone}
                {patient.abha_id && ` • ABHA: ${patient.abha_id}`}
              </p>
            </div>
            <div className="text-xs text-slate-500 font-medium">
              Created: {new Date(referral.created_at).toLocaleString()}
            </div>
          </div>
        ) : (
          <div className="p-4 bg-rose-50 rounded-2xl border border-rose-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <Lock className="w-6 h-6 text-rose-600 shrink-0 mt-1" />
              <div>
                <h4 className="font-extrabold text-rose-950 text-sm">Patient Clinical Details Locked</h4>
                <p className="text-xs text-rose-900 mt-0.5">
                  ABDM Consent required to view patient phone number and clinical records.
                </p>
              </div>
            </div>
            <button
              onClick={() => router.push(`/patients/new?patient_id=${patient.patient_id}`)}
              className="px-4 py-2 bg-rose-600 text-white font-bold text-xs rounded-xl hover:bg-rose-700 shrink-0 shadow-2xs"
            >
              Authorize Patient Consent ➔
            </button>
          </div>
        )}
      </div>

      {/* Horizontal 9-Step Lifecycle Stepper */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-2xs space-y-4">
        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
          Unified Healthcare Care Journey Stepper
        </h3>

        <div className="overflow-x-auto pb-2">
          <div className="flex items-center min-w-[800px] justify-between relative">
            {LIFECYCLE_STEPS.map((step, idx) => {
              const isPast = idx < currentStepIdx;
              const isCurrent = idx === currentStepIdx;

              return (
                <div key={step} className="flex-1 flex flex-col items-center relative group">
                  {/* Connection Line */}
                  {idx > 0 && (
                    <div
                      className={`absolute top-4 -left-1/2 right-1/2 h-1 z-0 transition-all ${
                        idx <= currentStepIdx ? 'bg-teal-600' : 'bg-slate-200'
                      }`}
                    ></div>
                  )}

                  {/* Step Circle */}
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs z-10 transition-all ${
                      isPast
                        ? 'bg-teal-600 text-white shadow-xs'
                        : isCurrent
                        ? 'bg-teal-700 text-white ring-4 ring-teal-100 animate-pulse'
                        : 'bg-slate-100 text-slate-400 border border-slate-200'
                    }`}
                  >
                    {isPast ? <Check className="w-4 h-4" /> : idx + 1}
                  </div>

                  {/* Step Label */}
                  <span
                    className={`mt-2 text-[10px] text-center font-semibold max-w-[80px] leading-tight ${
                      isCurrent
                        ? 'text-teal-900 font-extrabold'
                        : isPast
                        ? 'text-slate-800 font-bold'
                        : 'text-slate-400'
                    }`}
                  >
                    {step.replace(/_/g, ' ')}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Contextual Action Panel (ONLY ONE NEXT ACTION) */}
      <div className="bg-white rounded-3xl p-6 border-2 border-teal-600/30 shadow-md space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Stethoscope className="w-4 h-4 text-teal-700" />
            Contextual Action Panel (Next Required Step)
          </h3>
          <span className="text-xs font-semibold text-slate-500">
            Allowed Role: <strong className="text-teal-800">{reqRoleInfo.name}</strong>
          </span>
        </div>

        {!isRoleAllowed && referral.status !== 'COMPLETED' && (
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0" />
            <span>
              Your current role (<strong>{currentRole}</strong>) is not allowed to perform this action. Switch role to <strong>{reqRoleInfo.name}</strong> in the top navigation bar.
            </span>
          </div>
        )}

        <div className="space-y-4">
          
          {/* STEP 1: CREATED -> ACKNOWLEDGED */}
          {referral.status === 'CREATED' && (
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 flex items-center justify-between">
              <div>
                <h4 className="font-bold text-slate-900 text-sm">Acknowledge Referral Receipt</h4>
                <p className="text-xs text-slate-500">Confirm receiving facility capacity and assign intake team.</p>
              </div>
              <button
                onClick={() => handleAction('acknowledge')}
                disabled={!isRoleAllowed || isExecutingAction}
                className="px-5 py-2.5 bg-teal-700 text-white font-bold text-xs rounded-xl hover:bg-teal-800 disabled:opacity-40 shadow-sm"
              >
                Acknowledge Referral
              </button>
            </div>
          )}

          {/* STEP 2: ACKNOWLEDGED -> APPOINTMENT */}
          {referral.status === 'ACKNOWLEDGED' && (
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
              <div>
                <h4 className="font-bold text-slate-900 text-sm">Schedule Facility Appointment</h4>
                <p className="text-xs text-slate-500">Select date & time for specialist OPD / bed allocation.</p>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <input
                  type="datetime-local"
                  value={appointmentDate}
                  onChange={(e) => setAppointmentDate(e.target.value)}
                  className="px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
                <button
                  onClick={() => {
                    if (!appointmentDate) return toast.warning('Missing Date', 'Select appointment date/time.');
                    handleAction('appointment', 'PATCH', { appointment_date: new Date(appointmentDate).toISOString() });
                  }}
                  disabled={!isRoleAllowed || isExecutingAction}
                  className="px-5 py-2 bg-teal-700 text-white font-bold text-xs rounded-xl hover:bg-teal-800 disabled:opacity-40 shadow-sm"
                >
                  Schedule Appointment
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: APPOINTMENT -> CHECKED_IN */}
          {referral.status === 'APPOINTMENT' && (
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 flex items-center justify-between">
              <div>
                <h4 className="font-bold text-slate-900 text-sm">Check-in Patient at Facility</h4>
                <p className="text-xs text-slate-500">Patient arrived at reception / triage desk.</p>
              </div>
              <button
                onClick={() => handleAction('check-in')}
                disabled={!isRoleAllowed || isExecutingAction}
                className="px-5 py-2.5 bg-teal-700 text-white font-bold text-xs rounded-xl hover:bg-teal-800 disabled:opacity-40 shadow-sm"
              >
                Check In Patient
              </button>
            </div>
          )}

          {/* STEP 4: CHECKED_IN -> IN_CONSULTATION */}
          {referral.status === 'CHECKED_IN' && (
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 flex items-center justify-between">
              <div>
                <h4 className="font-bold text-slate-900 text-sm">Start Doctor Consultation</h4>
                <p className="text-xs text-slate-500">Call patient into examination room.</p>
              </div>
              <button
                onClick={() => handleAction('consultation')}
                disabled={!isRoleAllowed || isExecutingAction}
                className="px-5 py-2.5 bg-teal-700 text-white font-bold text-xs rounded-xl hover:bg-teal-800 disabled:opacity-40 shadow-sm"
              >
                Start Consultation
              </button>
            </div>
          )}

          {/* STEP 5: IN_CONSULTATION -> TREATMENT */}
          {referral.status === 'IN_CONSULTATION' && (
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
              <div>
                <h4 className="font-bold text-slate-900 text-sm">Record Medical Treatment & Diagnosis</h4>
                <p className="text-xs text-slate-500">Document clinical diagnosis, procedures performed, and prescriptions.</p>
              </div>
              <textarea
                rows={3}
                value={treatmentNotes}
                onChange={(e) => setTreatmentNotes(e.target.value)}
                placeholder="Enter clinical diagnosis and treatment summary..."
                className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
              <div className="flex justify-end">
                <button
                  onClick={() => {
                    if (!treatmentNotes.trim()) return toast.warning('Missing Notes', 'Enter treatment notes.');
                    handleAction('treatment', 'PATCH', { treatment_notes: treatmentNotes.trim() });
                  }}
                  disabled={!isRoleAllowed || isExecutingAction}
                  className="px-5 py-2.5 bg-teal-700 text-white font-bold text-xs rounded-xl hover:bg-teal-800 disabled:opacity-40 shadow-sm"
                >
                  Save Treatment & Proceed
                </button>
              </div>
            </div>
          )}

          {/* STEP 6: TREATMENT -> COUNTER_REFERRAL */}
          {referral.status === 'TREATMENT' && (
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
              <div>
                <h4 className="font-bold text-slate-900 text-sm">Send Counter-Referral Feedback</h4>
                <p className="text-xs text-slate-500">Send treatment outcome back to referring ASHA/PHC for frontline tracking.</p>
              </div>
              <textarea
                rows={3}
                value={counterNotes}
                onChange={(e) => setCounterNotes(e.target.value)}
                placeholder="Enter counter-referral advice and post-treatment guidance for referring worker..."
                className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
              <div className="flex justify-end">
                <button
                  onClick={() => {
                    if (!counterNotes.trim()) return toast.warning('Missing Notes', 'Enter counter-referral notes.');
                    handleAction('counter-referral', 'PATCH', { counter_referral_notes: counterNotes.trim() });
                  }}
                  disabled={!isRoleAllowed || isExecutingAction}
                  className="px-5 py-2.5 bg-teal-700 text-white font-bold text-xs rounded-xl hover:bg-teal-800 disabled:opacity-40 shadow-sm"
                >
                  Send Counter-Referral
                </button>
              </div>
            </div>
          )}

          {/* STEP 7: COUNTER_REFERRAL -> FOLLOW_UP */}
          {referral.status === 'COUNTER_REFERRAL' && (
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
              <div>
                <h4 className="font-bold text-slate-900 text-sm">Schedule ASHA Home Follow-up Visit</h4>
                <p className="text-xs text-slate-500">Assign frontline home visit to check patient recovery status.</p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <input
                  type="date"
                  value={followUpDate}
                  onChange={(e) => setFollowUpDate(e.target.value)}
                  className="px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
                <input
                  type="text"
                  value={followUpNotes}
                  onChange={(e) => setFollowUpNotes(e.target.value)}
                  placeholder="e.g. Check vital signs and drug compliance"
                  className="px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>
              <div className="flex justify-end">
                <button
                  onClick={() => {
                    if (!followUpDate) return toast.warning('Missing Date', 'Select follow-up date.');
                    handleAction('follow-up', 'PATCH', {
                      follow_up_date: new Date(followUpDate).toISOString(),
                      follow_up_notes: followUpNotes.trim(),
                    });
                  }}
                  disabled={!isRoleAllowed || isExecutingAction}
                  className="px-5 py-2.5 bg-teal-700 text-white font-bold text-xs rounded-xl hover:bg-teal-800 disabled:opacity-40 shadow-sm"
                >
                  Schedule Follow-Up Task
                </button>
              </div>
            </div>
          )}

          {/* STEP 8: FOLLOW_UP -> COMPLETED */}
          {referral.status === 'FOLLOW_UP' && (
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 flex items-center justify-between">
              <div>
                <h4 className="font-bold text-slate-900 text-sm">Close Referral Care Journey</h4>
                <p className="text-xs text-slate-500">Mark patient fully recovered and close referral lifecycle.</p>
              </div>
              <button
                onClick={() => handleAction('complete')}
                disabled={!isRoleAllowed || isExecutingAction}
                className="px-5 py-2.5 bg-emerald-700 text-white font-bold text-xs rounded-xl hover:bg-emerald-800 disabled:opacity-40 shadow-sm"
              >
                Close Care Journey
              </button>
            </div>
          )}

          {/* COMPLETED BANNER */}
          {referral.status === 'COMPLETED' && (
            <div className="p-5 bg-emerald-50 border-2 border-emerald-300 rounded-2xl flex items-center gap-3">
              <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0" />
              <div>
                <h4 className="font-extrabold text-emerald-950 text-base">Referral Care Journey Completed</h4>
                <p className="text-xs text-emerald-800 mt-0.5">
                  This referral has successfully traversed all 9 stages of the closed-loop healthcare network.
                </p>
              </div>
            </div>
          )}

        </div>
      </div>

      {/* Prescriptions & e-Aushadhi Stock Section */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-2xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <Pill className="w-5 h-5 text-teal-700" />
            <h3 className="text-sm font-bold text-slate-900">Digital Prescriptions & e-Aushadhi Stock</h3>
          </div>
          <button
            onClick={() => setShowPrescriptionForm(!showPrescriptionForm)}
            className="px-3 py-1.5 bg-slate-900 text-white font-bold text-xs rounded-xl hover:bg-slate-800 flex items-center gap-1 shadow-2xs"
          >
            <Plus className="w-3.5 h-3.5" /> Write Prescription
          </button>
        </div>

        {/* Prescription Form */}
        {showPrescriptionForm && (
          <form onSubmit={handleCreatePrescription} className="bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-3">
            <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider">New E-Prescription Form</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-700">Medicine Name *</label>
                <input
                  type="text"
                  required
                  value={medName}
                  onChange={(e) => setMedName(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-700">Dosage *</label>
                <input
                  type="text"
                  required
                  value={dosage}
                  onChange={(e) => setDosage(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-700">Frequency *</label>
                <input
                  type="text"
                  required
                  value={frequency}
                  onChange={(e) => setFrequency(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-700">Duration *</label>
                <input
                  type="text"
                  required
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-700">Instructions</label>
              <input
                type="text"
                value={instructions}
                onChange={(e) => setInstructions(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium"
              />
            </div>

            <div className="flex justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setShowPrescriptionForm(false)}
                className="px-3 py-1.5 bg-slate-200 text-slate-700 text-xs font-bold rounded-xl"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isAddingPrescription}
                className="px-4 py-1.5 bg-teal-700 text-white text-xs font-bold rounded-xl hover:bg-teal-800 disabled:opacity-50"
              >
                {isAddingPrescription ? 'Saving...' : 'Save Prescription'}
              </button>
            </div>
          </form>
        )}

        {/* Prescriptions List */}
        {prescriptions.length === 0 ? (
          <div className="text-xs text-slate-500 italic p-4 bg-slate-50 rounded-2xl border border-slate-200 text-center">
            No e-prescriptions recorded for this referral yet. Click &apos;Write Prescription&apos; above.
          </div>
        ) : (
          <div className="space-y-3">
            {prescriptions.map((p) => {
              const avail = availabilityMap[p.prescription_id];
              const history = historyMap[p.prescription_id];

              return (
                <div key={p.prescription_id} className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 pb-2">
                    <div>
                      <span className="font-extrabold text-sm text-slate-900">{p.medicine_name}</span>
                      <span className="text-xs text-slate-500 ml-2 font-mono">
                        ({p.dosage} • {p.frequency} • {p.duration})
                      </span>
                    </div>
                    <span className="text-[11px] text-slate-400 font-mono">Doctor: {p.doctor_id}</span>
                  </div>

                  {p.instructions && (
                    <p className="text-xs text-slate-600 font-medium">Instructions: {p.instructions}</p>
                  )}

                  {/* Stock Availability Checker */}
                  <div className="pt-2 flex flex-wrap items-center justify-between gap-3 bg-white p-3 rounded-xl border border-slate-200">
                    <div className="flex items-center gap-2">
                      <Building className="w-3.5 h-3.5 text-slate-400" />
                      <input
                        type="text"
                        value={facilityLookup[p.prescription_id] || referral.to_facility}
                        onChange={(e) =>
                          setFacilityLookup({ ...facilityLookup, [p.prescription_id]: e.target.value })
                        }
                        placeholder="Facility name..."
                        className="px-2.5 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold w-40"
                      />
                      <button
                        onClick={() =>
                          handleCheckAvailability(
                            p.prescription_id,
                            facilityLookup[p.prescription_id] || referral.to_facility
                          )
                        }
                        className="px-3 py-1 bg-slate-900 text-white font-bold text-xs rounded-lg hover:bg-slate-800"
                      >
                        Check Availability
                      </button>
                    </div>

                    {avail && (
                      <div className="flex items-center gap-2">
                        <StatusBadge status={avail.availability} size="sm" />
                        <span className="font-mono font-bold text-xs text-slate-800">
                          {avail.quantity} units in stock
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Dispensing History Button */}
                  <div className="flex items-center justify-between text-xs pt-1">
                    <button
                      onClick={() => handleFetchDispensingHistory(p.prescription_id)}
                      className="text-teal-700 font-bold hover:underline flex items-center gap-1 text-[11px]"
                    >
                      <History className="w-3.5 h-3.5" /> View Dispensing History
                    </button>

                    {history && (
                      <span className="text-[11px] text-slate-500">
                        {history.length} dispense records found
                      </span>
                    )}
                  </div>

                  {history && history.length > 0 && (
                    <div className="bg-white p-3 rounded-xl border border-slate-200 text-xs divide-y divide-slate-100">
                      {history.map((h) => (
                        <div key={h.dispense_id} className="py-1.5 flex justify-between font-mono text-[11px]">
                          <span>Dispensed {h.quantity} units by {h.dispensed_by}</span>
                          <span className="text-slate-400">ID #{h.dispense_id}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Tabs: Vertical Audit Timeline vs Notifications */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-2xs space-y-4">
        <div className="flex items-center gap-4 border-b border-slate-100 pb-3">
          <button
            onClick={() => setActiveTab('events')}
            className={`font-bold text-sm flex items-center gap-2 pb-2 -mb-3 transition-colors border-b-2 ${
              activeTab === 'events'
                ? 'border-teal-700 text-teal-800'
                : 'border-transparent text-slate-400 hover:text-slate-700'
            }`}
          >
            <History className="w-4 h-4" /> Audit Events Timeline ({events.length})
          </button>

          <button
            onClick={() => setActiveTab('notifications')}
            className={`font-bold text-sm flex items-center gap-2 pb-2 -mb-3 transition-colors border-b-2 ${
              activeTab === 'notifications'
                ? 'border-teal-700 text-teal-800'
                : 'border-transparent text-slate-400 hover:text-slate-700'
            }`}
          >
            <MessageSquare className="w-4 h-4" /> SMS & Push Notifications ({notifications.length})
          </button>
        </div>

        {activeTab === 'events' ? (
          <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
            {events.map((ev) => (
              <div key={ev.log_id} className="relative flex items-start gap-3">
                <div className="absolute -left-6 top-1.5 w-3 h-3 rounded-full bg-teal-700 ring-4 ring-white"></div>
                <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 flex-1 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-extrabold text-xs text-slate-900 font-mono">
                      {ev.action}
                    </span>
                    <span className="text-[11px] text-slate-400 font-mono">
                      {new Date(ev.created_at).toLocaleString()}
                    </span>
                  </div>
                  <p className="text-xs text-slate-700 font-medium">Actor: {ev.actor} ({ev.role})</p>
                  {ev.details && <p className="text-xs text-slate-500 font-mono bg-white p-2 rounded-lg border border-slate-100">{ev.details}</p>}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-3">
            {notifications.map((n) => (
              <div key={n.notification_id} className="p-4 bg-teal-50/50 rounded-2xl border border-teal-200/70 space-y-1">
                <div className="flex items-center justify-between text-xs font-bold text-teal-900">
                  <span className="px-2 py-0.5 bg-teal-200 text-teal-900 rounded font-mono text-[10px]">
                    {n.channel} ➔ {n.recipient}
                  </span>
                  <span className="text-slate-400 font-normal font-mono">
                    {new Date(n.created_at).toLocaleTimeString()}
                  </span>
                </div>
                <p className="text-xs text-slate-800 font-medium leading-relaxed">{n.message}</p>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
}
