export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastMessage {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  duration?: number;
}

type ToastListener = (toast: ToastMessage) => void;

class ToastManager {
  private listeners: ToastListener[] = [];

  subscribe(listener: ToastListener) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  show(type: ToastType, title: string, message?: string, duration: number = 4000) {
    const id = Math.random().toString(36).substring(2, 9);
    const toast: ToastMessage = { id, type, title, message, duration };
    this.listeners.forEach((listener) => listener(toast));
  }

  success(title: string, message?: string) {
    this.show('success', title, message);
  }

  error(title: string, message?: string) {
    this.show('error', title, message, 5000);
  }

  warning(title: string, message?: string) {
    this.show('warning', title, message);
  }

  info(title: string, message?: string) {
    this.show('info', title, message);
  }
}

export const toast = new ToastManager();
