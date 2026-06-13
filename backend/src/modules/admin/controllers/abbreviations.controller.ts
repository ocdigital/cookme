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
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { AbbreviationService } from '@modules/product-classification/services/abbreviation.service';

@ApiTags('Admin - Abreviações')
@ApiBearerAuth()
@Controller('admin/abbreviations')
export class AbbreviationsAdminController {
  constructor(private readonly abbreviationService: AbbreviationService) {}

  @Get()
  @ApiOperation({ summary: 'Listar abreviações com filtros e paginação' })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'tipo', required: false, enum: ['all', 'ingrediente', 'nao_ingrediente'] })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  async findAll(
    @Query('search') search?: string,
    @Query('tipo') tipo?: 'all' | 'ingrediente' | 'nao_ingrediente',
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 50,
  ) {
    return this.abbreviationService.findAll({ search, tipo, page: +page, limit: +limit });
  }

  @Post()
  @ApiOperation({ summary: 'Criar nova abreviação' })
  async create(
    @Body() dto: { abbr: string; expanded: string; is_ingredient: boolean; categoria?: string },
  ) {
    return this.abbreviationService.create(dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Atualizar abreviação' })
  async update(
    @Param('id') id: string,
    @Body() dto: Partial<{ abbr: string; expanded: string; is_ingredient: boolean; categoria: string; is_active: boolean }>,
  ) {
    return this.abbreviationService.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Deletar abreviação' })
  async remove(@Param('id') id: string) {
    return this.abbreviationService.remove(id);
  }

  @Post('reload-cache')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Recarregar cache de abreviações em memória' })
  async reloadCache() {
    await this.abbreviationService.reloadCache();
    return { message: 'Cache recarregado' };
  }
}
