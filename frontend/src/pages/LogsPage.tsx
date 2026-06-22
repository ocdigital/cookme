import React, { useState, useEffect, useCallback } from 'react';
import { RefreshCw, CheckCircle, XCircle, Clock, AlertTriangle } from 'lucide-react';
import { Card, CardContent } from '../components/Card';
import { api } from '../services/api';

interface CronLog {
  id: string;
  job: string;
  status: 'ok' | 'erro' | 'skip';
  receitas_salvas: number;
  receitas_descartadas: number;
  detalhe: string | null;
  duracao_ms: number | null;
  criado_em: string;
}

const JOB_LABEL: Record<string, string> = {
  'crawl-proativo': 'Crawl de Receitas',
  'recipe-cleanup': 'Limpeza e Validação',
};

const STATUS_ICON = {
  ok: <CheckCircle size={14} className="text-green-500" />,
  erro: <XCircle size={14} className="text-red-500" />,
  skip: <AlertTriangle size={14} className="text-yellow-500" />,
};

const STATUS_ROW: Record<CronLog['status'], string> = {
  ok: '',
  erro: 'bg-red-950/20',
  skip: 'bg-yellow-950/10',
};

function formatDate(ts: string) {
  return new Date(ts).toLocaleString('pt-BR', {
    day: '2-digit', month: '2-digit', year: '2-digit',
    hour: '2-digit', minute: '2-digit',
  });
}

function formatDuration(ms: number | null) {
  if (!ms) return '—';
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
}

export const LogsPage: React.FC = () => {
  const [logs, setLogs] = useState<CronLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);

  const carregar = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/admin/cron-logs?limit=200');
      setLogs(Array.isArray(data) ? data : []);
      setLastRefresh(new Date());
    } catch {
      setLogs([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { carregar(); }, [carregar]);

  const totalOk = logs.filter(l => l.status === 'ok').length;
  const totalErro = logs.filter(l => l.status === 'erro').length;
  const totalReceitas = logs.reduce((s, l) => s + (l.receitas_salvas ?? 0), 0);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-gray-800 dark:text-gray-100">Logs de Jobs Agendados</h1>
          {lastRefresh && (
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Atualizado às {lastRefresh.toLocaleTimeString('pt-BR', { hour12: false })}
            </p>
          )}
        </div>
        <button
          onClick={carregar}
          disabled={loading}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded text-sm font-medium bg-primary text-white hover:bg-primary/90 disabled:opacity-50 transition-colors"
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          Atualizar
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <Card>
          <CardContent className="py-3">
            <p className="text-xs text-gray-500 dark:text-gray-400">Execuções OK</p>
            <p className="text-2xl font-bold text-green-600 dark:text-green-400">{totalOk}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-3">
            <p className="text-xs text-gray-500 dark:text-gray-400">Erros</p>
            <p className="text-2xl font-bold text-red-600 dark:text-red-400">{totalErro}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-3">
            <p className="text-xs text-gray-500 dark:text-gray-400">Receitas Salvas (total)</p>
            <p className="text-2xl font-bold text-primary">{totalReceitas}</p>
          </CardContent>
        </Card>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0 overflow-hidden">
          {logs.length === 0 ? (
            <div className="py-16 text-center text-gray-500 dark:text-gray-400">
              {loading ? 'Carregando...' : 'Nenhum log registrado ainda. Os jobs rodam de hora em hora.'}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
                    <th className="text-left px-4 py-2.5 font-medium text-gray-600 dark:text-gray-300 whitespace-nowrap">Horário</th>
                    <th className="text-left px-4 py-2.5 font-medium text-gray-600 dark:text-gray-300">Job</th>
                    <th className="text-center px-4 py-2.5 font-medium text-gray-600 dark:text-gray-300">Status</th>
                    <th className="text-right px-4 py-2.5 font-medium text-gray-600 dark:text-gray-300 whitespace-nowrap">Receitas Salvas</th>
                    <th className="text-right px-4 py-2.5 font-medium text-gray-600 dark:text-gray-300">Duração</th>
                    <th className="text-left px-4 py-2.5 font-medium text-gray-600 dark:text-gray-300">Detalhe</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map((log) => (
                    <tr
                      key={log.id}
                      className={`border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/30 ${STATUS_ROW[log.status]}`}
                    >
                      <td className="px-4 py-2 text-gray-500 dark:text-gray-400 whitespace-nowrap font-mono text-xs">
                        <span className="flex items-center gap-1">
                          <Clock size={11} />
                          {formatDate(log.criado_em)}
                        </span>
                      </td>
                      <td className="px-4 py-2 text-gray-800 dark:text-gray-200 font-medium whitespace-nowrap">
                        {JOB_LABEL[log.job] ?? log.job}
                      </td>
                      <td className="px-4 py-2 text-center">
                        <span className="inline-flex items-center gap-1 justify-center">
                          {STATUS_ICON[log.status]}
                          <span className={`text-xs font-semibold uppercase ${
                            log.status === 'ok' ? 'text-green-600 dark:text-green-400' :
                            log.status === 'erro' ? 'text-red-600 dark:text-red-400' :
                            'text-yellow-600 dark:text-yellow-400'
                          }`}>{log.status}</span>
                        </span>
                      </td>
                      <td className="px-4 py-2 text-right font-semibold text-gray-800 dark:text-gray-200">
                        {log.receitas_salvas > 0 ? (
                          <span className="text-green-600 dark:text-green-400">+{log.receitas_salvas}</span>
                        ) : (
                          <span className="text-gray-400">0</span>
                        )}
                      </td>
                      <td className="px-4 py-2 text-right text-gray-500 dark:text-gray-400 font-mono text-xs whitespace-nowrap">
                        {formatDuration(log.duracao_ms)}
                      </td>
                      <td className="px-4 py-2 text-gray-500 dark:text-gray-400 text-xs max-w-[280px] truncate" title={log.detalhe ?? ''}>
                        {log.detalhe ?? '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
