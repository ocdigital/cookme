import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Produto } from '@modules/produtos/entities/produto.entity';
import { ListProductsQueryDto } from '../dto/list-products-query.dto';
import { ListProductsResponseDto, ProductListDto } from '../dto/product-list.dto';

@Injectable()
export class AdminService {
  constructor(
    @InjectRepository(Produto)
    private readonly produtoRepository: Repository<Produto>,
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
}
