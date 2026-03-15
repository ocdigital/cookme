import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Produto } from '@modules/produtos/entities/produto.entity';
import { Usuario } from '@modules/usuarios/entities/usuario.entity';
import { Receita } from '@modules/receitas/entities/receita.entity';
import { Compra } from '@modules/compras/entities/compra.entity';
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
  ) {}

  /**
   * Lista produtos com paginação, filtros e busca
   * Usado no painel admin
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

    // Aplicar ordenação
    const sortField = query.sort === 'nome' ? 'produto.nome' : 'produto.criado_em';
    qb.orderBy(sortField, query.order);

    // Contar total antes de paginar
    const total = await qb.getCount();

    // Aplicar paginação
    const skip = (query.page - 1) * query.limit;
    qb.skip(skip).take(query.limit);

    const produtos = await qb.getMany();

    // Mapear para DTO
    const data: ProductListDto[] = produtos.map((produto) => ({
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
    }));

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

    // Calcular paginação
    const totalPages = Math.ceil(total / limit);
    const hasNextPage = page < totalPages;
    const hasPreviousPage = page > 1;

    return {
      data: usuarios,
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
        'receita.categoria_receita',
        'receita.dificuldade',
        'receita.tempo_preparo',
        'receita.avaliacao_media',
        'receita.vezes_executada',
        'receita.denuncias',
        'receita.status_moderacao',
        'receita.imagem_url',
        'receita.criado_em',
      ]);

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
}
