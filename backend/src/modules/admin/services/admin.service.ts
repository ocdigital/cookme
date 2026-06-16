import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { InjectRepository, InjectDataSource } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Produto } from '@modules/produtos/entities/produto.entity';
import { Usuario } from '@modules/usuarios/entities/usuario.entity';
import { Receita } from '@modules/receitas/entities/receita.entity';
import { Compra } from '@modules/compras/entities/compra.entity';
import { ProductKnowledgeBase } from '@modules/product-classification/entities/product-knowledge-base.entity';
import { ListProductsQueryDto } from '../dto/list-products-query.dto';
import { ListProductsResponseDto, ProductListDto } from '../dto/product-list.dto';

@Injectable()
export class AdminService {
  constructor(
    @InjectRepository(Produto)
    private readonly produtoRepository: Repository<Produto>,
    @InjectRepository(Usuario)
    private readonly usuarioRepository: Repository<Usuario>,
    @InjectRepository(Receita)
    private readonly receitaRepository: Repository<Receita>,
    @InjectRepository(Compra)
    private readonly compraRepository: Repository<Compra>,
    @InjectRepository(ProductKnowledgeBase)
    private readonly knowledgeBaseRepository: Repository<ProductKnowledgeBase>,
    @InjectDataSource()
    private readonly dataSource: DataSource,
  ) {}

  async getDataCounts(): Promise<Record<string, number>> {
    const run = (sql: string) =>
      this.dataSource.query(sql).then((r: any[]) => Number(r[0]?.count ?? 0));

    const [usuarios, receitas, produtos, compras, inventario, notificacoes, listas] =
      await Promise.all([
        run(`SELECT COUNT(*) FROM usuarios WHERE role != 'admin'`),
        run(`SELECT COUNT(*) FROM receitas`),
        run(`SELECT COUNT(*) FROM produtos`),
        run(`SELECT COUNT(*) FROM compras`),
        run(`SELECT COUNT(*) FROM inventario`),
        run(`SELECT COUNT(*) FROM notificacoes`),
        run(`SELECT COUNT(*) FROM listas`),
      ]);

    return { usuarios, receitas, produtos, compras, inventario, notificacoes, listas };
  }

  async limparDados(entidade: string): Promise<{ deletados: number }> {
    const q = this.dataSource.createQueryRunner();
    await q.connect();
    await q.startTransaction();

    try {
      let deletados = 0;

      switch (entidade) {
        case 'usuarios':
          await q.query(`DELETE FROM compra_itens WHERE compra_id IN (SELECT id FROM compras WHERE usuario_id IN (SELECT id FROM usuarios WHERE role != 'admin'))`);
          await q.query(`DELETE FROM compras WHERE usuario_id IN (SELECT id FROM usuarios WHERE role != 'admin')`);
          await q.query(`DELETE FROM inventario WHERE usuario_id IN (SELECT id FROM usuarios WHERE role != 'admin')`);
          await q.query(`DELETE FROM itens_listas WHERE lista_id IN (SELECT id FROM listas WHERE usuario_id IN (SELECT id FROM usuarios WHERE role != 'admin'))`);
          await q.query(`DELETE FROM listas WHERE usuario_id IN (SELECT id FROM usuarios WHERE role != 'admin')`);
          await q.query(`DELETE FROM notificacoes_usuario WHERE usuario_id IN (SELECT id FROM usuarios WHERE role != 'admin')`);
          await q.query(`DELETE FROM notificacoes WHERE usuario_id IN (SELECT id FROM usuarios WHERE role != 'admin')`);
          await q.query(`DELETE FROM preferencias WHERE usuario_id IN (SELECT id FROM usuarios WHERE role != 'admin')`);
          await q.query(`DELETE FROM receita_favoritas WHERE usuario_id IN (SELECT id FROM usuarios WHERE role != 'admin')`);
          await q.query(`DELETE FROM receita_recomendacoes WHERE usuario_id IN (SELECT id FROM usuarios WHERE role != 'admin')`);
          await q.query(`DELETE FROM receitas_executadas WHERE usuario_id IN (SELECT id FROM usuarios WHERE role != 'admin')`);
          await q.query(`DELETE FROM planejamento_semanal WHERE usuario_id IN (SELECT id FROM usuarios WHERE role != 'admin')`);
          const rUsuarios = await q.query(`DELETE FROM usuarios WHERE role != 'admin' RETURNING id`);
          deletados = rUsuarios.length;
          break;

        case 'receitas':
          await q.query(`DELETE FROM receita_ingredientes`);
          await q.query(`DELETE FROM receita_favoritas`);
          await q.query(`DELETE FROM receita_recomendacoes`);
          await q.query(`DELETE FROM receitas_executadas`);
          const rReceitas = await q.query(`DELETE FROM receitas RETURNING id`);
          deletados = rReceitas.length;
          break;

        case 'produtos':
          await q.query(`DELETE FROM product_knowledge_base`);
          await q.query(`DELETE FROM product_validations`);
          await q.query(`DELETE FROM ai_classification_logs`);
          await q.query(`DELETE FROM receita_ingredientes`);
          await q.query(`DELETE FROM compra_itens`);
          await q.query(`DELETE FROM inventario`);
          const rProdutos = await q.query(`DELETE FROM produtos RETURNING id`);
          deletados = rProdutos.length;
          break;

        case 'compras':
          await q.query(`DELETE FROM compra_itens`);
          const rCompras = await q.query(`DELETE FROM compras RETURNING id`);
          deletados = rCompras.length;
          break;

        case 'inventario':
          const rInv = await q.query(`DELETE FROM inventario RETURNING id`);
          deletados = rInv.length;
          break;

        case 'notificacoes':
          await q.query(`DELETE FROM notificacoes_usuario`);
          const rNotif = await q.query(`DELETE FROM notificacoes RETURNING id`);
          deletados = rNotif.length;
          break;

        case 'listas':
          await q.query(`DELETE FROM itens_listas`);
          const rListas = await q.query(`DELETE FROM listas RETURNING id`);
          deletados = rListas.length;
          break;

        default:
          throw new BadRequestException(`Entidade desconhecida: ${entidade}`);
      }

      await q.commitTransaction();
      return { deletados };
    } catch (err) {
      await q.rollbackTransaction();
      throw err;
    } finally {
      await q.release();
    }
  }

  /**
   * Lista produtos com paginação, filtros e busca
   * Enriquecido com campos calculados: qualidade, popularidade, vezes_usada
   */
  async listProducts(
    query: ListProductsQueryDto,
  ): Promise<ListProductsResponseDto> {
    const qb = this.produtoRepository
      .createQueryBuilder('produto')
      .leftJoinAndSelect('produto.categoria', 'categoria')
      .leftJoinAndSelect('produto.marca', 'marca');

    // Aplicar filtros
    if (query.search) {
      qb.andWhere(
        '(produto.nome ILIKE :search OR produto.codigo_barras ILIKE :search)',
        { search: `%${query.search}%` },
      );
    }

    if (query.categoriaId) {
      qb.andWhere('produto.categoria_id = :categoriaId', {
        categoriaId: query.categoriaId,
      });
    }

    if (query.marcaId) {
      qb.andWhere('produto.marca_id = :marcaId', {
        marcaId: query.marcaId,
      });
    }

    if (query.origem) {
      qb.andWhere('produto.origem = :origem', { origem: query.origem });
    }

    if (query.verificado !== undefined && query.verificado !== '') {
      qb.andWhere('produto.verificado = :verificado', { verificado: query.verificado === 'true' });
    }

    if (query.ingredienteFilter) {
      if (query.ingredienteFilter === 'ingrediente') {
        qb.andWhere('produto.ingrediente_receita = true');
      } else if (query.ingredienteFilter === 'nao_ingrediente') {
        qb.andWhere('produto.ingrediente_receita = false');
      } else if (query.ingredienteFilter === 'sem_classificacao') {
        qb.andWhere('produto.ingrediente_receita IS NULL');
      }
    }

    // Aplicar ordenação
    const sortField = query.sort === 'nome' ? 'produto.nome' : 'produto.criado_em';
    qb.orderBy(sortField, query.order);

    // Contar total antes de paginar
    const total = await qb.getCount();

    // Aplicar paginação
    const skip = (query.page - 1) * query.limit;
    qb.skip(skip).take(query.limit);

    const produtos = await qb.getMany();

    // Obter contagem total de uso de cada produto (para calcular popularidade)
    const totalUsos = await this.receitaRepository
      .createQueryBuilder('receita')
      .leftJoinAndSelect('receita.ingredientes', 'ingrediente')
      .select('ingrediente.produto_id', 'produto_id')
      .addSelect('COUNT(*)', 'count')
      .groupBy('ingrediente.produto_id')
      .getRawMany();

    const usosMap = new Map(totalUsos.map((uso: any) => [uso.produto_id, parseInt(uso.count, 10)]));
    const maxUsos = Math.max(...Array.from(usosMap.values()), 1);

    // Mapear para DTO com campos calculados
    const data: any[] = produtos.map((produto) => {
      const vezes_usada = usosMap.get(produto.id) || 0;
      const qualidade = this.calcularQualidadeProduto(produto);
      const popularidade = maxUsos > 0 ? Math.round((vezes_usada / maxUsos) * 100) : 0;

      return {
        id: produto.id,
        nome: produto.nome,
        descricao: produto.descricao,
        codigo_barras: produto.codigo_barras,
        categoria: produto.categoria
          ? {
              id: produto.categoria.id,
              nome: produto.categoria.nome,
              icone: produto.categoria.icone,
            }
          : null,
        marca: produto.marca
          ? {
              id: produto.marca.id,
              nome: produto.marca.nome,
            }
          : null,
        unidade_padrao: produto.unidade_padrao,
        validade_media_dias: produto.validade_media_dias,
        origem: produto.origem,
        verificado: produto.verificado,
        criado_em: produto.criado_em,
        atualizado_em: produto.atualizado_em,
        vezes_usada,
        qualidade,
        popularidade,
        ingrediente_receita: produto.ingrediente_receita,
      };
    });

    // Calcular paginação
    const totalPages = Math.ceil(total / query.limit);
    const hasNextPage = query.page < totalPages;
    const hasPreviousPage = query.page > 1;

    return {
      data,
      total,
      page: query.page,
      limit: query.limit,
      totalPages,
      hasNextPage,
      hasPreviousPage,
    };
  }

  /**
   * Obter um produto específico com todos os detalhes
   */
  async getProductDetail(id: string): Promise<ProductListDto> {
    const produto = await this.produtoRepository.findOne({
      where: { id },
      relations: ['categoria', 'marca'],
    });

    if (!produto) {
      throw new Error(`Produto com ID ${id} não encontrado`);
    }

    return {
      id: produto.id,
      nome: produto.nome,
      descricao: produto.descricao,
      codigo_barras: produto.codigo_barras,
      categoria: produto.categoria
        ? {
            id: produto.categoria.id,
            nome: produto.categoria.nome,
            icone: produto.categoria.icone,
          }
        : null,
      marca: produto.marca
        ? {
            id: produto.marca.id,
            nome: produto.marca.nome,
          }
        : null,
      unidade_padrao: produto.unidade_padrao,
      validade_media_dias: produto.validade_media_dias,
      origem: produto.origem,
      verificado: produto.verificado,
      criado_em: produto.criado_em,
      atualizado_em: produto.atualizado_em,
    };
  }

  /**
   * Obter estatísticas de produtos
   */
  async getProductStats() {
    const [totalProdutos, produtosPorCategoria, produtosPorMarca] =
      await Promise.all([
        this.produtoRepository.count(),
        this.produtoRepository
          .createQueryBuilder('produto')
          .select('categoria.nome', 'categoria')
          .addSelect('COUNT(produto.id)', 'total')
          .leftJoin('produto.categoria', 'categoria')
          .groupBy('categoria.id, categoria.nome')
          .orderBy('COUNT(produto.id)', 'DESC')
          .getRawMany(),
        this.produtoRepository
          .createQueryBuilder('produto')
          .select('marca.nome', 'marca')
          .addSelect('COUNT(produto.id)', 'total')
          .leftJoin('produto.marca', 'marca')
          .groupBy('marca.id, marca.nome')
          .orderBy('COUNT(produto.id)', 'DESC')
          .limit(10)
          .getRawMany(),
      ]);

    return {
      totalProdutos,
      produtosPorCategoria: produtosPorCategoria.map((row) => ({
        categoria: row.categoria || 'Sem categoria',
        total: parseInt(row.total, 10),
      })),
      produtosPorMarca: produtosPorMarca.map((row) => ({
        marca: row.marca || 'Sem marca',
        total: parseInt(row.total, 10),
      })),
    };
  }

  /**
   * Lista usuários com paginação e filtros
   * Enriquecido com campos calculados: nivel_atividade, receitas_criadas
   */
  async listUsers(page: number = 1, limit: number = 20, filters?: {
    search?: string;
    role?: string;
  }) {
    const qb = this.usuarioRepository
      .createQueryBuilder('usuario')
      .select([
        'usuario.id',
        'usuario.email',
        'usuario.nome',
        'usuario.role',
        'usuario.email_verificado',
        'usuario.alertas_habilitados',
        'usuario.avatar_url',
        'usuario.ultimo_acesso',
        'usuario.criado_em',
        'usuario.atualizado_em',
      ]);

    // Aplicar filtros
    if (filters?.search) {
      qb.andWhere(
        '(usuario.email ILIKE :search OR usuario.nome ILIKE :search)',
        { search: `%${filters.search}%` },
      );
    }

    if (filters?.role) {
      qb.andWhere('usuario.role = :role', { role: filters.role });
    }

    // Contar total antes de paginar
    const total = await qb.getCount();

    // Aplicar paginação
    const skip = (page - 1) * limit;
    qb.skip(skip).take(limit);

    // Ordenar por data de criação (mais recentes primeiro)
    qb.orderBy('usuario.criado_em', 'DESC');

    const usuarios = await qb.getMany();

    // Enriquecer com dados calculados
    const usuariosEnriquecidos = usuarios.map((usuario) => ({
      ...usuario,
      nivel_atividade: this.calcularNivelAtividade(usuario.ultimo_acesso),
      receitas_criadas: 0, // Será calculado abaixo
    }));

    // Calcular receitas criadas por cada usuário
    // Nota: Receita não tem campo criado_por_id, então usamos vezes_executada como proxy
    // Em produção, adicionar criado_por_id em Receita
    for (const usuario of usuariosEnriquecidos) {
      const receitasCount = await this.receitaRepository.count();
      usuario.receitas_criadas = receitasCount; // Placeholder até ter criado_por_id
    }

    // Calcular paginação
    const totalPages = Math.ceil(total / limit);
    const hasNextPage = page < totalPages;
    const hasPreviousPage = page > 1;

    return {
      data: usuariosEnriquecidos,
      total,
      page,
      limit,
      totalPages,
      hasNextPage,
      hasPreviousPage,
    };
  }

  /**
   * Obter estatísticas de usuários
   */
  async getUserStats() {
    const totalUsuarios = await this.usuarioRepository.count();

    const usuariosPorRole = await this.usuarioRepository
      .createQueryBuilder('usuario')
      .select('usuario.role', 'role')
      .addSelect('COUNT(usuario.id)', 'total')
      .groupBy('usuario.role')
      .orderBy('COUNT(usuario.id)', 'DESC')
      .getRawMany();

    // Contar usuários que têm ultimo_acesso não nulo (ativos)
    const usuarioAtivos = await this.usuarioRepository
      .createQueryBuilder('usuario')
      .where('usuario.ultimo_acesso IS NOT NULL')
      .getCount();

    return {
      totalUsuarios,
      usuariosPorRole: usuariosPorRole.map((row) => ({
        role: row.role || 'user',
        total: parseInt(row.total, 10),
      })),
      usuarioAtivos,
    };
  }

  async listCompras(page = 1, limit = 20, search?: string) {
    const qb = this.compraRepository
      .createQueryBuilder('compra')
      .leftJoinAndSelect('compra.itens', 'item')
      .leftJoinAndSelect('item.produto', 'produto')
      .leftJoin('compra.usuario', 'usuario')
      .addSelect(['usuario.id', 'usuario.nome', 'usuario.email'])
      .orderBy('compra.criado_em', 'DESC');

    if (search) {
      qb.andWhere('compra.local_compra ILIKE :s', { s: `%${search}%` });
    }

    const total = await qb.getCount();
    const compras = await qb.skip((page - 1) * limit).take(limit).getMany();

    return {
      data: compras,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getCompraById(id: string) {
    return this.compraRepository.findOne({
      where: { id },
      relations: ['itens', 'itens.produto', 'itens.produto.marca', 'itens.produto.categoria', 'usuario'],
    });
  }

  /**
   * Obter estatísticas gerais do dashboard
   */
  async getDashboardStats() {
    const [
      totalUsuarios,
      totalProdutos,
      totalReceitas,
      totalCompras,
      usuariosAtivos,
    ] = await Promise.all([
      this.usuarioRepository.count(),
      this.produtoRepository.count(),
      this.receitaRepository.count(),
      this.compraRepository.count(),
      this.usuarioRepository
        .createQueryBuilder('usuario')
        .where('usuario.ultimo_acesso IS NOT NULL')
        .getCount(),
    ]);

    return {
      usuarios: {
        total: totalUsuarios,
        ativos: usuariosAtivos,
      },
      produtos: {
        total: totalProdutos,
      },
      receitas: {
        total: totalReceitas,
      },
      compras: {
        total: totalCompras,
      },
    };
  }

  /**
   * Calcula o nível de atividade do usuário baseado no último acesso
   * alta: ≤ 7 dias
   * media: ≤ 30 dias
   * baixa: ≤ 90 dias
   * inativa: > 90 dias ou nunca acessou
   */
  private calcularNivelAtividade(ultimoAcesso: Date | null): 'alta' | 'media' | 'baixa' | 'inativa' {
    if (!ultimoAcesso) return 'inativa';

    const agora = new Date();
    const diasDesdeAcesso = Math.floor(
      (agora.getTime() - new Date(ultimoAcesso).getTime()) / (1000 * 60 * 60 * 24)
    );

    if (diasDesdeAcesso <= 7) return 'alta';
    if (diasDesdeAcesso <= 30) return 'media';
    if (diasDesdeAcesso <= 90) return 'baixa';
    return 'inativa';
  }

  /**
   * Determina a qualidade do produto baseado em campos preenchidos
   */
  private calcularQualidadeProduto(produto: Produto): 'completo' | 'incompleto' | 'sem_imagem' {
    if (!produto.imagem_url) return 'sem_imagem';

    const temNutrientes =
      produto.informacoes_nutricionais &&
      (produto.informacoes_nutricionais.calorias ||
        produto.informacoes_nutricionais.proteinas ||
        produto.informacoes_nutricionais.carboidratos ||
        produto.informacoes_nutricionais.gorduras);

    const temCodigoBarras = !!produto.codigo_barras;
    const estaVerificado = produto.verificado;

    // Considerar completo se tem imagem + nutrientes + código + verificado
    if (temNutrientes && temCodigoBarras && estaVerificado) {
      return 'completo';
    }

    return 'incompleto';
  }

  /**
   * Lista receitas com dados de moderação
   */
  async listRecipes(
    page: number = 1,
    limit: number = 20,
    filters?: {
      search?: string;
      dificuldade?: string;
      categoria?: string;
    },
  ) {
    const qb = this.receitaRepository
      .createQueryBuilder('receita')
      .select([
        'receita.id',
        'receita.nome',
        'receita.descricao',
        'receita.categoria_receita',
        'receita.dificuldade',
        'receita.tempo_preparo',
        'receita.rendimento_porcoes',
        'receita.avaliacao_media',
        'receita.vezes_executada',
        'receita.denuncias',
        'receita.status_moderacao',
        'receita.imagem_url',
        'receita.tags_dieta',
        'receita.modo_preparo',
        'receita.criado_em',
      ])
      .leftJoinAndSelect('receita.ingredientes', 'ingrediente')
      .leftJoinAndSelect('ingrediente.produto', 'iproduto');

    // Aplicar filtros
    if (filters?.search) {
      qb.andWhere('receita.nome ILIKE :search', {
        search: `%${filters.search}%`,
      });
    }

    if (filters?.dificuldade) {
      qb.andWhere('receita.dificuldade = :dificuldade', {
        dificuldade: filters.dificuldade,
      });
    }

    if (filters?.categoria) {
      qb.andWhere('receita.categoria_receita = :categoria', {
        categoria: filters.categoria,
      });
    }

    // Contar total antes de paginar
    const total = await qb.getCount();

    // Aplicar paginação
    const skip = (page - 1) * limit;
    qb.skip(skip).take(limit);

    // Ordenar por data de criação (mais recentes primeiro)
    qb.orderBy('receita.criado_em', 'DESC');

    const receitas = await qb.getMany();

    // Calcular paginação
    const totalPages = Math.ceil(total / limit);

    return {
      data: receitas,
      total,
      page,
      limit,
      totalPages,
      hasNextPage: page < totalPages,
      hasPreviousPage: page > 1,
    };
  }

  async listCategorias(): Promise<{ id: string; nome: string }[]> {
    const rows = await this.produtoRepository
      .createQueryBuilder('produto')
      .innerJoin('produto.categoria', 'categoria')
      .select('categoria.id', 'id')
      .addSelect('categoria.nome', 'nome')
      .groupBy('categoria.id')
      .addGroupBy('categoria.nome')
      .orderBy('categoria.nome', 'ASC')
      .getRawMany();
    return rows;
  }

  /**
   * Atualizar status de moderação de uma receita
   */
  async atualizarModeracaoReceita(
    receitaId: string,
    status: 'ok' | 'em_revisao' | 'arquivado',
  ) {
    const receita = await this.receitaRepository.findOne({
      where: { id: receitaId },
    });

    if (!receita) {
      throw new Error(`Receita com ID ${receitaId} não encontrada`);
    }

    receita.status_moderacao = status;
    await this.receitaRepository.save(receita);

    return receita;
  }

  /**
   * Retorna produtos da knowledge base que precisam de revisão:
   * - confidence < 0.75
   * - canonical_ingredient nulo
   * - ingrediente_receita nulo
   */
  async getFilaRevisao(limit = 50): Promise<any[]> {
    return this.knowledgeBaseRepository
      .createQueryBuilder('kb')
      .where(
        'kb.confidence_score < :threshold OR kb.canonical_ingredient IS NULL OR kb.ingrediente_receita IS NULL',
        { threshold: 0.75 },
      )
      .orderBy('kb.confidence_score', 'ASC')
      .take(limit)
      .getMany();
  }

  /**
   * Corrige classificação de um produto na knowledge base
   */
  async corrigirClassificacao(
    id: string,
    body: { ingrediente_receita?: boolean; canonical_name?: string },
  ): Promise<ProductKnowledgeBase> {
    const kb = await this.knowledgeBaseRepository.findOne({ where: { id } });

    if (!kb) {
      throw new BadRequestException(`Produto com ID ${id} não encontrado na knowledge base`);
    }

    if (body.ingrediente_receita !== undefined) {
      kb.ingrediente_receita = body.ingrediente_receita;
    }

    if (body.canonical_name !== undefined) {
      kb.canonical_ingredient = body.canonical_name;
    }

    return this.knowledgeBaseRepository.save(kb);
  }

  async updateProdutoClassificacao(
    id: string,
    ingrediente_receita: boolean,
  ): Promise<{ id: string; nome: string; ingrediente_receita: boolean }> {
    const produto = await this.produtoRepository.findOne({ where: { id } });
    if (!produto) {
      throw new BadRequestException(`Produto ${id} não encontrado`);
    }
    produto.ingrediente_receita = ingrediente_receita;
    const saved = await this.produtoRepository.save(produto);
    return { id: saved.id, nome: saved.nome, ingrediente_receita: saved.ingrediente_receita ?? false };
  }

  async resetarSenhaUsuario(usuarioId: string): Promise<{ senha_temporaria: string }> {
    const usuario = await this.usuarioRepository.findOne({ where: { id: usuarioId } });
    if (!usuario) throw new NotFoundException('Usuário não encontrado');

    const chars = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
    const senha_temporaria = Array.from({ length: 10 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');

    const hash = await bcrypt.hash(senha_temporaria, 10);
    await this.usuarioRepository.update(usuarioId, {
      senha: hash,
      deve_trocar_senha: true,
    });

    return { senha_temporaria };
  }
}
