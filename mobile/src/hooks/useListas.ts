import { useState, useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import listaService, { Lista, ItemLista } from '../services/lista.service';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIMES, GC_TIMES } from '@/lib/queryClient';

interface UseListas {
  listas: Lista[];
  listaAtual: Lista | null;
  loading: boolean;
  erro: string | null;

  criarLista: (titulo: string, descricao?: string, orcamento?: number) => Promise<void>;
  carregarListas: () => void;
  carregarLista: (id: string) => Promise<void>;
  atualizarLista: (id: string, updates: any) => Promise<void>;
  deletarLista: (id: string) => Promise<void>;
  arquivarLista: (id: string) => Promise<void>;
  duplicarLista: (id: string) => Promise<void>;
  adicionarItem: (nome: string, quantidade?: number, unidade?: string, preco_unitario?: number, categoria?: string, loja?: string, prioridade?: 'baixa' | 'media' | 'alta') => Promise<void>;
  atualizarItem: (itemId: string, updates: Partial<ItemLista>) => Promise<void>;
  deletarItem: (itemId: string) => Promise<void>;
  marcarComprado: (itemId: string, comprado: boolean) => Promise<void>;
  limparComprados: () => Promise<void>;
}

export function useListas(): UseListas {
  const queryClient = useQueryClient();
  const [listaAtual, setListaAtual] = useState<Lista | null>(null);
  const [listaAtualLoading, setListaAtualLoading] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const { data: listas = [], isFetching: listasLoading } = useQuery({
    queryKey: queryKeys.listas(),
    queryFn: () => listaService.listarListas(),
    staleTime: STALE_TIMES.listas,
    gcTime: GC_TIMES.listas,
  });

  const loading = listasLoading || listaAtualLoading;

  const carregarListas = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: queryKeys.listas() });
  }, [queryClient]);

  const carregarLista = useCallback(async (id: string) => {
    setListaAtualLoading(true);
    setErro(null);
    try {
      const data = await listaService.obterLista(id);
      setListaAtual(data);
    } catch (err: any) {
      setErro(err.message || 'Erro ao carregar lista');
    } finally {
      setListaAtualLoading(false);
    }
  }, []);

  const criarLista = useCallback(async (titulo: string, descricao?: string, orcamento?: number) => {
    setErro(null);
    await listaService.criarLista(titulo, descricao, orcamento);
    queryClient.invalidateQueries({ queryKey: queryKeys.listas() });
  }, [queryClient]);

  const atualizarLista = useCallback(async (id: string, updates: any) => {
    setErro(null);
    const updated = await listaService.atualizarLista(id, updates);
    if (listaAtual?.id === id) setListaAtual(updated);
    queryClient.invalidateQueries({ queryKey: queryKeys.listas() });
  }, [listaAtual, queryClient]);

  const deletarLista = useCallback(async (id: string) => {
    setErro(null);
    await listaService.deletarLista(id);
    if (listaAtual?.id === id) setListaAtual(null);
    queryClient.invalidateQueries({ queryKey: queryKeys.listas() });
  }, [listaAtual, queryClient]);

  const arquivarLista = useCallback(async (id: string) => {
    setErro(null);
    const updated = await listaService.arquivarLista(id);
    if (listaAtual?.id === id) setListaAtual(updated);
    queryClient.invalidateQueries({ queryKey: queryKeys.listas() });
  }, [listaAtual, queryClient]);

  const duplicarLista = useCallback(async (id: string) => {
    setErro(null);
    await listaService.duplicarLista(id);
    queryClient.invalidateQueries({ queryKey: queryKeys.listas() });
  }, [queryClient]);

  const adicionarItem = useCallback(async (nome: string, quantidade = 1, unidade?: string, preco_unitario?: number, categoria?: string, loja?: string, prioridade?: 'baixa' | 'media' | 'alta') => {
    if (!listaAtual) { setErro('Nenhuma lista selecionada'); return; }
    setErro(null);
    await listaService.adicionarItem(listaAtual.id, nome, quantidade, unidade, preco_unitario, categoria, loja, prioridade);
    await carregarLista(listaAtual.id);
  }, [listaAtual, carregarLista]);

  const atualizarItem = useCallback(async (itemId: string, updates: Partial<ItemLista>) => {
    if (!listaAtual) { setErro('Nenhuma lista selecionada'); return; }
    setErro(null);
    await listaService.atualizarItem(listaAtual.id, itemId, updates);
    await carregarLista(listaAtual.id);
  }, [listaAtual, carregarLista]);

  const deletarItem = useCallback(async (itemId: string) => {
    if (!listaAtual) { setErro('Nenhuma lista selecionada'); return; }
    setErro(null);
    await listaService.deletarItem(listaAtual.id, itemId);
    await carregarLista(listaAtual.id);
  }, [listaAtual, carregarLista]);

  const marcarComprado = useCallback(async (itemId: string, comprado: boolean) => {
    if (!listaAtual) { setErro('Nenhuma lista selecionada'); return; }
    setErro(null);
    await listaService.marcarItemComprado(listaAtual.id, itemId, comprado);
    await carregarLista(listaAtual.id);
  }, [listaAtual, carregarLista]);

  const limparComprados = useCallback(async () => {
    if (!listaAtual) { setErro('Nenhuma lista selecionada'); return; }
    setErro(null);
    await listaService.limparItensComprados(listaAtual.id);
    await carregarLista(listaAtual.id);
  }, [listaAtual, carregarLista]);

  return {
    listas,
    listaAtual,
    loading,
    erro,
    criarLista,
    carregarListas,
    carregarLista,
    atualizarLista,
    deletarLista,
    arquivarLista,
    duplicarLista,
    adicionarItem,
    atualizarItem,
    deletarItem,
    marcarComprado,
    limparComprados,
  };
}
