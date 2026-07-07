import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { BadRequestException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { AuthService } from './auth.service';
import { Usuario } from '../usuarios/entities/usuario.entity';
import { PasswordResetCode } from './entities/password-reset-code.entity';
import { MailService } from '../mail/mail.service';

/**
 * Esqueci minha senha — fluxo por código de 6 dígitos:
 * - esqueciSenha NUNCA revela se o e-mail existe (anti-enumeração)
 * - código armazenado como hash, single-use, TTL, máx 5 tentativas
 * - redefinir troca a senha E invalida o refresh_token (derruba sessões)
 */
describe('AuthService — esqueci minha senha', () => {
  let service: AuthService;
  let usuarioRepo: { findOne: jest.Mock; update: jest.Mock };
  let resetRepo: {
    findOne: jest.Mock;
    create: jest.Mock;
    save: jest.Mock;
    update: jest.Mock;
    increment: jest.Mock;
  };
  let mail: { enviarCodigoRecuperacao: jest.Mock; habilitado: boolean };

  const USUARIO = { id: 'u1', email: 'edu@cookme.com', nome: 'Edu' };

  beforeEach(async () => {
    usuarioRepo = { findOne: jest.fn(), update: jest.fn().mockResolvedValue({}) };
    resetRepo = {
      findOne: jest.fn().mockResolvedValue(null),
      create: jest.fn().mockImplementation((d: any) => d),
      save: jest.fn().mockImplementation((d: any) => Promise.resolve({ id: 'prc1', ...d })),
      update: jest.fn().mockResolvedValue({}),
      increment: jest.fn().mockResolvedValue({}),
    };
    mail = { enviarCodigoRecuperacao: jest.fn().mockResolvedValue(true), habilitado: true };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: getRepositoryToken(Usuario), useValue: usuarioRepo },
        { provide: getRepositoryToken(PasswordResetCode), useValue: resetRepo },
        { provide: JwtService, useValue: { signAsync: jest.fn().mockResolvedValue('tok') } },
        { provide: ConfigService, useValue: { get: jest.fn().mockReturnValue(undefined) } },
        { provide: MailService, useValue: mail },
      ],
    }).compile();

    service = module.get(AuthService);
  });

  describe('esqueciSenha', () => {
    it('e-mail cadastrado: gera código hasheado, invalida anteriores e envia', async () => {
      usuarioRepo.findOne.mockResolvedValue(USUARIO);

      await service.esqueciSenha('edu@cookme.com');

      // Invalida códigos anteriores do usuário
      expect(resetRepo.update).toHaveBeenCalledWith(
        { usuario_id: 'u1', usado_em: expect.anything() },
        expect.objectContaining({ usado_em: expect.any(Date) }),
      );
      // Salva HASH (não o código em claro)
      const salvo = resetRepo.save.mock.calls[0][0];
      expect(salvo.codigo_hash).toMatch(/^\$2[aby]\$/);
      expect(salvo.expira_em.getTime()).toBeGreaterThan(Date.now());
      // Envia o código em claro por e-mail (6 dígitos)
      const [para, codigo] = mail.enviarCodigoRecuperacao.mock.calls[0];
      expect(para).toBe('edu@cookme.com');
      expect(codigo).toMatch(/^\d{6}$/);
      // E o hash salvo corresponde ao código enviado
      expect(await bcrypt.compare(codigo, salvo.codigo_hash)).toBe(true);
    });

    it('e-mail NÃO cadastrado: não envia nada e NÃO lança (anti-enumeração)', async () => {
      usuarioRepo.findOne.mockResolvedValue(null);

      await expect(service.esqueciSenha('naoexiste@x.com')).resolves.toBeUndefined();
      expect(mail.enviarCodigoRecuperacao).not.toHaveBeenCalled();
      expect(resetRepo.save).not.toHaveBeenCalled();
    });
  });

  describe('redefinirSenha', () => {
    const codigoValido = async () => ({
      id: 'prc1',
      usuario_id: 'u1',
      codigo_hash: await bcrypt.hash('123456', 10),
      expira_em: new Date(Date.now() + 10 * 60 * 1000),
      usado_em: null,
      tentativas: 0,
    });

    it('código correto: troca senha, marca usado e derruba sessões (refresh_token)', async () => {
      usuarioRepo.findOne.mockResolvedValue(USUARIO);
      resetRepo.findOne.mockResolvedValue(await codigoValido());

      await service.redefinirSenha('edu@cookme.com', '123456', 'NovaSenha123');

      // Senha trocada (hasheada) + refresh_token invalidado no MESMO update
      const [id, updates] = usuarioRepo.update.mock.calls[0];
      expect(id).toBe('u1');
      expect(updates.senha).toMatch(/^\$2[aby]\$/);
      expect(await bcrypt.compare('NovaSenha123', updates.senha)).toBe(true);
      expect(updates.refresh_token).toBeNull();
      // Código marcado como usado (single-use)
      expect(resetRepo.update).toHaveBeenCalledWith(
        'prc1',
        expect.objectContaining({ usado_em: expect.any(Date) }),
      );
    });

    it('código errado: incrementa tentativas e rejeita', async () => {
      usuarioRepo.findOne.mockResolvedValue(USUARIO);
      resetRepo.findOne.mockResolvedValue(await codigoValido());

      await expect(
        service.redefinirSenha('edu@cookme.com', '999999', 'NovaSenha123'),
      ).rejects.toThrow(BadRequestException);
      expect(resetRepo.increment).toHaveBeenCalledWith({ id: 'prc1' }, 'tentativas', 1);
      expect(usuarioRepo.update).not.toHaveBeenCalled();
    });

    it('código expirado: rejeita', async () => {
      usuarioRepo.findOne.mockResolvedValue(USUARIO);
      resetRepo.findOne.mockResolvedValue({
        ...(await codigoValido()),
        expira_em: new Date(Date.now() - 1000),
      });

      await expect(
        service.redefinirSenha('edu@cookme.com', '123456', 'NovaSenha123'),
      ).rejects.toThrow(BadRequestException);
      expect(usuarioRepo.update).not.toHaveBeenCalled();
    });

    it('5+ tentativas: rejeita mesmo com código certo (brute-force)', async () => {
      usuarioRepo.findOne.mockResolvedValue(USUARIO);
      resetRepo.findOne.mockResolvedValue({ ...(await codigoValido()), tentativas: 5 });

      await expect(
        service.redefinirSenha('edu@cookme.com', '123456', 'NovaSenha123'),
      ).rejects.toThrow(BadRequestException);
      expect(usuarioRepo.update).not.toHaveBeenCalled();
    });

    it('sem código pendente: rejeita com mensagem genérica', async () => {
      usuarioRepo.findOne.mockResolvedValue(USUARIO);
      resetRepo.findOne.mockResolvedValue(null);

      await expect(
        service.redefinirSenha('edu@cookme.com', '123456', 'NovaSenha123'),
      ).rejects.toThrow(BadRequestException);
    });
  });
});
