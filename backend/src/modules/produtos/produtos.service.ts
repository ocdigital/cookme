import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like } from 'typeorm';
import { Produto } from './entities/produto.entity';
import { Marca } from './entities/marca.entity';
import { Categoria } from './entities/categoria.entity';
import { CreateProdutoDto } from './dto/create-produto.dto';
import { UpdateProdutoDto } from './dto/update-produto.dto';
import { CreateMarcaDto } from './dto/create-marca.dto';
import { CreateCategoriaDto } from './dto/create-categoria.dto';
import { ProductType } from '@common/enums/product-type.enum';

@Injectable()
export class ProdutosService {
  constructor(
    @InjectRepository(Produto)
    private readonly produtoRepository: Repository<Produto>,
    @InjectRepository(Marca)
    private readonly marcaRepository: Repository<Marca>,
    @InjectRepository(Categoria)
    private readonly categoriaRepository: Repository<Categoria>,
  ) { }

  // ========== PRODUTOS ==========

  async create(createProdutoDto: CreateProdutoDto): Promise<Produto> {
    // Verifica código de barras único
    if (createProdutoDto.codigo_barras) {
      const existing = await this.produtoRepository.findOne({
        where: { codigo_barras: createProdutoDto.codigo_barras },
      });
      if (existing) {
        throw new ConflictException('Código de barras já cadastrado');
      }
    }

    // Define tipo padrão como ALIMENTO se não fornecido
    const tipo = createProdutoDto.tipo || ProductType.ALIMENTO;

    // Validar campos obrigatórios para produtos alimentícios
    this.validateFoodProduct(tipo, createProdutoDto);

    // Validar se a categoria é de alimentos (quando fornecida)
    if (createProdutoDto.categoria_id) {
      const categoria = await this.categoriaRepository.findOne({
        where: { id: createProdutoDto.categoria_id },
      });

      if (!categoria) {
        throw new NotFoundException('Categoria não encontrada');
      }

      // Validar consistência entre tipo do produto e categoria
      if (tipo === ProductType.ALIMENTO && !categoria.is_food) {
        throw new BadRequestException(
          'Produtos alimentícios devem ter uma categoria de alimentos',
        );
      }

      if (tipo === ProductType.NAO_ALIMENTO && categoria.is_food) {
        throw new BadRequestException(
          'Produtos não alimentícios não podem ter categoria de alimentos',
        );
      }
    } else if (tipo === ProductType.ALIMENTO) {
      // Produtos alimentícios devem ter categoria
      throw new BadRequestException(
        'Produtos alimentícios devem ter uma categoria definida',
      );
    }

    const produto = this.produtoRepository.create({
      ...createProdutoDto,
      tipo,
    });
    return this.produtoRepository.save(produto);
  }

  /**
   * Valida campos obrigatórios para produtos alimentícios
   */
  private validateFoodProduct(
    tipo: ProductType,
    data: CreateProdutoDto | UpdateProdutoDto,
  ): void {
    if (tipo === ProductType.ALIMENTO) {
      // Produtos alimentícios devem ter unidade de medida
      if (!data.unidade_padrao) {
        throw new BadRequestException(
          'Produtos alimentícios devem ter uma unidade de medida',
        );
      }

      // Validar se tem validade média (recomendado)
      // Deixando como warning apenas, não bloqueando
    }
  }

  async findAll(
    search?: string,
    categoriaId?: string,
    page: number = 1,
    limit: number = 50,
  ): Promise<{
    data: Produto[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    const query = this.produtoRepository
      .createQueryBuilder('produto')
      .leftJoinAndSelect('produto.marca', 'marca')
      .leftJoinAndSelect('produto.categoria', 'categoria');

    if (search) {
      query.andWhere('produto.nome ILIKE :search', { search: `%${search}%` });
    }

    if (categoriaId) {
      query.andWhere('produto.categoria_id = :categoriaId', { categoriaId });
    }

    const total = await query.getCount();
    const data = await query
      .skip((page - 1) * limit)
      .take(limit)
      .getMany();

    return {
      data,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOne(id: string): Promise<Produto> {
    const produto = await this.produtoRepository.findOne({
      where: { id },
      relations: ['marca', 'categoria'],
    });

    if (!produto) {
      throw new NotFoundException('Produto não encontrado');
    }

    return produto;
  }

  async findByBarcode(codigo_barras: string): Promise<Produto | null> {
    return this.produtoRepository.findOne({
      where: { codigo_barras },
      relations: ['marca', 'categoria'],
    });
  }

  async searchForAutocomplete(query: string, limit: number = 10) {
    if (!query || query.length < 2) {
      return [];
    }

    const produtos = await this.produtoRepository
      .createQueryBuilder('produto')
      .leftJoinAndSelect('produto.marca', 'marca')
      .leftJoinAndSelect('produto.categoria', 'categoria')
      .where(
        '(produto.nome ILIKE :query OR produto.codigo_barras ILIKE :query)',
        { query: `%${query}%` },
      )
      .orderBy('produto.nome', 'ASC')
      .take(limit)
      .getMany();

    return produtos.map((p) => ({
      id: p.id,
      nome: p.nome,
      codigo_barras: p.codigo_barras,
      categoria: p.categoria?.nome || null,
      marca: p.marca?.nome || null,
      unidade_padrao: p.unidade_padrao,
    }));
  }

  async update(id: string, updateProdutoDto: UpdateProdutoDto): Promise<Produto> {
    const produto = await this.findOne(id);

    // Verifica código de barras único
    if (updateProdutoDto.codigo_barras && updateProdutoDto.codigo_barras !== produto.codigo_barras) {
      const existing = await this.produtoRepository.findOne({
        where: { codigo_barras: updateProdutoDto.codigo_barras },
      });
      if (existing) {
        throw new ConflictException('Código de barras já cadastrado');
      }
    }

    Object.assign(produto, updateProdutoDto);
    return this.produtoRepository.save(produto);
  }

  async remove(id: string): Promise<void> {
    const produto = await this.findOne(id);
    await this.produtoRepository.remove(produto);
  }

  // ========== MARCAS ==========

  async createMarca(createMarcaDto: CreateMarcaDto): Promise<Marca> {
    const existing = await this.marcaRepository.findOne({
      where: { nome: createMarcaDto.nome },
    });

    if (existing) {
      throw new ConflictException('Marca já cadastrada');
    }

    const marca = this.marcaRepository.create(createMarcaDto);
    return this.marcaRepository.save(marca);
  }

  async findAllMarcas(): Promise<Marca[]> {
    return this.marcaRepository.find({
      order: { nome: 'ASC' },
    });
  }

  async findOneMarca(id: string): Promise<Marca> {
    const marca = await this.marcaRepository.findOne({ where: { id } });

    if (!marca) {
      throw new NotFoundException('Marca não encontrada');
    }

    return marca;
  }

  // ========== CATEGORIAS ==========

  async createCategoria(createCategoriaDto: CreateCategoriaDto): Promise<Categoria> {
    const categoria = this.categoriaRepository.create(createCategoriaDto);
    return this.categoriaRepository.save(categoria);
  }

  async findAllCategorias(): Promise<Categoria[]> {
    return this.categoriaRepository.find({
      relations: ['categoria_pai', 'subcategorias'],
      order: { nome: 'ASC' },
    });
  }

  async findOneCategoria(id: string): Promise<Categoria> {
    const categoria = await this.categoriaRepository.findOne({
      where: { id },
      relations: ['categoria_pai', 'subcategorias'],
    });

    if (!categoria) {
      throw new NotFoundException('Categoria não encontrada');
    }

    return categoria;
  }
}
