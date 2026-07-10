import { ForbiddenException } from '@nestjs/common';

/**
 * Governança multi-cliente (PLANO_PRECISAO_ENGINE.md §11 A7): hoje
 * `POST /engine/corrigir` grava globalmente porque o único corretor confiável
 * é o próprio CookMe. Isso deixa de ser verdade no dia em que existir um 2º
 * cliente B2B — a correção errada (ou maliciosa) de um cliente mudaria o
 * resultado de todos os outros.
 *
 * O plano é explícito: "Não precisa agora; precisa ANTES de abrir a API."
 * Não existe hoje conceito de cliente/tenant nem auth por API key no engine
 * module (é admin-only, ver engine.controller.ts) — construir o mecanismo
 * completo de tenancy agora seria especular sobre um consumidor que não
 * existe. Isto é o GATE: um killswitch explícito que precisa ser deliberadamente
 * ligado (e programado) antes de abrir `/engine/corrigir` para 2º cliente.
 *
 * Regra de promoção a global quando for implementado (do plano): N clientes
 * distintos concordam na mesma correção, OU a curadoria (humano CookMe) aprova.
 * Até lá, ENGINE_MULTI_CLIENTE_HABILITADO permanece false e o comportamento
 * de hoje (correção sempre global, single-tenant) continua intacto.
 */
export function multiClienteHabilitado(): boolean {
  return process.env.ENGINE_MULTI_CLIENTE_HABILITADO === 'true';
}

/**
 * Chamar antes de qualquer correção multi-cliente ser aceita. Enquanto o
 * killswitch estiver desligado (hoje, sempre), lança se alguém tentar passar
 * um cliente_id diferente do padrão — força a decisão consciente de construir
 * a tenancy real antes de ligar a flag, em vez de vazar contaminação cross-cliente
 * silenciosamente.
 */
export function assertCorrecaoPermitida(clienteId?: string | null): void {
  if (!clienteId) return; // single-tenant (CookMe) — comportamento de sempre
  if (!multiClienteHabilitado()) {
    throw new ForbiddenException(
      'Correção com cliente_id requer ENGINE_MULTI_CLIENTE_HABILITADO=true e a ' +
        'camada de override por cliente implementada (PLANO_PRECISAO_ENGINE.md §11 A7). ' +
        'Gate não passa — não abra /engine/corrigir para 2º cliente sem isso.',
    );
  }
}
