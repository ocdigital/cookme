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

@Injectable()
export class ProdutosService {
  constructor(
    @InjectRepository(Produto)
    private readonly produtoRepository: Repository<Produto>,
    @InjectRepository(Marca)
    private readonly marcaRepository: Repository<Marca>,
    @InjectRepository(Categoria)
    private readonly categoriaRepository: Repository<Categoria>,
  ) {}

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

    // Validar se a categoria é de alimentos (quando fornecida)
    if (createProdutoDto.categoria_id) {
      const categoria = await this.categoriaRepository.findOne({
        where: { id: createProdutoDto.categoria_id },
      });

      if (!categoria) {
        throw new NotFoundException('Categoria não encontrada');
      }

      if (!categoria.is_food) {
        throw new BadRequestException(
          'Apenas produtos de categorias de alimentos são permitidos',
        );
      }
    }

    const produto = this.produtoRepository.create(createProdutoDto);
    return this.produtoRepository.save(produto);
  }

  async findAll(search?: string, categoriaId?: string): Promise<Produto[]> {
    const where: any = {};

    if (search) {
      where.nome = Like(`%${search}%`);
    }

    if (categoriaId) {
      where.categoria_id = categoriaId;
    }

    return this.produtoRepository.find({
      where,
      relations: ['marca', 'categoria'],
      take: 50, // Limite de resultados
    });
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
