import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException } from '@nestjs/common';
import { ReceitaBancoService } from './receita-banco.service';
import { Receita } from '../entities/receita.entity';
import { ReceitaIngrediente } from '../entities/receita-ingrediente.entity';
import { Produto } from '../../produtos/entities/produto.entity';
import { IngredientNormalizerService } from './ingredient-normalizer.service';
import { ReceitaClassificacaoService } from './receita-classificacao.service';

describe('ReceitaBancoService.buscarPorId — validação de UUID', () => {
  let service: ReceitaBancoService;
  let receitaRepo: { findOne: jest.Mock };

  const UUID_VALIDO = '65db1f1c-0df5-4177-afdc-5369817c9525';

  beforeEach(async () => {
    receitaRepo = { findOne: jest.fn() };
    const noop = {};
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReceitaBancoService,
        { provide: getRepositoryToken(Receita), useValue: receitaRepo },
        { provide: getRepositoryToken(ReceitaIngrediente), useValue: noop },
        { provide: getRepositoryToken(Produto), useValue: noop },
        { provide: IngredientNormalizerService, useValue: noop },
        { provide: ReceitaClassificacaoService, useValue: noop },
      ],
    }).compile();

    service = module.get<ReceitaBancoService>(ReceitaBancoService);
  });

  it('id não-UUID responde 404 SEM tocar o banco (não estoura 500)', async () => {
    await expect(service.buscarPorId('temp-123')).rejects.toBeInstanceOf(NotFoundException);
    await expect(service.buscarPorId('gerada-0')).rejects.toBeInstanceOf(NotFoundException);
    await expect(service.buscarPorId('')).rejects.toBeInstanceOf(NotFoundException);
    // guard antes da query — repositório nunca é consultado com id inválido
    expect(receitaRepo.findOne).not.toHaveBeenCalled();
  });

  it('UUID válido inexistente responde 404 (consulta o banco)', async () => {
    receitaRepo.findOne.mockResolvedValue(null);
    await expect(service.buscarPorId(UUID_VALIDO)).rejects.toBeInstanceOf(NotFoundException);
    expect(receitaRepo.findOne).toHaveBeenCalledWith({ where: { id: UUID_VALIDO } });
  });

  it('UUID válido existente retorna a receita', async () => {
    const receita = { id: UUID_VALIDO, nome: 'Omelete' } as Receita;
    receitaRepo.findOne.mockResolvedValue(receita);
    await expect(service.buscarPorId(UUID_VALIDO)).resolves.toBe(receita);
  });

  it('receita de outro autor responde 404 para terceiros', async () => {
    receitaRepo.findOne.mockResolvedValue({ id: UUID_VALIDO, autor_id: 'dono-abc' } as any);
    await expect(service.buscarPorId(UUID_VALIDO, 'outro-user')).rejects.toBeInstanceOf(NotFoundException);
  });

  it('o próprio autor vê a sua receita', async () => {
    const receita = { id: UUID_VALIDO, autor_id: 'dono-abc' } as any;
    receitaRepo.findOne.mockResolvedValue(receita);
    await expect(service.buscarPorId(UUID_VALIDO, 'dono-abc')).resolves.toBe(receita);
  });
});
