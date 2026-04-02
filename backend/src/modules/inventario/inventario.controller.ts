import {
  Controller,
  Get,
  Post,
  Patch,
  Put,
  Delete,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { InventarioService } from './inventario.service';
import { CurrentUser } from '@common/decorators/current-user.decorator';
import { Usuario } from '../usuarios/entities/usuario.entity';
import { Inventario } from './entities/inventario.entity';
import { CreateInventarioDto } from './dto/create-inventario.dto';
import { UpdateInventarioDto } from './dto/update-inventario.dto';

@ApiTags('Inventario')
@ApiBearerAuth()
@Controller('inventario')
export class InventarioController {
  constructor(private readonly inventarioService: InventarioService) {}

  @Post()
  @ApiOperation({ summary: 'Adicionar item ao inventário' })
  @ApiResponse({
    status: 201,
    description: 'Item adicionado com sucesso',
    type: Inventario,
  })
  async create(
    @CurrentUser() user: Usuario,
    @Body() createInventarioDto: CreateInventarioDto,
  ): Promise<Inventario> {
    return this.inventarioService.create(user.id, createInventarioDto);
  }

  @Get()
  @ApiOperation({ summary: 'Listar inventário com detalhes de produtos' })
  @ApiQuery({
    name: 'ingrediente_receita',
    required: false,
    type: Boolean,
    description: 'Filtrar apenas ingredientes de receita (true/false)',
  })
  @ApiResponse({
    status: 200,
    description: 'Lista do inventário enriquecida com detalhes de classificação',
  })
  async findAll(
    @CurrentUser() user: Usuario,
    @Query('ingrediente_receita') ingrediente_receita?: string,
  ): Promise<any> {
    return this.inventarioService.findAllWithProductDetails(
      user.id,
      ingrediente_receita === 'true' ? true : ingrediente_receita === 'false' ? false : undefined,
    );
  }

  @Get('stats')
  @ApiOperation({ summary: 'Estatísticas do inventário' })
  @ApiResponse({ status: 200, description: 'Estatísticas calculadas' })
  async getStats(@CurrentUser() user: Usuario) {
    return this.inventarioService.getStats(user.id);
  }

  @Get('vencendo')
  @ApiOperation({ summary: 'Listar itens vencendo em breve' })
  @ApiQuery({ name: 'days', required: false, description: 'Dias até vencimento (padrão: 7)' })
  @ApiResponse({
    status: 200,
    description: 'Itens vencendo',
    type: [Inventario],
  })
  async findExpiringSoon(
    @CurrentUser() user: Usuario,
    @Query('days') days?: number,
  ): Promise<Inventario[]> {
    return this.inventarioService.findExpiringSoon(user.id, days);
  }

  @Get('vencidos')
  @ApiOperation({ summary: 'Listar itens vencidos' })
  @ApiResponse({
    status: 200,
    description: 'Itens vencidos',
    type: [Inventario],
  })
  async findExpired(@CurrentUser() user: Usuario): Promise<Inventario[]> {
    return this.inventarioService.findExpired(user.id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Buscar item por ID' })
  @ApiResponse({
    status: 200,
    description: 'Item encontrado',
    type: Inventario,
  })
  @ApiResponse({ status: 404, description: 'Item não encontrado' })
  async findOne(
    @CurrentUser() user: Usuario,
    @Param('id') id: string,
  ): Promise<Inventario> {
    return this.inventarioService.findOne(id, user.id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Atualizar item do inventário' })
  @ApiResponse({
    status: 200,
    description: 'Item atualizado com sucesso',
  })
  @ApiResponse({ status: 404, description: 'Item não encontrado' })
  async updatePut(
    @CurrentUser() user: Usuario,
    @Param('id') id: string,
    @Body() updateInventarioDto: UpdateInventarioDto,
  ): Promise<any> {
    return this.inventarioService.updateWithProductDetails(id, user.id, updateInventarioDto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Atualizar item do inventário (PATCH)' })
  @ApiResponse({
    status: 200,
    description: 'Item atualizado com sucesso',
    type: Inventario,
  })
  @ApiResponse({ status: 404, description: 'Item não encontrado' })
  async update(
    @CurrentUser() user: Usuario,
    @Param('id') id: string,
    @Body() updateInventarioDto: UpdateInventarioDto,
  ): Promise<Inventario> {
    return this.inventarioService.update(id, user.id, updateInventarioDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remover item do inventário' })
  @ApiResponse({ status: 204, description: 'Item removido com sucesso' })
  @ApiResponse({ status: 404, description: 'Item não encontrado' })
  async remove(
    @CurrentUser() user: Usuario,
    @Param('id') id: string,
  ): Promise<void> {
    return this.inventarioService.remove(id, user.id);
  }
}
