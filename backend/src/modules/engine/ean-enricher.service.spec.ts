import { Test } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { EanEnricherService } from './ean-enricher.service';

describe('EanEnricherService', () => {
  let svc: EanEnricherService;

  const montar = async (env: Record<string, string> = {}) => {
    const module = await Test.createTestingModule({
      providers: [
        EanEnricherService,
        { provide: ConfigService, useValue: { get: (k: string) => env[k] } },
      ],
    }).compile();
    svc = module.get(EanEnricherService);
  };

  beforeEach(() => montar());

  describe('canonizarNome — reduz nome oficial a canônico', () => {
    it('remove marca e peso', () => {
      expect(svc.canonizarNome('Leite Condensado Integral Moça 395g', 'Moça')).toContain('leite condensado');
    });
    it('sem marca, ainda limpa peso/unidade', () => {
      expect(svc.canonizarNome('Salgadinho Costelinha 70g', null)).toBe('salgadinho costelinha');
    });
    it('remove acentos e pontuação', () => {
      const r = svc.canonizarNome('Café Torrado, Moído 500g', 'Pilão');
      expect(r).toMatch(/cafe/);
      expect(r).not.toMatch(/[áàâã]/);
    });
  });

  describe('validação de EAN', () => {
    it('EAN inválido / ausente → null (não consulta rede)', async () => {
      expect(await svc.consultar(undefined)).toBeNull();
      expect(await svc.consultar('123')).toBeNull();
      expect(await svc.consultar('abcdefghijklm')).toBeNull();
    });
  });

  describe('killswitch', () => {
    it('ENGINE_EAN_ENRICH=false desliga', async () => {
      await montar({ ENGINE_EAN_ENRICH: 'false' });
      expect(svc.habilitado).toBe(false);
      expect(await svc.consultar('7891000100103')).toBeNull();
    });
    it('habilitado por padrão', async () => {
      expect(svc.habilitado).toBe(true);
    });
  });
});
