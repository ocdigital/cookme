import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Compra } from './entities/compra.entity';
import { CompraItem } from './entities/compra-item.entity';
import { CreateCompraDto } from './dto/create-compra.dto';

@Injectable()
export class ComprasService {
  constructor(
    @InjectRepository(Compra)
    private readonly compraRepository: Repository<Compra>,
    @InjectRepository(CompraItem)
    private readonly compraItemRepository: Repository<CompraItem>,
  ) {}

  /**
   * Cria uma compra com seus itens (transação)
   */
  async create(usuarioId: string, createCompraDto: CreateCompraDto): Promise<Compra> {
    // Cria a compra
    const compra = this.compraRepository.create({
      usuario_id: usuarioId,
      data_compra: new Date(createCompraDto.data_compra),
      local_compra: createCompraDto.local_compra,
      valor_total: createCompraDto.valor_total,
      metodo_cadastro: createCompraDto.metodo_cadastro,
      tempo_cadastro_segundos: createCompraDto.tempo_cadastro_segundos,
    });

    const savedCompra = await this.compraRepository.save(compra);

    // Cria os itens da compra
    const itens = createCompraDto.itens.map((item) =>
      this.compraItemRepository.create({
        compra_id: savedCompra.id,
        produto_id: item.produto_id,
        quantidade: item.quantidade,
        unidade: item.unidade,
        preco_unitario: item.preco_unitario,
        validade_final: item.validade_final ? new Date(item.validade_final) : null,
        lote: item.lote,
      }),
    );

    await this.compraItemRepository.save(itens);

    // Retorna a compra com os itens
    return this.findOne(savedCompra.id, usuarioId);
  }

  /**
   * Lista compras do usuário
   */
  async findAll(usuarioId: string, limit = 20): Promise<Compra[]> {
    return this.compraRepository.find({
      where: { usuario_id: usuarioId },
      relations: ['itens', 'itens.produto'],
      order: { data_compra: 'DESC' },
      take: limit,
    });
  }

  /**
   * Busca uma compra específica
   */
  async findOne(id: string, usuarioId: string): Promise<Compra> {
    const compra = await this.compraRepository.findOne({
      where: { id, usuario_id: usuarioId },
      relations: ['itens', 'itens.produto', 'itens.produto.marca'],
    });

    if (!compra) {
      throw new NotFoundException('Compra não encontrada');
    }

    return compra;
  }

  /**
   * Remove uma compra (e seus itens em cascade)
   */
  async remove(id: string, usuarioId: string): Promise<void> {
    const compra = await this.findOne(id, usuarioId);
    await this.compraRepository.remove(compra);
  }

  /**
   * Estatísticas de compras do usuário
   */
  async getStats(usuarioId: string): Promise<{
    total_compras: number;
    valor_total: number;
    compra_media: number;
    ultima_compra: Date | null;
  }> {
    const compras = await this.compraRepository.find({
      where: { usuario_id: usuarioId },
      select: ['valor_total', 'data_compra'],
    });

    const total_compras = compras.length;
    const valor_total = compras.reduce((sum, c) => sum + Number(c.valor_total), 0);
    const compra_media = total_compras > 0 ? valor_total / total_compras : 0;
    const ultima_compra = total_compras > 0
      ? compras.sort((a, b) => b.data_compra.getTime() - a.data_compra.getTime())[0].data_compra
      : null;

    return {
      total_compras,
      valor_total: Math.round(valor_total * 100) / 100,
      compra_media: Math.round(compra_media * 100) / 100,
      ultima_compra,
    };
  }
}
