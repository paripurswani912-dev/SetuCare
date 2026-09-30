'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useLanguage } from '@/lib/languageContext';
import { getCurrentRole } from '@/lib/api';
import { Role } from '@/types';
import {
  UserPlus,
  Send,
  Inbox,
  Clock,
  Boxes,
  Pill,
  LayoutDashboard,
  ShieldCheck,
  Search,
  Home,
} from 'lucide-react';

interface NavItem {
  key: string;
  labelKey: string;
  href: string;
  icon: React.ReactNode;
  roles: Role[];
}

export const SidebarNav: React.FC = () => {
  const pathname = usePathname();
  const { t } = useLanguage();
  const [role, setRoleState] = useState<Role>('ADMIN');

  useEffect(() => {
    setRoleState(getCurrentRole() as Role);
  }, []);

  const navItems: NavItem[] = [
    {
      key: 'home',
      labelKey: 'pageLanding',
      href: '/',
      icon: <Home className="w-5 h-5" />,
      roles: ['ASHA', 'DOCTOR', 'FACILITY_ADMIN', 'DISTRICT_MANAGER', 'ADMIN'],
    },
    {
      key: 'registerPatient',
      labelKey: 'registerPatient',
      href: '/patients/new',
      icon: <UserPlus className="w-5 h-5" />,
      roles: ['ASHA', 'ADMIN'],
    },
    {
      key: 'newReferral',
      labelKey: 'newReferral',
      href: '/referrals/new',
      icon: <Send className="w-5 h-5" />,
      roles: ['ASHA', 'ADMIN'],
    },
    {
      key: 'myReferrals',
      labelKey: 'myReferrals',
      href: '/referrals',
      icon: <Inbox className="w-5 h-5" />,
      roles: ['ASHA', 'DOCTOR', 'FACILITY_ADMIN', 'ADMIN'],
    },
    {
      key: 'queue',
      labelKey: 'queue',
      href: '/queue',
      icon: <Clock className="w-5 h-5" />,
      roles: ['DOCTOR', 'FACILITY_ADMIN', 'ADMIN'],
    },
    {
      key: 'resources',
      labelKey: 'resources',
      href: '/resources',
      icon: <Boxes className="w-5 h-5" />,
      roles: ['FACILITY_ADMIN', 'ADMIN'],
    },
    {
      key: 'medicines',
      labelKey: 'medicines',
      href: '/medicines',
      icon: <Pill className="w-5 h-5" />,
      roles: ['FACILITY_ADMIN', 'ADMIN'],
    },
    {
      key: 'dashboard',
      labelKey: 'dashboard',
      href: '/dashboard',
      icon: <LayoutDashboard className="w-5 h-5" />,
      roles: ['DISTRICT_MANAGER', 'ADMIN'],
    },
    {
      key: 'auditLog',
      labelKey: 'auditLog',
      href: '/audit',
      icon: <ShieldCheck className="w-5 h-5" />,
      roles: ['DISTRICT_MANAGER', 'FACILITY_ADMIN', 'ADMIN'],
    },
  ];

  const filteredItems = navItems.filter(
    (item) => role === 'ADMIN' || item.roles.includes(role)
  );

  return (
    <>
      {/* Desktop Sidebar (md+) */}
      <aside className="hidden md:flex flex-col w-64 bg-white border-r border-slate-200 shrink-0 min-h-[calc(100vh-4rem)] p-4 space-y-1">
        <div className="px-3 py-2 text-xs font-bold text-slate-400 uppercase tracking-wider">
          {role} Navigation
        </div>
        <nav className="space-y-1">
          {filteredItems.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href !== '/' && pathname.startsWith(item.href));

            return (
              <Link
                key={item.key}
                href={item.href}
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-semibold text-sm transition-all ${
                  isActive
                    ? 'bg-teal-50 text-teal-800 shadow-2xs border border-teal-200/60'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <span className={isActive ? 'text-teal-700' : 'text-slate-400'}>
                  {item.icon}
                </span>
                <span>{t(item.labelKey)}</span>
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* Mobile Bottom Navigation (<md) */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 px-2 py-1.5 flex items-center justify-around shadow-lg">
        {filteredItems.slice(0, 5).map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href !== '/' && pathname.startsWith(item.href));

          return (
            <Link
              key={item.key}
              href={item.href}
              className={`flex flex-col items-center justify-center py-1 px-2 rounded-lg text-[10px] font-medium transition-colors ${
                isActive ? 'text-teal-700 font-bold' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <span className={`p-1 rounded-lg ${isActive ? 'bg-teal-50' : ''}`}>
                {item.icon}
              </span>
              <span className="truncate max-w-[64px]">{t(item.labelKey)}</span>
            </Link>
          );
        })}
      </div>
    </>
  );
};
