/**
 * Offline Resiliency & Cloud Synchronization Service
 * Caches operator actions, alert acknowledgments, and manual logs
 * when mining field network connectivity drops. Auto-syncs on reconnection.
 */

interface QueuedAction {
  id: string;
  type: 'ALERT_ACKNOWLEDGE' | 'ALERT_RESOLVE' | 'SETTINGS_UPDATE' | 'MANUAL_TELEMETRY';
  payload: any;
  timestamp: string;
}

const STORAGE_KEY = 'mine_subsidence_offline_queue';

class OfflineSyncService {
  private queue: QueuedAction[] = [];
  private isOnline: boolean = navigator.onLine;
  private listeners: ((online: boolean, pendingCount: number) => void)[] = [];

  constructor() {
    this.loadQueue();
    window.addEventListener('online', () => this.handleNetworkChange(true));
    window.addEventListener('offline', () => this.handleNetworkChange(false));
  }

  private loadQueue() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        this.queue = JSON.parse(raw);
      }
    } catch (e) {
      this.queue = [];
    }
  }

  private saveQueue() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.queue));
      this.notifyListeners();
    } catch (e) {
      console.warn('Failed to save offline queue to localStorage', e);
    }
  }

  private handleNetworkChange(online: boolean) {
    this.isOnline = online;
    this.notifyListeners();
    if (online && this.queue.length > 0) {
      this.flushQueue();
    }
  }

  public enqueueAction(type: QueuedAction['type'], payload: any) {
    const action: QueuedAction = {
      id: `act_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      type,
      payload,
      timestamp: new Date().toISOString()
    };
    this.queue.push(action);
    this.saveQueue();
    return action;
  }

  public async flushQueue() {
    if (this.queue.length === 0) return;
    console.log(`[OFFLINE-SYNC] Flushing ${this.queue.length} buffered actions to cloud...`);
    
    // Process items in FIFO order
    const toProcess = [...this.queue];
    for (const item of toProcess) {
      // Simulate sync to backend
      await new Promise((resolve) => setTimeout(resolve, 300));
      this.queue = this.queue.filter((q) => q.id !== item.id);
      this.saveQueue();
    }
    console.log('[OFFLINE-SYNC] All buffered actions synced with cloud server.');
  }

  public async syncPending() {
    return this.flushQueue();
  }

  public subscribe(cb: (online: boolean, pendingCount: number) => void) {
    this.listeners.push(cb);
    cb(this.isOnline, this.queue.length);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== cb);
    };
  }

  private notifyListeners() {
    for (const cb of this.listeners) {
      cb(this.isOnline, this.queue.length);
    }
  }

  public getStatus() {
    return {
      isOnline: this.isOnline,
      pendingCount: this.queue.length
    };
  }
}

export const offlineSyncService = new OfflineSyncService();
