// Chaves centralizadas para TanStack Query
// Usar sempre estas constantes — evita typos e facilita invalidação

export const queryKeys = {
  // Receitas
  receitasDisponiveis: (modoAlimentar?: string) =>
    ['receitas', 'disponiveis', modoAlimentar ?? 'normal'] as const,
  receitasFavoritas: () => ['receitas', 'favoritas'] as const,
  receitaDetalhe: (id: string) => ['receitas', 'detalhe', id] as const,
  receitaMaisFeita: () => ['receitas', 'mais-feita-hoje'] as const,
  receitasSugestoesParaMim: (sexo?: string) => ['receitas', 'sugestoes', 'para-mim', sexo ?? ''] as const,
  receitasDesafios: () => ['receitas', 'sugestoes', 'desafios'] as const,
  receitasExecutadasRecentes: () => ['receitas', 'executadas', 'recentes'] as const,
  receitaAvaliacao: (id: string) => ['receitas', 'avaliacao', id] as const,

  // Inventário / Despensa
  inventario: () => ['inventario'] as const,
  inventarioVencendo: () => ['inventario', 'vencendo'] as const,

  // Planejamento
  planejamentoHoje: () => ['planejamento', 'hoje'] as const,
  planejamentoSemana: (semana: number) => ['planejamento', 'semana', semana] as const,

  // Listas de compras
  listas: () => ['listas'] as const,
  listaDetalhe: (id: string) => ['listas', id] as const,

  // Compras (histórico)
  compras: (mes?: number, ano?: number) => ['compras', mes, ano] as const,
  comprasResumoMes: () => ['compras', 'resumo-mes'] as const,

  // Usuário
  perfil: () => ['usuario', 'perfil'] as const,
  preferencias: () => ['usuario', 'preferencias'] as const,

  // Notificações
  notificacoesContagem: () => ['notificacoes', 'contagem'] as const,
} as const;
