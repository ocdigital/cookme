import { assertCorrecaoPermitida, multiClienteHabilitado } from './governanca-multi-cliente';

/**
 * A7 (PLANO_PRECISAO_ENGINE.md §11): gate explícito antes do 1º design partner.
 * Hoje o único corretor é o CookMe (cliente_id ausente) — comportamento não muda.
 * Se algum dia um cliente_id aparecer numa correção, o sistema precisa recusar
 * a não ser que a flag de multi-cliente esteja ligada — nunca contaminar
 * silenciosamente a base global com a correção de um 2º cliente.
 */
describe('Governança multi-cliente (A7)', () => {
  const ORIGINAL_ENV = process.env.ENGINE_MULTI_CLIENTE_HABILITADO;

  afterEach(() => {
    process.env.ENGINE_MULTI_CLIENTE_HABILITADO = ORIGINAL_ENV;
  });

  it('sem cliente_id (single-tenant, hoje) — sempre permite, flag não importa', () => {
    delete process.env.ENGINE_MULTI_CLIENTE_HABILITADO;
    expect(() => assertCorrecaoPermitida()).not.toThrow();
    expect(() => assertCorrecaoPermitida(null)).not.toThrow();
  });

  it('com cliente_id e flag desligada — bloqueia (gate fechado)', () => {
    delete process.env.ENGINE_MULTI_CLIENTE_HABILITADO;
    expect(multiClienteHabilitado()).toBe(false);
    expect(() => assertCorrecaoPermitida('cliente-b')).toThrow(/ENGINE_MULTI_CLIENTE_HABILITADO/);
  });

  it('com cliente_id e flag ligada — permite (gate aberto deliberadamente)', () => {
    process.env.ENGINE_MULTI_CLIENTE_HABILITADO = 'true';
    expect(multiClienteHabilitado()).toBe(true);
    expect(() => assertCorrecaoPermitida('cliente-b')).not.toThrow();
  });
});
