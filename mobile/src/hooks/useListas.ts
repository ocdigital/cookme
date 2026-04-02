import { useState, useEffect, useCallback } from 'react';
import listaService, { Lista, ItemLista } from '../services/lista.service';

interface UseListas {
  listas: Lista[];
  listaAtual: Lista | null;
  loading: boolean;
  erro: string | null;

  // Operações de listas
  criarLista: (titulo: string, descricao?: string, orcamento?: number) => Promise<void>;
  carregarListas: () => Promise<void>;
  carregarLista: (id: string) => Promise<void>;
  atualizarLista: (id: string, updates: any) => Promise<void>;
  deletarLista: (id: string) => Promise<void>;
  arquivarLista: (id: string) => Promise<void>;
  duplicarLista: (id: string) => Promise<void>;

  // Operações de itens
  adicionarItem: (
    nome: string,
    quantidade?: number,
    unidade?: string,
    preco_unitario?: number,
    categoria?: string,
    loja?: string,
    prioridade?: string,
  ) => Promise<void>;
  atualizarItem: (itemId: string, updates: Partial<ItemLista>) => Promise<void>;
  deletarItem: (itemId: string) => Promise<void>;
  marcarComprado: (itemId: string, comprado: boolean) => Promise<void>;
  limparComprados: () => Promise<void>;
}

export function useListas(): UseListas {
  const [listas, setListas] = useState<Lista[]>([]);
  const [listaAtual, setListaAtual] = useState<Lista | null>(null);
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  // Carregar todas as listas
  const carregarListas = useCallback(async () => {
    try {
      setLoading(true);
      setErro(null);
      const data = await listaService.listarListas();
      setListas(data);
    } catch (err: any) {
      setErro(err.message || 'Erro ao carregar listas');
      console.error('Erro ao carregar listas:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Carregar lista específica
  const carregarLista = useCallback(async (id: string) => {
    try {
      setLoading(true);
      setErro(null);
      const data = await listaService.obterLista(id);
      setListaAtual(data);
    } catch (err: any) {
      setErro(err.message || 'Erro ao carregar lista');
      console.error('Erro ao carregar lista:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Criar nova lista
  const criarLista = useCallback(
    async (titulo: string, descricao?: string, orcamento?: number) => {
      try {
        setLoading(true);
        setErro(null);
        await listaService.criarLista(titulo, descricao, orcamento);
        await carregarListas();
      } catch (err: any) {
        setErro(err.message || 'Erro ao criar lista');
        console.error('Erro ao criar lista:', err);
      } finally {
        setLoading(false);
      }
    },
    [carregarListas],
  );

  // Atualizar lista
  const atualizarLista = useCallback(
    async (id: string, updates: any) => {
      try {
        setLoading(true);
        setErro(null);
        const updated = await listaService.atualizarLista(id, updates);
        if (listaAtual?.id === id) {
          setListaAtual(updated);
        }
        await carregarListas();
      } catch (err: any) {
        setErro(err.message || 'Erro ao atualizar lista');
        console.error('Erro ao atualizar lista:', err);
      } finally {
        setLoading(false);
      }
    },
    [listaAtual, carregarListas],
  );

  // Deletar lista
  const deletarLista = useCallback(
    async (id: string) => {
      try {
        setLoading(true);
        setErro(null);
        await listaService.deletarLista(id);
        if (listaAtual?.id === id) {
          setListaAtual(null);
        }
        await carregarListas();
      } catch (err: any) {
        setErro(err.message || 'Erro ao deletar lista');
        console.error('Erro ao deletar lista:', err);
      } finally {
        setLoading(false);
      }
    },
    [listaAtual, carregarListas],
  );

  // Arquivar lista
  const arquivarLista = useCallback(
    async (id: string) => {
      try {
        setLoading(true);
        setErro(null);
        const updated = await listaService.arquivarLista(id);
        if (listaAtual?.id === id) {
          setListaAtual(updated);
        }
        await carregarListas();
      } catch (err: any) {
        setErro(err.message || 'Erro ao arquivar lista');
        console.error('Erro ao arquivar lista:', err);
      } finally {
        setLoading(false);
      }
    },
    [listaAtual, carregarListas],
  );

  // Duplicar lista
  const duplicarLista = useCallback(
    async (id: string) => {
      try {
        setLoading(true);
        setErro(null);
        await listaService.duplicarLista(id);
        await carregarListas();
      } catch (err: any) {
        setErro(err.message || 'Erro ao duplicar lista');
        console.error('Erro ao duplicar lista:', err);
      } finally {
        setLoading(false);
      }
    },
    [carregarListas],
  );

  // Adicionar item
  const adicionarItem = useCallback(
    async (
      nome: string,
      quantidade: number = 1,
      unidade?: string,
      preco_unitario?: number,
      categoria?: string,
      loja?: string,
      prioridade?: string,
    ) => {
      if (!listaAtual) {
        setErro('Nenhuma lista selecionada');
        return;
      }

      try {
        setLoading(true);
        setErro(null);
        await listaService.adicionarItem(
          listaAtual.id,
          nome,
          quantidade,
          unidade,
          preco_unitario,
          categoria,
          loja,
          prioridade,
        );
        await carregarLista(listaAtual.id);
      } catch (err: any) {
        setErro(err.message || 'Erro ao adicionar item');
        console.error('Erro ao adicionar item:', err);
      } finally {
        setLoading(false);
      }
    },
    [listaAtual, carregarLista],
  );

  // Atualizar item
  const atualizarItem = useCallback(
    async (itemId: string, updates: Partial<ItemLista>) => {
      if (!listaAtual) {
        setErro('Nenhuma lista selecionada');
        return;
      }

      try {
        setLoading(true);
        setErro(null);
        await listaService.atualizarItem(listaAtual.id, itemId, updates);
        await carregarLista(listaAtual.id);
      } catch (err: any) {
        setErro(err.message || 'Erro ao atualizar item');
        console.error('Erro ao atualizar item:', err);
      } finally {
        setLoading(false);
      }
    },
    [listaAtual, carregarLista],
  );

  // Deletar item
  const deletarItem = useCallback(
    async (itemId: string) => {
      if (!listaAtual) {
        setErro('Nenhuma lista selecionada');
        return;
      }

      try {
        setLoading(true);
        setErro(null);
        await listaService.deletarItem(listaAtual.id, itemId);
        await carregarLista(listaAtual.id);
      } catch (err: any) {
        setErro(err.message || 'Erro ao deletar item');
        console.error('Erro ao deletar item:', err);
      } finally {
        setLoading(false);
      }
    },
    [listaAtual, carregarLista],
  );

  // Marcar item como comprado
  const marcarComprado = useCallback(
    async (itemId: string, comprado: boolean) => {
      if (!listaAtual) {
        setErro('Nenhuma lista selecionada');
        return;
      }

      try {
        setErro(null);
        await listaService.marcarItemComprado(listaAtual.id, itemId, comprado);
        await carregarLista(listaAtual.id);
      } catch (err: any) {
        setErro(err.message || 'Erro ao marcar item');
        console.error('Erro ao marcar item:', err);
      }
    },
    [listaAtual, carregarLista],
  );

  // Limpar itens comprados
  const limparComprados = useCallback(async () => {
    if (!listaAtual) {
      setErro('Nenhuma lista selecionada');
      return;
    }

    try {
      setLoading(true);
      setErro(null);
      await listaService.limparItensComprados(listaAtual.id);
      await carregarLista(listaAtual.id);
    } catch (err: any) {
      setErro(err.message || 'Erro ao limpar itens');
      console.error('Erro ao limpar itens:', err);
    } finally {
      setLoading(false);
    }
  }, [listaAtual, carregarLista]);

  // Carregar listas ao montar o componente
  useEffect(() => {
    carregarListas();
  }, [carregarListas]);

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
