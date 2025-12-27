import { storageService } from './storageService';

export type LogLevel = 'info' | 'warn' | 'error' | 'success';

export interface SystemLog {
  id: string;
  timestamp: number;
  level: LogLevel;
  category: string;
  message: string;
  details?: any;
}

class LoggerService {
  private logs: SystemLog[] = [];
  private listeners: ((logs: SystemLog[]) => void)[] = [];
  private maxLogs = 1000;

  constructor() {
    // Load persisted logs from session storage if available
    try {
      const saved = sessionStorage.getItem('quanta_debug_logs');
      if (saved) {
        this.logs = JSON.parse(saved);
      }
    } catch (e) {
      console.warn('Failed to load logs');
    }
  }

  private persist() {
    try {
      sessionStorage.setItem('quanta_debug_logs', JSON.stringify(this.logs.slice(0, 50))); // Keep only last 50 in session
    } catch (e) {
      // Ignore
    }
  }

  log(level: LogLevel, category: string, message: string, details?: any) {
    const newLog: SystemLog = {
      id: Math.random().toString(36).substr(2, 9),
      timestamp: Date.now(),
      level,
      category,
      message,
      details
    };

    console.log(`[${category}] ${message}`, details || '');

    this.logs.unshift(newLog);
    if (this.logs.length > this.maxLogs) {
      this.logs.pop();
    }

    this.notifyListeners();
    this.persist();
  }

  info(category: string, message: string, details?: any) {
    this.log('info', category, message, details);
  }

  warn(category: string, message: string, details?: any) {
    this.log('warn', category, message, details);
  }

  error(category: string, message: string, details?: any) {
    this.log('error', category, message, details);
  }

  success(category: string, message: string, details?: any) {
    this.log('success', category, message, details);
  }

  getLogs(): SystemLog[] {
    return this.logs;
  }

  clear() {
    this.logs = [];
    this.notifyListeners();
    this.persist();
  }

  subscribe(listener: (logs: SystemLog[]) => void) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  private notifyListeners() {
    this.listeners.forEach(l => l(this.logs));
  }
}

export const logger = new LoggerService();
