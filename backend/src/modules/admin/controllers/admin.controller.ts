import { Controller, Get, Query, UseInterceptors } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { CacheInterceptor, CacheTTL } from '@nestjs/cache-manager';
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

  @Get('usuarios')
  @ApiOperation({
    summary: 'Listar usuários com filtros e paginação (Admin)',
    description:
      'Retorna lista de usuários com informações de perfil. Suporta busca, filtros por role e paginação.',
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de usuários com informações paginadas',
  })
  @ApiResponse({ status: 401, description: 'Não autenticado' })
  async listUsers(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 20,
    @Query('search') search?: string,
    @Query('role') role?: string,
  ) {
    return this.adminService.listUsers(page, limit, { search, role });
  }

  @Get('usuarios/stats')
  @ApiOperation({
    summary: 'Obter estatísticas de usuários (Admin)',
    description:
      'Retorna total de usuários, distribuição por role e usuários ativos',
  })
  @ApiResponse({
    status: 200,
    description: 'Estatísticas de usuários',
  })
  @ApiResponse({ status: 401, description: 'Não autenticado' })
  async getUserStats() {
    return this.adminService.getUserStats();
  }

  @Get('dashboard/stats')
  @UseInterceptors(CacheInterceptor)
  @CacheTTL(180) // 3 minutos
  @ApiOperation({
    summary: 'Obter estatísticas gerais do dashboard (Admin)',
    description:
      'Retorna estatísticas consolidadas: usuários, produtos, receitas, compras',
  })
  @ApiResponse({
    status: 200,
    description: 'Estatísticas gerais do dashboard',
  })
  @ApiResponse({ status: 401, description: 'Não autenticado' })
  async getDashboardStats() {
    return this.adminService.getDashboardStats();
  }
}
