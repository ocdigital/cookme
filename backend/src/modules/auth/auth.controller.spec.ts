/**
 * TESTES DE INTEGRAÇÃO - AUTH CONTROLLER
 *
 * Este arquivo testa os ENDPOINTS (HTTP), não a lógica interna.
 *
 * Diferença:
 * - auth.service.spec.ts: Testa a LÓGICA (service)
 * - auth.controller.spec.ts: Testa os ENDPOINTS (controller) + decoradores
 *
 * DICA: Rode com:
 * npm test -- auth.controller.spec.ts --watch
 */

import { Test, TestingModule } from '@nestjs/testing';
import { HttpStatus } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { AuthResponseDto } from './dto/auth-response.dto';
import { Usuario } from '@modules/usuarios/entities/usuario.entity';
import { UserRole } from '@common/enums/user-role.enum';

describe('AuthController', () => {
  let controller: AuthController;
  let authService: jest.Mocked<AuthService>;

  /**
   * Mock de um usuario para usar nos testes
   */
  const mockUsuario = {
    id: '123e4567-e89b-12d3-a456-426614174000',
    email: 'test@example.com',
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
    // Não incluir senha nos retornos (por segurança)
  } as unknown as Usuario;

  /**
   * Mock da resposta de autenticação (com tokens)
   */
  const mockAuthResponse: AuthResponseDto = {
    access_token: 'access-token-123',
    refresh_token: 'refresh-token-456',
    user: mockUsuario,
  };

  /**
   * SETUP: Criar módulo de teste
   *
   * Aqui mockamos APENAS o AuthService
   * O controller será testado de verdade
   */
  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          // Mock do AuthService
          provide: AuthService,
          useValue: {
            register: jest.fn(),
            login: jest.fn(),
            refreshToken: jest.fn(),
            logout: jest.fn(),
            validateUser: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    authService = module.get(AuthService) as jest.Mocked<AuthService>;
  });

  // ============================================================
  // TESTE 1: POST /auth/register - Sucesso
  // ============================================================
  describe('register', () => {
    it('deve registrar novo usuário e retornar tokens', async () => {
      /**
       * ARRANGE
       */
      const registerDto: RegisterDto = {
        email: 'newuser@example.com',
        senha: 'senha123',
        nome: 'Novo Usuário',
      };

      // Mock: AuthService retorna tokens válidos
      authService.register.mockResolvedValue(mockAuthResponse);

      /**
       * ACT
       * Chama o controller (como se fosse uma requisição HTTP)
       */
      const result = await controller.register(registerDto);

      /**
       * ASSERT
       */
      expect(result).toEqual(mockAuthResponse);
      expect(result.access_token).toBeDefined();
      expect(result.refresh_token).toBeDefined();
      expect(result.user).toBeDefined();

      // Verifica se authService foi chamado com os parâmetros corretos
      expect(authService.register).toHaveBeenCalledWith(registerDto);
      expect(authService.register).toHaveBeenCalledTimes(1);
    });

    /**
     * CONTINUE: Crie este teste!
     *
     * TODO: Teste REGISTER COM EMAIL JÁ EXISTENTE
     * - authService.register deve lançar ConflictException
     * - Controller deve propagar o erro
     * - Expect: error.status === 409 (Conflict)
     *
     * TEMPLATE:
     *
     * it('deve retornar 409 se email já existe', async () => {
     *   const registerDto: RegisterDto = { ... };
     *
     *   // Mock: service lança ConflictException
     *   authService.register.mockRejectedValue(
     *     new ConflictException('Email já cadastrado')
     *   );
     *
     *   // ACT & ASSERT
     *   await expect(
     *     controller.register(registerDto)
     *   ).rejects.toThrow(ConflictException);
     * });
     */

    /**
     * CONTINUE: Crie este teste!
     *
     * TODO: Teste REGISTER COM DADOS INVÁLIDOS
     * - Email vazio, senha muito curta, nome vazio
     * - Isso é testado na VALIDAÇÃO (pipes do NestJS)
     * - Dica: Você pode testar a DTO diretamente também
     */
  });

  // ============================================================
  // TESTE 2: POST /auth/login - Sucesso
  // ============================================================
  describe('login', () => {
    it('deve fazer login com email e senha válidos', async () => {
      /**
       * ARRANGE
       */
      const loginDto: LoginDto = {
        email: 'test@example.com',
        senha: 'senha123',
      };

      // Mock: AuthService retorna tokens
      authService.login.mockResolvedValue(mockAuthResponse);

      /**
       * ACT
       */
      const result = await controller.login(loginDto);

      /**
       * ASSERT
       */
      expect(result).toEqual(mockAuthResponse);
      expect(result.access_token).toBe('access-token-123');

      // Verifica chamada ao service
      expect(authService.login).toHaveBeenCalledWith(loginDto);
    });

    /**
     * CONTINUE: Crie este teste!
     *
     * TODO: Teste LOGIN COM CREDENCIAIS INVÁLIDAS
     * - authService.login lança UnauthorizedException
     * - Controller propaga o erro
     * - Expect: error.status === 401 (Unauthorized)
     */

    /**
     * CONTINUE: Crie este teste!
     *
     * TODO: Teste LOGIN COM EMAIL NÃO ENCONTRADO
     * - Mesmo resultado que password incorreta por segurança
     * - UnauthorizedException com "Email ou senha inválidos"
     */
  });

  // ============================================================
  // TESTE 3: POST /auth/refresh - Renovar Token
  // ============================================================
  describe('refresh', () => {
    it('deve renovar access token com refresh token válido', async () => {
      /**
       * ARRANGE
       */
      const refreshTokenDto = {
        refresh_token: 'valid-refresh-token',
      };

      // Mock: AuthService renova tokens
      authService.refreshToken.mockResolvedValue(mockAuthResponse);

      /**
       * ACT
       * Note: O controller extrai o token do DTO
       */
      const result = await controller.refresh(refreshTokenDto);

      /**
       * ASSERT
       */
      expect(result).toEqual(mockAuthResponse);
      expect(result.access_token).toBeDefined();

      // Verifica que authService foi chamado com o token correto
      expect(authService.refreshToken).toHaveBeenCalledWith(
        refreshTokenDto.refresh_token,
      );
    });

    /**
     * CONTINUE: Crie este teste!
     *
     * TODO: Teste REFRESH COM TOKEN INVÁLIDO
     * - authService.refreshToken lança UnauthorizedException
     * - Expect: error.status === 401
     */

    /**
     * CONTINUE: Crie este teste!
     *
     * TODO: Teste REFRESH COM TOKEN EXPIRADO
     * - Mesmo erro que token inválido
     * - Message: 'Refresh token inválido ou expirado'
     */
  });

  // ============================================================
  // TESTE 4: POST /auth/logout - Fazer Logout
  // ============================================================
  describe('logout', () => {
    it('deve fazer logout removendo refresh token', async () => {
      /**
       * ARRANGE
       * Este endpoint é protegido (precisa autenticação)
       * Então passamos um usuário autenticado
       */
      const authenticatedUser = mockUsuario;

      // Mock: logout não retorna nada (void)
      authService.logout.mockResolvedValue(undefined);

      /**
       * ACT
       * O @CurrentUser() injeta o usuário automaticamente
       * No teste, passamos manualmente
       */
      await controller.logout(authenticatedUser);

      /**
       * ASSERT
       */
      expect(authService.logout).toHaveBeenCalledWith(authenticatedUser.id);
      expect(authService.logout).toHaveBeenCalledTimes(1);
    });

    /**
     * CONTINUE: Crie este teste!
     *
     * TODO: Teste LOGOUT COM USUÁRIO NÃO AUTENTICADO
     * - Este teste é mais em nível de integração (e2e)
     * - Guard @UseGuards(JwtAuthGuard) bloqueia antes de chegar ao controller
     * - Mas você pode mockar o guard se necessário
     */
  });

  // ============================================================
  // TESTE 5: GET /auth/me - Obter Dados do Usuário
  // ============================================================
  describe('getProfile', () => {
    it('deve retornar dados do usuário autenticado', async () => {
      /**
       * ARRANGE
       * Este endpoint retorna o próprio usuário que fez a requisição
       * @CurrentUser() injeta o usuário automaticamente
       */
      const authenticatedUser = mockUsuario;

      /**
       * ACT
       * Chama o método do controller passando o usuário
       */
      const result = await controller.getProfile(authenticatedUser);

      /**
       * ASSERT
       */
      expect(result).toEqual(authenticatedUser);
      expect(result.id).toBe(mockUsuario.id);
      expect(result.email).toBe(mockUsuario.email);

      // Nota: Este endpoint NÃO chama authService
      // Apenas retorna o usuário do contexto
      // Então não fazemos expect com authService aqui
    });

    /**
     * CONTINUE: Crie este teste!
     *
     * TODO: Teste GET /auth/me SEM AUTENTICAÇÃO
     * - Este é um teste de INTEGRAÇÃO REAL (E2E)
     * - Guard @UseGuards(JwtAuthGuard) deve rejeitar
     * - Precisa fazer requisição HTTP real
     * - Veja: auth.e2e-spec.ts (em breve!)
     */
  });

  // ============================================================
  // DICAS PARA CONTINUAR
  // ============================================================
  /**
   * 1. TESTES DE CONTROLLER DEVEM:
   *    - Testar se o método certo é chamado no service
   *    - Testar se os parâmetros corretos são passados
   *    - Testar se o retorno é correto
   *    - NÃO testar a lógica interna (isso é service.spec.ts)
   *
   * 2. DIFERENÇA ENTRE SPECS:
   *    - *.spec.ts = Testes unitários (com mocks)
   *    - *.e2e-spec.ts = Testes de integração (sem mocks, com servidor real)
   *
   * 3. PRÓXIMOS PASSOS:
   *    - Escrever testes do produtos.controller
   *    - Escrever testes do receitas.service (algoritmo MOI)
   *    - Escrever testes e2e para fluxos completos
   *
   * 4. EXEMPLO DE TESTE E2E (em auth.e2e-spec.ts):
   *    - POST /auth/register com dados válidos
   *    - GET /auth/me com Bearer token
   *    - POST /auth/login com credenciais
   *    - POST /auth/refresh com refresh token
   *    - GET /auth/me sem token (deve retornar 401)
   */
});
