import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Lista, ListaStatus } from '../entities/lista.entity';
import { ItemLista } from '../entities/item-lista.entity';
import { CreateListaDto } from '../dto/create-lista.dto';
import { UpdateListaDto } from '../dto/update-lista.dto';
import { CreateItemListaDto } from '../dto/create-item-lista.dto';
import { UpdateItemListaDto } from '../dto/update-item-lista.dto';

@Injectable()
export class ListaService {
  constructor(
    @InjectRepository(Lista)
    private listaRepository: Repository<Lista>,
    @InjectRepository(ItemLista)
    private itemRepository: Repository<ItemLista>,
  ) {}

  // ==================== LISTAS ====================

  async criarLista(usuarioId: string, createDto: CreateListaDto): Promise<Lista> {
    const lista = this.listaRepository.create({
      ...createDto,
      usuarioId,
      status: ListaStatus.ATIVA,
    });

    return await this.listaRepository.save(lista);
  }

  async listarListasUsuario(usuarioId: string): Promise<Lista[]> {
    return await this.listaRepository.find({
      where: { usuarioId },
      relations: ['itens'],
      order: { titulo: 'ASC' },
    });
  }

  async obterLista(id: string, usuarioId: string): Promise<Lista> {
    const lista = await this.listaRepository.findOne({
      where: { id, usuarioId },
      relations: ['itens'],
      order: { itens: { nome: 'ASC' } },
    });

    if (!lista) {
      throw new NotFoundException('Lista não encontrada');
    }

    return lista;
  }

  async atualizarLista(
    id: string,
    usuarioId: string,
    updateDto: UpdateListaDto,
  ): Promise<Lista> {
    const lista = await this.obterLista(id, usuarioId);

    Object.assign(lista, updateDto);

    return await this.listaRepository.save(lista);
  }

  async deletarLista(id: string, usuarioId: string): Promise<void> {
    const lista = await this.obterLista(id, usuarioId);
    await this.listaRepository.remove(lista);
  }

  async arquivarLista(id: string, usuarioId: string): Promise<Lista> {
    const lista = await this.obterLista(id, usuarioId);
    lista.status = ListaStatus.ARQUIVADA;
    return await this.listaRepository.save(lista);
  }

  // ==================== ITENS ====================

  async adicionarItem(
    listaId: string,
    usuarioId: string,
    createDto: CreateItemListaDto,
  ): Promise<ItemLista> {
    const lista = await this.obterLista(listaId, usuarioId);

    const novoItem = this.itemRepository.create({
      ...createDto,
      listaId,
      preco_total: Number(createDto.preco_unitario || 0) * Number(createDto.quantidade || 1),
    });

    const item = await this.itemRepository.save(novoItem);

    // Atualizar total estimado da lista
    await this.atualizarTotaisLista(listaId);

    return item;
  }

  async listarItensLista(listaId: string, usuarioId: string): Promise<ItemLista[]> {
    await this.obterLista(listaId, usuarioId); // Validar acesso

    return await this.itemRepository.find({
      where: { listaId },
      order: { nome: 'ASC' },
    });
  }

  async atualizarItem(
    id: string,
    listaId: string,
    usuarioId: string,
    updateDto: UpdateItemListaDto,
  ): Promise<ItemLista> {
    await this.obterLista(listaId, usuarioId); // Validar acesso

    const item = await this.itemRepository.findOne({
      where: { id, listaId },
    });

    if (!item) {
      throw new NotFoundException('Item não encontrado');
    }

    // Se atualizou quantidade ou preço, recalcular total
    if (updateDto.quantidade || updateDto.preco_unitario) {
      const quantidade = Number(updateDto.quantidade || item.quantidade);
      const precoUnitario = Number(updateDto.preco_unitario || item.preco_unitario || 0);
      updateDto['preco_total'] = quantidade * precoUnitario;
    }

    Object.assign(item, updateDto);
    const itemAtualizado = await this.itemRepository.save(item);

    // Atualizar totais da lista
    await this.atualizarTotaisLista(listaId);

    return itemAtualizado;
  }

  async deletarItem(id: string, listaId: string, usuarioId: string): Promise<void> {
    await this.obterLista(listaId, usuarioId); // Validar acesso

    const item = await this.itemRepository.findOne({
      where: { id, listaId },
    });

    if (!item) {
      throw new NotFoundException('Item não encontrado');
    }

    await this.itemRepository.remove(item);

    // Atualizar totais da lista
    await this.atualizarTotaisLista(listaId);
  }

  async marcarItemComprado(
    id: string,
    listaId: string,
    usuarioId: string,
    comprado: boolean,
  ): Promise<ItemLista> {
    const item = await this.atualizarItem(id, listaId, usuarioId, { comprado });
    return item;
  }

  // ==================== UTILITÁRIOS ====================

  private async atualizarTotaisLista(listaId: string): Promise<void> {
    const itens = await this.itemRepository.find({
      where: { listaId },
    });

    const totalEstimado = itens.reduce((sum, item) => sum + (Number(item.preco_total) || 0), 0);
    const totalGasto = itens
      .filter((item) => item.comprado)
      .reduce((sum, item) => sum + (Number(item.preco_total) || 0), 0);

    await this.listaRepository.update(
      { id: listaId },
      {
        total_estimado: totalEstimado,
        total_gasto: totalGasto,
      },
    );
  }

  async duplicarLista(id: string, usuarioId: string): Promise<Lista> {
    const listaOriginal = await this.obterLista(id, usuarioId);

    const novaLista = this.listaRepository.create({
      titulo: `${listaOriginal.titulo} (Cópia)`,
      descricao: listaOriginal.descricao,
      orcamento: listaOriginal.orcamento,
      usuarioId,
      status: ListaStatus.ATIVA,
    });

    const listaEm = await this.listaRepository.save(novaLista);

    // Copiar itens
    for (const itemOriginal of listaOriginal.itens) {
      const novoItem = this.itemRepository.create({
        ...itemOriginal,
        id: undefined,
        listaId: listaEm.id,
        comprado: false, // Itens novos não marcados como comprados
      });

      await this.itemRepository.save(novoItem);
    }

    return await this.obterLista(listaEm.id, usuarioId);
  }

  async limparItensComprados(listaId: string, usuarioId: string): Promise<void> {
    await this.obterLista(listaId, usuarioId); // Validar acesso

    await this.itemRepository.delete({
      listaId,
      comprado: true,
    });

    await this.atualizarTotaisLista(listaId);
  }
}
