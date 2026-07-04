import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { InventarioExpiracaoJob } from './inventario-expiracao.job';
import { Inventario } from './entities/inventario.entity';
import { PushNotificationService } from '../notificacoes/services/push-notification.service';

/**
 * Push de vencimento (Fase 7.2): 1 push agregado por usuário/dia com os
 * itens vencendo em ≤3 dias; item avisado não repete (validade_avisada_em).
 */
describe('InventarioExpiracaoJob — push de vencimento', () => {
  let job: InventarioExpiracaoJob;
  let inventarioRepo: { find: jest.Mock; update: jest.Mock; createQueryBuilder: jest.Mock };
  let push: { enviarParaUsuario: jest.Mock };

  const emDias = (n: number) => {
    const d = new Date();
    d.setDate(d.getDate() + n);
    return d;
  };

  beforeEach(async () => {
    inventarioRepo = {
      find: jest.fn().mockResolvedValue([]),
      update: jest.fn().mockResolvedValue({}),
      createQueryBuilder: jest.fn(),
    };
    push = { enviarParaUsuario: jest.fn().mockResolvedValue(undefined) };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        InventarioExpiracaoJob,
        { provide: getRepositoryToken(Inventario), useValue: inventarioRepo },
        { provide: PushNotificationService, useValue: push },
      ],
    }).compile();

    job = module.get(InventarioExpiracaoJob);
  });

  it('usuário com 2 itens vencendo recebe EXATAMENTE 1 push agregado', async () => {
    inventarioRepo.find.mockResolvedValue([
      { id: 'i1', usuario_id: 'user-1', data_validade: emDias(1), validade_avisada_em: null, produto: { nome: 'Frango', nome_display: 'frango' } },
      { id: 'i2', usuario_id: 'user-1', data_validade: emDias(2), validade_avisada_em: null, produto: { nome: 'Creme de Leite', nome_display: 'creme de leite' } },
    ]);

    const resultado = await job.avisarVencimentos();

    expect(push.enviarParaUsuario).toHaveBeenCalledTimes(1);
    const [userId, titulo, corpo, data] = push.enviarParaUsuario.mock.calls[0];
    expect(userId).toBe('user-1');
    expect(corpo).toContain('frango');
    expect(data.rota).toContain('vencendo');
    expect(resultado.usuarios_avisados).toBe(1);
  });

  it('marca os itens como avisados (não repete no dia seguinte)', async () => {
    inventarioRepo.find.mockResolvedValue([
      { id: 'i1', usuario_id: 'user-1', data_validade: emDias(1), validade_avisada_em: null, produto: { nome: 'Frango' } },
    ]);

    await job.avisarVencimentos();

    expect(inventarioRepo.update).toHaveBeenCalledWith(
      ['i1'],
      expect.objectContaining({ validade_avisada_em: expect.any(Date) }),
    );
  });

  it('sem itens vencendo → zero push', async () => {
    inventarioRepo.find.mockResolvedValue([]);

    const resultado = await job.avisarVencimentos();

    expect(push.enviarParaUsuario).not.toHaveBeenCalled();
    expect(resultado.usuarios_avisados).toBe(0);
  });
});
