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
import { OcrAliasService } from '../product-classification/services/ocr-alias.service';

@Injectable()
export class ProdutosService {
  constructor(
    @InjectRepository(Produto)
    private readonly produtoRepository: Repository<Produto>,
    @InjectRepository(Marca)
    private readonly marcaRepository: Repository<Marca>,
    @InjectRepository(Categoria)
    private readonly categoriaRepository: Repository<Categoria>,
    private readonly ocrAliasService: OcrAliasService,
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

    // validateFoodProduct disponível para uso futuro — não aplicada na criação via SEFAZ/OCR

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
    }
    // Categoria agora é opcional para produtos alimentícios (especialmente para OCR)

    const produto = this.produtoRepository.create({
      ...createProdutoDto,
      tipo,
    });
    const saved = await this.produtoRepository.save(produto);

    // Normalizar nome OCR → nome_display em background (não bloqueia resposta)
    if (!saved.nome_display) {
      this.ocrAliasService
        .resolverNomeCanônico(saved.nome)
        .then((nomeDisplay) => {
          if (nomeDisplay && nomeDisplay !== saved.nome.toLowerCase()) {
            return this.produtoRepository.update(saved.id, { nome_display: nomeDisplay });
          }
        })
        .catch(() => {});
    }

    return saved;
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

  async pesquisarPreco(nome: string): Promise<{ loja: string; preco: number }[]> {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const puppeteer = require('puppeteer');
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
    });
    try {
      const page = await browser.newPage();
      await page.setUserAgent('Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
      await page.setExtraHTTPHeaders({ 'Accept-Language': 'pt-BR,pt;q=0.9' });

      const q = encodeURIComponent(`${nome} preço supermercado`);
      await page.goto(`https://www.google.com.br/search?q=${q}&tbm=shop&gl=br&hl=pt-BR`, {
        waitUntil: 'domcontentloaded',
        timeout: 12000,
      });

      const resultados: { loja: string; preco: number }[] = await page.evaluate(() => {
        const items: { loja: string; preco: number }[] = [];
        const seen = new Set<number>();

        // Google Shopping result cards
        document.querySelectorAll('.sh-dgr__gr-auto, .KZmu8e, .i0X6df').forEach((el: Element) => {
          const precoTexts = [
            el.querySelector('.a8Pemb')?.textContent,
            el.querySelector('.HRLxBb')?.textContent,
            el.querySelector('[aria-label]')?.getAttribute('aria-label'),
          ].filter(Boolean).join(' ');

          const lojaText = (
            el.querySelector('.E5ocAb')?.textContent ||
            el.querySelector('.aULzUe')?.textContent ||
            el.querySelector('.IuHnof')?.textContent ||
            'Supermercado'
          ).trim().slice(0, 40);

          const match = precoTexts.match(/R\$\s*([\d.]+,\d{2})/);
          if (match) {
            const preco = parseFloat(match[1].replace(/\./g, '').replace(',', '.'));
            if (!isNaN(preco) && preco > 0.1 && preco < 9999 && !seen.has(preco)) {
              seen.add(preco);
              items.push({ loja: lojaText || 'Supermercado', preco });
            }
          }
        });

        return items.slice(0, 6);
      });

      return resultados;
    } catch {
      return [];
    } finally {
      await browser.close();
    }
  }

  async buscarPorBarcode(codigo: string): Promise<{ titulo: string; descricao: string }[]> {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const https = require('https');
    const url = `https://www.google.com/search?q=${encodeURIComponent(codigo)}&hl=pt-BR&gl=br&num=8`;
    const html: string = await new Promise((resolve, reject) => {
      const req = https.get(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Linux; Android 13; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.6099.144 Mobile Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'pt-BR,pt;q=0.9',
          'Accept-Encoding': 'identity',
        },
      }, (res: any) => {
        let data = '';
        res.on('data', (chunk: any) => data += chunk);
        res.on('end', () => resolve(data));
      });
      req.on('error', reject);
      req.setTimeout(10000, () => { req.destroy(); reject(new Error('timeout')); });
    });

    // CAPTCHA check
    if (html.includes('/sorry/index')) return [];

    const resultados: { titulo: string; descricao: string }[] = [];
    // Extrair títulos e snippets dos resultados orgânicos
    const blocos = html.match(/<h3[^>]*>(.*?)<\/h3>/gs) || [];
    for (const bloco of blocos) {
      const titulo = bloco.replace(/<[^>]+>/g, '').trim();
      if (titulo.length > 5) {
        resultados.push({ titulo, descricao: '' });
      }
      if (resultados.length >= 6) break;
    }

    return resultados;
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

  async findOrCreateMarca(nome: string): Promise<Marca> {
    let marca = await this.marcaRepository.findOne({
      where: { nome },
    });

    if (!marca) {
      marca = this.marcaRepository.create({ nome });
      marca = await this.marcaRepository.save(marca);
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

  async findOrCreateCategoria(nome: string): Promise<Categoria> {
    let categoria = await this.categoriaRepository.findOne({
      where: { nome },
    });

    if (!categoria) {
      categoria = this.categoriaRepository.create({ nome });
      categoria = await this.categoriaRepository.save(categoria);
    }

    return categoria;
  }
}
