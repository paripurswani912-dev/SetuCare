import { QueuedOfflineRequest } from '@/types';
import { toast } from './toast';

const OFFLINE_TOGGLE_KEY = 'setucare_simulated_offline';
const QUEUE_KEY = 'setucare_offline_queue';

type QueueListener = (queue: QueuedOfflineRequest[], isOffline: boolean) => void;
const listeners: Set<QueueListener> = new Set();

export function subscribeOfflineState(listener: QueueListener) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function notifyListeners() {
  const q = getOfflineQueue();
  const off = getSimulatedOffline();
  listeners.forEach((l) => l(q, off));
}

export function getSimulatedOffline(): boolean {
  if (typeof window === 'undefined') return false;
  return localStorage.getItem(OFFLINE_TOGGLE_KEY) === 'true';
}

export function setSimulatedOffline(offline: boolean) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(OFFLINE_TOGGLE_KEY, offline ? 'true' : 'false');
  notifyListeners();
  toast.info(offline ? 'Switched to Offline Mode' : 'Switched to Online Mode', offline ? 'Mutations will be queued locally.' : 'Syncing queued changes...');
}

export function getOfflineQueue(): QueuedOfflineRequest[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(QUEUE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function enqueueOfflineRequest(endpoint: string, method: string, body?: any): QueuedOfflineRequest {
  const queue = getOfflineQueue();
  const newItem: QueuedOfflineRequest = {
    id: Math.random().toString(36).substring(2, 9),
    endpoint,
    method,
    body,
    timestamp: new Date().toISOString(),
  };
  queue.push(newItem);
  localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
  notifyListeners();
  toast.warning('Action Queued Offline', `${method} ${endpoint} stored. Will sync when back online.`);
  return newItem;
}

export function removeQueuedRequest(id: string) {
  const queue = getOfflineQueue().filter((item) => item.id !== id);
  localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
  notifyListeners();
}

export function clearOfflineQueue() {
  localStorage.setItem(QUEUE_KEY, JSON.stringify([]));
  notifyListeners();
}

export async function replayOfflineQueue(
  apiFetch: (endpoint: string, options?: RequestInit) => Promise<any>
) {
  const queue = getOfflineQueue();
  if (queue.length === 0) return;

  toast.info('Syncing Offline Queue...', `Processing ${queue.length} pending actions.`);
  let successCount = 0;
  let failCount = 0;
  const remaining: QueuedOfflineRequest[] = [];

  for (const item of queue) {
    try {
      await apiFetch(item.endpoint, {
        method: item.method,
        body: item.body ? JSON.stringify(item.body) : undefined,
        headers: {
          'Content-Type': 'application/json',
        },
      });
      successCount++;
    } catch (err: any) {
      failCount++;
      remaining.push(item);
    }
  }

  localStorage.setItem(QUEUE_KEY, JSON.stringify(remaining));
  notifyListeners();

  if (failCount === 0) {
    toast.success('Offline Sync Complete', `All ${successCount} queued actions synchronized successfully.`);
  } else {
    toast.error('Offline Sync Partial', `Synced ${successCount} actions. ${failCount} actions failed.`);
  }
}
