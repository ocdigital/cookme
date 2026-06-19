import {
  Controller,
  Get,
  Post,
  Put,
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
import { ReceitasService } from './receitas.service';
import { IAReceitasService } from './services/ia-receitas.service';
import { RecipeCrawlerService } from './services/recipe-crawler.service';
import { CurrentUser } from '@common/decorators/current-user.decorator';
import { Public } from '@common/decorators/public.decorator';
import { Usuario } from '../usuarios/entities/usuario.entity';
import { Receita } from './entities/receita.entity';
import { ReceitaExecutada } from './entities/receita-executada.entity';
import { CreateReceitaDto } from './dto/create-receita.dto';
import { UpdateReceitaDto } from './dto/update-receita.dto';
import { ExecutarReceitaDto } from './dto/executar-receita.dto';

@ApiTags('Receitas')
@ApiBearerAuth()
@Controller('receitas')
export class ReceitasController {
  constructor(
    private readonly receitasService: ReceitasService,
    private readonly iaReceitasService: IAReceitasService,
    private readonly crawlerService: RecipeCrawlerService,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Criar nova receita' })
  @ApiResponse({
    status: 201,
    description: 'Receita criada com sucesso',
    type: Receita,
  })
  async create(@Body() createReceitaDto: CreateReceitaDto): Promise<Receita> {
    return this.receitasService.create(createReceitaDto);
  }

  @Get()
  @UseInterceptors(CacheInterceptor)
  @CacheTTL(300) // 5 minutos
  @ApiOperation({ summary: 'Listar receitas com filtros' })
  @ApiQuery({ name: 'search', required: false, description: 'Buscar por nome' })
  @ApiQuery({ name: 'dificuldade', required: false, description: 'Filtrar por dificuldade' })
  @ApiQuery({ name: 'categoria', required: false, description: 'Filtrar por categoria' })
  @ApiQuery({ name: 'tags_dieta', required: false, description: 'Filtrar por tags de dieta (array)' })
  @ApiQuery({ name: 'page', required: false, description: 'Página (padrão: 1)' })
  @ApiQuery({ name: 'limit', required: false, description: 'Itens por página (padrão: 20)' })
  @ApiResponse({
    status: 200,
    description: 'Lista paginada de receitas',
  })
  async findAll(
    @Query('search') search?: string,
    @Query('dificuldade') dificuldade?: string,
    @Query('categoria') categoria?: string,
    @Query('tags_dieta') tags_dieta?: string | string[],
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 20,
  ) {
    const tagsArray = tags_dieta
      ? Array.isArray(tags_dieta)
        ? tags_dieta
        : [tags_dieta]
      : undefined;

    return this.receitasService.findAll(
      {
        search,
        dificuldade,
        categoria,
        tags_dieta: tagsArray,
      },
      +page,
      +limit,
    );
  }

  @Get('sugestoes')
  @ApiOperation({ summary: 'Motor MOI - Sugestões inteligentes de receitas' })
  @ApiResponse({
    status: 200,
    description: 'Receitas sugeridas baseadas em inventário, preferências e histórico',
    type: [Receita],
  })
  async sugestoes(@CurrentUser() user: Usuario): Promise<Receita[]> {
    return this.receitasService.sugerirReceitas(user.id);
  }

  @Get('sugestoes/por-inventario')
  @ApiOperation({ summary: 'Sugestões - Receitas que pode fazer com o inventário' })
  @ApiResponse({
    status: 200,
    description: 'Receitas que podem ser feitas com produtos disponíveis',
    type: [Receita],
  })
  async sugestoesPorInventario(@CurrentUser() user: Usuario): Promise<Receita[]> {
    return this.receitasService.sugestoesPorInventario(user.id);
  }

  @Get('sugestoes/similares')
  @ApiOperation({ summary: 'Sugestões - Receitas similares às que você gostou' })
  @ApiResponse({
    status: 200,
    description: 'Receitas similares baseadas em receitas bem avaliadas',
    type: [Receita],
  })
  async sugestoesSimilares(@CurrentUser() user: Usuario): Promise<Receita[]> {
    return this.receitasService.sugestoesSimilares(user.id);
  }

  @Get('favoritas')
  @ApiOperation({ summary: 'Listar receitas favoritas do usuário' })
  @ApiResponse({
    status: 200,
    description: 'Receitas marcadas como favoritas',
    type: [Receita],
  })
  async favoritas(@CurrentUser() user: Usuario): Promise<Receita[]> {
    return this.receitasService.findFavoritas(user.id);
  }

  @Get('executadas')
  @ApiOperation({ summary: 'Histórico de receitas executadas' })
  @ApiResponse({
    status: 200,
    description: 'Receitas executadas pelo usuário',
    type: [ReceitaExecutada],
  })
  async executadas(@CurrentUser() user: Usuario): Promise<ReceitaExecutada[]> {
    return this.receitasService.findExecutadas(user.id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Buscar receita por ID' })
  @ApiResponse({
    status: 200,
    description: 'Receita encontrada',
    type: Receita,
  })
  @ApiResponse({ status: 404, description: 'Receita não encontrada' })
  async findOne(@Param('id') id: string): Promise<Receita> {
    return this.receitasService.findOne(id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Atualizar receita' })
  @ApiResponse({
    status: 200,
    description: 'Receita atualizada com sucesso',
    type: Receita,
  })
  @ApiResponse({ status: 404, description: 'Receita não encontrada' })
  async update(
    @Param('id') id: string,
    @Body() updateReceitaDto: UpdateReceitaDto,
  ): Promise<Receita> {
    return this.receitasService.update(id, updateReceitaDto);
  }

  @Post(':id/favorita')
  @ApiOperation({ summary: 'Marcar receita como favorita' })
  @ApiResponse({
    status: 201,
    description: 'Receita marcada como favorita',
    type: Receita,
  })
  async marcarFavorita(
    @CurrentUser() user: Usuario,
    @Param('id') id: string,
  ): Promise<Receita> {
    return this.receitasService.marcarComoFavorita(id, user.id);
  }

  @Delete(':id/favorita')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remover receita dos favoritos' })
  @ApiResponse({ status: 204, description: 'Receita removida dos favoritos' })
  async removerFavorita(
    @CurrentUser() user: Usuario,
    @Param('id') id: string,
  ): Promise<void> {
    return this.receitasService.removerDeFavorita(id, user.id);
  }

  @Post(':id/executar')
  @ApiOperation({ summary: 'Marcar receita como executada' })
  @ApiResponse({
    status: 201,
    description: 'Receita marcada como executada',
    type: ReceitaExecutada,
  })
  async executar(
    @CurrentUser() user: Usuario,
    @Param('id') id: string,
    @Body() executarDto: ExecutarReceitaDto,
  ): Promise<ReceitaExecutada> {
    return this.receitasService.executar(id, user.id, executarDto);
  }

  @Post('buscar-novas')
  @ApiOperation({ summary: 'Scrapa sites com ingredientes do usuário e salva novas receitas no banco' })
  @ApiResponse({ status: 201, description: 'Novas receitas encontradas/baixadas' })
  async buscarNovas(
    @Body() body: { ingredientes: string[] },
  ): Promise<{ novas: number; ingredientes: string[] }> {
    const resultado = await this.crawlerService.crawlearManual(body.ingredientes);
    return { novas: resultado.totalSalvas, ingredientes: resultado.ingredientes };
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Deletar receita' })
  @ApiResponse({ status: 204, description: 'Receita deletada com sucesso' })
  @ApiResponse({ status: 404, description: 'Receita não encontrada' })
  async remove(@Param('id') id: string): Promise<void> {
    return this.receitasService.remove(id);
  }

  @Public()
  @Post('gerar-com-ia')
  @ApiOperation({ summary: 'Gerar receita com IA baseada em ingredientes' })
  @ApiResponse({ status: 201, description: 'Receita gerada com sucesso' })
  async gerarComIA(@Body() body: { ingredientes: string[] }): Promise<Receita> {
    return this.iaReceitasService.gerarESalvarReceita(body.ingredientes);
  }

  @Public()
  @Post('gerar-do-inventario')
  @ApiOperation({ summary: 'Gerar receita com produtos do banco de dados' })
  @ApiResponse({ status: 201, description: 'Receita gerada com sucesso' })
  async gerarDoInventario(): Promise<Receita> {
    return this.iaReceitasService.gerarReceitaDoInventario();
  }

  @Public()
  @Post('gerar-semana')
  @ApiOperation({ summary: 'Gerar 21 receitas (3 por dia da semana)' })
  @ApiResponse({ status: 201, description: 'Receitas da semana geradas' })
  async gerarSemana(): Promise<{ total: number; receitas: Receita[] }> {
    const receitas = await this.iaReceitasService.gerarReceitasSemana();
    return { total: receitas.length, receitas };
  }
}
