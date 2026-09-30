'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useLanguage } from '@/lib/languageContext';
import { getCurrentRole, setCurrentRole, getCurrentUser, setCurrentUser, apiFetch } from '@/lib/api';
import {
  getSimulatedOffline,
  setSimulatedOffline,
  getOfflineQueue,
  subscribeOfflineState,
  replayOfflineQueue,
  removeQueuedRequest,
  clearOfflineQueue,
} from '@/lib/offlineQueue';
import { Role, QueuedOfflineRequest } from '@/types';
import {
  Activity,
  Wifi,
  WifiOff,
  Globe,
  UserCheck,
  RefreshCw,
  Trash2,
  X,
  Layers,
  ChevronDown,
} from 'lucide-react';

export const HeaderNav: React.FC = () => {
  const { language, setLanguage, t } = useLanguage();
  const [role, setRoleState] = useState<Role>('ADMIN');
  const [userName, setUserNameState] = useState<string>('');
  const [isOffline, setIsOfflineState] = useState<boolean>(false);
  const [queue, setQueueState] = useState<QueuedOfflineRequest[]>([]);
  const [showDrawer, setShowDrawer] = useState<boolean>(false);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);

  useEffect(() => {
    setRoleState(getCurrentRole() as Role);
    setUserNameState(getCurrentUser());
    setIsOfflineState(getSimulatedOffline());
    setQueueState(getOfflineQueue());

    const unsubscribe = subscribeOfflineState((q, off) => {
      setQueueState(q);
      setIsOfflineState(off);
    });

    return unsubscribe;
  }, []);

  const handleRoleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newRole = e.target.value as Role;
    setRoleState(newRole);
    setCurrentRole(newRole);
    // Reload page or let components react
    window.location.reload();
  };

  const handleUserBlur = () => {
    setCurrentUser(userName);
  };

  const toggleOfflineMode = () => {
    const next = !isOffline;
    setIsOfflineState(next);
    setSimulatedOffline(next);
  };

  const handleSyncNow = async () => {
    setIsSyncing(true);
    await replayOfflineQueue(apiFetch);
    setIsSyncing(false);
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-2xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          
          {/* Logo & Brand */}
          <Link href="/" className="flex items-center gap-2.5 shrink-0 group">
            <div className="w-9 h-9 rounded-xl bg-teal-700 text-white flex items-center justify-center shadow-md shadow-teal-700/20 group-hover:bg-teal-800 transition-colors">
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <span className="text-lg font-extrabold text-slate-900 tracking-tight flex items-center gap-1.5">
                {t('appName')}
                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-teal-50 text-teal-700 border border-teal-200 font-semibold tracking-normal hidden sm:inline-block">
                  Govt ABDM / HFR
                </span>
              </span>
              <p className="text-[11px] text-slate-500 font-medium leading-none hidden md:block">
                {t('tagline')}
              </p>
            </div>
          </Link>

          {/* Right Controls: Role, User, Offline, Lang */}
          <div className="flex items-center gap-2 md:gap-3">
            
            {/* Offline/Online Toggle Pill */}
            <button
              onClick={toggleOfflineMode}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border transition-all ${
                isOffline
                  ? 'bg-amber-100 text-amber-900 border-amber-300'
                  : 'bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100'
              }`}
              title="Toggle simulated network connectivity"
            >
              {isOffline ? (
                <>
                  <WifiOff className="w-3.5 h-3.5 text-amber-700 animate-pulse" />
                  <span className="hidden sm:inline">{t('offline')}</span>
                </>
              ) : (
                <>
                  <Wifi className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="hidden sm:inline">{t('online')}</span>
                </>
              )}
            </button>

            {/* Offline Queue Badge Drawer Trigger */}
            {queue.length > 0 && (
              <button
                onClick={() => setShowDrawer(true)}
                className="relative flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-800 border border-rose-300 hover:bg-rose-200 transition-all animate-bounce"
              >
                <Layers className="w-3.5 h-3.5" />
                <span>{queue.length}</span>
                <span className="hidden md:inline">{t('pendingSync')}</span>
              </button>
            )}

            {/* EN / हिन्दी Language Toggle */}
            <button
              onClick={() => setLanguage(language === 'en' ? 'hi' : 'en')}
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200 transition-colors"
            >
              <Globe className="w-3.5 h-3.5 text-teal-700" />
              <span>{language === 'en' ? 'हिन्दी' : 'English'}</span>
            </button>

            {/* Role Switcher & User Name Field */}
            <div className="flex items-center gap-1.5 bg-slate-100/80 p-1 rounded-xl border border-slate-200">
              <div className="relative">
                <select
                  value={role}
                  onChange={handleRoleChange}
                  className="appearance-none bg-white text-slate-900 text-xs font-bold pl-2.5 pr-7 py-1 rounded-lg border border-slate-200 cursor-pointer focus:outline-none focus:ring-2 focus:ring-teal-500 shadow-2xs"
                >
                  <option value="ASHA">ASHA / ANM</option>
                  <option value="DOCTOR">DOCTOR</option>
                  <option value="FACILITY_ADMIN">FACILITY ADMIN</option>
                  <option value="DISTRICT_MANAGER">DISTRICT MANAGER</option>
                  <option value="ADMIN">SYSTEM ADMIN</option>
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-slate-500 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>

              <div className="hidden lg:flex items-center gap-1 bg-white px-2 py-1 rounded-lg border border-slate-200 text-xs">
                <UserCheck className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <input
                  type="text"
                  value={userName}
                  onChange={(e) => setUserNameState(e.target.value)}
                  onBlur={handleUserBlur}
                  placeholder="User Name"
                  className="w-24 text-xs text-slate-800 font-medium focus:outline-none"
                />
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* Offline Sync Drawer Modal */}
      {showDrawer && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex justify-end">
          <div className="w-full max-w-md bg-white h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-200">
            <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2">
                <Layers className="w-5 h-5 text-teal-700" />
                <h3 className="font-bold text-slate-900 text-base">Offline Sync Queue</h3>
                <span className="px-2 py-0.5 text-xs bg-rose-100 text-rose-800 font-bold rounded-full">
                  {queue.length}
                </span>
              </div>
              <button
                onClick={() => setShowDrawer(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 flex-1 overflow-y-auto space-y-3">
              {queue.length === 0 ? (
                <div className="text-center py-12 text-slate-500 text-sm">
                  No queued actions pending.
                </div>
              ) : (
                queue.map((item) => (
                  <div key={item.id} className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1">
                    <div className="flex items-center justify-between font-mono font-bold">
                      <span className="px-1.5 py-0.5 rounded bg-teal-100 text-teal-800">{item.method}</span>
                      <span className="text-slate-500 font-normal">{new Date(item.timestamp).toLocaleTimeString()}</span>
                    </div>
                    <div className="font-mono text-slate-800 truncate">{item.endpoint}</div>
                    {item.body && (
                      <pre className="p-2 bg-white rounded border border-slate-100 text-[11px] overflow-x-auto text-slate-600 font-mono">
                        {JSON.stringify(item.body, null, 2)}
                      </pre>
                    )}
                    <div className="flex justify-end pt-1">
                      <button
                        onClick={() => removeQueuedRequest(item.id)}
                        className="text-rose-600 hover:text-rose-800 flex items-center gap-1 text-[11px] font-semibold"
                      >
                        <Trash2 className="w-3.5 h-3.5" /> Remove
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="p-4 border-t border-slate-200 bg-slate-50 flex gap-2">
              <button
                onClick={handleSyncNow}
                disabled={isSyncing || queue.length === 0}
                className="flex-1 py-2.5 px-4 bg-teal-700 text-white font-bold rounded-xl hover:bg-teal-800 disabled:opacity-50 flex items-center justify-center gap-2 text-sm shadow-md"
              >
                <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
                {t('syncNow')}
              </button>
              <button
                onClick={clearOfflineQueue}
                disabled={queue.length === 0}
                className="py-2.5 px-3 bg-rose-50 text-rose-700 font-semibold rounded-xl hover:bg-rose-100 border border-rose-200 text-xs"
              >
                Clear All
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
