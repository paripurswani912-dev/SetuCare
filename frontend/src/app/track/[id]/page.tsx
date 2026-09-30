'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { apiFetch } from '@/lib/api';
import { ReferralTimeline, ReferralStatus } from '@/types';
import { Activity, Check, Clock, Calendar, HeartPulse, Building2, ShieldCheck } from 'lucide-react';

const PUBLIC_STEPS = [
  { key: 'CREATED', label: 'Created' },
  { key: 'ACKNOWLEDGED', label: 'Received' },
  { key: 'TREATMENT', label: 'Treated' },
  { key: 'FOLLOW_UP', label: 'Follow-up' },
  { key: 'COMPLETED', label: 'Closed' },
];

export default function PublicTrackPage() {
  const params = useParams();
  const referralId = params.id as string;

  const [timeline, setTimeline] = useState<ReferralTimeline | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchTimeline();
  }, [referralId]);

  const fetchTimeline = async () => {
    setIsLoading(true);
    try {
      const data = await apiFetch<ReferralTimeline>(`/referrals/${referralId}/timeline`);
      setTimeline(data);
    } catch (err: any) {
      setError('Referral record not found or link expired.');
    } finally {
      setIsLoading(false);
    }
  };

  const getPublicStepIndex = (status: ReferralStatus) => {
    switch (status) {
      case 'CREATED':
        return 0;
      case 'ACKNOWLEDGED':
      case 'APPOINTMENT':
      case 'CHECKED_IN':
      case 'IN_CONSULTATION':
        return 1;
      case 'TREATMENT':
      case 'COUNTER_REFERRAL':
        return 2;
      case 'FOLLOW_UP':
        return 3;
      case 'COMPLETED':
        return 4;
      default:
        return 0;
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="text-center space-y-3">
          <Activity className="w-10 h-10 text-teal-700 animate-spin mx-auto" />
          <p className="text-sm font-bold text-slate-700">Loading Patient Tracking Record...</p>
        </div>
      </div>
    );
  }

  if (error || !timeline) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-3xl border border-slate-200 text-center space-y-4 max-w-sm shadow-xl">
          <HeartPulse className="w-12 h-12 text-rose-500 mx-auto" />
          <h2 className="text-lg font-bold text-slate-900">Record Not Found</h2>
          <p className="text-xs text-slate-500">{error || 'Please check the scanned QR code.'}</p>
        </div>
      </div>
    );
  }

  const { referral, patient } = timeline;
  const currentStepIdx = getPublicStepIndex(referral.status);

  const getPlainStatusText = (status: ReferralStatus) => {
    switch (status) {
      case 'CREATED':
        return 'Referral issued by referring health worker. Waiting for receiving hospital.';
      case 'ACKNOWLEDGED':
        return 'Hospital has received your referral and is preparing for your visit.';
      case 'APPOINTMENT':
        return 'Your appointment date has been scheduled at the hospital.';
      case 'CHECKED_IN':
        return 'Checked in at hospital reception. Waiting for doctor.';
      case 'IN_CONSULTATION':
        return 'Currently seeing the specialist doctor.';
      case 'TREATMENT':
        return 'Treatment provided. Advice sent back to referring health worker.';
      case 'COUNTER_REFERRAL':
        return 'Treatment completed. ASHA worker informed for follow-up care.';
      case 'FOLLOW_UP':
        return 'ASHA worker home visit scheduled for recovery check.';
      case 'COMPLETED':
        return 'Care journey completed. Patient fully recovered.';
      default:
        return status;
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 py-8 px-4 flex flex-col items-center">
      <div className="max-w-md w-full bg-white rounded-3xl p-6 sm:p-8 shadow-2xl border border-slate-200 space-y-8">
        
        {/* Header */}
        <div className="text-center space-y-2 border-b border-slate-100 pb-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-50 text-teal-800 text-xs font-extrabold border border-teal-200">
            <ShieldCheck className="w-4 h-4 text-teal-700" />
            SetuCare Public Portal
          </div>
          <h1 className="text-2xl font-black text-slate-900">
            Referral #{referral.referral_id}
          </h1>
          <p className="text-sm font-bold text-teal-800">
            {patient.name}
          </p>
        </div>

        {/* 5-Step Visual Progress Bar */}
        <div className="space-y-4">
          <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider text-center">
            Patient Care Progress
          </h2>

          <div className="flex items-center justify-between relative px-2">
            {PUBLIC_STEPS.map((step, idx) => {
              const isPast = idx < currentStepIdx;
              const isCurrent = idx === currentStepIdx;

              return (
                <div key={step.key} className="flex-1 flex flex-col items-center relative">
                  {/* Connector */}
                  {idx > 0 && (
                    <div
                      className={`absolute top-4 -left-1/2 right-1/2 h-1.5 transition-all ${
                        idx <= currentStepIdx ? 'bg-teal-600' : 'bg-slate-200'
                      }`}
                    ></div>
                  )}

                  <div
                    className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs z-10 ${
                      isPast
                        ? 'bg-teal-600 text-white'
                        : isCurrent
                        ? 'bg-teal-700 text-white ring-4 ring-teal-100 animate-pulse'
                        : 'bg-slate-100 text-slate-400 border border-slate-200'
                    }`}
                  >
                    {isPast ? <Check className="w-5 h-5" /> : idx + 1}
                  </div>

                  <span
                    className={`mt-2 text-[11px] font-bold text-center leading-tight ${
                      isCurrent ? 'text-teal-900' : isPast ? 'text-slate-800' : 'text-slate-400'
                    }`}
                  >
                    {step.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Plain Language Status Banner */}
        <div className="p-5 bg-teal-50 rounded-2xl border border-teal-200 space-y-2 text-center">
          <span className="text-[11px] font-bold uppercase tracking-wider text-teal-700 block">
            Current Status
          </span>
          <h3 className="text-lg font-black text-slate-900">
            {referral.status.replace(/_/g, ' ')}
          </h3>
          <p className="text-xs text-slate-700 font-medium leading-relaxed">
            {getPlainStatusText(referral.status)}
          </p>
        </div>

        {/* Next Appointment / Details Box */}
        <div className="space-y-3 bg-slate-50 p-4 rounded-2xl border border-slate-200 text-xs">
          <div className="flex items-center justify-between border-b border-slate-200 pb-2">
            <span className="text-slate-500 font-semibold flex items-center gap-1.5">
              <Building2 className="w-4 h-4 text-slate-400" /> Receiving Hospital:
            </span>
            <span className="font-bold text-slate-900">{referral.to_facility}</span>
          </div>

          {referral.appointment_date && (
            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
              <span className="text-slate-500 font-semibold flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-teal-700" /> Next Appointment:
              </span>
              <span className="font-bold text-teal-900">
                {new Date(referral.appointment_date).toLocaleString()}
              </span>
            </div>
          )}

          {referral.follow_up_date && (
            <div className="flex items-center justify-between">
              <span className="text-slate-500 font-semibold flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-teal-700" /> ASHA Follow-up Date:
              </span>
              <span className="font-bold text-slate-900">
                {new Date(referral.follow_up_date).toLocaleDateString()}
              </span>
            </div>
          )}
        </div>

        {/* Privacy Note */}
        <p className="text-[11px] text-center text-slate-400">
          This portal displays non-clinical status updates only. Confidential medical notes are restricted under ABDM Privacy Guidelines.
        </p>

      </div>
    </div>
  );
}
