import { Controller, Get, Query } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { AdminService } from '../services/admin.service';
import { ListProductsQueryDto } from '../dto/list-products-query.dto';
import { ListProductsResponseDto } from '../dto/product-list.dto';

@ApiTags('Admin')
@ApiBearerAuth()
@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('produtos')
  @ApiOperation({
    summary: 'Listar produtos com filtros e paginação (Admin)',
    description:
      'Retorna lista de produtos com informações de categoria e marca. Suporta busca, filtros e paginação.',
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de produtos com informações paginadas',
    type: ListProductsResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Não autenticado' })
  async listProducts(
    @Query() query: ListProductsQueryDto,
  ): Promise<ListProductsResponseDto> {
    return this.adminService.listProducts(query);
  }

  @Get('produtos/stats')
  @ApiOperation({
    summary: 'Obter estatísticas de produtos (Admin)',
    description:
      'Retorna total de produtos, distribuição por categoria e marcas mais usadas',
  })
  @ApiResponse({
    status: 200,
    description: 'Estatísticas de produtos',
  })
  @ApiResponse({ status: 401, description: 'Não autenticado' })
  async getProductStats() {
    return this.adminService.getProductStats();
  }
}
