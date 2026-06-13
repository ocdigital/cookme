import React, { useState, useEffect } from 'react';
import { Eye, Activity, AlertCircle, Clock } from 'lucide-react';
import { Card, CardTitle, CardContent } from '../components/Card';
import { SearchInput } from '../components/SearchInput';
import { FilterSelect } from '../components/FilterSelect';
import { ErrorAlert } from '../components/ErrorAlert';
import { ActionButton } from '../components/ActionButton';
import { TablePagination } from '../components/TablePagination';
import { StatsBar } from '../components/StatsBar';
import { AnimatedModal } from '../components/AnimatedModal';
import { adminService } from '../services/adminService';

interface AuditLog {
  id: string;
  user_id: string | null;
  user_email: string | null;
  user_role: string | null;
  method: string;
  route: string;
  path: string;
  action: string;
  resource_type: string | null;
  resource_id: string | null;
  status_code: number;
  duration_ms: number | null;
  ip_address: string | null;
  user_agent: string | null;
  request_body: Record<string, any> | null;
  created_at: string;
}

const METHOD_COLORS: Record<string, string> = {
  POST: 'bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300',
  DELETE: 'bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300',
  PATCH: 'bg-yellow-100 dark:bg-yellow-900/40 text-yellow-700 dark:text-yellow-300',
  PUT: 'bg-orange-100 dark:bg-orange-900/40 text-orange-700 dark:text-orange-300',
  GET: 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300',
};

function statusBadgeClass(code: number): string {
  if (code >= 500) return 'bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300';
  if (code >= 400) return 'bg-yellow-100 dark:bg-yellow-900/40 text-yellow-700 dark:text-yellow-300';
  return 'bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300';
}

export const AuditLogsPage: React.FC = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState({ total: 0, todayMutations: 0, errors: 0 });

  const [searchEmail, setSearchEmail] = useState('');
  const [methodFilter, setMethodFilter] = useState('');
  const [resourceFilter, setResourceFilter] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [statusClass, setStatusClass] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);

  useEffect(() => {
    loadLogs();
  }, [page, searchEmail, methodFilter, resourceFilter, fromDate, toDate, statusClass]);

  useEffect(() => {
    loadStats();
  }, []);

  const loadLogs = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await adminService.listAuditLogs(page, 30, {
        user_email: searchEmail || undefined,
        method: methodFilter || undefined,
        resource_type: resourceFilter || undefined,
        from_date: fromDate || undefined,
        to_date: toDate || undefined,
        status_class: (statusClass as '2xx' | '4xx' | '5xx') || undefined,
      });
      setLogs(response.data);
      setTotalPages(response.totalPages || 1);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar logs');
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const s = await adminService.getAuditStats();
      setStats(s);
    } catch {
      // stats são opcionais
    }
  };

  const handleSearchChange = (value: string) => {
    setSearchEmail(value);
    setPage(1);
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  const detailRows: [string, string][] = selectedLog
    ? [
        ['ID', selectedLog.id],
        ['Data/Hora', formatDate(selectedLog.created_at)],
        ['Usuário', selectedLog.user_email || 'Anônimo'],
        ['Role', selectedLog.user_role || '—'],
        ['Ação', selectedLog.action],
        ['Método', selectedLog.method],
        ['Status', String(selectedLog.status_code)],
        ['Recurso', selectedLog.resource_type || '—'],
        ['ID do Recurso', selectedLog.resource_id || '—'],
        ['IP', selectedLog.ip_address || '—'],
        ['Duração', selectedLog.duration_ms != null ? `${selectedLog.duration_ms}ms` : '—'],
        ['Rota', selectedLog.route],
        ['Path', selectedLog.path],
      ]
    : [];

  return (
    <div className="space-y-2">
      <header className="-mt-1">
        <h1 className="text-lg font-semibold text-gray-800 dark:text-white">Logs de Auditoria</h1>
      </header>

      <StatsBar
        items={[
          { icon: <Activity className="w-5 h-5" />, label: 'Total de Ações', value: stats.total },
          { icon: <Clock className="w-5 h-5" />, label: 'Ações Hoje', value: stats.todayMutations },
          { icon: <AlertCircle className="w-5 h-5" />, label: 'Erros Hoje', value: stats.errors },
        ]}
      />

      <Card>
        <div className="flex justify-between items-center mb-4">
          <CardTitle>Histórico de Ações</CardTitle>
        </div>

        <div className="flex gap-3 mb-3 pb-3 border-b border-gray-100 dark:border-gray-700 flex-wrap">
          <SearchInput
            placeholder="Buscar por email do usuário..."
            value={searchEmail}
            onChange={(e) => handleSearchChange(e.target.value)}
          />
          <FilterSelect
            value={methodFilter}
            onChange={(e) => { setMethodFilter(e.target.value); setPage(1); }}
            options={[
              { value: '', label: 'Método: Todos' },
              { value: 'POST', label: 'POST' },
              { value: 'PATCH', label: 'PATCH' },
              { value: 'PUT', label: 'PUT' },
              { value: 'DELETE', label: 'DELETE' },
              { value: 'GET', label: 'GET' },
            ]}
          />
          <FilterSelect
            value={resourceFilter}
            onChange={(e) => { setResourceFilter(e.target.value); setPage(1); }}
            options={[
              { value: '', label: 'Recurso: Todos' },
              { value: 'receitas', label: 'Receitas' },
              { value: 'produtos', label: 'Produtos' },
              { value: 'usuarios', label: 'Usuários' },
              { value: 'inventario', label: 'Inventário' },
              { value: 'listas', label: 'Listas' },
              { value: 'compras', label: 'Compras' },
              { value: 'auth', label: 'Autenticação' },
            ]}
          />
          <FilterSelect
            value={statusClass}
            onChange={(e) => { setStatusClass(e.target.value); setPage(1); }}
            options={[
              { value: '', label: 'Status: Todos' },
              { value: '2xx', label: 'Sucesso (2xx)' },
              { value: '4xx', label: 'Erro Cliente (4xx)' },
              { value: '5xx', label: 'Erro Servidor (5xx)' },
            ]}
          />
          <input
            type="date"
            value={fromDate}
            onChange={(e) => { setFromDate(e.target.value); setPage(1); }}
            className="border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300"
          />
          <input
            type="date"
            value={toDate}
            onChange={(e) => { setToDate(e.target.value); setPage(1); }}
            className="border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300"
          />
        </div>

        <CardContent>
          <ErrorAlert error={error} />

          {loading ? (
            <div className="text-center py-8">
              <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
              <p className="text-gray-500">Carregando logs...</p>
            </div>
          ) : logs.length > 0 ? (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-gray-200 dark:border-gray-700">
                      <th className="text-left py-2 px-3 font-semibold text-gray-700 dark:text-gray-300">Data/Hora</th>
                      <th className="text-left py-2 px-3 font-semibold text-gray-700 dark:text-gray-300">Usuário</th>
                      <th className="text-left py-2 px-3 font-semibold text-gray-700 dark:text-gray-300">Ação</th>
                      <th className="text-left py-2 px-3 font-semibold text-gray-700 dark:text-gray-300">Recurso</th>
                      <th className="text-left py-2 px-3 font-semibold text-gray-700 dark:text-gray-300">Método</th>
                      <th className="text-left py-2 px-3 font-semibold text-gray-700 dark:text-gray-300">Status</th>
                      <th className="text-left py-2 px-3 font-semibold text-gray-700 dark:text-gray-300">IP</th>
                      <th className="text-left py-2 px-3 font-semibold text-gray-700 dark:text-gray-300">Duração</th>
                      <th className="text-left py-2 px-3 font-semibold text-gray-700 dark:text-gray-300"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {logs.map((log) => (
                      <tr
                        key={log.id}
                        className="border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                      >
                        <td className="py-2 px-3 text-gray-600 dark:text-gray-400 text-xs whitespace-nowrap">
                          {formatDate(log.created_at)}
                        </td>
                        <td className="py-2 px-3">
                          <div className="text-gray-800 dark:text-gray-200 text-xs">
                            {log.user_email || <span className="text-gray-400 italic">Anônimo</span>}
                          </div>
                          {log.user_role && (
                            <div className="text-xs text-gray-400">{log.user_role}</div>
                          )}
                        </td>
                        <td className="py-2 px-3 text-gray-700 dark:text-gray-300 text-xs">{log.action}</td>
                        <td className="py-2 px-3">
                          <div className="text-gray-700 dark:text-gray-300 text-xs">{log.resource_type || '—'}</div>
                          {log.resource_id && (
                            <div className="text-xs text-gray-400 font-mono truncate max-w-24" title={log.resource_id}>
                              {log.resource_id.length > 8 ? `${log.resource_id.substring(0, 8)}…` : log.resource_id}
                            </div>
                          )}
                        </td>
                        <td className="py-2 px-3">
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${METHOD_COLORS[log.method] || 'bg-gray-100 text-gray-700'}`}>
                            {log.method}
                          </span>
                        </td>
                        <td className="py-2 px-3">
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusBadgeClass(log.status_code)}`}>
                            {log.status_code}
                          </span>
                        </td>
                        <td className="py-2 px-3 text-gray-500 dark:text-gray-400 text-xs">{log.ip_address || '—'}</td>
                        <td className="py-2 px-3 text-gray-500 dark:text-gray-400 text-xs">
                          {log.duration_ms != null ? `${log.duration_ms}ms` : '—'}
                        </td>
                        <td className="py-2 px-3">
                          <ActionButton
                            variant="view"
                            icon={<Eye size={14} />}
                            title="Ver detalhes"
                            onClick={() => setSelectedLog(log)}
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <TablePagination
                currentPage={page}
                totalPages={totalPages}
                onPrevious={() => page > 1 && setPage(page - 1)}
                onNext={() => page < totalPages && setPage(page + 1)}
              />
            </>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-500">Nenhum log encontrado</p>
            </div>
          )}
        </CardContent>
      </Card>

      <AnimatedModal
        isOpen={selectedLog !== null}
        onClose={() => setSelectedLog(null)}
        title="Detalhes do Log"
        size="lg"
      >
        {selectedLog && (
          <div className="space-y-4 text-sm">
            <div className="grid grid-cols-2 gap-3">
              {detailRows.map(([label, value]) => (
                <div key={label} className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">{label}</p>
                  <p className="text-xs font-medium text-gray-800 dark:text-gray-200 break-all">{value}</p>
                </div>
              ))}
            </div>

            {selectedLog.request_body && Object.keys(selectedLog.request_body).length > 0 && (
              <div>
                <p className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">Corpo da Requisição</p>
                <pre className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3 text-xs text-gray-700 dark:text-gray-300 overflow-auto max-h-48">
                  {JSON.stringify(selectedLog.request_body, null, 2)}
                </pre>
              </div>
            )}

            {selectedLog.user_agent && (
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">User Agent</p>
                <p className="text-xs text-gray-700 dark:text-gray-300 break-all">{selectedLog.user_agent}</p>
              </div>
            )}
          </div>
        )}
      </AnimatedModal>
    </div>
  );
};
