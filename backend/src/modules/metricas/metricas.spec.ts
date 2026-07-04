import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { MetricasService } from './metricas.service';
import { LlmMetricsService } from './llm-metrics.service';
import { EventoUso } from './entities/evento-uso.entity';
import { LlmChamada } from './entities/llm-chamada.entity';

describe('MetricasService', () => {
  let service: MetricasService;
  let insertMock: jest.Mock;

  beforeEach(async () => {
    insertMock = jest.fn().mockResolvedValue({});
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MetricasService,
        {
          provide: getRepositoryToken(EventoUso),
          useValue: { insert: insertMock, query: jest.fn().mockResolvedValue([]) },
        },
      ],
    }).compile();
    service = module.get(MetricasService);
  });

  it('registra evento com usuario, tipo e metadata', async () => {
    await service.registrar('user-1', 'cupom_lido', { metodo: 'ocr' });

    expect(insertMock).toHaveBeenCalledWith({
      usuario_id: 'user-1',
      evento: 'cupom_lido',
      metadata: { metodo: 'ocr' },
    });
  });

  it('nunca lança — métrica não pode derrubar fluxo de negócio', async () => {
    insertMock.mockRejectedValue(new Error('DB caiu'));

    await expect(service.registrar('user-1', 'app_open')).resolves.toBeUndefined();
  });
});

describe('LlmMetricsService', () => {
  let service: LlmMetricsService;
  let insertMock: jest.Mock;

  beforeEach(async () => {
    insertMock = jest.fn().mockResolvedValue({});
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LlmMetricsService,
        {
          provide: getRepositoryToken(LlmChamada),
          useValue: { insert: insertMock, query: jest.fn().mockResolvedValue([]) },
        },
      ],
    }).compile();
    service = module.get(LlmMetricsService);
  });

  it('registra chamada com custo estimado a partir dos tokens', async () => {
    await service.registrar({
      contexto: 'geracao',
      provider: 'anthropic',
      modelo: 'claude-haiku-4-5-20251001',
      tokens_in: 1_000_000,
      tokens_out: 100_000,
      latencia_ms: 900,
      sucesso: true,
    });

    const row = insertMock.mock.calls[0][0];
    // 1M in × $1/M + 0.1M out × $5/M = 1.5
    expect(row.custo_estimado).toBeCloseTo(1.5);
    expect(row.sucesso).toBe(true);
  });

  it('registra FALHA (o dado que faltou quando o crédito zerou)', async () => {
    await service.registrar({
      contexto: 'geracao',
      provider: 'anthropic',
      modelo: 'claude-haiku-4-5-20251001',
      sucesso: false,
      erro: 'credit_exhausted',
    });

    const row = insertMock.mock.calls[0][0];
    expect(row.sucesso).toBe(false);
    expect(row.erro).toBe('credit_exhausted');
  });
});
