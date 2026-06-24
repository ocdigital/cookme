import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  UseGuards,
  Req,
} from '@nestjs/common';
import { ListaService } from '../services/lista.service';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { CreateListaDto } from '../dto/create-lista.dto';
import { UpdateListaDto } from '../dto/update-lista.dto';
import { CreateItemListaDto } from '../dto/create-item-lista.dto';
import { UpdateItemListaDto } from '../dto/update-item-lista.dto';

@Controller('listas')
@UseGuards(JwtAuthGuard)
export class ListaController {
  constructor(private readonly listaService: ListaService) {}

  // ==================== LISTAS ====================

  @Post()
  async criar(@Body() createDto: CreateListaDto, @Req() req: any) {
    return await this.listaService.criarLista(req.user.id, createDto);
  }

  @Get()
  async listar(@Req() req: any) {
    return await this.listaService.listarListasUsuario(req.user.id);
  }

  @Get(':id')
  async obter(@Param('id') id: string, @Req() req: any) {
    return await this.listaService.obterLista(id, req.user.id);
  }

  @Put(':id')
  async atualizar(
    @Param('id') id: string,
    @Body() updateDto: UpdateListaDto,
    @Req() req: any,
  ) {
    return await this.listaService.atualizarLista(id, req.user.id, updateDto);
  }

  @Delete(':id')
  async deletar(@Param('id') id: string, @Req() req: any) {
    await this.listaService.deletarLista(id, req.user.id);
    return { message: 'Lista deletada com sucesso' };
  }

  @Post(':id/arquivar')
  async arquivar(@Param('id') id: string, @Req() req: any) {
    return await this.listaService.arquivarLista(id, req.user.id);
  }

  @Post(':id/duplicar')
  async duplicar(@Param('id') id: string, @Req() req: any) {
    return await this.listaService.duplicarLista(id, req.user.id);
  }

  @Post(':id/limpar-comprados')
  async limparComprados(@Param('id') id: string, @Req() req: any) {
    await this.listaService.limparItensComprados(id, req.user.id);
    return { message: 'Itens comprados removidos' };
  }

  // Adiciona item a uma lista pelo título — cria lista se não existir
  @Post('adicionar-item-rapido')
  async adicionarItemRapido(
    @Body() body: { titulo_lista: string; ingrediente: string },
    @Req() req: any,
  ) {
    const listas = await this.listaService.listarListasUsuario(req.user.id);
    let lista = listas.find((l) => l.titulo === body.titulo_lista);
    if (!lista) {
      lista = await this.listaService.criarLista(req.user.id, { titulo: body.titulo_lista } as any);
    }
    return this.listaService.adicionarItem(lista.id, req.user.id, {
      nome: body.ingrediente,
      quantidade: 1,
      unidade: 'un',
    } as any);
  }

  // ==================== ITENS ====================

  @Post(':listaId/itens')
  async adicionarItem(
    @Param('listaId') listaId: string,
    @Body() createDto: CreateItemListaDto,
    @Req() req: any,
  ) {
    return await this.listaService.adicionarItem(listaId, req.user.id, createDto);
  }

  @Get(':listaId/itens')
  async listarItens(@Param('listaId') listaId: string, @Req() req: any) {
    return await this.listaService.listarItensLista(listaId, req.user.id);
  }

  @Put(':listaId/itens/:itemId')
  async atualizarItem(
    @Param('itemId') itemId: string,
    @Param('listaId') listaId: string,
    @Body() updateDto: UpdateItemListaDto,
    @Req() req: any,
  ) {
    return await this.listaService.atualizarItem(itemId, listaId, req.user.id, updateDto);
  }

  @Delete(':listaId/itens/:itemId')
  async deletarItem(
    @Param('itemId') itemId: string,
    @Param('listaId') listaId: string,
    @Req() req: any,
  ) {
    await this.listaService.deletarItem(itemId, listaId, req.user.id);
    return { message: 'Item deletado com sucesso' };
  }

  @Put(':listaId/itens/:itemId/marcar-comprado')
  async marcarComprado(
    @Param('itemId') itemId: string,
    @Param('listaId') listaId: string,
    @Body('comprado') comprado: boolean,
    @Req() req: any,
  ) {
    return await this.listaService.marcarItemComprado(
      itemId,
      listaId,
      req.user.id,
      comprado,
    );
  }
}
