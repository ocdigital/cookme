import { Controller, Get, Post, Patch, Delete, Query, Body, Param, UseInterceptors, HttpCode, HttpStatus } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { CacheInterceptor, CacheTTL } from '@nestjs/cache-manager';
import { AdminService } from '../services/admin.service';
import { UsuariosService } from '../../usuarios/usuarios.service';
import { ListProductsQueryDto } from '../dto/list-products-query.dto';
import { ListProductsResponseDto } from '../dto/product-list.dto';
import { CreateUsuarioDto } from '../../usuarios/dto/create-usuario.dto';
import { UpdateUsuarioDto } from '../../usuarios/dto/update-usuario.dto';
import { Usuario } from '../../usuarios/entities/usuario.entity';

@ApiTags('Admin')
@ApiBearerAuth()
@Controller('admin')
export class AdminController {
  constructor(
    private readonly adminService: AdminService,
    private readonly usuariosService: UsuariosService,
  ) {}

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

  @Post('usuarios')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Criar novo usuário (Admin)',
    description: 'Cria um novo usuário no sistema com os dados fornecidos',
  })
  @ApiResponse({
    status: 201,
    description: 'Usuário criado com sucesso',
    type: Usuario,
  })
  @ApiResponse({ status: 401, description: 'Não autenticado' })
  @ApiResponse({ status: 409, description: 'Email já cadastrado' })
  async createUser(@Body() createUsuarioDto: CreateUsuarioDto): Promise<Usuario> {
    return this.usuariosService.create(createUsuarioDto);
  }

  @Patch('usuarios/:id')
  @ApiOperation({
    summary: 'Atualizar usuário (Admin)',
    description: 'Atualiza informações de um usuário existente',
  })
  @ApiResponse({
    status: 200,
    description: 'Usuário atualizado com sucesso',
    type: Usuario,
  })
  @ApiResponse({ status: 401, description: 'Não autenticado' })
  @ApiResponse({ status: 404, description: 'Usuário não encontrado' })
  async updateUser(
    @Param('id') id: string,
    @Body() updateUsuarioDto: UpdateUsuarioDto,
  ): Promise<Usuario> {
    return this.usuariosService.update(id, updateUsuarioDto);
  }

  @Delete('usuarios/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Deletar usuário (Admin)',
    description: 'Remove um usuário do sistema',
  })
  @ApiResponse({
    status: 204,
    description: 'Usuário deletado com sucesso',
  })
  @ApiResponse({ status: 401, description: 'Não autenticado' })
  @ApiResponse({ status: 404, description: 'Usuário não encontrado' })
  async deleteUser(@Param('id') id: string): Promise<void> {
    return this.usuariosService.delete(id);
  }

  @Get('receitas')
  @ApiOperation({
    summary: 'Listar receitas com filtros e moderação (Admin)',
    description:
      'Retorna lista de receitas com informações de moderação (denúncias, status). Suporta busca, filtros por dificuldade/categoria e paginação.',
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de receitas com informações de moderação',
  })
  @ApiResponse({ status: 401, description: 'Não autenticado' })
  async listRecipes(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 20,
    @Query('search') search?: string,
    @Query('dificuldade') dificuldade?: string,
    @Query('categoria') categoria?: string,
  ) {
    return this.adminService.listRecipes(page, limit, {
      search,
      dificuldade,
      categoria,
    });
  }

  @Patch('receitas/:id/moderacao')
  @ApiOperation({
    summary: 'Atualizar status de moderação de receita (Admin)',
    description:
      'Altera o status de moderação de uma receita (ok, em_revisao, arquivado)',
  })
  @ApiResponse({
    status: 200,
    description: 'Status de moderação atualizado com sucesso',
  })
  @ApiResponse({ status: 401, description: 'Não autenticado' })
  @ApiResponse({ status: 404, description: 'Receita não encontrada' })
  async atualizarModeracaoReceita(
    @Param('id') id: string,
    @Body('status') status: 'ok' | 'em_revisao' | 'arquivado',
  ) {
    return this.adminService.atualizarModeracaoReceita(id, status);
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
