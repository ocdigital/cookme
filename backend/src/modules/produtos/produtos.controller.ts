import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
  UseInterceptors,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { CacheInterceptor, CacheTTL } from '@nestjs/cache-manager';
import { ProdutosService } from './produtos.service';
import { ProductImageService } from './services/product-image.service';
import { Produto } from './entities/produto.entity';
import { Marca } from './entities/marca.entity';
import { Categoria } from './entities/categoria.entity';
import { CreateProdutoDto } from './dto/create-produto.dto';
import { UpdateProdutoDto } from './dto/update-produto.dto';
import { CreateMarcaDto } from './dto/create-marca.dto';
import { CreateCategoriaDto } from './dto/create-categoria.dto';

@ApiTags('Produtos')
@ApiBearerAuth()
@Controller('produtos')
export class ProdutosController {
  constructor(
    private readonly produtosService: ProdutosService,
    private readonly productImageService: ProductImageService,
  ) {}

  // ========== PRODUTOS ==========

  @Post()
  @ApiOperation({ summary: 'Criar novo produto' })
  @ApiResponse({
    status: 201,
    description: 'Produto criado com sucesso',
    type: Produto,
  })
  @ApiResponse({ status: 409, description: 'Código de barras já cadastrado' })
  async create(@Body() createProdutoDto: CreateProdutoDto): Promise<Produto> {
    return this.produtosService.create(createProdutoDto);
  }

  @Get()
  @UseInterceptors(CacheInterceptor)
  @CacheTTL(300) // 5 minutos
  @ApiOperation({ summary: 'Listar produtos' })
  @ApiQuery({ name: 'search', required: false, description: 'Buscar por nome' })
  @ApiQuery({ name: 'categoriaId', required: false, description: 'Filtrar por categoria' })
  @ApiQuery({ name: 'page', required: false, description: 'Página (padrão: 1)' })
  @ApiQuery({ name: 'limit', required: false, description: 'Itens por página (padrão: 50)' })
  @ApiResponse({
    status: 200,
    description: 'Lista paginada de produtos',
  })
  async findAll(
    @Query('search') search?: string,
    @Query('categoriaId') categoriaId?: string,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 50,
  ) {
    return this.produtosService.findAll(search, categoriaId, +page, +limit);
  }

  @Get('search')
  @UseInterceptors(CacheInterceptor)
  @CacheTTL(600) // 10 minutos
  @ApiOperation({ summary: 'Buscar produtos para autocomplete (typeahead)' })
  @ApiQuery({
    name: 'q',
    required: true,
    description: 'Termo de busca (mínimo 2 caracteres)',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    description: 'Limite de resultados (padrão: 10)',
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de produtos para autocomplete',
  })
  async searchProducts(
    @Query('q') query: string,
    @Query('limit') limit: number = 10,
  ) {
    return this.produtosService.searchForAutocomplete(query, limit);
  }

  @Post(':id/fetch-image')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Buscar e salvar imagem de produto' })
  @ApiResponse({
    status: 200,
    description: 'Imagem encontrada e salva',
    type: Produto,
  })
  @ApiResponse({ status: 404, description: 'Produto não encontrado' })
  async fetchProductImage(@Param('id') id: string): Promise<Produto | null> {
    return this.productImageService.fetchAndSaveProductImage(id);
  }

  @Get('pesquisar-preco')
  @ApiOperation({ summary: 'Pesquisar preço de produto em sites de comparação' })
  @ApiQuery({ name: 'nome', required: true })
  async pesquisarPreco(@Query('nome') nome: string) {
    return this.produtosService.pesquisarPreco(nome);
  }

  @Get('buscar-barcode')
  @ApiOperation({ summary: 'Buscar informações de produto pelo código de barras no Google' })
  @ApiQuery({ name: 'codigo', required: true })
  async buscarPorBarcode(@Query('codigo') codigo: string) {
    return this.produtosService.buscarPorBarcode(codigo);
  }

  @Get('barcode/:codigo')
  @ApiOperation({ summary: 'Buscar produto por código de barras' })
  @ApiResponse({
    status: 200,
    description: 'Produto encontrado',
    type: Produto,
  })
  @ApiResponse({ status: 404, description: 'Produto não encontrado' })
  async findByBarcode(@Param('codigo') codigo: string): Promise<Produto | null> {
    return this.produtosService.findByBarcode(codigo);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Buscar produto por ID' })
  @ApiResponse({
    status: 200,
    description: 'Produto encontrado',
    type: Produto,
  })
  @ApiResponse({ status: 404, description: 'Produto não encontrado' })
  async findOne(@Param('id') id: string): Promise<Produto> {
    return this.produtosService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Atualizar produto' })
  @ApiResponse({
    status: 200,
    description: 'Produto atualizado com sucesso',
    type: Produto,
  })
  @ApiResponse({ status: 404, description: 'Produto não encontrado' })
  async update(
    @Param('id') id: string,
    @Body() updateProdutoDto: UpdateProdutoDto,
  ): Promise<Produto> {
    return this.produtosService.update(id, updateProdutoDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Deletar produto' })
  @ApiResponse({ status: 204, description: 'Produto deletado com sucesso' })
  @ApiResponse({ status: 404, description: 'Produto não encontrado' })
  async remove(@Param('id') id: string): Promise<void> {
    return this.produtosService.remove(id);
  }

  // ========== MARCAS ==========

  @Post('marcas')
  @ApiOperation({ summary: 'Criar nova marca' })
  @ApiResponse({
    status: 201,
    description: 'Marca criada com sucesso',
    type: Marca,
  })
  @ApiResponse({ status: 409, description: 'Marca já cadastrada' })
  async createMarca(@Body() createMarcaDto: CreateMarcaDto): Promise<Marca> {
    return this.produtosService.createMarca(createMarcaDto);
  }

  @Get('marcas/all')
  @UseInterceptors(CacheInterceptor)
  @CacheTTL(600) // 10 minutos
  @ApiOperation({ summary: 'Listar todas as marcas' })
  @ApiResponse({
    status: 200,
    description: 'Lista de marcas',
    type: [Marca],
  })
  async findAllMarcas(): Promise<Marca[]> {
    return this.produtosService.findAllMarcas();
  }

  @Get('marcas/:id')
  @ApiOperation({ summary: 'Buscar marca por ID' })
  @ApiResponse({
    status: 200,
    description: 'Marca encontrada',
    type: Marca,
  })
  @ApiResponse({ status: 404, description: 'Marca não encontrada' })
  async findOneMarca(@Param('id') id: string): Promise<Marca> {
    return this.produtosService.findOneMarca(id);
  }

  // ========== CATEGORIAS ==========

  @Post('categorias')
  @ApiOperation({ summary: 'Criar nova categoria' })
  @ApiResponse({
    status: 201,
    description: 'Categoria criada com sucesso',
    type: Categoria,
  })
  async createCategoria(
    @Body() createCategoriaDto: CreateCategoriaDto,
  ): Promise<Categoria> {
    return this.produtosService.createCategoria(createCategoriaDto);
  }

  @Get('categorias/all')
  @UseInterceptors(CacheInterceptor)
  @CacheTTL(600) // 10 minutos
  @ApiOperation({ summary: 'Listar todas as categorias' })
  @ApiResponse({
    status: 200,
    description: 'Lista de categorias (com hierarquia)',
    type: [Categoria],
  })
  async findAllCategorias(): Promise<Categoria[]> {
    return this.produtosService.findAllCategorias();
  }

  @Get('categorias/:id')
  @ApiOperation({ summary: 'Buscar categoria por ID' })
  @ApiResponse({
    status: 200,
    description: 'Categoria encontrada',
    type: Categoria,
  })
  @ApiResponse({ status: 404, description: 'Categoria não encontrada' })
  async findOneCategoria(@Param('id') id: string): Promise<Categoria> {
    return this.produtosService.findOneCategoria(id);
  }
}
