import { Controller, Get, Post, Patch, Delete, Query, Body, Param, UseInterceptors, HttpCode, HttpStatus, Logger, UseGuards } from '@nestjs/common';
import { Throttle, SkipThrottle } from '@nestjs/throttler';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { Roles } from '@common/decorators/roles.decorator';
import { RolesGuard } from '@common/guards/roles.guard';
import { UserRole } from '@common/enums/user-role.enum';
import { CacheInterceptor, CacheTTL } from '@nestjs/cache-manager';
import { AdminService } from '../services/admin.service';
import { ReceitaSeederService } from '../services/receita-seeder.service';
import { UsuariosService } from '../../usuarios/usuarios.service';
import { RecipeGeneratorService } from '../../receitas/services/recipe-generator.service';
import { ReceitaClassificacaoService } from '../../receitas/services/receita-classificacao.service';
import { RecipeCrawlerService } from '../../receitas/services/recipe-crawler.service';
import { RecipeExecutionService } from '../../receitas/services/recipe-execution.service';
import { ReceitaBancoService } from '../../receitas/services/receita-banco.service';
import { RecipeRagService } from '../../receitas/services/recipe-rag.service';
import { IngredientCleanerService } from '../../receitas/services/ingredient-cleaner.service';
import { InventarioService } from '../../inventario/inventario.service';
import { ComprasService } from '../../compras/compras.service';
import { ProductClassificationService } from '../../product-classification/services/product-classification.service';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Preferencia } from '../../usuarios/entities/preferencia.entity';
import { Produto } from '../../produtos/entities/produto.entity';
import { ListProductsQueryDto } from '../dto/list-products-query.dto';
import { ListProductsResponseDto } from '../dto/product-list.dto';
import { NotificacaoTriggersService } from '../../notificacoes/services/notificacao-triggers.service';
import { CreateUsuarioDto } from '../../usuarios/dto/create-usuario.dto';
import { UpdateUsuarioDto } from '../../usuarios/dto/update-usuario.dto';
import { Usuario } from '../../usuarios/entities/usuario.entity';
import { CronLogService } from '../services/cron-log.service';

@ApiTags('Admin')
@ApiBearerAuth()
@SkipThrottle()
@UseGuards(RolesGuard)
@Roles(UserRole.ADMIN)
@Controller('admin')
export class AdminController {
  private readonly logger = new Logger(AdminController.name);

  constructor(
    private readonly adminService: AdminService,
    private readonly receitaSeederService: ReceitaSeederService,
    private readonly usuariosService: UsuariosService,
    private readonly recipeGeneratorService: RecipeGeneratorService,
    private readonly receitaClassificacaoService: ReceitaClassificacaoService,
    private readonly recipeCrawlerService: RecipeCrawlerService,
    private readonly recipeExecutionService: RecipeExecutionService,
    private readonly receitaBancoService: ReceitaBancoService,
    private readonly inventarioService: InventarioService,
    private readonly comprasService: ComprasService,
    private readonly productClassificationService: ProductClassificationService,
    @InjectRepository(Preferencia)
    private readonly preferenciaRepo: Repository<Preferencia>,
    @InjectRepository(Produto)
    private readonly produtoRepo: Repository<Produto>,
    private readonly notificacaoTriggers: NotificacaoTriggersService,
    private readonly cronLogService: CronLogService,
    private readonly recipeRagService: RecipeRagService,
    private readonly ingredientCleanerService: IngredientCleanerService,
  ) {}

  @Get('produtos')
  @ApiOperation({
    summary: 'Listar produtos com filtros e paginação (Admin)',
    description:
      'Retorna lista de produtos com informações de categoria e marca. Suporta busca, filtros e paginação.',
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de produtos com informações paginadas',
    type: ListProductsResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Não autenticado' })
  async listProducts(
    @Query() query: ListProductsQueryDto,
  ): Promise<ListProductsResponseDto> {
    return this.adminService.listProducts(query);
  }

  @Get('produtos/categorias')
  @ApiOperation({ summary: 'Listar categorias disponíveis (Admin)' })
  async listCategorias() {
    return this.adminService.listCategorias();
  }

  @Get('produtos/stats')
  @ApiOperation({
    summary: 'Obter estatísticas de produtos (Admin)',
    description:
      'Retorna total de produtos, distribuição por categoria e marcas mais usadas',
  })
  @ApiResponse({
    status: 200,
    description: 'Estatísticas de produtos',
  })
  @ApiResponse({ status: 401, description: 'Não autenticado' })
  async getProductStats() {
    return this.adminService.getProductStats();
  }

  @Patch('produtos/:id/classificacao')
  @ApiOperation({ summary: 'Atualizar classificação de ingrediente de um produto (Admin)' })
  @HttpCode(HttpStatus.OK)
  async updateProdutoClassificacao(
    @Param('id') id: string,
    @Body() body: { ingrediente_receita: boolean },
  ) {
    return this.adminService.updateProdutoClassificacao(id, body.ingrediente_receita);
  }

  @Get('usuarios')
  @ApiOperation({
    summary: 'Listar usuários com filtros e paginação (Admin)',
    description:
      'Retorna lista de usuários com informações de perfil. Suporta busca, filtros por role e paginação.',
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de usuários com informações paginadas',
  })
  @ApiResponse({ status: 401, description: 'Não autenticado' })
  async listUsers(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 20,
    @Query('search') search?: string,
    @Query('role') role?: string,
  ) {
    return this.adminService.listUsers(page, limit, { search, role });
  }

  @Get('usuarios/stats')
  @ApiOperation({
    summary: 'Obter estatísticas de usuários (Admin)',
    description:
      'Retorna total de usuários, distribuição por role e usuários ativos',
  })
  @ApiResponse({
    status: 200,
    description: 'Estatísticas de usuários',
  })
  @ApiResponse({ status: 401, description: 'Não autenticado' })
  async getUserStats() {
    return this.adminService.getUserStats();
  }

  @Post('usuarios')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Criar novo usuário (Admin)',
    description: 'Cria um novo usuário no sistema com os dados fornecidos',
  })
  @ApiResponse({
    status: 201,
    description: 'Usuário criado com sucesso',
    type: Usuario,
  })
  @ApiResponse({ status: 401, description: 'Não autenticado' })
  @ApiResponse({ status: 409, description: 'Email já cadastrado' })
  async createUser(@Body() createUsuarioDto: CreateUsuarioDto): Promise<Usuario> {
    return this.usuariosService.create(createUsuarioDto);
  }

  @Patch('usuarios/:id')
  @ApiOperation({
    summary: 'Atualizar usuário (Admin)',
    description: 'Atualiza informações de um usuário existente',
  })
  @ApiResponse({
    status: 200,
    description: 'Usuário atualizado com sucesso',
    type: Usuario,
  })
  @ApiResponse({ status: 401, description: 'Não autenticado' })
  @ApiResponse({ status: 404, description: 'Usuário não encontrado' })
  async updateUser(
    @Param('id') id: string,
    @Body() updateUsuarioDto: UpdateUsuarioDto,
  ): Promise<Usuario> {
    return this.usuariosService.update(id, updateUsuarioDto);
  }

  @Patch('usuarios/:id/reset-senha')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Resetar senha de usuário — gera senha temporária (Admin)' })
  async resetarSenhaUsuario(@Param('id') id: string) {
    return this.adminService.resetarSenhaUsuario(id);
  }

  @Delete('usuarios/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Deletar usuário (Admin)',
    description: 'Remove um usuário do sistema',
  })
  @ApiResponse({
    status: 204,
    description: 'Usuário deletado com sucesso',
  })
  @ApiResponse({ status: 401, description: 'Não autenticado' })
  @ApiResponse({ status: 404, description: 'Usuário não encontrado' })
  async deleteUser(@Param('id') id: string): Promise<void> {
    return this.usuariosService.delete(id);
  }

  @Get('usuarios/:id/inventario')
  @ApiOperation({ summary: 'Despensa de um usuário (Admin) — todos os itens com flag ingrediente_receita' })
  async getUserInventario(@Param('id') id: string) {
    const todos = await this.inventarioService.findAll(id);
    // Admin vê tudo — inclui flag ingrediente_receita para diagnóstico
    return todos.map(item => ({
      ...item,
      _ingrediente_receita: item.produto?.ingrediente_receita,
    }));
  }

  @Post('usuarios/:id/reclassificar-despensa')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Reclassifica todos os produtos da despensa do usuário via IA (Admin)' })
  async reclassificarDespensaUsuario(@Param('id') id: string) {
    const itens = await this.inventarioService.findAll(id);

    // Mapa nome OCR bruto → produto_id
    // Usa apenas produto.nome (não nome_display) — manda o nome bruto pro Gemini
    // para sempre extrair o canonical_name correto e atualizar nome_display
    const nomeProdutoMap = new Map<string, string>(); // nome OCR → produto.id
    for (const item of itens) {
      if (!item.produto_id) continue;
      const nome = item.produto?.nome;
      if (nome) nomeProdutoMap.set(nome, item.produto_id);
    }

    const nomesUnicos = [...new Set(nomeProdutoMap.keys())];

    // Processa em chunks de 20 — evita timeout do Gemini com batches grandes
    const CHUNK_SIZE = 20;
    const chunks: string[][] = [];
    for (let i = 0; i < nomesUnicos.length; i += CHUNK_SIZE) {
      chunks.push(nomesUnicos.slice(i, i + CHUNK_SIZE));
    }

    let atualizados = 0;
    const detalhes: Array<{ nome: string; canonical: string | null; ingrediente_receita: boolean | null; confianca: number }> = [];

    for (const chunk of chunks) {
      const resultados = await this.productClassificationService.classificarEmBatch(chunk);
      for (const clf of resultados) {
        if (!clf.produto || clf.ingrediente_receita === null || clf.ingrediente_receita === undefined) continue;
        const produtoId = nomeProdutoMap.get(clf.produto);
        if (!produtoId) continue;
        const updates: Record<string, any> = { ingrediente_receita: clf.ingrediente_receita };
        // Retroalimenta nome_display com canonical_name (ex: "Alho A Granel Kg" → "alho")
        if (clf.canonical_name) updates.nome_display = clf.canonical_name;
        await this.produtoRepo.update(produtoId, updates);
        atualizados++;
        detalhes.push({ nome: clf.produto, canonical: clf.canonical_name || null, ingrediente_receita: clf.ingrediente_receita, confianca: clf.confidence });
      }
    }

    return {
      total_itens: itens.length,
      nomes_unicos: nomesUnicos.length,
      atualizados,
      resultados: detalhes,
    };
  }

  @Post('usuarios/:id/crawlear-receitas')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Dispara crawl de receitas baseado nos ingredientes da despensa do usuário (Admin)' })
  async crawlearReceitasUsuario(@Param('id') id: string) {
    const ingredientes = await this.inventarioService.ingredientesDisponiveis(id);
    if (ingredientes.length === 0) {
      return { ok: false, motivo: 'Despensa vazia ou sem ingredientes classificados', ingredientes: [] };
    }
    const resultado = await this.recipeCrawlerService.crawlearManual(ingredientes);
    return { ok: true, ingredientes_usados: resultado.ingredientes, total_salvas: resultado.totalSalvas };
  }

  @Get('usuarios/:id/compras')
  @ApiOperation({ summary: 'Compras de um usuário (Admin)' })
  async getUserCompras(
    @Param('id') id: string,
    @Query('limit') limit: number = 50,
  ) {
    return this.comprasService.findAll(id, limit);
  }

  @Get('usuarios/:id/receitas-executadas')
  @ApiOperation({ summary: 'Receitas executadas por um usuário (Admin)' })
  async getUserReceitasExecutadas(
    @Param('id') id: string,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 20,
  ) {
    return this.recipeExecutionService.listarExecucoes(id, page, limit);
  }

  @Get('usuarios/:id/receitas-disponiveis')
  @ApiOperation({ summary: 'Receitas disponíveis para um usuário com debug de cobertura (Admin)' })
  async getUserReceitasDisponiveis(@Param('id') id: string) {
    const [ingredientes, vencendo, pref] = await Promise.all([
      this.inventarioService.ingredientesDisponiveis(id),
      this.inventarioService.findExpiringSoon(id, 7),
      this.preferenciaRepo.findOne({ where: { usuario_id: id } }),
    ]);

    const modoAlimentar = pref?.modo_alimentar || 'normal';
    const resultado = await this.receitaBancoService.listarDisponiveisParaUsuario(ingredientes, 100);

    const contemTag = (r: any, ...tags: string[]) => {
      const tagsStr = String(r.receita.tags_dieta || '').toLowerCase();
      return tags.some((t) => tagsStr.includes(t));
    };

    let resultadoModo = resultado;
    if (modoAlimentar === 'vegetariano') {
      const filtrado = resultado.filter((r) => contemTag(r, 'vegetariano', 'vegano'));
      resultadoModo = filtrado.length >= 4 ? filtrado : resultado;
    } else if (modoAlimentar === 'vegano') {
      const filtrado = resultado.filter((r) => contemTag(r, 'vegano'));
      resultadoModo = filtrado.length >= 4 ? filtrado : resultado;
    } else if (modoAlimentar === 'fitness') {
      const filtrado = resultado.filter((r) => contemTag(r, 'fitness', 'fit', 'proteico', 'low-carb'));
      resultadoModo = filtrado.length >= 4 ? filtrado : resultado;
    }

    const nomesVencendo = vencendo
      .filter((inv) => inv.produto?.ingrediente_receita && !inv.esgotado)
      .map((inv) => ((inv.produto as any).nome_display || inv.produto?.nome || '').toLowerCase());

    return {
      resumo: {
        ingredientes_ativos: ingredientes.length,
        modo_alimentar: modoAlimentar,
        total_receitas: resultadoModo.length,
        disponiveis: resultadoModo.filter((r) => r.disponivel).length,
        com_protagonista: resultadoModo.filter((r) => !r.disponivel && r.temProtagonista).length,
        parciais: resultadoModo.filter((r) => !r.disponivel && !r.temProtagonista).length,
        ingredientes_vencendo: nomesVencendo,
      },
      ingredientes_despensa: ingredientes,
      receitas: resultadoModo.map((r) => ({
        id: r.receita.id,
        nome: r.receita.nome,
        categoria: r.receita.categoria_receita,
        tags_dieta: r.receita.tags_dieta,
        cobertura_pct: Math.round(r.cobertura * 100),
        disponivel: r.disponivel,
        tem_protagonista: r.temProtagonista,
        faltando: r.faltando,
        ingredientes_chave: r.receita.ingredientes_chave,
        vezes_executada: r.receita.vezes_executada,
        avaliacao_media: r.receita.avaliacao_media,
        usa_vencendo: nomesVencendo.filter((nome) =>
          (r.receita.ingredientes_chave || []).some((k: string) => k.includes(nome) || nome.includes(k)),
        ),
      })),
    };
  }

  @Get('receitas')
  @ApiOperation({
    summary: 'Listar receitas com filtros e moderação (Admin)',
    description:
      'Retorna lista de receitas com informações de moderação (denúncias, status). Suporta busca, filtros por dificuldade/categoria e paginação.',
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de receitas com informações de moderação',
  })
  @ApiResponse({ status: 401, description: 'Não autenticado' })
  async listRecipes(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 20,
    @Query('search') search?: string,
    @Query('dificuldade') dificuldade?: string,
    @Query('categoria') categoria?: string,
  ) {
    return this.adminService.listRecipes(page, limit, {
      search,
      dificuldade,
      categoria,
    });
  }

  @Patch('receitas/:id/moderacao')
  @ApiOperation({
    summary: 'Atualizar status de moderação de receita (Admin)',
    description:
      'Altera o status de moderação de uma receita (ok, em_revisao, arquivado)',
  })
  @ApiResponse({
    status: 200,
    description: 'Status de moderação atualizado com sucesso',
  })
  @ApiResponse({ status: 401, description: 'Não autenticado' })
  @ApiResponse({ status: 404, description: 'Receita não encontrada' })
  async atualizarModeracaoReceita(
    @Param('id') id: string,
    @Body('status') status: 'ok' | 'em_revisao' | 'arquivado',
  ) {
    return this.adminService.atualizarModeracaoReceita(id, status);
  }

  @Patch('receitas/:id')
  async atualizarReceita(
    @Param('id') id: string,
    @Body() data: { imagem_url?: string },
  ) {
    return this.adminService.atualizarReceita(id, data);
  }

  @Get('dashboard/stats')
  @UseInterceptors(CacheInterceptor)
  @CacheTTL(180) // 3 minutos
  @ApiOperation({
    summary: 'Obter estatísticas gerais do dashboard (Admin)',
    description:
      'Retorna estatísticas consolidadas: usuários, produtos, receitas, compras',
  })
  @ApiResponse({
    status: 200,
    description: 'Estatísticas gerais do dashboard',
  })
  @ApiResponse({ status: 401, description: 'Não autenticado' })
  async getDashboardStats() {
    return this.adminService.getDashboardStats();
  }

  @Get('compras')
  @ApiOperation({ summary: 'Listar todas as compras (Admin)' })
  async listCompras(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 20,
    @Query('search') search?: string,
  ) {
    return this.adminService.listCompras(page, limit, search);
  }

  @Get('compras/:id')
  @ApiOperation({ summary: 'Detalhes de uma compra com todos os itens (Admin)' })
  async getCompra(@Param('id') id: string) {
    return this.adminService.getCompraById(id);
  }

  @Post('receitas/seed')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Seed do banco de receitas via Gemini AI' })
  async seedReceitas(
    @Body('tema') tema?: string,
    @Body('receitasPorTema') receitasPorTema?: number,
  ) {
    return this.receitaSeederService.seedarReceitas({ tema, receitasPorTema });
  }

  @Post('receitas/reclassificar')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Reclassifica tags_dieta de todas as receitas pelo conteúdo dos ingredientes' })
  async reclassificarReceitas() {
    return this.receitaClassificacaoService.reclassificarTodas();
  }

  @Post('receitas/popular-banco')
  @Throttle({ default: { limit: 2, ttl: 3600000 } })
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Popula banco com receitas do TudoGostoso para todos os modos alimentares' })
  async popularBanco(@Body('modos') modos?: string[]) {
    const todosOsModos = ['normal', 'fitness', 'vegetariano', 'vegano'] as const;
    const modosAlvo = (modos?.length ? modos : todosOsModos) as Array<'normal' | 'fitness' | 'vegetariano' | 'vegano'>;

    const resultado: Record<string, number> = {};
    for (const modo of modosAlvo) {
      try {
        resultado[modo] = await this.recipeGeneratorService.popularModoAlimentar(modo);
      } catch (err: any) {
        resultado[modo] = 0;
      }
    }

    const total = Object.values(resultado).reduce((a, b) => a + b, 0);
    return { ok: true, total, porModo: resultado };
  }

  @Post('receitas/popular-banco/:modo')
  @Throttle({ default: { limit: 2, ttl: 3600000 } })
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Popula banco com receitas de um modo alimentar específico' })
  async popularBancoModo(@Param('modo') modo: string) {
    const modosValidos = ['normal', 'fitness', 'vegetariano', 'vegano'];
    if (!modosValidos.includes(modo)) {
      return { ok: false, erro: `Modo inválido. Use: ${modosValidos.join(', ')}` };
    }
    const total = await this.recipeGeneratorService.popularModoAlimentar(modo as any);
    return { ok: true, modo, total };
  }

  @Post('receitas/rag/indexar')
  @ApiOperation({ summary: 'Gera embeddings das receitas sem índice vetorial (RAG)' })
  async indexarReceitas(@Body() body: { limite?: number }) {
    const indexadas = await this.recipeRagService.indexarReceitas(body.limite ?? 50);
    const status = await this.recipeRagService.totalIndexadas();
    return { ok: true, indexadas, ...status };
  }

  @Get('receitas/rag/status')
  @ApiOperation({ summary: 'Status do índice vetorial RAG' })
  async ragStatus() {
    return this.recipeRagService.totalIndexadas();
  }

  @Post('receitas/rag/testar')
  @ApiOperation({ summary: 'Testar busca RAG com ingredientes' })
  async testarRag(@Body() body: { ingredientes: string[]; modo_alimentar?: string; tipo_refeicao?: string }) {
    const similares = await this.recipeRagService.buscarSimilares(body.ingredientes, 5);
    const resultado = await this.recipeRagService.gerarComRAG(body.ingredientes, body.modo_alimentar, body.tipo_refeicao);
    return {
      similares_encontrados: similares.map((r: any) => ({
        nome: r.nome,
        similaridade: r.similaridade ? `${(r.similaridade * 100).toFixed(1)}%` : null,
      })),
      receita_gerada: resultado,
    };
  }

  @Get('receitas/ingredientes/status')
  @ApiOperation({ summary: 'Status da qualidade dos ingredientes_chave no banco' })
  async statusIngredientes() {
    return this.ingredientCleanerService.statusLimpeza();
  }

  @Post('receitas/ingredientes/limpar')
  @ApiOperation({ summary: 'Limpa ingredientes_chave sujos (fragmentos, "X e Y", instruções)' })
  async limparIngredientes(@Body() body: { limite?: number; usar_ia?: boolean }) {
    return this.ingredientCleanerService.limparBanco(body.limite ?? 30, body.usar_ia ?? true);
  }

  @Post('receitas/gerar-ia')
  @HttpCode(HttpStatus.ACCEPTED)
  @ApiOperation({ summary: 'Gera receitas originais via Gemini IA em background — retorna imediato, notifica quando pronto' })
  async gerarReceitasIA(@Body('modo') modo?: string) {
    const totalTemas = modo ? 10 : 55; // estimativa por modo ou total

    // Fire and forget — não await
    setImmediate(() => this.executarGeracaoIA(modo).catch(() => {}));

    return { iniciado: true, total_temas: totalTemas, mensagem: 'Geração iniciada em background. Você receberá uma notificação quando concluir.' };
  }

  private async executarGeracaoIA(modo?: string) {
    const inicio = Date.now();
    try {
      const resultado = await this.receitaSeederService.seedarReceitas({ tema: modo });
      const tempoMs = Date.now() - inicio;
      await this.notificacaoTriggers.processamentoConcluido(
        'Geração de Receitas IA',
        `${resultado.salvas} receitas geradas, ${resultado.erros} erros`,
        tempoMs,
      );
    } catch (err: any) {
      this.logger.error(`Erro na geração IA: ${err.message}`);
      await this.notificacaoTriggers.erroSistema(
        'Geração de Receitas IA',
        err.message || 'Erro desconhecido na geração',
      ).catch(() => {});
    }
  }

  @Post('receitas/importar-url')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Importa uma receita de uma URL do TudoGostoso diretamente para o banco' })
  async importarReceitaPorUrl(@Body() body: { url: string }) {
    if (!body.url) return { ok: false, erro: 'URL é obrigatória' };
    try {
      const resultado = await this.recipeGeneratorService.importarReceitaPorUrl(body.url);
      return { ok: true, ...resultado };
    } catch (err: any) {
      return { ok: false, erro: err.message };
    }
  }

  @Get('produtos/fila-revisao')
  @ApiOperation({ summary: 'Lista produtos da knowledge base que precisam de revisão (Admin)' })
  async getFilaRevisao(@Query('limit') limit?: number) {
    return this.adminService.getFilaRevisao(limit ? Number(limit) : 50);
  }

  @Patch('produtos/knowledge-base/:id')
  @ApiOperation({ summary: 'Corrige classificação de um produto na knowledge base (Admin)' })
  async corrigirClassificacao(
    @Param('id') id: string,
    @Body() body: { ingrediente_receita?: boolean; canonical_name?: string },
  ) {
    return this.adminService.corrigirClassificacao(id, body);
  }

  @Get('data/counts')
  @ApiOperation({ summary: 'Contagem de registros por entidade (gerenciamento de dados)' })
  async getDataCounts() {
    return this.adminService.getDataCounts();
  }

  @Delete('data/:entidade')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Limpar todos os registros de uma entidade' })
  @ApiResponse({ status: 200, description: 'Registros deletados' })
  async limparDados(@Param('entidade') entidade: string) {
    return this.adminService.limparDados(entidade);
  }

  // ── Knowledge Base cleanup ──────────────────────────────────────────────────

  @Post('knowledge-base/limpar-sem-canonical')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Reseta canonical_ingredient nulo na KB (Admin)',
    description: 'Remove canonical_ingredient de entradas sem ele OU de todas as entradas (modo="todas"). Na próxima reclassificação o Gemini re-gera com o prompt melhorado.',
  })
  async limparKbSemCanonical(@Body('modo') modo?: 'sem_canonical' | 'todas') {
    const resetarTodas = modo === 'todas';
    const query = resetarTodas
      ? `UPDATE product_knowledge_base SET canonical_ingredient = NULL`
      : `UPDATE product_knowledge_base SET canonical_ingredient = NULL WHERE canonical_ingredient IS NULL OR canonical_ingredient = ''`;

    // usa dataSource via produtoRepo
    const result = await this.produtoRepo.manager.query(
      resetarTodas
        ? `UPDATE product_knowledge_base SET canonical_ingredient = NULL`
        : `UPDATE product_knowledge_base SET canonical_ingredient = NULL WHERE canonical_ingredient IS NULL OR canonical_ingredient = ''`
    );
    const affected = result?.[1] ?? '?';
    return {
      ok: true,
      modo: resetarTodas ? 'todas as entradas' : 'só sem canonical',
      linhas_afetadas: affected,
      proxima_acao: 'Use "Atualizar Despensa" por usuário para re-classificar com o novo prompt',
    };
  }

  @Get('knowledge-base/stats')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Estatísticas da Knowledge Base (Admin)' })
  async kbStats() {
    const [total] = await this.produtoRepo.manager.query(`SELECT COUNT(*) as total FROM product_knowledge_base`);
    const [semCanonical] = await this.produtoRepo.manager.query(`SELECT COUNT(*) as total FROM product_knowledge_base WHERE canonical_ingredient IS NULL OR canonical_ingredient = ''`);
    const [comCanonical] = await this.produtoRepo.manager.query(`SELECT COUNT(*) as total FROM product_knowledge_base WHERE canonical_ingredient IS NOT NULL AND canonical_ingredient != ''`);
    const exemplos = await this.produtoRepo.manager.query(
      `SELECT product_name, canonical_ingredient, ingrediente_receita, confidence_score FROM product_knowledge_base WHERE canonical_ingredient IS NOT NULL ORDER BY confidence_score DESC LIMIT 10`
    );
    return {
      total: Number(total.total),
      com_canonical: Number(comCanonical.total),
      sem_canonical: Number(semCanonical.total),
      exemplos_canonicos: exemplos,
    };
  }

  @Post('receitas/crawlear')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Crawl proativo de receitas (Admin)',
    description: 'Busca receitas em TudoGostoso + Receiteria para ingredientes com poucas receitas no banco. Sem body: usa detecção automática. Com body {ingredientes: ["bisteca", "frango"]}: crawlea específicos.',
  })
  async crawlearReceitas(@Body('ingredientes') ingredientes?: string[]) {
    const resultado = await this.recipeCrawlerService.crawlearManual(ingredientes);
    return { ok: true, ...resultado };
  }

  @Get('cron-logs')
  @ApiOperation({ summary: 'Histórico de execuções dos jobs agendados' })
  async cronLogs(@Query('limit') limit?: string) {
    return this.cronLogService.listar(limit ? +limit : 100);
  }
}
