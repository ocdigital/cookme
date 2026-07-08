import { IngredientNormalizerService } from './ingredient-normalizer.service';

/**
 * Casos nascidos de bug real em produção (2026-07-08): receita "Pudim de
 * Canjica" exibia ingrediente "amassada" — expandirAlternativas dividia
 * "canjica cozida e amassada" no " e " e o particípio isolado virava chave.
 */
describe('IngredientNormalizerService — fragmentos de preparo', () => {
  let service: IngredientNormalizerService;

  beforeEach(() => {
    service = new IngredientNormalizerService();
  });

  describe('extrairChaves — divisão em " e " não pode gerar particípio', () => {
    it('caso real do bug: "canjica cozida e amassada" → só canjica', () => {
      const chaves = service.extrairChaves(['1 xícara de canjica cozida e amassada']);
      expect(chaves).toContain('canjica');
      expect(chaves).not.toContain('amassada');
      expect(chaves).not.toContain('cozida');
    });

    it('divisão legítima continua funcionando: "alho e cebola"', () => {
      const chaves = service.extrairChaves(['2 dentes de alho e 1 cebola picada']);
      expect(chaves).toContain('alho');
      expect(chaves).toContain('cebola');
    });

    it('"banana amassada e mel" → banana e mel, sem fragmento', () => {
      const chaves = service.extrairChaves(['1 banana amassada e 1 colher de mel']);
      expect(chaves).toContain('banana');
      expect(chaves).toContain('mel');
      expect(chaves).not.toContain('amassada');
    });

    it('"batata cozida e espremida" → só batata', () => {
      const chaves = service.extrairChaves(['2 batatas cozidas e espremidas']);
      expect(chaves).toContain('batata');
      expect(chaves.length).toBe(1);
    });

    it('"cenoura ralada e escorrida" → só cenoura', () => {
      const chaves = service.extrairChaves(['1 cenoura ralada e escorrida']);
      expect(chaves).toEqual(['cenoura']);
    });

    it('"arroz branco e integral" não vira chave "integral"', () => {
      const chaves = service.extrairChaves(['1 xícara de arroz branco e integral']);
      expect(chaves).not.toContain('integral');
      expect(chaves.some((c) => c.includes('arroz'))).toBe(true);
    });
  });

  describe('normalizar — particípio/adjetivo isolado nunca é ingrediente', () => {
    const fragmentos = [
      'amassada', 'amassado', 'picada', 'picadas', 'ralado', 'ralada',
      'cozida', 'cozido', 'fatiada', 'desfiado', 'escorrida', 'temperado',
      'bem amassada', 'integral',
    ];
    it.each(fragmentos)('"%s" → null', (frag) => {
      expect(service.normalizar(frag)).toBeNull();
    });

    it('ingrediente com particípio no fim continua resolvendo: "banana amassada" → banana', () => {
      expect(service.normalizar('banana amassada')?.nomeCanônico).toBe('banana');
    });

    it('nome composto legítimo não é afetado: "creme de leite"', () => {
      expect(service.normalizar('creme de leite')?.nomeCanônico).toBe('creme de leite');
    });
  });
});
