import { Test, TestingModule } from '@nestjs/testing';
import { EngineService } from './engine.service';
import { LlmCanonizadorService } from './llm-canonizador.service';
import { EanEnricherService } from './ean-enricher.service';
import { OcrAliasService } from '../product-classification/services/ocr-alias.service';
import { extrairMarca } from './marcas';

/**
 * Engine de Canonização — contrato da API B2B:
 * confidence honesto por estágio, marca extraída, guard de não-alimento,
 * tier de IA só na cauda longa (e aprendendo na KB).
 */
describe('EngineService', () => {
  let engine: EngineService;
  let ocrAlias: { resolverComEstagio: jest.Mock; registrarCorreção: jest.Mock };
  let llm: { canonizar: jest.Mock; habilitado: boolean };

  const montar = async (llmHabilitado = true) => {
    ocrAlias = { resolverComEstagio: jest.fn(), registrarCorreção: jest.fn().mockResolvedValue(undefined) };
    llm = { canonizar: jest.fn().mockResolvedValue(null), habilitado: llmHabilitado };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EngineService,
        { provide: OcrAliasService, useValue: ocrAlias },
        { provide: LlmCanonizadorService, useValue: llm },
        { provide: EanEnricherService, useValue: { consultar: jest.fn().mockResolvedValue(null), habilitado: false } },
      ],
    }).compile();
    engine = module.get(EngineService);
  };

  beforeEach(() => montar());

  it('resolução por EAN → confiança máxima (0.99)', async () => {
    ocrAlias.resolverComEstagio.mockResolvedValue({ canonical: 'creme de leite', estagio: 'ean' });

    const r = await engine.canonizar({ descricao: 'CR LEITE ITALAC 200GR', ean: '7891234567890' });

    expect(r.produto_canonico).toBe('creme de leite');
    expect(r.estagio).toBe('ean');
    expect(r.confianca).toBe(0.99);
    expect(r.marca).toBe('Italac');
    expect(r.ean).toBe('7891234567890');
  });

  it('dicionário → 0.95; fallback → 0.3 (honestidade do score)', async () => {
    ocrAlias.resolverComEstagio.mockResolvedValueOnce({ canonical: 'arroz', estagio: 'abreviacao' });
    const dict = await engine.canonizar({ descricao: 'ARR CAMIL 5KG' });
    expect(dict.confianca).toBe(0.95);
    expect(dict.estagio).toBe('dicionario');
    expect(dict.marca).toBe('Camil');

    llm.habilitado = false;
    ocrAlias.resolverComEstagio.mockResolvedValueOnce({ canonical: 'produto xyz', estagio: 'fallback' });
    const fb = await engine.canonizar({ descricao: 'XYZ DESCONHECIDO 123' });
    expect(fb.confianca).toBe(0.3);
    expect(fb.estagio).toBe('fallback');
  });

  it('não-ingrediente (guard): eh_alimento=false SEMPRE, mesmo se a resolução divagar', async () => {
    ocrAlias.resolverComEstagio.mockResolvedValue({ canonical: 'sabonete liquido', estagio: 'fallback' });

    const r = await engine.canonizar({ descricao: 'SABONETE LIQUIDO PROTEX 250ML' });

    expect(r.eh_alimento).toBe(false);
    expect(r.marca).toBe('Protex');
    expect(r.confianca).toBeGreaterThanOrEqual(0.9); // guard determinístico = certeza alta
  });

  it('alimento sem classificação → eh_alimento=null (indeterminado, não chuta)', async () => {
    ocrAlias.resolverComEstagio.mockResolvedValue({ canonical: 'arroz', estagio: 'kb_exato' });

    const r = await engine.canonizar({ descricao: 'ARROZ BRANCO 5KG' });
    expect(r.eh_alimento).toBeNull();
  });

  it('cauda longa: fallback + IA habilitada → tier IA resolve e vira estagio "ia" (0.7)', async () => {
    ocrAlias.resolverComEstagio.mockResolvedValue({ canonical: 'polpa cupuac', estagio: 'fallback' });
    llm.canonizar.mockResolvedValue({ produto_canonico: 'polpa de cupuaçu' });

    const r = await engine.canonizar({ descricao: 'POLPA CUPUAC INTG 500G' });

    expect(llm.canonizar).toHaveBeenCalledWith('POLPA CUPUAC INTG 500G', undefined);
    expect(r.produto_canonico).toBe('polpa de cupuaçu');
    expect(r.estagio).toBe('ia');
    expect(r.confianca).toBe(0.7);
  });

  it('IA NÃO é chamada quando o estágio determinístico é confiável (custo!)', async () => {
    ocrAlias.resolverComEstagio.mockResolvedValue({ canonical: 'arroz', estagio: 'abreviacao' });

    await engine.canonizar({ descricao: 'ARR BRANCO 1KG' });
    expect(llm.canonizar).not.toHaveBeenCalled();
  });

  it('IA NÃO é chamada para não-ingrediente (guard barra antes)', async () => {
    ocrAlias.resolverComEstagio.mockResolvedValue({ canonical: 'detergente', estagio: 'fallback' });

    await engine.canonizar({ descricao: 'DETERGENTE YPE 500ML' });
    expect(llm.canonizar).not.toHaveBeenCalled();
  });

  it('estágio "correcao" (correção humana) → confiança 0.98', async () => {
    ocrAlias.resolverComEstagio.mockResolvedValue({ canonical: 'leite condensado', estagio: 'correcao' });
    const r = await engine.canonizar({ descricao: 'LEITE CONDENSADO MOCA' });
    expect(r.produto_canonico).toBe('leite condensado');
    expect(r.estagio).toBe('correcao');
    expect(r.confianca).toBe(0.98);
  });

  it('corrigir() delega pro ocrAlias (flywheel: a base aprende)', async () => {
    await engine.corrigir('LEITE CONDENSADO MOCA', 'leite condensado', '7891000000000');
    expect(ocrAlias.registrarCorreção).toHaveBeenCalledWith('LEITE CONDENSADO MOCA', 'leite condensado', '7891000000000');
  });

  it('cauda longa: item com EAN + resolução fraca → enricher aprende (estágio ean, 0.99)', async () => {
    ocrAlias.resolverComEstagio.mockResolvedValue({ canonical: 'salg pepe legal', estagio: 'fallback' });
    var enricher = { consultar: jest.fn().mockResolvedValue({ produto_canonico: 'salgadinho', nome_completo: 'Salgadinho Pepe Legal', marca: 'Pepe Legal', fonte: 'openfoodfacts' }), habilitado: true };
    const module = await Test.createTestingModule({
      providers: [
        EngineService,
        { provide: OcrAliasService, useValue: ocrAlias },
        { provide: LlmCanonizadorService, useValue: { canonizar: jest.fn(), habilitado: false } },
        { provide: EanEnricherService, useValue: enricher },
      ],
    }).compile();
    const eng = module.get(EngineService);

    const r = await eng.canonizar({ descricao: 'SALG PEPE LEGAL COSTELINHA', ean: '7896950800110' });

    expect(enricher.consultar).toHaveBeenCalledWith('7896950800110');
    expect(r.produto_canonico).toBe('salgadinho');
    expect(r.estagio).toBe('ean');
    expect(r.confianca).toBe(0.99);
    expect(ocrAlias.registrarCorreção).toHaveBeenCalledWith('SALG PEPE LEGAL COSTELINHA', 'salgadinho', '7896950800110');
  });

  it('EAN enricher NÃO chamado sem EAN', async () => {
    ocrAlias.resolverComEstagio.mockResolvedValue({ canonical: 'xyz', estagio: 'fallback' });
    var enricher = { consultar: jest.fn().mockResolvedValue(null), habilitado: true };
    const module = await Test.createTestingModule({
      providers: [
        EngineService,
        { provide: OcrAliasService, useValue: ocrAlias },
        { provide: LlmCanonizadorService, useValue: { canonizar: jest.fn(), habilitado: false } },
        { provide: EanEnricherService, useValue: enricher },
      ],
    }).compile();
    const eng = module.get(EngineService);
    await eng.canonizar({ descricao: 'XYZ SEM EAN' });
    expect(enricher.consultar).not.toHaveBeenCalled();
  });

  it('canonizarLote preserva ordem e devolve todos', async () => {
    ocrAlias.resolverComEstagio
      .mockResolvedValueOnce({ canonical: 'arroz', estagio: 'abreviacao' })
      .mockResolvedValueOnce({ canonical: 'feijão', estagio: 'regex' });

    const r = await engine.canonizarLote([{ descricao: 'ARR 5KG' }, { descricao: 'FEIJAO CAR 1KG' }]);
    expect(r.map((i) => i.produto_canonico)).toEqual(['arroz', 'feijão']);
  });
});

describe('extrairMarca', () => {
  const casos: Array<[string, string | null]> = [
    ['CR LEITE ITALAC 200GR', 'Italac'],
    ['ARROZ TIO JOAO 5KG', 'Tio João'],
    ['CAFE 3 CORACOES VACUO 500G', '3 Corações'],
    ['SABONETE PROTEX 85G', 'Protex'],
    ['BATATA PRINGLES ORIG 104G', 'Pringles'],
    ['TOMATE ITALIANO KG', null],           // sem marca
    ['BANANA PRATA KG', null],              // 'prata' não é marca
  ];
  it.each(casos)('%s → %s', (desc, esperado) => {
    expect(extrairMarca(desc)).toBe(esperado);
  });
});
