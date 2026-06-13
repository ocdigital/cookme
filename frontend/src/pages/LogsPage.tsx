import React, { useState, useEffect, useRef } from 'react';
import { Terminal, Trash2, Pause, Play } from 'lucide-react';
import { Card, CardContent } from '../components/Card';

interface LogEntry {
  ts: string;
  level: 'log' | 'error' | 'warn' | 'debug' | 'verbose';
  context: string;
  message: string;
}

const LEVEL_STYLE: Record<LogEntry['level'], string> = {
  log:     'text-green-400',
  error:   'text-red-400',
  warn:    'text-yellow-400',
  debug:   'text-blue-400',
  verbose: 'text-gray-400',
};

const LEVEL_BADGE: Record<LogEntry['level'], string> = {
  log:     'bg-green-900/40 text-green-300',
  error:   'bg-red-900/40 text-red-300',
  warn:    'bg-yellow-900/40 text-yellow-300',
  debug:   'bg-blue-900/40 text-blue-300',
  verbose: 'bg-gray-700 text-gray-400',
};

function formatTime(ts: string) {
  return new Date(ts).toLocaleTimeString('pt-BR', { hour12: false });
}

export const LogsPage: React.FC = () => {
  const token = localStorage.getItem('accessToken') || sessionStorage.getItem('accessToken') || '';
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [paused, setPaused] = useState(false);
  const [filter, setFilter] = useState<LogEntry['level'] | 'all'>('all');
  const bottomRef = useRef<HTMLDivElement>(null);
  const pausedRef = useRef(false);
  const esRef = useRef<EventSource | null>(null);

  pausedRef.current = paused;

  useEffect(() => {
    const apiBase = 'http://localhost:3000/api';

    // Initial snapshot
    fetch(`${apiBase}/admin/system/logs`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((data: LogEntry[]) => setLogs(data))
      .catch(() => {});

    // SSE stream
    const es = new EventSource(`${apiBase}/admin/system/logs/stream?token=${token}`);
    esRef.current = es;

    es.onmessage = (e) => {
      if (pausedRef.current) return;
      try {
        const entry: LogEntry = JSON.parse(e.data);
        setLogs((prev) => {
          const next = [...prev, entry];
          return next.length > 50 ? next.slice(-50) : next;
        });
      } catch {}
    };

    return () => {
      es.close();
    };
  }, [token]);

  // SSE doesn't support Authorization header natively — backend needs to accept token via query param
  // The snapshot fetch above uses the header correctly

  useEffect(() => {
    if (!paused) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs, paused]);

  const filtered = filter === 'all' ? logs : logs.filter((l) => l.level === filter);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Terminal size={20} className="text-primary" />
          <h1 className="text-lg font-bold text-gray-800 dark:text-gray-100">Logs do Sistema</h1>
          <span className="text-xs text-gray-500 dark:text-gray-400">últimas 50 linhas · tempo real</span>
        </div>
        <div className="flex items-center gap-2">
          {/* Filter */}
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value as any)}
            className="text-xs px-2 py-1 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300"
          >
            <option value="all">Todos</option>
            <option value="log">Log</option>
            <option value="warn">Warn</option>
            <option value="error">Error</option>
            <option value="debug">Debug</option>
            <option value="verbose">Verbose</option>
          </select>
          {/* Pause/Resume */}
          <button
            onClick={() => setPaused((p) => !p)}
            className={`flex items-center gap-1 px-2 py-1 rounded text-xs font-medium transition-colors ${
              paused
                ? 'bg-yellow-100 dark:bg-yellow-900/40 text-yellow-700 dark:text-yellow-300'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
          >
            {paused ? <Play size={12} /> : <Pause size={12} />}
            {paused ? 'Retomar' : 'Pausar'}
          </button>
          {/* Clear */}
          <button
            onClick={() => setLogs([])}
            className="flex items-center gap-1 px-2 py-1 rounded text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
          >
            <Trash2 size={12} />
            Limpar
          </button>
        </div>
      </div>

      <Card>
        <CardContent>
          <div className="bg-gray-950 rounded-lg p-3 font-mono text-xs h-[calc(100vh-220px)] overflow-y-auto">
            {filtered.length === 0 ? (
              <p className="text-gray-600 text-center py-8">Nenhum log disponível</p>
            ) : (
              filtered.map((entry, i) => (
                <div key={i} className="flex items-start gap-2 py-0.5 hover:bg-gray-900/50 rounded px-1 group">
                  <span className="text-gray-600 shrink-0 tabular-nums">{formatTime(entry.ts)}</span>
                  <span className={`shrink-0 px-1 rounded text-[10px] font-bold uppercase ${LEVEL_BADGE[entry.level]}`}>
                    {entry.level === 'verbose' ? 'verb' : entry.level}
                  </span>
                  {entry.context && (
                    <span className="text-purple-400 shrink-0 max-w-[120px] truncate" title={entry.context}>
                      [{entry.context}]
                    </span>
                  )}
                  <span className={`break-all ${LEVEL_STYLE[entry.level]}`}>{entry.message}</span>
                </div>
              ))
            )}
            <div ref={bottomRef} />
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
