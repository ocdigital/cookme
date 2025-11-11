import {
  Controller,
  Get,
  Post,
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
import { ComprasService } from './compras.service';
import { CurrentUser } from '@common/decorators/current-user.decorator';
import { Usuario } from '../usuarios/entities/usuario.entity';
import { Compra } from './entities/compra.entity';
import { CreateCompraDto } from './dto/create-compra.dto';

@ApiTags('Compras')
@ApiBearerAuth()
@Controller('compras')
export class ComprasController {
  constructor(private readonly comprasService: ComprasService) {}

  @Post()
  @ApiOperation({ summary: 'Criar nova compra com itens' })
  @ApiResponse({
    status: 201,
    description: 'Compra criada com sucesso',
    type: Compra,
  })
  async create(
    @CurrentUser() user: Usuario,
    @Body() createCompraDto: CreateCompraDto,
  ): Promise<Compra> {
    return this.comprasService.create(user.id, createCompraDto);
  }

  @Get()
  @ApiOperation({ summary: 'Listar compras do usuário' })
  @ApiQuery({ name: 'limit', required: false, description: 'Limite de resultados' })
  @ApiResponse({
    status: 200,
    description: 'Lista de compras',
    type: [Compra],
  })
  async findAll(
    @CurrentUser() user: Usuario,
    @Query('limit') limit?: number,
  ): Promise<Compra[]> {
    return this.comprasService.findAll(user.id, limit);
  }

  @Get('stats')
  @ApiOperation({ summary: 'Estatísticas de compras do usuário' })
  @ApiResponse({
    status: 200,
    description: 'Estatísticas calculadas',
  })
  async getStats(@CurrentUser() user: Usuario) {
    return this.comprasService.getStats(user.id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Buscar compra por ID' })
  @ApiResponse({
    status: 200,
    description: 'Compra encontrada',
    type: Compra,
  })
  @ApiResponse({ status: 404, description: 'Compra não encontrada' })
  async findOne(
    @CurrentUser() user: Usuario,
    @Param('id') id: string,
  ): Promise<Compra> {
    return this.comprasService.findOne(id, user.id);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Deletar compra' })
  @ApiResponse({ status: 204, description: 'Compra deletada com sucesso' })
  @ApiResponse({ status: 404, description: 'Compra não encontrada' })
  async remove(
    @CurrentUser() user: Usuario,
    @Param('id') id: string,
  ): Promise<void> {
    return this.comprasService.remove(id, user.id);
  }
}
