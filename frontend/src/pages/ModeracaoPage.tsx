import React, { useState, useEffect } from 'react';
import { CheckCircle, XCircle, Clock, Image, ChevronRight, User } from 'lucide-react';
import { useToast } from '../hooks/useToast';
import api from '../services/api';

interface FotoPendente {
  id: string;
  nome: string;
  imagem_url: string | null;
  foto_pendente_url: string;
  foto_pendente_autor_id: string | null;
  autor_nome: string | null;
  autor_email: string | null;
  autor_avatar: string | null;
  atualizado_em: string;
}

export const ModeracaoPage: React.FC = () => {
  const toast = useToast();
  const [fila, setFila] = useState<FotoPendente[]>([]);
  const [loading, setLoading] = useState(true);
  const [selecionada, setSelecionada] = useState<FotoPendente | null>(null);
  const [motivo, setMotivo] = useState('');
  const [processando, setProcessando] = useState(false);

  useEffect(() => { carregar(); }, []);

  const carregar = async () => {
    try {
      setLoading(true);
      const res = await api.get('/admin/moderacao/fotos');
      setFila(res.data || []);
    } catch {
      toast.error('Erro ao carregar fila de moderação');
    } finally {
      setLoading(false);
    }
  };

  const aprovar = async (id: string) => {
    try {
      setProcessando(true);
      await api.patch(`/admin/moderacao/fotos/${id}/aprovar`);
      toast.success('Foto aprovada! Usuário foi notificado.');
      setSelecionada(null);
      await carregar();
    } catch {
      toast.error('Erro ao aprovar foto');
    } finally {
      setProcessando(false);
    }
  };

  const rejeitar = async (id: string) => {
    if (!motivo.trim()) {
      toast.error('Informe o motivo da rejeição');
      return;
    }
    try {
      setProcessando(true);
      await api.patch(`/admin/moderacao/fotos/${id}/rejeitar`, { motivo });
      toast.success('Foto rejeitada. Usuário foi notificado com o motivo.');
      setSelecionada(null);
      setMotivo('');
      await carregar();
    } catch {
      toast.error('Erro ao rejeitar foto');
    } finally {
      setProcessando(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Moderação de Fotos</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Fotos enviadas pela comunidade aguardando revisão
          </p>
        </div>
        <div className="flex items-center gap-2 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-lg px-4 py-2">
          <Clock size={13} className="text-amber-600 dark:text-amber-400" />
          <span className="text-sm font-semibold text-amber-700 dark:text-amber-300">
            {fila.length} pendente{fila.length !== 1 ? 's' : ''}
          </span>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-24">
          <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : fila.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="w-16 h-16 bg-green-50 dark:bg-green-900/20 rounded-full flex items-center justify-center mb-4">
            <CheckCircle size={32} className="text-green-500" />
          </div>
          <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300">Fila vazia!</h3>
          <p className="text-sm text-gray-400 mt-1">Nenhuma foto aguardando moderação.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Lista */}
          <div className="space-y-3">
            {fila.map((item) => (
              <button
                key={item.id}
                onClick={() => { setSelecionada(item); setMotivo(''); }}
                className={`w-full text-left bg-white dark:bg-gray-800 rounded-xl border-2 transition-all p-4 flex items-center gap-4 hover:shadow-md ${
                  selecionada?.id === item.id
                    ? 'border-primary shadow-md'
                    : 'border-gray-100 dark:border-gray-700'
                }`}
              >
                {/* Thumbnail nova */}
                <div className="relative flex-shrink-0">
                  <img
                    src={item.foto_pendente_url}
                    alt={item.nome}
                    className="w-16 h-16 rounded-lg object-cover"
                    onError={(e) => { (e.target as HTMLImageElement).src = ''; }}
                  />
                  <div className="absolute -top-1 -right-1 w-4 h-4 bg-amber-400 rounded-full border-2 border-white" />
                </div>

                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-900 dark:text-white truncate">{item.nome}</p>
                  {(item.autor_nome || item.autor_email) && (
                    <div className="flex items-center gap-1 mt-0.5">
                      <User size={11} className="text-gray-400 flex-shrink-0" />
                      <p className="text-xs text-gray-500 truncate">
                        {item.autor_nome || item.autor_email}
                      </p>
                    </div>
                  )}
                  <p className="text-xs text-gray-400 mt-0.5">
                    {new Date(item.atualizado_em).toLocaleDateString('pt-BR', {
                      day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit',
                    })}
                  </p>
                </div>

                <ChevronRight size={18} className="text-gray-300 flex-shrink-0" />
              </button>
            ))}
          </div>

          {/* Painel de revisão */}
          {selecionada ? (
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 p-6 space-y-5 sticky top-4 self-start">
              <div>
                <h3 className="font-bold text-gray-900 dark:text-white text-lg">{selecionada.nome}</h3>
                {(selecionada.autor_nome || selecionada.autor_email) && (
                  <div className="flex items-center gap-2 mt-1">
                    {selecionada.autor_avatar ? (
                      <img
                        src={selecionada.autor_avatar}
                        alt={selecionada.autor_nome || ''}
                        className="w-6 h-6 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-6 h-6 rounded-full bg-gray-200 dark:bg-gray-600 flex items-center justify-center">
                        <User size={13} className="text-gray-400" />
                      </div>
                    )}
                    <div>
                      {selecionada.autor_nome && (
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                          {selecionada.autor_nome}
                        </span>
                      )}
                      {selecionada.autor_email && (
                        <span className="text-xs text-gray-400 ml-1">· {selecionada.autor_email}</span>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Comparação */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Foto atual</p>
                  {selecionada.imagem_url ? (
                    <img src={selecionada.imagem_url} alt="atual" className="w-full h-40 object-cover rounded-lg" />
                  ) : (
                    <div className="w-full h-40 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center">
                      <Image size={24} className="text-gray-300" />
                    </div>
                  )}
                </div>
                <div>
                  <p className="text-xs font-semibold text-amber-500 uppercase tracking-wide mb-2 flex items-center gap-1">
                    <Clock size={11} /> Nova proposta
                  </p>
                  <img
                    src={selecionada.foto_pendente_url}
                    alt="nova"
                    className="w-full h-40 object-cover rounded-lg ring-2 ring-amber-400"
                  />
                </div>
              </div>

              {/* Botão aprovar */}
              <button
                onClick={() => aprovar(selecionada.id)}
                disabled={processando}
                className="w-full flex items-center justify-center gap-2 py-3 bg-green-500 hover:bg-green-600 disabled:opacity-50 text-white font-semibold rounded-xl transition-colors"
              >
                <CheckCircle size={18} />
                Aprovar e publicar
              </button>

              {/* Rejeitar */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Motivo da rejeição
                </label>
                <textarea
                  value={motivo}
                  onChange={(e) => setMotivo(e.target.value)}
                  placeholder="Ex: imagem fora de foco, não corresponde à receita..."
                  rows={3}
                  className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white resize-none focus:outline-none focus:ring-2 focus:ring-red-400"
                />
                <button
                  onClick={() => rejeitar(selecionada.id)}
                  disabled={processando || !motivo.trim()}
                  className="w-full flex items-center justify-center gap-2 py-3 bg-red-500 hover:bg-red-600 disabled:opacity-40 text-white font-semibold rounded-xl transition-colors"
                >
                  <XCircle size={18} />
                  Rejeitar
                </button>
              </div>
            </div>
          ) : (
            <div className="hidden lg:flex items-center justify-center bg-gray-50 dark:bg-gray-800/50 rounded-xl border-2 border-dashed border-gray-200 dark:border-gray-700 min-h-64">
              <p className="text-sm text-gray-400">Selecione um item para revisar</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
