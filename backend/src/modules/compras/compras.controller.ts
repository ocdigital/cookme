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
  BadRequestException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { ComprasService } from './compras.service';
import { SubscriptionService } from '../affiliate/services/subscription.service';
import { CurrentUser } from '@common/decorators/current-user.decorator';
import { Usuario } from '../usuarios/entities/usuario.entity';
import { Compra } from './entities/compra.entity';
import { CreateCompraDto } from './dto/create-compra.dto';

@ApiTags('Compras')
@ApiBearerAuth()
@Controller('compras')
export class ComprasController {
  constructor(
    private readonly comprasService: ComprasService,
    private readonly subscriptionService: SubscriptionService,
  ) {}

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
  @ApiResponse({ status: 200, description: 'Lista de compras', type: [Compra] })
  async findAll(
    @CurrentUser() user: Usuario,
    @Query('limit') limit?: number,
    @Query('mes') mes?: number,
    @Query('ano') ano?: number,
  ): Promise<Compra[]> {
    return this.comprasService.findAll(user.id, limit, mes ? Number(mes) : undefined, ano ? Number(ano) : undefined);
  }

  @Get('stats')
  @ApiOperation({ summary: 'Estatísticas de compras do usuário' })
  @ApiResponse({ status: 200, description: 'Estatísticas calculadas' })
  async getStats(@CurrentUser() user: Usuario) {
    return this.comprasService.getStats(user.id);
  }

  @Get('resumo-mes')
  @ApiOperation({ summary: 'Resumo de gastos de um mês específico' })
  @ApiResponse({ status: 200, description: 'Gastos do mês' })
  async resumoMes(
    @CurrentUser() user: Usuario,
    @Query('mes') mes?: number,
    @Query('ano') ano?: number,
  ) {
    return this.comprasService.resumoMes(user.id, mes ? Number(mes) : undefined, ano ? Number(ano) : undefined);
  }

  @Post('ocr-cupom')
  @ApiOperation({ summary: 'Extrair itens de cupom fiscal via OCR' })
  @ApiResponse({ status: 200, description: 'Itens extraídos com sucesso' })
  async ocrCupom(
    @CurrentUser() user: Usuario,
    @Body() body: { image_base64: string; image_type: string },
  ) {
    if (!body.image_base64) {
      throw new BadRequestException('Imagem em base64 é obrigatória');
    }
    await this.subscriptionService.registrarUso(user.id, 'ocr');
    return this.comprasService.extrairItensCupom(body.image_base64);
  }

  @Post('ocr-cupom/salvar-itens')
  @ApiOperation({ summary: 'Salvar itens extraídos do cupom no inventário' })
  @ApiResponse({
    status: 201,
    description: 'Itens salvos no inventário com sucesso',
  })
  async salvarItensCupom(
    @CurrentUser() user: Usuario,
    @Body()
    body: {
      itens: Array<{
        nome: string;
        quantidade?: number;
        valor?: number;
        codigo_barras?: string;
      }>;
      estabelecimento?: {
        nome?: string;
      };
    },
  ) {
    if (!body.itens || body.itens.length === 0) {
      throw new BadRequestException('Pelo menos um item é obrigatório');
    }

    await this.subscriptionService.registrarUso(user.id, 'ocr');
    return this.comprasService.salvarItensCupomNoInventario(user.id, body.itens, body.estabelecimento?.nome);
  }

  @Post('ocr-validade')
  @ApiOperation({ summary: 'Extrair data de validade via OCR' })
  @ApiResponse({
    status: 200,
    description: 'Data extraída com sucesso',
  })
  async ocrValidade(@Body() body: { image_base64?: string }) {
    if (!body.image_base64) {
      throw new BadRequestException('Imagem em base64 é obrigatória');
    }

    return this.comprasService.extrairDataValidade(body.image_base64);
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
