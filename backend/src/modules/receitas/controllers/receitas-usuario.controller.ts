import { Controller, Get, Post, Delete, Param, Body, UseGuards, ForbiddenException, NotFoundException, Logger } from '@nestjs/common';
import { Receita } from '../entities/receita.entity';
import { ReceitaFavorita } from '../entities/receita-favorita.entity';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { CurrentUser } from '@common/decorators/current-user.decorator';
import { Usuario } from '@modules/usuarios/entities/usuario.entity';
import { Preferencia } from '@modules/usuarios/entities/preferencia.entity';
import { ReceitaBancoService } from '../services/receita-banco.service';
import { RecipeGeneratorService } from '../services/recipe-generator.service';
import { RecipeSearchService } from '../services/recipe-search.service';
import { AprendizadoService } from '../services/aprendizado.service';
import { InventarioService } from '@modules/inventario/inventario.service';
import { ListaService } from '@modules/listas/services/lista.service';
import { ReceitaExecutada } from '../entities/receita-executada.entity';
import { ReceitaIngrediente } from '../entities/receita-ingrediente.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

@ApiTags('Receitas')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('receitas')
export class ReceitasUsuarioController {
  private readonly logger = new Logger(ReceitasUsuarioController.name);

  constructor(
    private readonly receitaBancoService: ReceitaBancoService,
    private readonly inventarioService: InventarioService,
    private readonly recipeGeneratorService: RecipeGeneratorService,
    private readonly recipeSearchService: RecipeSearchService,
    private readonly listaService: ListaService,
    private readonly aprendizadoService: AprendizadoService,
    @InjectRepository(ReceitaExecutada)
    private readonly receitaExecutadaRepo: Repository<ReceitaExecutada>,
    @InjectRepository(ReceitaFavorita)
    private readonly favoritaRepo: Repository<ReceitaFavorita>,
    @InjectRepository(Receita)
    private readonly receitaRepo: Repository<Receita>,
    @InjectRepository(ReceitaIngrediente)
    private readonly ingredienteRepo: Repository<ReceitaIngrediente>,
    @InjectRepository(Preferencia)
    private readonly preferenciaRepo: Repository<Preferencia>,
  ) {}

  /**
   * Lista todas as receitas do banco com cobertura calculada para o inventário do usuário.
   * Inclui receitas disponíveis (≥70%) e parciais (40-69%) — parciais aparecem em cinza no mobile.
   */
  @Get('disponiveis')
  @ApiOperation({ summary: 'Lista receitas disponíveis baseado no inventário do usuário' })
  async listarDisponiveis(@CurrentUser() user: Usuario) {
    const [ingredientes, vencendo, pref] = await Promise.all([
      this.inventarioService.ingredientesDisponiveis(user.id),
      this.inventarioService.findExpiringSoon(user.id, 7),
      this.preferenciaRepo.findOne({ where: { usuario_id: user.id } }),
    ]);

    const modoAlimentar = pref?.modo_alimentar || 'normal';
    const resultado = await this.receitaBancoService.listarDisponiveisParaUsuario(ingredientes);

    // Banco com poucas receitas → gerar via Haiku em background + buscar previews web em paralelo
    let previewsWeb: Array<{ titulo: string; url: string; site: string }> = [];
    if (resultado.length < 8 && ingredientes.length > 0) {
      this.logger.log(`Banco tem ${resultado.length} receitas — gerando IA + buscando previews web`);
      const [, previews] = await Promise.allSettled([
        this.recipeGeneratorService.gerarReceitas(ingredientes).catch((err) =>
          this.logger.error(`Erro na geração background: ${err.message}`),
        ),
        this.recipeSearchService.buscarPreviewsNaWeb(ingredientes, 6),
      ]);
      if (previews.status === 'fulfilled') previewsWeb = previews.value ?? [];
    }

    // Aplica filtro/sort baseado no modo alimentar do usuário
    const contemTag = (r: any, ...tags: string[]) => {
      const tagsStr = String(r.receita.tags_dieta || '').toLowerCase();
      return tags.some((t) => tagsStr.includes(t));
    };

    let resultadoModo = resultado;
    if (modoAlimentar === 'vegetariano') {
      const filtrado = resultado.filter((r) => contemTag(r, 'vegetariano', 'vegano'));
      resultadoModo = filtrado.length >= 4 ? filtrado : resultado;
      if (filtrado.length < 8) {
        this.recipeGeneratorService.popularModoAlimentar('vegetariano').catch(() => {});
      }
    } else if (modoAlimentar === 'vegano') {
      const filtrado = resultado.filter((r) => contemTag(r, 'vegano'));
      resultadoModo = filtrado.length >= 4 ? filtrado : resultado;
      if (filtrado.length < 8) {
        this.recipeGeneratorService.popularModoAlimentar('vegano').catch(() => {});
      }
    } else if (modoAlimentar === 'fitness') {
      const filtrado = resultado.filter((r) => contemTag(r, 'fitness', 'fit', 'proteico', 'low-carb'));
      resultadoModo = filtrado.length >= 4 ? filtrado : resultado;
      if (filtrado.length < 8) {
        this.recipeGeneratorService.popularModoAlimentar('fitness').catch(() => {});
      }
    }

    // Nomes normalizados dos ingredientes vencendo (só food items, não esgotados)
    const nomesVencendo = vencendo
      .filter((inv) => inv.produto?.ingrediente_receita && !inv.esgotado)
      .map((inv) => ((inv.produto as any).nome_display || inv.produto.nome).toLowerCase());

    // Marca cada receita com os ingredientes vencendo que ela usa
    const receitasComVencimento = resultadoModo.map((r) => {
      const chaves = (r.receita.ingredientes_chave || []).map((k: string) => k.toLowerCase());
      const usaVencendo = nomesVencendo.filter((nome) =>
        chaves.some((k) => k.includes(nome) || nome.includes(k)),
      );
      return {
        ...this.receitaBancoService.entidadeParaFormato(r.receita),
        id: r.receita.id,
        cobertura: Math.round(r.cobertura * 100),
        disponivel: r.disponivel,
        tem_protagonista: r.temProtagonista,
        faltando: r.faltando,
        vezes_executada: r.receita.vezes_executada,
        avaliacao_media: r.receita.avaliacao_media,
        ingredientes_produtos: this.receitaBancoService.ingredientesParaSheet(r.receita),
        usa_vencendo: usaVencendo,
        tags_dieta: r.receita.tags_dieta,
        url_fonte: r.receita.url_fonte ?? null,
        autor_id: r.receita.autor_id ?? null,
      };
    });

    return {
      total: resultadoModo.length,
      disponiveis: resultadoModo.filter((r) => r.disponivel).length,
      parciais: resultadoModo.filter((r) => !r.disponivel).length,
      ingredientes_ativos: ingredientes.length,
      ingredientes_vencendo: nomesVencendo,
      modo_alimentar: modoAlimentar,
      receitas: receitasComVencimento,
      previews_web: previewsWeb,
    };
  }

  /**
   * Retorna a receita mais executada hoje (slide "Mais feita hoje" no hero carrossel).
   * Se nenhuma foi executada hoje, retorna a mais executada globalmente.
   */
  /**
   * Receitas que o usuário "quase pode fazer" — cobertura 40-74%.
   * Retorna ordenado por "menos ingredientes faltando".
   * Diferencial CookMe: "Você está a 2 ingredientes do Frango Assado"
   */
  @Get('quase-possiveis')
  @ApiOperation({ summary: 'Receitas que o usuário quase pode fazer — faltam poucos ingredientes' })
  async quasePossiveis(@CurrentUser() user: Usuario) {
    const ingredientes = await this.inventarioService.ingredientesDisponiveis(user.id);
    if (ingredientes.length === 0) return { receitas: [], total: 0 };

    const todas = await this.receitaBancoService.listarDisponiveisParaUsuario(ingredientes, 100);

    // Filtra: cobertura entre 40% e 74% (não disponíveis ainda, mas próximas)
    const quase = todas
      .filter((r) => !r.disponivel && r.cobertura >= 0.40)
      .sort((a, b) => a.faltando.length - b.faltando.length || b.cobertura - a.cobertura)
      .slice(0, 20);

    return {
      total: quase.length,
      ingredientes_disponiveis: ingredientes.length,
      receitas: quase.map((r) => ({
        id: r.receita.id,
        nome: r.receita.nome,
        descricao: r.receita.descricao,
        imagem_url: r.receita.imagem_url,
        categoria_receita: (r.receita as any).categoria_receita,
        tags_dieta: r.receita.tags_dieta,
        tempo_preparo: r.receita.tempo_preparo,
        cobertura_pct: Math.round(r.cobertura * 100),
        faltando: r.faltando,
        n_faltando: r.faltando.length,
        tem_protagonista: r.temProtagonista,
        // Mensagem motivacional
        mensagem: r.temProtagonista
          ? (r.faltando.length === 1 ? `Falta só 1 ingrediente!` : `Faltam ${r.faltando.length} ingredientes`)
          : `Inspire-se: compre os ingredientes e cozinhe`,
      })),
    };
  }

  /**
   * Adiciona os ingredientes faltantes de uma receita à lista de compras ativa do usuário.
   * Feature diferencial CookMe: fecha o ciclo despensa → receita → compra.
   */
  @Post(':id/comprar-faltando')
  @ApiOperation({ summary: 'Adiciona ingredientes faltantes de uma receita à lista de compras' })
  async comprarFaltando(
    @CurrentUser() user: Usuario,
    @Param('id') receitaId: string,
    @Body('lista_id') listaId?: string,
  ) {
    const ingredientes = await this.inventarioService.ingredientesDisponiveis(user.id);
    const resultado = await this.receitaBancoService.listarDisponiveisParaUsuario(ingredientes, 100);
    const item = resultado.find((r) => r.receita.id === receitaId);

    if (!item) return { ok: false, motivo: 'Receita não encontrada ou já disponível' };
    if (item.faltando.length === 0) return { ok: false, motivo: 'Nenhum ingrediente faltando' };

    // Busca ou cria lista ativa
    let lista;
    if (listaId) {
      lista = await this.listaService.obterLista(listaId, user.id);
    } else {
      const listas = await this.listaService.listarListasUsuario(user.id);
      lista = listas.find((l) => (l as any).status === 'ativa') || listas[0];
      if (!lista) {
        lista = await this.listaService.criarLista(user.id, {
          titulo: `Ingredientes para ${item.receita.nome}`,
        } as any);
      }
    }

    // Adiciona cada ingrediente faltando
    const adicionados: string[] = [];
    for (const ingrediente of item.faltando) {
      try {
        await this.listaService.adicionarItem(lista.id, user.id, {
          nome: ingrediente,
          quantidade: 1,
          unidade: 'un',
          observacao: `Para: ${item.receita.nome}`,
        } as any);
        adicionados.push(ingrediente);
      } catch {
        // Item já na lista — ignora
      }
    }

    return {
      ok: true,
      lista_id: lista.id,
      lista_titulo: lista.titulo,
      receita: item.receita.nome,
      ingredientes_adicionados: adicionados,
      total: adicionados.length,
    };
  }

  @Get('mais-feita-hoje')
  @ApiOperation({ summary: 'Receita mais feita hoje (ou mais popular globalmente), filtrada por modo alimentar' })
  async maisFeitaHoje(@CurrentUser() user: Usuario) {
    const pref = await this.preferenciaRepo.findOne({ where: { usuario_id: user.id } });
    const modo = pref?.modo_alimentar || 'normal';

    const tagsFiltro: string[] = modo === 'vegano'
      ? ['vegano']
      : modo === 'vegetariano'
      ? ['vegetariano', 'vegano']
      : modo === 'fitness'
      ? ['fitness']
      : [];

    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);

    // Busca candidata do dia (mais feita hoje)
    const maisHoje = await this.receitaExecutadaRepo
      .createQueryBuilder('re')
      .select('re.receita_id', 'receita_id')
      .addSelect('COUNT(*)', 'total')
      .where('re.criado_em >= :hoje', { hoje })
      .groupBy('re.receita_id')
      .orderBy('total', 'DESC')
      .limit(10)
      .getRawMany();

    let receita: Receita | null = null;

    if (maisHoje.length > 0 && tagsFiltro.length > 0) {
      // Dentre as mais feitas hoje, achar a primeira que respeita o modo
      for (const row of maisHoje) {
        const candidata = await this.receitaBancoService.buscarPorId(row.receita_id);
        if (!candidata) continue;
        const tags = String(candidata.tags_dieta || '').toLowerCase();
        if (tagsFiltro.some(t => tags.includes(t))) { receita = candidata; break; }
      }
    } else if (maisHoje.length > 0) {
      receita = await this.receitaBancoService.buscarPorId(maisHoje[0].receita_id);
    }

    if (!receita) {
      receita = await this.receitaBancoService.maisExecutada(tagsFiltro);
    }

    if (!receita) return { receita: null };

    return {
      receita: {
        ...this.receitaBancoService.entidadeParaFormato(receita),
        id: receita.id,
        vezes_executada: receita.vezes_executada,
      },
    };
  }

  // ── Favoritos ────────────────────────────────────────────────────────────────

  @Get('favoritas')
  @ApiOperation({ summary: 'Lista receitas favoritas do usuário' })
  async listarFavoritas(@CurrentUser() user: Usuario) {
    const favoritas = await this.favoritaRepo.find({
      where: { usuario_id: user.id },
      relations: ['receita'],
      order: { receita: { nome: 'ASC' } },
    });
    return favoritas.map((f) => ({
      ...this.receitaBancoService.entidadeParaFormato(f.receita),
      id: f.receita.id,
      vezes_executada: f.receita.vezes_executada,
      avaliacao_media: f.receita.avaliacao_media,
    }));
  }

  // ── Minhas receitas (enviadas pelo usuário) ───────────────────────────────

  @Get('minhas')
  @ApiOperation({ summary: 'Lista receitas enviadas pelo usuário' })
  async minhasReceitas(@CurrentUser() user: Usuario) {
    const receitas = await this.receitaRepo.find({
      where: { autor_id: user.id },
      order: { nome: 'ASC' },
    });
    return receitas.map((r) => ({
      ...this.receitaBancoService.entidadeParaFormato(r),
      id: r.id,
      vezes_executada: r.vezes_executada,
      avaliacao_media: r.avaliacao_media,
    }));
  }

  @Post('minhas')
  @ApiOperation({ summary: 'Cria nova receita enviada pelo usuário (entra em revisão)' })
  async criarMinhaReceita(
    @CurrentUser() user: Usuario,
    @Body() body: {
      titulo: string;
      descricao?: string;
      tempo_preparo?: number;
      dificuldade?: string;
      rendimento_porcoes?: number;
      categoria_receita?: string;
      modo_preparo: string;
      ingredientes: Array<{ nome: string; quantidade?: string; unidade?: string; a_gosto?: boolean }>;
    },
  ) {
    const receita = this.receitaRepo.create({
      nome: body.titulo,
      descricao: body.descricao,
      tempo_preparo: body.tempo_preparo,
      dificuldade: (body.dificuldade || 'media') as any,
      rendimento_porcoes: body.rendimento_porcoes || 1,
      categoria_receita: body.categoria_receita,
      modo_preparo: body.modo_preparo,
      origem: 'usuario',
      autor_id: user.id,
      status_moderacao: 'em_revisao',
      ingredientes_chave: body.ingredientes.map((i) => i.nome.toLowerCase()),
    });
    const saved = await this.receitaRepo.save(receita);

    if (body.ingredientes?.length) {
      const ingredientes = body.ingredientes.map((ing, idx) =>
        this.ingredienteRepo.create({
          receita_id: saved.id,
          observacao: `${ing.quantidade ? ing.quantidade + ' ' : ''}${ing.unidade ? ing.unidade + ' de ' : ''}${ing.nome}`.trim(),
          a_gosto: ing.a_gosto || false,
          ordem: idx,
        }),
      );
      await this.ingredienteRepo.save(ingredientes);
    }

    return { id: saved.id, status_moderacao: saved.status_moderacao };
  }

  @Delete('minhas/:id')
  @ApiOperation({ summary: 'Remove receita do próprio usuário' })
  async deletarMinhaReceita(@CurrentUser() user: Usuario, @Param('id') receitaId: string) {
    const receita = await this.receitaRepo.findOne({ where: { id: receitaId } });
    if (!receita) throw new NotFoundException('Receita não encontrada');
    if (receita.autor_id !== user.id) throw new ForbiddenException('Sem permissão');
    await this.receitaRepo.delete(receitaId);
    return { ok: true };
  }

  @Get('executadas')
  @ApiOperation({ summary: 'Histórico de receitas executadas pelo usuário' })
  async listarExecutadas(@CurrentUser() user: Usuario) {
    return this.receitaExecutadaRepo.find({
      where: { usuario_id: user.id },
      relations: ['receita'],
      order: { receita: { nome: 'ASC' } },
      take: 50,
    });
  }

  /**
   * Lista receitas fitness (tags: fitness, fit, proteico, low-carb) com cobertura do inventário.
   * Retorna TODAS as receitas fitness independente de ter ingredientes — cobertura é bônus.
   */
  @Get('fitness')
  @ApiOperation({ summary: 'Lista receitas fitness com cobertura do inventário do usuário' })
  async listarFitness(@CurrentUser() user: Usuario) {
    const FITNESS_TAGS = ['fitness', 'fit', 'proteico', 'low-carb', 'hiperproteico', 'lightfit'];

    // Busca receitas com tags fitness — filtra em JS para contornar formato variable do simple-array
    const todasReceitas = await this.receitaRepo.find({
      where: [{ status_moderacao: 'ok' }, { status_moderacao: null as any }],
      relations: ['ingredientes'],
      order: { avaliacao_media: 'DESC', vezes_executada: 'DESC' },
    });

    const receitasFitness = todasReceitas.filter((r) => {
      if (!r.tags_dieta) return false;
      const tagsStr = String(r.tags_dieta).toLowerCase();
      return FITNESS_TAGS.some((tag) => tagsStr.includes(tag));
    });

    // Banco com poucas receitas fitness → scraping em background
    if (receitasFitness.length < 8) {
      this.logger.log(`Apenas ${receitasFitness.length} receitas fitness — populando em background`);
      this.recipeGeneratorService.popularReceitasFitness().catch((err) =>
        this.logger.error(`Erro ao popular fitness: ${err.message}`),
      );
    }

    // Calcula cobertura se tiver inventário
    const ingredientes = await this.inventarioService.ingredientesDisponiveis(user.id);
    let coberturaMap: Map<string, { cobertura: number; disponivel: boolean; faltando: string[] }> = new Map();

    if (ingredientes.length > 0) {
      const todas = await this.receitaBancoService.listarDisponiveisParaUsuario(ingredientes);
      for (const r of todas) {
        coberturaMap.set(r.receita.id, {
          cobertura: Math.round(r.cobertura * 100),
          disponivel: r.disponivel,
          faltando: r.faltando,
        });
      }
    }

    return {
      total: receitasFitness.length,
      receitas: receitasFitness.map((receita) => {
        const cob = coberturaMap.get(receita.id);
        return {
          ...this.receitaBancoService.entidadeParaFormato(receita),
          id: receita.id,
          cobertura: cob?.cobertura ?? 0,
          disponivel: cob?.disponivel ?? false,
          faltando: cob?.faltando ?? [],
          vezes_executada: receita.vezes_executada,
          avaliacao_media: receita.avaliacao_media,
          informacoes_nutricionais: receita.informacoes_nutricionais,
        };
      }),
    };
  }

  /**
   * Busca uma receita por ID com cobertura calculada para o inventário do usuário.
   */
  @Get(':id')
  @ApiOperation({ summary: 'Busca receita por ID com cobertura do usuário' })
  async buscarPorId(@CurrentUser() user: Usuario, @Param('id') receitaId: string) {
    const receita = await this.receitaBancoService.buscarPorId(receitaId);
    const ingredientes = await this.inventarioService.ingredientesDisponiveis(user.id);
    const todas = await this.receitaBancoService.listarDisponiveisParaUsuario(ingredientes);
    const match = todas.find((r) => r.receita.id === receitaId);

    return {
      receita: {
        ...this.receitaBancoService.entidadeParaFormato(receita),
        id: receita.id,
        cobertura: match ? Math.round(match.cobertura * 100) : 0,
        disponivel: match ? match.disponivel : false,
        tem_protagonista: match ? match.temProtagonista : false,
        faltando: match ? match.faltando : [],
        vezes_executada: receita.vezes_executada,
        avaliacao_media: receita.avaliacao_media,
      },
    };
  }

  @Post(':id/favoritar')
  @ApiOperation({ summary: 'Toggle favorito — adiciona se não existe, remove se existe' })
  async toggleFavorito(@CurrentUser() user: Usuario, @Param('id') receitaId: string) {
    const existente = await this.favoritaRepo.findOne({
      where: { usuario_id: user.id, receita_id: receitaId },
    });
    if (existente) {
      await this.favoritaRepo.delete(existente.id);
      return { favoritado: false };
    }
    await this.favoritaRepo.save(
      this.favoritaRepo.create({ usuario_id: user.id, receita_id: receitaId }),
    );
    return { favoritado: true };
  }

  @Get(':id/favoritado')
  @ApiOperation({ summary: 'Verifica se receita está favoritada pelo usuário' })
  async isFavoritado(@CurrentUser() user: Usuario, @Param('id') receitaId: string) {
    const existente = await this.favoritaRepo.findOne({
      where: { usuario_id: user.id, receita_id: receitaId },
    });
    return { favoritado: !!existente };
  }

  @Post(':id/executar')
  @ApiOperation({ summary: 'Registrar execução de receita' })
  async executar(
    @CurrentUser() user: Usuario,
    @Param('id') receitaId: string,
  ) {
    const receita = await this.receitaBancoService.buscarPorId(receitaId);

    // Registra execução na tabela receitas_executadas
    const execucao = this.receitaExecutadaRepo.create({
      usuario_id: user.id,
      receita_id: receitaId,
    } as any);
    await this.receitaExecutadaRepo.save(execucao);

    // Incrementa contador global da receita
    await this.receitaBancoService.incrementarExecucao(receitaId);

    return {
      sucesso: true,
      receita_id: receitaId,
      ingredientes_receita: receita.ingredientes_chave || [],
      mensagem: 'Receita registrada! Algum ingrediente acabou?',
    };
  }

  @Get('perfil-aprendizado')
  @ApiOperation({ summary: 'Retorna o progresso de aprendizado do CookMe sobre o usuário' })
  async perfilAprendizado(@CurrentUser() user: Usuario) {
    return this.aprendizadoService.perfilAprendizado(user.id);
  }
}
