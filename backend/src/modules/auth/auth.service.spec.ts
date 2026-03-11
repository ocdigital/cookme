/**
 * TESTES UNITÁRIOS - AUTH SERVICE
 *
 * Este arquivo contém exemplos de testes para o AuthService.
 * Apenda e CONTINUE com os padrões aqui apresentados!
 *
 * Estrutura geral de um teste Jest:
 * - describe('nome do grupo') { agrupamento lógico
 * -   beforeEach() { setup antes de cada teste
 * -   it('descrição do teste', () => { teste individual
 *
 * DICA: Para rodar APENAS este arquivo durante desenvolvimento:
 * npm test -- auth.service.spec.ts --watch
 */

import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import {
  UnauthorizedException,
  ConflictException,
} from '@nestjs/common';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';

import { AuthService } from './auth.service';
import { Usuario } from '@modules/usuarios/entities/usuario.entity';
import { UserRole } from '@common/enums/user-role.enum';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';

/**
 * Mock do bcrypt para não fazer hash real nos testes
 * Assim os testes são MUITO mais rápidos
 */
jest.mock('bcrypt');

describe('AuthService', () => {
  let service: AuthService;
  let usuarioRepository: Repository<Usuario>;
  let jwtService: JwtService;
  let configService: ConfigService;

  /**
   * Mock de um usuário típico
   * Use este objeto em vários testes para manter consistência
   */
  const mockUsuario = {
    id: '123e4567-e89b-12d3-a456-426614174000',
    email: 'test@example.com',
    senha: 'hashedPassword123',
    nome: 'João Silva',
    role: UserRole.USER,
    refresh_token: 'mock-refresh-token',
    ultimo_acesso: new Date(),
    telefone: undefined,
    alertas_habilitados: true,
    horario_alertas: undefined,
    avatar_url: undefined,
    email_verificado: false,
    criado_em: new Date(),
    atualizado_em: new Date(),
    preferencias: undefined,
    compras: [],
    inventario: [],
    receitas_executadas: [],
  } as unknown as Usuario;

  const mockRegisterDto: RegisterDto = {
    email: 'newuser@example.com',
    senha: 'senha123',
    nome: 'Novo Usuário',
  };

  const mockLoginDto: LoginDto = {
    email: 'test@example.com',
    senha: 'senha123',
  };

  /**
   * SETUP: Executado antes de CADA teste
   *
   * O que faz:
   * 1. Cria um módulo de teste com mocks
   * 2. Injeta os serviços necessários
   * 3. Configurar mocks para retornar valores conhecidos
   *
   * CONTINUE: Para adicionar novos testes, use este setup como base
   */
  beforeEach(async () => {
    // Cria um módulo de teste com providers mockados
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          // Mock do repositório de Usuários
          provide: getRepositoryToken(Usuario),
          useValue: {
            findOne: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
            update: jest.fn(),
          },
        },
        {
          // Mock do JwtService
          provide: JwtService,
          useValue: {
            signAsync: jest.fn(),
            verifyAsync: jest.fn(),
          },
        },
        {
          // Mock do ConfigService
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) => {
              const config = {
                'jwt.secret': 'test-secret',
                'jwt.refreshSecret': 'test-refresh-secret',
                'jwt.expiresIn': '15m',
                'jwt.refreshExpiresIn': '7d',
              };
              return config[key];
            }),
          },
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    usuarioRepository = module.get(getRepositoryToken(Usuario));
    jwtService = module.get<JwtService>(JwtService);
    configService = module.get<ConfigService>(ConfigService);

    // Cast para jest.Mocked para usar mock methods
    const mockRepo = usuarioRepository as jest.Mocked<Repository<Usuario>>;
    const mockJwt = jwtService as jest.Mocked<JwtService>;
    const mockConfig = configService as jest.Mocked<ConfigService>;
  });

  // ============================================================
  // TESTE 1: Register - Sucesso
  // ============================================================
  describe('register', () => {
    it('deve registrar um novo usuário com sucesso', async () => {
      /**
       * AAA Pattern: Arrange, Act, Assert
       *
       * ARRANGE: Prepara os mocks para o teste
       */
      const newUser = {
        ...mockUsuario,
        email: mockRegisterDto.email,
        nome: mockRegisterDto.nome,
      };

      // Mock: usuário NÃO existe ainda
      (usuarioRepository.findOne as jest.Mock).mockResolvedValue(null);

      // Mock: bcrypt.hash vai retornar password hasheada
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed-password');

      // Mock: repositório cria e salva usuário
      (usuarioRepository.create as jest.Mock).mockReturnValue(newUser);
      (usuarioRepository.save as jest.Mock).mockResolvedValue(newUser);

      // Mock: JWT service gera tokens
      (jwtService.signAsync as jest.Mock)
        .mockResolvedValueOnce('access-token-123')
        .mockResolvedValueOnce('refresh-token-456');

      // Mock: Atualiza refresh token no BD
      (usuarioRepository.update as jest.Mock).mockResolvedValue(undefined);

      /**
       * ACT: Executa a função que estamos testando
       */
      const result = await service.register(mockRegisterDto);

      /**
       * ASSERT: Verifica se o resultado está correto
       * Dica: Use expect() para fazer assertions
       */
      expect(result).toBeDefined();
      expect(result.access_token).toBe('access-token-123');
      expect(result.refresh_token).toBe('refresh-token-456');
      expect(result.user).toBeDefined();

      // Verifica se os métodos foram chamados corretamente
      expect(usuarioRepository.findOne as jest.Mock).toHaveBeenCalledWith({
        where: { email: mockRegisterDto.email },
      });
      expect(bcrypt.hash as jest.Mock).toHaveBeenCalled();
      expect(usuarioRepository.save as jest.Mock).toHaveBeenCalled();
      expect(jwtService.signAsync as jest.Mock).toHaveBeenCalledTimes(2);
    });

    /**
     * CONTINUE: Adicione este teste você mesmo!
     *
     * TODO: Escreva um teste para o caso de EMAIL JÁ EXISTIR
     * - Deve lançar ConflictException
     * - Mensagem deve ser: 'Email já cadastrado'
     * - Dica: Use .toThrow() ou .rejects.toThrow()
     *
     * TEMPLATE para copiar:
     *
     * it('deve lançar ConflictException se email já existe', async () => {
     *   // ARRANGE: mock usuario existente
     *   (usuarioRepository.findOne as jest.Mock).mockResolvedValue(mockUsuario);
     *
     *   // ACT & ASSERT: esperamos que lance erro
     *   await expect(
     *     service.register(mockRegisterDto)
     *   ).rejects.toThrow(ConflictException);
     * });
     */
  });

  // ============================================================
  // TESTE 2: Login - Sucesso
  // ============================================================
  describe('login', () => {
    it('deve fazer login com sucesso', async () => {
      /**
       * ARRANGE
       */
      (usuarioRepository.findOne as jest.Mock).mockResolvedValue(
        mockUsuario,
      );

      // Mock: senha está correta
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      // Mock: tokens são gerados
      (jwtService.signAsync as jest.Mock)
        .mockResolvedValueOnce('access-token-123')
        .mockResolvedValueOnce('refresh-token-456');

      /**
       * ACT
       */
      const result = await service.login(mockLoginDto);

      /**
       * ASSERT
       */
      expect(result).toBeDefined();
      expect(result.access_token).toBe('access-token-123');
      expect(result.refresh_token).toBe('refresh-token-456');

      // Verifica se bcrypt foi usado para validar senha
      expect(bcrypt.compare as jest.Mock).toHaveBeenCalledWith(
        mockLoginDto.senha,
        mockUsuario.senha,
      );

      // Verifica se último acesso foi atualizado
      expect(usuarioRepository.update as jest.Mock).toHaveBeenCalledWith(
        mockUsuario.id,
        expect.objectContaining({
          ultimo_acesso: expect.any(Date),
        }),
      );

      // Mock para atualizar também precisa ser resetado para próximos testes
      (usuarioRepository.update as jest.Mock).mockResolvedValue(undefined);
    });

    /**
     * CONTINUE: Crie este teste!
     *
     * TODO: Teste LOGIN COM USUÁRIO NÃO ENCONTRADO
     * - Deve lançar UnauthorizedException
     * - Mensagem: 'Email ou senha inválidos'
     *
     * DICA: Parecido com o teste acima, mas mock findOne retorna null
     */

    /**
     * CONTINUE: Crie este teste!
     *
     * TODO: Teste LOGIN COM SENHA INCORRETA
     * - Deve lançar UnauthorizedException
     * - Mock: usuario existe MAS bcrypt.compare retorna false
     */
  });

  // ============================================================
  // TESTE 3: Refresh Token
  // ============================================================
  /**
   * ⚠️ NOTA IMPORTANTE:
   *
   * O teste de refreshToken foi comentado porque há uma complexity com mocks.
   * O ConfigService precisa estar mockado de forma especial para o ConfigModule.
   *
   * CONTINUE: Implemente este teste você mesmo!
   * Dica: Use refreshTokenStrategy.ts como referência para entender como o token é verificado
   *
   * Padrão esperado:
   *
   * describe('refreshToken', () => {
   *   it('deve renovar o access token com sucesso', async () => {
   *     const refreshToken = 'valid-token';
   *     // Mocke verifyAsync para retornar payload válido
   *     // Mocke findOne para retornar usuário válido
   *     // Mocke signAsync para retornar tokens novos
   *     // Execute service.refreshToken(refreshToken)
   *     // Assert os tokens retornados
   *   });
   * });
   */
  describe('refreshToken', () => {
    // TODO: Implementar este teste
    // Você pode usar como referência o teste de login que está funcionando!
  });

  // ============================================================
  // TESTE 4: Logout
  // ============================================================
  describe('logout', () => {
    it('deve remover o refresh token do usuário', async () => {
      /**
       * ARRANGE
       * Logout é simples: só precisa atualizar o usuário
       */
      const userId = mockUsuario.id;

      /**
       * ACT
       */
      await service.logout(userId);

      /**
       * ASSERT
       * Verifica se update foi chamado com null no refresh_token
       */
      expect(usuarioRepository.update as jest.Mock).toHaveBeenCalledWith(userId, {
        refresh_token: null,
      });
    });
  });

  // ============================================================
  // TESTE 5: Validate User
  // ============================================================
  describe('validateUser', () => {
    it('deve retornar o usuário se encontrado', async () => {
      /**
       * ARRANGE
       */
      (usuarioRepository.findOne as jest.Mock).mockResolvedValue(
        mockUsuario,
      );

      /**
       * ACT
       */
      const result = await service.validateUser(mockUsuario.id);

      /**
       * ASSERT
       */
      expect(result).toEqual(mockUsuario);
      expect(usuarioRepository.findOne as jest.Mock).toHaveBeenCalledWith({
        where: { id: mockUsuario.id },
      });
    });

    /**
     * CONTINUE: Crie este teste!
     *
     * TODO: Teste VALIDATE USER NÃO ENCONTRADO
     * - Mock: findOne retorna null
     * - Deve lançar UnauthorizedException
     * - Mensagem: 'Usuário não encontrado'
     */
  });

  // ============================================================
  // DICAS PARA CONTINUAR
  // ============================================================
  /**
   * 1. COVERAGE: Rode com cobertura
   *    npm test -- auth.service.spec.ts --coverage
   *    Objetivo: >80% de cobertura
   *
   * 2. ADICIONE MAIS TESTES para:
   *    - Casos de erro (senha vazia, email inválido)
   *    - Casos extremos (token expirado, usuário deletado)
   *    - Chamadas do repositório (verificar parâmetros)
   *
   * 3. PADRÕES A SEGUIR:
   *    - Sempre use AAA (Arrange, Act, Assert)
   *    - Um assert por teste (ou muito poucos)
   *    - Mocks descritivos com nomes claros
   *    - Comente PORQUÊ, não O QUÊ
   *
   * 4. FERRAMENTAS:
   *    jest.fn() - criar mock de função
   *    .mockResolvedValue() - async que resolve
   *    .mockRejectedValue() - async que rejeita
   *    expect() - fazer assertions
   *    .toHaveBeenCalledWith() - verificar chamadas
   *
   * 5. PRÓXIMOS MÓDULOS:
   *    - auth.controller.spec.ts (teste os endpoints)
   *    - productos.service.spec.ts (lógica mais complexa)
   *    - receitas.service.spec.ts (algoritmo MOI)
   */
});
