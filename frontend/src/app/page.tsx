'use client';

import React from 'react';
import Link from 'next/link';
import { useLanguage } from '@/lib/languageContext';
import { PageHeader } from '@/components/PageHeader';
import {
  UserPlus,
  Send,
  Inbox,
  Clock,
  Boxes,
  Pill,
  LayoutDashboard,
  ShieldCheck,
  CheckCircle2,
  ArrowRight,
  Activity,
  Layers,
  HeartPulse,
  Database,
  Building2,
} from 'lucide-react';

export default function LandingPage() {
  const { t } = useLanguage();

  const steps = [
    { num: '01', title: 'Registration & Consent', desc: 'ABHA/Phone duplicate check + patient digital consent' },
    { num: '02', title: 'Triage & Referral Creation', desc: 'Resource auto-match across PHC, CHC & District Hospitals' },
    { num: '03', title: 'Facility Check-in & Consult', desc: 'Real-time queueing, clinical notes & e-prescriptions' },
    { num: '04', title: 'Counter-Referral', desc: 'Closed-loop feedback to referring frontline worker' },
    { num: '05', title: 'ASHA Follow-up & Closure', desc: 'Home visits, SLA tracking & district monitoring' },
  ];

  const roleCards = [
    {
      role: 'ASHA / ANM Worker',
      desc: 'Register frontline patients, capture digital consent, and issue priority referrals.',
      actions: [
        { label: 'Register Patient', href: '/patients/new', icon: <UserPlus className="w-4 h-4" /> },
        { label: 'New Referral', href: '/referrals/new', icon: <Send className="w-4 h-4" /> },
        { label: 'My Referrals', href: '/referrals', icon: <Inbox className="w-4 h-4" /> },
      ],
      color: 'border-teal-200 bg-teal-50/50',
      badgeColor: 'bg-teal-100 text-teal-800',
    },
    {
      role: 'Doctor / Medical Officer',
      desc: 'Acknowledge incoming cases, conduct consultations, record treatments & e-prescriptions.',
      actions: [
        { label: 'Referral Inbox', href: '/referrals', icon: <Inbox className="w-4 h-4" /> },
        { label: 'Facility Queue', href: '/queue', icon: <Clock className="w-4 h-4" /> },
      ],
      color: 'border-blue-200 bg-blue-50/50',
      badgeColor: 'bg-blue-100 text-blue-800',
    },
    {
      role: 'Facility Admin',
      desc: 'Manage ICU bed & ambulance resource match, track e-Aushadhi stock, check-in patients.',
      actions: [
        { label: 'Manage Resources', href: '/resources', icon: <Boxes className="w-4 h-4" /> },
        { label: 'Medicine Stock', href: '/medicines', icon: <Pill className="w-4 h-4" /> },
        { label: 'Facility Queue', href: '/queue', icon: <Clock className="w-4 h-4" /> },
      ],
      color: 'border-indigo-200 bg-indigo-50/50',
      badgeColor: 'bg-indigo-100 text-indigo-800',
    },
    {
      role: 'District Health Officer',
      desc: 'Monitor district SLA compliance, trigger automated breach escalations, audit logs.',
      actions: [
        { label: 'District Dashboard', href: '/dashboard', icon: <LayoutDashboard className="w-4 h-4" /> },
        { label: 'System Audit Log', href: '/audit', icon: <ShieldCheck className="w-4 h-4" /> },
      ],
      color: 'border-purple-200 bg-purple-50/50',
      badgeColor: 'bg-purple-100 text-purple-800',
    },
  ];

  const systemIntegrations = [
    { name: 'ABDM / ABHA', desc: 'Ayushman Bharat Digital Mission (Health ID)', tag: 'FHIR R4 Adapter' },
    { name: 'RCH Portal', desc: 'Reproductive & Child Health Portal', tag: 'REST Connector' },
    { name: 'ANMOL', desc: 'ANM Online Mobile Application', tag: 'Offline Sync API' },
    { name: 'HFR', desc: 'Health Facility Registry', tag: 'Location Directory' },
    { name: 'e-Aushadhi', desc: 'DVDMS Drug Management System', tag: 'Inventory Protocol' },
    { name: 'ORS', desc: 'Online Registration System (AIIMS/DH)', tag: 'Queue Interop' },
  ];

  return (
    <div className="space-y-10 max-w-6xl mx-auto">
      <PageHeader
        title={t('pageLanding')}
        description="Unified, closed-loop healthcare referral tracking bridging ASHA workers, doctors, facility admins, and district managers across India."
      />

      {/* Hero Card */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-teal-900 via-teal-800 to-slate-900 text-white p-6 sm:p-10 shadow-xl">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="relative z-10 max-w-3xl space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-teal-200 text-xs font-bold uppercase tracking-wider border border-white/15">
            <Activity className="w-4 h-4 text-teal-400" />
            National Health Interoperability Standard
          </div>
          <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-white leading-tight">
            Eliminate Broken Referrals Across Fragmented Government Systems
          </h1>
          <p className="text-slate-200 text-sm sm:text-base leading-relaxed">
            SetuCare guarantees seamless end-to-end referral tracking from rural PHC outreach to district hospital care, ensuring zero lost patients, real-time SLA enforcement, and automated counter-referrals.
          </p>

          <div className="pt-4 flex flex-wrap items-center gap-3">
            <Link
              href="/referrals/new"
              className="px-5 py-3 rounded-xl bg-teal-500 text-slate-950 font-bold text-sm hover:bg-teal-400 transition-all flex items-center gap-2 shadow-lg shadow-teal-500/20"
            >
              <Send className="w-4 h-4" /> Create Priority Referral
            </Link>
            <Link
              href="/dashboard"
              className="px-5 py-3 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold text-sm backdrop-blur-md transition-all border border-white/20 flex items-center gap-2"
            >
              <LayoutDashboard className="w-4 h-4" /> District Analytics
            </Link>
          </div>
        </div>
      </div>

      {/* 5-Step Care Journey Visual Stepper */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-2xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <HeartPulse className="w-5 h-5 text-teal-700" />
              Unified 5-Step Care Journey Protocol
            </h2>
            <p className="text-xs text-slate-500">
              Every referral follows a transparent, auditable 5-phase closed loop.
            </p>
          </div>
          <span className="px-3 py-1 bg-teal-50 text-teal-800 rounded-full text-xs font-bold border border-teal-200">
            SLA Monitored
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 relative">
          {steps.map((s, idx) => (
            <div
              key={s.num}
              className="relative bg-slate-50 rounded-2xl p-4 border border-slate-200 flex flex-col justify-between hover:border-teal-300 hover:bg-teal-50/30 transition-all"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-black text-teal-700 font-mono bg-teal-100 px-2 py-0.5 rounded-md">
                  {s.num}
                </span>
                {idx < steps.length - 1 && (
                  <ArrowRight className="hidden md:block w-4 h-4 text-slate-300 absolute -right-3 top-1/2 -translate-y-1/2 z-10 bg-white rounded-full p-0.5" />
                )}
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">{s.title}</h3>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">{s.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Role Workflows */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Layers className="w-5 h-5 text-teal-700" />
            Role-Based Workflows
          </h2>
          <span className="text-xs text-slate-500">Select active role in top navigation bar</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {roleCards.map((rc) => (
            <div key={rc.role} className={`rounded-2xl p-6 border ${rc.color} space-y-4 flex flex-col justify-between`}>
              <div>
                <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${rc.badgeColor}`}>
                  {rc.role}
                </span>
                <p className="text-xs text-slate-600 mt-3 leading-relaxed">{rc.desc}</p>
              </div>

              <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-200/60">
                {rc.actions.map((act) => (
                  <Link
                    key={act.label}
                    href={act.href}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-white rounded-xl text-xs font-bold text-slate-800 hover:bg-slate-900 hover:text-white border border-slate-200 shadow-2xs transition-all"
                  >
                    {act.icon}
                    <span>{act.label}</span>
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* System Integration Strip */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-2xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <Database className="w-5 h-5 text-teal-700" />
            <h3 className="text-sm font-bold text-slate-900">Connected Government Healthcare Ecosystems</h3>
          </div>
          <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600 font-semibold border border-slate-200">
            via FHIR/REST adapters (roadmap)
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {systemIntegrations.map((sys) => (
            <div key={sys.name} className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-center space-y-1">
              <div className="flex items-center justify-center gap-1">
                <Building2 className="w-3.5 h-3.5 text-teal-700" />
                <span className="font-extrabold text-xs text-slate-900">{sys.name}</span>
              </div>
              <p className="text-[10px] text-slate-500 leading-tight line-clamp-1">{sys.desc}</p>
              <span className="inline-block text-[9px] px-1.5 py-0.2 rounded bg-slate-200/70 text-slate-700 font-mono font-semibold">
                {sys.tag}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
