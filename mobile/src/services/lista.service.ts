import api from './api';

export interface ItemLista {
  id: string;
  nome: string;
  descricao?: string;
  quantidade: number;
  unidade?: string;
  preco_unitario?: number;
  preco_total: number;
  comprado: boolean;
  categoria?: string;
  loja?: string;
  prioridade?: 'alta' | 'media' | 'baixa';
  criado_em: string;
  atualizado_em: string;
}

export interface Lista {
  id: string;
  titulo: string;
  descricao?: string;
  status: 'ativa' | 'arquivada' | 'compartilhada';
  compartilhada: boolean;
  orcamento?: number;
  total_estimado: number;
  total_gasto: number;
  itens: ItemLista[];
  criado_em: string;
  atualizado_em: string;
}

class ListaService {
  // ==================== LISTAS ====================

  async criarLista(titulo: string, descricao?: string, orcamento?: number): Promise<Lista> {
    const { data } = await api.post('/listas', {
      titulo,
      descricao,
      orcamento,
    });
    return data;
  }

  async listarListas(): Promise<Lista[]> {
    const { data } = await api.get('/listas');
    return data;
  }

  async obterLista(id: string): Promise<Lista> {
    const { data } = await api.get(`/listas/${id}`);
    return data;
  }

  async atualizarLista(
    id: string,
    updates: Partial<{ titulo: string; descricao: string; orcamento: number; status: string }>,
  ): Promise<Lista> {
    const { data } = await api.put(`/listas/${id}`, updates);
    return data;
  }

  async deletarLista(id: string): Promise<void> {
    await api.delete(`/listas/${id}`);
  }

  async arquivarLista(id: string): Promise<Lista> {
    const { data } = await api.post(`/listas/${id}/arquivar`);
    return data;
  }

  async duplicarLista(id: string): Promise<Lista> {
    const { data } = await api.post(`/listas/${id}/duplicar`);
    return data;
  }

  async limparItensComprados(id: string): Promise<void> {
    await api.post(`/listas/${id}/limpar-comprados`);
  }

  // ==================== ITENS ====================

  async adicionarItem(
    listaId: string,
    nome: string,
    quantidade: number = 1,
    unidade?: string,
    preco_unitario?: number,
    categoria?: string,
    loja?: string,
    prioridade?: 'alta' | 'media' | 'baixa',
    descricao?: string,
  ): Promise<ItemLista> {
    const { data } = await api.post(`/listas/${listaId}/itens`, {
      nome,
      quantidade,
      unidade,
      preco_unitario,
      categoria,
      loja,
      prioridade,
      descricao,
    });
    return data;
  }

  async listarItens(listaId: string): Promise<ItemLista[]> {
    const { data } = await api.get(`/listas/${listaId}/itens`);
    return data;
  }

  async atualizarItem(
    listaId: string,
    itemId: string,
    updates: Partial<ItemLista>,
  ): Promise<ItemLista> {
    const { data } = await api.put(`/listas/${listaId}/itens/${itemId}`, updates);
    return data;
  }

  async deletarItem(listaId: string, itemId: string): Promise<void> {
    await api.delete(`/listas/${listaId}/itens/${itemId}`);
  }

  async marcarItemComprado(
    listaId: string,
    itemId: string,
    comprado: boolean,
  ): Promise<ItemLista> {
    const { data } = await api.put(`/listas/${listaId}/itens/${itemId}/marcar-comprado`, {
      comprado,
    });
    return data;
  }

  // ==================== UTILITÁRIOS ====================

  calcularProgresso(lista: Lista): number {
    if (lista.itens.length === 0) return 0;
    const comprados = lista.itens.filter((item) => item.comprado).length;
    return Math.round((comprados / lista.itens.length) * 100);
  }

  formatarMoeda(valor: number): string {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(valor);
  }
}

export default new ListaService();
