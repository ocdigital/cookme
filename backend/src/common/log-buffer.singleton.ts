import { Subject } from 'rxjs';

export type LogLevel = 'log' | 'error' | 'warn' | 'debug' | 'verbose';

export interface LogEntry {
  ts: string;
  level: LogLevel;
  context: string;
  message: string;
}

const MAX_LINES = 50;

export const logBuffer: LogEntry[] = [];
export const logStream$ = new Subject<LogEntry>();

export function pushLog(level: LogLevel, message: string, context = ''): void {
  const entry: LogEntry = {
    ts: new Date().toISOString(),
    level,
    context,
    message: String(message),
  };
  if (logBuffer.length >= MAX_LINES) logBuffer.shift();
  logBuffer.push(entry);
  logStream$.next(entry);
}
